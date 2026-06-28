import { describe, expect, it, vi } from 'vitest'
import { RpcDispatcher } from '../dispatcher'
import type { RpcRequest, RpcResponse } from '../core'
import { ORCHESTRATION_GATE_METHODS } from './orchestration-gates'
import { OrchestrationDb } from '../../orchestration/db'
import type { OrcaRuntimeService } from '../../orca-runtime'

// Why (#4389): the start/stop guard must scope by workspace so two orchestrators
// in different worktrees of one Orca instance neither block nor stop each other.
// A fake runtime maps each worktree selector to a stable workspace key and
// stubs the CoordinatorRuntime surface so the background loop can start without
// touching real terminals or git.

function makeRequest(method: string, params: unknown = {}): RpcRequest {
  return { id: `req_${method}`, authToken: 'tok', method, params }
}

function expectOk(response: RpcResponse): Extract<RpcResponse, { ok: true }> {
  if (!response.ok) {
    throw new Error(`expected ok response, got error: ${response.error.message}`)
  }
  return response
}

function runId(response: RpcResponse): string {
  return (expectOk(response).result as { runId: string }).runId
}

// Maps `worktree:wt_a` style selectors straight through; the coordinator loop's
// terminal calls are no-ops so dispatchReadyTasks stays inert and harmless.
function makeRuntime(db: OrchestrationDb): OrcaRuntimeService {
  return {
    getRuntimeId: () => 'test-runtime',
    getOrchestrationDb: () => db,
    resolveWorkspaceKeyForSelector: vi.fn(async (selector?: string | null) =>
      selector ? selector : null
    ),
    // CoordinatorRuntime surface — no terminals available, so the loop just
    // polls without dispatching anything.
    listTerminals: vi.fn(async () => ({ terminals: [] })),
    createTerminal: vi.fn(async () => {
      throw new Error('no terminals in test')
    }),
    sendTerminal: vi.fn(async () => ({})),
    waitForTerminal: vi.fn(async (handle: string) => ({ handle, condition: 'idle' })),
    probeWorktreeDrift: vi.fn(async () => null)
  } as unknown as OrcaRuntimeService
}

// Why: orchestration.run fires the coordinator loop in the background. A short
// poll interval plus runStop for each started workspace lets every loop observe
// `stopped` and finish its final DB write before the test closes the DB, so no
// post-close write leaks as an unhandled rejection.
const SHORT_POLL_MS = 5

async function stopAndDrain(
  dispatcher: RpcDispatcher,
  worktrees: (string | undefined)[]
): Promise<void> {
  for (const worktree of worktrees) {
    await dispatcher.dispatch(makeRequest('orchestration.runStop', worktree ? { worktree } : {}))
  }
  await new Promise((resolve) => setTimeout(resolve, SHORT_POLL_MS * 4))
}

describe('orchestration start/stop guard scoping (#4389)', () => {
  it('does not reject a run in worktree B while a run is active in worktree A', async () => {
    const db = new OrchestrationDb(':memory:')
    const runtime = makeRuntime(db)
    const dispatcher = new RpcDispatcher({ runtime, methods: ORCHESTRATION_GATE_METHODS })
    try {
      // Each workspace owns its own ready task so the coordinator's decompose
      // step finds work instead of throwing "No tasks found".
      db.createTask({ spec: 'a-work', workspaceKey: 'worktree:wt_a' })
      db.createTask({ spec: 'b-work', workspaceKey: 'worktree:wt_b' })

      const runAId = runId(
        await dispatcher.dispatch(
          makeRequest('orchestration.run', {
            spec: 'a',
            from: 'coord_a',
            worktree: 'worktree:wt_a',
            pollIntervalMs: SHORT_POLL_MS
          })
        )
      )

      // The 2nd run in a different workspace must succeed, not throw
      // "Coordinator already running".
      const runBId = runId(
        await dispatcher.dispatch(
          makeRequest('orchestration.run', {
            spec: 'b',
            from: 'coord_b',
            worktree: 'worktree:wt_b',
            pollIntervalMs: SHORT_POLL_MS
          })
        )
      )

      expect(runAId).not.toBe(runBId)
      expect(db.getActiveCoordinatorRun('worktree:wt_a')?.id).toBe(runAId)
      expect(db.getActiveCoordinatorRun('worktree:wt_b')?.id).toBe(runBId)

      await stopAndDrain(dispatcher, ['worktree:wt_a', 'worktree:wt_b'])
    } finally {
      db.close()
    }
  })

  it('rejects a second run in the SAME worktree', async () => {
    const db = new OrchestrationDb(':memory:')
    const runtime = makeRuntime(db)
    const dispatcher = new RpcDispatcher({ runtime, methods: ORCHESTRATION_GATE_METHODS })
    try {
      db.createTask({ spec: 'a-work', workspaceKey: 'worktree:wt_a' })

      expectOk(
        await dispatcher.dispatch(
          makeRequest('orchestration.run', {
            spec: 'a',
            from: 'coord_a',
            worktree: 'worktree:wt_a',
            pollIntervalMs: SHORT_POLL_MS
          })
        )
      )
      const second = await dispatcher.dispatch(
        makeRequest('orchestration.run', {
          spec: 'a2',
          from: 'coord_a2',
          worktree: 'worktree:wt_a',
          pollIntervalMs: SHORT_POLL_MS
        })
      )
      expect(second.ok).toBe(false)
      if (!second.ok) {
        expect(second.error.message).toMatch(/Coordinator already running/)
      }

      await stopAndDrain(dispatcher, ['worktree:wt_a'])
    } finally {
      db.close()
    }
  })

  it('runStop for worktree B leaves worktree A running', async () => {
    const db = new OrchestrationDb(':memory:')
    const runtime = makeRuntime(db)
    const dispatcher = new RpcDispatcher({ runtime, methods: ORCHESTRATION_GATE_METHODS })
    try {
      db.createTask({ spec: 'a-work', workspaceKey: 'worktree:wt_a' })
      db.createTask({ spec: 'b-work', workspaceKey: 'worktree:wt_b' })

      const runAId = runId(
        await dispatcher.dispatch(
          makeRequest('orchestration.run', {
            spec: 'a',
            from: 'coord_a',
            worktree: 'worktree:wt_a',
            pollIntervalMs: SHORT_POLL_MS
          })
        )
      )
      expectOk(
        await dispatcher.dispatch(
          makeRequest('orchestration.run', {
            spec: 'b',
            from: 'coord_b',
            worktree: 'worktree:wt_b',
            pollIntervalMs: SHORT_POLL_MS
          })
        )
      )

      const stopB = expectOk(
        await dispatcher.dispatch(
          makeRequest('orchestration.runStop', { worktree: 'worktree:wt_b' })
        )
      )
      expect((stopB.result as { stopped: boolean }).stopped).toBe(true)

      // A's run must still be the active run for its workspace after stopping B.
      expect(db.getActiveCoordinatorRun('worktree:wt_a')?.id).toBe(runAId)

      await stopAndDrain(dispatcher, ['worktree:wt_a'])
    } finally {
      db.close()
    }
  })
})
