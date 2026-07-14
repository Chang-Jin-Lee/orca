// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SkillFreshnessInstallation } from '../../../../shared/skill-freshness'
import { SkillFreshnessPanel } from './SkillFreshnessPanel'
import {
  consumeSkillFreshnessUpdateTerminalRequest,
  requestSkillFreshnessUpdateTerminal
} from './skill-freshness-update-terminal'

const mocks = vi.hoisted(() => ({
  inventory: null as {
    schemaVersion: 1
    installations: SkillFreshnessInstallation[]
    eligibleUpdateNames: string[]
    scannedAt: number
  } | null,
  refresh: vi.fn(),
  terminalProps: [] as { command: string; description: string }[],
  notifyChanged: vi.fn()
}))

vi.mock('@/hooks/useSkillFreshness', () => ({
  useSkillFreshness: () => ({
    inventory: mocks.inventory,
    loading: false,
    error: null,
    refresh: mocks.refresh
  })
}))

vi.mock('@/hooks/useInstalledAgentSkills', () => ({
  notifyInstalledAgentSkillsChanged: mocks.notifyChanged
}))

vi.mock('@/components/onboarding/OnboardingInlineCommandTerminal', () => ({
  OnboardingInlineCommandTerminal: (props: { command: string; description: string }) => {
    mocks.terminalProps.push(props)
    return <div data-testid="update-terminal">{props.command}</div>
  }
}))

function placement(
  name: string,
  overrides: Partial<SkillFreshnessInstallation> = {}
): SkillFreshnessInstallation {
  return {
    id: `${name}-${overrides.rootId ?? 'home-agents'}`,
    name,
    description: null,
    rootId: 'home-agents',
    providers: ['agent-skills'],
    sourceKind: 'home',
    sourceLabel: 'Agent skills home',
    unresolvedPath: `/home/.agents/skills/${name}`,
    resolvedPath: `/home/.agents/skills/${name}`,
    physicalIdentity: `physical-${name}`,
    topology: 'canonical-copy',
    status: 'outdated',
    installedReleaseRevision: 1,
    installedAppVersion: '1.0.0',
    currentReleaseRevision: 2,
    currentPackageDigest: 'current',
    currentAppVersion: '2.0.0',
    observedPackageDigest: 'old',
    errorCategory: null,
    ...overrides
  }
}

let root: Root | null = null
let container: HTMLDivElement | null = null

async function renderPanel(): Promise<HTMLDivElement> {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root?.render(<SkillFreshnessPanel />)
  })
  return container
}

async function rerenderPanel(): Promise<void> {
  await act(async () => {
    root?.render(<SkillFreshnessPanel />)
  })
}

async function click(label: string): Promise<void> {
  const button = Array.from(container?.querySelectorAll('button') ?? []).find(
    (candidate) => candidate.textContent?.trim() === label
  )
  expect(button).toBeDefined()
  await act(async () => {
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

describe('SkillFreshnessPanel', () => {
  beforeEach(() => {
    consumeSkillFreshnessUpdateTerminalRequest()
    mocks.refresh.mockReset()
    mocks.notifyChanged.mockReset()
    mocks.terminalProps.length = 0
    mocks.inventory = {
      schemaVersion: 1,
      installations: [
        placement('orca-cli'),
        placement('orchestration', {
          status: 'current',
          installedReleaseRevision: 2,
          observedPackageDigest: 'current'
        })
      ],
      eligibleUpdateNames: ['orca-cli'],
      scannedAt: 1
    }
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount())
    }
    root = null
    container?.remove()
    container = null
  })

  it('shows evidence-based statuses and the no-automatic-write contract', async () => {
    const rendered = await renderPanel()

    expect(rendered.textContent).toContain('Update available')
    expect(rendered.textContent).toContain('Current')
    expect(rendered.textContent).toContain('never writes to skill folders')
    expect(rendered.textContent).toContain('1 skill can be updated safely')
  })

  it('opens only the name-scoped targeted command as an editable terminal draft', async () => {
    await renderPanel()
    await click('Review update command')

    expect(mocks.terminalProps.at(-1)).toMatchObject({
      command: 'npx skills update orca-cli --global',
      description:
        'The targeted command is pre-filled but not running. Review it and press Enter to continue.'
    })

    await click('Close terminal')
    expect(mocks.notifyChanged).toHaveBeenCalledTimes(1)
  })

  it('preserves a nudge request until freshness inventory supplies a safe command', async () => {
    const inventory = mocks.inventory
    mocks.inventory = null
    await renderPanel()

    requestSkillFreshnessUpdateTerminal()
    expect(mocks.terminalProps).toEqual([])

    mocks.inventory = inventory
    await rerenderPanel()

    expect(mocks.terminalProps.at(-1)?.command).toBe('npx skills update orca-cli --global')
  })

  it('keeps a poisoned outdated name visible without offering an action', async () => {
    mocks.inventory = {
      schemaVersion: 1,
      installations: [
        placement('orca-cli'),
        placement('orca-cli', {
          id: 'repo-copy',
          rootId: 'repo',
          sourceKind: 'repo',
          topology: 'repo-scope',
          status: 'unrecognized',
          unresolvedPath: '/repo/.agents/skills/orca-cli'
        })
      ],
      eligibleUpdateNames: [],
      scannedAt: 1
    }
    const rendered = await renderPanel()

    expect(rendered.textContent).toContain(
      'another placement of this name prevents a safe global update'
    )
    expect(rendered.textContent).toContain('Repository scope')
    expect(rendered.textContent).not.toContain('Review update command')
  })

  it('explains a self-blocked outdated placement without blaming a sibling', async () => {
    mocks.inventory = {
      schemaVersion: 1,
      installations: [placement('orca-cli', { topology: 'read-only' })],
      eligibleUpdateNames: [],
      scannedAt: 1
    }
    const rendered = await renderPanel()

    expect(rendered.textContent).toContain('this placement cannot be updated safely in place')
    expect(rendered.textContent).not.toContain('another placement of this name')
    expect(rendered.textContent).toContain('Read only')
  })
})
