import { useAppStore } from '@/store'
import { recordRendererCrashBreadcrumb } from '@/lib/crash-breadcrumb-recorder'

// Why this module exists: a terminal pane can die renderer-side while its PTY
// stays alive — a wedged xterm WriteBuffer (issue #2836), a disposed xterm
// still receiving writes, or a transport that lost its PTY binding across a
// remount race. Every pre-existing recovery path (dead-session reconcile,
// hibernation wake) gates on the PTY being dead, so these panes stayed
// fossils: last frame painted, every keystroke silently dropped, until the
// user reloaded the window (issue #8104 class). Recovery here reuses the
// proven remount seam — bumping the tab's generation unmounts TerminalPane,
// detach() preserves the live PTY, and the remounted pane builds a fresh
// xterm that reattaches and replays the daemon snapshot. No shell restart.

export type TerminalPaneRecoveryReason = 'write-stalled' | 'replay-wedged' | 'input-undeliverable'

type RecoveryRequest = {
  tabId: string
  ptyId: string | null
  reason: TerminalPaneRecoveryReason
  /** Remote panes (runtime mirrors, app-SSH) must prove the PTY alive before
   *  an input-undeliverable remount: pty:hasPty answers null for ids the local
   *  registry doesn't own, and treating null as "proceed" would let a
   *  disconnected remote pane churn reconnects on every cooldown window. */
  requireAuthoritativeLiveness?: boolean
}

// Why a cap exists: recovery must never loop. If the remounted pane wedges
// again (e.g. a deterministic parser throw in restored content), repeated
// bumps would remount-storm. The window is generous because a legitimate
// second recovery (new wedge minutes later) should still work.
const MAX_RECOVERIES_PER_WINDOW = 3
const RECOVERY_WINDOW_MS = 5 * 60_000
// Why a cooldown exists: one incident can trip several detectors (stall watch,
// replay guard, input path) within seconds; the first remount fixes all of
// them, the rest must coalesce instead of re-remounting mid-reattach.
const RECOVERY_COOLDOWN_MS = 15_000

const recoveryTimestampsByTabId = new Map<string, number[]>()

function underRecoveryBudget(tabId: string, now: number): boolean {
  const timestamps = recoveryTimestampsByTabId.get(tabId) ?? []
  const recent = timestamps.filter((t) => now - t < RECOVERY_WINDOW_MS)
  if (recent.length !== timestamps.length) {
    recoveryTimestampsByTabId.set(tabId, recent)
  }
  if (recent.length >= MAX_RECOVERIES_PER_WINDOW) {
    return false
  }
  const last = recent.at(-1)
  return last === undefined || now - last >= RECOVERY_COOLDOWN_MS
}

/**
 * Remount the pane's tab to rebuild its renderer over the live PTY. Returns
 * true when a remount was actually requested.
 *
 * For 'input-undeliverable' the PTY is liveness-checked first: a dead PTY is
 * the dead-session reconcile's job (it tears down and reports "Process
 * exited"), and remounting there would race it.
 */
export async function requestTerminalPaneRecovery(request: RecoveryRequest): Promise<boolean> {
  const now = Date.now()
  if (!underRecoveryBudget(request.tabId, now)) {
    return false
  }
  if (request.reason === 'input-undeliverable') {
    if (!request.ptyId) {
      return false
    }
    try {
      const live = await window.api.pty.hasPty(request.ptyId)
      if (live === false) {
        return false
      }
      if (request.requireAuthoritativeLiveness && live !== true) {
        return false
      }
    } catch {
      if (request.requireAuthoritativeLiveness) {
        return false
      }
      // Liveness unknown (IPC hiccup) on a local pane: proceed — a remount
      // over a dead PTY degrades to the existing dead-pane rendering, not a
      // broken state.
    }
    // Re-check the budget across the await: a concurrent detector may have
    // already consumed it for this tab.
    if (!underRecoveryBudget(request.tabId, Date.now())) {
      return false
    }
  }
  let remounted = false
  try {
    remounted = useAppStore.getState().remountTerminalTabForRecovery(request.tabId)
  } catch {
    // Why: recovery fires from timer and write-callback contexts (stall watch,
    // replay guard, onData) — it is best-effort by contract and must never
    // surface a throw there (partial store surfaces in tests, teardown races).
    // The breadcrumb is the only trace of a production failure loop here: the
    // budget was not consumed, so the detector will retry each cooldown.
    // recordRendererCrashBreadcrumb is itself guarded and cannot throw.
    recordRendererCrashBreadcrumb('terminal_pane_recovery_failed', {
      tabId: request.tabId,
      reason: request.reason
    })
    return false
  }
  if (!remounted) {
    return false
  }
  const timestamps = recoveryTimestampsByTabId.get(request.tabId) ?? []
  timestamps.push(Date.now())
  recoveryTimestampsByTabId.set(request.tabId, timestamps)
  console.error(
    `[terminal] recovering pane tab ${request.tabId} — ${request.reason} with a live PTY (${request.ptyId ?? 'unbound'}); remounting to rebuild the renderer`
  )
  recordRendererCrashBreadcrumb('terminal_pane_recovery_remount', {
    tabId: request.tabId,
    reason: request.reason
  })
  return true
}

export function _resetTerminalPaneRecoveryForTests(): void {
  recoveryTimestampsByTabId.clear()
}
