import type { BranchPrefixMode } from '../../shared/branch-prefix'
import {
  branchPrefixModeNeedsResolvedValue,
  normalizeBranchPrefixMode
} from '../../shared/branch-prefix'
import type { SshGitProvider } from '../providers/ssh-git-provider'
import { getSshGitAuthorPrefix, getSshGitUsername } from './git-username'
import { getBranchPrefixValue } from './repo'

export type BranchPrefixSettings = {
  branchPrefix: BranchPrefixMode | string
  branchPrefixCustom?: string
}

export function getNormalizedBranchPrefixMode(settings: BranchPrefixSettings): BranchPrefixMode {
  return normalizeBranchPrefixMode(settings.branchPrefix)
}

export function shouldResolveBranchPrefixValue(settings: BranchPrefixSettings): boolean {
  return branchPrefixModeNeedsResolvedValue(getNormalizedBranchPrefixMode(settings))
}

export function getLocalBranchPrefixValue(
  repoPath: string,
  settings: BranchPrefixSettings
): string {
  return getBranchPrefixValue(repoPath, getNormalizedBranchPrefixMode(settings))
}

export async function getSshBranchPrefixValue(
  provider: SshGitProvider,
  repoPath: string,
  settings: BranchPrefixSettings
): Promise<string> {
  const mode = getNormalizedBranchPrefixMode(settings)
  if (mode === 'github-username') {
    return getSshGitUsername(provider, repoPath)
  }
  if (mode === 'git-author') {
    return getSshGitAuthorPrefix(provider, repoPath)
  }
  return ''
}
