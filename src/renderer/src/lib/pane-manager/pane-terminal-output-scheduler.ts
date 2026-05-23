import { e2eConfig } from '@/lib/e2e-config'

type TerminalOutputTarget = {
  write(data: string, callback?: () => void): void
}

type TerminalOutputBeforeWrite = (data: string) => void

type QueueEntry = {
  terminal: TerminalOutputTarget
  chunks: string[]
  queuedChars: number
  beforeWrite?: TerminalOutputBeforeWrite
}

const BACKGROUND_FLUSH_DELAY_MS = 100
const BACKGROUND_DRAIN_INTERVAL_MS = 50
const BACKGROUND_CHUNK_CHARS = 16 * 1024
const BASE_WRITES_PER_DRAIN = 1
const CATCH_UP_WRITES_PER_DRAIN = 2
const CATCH_UP_BACKLOG_CHARS = 128 * 1024
const PARSE_SETTLE_TIMEOUT_MS = 250

const queuedByTerminal = new Map<TerminalOutputTarget, QueueEntry>()
let drainTimer: ReturnType<typeof setTimeout> | null = null
let totalQueuedChars = 0
const debugEnabled = e2eConfig.exposeStore

// Why no lossy queue cap: dropping raw terminal bytes can corrupt parser state
// (half an escape sequence, missed mode reset, wrong scrollback). When hidden
// agents build a real backlog, use a bounded catch-up budget instead.

type TerminalOutputSchedulerDebugSnapshot = {
  backgroundEnqueueCount: number
  foregroundWriteCount: number
  backgroundWriteCount: number
  flushWriteCount: number
  scheduledDrainCount: number
  drainWrites: number[]
  queuedChars: number
  maxQueuedChars: number
}

type TerminalOutputSchedulerDebugApi = {
  reset: () => void
  snapshot: () => TerminalOutputSchedulerDebugSnapshot
}

const debugState: TerminalOutputSchedulerDebugSnapshot = {
  backgroundEnqueueCount: 0,
  foregroundWriteCount: 0,
  backgroundWriteCount: 0,
  flushWriteCount: 0,
  scheduledDrainCount: 0,
  drainWrites: [],
  queuedChars: 0,
  maxQueuedChars: 0
}

function resetDebugState(): void {
  debugState.backgroundEnqueueCount = 0
  debugState.foregroundWriteCount = 0
  debugState.backgroundWriteCount = 0
  debugState.flushWriteCount = 0
  debugState.scheduledDrainCount = 0
  debugState.drainWrites = []
  debugState.queuedChars = totalQueuedChars
  debugState.maxQueuedChars = totalQueuedChars
}

function recordQueuedChars(): void {
  if (!debugEnabled) {
    return
  }
  debugState.queuedChars = totalQueuedChars
  debugState.maxQueuedChars = Math.max(debugState.maxQueuedChars, totalQueuedChars)
}

function exposeDebugApi(): void {
  if (!debugEnabled || typeof window === 'undefined') {
    return
  }
  // Why: the e2e repro needs to prove background output used the shared drain,
  // but production must not accumulate diagnostic counters indefinitely.
  const target = window as unknown as {
    __terminalOutputSchedulerDebug?: TerminalOutputSchedulerDebugApi
  }
  target.__terminalOutputSchedulerDebug ??= {
    reset: resetDebugState,
    snapshot: () => ({
      ...debugState,
      drainWrites: [...debugState.drainWrites]
    })
  }
}

function scheduleDrain(delayMs: number): void {
  if (drainTimer !== null) {
    return
  }
  if (debugEnabled) {
    debugState.scheduledDrainCount++
  }
  drainTimer = setTimeout(drainQueuedOutput, delayMs)
}

function maxWritesForCurrentBacklog(): number {
  return totalQueuedChars >= CATCH_UP_BACKLOG_CHARS
    ? CATCH_UP_WRITES_PER_DRAIN
    : BASE_WRITES_PER_DRAIN
}

function takeQueuedChunk(entry: QueueEntry, limit: number): string {
  let remaining = limit
  let data = ''

  while (remaining > 0 && entry.chunks.length > 0) {
    const chunk = entry.chunks[0]
    if (chunk.length <= remaining) {
      data += chunk
      remaining -= chunk.length
      entry.chunks.shift()
      continue
    }

    data += chunk.slice(0, remaining)
    entry.chunks[0] = chunk.slice(remaining)
    remaining = 0
  }

  entry.queuedChars -= data.length
  totalQueuedChars -= data.length
  recordQueuedChars()
  return data
}

function dropQueuedEntry(entry: QueueEntry): void {
  totalQueuedChars -= entry.queuedChars
  entry.queuedChars = 0
  entry.chunks.length = 0
  recordQueuedChars()
}

function writeQueuedChunk(entry: QueueEntry): boolean {
  const data = takeQueuedChunk(entry, BACKGROUND_CHUNK_CHARS)
  if (!data) {
    return false
  }
  try {
    entry.beforeWrite?.(data)
    entry.terminal.write(data)
  } catch {
    // Why: pane.terminal.dispose() can race with a queued late-arriving PTY ping;
    // a write to a disposed terminal throws. Drop the entry rather than crashing
    // the scheduler for other panes still draining.
    dropQueuedEntry(entry)
    return false
  }
  return true
}

function drainQueuedOutput(): void {
  drainTimer = null
  let writes = 0
  const maxWrites = maxWritesForCurrentBacklog()

  while (queuedByTerminal.size > 0 && writes < maxWrites) {
    const entry = queuedByTerminal.values().next().value
    if (!entry) {
      break
    }

    queuedByTerminal.delete(entry.terminal)
    if (writeQueuedChunk(entry)) {
      writes++
      if (debugEnabled) {
        debugState.backgroundWriteCount++
      }
    }
    if (entry.chunks.length > 0) {
      queuedByTerminal.set(entry.terminal, entry)
    }
  }

  if (debugEnabled && writes > 0) {
    debugState.drainWrites.push(writes)
  }
  if (queuedByTerminal.size > 0) {
    scheduleDrain(BACKGROUND_DRAIN_INTERVAL_MS)
  }
}

export function writeTerminalOutput(
  terminal: TerminalOutputTarget,
  data: string,
  options: { foreground: boolean; beforeWrite?: TerminalOutputBeforeWrite }
): void {
  exposeDebugApi()
  if (!data) {
    return
  }

  if (options.foreground) {
    flushTerminalOutput(terminal)
    if (debugEnabled) {
      debugState.foregroundWriteCount++
    }
    options.beforeWrite?.(data)
    terminal.write(data)
    return
  }

  let entry = queuedByTerminal.get(terminal)
  if (!entry) {
    entry = { terminal, chunks: [], queuedChars: 0, beforeWrite: options.beforeWrite }
    queuedByTerminal.set(terminal, entry)
  } else {
    entry.beforeWrite = options.beforeWrite
  }
  entry.chunks.push(data)
  entry.queuedChars += data.length
  totalQueuedChars += data.length
  recordQueuedChars()
  if (debugEnabled) {
    debugState.backgroundEnqueueCount++
  }
  // Why: non-focused panes can produce output continuously. Letting every
  // pane call xterm.write immediately schedules one xterm WriteBuffer timer
  // per pane, which starves the focused terminal on the shared renderer thread.
  scheduleDrain(BACKGROUND_FLUSH_DELAY_MS)
}

export function flushTerminalOutput(terminal: TerminalOutputTarget): void {
  exposeDebugApi()
  const entry = queuedByTerminal.get(terminal)
  if (!entry) {
    return
  }
  queuedByTerminal.delete(terminal)

  let data = takeQueuedChunk(entry, BACKGROUND_CHUNK_CHARS)
  while (data) {
    if (debugEnabled) {
      debugState.flushWriteCount++
    }
    try {
      entry.beforeWrite?.(data)
      terminal.write(data)
    } catch {
      // Why: pane.terminal.dispose() can race with a queued late-arriving PTY ping;
      // a write to a disposed terminal throws. Drop the entry rather than crashing
      // the scheduler for other panes still draining.
      dropQueuedEntry(entry)
      return
    }
    data = takeQueuedChunk(entry, BACKGROUND_CHUNK_CHARS)
  }
}

export function waitForTerminalOutputParsed(terminal: TerminalOutputTarget): Promise<void> {
  flushTerminalOutput(terminal)

  return new Promise((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    const finish = (): void => {
      if (settled) {
        return
      }
      settled = true
      if (timer !== null) {
        clearTimeout(timer)
      }
      resolve()
    }
    timer = setTimeout(finish, PARSE_SETTLE_TIMEOUT_MS)
    try {
      terminal.write('', finish)
    } catch {
      finish()
    }
  })
}

export function discardTerminalOutput(terminal: TerminalOutputTarget): void {
  exposeDebugApi()
  const entry = queuedByTerminal.get(terminal)
  if (!entry) {
    return
  }
  queuedByTerminal.delete(terminal)
  dropQueuedEntry(entry)
}

exposeDebugApi()
