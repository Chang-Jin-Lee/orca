import { describe, expect, it } from 'vitest'
import type { AiVaultSession } from '../../shared/ai-vault-types'
import {
  dedupeCodexRolloutFileAliases,
  dedupeCodexSessionsBySessionId
} from './codex-session-root-dedup'

const REAL_HOME_ROLLOUT =
  '/Users/ada/.codex/sessions/2026/07/01/rollout-2026-07-01T10-00-00-019f0000-1111-7222-8333-444444444444.jsonl'
const MANAGED_HOME_ROLLOUT =
  '/Users/ada/Library/Application Support/orca/codex-runtime-home/home/sessions/2026/07/01/rollout-2026-07-01T10-00-00-019f0000-1111-7222-8333-444444444444.jsonl'
const MANAGED_HOME = '/Users/ada/Library/Application Support/orca/codex-runtime-home/home'

function codexSession(overrides: Partial<AiVaultSession>): AiVaultSession {
  return {
    id: `local:codex:${overrides.sessionId ?? 'session-1'}:${overrides.filePath ?? '/tmp/x.jsonl'}`,
    executionHostId: 'local',
    agent: 'codex',
    sessionId: 'session-1',
    title: 'Session',
    cwd: '/repo/app',
    branch: null,
    model: null,
    filePath: '/tmp/x.jsonl',
    codexHome: null,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:05:00.000Z',
    modifiedAt: '2026-07-01T10:05:00.000Z',
    messageCount: 1,
    totalTokens: 10,
    previewMessages: [],
    queuedMessageCount: 0,
    subagentTranscriptCount: 0,
    resumeCommand: 'codex resume session-1',
    subagent: null,
    ...overrides
  } as AiVaultSession
}

describe('dedupeCodexRolloutFileAliases', () => {
  type Candidate = { agent: string; path: string; codexHome: string | null }
  const accessors = {
    isCodex: (candidate: Candidate) => candidate.agent === 'codex',
    getFilePath: (candidate: Candidate) => candidate.path,
    getCodexHome: (candidate: Candidate) => candidate.codexHome
  }

  it('keeps the real-home alias when the same rollout exists in both roots', () => {
    const managed = { agent: 'codex', path: MANAGED_HOME_ROLLOUT, codexHome: MANAGED_HOME }
    const real = { agent: 'codex', path: REAL_HOME_ROLLOUT, codexHome: null }
    expect(dedupeCodexRolloutFileAliases([managed, real], accessors)).toEqual([real])
    expect(dedupeCodexRolloutFileAliases([real, managed], accessors)).toEqual([real])
  })

  it('prefers the managed runtime home over other non-default homes', () => {
    const managed = { agent: 'codex', path: MANAGED_HOME_ROLLOUT, codexHome: MANAGED_HOME }
    const wslReal = {
      agent: 'codex',
      path: `\\\\wsl$\\Ubuntu\\home\\ada\\.codex\\sessions\\2026\\07\\01\\rollout-2026-07-01T10-00-00-019f0000-1111-7222-8333-444444444444.jsonl`,
      codexHome: '\\\\wsl$\\Ubuntu\\home\\ada\\.codex'
    }
    expect(dedupeCodexRolloutFileAliases([wslReal, managed], accessors)).toEqual([managed])
  })

  it('recognizes the managed runtime home with backslash separators', () => {
    const managed = {
      agent: 'codex',
      path: 'C:\\Users\\ada\\AppData\\Roaming\\orca\\codex-runtime-home\\home\\sessions\\2026\\07\\01\\rollout-2026-07-01T10-00-00-019f0000-1111-7222-8333-444444444444.jsonl',
      codexHome: 'C:\\Users\\ada\\AppData\\Roaming\\orca\\codex-runtime-home\\home'
    }
    const custom = {
      agent: 'codex',
      path: 'D:\\codex\\sessions\\2026\\07\\01\\rollout-2026-07-01T10-00-00-019f0000-1111-7222-8333-444444444444.jsonl',
      codexHome: 'D:\\codex'
    }
    expect(dedupeCodexRolloutFileAliases([custom, managed], accessors)).toEqual([managed])
  })

  it('keeps distinct rollouts, non-codex candidates, and non-rollout file names', () => {
    const real = { agent: 'codex', path: REAL_HOME_ROLLOUT, codexHome: null }
    const other = {
      agent: 'codex',
      path: '/Users/ada/.codex/sessions/2026/07/02/rollout-2026-07-02T09-00-00-029f0000-1111-7222-8333-555555555555.jsonl',
      codexHome: null
    }
    const oddName = {
      agent: 'codex',
      path: `${MANAGED_HOME}/sessions/notes.jsonl`,
      codexHome: MANAGED_HOME
    }
    const claude = { agent: 'claude', path: REAL_HOME_ROLLOUT, codexHome: null }
    expect(dedupeCodexRolloutFileAliases([real, other, oddName, claude], accessors)).toEqual([
      real,
      other,
      oddName,
      claude
    ])
  })
})

describe('dedupeCodexSessionsBySessionId', () => {
  it('collapses a both-roots session to the real-home row', () => {
    const managed = codexSession({
      filePath: MANAGED_HOME_ROLLOUT,
      codexHome: MANAGED_HOME,
      id: `local:codex:session-1:${MANAGED_HOME_ROLLOUT}`
    })
    const real = codexSession({
      filePath: REAL_HOME_ROLLOUT,
      codexHome: null,
      id: `local:codex:session-1:${REAL_HOME_ROLLOUT}`
    })
    expect(dedupeCodexSessionsBySessionId([managed, real])).toEqual([real])
    expect(dedupeCodexSessionsBySessionId([real, managed])).toEqual([real])
  })

  it('keeps managed-only and real-only sessions unchanged', () => {
    const managedOnly = codexSession({
      sessionId: 'managed-only',
      filePath: `${MANAGED_HOME}/sessions/2026/07/01/rollout-a.jsonl`,
      codexHome: MANAGED_HOME
    })
    const realOnly = codexSession({
      sessionId: 'real-only',
      filePath: REAL_HOME_ROLLOUT,
      codexHome: null
    })
    expect(dedupeCodexSessionsBySessionId([managedOnly, realOnly])).toEqual([managedOnly, realOnly])
  })

  it('never collapses across execution hosts or agents', () => {
    const local = codexSession({ sessionId: 'session-1', executionHostId: 'local' })
    const remote = codexSession({
      sessionId: 'session-1',
      executionHostId: 'ssh:build-box',
      id: 'ssh:build-box:codex:session-1:/home/ada/.codex/sessions/x.jsonl'
    })
    const claude = codexSession({ sessionId: 'session-1', agent: 'claude' })
    expect(dedupeCodexSessionsBySessionId([local, remote, claude])).toEqual([local, remote, claude])
  })

  it('resolves same-rank id collisions to the newest row, then stable path order', () => {
    const older = codexSession({
      sessionId: 'collision',
      filePath: '/Users/ada/.codex/sessions/2026/07/01/rollout-old.jsonl',
      codexHome: null,
      updatedAt: '2026-07-01T10:00:00.000Z',
      modifiedAt: '2026-07-01T10:00:00.000Z'
    })
    const newer = codexSession({
      sessionId: 'collision',
      filePath: '/Users/ada/.codex/sessions/2026/07/02/rollout-new.jsonl',
      codexHome: null,
      updatedAt: '2026-07-02T10:00:00.000Z',
      modifiedAt: '2026-07-02T10:00:00.000Z'
    })
    expect(dedupeCodexSessionsBySessionId([older, newer])).toEqual([newer])

    const tieA = codexSession({
      sessionId: 'tie',
      filePath: '/Users/ada/.codex/sessions/2026/07/01/rollout-a.jsonl',
      codexHome: null
    })
    const tieB = codexSession({
      sessionId: 'tie',
      filePath: '/Users/ada/.codex/sessions/2026/07/01/rollout-b.jsonl',
      codexHome: null
    })
    expect(dedupeCodexSessionsBySessionId([tieB, tieA])).toEqual([tieA])
  })

  it('prefers the managed runtime home over a WSL real home when no host real-home row exists', () => {
    const wslManaged = codexSession({
      sessionId: 'wsl-pair',
      filePath:
        '\\\\wsl$\\Ubuntu\\home\\ada\\.local\\share\\orca\\codex-runtime-home\\home\\sessions\\rollout-a.jsonl',
      codexHome: '\\\\wsl$\\Ubuntu\\home\\ada\\.local\\share\\orca\\codex-runtime-home\\home'
    })
    const wslReal = codexSession({
      sessionId: 'wsl-pair',
      filePath: '\\\\wsl$\\Ubuntu\\home\\ada\\.codex\\sessions\\rollout-a.jsonl',
      codexHome: '\\\\wsl$\\Ubuntu\\home\\ada\\.codex'
    })
    expect(dedupeCodexSessionsBySessionId([wslReal, wslManaged])).toEqual([wslManaged])
  })
})
