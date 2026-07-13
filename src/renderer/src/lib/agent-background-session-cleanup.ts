import { killPtyRetainingRetryOwnership } from '@/lib/pty-kill-retry-ownership'

export function runBestEffortAgentBackgroundCleanups(...actions: (() => void)[]): void {
  for (const action of actions) {
    try {
      action()
    } catch {
      // Preserve the launch/setup error that triggered cleanup.
    }
  }
}

export function killFailedAgentBackgroundPty(ptyId: string, tabId: string): Promise<void> {
  return killPtyRetainingRetryOwnership(ptyId, '[pty] Background cleanup failed', {
    expectedTabId: tabId
  })
}
