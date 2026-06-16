import { describe, expect, it } from 'vitest'
import { resolvePrimaryAction, type PrimaryActionInputs } from './source-control-primary-action'

function inputs(overrides: Partial<PrimaryActionInputs> = {}): PrimaryActionInputs {
  return {
    stagedCount: 0,
    hasUnstagedChanges: false,
    hasStageableChanges: false,
    hasPartiallyStagedChanges: false,
    hasMessage: false,
    hasUnresolvedConflicts: false,
    isCommitting: false,
    isRemoteOperationActive: false,
    upstreamStatus: undefined,
    ...overrides
  }
}

const upstreamInSync = {
  hasUpstream: true,
  upstreamName: 'origin/main',
  ahead: 0,
  behind: 0
}

describe('resolvePrimaryAction Create PR intent', () => {
  it('returns Create PR intent for an unpublished clean branch with commits to publish', () => {
    const result = resolvePrimaryAction(
      inputs({
        upstreamStatus: { hasUpstream: false, ahead: 0, behind: 0 },
        branchCommitsAhead: 2,
        hostedReviewCreation: {
          provider: 'github',
          review: null,
          canCreate: false,
          blockedReason: 'no_upstream',
          nextAction: 'publish'
        }
      })
    )
    expect(result.kind).toBe('create_pr_intent')
    expect(result.disabled).toBe(false)
  })

  it('returns Create PR intent for patch-equivalent force-push before review', () => {
    const result = resolvePrimaryAction(
      inputs({
        branchCommitsAhead: 4,
        upstreamStatus: {
          hasUpstream: true,
          upstreamName: 'origin/feature',
          ahead: 14,
          behind: 3,
          behindCommitsArePatchEquivalent: true
        },
        hostedReviewCreation: {
          provider: 'github',
          review: null,
          canCreate: false,
          blockedReason: 'needs_sync',
          nextAction: 'sync'
        }
      })
    )
    expect(result.kind).toBe('create_pr_intent')
    expect(result.disabled).toBe(false)
  })

  it('returns Create PR intent for a branch that needs a safe push before review', () => {
    const result = resolvePrimaryAction(
      inputs({
        upstreamStatus: { hasUpstream: true, ahead: 2, behind: 0 },
        hostedReviewCreation: {
          provider: 'github',
          review: null,
          canCreate: false,
          blockedReason: 'needs_push',
          nextAction: 'push'
        }
      })
    )
    expect(result.kind).toBe('create_pr_intent')
    expect(result.disabled).toBe(false)
  })

  it('returns Create PR intent for a dirty tree when hosted review prep can commit changes', () => {
    const result = resolvePrimaryAction(
      inputs({
        hasUnstagedChanges: true,
        hasStageableChanges: true,
        upstreamStatus: upstreamInSync,
        hostedReviewCreation: {
          provider: 'github',
          review: null,
          canCreate: false,
          blockedReason: 'dirty',
          nextAction: 'commit'
        }
      })
    )
    expect(result).toEqual({
      kind: 'create_pr_intent',
      label: 'Create PR',
      title: 'Prepare this branch and create a pull request',
      disabled: false
    })
  })

  it('returns Create PR intent for staged changes without a message so the flow can request one', () => {
    const result = resolvePrimaryAction(
      inputs({
        stagedCount: 1,
        hasMessage: false,
        upstreamStatus: upstreamInSync,
        hostedReviewCreation: {
          provider: 'github',
          review: null,
          canCreate: false,
          blockedReason: 'dirty',
          nextAction: 'commit'
        }
      })
    )
    expect(result.kind).toBe('create_pr_intent')
    expect(result.disabled).toBe(false)
  })

  it('returns Create MR intent with provider copy for a GitLab dirty branch', () => {
    const result = resolvePrimaryAction(
      inputs({
        stagedCount: 1,
        hasMessage: true,
        upstreamStatus: upstreamInSync,
        hostedReviewCreation: {
          provider: 'gitlab',
          review: null,
          canCreate: false,
          blockedReason: 'dirty',
          nextAction: 'commit'
        }
      })
    )
    expect(result.kind).toBe('create_pr_intent')
    expect(result.label).toBe('Create MR')
    expect(result.title).toBe('Prepare this branch and create a merge request')
  })
})
