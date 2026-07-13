import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  killPtyRetainingRetryOwnership,
  releaseRetainedPtyKillOwnership,
  releaseRetainedPtyKillsForSshTarget
} from './pty-kill-retry-ownership'
import { toAppSshPtyId } from '../../../shared/ssh-pty-id'

const IDS = Array.from({ length: 2 }, (_, index) => `pty-retained-${index}`)

describe('PTY kill retry ownership', () => {
  afterEach(() => {
    for (const id of IDS) {
      releaseRetainedPtyKillOwnership(id)
    }
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('delegates exact identity to the main-owned retry boundary', async () => {
    const kill = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('window', { api: { pty: { kill } } })
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    await killPtyRetainingRetryOwnership(IDS[0], '[pty] failed', {
      expectedPaneKey: 'tab:leaf',
      expectedTabId: 'tab'
    })
    expect(kill).toHaveBeenCalledWith(IDS[0], {
      expectedPaneKey: 'tab:leaf',
      expectedTabId: 'tab'
    })
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
    expect(kill.mock.calls.filter(([id]) => id === retainedId)).toHaveLength(1)
    releaseRetainedPtyKillsForSshTarget('retained-target')
    expect(vi.getTimerCount()).toBe(0)
  })
})
