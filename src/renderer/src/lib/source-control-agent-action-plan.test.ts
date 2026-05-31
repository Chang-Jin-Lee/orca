import { describe, expect, it } from 'vitest'
import { planSourceControlAgentActionLaunch } from './source-control-agent-action-plan'

describe('planSourceControlAgentActionLaunch', () => {
  it('rejects disabled agents', () => {
    expect(
      planSourceControlAgentActionLaunch({
        agent: 'codex',
        commandInput: 'Fix checks',
        promptDelivery: 'submit-after-ready',
        detectedAgents: ['codex'],
        disabledAgents: ['codex'],
        platform: 'darwin'
      })
    ).toEqual({ ok: false, error: 'The selected agent is disabled in Settings.' })
  })

  it('rejects agents not detected on the current host', () => {
    expect(
      planSourceControlAgentActionLaunch({
        agent: 'claude',
        commandInput: 'Fix checks',
        promptDelivery: 'submit-after-ready',
        detectedAgents: ['codex'],
        platform: 'linux'
      })
    ).toEqual({ ok: false, error: 'The selected agent was not detected on this workspace host.' })
  })

  it('mirrors submit-after-ready delivery without embedding the prompt in the command', () => {
    const result = planSourceControlAgentActionLaunch({
      agent: 'codex',
      commandInput: 'Fix checks',
      promptDelivery: 'submit-after-ready',
      detectedAgents: ['codex'],
      platform: 'linux'
    })

    expect(result.ok && result.delivery).toBe('paste-submit')
    expect(result.ok && result.commandLabel).toBe('codex')
    expect(result.ok && result.summary).toContain('pastes and submits')
    expect(result.ok && result.caveat).toContain('PATH')
  })

  it('uses native draft launch when the selected agent supports it', () => {
    const result = planSourceControlAgentActionLaunch({
      agent: 'claude',
      commandInput: 'Fix checks',
      promptDelivery: 'draft',
      detectedAgents: ['claude'],
      platform: 'darwin'
    })

    expect(result.ok && result.delivery).toBe('draft-native')
    expect(result.ok && result.commandLabel).toContain('--prefill')
  })
})
