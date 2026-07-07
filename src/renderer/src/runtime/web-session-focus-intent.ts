// Why: a remote tab create/activate is the ONE case where the session snapshot's
// activeTabId reflects genuine user focus intent. Status-echo snapshots (e.g. an
// agent "thinking" during a run) also set activeTabId but must NOT steal focus
// (#5435). The snapshot can't distinguish these, so the client records its own
// activation intent here: the reconcile only follows the snapshot's active tab
// when it matches a pending intent the client itself initiated.
//
// Keyed by worktree id → the host session tab id the client expects to focus.
// The intent persists until a snapshot matches it (surviving racing/duplicate
// snapshots, unlike a transient per-snapshot flag).

// Why: a create/activate echo should arrive quickly; if a removed worktree never
// publishes again, the focus intent needs a bounded lifetime.
const FOCUS_INTENT_TTL_MS = 60_000
export const MAX_WEB_SESSION_FOCUS_INTENT_WORKTREES = 256

type FocusIntent = { hostTabId: string; recordedAt: number }

const pendingFocusByWorktree = new Map<string, FocusIntent>()

function pruneExpiredWebSessionFocusIntents(now: number): void {
  for (const [worktreeId, intent] of pendingFocusByWorktree) {
    if (now - intent.recordedAt > FOCUS_INTENT_TTL_MS) {
      pendingFocusByWorktree.delete(worktreeId)
    }
  }
}

function trimWebSessionFocusIntents(): void {
  while (pendingFocusByWorktree.size > MAX_WEB_SESSION_FOCUS_INTENT_WORKTREES) {
    const oldestWorktreeId = pendingFocusByWorktree.keys().next().value
    if (oldestWorktreeId === undefined) {
      break
    }
    pendingFocusByWorktree.delete(oldestWorktreeId)
  }
}

export function recordWebSessionFocusIntent(
  worktreeId: string,
  hostTabId: string,
  now = Date.now()
): void {
  const trimmed = hostTabId.trim()
  if (!worktreeId || !trimmed) {
    return
  }
  pruneExpiredWebSessionFocusIntents(now)
  pendingFocusByWorktree.delete(worktreeId)
  pendingFocusByWorktree.set(worktreeId, { hostTabId: trimmed, recordedAt: now })
  trimWebSessionFocusIntents()
}

export function peekWebSessionFocusIntent(worktreeId: string, now = Date.now()): string | null {
  const intent = pendingFocusByWorktree.get(worktreeId)
  if (!intent) {
    return null
  }
  if (now - intent.recordedAt > FOCUS_INTENT_TTL_MS) {
    pendingFocusByWorktree.delete(worktreeId)
    return null
  }
  pendingFocusByWorktree.delete(worktreeId)
  pendingFocusByWorktree.set(worktreeId, intent)
  return intent.hostTabId
}

export function clearWebSessionFocusIntent(worktreeId: string): void {
  pendingFocusByWorktree.delete(worktreeId)
}

export function resetWebSessionFocusIntentForTests(): void {
  pendingFocusByWorktree.clear()
}

export function getWebSessionFocusIntentCountForTests(): number {
  return pendingFocusByWorktree.size
}
