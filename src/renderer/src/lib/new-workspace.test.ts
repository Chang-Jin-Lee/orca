import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockInspectRuntimeTerminalProcess,
  mockSendRuntimePtyInputVerified,
  mockPasteDraftWhenAgentReady,
  mockTrack,
  mockStoreSubscribers,
  store
} = vi.hoisted(() => ({
  mockInspectRuntimeTerminalProcess: vi.fn(),
  mockSendRuntimePtyInputVerified: vi.fn(),
  mockPasteDraftWhenAgentReady: vi.fn(),
  mockTrack: vi.fn(),
  mockStoreSubscribers: new Set<
    (state: {
      settings: Record<string, unknown>
      activeTabIdByWorktree: Record<string, string>
      tabsByWorktree: Record<string, { id: string }[]>
      ptyIdsByTabId: Record<string, string[]>
      terminalLayoutsByTabId: Record<
        string,
        { activeLeafId: string | null; ptyIdsByLeafId: Record<string, string> }
      >
      agentLaunchConfigByPaneKey: Record<
        string,
        {
          launchConfig: {
            agentCommand?: string
            agentArgs: string
            agentEnv: Record<string, string>
          }
          identity: { agentType?: string }
        }
      >
    }) => void
  >(),
  store: {
    settings: {},
    activeTabIdByWorktree: { 'wt-1': 'tab-1' } as Record<string, string>,
    tabsByWorktree: { 'wt-1': [{ id: 'tab-1' }] } as Record<string, { id: string }[]>,
    ptyIdsByTabId: { 'tab-1': ['pty-1'] } as Record<string, string[]>,
    terminalLayoutsByTabId: {
      'tab-1': {
        activeLeafId: '11111111-1111-4111-8111-111111111111',
        ptyIdsByLeafId: { '11111111-1111-4111-8111-111111111111': 'pty-1' }
      }
    } as Record<string, { activeLeafId: string | null; ptyIdsByLeafId: Record<string, string> }>,
    agentLaunchConfigByPaneKey: {
      'tab-1:11111111-1111-4111-8111-111111111111': {
        launchConfig: { agentCommand: 'codex', agentArgs: '', agentEnv: {} },
        identity: { agentType: 'codex' }
      }
    } as Record<
      string,
      {
        launchConfig: { agentCommand?: string; agentArgs: string; agentEnv: Record<string, string> }
        identity: { agentType?: string }
      }
    >
  }
}))

vi.mock('@/store', () => ({
  useAppStore: {
    getState: () => store,
    subscribe: (listener: (state: typeof store) => void) => {
      mockStoreSubscribers.add(listener)
      return () => {
        mockStoreSubscribers.delete(listener)
      }
    }
  }
}))

vi.mock('@/runtime/runtime-terminal-inspection', () => ({
  inspectRuntimeTerminalProcess: mockInspectRuntimeTerminalProcess,
  sendRuntimePtyInputVerified: mockSendRuntimePtyInputVerified
}))

vi.mock('@/lib/agent-paste-draft', () => ({
  pasteDraftWhenAgentReady: mockPasteDraftWhenAgentReady
}))

vi.mock('@/lib/telemetry', () => ({
  track: mockTrack
}))

import {
  ensureAgentStartupInTerminal,
  getSetupConfig,
  getWorkspaceSeedName,
  isGitLabIssueUrl
} from './new-workspace'

describe('getWorkspaceSeedName', () => {
  it('prefers an explicit name', () => {
    expect(
      getWorkspaceSeedName({
        explicitName: 'my-workspace',
        prompt: 'anything',
        linkedIssueNumber: null,
        linkedPR: null
      })
    ).toBe('my-workspace')
  })

  it('uses linked issue/PR when no explicit name is provided', () => {
    expect(
      getWorkspaceSeedName({
        explicitName: '',
        prompt: '',
        linkedIssueNumber: 7,
        linkedPR: null
      })
    ).toBe('issue-7')
    expect(
      getWorkspaceSeedName({
        explicitName: '',
        prompt: '',
        linkedIssueNumber: null,
        linkedPR: 42
      })
    ).toBe('pr-42')
  })

  it('slugifies and truncates very long prompts', () => {
    const longPrompt =
      'Investigate the flaky login regression on iOS where the session cookie is dropped after background refresh and users get bounced to the splash screen.'
    const seed = getWorkspaceSeedName({
      explicitName: '',
      prompt: longPrompt,
      linkedIssueNumber: null,
      linkedPR: null
    })
    expect(seed.length).toBeLessThanOrEqual(48)
    expect(seed).toMatch(/^[a-z0-9._-]+$/)
    expect(seed.startsWith('investigate-the-flaky-login')).toBe(true)
  })

  it('falls back to "workspace" when a prompt has no sluggable characters', () => {
    expect(
      getWorkspaceSeedName({
        explicitName: '',
        prompt: '🚀🚀🚀',
        linkedIssueNumber: null,
        linkedPR: null
      })
    ).toBe('workspace')
    expect(
      getWorkspaceSeedName({
        explicitName: '',
        prompt: '日本語だけ',
        linkedIssueNumber: null,
        linkedPR: null
      })
    ).toBe('workspace')
  })

  it('does not leave internal ".." in the slug (git refuses such branches)', () => {
    // Why: the original composer bug — a prompt containing "../../" in
    // relative path references slugified to a name with internal `..`,
    // which git rejects with "is not a valid branch name".
    const seed = getWorkspaceSeedName({
      explicitName: '',
      prompt: 'For ../../ the sibling worktree from another repo',
      linkedIssueNumber: null,
      linkedPR: null
    })
    expect(seed).not.toMatch(/\.{2,}/)
  })

  it('falls back to "workspace" for empty inputs', () => {
    expect(
      getWorkspaceSeedName({
        explicitName: '',
        prompt: '',
        linkedIssueNumber: null,
        linkedPR: null
      })
    ).toBe('workspace')
  })

  it('uses the fallback name when no other seed source is available', () => {
    expect(
      getWorkspaceSeedName({
        explicitName: '',
        prompt: '',
        linkedIssueNumber: null,
        linkedPR: null,
        fallbackName: 'Nautilus'
      })
    ).toBe('Nautilus')
  })

  it('prefers an explicit name over the fallback name', () => {
    expect(
      getWorkspaceSeedName({
        explicitName: 'my-workspace',
        prompt: '',
        linkedIssueNumber: null,
        linkedPR: null,
        fallbackName: 'Nautilus'
      })
    ).toBe('my-workspace')
  })
})

describe('isGitLabIssueUrl', () => {
  it('detects canonical and self-hosted GitLab issue URLs', () => {
    expect(isGitLabIssueUrl('https://gitlab.com/group/project/-/issues/123')).toBe(true)
    expect(isGitLabIssueUrl('https://gitlab.example.com/group/project/-/issues/123')).toBe(true)
  })

  it('does not classify GitHub issue URLs as GitLab issues', () => {
    expect(isGitLabIssueUrl('https://github.com/group/project/issues/123')).toBe(false)
  })
})

describe('ensureAgentStartupInTerminal prompt delivery', () => {
  function seedLaunchRegistry(args: {
    tabId?: string
    leafId?: string
    ptyId?: string
    agentType?: string
    agentCommand?: string
    agentArgs?: string
  }): void {
    const tabId = args.tabId ?? 'tab-1'
    const leafId = args.leafId ?? '11111111-1111-4111-8111-111111111111'
    const ptyId = args.ptyId ?? 'pty-1'
    const agentType = args.agentType ?? 'codex'
    const agentCommand = args.agentCommand ?? agentType
    const agentArgs = args.agentArgs ?? ''
    store.terminalLayoutsByTabId = {
      ...store.terminalLayoutsByTabId,
      [tabId]: { activeLeafId: leafId, ptyIdsByLeafId: { [leafId]: ptyId } }
    }
    store.agentLaunchConfigByPaneKey = {
      ...store.agentLaunchConfigByPaneKey,
      [`${tabId}:${leafId}`]: {
        launchConfig: { agentCommand, agentArgs, agentEnv: {} },
        identity: { agentType }
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreSubscribers.clear()
    store.settings = {}
    store.activeTabIdByWorktree = { 'wt-1': 'tab-1' }
    store.tabsByWorktree = { 'wt-1': [{ id: 'tab-1' }] }
    store.ptyIdsByTabId = { 'tab-1': ['pty-1'] }
    store.terminalLayoutsByTabId = {
      'tab-1': {
        activeLeafId: '11111111-1111-4111-8111-111111111111',
        ptyIdsByLeafId: { '11111111-1111-4111-8111-111111111111': 'pty-1' }
      }
    }
    store.agentLaunchConfigByPaneKey = {
      'tab-1:11111111-1111-4111-8111-111111111111': {
        launchConfig: { agentCommand: 'codex', agentArgs: '', agentEnv: {} },
        identity: { agentType: 'codex' }
      }
    }
    mockInspectRuntimeTerminalProcess.mockResolvedValue({
      foregroundProcess: 'aider',
      hasChildProcesses: true
    })
    mockSendRuntimePtyInputVerified.mockResolvedValue(true)
    mockPasteDraftWhenAgentReady.mockResolvedValue(true)
  })

  it('sends a follow-up prompt through the terminal runtime without renderer telemetry', async () => {
    seedLaunchRegistry({ agentType: 'aider' })
    await ensureAgentStartupInTerminal({
      worktreeId: 'wt-1',
      startup: {
        agent: 'aider',
        launchCommand: 'aider',
        expectedProcess: 'aider',
        followupPrompt: 'fix the spinner',
        launchConfig: { agentCommand: 'aider', agentArgs: '', agentEnv: {} }
      }
    })

    expect(mockSendRuntimePtyInputVerified).toHaveBeenCalledWith({}, 'pty-1', 'fix the spinner\r')
    expect(mockTrack).not.toHaveBeenCalledWith('agent_prompt_sent', expect.anything())
  })

  it('does not track when follow-up prompt delivery is rejected by the terminal runtime', async () => {
    seedLaunchRegistry({ agentType: 'aider' })
    mockSendRuntimePtyInputVerified.mockResolvedValue(false)

    await ensureAgentStartupInTerminal({
      worktreeId: 'wt-1',
      startup: {
        agent: 'aider',
        launchCommand: 'aider',
        expectedProcess: 'aider',
        followupPrompt: 'fix the spinner',
        launchConfig: { agentCommand: 'aider', agentArgs: '', agentEnv: {} }
      }
    })

    expect(mockTrack).not.toHaveBeenCalledWith('agent_prompt_sent', expect.anything())
  })

  it('does not track when follow-up prompt delivery rejects', async () => {
    seedLaunchRegistry({ agentType: 'aider' })
    mockSendRuntimePtyInputVerified.mockRejectedValue(new Error('runtime timeout'))

    await expect(
      ensureAgentStartupInTerminal({
        worktreeId: 'wt-1',
        startup: {
          agent: 'aider',
          launchCommand: 'aider',
          expectedProcess: 'aider',
          followupPrompt: 'fix the spinner',
          launchConfig: { agentCommand: 'aider', agentArgs: '', agentEnv: {} }
        }
      })
    ).resolves.toBeUndefined()

    expect(mockTrack).not.toHaveBeenCalledWith('agent_prompt_sent', expect.anything())
  })

  it('does not send a follow-up prompt before the agent owns the foreground process', async () => {
    seedLaunchRegistry({ agentType: 'aider' })
    vi.useFakeTimers()
    try {
      mockInspectRuntimeTerminalProcess.mockResolvedValue({
        foregroundProcess: 'zsh',
        hasChildProcesses: false
      })
      const delivery = ensureAgentStartupInTerminal({
        worktreeId: 'wt-1',
        startup: {
          agent: 'aider',
          launchCommand: 'aider',
          expectedProcess: 'aider',
          followupPrompt: 'fix the spinner',
          launchConfig: { agentCommand: 'aider', agentArgs: '', agentEnv: {} }
        }
      })

      await vi.advanceTimersByTimeAsync(30 * 150)
      await delivery

      expect(mockSendRuntimePtyInputVerified).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not track draft prompt delivery as a sent prompt', async () => {
    seedLaunchRegistry({ agentType: 'claude', agentCommand: 'claude' })
    await ensureAgentStartupInTerminal({
      worktreeId: 'wt-1',
      startup: {
        agent: 'claude',
        launchCommand: 'claude',
        expectedProcess: 'claude',
        followupPrompt: null,
        launchConfig: { agentCommand: 'claude', agentArgs: '', agentEnv: {} },
        draftPrompt: 'review this before sending'
      }
    })

    expect(mockPasteDraftWhenAgentReady).toHaveBeenCalledWith({
      tabId: 'tab-1',
      content: 'review this before sending',
      agent: 'claude',
      forcePaste: true
    })
    expect(mockTrack).not.toHaveBeenCalledWith('agent_prompt_sent', expect.anything())
  })

  it('pastes drafts into the activation primary tab when active tab state differs', async () => {
    store.activeTabIdByWorktree = { 'wt-1': 'setup-tab' }
    store.tabsByWorktree = { 'wt-1': [{ id: 'setup-tab' }, { id: 'agent-tab' }] }
    store.ptyIdsByTabId = { 'setup-tab': ['setup-pty'], 'agent-tab': ['agent-pty'] }
    store.terminalLayoutsByTabId = {
      'agent-tab': {
        activeLeafId: '22222222-2222-4222-8222-222222222222',
        ptyIdsByLeafId: { '22222222-2222-4222-8222-222222222222': 'agent-pty' }
      }
    }
    store.agentLaunchConfigByPaneKey = {}
    seedLaunchRegistry({
      tabId: 'agent-tab',
      leafId: '22222222-2222-4222-8222-222222222222',
      ptyId: 'agent-pty',
      agentType: 'codex'
    })

    await ensureAgentStartupInTerminal({
      worktreeId: 'wt-1',
      primaryTabId: 'agent-tab',
      startup: {
        agent: 'codex',
        launchCommand: 'codex',
        expectedProcess: 'codex',
        followupPrompt: null,
        launchConfig: { agentCommand: 'codex', agentArgs: '', agentEnv: {} },
        draftPrompt: 'Linear context draft'
      }
    })

    expect(mockPasteDraftWhenAgentReady).toHaveBeenCalledWith({
      tabId: 'agent-tab',
      content: 'Linear context draft',
      agent: 'codex',
      forcePaste: true
    })
  })

  it('delivers a queued draft prompt when a background terminal PTY appears later', async () => {
    vi.useFakeTimers()
    try {
      store.ptyIdsByTabId = {}
      store.terminalLayoutsByTabId = {
        'tab-1': { activeLeafId: '11111111-1111-4111-8111-111111111111', ptyIdsByLeafId: {} }
      }
      const delivery = ensureAgentStartupInTerminal({
        worktreeId: 'wt-1',
        primaryTabId: 'tab-1',
        startup: {
          agent: 'codex',
          launchCommand: 'codex',
          expectedProcess: 'codex',
          followupPrompt: null,
          launchConfig: { agentCommand: 'codex', agentArgs: '', agentEnv: {} },
          draftPrompt: 'queued Linear context'
        }
      })

      await vi.advanceTimersByTimeAsync(30 * 150)
      await delivery
      expect(mockPasteDraftWhenAgentReady).not.toHaveBeenCalled()

      store.ptyIdsByTabId = { 'tab-1': ['pty-late'] }
      store.terminalLayoutsByTabId = {
        'tab-1': {
          activeLeafId: '11111111-1111-4111-8111-111111111111',
          ptyIdsByLeafId: { '11111111-1111-4111-8111-111111111111': 'pty-late' }
        }
      }
      for (const listener of mockStoreSubscribers) {
        listener(store)
      }
      await Promise.resolve()

      expect(mockPasteDraftWhenAgentReady).toHaveBeenCalledWith({
        tabId: 'tab-1',
        content: 'queued Linear context',
        agent: 'codex',
        forcePaste: true
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('drops a queued draft prompt when the later pane launch no longer matches', async () => {
    vi.useFakeTimers()
    try {
      store.ptyIdsByTabId = {}
      store.terminalLayoutsByTabId = {
        'tab-1': { activeLeafId: '11111111-1111-4111-8111-111111111111', ptyIdsByLeafId: {} }
      }
      const delivery = ensureAgentStartupInTerminal({
        worktreeId: 'wt-1',
        primaryTabId: 'tab-1',
        startup: {
          agent: 'codex',
          launchCommand: 'codex',
          expectedProcess: 'codex',
          followupPrompt: null,
          launchConfig: { agentCommand: 'codex', agentArgs: '--old', agentEnv: {} },
          draftPrompt: 'stale Linear context'
        }
      })

      await vi.advanceTimersByTimeAsync(30 * 150)
      await delivery

      store.ptyIdsByTabId = { 'tab-1': ['pty-new'] }
      store.terminalLayoutsByTabId = {
        'tab-1': {
          activeLeafId: '11111111-1111-4111-8111-111111111111',
          ptyIdsByLeafId: { '11111111-1111-4111-8111-111111111111': 'pty-new' }
        }
      }
      store.agentLaunchConfigByPaneKey = {
        'tab-1:11111111-1111-4111-8111-111111111111': {
          launchConfig: { agentCommand: 'codex', agentArgs: '--new', agentEnv: {} },
          identity: { agentType: 'codex' }
        }
      }
      for (const listener of mockStoreSubscribers) {
        listener(store)
      }
      await Promise.resolve()

      expect(mockPasteDraftWhenAgentReady).not.toHaveBeenCalled()
      expect(mockStoreSubscribers.size).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('expires queued draft prompts before a much later matching pane appears', async () => {
    vi.useFakeTimers()
    try {
      store.ptyIdsByTabId = {}
      store.terminalLayoutsByTabId = {
        'tab-1': { activeLeafId: '11111111-1111-4111-8111-111111111111', ptyIdsByLeafId: {} }
      }
      const delivery = ensureAgentStartupInTerminal({
        worktreeId: 'wt-1',
        primaryTabId: 'tab-1',
        startup: {
          agent: 'codex',
          launchCommand: 'codex',
          expectedProcess: 'codex',
          followupPrompt: null,
          launchConfig: { agentCommand: 'codex', agentArgs: '', agentEnv: {} },
          draftPrompt: 'expired Linear context'
        }
      })

      await vi.advanceTimersByTimeAsync(30 * 150)
      await delivery
      await vi.advanceTimersByTimeAsync(60_000)

      store.ptyIdsByTabId = { 'tab-1': ['pty-later'] }
      store.terminalLayoutsByTabId = {
        'tab-1': {
          activeLeafId: '11111111-1111-4111-8111-111111111111',
          ptyIdsByLeafId: { '11111111-1111-4111-8111-111111111111': 'pty-later' }
        }
      }
      for (const listener of mockStoreSubscribers) {
        listener(store)
      }
      await Promise.resolve()

      expect(mockPasteDraftWhenAgentReady).not.toHaveBeenCalled()
      expect(mockStoreSubscribers.size).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('getSetupConfig', () => {
  it('treats default tab commands as setup-decision commands', () => {
    expect(
      getSetupConfig(undefined, {
        scripts: {},
        defaultTabs: [
          { title: 'Server', command: 'pnpm dev' },
          { title: 'Notes' },
          { command: 'codex' }
        ]
      })
    ).toEqual({
      source: 'yaml',
      kind: 'default-tabs',
      command: '# defaultTabs[1] Server\npnpm dev\n\n# defaultTabs[3]\ncodex'
    })
  })

  it('ignores shared default tab commands when command source is local-only', () => {
    expect(
      getSetupConfig(
        {
          hookSettings: {
            commandSourcePolicy: 'local-only',
            scripts: {}
          }
        },
        {
          scripts: {},
          defaultTabs: [{ title: 'Server', command: 'pnpm dev' }]
        }
      )
    ).toBeNull()
  })
})
