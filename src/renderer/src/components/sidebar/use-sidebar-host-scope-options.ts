import { useMemo } from 'react'
import { useAppStore } from '@/store'
import {
  buildSidebarHostOptions,
  buildSidebarHostScopeOptions,
  type SidebarHostOption,
  type SidebarHostScopeOption
} from './sidebar-host-options'

/** Shared host-scope derivation for the sidebar scope strip and the workspace
 * options menu so both surfaces consume the same live runtime status without
 * duplicating store wiring. */
export function useSidebarHostScopeOptions(): {
  hostOptions: SidebarHostOption[]
  hostScopeOptions: SidebarHostScopeOption[]
} {
  const repos = useAppStore((s) => s.repos)
  const sshTargetLabels = useAppStore((s) => s.sshTargetLabels)
  const sshConnectionStates = useAppStore((s) => s.sshConnectionStates)
  const settings = useAppStore((s) => s.settings)
  const runtimeStatusByEnvironmentId = useAppStore((s) => s.runtimeStatusByEnvironmentId)

  const hostOptions = useMemo(
    () =>
      buildSidebarHostOptions({
        repos,
        sshTargetLabels,
        sshConnectionStates,
        settings,
        runtimeStatusByEnvironmentId
      }),
    [repos, sshTargetLabels, sshConnectionStates, settings, runtimeStatusByEnvironmentId]
  )
  const hostScopeOptions = useMemo(() => buildSidebarHostScopeOptions(hostOptions), [hostOptions])

  return { hostOptions, hostScopeOptions }
}
