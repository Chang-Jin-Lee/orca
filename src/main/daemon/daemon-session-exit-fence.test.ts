import { describe, expect, it } from 'vitest'
import { DaemonSessionExitFence } from './daemon-session-exit-fence'

describe('DaemonSessionExitFence', () => {
  it('invalidates an absent-list snapshot across same-id admission completion', () => {
    const fence = new DaemonSessionExitFence()
    fence.rememberGeneration('same-id', 'old-generation')
    fence.defer('same-id', { code: 7, sessionGeneration: 'old-generation' })
    const staleListSnapshot = fence.snapshot('same-id')

    const completeAdmission = fence.beginAdmission('same-id')
    fence.rememberGeneration('same-id', 'replacement-generation')
    completeAdmission()

    expect(fence.isStable('same-id', staleListSnapshot)).toBe(false)
    expect(fence.isStaleGeneration('same-id', 'old-generation')).toBe(true)
    expect(fence.getPending('same-id')).toEqual({
      code: 7,
      sessionGeneration: 'old-generation'
    })
  })

  it('releases every per-session map after repeated exit finalization', () => {
    const fence = new DaemonSessionExitFence()
    for (let i = 0; i < 2_000; i++) {
      const id = `session-${i}`
      const completeAdmission = fence.beginAdmission(id)
      fence.rememberGeneration(id, `generation-${i}`)
      fence.defer(id, { code: i })
      completeAdmission()
      fence.forget(id)
    }
    const internals = fence as unknown as Record<
      'revisions' | 'admissions' | 'sessionGenerations' | 'pendingExits',
      Map<string, unknown>
    >

    expect(internals.revisions.size).toBe(0)
    expect(internals.admissions.size).toBe(0)
    expect(internals.sessionGenerations.size).toBe(0)
    expect(internals.pendingExits.size).toBe(0)
  })

  it('does not recreate fence state when an admission completes after clear', () => {
    const fence = new DaemonSessionExitFence()
    const completeAdmission = fence.beginAdmission('late-session')
    fence.clear()

    completeAdmission()

    expect(fence.snapshot('late-session')).toBeUndefined()
  })
})
