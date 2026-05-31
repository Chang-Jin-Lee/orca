/* eslint-disable max-lines -- Why: action launch customization keeps agent
   selection, dry-run planning, save defaults, and execution in one modal. */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, RefreshCw, RotateCcw, Settings, Sparkles, TriangleAlert } from 'lucide-react'
import AgentCombobox from '@/components/agent/AgentCombobox'
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
import { AGENT_CATALOG, getAgentLabel } from '@/lib/agent-catalog'
import { focusTerminalTabSurface } from '@/lib/focus-terminal-tab-surface'
import { launchAgentInNewTab } from '@/lib/launch-agent-in-new-tab'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import {
  renderSourceControlActionCommandTemplate,
  type SourceControlActionRecipe,
  type SourceControlLaunchActionId
} from '../../../../shared/source-control-ai-actions'
import { isTuiAgentEnabled } from '../../../../shared/tui-agent-selection'
import type { TuiAgent } from '../../../../shared/types'
import type { LaunchSource } from '../../../../shared/telemetry-events'
import { planSourceControlAgentActionLaunch } from '@/lib/source-control-agent-action-plan'
import { pickSourceControlLaunchAgent } from '@/lib/source-control-launch-agent-selection'
import { toast } from 'sonner'
import { SourceControlActionVariableChips } from '../source-control/SourceControlActionVariableChips'

type DeliveryPlanState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'success'; summary: string; commandLabel: string; caveat: string }
  | { status: 'error'; error: string }

export type SourceControlAgentActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionId: SourceControlLaunchActionId
  title: string
  description: string
  baseCommandInput: string
  savedCommandInputTemplate?: string | null
  worktreeId?: string | null
  groupId?: string | null
  connectionId?: string | null
  promptDelivery?: 'auto-submit' | 'draft' | 'submit-after-ready'
  launchSource: LaunchSource
  savedAgentId?: TuiAgent | null
  onSaveAgentDefault?: (
    actionId: SourceControlLaunchActionId,
    recipe: SourceControlActionRecipe
  ) => void | Promise<void>
  onOpenSettings?: () => void
  onLaunched?: () => void
  startLabel?: string
  onStart?: (args: { agent: TuiAgent; commandInput: string }) => boolean | Promise<boolean>
}

function isAgentDetectedAndEnabled(
  agent: TuiAgent | null,
  detectedAgents: TuiAgent[],
  disabledAgents: TuiAgent[] | undefined
): boolean {
  return Boolean(
    agent && detectedAgents.includes(agent) && isTuiAgentEnabled(agent, disabledAgents)
  )
}

export function SourceControlAgentActionDialog({
  open,
  onOpenChange,
  actionId,
  title,
  description,
  baseCommandInput,
  savedCommandInputTemplate,
  worktreeId,
  groupId,
  connectionId,
  promptDelivery = 'submit-after-ready',
  launchSource,
  savedAgentId,
  onSaveAgentDefault,
  onOpenSettings,
  onLaunched,
  startLabel = 'Start agent',
  onStart
}: SourceControlAgentActionDialogProps): React.JSX.Element {
  const settings = useAppStore((state) => state.settings)
  const ensureDetectedAgents = useAppStore((state) => state.ensureDetectedAgents)
  const ensureRemoteDetectedAgents = useAppStore((state) => state.ensureRemoteDetectedAgents)
  const [commandTemplate, setCommandTemplate] = useState(
    savedCommandInputTemplate ?? '{basePrompt}'
  )
  const [selectedAgent, setSelectedAgent] = useState<TuiAgent | null>(savedAgentId ?? null)
  const [detectedAgents, setDetectedAgents] = useState<TuiAgent[]>([])
  const [detecting, setDetecting] = useState(false)
  const [deliveryPlan, setDeliveryPlan] = useState<DeliveryPlanState>({ status: 'idle' })
  const [isStarting, setIsStarting] = useState(false)
  const [saveAgentDefault, setSaveAgentDefault] = useState(false)

  const disabledAgents = settings?.disabledTuiAgents
  const connectionUnavailable = Boolean(worktreeId && connectionId === undefined)

  const refreshDetectedAgents = useCallback(async (): Promise<TuiAgent[]> => {
    if (connectionUnavailable) {
      setDetectedAgents([])
      setDetecting(false)
      return []
    }
    setDetecting(true)
    try {
      const nextAgents =
        typeof connectionId === 'string'
          ? await ensureRemoteDetectedAgents(connectionId)
          : await ensureDetectedAgents()
      setDetectedAgents(nextAgents)
      return nextAgents
    } finally {
      setDetecting(false)
    }
  }, [connectionId, connectionUnavailable, ensureDetectedAgents, ensureRemoteDetectedAgents])

  useEffect(() => {
    if (!open) {
      return
    }
    setCommandTemplate(savedCommandInputTemplate ?? '{basePrompt}')
    setDeliveryPlan({ status: 'idle' })
    setSaveAgentDefault(false)
    setSelectedAgent(savedAgentId ?? null)
    let stale = false
    void refreshDetectedAgents().then((nextAgents) => {
      if (stale) {
        return
      }
      setSelectedAgent((current) =>
        isAgentDetectedAndEnabled(current, nextAgents, disabledAgents)
          ? current
          : current
            ? current
            : pickSourceControlLaunchAgent({
                savedAgent: savedAgentId,
                defaultAgent: settings?.defaultTuiAgent,
                detectedAgents: nextAgents,
                disabledAgents
              })
      )
    })
    return () => {
      stale = true
    }
  }, [
    baseCommandInput,
    disabledAgents,
    open,
    refreshDetectedAgents,
    savedAgentId,
    savedCommandInputTemplate,
    settings?.defaultTuiAgent
  ])

  const enabledDetectedAgents = useMemo(
    () => detectedAgents.filter((agent) => isTuiAgentEnabled(agent, disabledAgents)),
    [detectedAgents, disabledAgents]
  )
  const agentOptions = useMemo(
    () =>
      AGENT_CATALOG.filter(
        (entry) => enabledDetectedAgents.includes(entry.id) || entry.id === selectedAgent
      ),
    [enabledDetectedAgents, selectedAgent]
  )
  const selectedAgentUnavailable = Boolean(
    selectedAgent && !isAgentDetectedAndEnabled(selectedAgent, detectedAgents, disabledAgents)
  )
  const hasEnabledAgents = enabledDetectedAgents.length > 0
  const commandInput = renderSourceControlActionCommandTemplate(commandTemplate, {
    basePrompt: baseCommandInput
  })
  const trimmedCommandInput = commandInput.trim()
  const canStart =
    Boolean(trimmedCommandInput) &&
    Boolean(selectedAgent) &&
    !selectedAgentUnavailable &&
    !connectionUnavailable &&
    !detecting &&
    !isStarting

  const buildPlan = useCallback(
    async (agentsOverride?: TuiAgent[]): Promise<DeliveryPlanState> => {
      const currentDetectedAgents = agentsOverride ?? (await refreshDetectedAgents())
      if (connectionUnavailable) {
        return { status: 'error', error: 'Unable to resolve the workspace connection.' }
      }
      const result = planSourceControlAgentActionLaunch({
        agent: selectedAgent,
        commandInput,
        promptDelivery,
        detectedAgents: currentDetectedAgents,
        disabledAgents: useAppStore.getState().settings?.disabledTuiAgents,
        cmdOverrides: useAppStore.getState().settings?.agentCmdOverrides
      })
      if (!result.ok) {
        return { status: 'error', error: result.error }
      }
      return {
        status: 'success',
        summary: result.summary,
        commandLabel: result.commandLabel,
        caveat: result.caveat
      }
    },
    [commandInput, connectionUnavailable, promptDelivery, refreshDetectedAgents, selectedAgent]
  )

  const handleCheckDelivery = useCallback(async () => {
    setDeliveryPlan({ status: 'checking' })
    setDeliveryPlan(await buildPlan())
  }, [buildPlan])

  const handleStart = useCallback(async () => {
    if (!selectedAgent || isStarting) {
      return
    }
    if (connectionUnavailable) {
      setDeliveryPlan({ status: 'error', error: 'Unable to resolve the workspace connection.' })
      return
    }
    setIsStarting(true)
    try {
      const nextAgents = await refreshDetectedAgents()
      const nextPlan = await buildPlan(nextAgents)
      if (nextPlan.status === 'error') {
        setDeliveryPlan(nextPlan)
        return
      }
      setDeliveryPlan(nextPlan)

      let launched = false
      if (onStart) {
        launched = await onStart({ agent: selectedAgent, commandInput: trimmedCommandInput })
      } else if (worktreeId) {
        const result = launchAgentInNewTab({
          agent: selectedAgent,
          worktreeId,
          groupId: groupId ?? worktreeId,
          prompt: trimmedCommandInput,
          promptDelivery,
          launchSource
        })
        launched = Boolean(result)
        if (result) {
          focusTerminalTabSurface(result.tabId)
        }
      }
      if (!launched) {
        toast.error('Could not start the selected agent.')
        return
      }
      if (saveAgentDefault && onSaveAgentDefault) {
        await onSaveAgentDefault(actionId, {
          agentId: selectedAgent,
          commandInputTemplate: commandTemplate
        })
      }
      onLaunched?.()
      onOpenChange(false)
    } finally {
      setIsStarting(false)
    }
  }, [
    actionId,
    buildPlan,
    commandTemplate,
    connectionUnavailable,
    groupId,
    isStarting,
    launchSource,
    onLaunched,
    onOpenChange,
    onSaveAgentDefault,
    onStart,
    promptDelivery,
    refreshDetectedAgents,
    saveAgentDefault,
    selectedAgent,
    trimmedCommandInput,
    worktreeId
  ])

  const statusCopy = selectedAgentUnavailable
    ? `${getAgentLabel(selectedAgent!)} is not enabled or was not detected on this workspace host.`
    : connectionUnavailable
      ? 'Unable to resolve the workspace connection.'
      : !hasEnabledAgents && !detecting
        ? 'No enabled agents were detected on this workspace host.'
        : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Agent</Label>
            {hasEnabledAgents || selectedAgent ? (
              <AgentCombobox
                agents={agentOptions}
                value={selectedAgent}
                onValueChange={(agent) => {
                  setSelectedAgent(agent)
                  setDeliveryPlan({ status: 'idle' })
                }}
                allowNarrowTrigger
                triggerClassName="w-full"
              />
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <span>{detecting ? 'Detecting agents…' : 'No enabled agents'}</span>
                {onOpenSettings ? (
                  <Button type="button" variant="ghost" size="xs" onClick={onOpenSettings}>
                    <Settings className="size-3.5" />
                    Settings
                  </Button>
                ) : null}
              </div>
            )}
            {statusCopy ? (
              <p className="flex items-start gap-1.5 text-[11px] text-destructive">
                <TriangleAlert className="mt-px size-3 shrink-0" />
                <span>{statusCopy}</span>
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="source-control-agent-command-input" className="text-xs">
                Command template
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setCommandTemplate(savedCommandInputTemplate ?? '{basePrompt}')
                  setDeliveryPlan({ status: 'idle' })
                }}
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            </div>
            <textarea
              id="source-control-agent-command-input"
              rows={12}
              value={commandTemplate}
              onChange={(event) => {
                setCommandTemplate(event.target.value)
                setDeliveryPlan({ status: 'idle' })
              }}
              className="min-h-[14rem] w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-ring"
            />
            <SourceControlActionVariableChips
              actionId={actionId}
              onInsert={(variable) => {
                const separator =
                  commandTemplate.endsWith('\n') || commandTemplate.length === 0 ? '' : ' '
                setCommandTemplate(`${commandTemplate}${separator}{${variable}}`)
                setDeliveryPlan({ status: 'idle' })
              }}
            />
          </div>

          {onSaveAgentDefault && selectedAgent ? (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={saveAgentDefault}
                onChange={(event) => setSaveAgentDefault(event.target.checked)}
                className="size-3.5 rounded border-border"
              />
              Save {getAgentLabel(selectedAgent)} and this command template as the default for this
              action
            </label>
          ) : null}

          {deliveryPlan.status !== 'idle' ? (
            <div
              className={cn(
                'rounded-md border px-3 py-2 text-xs',
                deliveryPlan.status === 'error'
                  ? 'border-destructive/30 bg-destructive/5 text-destructive'
                  : 'border-border bg-muted/30 text-muted-foreground'
              )}
            >
              {deliveryPlan.status === 'checking' ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="size-3.5 animate-spin" />
                  Checking delivery…
                </span>
              ) : deliveryPlan.status === 'error' ? (
                <span className="inline-flex items-start gap-2">
                  <TriangleAlert className="mt-px size-3.5 shrink-0" />
                  {deliveryPlan.error}
                </span>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-foreground">
                    <CheckCircle2 className="mt-px size-3.5 shrink-0 text-emerald-500" />
                    <span>{deliveryPlan.summary}</span>
                  </div>
                  <div className="truncate font-mono text-[11px]">
                    Launch: {deliveryPlan.commandLabel}
                  </div>
                  <div className="text-[11px]">{deliveryPlan.caveat}</div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCheckDelivery}>
            {deliveryPlan.status === 'checking' ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Check delivery
          </Button>
          <Button type="button" size="sm" disabled={!canStart} onClick={() => void handleStart()}>
            {isStarting ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {startLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
