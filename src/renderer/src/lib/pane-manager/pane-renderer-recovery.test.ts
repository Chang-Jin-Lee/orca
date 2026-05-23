import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ManagedPaneInternal } from './pane-manager-types'
import { cancelPaneRendererRecovery, schedulePaneRendererRecovery } from './pane-renderer-recovery'

const webglMock = vi.hoisted(() => ({
  dispose: vi.fn()
}))

vi.mock('@xterm/addon-webgl', () => ({
  WebglAddon: vi.fn().mockImplementation(function WebglAddon() {
    return {
      dispose: webglMock.dispose,
      onContextLoss: vi.fn()
    }
  })
}))

function createPane(): ManagedPaneInternal {
  const leafId = '11111111-1111-4111-8111-111111111111' as never
  return {
    id: 1,
    leafId,
    stablePaneId: leafId,
    terminal: {
      cols: 80,
      rows: 24,
      element: {} as HTMLElement,
      loadAddon: vi.fn(),
      refresh: vi.fn()
    } as never,
    container: { dataset: {} } as never,
    xtermContainer: {} as never,
    linkTooltip: {} as never,
    terminalGpuAcceleration: 'auto',
    gpuRenderingEnabled: true,
    webglAttachmentDeferred: false,
    webglDisabledAfterContextLoss: false,
    hasComplexScriptOutput: false,
    webglAddon: {
      dispose: vi.fn()
    } as never,
    ligaturesAddon: null,
    fitResizeObserver: null,
    pendingObservedFitRafId: null,
    fitAddon: {
      proposeDimensions: vi.fn(() => ({ cols: 80, rows: 23 })),
      fit: vi.fn()
    } as never,
    searchAddon: {} as never,
    serializeAddon: {} as never,
    unicode11Addon: {} as never,
    webLinksAddon: {} as never,
    compositionHandler: null,
    pendingSplitScrollState: null,
    debugLabel: null
  }
}

describe('schedulePaneRendererRecovery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('navigator', {
      platform: 'MacIntel',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    })
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(16)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    webglMock.dispose.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('reattaches active WebGL panes to rebuild the glyph atlas', () => {
    const pane = createPane()
    const oldWebglDispose = vi.mocked(pane.webglAddon!.dispose)

    schedulePaneRendererRecovery(pane, { delayMs: 5 })
    vi.advanceTimersByTime(5)

    expect(oldWebglDispose).toHaveBeenCalledTimes(1)
    expect(pane.terminal.loadAddon).toHaveBeenCalledTimes(1)
    expect(pane.terminal.refresh).toHaveBeenCalledWith(0, 23)
  })

  it('refreshes DOM-rendered panes without trying to attach WebGL', () => {
    const pane = createPane()
    pane.webglAddon = null
    pane.terminalGpuAcceleration = 'off'

    schedulePaneRendererRecovery(pane, { delayMs: 5 })
    vi.advanceTimersByTime(5)

    expect(pane.terminal.loadAddon).not.toHaveBeenCalled()
    expect(pane.terminal.refresh).toHaveBeenCalledWith(0, 23)
  })

  it('does not recover panes while rendering is suspended', () => {
    const pane = createPane()
    const oldWebglDispose = vi.mocked(pane.webglAddon!.dispose)
    pane.webglAttachmentDeferred = true

    schedulePaneRendererRecovery(pane, { delayMs: 5 })
    vi.advanceTimersByTime(5)

    expect(oldWebglDispose).not.toHaveBeenCalled()
    expect(pane.terminal.loadAddon).not.toHaveBeenCalled()
  })

  it('cancels a pending recovery for disposed panes', () => {
    const pane = createPane()
    const oldWebglDispose = vi.mocked(pane.webglAddon!.dispose)

    schedulePaneRendererRecovery(pane, { delayMs: 5 })
    cancelPaneRendererRecovery(pane)
    vi.advanceTimersByTime(5)

    expect(oldWebglDispose).not.toHaveBeenCalled()
    expect(pane.terminal.loadAddon).not.toHaveBeenCalled()
  })
})
