import { useEffect } from 'react'
import { AppState, Platform } from 'react-native'
import { drainMobileDictationKeepAwakeCleanup } from './mobile-dictation-keep-awake'
import type { RefObject } from 'react'
import type { MobileDictationKeepAwakeOwner } from './mobile-dictation-keep-awake'

// A transient Activity gap can fail a foreground refresh; retry briefly while
// the same dictation is live instead of waiting for the next foreground.
const REACQUIRE_RETRY_DELAYS_MS = [1_000, 5_000]

let globalStaleTagDrainInstalled = false

// Failed final deactivations must be retried even after every session screen
// unmounts, or a stale native tag keeps the screen awake until app restart.
// Installed once for the app's lifetime; the drain spares still-wanted tags
// and fast-paths to a no-op when nothing is pending.
function installGlobalStaleTagForegroundDrain(): void {
  if (globalStaleTagDrainInstalled) {
    return
  }
  globalStaleTagDrainInstalled = true
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void drainMobileDictationKeepAwakeCleanup().catch(() => undefined)
    }
  })
}

export function useMobileDictationForegroundKeepAwake(
  keepAwakeOwner: MobileDictationKeepAwakeOwner,
  activeIdRef: RefObject<string | null>
): void {
  useEffect(() => {
    installGlobalStaleTagForegroundDrain()
    // Android keeps FLAG_KEEP_SCREEN_ON on the Activity window, so Activity
    // recreation silently drops it mid-dictation; refresh on return to
    // active. iOS re-applies natively on foreground.
    if (Platform.OS !== 'android') {
      return
    }
    const reacquireWithRetry = (dictationId: string, attempt: number): void => {
      void keepAwakeOwner.reacquire(dictationId).catch(() => {
        const delay = REACQUIRE_RETRY_DELAYS_MS[attempt]
        if (delay === undefined) {
          return
        }
        setTimeout(() => {
          if (activeIdRef.current === dictationId) {
            reacquireWithRetry(dictationId, attempt + 1)
          }
        }, delay)
      })
    }
    const sub = AppState.addEventListener('change', (state) => {
      const dictationId = activeIdRef.current
      if (state === 'active' && dictationId) {
        reacquireWithRetry(dictationId, 0)
      }
    })
    return () => sub.remove()
  }, [keepAwakeOwner, activeIdRef])
}
