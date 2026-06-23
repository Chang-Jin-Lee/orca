import { describe, expect, it } from 'vitest'
import {
  buildTaskPageGitHubCloseUpdate,
  validateTaskPageGitHubDuplicateTarget
} from './task-page-github-status-actions'

describe('TaskPage GitHub status actions', () => {
  it('builds completed and not planned close updates', () => {
    expect(buildTaskPageGitHubCloseUpdate({ stateReason: 'completed' })).toEqual({
      state: 'closed',
      stateReason: 'completed'
    })
    expect(buildTaskPageGitHubCloseUpdate({ stateReason: 'not_planned' })).toEqual({
      state: 'closed',
      stateReason: 'not_planned'
    })
  })

  it('builds duplicate close updates with a target issue number', () => {
    expect(buildTaskPageGitHubCloseUpdate({ stateReason: 'duplicate', duplicateOf: 42 })).toEqual({
      state: 'closed',
      stateReason: 'duplicate',
      duplicateOf: 42
    })
  })

  it('validates duplicate targets before dispatch', () => {
    expect(validateTaskPageGitHubDuplicateTarget('', 12).ok).toBe(false)
    expect(validateTaskPageGitHubDuplicateTarget('12', 12).ok).toBe(false)
    expect(validateTaskPageGitHubDuplicateTarget('12.5', 12).ok).toBe(false)
    expect(validateTaskPageGitHubDuplicateTarget('-1', 12).ok).toBe(false)
    expect(validateTaskPageGitHubDuplicateTarget('0', 12).ok).toBe(false)
    expect(validateTaskPageGitHubDuplicateTarget('  34 ', 12)).toEqual({
      ok: true,
      duplicateOf: 34
    })
  })
})
