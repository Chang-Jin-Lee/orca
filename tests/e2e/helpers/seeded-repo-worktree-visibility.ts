import { expect as playwrightExpect, type Page } from '@stablyai/playwright-test'

export async function optIntoVisibleSeededRepoWorktrees(page: Page, repoId: string): Promise<void> {
  let latestResult = 'not-started'
  // Why: macOS CI can paint the added repo before the first renderer fetch has
  // updated the test-side store read. Poll the public fetch path.
  await playwrightExpect
    .poll(
      async () => {
        latestResult = await page.evaluate(async (repoId) => {
          const store = window.__store
          if (!store) {
            return 'store-missing'
          }

          await store.getState().fetchRepos()
          const repo = store.getState().repos.find((candidate) => candidate.id === repoId)
          if (!repo) {
            return 'repo-missing'
          }

          // Why: the fixture deliberately creates external Git worktrees. New
          // repos hide those by default after the visibility rollout, so opt this
          // disposable repo into showing them before specs assert on worktree state.
          const updated = await store
            .getState()
            .updateRepo(repo.id, { externalWorktreeVisibility: 'show' })
          const currentRepo = store.getState().repos.find((candidate) => candidate.id === repo.id)
          if (!updated || currentRepo?.externalWorktreeVisibility !== 'show') {
            return JSON.stringify({
              updated,
              repoVisibility: currentRepo?.externalWorktreeVisibility ?? null
            })
          }
          return 'ready'
        }, repoId)
        return latestResult
      },
      {
        timeout: 30_000,
        message: 'seeded e2e repo did not load'
      }
    )
    .toBe('ready')
}

export async function waitForVisibleSeededRepoWorktrees(page: Page, repoId: string): Promise<void> {
  // Why: parallel specs mutate real git worktrees in the shared fixture repo.
  // A first scan can briefly return no rows while git holds a worktree lock.
  // Poll the main-process detected list after the visibility opt-in so the
  // secondary external worktree is visible before renderer state is asserted.
  await playwrightExpect
    .poll(
      () =>
        page.evaluate(async (repoId) => {
          const store = window.__store
          if (!store) {
            return 'store-missing'
          }
          await store.getState().fetchRepos()
          const repo = store.getState().repos.find((candidate) => candidate.id === repoId)
          if (!repo) {
            return 'repo-missing'
          }
          const updated = await store
            .getState()
            .updateRepo(repo.id, { externalWorktreeVisibility: 'show' })
          const currentRepo = store.getState().repos.find((candidate) => candidate.id === repo.id)
          const detected = await window.api.worktrees.listDetected({ repoId: repo.id })
          const visibleCount = detected.worktrees.filter((worktree) => worktree.visible).length
          if (
            !updated ||
            currentRepo?.externalWorktreeVisibility !== 'show' ||
            !detected.authoritative ||
            visibleCount < 2
          ) {
            return JSON.stringify({
              updated,
              repoVisibility: currentRepo?.externalWorktreeVisibility ?? null,
              detectedAuthoritative: detected.authoritative,
              detectedSource: detected.source,
              detectedCount: detected.worktrees.length,
              visibleCount
            })
          }
          const authoritative = await store
            .getState()
            .fetchWorktrees(repo.id, { requireAuthoritative: true })
          if (!authoritative) {
            return JSON.stringify({
              updated,
              repoVisibility: currentRepo.externalWorktreeVisibility,
              detectedAuthoritative: detected.authoritative,
              detectedSource: detected.source,
              detectedCount: detected.worktrees.length,
              visibleCount,
              rendererAuthoritative: false
            })
          }
          const rendererCount = store.getState().worktreesByRepo[repo.id]?.length ?? 0
          if (rendererCount < 2) {
            return JSON.stringify({
              updated,
              repoVisibility: currentRepo.externalWorktreeVisibility,
              detectedAuthoritative: detected.authoritative,
              detectedSource: detected.source,
              detectedCount: detected.worktrees.length,
              visibleCount,
              rendererAuthoritative: true,
              rendererCount
            })
          }
          return 'ready'
        }, repoId),
      {
        timeout: 60_000,
        message: 'seeded e2e worktrees did not load'
      }
    )
    .toBe('ready')
}
