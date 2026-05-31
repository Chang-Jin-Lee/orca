import { AGENT_CATALOG } from '@/lib/agent-catalog'
import { filterEnabledTuiAgents } from '../../../shared/tui-agent-selection'
import type { TuiAgent } from '../../../shared/types'

export function pickSourceControlLaunchAgent(args: {
  savedAgent?: TuiAgent | null
  defaultAgent: TuiAgent | 'blank' | null | undefined
  detectedAgents: TuiAgent[]
  disabledAgents?: TuiAgent[]
}): TuiAgent | null {
  const enabledAgents = filterEnabledTuiAgents(args.detectedAgents, args.disabledAgents)
  if (args.savedAgent && enabledAgents.includes(args.savedAgent)) {
    return args.savedAgent
  }
  if (
    args.defaultAgent &&
    args.defaultAgent !== 'blank' &&
    enabledAgents.includes(args.defaultAgent)
  ) {
    return args.defaultAgent
  }
  return AGENT_CATALOG.find((entry) => enabledAgents.includes(entry.id))?.id ?? null
}
