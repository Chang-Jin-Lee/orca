import { afterEach, describe, expect, it, vi } from 'vitest'
import { killPtyRetainingRetryOwnership } from './pty-kill-retry-ownership'
import { toAppSshPtyId } from '../../../shared/ssh-pty-id'

const IDS = Array.from({ length: 2 }, (_, index) => `pty-retained-${index}`)

describe('PTY kill retry ownership', () => {
  afterEach(() => {
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

  it('does not create renderer retry timers after main retains failures', async () => {
    vi.useFakeTimers()
    const kill = vi.fn().mockRejectedValue(new Error('provider disconnected'))
    vi.stubGlobal('window', { api: { pty: { kill } } })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const removedId = toAppSshPtyId('removed-target', 'pty-1')
    const retainedId = toAppSshPtyId('retained-target', 'pty-2')

    await killPtyRetainingRetryOwnership(removedId, '[pty] failed').catch(() => {})
    await killPtyRetainingRetryOwnership(retainedId, '[pty] failed').catch(() => {})
    await vi.advanceTimersByTimeAsync(250)

    expect(kill.mock.calls.filter(([id]) => id === removedId)).toHaveLength(1)
    expect(kill.mock.calls.filter(([id]) => id === retainedId)).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(0)
  })
})
