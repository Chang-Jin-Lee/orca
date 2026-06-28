// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  jiraListAssignableUsers,
  jiraListCreateAssignableUsers,
  jiraSearchIssues
} from './runtime-jira-client'
import {
  clearRuntimeCompatibilityCacheForTests,
  markRuntimeEnvironmentCompatible
} from './runtime-rpc-client'

const jiraSearchIssuesLocal = vi.fn()
const jiraListAssignableUsersLocal = vi.fn()
const jiraListCreateAssignableUsersLocal = vi.fn()
const runtimeCall = vi.fn()
const runtimeEnvironmentsCall = vi.fn()

beforeEach(() => {
  jiraSearchIssuesLocal.mockReset()
  jiraListAssignableUsersLocal.mockReset()
  jiraListCreateAssignableUsersLocal.mockReset()
  runtimeCall.mockReset()
  runtimeEnvironmentsCall.mockReset()
  vi.stubGlobal('window', {
    api: {
      jira: {
        searchIssues: jiraSearchIssuesLocal,
        listAssignableUsers: jiraListAssignableUsersLocal,
        listAssignableUsersForCreate: jiraListCreateAssignableUsersLocal
      },
      runtime: {
        call: runtimeCall
      },
      runtimeEnvironments: {
        call: runtimeEnvironmentsCall
      }
    }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  clearRuntimeCompatibilityCacheForTests()
})

describe('runtime Jira client search bounds', () => {
  it('rejects oversized local Jira search before IPC', async () => {
    await expect(jiraSearchIssues(null, 'secret-token-value'.repeat(1024), 30)).resolves.toEqual([])

    expect(jiraSearchIssuesLocal).not.toHaveBeenCalled()
    expect(runtimeCall).not.toHaveBeenCalled()
  })

  it('rejects oversized runtime Jira assignee search before RPC', async () => {
    await expect(
      jiraListAssignableUsers(
        { activeRuntimeEnvironmentId: 'env-1' },
        'ORCA-1',
        'x'.repeat(9 * 1024),
        'site-1'
      )
    ).resolves.toEqual([])

    expect(jiraListAssignableUsersLocal).not.toHaveBeenCalled()
    expect(runtimeEnvironmentsCall).not.toHaveBeenCalled()
  })
})

describe('jiraListCreateAssignableUsers', () => {
  it('rejects oversized queries before any IPC/RPC', async () => {
    await expect(
      jiraListCreateAssignableUsers(null, 'ORCA', 'x'.repeat(9 * 1024), 'site-1')
    ).resolves.toEqual([])

    expect(jiraListCreateAssignableUsersLocal).not.toHaveBeenCalled()
    expect(runtimeEnvironmentsCall).not.toHaveBeenCalled()
  })

  it('calls the local IPC target with the project key when no runtime env is set', async () => {
    const users = [{ accountId: '5b10ac', displayName: 'Alex' }]
    jiraListCreateAssignableUsersLocal.mockResolvedValue(users)

    await expect(jiraListCreateAssignableUsers(null, 'ORCA', 'al', 'site-1')).resolves.toEqual(
      users
    )

    expect(jiraListCreateAssignableUsersLocal).toHaveBeenCalledWith({
      projectKeyOrId: 'ORCA',
      query: 'al',
      siteId: 'site-1'
    })
    expect(runtimeEnvironmentsCall).not.toHaveBeenCalled()
  })

  it('routes through the runtime environment RPC when one is active', async () => {
    const users = [{ accountId: '5b10ac', displayName: 'Alex' }]
    runtimeEnvironmentsCall.mockResolvedValue({ ok: true, result: users })
    // Pre-mark compatible so the call skips the status.get handshake and we can
    // assert the single search RPC routed to the environment target.
    markRuntimeEnvironmentCompatible('env-1')

    await expect(
      jiraListCreateAssignableUsers({ activeRuntimeEnvironmentId: 'env-1' }, 'ORCA', 'al', 'site-1')
    ).resolves.toEqual(users)

    expect(jiraListCreateAssignableUsersLocal).not.toHaveBeenCalled()
    expect(runtimeEnvironmentsCall).toHaveBeenCalledWith({
      selector: 'env-1',
      method: 'jira.listAssignableUsersForCreate',
      params: { projectKeyOrId: 'ORCA', query: 'al', siteId: 'site-1' },
      timeoutMs: 30_000
    })
  })
})
