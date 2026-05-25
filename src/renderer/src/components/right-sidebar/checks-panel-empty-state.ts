import type { HostedReviewCreationBlockedReason } from '../../../../shared/hosted-review'

type PRRefreshStatus = 'queued' | 'in-flight' | 'paused' | 'error' | 'skipped' | undefined

type ChecksPanelEmptyStateInput = {
  operationLabel: string | null
  prRefreshStatus: PRRefreshStatus
  hostedReviewBlockedReason: HostedReviewCreationBlockedReason | undefined
  hasUpstream: boolean | undefined
}

type ChecksPanelEmptyStateCopy = {
  title: string
  description: string
}

export function getChecksPanelEmptyStateCopy(
  input: ChecksPanelEmptyStateInput
): ChecksPanelEmptyStateCopy {
  if (input.operationLabel) {
    return {
      title: `${input.operationLabel} in progress`,
      description: 'PR checks will be available after the operation completes'
    }
  }

  const blockedReason = input.hostedReviewBlockedReason
  const branchNotPublished =
    blockedReason === 'no_upstream' ||
    ((blockedReason === undefined || blockedReason === null) && input.hasUpstream === false)
  if (branchNotPublished) {
    // Why: a local-only branch cannot have GitHub PR status yet; surfacing a
    // refresh error here makes a normal pre-publish state look broken.
    return {
      title: 'Branch not published',
      description: 'Publish this branch from Source Control before creating a pull request.'
    }
  }

  if (blockedReason === 'needs_push') {
    return {
      title: 'Branch has unpushed commits',
      description: 'Push your branch before creating a pull request.'
    }
  }

  switch (input.prRefreshStatus) {
    case 'error':
      return {
        title: 'Could not refresh pull request',
        description: 'GitHub status could not be refreshed. Existing cached data was preserved.'
      }
    case 'queued':
      return {
        title: 'Checking for pull request',
        description: 'Waiting to refresh GitHub status for this branch'
      }
    case 'in-flight':
      return {
        title: 'Checking for pull request',
        description: 'Refreshing GitHub status for this branch'
      }
    case 'paused':
      return {
        title: 'No pull request found',
        description: 'GitHub refresh is paused by the current rate-limit budget'
      }
    default:
      return {
        title: 'No pull request found',
        description: 'Create a pull request to start checks and review.'
      }
  }
}
