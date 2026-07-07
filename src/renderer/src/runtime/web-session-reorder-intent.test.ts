import { afterEach, describe, expect, it } from 'vitest'
import {
  MAX_WEB_SESSION_REORDER_INTENT_WORKTREES,
  clearWebSessionReorderIntentsForWorktree,
  getWebSessionReorderIntentCountsForTests,
  recordWebSessionReorderIntent,
  resetWebSessionReorderIntentForTests,
  resolveWebSessionReorderedOrder
} from './web-session-reorder-intent'

const WT = 'repo::/wt'

afterEach(() => resetWebSessionReorderIntentForTests())

describe('web session reorder intent', () => {
  it('prunes expired worktree intents when recording a newer intent', () => {
    recordWebSessionReorderIntent('old-worktree', 'group-1', ['tab-b', 'tab-a'], 1000)

    recordWebSessionReorderIntent(WT, 'group-1', ['tab-c', 'tab-d'], 11_001)

    expect(getWebSessionReorderIntentCountsForTests()).toEqual({ worktrees: 1, groups: 1 })
    expect(
      resolveWebSessionReorderedOrder('old-worktree', 'group-1', ['tab-a', 'tab-b'], 11_001)
    ).toEqual(['tab-a', 'tab-b'])
    expect(resolveWebSessionReorderedOrder(WT, 'group-1', ['tab-d', 'tab-c'], 11_001)).toEqual([
      'tab-c',
      'tab-d'
    ])
  })

  it('bounds worktree intents while retaining recently reused worktrees', () => {
    recordWebSessionReorderIntent('keep', 'group-1', ['tab-b', 'tab-a'], 1000)
    for (let i = 0; i < MAX_WEB_SESSION_REORDER_INTENT_WORKTREES - 1; i += 1) {
      recordWebSessionReorderIntent(`worktree-${i}`, 'group-1', ['tab-b', 'tab-a'], 1000)
    }

    expect(resolveWebSessionReorderedOrder('keep', 'group-1', ['tab-a', 'tab-b'], 1000)).toEqual([
      'tab-b',
      'tab-a'
    ])

    recordWebSessionReorderIntent('worktree-new', 'group-1', ['tab-b', 'tab-a'], 1000)

    expect(getWebSessionReorderIntentCountsForTests()).toEqual({
      worktrees: MAX_WEB_SESSION_REORDER_INTENT_WORKTREES,
      groups: MAX_WEB_SESSION_REORDER_INTENT_WORKTREES
    })
    expect(
      resolveWebSessionReorderedOrder('worktree-0', 'group-1', ['tab-a', 'tab-b'], 1000)
    ).toEqual(['tab-a', 'tab-b'])
    expect(resolveWebSessionReorderedOrder('keep', 'group-1', ['tab-a', 'tab-b'], 1000)).toEqual([
      'tab-b',
      'tab-a'
    ])
  })

  it('clears one worktree without touching another', () => {
    recordWebSessionReorderIntent(WT, 'group-1', ['tab-b', 'tab-a'], 1000)
    recordWebSessionReorderIntent('repo::/other', 'group-1', ['tab-d', 'tab-c'], 1000)

    clearWebSessionReorderIntentsForWorktree(WT)

    expect(resolveWebSessionReorderedOrder(WT, 'group-1', ['tab-a', 'tab-b'], 1000)).toEqual([
      'tab-a',
      'tab-b'
    ])
    expect(
      resolveWebSessionReorderedOrder('repo::/other', 'group-1', ['tab-c', 'tab-d'], 1000)
    ).toEqual(['tab-d', 'tab-c'])
  })
})
