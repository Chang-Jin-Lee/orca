import type { RpcClient } from '../transport/rpc-client'
import type { RpcSuccess } from '../transport/types'
import { readMobileGitStatusResult } from '../session/mobile-diff-review-rpc'
import { requestMobileCommitMessage } from './mobile-commit-message-ai'
import { getStageablePaths, type MobileGitStatusResult } from './mobile-git-status'
import { getMobilePrEligibilityReadiness } from './mobile-open-pr-prefill'
import { resolveMobilePrPrefill, type MobilePrPrefill } from './mobile-pr-create'

export type MobileHostedReviewCreateIntentProgress =
  | 'staging'
  | 'generating_commit_message'
  | 'committing'
  | 'publishing'
  | 'pushing'
  | 'force_pushing'
  | 'creating_review'

export type MobileHostedReviewCreateIntentOutcome =
  | {
      ok: true
      prefill: MobilePrPrefill
      status: MobileGitStatusResult | null
      committed: boolean
    }
  | { ok: false; error: string }

type PrepareInput = {
  branch: string
  title: string
  status: MobileGitStatusResult | null
  commitMessage?: string
  onProgress?: (progress: MobileHostedReviewCreateIntentProgress) => void
}

export function mobileHostedReviewCreateIntentProgressMessage(
  progress: MobileHostedReviewCreateIntentProgress
): string {
  switch (progress) {
    case 'staging':
      return 'Staging changes...'
    case 'generating_commit_message':
      return 'Generating commit message...'
    case 'committing':
      return 'Committing changes...'
    case 'publishing':
      return 'Publishing branch...'
    case 'pushing':
      return 'Pushing commits...'
    case 'force_pushing':
      return 'Force pushing with lease...'
    case 'creating_review':
      return 'Creating review...'
  }
}

async function readStatus(
  client: Pick<RpcClient, 'sendRequest'>,
  worktreeId: string
): Promise<MobileGitStatusResult | null> {
  const response = await client.sendRequest('git.status', { worktree: `id:${worktreeId}` })
  if (!response.ok) {
    return null
  }
  return readMobileGitStatusResult((response as RpcSuccess).result)
}

function branchStillMatches(inputBranch: string, status: MobileGitStatusResult | null): boolean {
  return (
    !status?.branch ||
    status.branch === inputBranch ||
    status.branch === `refs/heads/${inputBranch}`
  )
}

async function sendGitMutation(
  client: Pick<RpcClient, 'sendRequest'>,
  method: string,
  params: Record<string, unknown>,
  fallback: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await client.sendRequest(method, params)
    if (!response.ok) {
      return { ok: false, error: response.error?.message || fallback }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : fallback }
  }
}

async function commitStagedChanges(
  client: Pick<RpcClient, 'sendRequest'>,
  worktreeId: string,
  message: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await client.sendRequest('git.commit', {
      worktree: `id:${worktreeId}`,
      message
    })
    if (!response.ok) {
      return { ok: false, error: response.error?.message || 'Commit failed' }
    }
    const result = (response as RpcSuccess).result as { success?: boolean; error?: string }
    if (result?.success !== true) {
      return { ok: false, error: result?.error || 'Commit failed' }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Commit failed' }
  }
}

async function resolvePrefillFromStatus(
  client: Pick<RpcClient, 'sendRequest'>,
  worktreeId: string,
  branch: string,
  title: string,
  status: MobileGitStatusResult | null
): Promise<MobilePrPrefill> {
  return resolveMobilePrPrefill(client, worktreeId, {
    branch,
    title,
    ...getMobilePrEligibilityReadiness(status)
  })
}

async function ensureLocalChangesCommitted(
  client: Pick<RpcClient, 'sendRequest'>,
  worktreeId: string,
  input: PrepareInput,
  currentStatus: MobileGitStatusResult | null
): Promise<
  | { ok: true; status: MobileGitStatusResult | null; committed: boolean }
  | { ok: false; error: string }
> {
  if ((currentStatus?.entries.length ?? 0) === 0) {
    return { ok: true, status: currentStatus, committed: false }
  }

  const stagePaths = getStageablePaths(currentStatus?.entries ?? [])
  if (stagePaths.length > 0) {
    input.onProgress?.('staging')
    const staged = await sendGitMutation(
      client,
      'git.bulkStage',
      { worktree: `id:${worktreeId}`, filePaths: stagePaths },
      'Failed to stage changes'
    )
    if (!staged.ok) {
      return staged
    }
    currentStatus = await readStatus(client, worktreeId)
    if (!branchStillMatches(input.branch, currentStatus)) {
      return { ok: false, error: 'Branch changed while preparing the pull request.' }
    }
  }

  const hasStagedChanges = currentStatus?.entries.some((entry) => entry.area === 'staged') === true
  if (!hasStagedChanges) {
    return { ok: false, error: 'Resolve or stage changes before creating a pull request.' }
  }

  let message = input.commitMessage?.trim() ?? ''
  if (!message) {
    input.onProgress?.('generating_commit_message')
    const generated = await requestMobileCommitMessage(client, worktreeId)
    if (!generated.success) {
      return {
        ok: false,
        error: 'Could not generate a commit message. Add one in Source Control, then retry.'
      }
    }
    message = generated.message
  }

  input.onProgress?.('committing')
  const committed = await commitStagedChanges(client, worktreeId, message)
  if (!committed.ok) {
    return committed
  }
  currentStatus = await readStatus(client, worktreeId)
  if (!branchStillMatches(input.branch, currentStatus)) {
    return { ok: false, error: 'Branch changed while preparing the pull request.' }
  }
  return { ok: true, status: currentStatus, committed: true }
}

async function applyRemotePrerequisite(
  client: Pick<RpcClient, 'sendRequest'>,
  worktreeId: string,
  prefill: MobilePrPrefill,
  input: PrepareInput
): Promise<{ ok: true; ran: boolean } | { ok: false; error: string }> {
  switch (prefill.blockedReason) {
    case 'no_upstream': {
      input.onProgress?.('publishing')
      const result = await sendGitMutation(
        client,
        'git.push',
        { worktree: `id:${worktreeId}`, publish: true },
        'Failed to publish branch'
      )
      return result.ok ? { ok: true, ran: true } : result
    }
    case 'needs_push': {
      input.onProgress?.('pushing')
      const result = await sendGitMutation(
        client,
        'git.push',
        { worktree: `id:${worktreeId}` },
        'Failed to push commits'
      )
      return result.ok ? { ok: true, ran: true } : result
    }
    case 'needs_sync':
      if (input.status?.upstreamStatus?.behindCommitsArePatchEquivalent !== true) {
        return { ok: true, ran: false }
      }
      input.onProgress?.('force_pushing')
      const result = await sendGitMutation(
        client,
        'git.push',
        { worktree: `id:${worktreeId}`, forceWithLease: true },
        'Failed to force push with lease'
      )
      return result.ok ? { ok: true, ran: true } : result
    default:
      return { ok: true, ran: false }
  }
}

export async function prepareMobileHostedReviewCreateIntent(
  client: Pick<RpcClient, 'sendRequest'>,
  worktreeId: string,
  input: PrepareInput
): Promise<MobileHostedReviewCreateIntentOutcome> {
  let currentStatus = (await readStatus(client, worktreeId)) ?? input.status
  if (!branchStillMatches(input.branch, currentStatus)) {
    return { ok: false, error: 'Branch changed while preparing the pull request.' }
  }

  const committed = await ensureLocalChangesCommitted(client, worktreeId, input, currentStatus)
  if (!committed.ok) {
    return committed
  }
  currentStatus = committed.status

  let prefill = await resolvePrefillFromStatus(
    client,
    worktreeId,
    input.branch,
    input.title,
    currentStatus
  )
  for (let attempts = 0; attempts < 2; attempts++) {
    const remote = await applyRemotePrerequisite(client, worktreeId, prefill, {
      ...input,
      status: currentStatus
    })
    if (!remote.ok) {
      return remote
    }
    if (!remote.ran) {
      break
    }
    currentStatus = await readStatus(client, worktreeId)
    if (!branchStillMatches(input.branch, currentStatus)) {
      return { ok: false, error: 'Branch changed while preparing the pull request.' }
    }
    prefill = await resolvePrefillFromStatus(
      client,
      worktreeId,
      input.branch,
      input.title,
      currentStatus
    )
  }

  return { ok: true, prefill, status: currentStatus, committed: committed.committed }
}
