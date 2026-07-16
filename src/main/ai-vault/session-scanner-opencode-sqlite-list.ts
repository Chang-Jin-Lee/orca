import type { AiVaultAgent, AiVaultScanIssue } from '../../shared/ai-vault-types'
import { buildOpenCodeSqliteCandidatePath } from './session-scanner-opencode-sqlite-paths'
import { splitOpenCodeSqliteCandidate } from './session-scanner-opencode-sqlite-paths'
import type { SessionFileCandidate } from './session-scanner-types'
import { errorMessage } from './session-scanner-values'
import SyncDatabase from '../sqlite/sync-database'
import { columnExists, tableExists } from '../opencode-usage/schema-helpers'

// Why: the SQLite session-list query + reader lives in its own electron-free
// module so both the worker entry and the main-thread worker client can import
// it without pulling in the client's Electron dependency.

type SessionRow = {
  id: string
  title: string | null
  directory: string | null
  time_created: number
  time_updated: number
  model_json: string | null
  agent: string | null
  tokens_input: number
  tokens_output: number
  tokens_reasoning: number
  tokens_cache_read: number
  cost: number
  message_count: number
}

function openReadonlyDatabase(dbPath: string): SyncDatabase {
  const db = new SyncDatabase(dbPath, { readonly: true, fileMustExist: true })
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

function canCountOpenCodeMessages(db: SyncDatabase): boolean {
  return (
    tableExists(db, 'message') &&
    columnExists(db, 'message', 'session_id') &&
    columnExists(db, 'message', 'data')
  )
}

function buildSessionListQuery(db: SyncDatabase): string {
  const modelSelect = sessionColumnSelect(db, 'model')
  const agentSelect = sessionColumnSelect(db, 'agent')
  const tokenColumns = ['tokens_input', 'tokens_output', 'tokens_reasoning', 'tokens_cache_read']
  const tokenSelects = tokenColumns
    .map((col) => `${columnExists(db, 'session', col) ? `s.${col}` : '0'} AS ${col}`)
    .join(', ')
  const costSelect = columnExists(db, 'session', 'cost') ? 's.cost' : '0'
  const parentIdPredicate = columnExists(db, 'session', 'parent_id') ? 'AND parent_id IS NULL' : ''
  const archivedPredicate = columnExists(db, 'session', 'time_archived')
    ? 'AND time_archived IS NULL'
    : ''
  const messageCountSubquery = canCountOpenCodeMessages(db)
    ? `(SELECT COUNT(*) FROM message m
        WHERE m.session_id = s.id
          AND json_extract(m.data, '$.role') IN ('user','assistant'))`
    : '0'

  // Why (#8864): sort+LIMIT the session rows in an inner subselect first so the
  // correlated message-count subquery is evaluated only for the returned rows,
  // not for every session in a multi-GB DB.
  return `SELECT s.id,
                 ${sessionColumnSelect(db, 'title')} AS title,
                 ${sessionColumnSelect(db, 'directory')} AS directory,
                 s.time_created,
                 s.time_updated,
                 ${modelSelect} AS model_json, ${agentSelect} AS agent,
                 ${tokenSelects}, ${costSelect} AS cost,
                 ${messageCountSubquery} AS message_count
          FROM (SELECT * FROM session
                WHERE 1=1 ${parentIdPredicate} ${archivedPredicate}
                ORDER BY time_updated DESC
                LIMIT ?) s`
}

function rowToCandidate(row: SessionRow, dbPath: string): SessionFileCandidate {
  const mtimeMs =
    typeof row.time_updated === 'number' && row.time_updated > 0
      ? row.time_updated
      : row.time_created
  return {
    agent: 'opencode' as AiVaultAgent,
    file: {
      path: buildOpenCodeSqliteCandidatePath(dbPath, row.id),
      mtimeMs,
      modifiedAt: new Date(mtimeMs).toISOString()
    },
    codexHome: null
  }
}

function dedupeAndSortSqliteCandidates(candidates: SessionFileCandidate[]): SessionFileCandidate[] {
  const candidatesBySessionId = new Map<string, SessionFileCandidate>()
  for (const candidate of candidates) {
    const parsed = splitOpenCodeSqliteCandidate(candidate.file.path)
    if (!parsed) {
      continue
    }
    const previous = candidatesBySessionId.get(parsed.sessionId)
    if (!previous || candidate.file.mtimeMs > previous.file.mtimeMs) {
      candidatesBySessionId.set(parsed.sessionId, candidate)
    }
  }
  return [...candidatesBySessionId.values()].sort((left, right) => {
    return right.file.mtimeMs - left.file.mtimeMs
  })
}

/**
 * List OpenCode sessions from one or more SQLite databases as synthetic
 * `SessionFileCandidate` entries. Each candidate's file path is a synthetic
 * `<dbPath>#<sessionId>` string that the parser dispatcher routes to
 * `parseOpenCodeSqliteSession`. Databases that lack the `session` table are
 * silently skipped; errors are recorded as scan issues.
 * @param args.dbPaths - Absolute paths to opencode.db files to scan.
 * @param args.limit - Maximum number of sessions to return per database.
 * @param args.issues - Collected scan issues to append errors to.
 * @returns Array of synthetic candidates sorted by `time_updated` DESC.
 */
export async function listOpenCodeSqliteSessions(args: {
  dbPaths: readonly string[]
  limit: number
  issues: AiVaultScanIssue[]
}): Promise<SessionFileCandidate[]> {
  const candidates: SessionFileCandidate[] = []
  for (const dbPath of args.dbPaths) {
    let db: SyncDatabase | null = null
    try {
      db = openReadonlyDatabase(dbPath)
      if (!canReadOpenCodeSessions(db)) {
        continue
      }
      const rows = db.prepare(buildSessionListQuery(db)).all(args.limit) as SessionRow[]
      for (const row of rows) {
        candidates.push(rowToCandidate(row, dbPath))
      }
    } catch (err) {
      args.issues.push({
        agent: 'opencode',
        path: dbPath,
        message: errorMessage(err)
      })
    } finally {
      db?.close()
    }
  }
  return dedupeAndSortSqliteCandidates(candidates)
}
