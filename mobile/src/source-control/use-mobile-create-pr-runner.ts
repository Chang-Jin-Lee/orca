import { useCallback, type MutableRefObject } from 'react'
import type { RpcClient } from '../transport/rpc-client'
import { triggerError } from '../platform/haptics'
import type { MobileGitStatusResult } from './mobile-git-status'
import {
  mobileHostedReviewCreateIntentProgressMessage,
  type MobileHostedReviewCreateIntentProgress
} from './mobile-hosted-review-create-intent'
import {
  runMobileHostedReviewCreateIntent,
  type MobileHostedReviewCreateIntentRunOutcome
} from './mobile-hosted-review-create-intent-runner'

type RunGitWorkflow = (actionId: string, runner: () => Promise<void>) => Promise<boolean>

type Params = {
  client: RpcClient | null
  worktreeId: string
  status: MobileGitStatusResult | null
  branchLabel: string
  commitMessage: string
  mountedRef: MutableRefObject<boolean>
  runGitWorkflow: RunGitWorkflow
  setActionError: (next: string | null) => void
  setCommitMessage: (next: string) => void
  setShowActionSheet: (next: boolean) => void
  setCreatedPrUrl: (next: string | null) => void
  setCreatedPrWarning: (next: string | null) => void
}

export function useMobileCreatePrRunner({
  client,
  worktreeId,
  status,
  branchLabel,
  commitMessage,
  mountedRef,
  runGitWorkflow,
  setActionError,
  setCommitMessage,
  setShowActionSheet,
  setCreatedPrUrl,
  setCreatedPrWarning
}: Params) {
  return useCallback(
    async (pushFirst: boolean) => {
      setShowActionSheet(false)
      const branch = status?.branch
      if (!client || !branch) {
        triggerError()
        setActionError('Check out a branch before creating a pull request.')
        return
      }
      const created: { current: MobileHostedReviewCreateIntentRunOutcome | null } = {
        current: null
      }
      const ran = await runGitWorkflow(pushFirst ? 'push-create-pr' : 'create-pr', async () => {
        created.current = await runMobileHostedReviewCreateIntent(client, worktreeId, {
          branch,
          title: branchLabel,
          status,
          commitMessage,
          onProgress: (progress: MobileHostedReviewCreateIntentProgress) =>
            setActionError(mobileHostedReviewCreateIntentProgressMessage(progress))
        })
        if (!created.current.ok) {
          throw new Error(created.current.error)
        }
      })
      const outcome = created.current
      if (outcome?.committed && mountedRef.current) {
        setCommitMessage('')
      }
      if (!ran || !mountedRef.current || !outcome || !outcome.ok) {
        return
      }
      setActionError(null)
      setCreatedPrUrl(outcome.url)
      setCreatedPrWarning(outcome.warning ?? null)
    },
    [
      branchLabel,
      client,
      commitMessage,
      mountedRef,
      runGitWorkflow,
      setActionError,
      setCommitMessage,
      setCreatedPrUrl,
      setCreatedPrWarning,
      setShowActionSheet,
      status,
      worktreeId
    ]
  )
}
