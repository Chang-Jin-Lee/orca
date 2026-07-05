import type { StateCreator } from 'zustand'
import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import type {
  ConnectCurrentOrcaProfileResult,
  CreateCloudLinkedOrcaProfileResult,
  OrcaProfileAuthStatus,
  OrcaProfileSummary,
  RefreshCurrentOrcaProfileAuthResult,
  SelectOrcaProfileOrgResult,
  SignOutCurrentOrcaProfileResult,
  SwitchOrcaProfileResult,
  TransferOrcaProfileProjectArgs,
  TransferOrcaProfileProjectResult
} from '../../../../shared/orca-profiles'
import type { AppState } from '../types'

export type OrcaProfilesSlice = {
  orcaProfiles: OrcaProfileSummary[]
  activeOrcaProfileId: string | null
  orcaProfileAuthStatus: OrcaProfileAuthStatus | null
  orcaProfilesLoading: boolean
  orcaProfileSwitching: boolean
  orcaProfileConnecting: boolean
  fetchOrcaProfiles: () => Promise<void>
  fetchOrcaProfileAuthStatus: () => Promise<OrcaProfileAuthStatus | null>
  createLocalOrcaProfile: (name?: string) => Promise<OrcaProfileSummary | null>
  createCloudLinkedOrcaProfile: (args: {
    orgId?: string
    name?: string
  }) => Promise<CreateCloudLinkedOrcaProfileResult | null>
  connectCurrentOrcaProfile: () => Promise<ConnectCurrentOrcaProfileResult | null>
  refreshCurrentOrcaProfileAuth: () => Promise<RefreshCurrentOrcaProfileAuthResult | null>
  signOutCurrentOrcaProfile: () => Promise<SignOutCurrentOrcaProfileResult | null>
  selectOrcaProfileOrg: (orgId: string) => Promise<SelectOrcaProfileOrgResult | null>
  switchOrcaProfile: (profileId: string) => Promise<SwitchOrcaProfileResult | null>
  transferOrcaProfileProject: (
    args: TransferOrcaProfileProjectArgs
  ) => Promise<TransferOrcaProfileProjectResult | null>
}

export const createOrcaProfilesSlice: StateCreator<AppState, [], [], OrcaProfilesSlice> = (
  set,
  get
) => ({
  orcaProfiles: [],
  activeOrcaProfileId: null,
  orcaProfileAuthStatus: null,
  orcaProfilesLoading: false,
  orcaProfileSwitching: false,
  orcaProfileConnecting: false,

  fetchOrcaProfiles: async () => {
    set({ orcaProfilesLoading: true })
    try {
      const [state, authStatus] = await Promise.all([
        window.api.orcaProfiles.list(),
        window.api.orcaProfiles.authStatus()
      ])
      set({
        activeOrcaProfileId: state.activeProfileId,
        orcaProfiles: state.profiles,
        orcaProfileAuthStatus: authStatus,
        orcaProfilesLoading: false
      })
    } catch (err) {
      console.error('Failed to fetch Orca profiles:', err)
      set({ orcaProfilesLoading: false })
    }
  },

  fetchOrcaProfileAuthStatus: async () => {
    try {
      const authStatus = await window.api.orcaProfiles.authStatus()
      set({ orcaProfileAuthStatus: authStatus })
      return authStatus
    } catch (err) {
      console.error('Failed to fetch Orca profile auth status:', err)
      return null
    }
  },

  createLocalOrcaProfile: async (name) => {
    try {
      const state = await window.api.orcaProfiles.createLocal({ name })
      set({
        activeOrcaProfileId: state.activeProfileId,
        orcaProfiles: state.profiles
      })
      void get().fetchOrcaProfileAuthStatus()
      return state.profile
    } catch (err) {
      console.error('Failed to create Orca profile:', err)
      toast.error(
        translate('auto.store.slices.orca.profiles.612f7f6861', 'Failed to create profile'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  },

  createCloudLinkedOrcaProfile: async (args) => {
    try {
      const result = await window.api.orcaProfiles.createCloudLinked(args)
      set({
        orcaProfileAuthStatus: result.auth,
        ...(result.status === 'created'
          ? {
              activeOrcaProfileId: result.activeProfileId,
              orcaProfiles: result.profiles
            }
          : {})
      })
      if (result.status === 'created') {
        toast.success(
          translate('auto.store.slices.orca.profiles.319d7cf39b', 'Cloud profile created')
        )
      } else if (result.status === 'reconnect-required') {
        toast.error(
          translate('auto.store.slices.orca.profiles.d6e764e7db', 'Reconnect this profile')
        )
      } else if (result.status === 'failed') {
        toast.error(
          translate(
            'auto.store.slices.orca.profiles.f0c9e11a6d',
            'Failed to create cloud profile'
          ),
          { description: result.error }
        )
      }
      return result
    } catch (err) {
      console.error('Failed to create Orca cloud profile:', err)
      toast.error(
        translate('auto.store.slices.orca.profiles.f0c9e11a6d', 'Failed to create cloud profile'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  },

  connectCurrentOrcaProfile: async () => {
    if (get().orcaProfileConnecting) {
      return null
    }
    set({ orcaProfileConnecting: true })
    try {
      const result = await window.api.orcaProfiles.connectCurrent()
      set({
        orcaProfileConnecting: false,
        orcaProfileAuthStatus: result.auth,
        ...(result.status === 'connected'
          ? {
              activeOrcaProfileId: result.activeProfileId,
              orcaProfiles: result.profiles
            }
          : {})
      })
      if (result.status === 'unconfigured') {
        toast.error(
          translate(
            'auto.store.slices.orca.profiles.8b8fa73174',
            'Orca Cloud sign-in is not configured'
          ),
          {
            description: result.auth.setupMessage
          }
        )
      } else if (result.status === 'failed') {
        toast.error(
          translate('auto.store.slices.orca.profiles.33290e88ed', 'Failed to connect profile'),
          { description: result.error }
        )
      } else if (result.status === 'connected') {
        toast.success(
          translate('auto.store.slices.orca.profiles.9fcb07a796', 'Profile connected')
        )
      }
      return result
    } catch (err) {
      console.error('Failed to connect Orca profile:', err)
      set({ orcaProfileConnecting: false })
      toast.error(
        translate('auto.store.slices.orca.profiles.33290e88ed', 'Failed to connect profile'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  },

  refreshCurrentOrcaProfileAuth: async () => {
    try {
      const result = await window.api.orcaProfiles.refreshAuth()
      set({
        orcaProfileAuthStatus: result.auth,
        ...(result.status === 'refreshed'
          ? {
              activeOrcaProfileId: result.activeProfileId,
              orcaProfiles: result.profiles
            }
          : {})
      })
      if (result.status === 'reconnect-required') {
        toast.error(
          translate('auto.store.slices.orca.profiles.d6e764e7db', 'Reconnect this profile')
        )
      } else if (result.status === 'failed') {
        toast.error(
          translate(
            'auto.store.slices.orca.profiles.2f6c78a039',
            'Failed to refresh profile auth'
          ),
          { description: result.error }
        )
      }
      return result
    } catch (err) {
      console.error('Failed to refresh Orca profile auth:', err)
      toast.error(
        translate('auto.store.slices.orca.profiles.2f6c78a039', 'Failed to refresh profile auth'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  },

  signOutCurrentOrcaProfile: async () => {
    try {
      const result = await window.api.orcaProfiles.signOutCurrent()
      set({
        activeOrcaProfileId: result.activeProfileId,
        orcaProfiles: result.profiles,
        orcaProfileAuthStatus: result.auth
      })
      toast.success(
        translate('auto.store.slices.orca.profiles.a37b5e6d37', 'Signed out of profile')
      )
      return result
    } catch (err) {
      console.error('Failed to sign out of Orca profile:', err)
      toast.error(translate('auto.store.slices.orca.profiles.83600521e7', 'Failed to sign out'), {
        description: err instanceof Error ? err.message : String(err)
      })
      return null
    }
  },

  selectOrcaProfileOrg: async (orgId) => {
    try {
      const result = await window.api.orcaProfiles.selectOrg({ orgId })
      set({
        orcaProfileAuthStatus: result.auth,
        ...(result.status === 'selected'
          ? {
              activeOrcaProfileId: result.activeProfileId,
              orcaProfiles: result.profiles
            }
          : {})
      })
      if (result.status === 'reconnect-required') {
        toast.error(
          translate('auto.store.slices.orca.profiles.d6e764e7db', 'Reconnect this profile')
        )
      } else if (result.status === 'failed') {
        toast.error(
          translate('auto.store.slices.orca.profiles.76deec8f58', 'Failed to switch organization'),
          { description: result.error }
        )
      }
      return result
    } catch (err) {
      console.error('Failed to switch Orca profile org:', err)
      toast.error(
        translate('auto.store.slices.orca.profiles.76deec8f58', 'Failed to switch organization'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  },

  switchOrcaProfile: async (profileId) => {
    if (!profileId || profileId === get().activeOrcaProfileId) {
      return { status: 'already-active' }
    }
    set({ orcaProfileSwitching: true })
    try {
      return await window.api.orcaProfiles.switchProfile({ profileId })
    } catch (err) {
      console.error('Failed to switch Orca profile:', err)
      set({ orcaProfileSwitching: false })
      toast.error(
        translate('auto.store.slices.orca.profiles.7d4bc516ee', 'Failed to switch profile'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  },

  transferOrcaProfileProject: async (args) => {
    try {
      const result = await window.api.orcaProfiles.transferProject(args)
      if (result.status === 'duplicate-target') {
        toast.error(
          translate(
            'auto.store.slices.orca.profiles.f518e89aa5',
            'Project already exists in that profile'
          )
        )
      }
      if (result.status === 'transferred' && result.willRelaunch) {
        set({ orcaProfileSwitching: true })
      }
      return result
    } catch (err) {
      console.error('Failed to transfer Orca profile project:', err)
      toast.error(
        translate('auto.store.slices.orca.profiles.f03ae7f27b', 'Failed to transfer project'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  }
})
