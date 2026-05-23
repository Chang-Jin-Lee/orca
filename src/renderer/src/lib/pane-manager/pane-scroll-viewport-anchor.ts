import type { Terminal } from '@xterm/xterm'
import type { ScrollState } from './pane-manager-types'

const MAX_FULL_ANCHOR_TEXT_LENGTH = 20_000
const ANCHOR_CONTEXT_BEFORE = 80
const ANCHOR_CONTEXT_AFTER = 240
const ANCHOR_PREFIX_LENGTH = 240
const ANCHOR_SEARCH_RADIUS_LINES = 1500

type SearchRange = { start: number; end: number }

export function captureViewportAnchor(
  terminal: Terminal
): ScrollState['viewportAnchor'] | undefined {
  const buf = terminal.buffer.active
  if (typeof buf.getLine !== 'function') {
    return undefined
  }
  const viewportY = buf.viewportY
  const startY = findLogicalLineStart(buf, viewportY)
  const logicalText = readLogicalLineText(buf, startY)
  if (!logicalText) {
    return undefined
  }

  const cols = Math.max(terminal.cols, 1)
  const charOffset = Math.min(Math.max(0, viewportY - startY) * cols, logicalText.length)
  const segmentStart = Math.max(0, charOffset - ANCHOR_CONTEXT_BEFORE)
  const segmentEnd = Math.min(logicalText.length, charOffset + ANCHOR_CONTEXT_AFTER)
  const segment = logicalText.slice(segmentStart, segmentEnd).trim()
  if (!segment) {
    return undefined
  }

  return {
    charOffset,
    logicalPrefix: logicalText.slice(0, ANCHOR_PREFIX_LENGTH).trim(),
    segment,
    segmentOffset: charOffset - segmentStart,
    logicalText: logicalText.length <= MAX_FULL_ANCHOR_TEXT_LENGTH ? logicalText : undefined
  }
}

export function resolveViewportAnchorLine(terminal: Terminal, state: ScrollState): number | null {
  const anchor = state.viewportAnchor
  if (!anchor) {
    return null
  }
  const buf = terminal.buffer.active
  if (typeof buf.getLine !== 'function') {
    return null
  }
  const length = getBufferLength(buf, terminal.rows)
  const ranges = getAnchorSearchRanges(state, buf, length)

  for (const range of ranges) {
    const line = searchViewportAnchorRange(buf, terminal, anchor, range, false)
    if (line !== null) {
      return line
    }
  }

  for (const range of ranges) {
    const line = searchViewportAnchorRange(buf, terminal, anchor, range, true)
    if (line !== null) {
      return line
    }
  }

  return null
}

function getAnchorSearchRanges(
  state: ScrollState,
  buf: Terminal['buffer']['active'],
  length: number
): SearchRange[] {
  const ranges: SearchRange[] = []
  const estimate =
    state.baseY > 0 && buf.baseY > 0
      ? Math.round((state.viewportY / state.baseY) * buf.baseY)
      : state.viewportY
  const focused = clampSearchRange(
    estimate - ANCHOR_SEARCH_RADIUS_LINES,
    estimate + ANCHOR_SEARCH_RADIUS_LINES,
    length
  )
  if (focused) {
    ranges.push(focused)
  }
  const full = clampSearchRange(0, length - 1, length)
  if (full && (!focused || focused.start !== full.start || focused.end !== full.end)) {
    ranges.push(full)
  }
  return ranges
}

function clampSearchRange(start: number, end: number, length: number): SearchRange | null {
  const clampedStart = Math.max(0, Math.min(start, length - 1))
  const clampedEnd = Math.max(0, Math.min(end, length - 1))
  if (clampedStart > clampedEnd) {
    return null
  }
  return { start: clampedStart, end: clampedEnd }
}

function searchViewportAnchorRange(
  buf: Terminal['buffer']['active'],
  terminal: Terminal,
  anchor: NonNullable<ScrollState['viewportAnchor']>,
  range: SearchRange,
  allowSegmentFallback: boolean
): number | null {
  let segmentFallbackLine: number | null = null

  for (let lineY = range.start; lineY <= range.end; lineY++) {
    const line = buf.getLine(lineY)
    if (!line || (lineY > 0 && line.isWrapped)) {
      continue
    }

    const logicalText = readLogicalLineText(buf, lineY)
    if (!logicalText) {
      continue
    }

    if (anchor.logicalText && logicalText === anchor.logicalText) {
      return resolveDisplayLineForCharOffset(
        buf,
        lineY,
        anchor.charOffset,
        terminal.cols,
        terminal.rows
      )
    }

    if (anchor.logicalPrefix && logicalText.startsWith(anchor.logicalPrefix)) {
      return resolveDisplayLineForCharOffset(
        buf,
        lineY,
        anchor.charOffset,
        terminal.cols,
        terminal.rows
      )
    }

    if (allowSegmentFallback) {
      const segmentIndex = logicalText.indexOf(anchor.segment)
      if (segmentIndex >= 0 && segmentFallbackLine === null) {
        segmentFallbackLine = resolveDisplayLineForCharOffset(
          buf,
          lineY,
          segmentIndex + anchor.segmentOffset,
          terminal.cols,
          terminal.rows
        )
      }
    }
  }

  return segmentFallbackLine
}

function findLogicalLineStart(buf: Terminal['buffer']['active'], lineY: number): number {
  let startY = lineY
  while (startY > 0 && buf.getLine(startY)?.isWrapped) {
    startY--
  }
  return startY
}

function readLogicalLineText(buf: Terminal['buffer']['active'], startY: number): string {
  const length = getBufferLength(buf)
  let text = ''
  for (let lineY = startY; lineY < length; lineY++) {
    const line = buf.getLine(lineY)
    if (!line || (lineY > startY && !line.isWrapped)) {
      break
    }
    text += line.translateToString(false)
  }
  return text.trimEnd()
}

function resolveDisplayLineForCharOffset(
  buf: Terminal['buffer']['active'],
  startY: number,
  charOffset: number,
  cols: number,
  rows: number
): number {
  const endY = findLogicalLineEnd(buf, startY, rows)
  const targetY = startY + Math.floor(Math.max(0, charOffset) / Math.max(cols, 1))
  return Math.min(targetY, endY, buf.baseY)
}

function findLogicalLineEnd(buf: Terminal['buffer']['active'], startY: number, rows = 0): number {
  const length = getBufferLength(buf, rows)
  let endY = startY
  for (let lineY = startY + 1; lineY < length; lineY++) {
    const line = buf.getLine(lineY)
    if (!line?.isWrapped) {
      break
    }
    endY = lineY
  }
  return endY
}

function getBufferLength(buf: Terminal['buffer']['active'], fallbackRows = 0): number {
  return typeof buf.length === 'number' ? buf.length : buf.baseY + fallbackRows
}
