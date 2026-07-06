// daemon-relocation-spike — empirically finds the minimal file set that lets a
// COPIED Orca.exe (ELECTRON_RUN_AS_NODE=1), launched from outside the install
// dir, host the terminal daemon + a real ConPTY session while holding no open
// handles into the app dir. See README.md.
//
// Requires a packaged win-unpacked build (runs on Windows CI). Use --selftest to
// validate the pure logic anywhere without a build.

import { randomUUID } from 'node:crypto'
import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs, getUsage } from './cli.mjs'
import { inventoryAppDir, formatInventory } from './app-inventory.mjs'
import { resolveTierFileSet } from './tier-file-set.mjs'
import { copyHost } from './host-copy.mjs'
import { launchDaemonHost } from './daemon-launch.mjs'
import { runPtyEcho } from './ndjson-client.mjs'
import { assessDaemonHandles } from './loaded-module-probe.mjs'
import { runSelftest } from './selftest.mjs'

const HERE = import.meta.dirname
const FALLBACK_PROTOCOL_VERSION = 18

// Read PROTOCOL_VERSION from the daemon source so the spike client never drifts
// out of sync with the running daemon's handshake.
function resolveProtocolVersion() {
  try {
    const typesPath = join(HERE, '..', '..', 'src', 'main', 'daemon', 'types.ts')
    const match = readFileSync(typesPath, 'utf8').match(/PROTOCOL_VERSION\s*=\s*(\d+)/)
    if (match) {
      return Number(match[1])
    }
  } catch {
    // Fall through to the pinned default.
  }
  return FALLBACK_PROTOCOL_VERSION
}

function makeSocketPath() {
  if (process.platform === 'win32') {
    return `\\\\?\\pipe\\orca-daemon-spike-${randomUUID().slice(0, 12)}`
  }
  return join(process.env.TMPDIR ?? '/tmp', `orca-daemon-spike-${randomUUID().slice(0, 12)}.sock`)
}

async function shutdownDaemon(child) {
  if (!child || child.exitCode !== null) {
    return
  }
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 5000)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
    try {
      child.kill('SIGTERM')
    } catch {
      clearTimeout(timer)
      resolve()
    }
  })
}

async function runLaunch(opts) {
  const { appDir, workDir, tier, keepWorkDir } = opts
  const report = {
    tier,
    ready: false,
    ptyEchoOk: false,
    mainModuleOk: false,
    appDirModules: [],
    warnings: [],
    error: null
  }

  console.log(`\n=== daemon-relocation-spike (tier=${tier}) ===\n`)

  const inv = inventoryAppDir(appDir)
  console.log(formatInventory(inv))
  console.log('')

  const plan = resolveTierFileSet(inv, tier)
  report.warnings = plan.warnings
  console.log(`tier: ${plan.label}  (${plan.ops.length} copy ops)`)
  if (plan.warnings.length > 0) {
    for (const w of plan.warnings) {
      console.error(`  WARNING: ${w}`)
    }
    report.error = 'incomplete file set for chosen tier'
    return report
  }

  const { hostExePath, daemonEntryPath, nodePtyNativeDir, skipped } = copyHost(inv, plan, workDir)
  if (skipped.length > 0) {
    console.error(`  copy skipped (missing sources): ${skipped.join(', ')}`)
    report.error = `required sources missing: ${skipped.join(', ')}`
    return report
  }
  console.log(`copied host: ${hostExePath}`)
  console.log(`daemon entry: ${daemonEntryPath}`)
  console.log(`node-pty native dir: ${nodePtyNativeDir || '(none)'}\n`)

  const socketPath = makeSocketPath()
  const tokenPath = join(workDir, 'daemon.token')
  const protocolVersion = resolveProtocolVersion()

  let child = null
  try {
    const launched = await launchDaemonHost({
      hostExePath,
      daemonEntryPath,
      socketPath,
      tokenPath,
      workDir,
      nodePtyNativeDir
    })
    child = launched.child
    report.ready = true
    console.log(`daemon ready (pid=${launched.pid})`)

    // Probe loaded modules BEFORE shutdown — the daemon and its node-pty native
    // are mapped at this point.
    const handles = assessDaemonHandles(launched.pid, appDir, hostExePath)
    report.mainModuleOk = handles.mainModuleOk
    report.appDirModules = handles.appDirModules
    console.log(
      `handle probe: mainModuleOk=${handles.mainModuleOk} ` +
        `modules=${handles.moduleCount ?? 0} appDirResident=${handles.appDirModules.length}`
    )
    for (const m of handles.appDirModules) {
      console.error(`  APP-DIR MODULE (would lock during update): ${m}`)
    }

    const nonce = randomUUID().slice(0, 8)
    const marker = `SPIKE-OK-${nonce}`
    // Match the marker only when it appears alone at line start (executed
    // output), not inside the echoed `echo <marker>` input line.
    const expectRe = new RegExp(`(?:^|\\r?\\n)${marker}(?:\\r|\\n)`)
    const echo = await runPtyEcho({
      socketPath,
      tokenPath,
      protocolVersion,
      command: `echo ${marker}`,
      expectRe
    })
    report.ptyEchoOk = true
    console.log(`pty echo: nonce round-tripped (${echo.output.length} bytes of output)`)
  } catch (err) {
    report.error = err instanceof Error ? err.message : String(err)
    console.error(`\nFAILURE: ${report.error}`)
    console.error(`  daemon logs under: ${workDir}`)
  } finally {
    await shutdownDaemon(child)
    if (!keepWorkDir) {
      try {
        rmSync(workDir, { recursive: true, force: true })
      } catch {
        // Best-effort cleanup; a locked file just means the relocation is
        // incomplete, which the handle probe already reports.
      }
    }
  }

  return report
}

function printFinalReport(report) {
  const pass =
    report.ready &&
    report.ptyEchoOk &&
    report.appDirModules.length === 0 &&
    report.mainModuleOk &&
    !report.error

  console.log('\n=== FINAL REPORT ===')
  console.log(`  tier:                 ${report.tier}`)
  console.log(`  daemon ready:         ${report.ready}`)
  console.log(`  pty echo ok:          ${report.ptyEchoOk}`)
  console.log(`  main module = copy:   ${report.mainModuleOk}`)
  console.log(`  app-dir modules:      ${report.appDirModules.length}`)
  for (const m of report.appDirModules) {
    console.log(`      - ${m}`)
  }
  if (report.error) {
    console.log(`  error:                ${report.error}`)
  }
  console.log(`  VERDICT:              ${pass ? 'PASS' : 'FAIL'}\n`)
  return pass
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2))

  if (parsed.help) {
    console.log(getUsage())
    return 0
  }
  if (parsed.error) {
    console.error(`error: ${parsed.error}`)
    console.error(getUsage())
    return 2
  }
  if (parsed.selftest) {
    return runSelftest() ? 0 : 1
  }

  if (process.platform !== 'win32') {
    console.error(
      'launch mode requires Windows (ConPTY + loaded-module probe). Use --selftest elsewhere.'
    )
    return 2
  }

  const report = await runLaunch(parsed.launch)
  return printFinalReport(report) ? 0 : 1
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((err) => {
    console.error('unexpected error:', err)
    process.exitCode = 1
  })
