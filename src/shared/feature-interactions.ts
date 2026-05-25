export type FeatureInteractionId =
  | 'right-sidebar'
  | 'workspace-board'
  | 'browser'
  | 'tasks'
  | 'automations'
  | 'workspace-creation'
  | 'voice-dictation'

export type FeatureInteractionDefinition = {
  id: FeatureInteractionId
  /** The product action that counts as "the user has interacted with this feature." */
  interaction: string
}

export type FeatureInteractionRecord = {
  /** Unix timestamp in milliseconds for the first local interaction. */
  firstInteractedAt: number
}

export type FeatureInteractionState = Partial<
  Record<FeatureInteractionId, FeatureInteractionRecord>
>

// Why: education state has three separate meanings; see
// docs/readme/feature-education-state.md before adding or reusing ids here.
export const FEATURE_INTERACTIONS = [
  {
    id: 'right-sidebar',
    interaction: 'right sidebar opened'
  },
  {
    id: 'workspace-board',
    interaction: 'workspace board opened'
  },
  {
    id: 'browser',
    interaction: 'non-blank browser page viewed'
  },
  {
    id: 'tasks',
    interaction: 'Tasks page opened'
  },
  {
    id: 'automations',
    interaction: 'Automations page opened'
  },
  {
    id: 'workspace-creation',
    interaction: 'workspace creation flow opened'
  },
  {
    id: 'voice-dictation',
    interaction: 'dictation session started'
  }
] as const satisfies readonly FeatureInteractionDefinition[]

export const FEATURE_INTERACTION_IDS = FEATURE_INTERACTIONS.map((feature) => feature.id)

export function isFeatureInteractionId(value: unknown): value is FeatureInteractionId {
  return (
    typeof value === 'string' && FEATURE_INTERACTION_IDS.includes(value as FeatureInteractionId)
  )
}

export function hasFeatureInteraction(
  state: FeatureInteractionState | null | undefined,
  id: FeatureInteractionId
): boolean {
  return isValidFeatureInteractionRecord(state?.[id])
}

export function normalizeFeatureInteractions(value: unknown): FeatureInteractionState {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const input = value as Record<string, unknown>
  const out: FeatureInteractionState = {}
  for (const id of FEATURE_INTERACTION_IDS) {
    const record = input[id]
    if (isValidFeatureInteractionRecord(record)) {
      out[id] = { firstInteractedAt: record.firstInteractedAt }
    }
  }
  return out
}

function isValidFeatureInteractionRecord(value: unknown): value is FeatureInteractionRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const firstInteractedAt = (value as Record<string, unknown>).firstInteractedAt
  return (
    typeof firstInteractedAt === 'number' &&
    Number.isFinite(firstInteractedAt) &&
    firstInteractedAt >= 0
  )
}
