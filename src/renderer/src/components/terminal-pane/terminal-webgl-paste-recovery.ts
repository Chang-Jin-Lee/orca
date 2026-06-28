import { resetAllTerminalWebglAtlases } from '@/lib/pane-manager/pane-manager-registry'

const PASTE_ATLAS_RECOVERY_DELAYS_MS = [120, 500]

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
    // recovery reset must rebuild every live terminal's render model — a
    // single-manager reset would garble the others.
    resetAllTerminalWebglAtlases()
  } catch {
    /* ignore - terminal pane may have unmounted after paste */
  }
}

export function schedulePasteWebglAtlasRecovery(): void {
  // Why: a TUI (e.g. Claude Code) redraws immediately after a bracketed paste —
  // an image chip, or a pasted URL/text — and xterm WebGL atlas corruption can
  // appear after that redraw without a context-loss event. A few cheap resets
  // cover the post-paste paint window.
  scheduleNextFrame(() => resetAtlases())
  for (const delayMs of PASTE_ATLAS_RECOVERY_DELAYS_MS) {
    globalThis.setTimeout(() => resetAtlases(), delayMs)
  }
}

// Recover the atlas only when the paste reaches the TUI bracketed — that wrap
// triggers the redraw that can corrupt it (image paste, or a text/URL paste
// into a bracketed-paste-mode TUI, issue #5960). Plain direct pastes don't.
export function maybeScheduleWebglAtlasRecoveryForPaste(plan: {
  bracketedToTerminal: boolean
}): void {
  if (plan.bracketedToTerminal) {
    schedulePasteWebglAtlasRecovery()
  }
}
