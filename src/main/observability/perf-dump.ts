import { app, dialog, type WebContents } from 'electron'
import { randomUUID } from 'node:crypto'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { Session } from 'node:inspector'
import { arch, platform, release } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { acquireElectronDebugger } from '../browser/electron-debugger-lease'
import { collectRendererPerfMetrics } from './renderer-perf'
import { createTarGzipArchive, type TarArchiveEntry } from './tar-archive'
import { resolveDiagnosticOrcaChannel } from './diagnostic-upload-endpoint'
import { translateMain } from '../i18n/main-i18n'

export type PerfDumpProgressStage = 'metrics' | 'profile' | 'compressing'

export type CapturePerfDumpResult =
  | { readonly canceled: true }
  | { readonly filePath: string; readonly bytes: number }

type CapturePerfDumpOptions = {
  readonly getRendererWebContents: () => WebContents | null
  readonly onProgress?: (stage: PerfDumpProgressStage) => void
}

type ArtifactStatus = {
  readonly status: 'included' | 'omitted' | 'failed'
  readonly fileName?: string
  readonly bytes?: number
  readonly reason?: string
}

const PROFILE_DURATION_MS = 10_000
// 1000 µs is the DevTools default; it keeps a 10 s profile in the low
// single-digit MB so the report stays attachable/sendable.
const PROFILE_SAMPLING_INTERVAL_US = 1000
// Why: Profiler.stop on a wedged process can stall past the capture window;
// a bounded wait turns that into a failure note instead of a hung capture.
const PROFILER_STOP_TIMEOUT_MS = 30_000
const MAX_TAR_ENTRY_BYTES = 0o77777777777
const ARTIFACT_ORDER = ['renderer-perf-metrics.json', 'renderer.cpuprofile', 'main.cpuprofile']

let inFlightCapture: Promise<CapturePerfDumpResult> | null = null

export async function captureRendererPerfDump(
  opts: CapturePerfDumpOptions
): Promise<CapturePerfDumpResult> {
  if (inFlightCapture) {
    return inFlightCapture
  }
  // Why: the consent dialog is part of the single-flight window — otherwise a
  // second trigger while the dialog is open would stack a second dialog.
  inFlightCapture = (async () => {
    const confirmed = await confirmPerfDumpCapture()
    if (!confirmed) {
      return { canceled: true } as const
    }
    return captureRendererPerfDumpInternal(opts)
  })().finally(() => {
    inFlightCapture = null
  })
  return inFlightCapture
}

async function confirmPerfDumpCapture(): Promise<boolean> {
  const result = await dialog.showMessageBox({
    type: 'warning',
    buttons: [
      translateMain('auto.main.observability.perfDump.e6735719a0', 'Capture'),
      translateMain('auto.main.observability.perfDump.8d1d1d5725', 'Cancel')
    ],
    defaultId: 1,
    cancelId: 1,
    title: translateMain(
      'auto.main.observability.perfDump.3f8be4a51c',
      'Capture performance report?'
    ),
    message: translateMain(
      'auto.main.observability.perfDump.9c27d41e88',
      'This saves a local performance report for support.'
    ),
    detail: translateMain(
      'auto.main.observability.perfDump.b52ce7d316',
      'Orca will record about 10 seconds of CPU activity from its interface and background process, plus app metrics. The report contains timing data, Orca function names and source paths, and workspace folder names — not terminal text or file contents. It is saved to your computer only; nothing is uploaded.'
    )
  })
  return result.response === 0
}

async function captureRendererPerfDumpInternal({
  getRendererWebContents,
  onProgress
}: CapturePerfDumpOptions): Promise<CapturePerfDumpResult> {
  const captureId = randomUUID()
  const tempRoot = join(app.getPath('temp'), 'orca-perf-dumps')
  const captureDir = join(tempRoot, captureId)
  const outputPath = await chooseOutputPath()
  const startedAt = new Date().toISOString()
  const artifacts: Record<string, ArtifactStatus> = {}
  const entries: TarArchiveEntry[] = []

  try {
    await mkdir(captureDir, { recursive: true, mode: 0o700 })
    onProgress?.('metrics')
    await captureMetricsArtifact(captureDir, getRendererWebContents, artifacts, entries)

    onProgress?.('profile')
    // Why: both profiles share one 10 s window so the report describes a
    // single incident rather than two disjoint time slices.
    await Promise.all([
      captureRendererProfileArtifact(captureDir, getRendererWebContents, artifacts, entries),
      captureMainProfileArtifact(captureDir, artifacts, entries)
    ])

    onProgress?.('compressing')
    // Why: the concurrent profile captures finish in either order; pin the
    // archive layout so reports are deterministic.
    entries.sort((a, b) => ARTIFACT_ORDER.indexOf(a.name) - ARTIFACT_ORDER.indexOf(b.name))
    // Why: filter before writing metadata so oversized-artifact skip notes
    // land inside the archived metadata.json.
    const packableEntries = await filterPackableEntries(entries, artifacts)

    const metadataPath = join(captureDir, 'metadata.json')
    await writeFile(
      metadataPath,
      `${JSON.stringify(
        {
          schema_version: 2,
          capture_id: captureId,
          app_version: app.getVersion(),
          platform: platform(),
          arch: arch(),
          os_release: release(),
          orca_channel: resolveDiagnosticOrcaChannel(),
          started_at: startedAt,
          finished_at: new Date().toISOString(),
          artifacts
        },
        null,
        2
      )}\n`,
      { encoding: 'utf8', mode: 0o600 }
    )
    packableEntries.unshift({ name: 'metadata.json', filePath: metadataPath })

    await createTarGzipArchive(outputPath, packableEntries)
    const outputInfo = await stat(outputPath)
    return { filePath: outputPath, bytes: outputInfo.size }
  } catch (error) {
    try {
      await rm(outputPath, { force: true })
    } catch {
      // Why: cleanup failure must not mask the original capture error.
    }
    throw error
  } finally {
    await rm(captureDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function captureMetricsArtifact(
  captureDir: string,
  getRendererWebContents: () => WebContents | null,
  artifacts: Record<string, ArtifactStatus>,
  entries: TarArchiveEntry[]
): Promise<void> {
  const fileName = 'renderer-perf-metrics.json'
  const filePath = join(captureDir, fileName)
  try {
    // Why: the dump stays local behind explicit consent, so it may keep the
    // folder-basename labels that the uploadable bundle anonymizes.
    const metrics = await collectRendererPerfMetrics(getRendererWebContents, {
      labelMode: 'named'
    })
    await writeFile(filePath, `${JSON.stringify(metrics, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600
    })
    const info = await stat(filePath)
    artifacts.metrics = { status: 'included', fileName, bytes: info.size }
    entries.push({ name: fileName, filePath })
  } catch (error) {
    artifacts.metrics = { status: 'failed', reason: formatReason(error) }
  }
}

async function captureRendererProfileArtifact(
  captureDir: string,
  getRendererWebContents: () => WebContents | null,
  artifacts: Record<string, ArtifactStatus>,
  entries: TarArchiveEntry[]
): Promise<void> {
  const fileName = 'renderer.cpuprofile'
  const filePath = join(captureDir, fileName)
  const renderer = getRendererWebContents()
  if (!renderer || renderer.isDestroyed()) {
    artifacts.renderer_profile = { status: 'omitted', reason: 'renderer unavailable' }
    return
  }
  let lease: { release: () => void } | null = null
  try {
    lease = acquireElectronDebugger(renderer)
    const dbg = renderer.debugger
    await dbg.sendCommand('Profiler.enable')
    await dbg.sendCommand('Profiler.setSamplingInterval', {
      interval: PROFILE_SAMPLING_INTERVAL_US
    })
    await dbg.sendCommand('Profiler.start')
    await delay(PROFILE_DURATION_MS)
    const stop = dbg.sendCommand('Profiler.stop')
    // Why: if the bounded wait below gives up first, a late rejection from
    // the loser must not surface as an unhandled rejection.
    stop.catch(() => {})
    const result = (await withTimeout(stop, PROFILER_STOP_TIMEOUT_MS)) as { profile?: unknown }
    if (!result || typeof result !== 'object' || !result.profile) {
      throw new Error('profiler returned no profile')
    }
    await writeFile(filePath, JSON.stringify(result.profile), { encoding: 'utf8', mode: 0o600 })
    const info = await stat(filePath)
    artifacts.renderer_profile = { status: 'included', fileName, bytes: info.size }
    entries.push({ name: fileName, filePath })
  } catch (error) {
    artifacts.renderer_profile = { status: 'failed', reason: formatReason(error) }
  } finally {
    if (!renderer.isDestroyed()) {
      try {
        await renderer.debugger.sendCommand('Profiler.disable')
      } catch {
        /* best effort */
      }
    }
    lease?.release()
  }
}

async function captureMainProfileArtifact(
  captureDir: string,
  artifacts: Record<string, ArtifactStatus>,
  entries: TarArchiveEntry[]
): Promise<void> {
  const fileName = 'main.cpuprofile'
  const filePath = join(captureDir, fileName)
  // Why: the renderer profiler can't see main-process stalls (the frozen
  // loading-screen class); an in-process inspector session captures them.
  const session = new Session()
  let connected = false
  try {
    session.connect()
    connected = true
    await postToInspector(session, 'Profiler.enable')
    await postToInspector(session, 'Profiler.setSamplingInterval', {
      interval: PROFILE_SAMPLING_INTERVAL_US
    })
    await postToInspector(session, 'Profiler.start')
    await delay(PROFILE_DURATION_MS)
    const stop = postToInspector(session, 'Profiler.stop')
    // Why: if the bounded wait below gives up first, a late rejection from
    // the loser must not surface as an unhandled rejection.
    stop.catch(() => {})
    const result = (await withTimeout(stop, PROFILER_STOP_TIMEOUT_MS)) as { profile?: unknown }
    if (!result || typeof result !== 'object' || !result.profile) {
      throw new Error('profiler returned no profile')
    }
    await writeFile(filePath, JSON.stringify(result.profile), { encoding: 'utf8', mode: 0o600 })
    const info = await stat(filePath)
    artifacts.main_profile = { status: 'included', fileName, bytes: info.size }
    entries.push({ name: fileName, filePath })
  } catch (error) {
    artifacts.main_profile = { status: 'failed', reason: formatReason(error) }
  } finally {
    if (connected) {
      try {
        session.disconnect()
      } catch {
        /* best effort */
      }
    }
  }
}

function postToInspector(session: Session, method: string, params?: object): Promise<unknown> {
  return new Promise((resolve, reject) => {
    session.post(method, params, (error: Error | null, result?: unknown) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

async function filterPackableEntries(
  entries: readonly TarArchiveEntry[],
  artifacts: Record<string, ArtifactStatus>
): Promise<TarArchiveEntry[]> {
  const kept: TarArchiveEntry[] = []
  for (const entry of entries) {
    const info = await stat(entry.filePath)
    if (info.size > MAX_TAR_ENTRY_BYTES) {
      artifacts[`skipped:${entry.name}`] = {
        status: 'omitted',
        fileName: entry.name,
        reason: 'file exceeds tar size limit'
      }
      continue
    }
    kept.push(entry)
  }
  return kept
}

async function chooseOutputPath(): Promise<string> {
  const downloads = app.getPath('downloads')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-')
  for (let index = 0; index < 100; index += 1) {
    const suffix = index === 0 ? '' : `-${index + 1}`
    const candidate = join(downloads, `orca-performance-report-${stamp}${suffix}.tar.gz`)
    try {
      await stat(candidate)
    } catch {
      return candidate
    }
  }
  throw new Error('Could not choose a unique file name in Downloads.')
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | null = null
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('timed out')), timeoutMs)
      })
    ])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

function formatReason(error: unknown): string {
  return error instanceof Error && error.message ? error.message.slice(0, 200) : 'unavailable'
}
