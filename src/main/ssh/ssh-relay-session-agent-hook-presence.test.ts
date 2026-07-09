import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SshRelaySession } from './ssh-relay-session'
import type { SshConnection } from './ssh-connection'
import type { Store } from '../persistence'
import type { SshPortForwardManager } from './ssh-port-forward'
import { AGENT_HOOK_INSTALL_PLUGINS_METHOD } from '../../shared/agent-hook-relay'
import { REMOTE_AGENT_HOOK_CLI_PRESENCE_METHOD } from '../../shared/managed-agent-hook-targets'

const { muxRequestMock, installRemoteManagedAgentHooksMock } = vi.hoisted(() => ({
  muxRequestMock: vi.fn(),
  installRemoteManagedAgentHooksMock: vi.fn()
}))

vi.mock('./ssh-relay-deploy', () => ({
  deployAndLaunchRelay: vi.fn()
}))

vi.mock('./ssh-relay-deploy-helpers', () => ({
  execCommand: vi.fn().mockResolvedValue('')
}))

vi.mock('./ssh-channel-multiplexer', () => {
  return {
    SshChannelMultiplexer: class MockSshChannelMultiplexer {
      notify = vi.fn()
      request = muxRequestMock
      onNotification = vi.fn().mockReturnValue(() => {})
      onRequest = vi.fn().mockReturnValue(() => {})
      onDispose = vi.fn().mockReturnValue(() => {})
      dispose = vi.fn()
      isDisposed = vi.fn().mockReturnValue(false)
    }
  }
})

vi.mock('../agent-hooks/remote-managed-hook-installers', () => ({
  installRemoteManagedAgentHooks: installRemoteManagedAgentHooksMock,
  hasRemoteManagedHookInstallCandidate: (
    presenceByAgent: Record<string, { state: 'found' | 'missing' | 'unknown' }>
  ) => Object.values(presenceByAgent).some((presence) => presence.state === 'found')
}))

vi.mock('../providers/ssh-pty-provider', () => ({
  isSshPtyNotFoundError: (err: unknown) =>
    (err instanceof Error ? err.message : String(err)).includes('not found'),
  isSshPtyIdentityMismatchError: (err: unknown) =>
    (err instanceof Error ? err.message : String(err)).includes('identity mismatch'),
  SshPtyProvider: class MockSshPtyProvider {
    onData = vi.fn().mockReturnValue(() => {})
    onReplay = vi.fn().mockReturnValue(() => {})
    onExit = vi.fn().mockReturnValue(() => {})
    attach = vi.fn().mockResolvedValue(undefined)
    attachForReconnect = vi.fn().mockResolvedValue({})
    dispose = vi.fn()
  }
}))

vi.mock('../providers/ssh-filesystem-provider', () => ({
  SshFilesystemProvider: class MockSshFilesystemProvider {
    dispose = vi.fn()
  }
}))

vi.mock('../providers/ssh-git-provider', () => ({
  SshGitProvider: class MockSshGitProvider {}
}))

vi.mock('../ipc/pty', () => ({
  registerSshPtyProvider: vi.fn(),
  unregisterSshPtyProvider: vi.fn(),
  getSshPtyProvider: vi.fn().mockReturnValue({
    dispose: vi.fn(),
    attach: vi.fn().mockResolvedValue(undefined),
    attachForReconnect: vi.fn().mockResolvedValue({})
  }),
  getPtyIdsForConnection: vi.fn().mockReturnValue([]),
  clearPtyOwnershipForConnection: vi.fn(),
  clearProviderPtyState: vi.fn(),
  deletePtyOwnership: vi.fn(),
  setPtyOwnership: vi.fn(),
  answerStartupTerminalColorQueriesForPty: vi.fn((_id: string, data: string) => data)
}))

vi.mock('../providers/ssh-filesystem-dispatch', () => ({
  registerSshFilesystemProvider: vi.fn(),
  unregisterSshFilesystemProvider: vi.fn(),
  getSshFilesystemProvider: vi.fn().mockReturnValue({ dispose: vi.fn() })
}))

vi.mock('../providers/ssh-git-dispatch', () => ({
  registerSshGitProvider: vi.fn(),
  unregisterSshGitProvider: vi.fn()
}))

const { deployAndLaunchRelay } = await import('./ssh-relay-deploy')
const { getRemoteHostPlatform } = await import('./ssh-remote-platform')
const { registerSshPtyProvider, getPtyIdsForConnection } = await import('../ipc/pty')
const { registerSshFilesystemProvider } = await import('../providers/ssh-filesystem-dispatch')
const { registerSshGitProvider } = await import('../providers/ssh-git-dispatch')

function createMockDeps() {
  const mockConn = {} as SshConnection
  const mockStore = {
    getRepos: vi.fn().mockReturnValue([]),
    getSettings: vi.fn().mockReturnValue({ agentCmdOverrides: {} }),
    getSshRemotePtyLeases: vi.fn().mockReturnValue([]),
    markSshRemotePtyLease: vi.fn(),
    markSshRemotePtyLeases: vi.fn()
  } as unknown as Store
  const mockPortForward = {
    removeAllForwards: vi.fn()
  } as unknown as SshPortForwardManager
  const mockWindow = {
    isDestroyed: () => false,
    // Why: the port scanner visibility-gates its ticks; a visible mock window
    // keeps establish-path tests exercising the scan-on-ready behavior.
    isVisible: () => true,
    isMinimized: () => false,
    webContents: { send: vi.fn() }
  }
  const getMainWindow = vi.fn().mockReturnValue(mockWindow)
  return { mockConn, mockStore, mockPortForward, getMainWindow, mockWindow }
}

function mockDeploySuccess() {
  const mockTransport = {
    write: vi.fn(),
    onData: vi.fn(),
    onClose: vi.fn()
  }
  vi.mocked(deployAndLaunchRelay).mockResolvedValue({
    transport: mockTransport,
    platform: 'linux-x64'
  })
}

describe('SshRelaySession remote managed hook presence gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.ORCA_FEATURE_REMOTE_AGENT_HOOKS
    muxRequestMock.mockReset()
    muxRequestMock.mockResolvedValue([])
    installRemoteManagedAgentHooksMock.mockReset()
    installRemoteManagedAgentHooksMock.mockResolvedValue([])
    mockDeploySuccess()
    vi.mocked(getPtyIdsForConnection).mockReturnValue([])
  })

  it('registers SSH providers before waiting on remote managed hook presence', async () => {
    process.env.ORCA_FEATURE_REMOTE_AGENT_HOOKS = '1'
    let resolvePresence!: (value: { presence: { claude: { state: 'found' } } }) => void
    const presencePromise = new Promise<{ presence: { claude: { state: 'found' } } }>((resolve) => {
      resolvePresence = resolve
    })
    muxRequestMock.mockImplementation(async (method: string) => {
      if (method === REMOTE_AGENT_HOOK_CLI_PRESENCE_METHOD) {
        return await presencePromise
      }
      if (method === 'session.resolveHome') {
        return { resolvedPath: '/home/orca' }
      }
      return { ok: true }
    })
    const sftp = { end: vi.fn() }
    const { mockStore, mockPortForward, getMainWindow } = createMockDeps()
    const mockConn = {
      sftp: vi.fn().mockResolvedValue(sftp)
    } as unknown as SshConnection
    const session = new SshRelaySession('target-1', getMainWindow, mockStore, mockPortForward)

    await session.establish(mockConn)

    const installPluginsCallIndex = muxRequestMock.mock.calls.findIndex(
      ([method]) => method === AGENT_HOOK_INSTALL_PLUGINS_METHOD
    )
    expect(installPluginsCallIndex).toBeGreaterThanOrEqual(0)
    const installPluginsParams = muxRequestMock.mock.calls[installPluginsCallIndex]?.[1]
    expect(installPluginsParams).toMatchObject({
      piExtensionSource: expect.stringContaining('/hook/pi'),
      ompExtensionSource: expect.stringContaining('/hook/omp')
    })
    expect(muxRequestMock).toHaveBeenCalledWith(
      REMOTE_AGENT_HOOK_CLI_PRESENCE_METHOD,
      expect.objectContaining({ agents: expect.arrayContaining(['claude', 'codex']) })
    )
    expect(registerSshPtyProvider).toHaveBeenCalledWith('target-1', expect.anything())
    expect(muxRequestMock.mock.invocationCallOrder[installPluginsCallIndex]).toBeLessThan(
      vi.mocked(registerSshPtyProvider).mock.invocationCallOrder[0]
    )
    expect(installRemoteManagedAgentHooksMock).not.toHaveBeenCalled()

    resolvePresence({ presence: { claude: { state: 'found' } } })
    await vi.waitFor(() => expect(installRemoteManagedAgentHooksMock).toHaveBeenCalledTimes(1))

    expect(mockConn.sftp).toHaveBeenCalledTimes(1)
    expect(installRemoteManagedAgentHooksMock).toHaveBeenCalledWith(sftp, '/home/orca', {
      claude: { state: 'found' }
    })
    expect(sftp.end).toHaveBeenCalledTimes(1)
  })

  it('does not mutate remote config when the session is disposed while SFTP opens', async () => {
    process.env.ORCA_FEATURE_REMOTE_AGENT_HOOKS = '1'
    let resolvePresence!: (value: { presence: { claude: { state: 'found' } } }) => void
    const presencePromise = new Promise<{ presence: { claude: { state: 'found' } } }>((resolve) => {
      resolvePresence = resolve
    })
    muxRequestMock.mockImplementation(async (method: string) => {
      if (method === REMOTE_AGENT_HOOK_CLI_PRESENCE_METHOD) {
        return await presencePromise
      }
      if (method === 'session.resolveHome') {
        return { resolvedPath: '/home/orca' }
      }
      return { ok: true }
    })
    const sftp = { end: vi.fn() }
    const { mockStore, mockPortForward, getMainWindow } = createMockDeps()
    let session!: SshRelaySession
    const mockConn = {
      sftp: vi.fn().mockImplementation(async () => {
        session.dispose()
        return sftp
      })
    } as unknown as SshConnection
    session = new SshRelaySession('target-1', getMainWindow, mockStore, mockPortForward)

    await session.establish(mockConn)
    resolvePresence({ presence: { claude: { state: 'found' } } })

    await vi.waitFor(() => expect(sftp.end).toHaveBeenCalledTimes(1))
    expect(installRemoteManagedAgentHooksMock).not.toHaveBeenCalled()
  })

  it('keeps SSH providers registered when remote CLI presence is unavailable', async () => {
    process.env.ORCA_FEATURE_REMOTE_AGENT_HOOKS = '1'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    muxRequestMock.mockImplementation(async (method: string) => {
      if (method === REMOTE_AGENT_HOOK_CLI_PRESENCE_METHOD) {
        throw new Error('method not found')
      }
      return { ok: true }
    })
    const { mockStore, mockPortForward, getMainWindow } = createMockDeps()
    const mockConn = {
      sftp: vi.fn()
    } as unknown as SshConnection
    const session = new SshRelaySession('target-1', getMainWindow, mockStore, mockPortForward)

    await session.establish(mockConn)
    await vi.waitFor(() =>
      expect(muxRequestMock).toHaveBeenCalledWith(
        REMOTE_AGENT_HOOK_CLI_PRESENCE_METHOD,
        expect.anything()
      )
    )

    expect(registerSshPtyProvider).toHaveBeenCalledWith('target-1', expect.anything())
    expect(registerSshFilesystemProvider).toHaveBeenCalledWith('target-1', expect.anything())
    expect(registerSshGitProvider).toHaveBeenCalledWith('target-1', expect.anything())
    expect(mockConn.sftp).not.toHaveBeenCalled()
    expect(installRemoteManagedAgentHooksMock).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('does not run POSIX managed hook installers on Windows remotes', async () => {
    process.env.ORCA_FEATURE_REMOTE_AGENT_HOOKS = '1'
    const { mockStore, mockPortForward, getMainWindow } = createMockDeps()
    const mockConn = {
      writeFile: vi.fn().mockResolvedValue(undefined)
    } as unknown as SshConnection
    vi.mocked(deployAndLaunchRelay).mockResolvedValueOnce({
      transport: {
        write: vi.fn(),
        onData: vi.fn(),
        onClose: vi.fn()
      },
      platform: 'win32-x64',
      hostPlatform: getRemoteHostPlatform('win32-x64'),
      remoteHome: 'C:/Users/me',
      remoteRelayDir: 'C:/Users/me/.orca-remote/relay-v1',
      nodePath: 'C:/Program Files/nodejs/node.exe',
      sockPath: '\\\\.\\pipe\\orca-relay-123'
    })
    const session = new SshRelaySession('target-1', getMainWindow, mockStore, mockPortForward)

    await session.establish(mockConn)

    expect(installRemoteManagedAgentHooksMock).not.toHaveBeenCalled()
    expect(
      muxRequestMock.mock.calls.some(([method]) => method === AGENT_HOOK_INSTALL_PLUGINS_METHOD)
    ).toBe(true)
  })

  it('does not open SFTP when remote CLI presence is all missing', async () => {
    process.env.ORCA_FEATURE_REMOTE_AGENT_HOOKS = '1'
    muxRequestMock.mockImplementation(async (method: string) => {
      if (method === REMOTE_AGENT_HOOK_CLI_PRESENCE_METHOD) {
        return { presence: { claude: { state: 'missing' }, codex: { state: 'unknown' } } }
      }
      if (method === 'session.resolveHome') {
        return { resolvedPath: '/home/orca' }
      }
      return { ok: true }
    })
    const { mockStore, mockPortForward, getMainWindow } = createMockDeps()
    const mockConn = {
      sftp: vi.fn()
    } as unknown as SshConnection
    const session = new SshRelaySession('target-1', getMainWindow, mockStore, mockPortForward)

    await session.establish(mockConn)

    expect(mockConn.sftp).not.toHaveBeenCalled()
    expect(installRemoteManagedAgentHooksMock).not.toHaveBeenCalled()
  })

  it('passes safe quoted override executable paths to remote CLI presence detection', async () => {
    process.env.ORCA_FEATURE_REMOTE_AGENT_HOOKS = '1'
    const overridePath = '/home/orca/AI Tools/codex'
    muxRequestMock.mockImplementation(async (method: string) => {
      if (method === REMOTE_AGENT_HOOK_CLI_PRESENCE_METHOD) {
        return { presence: { codex: { state: 'found' } } }
      }
      if (method === 'session.resolveHome') {
        return { resolvedPath: '/home/orca' }
      }
      return { ok: true }
    })
    const sftp = { end: vi.fn() }
    const { mockStore, mockPortForward, getMainWindow } = createMockDeps()
    vi.mocked(mockStore.getSettings).mockReturnValue({
      agentCmdOverrides: { codex: `"${overridePath}" --profile work` }
    } as never)
    const mockConn = {
      sftp: vi.fn().mockResolvedValue(sftp)
    } as unknown as SshConnection
    const session = new SshRelaySession('target-1', getMainWindow, mockStore, mockPortForward)

    await session.establish(mockConn)

    expect(muxRequestMock).toHaveBeenCalledWith(
      REMOTE_AGENT_HOOK_CLI_PRESENCE_METHOD,
      expect.objectContaining({
        overrideExecutableTokens: expect.objectContaining({ codex: overridePath })
      })
    )
    await vi.waitFor(() =>
      expect(installRemoteManagedAgentHooksMock).toHaveBeenCalledWith(sftp, '/home/orca', {
        codex: { state: 'found' }
      })
    )
  })
})
