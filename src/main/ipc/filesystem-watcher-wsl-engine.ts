import { spawn } from 'node:child_process'
import { StringDecoder } from 'node:string_decoder'
import type { Event as WatcherEvent } from '@parcel/watcher'
import {
  subscribeViaWslWatcherHost,
  type WslHostSubscription
} from './filesystem-watcher-wsl-host-client'
import {
  buildSnapshotScript,
  diffSnapshots,
  parseSnapshotFrame,
  SNAPSHOT_END,
  SNAPSHOT_START,
  type WslSnapshot
} from './filesystem-watcher-wsl-snapshot'

export type WslWatchEngine = {
  ready: Promise<void>
  stopped: Promise<void>
  stop(): void
}

export type WslEngineContext = {
  distro: string
  linuxPath: string
  worktreePath: string
  ignoreDirs: readonly string[]
  onEvents: (events: WatcherEvent[]) => void
  onOverflow: () => void
}

const SNAPSHOT_STARTUP_TIMEOUT_MS = 30_000
const MAX_STREAM_BUFFER_CHARS = 10 * 1024 * 1024

function createChildEngine(
  args: string[],
  stdin: string,
  startupTimeoutMs: number,
  worktreePath: string,
  handleStdout: (chunk: Buffer, settleReady: (error?: Error) => void, stop: () => void) => void
): WslWatchEngine {
  const child = spawn('wsl.exe', args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  })
  let disposed = false
  let readySettled = false
  let stoppedSettled = false
  let stderrTail = ''
  const stderrDecoder = new StringDecoder('utf8')
  let resolveReady!: () => void
  let rejectReady!: (error: Error) => void
  let resolveStopped!: () => void
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })
  const stopped = new Promise<void>((resolve) => {
    resolveStopped = resolve
  })
  const settleReady = (error?: Error): void => {
    if (readySettled) {
      return
    }
    readySettled = true
    clearTimeout(startupTimer)
    if (error) {
      rejectReady(error)
    } else {
      resolveReady()
    }
  }
  const settleStopped = (): void => {
    if (stoppedSettled) {
      return
    }
    stoppedSettled = true
    resolveStopped()
  }
  const stop = (): void => {
    if (disposed) {
      return
    }
    disposed = true
    child.kill()
  }
  const startupTimer = setTimeout(() => {
    settleReady(new Error(`Timed out starting WSL watcher for ${worktreePath}`))
    stop()
  }, startupTimeoutMs)

  child.stdin.on('error', (error) => {
    if (!readySettled) {
      settleReady(error)
    }
  })
  child.stdout.on('data', (chunk: Buffer) => {
    if (!disposed) {
      handleStdout(chunk, settleReady, stop)
    }
  })
  child.stderr.on('data', (chunk: Buffer) => {
    stderrTail = (stderrTail + stderrDecoder.write(chunk)).slice(-4096)
  })
  child.stdout.on('error', (error) => {
    if (!readySettled) {
      settleReady(error)
    } else if (!disposed) {
      stop()
    }
  })
  child.stderr.on('error', () => undefined)
  child.once('error', (error) => {
    if (!readySettled) {
      settleReady(error)
    } else if (!disposed) {
      stop()
    }
    settleStopped()
  })
  child.once('close', (code, signal) => {
    if (!readySettled) {
      const suffix = stderrTail.trim() ? `: ${stderrTail.trim()}` : ''
      settleReady(new Error(`WSL watcher exited before ready (${code ?? signal})${suffix}`))
    }
    settleStopped()
  })
  child.stdin.end(stdin)
  return { ready, stopped, stop }
}

export function createWslNativeEngine(context: WslEngineContext): WslWatchEngine {
  let subscription: WslHostSubscription | null = null
  const abortController = new AbortController()
  let disposed = false
  let stoppedSettled = false
  let resolveStopped!: () => void
  const stopped = new Promise<void>((resolve) => {
    resolveStopped = resolve
  })
  const settleStopped = (): void => {
    if (!stoppedSettled) {
      stoppedSettled = true
      resolveStopped()
    }
  }
  const ready = subscribeViaWslWatcherHost(
    {
      distro: context.distro,
      linuxPath: context.linuxPath,
      ignoreDirs: context.ignoreDirs,
      onEvents: context.onEvents,
      onOverflow: context.onOverflow,
      onStopped: settleStopped
    },
    abortController.signal
  ).then((created) => {
    if (disposed) {
      created.unsubscribe()
    } else {
      subscription = created
    }
  })
  return {
    ready,
    stopped,
    stop: () => {
      if (disposed) {
        return
      }
      disposed = true
      abortController.abort()
      subscription?.unsubscribe()
      subscription = null
      settleStopped()
    }
  }
}

export function createWslSnapshotEngine(context: WslEngineContext): WslWatchEngine {
  let streamBuffer = ''
  let previous: WslSnapshot | null = null
  const decoder = new StringDecoder('utf8')
  return createChildEngine(
    ['-d', context.distro, '--', 'sh', '-s', '--', context.linuxPath],
    buildSnapshotScript(context.ignoreDirs),
    SNAPSHOT_STARTUP_TIMEOUT_MS,
    context.worktreePath,
    (chunk, settleReady, stop) => {
      streamBuffer += decoder.write(chunk)
      while (true) {
        const start = streamBuffer.indexOf(SNAPSHOT_START)
        if (start === -1) {
          streamBuffer = streamBuffer.slice(-1)
          return
        }
        if (start > 0) {
          streamBuffer = streamBuffer.slice(start)
        }
        const end = streamBuffer.indexOf(SNAPSHOT_END, 1)
        if (end === -1) {
          if (streamBuffer.length > MAX_STREAM_BUFFER_CHARS) {
            context.onOverflow()
            stop()
          }
          return
        }
        const next = parseSnapshotFrame(streamBuffer.slice(1, end), context.distro)
        streamBuffer = streamBuffer.slice(end + 1)
        if (!previous) {
          previous = next
          settleReady()
        } else {
          const events = diffSnapshots(previous, next)
          previous = next
          if (events.length > 0) {
            context.onEvents(events)
          }
        }
      }
    }
  )
}
