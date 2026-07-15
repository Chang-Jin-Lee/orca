import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  CodexAppServerTimeoutError,
  CodexAppServerUnsupportedError,
  isCodexAppServerUnsupportedError,
  type CodexHookTrustGrantRequest,
  type CodexHookTrustGrantSessionResult
} from './codex-app-server-client'

// Why: hook install/refresh is synchronous launch prep — a Codex pane must
// not start before its trust is settled — but a stdio JSON-RPC session needs
// a live event loop. This bridge blocks the caller on spawnSync of a bundled
// ELECTRON_RUN_AS_NODE entry (same pattern as the daemon and parcel-watcher
// entries) that runs the session and reports one JSON envelope on stdout.

export type GrantEntryEnvelope =
  | { ok: true; result: CodexHookTrustGrantSessionResult }
  | { ok: false; errorName: string; message: string; unsupported?: boolean }

export function buildGrantEntryEnvelope(
  run: Promise<CodexHookTrustGrantSessionResult>
): Promise<GrantEntryEnvelope> {
  return run.then(
    (result) => ({ ok: true as const, result }),
    (error: unknown) => ({
      ok: false as const,
      errorName: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error),
      ...(isCodexAppServerUnsupportedError(error) ? { unsupported: true as const } : {})
    })
  )
}

const GRANT_ENTRY_FILE_NAME = 'codex-app-server-grant-entry.js'
// Why: spawnSync must outlive the session deadline so the entry's own timeout
// (and its result envelope) win the race; the margin only reaps a hung entry.
const GRANT_ENTRY_TIMEOUT_MARGIN_MS = 5_000
const GRANT_ENTRY_MAX_BUFFER_BYTES = 16 * 1024 * 1024

export function resolveCodexGrantEntryPath(
  pathExists: (candidate: string) => boolean = existsSync
): string | null {
  // Why: this module is reachable from plain-Node CLI entries, so it must not
  // require electron (plain-node-entry-guard). __dirname of the built chunk is
  // out/main (root chunk) or out/main/chunks; the entry sits at
  // out/main/codex/. ELECTRON_RUN_AS_NODE bypasses asar integration, so the
  // packaged entry must run from app.asar.unpacked (out/main/codex/** is in
  // the asarUnpack list) — cover that with a path rewrite instead of app APIs.
  const chunkDirs = [__dirname, join(__dirname, '..')]
  const candidates = chunkDirs.flatMap((dir) => {
    const unpackedDir = dir.includes('app.asar')
      ? dir.replace('app.asar', 'app.asar.unpacked')
      : null
    return [
      ...(unpackedDir ? [join(unpackedDir, 'codex', GRANT_ENTRY_FILE_NAME)] : []),
      join(dir, 'codex', GRANT_ENTRY_FILE_NAME)
    ]
  })
  for (const candidate of candidates) {
    if (pathExists(candidate)) {
      return candidate
    }
  }
  return null
}

export type RunGrantSessionSyncOptions = {
  entryPath?: string
  nodeCommand?: string
}

/**
 * Blocking wrapper for the grant session. Hook install/refresh is synchronous
 * launch prep (pane launch must not proceed until trust is settled), and a
 * stdio JSON-RPC session needs a live event loop — so the session runs in a
 * short-lived ELECTRON_RUN_AS_NODE child (same pattern as the daemon and
 * parcel-watcher entries) while the caller blocks on spawnSync. spawnSync
 * always reaps the entry; a killed entry closes the codex child's stdin,
 * which makes codex app-server exit on EOF.
 */
export function runCodexHookTrustGrantSessionSync(
  request: CodexHookTrustGrantRequest,
  options: RunGrantSessionSyncOptions = {}
): CodexHookTrustGrantSessionResult {
  const entryPath = options.entryPath ?? resolveCodexGrantEntryPath()
  if (!entryPath) {
    throw new Error('codex trust-grant entry bundle not found')
  }
  const spawned = spawnSync(options.nodeCommand ?? process.execPath, [entryPath], {
    input: JSON.stringify(request),
    encoding: 'utf8',
    timeout: request.invocation.timeoutMs + GRANT_ENTRY_TIMEOUT_MARGIN_MS,
    killSignal: 'SIGKILL',
    maxBuffer: GRANT_ENTRY_MAX_BUFFER_BYTES,
    windowsHide: true,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
  })
  if (spawned.error) {
    throw spawned.error
  }
  if (spawned.signal) {
    throw new CodexAppServerTimeoutError(
      `codex trust-grant entry killed by ${spawned.signal} after ${request.invocation.timeoutMs}ms deadline`
    )
  }
  const lines = (spawned.stdout ?? '').split('\n').filter((line) => line.trim().length > 0)
  const lastLine = lines.at(-1)
  let envelope: GrantEntryEnvelope | null = null
  if (lastLine) {
    try {
      envelope = JSON.parse(lastLine) as GrantEntryEnvelope
    } catch {
      envelope = null
    }
  }
  if (!envelope) {
    throw new Error(
      `codex trust-grant entry produced no result (exit ${spawned.status ?? 'unknown'})${
        spawned.stderr ? `: ${spawned.stderr.trim().slice(0, 400)}` : ''
      }`
    )
  }
  if (!envelope.ok) {
    if (envelope.unsupported) {
      throw new CodexAppServerUnsupportedError(envelope.message)
    }
    if (envelope.errorName === 'CodexAppServerTimeoutError') {
      throw new CodexAppServerTimeoutError(envelope.message)
    }
    throw new Error(envelope.message)
  }
  return envelope.result
}
