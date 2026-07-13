import {
  callRuntimeRpc,
  type RuntimeClientTarget
} from '@/runtime/runtime-rpc-client'

type EnvironmentTarget = Extract<RuntimeClientTarget, { kind: 'environment' }>

type RetainedRuntimeTerminalClose = {
  target: EnvironmentTarget
  handle: string
  inFlight: Promise<void> | null
  attempts: number
  nextRetryAt: number
}

const MAX_RETRY_BACKOFF_MS = 30_000
const retainedCloses = new Map<string, RetainedRuntimeTerminalClose>()
let retryTimer: ReturnType<typeof setTimeout> | null = null

function retainedCloseKey(target: EnvironmentTarget, handle: string): string {
  return `${target.environmentId}\0${handle}`
}

function scheduleRuntimeTerminalCloseRetries(): void {
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  let nextRetryAt = Number.POSITIVE_INFINITY
  for (const retained of retainedCloses.values()) {
    if (!retained.inFlight) {
      nextRetryAt = Math.min(nextRetryAt, retained.nextRetryAt)
    }
  }
  if (!Number.isFinite(nextRetryAt)) {
    return
  }
  retryTimer = setTimeout(() => {
    retryTimer = null
    const now = Date.now()
    for (const retained of retainedCloses.values()) {
      if (!retained.inFlight && retained.nextRetryAt <= now) {
        void closeRuntimeTerminalRetainingRetryOwnership(retained.target, retained.handle).catch(
          () => {}
        )
      }
    }
  }, Math.max(0, nextRetryAt - Date.now()))
}

export function closeRuntimeTerminalRetainingRetryOwnership(
  target: EnvironmentTarget,
  handle: string
): Promise<void> {
  const key = retainedCloseKey(target, handle)
  let retained = retainedCloses.get(key)
  if (!retained) {
    retained = { target, handle, inFlight: null, attempts: 0, nextRetryAt: 0 }
    retainedCloses.set(key, retained)
  }
  if (retained.inFlight) {
    return retained.inFlight
  }

  const attempt = callRuntimeRpc(target, 'terminal.close', { terminal: handle })
    .then(() => {
      retainedCloses.delete(key)
    })
    .catch((error: unknown) => {
      retained.attempts += 1
      retained.nextRetryAt =
        Date.now() +
        Math.min(MAX_RETRY_BACKOFF_MS, 250 * 2 ** Math.min(retained.attempts - 1, 7))
      if (retained.attempts <= 2 || retained.attempts === 8) {
        console.warn('[terminal] Failed to close retained runtime terminal', error)
      }
      throw error
    })
    .finally(() => {
      if (retained.inFlight === attempt) {
        retained.inFlight = null
      }
      scheduleRuntimeTerminalCloseRetries()
    })
  retained.inFlight = attempt
  return attempt
}

export function retryRetainedRuntimeTerminalCloses(): void {
  for (const retained of retainedCloses.values()) {
    if (!retained.inFlight) {
      void closeRuntimeTerminalRetainingRetryOwnership(retained.target, retained.handle).catch(
        () => {}
      )
      return
    }
  }
}

export function releaseRetainedRuntimeTerminalClose(
  target: EnvironmentTarget,
  handle: string
): void {
  retainedCloses.delete(retainedCloseKey(target, handle))
  scheduleRuntimeTerminalCloseRetries()
}

export function releaseRetainedRuntimeTerminalClosesForEnvironment(environmentId: string): void {
  for (const [key, retained] of retainedCloses) {
    if (retained.target.environmentId === environmentId) {
      retainedCloses.delete(key)
    }
  }
  // Why: a successfully removed runtime cannot be reconnected, so retained
  // handles have no reachable provider resource and must release their timer.
  scheduleRuntimeTerminalCloseRetries()
}
