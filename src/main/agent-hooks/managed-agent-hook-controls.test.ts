import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { installCodex, installClaude, removeCodex, removeClaude, statusCodex, statusClaude } =
  vi.hoisted(() => ({
    installCodex: vi.fn(),
    installClaude: vi.fn(),
    removeCodex: vi.fn(),
    removeClaude: vi.fn(),
    statusCodex: vi.fn(),
    statusClaude: vi.fn()
  }))

const { detectLocalManagedAgentCliPresenceMock } = vi.hoisted(() => ({
  detectLocalManagedAgentCliPresenceMock: vi.fn()
}))

vi.mock('./managed-agent-hook-manifest', () => ({
  MANAGED_AGENT_HOOK_MANIFEST: [
    {
      target: { agent: 'codex', tuiAgent: 'codex', executableCandidates: ['codex'] },
      install: installCodex,
      remove: removeCodex,
      getStatus: statusCodex
    },
    {
      target: { agent: 'claude', tuiAgent: 'claude', executableCandidates: ['claude'] },
      install: installClaude,
      remove: removeClaude,
      getStatus: statusClaude
    }
  ]
}))

vi.mock('./local-agent-cli-presence', () => ({
  detectLocalManagedAgentCliPresence: detectLocalManagedAgentCliPresenceMock
}))

vi.mock('../telemetry/client', () => ({ track: vi.fn() }))

import {
  applyAgentStatusHooksEnabled,
  getManagedAgentHookStatuses,
  installManagedAgentHooks,
  removeManagedAgentHooks
} from './managed-agent-hook-controls'

describe('managed agent hook controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Fail-open paths log to console.error on install failure; keep test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    installCodex.mockReturnValue({
      agent: 'codex',
      state: 'installed',
      configPath: '/codex',
      managedHooksPresent: true,
      detail: null
    })
    installClaude.mockReturnValue({
      agent: 'claude',
      state: 'installed',
      configPath: '/claude',
      managedHooksPresent: true,
      detail: null
    })
    removeCodex.mockReturnValue({
      agent: 'codex',
      state: 'not_installed',
      configPath: '/codex',
      managedHooksPresent: false,
      detail: null
    })
    removeClaude.mockReturnValue({
      agent: 'claude',
      state: 'not_installed',
      configPath: '/claude',
      managedHooksPresent: false,
      detail: null
    })
    statusCodex.mockReturnValue({
      agent: 'codex',
      state: 'installed',
      configPath: '/codex',
      managedHooksPresent: true,
      detail: null
    })
    statusClaude.mockReturnValue({
      agent: 'claude',
      state: 'not_installed',
      configPath: '/claude',
      managedHooksPresent: false,
      detail: null
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('installs only agents with launchable CLIs and returns skipped attempt results', async () => {
    detectLocalManagedAgentCliPresenceMock.mockResolvedValue({
      codex: { state: 'found' },
      claude: { state: 'missing' }
    })

    const results = await installManagedAgentHooks({ agentCmdOverrides: {} })

    expect(installCodex).toHaveBeenCalledTimes(1)
    expect(installClaude).not.toHaveBeenCalled()
    expect(results).toEqual([
      expect.objectContaining({ agent: 'codex', state: 'installed' }),
      expect.objectContaining({
        agent: 'claude',
        state: 'skipped',
        skipReason: 'cli_not_found'
      })
    ])
  })

  it('does not install if hooks are disabled while CLI presence detection is in flight', async () => {
    detectLocalManagedAgentCliPresenceMock.mockResolvedValue({
      codex: { state: 'found' },
      claude: { state: 'found' }
    })

    const results = await installManagedAgentHooks(
      { agentCmdOverrides: {} },
      { shouldContinue: () => false }
    )

    expect(installCodex).not.toHaveBeenCalled()
    expect(installClaude).not.toHaveBeenCalled()
    expect(results).toEqual([
      expect.objectContaining({
        agent: 'codex',
        state: 'skipped',
        skipReason: 'hooks_disabled'
      }),
      expect.objectContaining({
        agent: 'claude',
        state: 'skipped',
        skipReason: 'hooks_disabled'
      })
    ])
  })

  it('can gate a single launch-prep agent without installing other found CLIs', async () => {
    detectLocalManagedAgentCliPresenceMock.mockResolvedValue({
      codex: { state: 'found' }
    })

    const results = await installManagedAgentHooks({ agentCmdOverrides: {} }, { agents: ['codex'] })

    expect(detectLocalManagedAgentCliPresenceMock).toHaveBeenCalledWith(
      [expect.objectContaining({ agent: 'codex' })],
      { agentCmdOverrides: {} },
      { shouldHydrateShellPath: undefined }
    )
    expect(installCodex).toHaveBeenCalledTimes(1)
    expect(installClaude).not.toHaveBeenCalled()
    expect(results).toEqual([expect.objectContaining({ agent: 'codex', state: 'installed' })])
  })

  it('is fail-open: an installer that throws still runs the others and reports an error status', async () => {
    detectLocalManagedAgentCliPresenceMock.mockResolvedValue({
      codex: { state: 'found' },
      claude: { state: 'found' }
    })
    installCodex.mockImplementation(() => {
      throw new Error('codex config malformed')
    })
    const onInstallError = vi.fn()

    const results = await installManagedAgentHooks({ agentCmdOverrides: {} }, { onInstallError })

    expect(installClaude).toHaveBeenCalledTimes(1)
    expect(onInstallError).toHaveBeenCalledWith('codex', expect.any(Error))
    expect(results).toEqual([
      expect.objectContaining({ agent: 'codex', state: 'error', detail: 'codex config malformed' }),
      expect.objectContaining({ agent: 'claude', state: 'installed' })
    ])
  })

  it('keeps installing later agents even when the error recorder itself throws', async () => {
    detectLocalManagedAgentCliPresenceMock.mockResolvedValue({
      codex: { state: 'found' },
      claude: { state: 'found' }
    })
    installCodex.mockImplementation(() => {
      throw new Error('codex failed')
    })
    const onInstallError = vi.fn(() => {
      throw new Error('telemetry blew up')
    })

    await expect(
      installManagedAgentHooks({ agentCmdOverrides: {} }, { onInstallError })
    ).resolves.toEqual([
      expect.objectContaining({ agent: 'codex', state: 'error' }),
      expect.objectContaining({ agent: 'claude', state: 'installed' })
    ])
    expect(installClaude).toHaveBeenCalledTimes(1)
  })

  it('keeps status reads config-authoritative instead of returning skipped states', () => {
    expect(getManagedAgentHookStatuses()).toEqual([
      expect.objectContaining({ agent: 'codex', state: 'installed' }),
      expect.objectContaining({ agent: 'claude', state: 'not_installed' })
    ])
  })

  it('removes all managed hooks without CLI presence gating', async () => {
    const results = await applyAgentStatusHooksEnabled(false, { agentCmdOverrides: {} })
    expect(removeCodex).toHaveBeenCalledTimes(1)
    expect(removeClaude).toHaveBeenCalledTimes(1)
    expect(detectLocalManagedAgentCliPresenceMock).not.toHaveBeenCalled()
    expect(results).toHaveLength(2)
  })

  it('exposes the ungated remover directly', () => {
    removeManagedAgentHooks()
    expect(removeCodex).toHaveBeenCalledTimes(1)
    expect(removeClaude).toHaveBeenCalledTimes(1)
  })
})
