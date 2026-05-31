import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, RefreshCw, Save, Sparkles, Terminal, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { AGENT_CATALOG, AgentIcon } from '@/lib/agent-catalog'
import { planSourceControlCommitMessageGeneration } from '@/lib/source-control-generation-plan'
import {
  CUSTOM_AGENT_ID,
  getCommitMessageAgentCapability,
  isCustomAgentId,
  listCommitMessageAgentCapabilities
} from '../../../../shared/commit-message-agent-spec'
import {
  resolveSourceControlAiForOperation,
  type ResolvedSourceControlAiGenerationParams
} from '../../../../shared/source-control-ai'
import { setSourceControlActionDefault } from '../../../../shared/source-control-ai-actions'
import type { SourceControlAiSettings } from '../../../../shared/source-control-ai-types'
import type { GlobalSettings, Repo, TuiAgent } from '../../../../shared/types'
import { toast } from 'sonner'
import { SourceControlActionVariableChips } from '../source-control/SourceControlActionVariableChips'

type PlanState =
  | { status: 'idle' }
  | { status: 'success'; commandLabel: string; delivery: string; caveat: string }
  | { status: 'error'; error: string }

type SourceControlCommitMessageGenerationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: GlobalSettings | null
  repo?: Pick<Repo, 'sourceControlAi'> | null
  discoveryHostKey: string
  onGenerate: (params: ResolvedSourceControlAiGenerationParams) => void
  onSaveDefaults: (params: ResolvedSourceControlAiGenerationParams) => Promise<void> | void
}

const UNCONFIGURED_AGENT_SELECT_VALUE = ''
type CommitMessageGenerationAgentChoice = ResolvedSourceControlAiGenerationParams['agentId'] | ''

function agentLabel(agentId: TuiAgent): string {
  return AGENT_CATALOG.find((agent) => agent.id === agentId)?.label ?? agentId
}

export function buildCommitMessageGenerationParams(args: {
  agentId: CommitMessageGenerationAgentChoice
  commandTemplate: string
  baseParams: ResolvedSourceControlAiGenerationParams | null
  settings: Pick<GlobalSettings, 'agentCmdOverrides'> | null | undefined
}): ResolvedSourceControlAiGenerationParams | null {
  if (!args.agentId) {
    return null
  }
  if (isCustomAgentId(args.agentId)) {
    return {
      agentId: CUSTOM_AGENT_ID,
      model: '',
      customPrompt: args.baseParams?.customPrompt,
      commandInputTemplate: args.commandTemplate,
      customAgentCommand: args.baseParams?.customAgentCommand ?? ''
    }
  }
  const capability = getCommitMessageAgentCapability(args.agentId)
  if (!capability) {
    return null
  }
  const sameResolvedAgent = args.baseParams?.agentId === args.agentId
  const modelId =
    sameResolvedAgent && args.baseParams?.model
      ? args.baseParams.model
      : (capability.models.find((model) => model.id === capability.defaultModelId)?.id ??
        capability.defaultModelId)
  const model = capability.models.find((candidate) => candidate.id === modelId)
  const thinkingLevel =
    sameResolvedAgent && args.baseParams?.thinkingLevel
      ? args.baseParams.thinkingLevel
      : model?.defaultThinkingLevel
  const agentCommandOverride = args.settings?.agentCmdOverrides?.[args.agentId]?.trim()
  return {
    agentId: args.agentId,
    model: modelId,
    ...(thinkingLevel ? { thinkingLevel } : {}),
    commandInputTemplate: args.commandTemplate,
    ...(agentCommandOverride ? { agentCommandOverride } : {})
  }
}

export function SourceControlCommitMessageGenerationDialog({
  open,
  onOpenChange,
  settings,
  repo,
  discoveryHostKey,
  onGenerate,
  onSaveDefaults
}: SourceControlCommitMessageGenerationDialogProps): React.JSX.Element {
  const resolved = useMemo(
    () =>
      settings
        ? resolveSourceControlAiForOperation({
            settings,
            repo: repo ?? null,
            operation: 'commitMessage',
            discoveryHostKey
          })
        : { ok: false as const, error: 'Settings are not loaded.' },
    [discoveryHostKey, repo, settings]
  )
  const baseParams = resolved.ok ? resolved.value.params : null
  const capabilities = useMemo(listCommitMessageAgentCapabilities, [])
  const showCustomAgent = Boolean(
    baseParams && (isCustomAgentId(baseParams.agentId) || baseParams.customAgentCommand?.trim())
  )
  const [agentId, setAgentId] = useState<CommitMessageGenerationAgentChoice>('')
  const [commandTemplate, setCommandTemplate] = useState('{basePrompt}')
  const [plan, setPlan] = useState<PlanState>({ status: 'idle' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !baseParams) {
      return
    }
    setAgentId(baseParams.agentId)
    setCommandTemplate(baseParams.commandInputTemplate ?? '{basePrompt}')
    setPlan({ status: 'idle' })
  }, [baseParams, open])

  const params = buildCommitMessageGenerationParams({
    agentId,
    commandTemplate,
    baseParams,
    settings
  })
  const paramsPlanResult = params ? planSourceControlCommitMessageGeneration(params) : null
  const canRunGeneration = Boolean(params && paramsPlanResult?.ok)

  const handlePlan = (): void => {
    if (!params || !paramsPlanResult) {
      setPlan({ status: 'error', error: 'Choose an agent before checking generation.' })
      return
    }
    setPlan(
      paramsPlanResult.ok
        ? {
            status: 'success',
            commandLabel: paramsPlanResult.commandLabel,
            delivery: paramsPlanResult.delivery,
            caveat: paramsPlanResult.caveat
          }
        : { status: 'error', error: paramsPlanResult.error }
    )
  }

  const handleGenerate = (): void => {
    if (!params || !paramsPlanResult?.ok) {
      if (paramsPlanResult && !paramsPlanResult.ok) {
        setPlan({ status: 'error', error: paramsPlanResult.error })
      }
      return
    }
    onGenerate(params)
    onOpenChange(false)
  }

  const handleSaveDefaults = async (): Promise<void> => {
    if (!params || saving || !paramsPlanResult?.ok) {
      if (paramsPlanResult && !paramsPlanResult.ok) {
        setPlan({ status: 'error', error: paramsPlanResult.error })
      }
      return
    }
    setSaving(true)
    try {
      await onSaveDefaults(params)
      toast.success('Saved commit-message recipe.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-sm">Generate Commit Message</DialogTitle>
          <DialogDescription className="text-xs">
            Choose the agent and command template for this run.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!resolved.ok ? (
            <p className="flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <TriangleAlert className="mt-px size-3.5 shrink-0" />
              {resolved.error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label className="text-xs">Agent</Label>
            <Select
              value={agentId || UNCONFIGURED_AGENT_SELECT_VALUE}
              onValueChange={(value) => {
                if (value === UNCONFIGURED_AGENT_SELECT_VALUE) {
                  return
                }
                setAgentId(value === CUSTOM_AGENT_ID ? CUSTOM_AGENT_ID : (value as TuiAgent))
                setPlan({ status: 'idle' })
              }}
            >
              <SelectTrigger size="sm" className="h-8 text-xs">
                <SelectValue placeholder="Choose agent" />
              </SelectTrigger>
              <SelectContent>
                {capabilities.map((capability) => (
                  <SelectItem key={capability.id} value={capability.id}>
                    <span className="flex items-center gap-2">
                      <AgentIcon agent={capability.id} size={14} />
                      {agentLabel(capability.id)}
                    </span>
                  </SelectItem>
                ))}
                {showCustomAgent ? (
                  <SelectItem value={CUSTOM_AGENT_ID}>
                    <span className="flex items-center gap-2">
                      <Terminal className="size-3.5 text-muted-foreground" />
                      Custom command
                    </span>
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commit-message-command-template" className="text-xs">
              Command template
            </Label>
            <textarea
              id="commit-message-command-template"
              rows={8}
              value={commandTemplate}
              spellCheck={false}
              onChange={(event) => {
                setCommandTemplate(event.target.value)
                setPlan({ status: 'idle' })
              }}
              className="w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-ring"
            />
            <SourceControlActionVariableChips
              actionId="commitMessage"
              onInsert={(variable) => {
                const separator =
                  commandTemplate.endsWith('\n') || commandTemplate.length === 0 ? '' : ' '
                setCommandTemplate(`${commandTemplate}${separator}{${variable}}`)
                setPlan({ status: 'idle' })
              }}
            />
          </div>

          {plan.status !== 'idle' ? (
            <div
              className={
                plan.status === 'error'
                  ? 'rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive'
                  : 'space-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground'
              }
            >
              {plan.status === 'error' ? (
                <span className="flex items-start gap-2">
                  <TriangleAlert className="mt-px size-3.5 shrink-0" />
                  {plan.error}
                </span>
              ) : (
                <>
                  <div className="flex items-start gap-2 text-foreground">
                    <CheckCircle2 className="mt-px size-3.5 shrink-0 text-emerald-500" />
                    {plan.delivery}
                  </div>
                  <div className="truncate font-mono text-[11px]">Launch: {plan.commandLabel}</div>
                  <div className="text-[11px]">{plan.caveat}</div>
                </>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handlePlan}>
            <CheckCircle2 className="size-4" />
            Check generation
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canRunGeneration || saving}
            onClick={() => void handleSaveDefaults()}
          >
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save as default
          </Button>
          <Button type="button" size="sm" disabled={!canRunGeneration} onClick={handleGenerate}>
            <Sparkles className="size-4" />
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function applyCommitMessageGenerationDefaults(
  current: SourceControlAiSettings,
  _hostKey: string,
  params: ResolvedSourceControlAiGenerationParams
): SourceControlAiSettings {
  if (params.agentId === CUSTOM_AGENT_ID) {
    const currentCommitRecipe = current.actions?.commitMessage ?? {}
    const { agentId: _agentId, ...recipeWithoutAgent } = currentCommitRecipe
    return {
      ...current,
      actions: {
        ...current.actions,
        commitMessage: {
          ...recipeWithoutAgent,
          commandInputTemplate: params.commandInputTemplate ?? '{basePrompt}'
        }
      }
    }
  }
  return {
    ...current,
    actions: setSourceControlActionDefault(current.actions, 'commitMessage', {
      agentId: params.agentId,
      commandInputTemplate: params.commandInputTemplate ?? '{basePrompt}'
    })
  }
}
