import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { StringDecoder } from 'node:string_decoder'
import type { Event as WatcherEvent } from '@parcel/watcher'
import { wslHostMessageEvents, type WslHostMessage } from './filesystem-watcher-wsl-host-protocol'
import { ensureWslWatcherRuntime } from './filesystem-watcher-wsl-runtime'

export type WslHostSubscriptionContext = {
  distro: string
  linuxPath: string
  ignoreDirs: readonly string[]
  onEvents: (events: WatcherEvent[]) => void
  onOverflow: () => void
  onStopped: () => void
}

export type WslHostSubscription = {
  unsubscribe(): void
}

type PendingResult = {
  resolve: () => void
  reject: (error: Error) => void
}

type SubscriptionRecord = {
  id: number
  context: WslHostSubscriptionContext
  pending: PendingResult | null
  pendingTimer: ReturnType<typeof setTimeout> | null
}

type DistroHost = {
  distro: string
  process: ChildProcessWithoutNullStreams | null
  starting: Promise<void> | null
  subscriptions: Map<number, SubscriptionRecord>
  nextId: number
  streamBuffer: string
  stdoutDecoder: StringDecoder
  stderrDecoder: StringDecoder
  stderrTail: string
}

const hosts = new Map<string, DistroHost>()
const STARTUP_TIMEOUT_MS = 30_000
const SUBSCRIBE_TIMEOUT_MS = 30_000
const MAX_STREAM_BUFFER_CHARS = 10 * 1024 * 1024

function createHost(distro: string): DistroHost {
  return {
    distro,
    process: null,
    starting: null,
    subscriptions: new Map(),
    nextId: 1,
    streamBuffer: '',
    stdoutDecoder: new StringDecoder('utf8'),
    stderrDecoder: new StringDecoder('utf8'),
    stderrTail: ''
  }
}

function settleRecordFailure(host: DistroHost, record: SubscriptionRecord, error: Error): void {
  host.subscriptions.delete(record.id)
  if (record.pendingTimer) {
    clearTimeout(record.pendingTimer)
    record.pendingTimer = null
  }
  if (record.pending) {
    record.pending.reject(error)
    record.pending = null
  } else {
    record.context.onStopped()
  }
  if (host.subscriptions.size === 0) {
    hosts.delete(host.distro)
    const child = host.process
    host.process = null
    child?.kill()
  } else {
    send(host, { op: 'unsubscribe', id: record.id })
  }
}

function handleMessage(host: DistroHost, message: WslHostMessage, settleReady: () => void): void {
  if (message.op === 'ready') {
    if (message.protocol === 1) {
      settleReady()
    } else {
      host.process?.kill()
    }
    return
  }
  if (message.op === 'protocol-error') {
    host.process?.kill()
    return
  }
  if (!Number.isSafeInteger(message.id)) {
    return
  }
  const record = host.subscriptions.get(message.id as number)
  if (!record) {
    return
  }
  if (message.op === 'subscribed') {
    if (record.pendingTimer) {
      clearTimeout(record.pendingTimer)
      record.pendingTimer = null
    }
    record.pending?.resolve()
    record.pending = null
  } else if (message.op === 'subscribe-failed') {
    settleRecordFailure(host, record, new Error(String(message.message ?? 'subscribe failed')))
  } else if (message.op === 'watch-error') {
    settleRecordFailure(host, record, new Error(String(message.message ?? 'watch failed')))
  } else if (message.op === 'events') {
    const events = wslHostMessageEvents(message, record.context)
    if (events.length > 0) {
      record.context.onEvents(events)
    }
  }
}

function handleHostGone(host: DistroHost, child: ChildProcessWithoutNullStreams): void {
  if (host.process !== child) {
    return
  }
  host.process = null
  hosts.delete(host.distro)
  const error = new Error(
    `Managed WSL watcher exited${host.stderrTail.trim() ? `: ${host.stderrTail.trim()}` : ''}`
  )
  for (const record of host.subscriptions.values()) {
    if (record.pendingTimer) {
      clearTimeout(record.pendingTimer)
      record.pendingTimer = null
    }
    if (record.pending) {
      record.pending.reject(error)
      record.pending = null
    } else {
      record.context.onStopped()
    }
  }
  host.subscriptions.clear()
}

function send(host: DistroHost, message: object): boolean {
  try {
    if (!host.process?.stdin.writable) {
      return false
    }
    host.process.stdin.write(`${JSON.stringify(message)}\n`)
    return true
  } catch {
    return false
  }
}

async function startHost(host: DistroHost): Promise<void> {
  const runtime = await ensureWslWatcherRuntime(host.distro)
  const child = spawn(
    'wsl.exe',
    ['-d', host.distro, '--exec', runtime.nodePath, runtime.hostPath],
    { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }
  )
  host.process = child
  host.streamBuffer = ''
  host.stderrTail = ''
  await new Promise<void>((resolve, reject) => {
    let settled = false
    const settle = (error?: Error): void => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timer)
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    }
    const timer = setTimeout(() => {
      settle(new Error(`Timed out starting managed WSL watcher for ${host.distro}`))
      child.kill()
    }, STARTUP_TIMEOUT_MS)
    child.stdout.on('data', (chunk: Buffer) => {
      host.streamBuffer += host.stdoutDecoder.write(chunk)
      if (host.streamBuffer.length > MAX_STREAM_BUFFER_CHARS) {
        settle(new Error('Managed WSL watcher protocol buffer overflow'))
        child.kill()
        return
      }
      let newline = host.streamBuffer.indexOf('\n')
      while (newline !== -1) {
        const line = host.streamBuffer.slice(0, newline)
        host.streamBuffer = host.streamBuffer.slice(newline + 1)
        try {
          handleMessage(host, JSON.parse(line) as WslHostMessage, () => settle())
        } catch (error) {
          settle(error instanceof Error ? error : new Error(String(error)))
          child.kill()
          return
        }
        newline = host.streamBuffer.indexOf('\n')
      }
    })
    child.stderr.on('data', (chunk: Buffer) => {
      host.stderrTail = (host.stderrTail + host.stderrDecoder.write(chunk)).slice(-4096)
    })
    child.once('error', (error) => {
      settle(error)
      handleHostGone(host, child)
    })
    child.once('close', (code, signal) => {
      settle(new Error(`Managed WSL watcher exited before ready (${code ?? signal})`))
      handleHostGone(host, child)
    })
  })
}

function ensureHost(distro: string): Promise<DistroHost> {
  let host = hosts.get(distro)
  if (!host) {
    host = createHost(distro)
    hosts.set(distro, host)
  }
  if (!host.starting) {
    host.starting = startHost(host)
      .catch((error) => {
        if (host?.process) {
          host.process.kill()
        }
        hosts.delete(distro)
        throw error
      })
      .finally(() => {
        if (host) {
          host.starting = null
        }
      })
  }
  return host.starting.then(() => host!)
}

export async function subscribeViaWslWatcherHost(
  context: WslHostSubscriptionContext,
  signal?: AbortSignal
): Promise<WslHostSubscription> {
  if (signal?.aborted) {
    throw new Error('Managed WSL watcher subscription cancelled')
  }
  const host = await ensureHost(context.distro)
  if (signal?.aborted) {
    if (host.subscriptions.size === 0) {
      hosts.delete(host.distro)
      const child = host.process
      host.process = null
      child?.kill()
    }
    throw new Error('Managed WSL watcher subscription cancelled')
  }
  const id = host.nextId++
  const record: SubscriptionRecord = { id, context, pending: null, pendingTimer: null }
  const ready = new Promise<void>((resolve, reject) => {
    record.pending = { resolve, reject }
  })
  host.subscriptions.set(id, record)
  record.pendingTimer = setTimeout(() => {
    settleRecordFailure(host, record, new Error('Timed out subscribing managed WSL watcher'))
  }, SUBSCRIBE_TIMEOUT_MS)
  signal?.addEventListener(
    'abort',
    () => {
      if (host.subscriptions.has(id)) {
        settleRecordFailure(host, record, new Error('Managed WSL watcher subscription cancelled'))
      }
    },
    { once: true }
  )
  if (
    !send(host, {
      op: 'subscribe',
      id,
      dir: context.linuxPath,
      ignoreDirs: context.ignoreDirs
    })
  ) {
    settleRecordFailure(host, record, new Error('Managed WSL watcher is unavailable'))
  }
  await ready
  return {
    unsubscribe: () => {
      if (!host.subscriptions.delete(id)) {
        return
      }
      if (host.subscriptions.size === 0) {
        hosts.delete(host.distro)
        const child = host.process
        host.process = null
        child?.kill()
      } else {
        send(host, { op: 'unsubscribe', id })
      }
    }
  }
}

export function resetWslWatcherHostsForTest(): void {
  for (const host of hosts.values()) {
    host.process?.kill()
  }
  hosts.clear()
}
