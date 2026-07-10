import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface, type Interface } from 'node:readline'
import type { Readable, Writable } from 'node:stream'

type WatcherEvent = {
  type: 'create' | 'update' | 'delete'
  path: string
}

type NativeWatcherOptions = {
  ignoreGlobs?: string[]
}

type NativeWatcherBinding = {
  subscribe(
    dir: string,
    callback: (error: Error | null, events: WatcherEvent[]) => void,
    options: NativeWatcherOptions
  ): Promise<void>
  unsubscribe(
    dir: string,
    callback: (error: Error | null, events: WatcherEvent[]) => void,
    options: NativeWatcherOptions
  ): Promise<void>
}

type HostCommand =
  | { op: 'subscribe'; id: number; dir: string; ignoreDirs: string[] }
  | { op: 'unsubscribe'; id: number }

type Subscription = {
  dir: string
  callback: (error: Error | null, events: WatcherEvent[]) => void
  options: NativeWatcherOptions
  ready: Promise<void>
}

type HostOutput = Pick<Writable, 'write'>

const CANARY_INTERVAL_MS = 10_000
const CANARY_EVENT_TIMEOUT_MS = 5_000
const CANARY_MAX_MISSES = 2

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildIgnoreGlobs(ignoreDirs: readonly string[]): string[] {
  return ignoreDirs.map((dir) => `^(?:.*/)?${escapeRegex(dir)}(?:/.*)?$`)
}

function parseCommand(line: string): HostCommand | null {
  try {
    const command = JSON.parse(line) as Partial<HostCommand>
    if (!Number.isSafeInteger(command.id) || (command.id ?? 0) <= 0) {
      return null
    }
    if (command.op === 'unsubscribe') {
      return { op: 'unsubscribe', id: command.id! }
    }
    if (
      command.op === 'subscribe' &&
      typeof command.dir === 'string' &&
      command.dir.startsWith('/') &&
      Array.isArray(command.ignoreDirs) &&
      command.ignoreDirs.every((dir) => typeof dir === 'string')
    ) {
      return {
        op: 'subscribe',
        id: command.id!,
        dir: command.dir,
        ignoreDirs: command.ignoreDirs
      }
    }
  } catch {
    return null
  }
  return null
}

export function startWslWatcherHost(
  binding: NativeWatcherBinding,
  input: Readable,
  output: HostOutput,
  exit: (code: number) => void = process.exit
): { close(): Promise<void> } {
  const subscriptions = new Map<number, Subscription>()
  const send = (message: object): void => {
    output.write(`${JSON.stringify(message)}\n`)
  }

  const subscribe = (command: Extract<HostCommand, { op: 'subscribe' }>): void => {
    if (subscriptions.has(command.id)) {
      send({ op: 'subscribe-failed', id: command.id, message: 'duplicate subscription id' })
      return
    }
    const options = { ignoreGlobs: buildIgnoreGlobs(command.ignoreDirs) }
    const callback = (error: Error | null, events: WatcherEvent[]): void => {
      if (error) {
        send({ op: 'watch-error', id: command.id, message: errorMessage(error) })
      } else if (events.length > 0) {
        send({ op: 'events', id: command.id, events })
      }
    }
    const ready = binding
      .subscribe(command.dir, callback, options)
      .then(() => send({ op: 'subscribed', id: command.id }))
      .catch((error: unknown) => {
        subscriptions.delete(command.id)
        send({ op: 'subscribe-failed', id: command.id, message: errorMessage(error) })
      })
    subscriptions.set(command.id, { dir: command.dir, callback, options, ready })
  }

  const unsubscribe = async (id: number): Promise<void> => {
    const subscription = subscriptions.get(id)
    subscriptions.delete(id)
    try {
      await subscription?.ready
      if (subscription) {
        await binding.unsubscribe(subscription.dir, subscription.callback, subscription.options)
      }
    } catch (error) {
      process.stderr.write(`[wsl-watcher-host] unsubscribe ${id}: ${errorMessage(error)}\n`)
    }
    send({ op: 'unsubscribed', id })
  }

  let closing: Promise<void> | null = null
  const close = (): Promise<void> => {
    if (!closing) {
      closing = Promise.all(Array.from(subscriptions.keys(), unsubscribe)).then(() => undefined)
    }
    return closing
  }

  const lines: Interface = createInterface({ input, crlfDelay: Infinity })
  lines.on('line', (line) => {
    const command = parseCommand(line)
    if (!command) {
      send({ op: 'protocol-error', message: 'invalid command' })
    } else if (command.op === 'subscribe') {
      subscribe(command)
    } else {
      void unsubscribe(command.id)
    }
  })
  lines.once('close', () => {
    void close().finally(() => exit(0))
  })
  send({ op: 'ready', protocol: 1 })
  return { close }
}

async function startCanary(binding: NativeWatcherBinding): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'orca-wsl-watcher-'))
  const options: NativeWatcherOptions = {}
  let lastEventAt = 0
  const callback = (error: Error | null): void => {
    if (!error) {
      lastEventAt = Date.now()
    }
  }
  await binding.subscribe(dir, callback, options)
  process.once('exit', () => {
    try {
      rmSync(dir, { recursive: true, force: true })
    } catch {
      // Temporary canary cleanup is best-effort during process exit.
    }
  })
  let misses = 0
  setInterval(() => {
    const probedAt = Date.now()
    try {
      writeFileSync(join(dir, 'canary.txt'), String(probedAt))
    } catch {
      return
    }
    setTimeout(() => {
      if (lastEventAt >= probedAt) {
        misses = 0
      } else if (++misses >= CANARY_MAX_MISSES) {
        process.stderr.write('[wsl-watcher-host] native event delivery stalled\n')
        process.exit(2)
      }
    }, CANARY_EVENT_TIMEOUT_MS)
  }, CANARY_INTERVAL_MS)
}

function main(): void {
  const binding = require('./watcher.node') as NativeWatcherBinding
  if (process.argv.includes('--check')) {
    process.stdout.write('ok\n')
    return
  }
  startWslWatcherHost(binding, process.stdin, process.stdout)
  // Why: the native watcher can remain alive while its delivery thread stalls;
  // a private canary converts that silent failure into a recoverable host exit.
  void startCanary(binding).catch((error: unknown) => {
    process.stderr.write(`[wsl-watcher-host] canary unavailable: ${errorMessage(error)}\n`)
  })
}

if (require.main === module) {
  main()
}
