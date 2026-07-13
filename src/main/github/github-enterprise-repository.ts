import { ghExecFileAsync } from '../git/runner'
import type { GitHubOwnerRepo } from '../../shared/types'
import {
  getHostedReviewLocalGitOptions,
  type HostedReviewExecutionOptions
} from '../source-control/hosted-review-git-options'
import { parseAuthStatus } from './auth-diagnose'
import {
  getRemoteUrlForRepo,
  githubRepoContext,
  parseGitHubRemoteIdentity
} from './github-repository-identity'

export type GitHubEnterpriseRepoSlug = GitHubOwnerRepo & { host: string }

// Why: `gh` only ever manages github.com / GitHub Enterprise credentials, so a
// host that `gh auth status` reports as logged-in is definitively a GitHub host.
// This is the same signal `glab auth status` provides for GitLab self-hosted
// detection, mirrored here so GHES is not left to fall through to Gitea (#8312).
const AUTHENTICATED_HOSTS_TTL_MS = 60_000

type AuthenticatedHostsCacheEntry = {
  hosts: ReadonlySet<string>
  expiresAt: number
}

const authenticatedHostsCache = new Map<string, AuthenticatedHostsCacheEntry>()

function connectionCacheKey(connectionId?: string | null): string {
  return connectionId ?? 'local'
}

/** @internal - exposed for tests only */
export function _resetAuthenticatedGitHubHostsCache(): void {
  authenticatedHostsCache.clear()
}

/**
 * Hosts the local `gh` CLI is authenticated to, lowercased. Cached briefly so a
 * `gh auth login --hostname <ghes>` performed after startup is picked up without
 * spawning `gh auth status` on every provider-detection poll. Failures are not
 * cached so a later probe (gh installed, tunnel ready) can still discover hosts.
 */
export async function getAuthenticatedGitHubHosts(
  connectionId?: string | null
): Promise<ReadonlySet<string>> {
  const key = connectionCacheKey(connectionId)
  const now = Date.now()
  const cached = authenticatedHostsCache.get(key)
  if (cached && cached.expiresAt > now) {
    return cached.hosts
  }
  let text = ''
  try {
    // Why: `gh auth status` reads gh's own config, so it is host-scoped rather
    // than cwd-scoped — no repo context is needed to enumerate logged-in hosts.
    const { stdout, stderr } = await ghExecFileAsync(['auth', 'status'])
    text = `${stdout}\n${stderr}`
  } catch (err) {
    // gh exits non-zero when any host has a token problem but still prints the
    // per-host status we parse; recover its output before giving up.
    const execErr = err as { stdout?: unknown; stderr?: unknown }
    text = `${String(execErr?.stdout ?? '')}\n${String(execErr?.stderr ?? '')}`.trim()
    if (!text) {
      return new Set()
    }
  }
  const hosts = new Set(parseAuthStatus(text).map((account) => account.host.toLowerCase()))
  if (hosts.size === 0) {
    return hosts
  }
  authenticatedHostsCache.set(key, { hosts, expiresAt: now + AUTHENTICATED_HOSTS_TTL_MS })
  return hosts
}

/**
 * Resolve owner/repo for a GitHub Enterprise Server `origin` remote — a custom
 * host the user is gh-authenticated to. Returns null for github.com (already
 * handled by {@link getOwnerRepo}) and for hosts gh is not logged in to
 * (Gitea/Forgejo/self-hosted GitLab/etc.), so GHES routes to the GitHub provider
 * without a GitHub provider stealing another forge's remote.
 */
export async function getEnterpriseGitHubRepoSlug(
  repoPath: string,
  connectionId?: string | null,
  options: HostedReviewExecutionOptions = {}
): Promise<GitHubEnterpriseRepoSlug | null> {
  const context = githubRepoContext(repoPath, connectionId, getHostedReviewLocalGitOptions(options))
  let remoteUrl: string | null
  try {
    remoteUrl = await getRemoteUrlForRepo(context, 'origin')
  } catch {
    return null
  }
  const identity = remoteUrl ? parseGitHubRemoteIdentity(remoteUrl) : null
  if (!identity || identity.host === 'github.com') {
    return null
  }
  const authenticatedHosts = await getAuthenticatedGitHubHosts(connectionId)
  return authenticatedHosts.has(identity.host)
    ? { owner: identity.owner, repo: identity.repo, host: identity.host }
    : null
}
