import type { StateCreator } from 'zustand'
import type { AppState } from '../types'

export type SourceControlCommitDraftsByWorktree = Record<string, string>

export type SourceControlCommitDraftsSlice = {
  sourceControlCommitDraftsByWorktree: SourceControlCommitDraftsByWorktree
  setSourceControlCommitDraft: (worktreeId: string, value: string) => void
  clearSourceControlCommitDraftIfUnchanged: (
    worktreeId: string,
    committedTrimmedMessage: string
  ) => void
  setSourceControlCommitDraftIfEmpty: (worktreeId: string, generatedMessage: string) => void
  omitSourceControlCommitDraftsForWorktrees: (removedWorktreeIds: readonly string[]) => void
}

export function readSourceControlCommitDraftForWorktree(
  drafts: SourceControlCommitDraftsByWorktree,
  worktreeId: string | null | undefined
): string {
  return drafts[worktreeId ?? ''] ?? ''
}

export function writeSourceControlCommitDraftForWorktree(
  drafts: SourceControlCommitDraftsByWorktree,
  worktreeId: string,
  value: string
): SourceControlCommitDraftsByWorktree {
  if (drafts[worktreeId] === value) {
    return drafts
  }
  return { ...drafts, [worktreeId]: value }
}

export function clearSourceControlCommitDraftRecordIfUnchanged(
  drafts: SourceControlCommitDraftsByWorktree,
  worktreeId: string,
  committedTrimmedMessage: string
): SourceControlCommitDraftsByWorktree {
  const current = drafts[worktreeId]
  if (current === undefined || current.trim() !== committedTrimmedMessage) {
    return drafts
  }
  const { [worktreeId]: _removed, ...rest } = drafts
  return rest
}

export function writeSourceControlCommitDraftForWorktreeIfEmpty(
  drafts: SourceControlCommitDraftsByWorktree,
  worktreeId: string,
  generatedMessage: string
): SourceControlCommitDraftsByWorktree {
  const current = drafts[worktreeId]
  if (current && current.length > 0) {
    return drafts
  }
  if (current === generatedMessage || (current === undefined && generatedMessage.length === 0)) {
    return drafts
  }
  return { ...drafts, [worktreeId]: generatedMessage }
}

export function omitSourceControlCommitDraftsForWorktrees(
  drafts: SourceControlCommitDraftsByWorktree,
  removedWorktreeIds: readonly string[]
): SourceControlCommitDraftsByWorktree {
  if (removedWorktreeIds.length === 0) {
    return drafts
  }
  let changed = false
  const next = { ...drafts }
  for (const worktreeId of removedWorktreeIds) {
    if (worktreeId in next) {
      delete next[worktreeId]
      changed = true
    }
  }
  return changed ? next : drafts
}

export const createSourceControlCommitDraftsSlice: StateCreator<
  AppState,
  [],
  [],
  SourceControlCommitDraftsSlice
> = (set) => ({
  sourceControlCommitDraftsByWorktree: {},
  setSourceControlCommitDraft: (worktreeId, value) =>
    set((state) => {
      const nextDrafts = writeSourceControlCommitDraftForWorktree(
        state.sourceControlCommitDraftsByWorktree,
        worktreeId,
        value
      )
      return nextDrafts === state.sourceControlCommitDraftsByWorktree
        ? state
        : { sourceControlCommitDraftsByWorktree: nextDrafts }
    }),
  clearSourceControlCommitDraftIfUnchanged: (worktreeId, committedTrimmedMessage) =>
    set((state) => {
      const nextDrafts = clearSourceControlCommitDraftRecordIfUnchanged(
        state.sourceControlCommitDraftsByWorktree,
        worktreeId,
        committedTrimmedMessage
      )
      return nextDrafts === state.sourceControlCommitDraftsByWorktree
        ? state
        : { sourceControlCommitDraftsByWorktree: nextDrafts }
    }),
  setSourceControlCommitDraftIfEmpty: (worktreeId, generatedMessage) =>
    set((state) => {
      const nextDrafts = writeSourceControlCommitDraftForWorktreeIfEmpty(
        state.sourceControlCommitDraftsByWorktree,
        worktreeId,
        generatedMessage
      )
      return nextDrafts === state.sourceControlCommitDraftsByWorktree
        ? state
        : { sourceControlCommitDraftsByWorktree: nextDrafts }
    }),
  omitSourceControlCommitDraftsForWorktrees: (removedWorktreeIds) =>
    set((state) => {
      const nextDrafts = omitSourceControlCommitDraftsForWorktrees(
        state.sourceControlCommitDraftsByWorktree,
        removedWorktreeIds
      )
      return nextDrafts === state.sourceControlCommitDraftsByWorktree
        ? state
        : { sourceControlCommitDraftsByWorktree: nextDrafts }
    })
})
