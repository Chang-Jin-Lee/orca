import type { AppState } from '@/store/types'

/** Resolve a synthetic mobile handle's ptyId through persisted tab and split bindings. */
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
