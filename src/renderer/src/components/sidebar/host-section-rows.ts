import {
  ALL_EXECUTION_HOSTS_SCOPE,
  LOCAL_EXECUTION_HOST_ID,
  getRepoExecutionHostId,
  type ExecutionHostId,
  type ExecutionHostKind,
  type ExecutionHostScope
} from '../../../../shared/execution-host'
import type { ExecutionHostHealth } from '../../../../shared/execution-host-registry'
import type { RuntimeCompatVerdict } from '../../../../shared/protocol-compat'
import type { SshConnectionStatus } from '../../../../shared/ssh-types'
import type { Repo } from '../../../../shared/types'
import type { Row } from './worktree-list-groups'

export type HostHeaderRow = {
  type: 'host-header'
  key: string
  hostId: ExecutionHostId
  kind: ExecutionHostKind
  label: string
  detail: string
  health: ExecutionHostHealth
  // Why: blocked-host guidance in the header menu needs the verdict reason so
  // it can deep-link an "Update server/client required" row per skew direction.
  compatibility?: RuntimeCompatVerdict
  connectionStatus?: SshConnectionStatus
  count: number
}

export type HostSectionRow = Row | HostHeaderRow

export type HostSectionOption = {
  id: ExecutionHostId
  kind: ExecutionHostKind
  label: string
  detail: string
  health: ExecutionHostHealth
  compatibility?: RuntimeCompatVerdict
  connectionStatus?: SshConnectionStatus
}

function getRepoHostId(
  repo: Pick<Repo, 'connectionId' | 'executionHostId'> | undefined,
  defaultHostId: ExecutionHostId
): ExecutionHostId {
  // Why: explicit executionHostId must win over the focused/default host, or
  // runtime-owned repos group under whichever host happens to be focused.
  if (repo?.connectionId || repo?.executionHostId) {
    return getRepoExecutionHostId(repo)
  }
  return defaultHostId
}

function getRowHostId(row: Row, defaultHostId: ExecutionHostId): ExecutionHostId | null {
  switch (row.type) {
    case 'item':
      return getRepoHostId(row.repo, defaultHostId)
    case 'pending-creation':
    case 'imported-worktrees-card':
      return getRepoHostId(row.repo, defaultHostId)
    case 'header':
      return row.repo ? getRepoHostId(row.repo, defaultHostId) : null
  }
}

function getFallbackHost(hostId: ExecutionHostId): HostSectionOption {
  const isLocal = hostId === LOCAL_EXECUTION_HOST_ID
  return {
    id: hostId,
    kind: isLocal ? 'local' : hostId.startsWith('ssh:') ? 'ssh' : 'runtime',
    label: isLocal ? 'Local Mac' : hostId,
    detail: isLocal ? 'This computer' : 'Host',
    health: isLocal ? 'local' : 'available'
  }
}

function countWorktreeRows(rows: readonly Row[]): number {
  let count = 0
  for (const row of rows) {
    if (row.type === 'item') {
      count += 1
    }
  }
  return count
}

export function addHostSectionRows(args: {
  rows: readonly Row[]
  hostOptions: readonly HostSectionOption[]
  workspaceHostScope: ExecutionHostScope
  defaultHostId: ExecutionHostId
}): HostSectionRow[] {
  if (args.workspaceHostScope !== ALL_EXECUTION_HOSTS_SCOPE || args.hostOptions.length <= 1) {
    return [...args.rows]
  }

  const hostOptionsById = new Map(args.hostOptions.map((host) => [host.id, host]))
  const rowsByHostId = new Map<ExecutionHostId, Row[]>()
  const globalRows: Row[] = []
  let pendingRows: Row[] = []

  for (const row of args.rows) {
    const rowHostId = getRowHostId(row, args.defaultHostId)
    if (rowHostId) {
      const hostRows = rowsByHostId.get(rowHostId) ?? []
      if (pendingRows.length > 0) {
        hostRows.push(...pendingRows)
        pendingRows = []
      }
      hostRows.push(row)
      rowsByHostId.set(rowHostId, hostRows)
      continue
    }
    // Why: status/"All" headers describe the rows that follow. Buffer them
    // until the next host-owned row so host remains above the existing grouping.
    pendingRows.push(row)
  }

  if (pendingRows.length > 0) {
    globalRows.push(...pendingRows)
  }

  const hostOrder: ExecutionHostId[] = []
  for (const host of args.hostOptions) {
    if (rowsByHostId.has(host.id)) {
      hostOrder.push(host.id)
    }
  }
  for (const hostId of rowsByHostId.keys()) {
    if (!hostOptionsById.has(hostId)) {
      hostOrder.push(hostId)
    }
  }

  const result: HostSectionRow[] = [...globalRows]
  for (const hostId of hostOrder) {
    const hostRows = rowsByHostId.get(hostId)
    if (!hostRows || hostRows.length === 0) {
      continue
    }
    const host = hostOptionsById.get(hostId) ?? getFallbackHost(hostId)
    result.push({
      type: 'host-header',
      key: `host:${host.id}`,
      hostId: host.id,
      kind: host.kind,
      label: host.label,
      detail: host.detail,
      health: host.health,
      compatibility: host.compatibility,
      connectionStatus: host.connectionStatus,
      count: countWorktreeRows(hostRows)
    })
    result.push(...hostRows)
  }

  return result
}
