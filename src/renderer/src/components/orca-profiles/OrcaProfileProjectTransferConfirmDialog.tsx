import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { translate } from '@/i18n/i18n'
import type {
  OrcaProfileSummary,
  TransferOrcaProfileProjectMode
} from '../../../../shared/orca-profiles'
import type { Repo } from '../../../../shared/types'
import type { OrcaProfileSwitchLiveWorkSummary } from './orca-profile-switch-liveness'

type PendingProjectTransfer = {
  repo: Repo
  targetProfile: OrcaProfileSummary
  mode: TransferOrcaProfileProjectMode
  liveWorkSummary: OrcaProfileSwitchLiveWorkSummary
}

export type { PendingProjectTransfer }

function liveWorkLines(summary: OrcaProfileSwitchLiveWorkSummary): string[] {
  const lines: string[] = []
  if (summary.liveTerminalTabCount > 0) {
    lines.push(
      translate(
        'auto.components.orca.profiles.project.transfer.confirm.terminal',
        '{{count}} live terminal tabs',
        { count: summary.liveTerminalTabCount }
      )
    )
  }
  if (summary.liveAgentCount > 0) {
    lines.push(
      translate(
        'auto.components.orca.profiles.project.transfer.confirm.agent',
        '{{count}} active agents',
        { count: summary.liveAgentCount }
      )
    )
  }
  if (summary.browserWorkspaceCount > 0) {
    lines.push(
      translate(
        'auto.components.orca.profiles.project.transfer.confirm.browser',
        '{{count}} browser workspaces',
        { count: summary.browserWorkspaceCount }
      )
    )
  }
  return lines
}

export function OrcaProfileProjectTransferConfirmDialog({
  activeProfileName,
  pendingTransfer,
  pending,
  onCancel,
  onConfirm
}: {
  activeProfileName: string
  pendingTransfer: PendingProjectTransfer | null
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}): React.JSX.Element {
  const mode = pendingTransfer?.mode ?? 'copy'
  const repoName = pendingTransfer?.repo.displayName ?? ''
  const targetName = pendingTransfer?.targetProfile.name ?? ''
  const lines = pendingTransfer ? liveWorkLines(pendingTransfer.liveWorkSummary) : []

  return (
    <Dialog
      open={Boolean(pendingTransfer)}
      onOpenChange={(open) => {
        if (!open && !pending) {
          onCancel()
        }
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-4 text-muted-foreground" />
            {mode === 'move'
              ? translate(
                  'auto.components.orca.profiles.project.transfer.confirm.move.title',
                  'Move project?'
                )
              : translate(
                  'auto.components.orca.profiles.project.transfer.confirm.copy.title',
                  'Copy project?'
                )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'move'
              ? translate(
                  'auto.components.orca.profiles.project.transfer.confirm.move.description',
                  'Move {{repoName}} to {{targetName}}. Orca removes it from {{activeProfileName}}, keeps files in place, and relaunches into {{targetName}}.',
                  { activeProfileName, repoName, targetName }
                )
              : translate(
                  'auto.components.orca.profiles.project.transfer.confirm.copy.description',
                  'Copy {{repoName}} to {{targetName}}. Both profiles will point at the same files with separate Orca metadata.',
                  { repoName, targetName }
                )}
          </DialogDescription>
        </DialogHeader>

        {lines.length > 0 ? (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <div className="mb-1 font-medium text-foreground">
              {translate(
                'auto.components.orca.profiles.project.transfer.confirm.live.work',
                'Live work in this project'
              )}
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            {translate(
              'auto.components.orca.profiles.project.transfer.confirm.cancel',
              'Cancel'
            )}
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={pending || !pendingTransfer}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === 'move'
              ? translate(
                  'auto.components.orca.profiles.project.transfer.confirm.move.action',
                  'Move project'
                )
              : translate(
                  'auto.components.orca.profiles.project.transfer.confirm.copy.action',
                  'Copy project'
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
