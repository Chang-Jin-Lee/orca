import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  _resetTerminalPaneRecoveryForTests,
  requestTerminalPaneRecovery
} from './terminal-pane-recovery'

const mocks = vi.hoisted(() => ({
  remountTerminalTabForRecovery: vi.fn<(tabId: string) => boolean>(() => true),
  recordRendererCrashBreadcrumb: vi.fn(),
  hasPty: vi.fn<(id: string) => Promise<boolean | null>>(async () => true)
}))

vi.mock('@/store', () => ({
  useAppStore: {
    getState: () => ({
      remountTerminalTabForRecovery: mocks.remountTerminalTabForRecovery
    })
  }
}))

vi.mock('@/lib/crash-breadcrumb-recorder', () => ({
  recordRendererCrashBreadcrumb: mocks.recordRendererCrashBreadcrumb
}))

beforeEach(() => {
  _resetTerminalPaneRecoveryForTests()
  mocks.remountTerminalTabForRecovery.mockClear()
  mocks.remountTerminalTabForRecovery.mockReturnValue(true)
  mocks.recordRendererCrashBreadcrumb.mockClear()
  mocks.hasPty.mockClear()
  mocks.hasPty.mockResolvedValue(true)
  vi.stubGlobal('window', {
    api: { pty: { hasPty: mocks.hasPty } }
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('requestTerminalPaneRecovery', () => {
  it('remounts the tab and records a breadcrumb for a certified-dead pipeline', async () => {
    const result = await requestTerminalPaneRecovery({
      tabId: 'tab-1',
      ptyId: 'pty-1',
      reason: 'write-stalled'
    })

    expect(result).toBe(true)
    expect(mocks.remountTerminalTabForRecovery).toHaveBeenCalledWith('tab-1')
    expect(mocks.recordRendererCrashBreadcrumb).toHaveBeenCalledWith(
      'terminal_pane_recovery_remount',
      { tabId: 'tab-1', reason: 'write-stalled' }
    )
    // Pipeline-death reasons are already probe-certified — no liveness gate.
    expect(mocks.hasPty).not.toHaveBeenCalled()
  })

  it('coalesces repeat requests inside the cooldown window', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)

    expect(
      await requestTerminalPaneRecovery({ tabId: 'tab-1', ptyId: 'pty-1', reason: 'write-stalled' })
    ).toBe(true)
    expect(
      await requestTerminalPaneRecovery({ tabId: 'tab-1', ptyId: 'pty-1', reason: 'replay-wedged' })
    ).toBe(false)
    expect(mocks.remountTerminalTabForRecovery).toHaveBeenCalledTimes(1)

    vi.setSystemTime(16_000)
    expect(
      await requestTerminalPaneRecovery({ tabId: 'tab-1', ptyId: 'pty-1', reason: 'replay-wedged' })
    ).toBe(true)
    expect(mocks.remountTerminalTabForRecovery).toHaveBeenCalledTimes(2)
  })

  it('caps recoveries per window to prevent remount storms', async () => {
    vi.useFakeTimers()
    for (let attempt = 0; attempt < 5; attempt += 1) {
      vi.setSystemTime(attempt * 20_000)
      await requestTerminalPaneRecovery({
        tabId: 'tab-1',
        ptyId: 'pty-1',
        reason: 'write-stalled'
      })
    }
    expect(mocks.remountTerminalTabForRecovery).toHaveBeenCalledTimes(3)
  })

  it('budgets tabs independently', async () => {
    expect(
      await requestTerminalPaneRecovery({ tabId: 'tab-1', ptyId: 'pty-1', reason: 'write-stalled' })
    ).toBe(true)
    expect(
      await requestTerminalPaneRecovery({ tabId: 'tab-2', ptyId: 'pty-2', reason: 'write-stalled' })
    ).toBe(true)
    expect(mocks.remountTerminalTabForRecovery).toHaveBeenCalledTimes(2)
  })

  it('skips input-undeliverable recovery when the PTY is confirmed dead', async () => {
    mocks.hasPty.mockResolvedValue(false)

    const result = await requestTerminalPaneRecovery({
      tabId: 'tab-1',
      ptyId: 'pty-1',
      reason: 'input-undeliverable'
    })

    expect(result).toBe(false)
    expect(mocks.remountTerminalTabForRecovery).not.toHaveBeenCalled()
  })

  it('recovers input-undeliverable panes when the PTY is alive', async () => {
    const result = await requestTerminalPaneRecovery({
      tabId: 'tab-1',
      ptyId: 'pty-1',
      reason: 'input-undeliverable'
    })

    expect(result).toBe(true)
    expect(mocks.hasPty).toHaveBeenCalledWith('pty-1')
    expect(mocks.remountTerminalTabForRecovery).toHaveBeenCalledWith('tab-1')
  })

  it('proceeds when PTY liveness is unknown (probe threw)', async () => {
    mocks.hasPty.mockRejectedValue(new Error('ipc down'))

    const result = await requestTerminalPaneRecovery({
      tabId: 'tab-1',
      ptyId: 'pty-1',
      reason: 'input-undeliverable'
    })

    expect(result).toBe(true)
  })

  it('requires a ptyId for input-undeliverable recovery', async () => {
    const result = await requestTerminalPaneRecovery({
      tabId: 'tab-1',
      ptyId: null,
      reason: 'input-undeliverable'
    })

    expect(result).toBe(false)
    expect(mocks.remountTerminalTabForRecovery).not.toHaveBeenCalled()
  })

  it('does not consume budget when the tab no longer exists', async () => {
    mocks.remountTerminalTabForRecovery.mockReturnValue(false)

    const result = await requestTerminalPaneRecovery({
      tabId: 'tab-gone',
      ptyId: 'pty-1',
      reason: 'write-stalled'
    })

    expect(result).toBe(false)
    expect(mocks.recordRendererCrashBreadcrumb).not.toHaveBeenCalled()
  })
})
