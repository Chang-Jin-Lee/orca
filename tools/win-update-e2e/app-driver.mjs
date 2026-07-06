// Drive the installed, packaged Orca app with Playwright's Electron driver.
//
// This targets a PRODUCTION build, so it must NOT depend on the e2e-only store
// exposure (window.__store / window.__paneManagers) — those exist only under a
// `--mode e2e` / VITE_EXPOSE_STORE build. Everything here uses ARIA/DOM
// selectors that ship in production (matching tests/e2e/helpers/terminal.ts and
// terminal-attention.spec.ts) and proves interactivity through filesystem
// sentinels rather than by reading the WebGL-rendered xterm buffer:
//   - typed commands write a marker FILE; the harness checks the file. This
//     proves keystrokes reached the shell AND executed — stronger, and robust,
//     than scraping canvas-rendered terminal text.
//
// The long-running marker also sets a unique window-title canary and writes a
// heartbeat file every ~500ms: the canary lets the window watch attribute any
// real console flash to our child, and the heartbeat proves the session is
// live and streaming.

import { _electron as electron } from '@stablyai/playwright-test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { seedCompletedOnboarding } from './onboarding-profile.mjs'

const NEW_TAB_BUTTON = { role: 'button', name: 'New tab' }
const NEW_TERMINAL_ITEM = /New Terminal/i
const SORTABLE_TAB = '[data-testid="sortable-tab"]'
const TERMINAL_SURFACE = '[data-terminal-tab-id]'
const XTERM_INPUT = '.xterm-helper-textarea'

/**
 * Launch the installed Orca.exe. Pointing userDataDir at a harness-owned temp
 * dir isolates this run's daemon (its socket/token path becomes unique), so
 * daemon lookups never collide with other Orca installs/daemons on the box.
 * Seeds a completed-onboarding profile first so the fullscreen onboarding
 * overlay does not block the terminal UI on a fresh profile.
 */
export async function launchInstalledApp({ exePath, userDataDir, extraEnv = {} }) {
  const { ELECTRON_RUN_AS_NODE: _drop, ...cleanEnv } = process.env
  mkdirSync(userDataDir, { recursive: true })
  seedCompletedOnboarding(userDataDir)
  const app = await electron.launch({
    executablePath: exePath,
    args: [],
    env: {
      ...cleanEnv,
      // Packaged main honors ORCA_E2E_USER_DATA_DIR to relocate userData
      // (logs/daemon/terminal-history) under a controlled dir.
      ORCA_E2E_USER_DATA_DIR: userDataDir,
      ...extraEnv
    }
  })
  const page = await app.firstWindow({ timeout: 120_000 })
  await page.waitForLoadState('domcontentloaded')
  return { app, page }
}

/**
 * Best-effort diagnostics dump when driving fails: a screenshot, the visible
 * body text, and whether the e2e store is exposed (it is not in production
 * builds). Written under `dir` so CI can upload it and reveal the actual
 * post-launch DOM state. Never throws.
 */
export async function captureFailureDiagnostics(page, dir, label) {
  const out = {}
  try {
    mkdirSync(dir, { recursive: true })
  } catch {
    return out
  }
  try {
    await page.screenshot({
      path: path.join(dir, `${label}.png`),
      fullPage: false,
      timeout: 10_000
    })
    out.screenshot = `${label}.png`
  } catch {
    /* renderer may be unresponsive */
  }
  try {
    const info = await page.evaluate(() => ({
      hasStore: typeof window.__store,
      title: document.title,
      url: location.href,
      bodyText: (document.body?.innerText ?? '').slice(0, 4000),
      testIds: Array.from(document.querySelectorAll('[data-testid]'))
        .map((el) => el.getAttribute('data-testid'))
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .slice(0, 80),
      buttons: Array.from(document.querySelectorAll('button,[role="button"]'))
        .map((el) => (el.getAttribute('aria-label') || el.textContent || '').trim())
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .slice(0, 60)
    }))
    writeFileSync(path.join(dir, `${label}.json`), JSON.stringify(info, null, 2))
    out.info = info
  } catch {
    /* renderer may be unresponsive */
  }
  return out
}

/** Wait until at least one terminal surface is mounted and interactive. */
export async function waitForTerminalReady(page, timeoutMs = 60_000) {
  await page.waitForSelector(TERMINAL_SURFACE, { timeout: timeoutMs })
  await page.waitForSelector(XTERM_INPUT, { timeout: timeoutMs })
}

/**
 * Get the app to an interactive terminal from a freshly-launched (onboarding-
 * seeded) profile. If a terminal surface is already mounted, just wait for it;
 * otherwise wait for the app shell to be interactive (the New tab control is
 * visible, which also confirms the onboarding overlay is gone) and create one.
 */
export async function ensureTerminal(page, timeoutMs = 60_000) {
  if ((await page.locator(TERMINAL_SURFACE).count()) > 0) {
    await waitForTerminalReady(page, timeoutMs)
    return
  }
  await page
    .getByRole(NEW_TAB_BUTTON.role, { name: NEW_TAB_BUTTON.name })
    .first()
    .waitFor({ state: 'visible', timeout: timeoutMs })
  await createTerminalTab(page)
}

/** Create a new terminal tab via the New tab menu. Returns the count after. */
export async function createTerminalTab(page) {
  const before = await page.locator(SORTABLE_TAB).count()
  await page.getByRole(NEW_TAB_BUTTON.role, { name: NEW_TAB_BUTTON.name }).click({ force: true })
  await page.getByRole('menuitem', { name: NEW_TERMINAL_ITEM }).first().click({ force: true })
  await page.waitForFunction(
    ({ selector, prev }) => document.querySelectorAll(selector).length > prev,
    { selector: SORTABLE_TAB, prev: before },
    { timeout: 10_000 }
  )
  await waitForTerminalReady(page)
  return page.locator(SORTABLE_TAB).count()
}

/** Cheap session identifiers: the rendered tab ids. */
export async function listTabIds(page) {
  return page
    .locator(SORTABLE_TAB)
    .evaluateAll((tabs) =>
      tabs.map((t) => t.getAttribute('data-tab-id')).filter((id) => Boolean(id))
    )
}

/** Focus the active terminal's xterm input textarea. */
export async function focusActiveTerminal(page) {
  const input = page.locator(`${XTERM_INPUT}:visible`).last()
  await input.focus()
  return input
}

/** Type a line and submit it (Enter → \r submits in the shell). */
export async function typeLine(page, text) {
  await focusActiveTerminal(page)
  await page.keyboard.type(text)
  await page.keyboard.press('Enter')
}

/** Send Ctrl+C to the active terminal. */
export async function sendCtrlC(page) {
  await focusActiveTerminal(page)
  await page.keyboard.press('Control+C')
}

/**
 * Run a PowerShell command inside the active terminal, shell-agnostically:
 * invoking powershell.exe works whether the pty's shell is cmd, pwsh,
 * PowerShell, or a POSIX shell on Windows. Used to write sentinel files.
 */
export async function runShellCommand(page, psCommand) {
  const escaped = psCommand.replace(/"/g, '`"')
  await typeLine(page, `powershell.exe -NoProfile -NonInteractive -Command "${escaped}"`)
}

/**
 * Start the long-running marker in the active terminal: sets the canary window
 * title, records its own PID, and heartbeats a file every 500ms. Returns the
 * command string (the caller reads the pid file to learn the marker PID).
 */
export async function startMarker(page, { canary, pidFile, heartbeatFile }) {
  const script = [
    `$host.UI.RawUI.WindowTitle='${canary}'`,
    `Set-Content -LiteralPath '${pidFile}' -Value $PID`,
    `while($true){ [System.IO.File]::WriteAllText('${heartbeatFile}',(Get-Date).ToString('o')); Start-Sleep -Milliseconds 500 }`
  ].join('; ')
  await runShellCommand(page, script)
  return script
}

/**
 * Best-effort read of the active terminal's visible text, for the cold-restore
 * scrollback fidelity check. Prefers the SerializeAddon when the build happens
 * to expose paneManagers; falls back to DOM rows (populated only under the DOM
 * renderer, so this may be empty under WebGL — hence best-effort).
 */
export async function readTerminalTextBestEffort(page) {
  return page.evaluate(() => {
    const managers = window.__paneManagers
    if (managers && typeof managers.forEach === 'function') {
      let out = ''
      managers.forEach((m) => {
        const pane = m.getActivePane?.() ?? m.getPanes?.()[0]
        const text = pane?.serializeAddon?.serialize?.()
        if (text) {
          out += text
        }
      })
      if (out) {
        return out
      }
    }
    return Array.from(document.querySelectorAll('.xterm-rows'))
      .map((el) => el.textContent ?? '')
      .join('\n')
  })
}

/**
 * Close the app gracefully; force-kill its process tree on timeout. Mirrors
 * tests/e2e/helpers/electron-process-shutdown.ts so the daemon (detached) is
 * left alive exactly as a normal quit would.
 */
export async function closeApp(app, timeoutMs = 10_000) {
  const proc = app.process()
  try {
    await Promise.race([
      app.close(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('close timeout')), timeoutMs))
    ])
  } catch {
    if (proc?.pid) {
      try {
        execFileSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' })
      } catch {
        /* already gone */
      }
    }
  }
}
