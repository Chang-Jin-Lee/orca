import { describe, expect, it } from 'vitest'
import type { AppState } from '@/store/types'
import { planMobileTerminalTabMount } from './mobile-terminal-tab-mount'

type PlannerState = Pick<AppState, 'tabsByWorktree' | 'terminalLayoutsByTabId'>

function state(tabCount = 1): PlannerState {
  return {
    tabsByWorktree: {
      wt: Array.from({ length: tabCount }, (_, index) => ({
        id: `tab-${index}`,
        ptyId: `wt@@${index}`
      }))
    } as unknown as AppState['tabsByWorktree'],
    terminalLayoutsByTabId: {}
  }
}

describe('planMobileTerminalTabMount', () => {
  it('keeps real-tab requests targeted to exactly one tab', () => {
    expect(planMobileTerminalTabMount(state(), { worktreeId: 'wt', tabId: 'tab-0' })).toEqual({
      worktreeId: 'wt',
      tabIds: ['tab-0']
    })
  })

  it('resolves synthetic handles to exactly one owning tab at workspace scale', () => {
    expect(planMobileTerminalTabMount(state(200), { worktreeId: 'wt', ptyId: 'wt@@173' })).toEqual({
      worktreeId: 'wt',
      tabIds: ['tab-173']
    })
  })

  it('does not mount the whole worktree when a stale pty id has no owner', () => {
    expect(
      planMobileTerminalTabMount(state(200), { worktreeId: 'wt', ptyId: 'wt@@missing' })
    ).toBeNull()
  })
})
