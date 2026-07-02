import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AiVaultListResult, AiVaultSession } from '../../../../shared/ai-vault-types'

const SESSION_LIMIT = 500

// Panel entry and window refocus must show sessions started since the last
// scan, so they bypass the main process's 15s cache — but a full scan parses
// up to ~1000 transcripts, so bound forced scans to one per interval. Module
// scope so the throttle survives panel remounts (the panel unmounts per tab).
const FORCED_RESCAN_MIN_INTERVAL_MS = 5_000
let lastForcedRescanAt = 0

function consumeForcedRescanBudget(): boolean {
  const now = Date.now()
  if (now - lastForcedRescanAt < FORCED_RESCAN_MIN_INTERVAL_MS) {
    return false
  }
  lastForcedRescanAt = now
  return true
}

export function resetAiVaultForcedRescanThrottleForTest(): void {
  lastForcedRescanAt = 0
}

type AiVaultRefreshArgs = { force?: boolean; background?: boolean }

export function useAiVaultSessionRefresh(scopePaths: readonly string[]): {
  error: string | null
  loading: boolean
  refresh: (args?: AiVaultRefreshArgs) => Promise<void>
  scanResult: AiVaultListResult | null
  sessions: AiVaultSession[]
} {
  const [sessions, setSessions] = useState<AiVaultSession[]>([])
  const [scanResult, setScanResult] = useState<AiVaultListResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshIdRef = useRef(0)
  const refreshInFlightRef = useRef(false)
  const pendingRefreshRef = useRef(false)
  const pendingForceRef = useRef(false)
  const pendingBackgroundRef = useRef(true)
  const lastAppliedScanRef = useRef<{ scopeKey: string; scannedAt: string } | null>(null)
  const mountedRef = useRef(true)
  const scopePathsKey = useMemo(() => scopePaths.join('\n'), [scopePaths])
  const scopePathsRef = useRef<readonly string[]>(scopePaths)
  scopePathsRef.current = scopePaths

  const refresh = useCallback(async (args: AiVaultRefreshArgs = {}): Promise<void> => {
    // A scope change during an in-flight scan must not be dropped; queue one more
    // scan so the current scoped view is refreshed after the older scan settles.
    if (refreshInFlightRef.current) {
      pendingRefreshRef.current = true
      pendingForceRef.current ||= args.force === true
      pendingBackgroundRef.current &&= args.background === true
      return
    }

    refreshInFlightRef.current = true
    const refreshId = refreshIdRef.current + 1
    refreshIdRef.current = refreshId
    // A manual force scan counts against the throttle so an auto rescan right
    // after the button press doesn't trigger a second full scan.
    if (args.force === true) {
      lastForcedRescanAt = Date.now()
    }
    // Background (refocus) refreshes usually resolve from the main-process
    // cache; suppressing the loading flag avoids a spinner flash on every
    // return to the app.
    if (args.background !== true) {
      setLoading(true)
    }
    setError(null)
    const scopeKey = scopePathsRef.current.join('\n')
    try {
      const result = await window.api.aiVault.listSessions({
        limit: SESSION_LIMIT,
        scopePaths: scopePathsRef.current,
        force: args.force
      })
      if (!mountedRef.current || refreshIdRef.current !== refreshId) {
        return
      }
      // A cache hit returns the snapshot already on screen; skip the state
      // updates so refocus flips don't force pointless re-renders.
      if (
        lastAppliedScanRef.current?.scopeKey === scopeKey &&
        lastAppliedScanRef.current.scannedAt === result.scannedAt
      ) {
        return
      }
      lastAppliedScanRef.current = { scopeKey, scannedAt: result.scannedAt }
      setScanResult(result)
      setSessions(result.sessions)
    } catch (err) {
      if (mountedRef.current && refreshIdRef.current === refreshId) {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      refreshInFlightRef.current = false
      if (mountedRef.current && refreshIdRef.current === refreshId) {
        setLoading(false)
      }
      if (pendingRefreshRef.current && mountedRef.current) {
        pendingRefreshRef.current = false
        const force = pendingForceRef.current
        // The queued refresh is background-only if every queued caller was.
        const background = pendingBackgroundRef.current
        pendingForceRef.current = false
        pendingBackgroundRef.current = true
        void refresh({ force, background })
      }
    }
    // Deps are intentionally empty: refresh reads changing values through refs
    // and recurses on itself, so its identity must stay stable.
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      refreshIdRef.current += 1
      refreshInFlightRef.current = false
    }
  }, [])

  // Re-scan on mount and whenever the active scope changes, since the scanner
  // tailors its in-scope results to scopePaths. Force (throttled) so
  // re-entering the panel shows sessions newer than the 15s cache.
  useEffect(() => {
    void refresh({ force: consumeForcedRescanBudget() })
  }, [refresh, scopePathsKey])

  // Sessions started while the app was backgrounded should appear when the
  // user returns, so refocus also bypasses the scan cache (throttled).
  useEffect(() => {
    const onRefocus = (): void => {
      if (document.visibilityState !== 'visible') {
        return
      }
      void refresh({ background: true, force: consumeForcedRescanBudget() })
    }
    window.addEventListener('focus', onRefocus)
    document.addEventListener('visibilitychange', onRefocus)
    return () => {
      window.removeEventListener('focus', onRefocus)
      document.removeEventListener('visibilitychange', onRefocus)
    }
  }, [refresh])

  return { error, loading, refresh, scanResult, sessions }
}
