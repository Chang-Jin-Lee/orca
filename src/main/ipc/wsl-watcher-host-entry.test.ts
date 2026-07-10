import { PassThrough } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { buildIgnoreGlobs, startWslWatcherHost } from './wsl-watcher-host-entry'

describe('WSL watcher Linux host', () => {
  it('builds nested directory exclusions without treating names as regex', () => {
    const [nodeModules, dotted] = buildIgnoreGlobs(['node_modules', '.cache'])

    expect(nodeModules).toBe('^(?:.*/)?node_modules(?:/.*)?$')
    expect(dotted).toBe('^(?:.*/)?\\.cache(?:/.*)?$')
    expect(new RegExp(nodeModules!).test('/repo/packages/app/node_modules/pkg/file.js')).toBe(true)
    expect(new RegExp(dotted!).test('/repo/.cache/item')).toBe(true)
  })

  it('multiplexes subscriptions and native events over JSON lines', async () => {
    const input = new PassThrough()
    const output = new PassThrough()
    let outputText = ''
    output.on('data', (chunk: Buffer) => {
      outputText += chunk.toString('utf8')
    })
    let callback: ((error: Error | null, events: unknown[]) => void) | undefined
    const subscribe = vi.fn(async (_dir, createdCallback) => {
      callback = createdCallback
    })
    const unsubscribe = vi.fn(async () => undefined)
    const exit = vi.fn()
    startWslWatcherHost({ subscribe, unsubscribe } as never, input, output, exit)

    expect(outputText).toContain('"op":"ready"')
    input.write(
      `${JSON.stringify({
        op: 'subscribe',
        id: 7,
        dir: '/home/me/repo',
        ignoreDirs: ['node_modules']
      })}\n`
    )
    await vi.waitFor(() => expect(outputText).toContain('"op":"subscribed","id":7'))
    expect(subscribe).toHaveBeenCalledWith('/home/me/repo', expect.any(Function), {
      ignoreGlobs: ['^(?:.*/)?node_modules(?:/.*)?$']
    })

    callback?.(null, [{ type: 'update', path: '/home/me/repo/README.md' }])
    expect(outputText).toContain('"op":"events","id":7')
    input.write(`${JSON.stringify({ op: 'unsubscribe', id: 7 })}\n`)
    await vi.waitFor(() => expect(outputText).toContain('"op":"unsubscribed","id":7'))
    expect(unsubscribe).toHaveBeenCalledOnce()

    input.end()
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0))
  })

  it('rejects malformed commands without invoking the native binding', async () => {
    const input = new PassThrough()
    const output = new PassThrough()
    let outputText = ''
    output.on('data', (chunk: Buffer) => {
      outputText += chunk.toString('utf8')
    })
    const subscribe = vi.fn()
    startWslWatcherHost({ subscribe, unsubscribe: vi.fn() } as never, input, output, vi.fn())

    input.write('{not-json}\n')
    await vi.waitFor(() => expect(outputText).toContain('"op":"protocol-error"'))
    expect(subscribe).not.toHaveBeenCalled()
    input.end()
  })
})
