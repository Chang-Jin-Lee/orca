import { describe, expect, it } from 'vitest'
import { TerminalKittyKeyboardModeTracker } from './terminal-kitty-keyboard-mode-tracker'

describe('TerminalKittyKeyboardModeTracker', () => {
  it('starts inactive and ignores non-kitty sequences', () => {
    const tracker = new TerminalKittyKeyboardModeTracker()
    expect(tracker.flags).toBe(0)
    tracker.scan('plain output \x1b[?2004h\x1b[38;5;10mcolored\x1b[0m')
    expect(tracker.flags).toBe(0)
  })

  it('does not treat CSI u (restore cursor) or the CSI ? u query as kitty state', () => {
    const tracker = new TerminalKittyKeyboardModeTracker()
    tracker.scan('\x1b[u\x1b[?u')
    expect(tracker.flags).toBe(0)
  })

  it('tracks push and pop like xterm, including the pop-to-empty zeroing', () => {
    const tracker = new TerminalKittyKeyboardModeTracker()
    tracker.scan('\x1b[>1u')
    expect(tracker.flags).toBe(1)
    tracker.scan('\x1b[>7u')
    expect(tracker.flags).toBe(7)
    tracker.scan('\x1b[<u')
    expect(tracker.flags).toBe(1)

    // Why: xterm zeroes flags whenever a pop drains the stack, even though the
    // popped frame was the pre-push value — mirror that exactly.
    const drained = new TerminalKittyKeyboardModeTracker()
    drained.scan('\x1b[=3;1u\x1b[>5u\x1b[<u')
    expect(drained.flags).toBe(0)
  })

  it('applies set/or/clear modes of CSI = u', () => {
    const tracker = new TerminalKittyKeyboardModeTracker()
    tracker.scan('\x1b[=1;1u')
    expect(tracker.flags).toBe(1)
    tracker.scan('\x1b[=2;2u')
    expect(tracker.flags).toBe(3)
    tracker.scan('\x1b[=1;3u')
    expect(tracker.flags).toBe(2)
    // Mode defaults to 1 (set) when omitted.
    tracker.scan('\x1b[=4u')
    expect(tracker.flags).toBe(4)
  })

  it("clears state for Orca's defensive reset sequence and RIS", () => {
    const tracker = new TerminalKittyKeyboardModeTracker()
    tracker.scan('\x1b[>1u')
    tracker.scan('\x1b[<99u\x1b[=0u')
    expect(tracker.flags).toBe(0)

    tracker.scan('\x1b[>1u')
    tracker.scan('\x1bc')
    expect(tracker.flags).toBe(0)
  })

  it('keeps per-screen flags across alternate-screen switches', () => {
    const tracker = new TerminalKittyKeyboardModeTracker()
    tracker.scan('\x1b[>1u')
    expect(tracker.flags).toBe(1)
    tracker.scan('\x1b[?1049h')
    expect(tracker.flags).toBe(0)
    tracker.scan('\x1b[>2u')
    expect(tracker.flags).toBe(2)
    tracker.scan('\x1b[?1049l')
    expect(tracker.flags).toBe(1)
  })

  it('handles sequences split across chunks and C1 CSI', () => {
    const tracker = new TerminalKittyKeyboardModeTracker()
    tracker.scan('\x1b[>')
    expect(tracker.flags).toBe(0)
    tracker.scan('1u')
    expect(tracker.flags).toBe(1)
    tracker.scan('\x9b<99u')
    expect(tracker.flags).toBe(0)
    tracker.scan('\x9b>7u')
    expect(tracker.flags).toBe(7)
  })

  it('caps the mirrored stack without losing the current flags', () => {
    const tracker = new TerminalKittyKeyboardModeTracker()
    for (let i = 0; i < 40; i++) {
      tracker.scan(`\x1b[>${(i % 3) + 1}u`)
    }
    expect(tracker.flags).toBe((39 % 3) + 1)
  })

  it('reset() returns to the inactive state', () => {
    const tracker = new TerminalKittyKeyboardModeTracker()
    tracker.scan('\x1b[>1u\x1b[?1049h\x1b[>2u')
    tracker.reset()
    expect(tracker.flags).toBe(0)
    tracker.scan('\x1b[?1049l')
    expect(tracker.flags).toBe(0)
  })
})
