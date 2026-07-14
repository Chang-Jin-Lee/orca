import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync
} from 'node:fs'
import { dirname, join } from 'node:path'
import type { PersistedState } from '../shared/types'
import {
  terminalTeardownIntentJournalRecordSchema,
  terminalTeardownIntentSnapshotSchema
} from './terminal-teardown-intent-records'
import type {
  TerminalTeardownIntentJournalRecord,
  TerminalTeardownIntentMutation,
  TerminalTeardownIntentSnapshot
} from './terminal-teardown-intent-records'
import {
  indexSshRemotePtyLeases,
  sshRemotePtyLeaseIdentityKey
} from './ssh/ssh-remote-pty-lease-index'
import type { SshRemotePtyLease } from '../shared/ssh-types'

export type { TerminalTeardownIntentMutation } from './terminal-teardown-intent-records'

function getSnapshotFile(dataFile: string): string {
  return join(dirname(dataFile), 'orca-terminal-teardown-intents.json')
}

function pendingSshShutdowns(
  state: PersistedState
): TerminalTeardownIntentSnapshot['pendingSshPtyShutdowns'] {
  return (state.sshRemotePtyLeases ?? []).flatMap((lease) =>
    lease.shutdownRequestedAt === undefined
      ? []
      : [
          {
            targetId: lease.targetId,
            ptyId: lease.ptyId,
            ...(lease.relayInstanceId ? { relayInstanceId: lease.relayInstanceId } : {}),
            shutdownRequestedAt: lease.shutdownRequestedAt
          }
        ]
  )
}

function checkpointForState(
  state: PersistedState
): Omit<Extract<TerminalTeardownIntentJournalRecord, { kind: 'checkpoint' }>, 'version'> {
  return {
    kind: 'checkpoint',
    revision: state.terminalTeardownIntentRevision ?? 0,
    pendingLocalPtyShutdowns: state.pendingLocalPtyShutdowns ?? [],
    pendingRuntimeTerminalCloses: state.pendingRuntimeTerminalCloses ?? [],
    pendingSshPtyShutdowns: pendingSshShutdowns(state)
  }
}

function readRecords(dataFile: string): {
  records: (TerminalTeardownIntentSnapshot | TerminalTeardownIntentJournalRecord)[]
  journalReady: boolean
} {
  const snapshotFile = getSnapshotFile(dataFile)
  if (!existsSync(snapshotFile)) {
    return { records: [], journalReady: false }
  }
  try {
    const raw = readFileSync(snapshotFile, 'utf-8')
    try {
      const parsed = JSON.parse(raw) as unknown
      const legacy = terminalTeardownIntentSnapshotSchema.safeParse(parsed)
      if (legacy.success) {
        return { records: [legacy.data], journalReady: false }
      }
      const journal = terminalTeardownIntentJournalRecordSchema.safeParse(parsed)
      if (journal.success) {
        // Why: appendFileSync needs a record delimiter. A crash after the JSON
        // bytes but before the newline must recover through an atomic checkpoint.
        return { records: [journal.data], journalReady: raw.endsWith('\n') }
      }
    } catch {
      // Multi-record journals are newline-delimited rather than one JSON value.
    }
    const records: TerminalTeardownIntentJournalRecord[] = []
    let appendable = raw.endsWith('\n')
    for (const line of raw.split('\n')) {
      if (!line.trim()) {
        continue
      }
      let value: unknown
      try {
        value = JSON.parse(line)
      } catch {
        console.warn('[persistence] Ignoring truncated terminal teardown intent journal tail')
        appendable = false
        break
      }
      const parsed = terminalTeardownIntentJournalRecordSchema.safeParse(value)
      if (!parsed.success) {
        // Why: a crash can tear only the final append. Earlier complete records
        // remain durable, while replaying past corruption could invent state.
        console.warn('[persistence] Ignoring truncated terminal teardown intent journal tail')
        appendable = false
        break
      }
      records.push(parsed.data)
    }
    return { records, journalReady: appendable && records.length > 0 }
  } catch (error) {
    console.warn('[persistence] Ignoring invalid terminal teardown intent snapshot:', error)
    return { records: [], journalReady: false }
  }
}

function applySshShutdowns(
  state: PersistedState,
  pendingSshPtyShutdowns: TerminalTeardownIntentSnapshot['pendingSshPtyShutdowns'],
  leasesByIdentity: Map<string, SshRemotePtyLease>
): void {
  for (const lease of state.sshRemotePtyLeases ?? []) {
    delete lease.shutdownRequestedAt
  }
  for (const pending of pendingSshPtyShutdowns) {
    const lease = leasesByIdentity.get(
      sshRemotePtyLeaseIdentityKey(pending.targetId, pending.ptyId, pending.relayInstanceId)
    )
    if (lease) {
      lease.shutdownRequestedAt = pending.shutdownRequestedAt
      lease.updatedAt = Math.max(lease.updatedAt, pending.shutdownRequestedAt)
    }
  }
}

function applyJournalRecord(
  state: PersistedState,
  record: TerminalTeardownIntentJournalRecord,
  leasesByIdentity: Map<string, SshRemotePtyLease>
): void {
  switch (record.kind) {
    case 'checkpoint':
      state.pendingLocalPtyShutdowns = record.pendingLocalPtyShutdowns
      state.pendingRuntimeTerminalCloses = record.pendingRuntimeTerminalCloses
      applySshShutdowns(state, record.pendingSshPtyShutdowns, leasesByIdentity)
      return
    case 'local-upsert': {
      state.pendingLocalPtyShutdowns ??= []
      const index = state.pendingLocalPtyShutdowns.findIndex(
        (entry) => entry.ptyId === record.request.ptyId
      )
      if (index >= 0) {
        state.pendingLocalPtyShutdowns[index] = record.request
      } else {
        state.pendingLocalPtyShutdowns.push(record.request)
      }
      return
    }
    case 'local-remove':
      state.pendingLocalPtyShutdowns = (state.pendingLocalPtyShutdowns ?? []).filter(
        (entry) => entry.ptyId !== record.ptyId
      )
      return
    case 'runtime-upsert': {
      state.pendingRuntimeTerminalCloses ??= []
      const index = state.pendingRuntimeTerminalCloses.findIndex(
        (entry) =>
          entry.environmentId === record.request.environmentId &&
          entry.handle === record.request.handle
      )
      if (index >= 0) {
        state.pendingRuntimeTerminalCloses[index] = record.request
      } else {
        state.pendingRuntimeTerminalCloses.push(record.request)
      }
      return
    }
    case 'runtime-remove':
      state.pendingRuntimeTerminalCloses = (state.pendingRuntimeTerminalCloses ?? []).filter(
        (entry) => entry.environmentId !== record.environmentId || entry.handle !== record.handle
      )
      return
    case 'runtime-remove-environment':
      state.pendingRuntimeTerminalCloses = (state.pendingRuntimeTerminalCloses ?? []).filter(
        (entry) => entry.environmentId !== record.environmentId
      )
      return
    case 'ssh-migrate-generation': {
      const legacyKey = sshRemotePtyLeaseIdentityKey(record.targetId, record.ptyId)
      const lease = leasesByIdentity.get(legacyKey)
      if (!lease) {
        return
      }
      leasesByIdentity.delete(legacyKey)
      lease.relayInstanceId = record.relayInstanceId
      leasesByIdentity.set(
        sshRemotePtyLeaseIdentityKey(record.targetId, record.ptyId, record.relayInstanceId),
        lease
      )
      lease.state = 'attached'
      lease.updatedAt = Math.max(lease.updatedAt, record.attachedAt)
      lease.lastAttachedAt = Math.max(lease.lastAttachedAt ?? 0, record.attachedAt)
      return
    }
    case 'ssh-set': {
      const lease = leasesByIdentity.get(
        sshRemotePtyLeaseIdentityKey(record.targetId, record.ptyId, record.relayInstanceId)
      )
      if (!lease) {
        return
      }
      if (record.shutdownRequestedAt === undefined) {
        delete lease.shutdownRequestedAt
      } else {
        lease.shutdownRequestedAt = record.shutdownRequestedAt
        lease.updatedAt = Math.max(lease.updatedAt, record.shutdownRequestedAt)
      }
      return
    }
    case 'ssh-remove-target':
      for (const lease of state.sshRemotePtyLeases ?? []) {
        if (lease.targetId === record.targetId) {
          delete lease.shutdownRequestedAt
        }
      }
  }
}

export function applyTerminalTeardownIntentSnapshot(
  state: PersistedState,
  dataFile: string
): boolean {
  const { records, journalReady } = readRecords(dataFile)
  const leasesByIdentity = indexSshRemotePtyLeases(state.sshRemotePtyLeases ?? [])
  for (const record of records) {
    // Why: a failed journal append falls back to a synchronous full-store
    // write. Older valid records must not override that newer durable state.
    const durableRevision = state.terminalTeardownIntentRevision ?? 0
    if (
      record.revision < durableRevision ||
      (record.version === 2 && record.revision === durableRevision)
    ) {
      continue
    }
    if (record.version === 1) {
      state.pendingLocalPtyShutdowns = record.pendingLocalPtyShutdowns
      state.pendingRuntimeTerminalCloses = record.pendingRuntimeTerminalCloses
      applySshShutdowns(state, record.pendingSshPtyShutdowns, leasesByIdentity)
    } else {
      applyJournalRecord(state, record, leasesByIdentity)
    }
    state.terminalTeardownIntentRevision = record.revision
  }
  return journalReady
}

function writeRecordsAtomically(
  records: TerminalTeardownIntentJournalRecord[],
  dataFile: string
): void {
  const snapshotFile = getSnapshotFile(dataFile)
  const tmpFile = `${snapshotFile}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`
  mkdirSync(dirname(snapshotFile), { recursive: true })
  let renamed = false
  try {
    const serialized = records.map((record) => JSON.stringify(record)).join('\n')
    writeFileSync(tmpFile, `${serialized}\n`, 'utf-8')
    renameSync(tmpFile, snapshotFile)
    renamed = true
  } finally {
    if (!renamed) {
      try {
        unlinkSync(tmpFile)
      } catch {
        // The primary write error is more useful than best-effort tmp cleanup.
      }
    }
  }
}

export function writeTerminalTeardownIntentSnapshot(state: PersistedState, dataFile: string): void {
  writeRecordsAtomically([{ version: 2, ...checkpointForState(state) }], dataFile)
}

export function appendTerminalTeardownIntentMutation(
  state: PersistedState,
  dataFile: string,
  mutation: TerminalTeardownIntentMutation,
  journalReady: boolean
): void {
  if (!journalReady) {
    if (mutation.kind === 'ssh-migrate-generation') {
      const revision = state.terminalTeardownIntentRevision ?? 0
      // Why: the checkpoint schema contains teardown owners, not lease
      // generations. The first legacy migration needs its own atomic record.
      writeRecordsAtomically(
        [
          {
            version: 2,
            ...checkpointForState(state),
            revision: Math.max(0, revision - 1)
          },
          { version: 2, revision, ...mutation }
        ],
        dataFile
      )
      return
    }
    writeTerminalTeardownIntentSnapshot(state, dataFile)
    return
  }
  const revision = state.terminalTeardownIntentRevision ?? 0
  const record: TerminalTeardownIntentJournalRecord = { version: 2, revision, ...mutation }
  appendFileSync(getSnapshotFile(dataFile), `${JSON.stringify(record)}\n`, 'utf-8')
}
