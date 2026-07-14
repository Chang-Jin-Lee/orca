import { useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Terminal } from 'lucide-react'
import type {
  SkillFreshnessInstallation,
  SkillFreshnessStatus,
  SkillInstallationTopology
} from '../../../../shared/skill-freshness'
import {
  buildTargetedSkillUpdateCommand,
  SUPPORTED_GLOBAL_SKILL_TOPOLOGIES
} from '../../../../shared/skill-freshness'
import { useSkillFreshness } from '@/hooks/useSkillFreshness'
import { notifyInstalledAgentSkillsChanged } from '@/hooks/useInstalledAgentSkills'
import { translate } from '@/i18n/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { OnboardingInlineCommandTerminal } from '@/components/onboarding/OnboardingInlineCommandTerminal'
import {
  consumeSkillFreshnessUpdateTerminalRequest,
  subscribeSkillFreshnessUpdateTerminal
} from './skill-freshness-update-terminal'

function statusLabel(status: SkillFreshnessStatus): string {
  switch (status) {
    case 'current':
      return translate('auto.components.skills.SkillFreshnessPanel.current', 'Current')
    case 'outdated':
      return translate('auto.components.skills.SkillFreshnessPanel.outdated', 'Update available')
    case 'newer-known':
      return translate('auto.components.skills.SkillFreshnessPanel.newerKnown', 'Newer known copy')
    case 'unrecognized':
      return translate('auto.components.skills.SkillFreshnessPanel.unrecognized', 'Unrecognized')
    case 'inaccessible':
      return translate('auto.components.skills.SkillFreshnessPanel.inaccessible', 'Inaccessible')
  }
}

function topologyLabel(topology: SkillInstallationTopology): string | null {
  switch (topology) {
    case 'canonical-copy':
      return null
    case 'provider-alias':
      return translate('auto.components.skills.SkillFreshnessPanel.providerAlias', 'Provider alias')
    case 'independent-copy':
      return translate(
        'auto.components.skills.SkillFreshnessPanel.independentCopy',
        'Provider copy'
      )
    case 'external-link':
      return translate('auto.components.skills.SkillFreshnessPanel.externalLink', 'External link')
    case 'broken-link':
      return translate('auto.components.skills.SkillFreshnessPanel.brokenLink', 'Broken link')
    case 'read-only':
      return translate('auto.components.skills.SkillFreshnessPanel.readOnly', 'Read only')
    case 'repo-scope':
      return translate('auto.components.skills.SkillFreshnessPanel.repoScope', 'Repository scope')
    case 'plugin-cache':
      return translate('auto.components.skills.SkillFreshnessPanel.pluginCache', 'Plugin cache')
  }
}

function statusDescription(
  installation: SkillFreshnessInstallation,
  eligibleNames: ReadonlySet<string>
): string {
  switch (installation.status) {
    case 'current':
      return translate(
        'auto.components.skills.SkillFreshnessPanel.currentDescription',
        'Exactly matches the version bundled with this Orca build.'
      )
    case 'outdated':
      if (eligibleNames.has(installation.name)) {
        return translate(
          'auto.components.skills.SkillFreshnessPanel.outdatedDescription',
          'Exactly matches an older official Orca snapshot.'
        )
      }
      // Why: the block can come from this row's own unsupported placement or from
      // a sibling placement of the same name; blaming a phantom sibling misleads.
      return SUPPORTED_GLOBAL_SKILL_TOPOLOGIES.has(installation.topology)
        ? translate(
            'auto.components.skills.SkillFreshnessPanel.outdatedBlockedDescription',
            'An older official copy was found, but another placement of this name prevents a safe global update.'
          )
        : translate(
            'auto.components.skills.SkillFreshnessPanel.outdatedUnsupportedPlacementDescription',
            'An older official copy was found, but this placement cannot be updated safely in place.'
          )
    case 'newer-known':
      return translate(
        'auto.components.skills.SkillFreshnessPanel.newerKnownDescription',
        'Matches a known revision newer than this Orca build. No update is offered.'
      )
    case 'unrecognized':
      return translate(
        'auto.components.skills.SkillFreshnessPanel.unrecognizedDescription',
        'May be edited or from another source. Orca will not update it.'
      )
    case 'inaccessible':
      return translate(
        'auto.components.skills.SkillFreshnessPanel.inaccessibleDescription',
        'Orca could not inspect this placement. No update is offered.'
      )
  }
}

function FreshnessRow({
  installation,
  eligibleNames
}: {
  installation: SkillFreshnessInstallation
  eligibleNames: ReadonlySet<string>
}): React.JSX.Element {
  const topology = topologyLabel(installation.topology)
  return (
    <div className="space-y-1.5 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">{installation.name}</span>
        <Badge variant={installation.status === 'outdated' ? 'secondary' : 'outline'}>
          {statusLabel(installation.status)}
        </Badge>
        {topology ? <Badge variant="outline">{topology}</Badge> : null}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {statusDescription(installation, eligibleNames)}
      </p>
      <p
        className="truncate font-mono text-[11px] text-muted-foreground"
        title={installation.unresolvedPath}
      >
        {installation.unresolvedPath}
      </p>
    </div>
  )
}

export function SkillFreshnessPanel(): React.JSX.Element {
  const state = useSkillFreshness()
  const [terminalOpen, setTerminalOpen] = useState(false)
  const eligibleNames = useMemo(() => state.inventory?.eligibleUpdateNames ?? [], [state.inventory])
  const eligibleNameSet = useMemo(() => new Set(eligibleNames), [eligibleNames])
  const updateCommand = buildTargetedSkillUpdateCommand(eligibleNames)

  useEffect(() => {
    const openIfAvailable = (): void => {
      if (updateCommand && consumeSkillFreshnessUpdateTerminalRequest()) {
        setTerminalOpen(true)
      }
    }
    // Why: the nudge can open this page before inventory resolves. Preserve
    // the pending request until there is a safe targeted command to display.
    openIfAvailable()
    return subscribeSkillFreshnessUpdateTerminal(openIfAvailable)
  }, [updateCommand])

  return (
    <Card className="rounded-lg">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-sm font-semibold">
              {translate(
                'auto.components.skills.SkillFreshnessPanel.title',
                'Orca skill freshness'
              )}
            </h2>
            <p className="text-xs leading-5 text-muted-foreground">
              {translate(
                'auto.components.skills.SkillFreshnessPanel.description',
                'Orca compares installed copies with official snapshots. It never writes to skill folders or runs update commands automatically.'
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={state.loading}
            onClick={() => void state.refresh()}
          >
            <RefreshCw className={state.loading ? 'animate-spin' : undefined} />
            {translate('auto.components.skills.SkillFreshnessPanel.checkNow', 'Check now')}
          </Button>
        </div>

        {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
        {state.inventory?.installations.length ? (
          <div className="divide-y divide-border/40">
            {state.inventory.installations.map((installation) => (
              <FreshnessRow
                key={installation.id}
                installation={installation}
                eligibleNames={eligibleNameSet}
              />
            ))}
          </div>
        ) : state.loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {translate(
              'auto.components.skills.SkillFreshnessPanel.checking',
              'Checking installed Orca skills…'
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {translate(
              'auto.components.skills.SkillFreshnessPanel.none',
              'No installed Orca skills found.'
            )}
          </p>
        )}

        {updateCommand ? (
          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {eligibleNames.length === 1
                    ? translate(
                        'auto.components.skills.SkillFreshnessPanel.updateOne',
                        '1 skill can be updated safely'
                      )
                    : translate(
                        'auto.components.skills.SkillFreshnessPanel.updateMany',
                        '{{value0}} skills can be updated safely',
                        { value0: eligibleNames.length }
                      )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {translate(
                    'auto.components.skills.SkillFreshnessPanel.updateDescription',
                    'Open an editable terminal draft. Review it, then press Enter yourself to run it.'
                  )}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (terminalOpen) {
                    notifyInstalledAgentSkillsChanged()
                  }
                  setTerminalOpen((open) => !open)
                }}
              >
                <Terminal className="size-4" />
                {terminalOpen
                  ? translate(
                      'auto.components.skills.SkillFreshnessPanel.closeTerminal',
                      'Close terminal'
                    )
                  : translate(
                      'auto.components.skills.SkillFreshnessPanel.openTerminal',
                      'Review update command'
                    )}
              </Button>
            </div>
            {terminalOpen ? (
              <OnboardingInlineCommandTerminal
                command={updateCommand}
                title={translate(
                  'auto.components.skills.SkillFreshnessPanel.terminalTitle',
                  'Update Orca skills'
                )}
                description={translate(
                  'auto.components.skills.SkillFreshnessPanel.terminalDescription',
                  'The targeted command is pre-filled but not running. Review it and press Enter to continue.'
                )}
                ariaLabel={translate(
                  'auto.components.skills.SkillFreshnessPanel.terminalAria',
                  'Orca skill update terminal'
                )}
                worktreeId="skill-freshness-update-terminal"
                terminalHeightPx={220}
                terminalTopMarginPx={0}
                autoScrollIntoView={false}
                onTerminalExit={notifyInstalledAgentSkillsChanged}
              />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
