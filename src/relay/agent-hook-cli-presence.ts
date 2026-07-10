import { spawn } from 'node:child_process'
import { access, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import type { AgentHookTarget } from '../shared/agent-hook-types'
import {
  getManagedAgentHookTarget,
  isManagedAgentHookTarget,
  type AgentCliPresenceState,
  type AgentHookCliPresenceRequest,
  type AgentHookCliPresenceResponse,
  type ManagedAgentHookTarget
} from '../shared/managed-agent-hook-targets'
import {
  hasPathSeparatorToken,
  isSafeExecutableBasename,
  isSafeOverrideExecutableToken
} from '../shared/managed-agent-command-token'
import { resolveDefaultShell } from './pty-shell-utils'

const WINDOWS_EXTENSIONS = ['.COM', '.EXE', '.BAT', '.CMD']
const SHELL_PATH_DELIMITER = '__ORCA_AGENT_HOOK_SHELL_PATH__'
const SHELL_PATH_TIMEOUT_MS = 5000
const ANSI_RE = /\x1b\[[0-9;?]*[A-Za-z]/g // eslint-disable-line no-control-regex

type DetectOptions = {
  readShellPathEntries?: () => Promise<string[]>
}

async function isExecutableFile(filePath: string): Promise<boolean> {
  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) {
      return false
    }
    if (process.platform === 'win32') {
      return true
    }
    await access(filePath, constants.X_OK)
    return true
  } catch {
    return false
  }
}

function pathEntries(pathValue: string | undefined = process.env.PATH): string[] {
  return [
    ...new Set(
      (pathValue ?? '')
        .split(path.delimiter)
        .map((part) => part.trim())
        .filter(Boolean)
    )
  ]
}

function parseShellPathOutput(stdout: string): string[] {
  const cleaned = stdout.replace(ANSI_RE, '')
  const first = cleaned.indexOf(SHELL_PATH_DELIMITER)
  if (first < 0) {
    return []
  }
  const second = cleaned.indexOf(SHELL_PATH_DELIMITER, first + SHELL_PATH_DELIMITER.length)
  if (second < 0) {
    return []
  }
  return pathEntries(cleaned.slice(first + SHELL_PATH_DELIMITER.length, second))
}

async function readLoginShellPathEntries(): Promise<string[]> {
  const fallback = pathEntries()
  const shell = resolveDefaultShell()
  const command = `printf '%s' '${SHELL_PATH_DELIMITER}'; printf '%s' "$PATH"; printf '%s' '${SHELL_PATH_DELIMITER}'`
  return await new Promise((resolve) => {
    let stdout = ''
    let settled = false
    const child = spawn(shell, ['-ilc', command], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'ignore'],
      detached: false
    })
    const finish = (entries: string[]): void => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timer)
      child.stdout.off('data', onStdout)
      child.off('error', onError)
      child.off('close', onClose)
      resolve(entries.length > 0 ? entries : fallback)
    }
    const onStdout = (chunk: Buffer): void => {
      stdout += chunk.toString('utf8')
    }
    const onError = (): void => finish(fallback)
    const onClose = (): void => finish(parseShellPathOutput(stdout))
    const timer = setTimeout(() => {
      try {
        // Why: login shell rc files can trap SIGTERM; the relay must not leave
        // SSH-side PATH probes behind when the startup budget expires.
        child.kill('SIGKILL')
      } catch {
        // Best effort: PATH probing must not block SSH startup.
      }
      finish(fallback)
    }, SHELL_PATH_TIMEOUT_MS)
    child.stdout.on('data', onStdout)
    child.on('error', onError)
    child.on('close', onClose)
  })
}

function windowsPathExts(): string[] {
  const source =
    process.env.PATHEXT && process.env.PATHEXT.length > 0
      ? process.env.PATHEXT
      : WINDOWS_EXTENSIONS.join(';')
  return [
    ...new Set(
      source
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => (part.startsWith('.') ? part : `.${part}`))
        .map((part) => part.toUpperCase())
    )
  ]
}

function candidateFileNames(candidate: string): string[] {
  if (process.platform !== 'win32' || path.extname(candidate)) {
    return [candidate]
  }
  return windowsPathExts().map((suffix) => `${candidate}${suffix}`)
}

function parseRequest(params: Record<string, unknown>): AgentHookCliPresenceRequest {
  const rawAgents = Array.isArray(params.agents) ? params.agents : []
  const agents = rawAgents.filter(isManagedAgentHookTarget)
  if (agents.length !== rawAgents.length) {
    throw new Error('unknown_agent')
  }
  const overrideExecutableTokens: Partial<Record<AgentHookTarget, string>> = {}
  const rawOverrides =
    typeof params.overrideExecutableTokens === 'object' && params.overrideExecutableTokens !== null
      ? (params.overrideExecutableTokens as Record<string, unknown>)
      : {}
  for (const [agent, token] of Object.entries(rawOverrides)) {
    if (!isManagedAgentHookTarget(agent) || typeof token !== 'string') {
      throw new Error('invalid_override_token')
    }
    if (!isSafeOverrideExecutableToken(token)) {
      throw new Error('invalid_override_token')
    }
    overrideExecutableTokens[agent] = token
  }
  return { agents, overrideExecutableTokens }
}

async function probePathCandidate(candidate: string, dirs: readonly string[]): Promise<boolean> {
  if (!isSafeExecutableBasename(candidate)) {
    return false
  }
  for (const dir of dirs) {
    for (const fileName of candidateFileNames(candidate)) {
      if (await isExecutableFile(path.join(dir, fileName))) {
        return true
      }
    }
  }
  return false
}

function expandHomePathToken(token: string): string {
  if (token === '~') {
    return homedir()
  }
  if (token.startsWith('~/')) {
    return path.join(homedir(), token.slice(2))
  }
  return token
}

async function detectTarget(
  target: ManagedAgentHookTarget,
  dirs: readonly string[],
  overrideToken: string | undefined
): Promise<AgentCliPresenceState> {
  if (overrideToken && hasPathSeparatorToken(overrideToken)) {
    const expanded = expandHomePathToken(overrideToken)
    // Why: a relative override resolves against the agent's launch CWD, not the
    // relay process CWD — probing it here would report presence for an unrelated
    // directory, so mirror the local detector and report unknown instead.
    if (!path.isAbsolute(expanded)) {
      return 'unknown'
    }
    return (await isExecutableFile(expanded)) ? 'found' : 'missing'
  }
  const candidates = [...target.executableCandidates, ...(overrideToken ? [overrideToken] : [])]
  for (const candidate of candidates) {
    if (hasPathSeparatorToken(candidate)) {
      continue
    }
    if (await probePathCandidate(candidate, dirs)) {
      return 'found'
    }
  }
  return 'missing'
}

export async function detectAgentHookCliPresence(
  params: Record<string, unknown>,
  options: DetectOptions = {}
): Promise<AgentHookCliPresenceResponse> {
  const request = parseRequest(params)
  const presence: AgentHookCliPresenceResponse['presence'] = {}
  if (process.platform === 'win32') {
    // Why: the probe below is POSIX-only (login-shell PATH + X_OK), so on a
    // Windows relay we can't determine presence — report 'unknown' rather than a
    // false 'missing', which would wrongly claim the CLI is absent. Callers still
    // skip install (only positive 'found' installs). Reachable only defensively:
    // SSH sessions short-circuit Windows remotes before requesting presence.
    for (const agent of request.agents) {
      presence[agent] = { state: 'unknown' }
    }
    return { presence }
  }
  const dirs = await (options.readShellPathEntries ?? readLoginShellPathEntries)()
  for (const agent of request.agents) {
    const target = getManagedAgentHookTarget(agent)
    if (!target || !target.supportsRemoteManagedHooks) {
      presence[agent] = { state: 'missing' }
      continue
    }
    presence[agent] = {
      state: await detectTarget(target, dirs, request.overrideExecutableTokens?.[agent])
    }
  }
  return { presence }
}
