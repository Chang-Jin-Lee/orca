/**
 * Byte-mode pinning guard for the standalone hidden-view-parking extraction.
 *
 * This build ships NO main-process side-effect emitter (that arrives with PR
 * #7214), so the parked-tab watcher must always run in byte-parser mode. If
 * terminalMainSideEffectAuthority ever resolves true here, the watcher would
 * consume a pty:sideEffect channel that never emits and parked tabs would
 * silently lose bell/title/completion notifications — the exact failure that
 * got the first parking attempt reverted. These tests pin the three levers:
 * the shipped defaults, the mode predicates under those defaults, and the
 * park-eligibility tripwire for misconfigured (authority-on) settings.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDefaultSettings } from '../../../../shared/constants'
import type { ParkedTerminalByteWatcherOptions } from './parked-terminal-byte-watcher'

const WORKTREE_ID = 'repo::/worktree'
const TAB_ID = 'guard-tab-1'
const PTY_ID = `${WORKTREE_ID}@@session-guard`
const LEAF_ID = '31111111-1111-4111-8111-111111111111'

vi.mock('./parked-terminal-byte-watcher', () => ({
  startParkedTerminalByteWatcher: (_options: ParkedTerminalByteWatcherOptions) => vi.fn()
}))

vi.mock('./pty-dispatcher', () => ({
  subscribeToPtyExit: () => vi.fn()
}))

type MockStoreState = {
  settings?: { terminalMainSideEffectAuthority?: boolean } | null
  terminalLayoutsByTabId: Record<
    string,
    {
      root: unknown
      activeLeafId: string | null
      expandedLeafId: string | null
      ptyIdsByLeafId?: Record<string, string>
    }
  >
  runtimePaneTitlesByTabId: Record<string, Record<number, string>>
  clearRuntimePaneTitle: ReturnType<typeof vi.fn>
}

let mockStoreState: MockStoreState

vi.mock('@/store', () => ({
  useAppStore: { getState: () => mockStoreState }
}))

import {
  isMainTerminalSideEffectAuthorityForPty,
  _resetTerminalSideEffectFactConsumersForTest
} from './terminal-side-effect-facts-handler'
import {
  isRendererHiddenPtyDeliveryGateEnabled,
  _resetHiddenPtyDeliveryGateFlagCacheForTest
} from './terminal-hidden-delivery-gate'
import { canWatcherCoverParkedTerminalTab } from './terminal-parked-tab-watchers'

const originalWindow = (globalThis as { window?: unknown }).window

function setWindowApi(api: unknown): void {
  ;(globalThis as { window?: unknown }).window = api === undefined ? undefined : { api }
}

beforeEach(() => {
  _resetTerminalSideEffectFactConsumersForTest()
  _resetHiddenPtyDeliveryGateFlagCacheForTest()
  mockStoreState = {
    settings: null,
    terminalLayoutsByTabId: {
      [TAB_ID]: {
        root: { type: 'leaf', leafId: LEAF_ID },
        activeLeafId: LEAF_ID,
        expandedLeafId: null,
        ptyIdsByLeafId: { [LEAF_ID]: PTY_ID }
      }
    },
    runtimePaneTitlesByTabId: {},
    clearRuntimePaneTitle: vi.fn()
  }
})

afterEach(() => {
  ;(globalThis as { window?: unknown }).window = originalWindow
  _resetTerminalSideEffectFactConsumersForTest()
  _resetHiddenPtyDeliveryGateFlagCacheForTest()
})

describe('shipped defaults pin byte mode', () => {
  it('ships parking ON but the three authority/gate flags OFF (byte mode)', () => {
    // Parking is default-ON; the byte-mode safety invariant is the three
    // authority/gate/query flags staying false so the parked watcher never
    // consumes the dead pty:sideEffect channel.
    const defaults = getDefaultSettings('/home/guard-test')
    expect(defaults.terminalHiddenViewParking).toBe(true)
    expect(defaults.terminalMainSideEffectAuthority).toBe(false)
    expect(defaults.terminalHiddenDeliveryGate).toBe(false)
    expect(defaults.terminalModelQueryAuthority).toBe(false)
  })

  it('selects byte-parser mode for parked watchers under the shipped defaults', () => {
    // The watcher's mode ternary is exactly this predicate: false → byte mode
    // (registers byte parsers), true → fact mode (dead channel in this build).
    expect(
      isMainTerminalSideEffectAuthorityForPty({
        settings: getDefaultSettings('/home/guard-test'),
        runtimeEnvironmentId: null
      })
    ).toBe(false)
  })

  it('keeps the hidden-delivery gate off under the shipped defaults', () => {
    expect(isRendererHiddenPtyDeliveryGateEnabled(getDefaultSettings('/home/guard-test'))).toBe(
      false
    )
  })
})

describe('fact mode requires the pty:sideEffect channel', () => {
  it('refuses park coverage when authority is configured on without the channel', () => {
    // Misconfiguration scenario: settings carried back from a build that had
    // the main emitter (authority=true) running on this emitter-less build.
    mockStoreState.settings = { terminalMainSideEffectAuthority: true }
    setWindowApi({ pty: {} })
    expect(canWatcherCoverParkedTerminalTab(WORKTREE_ID, { id: TAB_ID, ptyId: PTY_ID })).toBe(false)
  })

  it('allows park coverage for authority-on settings once the channel exists', () => {
    mockStoreState.settings = { terminalMainSideEffectAuthority: true }
    setWindowApi({ pty: { onSideEffect: () => () => {} } })
    expect(canWatcherCoverParkedTerminalTab(WORKTREE_ID, { id: TAB_ID, ptyId: PTY_ID })).toBe(true)
  })

  it('allows park coverage in byte mode without any channel', () => {
    mockStoreState.settings = { terminalMainSideEffectAuthority: false }
    setWindowApi({ pty: {} })
    expect(canWatcherCoverParkedTerminalTab(WORKTREE_ID, { id: TAB_ID, ptyId: PTY_ID })).toBe(true)
  })
})
