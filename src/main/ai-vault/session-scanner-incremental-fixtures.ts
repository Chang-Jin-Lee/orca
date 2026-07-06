import type { AiVaultAgent } from '../../shared/ai-vault-types'

// Line builders for the incremental-parse differential tests: each agent gets
// a seed transcript, an appended continuation, and a truncated rewrite, all in
// that agent's real on-disk JSONL record shapes.

export type IncrementalAgentFixture = {
  agent: AiVaultAgent
  fileName: string
  seedLines: string[]
  appendLines: string[]
  truncatedLines: string[]
}

const CODEX_SESSION_ID = '019f0000-1111-7222-8333-444444444444'

function codexLine(record: Record<string, unknown>): string {
  return JSON.stringify(record)
}

export function codexFixture(): IncrementalAgentFixture {
  return {
    agent: 'codex',
    fileName: `rollout-2026-05-01T10-00-00-${CODEX_SESSION_ID}.jsonl`,
    seedLines: [
      codexLine({
        timestamp: '2026-05-01T10:00:00.000Z',
        type: 'session_meta',
        payload: { id: CODEX_SESSION_ID, cwd: '/repo/app', git: { branch: 'feature/vault' } }
      }),
      codexLine({
        timestamp: '2026-05-01T10:00:05.000Z',
        type: 'response_item',
        payload: { type: 'message', role: 'user', content: 'codex seed question' }
      }),
      codexLine({
        timestamp: '2026-05-01T10:00:10.000Z',
        type: 'response_item',
        payload: { type: 'message', role: 'assistant', content: 'codex seed answer' }
      }),
      codexLine({
        timestamp: '2026-05-01T10:00:11.000Z',
        type: 'event_msg',
        payload: {
          type: 'token_count',
          info: { total_token_usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 } },
          model: 'gpt-5.1-codex'
        }
      })
    ],
    appendLines: [
      codexLine({
        timestamp: '2026-05-01T10:05:00.000Z',
        type: 'event_msg',
        payload: { type: 'user_message', message: 'codex follow-up' }
      }),
      codexLine({
        timestamp: '2026-05-01T10:05:20.000Z',
        type: 'event_msg',
        payload: { type: 'agent_message', message: 'codex incremental answer' }
      }),
      codexLine({
        timestamp: '2026-05-01T10:05:21.000Z',
        type: 'event_msg',
        payload: {
          type: 'token_count',
          info: { total_token_usage: { input_tokens: 220, output_tokens: 90, total_tokens: 310 } }
        }
      })
    ],
    truncatedLines: [
      codexLine({
        timestamp: '2026-05-01T10:00:00.000Z',
        type: 'session_meta',
        payload: { id: CODEX_SESSION_ID, cwd: '/repo/app' }
      }),
      codexLine({
        timestamp: '2026-05-01T10:00:05.000Z',
        type: 'event_msg',
        payload: { type: 'user_message', message: 'rewritten only turn' }
      })
    ]
  }
}

export function codexWorkerFixtureLines(): string[] {
  return [
    codexLine({
      timestamp: '2026-05-01T10:00:00.000Z',
      type: 'session_meta',
      payload: { id: CODEX_SESSION_ID, cwd: '/repo/app', thread_source: 'subagent' }
    }),
    codexLine({
      timestamp: '2026-05-01T10:00:05.000Z',
      type: 'event_msg',
      payload: { type: 'user_message', message: 'worker turn' }
    })
  ]
}

export const CODEX_FIXTURE_SESSION_ID = CODEX_SESSION_ID

export function cursorFixture(): IncrementalAgentFixture {
  const line = (role: string, text: string, at: string) =>
    JSON.stringify({ role, message: { content: text }, timestamp: at })
  return {
    agent: 'cursor',
    fileName: 'agent-transcripts-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jsonl',
    seedLines: [
      line('user', 'cursor seed question', '2026-05-01T10:00:00.000Z'),
      line('assistant', 'cursor seed answer', '2026-05-01T10:01:00.000Z')
    ],
    appendLines: [
      line('user', 'cursor follow-up', '2026-05-01T10:02:00.000Z'),
      line('assistant', 'cursor incremental answer', '2026-05-01T10:03:00.000Z')
    ],
    truncatedLines: [line('user', 'cursor rewritten', '2026-05-01T10:00:00.000Z')]
  }
}

export function copilotFixture(): IncrementalAgentFixture {
  const line = (type: string, data: Record<string, unknown>, at: string) =>
    JSON.stringify({ type, data, timestamp: at })
  return {
    agent: 'copilot',
    fileName: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jsonl',
    seedLines: [
      line(
        'session.start',
        { sessionId: 'copilot-session-1', startTime: '2026-05-01T10:00:00.000Z' },
        '2026-05-01T10:00:00.000Z'
      ),
      line('user.message', { content: 'copilot seed question' }, '2026-05-01T10:00:05.000Z'),
      line('assistant.message', { content: 'copilot seed answer' }, '2026-05-01T10:00:30.000Z')
    ],
    appendLines: [
      line('user.message', { content: 'copilot follow-up' }, '2026-05-01T10:05:00.000Z'),
      line(
        'assistant.message',
        { content: 'copilot incremental answer' },
        '2026-05-01T10:05:30.000Z'
      ),
      line(
        'session.shutdown',
        { currentModel: 'gpt-5.1', currentTokens: 340 },
        '2026-05-01T10:06:00.000Z'
      )
    ],
    truncatedLines: [
      line(
        'session.start',
        { sessionId: 'copilot-session-1', startTime: '2026-05-01T10:00:00.000Z' },
        '2026-05-01T10:00:00.000Z'
      )
    ]
  }
}

export function droidFixture(): IncrementalAgentFixture {
  return {
    agent: 'droid',
    fileName: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jsonl',
    seedLines: [
      JSON.stringify({
        type: 'session_start',
        id: 'droid-session-1',
        title: 'Droid seed task',
        cwd: '/repo/app',
        timestamp: '2026-05-01T10:00:00.000Z'
      }),
      JSON.stringify({
        type: 'message',
        role: 'user',
        text: 'droid seed question',
        timestamp: '2026-05-01T10:00:05.000Z'
      })
    ],
    appendLines: [
      JSON.stringify({
        type: 'completion',
        finalText: 'droid incremental answer',
        usage: { input_tokens: 50, output_tokens: 25 },
        timestamp: '2026-05-01T10:01:00.000Z'
      })
    ],
    truncatedLines: [
      JSON.stringify({
        type: 'session_start',
        id: 'droid-session-1',
        title: 'Droid rewritten',
        timestamp: '2026-05-01T10:00:00.000Z'
      })
    ]
  }
}

export function openclawFixture(): IncrementalAgentFixture {
  return {
    agent: 'openclaw',
    fileName: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jsonl',
    seedLines: [
      JSON.stringify({
        type: 'session',
        id: 'openclaw-session-1',
        cwd: '/repo/app',
        timestamp: '2026-05-01T10:00:00.000Z'
      }),
      JSON.stringify({
        type: 'message',
        message: { role: 'user', content: 'openclaw seed question' },
        timestamp: '2026-05-01T10:00:05.000Z'
      })
    ],
    appendLines: [
      JSON.stringify({
        type: 'message',
        message: {
          role: 'assistant',
          content: 'openclaw incremental answer',
          model: 'claw-1',
          usage: { input_tokens: 40, output_tokens: 20 }
        },
        timestamp: '2026-05-01T10:01:00.000Z'
      })
    ],
    truncatedLines: [
      JSON.stringify({
        type: 'session',
        id: 'openclaw-session-1',
        timestamp: '2026-05-01T10:00:00.000Z'
      })
    ]
  }
}

export function geminiJsonlFixture(): IncrementalAgentFixture {
  return {
    agent: 'gemini',
    fileName: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jsonl',
    seedLines: [
      JSON.stringify({
        sessionId: 'gemini-session-1',
        startTime: '2026-05-01T10:00:00.000Z',
        type: 'user',
        content: 'gemini seed question',
        timestamp: '2026-05-01T10:00:00.000Z'
      }),
      JSON.stringify({
        type: 'gemini',
        content: 'gemini seed answer',
        model: 'gemini-3-pro',
        tokens: { input: 80, output: 30 },
        timestamp: '2026-05-01T10:00:30.000Z'
      })
    ],
    appendLines: [
      JSON.stringify({
        type: 'user',
        content: 'gemini follow-up',
        timestamp: '2026-05-01T10:01:00.000Z'
      }),
      JSON.stringify({ $set: { lastUpdated: '2026-05-01T10:01:05.000Z' } })
    ],
    truncatedLines: [
      JSON.stringify({
        sessionId: 'gemini-session-1',
        type: 'user',
        content: 'gemini rewritten',
        timestamp: '2026-05-01T10:00:00.000Z'
      })
    ]
  }
}

export function allIncrementalAgentFixtures(): IncrementalAgentFixture[] {
  return [
    codexFixture(),
    cursorFixture(),
    copilotFixture(),
    droidFixture(),
    openclawFixture(),
    geminiJsonlFixture()
  ]
}
