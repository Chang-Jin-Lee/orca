/**
 * STA-1840: a mobile terminal.subscribe to a tab the desktop never mounted this
 * session resolves a ptyId (from the persisted layout graph) but the runtime
 * has no headless emulator for it, so the snapshot is empty and the terminal
 * renders blank. The subscribe now asks the renderer to background-mount the tab
 * when the snapshot comes back empty. These tests pin that the mount request
 * fires on an empty snapshot and stays quiet when the snapshot has content.
 */
import { describe, expect, it, vi } from 'vitest'
import { RpcDispatcher } from './dispatcher'
import type { RpcRequest } from './core'
import type { OrcaRuntimeService } from '../orca-runtime'
import { TERMINAL_METHODS } from './methods/terminal'
import type { RuntimeTerminalWait } from '../../../shared/runtime-types'

function stubRuntime(overrides: Partial<OrcaRuntimeService> = {}): OrcaRuntimeService {
  return {
    getRuntimeId: () => 'test-runtime',
    registerRemoteTerminalViewSubscriber: () => () => {},
    requestRendererTerminalTabMount: () => {},
    ...overrides
  } as OrcaRuntimeService
}

const makeRequest = (method: string, params?: unknown): RpcRequest => ({
  id: 'req-1',
  authToken: 'tok',
  method,
  params
})

describe('terminal.subscribe blank-tab background mount', () => {
  it('requests a renderer tab mount when a mobile subscribe resolves a ptyId but the snapshot is empty', async () => {
    // Why: STA-1840 blank path — the handle resolves a ptyId but the desktop
    // never mounted the tab this session, so there is no headless emulator and
    // serialize is empty. The subscribe must ask the renderer to background-mount
    // the tab so the PTY attaches and the live stream fills it.
    const cleanups = new Map<string, () => void>()
    const requestRendererTerminalTabMount = vi.fn()
    const runtime = stubRuntime({
      resolveLeafForHandle: vi.fn().mockReturnValue({ ptyId: 'pty-1' }),
      requestRendererTerminalTabMount,
      handleMobileSubscribe: vi.fn().mockResolvedValue(true),
      handleMobileUnsubscribe: vi.fn(),
      subscribeToTerminalData: vi.fn().mockReturnValue(vi.fn()),
      // Empty snapshot: no headless emulator for a never-attached PTY.
      readTerminal: vi.fn().mockResolvedValue({ tail: [], truncated: false }),
      serializeTerminalBuffer: vi.fn().mockResolvedValue(null),
      getTerminalSize: vi.fn().mockReturnValue({ cols: 80, rows: 24 }),
      getMobileDisplayMode: vi.fn().mockReturnValue('auto'),
      getLayout: vi.fn().mockReturnValue({ seq: 1 }),
      isTerminalAlternateScreen: vi.fn().mockReturnValue(false),
      subscribeToTerminalResize: vi.fn().mockReturnValue(vi.fn()),
      subscribeToFitOverrideChanges: vi.fn().mockReturnValue(vi.fn()),
      registerSubscriptionCleanup: vi.fn((id: string, cleanup: () => void) => {
        cleanups.set(id, cleanup)
      }),
      cleanupSubscription: vi.fn((id: string) => {
        cleanups.get(id)?.()
        cleanups.delete(id)
      }),
      waitForTerminal: vi.fn(() => new Promise<RuntimeTerminalWait>(() => {}))
    })
    const dispatcher = new RpcDispatcher({ runtime, methods: TERMINAL_METHODS })

    const dispatchPromise = dispatcher.dispatchStreaming(
      makeRequest('terminal.subscribe', {
        terminal: 'terminal-1',
        client: { id: 'phone-1', type: 'mobile' },
        capabilities: { terminalBinaryStream: 1 }
      }),
      vi.fn(),
      {
        connectionId: 'conn-phone',
        sendBinary: vi.fn(),
        registerBinaryStreamHandler: vi.fn(() => vi.fn())
      }
    )

    await vi.waitFor(() =>
      expect(requestRendererTerminalTabMount).toHaveBeenCalledWith('terminal-1')
    )

    runtime.cleanupSubscription('terminal-1:phone-1')
    await dispatchPromise
  })

  it('does not request a renderer tab mount when the mobile snapshot has content', async () => {
    const cleanups = new Map<string, () => void>()
    const requestRendererTerminalTabMount = vi.fn()
    const runtime = stubRuntime({
      resolveLeafForHandle: vi.fn().mockReturnValue({ ptyId: 'pty-1' }),
      requestRendererTerminalTabMount,
      handleMobileSubscribe: vi.fn().mockResolvedValue(true),
      handleMobileUnsubscribe: vi.fn(),
      subscribeToTerminalData: vi.fn().mockReturnValue(vi.fn()),
      readTerminal: vi.fn().mockResolvedValue({ tail: [], truncated: false }),
      serializeTerminalBuffer: vi
        .fn()
        .mockResolvedValue({ data: 'live content', cols: 80, rows: 24, seq: 4 }),
      getTerminalSize: vi.fn().mockReturnValue({ cols: 80, rows: 24 }),
      getMobileDisplayMode: vi.fn().mockReturnValue('auto'),
      getLayout: vi.fn().mockReturnValue({ seq: 1 }),
      isTerminalAlternateScreen: vi.fn().mockReturnValue(false),
      subscribeToTerminalResize: vi.fn().mockReturnValue(vi.fn()),
      subscribeToFitOverrideChanges: vi.fn().mockReturnValue(vi.fn()),
      registerSubscriptionCleanup: vi.fn((id: string, cleanup: () => void) => {
        cleanups.set(id, cleanup)
      }),
      cleanupSubscription: vi.fn((id: string) => {
        cleanups.get(id)?.()
        cleanups.delete(id)
      }),
      waitForTerminal: vi.fn(() => new Promise<RuntimeTerminalWait>(() => {}))
    })
    const dispatcher = new RpcDispatcher({ runtime, methods: TERMINAL_METHODS })

    const dispatchPromise = dispatcher.dispatchStreaming(
      makeRequest('terminal.subscribe', {
        terminal: 'terminal-1',
        client: { id: 'phone-1', type: 'mobile' },
        capabilities: { terminalBinaryStream: 1 }
      }),
      vi.fn(),
      {
        connectionId: 'conn-phone',
        sendBinary: vi.fn(),
        registerBinaryStreamHandler: vi.fn(() => vi.fn())
      }
    )

    await vi.waitFor(() => expect(runtime.handleMobileSubscribe).toHaveBeenCalled())
    expect(requestRendererTerminalTabMount).not.toHaveBeenCalled()

    runtime.cleanupSubscription('terminal-1:phone-1')
    await dispatchPromise
  })
})
