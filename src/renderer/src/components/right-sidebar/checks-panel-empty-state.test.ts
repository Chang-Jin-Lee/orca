import { describe, expect, it } from 'vitest'
import { getChecksPanelEmptyStateCopy } from './checks-panel-empty-state'

describe('getChecksPanelEmptyStateCopy', () => {
  it('shows a local-only branch message instead of a refresh error', () => {
    expect(
      getChecksPanelEmptyStateCopy({
        operationLabel: null,
        prRefreshStatus: 'error',
        hostedReviewBlockedReason: 'no_upstream',
        hasUpstream: false
      })
    ).toEqual({
      title: 'Branch not published',
      description: 'Publish this branch from Source Control before creating a pull request.'
    })
  })

  it('uses remote status as a fallback before eligibility finishes', () => {
    expect(
      getChecksPanelEmptyStateCopy({
        operationLabel: null,
        prRefreshStatus: 'error',
        hostedReviewBlockedReason: undefined,
        hasUpstream: false
      }).title
    ).toBe('Branch not published')
  })

  it('uses remote status as a fallback when eligibility has no concrete blocker', () => {
    expect(
      getChecksPanelEmptyStateCopy({
        operationLabel: null,
        prRefreshStatus: 'error',
        hostedReviewBlockedReason: null,
        hasUpstream: false
      }).title
    ).toBe('Branch not published')
  })

  it('shows unpushed commits before a refresh error', () => {
    expect(
      getChecksPanelEmptyStateCopy({
        operationLabel: null,
        prRefreshStatus: 'error',
        hostedReviewBlockedReason: 'needs_push',
        hasUpstream: true
      })
    ).toEqual({
      title: 'Branch has unpushed commits',
      description: 'Push your branch before creating a pull request.'
    })
  })

  it('does not let remote status override a known eligibility blocker', () => {
    expect(
      getChecksPanelEmptyStateCopy({
        operationLabel: null,
        prRefreshStatus: 'error',
        hostedReviewBlockedReason: 'dirty',
        hasUpstream: false
      }).title
    ).toBe('Could not refresh pull request')
  })

  it('keeps the generic refresh error when no local branch action is known', () => {
    expect(
      getChecksPanelEmptyStateCopy({
        operationLabel: null,
        prRefreshStatus: 'error',
        hostedReviewBlockedReason: null,
        hasUpstream: true
      }).title
    ).toBe('Could not refresh pull request')
  })
})
