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

type LocalWindowsRemovalRecoveryArgs = {
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
  LocalWindowsRemovalRecoveryArgs,
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

function staleRegistrationRecoveryError(
  error: unknown,
  canonicalWorktreePath: string,
  force: boolean
): Error {
  return new Error(
    `${formatWorktreeRemovalError(
      error,
      canonicalWorktreePath,
      force
    )} The worktree directory was removed, but Git still has stale worktree registration. Retry deletion after resolving the Git registration error.`
  )
}

async function verifyGitWorktreeRegistrationRemoved(
  repoPath: string,
  localWorktreeGitOptions: GitWorktreeExecOptions,
  canonicalWorktreePath: string,
  force: boolean
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
    throw staleRegistrationRecoveryError(error, canonicalWorktreePath, force)
  }
}

async function removeRequiredGitWorktreeRegistration(
  args: StaleLocalWorktreeRegistrationArgs,
  forceForError = true
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
      args.canonicalWorktreePath,
      forceForError
    )
  } catch (verificationError) {
    throw removalError
      ? staleRegistrationRecoveryError(removalError, args.canonicalWorktreePath, forceForError)
      : verificationError
  }
  // Why: if Git detached the row before reporting its filesystem error, keep
  // the branch rather than guessing whether the normal branch cleanup ran.
  return result ?? preservedBranchResult(args.registeredWorktree, args.deleteBranch)
}

export async function recoverLocalWindowsWorktreeRemoval(
  args: LocalWindowsRemovalRecoveryArgs
): Promise<RemoveWorktreeResult | undefined> {
  if (!(await isRecoverableWindowsFilesystemRemovalFailure(args))) {
    return undefined
  }

  // Why: this error means Git accepted removal and started deleting the path;
  // finish that partial success with Windows retries, then verify Git metadata.
  await args.closeWatcher(args.canonicalWorktreePath).catch(() => {})
  try {
    await removeLocalWorktreePath(args.canonicalWorktreePath, args.localWorktreeGitOptions)
  } catch (error) {
    throw new Error(formatWorktreeRemovalError(error, args.canonicalWorktreePath, args.force))
  }
  return removeRequiredGitWorktreeRegistration(args, args.force)
}

async function isRecoverableWindowsFilesystemRemovalFailure(
  args: LocalWindowsRemovalRecoveryArgs
): Promise<boolean> {
  if (isWindowsLongPathWorktreeRemovalError(args.error)) {
    return true
  }
  if (process.platform !== 'win32' || typeof args.error !== 'object' || args.error === null) {
    return false
  }
  const errorWithDetails = args.error as {
    message?: unknown
    stderr?: unknown
    stdout?: unknown
  }
  const details = [errorWithDetails.stderr, errorWithDetails.stdout, errorWithDetails.message]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('\n')
  if (
    /failed to delete .*(?:directory not empty|permission denied|access is denied|being used by another process)|(?:directory not empty|permission denied|access is denied|being used by another process).*failed to delete/i.test(
      details
    )
  ) {
    return true
  }

  try {
    const worktrees = await listWorktreesStrict(args.repoPath, args.localWorktreeGitOptions)
    // Why: Git can localize ENOTEMPTY prose, but a missing registration proves
    // it already accepted removal and only Windows filesystem cleanup remains.
    return !worktrees.some((worktree) =>
      areWorktreePathsEqual(worktree.path, args.canonicalWorktreePath)
    )
  } catch {
    return false
  }
}

export async function removeStaleLocalWorktreeRegistrationAfterFilesystemRemoval(
  args: StaleLocalWorktreeRegistrationArgs
): Promise<RemoveWorktreeResult> {
  return removeRequiredGitWorktreeRegistration(args)
}
