import { app, ipcMain } from 'electron'
import type { Store } from '../persistence'
import { destroySystemTray } from '../tray/system-tray'
import type {
  CreateLocalOrcaProfileArgs,
  CreateLocalOrcaProfileResult,
  CreateCloudLinkedOrcaProfileArgs,
  CreateCloudLinkedOrcaProfileResult,
  FindOrcaProfileProjectsByPathArgs,
  FindOrcaProfileProjectsByPathResult,
  OrcaProfileListState,
  RefreshCurrentOrcaProfileAuthResult,
  SwitchOrcaProfileArgs,
  SwitchOrcaProfileResult,
  TransferOrcaProfileProjectArgs,
  TransferOrcaProfileProjectResult,
  ConnectCurrentOrcaProfileResult,
  OrcaProfileAuthStatus,
  SelectOrcaProfileOrgArgs,
  SelectOrcaProfileOrgResult,
  SignOutCurrentOrcaProfileResult
} from '../../shared/orca-profiles'
import {
  createLocalOrcaProfile,
  getOrcaProfileListState,
  setActiveOrcaProfile
} from '../orca-profiles/profile-index-store'
import { transferOrcaProfileProject } from '../orca-profiles/profile-project-transfer'
import { findOrcaProfileProjectsByPath } from '../orca-profiles/profile-project-presence'
import { normalizeExecutionHostId } from '../../shared/execution-host'
import {
  createCloudLinkedOrcaProfile,
  connectCurrentOrcaProfile,
  getCurrentOrcaProfileAuthStatus,
  refreshCurrentOrcaProfileAuth,
  selectCurrentOrcaProfileOrg,
  signOutCurrentOrcaProfile
} from '../orca-profiles/profile-cloud-service'

type RegisterOrcaProfileHandlersOptions = {
  onBeforeRelaunch?: () => void | Promise<void>
}

function profileIdFromArgs(args: unknown): string {
  if (
    !args ||
    typeof args !== 'object' ||
    typeof (args as SwitchOrcaProfileArgs).profileId !== 'string'
  ) {
    throw new Error('invalid_orca_profile_id')
  }
  const profileId = (args as SwitchOrcaProfileArgs).profileId.trim()
  if (!profileId) {
    throw new Error('invalid_orca_profile_id')
  }
  return profileId
}

function transferProjectArgsFromUnknown(args: unknown): TransferOrcaProfileProjectArgs {
  if (!args || typeof args !== 'object') {
    throw new Error('invalid_orca_profile_project_transfer')
  }
  const candidate = args as TransferOrcaProfileProjectArgs
  const sourceProfileId = candidate.sourceProfileId?.trim()
  const targetProfileId = candidate.targetProfileId?.trim()
  const repoId = candidate.repoId?.trim()
  const mode = candidate.mode
  if (!sourceProfileId || !targetProfileId || !repoId || (mode !== 'move' && mode !== 'copy')) {
    throw new Error('invalid_orca_profile_project_transfer')
  }
  return {
    sourceProfileId,
    targetProfileId,
    repoId,
    mode
  }
}

function findProjectsByPathArgsFromUnknown(args: unknown): FindOrcaProfileProjectsByPathArgs {
  if (!args || typeof args !== 'object') {
    throw new Error('invalid_orca_profile_project_path')
  }
  const candidate = args as FindOrcaProfileProjectsByPathArgs
  const path = typeof candidate.path === 'string' ? candidate.path.trim() : ''
  if (!path) {
    throw new Error('invalid_orca_profile_project_path')
  }
  let executionHostId: FindOrcaProfileProjectsByPathArgs['executionHostId'] = null
  if (candidate.executionHostId !== null && candidate.executionHostId !== undefined) {
    if (typeof candidate.executionHostId !== 'string') {
      throw new Error('invalid_orca_profile_project_path')
    }
    executionHostId = normalizeExecutionHostId(candidate.executionHostId)
    if (!executionHostId) {
      throw new Error('invalid_orca_profile_project_path')
    }
  }
  return {
    path,
    connectionId:
      typeof candidate.connectionId === 'string' ? candidate.connectionId.trim() || null : null,
    executionHostId,
    excludeProfileId:
      typeof candidate.excludeProfileId === 'string'
        ? candidate.excludeProfileId.trim() || null
        : null
  }
}

function orgIdFromUnknown(args: unknown): string {
  if (!args || typeof args !== 'object') {
    throw new Error('invalid_orca_profile_org_selection')
  }
  const orgId = (args as SelectOrcaProfileOrgArgs).orgId?.trim()
  if (!orgId) {
    throw new Error('invalid_orca_profile_org_selection')
  }
  return orgId
}

function createCloudLinkedProfileArgsFromUnknown(args: unknown): CreateCloudLinkedOrcaProfileArgs {
  if (!args || typeof args !== 'object') {
    return {}
  }
  const candidate = args as CreateCloudLinkedOrcaProfileArgs
  const orgId = typeof candidate.orgId === 'string' ? candidate.orgId.trim() : undefined
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : undefined
  return {
    ...(orgId ? { orgId } : {}),
    ...(name ? { name } : {})
  }
}

async function runBeforeProfileRelaunch(
  onBeforeRelaunch?: () => void | Promise<void>
): Promise<void> {
  try {
    await onBeforeRelaunch?.()
  } catch (error) {
    console.warn(
      '[orca-profiles] Pre-relaunch cleanup failed; continuing profile switch:',
      error instanceof Error ? error.name : typeof error
    )
  }
}

function scheduleProfileRelaunch(): void {
  setTimeout(() => {
    destroySystemTray()
    app.relaunch()
    app.exit(0)
  }, 150)
}

export function registerOrcaProfileHandlers(
  store: Store,
  options: RegisterOrcaProfileHandlersOptions = {}
): void {
  ipcMain.handle('orcaProfiles:list', (): OrcaProfileListState => getOrcaProfileListState())

  ipcMain.handle('orcaProfiles:authStatus', (): OrcaProfileAuthStatus =>
    getCurrentOrcaProfileAuthStatus(app.getPath('userData'))
  )

  ipcMain.handle(
    'orcaProfiles:createLocal',
    (_event, args?: CreateLocalOrcaProfileArgs): CreateLocalOrcaProfileResult =>
      createLocalOrcaProfile(args)
  )

  ipcMain.handle(
    'orcaProfiles:switch',
    async (_event, args: SwitchOrcaProfileArgs): Promise<SwitchOrcaProfileResult> => {
      const profileId = profileIdFromArgs(args)
      const current = getOrcaProfileListState()
      if (profileId === current.activeProfileId) {
        return { status: 'already-active' }
      }

      // Why: the current profile must be persisted before the global index
      // points startup at the target profile.
      await runBeforeProfileRelaunch(options.onBeforeRelaunch)
      store.flush()
      setActiveOrcaProfile(profileId)

      scheduleProfileRelaunch()

      return { status: 'relaunching' }
    }
  )

  ipcMain.handle(
    'orcaProfiles:transferProject',
    async (
      _event,
      rawArgs: TransferOrcaProfileProjectArgs
    ): Promise<TransferOrcaProfileProjectResult> => {
      const args = transferProjectArgsFromUnknown(rawArgs)
      const current = getOrcaProfileListState()
      if (args.targetProfileId === current.activeProfileId) {
        throw new Error('active_target_orca_profile_transfer_requires_relaunch')
      }
      if (args.mode === 'move' && args.sourceProfileId === current.activeProfileId) {
        await runBeforeProfileRelaunch(options.onBeforeRelaunch)
        store.flush()
        const result = transferOrcaProfileProject(args, app.getPath('userData'))
        if (result.status === 'transferred') {
          setActiveOrcaProfile(args.targetProfileId)
          scheduleProfileRelaunch()
          return { ...result, willRelaunch: true }
        }
        return result
      }
      store.flush()
      return transferOrcaProfileProject(args, app.getPath('userData'))
    }
  )

  ipcMain.handle(
    'orcaProfiles:findProjectProfiles',
    (_event, rawArgs: FindOrcaProfileProjectsByPathArgs): FindOrcaProfileProjectsByPathResult =>
      findOrcaProfileProjectsByPath(
        findProjectsByPathArgsFromUnknown(rawArgs),
        app.getPath('userData')
      )
  )

  ipcMain.handle(
    'orcaProfiles:connectCurrent',
    async (): Promise<ConnectCurrentOrcaProfileResult> =>
      connectCurrentOrcaProfile(app.getPath('userData'))
  )

  ipcMain.handle(
    'orcaProfiles:createCloudLinked',
    async (_event, rawArgs?: CreateCloudLinkedOrcaProfileArgs): Promise<CreateCloudLinkedOrcaProfileResult> =>
      createCloudLinkedOrcaProfile(
        app.getPath('userData'),
        createCloudLinkedProfileArgsFromUnknown(rawArgs)
      )
  )

  ipcMain.handle(
    'orcaProfiles:refreshAuth',
    async (): Promise<RefreshCurrentOrcaProfileAuthResult> =>
      refreshCurrentOrcaProfileAuth(app.getPath('userData'))
  )

  ipcMain.handle(
    'orcaProfiles:signOutCurrent',
    async (): Promise<SignOutCurrentOrcaProfileResult> =>
      signOutCurrentOrcaProfile(app.getPath('userData'))
  )

  ipcMain.handle(
    'orcaProfiles:selectOrg',
    async (_event, rawArgs: SelectOrcaProfileOrgArgs): Promise<SelectOrcaProfileOrgResult> =>
      selectCurrentOrcaProfileOrg(app.getPath('userData'), orgIdFromUnknown(rawArgs))
  )
}
