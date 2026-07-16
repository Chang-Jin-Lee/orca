import { mkdirSync, readFileSync } from 'node:fs'
import { link, lstat, mkdir } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { writeFileAtomically } from '../codex-accounts/fs-utils'
import {
  getCodexSessionBackfillStateDirPath,
  getOrcaManagedCodexHomePath,
  getSystemCodexHomePath
} from './codex-home-paths'
import {
  createCodexSessionBackfillAuditWriter,
  type CodexSessionBackfillAuditWriter
} from './codex-session-backfill-audit'
import {
  copySessionFileWithoutOverwrite,
  isAtomicNoReplaceUnsupportedError
} from './codex-session-backfill-copy'
import { listCodexSessionJsonlFilesIncrementally } from './codex-session-file-listing'
import type { CodexSessionBridgeIncrementalOptions } from './codex-session-file-listing'

// Why: bump to re-run the backfill for every host after a layout or semantics
// change; the run itself stays skip-existing so re-runs never overwrite.
const CODEX_SESSION_BACKFILL_MARKER_VERSION = 1

export type CodexSessionBackfillSummary = {
  scannedFiles: number
  linkedFiles: number
  copiedFiles: number
  skippedExistingFiles: number
  skippedUnexpectedFiles: number
  skippedSymlinkFiles: number
  skippedUnsupportedFilesystemFiles: number
  failedDirectories: number
  failedFiles: number
}

export type CodexSessionBackfillPaths = {
  managedSessionsRoot: string
  systemSessionsRoot: string
  auditLogPath: string
  markerPath: string
}

let backgroundBackfillTask: Promise<CodexSessionBackfillSummary | null> | null = null

/**
 * Resolves the production source/target/state paths for the session backfill.
 *
 * `systemCodexHomePathOverride` mirrors the session bridge: users who run
 * Codex with a custom CODEX_HOME need their history placed where their own
 * `codex resume` actually looks.
 */
export function resolveCodexSessionBackfillPaths(
  systemCodexHomePathOverride?: string
): CodexSessionBackfillPaths {
  const stateDir = getCodexSessionBackfillStateDirPath()
  return {
    managedSessionsRoot: join(getOrcaManagedCodexHomePath(), 'sessions'),
    systemSessionsRoot: join(systemCodexHomePathOverride || getSystemCodexHomePath(), 'sessions'),
    auditLogPath: join(stateDir, 'audit.jsonl'),
    markerPath: join(stateDir, 'backfill-complete.json')
  }
}

/**
 * Starts the once-per-host background backfill of managed-home session files
 * into the user's real Codex home.
 *
 * Concurrent callers share one in-flight task; a completed-marker host resolves
 * to null without walking the sessions tree.
 */
export function startCodexSessionBackfillInBackground(
  options: CodexSessionBridgeIncrementalOptions = {},
  systemCodexHomePathOverride?: string
): Promise<CodexSessionBackfillSummary | null> {
  if (backgroundBackfillTask) {
    return backgroundBackfillTask
  }
  const task = runCodexSessionBackfillOncePerHost(options, systemCodexHomePathOverride).catch(
    (error: unknown) => {
      console.warn('[codex-session-backfill] Background session backfill failed:', error)
      return null
    }
  )
  backgroundBackfillTask = task
  void task.finally(() => {
    if (backgroundBackfillTask === task) {
      backgroundBackfillTask = null
    }
  })
  return task
}

async function runCodexSessionBackfillOncePerHost(
  options: CodexSessionBridgeIncrementalOptions,
  systemCodexHomePathOverride?: string
): Promise<CodexSessionBackfillSummary | null> {
  const paths = resolveCodexSessionBackfillPaths(systemCodexHomePathOverride)
  if (hasCompletedBackfillMarker(paths.markerPath, paths.systemSessionsRoot)) {
    return null
  }
  const summary = await backfillManagedCodexSessionsIntoSystemHome(paths, options)
  // Why: per-file failures (locked or unreadable files) leave the marker unset
  // so the next startup retries; skip-existing keeps those retries cheap.
  if (summary.failedFiles === 0 && summary.failedDirectories === 0) {
    writeBackfillMarker(paths.markerPath, paths.systemSessionsRoot, summary)
  }
  return summary
}

/**
 * Backfills managed-home session rollout files into the real Codex home.
 *
 * Non-destructive by contract: existing target files are always skipped, and
 * nothing in either home is deleted or moved. Hardlink first so resume sees
 * one physical JSONL log; copy is the cross-volume fallback.
 */
export async function backfillManagedCodexSessionsIntoSystemHome(
  paths: CodexSessionBackfillPaths,
  options: CodexSessionBridgeIncrementalOptions = {}
): Promise<CodexSessionBackfillSummary> {
  const summary: CodexSessionBackfillSummary = {
    scannedFiles: 0,
    linkedFiles: 0,
    copiedFiles: 0,
    skippedExistingFiles: 0,
    skippedUnexpectedFiles: 0,
    skippedSymlinkFiles: 0,
    skippedUnsupportedFilesystemFiles: 0,
    failedDirectories: 0,
    failedFiles: 0
  }
  const appendAuditRecord = createCodexSessionBackfillAuditWriter(paths.auditLogPath)
  const ensuredTargetDirectories = new Set<string>()
  const managedSessionsRootExists = await checkManagedSessionsRoot(
    paths,
    summary,
    appendAuditRecord
  )
  if (managedSessionsRootExists) {
    for await (const managedSessionFilePath of listCodexSessionJsonlFilesIncrementally(
      paths.managedSessionsRoot,
      options,
      async (directoryPath, error) => {
        // Why: a partial walk must remain retryable; otherwise an unreadable
        // date directory would be silently omitted behind a completion marker.
        summary.failedDirectories += 1
        await appendAuditRecord({
          action: 'scan-failed',
          source: directoryPath,
          error: describeError(error)
        })
      }
    )) {
      summary.scannedFiles += 1
      if (!isCodexRolloutPath(paths.managedSessionsRoot, managedSessionFilePath)) {
        summary.skippedUnexpectedFiles += 1
        continue
      }
      // Why: sequential async mutations bound disk pressure while keeping the
      // Electron main thread available for UI and PTY work.
      await backfillOneManagedSessionFile(
        paths,
        managedSessionFilePath,
        summary,
        appendAuditRecord,
        ensuredTargetDirectories
      )
    }
  }
  await appendAuditRecord({ action: 'run-summary', ...summary })
  return summary
}

async function checkManagedSessionsRoot(
  paths: CodexSessionBackfillPaths,
  summary: CodexSessionBackfillSummary,
  appendAuditRecord: CodexSessionBackfillAuditWriter
): Promise<boolean> {
  try {
    await lstat(paths.managedSessionsRoot)
    return true
  } catch (error) {
    if (isNotFoundError(error)) {
      return false
    }
    // Why: existsSync collapses access failures into "missing," which could
    // permanently hide sessions behind an incorrect completion marker.
    summary.failedDirectories += 1
    await appendAuditRecord({
      action: 'scan-failed',
      source: paths.managedSessionsRoot,
      error: describeError(error)
    })
    return false
  }
}

function isCodexRolloutPath(sessionsRoot: string, filePath: string): boolean {
  const pathParts = relative(sessionsRoot, filePath).split(sep)
  if (pathParts.length !== 4) {
    return false
  }
  const [year, month, day, fileName] = pathParts
  return (
    /^\d{4}$/.test(year) &&
    /^\d{2}$/.test(month) &&
    /^\d{2}$/.test(day) &&
    /^rollout-.+\.jsonl$/.test(fileName)
  )
}

async function backfillOneManagedSessionFile(
  paths: CodexSessionBackfillPaths,
  managedSessionFilePath: string,
  summary: CodexSessionBackfillSummary,
  appendAuditRecord: CodexSessionBackfillAuditWriter,
  ensuredTargetDirectories: Set<string>
): Promise<void> {
  if (await isSymbolicLink(managedSessionFilePath)) {
    // Why: bridge-created symlinks already point at a file in the user's own
    // home; materializing them here could duplicate a foreign tree.
    summary.skippedSymlinkFiles += 1
    return
  }
  const relativePath = relative(paths.managedSessionsRoot, managedSessionFilePath)
  const systemSessionFilePath = join(paths.systemSessionsRoot, relativePath)
  if (await pathEntryExists(systemSessionFilePath)) {
    summary.skippedExistingFiles += 1
    return
  }

  try {
    const targetDirectory = dirname(systemSessionFilePath)
    if (!ensuredTargetDirectories.has(targetDirectory)) {
      // Why: one date directory can contain thousands of rollouts; avoid a
      // redundant filesystem round trip before every hardlink.
      await mkdir(targetDirectory, { recursive: true })
      ensuredTargetDirectories.add(targetDirectory)
    }
    await link(managedSessionFilePath, systemSessionFilePath)
    summary.linkedFiles += 1
    await appendAuditRecord({
      action: 'hardlink',
      source: managedSessionFilePath,
      target: systemSessionFilePath
    })
  } catch (linkError) {
    if (isExistsError(linkError)) {
      summary.skippedExistingFiles += 1
      return
    }
    if (isNotFoundError(linkError)) {
      ensuredTargetDirectories.delete(dirname(systemSessionFilePath))
    }
    try {
      // Why: cross-volume copies are staged so failures cannot strand a
      // truncated rollout, then installed without overwriting collisions.
      await copySessionFileWithoutOverwrite(managedSessionFilePath, systemSessionFilePath)
      summary.copiedFiles += 1
      await appendAuditRecord({
        action: 'copy',
        source: managedSessionFilePath,
        target: systemSessionFilePath
      })
    } catch (copyError) {
      if (isExistsError(copyError)) {
        summary.skippedExistingFiles += 1
        return
      }
      if (isAtomicNoReplaceUnsupportedError(copyError)) {
        summary.skippedUnsupportedFilesystemFiles += 1
        await appendAuditRecord({
          action: 'copy-unsupported',
          source: managedSessionFilePath,
          target: systemSessionFilePath
        })
        return
      }
      summary.failedFiles += 1
      await appendAuditRecord({
        action: 'failed',
        source: managedSessionFilePath,
        target: systemSessionFilePath,
        error: describeError(copyError),
        linkError: describeError(linkError)
      })
    }
  }
}

async function isSymbolicLink(filePath: string): Promise<boolean> {
  try {
    return (await lstat(filePath)).isSymbolicLink()
  } catch {
    return false
  }
}

/** Existence via lstat so a broken symlink at the target still counts as taken. */
async function pathEntryExists(entryPath: string): Promise<boolean> {
  try {
    await lstat(entryPath)
    return true
  } catch {
    return false
  }
}

function isExistsError(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === 'EEXIST'
}

function isNotFoundError(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === 'ENOENT'
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function hasCompletedBackfillMarker(markerPath: string, systemSessionsRoot: string): boolean {
  try {
    const parsed: unknown = JSON.parse(readFileSync(markerPath, 'utf-8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return false
    }
    const marker = parsed as { version?: unknown; systemSessionsRoot?: unknown }
    // Why: changing the configured real Codex home must backfill the new
    // target instead of honoring a marker written for a different history.
    return (
      marker.version === CODEX_SESSION_BACKFILL_MARKER_VERSION &&
      marker.systemSessionsRoot === systemSessionsRoot
    )
  } catch {
    return false
  }
}

function writeBackfillMarker(
  markerPath: string,
  systemSessionsRoot: string,
  summary: CodexSessionBackfillSummary
): void {
  mkdirSync(dirname(markerPath), { recursive: true })
  writeFileAtomically(
    markerPath,
    `${JSON.stringify(
      {
        version: CODEX_SESSION_BACKFILL_MARKER_VERSION,
        systemSessionsRoot,
        completedAt: Date.now(),
        summary
      },
      null,
      2
    )}\n`
  )
}
