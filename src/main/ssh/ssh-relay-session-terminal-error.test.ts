import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SshRelaySession } from './ssh-relay-session'
import type { SshConnection } from './ssh-connection'
import type { Store } from '../persistence'
import type { SshPortForwardManager } from './ssh-port-forward'
import { RelayVersionMismatchError } from './ssh-relay-version-mismatch-error'
import type { BrowserWindow } from 'electron'

vi.mock('./ssh-relay-deploy', () => ({
  deployAndLaunchRelay: vi.fn()
}))

vi.mock('./ssh-channel-multiplexer', () => {
  return {
    SshChannelMultiplexer: class MockSshChannelMultiplexer {
      notify = vi.fn()
      request = vi.fn().mockResolvedValue([])
      onNotification = vi.fn().mockReturnValue(() => {})
      onRequest = vi.fn().mockReturnValue(() => {})
      onDispose = vi.fn().mockReturnValue(() => {})
      dispose = vi.fn()
      isDisposed = vi.fn().mockReturnValue(false)
    }
  }
})

vi.mock('../providers/ssh-pty-provider', () => ({
  isSshPtyNotFoundError: (err: unknown) =>
    (err instanceof Error ? err.message : String(err)).includes('not found'),
  SshPtyProvider: class MockSshPtyProvider {
    onData = vi.fn().mockReturnValue(() => {})
    onReplay = vi.fn().mockReturnValue(() => {})
    onExit = vi.fn().mockReturnValue(() => {})
    attach = vi.fn().mockResolvedValue(undefined)
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
    attach: vi.fn().mockResolvedValue(undefined)
  }),
  getPtyIdsForConnection: vi.fn().mockReturnValue([]),
  clearPtyOwnershipForConnection: vi.fn(),
  clearProviderPtyState: vi.fn(),
  deletePtyOwnership: vi.fn(),
  releasePendingSshShutdown: vi.fn(),
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

function createMockDeps(): {
  mockConn: SshConnection
  mockStore: Store
  mockPortForward: SshPortForwardManager
  getMainWindow: () => BrowserWindow | null
  mockWindow: BrowserWindow
} {
  const mockConn = {} as SshConnection
  const mockStore = {
    getRepos: vi.fn().mockReturnValue([]),
    getSshRemotePtyLeases: vi.fn().mockReturnValue([]),
    markSshRemotePtyLease: vi.fn(),
    markSshRemotePtyLeases: vi.fn()
  } as unknown as Store
  const mockPortForward = {
    removeAllForwards: vi.fn()
  } as unknown as SshPortForwardManager
  const mockWindow = {
    isDestroyed: (): boolean => false,
    webContents: { send: vi.fn() }
  } as unknown as BrowserWindow
  const getMainWindow = vi.fn().mockReturnValue(mockWindow) as unknown as () => BrowserWindow | null
  return { mockConn, mockStore, mockPortForward, getMainWindow, mockWindow }
}

function mockDeploySuccess(): void {
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

describe('SshRelaySession terminal relay error (RelayVersionMismatchError)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeploySuccess()
  })

  it('fires onTerminalRelayError on initial establish() and rethrows', async () => {
    const { mockConn, mockStore, mockPortForward, getMainWindow } = createMockDeps()
    const session = new SshRelaySession('target-1', getMainWindow, mockStore, mockPortForward)
    const onTerminal = vi.fn()
    const onLost = vi.fn()
    session.setOnTerminalRelayError(onTerminal)
    session.setOnRelayLost(onLost)

    const mismatchErr = new RelayVersionMismatchError(
      '0.1.0+aaa',
      '0.1.0+bbb',
      '[relay-connect] Handshake mismatch...'
    )
    vi.mocked(deployAndLaunchRelay).mockRejectedValueOnce(mismatchErr)

    await expect(session.establish(mockConn)).rejects.toBe(mismatchErr)
    expect(onTerminal).toHaveBeenCalledTimes(1)
    expect(onTerminal).toHaveBeenCalledWith('target-1', mismatchErr)
    expect(onLost).not.toHaveBeenCalled()
    expect(session.getState()).toBe('idle')
  })

  it('does NOT fire onTerminalRelayError on a generic establish failure', async () => {
    const { mockConn, mockStore, mockPortForward, getMainWindow } = createMockDeps()
    const session = new SshRelaySession('target-1', getMainWindow, mockStore, mockPortForward)
    const onTerminal = vi.fn()
    session.setOnTerminalRelayError(onTerminal)

    vi.mocked(deployAndLaunchRelay).mockRejectedValueOnce(new Error('boom'))

    await expect(session.establish(mockConn)).rejects.toThrow('boom')
    expect(onTerminal).not.toHaveBeenCalled()
    expect(session.getState()).toBe('idle')
  })

  it('fires onTerminalRelayError on reconnect() when deploy throws RelayVersionMismatchError', async () => {
    const { mockConn, mockStore, mockPortForward, getMainWindow } = createMockDeps()
    const session = new SshRelaySession('target-1', getMainWindow, mockStore, mockPortForward)
    const onTerminal = vi.fn()
    session.setOnTerminalRelayError(onTerminal)

    await session.establish(mockConn)
    expect(session.getState()).toBe('ready')

    const mismatchErr = new RelayVersionMismatchError('0.1.0+old', '0.1.0+new', '')
    vi.mocked(deployAndLaunchRelay).mockRejectedValueOnce(mismatchErr)

    await session.reconnect(mockConn)
    expect(onTerminal).toHaveBeenCalledTimes(1)
    expect(onTerminal).toHaveBeenCalledWith('target-1', mismatchErr)
    expect(session.getState()).toBe('idle')
  })

  it('delivers PTY exit when durable lease persistence throws', async () => {
    const { mockConn, mockStore, mockPortForward, getMainWindow, mockWindow } = createMockDeps()
    const runtime = { onPtyExit: vi.fn() }
    vi.mocked(mockStore.markSshRemotePtyLease).mockImplementation(() => {
      throw new Error('lease disk full')
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const session = new SshRelaySession(
      'target-1',
      getMainWindow,
      mockStore,
      mockPortForward,
      runtime as never
    )
    await session.establish(mockConn)
    const { registerSshPtyProvider } = await import('../ipc/pty')
    const ptyProvider = vi.mocked(registerSshPtyProvider).mock.calls[0]?.[1] as unknown as {
      onExit: ReturnType<typeof vi.fn>
    }
    const onExit = ptyProvider.onExit.mock.calls[0]?.[0] as (payload: {
      id: string
      code: number
    }) => void

    expect(() => onExit({ id: 'ssh-pty-1', code: 0 })).not.toThrow()
    expect(runtime.onPtyExit).toHaveBeenCalledWith('ssh-pty-1', 0)
    expect(mockWindow.webContents.send).toHaveBeenCalledWith('pty:exit', {
      id: 'ssh-pty-1',
      code: 0
    })
  })
})
