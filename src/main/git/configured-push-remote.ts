import type { GitRuntimeOptions } from './git-runtime-options'
import { gitOptionsForWorktree } from './git-runtime-options'
import { gitExecFileAsync } from './runner'

export type ConfiguredPushRemote = {
  remote: string
  branchRemote: string | null
  branchPushRemote: string | null
  branchRemoteValue: string | null
  remotePushDefault: string | null
}

export async function getGitConfigValue(
  worktreePath: string,
  key: string,
  options: GitRuntimeOptions = {}
): Promise<string | null> {
  try {
    const { stdout } = await gitExecFileAsync(
      ['config', '--get', key],
      gitOptionsForWorktree(worktreePath, options)
    )
    const value = stdout.trim()
    return value || null
  } catch {
    return null
  }
}

function isUrlValuedRemote(remote: string): boolean {
  return /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(remote) || /^[^@/:]+@[^:]+:.+/.test(remote)
}

async function findRemoteNameForUrl(
  worktreePath: string,
  remoteUrl: string,
  options: GitRuntimeOptions = {}
): Promise<string | null> {
  try {
    const { stdout } = await gitExecFileAsync(
      ['remote'],
      gitOptionsForWorktree(worktreePath, options)
    )
    const remotes = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    for (const remoteName of remotes) {
      try {
        const { stdout: urlStdout } = await gitExecFileAsync(
          ['remote', 'get-url', remoteName],
          gitOptionsForWorktree(worktreePath, options)
        )
        if (urlStdout.trim() === remoteUrl) {
          return remoteName
        }
      } catch {
        // Ignore a remote that disappeared or has no fetch URL.
      }
    }
  } catch {
    return null
  }
  return null
}

async function normalizePushRemote(
  worktreePath: string,
  remote: string,
  options: GitRuntimeOptions = {}
): Promise<string> {
  if (!isUrlValuedRemote(remote)) {
    return remote
  }
  return (await findRemoteNameForUrl(worktreePath, remote, options)) ?? remote
}

export async function getConfiguredPushRemote(
  worktreePath: string,
  branch: string,
  options: GitRuntimeOptions = {}
): Promise<ConfiguredPushRemote | null> {
  const [branchRemote, branchPushRemote, remotePushDefault] = await Promise.all([
    getGitConfigValue(worktreePath, `branch.${branch}.remote`, options),
    getGitConfigValue(worktreePath, `branch.${branch}.pushRemote`, options),
    getGitConfigValue(worktreePath, 'remote.pushDefault', options)
  ])
  const remote = branchPushRemote ?? remotePushDefault ?? branchRemote
  if (!remote) {
    return null
  }
  return {
    remote: await normalizePushRemote(worktreePath, remote, options),
    branchRemote: branchRemote
      ? await normalizePushRemote(worktreePath, branchRemote, options)
      : null,
    branchPushRemote,
    branchRemoteValue: branchRemote,
    remotePushDefault
  }
}
