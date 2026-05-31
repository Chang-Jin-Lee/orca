import { describe, expect, it } from 'vitest'
import {
  applyCommitMessageGenerationDefaults,
  buildCommitMessageGenerationParams
} from './SourceControlCommitMessageGenerationDialog'

describe('buildCommitMessageGenerationParams', () => {
  it('preserves the resolved model and thinking level for the selected agent', () => {
    expect(
      buildCommitMessageGenerationParams({
        agentId: 'codex',
        commandTemplate: '{basePrompt}\n\nUse Conventional Commits.',
        baseParams: {
          agentId: 'codex',
          model: 'gpt-5.4-mini',
          thinkingLevel: 'xhigh',
          commandInputTemplate: '{basePrompt}',
          agentCommandOverride: 'codex'
        },
        settings: { agentCmdOverrides: { codex: 'codex --profile work' } }
      })
    ).toEqual({
      agentId: 'codex',
      model: 'gpt-5.4-mini',
      thinkingLevel: 'xhigh',
      commandInputTemplate: '{basePrompt}\n\nUse Conventional Commits.',
      agentCommandOverride: 'codex --profile work'
    })
  })

  it('keeps existing custom-command generation usable from the dialog', () => {
    expect(
      buildCommitMessageGenerationParams({
        agentId: 'custom',
        commandTemplate: '{basePrompt}\n\nPrefer ticket IDs.',
        baseParams: {
          agentId: 'custom',
          model: '',
          customPrompt: 'Prefer ticket IDs.',
          commandInputTemplate: '{basePrompt}\n\nPrefer ticket IDs.',
          customAgentCommand: 'my-commit-writer --prompt {prompt}'
        },
        settings: null
      })
    ).toEqual({
      agentId: 'custom',
      model: '',
      customPrompt: 'Prefer ticket IDs.',
      commandInputTemplate: '{basePrompt}\n\nPrefer ticket IDs.',
      customAgentCommand: 'my-commit-writer --prompt {prompt}'
    })
  })

  it('saves custom-command templates without replacing the inherited custom agent', () => {
    expect(
      applyCommitMessageGenerationDefaults(
        {
          enabled: true,
          agentId: 'custom',
          selectedModelByAgent: {},
          selectedThinkingByModel: {},
          customAgentCommand: 'my-commit-writer',
          instructionsByOperation: {},
          actions: {
            commitMessage: {
              agentId: 'codex',
              commandInputTemplate: '{basePrompt}'
            }
          }
        },
        'local',
        {
          agentId: 'custom',
          model: '',
          commandInputTemplate: '{basePrompt}\n\nPrefer ticket IDs.',
          customAgentCommand: 'my-commit-writer'
        }
      ).actions?.commitMessage
    ).toEqual({
      commandInputTemplate: '{basePrompt}\n\nPrefer ticket IDs.'
    })
  })
})
