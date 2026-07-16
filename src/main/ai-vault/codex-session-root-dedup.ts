import type { AiVaultSession } from '../../shared/ai-vault-types'
import { sessionSortTime } from './session-scanner-accumulator'

// Why: the session bridge and the real-home backfill hardlink one physical
// Codex rollout into multiple scanned roots (managed runtime home and the
// user's own ~/.codex), so every bridged/backfilled session used to list once
// per root (#7521). These helpers collapse those aliases to one canonical row.

// Matches Codex rollout logs: rollout-<timestamp>-<session uuid>.jsonl. The
// bridge and backfill both preserve the sessions/YYYY/MM/DD layout, so an
// identical rollout file name across Codex roots is the same session.
const CODEX_ROLLOUT_FILE_NAME_PATTERN = /^rollout-.+\.jsonl$/

// Why: not node:path.basename — a posix host scans remote/WSL win32 paths, so
// separators must be handled independently of the local platform.
function lastPathSegment(filePath: string): string {
  return filePath.split(/[\\/]/).at(-1) ?? ''
}

/**
 * Ranks a Codex session root for canonical-alias selection, lowest wins.
 *
 * Host real home (null) is canonical: after the real-home flip the managed
 * home's auth.json is no longer refreshed, so resume must not stamp it. The
 * Orca managed runtime home still beats other homes (WSL/remote real homes,
 * custom CODEX_HOMEs) because those lanes have not flipped — their launches
 * keep managed auth, so resume keeps the managed stamp as today.
 */
function codexSessionRootRank(codexHome: string | null): number {
  if (codexHome === null) {
    return 0
  }
  const segments = codexHome.split(/[\\/]/).filter(Boolean)
  return segments.at(-2) === 'codex-runtime-home' && segments.at(-1) === 'home' ? 1 : 2
}

/**
 * Drops pre-parse Codex rollout candidates that alias an already-kept rollout
 * file name in a preferred root, so duplicate aliases never consume the parse
 * budget or crowd the capped listing.
 */
export function dedupeCodexRolloutFileAliases<T>(
  candidates: readonly T[],
  accessors: {
    isCodex: (candidate: T) => boolean
    getFilePath: (candidate: T) => string
    getCodexHome: (candidate: T) => string | null
  }
): T[] {
  const bestByFileName = new Map<string, { candidate: T; rank: number; filePath: string }>()
  for (const candidate of candidates) {
    if (!accessors.isCodex(candidate)) {
      continue
    }
    const filePath = accessors.getFilePath(candidate)
    const fileName = lastPathSegment(filePath)
    if (!CODEX_ROLLOUT_FILE_NAME_PATTERN.test(fileName)) {
      continue
    }
    const rank = codexSessionRootRank(accessors.getCodexHome(candidate))
    const best = bestByFileName.get(fileName)
    if (!best || rank < best.rank || (rank === best.rank && filePath < best.filePath)) {
      bestByFileName.set(fileName, { candidate, rank, filePath })
    }
  }
  return candidates.filter((candidate) => {
    if (!accessors.isCodex(candidate)) {
      return true
    }
    const fileName = lastPathSegment(accessors.getFilePath(candidate))
    const best = bestByFileName.get(fileName)
    return !best || best.candidate === candidate
  })
}

/**
 * Collapses parsed Codex sessions that share a session id on one execution
 * host, keeping the canonical root's row (see codexSessionRootRank). Catches
 * aliases the file-name pass cannot see: cross-volume backfill copies and
 * session_meta ids that differ from the rollout file name.
 */
export function dedupeCodexSessionsBySessionId(
  sessions: readonly AiVaultSession[]
): AiVaultSession[] {
  const bestByKey = new Map<string, AiVaultSession>()
  for (const session of sessions) {
    if (session.agent !== 'codex') {
      continue
    }
    const key = `${session.executionHostId}:${session.sessionId}`
    const best = bestByKey.get(key)
    if (!best || codexSessionAliasBeats(session, best)) {
      bestByKey.set(key, session)
    }
  }
  return sessions.filter((session) => {
    if (session.agent !== 'codex') {
      return true
    }
    return bestByKey.get(`${session.executionHostId}:${session.sessionId}`) === session
  })
}

function codexSessionAliasBeats(candidate: AiVaultSession, best: AiVaultSession): boolean {
  const candidateRank = codexSessionRootRank(candidate.codexHome)
  const bestRank = codexSessionRootRank(best.codexHome)
  if (candidateRank !== bestRank) {
    return candidateRank < bestRank
  }
  const candidateTime = sessionSortTime(candidate)
  const bestTime = sessionSortTime(best)
  if (candidateTime !== bestTime) {
    return candidateTime > bestTime
  }
  return candidate.filePath < best.filePath
}
