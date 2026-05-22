import { describe, expect, it, vi } from 'vitest'
import { RpcDispatcher } from '../dispatcher'
import type { RpcRequest } from '../core'
import type { OrcaRuntimeService } from '../../orca-runtime'
import { REPO_METHODS } from './repo'

function makeRequest(method: string, params?: unknown): RpcRequest {
  return { id: 'req-1', authToken: 'tok', method, params }
}

describe('repo RPC methods', () => {
  it('lists repos with git usernames by default', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      listRepos: vi.fn().mockReturnValue([{ id: 'repo-1', gitUsername: 'demo' }])
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: REPO_METHODS })

    const response = await dispatcher.dispatch(makeRequest('repo.list'))

    expect(runtime.listRepos).toHaveBeenCalledWith({ includeGitUsername: true })
    expect(response).toMatchObject({
      ok: true,
      result: { repos: [{ id: 'repo-1', gitUsername: 'demo' }] }
    })
  })

  it('lets internal clients list repos without git usernames', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      listRepos: vi.fn().mockReturnValue([{ id: 'repo-1' }])
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: REPO_METHODS })

    const response = await dispatcher.dispatch(
      makeRequest('repo.list', { includeGitUsername: false })
    )

    expect(runtime.listRepos).toHaveBeenCalledWith({ includeGitUsername: false })
    expect(response).toMatchObject({
      ok: true,
      result: { repos: [{ id: 'repo-1' }] }
    })
  })

  it('routes git username lookup to the runtime server', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      getRepoGitUsername: vi.fn().mockResolvedValue('remote-user')
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: REPO_METHODS })

    const response = await dispatcher.dispatch(makeRequest('repo.gitUsername', { repo: 'repo-1' }))

    expect(runtime.getRepoGitUsername).toHaveBeenCalledWith('repo-1')
    expect(response).toMatchObject({
      ok: true,
      result: { username: 'remote-user' }
    })
  })

  it('routes branch prefix value lookup to the runtime server', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      getRepoBranchPrefixValue: vi.fn().mockResolvedValue('Remote-User')
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: REPO_METHODS })

    const response = await dispatcher.dispatch(
      makeRequest('repo.branchPrefixValue', {
        repo: 'repo-1',
        branchPrefix: 'git-author'
      })
    )

    expect(runtime.getRepoBranchPrefixValue).toHaveBeenCalledWith('repo-1', 'git-author')
    expect(response).toMatchObject({
      ok: true,
      result: { value: 'Remote-User' }
    })
  })

  it('creates a repo on the runtime server', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      createRepo: vi.fn().mockResolvedValue({
        repo: { id: 'repo-1', path: '/srv/projects/new-app', kind: 'git' }
      })
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: REPO_METHODS })

    const response = await dispatcher.dispatch(
      makeRequest('repo.create', {
        parentPath: '/srv/projects',
        name: 'new-app',
        kind: 'git'
      })
    )

    expect(runtime.createRepo).toHaveBeenCalledWith('/srv/projects', 'new-app', 'git')
    expect(response).toMatchObject({
      ok: true,
      result: { repo: { id: 'repo-1', path: '/srv/projects/new-app' } }
    })
  })

  it('clones a repo on the runtime server', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      cloneRepo: vi.fn().mockResolvedValue({
        id: 'repo-1',
        path: '/srv/projects/orca',
        kind: 'git'
      })
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: REPO_METHODS })

    const response = await dispatcher.dispatch(
      makeRequest('repo.clone', {
        url: 'https://github.com/example/orca.git',
        destination: '/srv/projects'
      })
    )

    expect(runtime.cloneRepo).toHaveBeenCalledWith(
      'https://github.com/example/orca.git',
      '/srv/projects'
    )
    expect(response).toMatchObject({
      ok: true,
      result: { repo: { id: 'repo-1', path: '/srv/projects/orca' } }
    })
  })

  it('lists sparse checkout presets for a repo', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      listSparsePresets: vi.fn().mockResolvedValue([
        {
          id: 'preset-1',
          repoId: 'repo-1',
          name: 'Frontend',
          directories: ['src/renderer'],
          createdAt: 1,
          updatedAt: 2
        }
      ])
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: REPO_METHODS })

    const response = await dispatcher.dispatch(
      makeRequest('repo.sparsePresets', { repo: 'repo-1' })
    )

    expect(runtime.listSparsePresets).toHaveBeenCalledWith('repo-1')
    expect(response).toMatchObject({
      ok: true,
      result: { presets: [{ id: 'preset-1', directories: ['src/renderer'] }] }
    })
  })

  it('saves sparse checkout presets for a repo', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      saveSparsePreset: vi.fn().mockResolvedValue({
        id: 'preset-1',
        repoId: 'repo-1',
        name: 'Frontend',
        directories: ['src/renderer'],
        createdAt: 1,
        updatedAt: 2
      })
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: REPO_METHODS })

    const response = await dispatcher.dispatch(
      makeRequest('repo.saveSparsePreset', {
        repo: 'repo-1',
        name: 'Frontend',
        directories: ['src/renderer']
      })
    )

    expect(runtime.saveSparsePreset).toHaveBeenCalledWith('repo-1', {
      name: 'Frontend',
      directories: ['src/renderer']
    })
    expect(response).toMatchObject({
      ok: true,
      result: { preset: { id: 'preset-1', directories: ['src/renderer'] } }
    })
  })

  it('routes repository hook operations to the runtime server', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      getRepoHooks: vi.fn().mockResolvedValue({
        hasHooksFile: true,
        hooks: { scripts: { setup: 'pnpm install' } },
        setupRunPolicy: 'run-by-default',
        source: 'orca.yaml',
        setupTrust: {
          contentHash: 'hash-1',
          scriptContent: 'pnpm install'
        }
      }),
      checkRepoHooks: vi.fn().mockResolvedValue({
        hasHooks: true,
        hooks: { scripts: { setup: 'pnpm install' } },
        mayNeedUpdate: false
      }),
      inspectRepoSetupScriptImports: vi.fn().mockResolvedValue([
        {
          provider: 'conductor',
          label: 'Conductor',
          files: ['conductor.json'],
          setup: 'pnpm install'
        }
      ]),
      readRepoIssueCommand: vi.fn().mockResolvedValue({
        localContent: null,
        sharedContent: 'Fix {{artifact_url}}',
        effectiveContent: 'Fix {{artifact_url}}',
        localFilePath: '/srv/repo/.orca/issue-command',
        source: 'shared'
      }),
      writeRepoIssueCommand: vi.fn().mockResolvedValue({ ok: true })
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: REPO_METHODS })

    const hooksResponse = await dispatcher.dispatch(makeRequest('repo.hooks', { repo: 'repo-1' }))
    await dispatcher.dispatch(makeRequest('repo.hooksCheck', { repo: 'repo-1' }))
    await dispatcher.dispatch(makeRequest('repo.setupScriptImports', { repo: 'repo-1' }))
    await dispatcher.dispatch(makeRequest('repo.issueCommandRead', { repo: 'repo-1' }))
    await dispatcher.dispatch(
      makeRequest('repo.issueCommandWrite', {
        repo: 'repo-1',
        content: 'Fix it'
      })
    )

    expect(runtime.getRepoHooks).toHaveBeenCalledWith('repo-1')
    expect(hooksResponse).toMatchObject({
      ok: true,
      result: { setupTrust: { contentHash: 'hash-1', scriptContent: 'pnpm install' } }
    })
    expect(runtime.checkRepoHooks).toHaveBeenCalledWith('repo-1')
    expect(runtime.inspectRepoSetupScriptImports).toHaveBeenCalledWith('repo-1')
    expect(runtime.readRepoIssueCommand).toHaveBeenCalledWith('repo-1')
    expect(runtime.writeRepoIssueCommand).toHaveBeenCalledWith('repo-1', 'Fix it')
  })

  it('persists GitHub issue source preference updates', async () => {
    const runtime = {
      getRuntimeId: () => 'test-runtime',
      updateRepo: vi.fn().mockResolvedValue({
        id: 'repo-1',
        path: '/srv/repo',
        issueSourcePreference: 'origin'
      })
    } as unknown as OrcaRuntimeService
    const dispatcher = new RpcDispatcher({ runtime, methods: REPO_METHODS })

    const response = await dispatcher.dispatch(
      makeRequest('repo.update', {
        repo: 'repo-1',
        updates: { issueSourcePreference: 'origin' }
      })
    )

    expect(runtime.updateRepo).toHaveBeenCalledWith('repo-1', {
      issueSourcePreference: 'origin'
    })
    expect(response).toMatchObject({
      ok: true,
      result: { repo: { id: 'repo-1', issueSourcePreference: 'origin' } }
    })
  })
})
