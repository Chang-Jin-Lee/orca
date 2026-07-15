import type { AppState } from '@/store/types'

/**
 * Resolve the UI terminal tab id that owns a given ptyId within a worktree.
 *
 * Why: a workspace the renderer never mounted has no live pane and no
 * renderer-graph leaf, so a mobile subscribe only knows the ptyId (surfaced via
 * a synthetic `pty:<ptyId>` handle). To background-mount the pane so its PTY
 * attaches (STA-1840), we map the ptyId back to the persisted tab — either the
 * tab's own `ptyId` or a split leaf recorded in its saved layout.
 */
export function resolveTerminalTabIdForPtyId(
  state: Pick<AppState, 'tabsByWorktree' | 'terminalLayoutsByTabId'>,
  worktreeId: string,
  ptyId: string
): string | null {
  const tabs = state.tabsByWorktree[worktreeId] ?? []
  for (const tab of tabs) {
    if (tab.ptyId === ptyId) {
      return tab.id
    }
    const ptyIdsByLeafId = state.terminalLayoutsByTabId[tab.id]?.ptyIdsByLeafId
    if (ptyIdsByLeafId && Object.values(ptyIdsByLeafId).includes(ptyId)) {
      return tab.id
    }
  }
  return null
}
