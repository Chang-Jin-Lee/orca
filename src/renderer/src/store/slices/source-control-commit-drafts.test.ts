import { describe, expect, it } from 'vitest'
import {
  clearSourceControlCommitDraftRecordIfUnchanged,
  omitSourceControlCommitDraftsForWorktrees,
  readSourceControlCommitDraftForWorktree,
  writeSourceControlCommitDraftForWorktree,
  writeSourceControlCommitDraftForWorktreeIfEmpty
} from './source-control-commit-drafts'
import { createTestStore } from './store-test-helpers'

describe('source control commit draft records', () => {
  it('returns an empty draft when the selected worktree has no message', () => {
    expect(readSourceControlCommitDraftForWorktree({}, 'wt-a')).toBe('')
    expect(readSourceControlCommitDraftForWorktree({}, null)).toBe('')
  })

  it('keeps independent drafts per worktree', () => {
    let drafts = {}

    drafts = writeSourceControlCommitDraftForWorktree(drafts, 'wt-a', 'feat: message for A')
    drafts = writeSourceControlCommitDraftForWorktree(drafts, 'wt-b', 'fix: message for B')

    expect(readSourceControlCommitDraftForWorktree(drafts, 'wt-a')).toBe('feat: message for A')
    expect(readSourceControlCommitDraftForWorktree(drafts, 'wt-b')).toBe('fix: message for B')
  })

  it('keeps record identity when a write would not change the draft', () => {
    const drafts = { 'wt-a': 'feat: unchanged' }

    expect(writeSourceControlCommitDraftForWorktree(drafts, 'wt-a', 'feat: unchanged')).toBe(drafts)
  })

  it('clears only when the latest draft still trims to the committed message', () => {
    const drafts = {
      'wt-a': ' feat: committed  ',
      'wt-b': 'feat: newer edit'
    }

    expect(
      clearSourceControlCommitDraftRecordIfUnchanged(drafts, 'wt-a', 'feat: committed')
    ).toEqual({
      'wt-b': 'feat: newer edit'
    })
    expect(clearSourceControlCommitDraftRecordIfUnchanged(drafts, 'wt-b', 'feat: committed')).toBe(
      drafts
    )
  })

  it('preserves newer text typed after a commit started', () => {
    const drafts = { 'wt-a': 'feat: committed plus more' }

    expect(clearSourceControlCommitDraftRecordIfUnchanged(drafts, 'wt-a', 'feat: committed')).toBe(
      drafts
    )
  })

  it('hydrates generated messages only into an empty draft', () => {
    expect(writeSourceControlCommitDraftForWorktreeIfEmpty({}, 'wt-a', 'ai: generated')).toEqual({
      'wt-a': 'ai: generated'
    })
    expect(
      writeSourceControlCommitDraftForWorktreeIfEmpty({ 'wt-a': '' }, 'wt-a', 'ai: generated')
    ).toEqual({ 'wt-a': 'ai: generated' })

    const manualDraft = { 'wt-a': 'manual message' }
    expect(
      writeSourceControlCommitDraftForWorktreeIfEmpty(manualDraft, 'wt-a', 'ai: generated')
    ).toBe(manualDraft)
  })

  it('prunes deleted worktree drafts and keeps identity when nothing changes', () => {
    const drafts = { 'wt-a': 'draft A', 'wt-b': 'draft B' }

    expect(omitSourceControlCommitDraftsForWorktrees(drafts, ['wt-a'])).toEqual({
      'wt-b': 'draft B'
    })
    expect(omitSourceControlCommitDraftsForWorktrees(drafts, ['wt-c'])).toBe(drafts)
  })
})

describe('source control commit draft slice', () => {
  it('survives component-owner recreation inside one renderer store', () => {
    const store = createTestStore()

    store.getState().setSourceControlCommitDraft('wt-a', 'feat: persistent in session')

    expect(
      readSourceControlCommitDraftForWorktree(
        store.getState().sourceControlCommitDraftsByWorktree,
        'wt-a'
      )
    ).toBe('feat: persistent in session')
  })

  it('does not notify the draft record when setting the same value', () => {
    const store = createTestStore()

    store.getState().setSourceControlCommitDraft('wt-a', 'feat: unchanged')
    const before = store.getState().sourceControlCommitDraftsByWorktree
    store.getState().setSourceControlCommitDraft('wt-a', 'feat: unchanged')

    expect(store.getState().sourceControlCommitDraftsByWorktree).toBe(before)
  })

  it('prunes removed worktree drafts through the store cleanup path', () => {
    const store = createTestStore()
    store.setState({
      sourceControlCommitDraftsByWorktree: {
        'wt-a': 'draft A',
        'wt-b': 'draft B'
      }
    })

    store.getState().purgeWorktreeTerminalState(['wt-a'])

    expect(store.getState().sourceControlCommitDraftsByWorktree).toEqual({
      'wt-b': 'draft B'
    })
  })
})
