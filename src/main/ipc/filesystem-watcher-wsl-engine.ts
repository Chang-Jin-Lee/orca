import { spawn } from 'node:child_process'
import { StringDecoder } from 'node:string_decoder'
import type { Event as WatcherEvent } from '@parcel/watcher'
import { buildWslNativeWatcherScript } from './filesystem-watcher-wsl-native-script'
import {
  buildSnapshotScript,
  diffSnapshots,
  parseSnapshotFrame,
  SNAPSHOT_END,
  SNAPSHOT_START,
  toWslUncPath,
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

const NATIVE_STARTUP_TIMEOUT_MS = 10_000
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

type NativeMessage =
  | { type: 'ready' }
  | { type: 'overflow' }
  | { type: 'error'; message?: unknown }
  | { type: 'events'; events?: unknown }

function nativeEvents(message: NativeMessage, context: WslEngineContext): WatcherEvent[] {
  if (message.type !== 'events' || !Array.isArray(message.events)) {
    return []
  }
  const rootPrefix = context.linuxPath === '/' ? '/' : `${context.linuxPath.replace(/\/+$/, '')}/`
  const events: WatcherEvent[] = []
  for (const item of message.events) {
    if (
      Array.isArray(item) &&
      (item[0] === 'create' || item[0] === 'update' || item[0] === 'delete') &&
      typeof item[1] === 'string' &&
      (item[1] === context.linuxPath || item[1].startsWith(rootPrefix))
    ) {
      events.push({ type: item[0], path: toWslUncPath(item[1], context.distro) })
    }
  }
  return events
}

export function createWslNativeEngine(context: WslEngineContext): WslWatchEngine {
  let streamBuffer = ''
  const decoder = new StringDecoder('utf8')
  const args = [
    '-d',
    context.distro,
    '--',
    'python3',
    '-u',
    '-',
    context.linuxPath,
    ...context.ignoreDirs
  ]
  return createChildEngine(
    args,
    buildWslNativeWatcherScript(),
    NATIVE_STARTUP_TIMEOUT_MS,
    context.worktreePath,
    (chunk, settleReady, stop) => {
      streamBuffer += decoder.write(chunk)
      if (streamBuffer.length > MAX_STREAM_BUFFER_CHARS) {
        context.onOverflow()
        stop()
        return
      }
      let newline = streamBuffer.indexOf('\n')
      while (newline !== -1) {
        const line = streamBuffer.slice(0, newline)
        streamBuffer = streamBuffer.slice(newline + 1)
        try {
          const message = JSON.parse(line) as NativeMessage
          if (message.type === 'ready') {
            settleReady()
          } else if (message.type === 'overflow') {
            context.onOverflow()
          } else if (message.type === 'error') {
            settleReady(new Error(String(message.message ?? 'native WSL watcher failed')))
            stop()
          } else {
            const events = nativeEvents(message, context)
            if (events.length > 0) {
              context.onEvents(events)
            }
          }
        } catch (error) {
          context.onOverflow()
          settleReady(error instanceof Error ? error : new Error(String(error)))
          stop()
          return
        }
        newline = streamBuffer.indexOf('\n')
      }
    }
  )
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
