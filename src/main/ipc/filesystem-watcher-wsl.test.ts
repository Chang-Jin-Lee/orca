import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { spawnMock } = vi.hoisted(() => ({ spawnMock: vi.fn() }))

vi.mock('child_process', () => ({ spawn: spawnMock }))

import { createWslWatcher } from './filesystem-watcher-wsl'
import type { WatchedRoot, WslWatcherDeps } from './filesystem-watcher-wsl'
import { SNAPSHOT_END, SNAPSHOT_START } from './filesystem-watcher-wsl-snapshot'

const ROOT_KEY = '\\\\wsl.localhost\\Ubuntu\\home\\me\\repo'

class FakeChildProcess extends EventEmitter {
  stdin = new PassThrough()
  stdout = new PassThrough()
  stderr = new PassThrough()
  kill = vi.fn(() => {
    this.emit('close', null, 'SIGTERM')
    return true
  })
}

function nativeMessage(message: unknown): string {
  return `${JSON.stringify(message)}\n`
}

function snapshotFrame(entries: [type: string, mtime: string, path: string][]): string {
  return `${SNAPSHOT_START}${entries
    .map(([type, mtime, entryPath]) => `${type}\t${mtime}\t${entryPath}\0`)
    .join('')}${SNAPSHOT_END}`
}

type ScheduleBatchFlush = (rootKey: string, root: WatchedRoot) => void

function makeDeps(
  scheduleBatchFlush = vi.fn<ScheduleBatchFlush>()
): WslWatcherDeps & { scheduleBatchFlush: ReturnType<typeof vi.fn<ScheduleBatchFlush>> } {
  return { ignoreDirs: ['node_modules', '.git'], scheduleBatchFlush }
}

function queueChildren(...children: FakeChildProcess[]): void {
  for (const child of children) {
    spawnMock.mockReturnValueOnce(child)
  }
}

async function startNativeWatcher(
  deps = makeDeps()
): Promise<{ child: FakeChildProcess; root: WatchedRoot; deps: ReturnType<typeof makeDeps> }> {
  const child = new FakeChildProcess()
  queueChildren(child)
  const promise = createWslWatcher(ROOT_KEY, ROOT_KEY, deps)
  child.stdout.write(nativeMessage({ type: 'ready' }))
  return { child, root: await promise, deps }
}

describe('createWslWatcher', () => {
  beforeEach(() => {
    spawnMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('starts native Linux events without requiring an inotify utility package', async () => {
    const { child } = await startNativeWatcher()

    expect(spawnMock).toHaveBeenCalledWith(
      'wsl.exe',
      ['-d', 'Ubuntu', '--', 'python3', '-u', '-', '/home/me/repo', 'node_modules', '.git'],
      expect.objectContaining({ stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    )
    const script = child.stdin.read()?.toString('utf8') ?? ''
    expect(script).toContain('libc.inotify_add_watch')
    expect(script).not.toContain('inotifywait')
    expect(script).not.toContain('while :; do')
  })

  it('streams nested native changes as UNC watcher events', async () => {
    const scheduleBatchFlush = vi.fn<ScheduleBatchFlush>()
    const { child, root } = await startNativeWatcher(makeDeps(scheduleBatchFlush))

    child.stdout.write(
      nativeMessage({
        type: 'events',
        events: [
          ['update', '/home/me/repo/docs/deep/README.md'],
          ['create', '/home/me/repo/new.txt'],
          ['delete', '/home/me/repo/old.txt'],
          ['update', '/home/me/repository/outside.txt']
        ]
      })
    )

    expect(scheduleBatchFlush).toHaveBeenCalledOnce()
    expect(root.batch.events).toEqual([
      { type: 'update', path: '\\\\wsl.localhost\\Ubuntu\\home\\me\\repo\\docs\\deep\\README.md' },
      { type: 'create', path: '\\\\wsl.localhost\\Ubuntu\\home\\me\\repo\\new.txt' },
      { type: 'delete', path: '\\\\wsl.localhost\\Ubuntu\\home\\me\\repo\\old.txt' }
    ])
  })

  it('uses recursive snapshots when the native runtime is unavailable', async () => {
    const native = new FakeChildProcess()
    const snapshot = new FakeChildProcess()
    queueChildren(native, snapshot)
    const promise = createWslWatcher(ROOT_KEY, ROOT_KEY, makeDeps())

    native.stdout.write(nativeMessage({ type: 'error', message: 'python3: not found' }))
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledTimes(2))
    snapshot.stdout.write(snapshotFrame([]))
    await promise

    expect(spawnMock.mock.calls[1]?.[1]).toEqual([
      '-d',
      'Ubuntu',
      '--',
      'sh',
      '-s',
      '--',
      '/home/me/repo'
    ])
    const script = snapshot.stdin.read()?.toString('utf8') ?? ''
    expect(script).toContain('find "$root" -mindepth 1')
    expect(script).not.toContain('-maxdepth')
  })

  it('diffs fallback snapshots into create, update, and delete events', async () => {
    const scheduleBatchFlush = vi.fn<ScheduleBatchFlush>()
    const native = new FakeChildProcess()
    const snapshot = new FakeChildProcess()
    queueChildren(native, snapshot)
    const promise = createWslWatcher(ROOT_KEY, ROOT_KEY, makeDeps(scheduleBatchFlush))
    native.emit('error', new Error('spawn failed'))
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledTimes(2))
    snapshot.stdout.write(
      snapshotFrame([
        ['f', '1.0', '/home/me/repo/README.md'],
        ['f', '1.0', '/home/me/repo/old.txt']
      ])
    )
    const root = await promise
    snapshot.stdout.write(
      snapshotFrame([
        ['f', '2.0', '/home/me/repo/README.md'],
        ['f', '1.0', '/home/me/repo/new.txt']
      ])
    )

    expect(root.batch.events).toEqual([
      { type: 'update', path: '\\\\wsl.localhost\\Ubuntu\\home\\me\\repo\\README.md' },
      { type: 'create', path: '\\\\wsl.localhost\\Ubuntu\\home\\me\\repo\\new.txt' },
      { type: 'delete', path: '\\\\wsl.localhost\\Ubuntu\\home\\me\\repo\\old.txt' }
    ])
  })

  it('refreshes and restarts an active watcher after WSL exits', async () => {
    vi.useFakeTimers()
    const scheduleBatchFlush = vi.fn<ScheduleBatchFlush>()
    const first = new FakeChildProcess()
    const second = new FakeChildProcess()
    queueChildren(first, second)
    const promise = createWslWatcher(ROOT_KEY, ROOT_KEY, makeDeps(scheduleBatchFlush))
    first.stdout.write(nativeMessage({ type: 'ready' }))
    const root = await promise

    first.emit('close', null, 'SIGTERM')
    await vi.advanceTimersByTimeAsync(0)
    expect(root.batch.overflowed).toBe(true)
    expect(scheduleBatchFlush).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(500)
    expect(spawnMock).toHaveBeenCalledTimes(2)
    second.stdout.write(nativeMessage({ type: 'ready' }))
    await vi.advanceTimersByTimeAsync(0)

    await root.subscription.unsubscribe()
    expect(second.kill).toHaveBeenCalledOnce()
  })

  it('kills the WSL child on unsubscribe without emitting a refresh', async () => {
    const scheduleBatchFlush = vi.fn<ScheduleBatchFlush>()
    const { child, root } = await startNativeWatcher(makeDeps(scheduleBatchFlush))

    await root.subscription.unsubscribe()

    expect(child.kill).toHaveBeenCalledOnce()
    expect(scheduleBatchFlush).not.toHaveBeenCalled()
  })

  it('cancels a watcher that is still restarting', async () => {
    vi.useFakeTimers()
    const first = new FakeChildProcess()
    const restarting = new FakeChildProcess()
    queueChildren(first, restarting)
    const promise = createWslWatcher(ROOT_KEY, ROOT_KEY, makeDeps())
    first.stdout.write(nativeMessage({ type: 'ready' }))
    const root = await promise
    first.emit('close', null, 'SIGTERM')
    await vi.advanceTimersByTimeAsync(500)

    await root.subscription.unsubscribe()

    expect(restarting.kill).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(spawnMock).toHaveBeenCalledTimes(2)
  })

  it('rejects only after both native and snapshot startup fail', async () => {
    const native = new FakeChildProcess()
    const snapshot = new FakeChildProcess()
    queueChildren(native, snapshot)
    const promise = createWslWatcher(ROOT_KEY, ROOT_KEY, makeDeps())
    native.emit('error', new Error('native failed'))
    await vi.waitFor(() => expect(spawnMock).toHaveBeenCalledTimes(2))
    snapshot.stderr.write('find failed')
    snapshot.emit('close', 1, null)

    await expect(promise).rejects.toThrow('WSL watcher exited before ready')
  })
})
