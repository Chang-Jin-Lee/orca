import { TUI_AGENT_CONFIG } from './tui-agent-config'
import type { TuiAgent } from './types'

export type AgentPermissionMode = 'yolo' | 'auto' | 'manual' | 'mixed'

export const YOLO_TUI_AGENT_ARGS: Partial<Record<TuiAgent, string>> = {
  claude: '--dangerously-skip-permissions',
  'claude-agent-teams': '--dangerously-skip-permissions',
  openclaude: '--dangerously-skip-permissions',
  codex: '--dangerously-bypass-approvals-and-sandbox',
  gemini: '--yolo',
  antigravity: '--dangerously-skip-permissions',
  aider: '--yes-always',
  amp: '--dangerously-allow-all',
  kiro: '--trust-all-tools',
  crush: '--yolo',
  autohand: '--unrestricted',
  cline: '--auto-approve true',
  'command-code': '--yolo',
  continue: '--allow "*"',
  cursor: '--yolo',
  kimi: '--yolo',
  'mistral-vibe': '--agent auto-approve',
  'qwen-code': '--approval-mode yolo',
  rovo: '--yolo',
  hermes: '--yolo',
  copilot: '--yolo',
  grok: '--permission-mode bypassPermissions',
  devin: '--permission-mode bypass',
  ante: '--yolo',
  trae: '--yolo'
}

export const YOLO_TUI_AGENT_ENV: Partial<Record<TuiAgent, Record<string, string>>> = {
  goose: { GOOSE_MODE: 'auto' }
}

// Why: the vendors' own recommended middle ground — edits and most commands run
// without a prompt, but the CLI still stops for genuinely sensitive actions.
// Only agents whose intermediate mode is verifiable belong here: `auto` is a
// documented `claude --permission-mode` choice, and `--full-auto` is already how
// this codebase represents Codex "Approve for me" (see
// agent-completion-coordinator.ts). Agents absent from this table fall back to
// manual, so picking Auto can never silently mean "allow everything".
export const AUTO_TUI_AGENT_ARGS: Partial<Record<TuiAgent, string>> = {
  claude: '--permission-mode auto',
  codex: '--full-auto'
}

const PERMISSION_AGENT_IDS = Object.keys(TUI_AGENT_CONFIG).filter(
  (agent): agent is TuiAgent => agent in YOLO_TUI_AGENT_ARGS || agent in YOLO_TUI_AGENT_ENV
)

export function supportsAgentAutoPermissionMode(agent: TuiAgent): boolean {
  return agent in AUTO_TUI_AGENT_ARGS
}

function normalizeArgs(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function sameEnv(
  left: Record<string, string> | null | undefined,
  right: Record<string, string> | null | undefined
): boolean {
  const leftEntries = Object.entries(left ?? {})
  const rightEntries = Object.entries(right ?? {})
  if (leftEntries.length !== rightEntries.length) {
    return false
  }
  return leftEntries.every(([name, value]) => right?.[name] === value)
}

function resolveAgentPermissionMode(
  args: string,
  yoloArgs: string,
  autoArgs: string
): AgentPermissionMode {
  if (!args) {
    return 'manual'
  }
  if (args === yoloArgs) {
    return 'yolo'
  }
  if (autoArgs && args === autoArgs) {
    return 'auto'
  }
  return 'mixed'
}

function resolveAgentEnvPermissionMode(
  env: Record<string, string> | null | undefined,
  yoloEnv: Record<string, string> | undefined
): AgentPermissionMode {
  if (sameEnv(env, {})) {
    return 'manual'
  }
  return sameEnv(env, yoloEnv) ? 'yolo' : 'mixed'
}

function combinePermissionModes(modes: AgentPermissionMode[]): AgentPermissionMode {
  const distinct = new Set<AgentPermissionMode>()

  for (const mode of modes) {
    if (mode === 'mixed') {
      return 'mixed'
    }
    distinct.add(mode)
  }

  if (distinct.size === 0) {
    return 'manual'
  }
  if (distinct.size > 1) {
    return 'mixed'
  }
  const [only] = distinct
  return only ?? 'manual'
}

export function resolveTuiAgentPermissionMode(args: {
  agent: TuiAgent
  agentArgs?: string | null
  agentEnv?: Record<string, string> | null
}): AgentPermissionMode {
  const modes: AgentPermissionMode[] = []
  if (args.agent in YOLO_TUI_AGENT_ARGS) {
    modes.push(
      resolveAgentPermissionMode(
        normalizeArgs(args.agentArgs),
        YOLO_TUI_AGENT_ARGS[args.agent] ?? '',
        AUTO_TUI_AGENT_ARGS[args.agent] ?? ''
      )
    )
  }
  if (args.agent in YOLO_TUI_AGENT_ENV) {
    modes.push(resolveAgentEnvPermissionMode(args.agentEnv, YOLO_TUI_AGENT_ENV[args.agent]))
  }

  return combinePermissionModes(modes)
}

export function resolveAgentPermissionModeSummary(args: {
  agentDefaultArgs?: Partial<Record<TuiAgent, string>> | null
  agentDefaultEnv?: Partial<Record<TuiAgent, Record<string, string>>> | null
}): AgentPermissionMode {
  const modeByAgent = new Map<TuiAgent, AgentPermissionMode>()

  for (const agent of PERMISSION_AGENT_IDS) {
    modeByAgent.set(
      agent,
      resolveTuiAgentPermissionMode({
        agent,
        agentArgs: args.agentDefaultArgs?.[agent],
        agentEnv: args.agentDefaultEnv?.[agent]
      })
    )
  }

  // Why: Auto leaves every agent without a vendor intermediate mode on manual,
  // so that split is the auto profile rather than a mixed one — without this the
  // segmented control would snap back to "mixed" the moment Auto is selected.
  const matchesAutoProfile =
    PERMISSION_AGENT_IDS.some(supportsAgentAutoPermissionMode) &&
    PERMISSION_AGENT_IDS.every(
      (agent) =>
        modeByAgent.get(agent) === (supportsAgentAutoPermissionMode(agent) ? 'auto' : 'manual')
    )
  if (matchesAutoProfile) {
    return 'auto'
  }

  return combinePermissionModes([...modeByAgent.values()])
}

export function applyAgentPermissionMode(args: {
  mode: Exclude<AgentPermissionMode, 'mixed'>
  agentDefaultArgs?: Partial<Record<TuiAgent, string>> | null
  agentDefaultEnv?: Partial<Record<TuiAgent, Record<string, string>>> | null
}): {
  agentDefaultArgs: Partial<Record<TuiAgent, string>>
  agentDefaultEnv: Partial<Record<TuiAgent, Record<string, string>>>
} {
  const nextArgs = { ...args.agentDefaultArgs }
  const nextEnv = { ...args.agentDefaultEnv }

  for (const agent of PERMISSION_AGENT_IDS) {
    if (agent in YOLO_TUI_AGENT_ARGS) {
      const yoloArgs = YOLO_TUI_AGENT_ARGS[agent] ?? ''
      const autoArgs = AUTO_TUI_AGENT_ARGS[agent] ?? ''
      const currentArgs = normalizeArgs(nextArgs[agent])
      // Why: only rewrite the launch strings Orca itself owns — a user's custom
      // arguments have to survive a permission-mode switch untouched.
      if (!currentArgs || currentArgs === yoloArgs || (autoArgs && currentArgs === autoArgs)) {
        nextArgs[agent] = args.mode === 'yolo' ? yoloArgs : args.mode === 'auto' ? autoArgs : ''
      }
    }

    if (agent in YOLO_TUI_AGENT_ENV) {
      const yoloEnv = YOLO_TUI_AGENT_ENV[agent]
      const currentEnv = nextEnv[agent]
      // Why: no env-driven agent exposes a verified intermediate mode yet, so
      // Auto lands them on manual rather than guessing a middle value.
      if (sameEnv(currentEnv, {}) || sameEnv(currentEnv, yoloEnv)) {
        nextEnv[agent] = args.mode === 'yolo' ? { ...yoloEnv } : {}
      }
    }
  }

  return { agentDefaultArgs: nextArgs, agentDefaultEnv: nextEnv }
}
