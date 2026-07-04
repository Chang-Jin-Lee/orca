import type { GitPushTarget } from './types'

export type ComposerBranchSelection = {
  baseBranch: string
  branchNameOverride: string | undefined
  branchAutoName: string
  name: string | undefined
  lastAutoName: string | undefined
}

export function resolveComposerBranchSelection(args: {
  refName: string
  localBranchName: string
  currentName: string
  lastAutoName: string
}): ComposerBranchSelection {
  const trimmedCurrentName = args.currentName.trim()
  const shouldAutoName =
    !trimmedCurrentName ||
    args.currentName === args.lastAutoName ||
    args.localBranchName.startsWith(trimmedCurrentName) ||
    args.refName.startsWith(trimmedCurrentName)
  if (!shouldAutoName) {
    return {
      baseBranch: args.refName,
      branchNameOverride: undefined,
      branchAutoName: '',
      name: undefined,
      lastAutoName: undefined
    }
  }
  return {
    baseBranch: args.refName,
    branchNameOverride: args.localBranchName,
    branchAutoName: args.localBranchName,
    name: args.localBranchName,
    lastAutoName: args.localBranchName
  }
}

/**
 * True when `branchName` is already checked out in one of the given worktree
 * branch refs (which may be `refs/heads/foo` or short `foo`). Git refuses to
 * check out a branch in two worktrees, so such a branch cannot be reused.
 */
export function isBranchCheckedOutInWorktrees(
  branchName: string,
  worktreeBranches: readonly string[]
): boolean {
  return worktreeBranches.some((ref) => ref.replace(/^refs\/heads\//, '') === branchName)
}

/**
 * Issue #5181: decide whether a picked branch row is an existing LOCAL branch
 * that can be reused (checked out) instead of branched off, and whether reuse
 * should default ON.
 *
 * Reuse is only possible for a LOCAL branch (ref === local name; remote-only
 * refs carry an `origin/`-style prefix) that is NOT already checked out in
 * another worktree — git allows a branch in only one worktree at a time. Reuse
 * defaults ON only when the worktree name was auto-derived from the branch (the
 * selection produced a branch-name override); a user who typed a custom
 * worktree name first is branching off the ref, so reuse stays OFF unless they
 * opt in.
 */
export function resolveComposerBranchReuse(args: {
  refName: string
  localBranchName: string
  selectionProducedOverride: boolean
  branchCheckedOutElsewhere: boolean
}): { reuseEligibleBranch: string | null; defaultReuse: boolean } {
  const reuseEligibleBranch =
    args.refName === args.localBranchName && !args.branchCheckedOutElsewhere
      ? args.localBranchName
      : null
  return {
    reuseEligibleBranch,
    defaultReuse: reuseEligibleBranch !== null && args.selectionProducedOverride
  }
}

/**
 * Issue #5181: the branch-name override to apply for a picked branch. A local
 * branch already checked out in another worktree can't be reused, so it must
 * NOT be pinned as the override — pinning it would collide and silently produce
 * a suffixed branch. In that case fall back to letting the worktree name derive
 * a fresh branch from the selected ref as base; otherwise use the selection's
 * override unchanged.
 */
export function resolveComposerReuseOverride(args: {
  refName: string
  localBranchName: string
  branchNameOverride: string | undefined
  branchCheckedOutElsewhere: boolean
}): string | undefined {
  if (args.branchCheckedOutElsewhere && args.refName === args.localBranchName) {
    return undefined
  }
  return args.branchNameOverride
}

/**
 * True when `name` is a branch ref `git check-ref-format --branch` would
 * accept. Mirrors git's rules synchronously so branch mode can preserve a
 * slash-containing typed name only when git will actually take it — an invalid
 * name (space, trailing slash, `..`, etc.) must fall back to the sanitized-name
 * derivation instead of being passed verbatim and aborting worktree creation.
 */
function isValidGitBranchName(name: string): boolean {
  if (name.length === 0 || name.startsWith('-')) {
    return false
  }
  if (name.startsWith('/') || name.endsWith('/') || name.includes('//')) {
    return false
  }
  if (name.endsWith('.') || name.includes('..') || name.includes('@{') || name === '@') {
    return false
  }
  // Disallowed: control chars, space, and ~ ^ : ? * [ \ DEL.
  // eslint-disable-next-line no-control-regex -- Why: git rejects control chars in refs.
  if (/[\x00-\x20\x7f~^:?*[\\]/.test(name)) {
    return false
  }
  return !name
    .split('/')
    .some((segment) => segment.length === 0 || segment.startsWith('.') || segment.endsWith('.lock'))
}

/**
 * The branch-name override to apply when creating a worktree from the composer.
 *
 * With no resolver-provided override, branch mode (#6721) keeps a
 * slash-containing typed name as the git branch — validated downstream by
 * `git check-ref-format` — while the worktree folder name is sanitized
 * separately; every other mode leaves the branch to be derived from the
 * sanitized name. With an override, keep it verbatim when the workspace name is
 * user-edited (`preserveWorkspaceNameEdits`) or still matches the auto-name.
 */
export function resolveComposerBranchNameOverrideForCreate(args: {
  branchNameOverride: string | undefined
  branchAutoName: string
  workspaceName: string
  preserveWorkspaceNameEdits: boolean
  createBranchFromWorkspaceName?: boolean
}): string | undefined {
  if (!args.branchNameOverride) {
    // Why: branch mode keeps slash-containing git branch names while the
    // workspace folder name may still be sanitized separately. Only preserve
    // names git will accept as a ref — otherwise fall back to the sanitized
    // derivation so `check-ref-format` doesn't reject the override and abort.
    return args.createBranchFromWorkspaceName &&
      args.workspaceName.includes('/') &&
      isValidGitBranchName(args.workspaceName)
      ? args.workspaceName
      : undefined
  }
  if (args.preserveWorkspaceNameEdits) {
    return args.branchNameOverride
  }
  return args.workspaceName === args.branchAutoName ? args.branchNameOverride : undefined
}

export function resolveComposerManualBranchNameChange(args: {
  value: string | undefined
  pushTarget: GitPushTarget | undefined
  forkPushWarning: string | null
}): {
  branchNameOverride: string | undefined
  pushTarget: GitPushTarget | undefined
  forkPushWarning: string | null
} {
  const branchNameOverride = args.value?.trim() || undefined
  if (args.pushTarget && args.pushTarget.branchName !== branchNameOverride) {
    return {
      branchNameOverride,
      pushTarget: undefined,
      forkPushWarning: null
    }
  }
  return {
    branchNameOverride,
    pushTarget: args.pushTarget,
    forkPushWarning: args.forkPushWarning
  }
}
