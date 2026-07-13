import { describe, expect, it } from 'vitest'
import { DaemonSessionExitFence } from './daemon-session-exit-fence'

describe('DaemonSessionExitFence', () => {
  it('invalidates an absent-list snapshot across same-id admission completion', () => {
    const fence = new DaemonSessionExitFence()
    fence.rememberGeneration('same-id', 'old-generation')
    fence.defer('same-id', { code: 7, sessionGeneration: 'old-generation' })
    const staleListSnapshot = fence.snapshot('same-id')

    const admission = fence.beginAdmission('same-id')
    fence.rememberGeneration('same-id', 'replacement-generation', admission)
    admission.complete()

    expect(fence.isStable('same-id', staleListSnapshot)).toBe(false)
    expect(fence.isStaleGeneration('same-id', 'old-generation')).toBe(true)
    expect(fence.getPending('same-id')).toEqual({
      code: 7,
      sessionGeneration: 'old-generation'
    })
  })

  it('defers generation mismatch classification while admission is active', () => {
    const fence = new DaemonSessionExitFence()
    fence.rememberGeneration('same-id', 'old-generation')

    const admission = fence.beginAdmission('same-id')
    expect(fence.isAdmissionActive('same-id')).toBe(true)
    expect(fence.isStaleGeneration('same-id', 'replacement-generation')).toBe(false)

    fence.rememberGeneration('same-id', 'replacement-generation', admission)
    admission.complete()
    expect(fence.isAdmissionActive('same-id')).toBe(false)
    expect(fence.isStaleGeneration('same-id', 'old-generation')).toBe(true)
  })

  it('releases every per-session map after repeated exit finalization', () => {
    const fence = new DaemonSessionExitFence()
    for (let i = 0; i < 2_000; i++) {
      const id = `session-${i}`
      const admission = fence.beginAdmission(id)
      fence.rememberGeneration(id, `generation-${i}`, admission)
      fence.defer(id, { code: i })
      admission.complete()
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
    const admission = fence.beginAdmission('late-session')
    fence.clear()

    expect(fence.rememberGeneration('late-session', 'late-generation', admission)).toBe(false)
    admission.complete()

    expect(fence.snapshot('late-session')).toBeUndefined()
  })
})
