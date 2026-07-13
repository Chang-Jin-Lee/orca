import { beforeEach, describe, expect, it, vi } from 'vitest'

const { ghExecFileAsyncMock, gitExecFileAsyncMock } = vi.hoisted(() => ({
  ghExecFileAsyncMock: vi.fn(),
  gitExecFileAsyncMock: vi.fn()
}))

// Mock only the exec boundary so the real remote-identity parsing and
// `gh auth status` parsing run against controlled command output.
vi.mock('../git/runner', () => ({
  ghExecFileAsync: ghExecFileAsyncMock,
  gitExecFileAsync: gitExecFileAsyncMock
}))

import {
  _resetAuthenticatedGitHubHostsCache,
  getAuthenticatedGitHubHosts,
  getEnterpriseGitHubRepoSlug
} from './github-enterprise-repository'

function mockOriginRemote(url: string): void {
  gitExecFileAsyncMock.mockImplementation(async (args: string[]) => {
    if (args[0] === 'remote' && args[1] === 'get-url') {
      return { stdout: `${url}\n`, stderr: '' }
    }
    return { stdout: '', stderr: '' }
  })
}

function mockGhAuthStatus(hosts: string[]): void {
  const text = hosts
    .map(
      (host) =>
        `${host}\n  ✓ Logged in to ${host} account kelora (keyring)\n  - Active account: true\n  - Token scopes: 'repo', 'read:org'`
    )
    .join('\n')
  ghExecFileAsyncMock.mockResolvedValue({ stdout: text, stderr: '' })
}

describe('getEnterpriseGitHubRepoSlug', () => {
  beforeEach(() => {
    ghExecFileAsyncMock.mockReset()
    gitExecFileAsyncMock.mockReset()
    _resetAuthenticatedGitHubHostsCache()
  })

  it('resolves a GHES remote whose host the user is gh-authenticated to (#8312)', async () => {
    mockOriginRemote('https://github.acme-corp.com/team/orca.git')
    mockGhAuthStatus(['github.acme-corp.com'])

    await expect(getEnterpriseGitHubRepoSlug('/repo')).resolves.toEqual({
      owner: 'team',
      repo: 'orca',
      host: 'github.acme-corp.com'
    })
  })

  it('resolves a GHES SCP-style SSH remote', async () => {
    mockOriginRemote('git@github.acme-corp.com:team/orca.git')
    mockGhAuthStatus(['github.acme-corp.com'])

    await expect(getEnterpriseGitHubRepoSlug('/repo')).resolves.toEqual({
      owner: 'team',
      repo: 'orca',
      host: 'github.acme-corp.com'
    })
  })

  it('leaves github.com to getOwnerRepo without probing gh auth', async () => {
    mockOriginRemote('https://github.com/team/orca.git')

    await expect(getEnterpriseGitHubRepoSlug('/repo')).resolves.toBeNull()
    expect(ghExecFileAsyncMock).not.toHaveBeenCalled()
  })

  it('declines a custom host the user is not gh-authenticated to (leaves it for Gitea)', async () => {
    mockOriginRemote('https://gitea.example.com/team/orca.git')
    mockGhAuthStatus(['github.com'])

    await expect(getEnterpriseGitHubRepoSlug('/repo')).resolves.toBeNull()
  })

  it('returns null for an unparseable remote', async () => {
    mockOriginRemote('not-a-remote-url')
    mockGhAuthStatus(['github.acme-corp.com'])

    await expect(getEnterpriseGitHubRepoSlug('/repo')).resolves.toBeNull()
  })

  it('returns null when the origin remote lookup fails', async () => {
    gitExecFileAsyncMock.mockRejectedValue(new Error('no such remote'))

    await expect(getEnterpriseGitHubRepoSlug('/repo')).resolves.toBeNull()
  })
})

describe('getAuthenticatedGitHubHosts', () => {
  beforeEach(() => {
    ghExecFileAsyncMock.mockReset()
    gitExecFileAsyncMock.mockReset()
    _resetAuthenticatedGitHubHostsCache()
  })

  it('parses and lowercases the logged-in hosts', async () => {
    mockGhAuthStatus(['github.com', 'GitHub.Acme-Corp.com'])

    const hosts = await getAuthenticatedGitHubHosts()
    expect(hosts.has('github.com')).toBe(true)
    expect(hosts.has('github.acme-corp.com')).toBe(true)
  })

  it('caches a non-empty result to avoid re-spawning gh per detection poll', async () => {
    mockGhAuthStatus(['github.acme-corp.com'])

    await getAuthenticatedGitHubHosts()
    await getAuthenticatedGitHubHosts()
    expect(ghExecFileAsyncMock).toHaveBeenCalledTimes(1)
  })

  it('recovers hosts from gh output even when gh exits non-zero', async () => {
    ghExecFileAsyncMock.mockRejectedValue(
      Object.assign(new Error('exit 1'), {
        stdout:
          'github.acme-corp.com\n  ✓ Logged in to github.acme-corp.com account kelora (keyring)',
        stderr: ''
      })
    )

    const hosts = await getAuthenticatedGitHubHosts()
    expect(hosts.has('github.acme-corp.com')).toBe(true)
  })

  it('does not cache an empty result so a later gh login is discovered', async () => {
    ghExecFileAsyncMock.mockRejectedValueOnce(
      Object.assign(new Error('not installed'), { stdout: '', stderr: '' })
    )
    expect((await getAuthenticatedGitHubHosts()).size).toBe(0)

    mockGhAuthStatus(['github.acme-corp.com'])
    expect((await getAuthenticatedGitHubHosts()).has('github.acme-corp.com')).toBe(true)
  })
})
