import type { Page } from '@stablyai/playwright-test'
import { test, expect } from './helpers/orca-app'
import { getActiveTabId, waitForActiveWorktree, waitForSessionReady } from './helpers/store'
import { waitForActiveTerminalManager, waitForPaneIdentitySnapshot } from './helpers/terminal'

// Why 8: deferral engages only when more than COLD_ACTIVATION_TAB_DEFER_THRESHOLD
// (4) tabs would mount cold; 8 tabs with one visible leaves 7 deferred.
const TAB_COUNT = 8

async function createActiveTerminalTab(page: Page, worktreeId: string): Promise<string> {
  const tabId = await page.evaluate((id) => {
    const store = window.__store
    if (!store) {
      throw new Error('createActiveTerminalTab: window.__store is unavailable')
    }
    const state = store.getState()
    const tab = state.createTab(id, undefined, undefined, { activate: true })
    state.setActiveTab(tab.id)
    state.setActiveTabType('terminal')
    return tab.id
  }, worktreeId)
  await expect
    .poll(() => getActiveTabId(page), {
      timeout: 5_000,
      message: 'newly created terminal tab did not become active'
    })
    .toBe(tabId)
  await waitForActiveTerminalManager(page, 30_000)
  await waitForPaneIdentitySnapshot(page, 1)
  return tabId
}

async function getTerminalTabSnapshots(
  page: Page,
  worktreeId: string
): Promise<{ id: string; ptyId: string | null }[]> {
  return page.evaluate((id) => {
    const state = window.__store?.getState()
    return (state?.tabsByWorktree[id] ?? []).map((tab) => ({ id: tab.id, ptyId: tab.ptyId }))
  }, worktreeId)
}

async function getMountedTabIds(page: Page, tabIds: readonly string[]): Promise<string[]> {
  return page.evaluate(
    (ids) => ids.filter((tabId) => window.__paneManagers?.has(tabId) === true),
    tabIds
  )
}

test.describe('cold worktree activation deferral', () => {
  test('mounts only the visible tab cold and reveals deferred tabs on demand', async ({
    orcaPage: page
  }) => {
    test.setTimeout(180_000)
    await waitForSessionReady(page)
    await waitForActiveWorktree(page)
    await waitForActiveTerminalManager(page, 30_000)

    // Why a child worktree: deferral (like per-tab parking) requires
    // snapshot-backed daemon PTYs, whose session ids embed `repoId::path` —
    // primary-worktree tabs are conservatively never deferred.
    const worktreeId = await page.evaluate(async (name) => {
      const store = window.__store
      if (!store) {
        throw new Error('window.__store is unavailable')
      }
      const state = store.getState()
      const activeWorktreeId = state.activeWorktreeId
      const activeWorktree = Object.values(state.worktreesByRepo)
        .flat()
        .find((worktree) => worktree.id === activeWorktreeId)
      if (!activeWorktree) {
        throw new Error('active worktree not found')
      }
      const result = await state.createWorktree(activeWorktree.repoId, name)
      await state.fetchWorktrees(activeWorktree.repoId)
      state.setActiveWorktree(result.worktree.id)
      return result.worktree.id
    }, `e2e-cold-defer-${Date.now()}`)
    await expect.poll(() => waitForActiveWorktree(page), { timeout: 30_000 }).toBe(worktreeId)

    while ((await getTerminalTabSnapshots(page, worktreeId)).length < TAB_COUNT) {
      await createActiveTerminalTab(page, worktreeId)
    }
    // Why: deferral only covers tabs whose PTYs the parked byte watchers can
    // own, which requires a daemon session id on every tab.
    await expect
      .poll(
        async () =>
          (await getTerminalTabSnapshots(page, worktreeId)).filter((tab) => tab.ptyId !== null)
            .length,
        { timeout: 30_000, message: 'tabs did not all get daemon PTY ids' }
      )
      .toBe(TAB_COUNT)
    const tabIds = (await getTerminalTabSnapshots(page, worktreeId)).map((tab) => tab.id)
    const lastActiveTabId = await getActiveTabId(page)

    // Why: workspace-session persistence is debounced; the reload below must
    // find every tab (and its per-tab layout snapshot) already on disk.
    await page.waitForTimeout(3_000)

    // Why reload: a fresh renderer against live daemon sessions is the field
    // scenario — persisted tabs hydrate cold (unregistered, no pending spawn)
    // and the activation must defer them instead of mounting all at once.
    await page.reload()
    await waitForSessionReady(page)
    await expect.poll(() => waitForActiveWorktree(page), { timeout: 30_000 }).toBe(worktreeId)
    await expect
      .poll(async () => (await getTerminalTabSnapshots(page, worktreeId)).length, {
        timeout: 15_000,
        message: 'persisted terminal tabs did not survive the reload'
      })
      .toBe(TAB_COUNT)

    // The visible tab mounts immediately.
    await waitForActiveTerminalManager(page, 30_000)
    const mountedAfterActivation = await getMountedTabIds(page, tabIds)
    expect(mountedAfterActivation.length).toBeLessThanOrEqual(3)
    if (lastActiveTabId) {
      expect(mountedAfterActivation).toContain(lastActiveTabId)
    }

    // Deferred tabs stay unmounted — there is no timer that mounts them later.
    await page.waitForTimeout(2_000)
    const mountedAfterSettle = await getMountedTabIds(page, tabIds)
    expect(mountedAfterSettle.length).toBe(mountedAfterActivation.length)

    // Why: unmounted tabs must not go silent — the parked byte watchers own
    // their side effects while deferred.
    const watcherCoveredTabIds = await page.evaluate(
      () =>
        (
          window as Window & { __terminalParkingDebug?: { parkedTabIds?: () => string[] } }
        ).__terminalParkingDebug?.parkedTabIds?.() ?? []
    )
    for (const tabId of tabIds) {
      if (!mountedAfterSettle.includes(tabId)) {
        expect(watcherCoveredTabIds).toContain(tabId)
      }
    }

    // Revealing a deferred tab mounts it on demand.
    const deferredTabId = tabIds.find((tabId) => !mountedAfterSettle.includes(tabId))
    expect(deferredTabId).toBeDefined()
    await page.evaluate((tabId) => {
      const state = window.__store?.getState()
      state?.setActiveTab(tabId)
      state?.setActiveTabType('terminal')
    }, deferredTabId as string)
    await expect
      .poll(async () => (await getMountedTabIds(page, [deferredTabId as string])).length, {
        timeout: 15_000,
        message: 'revealed deferred tab did not mount'
      })
      .toBe(1)
  })
})
