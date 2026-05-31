/* eslint-disable max-lines -- Why: repo Source Control AI settings keep one
   draft/save flow across action recipes and PR-default override groups. */
import { useMemo, useState } from 'react'
import { Terminal } from 'lucide-react'
import type { Repo, TuiAgent } from '../../../../shared/types'
import type {
  RepoSourceControlAiOverrides,
  SourceControlAiSettings
} from '../../../../shared/source-control-ai-types'
import {
  normalizeRepoSourceControlAiOverrides,
  normalizeSourceControlAiSettings
} from '../../../../shared/source-control-ai'
import {
  SOURCE_CONTROL_ACTION_IDS,
  SOURCE_CONTROL_ACTION_LABELS,
  SOURCE_CONTROL_TEXT_ACTION_IDS,
  resolveSourceControlActionCommandTemplate,
  type SourceControlActionId
} from '../../../../shared/source-control-ai-actions'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useAppStore } from '../../store'
import { getRepositorySourceControlAiSectionId } from './repository-settings-targets'
import { Button } from '../ui/button'
import { useMountedRef } from '@/hooks/useMountedRef'
import { AGENT_CATALOG, AgentIcon } from '@/lib/agent-catalog'
import { SourceControlActionVariableChips } from '../source-control/SourceControlActionVariableChips'
import { listCommitMessageAgentCapabilities } from '../../../../shared/commit-message-agent-spec'

type RepositorySourceControlAiSectionProps = {
  repo: Repo
  updateRepo: (repoId: string, updates: Partial<Repo>) => void | Promise<boolean>
}

const ACTION_MODE_INHERIT = 'inherit'
const ACTION_MODE_OVERRIDE = 'override'
const INHERIT_AGENT_VALUE = '__inherit_agent__'
const DEFAULT_AGENT_VALUE = '__default_agent__'
const SOURCE_CONTROL_TEXT_ACTION_ID_SET = new Set<string>(SOURCE_CONTROL_TEXT_ACTION_IDS)
const TEXT_GENERATION_AGENT_ID_SET = new Set(
  listCommitMessageAgentCapabilities().map((capability) => capability.id)
)

const ACTION_DESCRIPTIONS: Record<SourceControlActionId, string> = {
  commitMessage: 'Generate the commit message from staged changes.',
  pullRequest: 'Generate the hosted review title and description.',
  branchName: 'Rename Orca-created branches from the initial agent task.',
  fixCommitFailure: 'Start an agent when a commit hook or git commit fails.',
  fixChecks: 'Start an agent from failed hosted-review checks.',
  resolveConflicts: 'Start an agent for local or hosted-review merge conflicts.'
}

type PrDefaultKey = keyof NonNullable<RepoSourceControlAiOverrides['prCreationDefaults']>
type RepoAiDraftState = {
  repoId: string
  value: RepoSourceControlAiOverrides
  baseSerialized: string
}

function hasOwnActionOverride(
  overrides: RepoSourceControlAiOverrides['actionOverrides'],
  actionId: SourceControlActionId
): boolean {
  return Object.prototype.hasOwnProperty.call(overrides ?? {}, actionId)
}

function triStateValue(value: boolean | null | undefined): 'inherit' | 'on' | 'off' {
  if (value === true) {
    return 'on'
  }
  if (value === false) {
    return 'off'
  }
  return 'inherit'
}

function normalizeRepoAiDraft(
  value: RepoSourceControlAiOverrides | null | undefined
): RepoSourceControlAiOverrides {
  return normalizeRepoSourceControlAiOverrides(value) ?? {}
}

function serializeRepoAiDraft(value: RepoSourceControlAiOverrides): string {
  return JSON.stringify(normalizeRepoAiDraft(value))
}

export function createRepoAiDraftState(
  repoId: string,
  value: RepoSourceControlAiOverrides
): RepoAiDraftState {
  const normalized = normalizeRepoAiDraft(value)
  return {
    repoId,
    value: normalized,
    baseSerialized: serializeRepoAiDraft(normalized)
  }
}

export function resolveRepoAiDraftState(
  current: RepoAiDraftState,
  repoId: string,
  persistedRepoAi: RepoSourceControlAiOverrides,
  persistedSerialized = serializeRepoAiDraft(persistedRepoAi)
): RepoAiDraftState {
  const currentSerialized = serializeRepoAiDraft(current.value)
  // Why: render-time draft sync relies on object identity to avoid repeating
  // the same state update during server-rendered settings tests.
  if (
    current.repoId === repoId &&
    currentSerialized === persistedSerialized &&
    current.baseSerialized === persistedSerialized
  ) {
    return current
  }
  if (
    current.repoId !== repoId ||
    currentSerialized === current.baseSerialized ||
    currentSerialized === persistedSerialized
  ) {
    return {
      repoId,
      value: persistedRepoAi,
      baseSerialized: persistedSerialized
    }
  }
  return current
}

function readInheritedCommandTemplate(
  source: SourceControlAiSettings,
  actionId: SourceControlActionId
): string {
  return resolveSourceControlActionCommandTemplate(source.actions, actionId)
}

export function dropRepoLegacyInstructionForAction(
  value: RepoSourceControlAiOverrides,
  actionId: SourceControlActionId
): RepoSourceControlAiOverrides {
  if (!SOURCE_CONTROL_TEXT_ACTION_ID_SET.has(actionId) || !value.instructionsByOperation) {
    return value
  }
  const instructionsByOperation = { ...value.instructionsByOperation }
  delete instructionsByOperation[actionId as keyof typeof instructionsByOperation]
  return {
    ...value,
    instructionsByOperation:
      Object.keys(instructionsByOperation).length > 0 ? instructionsByOperation : undefined
  }
}

function actionAgentSelectValue(agentId: TuiAgent | null | undefined): string {
  if (agentId === undefined) {
    return INHERIT_AGENT_VALUE
  }
  return agentId ?? DEFAULT_AGENT_VALUE
}

function getAgentCatalogForAction(
  actionId: SourceControlActionId,
  selectedAgent: TuiAgent | null | undefined
): typeof AGENT_CATALOG {
  if (!SOURCE_CONTROL_TEXT_ACTION_ID_SET.has(actionId)) {
    return AGENT_CATALOG
  }
  return AGENT_CATALOG.filter(
    (agent) => TEXT_GENERATION_AGENT_ID_SET.has(agent.id) || agent.id === selectedAgent
  )
}

export function RepositorySourceControlAiSection({
  repo,
  updateRepo
}: RepositorySourceControlAiSectionProps): React.JSX.Element {
  const mountedRef = useMountedRef()
  const settings = useAppStore((state) => state.settings)
  const source = normalizeSourceControlAiSettings(
    settings?.sourceControlAi,
    settings?.commitMessageAi
  )
  const persistedRepoAi = useMemo(
    () => normalizeRepoAiDraft(repo.sourceControlAi),
    [repo.sourceControlAi]
  )
  const persistedSerialized = useMemo(
    () => serializeRepoAiDraft(persistedRepoAi),
    [persistedRepoAi]
  )
  // Why: repo.sourceControlAi is saved as one nested value; a local draft keeps
  // textarea keystrokes and sibling controls from racing over IPC/RPC.
  const [draftState, setDraftState] = useState<RepoAiDraftState>(() =>
    createRepoAiDraftState(repo.id, persistedRepoAi)
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const resolvedDraftState = resolveRepoAiDraftState(
    draftState,
    repo.id,
    persistedRepoAi,
    persistedSerialized
  )
  if (resolvedDraftState !== draftState) {
    // Why: repo settings may be refreshed externally; clean drafts should
    // follow that source before paint, while dirty edits stay in place.
    setDraftState(resolvedDraftState)
    if (saveError !== null) {
      setSaveError(null)
    }
  }

  const repoAi = resolvedDraftState.value
  const draftSerialized = useMemo(() => serializeRepoAiDraft(repoAi), [repoAi])
  const isDirty =
    resolvedDraftState.repoId !== repo.id || draftSerialized !== resolvedDraftState.baseSerialized

  const updateDraftRepoAi = (
    update: (current: RepoSourceControlAiOverrides) => RepoSourceControlAiOverrides
  ): void => {
    setDraftState((current) => {
      const resolved = resolveRepoAiDraftState(
        current,
        repo.id,
        persistedRepoAi,
        persistedSerialized
      )
      return {
        ...resolved,
        value: normalizeRepoAiDraft(update(resolved.value))
      }
    })
    setSaveError(null)
  }

  const saveDraft = async (): Promise<void> => {
    if (!isDirty || isSaving) {
      return
    }
    const next = normalizeRepoAiDraft(resolvedDraftState.value)
    const nextSerialized = serializeRepoAiDraft(next)
    setIsSaving(true)
    setSaveError(null)
    try {
      const result = await updateRepo(repo.id, { sourceControlAi: next })
      if (!mountedRef.current) {
        return
      }
      if (result === false) {
        setSaveError('Failed to save Source Control AI settings.')
        return
      }
      setDraftState((current) => {
        if (current.repoId !== repo.id) {
          return current
        }
        const currentSerialized = serializeRepoAiDraft(current.value)
        return {
          repoId: repo.id,
          value: currentSerialized === nextSerialized ? next : current.value,
          baseSerialized: nextSerialized
        }
      })
    } catch {
      if (mountedRef.current) {
        setSaveError('Failed to save Source Control AI settings.')
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false)
      }
    }
  }

  const discardDraft = (): void => {
    setDraftState(createRepoAiDraftState(repo.id, persistedRepoAi))
    setSaveError(null)
  }

  const updateActionMode = (actionId: SourceControlActionId, mode: string): void => {
    updateDraftRepoAi((current) => {
      const nextActionOverrides = { ...current.actionOverrides }
      if (mode === ACTION_MODE_INHERIT) {
        delete nextActionOverrides[actionId]
      } else if (!hasOwnActionOverride(nextActionOverrides, actionId)) {
        nextActionOverrides[actionId] = {
          commandInputTemplate: readInheritedCommandTemplate(source, actionId)
        }
      }
      return dropRepoLegacyInstructionForAction(
        { ...current, actionOverrides: nextActionOverrides },
        actionId
      )
    })
  }

  const updateActionAgent = (actionId: SourceControlActionId, value: string): void => {
    updateDraftRepoAi((current) => {
      const nextActionOverrides = { ...current.actionOverrides }
      const currentOverride = nextActionOverrides[actionId] ?? {
        commandInputTemplate: readInheritedCommandTemplate(source, actionId)
      }
      if (value === INHERIT_AGENT_VALUE) {
        const { agentId: _agentId, ...rest } = currentOverride
        nextActionOverrides[actionId] = rest
      } else {
        nextActionOverrides[actionId] = {
          ...currentOverride,
          agentId: value === DEFAULT_AGENT_VALUE ? null : (value as TuiAgent)
        }
      }
      return dropRepoLegacyInstructionForAction(
        { ...current, actionOverrides: nextActionOverrides },
        actionId
      )
    })
  }

  const updateActionTemplate = (actionId: SourceControlActionId, value: string): void => {
    updateDraftRepoAi((current) =>
      dropRepoLegacyInstructionForAction(
        {
          ...current,
          actionOverrides: {
            ...current.actionOverrides,
            [actionId]: {
              ...current.actionOverrides?.[actionId],
              commandInputTemplate: value
            }
          }
        },
        actionId
      )
    )
  }

  const appendVariable = (actionId: SourceControlActionId, variable: string): void => {
    const override = repoAi.actionOverrides?.[actionId]
    const currentTemplate =
      typeof override?.commandInputTemplate === 'string'
        ? override.commandInputTemplate
        : readInheritedCommandTemplate(source, actionId)
    const separator = currentTemplate.endsWith('\n') || currentTemplate.length === 0 ? '' : ' '
    updateActionTemplate(actionId, `${currentTemplate}${separator}{${variable}}`)
  }

  const updatePrDefault = (key: PrDefaultKey, value: string): void => {
    updateDraftRepoAi((current) => {
      const nextDefaults = { ...current.prCreationDefaults }
      if (value === 'inherit') {
        delete nextDefaults[key]
      } else {
        nextDefaults[key] = value === 'on'
      }
      return { ...current, prCreationDefaults: nextDefaults }
    })
  }

  const prDefaultRows: { key: PrDefaultKey; label: string }[] = [
    { key: 'draft', label: 'Draft by default' },
    { key: 'useTemplate', label: 'Use PR template when available' },
    { key: 'generateDetailsOnOpen', label: 'Generate details when opening Create PR' },
    { key: 'openAfterCreate', label: 'Open PR after creation' }
  ]

  return (
    <section
      id={getRepositorySourceControlAiSectionId(repo.id)}
      data-settings-section={getRepositorySourceControlAiSectionId(repo.id)}
      className="space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-semibold">Source Control AI</h3>
          <p className="text-xs text-muted-foreground">
            Repo-specific action recipes. Each action inherits global settings until you customize
            it here.
          </p>
          {saveError ? <p className="text-xs text-destructive">{saveError}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <span className="text-[11px] text-muted-foreground">
            {isDirty ? 'Unsaved changes' : 'Saved'}
          </span>
          {isDirty ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={discardDraft}
              disabled={isSaving}
            >
              Discard
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => void saveDraft()}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-medium">Action recipes</Label>
        {SOURCE_CONTROL_ACTION_IDS.map((actionId) => {
          const hasOverride = hasOwnActionOverride(repoAi.actionOverrides, actionId)
          const override = repoAi.actionOverrides?.[actionId]
          const inheritedTemplate = readInheritedCommandTemplate(source, actionId)
          const templateValue =
            hasOverride && typeof override?.commandInputTemplate === 'string'
              ? override.commandInputTemplate
              : ''
          const agentOptions = getAgentCatalogForAction(actionId, override?.agentId)
          return (
            <div key={actionId} className="space-y-3 rounded-md border border-border px-3 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-medium text-foreground">
                    {SOURCE_CONTROL_ACTION_LABELS[actionId]}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {ACTION_DESCRIPTIONS[actionId]}
                  </p>
                </div>
                <Select
                  value={hasOverride ? ACTION_MODE_OVERRIDE : ACTION_MODE_INHERIT}
                  onValueChange={(value) => updateActionMode(actionId, value)}
                >
                  <SelectTrigger size="sm" className="h-8 w-full shrink-0 text-xs sm:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ACTION_MODE_INHERIT}>Use global</SelectItem>
                    <SelectItem value={ACTION_MODE_OVERRIDE}>Customize</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">Agent</Label>
                  <Select
                    value={actionAgentSelectValue(override?.agentId)}
                    onValueChange={(value) => updateActionAgent(actionId, value)}
                    disabled={!hasOverride}
                  >
                    <SelectTrigger size="sm" className="h-8 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={INHERIT_AGENT_VALUE}>
                        <span className="flex items-center gap-2">
                          <Terminal className="size-3.5 text-muted-foreground" />
                          Use global agent
                        </span>
                      </SelectItem>
                      <SelectItem value={DEFAULT_AGENT_VALUE}>
                        <span className="flex items-center gap-2">
                          <Terminal className="size-3.5 text-muted-foreground" />
                          Use default agent
                        </span>
                      </SelectItem>
                      {agentOptions.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          <span className="flex items-center gap-2">
                            <AgentIcon agent={agent.id} size={14} />
                            {agent.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">Command template</Label>
                  <textarea
                    rows={3}
                    value={templateValue}
                    onChange={(event) => updateActionTemplate(actionId, event.target.value)}
                    disabled={!hasOverride}
                    placeholder={inheritedTemplate}
                    spellCheck={false}
                    className="w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted/40"
                  />
                  <SourceControlActionVariableChips
                    actionId={actionId}
                    disabled={!hasOverride}
                    onInsert={(variable) => appendVariable(actionId, variable)}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">PR creation defaults</Label>
        <div className="space-y-2">
          {prDefaultRows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2"
            >
              <span className="text-xs text-foreground">{row.label}</span>
              <Select
                value={triStateValue(repoAi.prCreationDefaults?.[row.key])}
                onValueChange={(value) => updatePrDefault(row.key, value)}
              >
                <SelectTrigger size="sm" className="h-8 w-[120px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Use global</SelectItem>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
