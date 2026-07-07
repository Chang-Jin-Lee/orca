import { afterEach, describe, expect, it } from 'vitest'
import {
  MAX_WEB_SESSION_CLOSE_INTENT_WORKTREES,
  clearWebSessionCloseIntentsForWorktree,
  getWebSessionCloseIntentCountsForTests,
  isWebSessionCloseIntentPending,
  reconcileWebSessionCloseIntents,
  recordWebSessionCloseIntent,
  resetWebSessionCloseIntentForTests
} from './web-session-close-intent'

const WT = 'repo::/wt'

afterEach(() => resetWebSessionCloseIntentForTests())

describe('web session close intent', () => {
  it('marks a closing host tab pending until the host confirms removal', () => {
    recordWebSessionCloseIntent(WT, 'host-tab-1', 1000)
    expect(isWebSessionCloseIntentPending(WT, 'host-tab-1', 1000)).toBe(true)

    // A snapshot that still contains the tab keeps the intent (not confirmed).
    reconcileWebSessionCloseIntents(WT, new Set(['host-tab-1', 'host-tab-2']))
    expect(isWebSessionCloseIntentPending(WT, 'host-tab-1', 1000)).toBe(true)

    // A snapshot WITHOUT the tab confirms removal and clears the intent.
    reconcileWebSessionCloseIntents(WT, new Set(['host-tab-2']))
    expect(isWebSessionCloseIntentPending(WT, 'host-tab-1', 1000)).toBe(false)
  })

  it('expires a never-confirmed close so the tab is not hidden forever', () => {
    recordWebSessionCloseIntent(WT, 'host-tab-1', 1000)
    expect(isWebSessionCloseIntentPending(WT, 'host-tab-1', 1000)).toBe(true)
    // Past the TTL with no confirming snapshot — stop suppressing.
    expect(isWebSessionCloseIntentPending(WT, 'host-tab-1', 1000 + 11_000)).toBe(false)
  })

  it('prunes expired worktree intents when recording a newer intent', () => {
    recordWebSessionCloseIntent('old-worktree', 'host-tab-old', 1000)

    recordWebSessionCloseIntent(WT, 'host-tab-1', 11_001)

    expect(getWebSessionCloseIntentCountsForTests()).toEqual({ worktrees: 1, tabs: 1 })
    expect(isWebSessionCloseIntentPending('old-worktree', 'host-tab-old', 11_001)).toBe(false)
    expect(isWebSessionCloseIntentPending(WT, 'host-tab-1', 11_001)).toBe(true)
  })

  it('bounds worktree intents while retaining recently reused worktrees', () => {
    recordWebSessionCloseIntent('keep', 'host-tab-keep', 1000)
    for (let i = 0; i < MAX_WEB_SESSION_CLOSE_INTENT_WORKTREES - 1; i += 1) {
      recordWebSessionCloseIntent(`worktree-${i}`, 'host-tab', 1000)
    }

    expect(isWebSessionCloseIntentPending('keep', 'host-tab-keep', 1000)).toBe(true)

    recordWebSessionCloseIntent('worktree-new', 'host-tab-new', 1000)

    expect(getWebSessionCloseIntentCountsForTests()).toEqual({
      worktrees: MAX_WEB_SESSION_CLOSE_INTENT_WORKTREES,
      tabs: MAX_WEB_SESSION_CLOSE_INTENT_WORKTREES
    })
    expect(isWebSessionCloseIntentPending('worktree-0', 'host-tab', 1000)).toBe(false)
    expect(isWebSessionCloseIntentPending('keep', 'host-tab-keep', 1000)).toBe(true)
  })

  it('scopes intents per worktree', () => {
    recordWebSessionCloseIntent(WT, 'host-tab-1', 1000)
    expect(isWebSessionCloseIntentPending('other::/wt', 'host-tab-1', 1000)).toBe(false)
  })

  it('ignores empty ids', () => {
    recordWebSessionCloseIntent(WT, '   ', 1000)
    expect(isWebSessionCloseIntentPending(WT, '', 1000)).toBe(false)
  })

  it('clears one worktree without touching another', () => {
    recordWebSessionCloseIntent(WT, 'host-tab-1', 1000)
    recordWebSessionCloseIntent('repo::/other', 'host-tab-2', 1000)

    clearWebSessionCloseIntentsForWorktree(WT)

    expect(isWebSessionCloseIntentPending(WT, 'host-tab-1', 1000)).toBe(false)
    expect(isWebSessionCloseIntentPending('repo::/other', 'host-tab-2', 1000)).toBe(true)
  })
})
