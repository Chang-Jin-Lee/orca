import { describe, expect, it } from 'vitest'
import type { HostedReviewInfo } from '../../../../shared/hosted-review'
import type { PRInfo, Repo, Worktree } from '../../../../shared/types'
import { getGitHubPRCacheKey } from '@/store/slices/github-cache-key'
import { getHostedReviewCacheKey } from '@/store/slices/hosted-review-cache-identity'
import { buildWorktreeChecksReviewIndex } from './worktree-checks-review-index'

const repo: Repo = {
  id: 'repo-1',
  path: '/remote/orca',
  displayName: 'orca',
  badgeColor: '#000000',
  addedAt: 0,
  executionHostId: 'ssh:staging'
}

const worktree: Worktree = {
  id: 'worktree-1',
  repoId: repo.id,
  path: '/remote/orca-worktrees/search',
  head: 'abc123',
  branch: 'refs/heads/feature/search',
  isBare: false,
  isMainWorktree: false,
  displayName: 'Search reviews',
  comment: '',
  linkedIssue: null,
  linkedPR: 42,
  linkedLinearIssue: null,
  isArchived: false,
  isUnread: false,
  isPinned: false,
  sortOrder: 0,
  lastActivityAt: 0
}

function makePR(): PRInfo {
  return {
    number: 42,
    title: 'Search worktrees by their pull requests',
    state: 'open',
    url: 'https://github.com/acme/orca/pull/42',
    checksStatus: 'success',
    updatedAt: '2026-07-12T00:00:00Z',
    mergeable: 'MERGEABLE'
  }
}

function makeGitLabReview(): HostedReviewInfo {
  return {
    provider: 'gitlab',
    number: 17,
    title: 'Search worktrees by merge request',
    state: 'open',
    url: 'https://gitlab.com/acme/orca/-/merge_requests/17',
    status: 'pending',
    updatedAt: '2026-07-12T00:00:00Z',
    mergeable: 'UNKNOWN'
  }
}

describe('buildWorktreeChecksReviewIndex', () => {
  it('reads the same host-scoped GitHub PR cache entry as Checks', () => {
    const key = getGitHubPRCacheKey(
      repo.path,
      repo.id,
      'feature/search',
      null,
      repo.connectionId,
      repo.executionHostId,
      true
    )

    const reviews = buildWorktreeChecksReviewIndex({
      worktrees: [worktree],
      repoMap: new Map([[repo.id, repo]]),
      prCache: { [key]: { data: makePR(), fetchedAt: 1 } },
      hostedReviewCache: {},
      settings: null
    })

    expect(reviews.get(worktree.id)).toMatchObject({
      provider: 'github',
      number: 42,
      title: 'Search worktrees by their pull requests'
    })
  })

  it('uses the GitLab review selected by Checks instead of stale GitHub metadata', () => {
    const gitLabWorktree = { ...worktree, linkedGitLabMR: 17 }
    const prKey = getGitHubPRCacheKey(
      repo.path,
      repo.id,
      'feature/search',
      null,
      repo.connectionId,
      repo.executionHostId,
      true
    )
    const reviewKey = getHostedReviewCacheKey(
      repo.path,
      'feature/search',
      null,
      repo.id,
      repo.connectionId,
      repo.executionHostId,
      true
    )
    const gitLabReview = makeGitLabReview()

    const reviews = buildWorktreeChecksReviewIndex({
      worktrees: [gitLabWorktree],
      repoMap: new Map([[repo.id, repo]]),
      prCache: { [prKey]: { data: makePR(), fetchedAt: 1 } },
      hostedReviewCache: { [reviewKey]: { data: gitLabReview, fetchedAt: 1 } },
      settings: null
    })

    expect(reviews.get(worktree.id)).toBe(gitLabReview)
  })
})
