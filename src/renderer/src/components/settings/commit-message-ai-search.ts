import type { SettingsSearchEntry } from './settings-search'

export const COMMIT_MESSAGE_AI_PANE_SEARCH_ENTRIES: SettingsSearchEntry[] = [
  {
    title: 'Enable Source Control AI defaults',
    description:
      'Adds action recipes for Source Control commit, pull request, branch-name, and fix actions.',
    keywords: [
      'ai',
      'commit',
      'message',
      'generate',
      'agent',
      'claude',
      'codex',
      'source control',
      'enabled'
    ]
  },
  {
    title: 'Action recipes',
    description: 'Agent and command template used by each Source Control AI button.',
    keywords: [
      'agent',
      'command',
      'template',
      'prompt',
      'fix',
      'checks',
      'ci',
      'conflicts',
      'commit',
      'pull request',
      'branch'
    ]
  },
  {
    title: 'PR creation defaults',
    description: 'Defaults used when the Create PR composer opens.',
    keywords: ['pull request', 'pr', 'draft', 'template', 'generate', 'open']
  }
]
