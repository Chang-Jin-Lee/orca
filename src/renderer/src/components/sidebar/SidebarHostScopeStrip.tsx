import React from 'react'
import { AlertTriangle, ChevronDown, Circle, Loader2, Monitor, Server } from 'lucide-react'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  getSidebarHostHealthLabel,
  getSidebarHostScopeLabel,
  shouldShowHostScopeControls,
  type SidebarHostScopeOption
} from './sidebar-host-options'
import { useSidebarHostScopeOptions } from './use-sidebar-host-scope-options'

function HostHealthDot({ health }: { health: SidebarHostScopeOption['health'] }) {
  if (health === 'connecting') {
    return <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
  }
  if (health === 'blocked' || health === 'error') {
    return <AlertTriangle className="size-3 shrink-0 text-destructive" />
  }
  return (
    <Circle
      className={cn(
        'size-2.5 shrink-0 fill-current',
        health === 'available' || health === 'local'
          ? 'text-status-success'
          : health === 'mixed'
            ? 'text-muted-foreground'
            : 'text-muted-foreground/55'
      )}
    />
  )
}

const SidebarHostScopeStrip = React.memo(function SidebarHostScopeStrip() {
  const workspaceHostScope = useAppStore((s) => s.workspaceHostScope)
  const setWorkspaceHostScope = useAppStore((s) => s.setWorkspaceHostScope)
  const { hostOptions, hostScopeOptions } = useSidebarHostScopeOptions()

  if (!shouldShowHostScopeControls(hostOptions)) {
    return null
  }

  const label = getSidebarHostScopeLabel(workspaceHostScope, hostScopeOptions)
  const selectedHost = hostOptions.find((host) => host.id === workspaceHostScope)
  const selectedScope = hostScopeOptions.find((option) => option.id === workspaceHostScope)
  const meta =
    workspaceHostScope === 'all' ? `${hostOptions.length} hosts` : (selectedHost?.detail ?? 'Host')

  return (
    <div className="px-2 pb-1">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-between gap-2 rounded-md border border-sidebar-border/70 bg-sidebar-accent/35 px-2 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <span className="flex min-w-0 items-center gap-2">
              {workspaceHostScope === 'all' ? (
                <Server className="size-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <Monitor className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <HostHealthDot health={selectedScope?.health ?? 'mixed'} />
              <span className="truncate text-xs font-medium">{label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-normal text-muted-foreground">
              {meta}
              <ChevronDown className="size-3" />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={8} className="w-56">
          <DropdownMenuRadioGroup
            value={workspaceHostScope}
            onValueChange={(value) => setWorkspaceHostScope(value as typeof workspaceHostScope)}
          >
            {hostScopeOptions.map((option) => (
              <DropdownMenuRadioItem
                key={option.id}
                value={option.id}
                className="flex-col items-start gap-0.5"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <HostHealthDot health={option.health} />
                  <span className="truncate">{option.label}</span>
                </span>
                {option.detail && (
                  <span className="max-w-44 truncate text-[11px] font-normal text-muted-foreground">
                    {getSidebarHostHealthLabel(option.health)} · {option.detail}
                  </span>
                )}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

export default SidebarHostScopeStrip
