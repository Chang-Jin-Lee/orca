import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { normalizeHookTrustKeyForLookup } from './config-toml-trust'

// Why: Codex gates hooks on a `trusted_hash` it computes from a private
// canonical-JSON identity. Orca used to replicate that algorithm
// (computeTrustedHash), which drifted from the real one across Codex releases
// (#7896, #7110, #8699). `codex app-server` exposes the same sanctioned RPCs
// the Codex TUI "Trust all" button uses — hooks/list (returns Codex's own
// currentHash per hook) and config/batchWrite (upserts hooks.state through
// Codex's comment-preserving writer) — so this client grants trust with
// Codex as the only hash authority. See upstream codex-rs/tui/src/hooks_rpc.rs
// and codex-rs/tui/src/startup_hooks_review.rs.

export type CodexAppServerInvocation = {
  command: string
  args: string[]
  /** Overlay applied on top of the inherited environment (e.g. CODEX_HOME). */
  env?: Record<string, string>
  /** Whole-session deadline. The codex child is SIGKILLed when it lapses. */
  timeoutMs: number
}

export type CodexHookTrustGrantRequest = {
  invocation: CodexAppServerInvocation
  /** cwd passed to hooks/list. Discovery of the managed CODEX_HOME's
   *  hooks.json is cwd-independent (user scope); this only scopes which
   *  project hooks appear, which the key filter below ignores anyway. */
  hooksListCwd: string
  /** Lookup-normalized trust keys (normalizeHookTrustKeyForLookup shape) for
   *  the managed entries Orca just wrote. Grants are restricted to hooks whose
   *  reported key normalizes into this set — user hooks are never touched. */
  expectedTrustKeys: string[]
  /** Exact command string written to the managed hooks.json entries. */
  managedCommand: string
}

export type CodexGrantedHookTrust = {
  /** Trust key exactly as Codex reported it. */
  key: string
  normalizedKey: string
  /** Codex-computed hash now stored as trusted_hash for this key. */
  trustedHash: string
}

export type CodexHookTrustGrantSessionResult =
  | {
      outcome: 'granted'
      entries: CodexGrantedHookTrust[]
      /** False when every expected entry was already trusted (no write). */
      wroteTrust: boolean
    }
  | { outcome: 'verify-failed'; reason: string }

/** Codex-side absence of the trust-grant RPC surface (old CLI without the
 *  app-server subcommand, or a server without hooks/list / config/batchWrite).
 *  This is the ONLY error class the capability cache marks unsupported. */
export class CodexAppServerUnsupportedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CodexAppServerUnsupportedError'
  }
}

export class CodexAppServerTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CodexAppServerTimeoutError'
  }
}

export function isCodexAppServerUnsupportedError(error: unknown): boolean {
  return error instanceof Error && error.name === 'CodexAppServerUnsupportedError'
}

type JsonRpcResponse = {
  id?: number
  result?: unknown
  error?: { code?: number; message?: string }
}

type CodexHookListing = {
  key: string
  command: string | null
  currentHash: string
  trustStatus: string
}

const JSON_RPC_METHOD_NOT_FOUND = -32601
const STDERR_TAIL_MAX_BYTES = 8192
const STDOUT_LINE_MAX_BYTES = 1024 * 1024

function isMethodNotFoundError(error: { code?: number; message?: string }): boolean {
  return error.code === JSON_RPC_METHOD_NOT_FOUND || /method not found/i.test(error.message ?? '')
}

// Why: a CLI predating the app-server subcommand fails argv parsing before
// speaking any JSON-RPC; that shape is a capability signal, not a transient.
function stderrIndicatesMissingAppServer(stderrTail: string): boolean {
  return /unrecognized subcommand|unexpected argument|invalid subcommand/i.test(stderrTail)
}

function collectHookListings(result: unknown): CodexHookListing[] {
  const data =
    result && typeof result === 'object' && Array.isArray((result as { data?: unknown }).data)
      ? ((result as { data: unknown[] }).data as { hooks?: unknown }[])
      : []
  const listings: CodexHookListing[] = []
  const seenKeys = new Set<string>()
  for (const entry of data) {
    const hooks = Array.isArray(entry?.hooks) ? entry.hooks : []
    for (const hook of hooks as Record<string, unknown>[]) {
      if (
        typeof hook?.key !== 'string' ||
        typeof hook.currentHash !== 'string' ||
        typeof hook.trustStatus !== 'string'
      ) {
        continue
      }
      // Why: hooks/list repeats user-scope hooks per requested cwd; grants
      // must consider each key once.
      if (seenKeys.has(hook.key)) {
        continue
      }
      seenKeys.add(hook.key)
      listings.push({
        key: hook.key,
        command: typeof hook.command === 'string' ? hook.command : null,
        currentHash: hook.currentHash,
        trustStatus: hook.trustStatus
      })
    }
  }
  return listings
}

/**
 * Runs one short-lived `codex app-server` session over stdio JSON-RPC (JSONL)
 * and grants trust for exactly the expected managed entries:
 * initialize → initialized → hooks/list → config/batchWrite → hooks/list.
 * The child is reaped on every path; the session deadline SIGKILLs it.
 */
export async function runCodexHookTrustGrantSession(
  request: CodexHookTrustGrantRequest,
  spawnImpl: typeof spawn = spawn
): Promise<CodexHookTrustGrantSessionResult> {
  const { invocation } = request
  const child = spawnImpl(invocation.command, invocation.args, {
    env: { ...process.env, ...invocation.env },
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  }) as ChildProcessWithoutNullStreams

  let stderrTail = ''
  let exited = false
  let nextRequestId = 1
  let timedOut = false
  const pending = new Map<
    number,
    { resolve: (r: JsonRpcResponse) => void; reject: (e: Error) => void }
  >()

  const exitPromise = new Promise<void>((resolve) => {
    child.on('exit', () => {
      exited = true
      resolve()
    })
  })
  // Why: 'error' fires instead of 'exit' when the spawn itself fails
  // (ENOENT); surface it to every in-flight request or they wait forever.
  let spawnError: Error | null = null
  child.on('error', (error) => {
    spawnError = error
    exited = true
    failPending(error)
  })
  // Why: 'close' (not 'exit') guarantees the stderr tail is complete, so an
  // early death classifies correctly as missing-subcommand vs transient.
  child.on('close', () => {
    failPending(buildEarlyExitError())
  })
  // Why: JSONL can contain non-ASCII hook paths. Stream decoding must retain a
  // multibyte character split across pipe chunks or the response becomes invalid JSON.
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
    stderrTail = (stderrTail + chunk).slice(-STDERR_TAIL_MAX_BYTES)
  })
  // Why: a child can exit between the liveness check and stdin.write(); an
  // EPIPE must reject the RPC instead of becoming an unhandled stream error.
  child.stdin.on('error', (error) => {
    failPending(error)
  })

  let stdoutBuffer = ''
  child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
    stdoutBuffer += chunk
    if (Buffer.byteLength(stdoutBuffer) > STDOUT_LINE_MAX_BYTES) {
      child.kill('SIGKILL')
      failPending(new Error('codex app-server emitted an oversized JSONL response'))
      return
    }
    let newlineIndex
    while ((newlineIndex = stdoutBuffer.indexOf('\n')) !== -1) {
      const line = stdoutBuffer.slice(0, newlineIndex).trim()
      stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1)
      if (!line) {
        continue
      }
      let message: JsonRpcResponse
      try {
        message = JSON.parse(line) as JsonRpcResponse
      } catch {
        continue
      }
      if (typeof message.id === 'number' && pending.has(message.id)) {
        const waiter = pending.get(message.id)!
        pending.delete(message.id)
        waiter.resolve(message)
      }
    }
  })

  function failPending(error: Error): void {
    for (const waiter of pending.values()) {
      waiter.reject(error)
    }
    pending.clear()
  }

  const deadline = setTimeout(() => {
    timedOut = true
    child.kill('SIGKILL')
    failPending(
      new CodexAppServerTimeoutError(
        `codex app-server session exceeded ${invocation.timeoutMs}ms (${invocation.command})`
      )
    )
  }, invocation.timeoutMs)

  function sendLine(payload: Record<string, unknown>): void {
    child.stdin.write(`${JSON.stringify(payload)}\n`)
  }

  async function requestRpc(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (spawnError) {
      throw spawnError
    }
    if (timedOut) {
      throw new CodexAppServerTimeoutError('codex app-server session already timed out')
    }
    if (exited) {
      throw buildEarlyExitError()
    }
    const id = nextRequestId++
    const response = await new Promise<JsonRpcResponse>((resolve, reject) => {
      pending.set(id, { resolve, reject })
      const payload: Record<string, unknown> = { method, id }
      if (params !== undefined) {
        payload.params = params
      }
      try {
        sendLine(payload)
      } catch (error) {
        pending.delete(id)
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
    if (response.error) {
      if (isMethodNotFoundError(response.error)) {
        throw new CodexAppServerUnsupportedError(
          `codex app-server does not support ${method}: ${response.error.message ?? 'method not found'}`
        )
      }
      throw new Error(
        `codex app-server ${method} failed: ${response.error.message ?? 'unknown error'}`
      )
    }
    return response.result
  }

  function buildEarlyExitError(): Error {
    if (stderrIndicatesMissingAppServer(stderrTail)) {
      return new CodexAppServerUnsupportedError(
        `codex CLI does not support the app-server subcommand: ${stderrTail.trim().slice(0, 400)}`
      )
    }
    return new Error(
      `codex app-server exited before completing the session${stderrTail ? `: ${stderrTail.trim().slice(0, 400)}` : ''}`
    )
  }

  try {
    await requestRpc('initialize', {
      clientInfo: { name: 'orca_desktop', title: 'Orca', version: '0.0.0' }
    })
    sendLine({ method: 'initialized' })

    const expectedKeys = new Set(request.expectedTrustKeys)
    const matchManaged = (listing: CodexHookListing): boolean =>
      listing.command === request.managedCommand &&
      expectedKeys.has(normalizeHookTrustKeyForLookup(listing.key))

    const listResult = await requestRpc('hooks/list', { cwds: [request.hooksListCwd] })
    const managedListings = collectHookListings(listResult).filter(matchManaged)
    if (managedListings.length !== expectedKeys.size) {
      return {
        outcome: 'verify-failed',
        reason: `hooks/list reported ${managedListings.length} of ${expectedKeys.size} expected managed entries`
      }
    }

    const needingTrust = managedListings.filter((listing) => listing.trustStatus !== 'trusted')
    if (needingTrust.length > 0) {
      // Why: same wire shape as the Codex TUI "Trust all" flow — one upsert
      // edit under hooks.state with each key's Codex-computed current hash.
      const value: Record<string, { trusted_hash: string }> = {}
      for (const listing of needingTrust) {
        value[listing.key] = { trusted_hash: listing.currentHash }
      }
      await requestRpc('config/batchWrite', {
        edits: [{ keyPath: 'hooks.state', value, mergeStrategy: 'upsert' }],
        reloadUserConfig: true
      })
    }

    const verifyResult = await requestRpc('hooks/list', { cwds: [request.hooksListCwd] })
    const verifiedListings = collectHookListings(verifyResult).filter(matchManaged)
    const untrusted = verifiedListings.filter((listing) => listing.trustStatus !== 'trusted')
    if (verifiedListings.length !== expectedKeys.size || untrusted.length > 0) {
      return {
        outcome: 'verify-failed',
        reason:
          untrusted.length > 0
            ? `post-grant verify left ${untrusted.length} entries ${untrusted[0].trustStatus}`
            : `post-grant verify reported ${verifiedListings.length} of ${expectedKeys.size} entries`
      }
    }
    return {
      outcome: 'granted',
      wroteTrust: needingTrust.length > 0,
      entries: verifiedListings.map((listing) => ({
        key: listing.key,
        normalizedKey: normalizeHookTrustKeyForLookup(listing.key),
        trustedHash: listing.currentHash
      }))
    }
  } catch (error) {
    if (
      error instanceof Error &&
      !(error instanceof CodexAppServerUnsupportedError) &&
      !(error instanceof CodexAppServerTimeoutError) &&
      stderrIndicatesMissingAppServer(stderrTail)
    ) {
      throw new CodexAppServerUnsupportedError(
        `codex CLI does not support the app-server subcommand: ${stderrTail.trim().slice(0, 400)}`
      )
    }
    throw error
  } finally {
    try {
      child.stdin.end()
    } catch {
      // stdin may already be destroyed after a kill; reaping below still runs.
    }
    if (!exited) {
      // Why: the server exits promptly on stdin EOF; the grace period only
      // bounds a wedged child before the guaranteed SIGKILL reap.
      const grace = new Promise<void>((resolve) => setTimeout(resolve, 1500))
      await Promise.race([exitPromise, grace])
      if (!exited) {
        child.kill('SIGKILL')
        await Promise.race([exitPromise, new Promise<void>((resolve) => setTimeout(resolve, 1000))])
      }
    }
    clearTimeout(deadline)
  }
}
