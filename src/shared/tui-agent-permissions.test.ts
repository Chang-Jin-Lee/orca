import { describe, expect, it } from 'vitest'
import {
  applyAgentPermissionMode,
  resolveAgentPermissionModeSummary,
  resolveTuiAgentPermissionMode,
  AUTO_TUI_AGENT_ARGS,
  YOLO_TUI_AGENT_ARGS,
  YOLO_TUI_AGENT_ENV
} from './tui-agent-permissions'

describe('tui agent permissions', () => {
  it('recognizes the current default profile as yolo', () => {
    expect(
      resolveAgentPermissionModeSummary({
        agentDefaultArgs: YOLO_TUI_AGENT_ARGS,
        agentDefaultEnv: YOLO_TUI_AGENT_ENV
      })
    ).toBe('yolo')
  })

  it('recognizes an empty profile as manual', () => {
    expect(resolveAgentPermissionModeSummary({ agentDefaultArgs: {}, agentDefaultEnv: {} })).toBe(
      'manual'
    )
  })

  it('preserves custom agent arguments when applying manual mode', () => {
    const result = applyAgentPermissionMode({
      mode: 'manual',
      agentDefaultArgs: {
        claude: '--dangerously-skip-permissions',
        codex: '--model gpt-5'
      },
      agentDefaultEnv: YOLO_TUI_AGENT_ENV
    })

    expect(result.agentDefaultArgs.claude).toBe('')
    expect(result.agentDefaultArgs.codex).toBe('--model gpt-5')
    expect(result.agentDefaultEnv.goose).toEqual({})
  })

  it('reports mixed when custom arguments are present', () => {
    expect(
      resolveAgentPermissionModeSummary({
        agentDefaultArgs: {
          ...YOLO_TUI_AGENT_ARGS,
          codex: '--model gpt-5'
        },
        agentDefaultEnv: YOLO_TUI_AGENT_ENV
      })
    ).toBe('mixed')
  })

  it('resolves one Codex yolo launch as yolo', () => {
    expect(
      resolveTuiAgentPermissionMode({
        agent: 'codex',
        agentArgs: YOLO_TUI_AGENT_ARGS.codex,
        agentEnv: {}
      })
    ).toBe('yolo')
  })

  it('resolves one empty Codex launch as manual', () => {
    expect(resolveTuiAgentPermissionMode({ agent: 'codex', agentArgs: '', agentEnv: {} })).toBe(
      'manual'
    )
  })

  it('resolves custom Codex permission arguments as mixed', () => {
    expect(
      resolveTuiAgentPermissionMode({
        agent: 'codex',
        agentArgs: '--ask-for-approval on-request',
        agentEnv: {}
      })
    ).toBe('mixed')
  })

  it('resolves env-driven yolo launches', () => {
    expect(
      resolveTuiAgentPermissionMode({
        agent: 'goose',
        agentArgs: '',
        agentEnv: YOLO_TUI_AGENT_ENV.goose
      })
    ).toBe('yolo')
  })

  it('resolves the Claude and Codex intermediate launches as auto', () => {
    expect(
      resolveTuiAgentPermissionMode({
        agent: 'claude',
        agentArgs: '--permission-mode auto',
        agentEnv: {}
      })
    ).toBe('auto')
    expect(
      resolveTuiAgentPermissionMode({ agent: 'codex', agentArgs: '--full-auto', agentEnv: {} })
    ).toBe('auto')
  })

  it('round-trips the auto profile through apply and resolve', () => {
    const applied = applyAgentPermissionMode({
      mode: 'auto',
      agentDefaultArgs: YOLO_TUI_AGENT_ARGS,
      agentDefaultEnv: YOLO_TUI_AGENT_ENV
    })

    expect(applied.agentDefaultArgs.claude).toBe(AUTO_TUI_AGENT_ARGS.claude)
    expect(applied.agentDefaultArgs.codex).toBe(AUTO_TUI_AGENT_ARGS.codex)
    expect(resolveAgentPermissionModeSummary(applied)).toBe('auto')
  })

  it('leaves agents without a vendor intermediate mode on manual under auto', () => {
    const applied = applyAgentPermissionMode({
      mode: 'auto',
      agentDefaultArgs: YOLO_TUI_AGENT_ARGS,
      agentDefaultEnv: YOLO_TUI_AGENT_ENV
    })

    // Why: guessing a middle flag for these would ship a launch string no vendor
    // documents, so auto has to degrade to manual rather than stay permissive.
    expect(applied.agentDefaultArgs.gemini).toBe('')
    expect(applied.agentDefaultArgs.cursor).toBe('')
    expect(applied.agentDefaultEnv.goose).toEqual({})
  })

  it('switches back out of auto without stranding the intermediate flags', () => {
    const auto = applyAgentPermissionMode({
      mode: 'auto',
      agentDefaultArgs: YOLO_TUI_AGENT_ARGS,
      agentDefaultEnv: YOLO_TUI_AGENT_ENV
    })
    const backToYolo = applyAgentPermissionMode({ mode: 'yolo', ...auto })
    const backToManual = applyAgentPermissionMode({ mode: 'manual', ...auto })

    expect(resolveAgentPermissionModeSummary(backToYolo)).toBe('yolo')
    expect(resolveAgentPermissionModeSummary(backToManual)).toBe('manual')
  })

  it('preserves custom agent arguments when applying auto mode', () => {
    const result = applyAgentPermissionMode({
      mode: 'auto',
      agentDefaultArgs: {
        claude: '--dangerously-skip-permissions',
        codex: '--model gpt-5'
      },
      agentDefaultEnv: YOLO_TUI_AGENT_ENV
    })

    expect(result.agentDefaultArgs.claude).toBe(AUTO_TUI_AGENT_ARGS.claude)
    expect(result.agentDefaultArgs.codex).toBe('--model gpt-5')
  })

  it('reports mixed when only one auto-capable agent is on the intermediate mode', () => {
    expect(
      resolveAgentPermissionModeSummary({
        agentDefaultArgs: { claude: AUTO_TUI_AGENT_ARGS.claude },
        agentDefaultEnv: {}
      })
    ).toBe('mixed')
  })
})
