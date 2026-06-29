import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RpcDispatcher } from '../dispatcher'
import type { RpcRequest } from '../core'
import { OrcaRuntimeService } from '../../orca-runtime'
import type { AiVaultListResult } from '../../../../shared/ai-vault-types'
import type { AiVaultScanOptions } from '../../../ai-vault/session-scanner-types'

const { scanAiVaultSessions } = vi.hoisted(() => ({
  scanAiVaultSessions: vi.fn()
}))

vi.mock('../../../ai-vault/session-scanner', () => ({
  scanAiVaultSessions
}))

import { AI_VAULT_METHODS, AiVaultListSessionsParams } from './ai-vault'
import {
  configureAiVaultSessionSources,
  listAiVaultSessions,
  resetAiVaultSessionListCacheForTests
} from '../../../ai-vault/cached-session-list'

function makeRequest(method: string, params?: unknown): RpcRequest {
  return { id: 'req-1', authToken: 'tok', method, params }
}

const SCANNED_AT = '2026-06-29T00:00:00.000Z'

function makeResult(): AiVaultListResult {
  return { sessions: [], issues: [], scannedAt: SCANNED_AT }
}

function makeDispatcher(): RpcDispatcher {
  // Why: the handler only needs getRuntimeId (envelope) + listAiVaultSessions,
  // which delegates to the shared cache module the IPC handler also uses.
  const runtime = {
    getRuntimeId: () => 'test-runtime',
    listAiVaultSessions: (args?: Parameters<typeof listAiVaultSessions>[0]) =>
      listAiVaultSessions(args)
  } as unknown as OrcaRuntimeService
  return new RpcDispatcher({ runtime, methods: AI_VAULT_METHODS })
}

describe('aiVault.listSessions params schema', () => {
  it('accepts a bounded request', () => {
    const parsed = AiVaultListSessionsParams.safeParse({
      limit: 500,
      force: true,
      scopePaths: ['/home/user/repo']
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects a limit above the cap', () => {
    const parsed = AiVaultListSessionsParams.safeParse({ limit: 5000 })
    expect(parsed.success).toBe(false)
  })

  it('rejects too many scopePaths', () => {
    const parsed = AiVaultListSessionsParams.safeParse({
      scopePaths: Array.from({ length: 65 }, (_, index) => `/p/${index}`)
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects an over-long scopePath', () => {
    const parsed = AiVaultListSessionsParams.safeParse({ scopePaths: ['/'.padEnd(5000, 'a')] })
    expect(parsed.success).toBe(false)
  })
})

describe('aiVault.listSessions handler + shared cache', () => {
  beforeEach(() => {
    resetAiVaultSessionListCacheForTests()
    scanAiVaultSessions.mockReset()
    scanAiVaultSessions.mockResolvedValue(makeResult())
  })

  afterEach(() => {
    resetAiVaultSessionListCacheForTests()
  })

  it('returns the AiVaultListResult unchanged', async () => {
    const dispatcher = makeDispatcher()
    const response = await dispatcher.dispatch(makeRequest('aiVault.listSessions', { limit: 500 }))
    expect(response).toMatchObject({ ok: true, result: makeResult() })
  })

  it('shares one cache between the IPC entry point and the RPC method', async () => {
    const dispatcher = makeDispatcher()
    // First call via the shared module (what the desktop IPC handler invokes).
    await listAiVaultSessions({ limit: 500 })
    // Second call via the RPC method with the same cache key.
    await dispatcher.dispatch(makeRequest('aiVault.listSessions', { limit: 500 }))
    expect(scanAiVaultSessions).toHaveBeenCalledTimes(1)
  })

  it('injects codex-home dirs sourced from the runtime (serve-mode reachable)', async () => {
    configureAiVaultSessionSources({
      getAdditionalCodexHomePaths: () => ['/runtime/codex/home']
    })
    const dispatcher = makeDispatcher()
    await dispatcher.dispatch(makeRequest('aiVault.listSessions', {}))
    const options = scanAiVaultSessions.mock.calls[0]?.[0] as AiVaultScanOptions
    // Why: the codex-home is sourced from the runtime, not the window-only
    // registerCoreHandlers path, so it survives in serve mode.
    expect(options.additionalCodexSessionsDirs).toContain('/runtime/codex/home/sessions')
    expect(options.wslHomeDirs).toEqual([])
  })

  it('forwards codex-home through the real OrcaRuntimeService construction path', async () => {
    // Why: the dispatcher test above seeds the cache module directly, so it would
    // still pass if OrcaRuntimeService stopped forwarding the codex-home source.
    // Construct the real runtime to lock that cross-layer wiring in place.
    const runtime = new OrcaRuntimeService(null, undefined, {
      getAdditionalAiVaultCodexHomePaths: () => ['/ctor/codex/home']
    })
    await runtime.listAiVaultSessions({})
    const options = scanAiVaultSessions.mock.calls[0]?.[0] as AiVaultScanOptions
    expect(options.additionalCodexSessionsDirs).toContain('/ctor/codex/home/sessions')
  })
})
