export type WorktreeCardQuickActionKind = 'sleep' | null

export function getWorkspaceQuickActionKind({
  hasActiveActivity,
  isSleepQuickActionModifierPressed
}: {
  hasActiveActivity: boolean
  isSleepQuickActionModifierPressed: boolean
}): WorktreeCardQuickActionKind {
  // Why: Sleep is a fast-path for frequent users, but keeping it modifier-gated
  // avoids adding persistent chrome to every active workspace row.
  return hasActiveActivity && isSleepQuickActionModifierPressed ? 'sleep' : null
}
