import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { callRuntimeEnvironmentMock, getRuntimeEnvironmentStatusMock } = vi.hoisted(() => ({
  callRuntimeEnvironmentMock: vi.fn(),
  getRuntimeEnvironmentStatusMock: vi.fn()
}))

vi.mock('./runtime-environment-transport-routing', () => ({
  callRuntimeEnvironment: callRuntimeEnvironmentMock,
  getRuntimeEnvironmentStatus: getRuntimeEnvironmentStatusMock
}))

import {
  closeRuntimeTerminalWithRetryOwnership,
  initializeRuntimeTerminalCloseRetryOwner
} from './runtime-terminal-close-retry-owner'

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('runtime terminal close retry ownership', () => {
  beforeEach(() => {
    callRuntimeEnvironmentMock.mockReset()
    getRuntimeEnvironmentStatusMock.mockReset()
  })

  afterEach(() => {
    initializeRuntimeTerminalCloseRetryOwner(
      { getPendingRuntimeTerminalCloses: () => [] } as never,
      ''
    )
    vi.useRealTimers()
  })

  it('keeps a replacement runtime owner when the prior close settles late', async () => {
    vi.useFakeTimers()
    const closeA = deferred<{
      id: string
      ok: true
      result: { close: true }
      _meta: { runtimeId: string }
    }>()
    const closeB = deferred<{
      id: string
      ok: true
      result: { close: true }
      _meta: { runtimeId: string }
    }>()
    const upsert = vi.fn()
    const remove = vi.fn()
    initializeRuntimeTerminalCloseRetryOwner(
      {
        getPendingRuntimeTerminalCloses: () => [],
        upsertPendingRuntimeTerminalClose: upsert,
        removePendingRuntimeTerminalClose: remove
      } as never,
      '/tmp/orca-runtime-owner-test'
    )
    getRuntimeEnvironmentStatusMock
      .mockResolvedValueOnce({
        id: 'status-a',
        ok: true,
        result: { runtimeId: 'runtime-a' },
        _meta: { runtimeId: 'runtime-a' }
      })
      .mockResolvedValueOnce({
        id: 'status-b',
        ok: true,
        result: { runtimeId: 'runtime-b' },
        _meta: { runtimeId: 'runtime-b' }
      })
    callRuntimeEnvironmentMock.mockImplementation(
      (
        _userDataPath: string,
        _environmentId: string,
        _method: string,
        params: { expectedRuntimeId: string }
      ) => (params.expectedRuntimeId === 'runtime-a' ? closeA.promise : closeB.promise)
    )

    const first = closeRuntimeTerminalWithRetryOwnership('environment-1', 'terminal-1', 'runtime-a')
    await vi.waitFor(() => expect(callRuntimeEnvironmentMock).toHaveBeenCalledTimes(1))
    const replacement = closeRuntimeTerminalWithRetryOwnership(
      'environment-1',
      'terminal-1',
      'runtime-b'
    )
    await vi.waitFor(() => expect(callRuntimeEnvironmentMock).toHaveBeenCalledTimes(2))

    closeA.resolve({
      id: 'close-a',
      ok: true,
      result: { close: true },
      _meta: { runtimeId: 'runtime-a' }
    })
    await expect(first).resolves.toMatchObject({
      ok: true,
      result: { close: false, reason: 'retry_owner_replaced' }
    })
    expect(remove).not.toHaveBeenCalled()

    closeB.resolve({
      id: 'close-b',
      ok: true,
      result: { close: true },
      _meta: { runtimeId: 'runtime-b' }
    })
    await expect(replacement).resolves.toMatchObject({ ok: true, result: { close: true } })
    expect(upsert).toHaveBeenLastCalledWith({
      environmentId: 'environment-1',
      handle: 'terminal-1',
      runtimeId: 'runtime-b',
      requestedAt: expect.any(Number)
    })
    expect(remove).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('releases a same-runtime stale handle without another retry', async () => {
    vi.useFakeTimers()
    const remove = vi.fn()
    initializeRuntimeTerminalCloseRetryOwner(
      {
        getPendingRuntimeTerminalCloses: () => [],
        upsertPendingRuntimeTerminalClose: vi.fn(),
        removePendingRuntimeTerminalClose: remove
      } as never,
      '/tmp/orca-runtime-owner-test'
    )
    getRuntimeEnvironmentStatusMock.mockResolvedValue({
      id: 'status-a',
      ok: true,
      result: { runtimeId: 'runtime-a' },
      _meta: { runtimeId: 'runtime-a' }
    })
    callRuntimeEnvironmentMock
      .mockResolvedValueOnce({
        id: 'close-transient',
        ok: false,
        error: { code: 'runtime_unavailable', message: 'runtime unavailable' },
        _meta: { runtimeId: 'runtime-a' }
      })
      .mockResolvedValueOnce({
        id: 'close-a',
        ok: false,
        error: { code: 'terminal_handle_stale', message: 'terminal_handle_stale' },
        _meta: { runtimeId: 'runtime-a' }
      })

    await expect(
      closeRuntimeTerminalWithRetryOwnership('environment-1', 'terminal-1', 'runtime-a')
    ).resolves.toMatchObject({ ok: false, error: { code: 'runtime_unavailable' } })
    expect(vi.getTimerCount()).toBe(1)

    await expect(
      closeRuntimeTerminalWithRetryOwnership('environment-1', 'terminal-1', 'runtime-a')
    ).resolves.toMatchObject({
      ok: true,
      result: { close: false, reason: 'terminal_handle_stale' }
    })
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(60_000)

    expect(callRuntimeEnvironmentMock).toHaveBeenCalledTimes(2)
    expect(remove).toHaveBeenCalledWith('environment-1', 'terminal-1')
    expect(vi.getTimerCount()).toBe(0)
  })
})
