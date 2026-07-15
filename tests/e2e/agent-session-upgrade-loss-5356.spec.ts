import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { ElectronApplication } from '@stablyai/playwright-test'
import { DEFAULT_LOCAL_ORCA_PROFILE_ID } from '../../src/shared/orca-profiles'
import { getRepoIdFromWorktreeId } from '../../src/shared/worktree-id'
import { test, expect } from './helpers/orca-app'
import { waitForSessionReady } from './helpers/store'
import { attachRepoAndOpenTerminal, createRestartSession } from './helpers/orca-restart'

const PRE_FIX_TAB_ID = 'tab5356'

// #5356: the first launch after upgrading FROM a pre-#5232 version silently
// replaces every live floating-terminal agent session with a blank shell.
// Pre-fix builds never wrote `sleepingAgentSessionsByPaneKey` at quit, so the
// pane-level cold-restore finds nothing to resume and spawns a fresh shell —
// with no warning at all.
//
// This builds a valid repo/worktree catalog, then replaces its workspaceSession
// with the relevant pre-fix shape: an agent terminal tab (`launchAgent`, which
// pre-fix builds DID persist), no resume records, and no post-fix capability
// stamp. On the first launch of the fixed build the session is unrecoverable
// (it genuinely cannot be conjured), so the app must NON-DESTRUCTIVELY tell the
// user instead of silently swapping in a blank shell.

/** The workspace-session fields that distinguish a pre-#5232 quit payload. */
function preFixWorkspaceSession(repoId: string, worktreeId: string): Record<string, unknown> {
  return {
    activeRepoId: repoId,
    activeWorktreeId: worktreeId,
    activeTabId: PRE_FIX_TAB_ID,
    tabsByWorktree: {
      [worktreeId]: [
        {
          id: PRE_FIX_TAB_ID,
          ptyId: null,
          worktreeId,
          title: 'Codex',
          customTitle: null,
          color: null,
          sortOrder: 0,
          createdAt: 1,
          // Pre-fix builds already persisted launchAgent, so a live agent tab
          // is identifiable on disk even though its session id is gone.
          launchAgent: 'codex'
        }
      ]
    },
    terminalLayoutsByTabId: {}
    // No sleepingAgentSessionsByPaneKey, no agentSessionCaptureVersion — that
    // absence is precisely the pre-#5232 state.
  }
}

function seedPreFixProfile(userDataDir: string, repoId: string, worktreeId: string): void {
  // Why: the setup launch migrates the legacy root file into the active Orca
  // profile. Editing the old root file would seed state that startup never reads.
  const dataPath = path.join(
    userDataDir,
    'profiles',
    DEFAULT_LOCAL_ORCA_PROFILE_ID,
    'orca-data.json'
  )
  const profile = JSON.parse(readFileSync(dataPath, 'utf8')) as Record<string, unknown>
  profile.workspaceSession = preFixWorkspaceSession(repoId, worktreeId)
  writeFileSync(dataPath, `${JSON.stringify(profile, null, 2)}\n`)
}

test('#5356 preserves the tab and warns once when upgrading from a pre-#5232 version', async ({
  testRepoPath
}, testInfo) => {
  const session = createRestartSession(testInfo)
  let activeApp: ElectronApplication | null = null

  try {
    // Create the same valid repo/worktree catalog a real old profile carries.
    // A made-up worktree id is pruned during hydration and would let the toast
    // test pass without proving that the user's tab survived.
    const setupLaunch = await session.launch()
    activeApp = setupLaunch.app
    const worktreeId = await attachRepoAndOpenTerminal(setupLaunch.page, testRepoPath)
    const repoId = getRepoIdFromWorktreeId(worktreeId)
    if (!repoId) {
      throw new Error(`could not resolve repo id from seeded worktree: ${worktreeId}`)
    }
    await session.close(setupLaunch.app)
    activeApp = null

    // The first launch after the update now reads a realistic pre-#5232 session.
    seedPreFixProfile(session.userDataDir, repoId, worktreeId)

    const { app, page } = await session.launch()
    activeApp = app
    await waitForSessionReady(page)

    // The lost agent session cannot be conjured, so the user must be told
    // NON-DESTRUCTIVELY that agent state from the previous version could not be
    // recovered. Pre-fix this notice is absent — that silent loss is the bug.
    const notice = page.getByTestId('pre-upgrade-agent-session-loss-notice')
    await expect(notice).toBeVisible({ timeout: 20_000 })
    await expect(notice).toHaveCount(1)

    // The notice is informational: the original tab must remain rendered with
    // its user-visible title rather than being deleted during hydration.
    const restoredTab = page.locator(
      `[data-testid="sortable-tab"][data-tab-id="${PRE_FIX_TAB_ID}"]`
    )
    await expect(restoredTab).toBeVisible()
    await expect(restoredTab).toHaveAttribute('data-tab-title', 'Codex')

    await page.screenshot({
      path: testInfo.outputPath('upgrade-loss-notice.png'),
      fullPage: true
    })

    await session.close(app)
    activeApp = null

    // The migrated session must stay quiet on the next launch. This catches a
    // marker that only lived in renderer memory or was dropped by full writes.
    const secondLaunch = await session.launch()
    activeApp = secondLaunch.app
    await waitForSessionReady(secondLaunch.page)
    await expect(
      secondLaunch.page.getByTestId('pre-upgrade-agent-session-loss-notice')
    ).toHaveCount(0)
    await session.close(secondLaunch.app)
    activeApp = null
  } finally {
    if (activeApp) {
      await session.close(activeApp).catch(() => {})
    }
    await session.dispose()
  }
})
