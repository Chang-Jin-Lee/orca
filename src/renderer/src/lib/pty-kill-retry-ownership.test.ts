import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  killPtyRetainingRetryOwnership,
  releaseRetainedPtyKillOwnership,
  releaseRetainedPtyKillsForSshTarget
} from './pty-kill-retry-ownership'
import { toAppSshPtyId } from '../../../shared/ssh-pty-id'

const IDS = Array.from({ length: 65 }, (_, index) => `pty-retained-${index}`)

describe('PTY kill retry ownership', () => {
  afterEach(() => {
    for (const id of IDS) {
      releaseRetainedPtyKillOwnership(id)
    }
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('retains every live id and retries all due owners after bounded backoff', async () => {
    vi.useFakeTimers()
    const kill = vi.fn().mockRejectedValue(new Error('provider disconnected'))
    vi.stubGlobal('window', { api: { pty: { kill } } })
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    for (const id of IDS) {
      await killPtyRetainingRetryOwnership(id, '[pty] failed').catch(() => {})
    }
    kill.mockResolvedValue(undefined)

    await vi.advanceTimersByTimeAsync(250)

    expect(kill).toHaveBeenCalledTimes(IDS.length * 2)
    for (const id of IDS) {
      expect(kill.mock.calls.filter(([calledId]) => calledId === id)).toHaveLength(2)
    }
  })

  it('retries after a second failure without requiring another lifecycle event', async () => {
    vi.useFakeTimers()
    const kill = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('still offline'))
      .mockResolvedValue(undefined)
    vi.stubGlobal('window', { api: { pty: { kill } } })
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await killPtyRetainingRetryOwnership(IDS[0], '[pty] failed').catch(() => {})
    await vi.advanceTimersByTimeAsync(250)
    expect(kill).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(500)
    expect(kill).toHaveBeenCalledTimes(3)
  })

  it('releases only a removed SSH target and cancels the final retry timer', async () => {
    vi.useFakeTimers()
    const kill = vi.fn().mockRejectedValue(new Error('provider disconnected'))
    vi.stubGlobal('window', { api: { pty: { kill } } })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const removedId = toAppSshPtyId('removed-target', 'pty-1')
    const retainedId = toAppSshPtyId('retained-target', 'pty-2')

    await killPtyRetainingRetryOwnership(removedId, '[pty] failed').catch(() => {})
    await killPtyRetainingRetryOwnership(retainedId, '[pty] failed').catch(() => {})
    releaseRetainedPtyKillsForSshTarget('removed-target')
    await vi.advanceTimersByTimeAsync(250)

    expect(kill.mock.calls.filter(([id]) => id === removedId)).toHaveLength(1)
    expect(kill.mock.calls.filter(([id]) => id === retainedId)).toHaveLength(2)
    releaseRetainedPtyKillsForSshTarget('retained-target')
    expect(vi.getTimerCount()).toBe(0)
  })
})
