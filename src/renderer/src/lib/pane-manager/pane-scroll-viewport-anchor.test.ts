import type { Terminal } from '@xterm/xterm'
import { describe, expect, it, vi } from 'vitest'
import type { ScrollState } from './pane-manager-types'
import { captureScrollState, restoreScrollState } from './pane-scroll'

function createTerminal(args: {
  viewportY: number
  baseY: number
  cols: number
  cursorY?: number
  lines: ReturnType<typeof createBufferLine>[]
}): Terminal {
  const active = {
    type: 'normal',
    viewportY: args.viewportY,
    baseY: args.baseY,
    cursorY: args.cursorY ?? 5,
    length: args.lines.length,
    getLine: vi.fn((lineY: number) => args.lines[lineY])
  }
  return {
    buffer: { active },
    cols: args.cols,
    rows: 24,
    element: {} as HTMLElement,
    registerMarker: vi.fn(),
    scrollToLine: vi.fn((line: number) => {
      active.viewportY = line
    }),
    scrollLines: vi.fn((delta: number) => {
      active.viewportY = Math.max(0, Math.min(active.baseY, active.viewportY + delta))
    })
  } as unknown as Terminal
}

function createBufferLine(
  text: string,
  isWrapped = false
): {
  isWrapped: boolean
  translateToString: ReturnType<typeof vi.fn>
} {
  return {
    isWrapped,
    translateToString: vi.fn((trimRight?: boolean) => (trimRight ? text.trimEnd() : text))
  }
}

describe('scroll viewport anchors', () => {
  it('restores by content anchor when resize reflow moves the visible line', () => {
    const beforeResize = createTerminal({
      viewportY: 2,
      baseY: 4,
      cursorY: 4,
      cols: 10,
      lines: [
        createBufferLine('prompt'),
        createBufferLine('ABCDEFGHIJ'),
        createBufferLine('KLMNOPQRST', true),
        createBufferLine('UVWXYZ', true),
        createBufferLine('tail')
      ]
    })
    const state = captureScrollState(beforeResize)
    const afterResize = createTerminal({
      viewportY: 0,
      baseY: 7,
      cols: 5,
      lines: [
        createBufferLine('prompt'),
        createBufferLine('ABCDE'),
        createBufferLine('FGHIJ', true),
        createBufferLine('KLMNO', true),
        createBufferLine('PQRST', true),
        createBufferLine('UVWXY', true),
        createBufferLine('Z', true),
        createBufferLine('tail')
      ]
    })

    restoreScrollState(afterResize, state)

    expect(afterResize.scrollToLine).toHaveBeenCalledWith(3)
    expect(afterResize.buffer.active.viewportY).toBe(3)
  })

  it('restores long logical lines using the captured visible segment', () => {
    const longText = `${'A'.repeat(21_000)}VISIBLE_ANCHOR_TEXT${'B'.repeat(1_000)}`
    const beforeResize = createTerminal({
      viewportY: 21,
      baseY: 25,
      cursorY: 25,
      cols: 1000,
      lines: Array.from({ length: 23 }, (_, index) =>
        createBufferLine(longText.slice(index * 1000, (index + 1) * 1000), index > 0)
      )
    })
    const state = captureScrollState(beforeResize)
    const afterResize = createTerminal({
      viewportY: 0,
      baseY: 50,
      cols: 500,
      lines: Array.from({ length: 45 }, (_, index) =>
        createBufferLine(longText.slice(index * 500, (index + 1) * 500), index > 0)
      )
    })

    restoreScrollState(afterResize, state)

    expect(afterResize.scrollToLine).toHaveBeenCalledWith(42)
    expect(afterResize.buffer.active.viewportY).toBe(42)
  })

  it('prefers a logical-line prefix over a repeated visible segment', () => {
    const terminal = createTerminal({
      viewportY: 0,
      baseY: 20,
      cols: 5,
      lines: [
        createBufferLine('repeat'),
        createBufferLine('KLMNO', true),
        createBufferLine('UNIQUE-LINE-042'),
        createBufferLine('ABCDE', true),
        createBufferLine('KLMNO', true),
        createBufferLine('tail')
      ]
    })
    const state: ScrollState = {
      bufferType: 'normal',
      wasAtBottom: false,
      viewportY: 10,
      baseY: 10,
      viewportAnchor: {
        charOffset: 10,
        logicalPrefix: 'UNIQUE-LINE-042',
        segment: 'KLMNO',
        segmentOffset: 0
      }
    }

    restoreScrollState(terminal, state)

    expect(terminal.scrollToLine).toHaveBeenCalledWith(4)
    expect(terminal.buffer.active.viewportY).toBe(4)
  })
})
