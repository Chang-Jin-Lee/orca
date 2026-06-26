import {
  normalizeGitErrorMessage,
  type GitPushTargetDiagnostic
} from '../../shared/git-remote-error'
import { resolveEffectiveGitUpstream } from '../../shared/git-effective-upstream'
import { gitRefTargetsBranchOnRemote } from '../../shared/git-remote-branch-name'
import { resolveGitRemoteRebaseSource } from '../../shared/git-rebase-source'
import type { GitPushTarget } from '../../shared/types'
import {
  getConfiguredPushRemote,
  getGitConfigValue,
  type ConfiguredPushRemote
} from './configured-push-remote'
import type { GitRuntimeOptions } from './git-runtime-options'
import { gitOptionsForWorktree } from './git-runtime-options'
import { createLocalPushTargetDiagnostic } from './push-target-diagnostic'
import { validateGitPushTarget } from './push-target-validation'
import { gitExecFileAsync } from './runner'

type ResolvedPushTarget = {
  remote: string
  refspec: string
  branchName: string | null
  diagnostic: GitPushTargetDiagnostic
}

async function getConfiguredPushTarget(
  worktreePath: string,
  options: GitRuntimeOptions = {}
): Promise<ResolvedPushTarget | null> {
  try {
    const { stdout: branchStdout } = await gitExecFileAsync(
      ['symbolic-ref', '--quiet', '--short', 'HEAD'],
      gitOptionsForWorktree(worktreePath, options)
    )
    const branch = branchStdout.trim()
    if (!branch) {
      return null
    }

    const [pushRemote, { stdout: mergeStdout }] = await Promise.all([
      getConfiguredPushRemote(worktreePath, branch, options),
      gitExecFileAsync(
        ['config', '--get', `branch.${branch}.merge`],
        gitOptionsForWorktree(worktreePath, options)
      )
    ])
    const remote = pushRemote?.remote
    const mergeRef = mergeStdout.trim()
    const branchRef = mergeRef.replace(/^refs\/heads\//, '')
    if (!remote || !branchRef || remote === '.' || branchRef === mergeRef) {
      return null
    }
    if (await branchMergeTargetsConfiguredBase(worktreePath, branch, remote, branchRef, options)) {
      return null
    }
    if (!canPushConfiguredMergeBranch(pushRemote, branch, branchRef)) {
      return null
    }
    return {
      remote,
      refspec: `HEAD:${branchRef}`,
      branchName: branchRef,
      diagnostic: await createLocalPushTargetDiagnostic(
        worktreePath,
        {
          remote,
          branchName: branchRef,
          currentBranch: branch,
          branchPushRemote: pushRemote.branchPushRemote,
          branchRemote: pushRemote.branchRemoteValue,
          remotePushDefault: pushRemote.remotePushDefault
        },
        options
      )
    }
  } catch {
    return null
  }
}

async function branchMergeTargetsConfiguredBase(
  worktreePath: string,
  branch: string,
  remote: string,
  branchRef: string,
  options: GitRuntimeOptions = {}
): Promise<boolean> {
  return gitRefTargetsBranchOnRemote(
    await getGitConfigValue(worktreePath, `branch.${branch}.base`, options),
    remote,
    branchRef
  )
}

function canPushConfiguredMergeBranch(
  pushRemote: ConfiguredPushRemote | null,
  branch: string,
  branchRef: string
): boolean {
  if (!pushRemote) {
    return false
  }
  if (branchRef === branch) {
    return true
  }
  // Why: branch.merge belongs to branch.remote. A pushDefault fork must not
  // inherit origin/main as its destination branch.
  return pushRemote.remote !== 'origin' && pushRemote.branchRemote === pushRemote.remote
}

async function explicitPushTarget(
  worktreePath: string,
  target: GitPushTarget,
  options: GitRuntimeOptions = {}
): Promise<ResolvedPushTarget> {
  return {
    remote: target.remoteName,
    refspec: `HEAD:${target.branchName}`,
    branchName: target.branchName,
    diagnostic: await createLocalPushTargetDiagnostic(
      worktreePath,
      {
        remote: target.remoteName,
        branchName: target.branchName,
        explicit: true
      },
      options
    )
  }
}

export async function gitPush(
  worktreePath: string,
  _publish = false,
  pushTarget?: GitPushTarget,
  options: { forceWithLease?: boolean } & GitRuntimeOptions = {}
): Promise<void> {
  let targetDiagnostic: GitPushTargetDiagnostic | undefined
  try {
    if (pushTarget) {
      await validateGitPushTarget(worktreePath, pushTarget, options)
    }
    // Why: push to the branch's configured upstream when one exists. PR-created
    // worktrees can track a contributor fork remote; hardcoding origin here
    // would send review commits to the upstream repository instead.
    //
    // When no upstream exists, keep the existing first-publish behavior:
    // create/update origin/<current branch> and set it as upstream.
    //
    // Branch-vs-base reporting (the "Committed on Branch" section) is
    // unaffected because it uses branchCompare against an explicit baseRef
    // from worktree config, not the upstream relationship.
    const target = pushTarget
      ? await explicitPushTarget(worktreePath, pushTarget, options)
      : await getConfiguredPushTarget(worktreePath, options)
    targetDiagnostic = target?.diagnostic
    const args = [
      'push',
      ...(options.forceWithLease ? ['--force-with-lease'] : []),
      '--set-upstream',
      ...(target ? [target.remote, target.refspec] : ['origin', 'HEAD'])
    ]
    await gitExecFileAsync(args, gitOptionsForWorktree(worktreePath, options))
  } catch (error) {
    throw new Error(normalizeGitErrorMessage(error, 'push', targetDiagnostic))
  }
}

async function gitPullWithArgs(
  worktreePath: string,
  pullArgs: string[],
  pushTarget?: GitPushTarget,
  options: GitRuntimeOptions = {}
): Promise<void> {
  try {
    if (pushTarget) {
      const target = await validateGitPushTarget(worktreePath, pushTarget, options)
      await gitExecFileAsync(
        ['pull', ...pullArgs, target.remoteName, target.branchName],
        gitOptionsForWorktree(worktreePath, options)
      )
      return
    }
    const upstream = await resolveEffectiveGitUpstream((args) =>
      gitExecFileAsync(args, gitOptionsForWorktree(worktreePath, options))
    )
    if (upstream && !upstream.isConfiguredUpstream) {
      // Why: legacy Orca branches may still track origin/main while pushes
      // target origin/<branch>. Pull the same effective branch the UI reports.
      await gitExecFileAsync(
        ['pull', ...pullArgs, upstream.remoteName, upstream.branchName],
        gitOptionsForWorktree(worktreePath, options)
      )
      return
    }

    await gitExecFileAsync(['pull', ...pullArgs], gitOptionsForWorktree(worktreePath, options))
  } catch (error) {
    throw new Error(normalizeGitErrorMessage(error, 'pull'))
  }
}

export async function gitPull(
  worktreePath: string,
  pushTarget?: GitPushTarget,
  options: GitRuntimeOptions = {}
): Promise<void> {
  // Why: plain `git pull` uses the user's configured pull strategy (merge by
  // default) so diverged branches reconcile instead of erroring out. Conflicts
  // surface through the existing conflict-resolution flow.
  await gitPullWithArgs(worktreePath, [], pushTarget, options)
}

export async function gitFastForward(
  worktreePath: string,
  pushTarget?: GitPushTarget,
  options: GitRuntimeOptions = {}
): Promise<void> {
  await gitPullWithArgs(worktreePath, ['--ff-only'], pushTarget, options)
}

export async function gitPullRebaseFromBase(
  worktreePath: string,
  baseRef: string,
  options: GitRuntimeOptions = {}
): Promise<void> {
  try {
    const source = await resolveGitRemoteRebaseSource(
      (args) => gitExecFileAsync(args, gitOptionsForWorktree(worktreePath, options)),
      baseRef
    )
    await gitExecFileAsync(
      ['pull', '--rebase', source.remoteName, source.branchName],
      gitOptionsForWorktree(worktreePath, options)
    )
  } catch (error) {
    throw new Error(normalizeGitErrorMessage(error, 'pull'))
  }
}

export async function gitFetch(
  worktreePath: string,
  pushTarget?: GitPushTarget,
  options: GitRuntimeOptions = {}
): Promise<void> {
  try {
    if (pushTarget) {
      const target = await validateGitPushTarget(worktreePath, pushTarget, options)
      await gitExecFileAsync(
        ['fetch', '--prune', target.remoteName],
        gitOptionsForWorktree(worktreePath, options)
      )
      return
    }
    await gitExecFileAsync(['fetch', '--prune'], gitOptionsForWorktree(worktreePath, options))
  } catch (error) {
    throw new Error(normalizeGitErrorMessage(error, 'fetch'))
  }
}
