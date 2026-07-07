import { afterEach, describe, expect, it } from 'vitest'
import {
  MAX_WEB_SESSION_FOCUS_INTENT_WORKTREES,
  clearWebSessionFocusIntent,
  getWebSessionFocusIntentCountForTests,
  peekWebSessionFocusIntent,
  recordWebSessionFocusIntent,
  resetWebSessionFocusIntentForTests
} from './web-session-focus-intent'

const WT = 'repo::/wt'

afterEach(() => resetWebSessionFocusIntentForTests())

describe('web session focus intent', () => {
  it('expires a never-confirmed focus intent', () => {
    recordWebSessionFocusIntent(WT, 'host-tab-1', 1000)

    expect(peekWebSessionFocusIntent(WT, 1000)).toBe('host-tab-1')
    expect(peekWebSessionFocusIntent(WT, 61_001)).toBeNull()
    expect(getWebSessionFocusIntentCountForTests()).toBe(0)
  })

  it('bounds worktree intents while retaining recently reused worktrees', () => {
    recordWebSessionFocusIntent('keep', 'host-tab-keep', 1000)
    for (let i = 0; i < MAX_WEB_SESSION_FOCUS_INTENT_WORKTREES - 1; i += 1) {
      recordWebSessionFocusIntent(`worktree-${i}`, `host-tab-${i}`, 1000)
    }

    expect(peekWebSessionFocusIntent('keep', 1000)).toBe('host-tab-keep')

    recordWebSessionFocusIntent('worktree-new', 'host-tab-new', 1000)

    expect(getWebSessionFocusIntentCountForTests()).toBe(MAX_WEB_SESSION_FOCUS_INTENT_WORKTREES)
    expect(peekWebSessionFocusIntent('worktree-0', 1000)).toBeNull()
    expect(peekWebSessionFocusIntent('keep', 1000)).toBe('host-tab-keep')
  })

  it('clears one worktree without touching another', () => {
    recordWebSessionFocusIntent(WT, 'host-tab-1', 1000)
    recordWebSessionFocusIntent('repo::/other', 'host-tab-2', 1000)

    clearWebSessionFocusIntent(WT)

    expect(peekWebSessionFocusIntent(WT, 1000)).toBeNull()
    expect(peekWebSessionFocusIntent('repo::/other', 1000)).toBe('host-tab-2')
  })
})
