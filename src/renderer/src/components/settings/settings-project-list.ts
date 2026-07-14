import type { Project, ProjectHostSetup, Repo } from '../../../../shared/types'
import { LOCAL_EXECUTION_HOST_ID, type ExecutionHostId } from '../../../../shared/execution-host'
import { projectHostSetupProjectionFromRepos } from '../../../../shared/project-host-setup-projection'

export type SettingsProject = {
  projectId: string
  project: Project
  setups: ProjectHostSetup[]
  representativeRepoId: string
}

/**
 * Which repo row identifies a project's single Settings nav row + pane. Pure
 * over the project's setups so nav and panes derive the same id. Prefers the
 * `local` host (the user's own machine) and otherwise the lowest repoId, so the
 * id is stable unless that exact repo row is removed.
 */
export function getSettingsProjectRepresentativeRepoId(
  setups: readonly ProjectHostSetup[]
): string {
  const localSetup = setups.find(
    (setup) => setup.hostId === LOCAL_EXECUTION_HOST_ID && setup.repoId.trim().length > 0
  )
  if (localSetup) {
    return localSetup.repoId
  }
  let lowest = ''
  for (const setup of setups) {
    const repoId = setup.repoId.trim()
    if (repoId.length > 0 && (lowest === '' || repoId < lowest)) {
      lowest = repoId
    }
  }
  return lowest
}

/**
 * Collapses repo rows into one entry per project so Settings renders per
 * project, matching the rest of the app. Derived from repos alone (not the
 * persisted projects/setups) so the nav and pane lists agree exactly.
 */
export function buildSettingsProjectList(repos: readonly Repo[]): SettingsProject[] {
  const projection = projectHostSetupProjectionFromRepos(repos)
  return projection.projects.map((project) => {
    const setups = projection.setups.filter((setup) => setup.projectId === project.id)
    return {
      projectId: project.id,
      project,
      setups,
      representativeRepoId: getSettingsProjectRepresentativeRepoId(setups)
    }
  })
}

/**
 * The host whose settings the project pane should show. Validates the stored
 * selection against the live setups so a disconnected/removed host never leaves
 * the pane rendering off a dangling hostId: falls back to local, then the first
 * ready setup, then the first setup.
 */
export function resolveEffectiveProjectHost(
  setups: readonly ProjectHostSetup[],
  selectedHostId: ExecutionHostId | undefined
): ExecutionHostId | undefined {
  if (setups.length === 0) {
    return undefined
  }
  if (selectedHostId && setups.some((setup) => setup.hostId === selectedHostId)) {
    return selectedHostId
  }
  const localSetup = setups.find((setup) => setup.hostId === LOCAL_EXECUTION_HOST_ID)
  if (localSetup) {
    return localSetup.hostId
  }
  const readySetup = setups.find((setup) => setup.setupState === 'ready')
  return (readySetup ?? setups[0]).hostId
}
