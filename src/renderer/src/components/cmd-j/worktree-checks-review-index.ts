import { branchName } from '@/lib/git-utils'
import { getGitHubPRCacheKey } from '@/store/slices/github-cache-key'
import { getHostedReviewCacheKey } from '@/store/slices/hosted-review-cache-identity'
import type { AppState } from '@/store/types'
import type { HostedReviewInfo } from '../../../../shared/hosted-review'
import type { Repo, Worktree } from '../../../../shared/types'
import { selectChecksPanelReview } from '../right-sidebar/checks-panel-review'

type WorktreeChecksReviewIndexArgs = {
  worktrees: readonly Worktree[]
  repoMap: ReadonlyMap<string, Repo>
  prCache: AppState['prCache'] | null
  hostedReviewCache: AppState['hostedReviewCache'] | null
  settings: AppState['settings']
}

export function buildWorktreeChecksReviewIndex({
  worktrees,
  repoMap,
  prCache,
  hostedReviewCache,
  settings
}: WorktreeChecksReviewIndexArgs): Map<string, HostedReviewInfo> {
  const reviews = new Map<string, HostedReviewInfo>()
  if (!prCache || !hostedReviewCache) {
    return reviews
  }

  for (const worktree of worktrees) {
    const repo = repoMap.get(worktree.repoId)
    if (!repo) {
      continue
    }
    const branch = branchName(worktree.branch)
    const prKey = getGitHubPRCacheKey(
      repo.path,
      repo.id,
      branch,
      settings,
      repo.connectionId,
      repo.executionHostId,
      true
    )
    const hostedReviewKey = getHostedReviewCacheKey(
      repo.path,
      branch,
      settings,
      repo.id,
      repo.connectionId,
      repo.executionHostId,
      true
    )
    // Why: Cmd+J should expose exactly the review metadata Checks has already
    // resolved, without starting another provider lookup from the search path.
    const review = selectChecksPanelReview({
      hostedReview: hostedReviewCache[hostedReviewKey]?.data,
      pr: prCache[prKey]?.data,
      linkedGitLabMR: worktree.linkedGitLabMR ?? null,
      linkedBitbucketPR: worktree.linkedBitbucketPR ?? null,
      linkedAzureDevOpsPR: worktree.linkedAzureDevOpsPR ?? null,
      linkedGiteaPR: worktree.linkedGiteaPR ?? null
    })
    if (review) {
      reviews.set(worktree.id, review)
    }
  }

  return reviews
}
