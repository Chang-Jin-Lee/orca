import { execFileSync } from 'node:child_process'
import { delimiter, join } from 'node:path'
import { existsSync } from 'node:fs'

/**
 * Full path to icacls.exe. Electron's main process may have a stripped PATH
 * that excludes System32, causing bare `icacls` to throw ENOENT.
 */
export function getIcaclsExePath(): string {
  return `${process.env.SystemRoot ?? 'C:\\Windows'}\\System32\\icacls.exe`
}

/**
 * Full path to cmd.exe, respecting the ComSpec convention used elsewhere in
 * the codebase (hooks.ts, repo.ts, ssh-connection-utils.ts).
 * Falls back to SystemRoot-based path if ComSpec is unset.
 */
export function getCmdExePath(): string {
  return process.env.ComSpec || `${process.env.SystemRoot ?? 'C:\\Windows'}\\System32\\cmd.exe`
}

/** Whether a resolved command path points to a Windows batch script (.cmd/.bat). */
export function isWindowsBatchScript(commandPath: string): boolean {
  return process.platform === 'win32' && /\.(cmd|bat)$/i.test(commandPath)
}

// Why cache: a PATH scan is ~80-160 existsSync probes (dirs × 4 name variants)
// and runs per gh/glab invocation; NTFS + Defender make each probe costly.
// Keyed by (command, PATH string) so a PATH change invalidates via the key.
// Hits are kept for the process lifetime; misses expire after a short TTL so
// a CLI installed mid-session is picked up without re-scanning on every call.
const COMMAND_RESOLUTION_CACHE_MAX_ENTRIES = 64
const MISSING_COMMAND_RETRY_MS = 30_000

type CommandResolutionEntry = { resolved: string; found: boolean; at: number }
const commandResolutionCache = new Map<string, CommandResolutionEntry>()

export function resolveWindowsCommand(
  command: string,
  env: NodeJS.ProcessEnv = process.env
): string {
  if (process.platform !== 'win32') {
    return command
  }
  if (/[\\/]/.test(command) || /\.[a-z0-9]+$/i.test(command)) {
    return command
  }

  const pathEnv = env.PATH ?? env.Path
  if (!pathEnv) {
    return command
  }

  // \0 cannot appear in a command or env value, so the key is unambiguous.
  const cacheKey = `${command}\0${pathEnv}`
  const cached = commandResolutionCache.get(cacheKey)
  if (cached && (cached.found || Date.now() - cached.at < MISSING_COMMAND_RETRY_MS)) {
    return cached.resolved
  }

  const resolved = scanPathForCommand(command, pathEnv)
  commandResolutionCache.set(cacheKey, {
    resolved: resolved ?? command,
    found: resolved !== null,
    at: Date.now()
  })
  // Why bound: callers pass arbitrary env objects, so distinct PATH strings
  // could otherwise accumulate keys for the process lifetime.
  while (commandResolutionCache.size > COMMAND_RESOLUTION_CACHE_MAX_ENTRIES) {
    const oldest = commandResolutionCache.keys().next().value
    if (oldest === undefined) {
      break
    }
    commandResolutionCache.delete(oldest)
  }
  return resolved ?? command
}

function scanPathForCommand(command: string, pathEnv: string): string | null {
  for (const directory of pathEnv.split(delimiter).filter(Boolean)) {
    for (const name of [`${command}.cmd`, `${command}.exe`, `${command}.bat`, command]) {
      const candidate = join(directory, name)
      if (existsSync(candidate)) {
        return candidate
      }
    }
  }
  return null
}

export const WINDOWS_BATCH_UNSAFE_ARGUMENTS_ERROR = 'UNSAFE_WINDOWS_BATCH_ARGUMENTS'

export class UnsafeWindowsBatchArgumentsError extends Error {
  constructor() {
    super(WINDOWS_BATCH_UNSAFE_ARGUMENTS_ERROR)
    this.name = 'UnsafeWindowsBatchArgumentsError'
  }
}

function hasUnsafeWindowsBatchSyntax(value: string): boolean {
  return /[&|<>^"%!\r\n]/.test(value)
}

/** Check whether an error is a Windows permission error (EACCES or EPERM). */
export function isPermissionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    ((error as NodeJS.ErrnoException).code === 'EACCES' ||
      (error as NodeJS.ErrnoException).code === 'EPERM')
  )
}

// Why: USERNAME-only identity resolution silently no-ops under services, CI,
// and hardened envs where USERNAME is unset. Fall back to the SID via
// `whoami /user` (same strategy as runtime-metadata.ts), which is authoritative
// and always available on Windows. Cached because it never changes in-process.
let cachedIdentity: string | null | undefined

export function resolveCurrentWindowsIdentity(): string | null {
  return resolveCurrentIdentity()
}

function resolveCurrentIdentity(): string | null {
  if (cachedIdentity !== undefined) {
    return cachedIdentity
  }
  if (process.env.USERNAME) {
    cachedIdentity = process.env.USERNAME
    return cachedIdentity
  }
  try {
    const output = execFileSync('whoami', ['/user', '/fo', 'csv', '/nh'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
      timeout: 5000
    }).trim()
    // CSV columns: "DOMAIN\\user","S-1-5-21-..."
    const sidMatch = /"(S-[\d-]+)"\s*$/.exec(output)
    cachedIdentity = sidMatch ? `*${sidMatch[1]}` : null
  } catch {
    cachedIdentity = null
  }
  return cachedIdentity
}

/**
 * Grant Full Control (OI)(CI)(F) on a directory for the current user.
 * Used to fix Chromium's Protected DACL propagation which leaves child
 * directories with Inherit-Only ACEs that deny direct file creation.
 *
 * Why /grant:r not /inheritance:e: Chromium's ACEs carry the Inherit-Only
 * flag when propagated to children, so restoring inheritance does not grant
 * the directory itself any effective permissions. An explicit ACE survives
 * future DACL propagation and grants create-file rights.
 */
export function grantDirAcl(dirPath: string, options?: { recursive?: boolean }): void {
  const identity = resolveCurrentIdentity()
  if (!identity) {
    return
  }
  const args = [dirPath, '/grant:r', `${identity}:(OI)(CI)(F)`]
  if (options?.recursive) {
    args.push('/T', '/C')
  }
  // Why: /T walks the entire subtree; a 10s cap can starve on large userData
  // dirs (tens of thousands of cached chromium files), making the startup
  // grant silently fail. Give recursive calls a generous budget.
  const timeout = options?.recursive ? 60_000 : 10_000
  execFileSync(getIcaclsExePath(), args, {
    stdio: 'ignore',
    windowsHide: true,
    timeout
  })
}

/**
 * Resolve spawn parameters for a command that may be a Windows batch script.
 *
 * Why: Node's spawn() cannot execute .cmd/.bat files directly without
 * shell:true, but shell:true with an args array triggers DEP0190 because
 * args are concatenated, not escaped. Routing through cmd.exe /c explicitly
 * avoids the deprecation warning while passing args correctly.
 *
 * Why /d: disables per-machine/user AutoRun registry commands so a background
 * spawn cannot inherit surprising side effects from the user's shell config.
 *
 * SAFETY: when the .cmd/.bat branch is taken, cmd.exe re-parses the command
 * line. Args with cmd metacharacters are rejected instead of escaped because
 * the agent prompt may contain arbitrary staged diff text.
 */
export function getSpawnArgsForWindows(
  command: string,
  args: string[]
): { spawnCmd: string; spawnArgs: string[] } {
  if (isWindowsBatchScript(command)) {
    for (const value of [command, ...args]) {
      if (hasUnsafeWindowsBatchSyntax(value)) {
        throw new UnsafeWindowsBatchArgumentsError()
      }
    }

    // Why: when Node passes a pre-quoted command line as one argv entry,
    // cmd.exe sees literal escaped quotes on Windows and refuses to run .cmd
    // shims. Separate argv entries let Node quote spaces without breaking cmd.
    return { spawnCmd: getCmdExePath(), spawnArgs: ['/d', '/c', command, ...args] }
  }
  return { spawnCmd: command, spawnArgs: args }
}
