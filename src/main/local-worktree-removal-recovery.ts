import type { GitWorktreeInfo, RemoveWorktreeResult } from '../shared/types'
import { assertWorktreeUnlockedForRemoval } from '../shared/worktree-removal'
import {
  areWorktreePathsEqual,
  formatWorktreeRemovalError,
  isWindowsLongPathWorktreeRemovalError
} from './ipc/worktree-logic'
import { gitExecFileAsync } from './git/runner'
import { listWorktreesStrict, removeWorktree, type GitWorktreeExecOptions } from './git/worktree'
import { removeLocalWorktreePath } from './local-worktree-filesystem'

type LocalWindowsLongPathRecoveryArgs = {
  error: unknown
  force: boolean
  canonicalWorktreePath: string
  repoPath: string
  localWorktreeGitOptions: GitWorktreeExecOptions
  registeredWorktree: Pick<GitWorktreeInfo, 'branch' | 'head' | 'locked' | 'lockReason'>
  deleteBranch: boolean
  overrideLock: boolean
  closeWatcher: (worktreePath: string) => Promise<void>
}

type StaleLocalWorktreeRegistrationArgs = Omit<
  LocalWindowsLongPathRecoveryArgs,
  'error' | 'force' | 'closeWatcher'
>

function preservedBranchResult(
  registeredWorktree: Pick<GitWorktreeInfo, 'branch' | 'head'>,
  deleteBranch: boolean
): RemoveWorktreeResult {
  if (!deleteBranch || !registeredWorktree.branch || !registeredWorktree.head) {
    return {}
  }
  return {
    preservedBranch: {
      branchName: registeredWorktree.branch.replace(/^refs\/heads\//, ''),
      head: registeredWorktree.head
    }
  }
}

function staleRegistrationRecoveryError(error: unknown, canonicalWorktreePath: string): Error {
  return new Error(
    `${formatWorktreeRemovalError(
      error,
      canonicalWorktreePath,
      true
    )} The worktree directory was removed, but Git still has stale worktree registration. Retry deletion after resolving the Git registration error.`
  )
}

async function verifyGitWorktreeRegistrationRemoved(
  repoPath: string,
  localWorktreeGitOptions: GitWorktreeExecOptions,
  canonicalWorktreePath: string
): Promise<void> {
  try {
    const remainingWorktrees = await listWorktreesStrict(repoPath, localWorktreeGitOptions)
    if (
      remainingWorktrees.some((worktree) =>
        areWorktreePathsEqual(worktree.path, canonicalWorktreePath)
      )
    ) {
      throw new Error('Git still reports the worktree registration after cleanup.')
    }
  } catch (error) {
    throw staleRegistrationRecoveryError(error, canonicalWorktreePath)
  }
}

async function removeRequiredGitWorktreeRegistration(
  args: StaleLocalWorktreeRegistrationArgs
): Promise<RemoveWorktreeResult> {
  assertWorktreeUnlockedForRemoval(args.registeredWorktree, args.overrideLock)

  let result: RemoveWorktreeResult | undefined
  let removalError: unknown
  try {
    if (args.registeredWorktree.locked && args.overrideLock) {
      // Why: prune intentionally retains locked rows; Git's second force is the
      // explicit recovery mechanism that can remove the missing registration.
      result = await removeWorktree(args.repoPath, args.canonicalWorktreePath, true, {
        ...args.localWorktreeGitOptions,
        deleteBranch: args.deleteBranch,
        overrideLock: true,
        knownRemovedWorktree: args.registeredWorktree
      })
    } else {
      await gitExecFileAsync(['worktree', 'prune'], {
        cwd: args.repoPath,
        ...args.localWorktreeGitOptions
      })
      result = preservedBranchResult(args.registeredWorktree, args.deleteBranch)
    }
  } catch (error) {
    removalError = error
  }

  // Why: Git prune exits successfully while retaining locked registrations;
  // a failed remove can also have detached the row before filesystem cleanup.
  try {
    await verifyGitWorktreeRegistrationRemoved(
      args.repoPath,
      args.localWorktreeGitOptions,
      args.canonicalWorktreePath
    )
  } catch (verificationError) {
    throw removalError
      ? staleRegistrationRecoveryError(removalError, args.canonicalWorktreePath)
      : verificationError
  }
  // Why: if Git detached the row before reporting its filesystem error, keep
  // the branch rather than guessing whether the normal branch cleanup ran.
  return result ?? preservedBranchResult(args.registeredWorktree, args.deleteBranch)
}

export async function recoverLocalWindowsLongPathWorktreeRemoval(
  args: LocalWindowsLongPathRecoveryArgs
): Promise<RemoveWorktreeResult | undefined> {
  if (!args.force || !isRecoverableWindowsFilesystemRemovalError(args.error)) {
    return undefined
  }

  // Why: watcher shutdown is best-effort, but Git registration must be removed
  // before callers clear Orca metadata or the branch remains locked.
  await args.closeWatcher(args.canonicalWorktreePath).catch(() => {})
  try {
    await removeLocalWorktreePath(args.canonicalWorktreePath, args.localWorktreeGitOptions)
  } catch (error) {
    throw new Error(formatWorktreeRemovalError(error, args.canonicalWorktreePath, true))
  }
  return removeRequiredGitWorktreeRegistration(args)
}

function isRecoverableWindowsFilesystemRemovalError(error: unknown): boolean {
  if (isWindowsLongPathWorktreeRemovalError(error)) {
    return true
  }
  if (process.platform !== 'win32' || typeof error !== 'object' || error === null) {
    return false
  }
  const errorWithDetails = error as { message?: unknown; stderr?: unknown; stdout?: unknown }
  const details = [errorWithDetails.stderr, errorWithDetails.stdout, errorWithDetails.message]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('\n')
  return /failed to delete .*(?:directory not empty|permission denied|access is denied|being used by another process)|(?:directory not empty|permission denied|access is denied|being used by another process).*failed to delete/i.test(
    details
  )
}

export async function removeStaleLocalWorktreeRegistrationAfterFilesystemRemoval(
  args: StaleLocalWorktreeRegistrationArgs
): Promise<RemoveWorktreeResult> {
  return removeRequiredGitWorktreeRegistration(args)
}
