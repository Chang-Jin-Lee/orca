/**
 * Regression: automation run history is durable state, re-serialized and
 * re-hashed on every debounced save, and each run can carry a 256KB output
 * snapshot. It previously grew without bound for any user with a recurring
 * automation. createAutomationRun now caps retained *final* runs per automation
 * while never evicting an in-flight run (which would break updateAutomationRun's
 * by-id lookup).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { AutomationRun, AutomationRunStatus } from '../../shared/automations-types'
import {
  MAX_RETAINED_FINAL_AUTOMATION_RUNS_PER_AUTOMATION,
  pruneAutomationRunHistory
} from '../persistence'

const testState = { dir: '' }

vi.mock('electron', () => ({
  app: { getPath: () => testState.dir },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (plaintext: string) => Buffer.from(`encrypted:${plaintext}`, 'utf-8'),
    decryptString: (ciphertext: Buffer) => ciphertext.toString('utf-8').slice('encrypted:'.length)
  }
}))

const MAX = MAX_RETAINED_FINAL_AUTOMATION_RUNS_PER_AUTOMATION

function makeRun(automationId: string, index: number, status: AutomationRunStatus): AutomationRun {
  return {
    id: `${automationId}-run-${index}`,
    automationId,
    createdAt: index,
    status,
    trigger: 'scheduled',
    title: `${automationId} run ${index}`,
    scheduledFor: index,
    workspaceId: null,
    sessionKind: 'terminal',
    chatSessionId: null,
    terminalSessionId: null,
    terminalPaneKey: null,
    terminalPtyId: null,
    outputSnapshot: null,
    precheckResult: null,
    usage: null,
    error: null,
    startedAt: null,
    dispatchedAt: null
  } as AutomationRun
}

describe('pruneAutomationRunHistory', () => {
  it('returns the same array reference when under the cap', () => {
    const runs = Array.from({ length: MAX }, (_, i) => makeRun('a', i, 'completed'))
    expect(pruneAutomationRunHistory(runs)).toBe(runs)
  })

  it('caps final runs per automation, keeping the newest by createdAt', () => {
    const runs = Array.from({ length: MAX + 25 }, (_, i) => makeRun('a', i, 'completed'))
    const pruned = pruneAutomationRunHistory(runs)
    expect(pruned).toHaveLength(MAX)
    // Oldest 25 evicted, newest MAX kept.
    const keptIds = new Set(pruned.map((r) => r.id))
    expect(keptIds.has('a-run-0')).toBe(false)
    expect(keptIds.has(`a-run-${MAX + 24}`)).toBe(true)
    // Original ordering is preserved.
    const createdAts = pruned.map((r) => r.createdAt)
    expect(createdAts).toEqual([...createdAts].sort((x, y) => x - y))
  })

  it('never evicts non-final runs even when far past the cap', () => {
    // One very old dispatched (in-flight) run plus MAX+50 newer completed ones.
    const stuck = makeRun('a', 0, 'dispatched')
    const completed = Array.from({ length: MAX + 50 }, (_, i) => makeRun('a', i + 1, 'completed'))
    const pruned = pruneAutomationRunHistory([stuck, ...completed])
    const keptIds = new Set(pruned.map((r) => r.id))
    expect(keptIds.has(stuck.id)).toBe(true)
    // Still exactly MAX final runs retained alongside the stuck one.
    expect(pruned.filter((r) => r.status === 'completed')).toHaveLength(MAX)
  })

  it('caps each automation independently', () => {
    const a = Array.from({ length: MAX + 10 }, (_, i) => makeRun('a', i, 'completed'))
    const b = Array.from({ length: MAX + 30 }, (_, i) => makeRun('b', i, 'completed'))
    const pruned = pruneAutomationRunHistory([...a, ...b])
    expect(pruned.filter((r) => r.automationId === 'a')).toHaveLength(MAX)
    expect(pruned.filter((r) => r.automationId === 'b')).toHaveLength(MAX)
  })
})

async function createStore() {
  vi.resetModules()
  const { Store, initDataPath } = await import('../persistence')
  initDataPath()
  return new Store()
}

describe('createAutomationRun retention (end to end)', () => {
  beforeEach(() => {
    testState.dir = mkdtempSync(join(tmpdir(), 'orca-automation-retention-'))
  })
  afterEach(() => {
    rmSync(testState.dir, { recursive: true, force: true })
  })

  it('bounds stored run history instead of growing without limit', async () => {
    const store = await createStore()
    const automation = store.createAutomation({
      name: 'Nightly',
      prompt: 'do the thing',
      agentId: 'claude',
      projectId: 'r1',
      workspaceMode: 'existing',
      workspaceId: 'wt1',
      timezone: 'UTC',
      rrule: 'FREQ=HOURLY',
      dtstart: 0
    })

    const total = MAX + 40
    for (let i = 0; i < total; i += 1) {
      const run = store.createAutomationRun(automation, i)
      store.updateAutomationRun({ runId: run.id, status: 'completed' })
    }

    const stored = store.listAutomationRuns(automation.id)
    // Bounded well below the number of runs actually executed.
    expect(stored.length).toBeLessThan(total)
    expect(stored.length).toBeLessThanOrEqual(MAX + 1)
    // The earliest run has been evicted; a recent one survives.
    const scheduledFors = new Set(stored.map((r) => r.scheduledFor))
    expect(scheduledFors.has(0)).toBe(false)
    expect(scheduledFors.has(total - 1)).toBe(true)
  })

  it('does not strand an in-flight run whose completion lands after many later runs', async () => {
    const store = await createStore()
    const automation = store.createAutomation({
      name: 'Nightly',
      prompt: 'do the thing',
      agentId: 'claude',
      projectId: 'r1',
      workspaceMode: 'existing',
      workspaceId: 'wt1',
      timezone: 'UTC',
      rrule: 'FREQ=HOURLY',
      dtstart: 0
    })

    // First run stays in-flight (never completed) while many later runs complete.
    const inflight = store.createAutomationRun(automation, 0)
    for (let i = 1; i < MAX + 40; i += 1) {
      const run = store.createAutomationRun(automation, i)
      store.updateAutomationRun({ runId: run.id, status: 'completed' })
    }

    // The late completion of the old in-flight run must still find it.
    expect(() =>
      store.updateAutomationRun({ runId: inflight.id, status: 'completed' })
    ).not.toThrow()
  })
})
