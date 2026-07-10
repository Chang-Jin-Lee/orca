import type { WorktreeForceDeleteReason } from '../../../../shared/worktree-removal'

type RemoveWorktreeFromSpace<TResult> = (
  worktreeId: string,
  force?: boolean,
  options?: { overrideLock?: boolean }
) => Promise<TResult>

export function forceDeleteWorkspaceFromSpace<TResult>(
  removeWorktree: RemoveWorktreeFromSpace<TResult>,
  worktreeId: string,
  reason: WorktreeForceDeleteReason | null
): Promise<TResult> {
  // Why: dirty and orphan recovery need ordinary force; only a confirmed Git
  // lock may opt into Git's separate double-force override.
  return removeWorktree(worktreeId, true, reason === 'locked' ? { overrideLock: true } : undefined)
}
