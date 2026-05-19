import type { Page } from '@stablyai/playwright-test'
import { test, expect } from './helpers/orca-app'
import { clickFileInExplorer, openFileExplorer } from './helpers/file-explorer'
import {
  ensureTerminalVisible,
  getActiveTabType,
  getOpenFiles,
  waitForActiveWorktree,
  waitForSessionReady
} from './helpers/store'

const SORTABLE_TAB = '[data-testid="sortable-tab"]'

async function countRenderedTabs(page: Page): Promise<number> {
  return page.locator(SORTABLE_TAB).count()
}

async function dismissTransientAnnouncement(page: Page): Promise<void> {
  const maybeLaterButton = page.getByRole('button', { name: 'Maybe Later' })
  const visible = await maybeLaterButton.isVisible({ timeout: 1_000 }).catch(() => false)
  if (visible) {
    await maybeLaterButton.click()
  }
}

test.describe('Release golden path', () => {
  test('starts Orca, opens a terminal tab, and opens a seeded file', async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
    const worktreeId = await waitForActiveWorktree(orcaPage)
    await ensureTerminalVisible(orcaPage)
    await dismissTransientAnnouncement(orcaPage)

    await expect(orcaPage.locator('.xterm').first()).toBeVisible({ timeout: 10_000 })

    const tabsBefore = await countRenderedTabs(orcaPage)
    await orcaPage.getByRole('button', { name: 'New tab' }).click()
    await orcaPage
      .getByRole('menuitem', { name: /New Terminal/i })
      .first()
      .click()

    await expect
      .poll(() => countRenderedTabs(orcaPage), {
        timeout: 5_000,
        message: 'Release gate could not create a second terminal tab'
      })
      .toBe(tabsBefore + 1)

    await openFileExplorer(orcaPage)
    await expect(orcaPage.locator('[data-orca-explorer-shell]')).toBeVisible({ timeout: 5_000 })

    const filesBefore = await getOpenFiles(orcaPage, worktreeId)
    const clickedFile = await clickFileInExplorer(orcaPage, ['README.md'])
    expect(clickedFile).toBe('README.md')

    await expect.poll(async () => getActiveTabType(orcaPage), { timeout: 5_000 }).toBe('editor')
    await expect
      .poll(async () => (await getOpenFiles(orcaPage, worktreeId)).length, {
        timeout: 5_000,
        message: 'Release gate did not open the seeded README'
      })
      .toBeGreaterThan(filesBefore.length)
    await expect(orcaPage.locator('.editor-header-path').first()).toContainText('README.md', {
      timeout: 20_000
    })
  })
})
