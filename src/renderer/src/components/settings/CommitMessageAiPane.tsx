import { useEffect } from 'react'
import type React from 'react'
import { Terminal } from 'lucide-react'
import type { GlobalSettings, TuiAgent } from '../../../../shared/types'
import type {
  SourceControlAiSettingsPatch,
  SourceControlAiSettings
} from '../../../../shared/source-control-ai-types'
import {
  normalizeSourceControlAiSettings,
  readSourceControlAiModelChoiceForHost,
  selectSourceControlAiModelChoiceForHost
} from '../../../../shared/source-control-ai'
import {
  SOURCE_CONTROL_ACTION_IDS,
  SOURCE_CONTROL_ACTION_LABELS,
  SOURCE_CONTROL_TEXT_ACTION_IDS,
  resolveSourceControlActionCommandTemplate,
  setSourceControlActionDefault,
  type SourceControlActionId
} from '../../../../shared/source-control-ai-actions'
import {
  listCommitMessageAgentCapabilities,
  type CommitMessageModelCapability
} from '../../../../shared/commit-message-agent-spec'
import { getCommitMessageModelDiscoveryHostKeyForScope } from '../../../../shared/commit-message-host-key'
import { AGENT_CATALOG, AgentIcon } from '@/lib/agent-catalog'
import { getRuntimeGitScope } from '../../runtime/runtime-git-client'
import { useAppStore } from '../../store'
import { SourceControlActionVariableChips } from '../source-control/SourceControlActionVariableChips'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SearchableSetting } from './SearchableSetting'
import { matchesSettingsSearch } from './settings-search'

type CommitMessageAiPaneProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void | Promise<void>
  writeSourceControlAiSettings?: (patch: SourceControlAiSettingsPatch) => Promise<void>
  onCustomPromptDirtyChange?: (dirty: boolean) => void
  customPromptDiscardSignal?: number
}

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

function readSettings(settings: GlobalSettings): SourceControlAiSettings {
  return normalizeSourceControlAiSettings(settings.sourceControlAi, settings.commitMessageAi)
}

export function getAgentCatalogForAction(
  actionId: SourceControlActionId,
  selectedAgent: TuiAgent | null
): typeof AGENT_CATALOG {
  if (!SOURCE_CONTROL_TEXT_ACTION_ID_SET.has(actionId)) {
    return AGENT_CATALOG
  }
  return AGENT_CATALOG.filter(
    (agent) => TEXT_GENERATION_AGENT_ID_SET.has(agent.id) || agent.id === selectedAgent
  )
}

export function mergeDiscoveredModelsIntoCommitMessageConfig(
  config: SourceControlAiSettings,
  agentId: TuiAgent,
  models: CommitMessageModelCapability[],
  defaultModelId: string,
  hostKey = 'local'
): SourceControlAiSettings {
  const currentChoice = {
    selectedModelByAgent: config.selectedModelByAgent,
    selectedModelByAgentByHost: config.selectedModelByAgentByHost
  }
  const persisted = readSourceControlAiModelChoiceForHost(currentChoice, hostKey, agentId)
  const nextModelId = models.some((model) => model.id === persisted) ? persisted : defaultModelId
  const selectedModelChoice =
    nextModelId && nextModelId !== persisted
      ? selectSourceControlAiModelChoiceForHost(currentChoice, hostKey, agentId, nextModelId)
      : currentChoice
  return {
    ...config,
    discoveredModelsByAgent:
      hostKey === 'local'
        ? {
            ...config.discoveredModelsByAgent,
            [agentId]: models
          }
        : config.discoveredModelsByAgent,
    discoveredModelsByAgentByHost: {
      ...config.discoveredModelsByAgentByHost,
      [hostKey]: {
        ...config.discoveredModelsByAgentByHost?.[hostKey],
        [agentId]: models
      }
    },
    selectedModelByAgent: selectedModelChoice.selectedModelByAgent ?? config.selectedModelByAgent,
    selectedModelByAgentByHost: selectedModelChoice.selectedModelByAgentByHost
  }
}

export function getCommitMessageSettingsPaneDiscoveryHostKey(
  settings: GlobalSettings,
  activeConnectionId: string | null | undefined,
  hasActiveWorktree: boolean
): string {
  const runtimeScope = hasActiveWorktree
    ? getRuntimeGitScope(settings, activeConnectionId)
    : activeConnectionId
  return getCommitMessageModelDiscoveryHostKeyForScope(runtimeScope)
}

export function CommitMessageAiPane({
  settings,
  updateSettings,
  writeSourceControlAiSettings,
  onCustomPromptDirtyChange
}: CommitMessageAiPaneProps): React.JSX.Element {
  const searchQuery = useAppStore((s) => s.settingsSearchQuery)
  const config = readSettings(settings)

  useEffect(() => {
    onCustomPromptDirtyChange?.(false)
    return () => onCustomPromptDirtyChange?.(false)
  }, [onCustomPromptDirtyChange])

  const localWriteConfig = (patch: SourceControlAiSettingsPatch): Promise<void> => {
    const current = readSettings(settings)
    const resolvedPatch = typeof patch === 'function' ? patch(current) : patch
    return Promise.resolve(
      updateSettings({
        sourceControlAi: {
          ...current,
          ...resolvedPatch
        }
      })
    )
  }
  const writeConfig = writeSourceControlAiSettings ?? localWriteConfig

  const onToggleEnabled = (): void => {
    void writeConfig({ enabled: !config.enabled })
  }

  const onActionAgentChange = (actionId: SourceControlActionId, value: string): void => {
    const agentId = value === DEFAULT_AGENT_VALUE ? null : (value as TuiAgent)
    void writeConfig((current) => ({
      actions: setSourceControlActionDefault(current.actions, actionId, { agentId })
    }))
  }

  const onActionTemplateChange = (actionId: SourceControlActionId, value: string): void => {
    void writeConfig((current) => ({
      actions: setSourceControlActionDefault(current.actions, actionId, {
        commandInputTemplate: value
      })
    }))
  }

  const appendVariable = (actionId: SourceControlActionId, variable: string): void => {
    const currentTemplate = resolveSourceControlActionCommandTemplate(config.actions, actionId)
    const separator = currentTemplate.endsWith('\n') || currentTemplate.length === 0 ? '' : ' '
    onActionTemplateChange(actionId, `${currentTemplate}${separator}{${variable}}`)
  }

  const onPrDefaultChange = (
    key: keyof NonNullable<SourceControlAiSettings['prCreationDefaults']>,
    value: boolean
  ): void => {
    void writeConfig((current) => ({
      prCreationDefaults: {
        ...current.prCreationDefaults,
        [key]: value
      }
    }))
  }

  const sections: React.ReactNode[] = []

  if (
    matchesSettingsSearch(searchQuery, {
      title: 'Enable Source Control AI defaults',
      description:
        'Adds action recipes for Source Control commit, pull request, branch-name, and fix actions.',
      keywords: ['ai', 'commit', 'message', 'generate', 'agent', 'enabled']
    })
  ) {
    sections.push(
      <SearchableSetting
        key="enabled"
        title="Enable Source Control AI defaults"
        description="Adds action recipes for Source Control commit, pull request, branch-name, and fix actions."
        keywords={['ai', 'commit', 'message', 'generate', 'agent', 'enabled']}
        className="flex items-center justify-between gap-4 py-2"
      >
        <div className="space-y-0.5">
          <Label>Enable Source Control AI defaults</Label>
          <p className="text-xs text-muted-foreground">
            Adds AI buttons that run the selected agent with the command template for that action.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={config.enabled}
          onClick={onToggleEnabled}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors ${
            config.enabled ? 'bg-foreground' : 'bg-muted-foreground/30'
          }`}
        >
          <span
            className={`pointer-events-none block size-3.5 rounded-full bg-background shadow-sm transition-transform ${
              config.enabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </SearchableSetting>
    )
  }

  if (
    config.enabled &&
    matchesSettingsSearch(searchQuery, {
      title: 'Action recipes',
      description: 'Agent and command template used by each Source Control AI button.',
      keywords: ['agent', 'command', 'template', 'fix', 'checks', 'commit', 'pull request']
    })
  ) {
    sections.push(
      <SearchableSetting
        key="action-recipes"
        title="Action recipes"
        description="Agent and command template used by each Source Control AI button."
        keywords={['agent', 'command', 'template', 'fix', 'checks', 'commit', 'pull request']}
        className="space-y-3 px-1 py-2"
      >
        <div className="space-y-0.5">
          <Label>Action recipes</Label>
          <p className="text-xs text-muted-foreground">
            Use variables only when you want Orca to inject context. Leave the agent as default to
            follow your normal agent preference.
          </p>
        </div>
        <div className="space-y-3">
          {SOURCE_CONTROL_ACTION_IDS.map((actionId) => {
            const recipe = config.actions?.[actionId]
            const selectedAgent = recipe?.agentId ?? null
            const template = resolveSourceControlActionCommandTemplate(config.actions, actionId)
            const agentOptions = getAgentCatalogForAction(actionId, selectedAgent)
            return (
              <div key={actionId} className="rounded-md border border-border px-3 py-3">
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
                    value={selectedAgent ?? DEFAULT_AGENT_VALUE}
                    onValueChange={(value) => onActionAgentChange(actionId, value)}
                  >
                    <SelectTrigger size="sm" className="h-8 w-full shrink-0 text-xs sm:w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                <div className="mt-3 space-y-2">
                  <Label className="text-[11px] text-muted-foreground">Command template</Label>
                  <textarea
                    value={template}
                    rows={3}
                    spellCheck={false}
                    onChange={(event) => onActionTemplateChange(actionId, event.target.value)}
                    className="w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <SourceControlActionVariableChips
                    actionId={actionId}
                    onInsert={(variable) => appendVariable(actionId, variable)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </SearchableSetting>
    )
  }

  if (
    config.enabled &&
    matchesSettingsSearch(searchQuery, {
      title: 'PR creation defaults',
      description: 'Defaults used when the Create PR composer opens.',
      keywords: ['pull request', 'pr', 'draft', 'template', 'generate', 'open']
    })
  ) {
    const prDefaults = config.prCreationDefaults ?? {}
    const rows: {
      key: keyof NonNullable<SourceControlAiSettings['prCreationDefaults']>
      label: string
      description: string
    }[] = [
      {
        key: 'draft',
        label: 'Draft by default',
        description: 'Create hosted reviews as drafts unless changed in the composer.'
      },
      {
        key: 'useTemplate',
        label: 'Use PR template when available',
        description: 'Prefer repository pull request templates when no description is set.'
      },
      {
        key: 'generateDetailsOnOpen',
        label: 'Generate details when opening Create PR',
        description: 'Run pull-request detail generation once when the composer opens.'
      },
      {
        key: 'openAfterCreate',
        label: 'Open PR after creation',
        description: 'Open the created hosted review in your browser after submit.'
      }
    ]
    sections.push(
      <SearchableSetting
        key="pr-creation-defaults"
        title="PR creation defaults"
        description="Defaults used when the Create PR composer opens."
        keywords={['pull request', 'pr', 'draft', 'template', 'generate', 'open']}
        className="space-y-3 px-1 py-2"
      >
        <div className="space-y-0.5">
          <Label>PR creation defaults</Label>
          <p className="text-xs text-muted-foreground">
            Provider-neutral defaults for the Create PR composer.
          </p>
        </div>
        <div className="space-y-2">
          {rows.map((row) => (
            <label
              key={row.key}
              className="flex items-start justify-between gap-4 rounded-md border border-border px-3 py-2"
            >
              <span className="space-y-0.5">
                <span className="block text-xs font-medium text-foreground">{row.label}</span>
                <span className="block text-[11px] text-muted-foreground">{row.description}</span>
              </span>
              <input
                type="checkbox"
                checked={prDefaults[row.key] === true}
                onChange={(event) => onPrDefaultChange(row.key, event.target.checked)}
                className="mt-0.5 size-4 rounded border-border accent-primary"
              />
            </label>
          ))}
        </div>
      </SearchableSetting>
    )
  }

  return (
    <div
      id="source-control-ai-settings"
      data-settings-section="source-control-ai-settings"
      className="space-y-4 border-t border-border/40 pt-4"
    >
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold">Source Control AI</h3>
        <p className="text-xs text-muted-foreground">
          Configure the agent and command template behind each Source Control AI button.
        </p>
      </div>
      {sections}
    </div>
  )
}
