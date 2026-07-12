import { createRequire } from 'node:module'
import { describe, expect, it, vi } from 'vitest'

type WindowsTerminalHarness = {
  _agent: { kill: () => void }
  _close: () => void
  _deferreds: { run: () => void }[]
  _isReady: boolean
  destroy: () => void
  kill: (signal?: string) => void
}

const require = createRequire(import.meta.url)
const { WindowsTerminal } = require('node-pty/lib/windowsTerminal') as {
  WindowsTerminal: { prototype: WindowsTerminalHarness }
}

function createPreReadyTerminal(): WindowsTerminalHarness {
  const terminal = Object.create(WindowsTerminal.prototype) as WindowsTerminalHarness
  terminal._agent = { kill: vi.fn() }
  terminal._close = vi.fn()
  terminal._deferreds = []
  terminal._isReady = false
  return terminal
}

describe('patched node-pty Windows pre-ready shutdown', () => {
  it('executes kill immediately without waiting for first output', () => {
    const terminal = createPreReadyTerminal()
    const deferred = vi.fn()
    terminal._deferreds = [{ run: deferred }]

    terminal.kill()

    expect(terminal._close).toHaveBeenCalledOnce()
    expect(terminal._agent.kill).toHaveBeenCalledOnce()
    expect(terminal._deferreds).toEqual([])
    expect(deferred).not.toHaveBeenCalled()
  })

  it('executes destroy immediately without waiting for first output', () => {
    const terminal = createPreReadyTerminal()
    const deferred = vi.fn()
    terminal._deferreds = [{ run: deferred }]

    terminal.destroy()

    expect(terminal._close).toHaveBeenCalledOnce()
    expect(terminal._agent.kill).toHaveBeenCalledOnce()
    expect(terminal._deferreds).toEqual([])
    expect(deferred).not.toHaveBeenCalled()
  })

  it('rejects unsupported signals before closing the terminal', () => {
    const terminal = createPreReadyTerminal()

    expect(() => terminal.kill('SIGTERM')).toThrow('Signals not supported on windows.')
    expect(terminal._close).not.toHaveBeenCalled()
    expect(terminal._agent.kill).not.toHaveBeenCalled()
  })
})
