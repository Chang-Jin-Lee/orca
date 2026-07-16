/**
 * Quiet-state spinner diagnostic (manual harness, never runs in CI: it is
 * skipped unless QUIET_AB is set and @headful excludes it from the headless
 * suite).
 *
 * Launches the real app headful with NO terminal output and walks four
 * steady-state phases, writing a sentinel file as each begins so an external
 * process-energy sampler can align its windows:
 *   idle      — app as-is, nothing injected
 *   staggered — N spinners mimicking AgentStateDot/StatusIndicator
 *               (`1s steps(12, end)`) with per-spinner phase offsets, like
 *               independently mounted indicators today
 *   locked    — the same N spinners sharing one phase (the follow-up design)
 *   paused    — all document animations force-paused (diagnostic baseline)
 * Run via config/scripts/quiet-spinner-ab-macos.sh.
 */

import { writeFileSync } from 'node:fs'
import { test } from './helpers/orca-app'
import { ensureTerminalVisible, waitForActiveWorktree, waitForSessionReady } from './helpers/store'

const PHASE_SECONDS = Number(process.env.QUIET_AB_SECONDS ?? '60')
const SPINNER_COUNT = Number(process.env.QUIET_AB_SPINNERS ?? '12')
// Why +12: the external sampler needs the full sample window plus slack for
// its own startup inside each phase hold.
const HOLD_MS = (PHASE_SECONDS + 12) * 1000

function markPhase(phase: string): void {
  writeFileSync(`/tmp/quiet-ab-${phase}`, String(Date.now()))
}

test.describe('quiet spinner diagnostic', () => {
  test.skip(
    !process.env.QUIET_AB,
    'manual energy diagnostic — run via config/scripts/quiet-spinner-ab-macos.sh'
  )

  test('idle vs staggered vs locked vs paused spinners @headful', async ({ orcaPage }) => {
    test.setTimeout(4 * HOLD_MS + 240_000)
    await waitForSessionReady(orcaPage)
    await waitForActiveWorktree(orcaPage)
    await ensureTerminalVisible(orcaPage)

    markPhase('idle')
    await orcaPage.waitForTimeout(HOLD_MS)

    await orcaPage.evaluate((count) => {
      const style = document.createElement('style')
      style.id = 'quiet-ab-style'
      style.textContent = '@keyframes quietAbSpin { to { transform: rotate(360deg) } }'
      document.head.appendChild(style)
      const host = document.createElement('div')
      host.id = 'quiet-ab-spinners'
      host.style.cssText = 'position:fixed;top:8px;left:8px;z-index:99999;display:flex;gap:4px'
      for (let index = 0; index < count; index++) {
        const dot = document.createElement('div')
        dot.style.cssText =
          'width:12px;height:12px;border-radius:9999px;border:2px solid #888;border-top-color:#09f;' +
          `animation: quietAbSpin 1s steps(12, end) infinite;` +
          // Why negative delays: starts every spinner immediately but at a
          // distinct phase offset, like independently mounted indicators.
          `animation-delay: -${Math.round((index * 1000) / 12)}ms`
        host.appendChild(dot)
      }
      document.body.appendChild(host)
    }, SPINNER_COUNT)
    markPhase('staggered')
    await orcaPage.waitForTimeout(HOLD_MS)

    await orcaPage.evaluate(() => {
      const host = document.getElementById('quiet-ab-spinners')
      if (!host) {
        throw new Error('spinner host missing')
      }
      // Why rebuild in one tick: CSS animation phase is set by start time, so
      // recreating every dot together with zero delay phase-locks them.
      for (const dot of Array.from(host.children)) {
        const rebuilt = dot.cloneNode(true) as HTMLElement
        rebuilt.style.animationDelay = '0ms'
        host.replaceChild(rebuilt, dot)
      }
    })
    markPhase('locked')
    await orcaPage.waitForTimeout(HOLD_MS)

    await orcaPage.evaluate(() => {
      const style = document.createElement('style')
      style.id = 'quiet-ab-pause'
      style.textContent =
        '*, *::before, *::after { animation-play-state: paused !important; transition: none !important }'
      document.head.appendChild(style)
    })
    markPhase('paused')
    await orcaPage.waitForTimeout(HOLD_MS)
  })
})
