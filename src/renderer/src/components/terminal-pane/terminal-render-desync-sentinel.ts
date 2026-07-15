import { recordTerminalWebglDiagnostic } from '../../../../shared/terminal-webgl-diagnostics'
import {
  forEachLivePaneForDesyncSentinel,
  resetAndRefreshAllTerminalWebglAtlases
} from '@/lib/pane-manager/pane-manager-registry'

/**
 * Flag-gated render-desync sentinel for WebGL terminal panes.
 *
 * Detects the "buffer is correct but the canvas renders stale/garbled glyphs"
 * class of bug (shared glyph-atlas desync) by comparing, per visible pane, the
 * cells the xterm buffer says hold glyphs against the ink actually present on
 * the WebGL canvas. Because the readback happens in the same task as a forced
 * synchronous redraw, a divergence means the render *model or atlas* is wrong —
 * not merely a missed present. A trip records a diagnostic breadcrumb with the
 * pane's renderer state, stashes evidence for bug reports, and runs the same
 * shared-atlas recovery a tab reveal performs, converting a stuck-garbled pane
 * into a self-healing one.
 *
 * Off by default; enabled via localStorage so a production build can arm it
 * from DevTools without a settings-schema change:
 *   localStorage.setItem('orca:render-desync-sentinel', '1')  // then reload
 */

export const RENDER_DESYNC_SENTINEL_FLAG = 'orca:render-desync-sentinel'
const SAMPLE_INTERVAL_MS = 5_000
// A real desync is pinned to fixed screen cells; scroll/frame lag moves around.
// Require the same cells missing across this many consecutive samples.
const PERSISTENT_SAMPLES = 3
const MIN_TEXT_CELLS = 200
const MISSING_PCT_THRESHOLD = 8
const MISSING_SET_MIN_OVERLAP = 0.5
const MAX_EVIDENCE_ENTRIES = 4
// Luminance floor distinguishing glyph ink from background in the cell center.
const INK_LUMINANCE_FLOOR = 38

type SentinelDivergence = {
  textCells: number
  missing: number
  missPct: number
  missingCells: Set<number>
}

export type SentinelEvidence = {
  paneKey: string
  when: number
  divergence: { textCells: number; missing: number; missPct: number }
  paused: boolean
  atlasPages: number
  livePngDataUrl: string
  bufferText: string
}

type SentinelRenderInternals = {
  rows: number
  cols: number
  refreshRows: (start: number, end: number, sync?: boolean) => void
  isPaused: boolean
  canvas: HTMLCanvasElement
  cellWidth: number
  cellHeight: number
}

type SentinelPane = {
  id: number
  terminal: unknown
}

const missingHistoryByPane = new Map<string, Set<number>[]>()
const evidence: SentinelEvidence[] = []
let intervalId: ReturnType<typeof setInterval> | null = null

export function getRenderDesyncEvidence(): SentinelEvidence[] {
  return evidence
}

function reachRenderInternals(terminal: unknown): SentinelRenderInternals | null {
  try {
    const term = terminal as {
      rows?: number
      cols?: number
      buffer?: unknown
      _core?: {
        _renderService?: {
          _isPaused?: boolean
          refreshRows?: (start: number, end: number, sync?: boolean) => void
          _renderer?: {
            value?: {
              _canvas?: HTMLCanvasElement
              _charAtlas?: unknown
              dimensions?: { device?: { cell?: { width?: number; height?: number } } }
            }
          }
        }
      }
    }
    const service = term._core?._renderService
    const renderer = service?._renderer?.value
    const cell = renderer?.dimensions?.device?.cell
    if (
      typeof term.rows !== 'number' ||
      typeof term.cols !== 'number' ||
      typeof service?.refreshRows !== 'function' ||
      !renderer?._canvas ||
      !renderer._charAtlas ||
      typeof cell?.width !== 'number' ||
      typeof cell?.height !== 'number'
    ) {
      return null
    }
    return {
      rows: term.rows,
      cols: term.cols,
      refreshRows: service.refreshRows.bind(service),
      isPaused: service._isPaused === true,
      canvas: renderer._canvas,
      cellWidth: cell.width,
      cellHeight: cell.height
    }
  } catch {
    return null
  }
}

type BufferLineLike = {
  getCell: (x: number) => { getChars: () => string; getWidth: () => number } | undefined
  translateToString: (trim: boolean) => string
}

type BufferLike = {
  cursorY: number
  viewportY: number
  getLine: (y: number) => BufferLineLike | undefined
}

function activeBuffer(terminal: unknown): BufferLike | null {
  const buffer = (terminal as { buffer?: { active?: BufferLike } }).buffer?.active
  return buffer && typeof buffer.getLine === 'function' ? buffer : null
}

function measureDivergence(
  internals: SentinelRenderInternals,
  buffer: BufferLike
): SentinelDivergence | null {
  const { canvas, cellWidth, cellHeight, rows, cols } = internals
  if (!canvas.width || !canvas.height) {
    return null
  }
  const offscreen = document.createElement('canvas')
  offscreen.width = canvas.width
  offscreen.height = canvas.height
  const ctx = offscreen.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return null
  }
  ctx.drawImage(canvas, 0, 0)
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data

  const missingCells = new Set<number>()
  let textCells = 0
  let missing = 0
  for (let r = 0; r < rows; r++) {
    if (r === buffer.cursorY) {
      continue
    }
    const line = buffer.getLine(buffer.viewportY + r)
    if (!line) {
      continue
    }
    for (let c = 0; c < cols; c++) {
      const cell = line.getCell(c)
      if (!cell) {
        continue
      }
      const chars = cell.getChars()
      if (chars === '' || chars === ' ' || cell.getWidth() === 0) {
        continue
      }
      // Sample the central half of the cell; edges carry anti-aliasing noise.
      let ink = 0
      let sampled = 0
      const x0 = Math.round(c * cellWidth + cellWidth * 0.25)
      const x1 = Math.round(c * cellWidth + cellWidth * 0.75)
      const y0 = Math.round(r * cellHeight + cellHeight * 0.25)
      const y1 = Math.round(r * cellHeight + cellHeight * 0.75)
      for (let py = y0; py < y1; py += 2) {
        for (let px = x0; px < x1; px += 2) {
          if (px >= canvas.width || py >= canvas.height) {
            continue
          }
          const i = (py * canvas.width + px) * 4
          const luminance = 0.299 * image[i] + 0.587 * image[i + 1] + 0.114 * image[i + 2]
          if (luminance > INK_LUMINANCE_FLOOR) {
            ink++
          }
          sampled++
        }
      }
      if (!sampled) {
        continue
      }
      textCells++
      if (ink === 0) {
        missing++
        missingCells.add(r * cols + c)
      }
    }
  }
  return {
    textCells,
    missing,
    missingCells,
    missPct: textCells ? (100 * missing) / textCells : 0
  }
}

function missingSetsOverlap(a: Set<number>, b: Set<number>): boolean {
  let intersection = 0
  for (const cell of b) {
    if (a.has(cell)) {
      intersection++
    }
  }
  const union = a.size + b.size - intersection
  return union > 0 && intersection / union >= MISSING_SET_MIN_OVERLAP
}

function bufferSnapshot(buffer: BufferLike, rows: number): string {
  const lines: string[] = []
  for (let r = 0; r < rows; r++) {
    lines.push(buffer.getLine(buffer.viewportY + r)?.translateToString(true) ?? '')
  }
  return lines.join('\n')
}

export function sampleRenderDesyncOnce(
  // Test seam: happy-dom has no 2D canvas, so tests inject crafted divergences.
  measure: typeof measureDivergence = measureDivergence
): void {
  forEachLivePaneForDesyncSentinel((paneKey, pane) => {
    const internals = reachRenderInternals((pane as SentinelPane).terminal)
    if (!internals || internals.isPaused) {
      missingHistoryByPane.delete(paneKey)
      return
    }
    const buffer = activeBuffer((pane as SentinelPane).terminal)
    if (!buffer) {
      return
    }
    // Redraw from the render model in this task so the readback below observes
    // the model's actual output, not a possibly-dropped present. A divergence
    // after this redraw is therefore a genuine model/atlas desync.
    try {
      internals.refreshRows(0, internals.rows - 1, true)
    } catch {
      return
    }
    const divergence = measure(internals, buffer)
    if (!divergence || divergence.textCells < MIN_TEXT_CELLS) {
      missingHistoryByPane.delete(paneKey)
      return
    }
    const history = missingHistoryByPane.get(paneKey) ?? []
    history.push(divergence.missingCells)
    while (history.length > PERSISTENT_SAMPLES) {
      history.shift()
    }
    missingHistoryByPane.set(paneKey, history)

    if (divergence.missPct < MISSING_PCT_THRESHOLD || history.length < PERSISTENT_SAMPLES) {
      return
    }
    for (let i = 1; i < history.length; i++) {
      if (!missingSetsOverlap(history[i - 1], history[i])) {
        return
      }
    }

    missingHistoryByPane.delete(paneKey)
    recordTerminalWebglDiagnostic('webgl-render-desync', {
      paneKey,
      textCells: divergence.textCells,
      missing: divergence.missing,
      missPct: Math.round(divergence.missPct * 10) / 10
    })
    if (evidence.length < MAX_EVIDENCE_ENTRIES) {
      evidence.push({
        paneKey,
        when: Date.now(),
        divergence: {
          textCells: divergence.textCells,
          missing: divergence.missing,
          missPct: divergence.missPct
        },
        paused: internals.isPaused,
        atlasPages: -1,
        livePngDataUrl: internals.canvas.toDataURL(),
        bufferText: bufferSnapshot(buffer, internals.rows)
      })
    }
    console.warn(
      `[terminal] render desync detected on pane ${paneKey} ` +
        `(${divergence.missing}/${divergence.textCells} cells, ${divergence.missPct.toFixed(1)}%) — recovering`
    )
    // The same recovery a tab reveal performs: wipe the shared atlas and
    // repaint every pane from its buffer.
    resetAndRefreshAllTerminalWebglAtlases()
  })
}

export function maybeStartTerminalRenderDesyncSentinel(): void {
  if (intervalId != null) {
    return
  }
  let enabled = false
  try {
    enabled = globalThis.localStorage?.getItem(RENDER_DESYNC_SENTINEL_FLAG) === '1'
  } catch {
    enabled = false
  }
  if (!enabled) {
    return
  }
  intervalId = setInterval(sampleRenderDesyncOnce, SAMPLE_INTERVAL_MS)
  console.warn('[terminal] render-desync sentinel armed (5s sampling)')
}

export function stopTerminalRenderDesyncSentinelForTesting(): void {
  if (intervalId != null) {
    clearInterval(intervalId)
    intervalId = null
  }
  missingHistoryByPane.clear()
  evidence.length = 0
}
