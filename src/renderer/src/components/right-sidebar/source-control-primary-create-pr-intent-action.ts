import { translate } from '@/i18n/i18n'
import {
  localizedHostedReviewCopy,
  resolveSupportedHostedReviewCopyProvider
} from '@/i18n/hosted-review-localized-copy'
import type { PrimaryAction, PrimaryActionInputs } from './source-control-primary-action-types'
import { resolveCreatePrIntentEligibility } from './source-control-create-pr-intent-state'

export function resolveCreatePrIntentInFlightPrimaryAction(): PrimaryAction {
  return {
    kind: 'create_pr_intent',
    label: translate(
      'auto.components.right.sidebar.source.control.primary.action.8c6d15a07d',
      'Create PR'
    ),
    title: translate(
      'auto.components.right.sidebar.source.control.primary.action.d37e68f61d',
      'Preparing branch for review…'
    ),
    disabled: true
  }
}

export function resolveCreatePrIntentPrimaryAction(
  inputs: PrimaryActionInputs
): PrimaryAction | null {
  const createPrIntent = resolveCreatePrIntentEligibility({
    stagedCount: inputs.stagedCount,
    hasStageableChanges: inputs.hasStageableChanges,
    hasMessage: inputs.hasMessage,
    hasUnresolvedConflicts: inputs.hasUnresolvedConflicts,
    upstreamStatus: inputs.upstreamStatus,
    hostedReviewCreation: inputs.hostedReviewCreation,
    branchCommitsAhead: inputs.branchCommitsAhead,
    hasCurrentBranch: inputs.hasCurrentBranch
  })
  if (!createPrIntent.eligible) {
    return null
  }
  const copy = localizedHostedReviewCopy(
    resolveSupportedHostedReviewCopyProvider(inputs.hostedReviewCreation?.provider)
  )
  return {
    kind: 'create_pr_intent',
    label: translate(
      'auto.components.right.sidebar.source.control.primary.action.e7ffa46946',
      'Create {{value0}}',
      { value0: copy.shortLabel }
    ),
    title: translate(
      'auto.components.right.sidebar.source.control.primary.action.c72e5e65d1',
      'Prepare this branch and create a {{value0}}',
      { value0: copy.reviewLabel }
    ),
    disabled: false
  }
}

export function resolveCreatePrIntentPrerequisiteAction(
  inputs: PrimaryActionInputs
): PrimaryAction | null {
  if (inputs.isPrIntentInFlight || inputs.isCommitting || inputs.isRemoteOperationActive) {
    return null
  }
  const createPrIntent = resolveCreatePrIntentEligibility({
    stagedCount: inputs.stagedCount,
    hasStageableChanges: inputs.hasStageableChanges,
    hasMessage: inputs.hasMessage,
    hasUnresolvedConflicts: inputs.hasUnresolvedConflicts,
    upstreamStatus: inputs.upstreamStatus,
    hostedReviewCreation: inputs.hostedReviewCreation,
    branchCommitsAhead: inputs.branchCommitsAhead,
    hasCurrentBranch: inputs.hasCurrentBranch
  })
  if (!createPrIntent.eligible || !inputs.hasStageableChanges) {
    return null
  }

  const title = inputs.hasPartiallyStagedChanges
    ? translate(
        'auto.components.right.sidebar.source.control.primary.action.2d8f185fbc',
        'Stage all changes before committing partially staged files'
      )
    : translate(
        'auto.components.right.sidebar.source.control.primary.action.5a477d80cb',
        'Stage all changes'
      )

  return {
    kind: 'stage',
    label: translate(
      'auto.components.right.sidebar.source.control.primary.action.18a0fca877',
      'Stage All'
    ),
    title,
    disabled: false
  }
}
