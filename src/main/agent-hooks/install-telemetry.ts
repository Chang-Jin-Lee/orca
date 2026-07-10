// PostHog attribution for managed-hook install failures. Kept out of the
// CLI-safe `managed-agent-hook-controls` module (and out of `src/main/index.ts`)
// because `track` pulls in the Electron telemetry client: main-process callers
// inject `recordManagedHookInstallFailure` into the installer loop, while the
// offline CLI path leaves it unset so it never imports Electron.

import type { HookInstallAgent } from '../../shared/telemetry-events'
import { track } from '../telemetry/client'

// Why: install errors are about config-file shape (malformed JSON, ACL
// denial), not user content — but messages can include paths or stack
// fragments. The 200-char cap matches `agentHookInstallFailedSchema.error_message`
// in `src/shared/telemetry-events.ts`; the validator drops overlength values,
// so truncation must happen here at the call site.
const ERROR_MESSAGE_MAX_LEN = 200

export type ManagedHookInstallErrorRecorder = (agent: HookInstallAgent, error: unknown) => void

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  try {
    const json = JSON.stringify(error)
    return typeof json === 'string' ? json : String(error)
  } catch {
    return String(error)
  }
}

export function recordManagedHookInstallFailure(agent: HookInstallAgent, error: unknown): void {
  // Why: telemetry must not break fail-open. A throw inside `track` (e.g.
  // a corrupted settings store the resolveConsent path reads from) would
  // otherwise abort the installer loop and skip later agents' installers.
  try {
    track('agent_hook_install_failed', {
      agent,
      error_message: describeError(error).slice(0, ERROR_MESSAGE_MAX_LEN)
    })
  } catch (telemetryError) {
    console.error('[agent-hooks] Failed to record install-failure telemetry:', telemetryError)
  }
}
