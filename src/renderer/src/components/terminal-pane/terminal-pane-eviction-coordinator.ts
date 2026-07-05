// STA-1282: event-driven coordinator for terminal pane eviction.
//
// Owns the non-reactive eviction bookkeeping (last-visible timestamps, the
// currently-visible set, managed hidden panes, in-flight teardown generations,
// the single lazy dwell timer) and drives the store's reactive warm set
// (`terminalPaneMountByTabId`). It is deliberately off the React render path.
//
// Flow: an overlay slot reports its visibility (noteTerminalPaneVisibility). A
// pane that goes hidden becomes "managed" (kept warm). Recompute classifies
// managed panes with the pure policy; panes classified `evict` are torn down on
// a cancelable idle callback AFTER the switch paints (never in the switch
// commit), each keyed by a per-pane generation so a queued teardown is a no-op
// once the pane re-warms or a remount claims it (gate #9). The lifecycle reads
// the eviction signal (consumeTerminalPaneEviction) to choose park over detach.

import { useAppStore } from '@/store'
import { FLOATING_TERMINAL_WORKTREE_ID } from '../../../../shared/constants'
import { isTerminalPaneEvictionEnabled } from '../../../../shared/terminal-pane-eviction-settings'
import { computePaneMountPolicy, nextDwellExpiryAt } from './pane-mount-policy'
import type { PaneMountClassification, PaneMountPolicyInput } from './pane-mount-policy'
import {
  evictedPaneCount,
  onEvictionSelfDisable,
  reconcileEvictedPanes
} from './evicted-pane-registry'
import {
  buildEvictionPolicyInput,
  collectLiveTabAndWorktreeIds,
  computeEvictionInputSignature,
  shallowEqualBooleanMap
} from './terminal-pane-eviction-inputs'
import { logTerminalPaneEvictionBreadcrumb } from './terminal-pane-eviction-breadcrumbs'

type ManagedTab = { worktreeId: string }

const managedTabs = new Map<string, ManagedTab>()
const lastVisibleAt = new Map<string, number>()
const visibleTabIds = new Set<string>()
const generationByTab = new Map<string, number>()
const pendingTeardowns = new Map<string, { generation: number; cancel: () => void }>()
const evictingTabIds = new Set<string>()

let dwellTimer: ReturnType<typeof setTimeout> | null = null
let recomputeScheduled = false
let initialized = false
let storeUnsubscribe: (() => void) | null = null
let selfDisableUnsubscribe: (() => void) | null = null
let lastInputSignature = ''

function scheduleIdle(callback: () => void): () => void {
  const idle = (globalThis as { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback
  const cancelIdle = (globalThis as { cancelIdleCallback?: (id: number) => void })
    .cancelIdleCallback
  if (typeof idle === 'function' && typeof cancelIdle === 'function') {
    const id = idle(callback)
    return () => cancelIdle(id)
  }
  const timer = setTimeout(callback, 0)
  return () => clearTimeout(timer)
}

function bumpGeneration(tabId: string): void {
  generationByTab.set(tabId, (generationByTab.get(tabId) ?? 0) + 1)
}

function cancelTeardown(tabId: string): void {
  const pending = pendingTeardowns.get(tabId)
  if (pending) {
    pending.cancel()
    pendingTeardowns.delete(tabId)
  }
}

const coordinatorContext = {
  managedTabs: managedTabs as ReadonlyMap<string, { worktreeId: string }>,
  lastVisibleAt: lastVisibleAt as ReadonlyMap<string, number>,
  visibleTabIds: visibleTabIds as ReadonlySet<string>
}

type StoreState = ReturnType<typeof useAppStore.getState>

function pushMountMap(): void {
  const next: Record<string, boolean> = {}
  for (const tabId of managedTabs.keys()) {
    next[tabId] = true
  }
  // Why: a visible tab must also be in the warm mount map so the overlay keeps it
  // mounted through the single render where it flips visible->hidden — that render
  // is when the slot's effect reports the hide (an unmounting slot never runs its
  // effect body). Without this the just-hidden pane unmounts in the same commit
  // and is never brought under management, defeating the warm set entirely.
  for (const tabId of visibleTabIds) {
    next[tabId] = true
  }
  const current = useAppStore.getState().terminalPaneMountByTabId
  // Why: skip the store write when unchanged so our own store subscription does
  // not re-trigger a recompute (avoids a feedback loop, keeps this off hot ticks).
  if (!shallowEqualBooleanMap(current, next)) {
    useAppStore.getState().setTerminalPaneMountByTabId(next)
  }
}

function clearDwellTimer(): void {
  if (dwellTimer !== null) {
    clearTimeout(dwellTimer)
    dwellTimer = null
  }
}

function currentPolicyInput(state: StoreState): PaneMountPolicyInput {
  return buildEvictionPolicyInput(state, coordinatorContext)
}

function pruneClosedManagedTabs(state: StoreState): void {
  // Deleting the current entry during Map iteration is safe.
  for (const [tabId, { worktreeId }] of managedTabs) {
    const worktreeTabs = state.tabsByWorktree[worktreeId]
    const stillExists = worktreeTabs?.some((tab) => tab.id === tabId)
    if (!stillExists) {
      managedTabs.delete(tabId)
      lastVisibleAt.delete(tabId)
      visibleTabIds.delete(tabId)
      cancelTeardown(tabId)
    }
  }
  // Why: a tab closed while visible never reports hidden, so prune stale visible
  // entries here too — otherwise the warm mount map (which now includes visible
  // tabs) would retain closed-tab ids across recomputes.
  if (visibleTabIds.size > 0) {
    const liveTabIds = collectLiveTabAndWorktreeIds(state).tabIds
    for (const tabId of visibleTabIds) {
      if (!liveTabIds.has(tabId)) {
        visibleTabIds.delete(tabId)
        lastVisibleAt.delete(tabId)
      }
    }
  }
}

function reconcileParkedForClose(state: StoreState): void {
  if (evictedPaneCount() === 0) {
    return
  }
  reconcileEvictedPanes(collectLiveTabAndWorktreeIds(state))
}

function armDwellTimer(
  input: PaneMountPolicyInput,
  precomputed?: ReadonlyMap<string, PaneMountClassification>
): void {
  clearDwellTimer()
  const expiresAt = nextDwellExpiryAt(input, precomputed)
  if (expiresAt === null) {
    return
  }
  // Single lazy timer for the soonest warm-pane dwell boundary — no polling.
  // Fire 1ms PAST the boundary: the dwell check is `now - lastVisibleAt <=
  // evictAfterMs` (inclusive), so recomputing exactly at the boundary would
  // still classify the pane warm and re-arm at the same instant (tight loop).
  const delay = Math.max(0, expiresAt - Date.now()) + 1
  dwellTimer = setTimeout(() => {
    dwellTimer = null
    recompute()
  }, delay)
}

function scheduleTeardown(tabId: string): void {
  if (pendingTeardowns.has(tabId)) {
    return
  }
  const generation = generationByTab.get(tabId) ?? 0
  const cancel = scheduleIdle(() => {
    pendingTeardowns.delete(tabId)
    fireTeardown(tabId, generation)
  })
  pendingTeardowns.set(tabId, { generation, cancel })
}

function fireTeardown(tabId: string, scheduledGeneration: number): void {
  // Gate #9: a teardown queued for generation N is a no-op once the pane
  // re-warmed or a remount claimed it (both bump the generation).
  if ((generationByTab.get(tabId) ?? 0) !== scheduledGeneration) {
    return
  }
  if (!managedTabs.has(tabId) || visibleTabIds.has(tabId)) {
    return
  }
  // Fire-time policy recheck: re-run against CURRENT state, never stale state.
  const state = useAppStore.getState()
  const input = currentPolicyInput(state)
  if (!input.evictionEnabled) {
    return
  }
  const result = computePaneMountPolicy(input)
  if (result.classifications.get(tabId) !== 'evict') {
    return
  }
  const worktreeId = managedTabs.get(tabId)?.worktreeId
  // Signal the eviction to the pane lifecycle BEFORE the unmounting store write
  // so the React cleanup reads it and chooses park() over detach()/destroy().
  evictingTabIds.add(tabId)
  managedTabs.delete(tabId)
  lastVisibleAt.delete(tabId)
  bumpGeneration(tabId)
  logTerminalPaneEvictionBreadcrumb('evict', {
    tabId,
    worktreeId,
    mountedCount: managedTabs.size,
    parkedCount: evictedPaneCount()
  })
  pushMountMap()
  armDwellTimer(currentPolicyInput(useAppStore.getState()))
}

function recompute(): void {
  recomputeScheduled = false
  const state = useAppStore.getState()
  pruneClosedManagedTabs(state)
  reconcileParkedForClose(state)
  if (managedTabs.size === 0) {
    pushMountMap()
    clearDwellTimer()
    return
  }
  const input = currentPolicyInput(state)
  const result = computePaneMountPolicy(input)
  for (const tabId of managedTabs.keys()) {
    if (result.classifications.get(tabId) === 'evict') {
      scheduleTeardown(tabId)
    } else {
      cancelTeardown(tabId)
    }
  }
  pushMountMap()
  armDwellTimer(input, result.classifications)
}

function scheduleRecompute(): void {
  if (recomputeScheduled) {
    return
  }
  recomputeScheduled = true
  queueMicrotask(recompute)
}

function reconcileDisabled(): void {
  // Disable reconciliation: cancel all pending teardowns so no further pane is
  // evicted; already-parked panes stay claimable on demand (no batch remount).
  for (const [, pending] of pendingTeardowns) {
    pending.cancel()
  }
  pendingTeardowns.clear()
  clearDwellTimer()
  scheduleRecompute()
}

function deactivateEvictionAtRuntime(state: StoreState): void {
  // The `experimentalTerminalPaneEviction` setting was flipped OFF at runtime.
  // Stop evicting without a full recompute/signature hash: cancel queued
  // teardowns, drop the dwell timer, and keep the parked registry consistent so
  // a parked tab that closes while disabled is still reaped (gate #8).
  //
  // Runs on every store tick while disabled (managed warm panes keep the
  // subscriber alive), so it must stay cheap: skip the O(managed) managed-tab
  // prune — while disabled the warm mount map is ignored (the overlay mounts
  // every non-parked tab) so stale managed ids are harmless and get cleaned on
  // re-enable. Only the parked close-reconcile is load-bearing, and it itself
  // early-returns when nothing is parked.
  if (pendingTeardowns.size > 0) {
    for (const [, pending] of pendingTeardowns) {
      pending.cancel()
    }
    pendingTeardowns.clear()
  }
  clearDwellTimer()
  reconcileParkedForClose(state)
}

function ensureInitialized(): void {
  if (initialized) {
    return
  }
  initialized = true
  storeUnsubscribe = useAppStore.subscribe(() => {
    if (managedTabs.size === 0 && evictedPaneCount() === 0) {
      // No steady-state work when nothing is hidden or parked.
      return
    }
    const state = useAppStore.getState()
    if (!isTerminalPaneEvictionEnabled(state.settings)) {
      // Flag-OFF inertness: the setting was flipped OFF at runtime. Deactivate
      // eviction (cancel any queued teardown + the dwell timer) and stop hashing
      // signatures — but keep the parked registry consistent so a closed parked
      // tab's PTY is still reaped (gate #8). Already-parked panes stay claimable
      // on demand; warm panes just stay mounted (the overlay mounts everything
      // non-parked while disabled). Re-enabling reactivates via the overlay
      // visibility reporter.
      deactivateEvictionAtRuntime(state)
      return
    }
    const signature = computeEvictionInputSignature(state, managedTabs)
    if (signature === lastInputSignature) {
      return
    }
    lastInputSignature = signature
    scheduleRecompute()
  })
  selfDisableUnsubscribe = onEvictionSelfDisable(() => {
    logTerminalPaneEvictionBreadcrumb('self-disable', { parkedCount: evictedPaneCount() })
    reconcileDisabled()
  })
}

/** Report an overlay slot's current visibility. The single entry point that
 *  brings a pane under eviction management (on visible -> hidden). */
export function noteTerminalPaneVisibility(
  tabId: string,
  worktreeId: string,
  isVisible: boolean
): void {
  // Policy scope excludes the floating quick-terminal (and other ungated
  // surfaces never reach this reporter).
  if (worktreeId === FLOATING_TERMINAL_WORKTREE_ID) {
    return
  }
  // Flag-OFF inertness: with eviction disabled the coordinator does no work at
  // all — it never subscribes, hashes, arms timers, or records timestamps. The
  // overlay reporter already gates on the setting; this guard keeps the
  // coordinator self-contained (and makes "disabled → zero subscriptions"
  // directly assertable). Enabling at runtime reactivates via the reporter.
  if (!isTerminalPaneEvictionEnabled(useAppStore.getState().settings)) {
    return
  }
  ensureInitialized()
  const now = Date.now()
  lastVisibleAt.set(tabId, now)
  if (isVisible) {
    visibleTabIds.add(tabId)
    // Re-warm / remount claim: invalidate any queued teardown (gate #9).
    bumpGeneration(tabId)
    cancelTeardown(tabId)
    managedTabs.delete(tabId)
  } else {
    visibleTabIds.delete(tabId)
    managedTabs.set(tabId, { worktreeId })
  }
  scheduleRecompute()
}

/** Read-and-clear the eviction signal for a tab. The pane lifecycle calls this
 *  during React cleanup to choose park() over detach()/destroy() (gate #1). */
export function consumeTerminalPaneEviction(tabId: string): boolean {
  const wasEvicting = evictingTabIds.has(tabId)
  evictingTabIds.delete(tabId)
  return wasEvicting
}

export function isTerminalPaneEvictionActive(): boolean {
  return managedTabs.size > 0 || evictedPaneCount() > 0
}

// Test-only reset.
export function __resetTerminalPaneEvictionCoordinatorForTest(): void {
  for (const [, pending] of pendingTeardowns) {
    pending.cancel()
  }
  pendingTeardowns.clear()
  managedTabs.clear()
  lastVisibleAt.clear()
  visibleTabIds.clear()
  generationByTab.clear()
  evictingTabIds.clear()
  clearDwellTimer()
  recomputeScheduled = false
  lastInputSignature = ''
  storeUnsubscribe?.()
  storeUnsubscribe = null
  selfDisableUnsubscribe?.()
  selfDisableUnsubscribe = null
  initialized = false
}
