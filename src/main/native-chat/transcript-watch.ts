// Live transcript tailing: watch a resolved session JSONL file and emit only
// the messages parsed from bytes appended since the last read. Modeled on the
// incremental byte-offset read in codex-usage/scanner.ts (parseCodexUsageFile's
// skipInitialBytes), but specialized to the NativeChatMessage record decoders.
//
// Teardown discipline (plan U4 risk: file-watch fd leaks): every subscription
// owns exactly one fs.FSWatcher and one debounce timer. unsubscribe() closes
// the watcher and clears the timer synchronously, and the module tracks the live
// watcher count so tests can assert no watcher survives teardown.

import { watch, type FSWatcher } from 'node:fs'
import { open, stat } from 'node:fs/promises'
import type { AgentType, NativeChatMessage } from '../../shared/native-chat-types'
import { resolveSessionFilePath, type ResolveSessionFileOptions } from './session-file-resolver'
import {
  decodeClaudeTranscriptLine,
  decodeCodexTranscriptLine,
  decodeGrokTranscriptLine
} from './transcript-line-decoders'
import { decodeTranscriptStream } from './transcript-stream-lines'

export type SubscribeNativeChatTranscriptArgs = ResolveSessionFileOptions & {
  agent: AgentType
  sessionId: string
  /** Called with the newly-appended messages whenever the file grows. Never
   *  called with an empty array. */
  onAppend: (messages: NativeChatMessage[]) => void
  /** Resolve directly to this file, skipping path discovery (used by tests). */
  filePath?: string
  /** Coalesce window for rapid fs.watch events (ms). Defaults to 40ms. */
  debounceMs?: number
  /** First re-resolve interval while the session file doesn't exist yet (ms).
   *  Defaults to RESOLVE_POLL_INITIAL_MS; overridable so tests run fast. */
  resolvePollMs?: number
}

export type NativeChatTranscriptSubscription = {
  /** Closes the watcher and releases the file handle. Idempotent. */
  unsubscribe: () => void
}

// Why: a single watch event can fire several times for one append; we read from
// the last byte offset so re-entrant reads never re-emit prior messages. Each
// decoder is stateless per-line, so tailing reuses the same record→message
// mapping the full reader uses.
const DEFAULT_DEBOUNCE_MS = 40

// Why: a just-created session's .jsonl is written lazily — an agent can take
// from a few seconds to minutes to flush its first line (#8401) — so resolve can
// return null right after subscribe. Re-resolve on a backing-off interval until
// the file appears, then install the watcher; otherwise a live pane opened before
// the first flush would never tail. The backoff keeps a long wait cheap (a fixed
// fast poll would repeat the directory walk hundreds of times). Only runs while
// the file is missing; a non-blank sessionId is required (blank has nothing to
// resolve).
const RESOLVE_POLL_INITIAL_MS = 1000
const RESOLVE_POLL_MAX_MS = 10_000

// Why: process-wide count of live FSWatchers opened by this module. The U4 leak
// test asserts this returns to zero after unsubscribe so a forgotten handle is
// caught deterministically rather than relying on OS fd inspection.
let activeWatcherCount = 0

/** Test-only: number of fs watchers this module currently holds open. */
export function getActiveNativeChatWatcherCount(): number {
  return activeWatcherCount
}

function lineDecoderForAgent(
  agent: AgentType
): ((line: string, fallbackId: string) => NativeChatMessage | null) | null {
  if (agent === 'claude') {
    return decodeClaudeTranscriptLine
  }
  if (agent === 'codex') {
    return decodeCodexTranscriptLine
  }
  if (agent === 'grok') {
    return decodeGrokTranscriptLine
  }
  return null
}

async function fileSize(filePath: string): Promise<number> {
  try {
    return (await stat(filePath)).size
  } catch {
    return 0
  }
}

/**
 * Read bytes [start, end) of the file and decode each complete line into a
 * NativeChatMessage. Opens its own fd and always closes it (no leak on the read
 * path, distinct from the long-lived watcher). Returns the messages plus the
 * byte offset actually consumed so a partially-written trailing line is re-read
 * on the next append rather than dropped.
 */
async function readAppendedMessages(
  filePath: string,
  start: number,
  decode: (line: string, fallbackId: string) => NativeChatMessage | null
): Promise<{ messages: NativeChatMessage[]; consumedTo: number }> {
  const end = await fileSize(filePath)
  if (end <= start) {
    // File shrank (rotation/replacement) or unchanged — caller resets offset.
    return { messages: [], consumedTo: end }
  }

  const handle = await open(filePath, 'r')
  try {
    const stream = handle.createReadStream({
      encoding: 'utf-8',
      start,
      end: end - 1,
      autoClose: false
    })
    const { messages, consumedBytes } = await decodeTranscriptStream(
      stream,
      filePath,
      start,
      decode,
      false
    )
    return { messages, consumedTo: start + consumedBytes }
  } finally {
    await handle.close()
  }
}

/**
 * Subscribe to live appends on an agent's transcript file. Returns an
 * unsubscribe fn that tears the watcher down completely.
 *
 * Handles file rotation/replacement: when the file shrinks (a new session id
 * resolved to a smaller/newer file, or the file was truncated), the offset is
 * reset to 0 so the replacement's content is read from the top.
 */
export async function subscribeNativeChatTranscript(
  args: SubscribeNativeChatTranscriptArgs
): Promise<NativeChatTranscriptSubscription> {
  const { agent, sessionId, onAppend, debounceMs, resolvePollMs } = args
  const decode = lineDecoderForAgent(agent)
  const initialPath = args.filePath ?? (await resolveSessionFilePath(agent, sessionId, args))

  if (!decode) {
    // Unknown agent — nothing to decode. No-op teardown so callers can
    // unconditionally unsubscribe without null-checks.
    return { unsubscribe: () => {} }
  }

  // Why: seed the offset at 0 so the FIRST drain re-reads the whole file. This
  // closes the read/subscribe race — a turn appended between the caller's
  // readSession EOF and the watcher install is still emitted. Re-emitted lines
  // collapse by deterministic id in the assembler (no dup, no drop). Subsequent
  // drains use the incremental offset so the full re-read happens only once.
  let offset = 0
  let closed = false
  let reading = false
  let pendingReadRequested = false
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let resolvePollTimer: ReturnType<typeof setTimeout> | null = null
  let watcher: FSWatcher | null = null
  // The resolved path, set once the file exists (immediately, or via the poll).
  let currentFilePath: string | null = initialPath

  async function drain(): Promise<void> {
    if (closed) {
      return
    }
    const path = currentFilePath
    if (path === null) {
      return
    }
    if (reading) {
      // A read is already in flight; mark that another pass is needed so rapid
      // successive appends coalesce without dropping the trailing one.
      pendingReadRequested = true
      return
    }
    reading = true
    try {
      do {
        pendingReadRequested = false
        try {
          const currentSize = await fileSize(path)
          if (currentSize < offset) {
            // Rotation/replacement/truncation: re-read from the top.
            offset = 0
          }
          const { messages, consumedTo } = await readAppendedMessages(path, offset, decode!)
          offset = consumedTo
          if (!closed && messages.length > 0) {
            onAppend(messages)
          }
        } catch {
          // Why: a transient read failure (EACCES/EIO/ENOENT during rotation)
          // must not leave the subscription permanently deaf. Stop this drain;
          // the finally resets `reading` so a later fs event re-arms the read.
          break
        }
      } while (pendingReadRequested && !closed)
    } finally {
      reading = false
    }
  }

  function scheduleDrain(): void {
    if (closed) {
      return
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      void drain()
    }, debounceMs ?? DEFAULT_DEBOUNCE_MS)
  }

  function stopResolvePoll(): void {
    if (resolvePollTimer) {
      clearTimeout(resolvePollTimer)
      resolvePollTimer = null
    }
  }

  // Install the fs watcher on a now-present file. Returns false when watch()
  // throws (the file vanished again), so the poll caller keeps trying.
  function installWatcher(path: string): boolean {
    if (closed) {
      return false
    }
    let installed: FSWatcher
    try {
      installed = watch(path, scheduleDrain)
    } catch {
      return false
    }
    watcher = installed
    currentFilePath = path
    activeWatcherCount++
    // Why: on some platforms fs.watch can miss the very first append that lands
    // between offset-seed and watcher install. Kick one debounced drain so a
    // turn written immediately after install is still picked up.
    scheduleDrain()
    return true
  }

  // Self-rescheduling backoff poll (setTimeout, not setInterval) so a slow resolve
  // can't overlap the next tick and the delay grows toward the cap on a long wait.
  function scheduleResolvePoll(delayMs: number): void {
    if (closed || watcher) {
      return
    }
    resolvePollTimer = setTimeout(() => {
      resolvePollTimer = null
      if (closed || watcher) {
        return
      }
      void resolveSessionFilePath(agent, sessionId, args)
        .then((resolved) => {
          // Re-check after the async resolve: unsubscribe may have run, or a
          // prior tick may have already installed the watcher (race-safe).
          if (closed || watcher) {
            return
          }
          if (resolved && installWatcher(resolved)) {
            return
          }
          scheduleResolvePoll(Math.min(delayMs * 2, RESOLVE_POLL_MAX_MS))
        })
        .catch(() => {
          // A transient resolve failure must not kill the poll; keep backing off.
          scheduleResolvePoll(Math.min(delayMs * 2, RESOLVE_POLL_MAX_MS))
        })
    }, delayMs)
  }

  if (currentFilePath !== null) {
    if (!installWatcher(currentFilePath)) {
      // File vanished between resolve and watch — preserve the original no-op.
      return { unsubscribe: () => {} }
    }
  } else if (sessionId.trim()) {
    // #8401: the session .jsonl isn't flushed yet. Re-resolve on a backing-off
    // interval and install the watcher once it appears (then re-read from the
    // top). A blank sessionId has nothing to resolve, so it never polls.
    scheduleResolvePoll(resolvePollMs ?? RESOLVE_POLL_INITIAL_MS)
  }

  return {
    unsubscribe: () => {
      if (closed) {
        return
      }
      closed = true
      stopResolvePoll()
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        debounceTimer = null
      }
      if (watcher) {
        watcher.close()
        watcher = null
        activeWatcherCount--
      }
    }
  }
}
