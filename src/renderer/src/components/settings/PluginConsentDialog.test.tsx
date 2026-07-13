// @vitest-environment happy-dom

import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PluginHostListEntry } from '../../../../preload/api-types'
import { PluginConsentDialog } from './PluginConsentDialog'

const plugin: PluginHostListEntry = {
  pluginKey: 'acme.worker',
  consentFingerprint: 'sha256-acme-worker',
  name: 'Acme Worker',
  version: '1.2.3',
  publisher: 'acme',
  status: 'pending',
  needsReconsent: false,
  isDev: false,
  capabilities: [{ kind: 'worker', description: 'Run a background worker process' }],
  panels: [],
  commands: [],
  hasWorker: true,
  restarts: 0,
  source: {
    kind: 'git',
    reference: 'https://gitlab.example/acme/worker#v1.2.3',
    resolvedCommit: '0123456789abcdef',
    contentHash: 'sha256'
  }
}

afterEach(() => {
  document.body.innerHTML = ''
})

async function renderConsent(
  entry: PluginHostListEntry,
  onDecision: (
    key: string,
    reviewedFingerprint: string,
    decision: 'approve' | 'keep-disabled'
  ) => Promise<void>
): Promise<void> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  function Harness(): React.JSX.Element {
    const [selected, setSelected] = useState<PluginHostListEntry | null>(entry)
    return (
      <PluginConsentDialog
        plugin={selected}
        onDecision={async (key, reviewedFingerprint, decision) => {
          await onDecision(key, reviewedFingerprint, decision)
          setSelected(null)
        }}
      />
    )
  }
  await act(async () => root.render(<Harness />))
}

describe('PluginConsentDialog', () => {
  it('keeps the displayed fingerprint immutable during a same-key update', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const onDecision = vi.fn().mockResolvedValue(undefined)
    await act(async () => {
      root.render(<PluginConsentDialog plugin={plugin} onDecision={onDecision} />)
    })
    await act(async () => {
      root.render(
        <PluginConsentDialog
          plugin={{
            ...plugin,
            consentFingerprint: 'sha256-unreviewed-update',
            capabilities: [{ kind: 'secrets:read', description: 'Read a newly added secret' }]
          }}
          onDecision={onDecision}
        />
      )
    })

    expect(document.body.textContent).not.toContain('Read a newly added secret')
    const enable = Array.from(document.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === 'Enable plugin'
    )
    await act(async () => enable?.dispatchEvent(new MouseEvent('click', { bubbles: true })))

    expect(onDecision).toHaveBeenCalledWith(plugin.pluginKey, plugin.consentFingerprint, 'approve')
  })

  it('shows provenance, capabilities, worker warning, and focuses the safe default', async () => {
    await renderConsent(plugin, vi.fn().mockResolvedValue(undefined))

    expect(document.body.textContent).toContain(plugin.source?.reference)
    expect(document.body.textContent).toContain(plugin.source?.resolvedCommit)
    expect(document.body.textContent).toContain('Run a background worker process')
    expect(document.body.textContent).toContain(
      'full access to your files, network, and other processes'
    )
    expect(document.activeElement?.textContent).toContain('Keep Disabled')
  })

  it('explains that panel-only plugins have no worker process', async () => {
    await renderConsent(
      {
        ...plugin,
        pluginKey: 'acme.panel',
        name: 'Acme Panel',
        hasWorker: false,
        capabilities: [{ kind: 'panels', description: 'Add an Acme panel' }]
      },
      vi.fn().mockResolvedValue(undefined)
    )

    expect(document.body.textContent).toContain(
      "These permissions limit how the plugin uses Orca's API. This plugin has no worker process."
    )
    expect(document.body.textContent).not.toContain('full access to your files')
  })

  it('discloses that contributed skills run as agent instructions', async () => {
    await renderConsent({ ...plugin, hasSkills: true }, vi.fn().mockResolvedValue(undefined))

    expect(document.body.textContent).toContain(
      'Agents read those instructions and may act on them with the full authority you give the agent.'
    )
  })

  it('shows every VM recipe lifecycle command verbatim', async () => {
    await renderConsent(
      {
        ...plugin,
        hasWorker: false,
        capabilities: [],
        vmRecipes: [
          {
            id: 'cloud',
            name: 'Cloud Sandbox',
            description: 'Creates a disposable VM.',
            commands: [
              { phase: 'create', command: './scripts/create.sh --exact "$VALUE"' },
              { phase: 'suspend', command: './scripts/suspend.sh' },
              { phase: 'resume', command: './scripts/resume.sh' },
              { phase: 'destroy', command: 'none' }
            ]
          }
        ]
      },
      vi.fn().mockResolvedValue(undefined)
    )

    expect(document.body.textContent).toContain(
      'Instructional content — runs later under user or agent authority'
    )
    expect(document.body.textContent).toContain('Review plugin content')
    expect(document.body.textContent).toContain(
      'Its instructional content can still cause actions when you or an agent use it.'
    )
    expect(document.body.textContent).toContain('./scripts/create.sh --exact "$VALUE"')
    expect(document.body.textContent).toContain('./scripts/suspend.sh')
    expect(document.body.textContent).toContain('./scripts/resume.sh')
    expect(document.body.textContent).toContain('Destroynone')
    const commands = Array.from(document.querySelectorAll('pre'))
    expect(commands).toHaveLength(4)
    expect(commands[0]?.tabIndex).toBe(0)
    expect(commands[0]?.getAttribute('aria-label')).toBe('Cloud Sandbox · Create command')
  })

  it('records Keep Disabled when Escape dismisses the dialog', async () => {
    const onDecision = vi.fn().mockResolvedValue(undefined)
    await renderConsent(plugin, onDecision)

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(onDecision).toHaveBeenCalledWith(
      plugin.pluginKey,
      plugin.consentFingerprint,
      'keep-disabled'
    )
  })

  it('labels re-consent generically and enables only after an explicit action', async () => {
    const onDecision = vi.fn().mockResolvedValue(undefined)
    await renderConsent({ ...plugin, needsReconsent: true }, onDecision)
    expect(document.body.textContent).toContain(
      'Permissions, the worker trust tier, or instructional content changed'
    )
    const enable = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Enable plugin'
    )
    if (!enable) {
      throw new Error('missing enable action')
    }

    await act(async () => enable.dispatchEvent(new MouseEvent('click', { bubbles: true })))

    expect(onDecision).toHaveBeenCalledWith(plugin.pluginKey, plugin.consentFingerprint, 'approve')
  })

  it('explains how to recover when the reviewed plugin changed', async () => {
    const onDecision = vi
      .fn()
      .mockRejectedValue(new Error('reviewed fingerprint is no longer current'))
    await renderConsent(plugin, onDecision)
    const enable = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Enable plugin'
    )

    await act(async () => enable?.dispatchEvent(new MouseEvent('click', { bubbles: true })))

    expect(document.body.textContent).toContain(
      'The plugin changed while you were reviewing it. Close this dialog and review the updated permissions.'
    )
  })
})
