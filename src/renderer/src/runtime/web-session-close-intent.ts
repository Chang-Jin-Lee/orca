// Why: closing a remote tab prunes the local mirror immediately for
// responsiveness, then asks the host to close it. But an in-flight host snapshot
// (published before the host processed the close, or the close RPC's own
// pre-close subscribe replay) can arrive AFTER the local prune and still contain
// the tab — the reconcile then re-materializes the just-closed tab, which the
// host's real post-close snapshot removes again a beat later. That round trip is
// the close "flash and reappear".
//
// The client records its own close intent here (host tab id pending removal).
// The reconcile drops any host tab matching a pending intent until a snapshot
// confirms the removal (tab absent), then clears it — mirroring the focus-intent
// mechanism. A TTL guards against a never-confirmed close (e.g. failed RPC)
// permanently hiding a tab that legitimately still exists host-side.

const CLOSE_INTENT_TTL_MS = 10_000
export const MAX_WEB_SESSION_CLOSE_INTENT_WORKTREES = 256

type CloseIntent = { recordedAt: number }

// worktreeId -> (hostTabId -> intent)
const pendingCloseByWorktree = new Map<string, Map<string, CloseIntent>>()

function deleteEmptyCloseIntentWorktree(worktreeId: string, byTab: Map<string, CloseIntent>): void {
  if (byTab.size === 0) {
    pendingCloseByWorktree.delete(worktreeId)
  }
}

function refreshCloseIntentWorktree(worktreeId: string, byTab: Map<string, CloseIntent>): void {
  pendingCloseByWorktree.delete(worktreeId)
  pendingCloseByWorktree.set(worktreeId, byTab)
}

function pruneExpiredWebSessionCloseIntents(now: number): void {
  for (const [worktreeId, byTab] of pendingCloseByWorktree) {
    for (const [hostTabId, intent] of byTab) {
      if (now - intent.recordedAt > CLOSE_INTENT_TTL_MS) {
        byTab.delete(hostTabId)
      }
    }
    deleteEmptyCloseIntentWorktree(worktreeId, byTab)
  }
}

function trimWebSessionCloseIntentWorktrees(): void {
  while (pendingCloseByWorktree.size > MAX_WEB_SESSION_CLOSE_INTENT_WORKTREES) {
    const oldestWorktreeId = pendingCloseByWorktree.keys().next().value
    if (oldestWorktreeId === undefined) {
      break
    }
    pendingCloseByWorktree.delete(oldestWorktreeId)
  }
}

export function recordWebSessionCloseIntent(
  worktreeId: string,
  hostTabId: string,
  now: number
): void {
  const trimmed = hostTabId.trim()
  if (!worktreeId || !trimmed) {
    return
  }
  // Why: close intents already expire; prune all worktrees on new writes so
  // removed worktrees that never reconcile again do not retain stale tab ids.
  pruneExpiredWebSessionCloseIntents(now)
  let byTab = pendingCloseByWorktree.get(worktreeId)
  if (!byTab) {
    byTab = new Map()
  }
  refreshCloseIntentWorktree(worktreeId, byTab)
  byTab.set(trimmed, { recordedAt: now })
  trimWebSessionCloseIntentWorktrees()
}

/**
 * Whether a host tab should be hidden because the client is closing it. Expired
 * intents are dropped (the close never confirmed — let the tab reappear rather
 * than hide it forever).
 */
export function isWebSessionCloseIntentPending(
  worktreeId: string,
  hostTabId: string,
  now: number
): boolean {
  const byTab = pendingCloseByWorktree.get(worktreeId)
  if (!byTab) {
    return false
  }
  const intent = byTab.get(hostTabId)
  if (!intent) {
    return false
  }
  if (now - intent.recordedAt > CLOSE_INTENT_TTL_MS) {
    byTab.delete(hostTabId)
    deleteEmptyCloseIntentWorktree(worktreeId, byTab)
    return false
  }
  refreshCloseIntentWorktree(worktreeId, byTab)
  return true
}

/**
 * Clear close intents the host snapshot has confirmed: any pending host tab id
 * NOT in `presentHostTabIds` has been removed host-side, so the intent is done.
 */
export function reconcileWebSessionCloseIntents(
  worktreeId: string,
  presentHostTabIds: ReadonlySet<string>
): void {
  const byTab = pendingCloseByWorktree.get(worktreeId)
  if (!byTab) {
    return
  }
  const confirmed: string[] = []
  for (const hostTabId of byTab.keys()) {
    if (!presentHostTabIds.has(hostTabId)) {
      confirmed.push(hostTabId)
    }
  }
  for (const hostTabId of confirmed) {
    byTab.delete(hostTabId)
  }
  if (byTab.size > 0) {
    refreshCloseIntentWorktree(worktreeId, byTab)
    return
  }
  pendingCloseByWorktree.delete(worktreeId)
}

export function clearWebSessionCloseIntentsForWorktree(worktreeId: string): void {
  pendingCloseByWorktree.delete(worktreeId)
}

export function resetWebSessionCloseIntentForTests(): void {
  pendingCloseByWorktree.clear()
}

export function getWebSessionCloseIntentCountsForTests(): { worktrees: number; tabs: number } {
  let tabs = 0
  for (const byTab of pendingCloseByWorktree.values()) {
    tabs += byTab.size
  }
  return { worktrees: pendingCloseByWorktree.size, tabs }
}
