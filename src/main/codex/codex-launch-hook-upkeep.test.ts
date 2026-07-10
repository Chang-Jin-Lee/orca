import { describe, expect, it } from 'vitest'
import type { AgentHookInstallState } from '../../shared/agent-hook-types'
import { codexLaunchNeedsDirectApprovalPromotion } from './codex-launch-hook-upkeep'

function status(state: AgentHookInstallState): { state: AgentHookInstallState } {
  return { state }
}

describe('codexLaunchNeedsDirectApprovalPromotion', () => {
  it('promotes directly when the managed install skipped codex (presence-gated out)', () => {
    // Regression: a false-'missing' PATH probe or relative override must not drop
    // #7896 approval promotion on a real Codex launch.
    expect(codexLaunchNeedsDirectApprovalPromotion(status('skipped'))).toBe(true)
  })

  it('promotes directly when no codex status came back at all', () => {
    expect(codexLaunchNeedsDirectApprovalPromotion(undefined)).toBe(true)
  })

  it.each<AgentHookInstallState>(['installed', 'partial', 'error', 'not_installed'])(
    'does not double-promote when install() already ran (state=%s)',
    (state) => {
      expect(codexLaunchNeedsDirectApprovalPromotion(status(state))).toBe(false)
    }
  )
})
