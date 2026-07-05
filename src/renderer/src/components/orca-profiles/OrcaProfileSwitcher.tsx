import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Cloud, Laptop, Loader2, Plus, Settings2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { translate } from '@/i18n/i18n'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import type { OrcaCloudOrgSummary, OrcaProfileSummary } from '../../../../shared/orca-profiles'
import { OrcaProfileAvatar } from './OrcaProfileAvatar'
import { OrcaProfileCloudMenuItems } from './OrcaProfileCloudMenuItems'
import { OrcaProfileCreateDialog } from './OrcaProfileCreateDialog'
import { OrcaProfileManagementDialog } from './OrcaProfileManagementDialog'
import { OrcaProfileSignOutConfirmDialog } from './OrcaProfileSignOutConfirmDialog'
import { OrcaProfileSwitchConfirmDialog } from './OrcaProfileSwitchConfirmDialog'
import { getOrcaProfileSwitchLiveWorkSummary } from './orca-profile-switch-liveness'

function getProfileSubtitle(profile: OrcaProfileSummary): string {
  if (profile.cloud?.activeOrgName) {
    return profile.cloud.activeOrgName
  }
  if (profile.cloud?.email) {
    return profile.cloud.email
  }
  return translate('auto.components.orca.profiles.switcher.b4f9d1125d', 'Local')
}

export function OrcaProfileSwitcher({
  placement = 'titlebar'
}: {
  placement?: 'titlebar' | 'sidebar'
}): React.JSX.Element | null {
  const profiles = useAppStore((s) => s.orcaProfiles)
  const activeProfileId = useAppStore((s) => s.activeOrcaProfileId)
  const loading = useAppStore((s) => s.orcaProfilesLoading)
  const switching = useAppStore((s) => s.orcaProfileSwitching)
  const connecting = useAppStore((s) => s.orcaProfileConnecting)
  const authStatus = useAppStore((s) => s.orcaProfileAuthStatus)
  const fetchProfiles = useAppStore((s) => s.fetchOrcaProfiles)
  const createLocalProfile = useAppStore((s) => s.createLocalOrcaProfile)
  const createCloudLinkedProfile = useAppStore((s) => s.createCloudLinkedOrcaProfile)
  const connectCurrentProfile = useAppStore((s) => s.connectCurrentOrcaProfile)
  const signOutCurrentProfile = useAppStore((s) => s.signOutCurrentOrcaProfile)
  const selectOrg = useAppStore((s) => s.selectOrcaProfileOrg)
  const switchProfile = useAppStore((s) => s.switchOrcaProfile)
  const liveWorkSummary = useAppStore(useShallow((s) => getOrcaProfileSwitchLiveWorkSummary(s)))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [managementOpen, setManagementOpen] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [creating, setCreating] = useState(false)
  const [creatingCloudProfile, setCreatingCloudProfile] = useState(false)
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [pendingSwitchProfileId, setPendingSwitchProfileId] = useState<string | null>(null)
  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? null,
    [activeProfileId, profiles]
  )
  const pendingSwitchProfile = useMemo(
    () => profiles.find((profile) => profile.id === pendingSwitchProfileId) ?? null,
    [pendingSwitchProfileId, profiles]
  )

  useEffect(() => {
    if (profiles.length === 0 && !loading) {
      void fetchProfiles()
    }
  }, [fetchProfiles, loading, profiles.length])

  if (!activeProfile) {
    return null
  }

  const handleCreateProfile = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (creating || switching) {
      return
    }
    setCreating(true)
    const profile = await createLocalProfile(newProfileName)
    setCreating(false)
    if (!profile) {
      return
    }
    setNewProfileName('')
    setDialogOpen(false)
    if (liveWorkSummary.hasLiveWork) {
      setPendingSwitchProfileId(profile.id)
      return
    }
    await switchProfile(profile.id)
  }

  const handleSwitchProfile = (profileId: string): void => {
    if (profileId === activeProfileId || switching) {
      return
    }
    if (liveWorkSummary.hasLiveWork) {
      setPendingSwitchProfileId(profileId)
      return
    }
    void switchProfile(profileId)
  }

  const handleConfirmSwitchProfile = (): void => {
    if (!pendingSwitchProfileId || switching) {
      return
    }
    void switchProfile(pendingSwitchProfileId)
  }

  const handleCreateCloudProfileForOrg = async (
    organization: OrcaCloudOrgSummary
  ): Promise<void> => {
    if (creatingCloudProfile || switching) {
      return
    }
    setCreatingCloudProfile(true)
    const result = await createCloudLinkedProfile({
      orgId: organization.orgId,
      name: organization.name
    })
    setCreatingCloudProfile(false)
    if (result?.status !== 'created') {
      return
    }
    if (liveWorkSummary.hasLiveWork) {
      setPendingSwitchProfileId(result.profile.id)
      return
    }
    await switchProfile(result.profile.id)
  }

  const handleConfirmSignOut = async (): Promise<void> => {
    if (signingOut) {
      return
    }
    setSigningOut(true)
    const result = await signOutCurrentProfile()
    setSigningOut(false)
    if (result) {
      setSignOutConfirmOpen(false)
    }
  }

  const profileActionDisabled =
    switching || creating || creatingCloudProfile || connecting || signingOut
  const sidebarPlacement = placement === 'sidebar'

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size={sidebarPlacement ? 'icon-xs' : 'xs'}
                className={cn(
                  'text-muted-foreground titlebar-profile-switcher',
                  sidebarPlacement ? 'px-0' : 'mr-2 max-w-[180px] gap-1.5 px-1.5'
                )}
                disabled={profileActionDisabled}
                aria-label={translate(
                  'auto.components.orca.profiles.switcher.4815f7d163',
                  'Switch profile'
                )}
              >
                {sidebarPlacement && switching ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <OrcaProfileAvatar
                    profile={activeProfile}
                    className={
                      sidebarPlacement
                        ? 'size-4 border-worktree-sidebar-border bg-worktree-sidebar-accent text-[10px] text-worktree-sidebar-accent-foreground'
                        : undefined
                    }
                  />
                )}
                {!sidebarPlacement ? (
                  <>
                    <span className="hidden max-w-[108px] truncate text-xs font-medium sm:inline">
                      {activeProfile.name}
                    </span>
                    {switching ? <Loader2 className="size-3 animate-spin" /> : <ChevronDown />}
                  </>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side={sidebarPlacement ? 'top' : 'bottom'} sideOffset={6}>
            {translate('auto.components.orca.profiles.switcher.4815f7d163', 'Switch profile')}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          align={sidebarPlacement ? 'start' : 'end'}
          side={sidebarPlacement ? 'top' : 'bottom'}
          sideOffset={sidebarPlacement ? 8 : 6}
          className="w-64"
        >
          <DropdownMenuLabel className="px-2 py-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <OrcaProfileAvatar profile={activeProfile} className="size-7 text-xs" />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-foreground">
                  {activeProfile.name}
                </div>
                <div className="truncate text-[11px] font-medium text-muted-foreground">
                  {getProfileSubtitle(activeProfile)}
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {profiles.map((profile) => {
            const active = profile.id === activeProfileId
            return (
              <DropdownMenuItem
                key={profile.id}
                disabled={profileActionDisabled}
                onSelect={() => handleSwitchProfile(profile.id)}
                className="min-w-0"
              >
                <OrcaProfileAvatar profile={profile} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{profile.name}</span>
                  <span className="block truncate text-[11px] font-normal text-muted-foreground">
                    {getProfileSubtitle(profile)}
                  </span>
                </span>
                {profile.kind === 'cloud-linked' ? <Cloud className="size-3.5" /> : <Laptop />}
                {active && <Check className="size-3.5 text-foreground" />}
              </DropdownMenuItem>
            )
          })}
          <OrcaProfileCloudMenuItems
            activeProfile={activeProfile}
            authStatus={authStatus}
            connecting={connecting}
            profileActionDisabled={profileActionDisabled}
            onConnect={() => {
              void connectCurrentProfile()
            }}
            onCreateProfileForOrg={(organization) => {
              void handleCreateCloudProfileForOrg(organization)
            }}
            onSelectOrg={(orgId) => {
              void selectOrg(orgId)
            }}
            onRequestSignOut={() => setSignOutConfirmOpen(true)}
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={profileActionDisabled}
            onSelect={() => {
              setManagementOpen(true)
            }}
          >
            <Settings2 />
            {translate('auto.components.orca.profiles.switcher.d00d853e2a', 'Manage profiles')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={profileActionDisabled}
            onSelect={() => {
              setDialogOpen(true)
            }}
          >
            <Plus />
            {translate('auto.components.orca.profiles.switcher.c106c674fe', 'New local profile')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <OrcaProfileCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        name={newProfileName}
        onNameChange={setNewProfileName}
        creating={creating}
        switching={switching}
        onSubmit={handleCreateProfile}
      />
      <OrcaProfileManagementDialog
        open={managementOpen}
        onOpenChange={setManagementOpen}
        activeProfile={activeProfile}
        profiles={profiles}
      />
      <OrcaProfileSignOutConfirmDialog
        open={signOutConfirmOpen}
        onOpenChange={(open) => {
          if (!signingOut) {
            setSignOutConfirmOpen(open)
          }
        }}
        onConfirm={() => {
          void handleConfirmSignOut()
        }}
        profileName={activeProfile.name}
        signingOut={signingOut}
      />
      <OrcaProfileSwitchConfirmDialog
        open={Boolean(pendingSwitchProfileId)}
        onOpenChange={(open) => {
          if (!open && !switching) {
            setPendingSwitchProfileId(null)
          }
        }}
        onConfirm={handleConfirmSwitchProfile}
        activeProfileName={activeProfile.name}
        targetProfile={pendingSwitchProfile}
        liveWorkSummary={liveWorkSummary}
        switching={switching}
      />
    </>
  )
}
