/**
 * E2E regression test for the reattach mouse-mode leak fixed alongside #7329.
 *
 * Why this suite exists:
 *   A TUI that armed mouse tracking (?1000/1002/1003 + SGR 1006/1016) and died
 *   uncleanly never emits the disable sequence. The daemon's private-mode
 *   tracker keeps the mode and buildRehydrateSequences re-arms it on every
 *   reattach, but POST_REPLAY_REATTACH_RESET used to clear cursor/focus/kitty
 *   state and NOT mouse modes. A plain shell in the reattached pane then echoed
 *   every pointer-motion report (`<35;col;rowM`) as literal text.
 *
 * What it covers (full stack, no mocks):
 *   - First launch arms the leak through the real daemon: a fixture writes the
 *     enable sequence to stdout and exits, and the daemon's buffer snapshot is
 *     asserted to re-arm ?1003h/?1006h on reattach (the leak precondition — the
 *     assertion that pins "this would leak without the fix").
 *   - After a warm reattach, the renderer terminal ends with mouse reporting
 *     DISARMED: mouseTrackingMode is 'none', the enable-mouse-events class is
 *     gone, and real pointer motion produces zero mouse reports.
 *   - A positive control re-arms the same modes and confirms the motion probe
 *     does observe reports, so the "zero reports" assertion cannot pass vacuously.
 *
 * What it does NOT cover:
 *   - Live-agent panes keeping mouse via POST_REPLAY_LIVE_AGENT_REATTACH_RESET
 *     (unit-tested in pty-connection.test.ts).
 */

import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import type { ElectronApplication } from '@stablyai/playwright-test'
import { test, expect } from './helpers/orca-app'
import { TEST_REPO_PATH_FILE } from './global-setup'
import {
  discoverActivePtyId,
  execInTerminal,
  waitForActiveTerminalManager,
  waitForPaneCount
} from './helpers/terminal'
import { ensureTerminalVisible, waitForActiveWorktree, waitForSessionReady } from './helpers/store'
import { attachRepoAndOpenTerminal, createRestartSession } from './helpers/orca-restart'

const LEAKED_MOUSE_MODE_FIXTURE_PATH = path.join(
  process.cwd(),
  'tests/e2e/fixtures/leaked-mouse-mode-fixture.cjs'
)

// Why: quit→relaunch against the same userDataDir relies on the daemon
// surviving the first close; serial keeps the shared profile from competing
// with other Electron instances for the same lock.
test.describe.configure({ mode: 'serial' })

test.describe('reattach mouse-mode leak', () => {
  test('warm reattach disarms mouse modes a killed TUI left armed', async (// oxlint-disable-next-line no-empty-pattern -- Playwright's second fixture arg is testInfo; the first must be an object destructure to opt out of the default fixture set.
  {}, testInfo) => {
    const repoPath = readFileSync(TEST_REPO_PATH_FILE, 'utf-8').trim()
    if (!repoPath || !existsSync(repoPath)) {
      test.skip(true, 'Global setup did not produce a seeded test repo')
      return
    }

    const session = createRestartSession(testInfo)
    let firstApp: ElectronApplication | null = null
    let secondApp: ElectronApplication | null = null

    try {
      // ── First launch: arm the leak through the real daemon ─────────────
      const firstLaunch = await session.launch()
      firstApp = firstLaunch.app
      await attachRepoAndOpenTerminal(firstLaunch.page, repoPath)
      await waitForSessionReady(firstLaunch.page)
      await waitForActiveWorktree(firstLaunch.page)
      await ensureTerminalVisible(firstLaunch.page)

      const hasPaneManager = await waitForActiveTerminalManager(firstLaunch.page, 30_000)
        .then(() => true)
        .catch(() => false)
      test.skip(
        !hasPaneManager,
        'Electron automation in this environment never mounts the TerminalPane manager.'
      )
      await waitForPaneCount(firstLaunch.page, 1, 30_000)
      const ptyId = await discoverActivePtyId(firstLaunch.page)

      // The fixture emits ?1003h?1006h to stdout and exits without the disable,
      // so the daemon's tracker keeps the mode while a plain shell foregrounds.
      await execInTerminal(
        firstLaunch.page,
        ptyId,
        `node ${JSON.stringify(LEAKED_MOUSE_MODE_FIXTURE_PATH)}`
      )

      // Precondition: the daemon buffer snapshot re-arms both modes on reattach
      // (data = rehydrateSequences + snapshotAnsi). Without the fix this is
      // exactly what leaks into the reattached plain shell.
      await expect
        .poll(
          async () =>
            firstLaunch.page.evaluate(async (id: string) => {
              const snap = await window.api.pty.getMainBufferSnapshot(id)
              const data = snap?.data ?? ''
              return data.includes('\x1b[?1003h') && data.includes('\x1b[?1006h')
            }, ptyId),
          {
            timeout: 15_000,
            message:
              'Daemon snapshot never re-armed the leaked mouse modes; leak precondition not met'
          }
        )
        .toBe(true)

      // Why: app.close flushes beforeunload, but the daemon is a detached fork
      // so the PTY (and its armed mouse mode) survives for the warm reattach.
      await session.close(firstApp)
      firstApp = null

      // ── Second launch: reattach must disarm the leaked modes ────────────
      const secondLaunch = await session.launch()
      secondApp = secondLaunch.app
      await waitForSessionReady(secondLaunch.page)
      await waitForActiveWorktree(secondLaunch.page)
      await ensureTerminalVisible(secondLaunch.page)
      await waitForActiveTerminalManager(secondLaunch.page, 30_000)
      await waitForPaneCount(secondLaunch.page, 1, 30_000)

      // The reattach replay re-arms mouse via rehydrate, then the reset must
      // clear it. Poll until it settles to 'none' (times out if the reset
      // regresses to not touching mouse modes).
      await expect
        .poll(
          async () =>
            secondLaunch.page.evaluate(() => {
              const state = window.__store?.getState()
              const worktreeId = state?.activeWorktreeId
              const tabId =
                state?.activeTabType === 'terminal'
                  ? state.activeTabId
                  : worktreeId
                    ? (state?.activeTabIdByWorktree?.[worktreeId] ?? null)
                    : null
              const manager = tabId ? window.__paneManagers?.get(tabId) : null
              const pane = manager?.getActivePane?.() ?? manager?.getPanes?.()[0] ?? null
              return pane?.terminal.modes.mouseTrackingMode ?? null
            }),
          {
            timeout: 15_000,
            message: 'Reattached pane never disarmed the leaked mouse-tracking mode'
          }
        )
        .toBe('none')

      // Behavioral proof + positive control: real pointer motion must produce
      // no reports post-reattach, but the same probe DOES observe reports once
      // mouse mode is re-armed — so the "zero reports" result is not vacuous.
      const probe = await secondLaunch.page.evaluate(async () => {
        // An SGR mouse report is `ESC [ < params (M|m)`; the `ESC [ <` prefix is
        // unambiguous, so substring matching avoids a control-char regex.
        const isMouseReport = (data) => data.includes('\x1b[<')
        const state = window.__store?.getState()
        const worktreeId = state?.activeWorktreeId
        const tabId =
          state?.activeTabType === 'terminal'
            ? state.activeTabId
            : worktreeId
              ? (state?.activeTabIdByWorktree?.[worktreeId] ?? null)
              : null
        const manager = tabId ? window.__paneManagers?.get(tabId) : null
        const pane = manager?.getActivePane?.() ?? manager?.getPanes?.()[0] ?? null
        if (!pane?.terminal.element) {
          throw new Error('Active terminal pane unavailable')
        }
        const screen = pane.terminal.element.querySelector<HTMLElement>('.xterm-screen')
        if (!screen) {
          throw new Error('Active terminal screen unavailable')
        }

        const reports: string[] = []
        const disposable = pane.terminal.onData((data) => reports.push(data))
        const dispatchMotion = async (): Promise<void> => {
          const rect = screen.getBoundingClientRect()
          for (const fraction of [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) {
            screen.dispatchEvent(
              new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: rect.left + rect.width * fraction,
                clientY: rect.top + rect.height * 0.5
              })
            )
            await new Promise((resolve) => setTimeout(resolve, 15))
          }
        }
        const motionReports = (): string[] => reports.filter(isMouseReport)

        try {
          // Phase A: post-reattach, mouse must be disarmed → no reports.
          await dispatchMotion()
          const afterReattach = {
            mode: pane.terminal.modes.mouseTrackingMode,
            hasEnableMouseClass: pane.terminal.element.classList.contains('enable-mouse-events'),
            reports: motionReports().length
          }

          // Phase B: positive control — re-arm and confirm the probe sees reports.
          reports.length = 0
          await new Promise<void>((resolve) =>
            pane.terminal.write('\x1b[?1003h\x1b[?1006h', () => resolve())
          )
          await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
          const classAfterArm = pane.terminal.element.classList.contains('enable-mouse-events')
          await dispatchMotion()

          return { afterReattach, classAfterArm, armedReports: motionReports().length }
        } finally {
          disposable.dispose()
        }
      })

      // Post-reattach the pane is fully disarmed.
      expect(probe.afterReattach.mode).toBe('none')
      expect(probe.afterReattach.hasEnableMouseClass).toBe(false)
      expect(probe.afterReattach.reports).toBe(0)
      // Positive control proves the motion probe genuinely detects reports.
      expect(probe.classAfterArm).toBe(true)
      expect(probe.armedReports).toBeGreaterThan(0)
    } finally {
      if (secondApp) {
        await session.close(secondApp)
      }
      if (firstApp) {
        await session.close(firstApp)
      }
      await session.dispose()
    }
  })
})
