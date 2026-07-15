import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const forEachLivePaneForDesyncSentinel = vi.fn()
const resetAndRefreshAllTerminalWebglAtlases = vi.fn()
vi.mock('@/lib/pane-manager/pane-manager-registry', () => ({
  forEachLivePaneForDesyncSentinel: (
    ...args: Parameters<typeof forEachLivePaneForDesyncSentinel>
  ) => forEachLivePaneForDesyncSentinel(...args),
  resetAndRefreshAllTerminalWebglAtlases: () => resetAndRefreshAllTerminalWebglAtlases()
}))

const recordTerminalWebglDiagnostic = vi.fn()
vi.mock('../../../../shared/terminal-webgl-diagnostics', () => ({
  recordTerminalWebglDiagnostic: (...args: Parameters<typeof recordTerminalWebglDiagnostic>) =>
    recordTerminalWebglDiagnostic(...args)
}))

import {
  getRenderDesyncEvidence,
  maybeStartTerminalRenderDesyncSentinel,
  RENDER_DESYNC_SENTINEL_FLAG,
  sampleRenderDesyncOnce,
  stopTerminalRenderDesyncSentinelForTesting
} from './terminal-render-desync-sentinel'

function fakePane(overrides: { paused?: boolean } = {}) {
  const refreshRows = vi.fn()
  const terminal = {
    rows: 24,
    cols: 80,
    buffer: {
      active: {
        cursorY: 23,
        viewportY: 0,
        getLine: () => ({
          getCell: () => ({ getChars: () => 'x', getWidth: () => 1 }),
          translateToString: () => 'x'.repeat(80)
        })
      }
    },
    _core: {
      _renderService: {
        _isPaused: overrides.paused === true,
        refreshRows,
        _renderer: {
          value: {
            _canvas: { width: 800, height: 480, toDataURL: () => 'data:image/png;base64,' },
            _charAtlas: {},
            dimensions: { device: { cell: { width: 10, height: 20 } } }
          }
        }
      }
    }
  }
  return { pane: { id: 1, terminal }, refreshRows }
}

function divergenceOf(cells: number[], textCells = 1000) {
  return {
    textCells,
    missing: cells.length,
    missingCells: new Set(cells),
    missPct: (100 * cells.length) / textCells
  }
}

const manyCells = (offset: number) => Array.from({ length: 120 }, (_, i) => offset + i)

describe('terminal-render-desync-sentinel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    stopTerminalRenderDesyncSentinelForTesting()
  })

  function sampleWith(divergence: ReturnType<typeof divergenceOf> | null, paused = false) {
    const { pane, refreshRows } = fakePane({ paused })
    forEachLivePaneForDesyncSentinel.mockImplementation(
      (visit: (key: string, pane: unknown) => void) => visit('m1:p1', pane)
    )
    sampleRenderDesyncOnce(() => divergence)
    return { refreshRows }
  }

  it('trips after the same cells stay missing across three consecutive samples', () => {
    const cells = manyCells(0)
    sampleWith(divergenceOf(cells))
    sampleWith(divergenceOf(cells))
    expect(recordTerminalWebglDiagnostic).not.toHaveBeenCalled()
    sampleWith(divergenceOf(cells))
    expect(recordTerminalWebglDiagnostic).toHaveBeenCalledWith(
      'webgl-render-desync',
      expect.objectContaining({ paneKey: 'm1:p1', missing: 120 })
    )
    expect(resetAndRefreshAllTerminalWebglAtlases).toHaveBeenCalledTimes(1)
    expect(getRenderDesyncEvidence()).toHaveLength(1)
    expect(getRenderDesyncEvidence()[0].bufferText).toContain('x')
  })

  it('forces a synchronous full redraw before measuring', () => {
    const { refreshRows } = sampleWith(divergenceOf(manyCells(0)))
    expect(refreshRows).toHaveBeenCalledWith(0, 23, true)
  })

  it('does not trip when the missing cells move between samples (scroll lag)', () => {
    sampleWith(divergenceOf(manyCells(0)))
    sampleWith(divergenceOf(manyCells(500)))
    sampleWith(divergenceOf(manyCells(1000)))
    sampleWith(divergenceOf(manyCells(1500)))
    expect(recordTerminalWebglDiagnostic).not.toHaveBeenCalled()
    expect(resetAndRefreshAllTerminalWebglAtlases).not.toHaveBeenCalled()
  })

  it('does not trip below the missing-percentage threshold', () => {
    const few = Array.from({ length: 10 }, (_, i) => i)
    sampleWith(divergenceOf(few))
    sampleWith(divergenceOf(few))
    sampleWith(divergenceOf(few))
    expect(recordTerminalWebglDiagnostic).not.toHaveBeenCalled()
  })

  it('resets tracking for paused panes instead of sampling them', () => {
    const cells = manyCells(0)
    sampleWith(divergenceOf(cells))
    sampleWith(divergenceOf(cells))
    sampleWith(divergenceOf(cells), true)
    sampleWith(divergenceOf(cells))
    sampleWith(divergenceOf(cells))
    expect(recordTerminalWebglDiagnostic).not.toHaveBeenCalled()
  })

  it('stays disarmed without the localStorage flag and arms with it', () => {
    vi.useFakeTimers()
    try {
      // The interval path runs the real measure; keep pane iteration inert so
      // this test only asserts arming behavior.
      forEachLivePaneForDesyncSentinel.mockImplementation(() => {})
      const storage = new Map<string, string>()
      vi.stubGlobal('localStorage', {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => storage.set(k, v)
      })
      maybeStartTerminalRenderDesyncSentinel()
      vi.advanceTimersByTime(20_000)
      expect(forEachLivePaneForDesyncSentinel).not.toHaveBeenCalled()

      storage.set(RENDER_DESYNC_SENTINEL_FLAG, '1')
      maybeStartTerminalRenderDesyncSentinel()
      vi.advanceTimersByTime(5_100)
      expect(forEachLivePaneForDesyncSentinel).toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
      vi.useRealTimers()
    }
  })
})
