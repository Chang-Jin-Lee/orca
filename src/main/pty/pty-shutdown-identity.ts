import type { PtyShutdownOptions } from '../providers/types'

export type PtyPaneIdentity = {
  paneKey: string | null
  tabId: string | null
}

export type PtyPaneIdentityFields = { paneKey?: string; tabId?: string }
export type PtyExpectedPaneIdentityFields = Pick<
  PtyShutdownOptions,
  'expectedPaneKey' | 'expectedTabId'
>

export function getPtyPaneIdentityFromEnv(
  env: Record<string, string> | undefined
): PtyPaneIdentity {
  return {
    paneKey: env?.ORCA_PANE_KEY?.trim() || null,
    tabId: env?.ORCA_TAB_ID?.trim() || null
  }
}

export function assertPtyPaneIdentity(
  id: string,
  actual: PtyPaneIdentity,
  expected: PtyExpectedPaneIdentityFields
): void {
  if (
    (expected.expectedPaneKey !== undefined && actual.paneKey !== expected.expectedPaneKey) ||
    (expected.expectedTabId !== undefined && actual.tabId !== expected.expectedTabId)
  ) {
    throw new Error(`PTY identity mismatch for "${id}"`)
  }
}
