import SyncDatabase from '../sqlite/sync-database'
import { columnExists, tableExists } from '../opencode-usage/schema-helpers'
import { splitOpenCodeSqliteCandidate } from './session-scanner-opencode-sqlite-paths'
import type {
  OpenCodeSqlitePreviewMetadata,
  OpenCodeSqliteSessionMetadata,
  OpenCodeSqliteSessionRowMetadata,
  SessionFileCandidate
} from './session-scanner-types'
import { asRecord, errorMessage, normalizeTitleText } from './session-scanner-values'

const OPENCODE_SQLITE_PREVIEW_LIMIT = 5

const COUNT_QUERY = `SELECT session_id, COUNT(*) AS message_count
  FROM message
  WHERE session_id IN (SELECT value FROM json_each(?))
  GROUP BY session_id`

// Why: materializing the batch-wide folds prevents an unindexed foreign DB
// from turning the preview window back into correlated per-session scans.
const PREVIEW_QUERY = `WITH candidate_messages AS MATERIALIZED (
    SELECT id,
           session_id,
           CASE WHEN json_valid(data) THEN json_extract(data, '$.role') END AS role
    FROM message
    WHERE session_id IN (SELECT value FROM json_each(?))
  ),
  ranked_previews AS MATERIALIZED (
    SELECT p.id AS part_id,
           candidate_messages.id AS message_id,
           candidate_messages.session_id,
           candidate_messages.role,
           p.time_created,
           ROW_NUMBER() OVER (
             PARTITION BY candidate_messages.session_id
             ORDER BY p.time_created DESC
           ) AS preview_rank
    FROM candidate_messages
    JOIN part p ON p.message_id = candidate_messages.id
    WHERE candidate_messages.role IN ('user', 'assistant')
      AND CASE WHEN json_valid(p.data) THEN json_extract(p.data, '$.type') END = 'text'
  ),
  selected_previews AS MATERIALIZED (
    SELECT * FROM ranked_previews WHERE preview_rank <= ?
  )
  SELECT selected_previews.session_id,
         selected_previews.message_id,
         selected_previews.role,
         p.data AS part_data,
         selected_previews.time_created
  FROM selected_previews
  CROSS JOIN part p ON p.id = selected_previews.part_id
  ORDER BY selected_previews.session_id, selected_previews.preview_rank DESC`

type CountRow = { session_id: string; message_count: number }

type PreviewRow = {
  session_id: string
  message_id: string
  role: string
  part_data: string
  time_created: number
}

type SummaryRow = { id: string; data: string }

function openReadonlyDatabase(dbPath: string): SyncDatabase {
  const db = new SyncDatabase(dbPath, { readonly: true, fileMustExist: true })
  db.pragma('query_only = ON')
  return db
}

function emptyMetadata(): OpenCodeSqliteSessionMetadata {
  return { sessionRow: null, messageCount: 0, previewRows: [] }
}

function sessionColumnSelect(db: SyncDatabase, columnName: string): string {
  return columnExists(db, 'session', columnName) ? columnName : 'NULL'
}

function sessionNumberColumnSelect(db: SyncDatabase, columnName: string): string {
  return columnExists(db, 'session', columnName) ? columnName : '0'
}

function loadSessionRows(
  db: SyncDatabase,
  sessionIdsJson: string,
  metadata: Map<string, OpenCodeSqliteSessionMetadata>
): void {
  if (!tableExists(db, 'session')) {
    return
  }
  const rows = db
    .prepare(
      `SELECT id,
              ${sessionColumnSelect(db, 'title')} AS title,
              ${sessionColumnSelect(db, 'directory')} AS directory,
              time_created,
              time_updated,
              ${sessionColumnSelect(db, 'model')} AS model_json,
              ${sessionColumnSelect(db, 'agent')} AS agent,
              ${sessionNumberColumnSelect(db, 'tokens_input')} AS tokens_input,
              ${sessionNumberColumnSelect(db, 'tokens_output')} AS tokens_output,
              ${sessionNumberColumnSelect(db, 'tokens_reasoning')} AS tokens_reasoning,
              ${sessionNumberColumnSelect(db, 'tokens_cache_read')} AS tokens_cache_read,
              ${sessionNumberColumnSelect(db, 'cost')} AS cost
       FROM session
       WHERE id IN (SELECT value FROM json_each(?))`
    )
    .all(sessionIdsJson) as OpenCodeSqliteSessionRowMetadata[]
  for (const row of rows) {
    const current = metadata.get(row.id)
    if (current) {
      metadata.set(row.id, { ...current, sessionRow: row })
    }
  }
}

function canCountMessages(db: SyncDatabase): boolean {
  return tableExists(db, 'message') && columnExists(db, 'message', 'session_id')
}

function canLoadPreviews(db: SyncDatabase): boolean {
  return (
    canCountMessages(db) &&
    columnExists(db, 'message', 'id') &&
    columnExists(db, 'message', 'data') &&
    tableExists(db, 'part') &&
    columnExists(db, 'part', 'id') &&
    columnExists(db, 'part', 'message_id') &&
    columnExists(db, 'part', 'time_created') &&
    columnExists(db, 'part', 'data')
  )
}

function sessionIdsNeedingSummary(
  sessionIds: readonly string[],
  metadata: ReadonlyMap<string, OpenCodeSqliteSessionMetadata>
): Set<string> {
  return new Set(
    sessionIds.filter((sessionId) => {
      const title = metadata.get(sessionId)?.sessionRow?.title
      return !normalizeTitleText(typeof title === 'string' ? title : '')
    })
  )
}

function summariesByMessageId(
  db: SyncDatabase,
  previewRows: readonly PreviewRow[],
  fallbackSessionIds: ReadonlySet<string>
): Map<string, { title: string | null; body: string | null }> {
  const messageIds = [
    ...new Set(
      previewRows
        .filter((row) => row.role === 'user' && fallbackSessionIds.has(row.session_id))
        .map((row) => row.message_id)
    )
  ]
  if (messageIds.length === 0) {
    return new Map()
  }
  const rows = db
    .prepare(`SELECT id, data FROM message WHERE id IN (SELECT value FROM json_each(?))`)
    .all(JSON.stringify(messageIds)) as SummaryRow[]
  return new Map(rows.map((row) => [row.id, extractSummary(row.data)]))
}

function extractSummary(data: string): { title: string | null; body: string | null } {
  try {
    const message = asRecord(JSON.parse(data) as unknown)
    const summary = asRecord(message?.summary)
    return {
      title: typeof summary?.title === 'string' ? summary.title : null,
      body: typeof summary?.body === 'string' ? summary.body : null
    }
  } catch {
    return { title: null, body: null }
  }
}

function previewMetadata(
  row: PreviewRow,
  summaries: ReadonlyMap<string, { title: string | null; body: string | null }>
): OpenCodeSqlitePreviewMetadata {
  const summary = summaries.get(row.message_id)
  return {
    role: row.role === 'user' || row.role === 'assistant' ? row.role : 'unknown',
    partData: row.part_data,
    timeCreated: row.time_created,
    summaryTitle: summary?.title ?? null,
    summaryBody: summary?.body ?? null
  }
}

/** Load count and preview metadata for many sessions with fixed batch-wide passes. */
export function loadOpenCodeSqliteSessionMetadata(args: {
  dbPath: string
  sessionIds: readonly string[]
}): ReadonlyMap<string, OpenCodeSqliteSessionMetadata> {
  const sessionIds = [...new Set(args.sessionIds)]
  const metadata = new Map(sessionIds.map((sessionId) => [sessionId, emptyMetadata()]))
  if (sessionIds.length === 0) {
    return metadata
  }

  const db = openReadonlyDatabase(args.dbPath)
  try {
    const sessionIdsJson = JSON.stringify(sessionIds)
    loadSessionRows(db, sessionIdsJson, metadata)
    if (!canCountMessages(db)) {
      return metadata
    }
    const countRows = db.prepare(COUNT_QUERY).all(sessionIdsJson) as CountRow[]
    for (const row of countRows) {
      const current = metadata.get(row.session_id)
      if (current) {
        metadata.set(row.session_id, { ...current, messageCount: row.message_count })
      }
    }
    if (!canLoadPreviews(db)) {
      return metadata
    }

    // Why: malformed rows belong to another app; skip them instead of losing
    // every otherwise-readable session in the batch.
    const rows = db
      .prepare(PREVIEW_QUERY)
      .all(sessionIdsJson, OPENCODE_SQLITE_PREVIEW_LIMIT) as PreviewRow[]
    const fallbackSessionIds = sessionIdsNeedingSummary(sessionIds, metadata)
    const summaries = summariesByMessageId(db, rows, fallbackSessionIds)
    for (const row of rows) {
      const current = metadata.get(row.session_id)
      if (current) {
        metadata.set(row.session_id, {
          ...current,
          previewRows: [...current.previewRows, previewMetadata(row, summaries)]
        })
      }
    }
    return metadata
  } finally {
    db.close()
  }
}

export type OpenCodeSqliteMetadataLoadFailure = { dbPath: string; message: string }

/** Attach one batched metadata result to each synthetic SQLite candidate. */
export function loadOpenCodeSqliteCandidateMetadata(candidates: readonly SessionFileCandidate[]): {
  candidates: SessionFileCandidate[]
  failures: OpenCodeSqliteMetadataLoadFailure[]
} {
  const batches = new Map<string, { index: number; sessionId: string }[]>()
  candidates.forEach((candidate, index) => {
    if (candidate.agent !== 'opencode') {
      return
    }
    const parsed = splitOpenCodeSqliteCandidate(candidate.file.path)
    if (!parsed) {
      return
    }
    const batch = batches.get(parsed.dbPath) ?? []
    batch.push({ index, sessionId: parsed.sessionId })
    batches.set(parsed.dbPath, batch)
  })

  const hydrated = [...candidates]
  const failures: OpenCodeSqliteMetadataLoadFailure[] = []
  for (const [dbPath, batch] of batches) {
    let loaded: ReadonlyMap<string, OpenCodeSqliteSessionMetadata> | null = null
    try {
      loaded = loadOpenCodeSqliteSessionMetadata({
        dbPath,
        sessionIds: batch.map((item) => item.sessionId)
      })
    } catch (err) {
      failures.push({ dbPath, message: errorMessage(err) })
    }
    if (!loaded) {
      continue
    }
    for (const item of batch) {
      const candidate = hydrated[item.index]
      if (candidate) {
        hydrated[item.index] = {
          ...candidate,
          opencodeSqliteMetadata: loaded.get(item.sessionId) ?? emptyMetadata()
        }
      }
    }
  }
  return { candidates: hydrated, failures }
}
