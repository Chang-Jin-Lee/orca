import type { CommandSpec } from './args'
import { specPaths } from './args'

// Why: rank the live registry so typo recovery cannot drift from accepted paths.

const SUGGESTION_THRESHOLD = 3
const MAX_SUGGESTIONS = 3

function finalToken(path: string[]): string {
  return path.at(-1) ?? ''
}

function confidentlyMatchesDestructiveVerb(inputToken: string, verb: string): boolean {
  if (inputToken === verb) {
    return true
  }
  // Why: substitutions can turn benign verbs into dangerous ones (`fill`→`kill`),
  // and tiny prefixes like `r` do not establish intent for terse verbs like `rm`.
  if (Math.min(inputToken.length, verb.length) < 3) {
    return false
  }
  // Why: destructive recovery only tolerates a clearly truncated/repeated suffix.
  return (
    (verb.startsWith(inputToken) && verb.length === inputToken.length + 1) ||
    (inputToken.startsWith(verb) && inputToken.length === verb.length + 1)
  )
}

// Why: intent for one destructive command must not unlock another command whose
// short path happens to rank nearby (for example, `kill` must not unlock `rm`).
function intendsDestructiveSpec(inputToken: string, spec: CommandSpec): boolean {
  return specPaths(spec).some((path) =>
    confidentlyMatchesDestructiveVerb(inputToken, finalToken(path))
  )
}

export type CommandErrorData = {
  suggestions: string[]
  nextSteps: string[]
}

export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) {
    return n
  }
  if (n === 0) {
    return m
  }
  let prev = Array.from({ length: n + 1 }, (_, index) => index)
  let curr = Array.from({ length: n + 1 }, () => 0)
  for (let i = 1; i <= m; i += 1) {
    curr[0] = i
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    const swap = prev
    prev = curr
    curr = swap
  }
  return prev[n]
}

// Why: one bounded near-match ranking keeps command and flag recovery consistent.
function rankByDistance(scored: { label: string; distance: number }[]): string[] {
  return scored
    .filter((entry) => entry.distance > 0 && entry.distance <= SUGGESTION_THRESHOLD)
    .sort((a, b) => a.distance - b.distance || a.label.localeCompare(b.label))
    .slice(0, MAX_SUGGESTIONS)
    .map((entry) => entry.label)
}

// Why: same-depth matching avoids suggesting parent groups or unrelated commands.
export function suggestCommands(specs: CommandSpec[], commandPath: string[]): string[] {
  const input = commandPath.join(' ')
  const inputToken = finalToken(commandPath)
  const seen = new Set<string>()
  const scored: { label: string; distance: number }[] = []
  for (const spec of specs) {
    // Why: only surface this destructive command when the user actually reached
    // for its verb; suggestions are also emitted to agents as next steps. #6303
    if (spec.destructive && !intendsDestructiveSpec(inputToken, spec)) {
      continue
    }
    const candidates = specPaths(spec).map((path) =>
      commandPath.length === 1 ? path.slice(0, 1) : path
    )
    for (const candidate of candidates) {
      if (candidate.length !== commandPath.length) {
        continue
      }
      const joined = candidate.join(' ')
      if (seen.has(joined)) {
        continue
      }
      seen.add(joined)
      scored.push({ label: joined, distance: levenshtein(input, joined) })
    }
  }
  return rankByDistance(scored)
}

export function unknownCommandData(specs: CommandSpec[], commandPath: string[]): CommandErrorData {
  const suggestions = suggestCommands(specs, commandPath)
  const nextSteps = suggestions.length
    ? [`Did you mean: ${suggestions.map((path) => `orca ${path}`).join(', ')}`]
    : []
  return { suggestions, nextSteps }
}

export type FlagErrorData = {
  validFlags: string[]
  suggestions: string[]
  nextSteps: string[]
}

function suggestFlags(flag: string, validFlags: string[]): string[] {
  return rankByDistance(
    validFlags.map((candidate) => ({ label: candidate, distance: levenshtein(flag, candidate) }))
  )
}

// Why: include the accepted set so agents can recover without another help call.
export function unknownFlagData(flag: string, validFlags: string[]): FlagErrorData {
  const sortedValid = [...validFlags].sort((a, b) => a.localeCompare(b))
  const suggestions = suggestFlags(flag, sortedValid)
  const nextSteps: string[] = []
  if (suggestions.length > 0) {
    nextSteps.push(`Did you mean: ${suggestions.map((name) => `--${name}`).join(', ')}`)
  }
  nextSteps.push(`Valid flags: ${sortedValid.map((name) => `--${name}`).join(', ')}`)
  return { validFlags: sortedValid, suggestions, nextSteps }
}
