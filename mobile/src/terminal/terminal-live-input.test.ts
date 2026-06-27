import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  TERMINAL_LIVE_INPUT_MAX_BYTES,
  clearTerminalLiveInputFocusTimer,
  getTerminalLiveSpecialKeyBytes,
  isTerminalLiveInputWithinByteLimit,
  scheduleTerminalLiveInputFocus,
  type TerminalLiveInputFocusTimerRef
} from './terminal-live-input'

function createTimerRef(): TerminalLiveInputFocusTimerRef {
  return { current: null }
}

describe('terminal live input', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['Escape', '\x1b'],
    ['Esc', '\x1b'],
    ['Tab', '\t'],
    ['Backspace', '\x7f'],
    ['Delete', '\x1b[3~'],
    ['Insert', '\x1b[2~'],
    ['ArrowUp', '\x1b[A'],
    ['ArrowDown', '\x1b[B'],
    ['ArrowLeft', '\x1b[D'],
    ['ArrowRight', '\x1b[C'],
    ['Home', '\x1b[H'],
    ['End', '\x1b[F'],
    ['PageUp', '\x1b[5~'],
    ['PageDown', '\x1b[6~'],
    ['F1', '\x1bOP'],
    ['F2', '\x1bOQ'],
    ['F3', '\x1bOR'],
    ['F4', '\x1bOS'],
    ['F5', '\x1b[15~'],
    ['F6', '\x1b[17~'],
    ['F7', '\x1b[18~'],
    ['F8', '\x1b[19~'],
    ['F9', '\x1b[20~'],
    ['F10', '\x1b[21~'],
    ['F11', '\x1b[23~'],
    ['F12', '\x1b[24~']
  ])('maps %s to terminal PTY bytes', (key, bytes) => {
    expect(getTerminalLiveSpecialKeyBytes(key)).toBe(bytes)
  })

  it('leaves submitted or printable keys on their existing input paths', () => {
    expect(getTerminalLiveSpecialKeyBytes('Enter')).toBeNull()
    expect(getTerminalLiveSpecialKeyBytes('a')).toBeNull()
  })

  it('ignores object prototype names from native key events', () => {
    expect(getTerminalLiveSpecialKeyBytes('constructor')).toBeNull()
    expect(getTerminalLiveSpecialKeyBytes('toString')).toBeNull()
    expect(getTerminalLiveSpecialKeyBytes('hasOwnProperty')).toBeNull()
  })

  it('enforces the paste-sized byte budget', () => {
    expect(isTerminalLiveInputWithinByteLimit('hello')).toBe(true)
    expect(isTerminalLiveInputWithinByteLimit('x'.repeat(TERMINAL_LIVE_INPUT_MAX_BYTES))).toBe(true)
    expect(isTerminalLiveInputWithinByteLimit('x'.repeat(TERMINAL_LIVE_INPUT_MAX_BYTES + 1))).toBe(
      false
    )
    expect(
      isTerminalLiveInputWithinByteLimit('é'.repeat(TERMINAL_LIVE_INPUT_MAX_BYTES / 2 + 1))
    ).toBe(false)
  })

  it('replaces pending deferred focus work', () => {
    vi.useFakeTimers()
    const timerRef = createTimerRef()
    const staleFocus = vi.fn()
    const nextFocus = vi.fn()

    scheduleTerminalLiveInputFocus(timerRef, staleFocus)
    scheduleTerminalLiveInputFocus(timerRef, nextFocus)
    vi.runOnlyPendingTimers()

    expect(staleFocus).not.toHaveBeenCalled()
    expect(nextFocus).toHaveBeenCalledTimes(1)
    expect(timerRef.current).toBeNull()
  })

  it('clears pending deferred focus work', () => {
    vi.useFakeTimers()
    const timerRef = createTimerRef()
    const focus = vi.fn()

    scheduleTerminalLiveInputFocus(timerRef, focus)
    clearTerminalLiveInputFocusTimer(timerRef)
    vi.runOnlyPendingTimers()

    expect(focus).not.toHaveBeenCalled()
    expect(timerRef.current).toBeNull()
  })
})
