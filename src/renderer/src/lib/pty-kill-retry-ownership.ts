export type PtyKillIdentity = {
  expectedPaneKey?: string
  expectedTabId?: string
}

/** Main persists exact provider identity and owns retries after renderer loss. */
export function killPtyRetainingRetryOwnership(
  id: string,
  diagnostic: string,
  options?: PtyKillIdentity
): Promise<void> {
  return Promise.resolve()
    .then(() => (options ? window.api.pty.kill(id, options) : window.api.pty.kill(id)))
    .catch((error: unknown) => {
      // Why: main owns retry state, but the initiating renderer still records the first failure.
      console.warn(diagnostic, error)
      throw error
    })
}

export function retryRetainedPtyKills(): void {
  // Main retries on provider availability and bounded backoff.
}

export function releaseRetainedPtyKillOwnership(id: string): void {
  void id
}

export function releaseRetainedPtyKillsForSshTarget(targetId: string): void {
  void targetId
}
