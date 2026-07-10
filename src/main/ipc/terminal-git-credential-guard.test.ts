import { describe, expect, it } from 'vitest'
import { applyTerminalGitCredentialPromptGuard } from './terminal-git-credential-guard'

// The load-bearing markers against Git Credential Manager's OAuth popup.
function isGuarded(env: Record<string, string>): boolean {
  return env.GIT_TERMINAL_PROMPT === '0' && env.GCM_INTERACTIVE === 'never'
}

describe('applyTerminalGitCredentialPromptGuard', () => {
  it('guards an agent terminal even when user-terminal suppression is off', () => {
    const env: Record<string, string> = { PATH: '/usr/bin' }
    applyTerminalGitCredentialPromptGuard(env, {
      launchCommand: 'claude',
      suppressUserTerminalPrompt: false
    })
    expect(isGuarded(env)).toBe(true)
    // Never empties the credential helper — cached auth must keep working.
    expect(env.GIT_CONFIG_COUNT).toBeDefined()
    expect(Object.values(env)).not.toContain('credential.helper')
  })

  it('guards a plain user terminal by default (suppression on)', () => {
    const env: Record<string, string> = { PATH: '/usr/bin' }
    applyTerminalGitCredentialPromptGuard(env, {
      launchCommand: undefined,
      suppressUserTerminalPrompt: true
    })
    expect(isGuarded(env)).toBe(true)
  })

  it('leaves a plain user terminal untouched when the user opts out', () => {
    const env: Record<string, string> = { PATH: '/usr/bin' }
    applyTerminalGitCredentialPromptGuard(env, {
      launchCommand: '/bin/zsh',
      suppressUserTerminalPrompt: false
    })
    expect(env.GIT_TERMINAL_PROMPT).toBeUndefined()
    expect(env.GCM_INTERACTIVE).toBeUndefined()
    expect(env).toEqual({ PATH: '/usr/bin' })
  })
})
