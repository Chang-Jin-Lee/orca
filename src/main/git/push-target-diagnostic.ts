import type { GitPushTargetDiagnostic } from '../../shared/git-remote-error'
import type { GitRuntimeOptions } from './git-runtime-options'
import { gitOptionsForWorktree } from './git-runtime-options'
import { gitExecFileAsync } from './runner'

function isUrlValuedRemote(remote: string): boolean {
  return /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(remote) || /^[^@/:]+@[^:]+:.+/.test(remote)
}

async function getRemoteUrl(
  worktreePath: string,
  remote: string,
  options: GitRuntimeOptions = {}
): Promise<string | null> {
  if (isUrlValuedRemote(remote)) {
    return remote
  }
  try {
    const { stdout } = await gitExecFileAsync(
      ['remote', 'get-url', remote],
      gitOptionsForWorktree(worktreePath, options)
    )
    const value = stdout.trim()
    return value || null
  } catch {
    return null
  }
}

export async function createLocalPushTargetDiagnostic(
  worktreePath: string,
  target: Omit<GitPushTargetDiagnostic, 'remoteUrl' | 'originUrl'>,
  options: GitRuntimeOptions = {}
): Promise<GitPushTargetDiagnostic> {
  if (target.remote === 'origin') {
    const originUrl = await getRemoteUrl(worktreePath, 'origin', options)
    return {
      ...target,
      remoteUrl: originUrl,
      originUrl
    }
  }
  const [remoteUrl, originUrl] = await Promise.all([
    getRemoteUrl(worktreePath, target.remote, options),
    getRemoteUrl(worktreePath, 'origin', options)
  ])
  return {
    ...target,
    remoteUrl,
    originUrl
  }
}
