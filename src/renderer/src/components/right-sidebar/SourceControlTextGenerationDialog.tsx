import React, { useMemo } from 'react'
import { TriangleAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  normalizeSourceControlAiSettings,
  resolveSourceControlAiForOperation,
  type ResolvedSourceControlAiGenerationParams
} from '../../../../shared/source-control-ai'
import type { SourceControlTextActionId } from '../../../../shared/source-control-ai-actions'
import type { GlobalSettings, Repo } from '../../../../shared/types'
import { SourceControlTextGenerationDialogForm } from './SourceControlTextGenerationDialogForm'

export { buildCommitMessageGenerationParams } from './SourceControlTextGenerationParams'

type SourceControlTextGenerationBaseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: GlobalSettings | null
  repo?: Pick<Repo, 'sourceControlAi'> | null
  discoveryHostKey: string
  onGenerate: (params: ResolvedSourceControlAiGenerationParams) => void
  onSaveDefaults: (params: ResolvedSourceControlAiGenerationParams) => Promise<void> | void
}

type SourceControlTextGenerationDialogProps = SourceControlTextGenerationBaseDialogProps & {
  actionId: SourceControlTextActionId
  title: string
  description: string
  generateLabel: string
}

export function SourceControlTextGenerationDialog({
  actionId,
  title,
  description,
  generateLabel,
  open,
  onOpenChange,
  settings,
  repo,
  discoveryHostKey,
  onGenerate,
  onSaveDefaults
}: SourceControlTextGenerationDialogProps): React.JSX.Element {
  const resolved = useMemo(
    () =>
      settings
        ? resolveSourceControlAiForOperation({
            settings,
            repo: repo ?? null,
            operation: actionId,
            discoveryHostKey
          })
        : { ok: false as const, error: 'Settings are not loaded.' },
    [actionId, discoveryHostKey, repo, settings]
  )
  const baseParams = resolved.ok ? resolved.value.params : null
  const sourceControlAi = useMemo(
    () =>
      settings
        ? normalizeSourceControlAiSettings(settings.sourceControlAi, settings.commitMessageAi)
        : null,
    [settings]
  )
  const formKey = open
    ? JSON.stringify([
        actionId,
        baseParams?.agentId ?? '',
        baseParams?.commandInputTemplate ?? '',
        baseParams?.agentArgs ?? '',
        baseParams?.customAgentCommand ?? ''
      ])
    : 'closed'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>

        {!resolved.ok ? (
          <p className="flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
            {resolved.error}
          </p>
        ) : null}

        <SourceControlTextGenerationDialogForm
          key={formKey}
          actionId={actionId}
          generateLabel={generateLabel}
          settings={settings}
          baseParams={baseParams}
          sourceControlAi={sourceControlAi}
          onGenerate={onGenerate}
          onOpenChange={onOpenChange}
          onSaveDefaults={onSaveDefaults}
        />
      </DialogContent>
    </Dialog>
  )
}
