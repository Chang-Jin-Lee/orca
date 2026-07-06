// Renderer half of the one-paste freeze report: a bounded ring of the
// delivery-affecting transitions (gate marks, visibility trust changes,
// watchdog heals, restore markers) so a field report carries the history
// that led to the frozen state, not just a point-in-time counter snapshot.
import {
  type PtyDeliveryBreadcrumb,
  createPtyDeliveryBreadcrumbRing
} from '../../../../shared/pty-delivery-diagnostics'

const rendererDeliveryBreadcrumbs = createPtyDeliveryBreadcrumbRing()

export function recordTerminalFreezeBreadcrumb(
  kind: string,
  detail?: PtyDeliveryBreadcrumb['detail']
): void {
  rendererDeliveryBreadcrumbs.record(kind, detail)
}

export function getTerminalFreezeBreadcrumbs(): PtyDeliveryBreadcrumb[] {
  return rendererDeliveryBreadcrumbs.snapshot()
}

export function resetTerminalFreezeBreadcrumbsForTesting(): void {
  rendererDeliveryBreadcrumbs.reset()
}
