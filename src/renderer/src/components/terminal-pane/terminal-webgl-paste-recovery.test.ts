import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import {
  registerLivePaneManager,
  unregisterLivePaneManager
} from '@/lib/pane-manager/pane-manager-registry'
import {
  beginPasteWebglAtlasRecoveryForPaste,
  schedulePasteWebglAtlasRecovery
} from './terminal-webgl-paste-recovery'

describe('terminal paste WebGL recovery', () => {
  const registeredManagers: { resetWebglTextureAtlases(): void }[] = []

  function registerManager(): { resetWebglTextureAtlases: Mock<() => void> } {
    const manager = { resetWebglTextureAtlases: vi.fn<() => void>() }
    registerLivePaneManager(manager)
    registeredManagers.push(manager)
    return manager
  }

  function stubAnimationFrame(): {
    flushNextFrame: () => void
    requestAnimationFrame: Mock<(callback: FrameRequestCallback) => number>
  } {
    const rafCallbacks: FrameRequestCallback[] = []
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback)
      return rafCallbacks.length
    })
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame)
    return {
      flushNextFrame: () => {
        rafCallbacks.shift()?.(0)
      },
      requestAnimationFrame
    }
  }

  function createRecoveryTerminal(): {
    terminal: NonNullable<Parameters<typeof beginPasteWebglAtlasRecoveryForPaste>[1]>
    fireWriteParsed: () => void
    fireRender: () => void
    listenerCounts: () => { writeParsed: number; render: number }
  } {
    const writeParsedListeners = new Set<() => void>()
    const renderListeners = new Set<(event: { start: number; end: number }) => void>()
    return {
      terminal: {
        onWriteParsed(listener: () => void) {
          writeParsedListeners.add(listener)
          return { dispose: () => writeParsedListeners.delete(listener) }
        },
        onRender(listener: (event: { start: number; end: number }) => void) {
          renderListeners.add(listener)
          return { dispose: () => renderListeners.delete(listener) }
        }
      },
      fireWriteParsed: () => {
        for (const listener of writeParsedListeners) {
          listener()
        }
      },
      fireRender: () => {
        for (const listener of renderListeners) {
          listener({ start: 0, end: 0 })
        }
      },
      listenerCounts: () => ({
        writeParsed: writeParsedListeners.size,
        render: renderListeners.size
      })
    }
  }

  afterEach(() => {
    for (const manager of registeredManagers.splice(0)) {
      unregisterLivePaneManager(manager)
    }
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('clears atlases on the next frame', () => {
    vi.useFakeTimers()
    const { flushNextFrame } = stubAnimationFrame()
    // Why: resets go through the live-manager registry so every terminal
    // sharing the glyph atlas rebuilds, not just the pasted-into pane.
    const manager = registerManager()
    const otherManager = registerManager()

    schedulePasteWebglAtlasRecovery()

    expect(manager.resetWebglTextureAtlases).not.toHaveBeenCalled()
    flushNextFrame()
    expect(manager.resetWebglTextureAtlases).toHaveBeenCalledTimes(1)
    expect(otherManager.resetWebglTextureAtlases).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(500)
    expect(manager.resetWebglTextureAtlases).toHaveBeenCalledTimes(1)
  })

  it('falls back to a timeout when animation frames are unavailable', () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', undefined)
    const manager = registerManager()

    schedulePasteWebglAtlasRecovery()

    expect(manager.resetWebglTextureAtlases).not.toHaveBeenCalled()
    vi.advanceTimersByTime(0)
    expect(manager.resetWebglTextureAtlases).toHaveBeenCalledTimes(1)
  })

  it('ignores resets after the pane has unmounted', () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        callback(0)
        return 1
      })
    )
    const manager = {
      resetWebglTextureAtlases: vi.fn(() => {
        throw new Error('pane disposed')
      })
    }
    registerLivePaneManager(manager)
    registeredManagers.push(manager)

    expect(() => schedulePasteWebglAtlasRecovery()).not.toThrow()
    expect(() => vi.runAllTimers()).not.toThrow()
  })

  describe('beginPasteWebglAtlasRecoveryForPaste', () => {
    it('waits for parsed output and the following render before clearing atlases', () => {
      vi.useFakeTimers()
      const { flushNextFrame } = stubAnimationFrame()
      const manager = registerManager()
      const terminal = createRecoveryTerminal()

      const recovery = beginPasteWebglAtlasRecoveryForPaste(
        { bracketedToTerminal: true },
        terminal.terminal
      )
      recovery.complete()

      terminal.fireWriteParsed()
      expect(manager.resetWebglTextureAtlases).not.toHaveBeenCalled()

      terminal.fireRender()
      expect(manager.resetWebglTextureAtlases).not.toHaveBeenCalled()

      flushNextFrame()
      expect(manager.resetWebglTextureAtlases).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(500)
      expect(terminal.listenerCounts()).toEqual({ writeParsed: 0, render: 0 })
    })

    it('captures the render even if output parses before paste completion', () => {
      vi.useFakeTimers()
      const { flushNextFrame } = stubAnimationFrame()
      const manager = registerManager()
      const terminal = createRecoveryTerminal()

      const recovery = beginPasteWebglAtlasRecoveryForPaste(
        { bracketedToTerminal: true },
        terminal.terminal
      )

      terminal.fireWriteParsed()
      terminal.fireRender()
      expect(manager.resetWebglTextureAtlases).not.toHaveBeenCalled()

      recovery.complete()
      flushNextFrame()

      expect(manager.resetWebglTextureAtlases).toHaveBeenCalledTimes(1)
    })

    it('does not reset during a quiet bracketed paste with no post-paste render', () => {
      vi.useFakeTimers()
      const manager = registerManager()
      const terminal = createRecoveryTerminal()

      const recovery = beginPasteWebglAtlasRecoveryForPaste(
        { bracketedToTerminal: true },
        terminal.terminal
      )
      recovery.complete()

      vi.advanceTimersByTime(500)

      expect(manager.resetWebglTextureAtlases).not.toHaveBeenCalled()
      expect(terminal.listenerCounts()).toEqual({ writeParsed: 0, render: 0 })
    })

    it('caps event-driven recovery and disposes listeners', () => {
      vi.useFakeTimers()
      const { flushNextFrame } = stubAnimationFrame()
      const manager = registerManager()
      const terminal = createRecoveryTerminal()

      const recovery = beginPasteWebglAtlasRecoveryForPaste(
        { bracketedToTerminal: true },
        terminal.terminal
      )
      recovery.complete()

      terminal.fireWriteParsed()
      terminal.fireRender()
      flushNextFrame()
      terminal.fireWriteParsed()
      terminal.fireRender()
      flushNextFrame()

      expect(manager.resetWebglTextureAtlases).toHaveBeenCalledTimes(2)
      expect(terminal.listenerCounts()).toEqual({ writeParsed: 0, render: 0 })

      terminal.fireWriteParsed()
      terminal.fireRender()
      flushNextFrame()
      expect(manager.resetWebglTextureAtlases).toHaveBeenCalledTimes(2)
    })

    it('cancels recovery when paste execution fails', () => {
      vi.useFakeTimers()
      const { flushNextFrame } = stubAnimationFrame()
      const manager = registerManager()
      const terminal = createRecoveryTerminal()

      const recovery = beginPasteWebglAtlasRecoveryForPaste(
        { bracketedToTerminal: true },
        terminal.terminal
      )

      terminal.fireWriteParsed()
      terminal.fireRender()
      recovery.cancel()
      recovery.complete()
      flushNextFrame()

      expect(manager.resetWebglTextureAtlases).not.toHaveBeenCalled()
      expect(terminal.listenerCounts()).toEqual({ writeParsed: 0, render: 0 })
    })

    it('skips observation when the paste is not delivered bracketed', () => {
      vi.useFakeTimers()
      vi.stubGlobal('requestAnimationFrame', undefined)
      const manager = registerManager()
      const terminal = createRecoveryTerminal()

      const recovery = beginPasteWebglAtlasRecoveryForPaste(
        { bracketedToTerminal: false },
        terminal.terminal
      )
      recovery.complete()
      terminal.fireWriteParsed()
      terminal.fireRender()

      vi.advanceTimersByTime(500)
      expect(manager.resetWebglTextureAtlases).not.toHaveBeenCalled()
      expect(terminal.listenerCounts()).toEqual({ writeParsed: 0, render: 0 })
    })

    it('falls back to next-frame recovery when no terminal observer is provided', () => {
      vi.useFakeTimers()
      vi.stubGlobal('requestAnimationFrame', undefined)
      const manager = registerManager()

      const recovery = beginPasteWebglAtlasRecoveryForPaste({ bracketedToTerminal: true })
      recovery.complete()

      vi.advanceTimersByTime(0)
      expect(manager.resetWebglTextureAtlases).toHaveBeenCalledTimes(1)
    })
  })
})
