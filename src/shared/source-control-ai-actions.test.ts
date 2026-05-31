import { describe, expect, it } from 'vitest'
import {
  normalizeSourceControlAiActionDefaults,
  readSourceControlActionDefault,
  renderSourceControlActionCommandTemplate,
  resolveSourceControlActionCommandTemplate,
  setSourceControlActionAgentDefault
} from './source-control-ai-actions'

describe('source-control AI launch action defaults', () => {
  it('normalizes safe launch action defaults', () => {
    expect(
      normalizeSourceControlAiActionDefaults({
        fixChecks: { agentId: 'codex', commandInputTemplate: '  {basePrompt}  ' },
        resolveConflicts: { agentId: null },
        pullRequest: { agentId: 'claude' }
      })
    ).toEqual({
      fixChecks: { agentId: 'codex', commandInputTemplate: '  {basePrompt}  ' },
      resolveConflicts: { agentId: null },
      pullRequest: { agentId: 'claude' }
    })
  })

  it('rejects unsafe prototype keys and invalid agent ids', () => {
    expect(
      normalizeSourceControlAiActionDefaults({
        __proto__: { agentId: 'codex' },
        constructor: { agentId: 'codex' },
        prototype: { agentId: 'codex' },
        fixCommitFailure: { agentId: 'not-real', commandInputTemplate: 42 }
      })
    ).toBeUndefined()
  })

  it('trims command templates only when reading them', () => {
    const defaults = normalizeSourceControlAiActionDefaults({
      fixCommitFailure: { agentId: 'claude', commandInputTemplate: '  {basePrompt}  ' }
    })

    expect(defaults?.fixCommitFailure?.commandInputTemplate).toBe('  {basePrompt}  ')
    expect(readSourceControlActionDefault(defaults, 'fixCommitFailure')).toEqual({
      agentId: 'claude',
      commandInputTemplate: '{basePrompt}'
    })
  })

  it('preserves explicitly empty command templates when resolving defaults', () => {
    expect(
      resolveSourceControlActionCommandTemplate(
        { fixCommitFailure: { commandInputTemplate: '' } },
        'fixCommitFailure'
      )
    ).toBe('')
    expect(resolveSourceControlActionCommandTemplate(undefined, 'fixCommitFailure')).toBe(
      '{basePrompt}'
    )
  })

  it('sets agent defaults without dropping neighboring action defaults', () => {
    expect(
      setSourceControlActionAgentDefault(
        { fixChecks: { agentId: 'codex' } },
        'resolveConflicts',
        'claude'
      )
    ).toEqual({
      fixChecks: { agentId: 'codex' },
      resolveConflicts: { agentId: 'claude' }
    })
  })

  it('renders known template variables and leaves unknown variables visible', () => {
    expect(
      renderSourceControlActionCommandTemplate('fix {thing} with {missing}', {
        thing: 'CI'
      })
    ).toBe('fix CI with {missing}')
  })
})
