import { afterEach, describe, expect, it, vi } from 'vitest'

const callRuntimeRpc = vi.hoisted(() => vi.fn())

vi.mock('@/runtime/runtime-rpc-client', () => ({ callRuntimeRpc }))

import {
  closeRuntimeTerminalRetainingRetryOwnership,
  releaseRetainedRuntimeTerminalClose,
  releaseRetainedRuntimeTerminalClosesForEnvironment
} from './runtime-terminal-close-retry-ownership'

const TARGET = { kind: 'environment' as const, environmentId: 'env-1' }

describe('runtime terminal close retry ownership', () => {
  afterEach(() => {
    releaseRetainedRuntimeTerminalClose(TARGET, 'terminal-1')
    callRuntimeRpc.mockReset()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('retries a retained handle after repeated failure without another lifecycle event', async () => {
    vi.useFakeTimers()
    callRuntimeRpc
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('still offline'))
      .mockResolvedValue(undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await closeRuntimeTerminalRetainingRetryOwnership(TARGET, 'terminal-1').catch(() => {})
    await vi.advanceTimersByTimeAsync(250)
    expect(callRuntimeRpc).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(500)

    expect(callRuntimeRpc).toHaveBeenCalledTimes(3)
    expect(callRuntimeRpc).toHaveBeenLastCalledWith(TARGET, 'terminal.close', {
      terminal: 'terminal-1'
    })
  })

  it('releases every removed-environment handle and cancels its retry timer', async () => {
    vi.useFakeTimers()
    callRuntimeRpc.mockRejectedValue(new Error('environment unavailable'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await closeRuntimeTerminalRetainingRetryOwnership(TARGET, 'terminal-1').catch(() => {})
    await closeRuntimeTerminalRetainingRetryOwnership(TARGET, 'terminal-2').catch(() => {})
    expect(vi.getTimerCount()).toBe(1)

    releaseRetainedRuntimeTerminalClosesForEnvironment(TARGET.environmentId)
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(callRuntimeRpc).toHaveBeenCalledTimes(2)
  })
})
