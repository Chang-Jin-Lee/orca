import { describe, expect, it } from 'vitest'
import { applyTerminalGitCredentialPromptGuard } from './terminal-git-credential-guard'

// The load-bearing markers against Git Credential Manager's OAuth popup.
function isGuarded(env: Record<string, string>): boolean {
  return env.GIT_TERMINAL_PROMPT === '0' && env.GCM_INTERACTIVE === 'never'
}

describe('applyTerminalGitCredentialPromptGuard', () => {
  it('guards an agent terminal on every platform, even when user-terminal suppression is off', () => {
    for (const platform of ['win32', 'darwin', 'linux'] as const) {
      const env: Record<string, string> = { PATH: '/usr/bin' }
      applyTerminalGitCredentialPromptGuard(env, {
        launchCommand: 'claude',
        suppressUserTerminalPrompt: false,
        platform
      })
      expect(isGuarded(env), platform).toBe(true)
      // Never empties the credential helper — cached auth must keep working.
      expect(env.GIT_CONFIG_COUNT).toBeDefined()
      expect(Object.values(env)).not.toContain('credential.helper')
    }
  })

  it('guards a plain user terminal by default on a Windows host', () => {
    const env: Record<string, string> = { PATH: '/usr/bin' }
    applyTerminalGitCredentialPromptGuard(env, {
      launchCommand: undefined,
      suppressUserTerminalPrompt: true,
      platform: 'win32'
    })
    expect(isGuarded(env)).toBe(true)
  })

  it('registers the guard in WSLENV on Windows so WSL-routed git sees it too', () => {
    const env: Record<string, string> = { PATH: '/usr/bin' }
    applyTerminalGitCredentialPromptGuard(env, {
      launchCommand: undefined,
      suppressUserTerminalPrompt: true,
      platform: 'win32'
    })
    const wslenvKeys = (env.WSLENV ?? '').split(':')
    expect(wslenvKeys).toContain('GIT_TERMINAL_PROMPT')
    expect(wslenvKeys).toContain('GCM_INTERACTIVE')
    expect(wslenvKeys).toContain('GIT_CONFIG_COUNT')
    expect(wslenvKeys).toContain('GIT_CONFIG_KEY_0')
    expect(wslenvKeys).toContain('GIT_CONFIG_VALUE_0')
    // Windows askpass paths are meaningless inside a distro.
    expect(wslenvKeys).not.toContain('GIT_ASKPASS')
    expect(wslenvKeys).not.toContain('SSH_ASKPASS')
  })

  it('guards a headless one-shot agent launch — it can answer a prompt even less than a TUI', () => {
    const env: Record<string, string> = { PATH: '/usr/bin' }
    applyTerminalGitCredentialPromptGuard(env, {
      launchCommand: 'claude -p "fix the tests"',
      suppressUserTerminalPrompt: false,
      platform: 'darwin'
    })
    expect(isGuarded(env)).toBe(true)
  })

  it('never materializes an empty askpass into a sparse daemon wire env, but keeps a caller-set one', () => {
    const sparse: Record<string, string> = { PATH: '/usr/bin' }
    applyTerminalGitCredentialPromptGuard(sparse, {
      launchCommand: 'claude',
      suppressUserTerminalPrompt: true,
      platform: 'win32'
    })
    expect(sparse.GIT_ASKPASS).toBeUndefined()
    expect(sparse.SSH_ASKPASS).toBeUndefined()

    const withAskpass: Record<string, string> = { PATH: '/usr/bin', GIT_ASKPASS: 'C:\\feeder.exe' }
    applyTerminalGitCredentialPromptGuard(withAskpass, {
      launchCommand: 'claude',
      suppressUserTerminalPrompt: true,
      platform: 'win32'
    })
    expect(withAskpass.GIT_ASKPASS).toBe('C:\\feeder.exe')
  })

  it('never rewrites the terminal locale — the git-runner locale pins must not leak into a shell', () => {
    const env: Record<string, string> = { PATH: '/usr/bin', LC_ALL: 'ja_JP.UTF-8' }
    applyTerminalGitCredentialPromptGuard(env, {
      launchCommand: 'claude',
      suppressUserTerminalPrompt: true,
      platform: 'win32'
    })
    expect(isGuarded(env)).toBe(true)
    expect(env.LC_ALL).toBe('ja_JP.UTF-8')
    expect(env.LANG).toBeUndefined()
    expect(env.LANGUAGE).toBeUndefined()
  })

  it('leaves a user terminal untouched on non-Windows hosts — no popup exists there, only working tty prompts', () => {
    for (const platform of ['darwin', 'linux'] as const) {
      const env: Record<string, string> = { PATH: '/usr/bin' }
      applyTerminalGitCredentialPromptGuard(env, {
        launchCommand: '/bin/zsh',
        suppressUserTerminalPrompt: true,
        platform
      })
      expect(env, platform).toEqual({ PATH: '/usr/bin' })
    }
  })

  it('leaves a Windows user terminal untouched when the user opts out', () => {
    const env: Record<string, string> = { PATH: '/usr/bin' }
    applyTerminalGitCredentialPromptGuard(env, {
      launchCommand: '/bin/zsh',
      suppressUserTerminalPrompt: false,
      platform: 'win32'
    })
    expect(env.GIT_TERMINAL_PROMPT).toBeUndefined()
    expect(env.GCM_INTERACTIVE).toBeUndefined()
    expect(env).toEqual({ PATH: '/usr/bin' })
  })
})
