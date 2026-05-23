import type { ManagedPaneInternal } from './pane-manager-types'
import { safeFit } from './pane-tree-ops'
import { attachWebgl, disposeWebgl } from './pane-webgl-renderer'

const DEFAULT_RENDERER_RECOVERY_DELAY_MS = 120
const MIN_RENDERER_RECOVERY_INTERVAL_MS = 1_500

type PendingRendererRecovery = {
  rafId: number | null
  timeoutId: ReturnType<typeof setTimeout> | null
}

const pendingRecoveryByPane = new WeakMap<ManagedPaneInternal, PendingRendererRecovery>()
const lastRecoveryAtByPane = new WeakMap<ManagedPaneInternal, number>()

function refreshTerminalBuffer(pane: ManagedPaneInternal): void {
  if (pane.terminal.rows <= 0) {
    return
  }
  pane.terminal.refresh(0, pane.terminal.rows - 1)
}

function runPaneRendererRecovery(pane: ManagedPaneInternal): void {
  if (pane.webglAttachmentDeferred || !pane.terminal.element) {
    return
  }

  try {
    if (pane.webglAddon) {
      // Why: reported corruption matched a stale WebGL glyph atlas; a plain
      // xterm refresh does not rebuild that atlas, but reattaching WebGL does.
      disposeWebgl(pane)
      attachWebgl(pane)
      safeFit(pane)
      return
    }
    refreshTerminalBuffer(pane)
  } catch {
    /* ignore — renderer recovery is best effort */
  }
}

export function schedulePaneRendererRecovery(
  pane: ManagedPaneInternal,
  options: { delayMs?: number } = {}
): void {
  if (pendingRecoveryByPane.has(pane)) {
    return
  }

  const now = Date.now()
  const lastRecoveryAt = lastRecoveryAtByPane.get(pane) ?? 0
  const throttleDelay = Math.max(0, MIN_RENDERER_RECOVERY_INTERVAL_MS - (now - lastRecoveryAt))
  const delayMs = Math.max(options.delayMs ?? DEFAULT_RENDERER_RECOVERY_DELAY_MS, throttleDelay)
  const pending: PendingRendererRecovery = { rafId: null, timeoutId: null }
  pendingRecoveryByPane.set(pane, pending)
  pending.timeoutId = setTimeout(() => {
    pending.timeoutId = null
    const recover = (): void => {
      pending.rafId = null
      pendingRecoveryByPane.delete(pane)
      if (pane.webglAttachmentDeferred || !pane.terminal.element) {
        return
      }
      lastRecoveryAtByPane.set(pane, Date.now())
      runPaneRendererRecovery(pane)
    }

    if (typeof requestAnimationFrame === 'function') {
      pending.rafId = requestAnimationFrame(recover)
      return
    }
    recover()
  }, delayMs)
}

export function cancelPaneRendererRecovery(pane: ManagedPaneInternal): void {
  const pending = pendingRecoveryByPane.get(pane)
  if (!pending) {
    return
  }
  if (pending.timeoutId !== null) {
    clearTimeout(pending.timeoutId)
  }
  if (pending.rafId !== null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(pending.rafId)
  }
  pendingRecoveryByPane.delete(pane)
}
