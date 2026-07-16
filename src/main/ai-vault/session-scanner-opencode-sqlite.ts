import type { AiVaultSession } from '../../shared/ai-vault-types'
import {
  addPreviewMessage,
  createAccumulator,
  finalizeSession,
  updateTimeline
} from './session-scanner-accumulator'
import { normalizeTitleText } from './session-scanner-values'
import type {
  OpenCodeSqliteSessionMetadata,
  OpenCodeSqliteSessionRowMetadata
} from './session-scanner-types'
import SyncDatabase from '../sqlite/sync-database'
import { columnExists, tableExists } from '../opencode-usage/schema-helpers'

// Why: OpenCode 1.17.x migrated session storage from per-session JSON files
// to a single SQLite DB at ~/.local/share/opencode/opencode.db. This module
// parses individual sessions from the DB into AiVaultSession objects. The
// discovery layer (listing candidates) lives in
// session-scanner-opencode-sqlite-discovery.ts.

function openReadonlyDatabase(dbPath: string): SyncDatabase {
  const db = new SyncDatabase(dbPath, { readonly: true, fileMustExist: true })
  // Why: belt-and-suspenders guard so a bug in the SELECT list can never
  // mutate the user's opencode.db.
  db.pragma('query_only = ON')
  return db
}

function canReadOpenCodeSessions(db: SyncDatabase): boolean {
  return (
    tableExists(db, 'session') &&
    columnExists(db, 'session', 'time_created') &&
    columnExists(db, 'session', 'time_updated')
  )
}

function sessionColumnSelect(db: SyncDatabase, columnName: string): string {
  return columnExists(db, 'session', columnName) ? `s.${columnName}` : 'NULL'
}

function sessionNumberColumnSelect(db: SyncDatabase, columnName: string): string {
  return columnExists(db, 'session', columnName) ? `s.${columnName}` : '0'
}

function buildSessionQuery(db: SyncDatabase): string {
  return `SELECT s.id,
                 ${sessionColumnSelect(db, 'title')} AS title,
                 ${sessionColumnSelect(db, 'directory')} AS directory,
                 s.time_created,
                 s.time_updated,
                 ${sessionColumnSelect(db, 'model')} AS model_json,
                 ${sessionColumnSelect(db, 'agent')} AS agent,
                 ${sessionNumberColumnSelect(db, 'tokens_input')} AS tokens_input,
                 ${sessionNumberColumnSelect(db, 'tokens_output')} AS tokens_output,
                 ${sessionNumberColumnSelect(db, 'tokens_reasoning')} AS tokens_reasoning,
                 ${sessionNumberColumnSelect(db, 'tokens_cache_read')} AS tokens_cache_read,
                 ${sessionNumberColumnSelect(db, 'cost')} AS cost
          FROM session s
          WHERE s.id = ?
          LIMIT 1`
}

function extractModelId(modelJson: string | null): string | null {
  if (!modelJson) {
    return null
  }
  try {
    const parsed = JSON.parse(modelJson) as unknown
    const record =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null
    if (!record) {
      return null
    }
    // Why: OpenCode 1.17.x stores model as {"id":"glm-5.2","providerID":"..."}.
    // Older schemas used {"modelID":"..."}; accept both.
    return (
      (typeof record.id === 'string' && record.id.trim()) ||
      (typeof record.modelID === 'string' && record.modelID.trim()) ||
      null
    )
  } catch {
    return null
  }
}

function extractPartText(partData: string): string | null {
  try {
    const parsed = JSON.parse(partData) as unknown
    const record =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null
    if (!record) {
      return null
    }
    if (typeof record.text === 'string') {
      return record.text
    }
    return null
  } catch {
    return null
  }
}

/**
 * Parse a single OpenCode session from the SQLite database into an
 * `AiVaultSession`. Reads session metadata (title, cwd, model, tokens, cost)
 * and folds in count/preview metadata loaded by the batched scanner stage.
 * A direct caller without prefetched session metadata falls back to opening
 * the database read-only with `PRAGMA query_only = ON`.
 * @param args.dbPath - Absolute path to the opencode.db file.
 * @param args.sessionId - The session ID (primary key in the `session` table).
 * @param args.platform - The platform to use for resume command generation.
 * @param args.metadata - Count and preview rows prefetched in one DB-wide batch.
 * @returns The parsed `AiVaultSession`, or `null` if the session does not exist
 *   or the database lacks the required schema.
 */
export async function parseOpenCodeSqliteSession(args: {
  dbPath: string
  sessionId: string
  platform: NodeJS.Platform
  metadata?: OpenCodeSqliteSessionMetadata
}): Promise<AiVaultSession | null> {
  const { dbPath, sessionId, platform } = args
  const metadata = args.metadata ?? { messageCount: 0, previewRows: [] }
  let db: SyncDatabase | null = null
  try {
    if (metadata.sessionRow === null) {
      return null
    }
    let row = metadata.sessionRow
    if (!row) {
      db = openReadonlyDatabase(dbPath)
      if (!canReadOpenCodeSessions(db)) {
        return null
      }
      row = db.prepare(buildSessionQuery(db)).get(sessionId) as
        | OpenCodeSqliteSessionRowMetadata
        | undefined
    }
    if (!row || row.id !== sessionId) {
      return null
    }

    const mtimeMs =
      typeof row.time_updated === 'number' && row.time_updated > 0
        ? row.time_updated
        : row.time_created
    // Why: discovery uses a synthetic db#session path only for parser routing.
    // The UI's log open/reveal actions need a real filesystem path.
    const accumulator = createAccumulator({
      agent: 'opencode',
      file: {
        path: dbPath,
        mtimeMs,
        modifiedAt: new Date(mtimeMs).toISOString()
      },
      sessionId
    })
    accumulator.title = normalizeTitleText(row.title ?? '')
    accumulator.cwd = row.directory
    accumulator.model = extractModelId(row.model_json)
    accumulator.totalTokens =
      (row.tokens_input ?? 0) + (row.tokens_output ?? 0) + (row.tokens_reasoning ?? 0)
    // Why: this plain row count is a history-list indicator and avoids reading
    // foreign message.data blobs solely to re-check OpenCode's turn role.
    accumulator.messageCount = metadata.messageCount
    updateTimeline(accumulator, row.time_created)
    updateTimeline(accumulator, row.time_updated)

    for (const previewRow of metadata.previewRows) {
      const text = extractPartText(previewRow.partData)
      if (!text) {
        continue
      }
      addPreviewMessage(accumulator, {
        role: previewRow.role,
        text,
        timestamp: previewRow.timeCreated
      })
      if (previewRow.role === 'user' && !accumulator.title) {
        accumulator.title =
          normalizeTitleText(previewRow.summaryTitle ?? '') ||
          normalizeTitleText(previewRow.summaryBody ?? '')
      }
    }

    return finalizeSession(accumulator, platform)
  } finally {
    db?.close()
  }
}
