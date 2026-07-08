import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pasteDraftWhenAgentReady } from './agent-paste-draft'

const testState = vi.hoisted(() => ({
  appState: {
    settings: {},
    ptyIdsByTabId: { 'tab-1': ['pty-1'] } as Record<string, string[]>,
    runtimePaneTitlesByTabId: {},
    tabsByWorktree: {} as Record<string, { id: string; title?: string }[]>,
    repos: [] as { id: string; connectionId: string | null }[],
    worktreesByRepo: {} as Record<string, { id: string; repoId: string }[]>
  },
  ptyObserver: null as ((data: string) => void) | null,
  unsubscribe: vi.fn(),
  subscribeToPtyData: vi.fn(),
  isRemoteRuntimePtyId: vi.fn(),
  sendRuntimePtyInputVerified: vi.fn(),
  inspectRuntimeTerminalProcess: vi.fn(),
  subscribeToRuntimeTerminalData: vi.fn()
}))

vi.mock('@/store', () => ({
  useAppStore: { getState: () => testState.appState }
}))
vi.mock('@/components/terminal-pane/pty-data-sidecar-subscriptions', () => ({
  subscribeToPtyData: testState.subscribeToPtyData
}))
vi.mock('@/runtime/runtime-terminal-inspection', () => ({
  isRemoteRuntimePtyId: testState.isRemoteRuntimePtyId,
  sendRuntimePtyInputVerified: testState.sendRuntimePtyInputVerified,
  inspectRuntimeTerminalProcess: testState.inspectRuntimeTerminalProcess
}))
vi.mock('@/runtime/runtime-terminal-stream', () => ({
  subscribeToRuntimeTerminalData: testState.subscribeToRuntimeTerminalData
}))

const DECSET_BRACKETED_PASTE = '\x1b[?2004h'
const CODEX_COMPOSER_PROMPT_RENDER = '\x1b[1m›\x1b[0m Ask Codex to do anything'
const PROMPT =
  'Resolve the current merge conflicts UNIQUEMARKER7466 and report the final git status.'
// Real codex 0.143.0 composer echo: every word placed by a CSI cursor move.
const CODEX_VERBATIM_ECHO =
  '\x1b[11;3H\x1b[22mResolve\x1b[11;11Hthe\x1b[11;15Hcurrent\x1b[11;23Hmerge\x1b[11;29Hconflicts\x1b[11;39HUNIQUEMARKER7466'
// Real codex trust-screen redraw that swallowed a paste: clears rows, renders
// none of the pasted characters.
const TRUST_SCREEN_REDRAW = '\x1b[1;58H\x1b[0m\x1b[49m\x1b[K\x1b[2;2H\x1b[0m\x1b[49m\x1b[K'

async function flushMicrotasks(iterations = 4): Promise<void> {
  for (let index = 0; index < iterations; index += 1) {
    await Promise.resolve()
  }
}

describe('pasteDraftWhenAgentReady echo verification', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('window', {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout
    })
    testState.appState.ptyIdsByTabId = { 'tab-1': ['pty-1'] }
    testState.ptyObserver = null
    testState.unsubscribe.mockReset()
    testState.subscribeToPtyData.mockReset()
    testState.subscribeToPtyData.mockImplementation(
      (_ptyId: string, observer: (data: string) => void) => {
        testState.ptyObserver = observer
        return testState.unsubscribe
      }
    )
    testState.isRemoteRuntimePtyId.mockReset()
    testState.isRemoteRuntimePtyId.mockReturnValue(false)
    testState.sendRuntimePtyInputVerified.mockReset()
    testState.sendRuntimePtyInputVerified.mockResolvedValue(true)
    testState.inspectRuntimeTerminalProcess.mockReset()
    testState.inspectRuntimeTerminalProcess.mockResolvedValue(null)
    testState.subscribeToRuntimeTerminalData.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function startVerifiedPaste(onTimeout = vi.fn()): {
    promise: Promise<boolean>
    onTimeout: ReturnType<typeof vi.fn>
  } {
    const promise = pasteDraftWhenAgentReady({
      tabId: 'tab-1',
      content: PROMPT,
      agent: 'codex',
      submit: true,
      forcePaste: true,
      verifyEchoBeforeSubmit: true,
      onTimeout
    })
    return { promise, onTimeout }
  }

  it('submits only after the pasted content visibly renders', async () => {
    const { promise, onTimeout } = startVerifiedPaste()
    await flushMicrotasks()

    testState.ptyObserver?.(`${DECSET_BRACKETED_PASTE}${CODEX_COMPOSER_PROMPT_RENDER}`)
    await flushMicrotasks()

    // The paste is written, but the submit Enter is withheld pending the echo.
    expect(testState.sendRuntimePtyInputVerified).toHaveBeenCalledTimes(1)
    expect(testState.sendRuntimePtyInputVerified).toHaveBeenCalledWith(
      {},
      'pty-1',
      `\x1b[200~${PROMPT}\x1b[201~`
    )

    testState.ptyObserver?.(CODEX_VERBATIM_ECHO)
    await flushMicrotasks()
    await vi.advanceTimersByTimeAsync(50)

    await expect(promise).resolves.toBe(true)
    expect(testState.sendRuntimePtyInputVerified).toHaveBeenNthCalledWith(2, {}, 'pty-1', '\r')
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('withholds the Enter and reports echo-timeout when the paste never renders', async () => {
    const { promise, onTimeout } = startVerifiedPaste()
    await flushMicrotasks()

    testState.ptyObserver?.(`${DECSET_BRACKETED_PASTE}${CODEX_COMPOSER_PROMPT_RENDER}`)
    await flushMicrotasks()
    expect(testState.sendRuntimePtyInputVerified).toHaveBeenCalledTimes(1)

    // Trust/update screens only redraw; the pasted characters never render.
    testState.ptyObserver?.(TRUST_SCREEN_REDRAW)
    await vi.advanceTimersByTimeAsync(3000)

    await expect(promise).resolves.toBe(false)
    expect(testState.sendRuntimePtyInputVerified).toHaveBeenCalledTimes(1)
    expect(onTimeout).toHaveBeenCalledWith('echo-timeout')
  })

  it('reports a readiness-timeout reason when the agent never becomes ready', async () => {
    const { promise, onTimeout } = startVerifiedPaste()
    await flushMicrotasks()

    await vi.advanceTimersByTimeAsync(8000)
    await flushMicrotasks()
    await vi.advanceTimersByTimeAsync(1100)
    await flushMicrotasks()

    await expect(promise).resolves.toBe(false)
    expect(onTimeout).toHaveBeenCalledWith('readiness-timeout')
    expect(testState.sendRuntimePtyInputVerified).not.toHaveBeenCalled()
  })

  it('does not send the Enter when the paste write itself fails', async () => {
    testState.sendRuntimePtyInputVerified.mockResolvedValueOnce(false)
    const { promise, onTimeout } = startVerifiedPaste()
    await flushMicrotasks()

    testState.ptyObserver?.(`${DECSET_BRACKETED_PASTE}${CODEX_COMPOSER_PROMPT_RENDER}`)
    await flushMicrotasks()

    await expect(promise).resolves.toBe(false)
    expect(testState.sendRuntimePtyInputVerified).toHaveBeenCalledTimes(1)
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('keeps the single-phase flow when verification is not requested', async () => {
    const promise = pasteDraftWhenAgentReady({
      tabId: 'tab-1',
      content: PROMPT,
      agent: 'codex',
      submit: true,
      forcePaste: true
    })
    await flushMicrotasks()

    testState.ptyObserver?.(`${DECSET_BRACKETED_PASTE}${CODEX_COMPOSER_PROMPT_RENDER}`)
    await flushMicrotasks()
    await vi.advanceTimersByTimeAsync(50)

    await expect(promise).resolves.toBe(true)
    // Paste then Enter, with no echo gate in between.
    expect(testState.sendRuntimePtyInputVerified).toHaveBeenNthCalledWith(2, {}, 'pty-1', '\r')
  })
})
