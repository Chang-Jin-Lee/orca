import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { watchForPromptEcho } from './prompt-echo-wait'

const mocks = vi.hoisted(() => ({
  subscribeToPtyData: vi.fn(),
  isRemoteRuntimePtyId: vi.fn(),
  subscribeToRuntimeTerminalData: vi.fn()
}))

vi.mock('@/components/terminal-pane/pty-data-sidecar-subscriptions', () => ({
  subscribeToPtyData: mocks.subscribeToPtyData
}))
vi.mock('@/runtime/runtime-terminal-inspection', () => ({
  isRemoteRuntimePtyId: mocks.isRemoteRuntimePtyId
}))
vi.mock('@/runtime/runtime-terminal-stream', () => ({
  subscribeToRuntimeTerminalData: mocks.subscribeToRuntimeTerminalData
}))

const PROMPT =
  'Resolve the current merge conflicts UNIQUEMARKER7466 and report the final git status.'
// Real codex composer echo: every word placed by a CSI cursor move.
const ECHO =
  '\x1b[11;3H\x1b[22mResolve\x1b[11;11Hthe\x1b[11;15Hcurrent\x1b[11;23Hmerge\x1b[11;29Hconflicts\x1b[11;39HUNIQUEMARKER7466'

async function flushMicrotasks(iterations = 4): Promise<void> {
  for (let index = 0; index < iterations; index += 1) {
    await Promise.resolve()
  }
}

describe('watchForPromptEcho', () => {
  let localObserver: ((data: string) => void) | null
  let unsubscribe: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('window', {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout
    })
    localObserver = null
    unsubscribe = vi.fn()
    mocks.subscribeToPtyData.mockReset()
    mocks.subscribeToPtyData.mockImplementation((_ptyId: string, observer: (d: string) => void) => {
      localObserver = observer
      return unsubscribe
    })
    mocks.isRemoteRuntimePtyId.mockReset()
    mocks.isRemoteRuntimePtyId.mockReturnValue(false)
    mocks.subscribeToRuntimeTerminalData.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('resolves true and unsubscribes once the pasted content renders (local)', async () => {
    const watch = watchForPromptEcho('pty-1', PROMPT, 10_000, {})
    localObserver?.(ECHO)
    await expect(watch.result).resolves.toBe(true)
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('resolves false and unsubscribes on timeout with no echo (local)', async () => {
    const watch = watchForPromptEcho('pty-1', PROMPT, 10_000, {})
    localObserver?.('\x1b[2;2H\x1b[K') // redraw only, no pasted characters
    await vi.advanceTimersByTimeAsync(10_000)
    await expect(watch.result).resolves.toBe(false)
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('resolves false and unsubscribes when cancelled', async () => {
    const watch = watchForPromptEcho('pty-1', PROMPT, 10_000, {})
    watch.cancel()
    await expect(watch.result).resolves.toBe(false)
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('does not fire a late timer after the echo already resolved (local)', async () => {
    const watch = watchForPromptEcho('pty-1', PROMPT, 10_000, {})
    localObserver?.(ECHO)
    await expect(watch.result).resolves.toBe(true)
    // Advancing past the deadline must not flip or re-settle the result.
    await vi.advanceTimersByTimeAsync(10_000)
    await expect(watch.result).resolves.toBe(true)
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  describe('remote runtime transport', () => {
    let remoteObserver: ((data: string) => void) | null
    let remoteUnsubscribe: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mocks.isRemoteRuntimePtyId.mockReturnValue(true)
      remoteObserver = null
      remoteUnsubscribe = vi.fn()
    })

    it('subscribes through the host stream and resolves true on echo', async () => {
      mocks.subscribeToRuntimeTerminalData.mockImplementation(
        (_settings, _ptyId, _label, observer: (d: string) => void) => {
          remoteObserver = observer
          return Promise.resolve(remoteUnsubscribe)
        }
      )
      const watch = watchForPromptEcho('remote-pty', PROMPT, 10_000, {})
      await flushMicrotasks()
      // The echo watch must opt out of the pre-paste buffer snapshot (#7466),
      // or a swallow screen already on the terminal could falsely verify.
      expect(mocks.subscribeToRuntimeTerminalData).toHaveBeenCalledWith(
        expect.anything(),
        'remote-pty',
        expect.any(String),
        expect.any(Function),
        { includeSnapshot: false }
      )
      remoteObserver?.(ECHO)
      await expect(watch.result).resolves.toBe(true)
      expect(remoteUnsubscribe).toHaveBeenCalledTimes(1)
    })

    it('disposes a subscription that resolves after the watch already settled', async () => {
      let resolveSubscribe!: (u: ReturnType<typeof vi.fn>) => void
      const pending = new Promise<ReturnType<typeof vi.fn>>((resolve) => {
        resolveSubscribe = resolve
      })
      mocks.subscribeToRuntimeTerminalData.mockImplementation(
        (_settings, _ptyId, _label, observer: (d: string) => void) => {
          remoteObserver = observer
          return pending
        }
      )
      const watch = watchForPromptEcho('remote-pty', PROMPT, 10_000, {})
      watch.cancel()
      await expect(watch.result).resolves.toBe(false)
      // The subscription attaches only now — it must be torn down, not leaked.
      resolveSubscribe(remoteUnsubscribe)
      await flushMicrotasks()
      expect(remoteUnsubscribe).toHaveBeenCalledTimes(1)
    })

    it('resolves false when the remote subscription rejects', async () => {
      mocks.subscribeToRuntimeTerminalData.mockRejectedValue(new Error('closed'))
      const watch = watchForPromptEcho('remote-pty', PROMPT, 10_000, {})
      await flushMicrotasks()
      await expect(watch.result).resolves.toBe(false)
    })
  })
})
