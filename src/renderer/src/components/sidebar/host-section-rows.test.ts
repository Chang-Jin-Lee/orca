import { describe, expect, it } from 'vitest'
import type { Repo, Worktree } from '../../../../shared/types'
import type { Row } from './worktree-list-groups'
import { addHostSectionRows, type HostSectionRow } from './host-section-rows'

function repo(id: string, connectionId?: string | null): Repo {
  return {
    id,
    path: `/${id}`,
    displayName: id,
    badgeColor: '#000000',
    addedAt: 0,
    connectionId
  }
}

function worktree(id: string, repoId: string): Worktree {
  return {
    id,
    repoId,
    path: `/${repoId}/${id}`,
    branch: `refs/heads/${id}`,
    head: 'abc123',
    isBare: false,
    isMainWorktree: false,
    linkedIssue: null,
    linkedPR: null,
    linkedLinearIssue: null,
    isArchived: false,
    comment: '',
    isUnread: false,
    isPinned: false,
    displayName: id,
    sortOrder: 0,
    lastActivityAt: 0
  }
}

function header(key: string, label = key): Extract<Row, { type: 'header' }> {
  return {
    type: 'header',
    key,
    label,
    count: 1,
    tone: 'text-foreground'
  }
}

function repoHeader(project: Repo): Extract<Row, { type: 'header' }> {
  return {
    ...header(`repo:${project.id}`, project.displayName),
    repo: project
  }
}

function item(id: string, project: Repo): Extract<Row, { type: 'item' }> {
  return {
    type: 'item',
    worktree: worktree(id, project.id),
    repo: project,
    depth: 0,
    groupDepth: 0,
    lineageTrail: [],
    isLastLineageChild: true,
    lineageChildCount: 0
  }
}

function rowKey(row: HostSectionRow): string {
  return row.type === 'item' ? row.worktree.id : row.key
}

describe('addHostSectionRows', () => {
  it('does not add host headers for a specific host scope', () => {
    const local = repo('local')
    const rows = [repoHeader(local), item('local-wt', local)]

    const sectioned = addHostSectionRows({
      rows,
      hostOptions: [
        {
          id: 'local',
          kind: 'local',
          label: 'Local Mac',
          detail: 'This computer',
          health: 'local'
        },
        { id: 'ssh:ssh-1', kind: 'ssh', label: 'Builder', detail: 'SSH', health: 'available' }
      ],
      workspaceHostScope: 'local',
      defaultHostId: 'local'
    })

    expect(sectioned).toHaveLength(2)
    expect(sectioned).toEqual(rows)
  })

  it('does not add host headers when only the local host exists', () => {
    const local = repo('local')
    const rows = [repoHeader(local), item('local-wt', local)]

    expect(
      addHostSectionRows({
        rows,
        hostOptions: [
          {
            id: 'local',
            kind: 'local',
            label: 'Local Mac',
            detail: 'This computer',
            health: 'local'
          }
        ],
        workspaceHostScope: 'all',
        defaultHostId: 'local'
      })
    ).toEqual(rows)
  })

  it('groups rows under host headers in all-host scope', () => {
    const local = repo('local')
    const ssh = repo('ssh', 'ssh-1')
    const rows = [repoHeader(local), item('local-wt', local), repoHeader(ssh), item('ssh-wt', ssh)]

    const sectioned = addHostSectionRows({
      rows,
      hostOptions: [
        {
          id: 'local',
          kind: 'local',
          label: 'Local Mac',
          detail: 'This computer',
          health: 'local'
        },
        { id: 'ssh:ssh-1', kind: 'ssh', label: 'Builder', detail: 'SSH', health: 'available' }
      ],
      workspaceHostScope: 'all',
      defaultHostId: 'local'
    })

    expect(sectioned.map(rowKey)).toEqual([
      'host:local',
      'repo:local',
      'local-wt',
      'host:ssh:ssh-1',
      'repo:ssh',
      'ssh-wt'
    ])
    expect(sectioned.filter((row) => row.type === 'host-header')).toMatchObject([
      { label: 'Local Mac', count: 1 },
      { label: 'Builder', count: 1 }
    ])
  })

  it('keeps non-repo group headers with the following host-owned rows', () => {
    const local = repo('local')
    const ssh = repo('ssh', 'ssh-1')
    const rows = [header('all'), item('local-wt', local), header('done'), item('ssh-wt', ssh)]

    const sectioned = addHostSectionRows({
      rows,
      hostOptions: [
        {
          id: 'local',
          kind: 'local',
          label: 'Local Mac',
          detail: 'This computer',
          health: 'local'
        },
        { id: 'ssh:ssh-1', kind: 'ssh', label: 'Builder', detail: 'SSH', health: 'available' }
      ],
      workspaceHostScope: 'all',
      defaultHostId: 'local'
    })

    expect(sectioned.map(rowKey)).toEqual([
      'host:local',
      'all',
      'local-wt',
      'host:ssh:ssh-1',
      'done',
      'ssh-wt'
    ])
  })

  it('groups explicitly runtime-owned repos under their owner host, not the focused host', () => {
    const localOwned: Repo = { ...repo('local-project'), executionHostId: 'local' }
    const runtimeOwned: Repo = { ...repo('remote-project'), executionHostId: 'runtime:env-2' }
    const rows = [
      repoHeader(localOwned),
      item('local-wt', localOwned),
      repoHeader(runtimeOwned),
      item('remote-wt', runtimeOwned)
    ]

    const sectioned = addHostSectionRows({
      rows,
      hostOptions: [
        {
          id: 'local',
          kind: 'local',
          label: 'Local Mac',
          detail: 'This computer',
          health: 'local'
        },
        {
          id: 'runtime:env-1',
          kind: 'runtime',
          label: 'env-1',
          detail: 'Orca server',
          health: 'available'
        },
        {
          id: 'runtime:env-2',
          kind: 'runtime',
          label: 'env-2',
          detail: 'Orca server',
          health: 'available'
        }
      ],
      workspaceHostScope: 'all',
      defaultHostId: 'runtime:env-1'
    })

    expect(sectioned.map(rowKey)).toEqual([
      'host:local',
      'repo:local-project',
      'local-wt',
      'host:runtime:env-2',
      'repo:remote-project',
      'remote-wt'
    ])
  })

  it('carries the SSH connection status through to the host header row', () => {
    const ssh = repo('ssh', 'ssh-1')
    const rows = [repoHeader(ssh), item('ssh-wt', ssh)]

    const sectioned = addHostSectionRows({
      rows,
      hostOptions: [
        {
          id: 'local',
          kind: 'local',
          label: 'Local Mac',
          detail: 'This computer',
          health: 'local'
        },
        {
          id: 'ssh:ssh-1',
          kind: 'ssh',
          label: 'Builder',
          detail: 'SSH',
          health: 'error',
          connectionStatus: 'auth-failed'
        }
      ],
      workspaceHostScope: 'all',
      defaultHostId: 'local'
    })

    expect(sectioned[0]).toMatchObject({
      type: 'host-header',
      hostId: 'ssh:ssh-1',
      health: 'error',
      connectionStatus: 'auth-failed'
    })
  })

  it('uses the focused runtime as the owner for non-SSH repos', () => {
    const project = repo('runtime-project')
    const rows = [repoHeader(project), item('runtime-wt', project)]

    const sectioned = addHostSectionRows({
      rows,
      hostOptions: [
        {
          id: 'local',
          kind: 'local',
          label: 'Local Mac',
          detail: 'This computer',
          health: 'local'
        },
        {
          id: 'runtime:env-1',
          kind: 'runtime',
          label: 'env-1',
          detail: 'Orca server',
          health: 'available'
        }
      ],
      workspaceHostScope: 'all',
      defaultHostId: 'runtime:env-1'
    })

    expect(sectioned[0]).toMatchObject({
      type: 'host-header',
      key: 'host:runtime:env-1',
      label: 'env-1'
    })
  })

  it('passes host kind and blocked compatibility through to the header row', () => {
    const project = repo('runtime-project')
    const rows = [repoHeader(project), item('runtime-wt', project)]

    const sectioned = addHostSectionRows({
      rows,
      hostOptions: [
        {
          id: 'local',
          kind: 'local',
          label: 'Local Mac',
          detail: 'This computer',
          health: 'local'
        },
        {
          id: 'runtime:env-1',
          kind: 'runtime',
          label: 'env-1',
          detail: 'Orca server',
          health: 'blocked',
          compatibility: {
            kind: 'blocked',
            reason: 'server-too-old',
            clientProtocolVersion: 5,
            serverProtocolVersion: 1,
            requiredServerProtocolVersion: 4
          }
        }
      ],
      workspaceHostScope: 'all',
      defaultHostId: 'runtime:env-1'
    })

    expect(sectioned[0]).toMatchObject({
      type: 'host-header',
      kind: 'runtime',
      health: 'blocked',
      compatibility: { kind: 'blocked', reason: 'server-too-old' }
    })
  })
})
