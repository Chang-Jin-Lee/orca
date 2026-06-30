import type { IDisposable, Terminal } from '@xterm/xterm'
import { resetAllTerminalWebglAtlases } from '@/lib/pane-manager/pane-manager-registry'

const PASTE_ATLAS_RECOVERY_WINDOW_MS = 500
const PASTE_ATLAS_RECOVERY_MAX_RENDER_RESETS = 2

type PasteRecoveryTerminal = Pick<Terminal, 'onRender' | 'onWriteParsed'>

type PasteWebglAtlasRecovery = {
  complete(): void
  cancel(): void
}

const NOOP_RECOVERY: PasteWebglAtlasRecovery = {
  complete() {},
  cancel() {}
}

function scheduleNextFrame(callback: () => void): void {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    globalThis.requestAnimationFrame(callback)
    return
  }
  globalThis.setTimeout(callback, 0)
}

function resetAtlases(): void {
  try {
    // Why: the glyph atlas is shared across same-config terminals, so the
    // recovery reset must rebuild every live terminal's render model; a
    // single-manager reset would garble the others.
    resetAllTerminalWebglAtlases()
  } catch {
    /* ignore - terminal pane may have unmounted after paste */
  }
}

export function schedulePasteWebglAtlasRecovery(): void {
  // Why: xterm WebGL atlas corruption can appear after a TUI redraw without a
  // context-loss event. Clearing the atlas after that render preserves GPU.
  scheduleNextFrame(() => resetAtlases())
}

export function beginPasteWebglAtlasRecoveryForPaste(
  plan: { bracketedToTerminal: boolean },
  terminal?: PasteRecoveryTerminal
): PasteWebglAtlasRecovery {
  // Recover only when the paste reaches the TUI bracketed. That wrap triggers
  // the redraw that can corrupt the atlas; plain direct pastes do not.
  if (!plan.bracketedToTerminal) {
    return NOOP_RECOVERY
  }
  if (!terminal) {
    return {
      complete: () => schedulePasteWebglAtlasRecovery(),
      cancel() {}
    }
  }
  return beginRenderDrivenWebglAtlasRecovery(terminal)
}

function beginRenderDrivenWebglAtlasRecovery(
  terminal: PasteRecoveryTerminal
): PasteWebglAtlasRecovery {
  let active = true
  let pasteCompleted = false
  let pendingPostPasteRender = false
  let resetCount = 0
  let writeParsedDisposable: IDisposable | null = null
  let renderDisposable: IDisposable | null = null
  let cleanupTimerId: ReturnType<typeof globalThis.setTimeout> | null = null

  const cleanup = (): void => {
    if (!active) {
      return
    }
    active = false
    writeParsedDisposable?.dispose()
    writeParsedDisposable = null
    renderDisposable?.dispose()
    renderDisposable = null
    if (cleanupTimerId !== null) {
      globalThis.clearTimeout(cleanupTimerId)
      cleanupTimerId = null
    }
  }

  const scheduleRecoveryReset = (): void => {
    if (!active) {
      return
    }
    scheduleNextFrame(() => {
      if (!active) {
        return
      }
      resetAtlases()
      resetCount += 1
      if (resetCount >= PASTE_ATLAS_RECOVERY_MAX_RENDER_RESETS) {
        cleanup()
      }
    })
  }

  const startCleanupTimer = (): void => {
    // Why: the window starts after paste success so slow SSH/chunked writes
    // don't expire recovery before the TUI can redraw.
    cleanupTimerId = globalThis.setTimeout(cleanup, PASTE_ATLAS_RECOVERY_WINDOW_MS)
  }

  const armRenderListener = (): void => {
    if (!active || renderDisposable) {
      return
    }
    renderDisposable = terminal.onRender(() => {
      renderDisposable?.dispose()
      renderDisposable = null
      if (!active) {
        return
      }
      if (!pasteCompleted) {
        pendingPostPasteRender = true
        return
      }
      scheduleRecoveryReset()
    })
  }

  // Why: subscribe before paste execution completes so fast local PTY echoes
  // cannot render before recovery is armed.
  writeParsedDisposable = terminal.onWriteParsed(() => armRenderListener())

  return {
    complete() {
      if (!active || pasteCompleted) {
        return
      }
      pasteCompleted = true
      startCleanupTimer()
      if (pendingPostPasteRender) {
        pendingPostPasteRender = false
        scheduleRecoveryReset()
      }
    },
    cancel: cleanup
  }
}
