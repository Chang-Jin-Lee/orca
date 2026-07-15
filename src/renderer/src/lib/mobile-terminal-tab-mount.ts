import type { AppState } from '@/store/types'
import type { BackgroundMountTerminalWorktreeDetail } from '@/constants/terminal'
import { resolveTerminalTabIdForPtyId } from './terminal-tab-for-pty-id'

export type MobileTerminalTabMountRequest = {
  worktreeId: string
  tabId?: string
  ptyId?: string
}

/** Why: exact-tab planning prevents a stale ptyId from mounting every saved xterm (#8597). */
export function planMobileTerminalTabMount(
  state: Pick<AppState, 'tabsByWorktree' | 'terminalLayoutsByTabId'>,
  request: MobileTerminalTabMountRequest
): BackgroundMountTerminalWorktreeDetail | null {
  if (!request.worktreeId) {
    return null
  }
  const tabId =
    request.tabId ??
    (request.ptyId ? resolveTerminalTabIdForPtyId(state, request.worktreeId, request.ptyId) : null)
  return tabId ? { worktreeId: request.worktreeId, tabIds: [tabId] } : null
}
