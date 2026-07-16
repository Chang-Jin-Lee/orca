import { appendFileSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname } from 'node:path'
import { writeFileAtomically } from '../codex-accounts/fs-utils'

// State files for the session index heal: which backfilled rollouts exist
// (the backfill audit ledger), which thread ids this pass already processed
// (the heal ledger), and the completion marker that makes steady-state
// startups a two-stat no-op.

// Bump to re-drive the heal for every host after a semantics change; already
// processed thread ids are re-read because ledger lines are version-scoped.
export const CODEX_SESSION_INDEX_HEAL_VERSION = 1

// Why: an unsupported CLI stays unsupported until upgraded; re-probing once a
// day is enough to notice an upgrade without a per-startup spawn.
const HEAL_UNSUPPORTED_RETRY_INTERVAL_MS = 24 * 60 * 60 * 1000

const CODEX_ROLLOUT_THREAD_ID_PATTERN =
  /^rollout-(.+)-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/i

export type CodexSessionIndexHealPaths = {
  auditLogPath: string
  systemSessionsRoot: string
  healLedgerPath: string
  healMarkerPath: string
}

export type HealLedgerOutcome = 'healed' | 'missing' | 'failed'

export type PendingHealThread = {
  threadId: string
  /** Timestamp segment of the rollout file name; lexicographic recency order. */
  rolloutStamp: string
}

export type HealMarkerSummary = {
  healedThreads: number
  missingThreads: number
  failedThreads: number
}

/**
 * Diffs the backfill audit ledger against the heal ledger: every hardlinked or
 * copied rollout whose thread id has not been processed yet, most recent first.
 */
export function collectPendingHealThreads(paths: CodexSessionIndexHealPaths): PendingHealThread[] {
  const processedThreadIds = readProcessedHealThreadIds(paths.healLedgerPath)
  const pendingByThreadId = new Map<string, PendingHealThread>()
  for (const line of readJsonlLines(paths.auditLogPath)) {
    if ((line.action !== 'hardlink' && line.action !== 'copy') || typeof line.target !== 'string') {
      continue
    }
    const match = CODEX_ROLLOUT_THREAD_ID_PATTERN.exec(lastPathSegment(line.target))
    if (!match) {
      continue
    }
    const threadId = match[2].toLowerCase()
    if (processedThreadIds.has(threadId)) {
      continue
    }
    pendingByThreadId.set(threadId, { threadId, rolloutStamp: match[1] })
  }
  return [...pendingByThreadId.values()].sort((left, right) =>
    left.rolloutStamp < right.rolloutStamp ? 1 : left.rolloutStamp > right.rolloutStamp ? -1 : 0
  )
}

function lastPathSegment(filePath: string): string {
  return filePath.split(/[\\/]/).at(-1) ?? ''
}

function readProcessedHealThreadIds(healLedgerPath: string): Set<string> {
  const processed = new Set<string>()
  for (const line of readJsonlLines(healLedgerPath)) {
    if (line.v === CODEX_SESSION_INDEX_HEAL_VERSION && typeof line.threadId === 'string') {
      processed.add(line.threadId.toLowerCase())
    }
  }
  return processed
}

export function appendHealLedgerRecord(
  healLedgerPath: string,
  threadId: string,
  outcome: HealLedgerOutcome
): void {
  try {
    mkdirSync(dirname(healLedgerPath), { recursive: true })
    appendFileSync(
      healLedgerPath,
      `${JSON.stringify({
        v: CODEX_SESSION_INDEX_HEAL_VERSION,
        threadId,
        outcome,
        at: new Date().toISOString()
      })}\n`
    )
  } catch (error) {
    // Why: losing a ledger line only costs one redundant thread/read on the
    // next pass; it must not fail the heal.
    console.warn('[codex-session-index-heal] Failed to append heal ledger record:', error)
  }
}

function readJsonlLines(filePath: string): Record<string, unknown>[] {
  let contents: string
  try {
    contents = readFileSync(filePath, 'utf-8')
  } catch {
    return []
  }
  const lines: Record<string, unknown>[] = []
  for (const raw of contents.split('\n')) {
    if (!raw.trim()) {
      continue
    }
    try {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        lines.push(parsed as Record<string, unknown>)
      }
    } catch {
      // Skip torn/corrupt lines; both ledgers are append-only diagnostics.
    }
  }
  return lines
}

export function readAuditLogSize(auditLogPath: string): number {
  try {
    return statSync(auditLogPath).size
  } catch {
    return 0
  }
}

export function isHealMarkerCurrent(
  paths: CodexSessionIndexHealPaths,
  auditBytes: number
): boolean {
  try {
    const parsed: unknown = JSON.parse(readFileSync(paths.healMarkerPath, 'utf-8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return false
    }
    const marker = parsed as {
      version?: unknown
      systemSessionsRoot?: unknown
      auditBytes?: unknown
      unsupportedAt?: unknown
    }
    if (
      marker.version !== CODEX_SESSION_INDEX_HEAL_VERSION ||
      marker.systemSessionsRoot !== paths.systemSessionsRoot
    ) {
      return false
    }
    if (typeof marker.unsupportedAt === 'number') {
      return Date.now() - marker.unsupportedAt < HEAL_UNSUPPORTED_RETRY_INTERVAL_MS
    }
    // Why: the audit ledger is append-only, so an unchanged byte size means no
    // new backfilled sessions since this marker was written.
    return marker.auditBytes === auditBytes
  } catch {
    return false
  }
}

export function writeHealMarker(
  paths: CodexSessionIndexHealPaths,
  auditBytes: number,
  summary: HealMarkerSummary,
  unsupportedAt?: number
): void {
  try {
    mkdirSync(dirname(paths.healMarkerPath), { recursive: true })
    writeFileAtomically(
      paths.healMarkerPath,
      `${JSON.stringify(
        {
          version: CODEX_SESSION_INDEX_HEAL_VERSION,
          systemSessionsRoot: paths.systemSessionsRoot,
          auditBytes,
          healedThreads: summary.healedThreads,
          missingThreads: summary.missingThreads,
          failedThreads: summary.failedThreads,
          ...(unsupportedAt === undefined ? {} : { unsupportedAt }),
          completedAt: Date.now()
        },
        null,
        2
      )}\n`
    )
  } catch (error) {
    console.warn('[codex-session-index-heal] Failed to write heal marker:', error)
  }
}
