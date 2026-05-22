import type { SshGitProvider } from '../providers/ssh-git-provider'

const EXPLICIT_USERNAME_CONFIG_KEYS = ['github.user', 'user.username'] as const
const GIT_AUTHOR_CONFIG_KEYS = ['user.name', 'user.email'] as const

export function normalizeGitUsername(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const localPart = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed
  return localPart
    .replace(/^\d+\+/, '')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
}

async function getSshGitConfigValue(
  provider: SshGitProvider,
  repoPath: string,
  key: string
): Promise<string> {
  try {
    const { stdout } = await provider.exec(['config', '--get', key], repoPath)
    return stdout.trim()
  } catch {
    // Missing config keys are expected; callers try the next candidate.
    return ''
  }
}

async function getSshGitConfigPrefix(
  provider: SshGitProvider,
  repoPath: string,
  keys: readonly string[]
): Promise<string> {
  for (const key of keys) {
    const username = normalizeGitUsername(await getSshGitConfigValue(provider, repoPath, key))
    if (username) {
      return username
    }
  }
  return ''
}

export async function getSshGitUsername(
  provider: SshGitProvider,
  repoPath: string
): Promise<string> {
  // Why: SSH targets cannot rely on the local `gh` account, and git email/name
  // are author identity rather than hosted-account usernames.
  return getSshGitConfigPrefix(provider, repoPath, EXPLICIT_USERNAME_CONFIG_KEYS)
}

export async function getSshGitAuthorPrefix(
  provider: SshGitProvider,
  repoPath: string
): Promise<string> {
  return getSshGitConfigPrefix(provider, repoPath, GIT_AUTHOR_CONFIG_KEYS)
}
