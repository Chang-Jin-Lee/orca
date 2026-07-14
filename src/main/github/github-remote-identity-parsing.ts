import type { GitHubOwnerRepo } from '../../shared/types'

export type GitHubRemoteIdentity = GitHubOwnerRepo & { host: string }

function normalizeGitHubRemoteHost(host: string): string {
  const normalizedHost = host.toLowerCase()
  // Why: GitHub documents ssh.github.com:443 as SSH-over-HTTPS for github.com repos.
  return normalizedHost === 'ssh.github.com' ? 'github.com' : normalizedHost
}

// Why: for http(s) remotes the URL port is the GHES web/API endpoint (e.g. an
// Enterprise server on :8443), which `gh --hostname` and host-qualified
// `--repo host/owner/repo` must target, so it is kept via `url.host`. For
// ssh/git remotes the port is a transport port (e.g. ssh.github.com:443) that
// does not identify the host, so only the hostname is used — preserving
// ssh.github.com normalization and SSH-over-HTTPS. Mirrors GitLab's project-ref
// host resolution.
function hostFromRemoteUrl(url: URL): string {
  const protocol = url.protocol.toLowerCase()
  return protocol === 'http:' || protocol === 'https:' ? url.host : url.hostname
}

function parseGitHubRemotePath(path: string): Pick<GitHubRemoteIdentity, 'owner' | 'repo'> | null {
  const parts = path.replace(/^\/+/, '').replace(/\/+$/, '').split('/')
  if (parts.length !== 2) {
    return null
  }
  const [owner, repoWithSuffix] = parts
  const repo = repoWithSuffix.replace(/\.git$/i, '')
  if (!owner || !repo) {
    return null
  }
  return { owner, repo }
}

export function parseGitHubRemoteIdentity(remoteUrl: string): GitHubRemoteIdentity | null {
  const trimmed = remoteUrl.trim()
  const sshMatch = trimmed.match(/^git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/i)
  if (sshMatch) {
    return { host: normalizeGitHubRemoteHost(sshMatch[1]), owner: sshMatch[2], repo: sshMatch[3] }
  }

  try {
    const url = new URL(trimmed)
    if (!['git:', 'git+ssh:', 'http:', 'https:', 'ssh:'].includes(url.protocol.toLowerCase())) {
      return null
    }
    const path = parseGitHubRemotePath(url.pathname)
    return path ? { host: normalizeGitHubRemoteHost(hostFromRemoteUrl(url)), ...path } : null
  } catch {
    return null
  }
}

export function parseGitHubOwnerRepo(remoteUrl: string): GitHubOwnerRepo | null {
  const identity = parseGitHubRemoteIdentity(remoteUrl)
  if (!identity || identity.host.toLowerCase() !== 'github.com') {
    return null
  }
  return { owner: identity.owner, repo: identity.repo }
}
