// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import type { TerminalTab, WorkspaceSessionState } from '../../../shared/types'
import { AGENT_SESSION_CAPTURE_VERSION } from '../../../shared/agent-session-upgrade-notice'
import { notifyPreUpgradeAgentSessionLossIfNeeded } from './pre-upgrade-agent-session-loss-notice'

vi.mock('sonner', () => ({ toast: vi.fn() }))
vi.mock('@/i18n/i18n', () => ({ translate: (_key: string, fallback: string) => fallback }))

function session(overrides: Partial<WorkspaceSessionState> = {}): WorkspaceSessionState {
  return {
    activeRepoId: null,
    activeWorktreeId: null,
    activeTabId: null,
    tabsByWorktree: {},
    terminalLayoutsByTabId: {},
    ...overrides
  }
}

function agentTab(): TerminalTab {
  return {
    id: 'tab',
    ptyId: null,
    worktreeId: 'wt',
    title: 'Codex',
    customTitle: null,
    color: null,
    sortOrder: 0,
    createdAt: 1,
    launchAgent: 'codex'
  }
}

let patchWorkspaceSession: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  patchWorkspaceSession = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(window, 'api', {
    configurable: true,
    value: { session: { patch: patchWorkspaceSession } }
  })
})

describe('notifyPreUpgradeAgentSessionLossIfNeeded', () => {
  it('shows one idempotent notice and persists the consumed signal', () => {
    notifyPreUpgradeAgentSessionLossIfNeeded(session({ tabsByWorktree: { wt: [agentTab()] } }))

    expect(toast).toHaveBeenCalledTimes(1)
    expect(vi.mocked(toast).mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        id: 'pre-upgrade-agent-session-loss',
        duration: Infinity,
        dismissible: true
      })
    )
    expect(patchWorkspaceSession).toHaveBeenCalledWith({
      agentSessionCaptureVersion: AGENT_SESSION_CAPTURE_VERSION
    })
  })

  it('consumes an old session without alarming users who had no agent tab', () => {
    notifyPreUpgradeAgentSessionLossIfNeeded(session())

    expect(toast).not.toHaveBeenCalled()
    expect(patchWorkspaceSession).toHaveBeenCalledWith({
      agentSessionCaptureVersion: AGENT_SESSION_CAPTURE_VERSION
    })
  })

  it('does no work once the session carries the current stamp', () => {
    notifyPreUpgradeAgentSessionLossIfNeeded(
      session({ agentSessionCaptureVersion: AGENT_SESSION_CAPTURE_VERSION })
    )

    expect(toast).not.toHaveBeenCalled()
    expect(patchWorkspaceSession).not.toHaveBeenCalled()
  })
})
