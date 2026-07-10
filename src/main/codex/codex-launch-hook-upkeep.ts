import type { AgentHookInstallStatus } from '../../shared/agent-hook-types'

// Why: the per-launch Codex path runs the presence-gated managed install, but
// that install can be skipped (a false-'missing' PATH probe or a relative
// command override reporting 'unknown'). #7896 approval promotion must still run
// on every launch, so when the managed install did not run install() itself the
// caller must promote directly. A completed install() (installed/partial/error)
// already promoted before touching config, so promoting again would be wasted
// work — and falling back to refreshRuntimeUserHooks() would wrongly strip the
// managed hooks a false-'missing' can't see.
export function codexLaunchNeedsDirectApprovalPromotion(
  codexStatus: Pick<AgentHookInstallStatus, 'state'> | undefined
): boolean {
  return !codexStatus || codexStatus.state === 'skipped'
}
