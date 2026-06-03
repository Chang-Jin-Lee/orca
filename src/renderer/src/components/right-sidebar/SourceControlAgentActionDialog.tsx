import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { AGENT_CATALOG, getAgentLabel } from '@/lib/agent-catalog'
import { focusTerminalTabSurface } from '@/lib/focus-terminal-tab-surface'
import { launchAgentInNewTab } from '@/lib/launch-agent-in-new-tab'
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
import {
  SourceControlAgentActionDialogForm,
  type SourceControlAgentActionDeliveryPlanState
} from './SourceControlAgentActionDialogForm'

export type SourceControlAgentActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionId: SourceControlLaunchActionId
  title: string
  description: string
  baseCommandInput: string
  savedCommandInputTemplate?: string | null
  savedAgentArgs?: string | null
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
  onStart?: (args: {
    agent: TuiAgent
    commandInput: string
    agentArgs: string
  }) => boolean | Promise<boolean>
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
  savedAgentArgs,
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
  const [agentArgs, setAgentArgs] = useState(savedAgentArgs ?? '')
  const [selectedAgent, setSelectedAgent] = useState<TuiAgent | null>(savedAgentId ?? null)
  const [detectedAgents, setDetectedAgents] = useState<TuiAgent[]>([])
  const [detecting, setDetecting] = useState(false)
  const [deliveryPlan, setDeliveryPlan] = useState<SourceControlAgentActionDeliveryPlanState>({
    status: 'idle'
  })
  const [isStarting, setIsStarting] = useState(false)
  const [saveAgentDefault, setSaveAgentDefault] = useState(true)

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
    setAgentArgs(savedAgentArgs ?? '')
    setSelectedAgent(savedAgentId ?? null)
    let stale = false
    void refreshDetectedAgents().then((nextAgents) => {
      if (stale) {
        return
      }
      // Keep an explicitly selected agent even when it's unavailable so the
      // selectedAgentUnavailable warning surfaces; only auto-pick when nothing
      // is selected yet.
      setSelectedAgent(
        (current) =>
          current ??
          pickSourceControlLaunchAgent({
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
    // baseCommandInput is intentionally excluded: this effect resets on dialog
    // open, and including it would wipe user edits when the generated prompt
    // changes while the dialog stays open.
  }, [
    disabledAgents,
    open,
    refreshDetectedAgents,
    savedAgentId,
    savedAgentArgs,
    savedCommandInputTemplate,
    settings?.defaultTuiAgent
  ])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setDeliveryPlan({ status: 'idle' })
        setSaveAgentDefault(true)
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

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
    async (agentsOverride?: TuiAgent[]): Promise<SourceControlAgentActionDeliveryPlanState> => {
      const currentDetectedAgents = agentsOverride ?? (await refreshDetectedAgents())
      if (connectionUnavailable) {
        return { status: 'error', error: 'Unable to resolve the workspace connection.' }
      }
      const result = planSourceControlAgentActionLaunch({
        agent: selectedAgent,
        commandInput,
        agentArgs,
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
    [
      agentArgs,
      commandInput,
      connectionUnavailable,
      promptDelivery,
      refreshDetectedAgents,
      selectedAgent
    ]
  )

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
        launched = await onStart({
          agent: selectedAgent,
          commandInput: trimmedCommandInput,
          agentArgs
        })
      } else if (worktreeId) {
        const result = launchAgentInNewTab({
          agent: selectedAgent,
          worktreeId,
          groupId: groupId ?? worktreeId,
          prompt: trimmedCommandInput,
          agentArgs,
          promptDelivery,
          launchSource
        })
        launched = Boolean(result)
        if (result?.tabId) {
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
          commandInputTemplate: commandTemplate,
          agentArgs
        })
      }
      onLaunched?.()
      handleOpenChange(false)
    } finally {
      setIsStarting(false)
    }
  }, [
    actionId,
    agentArgs,
    buildPlan,
    commandTemplate,
    connectionUnavailable,
    groupId,
    isStarting,
    launchSource,
    handleOpenChange,
    onLaunched,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>
        <SourceControlAgentActionDialogForm
          actionId={actionId}
          agentOptions={agentOptions}
          selectedAgent={selectedAgent}
          hasEnabledAgents={hasEnabledAgents}
          detecting={detecting}
          statusCopy={statusCopy}
          agentArgs={agentArgs}
          commandTemplate={commandTemplate}
          savedCommandInputTemplate={savedCommandInputTemplate}
          baseCommandInput={baseCommandInput}
          saveAgentDefault={saveAgentDefault}
          canSaveAgentDefault={Boolean(onSaveAgentDefault)}
          deliveryPlan={deliveryPlan}
          canStart={canStart}
          isStarting={isStarting}
          startLabel={startLabel}
          onSelectedAgentChange={(agent) => {
            setSelectedAgent(agent)
            setDeliveryPlan({ status: 'idle' })
          }}
          onAgentArgsChange={(value) => {
            setAgentArgs(value)
            setDeliveryPlan({ status: 'idle' })
          }}
          onCommandTemplateChange={(value) => {
            setCommandTemplate(value)
            setDeliveryPlan({ status: 'idle' })
          }}
          onSaveAgentDefaultChange={setSaveAgentDefault}
          onOpenSettings={onOpenSettings}
          onStart={() => void handleStart()}
        />
      </DialogContent>
    </Dialog>
  )
}
