import { recordRendererCrashBreadcrumb } from '@/lib/crash-breadcrumb-recorder'

export function createTerminalLinkProbeResultCollector<T>(): (
  results: PromiseSettledResult<T>[]
) => T[] {
  let failureRecorded = false
  return (results) => {
    const rejected = results.find((result) => result.status === 'rejected')
    if (rejected && !failureRecorded) {
      failureRecorded = true
      const error = rejected.reason
      recordRendererCrashBreadcrumb('terminal_file_link_probe_error', {
        errorName: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error)
      })
    }
    return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
  }
}
