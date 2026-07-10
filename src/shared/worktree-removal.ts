import type { GitWorktreeInfo } from './types'

export const LOCKED_WORKTREE_REMOVAL_PREFIX = 'Worktree is locked by Git.'

export type WorktreeForceDeleteReason =
  | 'dirty'
  | 'locked'
  | 'orphan-directory'
  | 'missing-registration'

export function createLockedWorktreeRemovalError(lockReason?: string): Error {
  const reason = lockReason?.trim()
  return new Error(
    reason
      ? `${LOCKED_WORKTREE_REMOVAL_PREFIX} Lock reason: ${reason}. Use Force Delete to remove it anyway.`
      : `${LOCKED_WORKTREE_REMOVAL_PREFIX} Use Force Delete to remove it anyway.`
  )
}

export function assertWorktreeUnlockedForRemoval(
  worktree: Pick<GitWorktreeInfo, 'locked' | 'lockReason'> | undefined,
  overrideLock = false
): void {
  if (!overrideLock && worktree?.locked) {
    throw createLockedWorktreeRemovalError(worktree.lockReason)
  }
}

export function getLockedWorktreeRemovalReason(error: string): string | null {
  const prefixIndex = error.indexOf(`${LOCKED_WORKTREE_REMOVAL_PREFIX} Lock reason: `)
  if (prefixIndex === -1) {
    return null
  }
  const reasonStart = prefixIndex + `${LOCKED_WORKTREE_REMOVAL_PREFIX} Lock reason: `.length
  const recoverySuffix = '. Use Force Delete to remove it anyway.'
  const suffixIndex = error.indexOf(recoverySuffix, reasonStart)
  const reason = error.slice(reasonStart, suffixIndex === -1 ? undefined : suffixIndex).trim()
  return reason || null
}

const FORMATTED_DIRTY_WORKTREE_REMOVAL_PATTERN =
  /Failed to delete worktree at [^\n]*\.\s*(?:(?:[MADRCUT][ MADRCUT]| [MADRCUT]|\?\?)\s+\S)/

export function classifyWorktreeForceDeleteReason(
  error: string,
  force = false,
  overrideLock = false
): WorktreeForceDeleteReason | null {
  if (overrideLock) {
    return null
  }
  if (
    error.includes(LOCKED_WORKTREE_REMOVAL_PREFIX) ||
    error.includes('cannot remove a locked working tree')
  ) {
    // Why: raw Git matching keeps force recovery available with older relays;
    // current runtimes emit the locale-independent app-owned prefix above.
    return 'locked'
  }
  if (force) {
    return null
  }
  if (error.includes('Worktree is no longer registered with Git but its directory remains')) {
    return 'orphan-directory'
  }
  if (
    error.includes('Worktree is no longer registered with Git and its directory is already gone')
  ) {
    return 'missing-registration'
  }
  if (
    error.includes('Worktree has uncommitted or untracked changes') ||
    error.includes('contains modified or untracked files') ||
    FORMATTED_DIRTY_WORKTREE_REMOVAL_PATTERN.test(error)
  ) {
    return 'dirty'
  }
  return null
}
