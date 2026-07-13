import { describe, expect, it, vi } from 'vitest'

import { formatCliError, reportCliError } from './format'
import { RuntimeClientError, RuntimeRpcFailureError } from './runtime-client'

describe('CLI error recovery', () => {
  it('renders human command suggestions separately from safe next steps', () => {
    const error = new RuntimeClientError('invalid_argument', 'Unknown command: worktree lst', {
      suggestions: ['worktree list'],
      nextSteps: ['Run `orca help` to inspect available commands.']
    })

    const output = formatCliError(error)

    expect(output).toContain('Unknown command: worktree lst')
    expect(output).toContain('Did you mean: orca worktree list')
    expect(output).toContain('Next step: Run `orca help`')
  })

  it('renders human flag suggestions separately from safe next steps', () => {
    const error = new RuntimeClientError('invalid_argument', 'Unknown flag --forcce', {
      validFlags: ['force', 'json'],
      suggestions: ['force'],
      nextSteps: ['Run `orca help computer click` to inspect supported flags.']
    })

    const output = formatCliError(error, { commandPath: ['computer', 'click'] })

    expect(output).toContain('Did you mean: --force')
    expect(output).toContain('Next step: Run `orca help computer click`')
    expect(output).not.toContain('Fix the command flags or RPC params')
  })

  it('strips human-only guesses from local JSON errors', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = new RuntimeClientError('invalid_argument', 'Unknown command: worktree lst', {
      suggestions: ['worktree list'],
      nextSteps: ['Run `orca help` to inspect available commands.']
    })

    reportCliError(error, true)

    const output = logSpy.mock.calls.flat().join('\n')
    expect(output).not.toContain('worktree list')
    expect(output).toContain('Run `orca help`')
    logSpy.mockRestore()
  })

  it('prefers RPC recovery over generic computer hints in text output', () => {
    const error = new RuntimeRpcFailureError({
      id: 'req_rpc_recovery',
      ok: false,
      error: {
        code: 'invalid_argument',
        message: 'Unknown runtime argument',
        data: { nextSteps: ['Use the runtime-specific option'] }
      },
      _meta: { runtimeId: 'runtime_local' }
    })

    const output = formatCliError(error, { commandPath: ['computer', 'click'] })

    expect(output).toContain('Next step: Use the runtime-specific option')
    expect(output).not.toContain('Fix the command flags or RPC params')
  })

  it('keeps generic computer hints when an RPC error has no recovery data', () => {
    const error = new RuntimeRpcFailureError({
      id: 'req_rpc_fallback',
      ok: false,
      error: { code: 'invalid_argument', message: 'Invalid computer argument' },
      _meta: { runtimeId: 'runtime_local' }
    })

    const output = formatCliError(error, { commandPath: ['computer', 'click'] })

    expect(output).toContain('Fix the command flags or RPC params')
  })
})
