import { describe, expect, it, vi } from 'vitest'
import type { OrcaRuntimeService } from '../orca-runtime'
import type { RpcRequest } from './core'
import { RpcDispatcher } from './dispatcher'
import { TERMINAL_METHODS } from './methods/terminal'

function request(params: unknown): RpcRequest {
  return { id: 'req-1', authToken: 'tok', method: 'terminal.close', params }
}

describe('terminal close runtime generation', () => {
  it('rejects a close fenced to a replaced runtime before touching the handle', async () => {
    const closeTerminal = vi.fn()
    const dispatcher = new RpcDispatcher({
      runtime: {
        getRuntimeId: () => 'runtime-b',
        closeTerminal
      } as unknown as OrcaRuntimeService,
      methods: TERMINAL_METHODS
    })

    const response = await dispatcher.dispatch(
      request({ terminal: 'terminal-1', expectedRuntimeId: 'runtime-a' })
    )

    expect(response).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('runtime_generation_mismatch') },
      _meta: { runtimeId: 'runtime-b' }
    })
    expect(closeTerminal).not.toHaveBeenCalled()
  })

  it('closes a handle when the expected runtime generation still owns it', async () => {
    const closeTerminal = vi.fn().mockResolvedValue({ closed: true })
    const dispatcher = new RpcDispatcher({
      runtime: {
        getRuntimeId: () => 'runtime-a',
        closeTerminal
      } as unknown as OrcaRuntimeService,
      methods: TERMINAL_METHODS
    })

    await expect(
      dispatcher.dispatch(request({ terminal: 'terminal-1', expectedRuntimeId: 'runtime-a' }))
    ).resolves.toMatchObject({ ok: true })
    expect(closeTerminal).toHaveBeenCalledWith('terminal-1')
  })
})
