type RetainedPtyKill = {
  diagnostic: string
  inFlight: Promise<void> | null
  options?: PtyKillIdentity
  attempts: number
  nextRetryAt: number
}

export type PtyKillIdentity = {
  expectedPaneKey?: string
  expectedTabId?: string
}

const MAX_RETRY_BACKOFF_MS = 30_000
const retainedPtyKills = new Map<string, RetainedPtyKill>()
let retryTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRetainedPtyKillRetries(): void {
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  let nextRetryAt = Number.POSITIVE_INFINITY
  for (const retained of retainedPtyKills.values()) {
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
    for (const [id, retained] of retainedPtyKills) {
      if (!retained.inFlight && retained.nextRetryAt <= now) {
        void killPtyRetainingRetryOwnership(id, retained.diagnostic, retained.options).catch(
          () => {}
        )
      }
    }
  }, Math.max(0, nextRetryAt - Date.now()))
}

/**
 * Keep exact PTY identity until the owning provider accepts shutdown. A rejected
 * local/SSH IPC call can otherwise leave a live process with no renderer owner.
 */
export function killPtyRetainingRetryOwnership(
  id: string,
  diagnostic: string,
  options?: PtyKillIdentity
): Promise<void> {
  let retained = retainedPtyKills.get(id)
  if (!retained) {
    // Why: every entry represents a provider process whose shutdown is still
    // unconfirmed. Dropping one to cap bookkeeping would orphan the real PTY;
    // repeated failures for the same PTY still coalesce into this single record.
    retained = { diagnostic, inFlight: null, options, attempts: 0, nextRetryAt: 0 }
  }
  retained.diagnostic = diagnostic
  retained.options = options ?? retained.options
  retainedPtyKills.set(id, retained)
  if (retained.inFlight) {
    return retained.inFlight
  }

  const attempt = Promise.resolve()
    .then(() =>
      retained.options ? window.api.pty.kill(id, retained.options) : window.api.pty.kill(id)
    )
    .then(() => {
      retainedPtyKills.delete(id)
    })
    .catch((error: unknown) => {
      retained.attempts += 1
      retained.nextRetryAt =
        Date.now() +
        Math.min(MAX_RETRY_BACKOFF_MS, 250 * 2 ** Math.min(retained.attempts - 1, 7))
      // Why: automatic retries can outlive a disconnect; bound diagnostics so
      // a long outage cannot become a log-backpressure loop.
      if (retained.attempts <= 2 || retained.attempts === 8) {
        console.warn(retained.diagnostic, error)
      }
      throw error
    })
    .finally(() => {
      if (retained.inFlight === attempt) {
        retained.inFlight = null
      }
      scheduleRetainedPtyKillRetries()
    })
  retained.inFlight = attempt
  return attempt
}

/** Retry immediately on the next PTY lifecycle event in addition to bounded backoff. */
export function retryRetainedPtyKills(): void {
  for (const [id, retained] of retainedPtyKills) {
    if (!retained.inFlight) {
      void killPtyRetainingRetryOwnership(id, retained.diagnostic, retained.options).catch(() => {})
      return
    }
  }
}

export function releaseRetainedPtyKillOwnership(id: string): void {
  retainedPtyKills.delete(id)
  scheduleRetainedPtyKillRetries()
}

export function releaseRetainedPtyKillsForSshTarget(targetId: string): void {
  for (const id of retainedPtyKills.keys()) {
    if (parseAppSshPtyId(id)?.connectionId === targetId) {
      retainedPtyKills.delete(id)
    }
  }
  // Why: successful target removal is authoritative proof that reconnect can
  // no longer reach these PTYs, so retry ownership must not outlive the host.
  scheduleRetainedPtyKillRetries()
}
import { parseAppSshPtyId } from '../../../shared/ssh-pty-id'
