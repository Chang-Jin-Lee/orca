export const BRANCH_PREFIX_MODES = ['github-username', 'git-author', 'custom', 'none'] as const

export type BranchPrefixMode = (typeof BRANCH_PREFIX_MODES)[number]
export type LegacyBranchPrefixMode = 'git-username'

export function normalizeBranchPrefixMode(value: unknown): BranchPrefixMode {
  if (value === 'git-username') {
    // Why: the old label meant "GitHub username" in user-facing settings.
    // Preserve existing preferences while making the semantics explicit.
    return 'github-username'
  }
  return BRANCH_PREFIX_MODES.includes(value as BranchPrefixMode)
    ? (value as BranchPrefixMode)
    : 'github-username'
}

export function branchPrefixModeNeedsResolvedValue(mode: BranchPrefixMode): boolean {
  return mode === 'github-username' || mode === 'git-author'
}
