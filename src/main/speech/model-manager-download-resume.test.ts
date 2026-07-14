import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ModelManager } from './model-manager'

const { netRequestMock } = vi.hoisted(() => ({
  netRequestMock: vi.fn()
}))

vi.mock('electron', () => ({
  app: {
    getPath: () => '/tmp/orca-speech-models-test'
  },
  net: {
    request: netRequestMock
  }
}))

type ModelManagerInternals = {
  downloadArchiveWithRetry: (
    url: string,
    archivePath: string,
    expectedSize: number,
    modelId: string,
    isAborted: () => boolean,
    signal: AbortSignal
  ) => Promise<void>
}

type ScriptedResponse = {
  statusCode: number
  headers?: Record<string, string>
  chunks?: Buffer[]
  failWith?: string
}

type ScriptedResponseFactory = (sentHeaders: Record<string, string>) => ScriptedResponse

// Emulates Electron's ClientRequest/IncomingMessage closely enough for the
// download pipeline: a real Readable body so stream.pipeline semantics
// (including mid-body destroy) match production behavior.
function scriptRequest(factory: ScriptedResponseFactory): { sentHeaders: Record<string, string> } {
  const sentHeaders: Record<string, string> = {}
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
  const addListener = (event: string, cb: (...args: unknown[]) => void): void => {
    const set = listeners.get(event) ?? new Set()
    set.add(cb)
    listeners.set(event, set)
  }
  const request = {
    setHeader: vi.fn((name: string, value: string) => {
      sentHeaders[name.toLowerCase()] = value
    }),
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      addListener(event, cb)
      return request
    }),
    off: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(cb)
      return request
    }),
    abort: vi.fn(() => request),
    end: vi.fn(() => {
      queueMicrotask(() => {
        const spec = factory(sentHeaders)
        const response = Object.assign(new Readable({ read() {} }), {
          statusCode: spec.statusCode,
          headers: spec.headers ?? {}
        })
        for (const cb of listeners.get('response') ?? []) {
          cb(response)
        }
        setTimeout(() => {
          for (const chunk of spec.chunks ?? []) {
            response.push(chunk)
          }
          // Why: fail on a later tick so pushed chunks flush to the file
          // stream first, mirroring a transfer that dies mid-body.
          setTimeout(() => {
            if (spec.failWith) {
              response.destroy(new Error(spec.failWith))
            } else {
              response.push(null)
            }
          }, 20)
        }, 20)
      })
      return request
    })
  }
  netRequestMock.mockImplementationOnce(() => request)
  return { sentHeaders }
}

const PAYLOAD = Buffer.from('0123456789abcdefghij')

describe('ModelManager download resume', () => {
  beforeEach(() => {
    netRequestMock.mockReset()
  })

  it('resumes an interrupted download with a Range request and assembles the full file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'orca-model-resume-'))
    try {
      scriptRequest(() => ({
        statusCode: 200,
        headers: { 'content-length': String(PAYLOAD.length) },
        chunks: [PAYLOAD.subarray(0, 10)],
        failWith: 'net::ERR_CONTENT_LENGTH_MISMATCH'
      }))
      const second = scriptRequest((sentHeaders) => {
        expect(sentHeaders.range).toBe('bytes=10-')
        return {
          statusCode: 206,
          headers: { 'content-length': String(PAYLOAD.length - 10) },
          chunks: [PAYLOAD.subarray(10)]
        }
      })
      const manager = new ModelManager(dir) as unknown as ModelManagerInternals
      const archivePath = join(dir, 'model.tar.bz2')

      await manager.downloadArchiveWithRetry(
        'https://example.com/model.tar.bz2',
        archivePath,
        PAYLOAD.length,
        'm',
        () => false,
        new AbortController().signal
      )

      expect(netRequestMock).toHaveBeenCalledTimes(2)
      expect(second.sentHeaders.range).toBe('bytes=10-')
      expect(readFileSync(archivePath)).toEqual(PAYLOAD)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('restarts from scratch when the server ignores the Range request', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'orca-model-resume-'))
    try {
      scriptRequest(() => ({
        statusCode: 200,
        headers: { 'content-length': String(PAYLOAD.length) },
        chunks: [PAYLOAD.subarray(0, 10)],
        failWith: 'net::ERR_CONNECTION_RESET'
      }))
      scriptRequest(() => ({
        statusCode: 200,
        headers: { 'content-length': String(PAYLOAD.length) },
        chunks: [PAYLOAD]
      }))
      const manager = new ModelManager(dir) as unknown as ModelManagerInternals
      const archivePath = join(dir, 'model.tar.bz2')

      await manager.downloadArchiveWithRetry(
        'https://example.com/model.tar.bz2',
        archivePath,
        PAYLOAD.length,
        'm',
        () => false,
        new AbortController().signal
      )

      expect(netRequestMock).toHaveBeenCalledTimes(2)
      expect(readFileSync(archivePath)).toEqual(PAYLOAD)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('does not retry non-transient failures', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'orca-model-resume-'))
    try {
      scriptRequest(() => ({ statusCode: 404 }))
      const manager = new ModelManager(dir) as unknown as ModelManagerInternals

      await expect(
        manager.downloadArchiveWithRetry(
          'https://example.com/model.tar.bz2',
          join(dir, 'model.tar.bz2'),
          PAYLOAD.length,
          'm',
          () => false,
          new AbortController().signal
        )
      ).rejects.toThrow('HTTP 404')

      expect(netRequestMock).toHaveBeenCalledTimes(1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('gives up after repeated zero-progress failures with a diagnosable error', async () => {
    vi.useFakeTimers()
    const dir = mkdtempSync(join(tmpdir(), 'orca-model-resume-'))
    try {
      for (let i = 0; i < 8; i++) {
        scriptRequest(() => ({
          statusCode: 200,
          headers: { 'content-length': String(PAYLOAD.length) },
          failWith: 'net::ERR_CONNECTION_RESET'
        }))
      }
      const manager = new ModelManager(dir) as unknown as ModelManagerInternals

      const download = manager.downloadArchiveWithRetry(
        'https://example.com/model.tar.bz2',
        join(dir, 'model.tar.bz2'),
        PAYLOAD.length,
        'm',
        () => false,
        new AbortController().signal
      )
      const outcome = download.then(
        () => 'resolved',
        (error: unknown) => (error instanceof Error ? error.message : String(error))
      )
      await vi.advanceTimersByTimeAsync(60_000)

      await expect(outcome).resolves.toMatch(
        /Model download interrupted at 0% \(0 of 20 bytes\) after 4 attempts: .*net::ERR_CONNECTION_RESET/
      )
      expect(netRequestMock).toHaveBeenCalledTimes(4)
    } finally {
      vi.useRealTimers()
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('stops retrying once the download is aborted', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'orca-model-resume-'))
    try {
      scriptRequest(() => ({
        statusCode: 200,
        headers: { 'content-length': String(PAYLOAD.length) },
        failWith: 'net::ERR_CONNECTION_RESET'
      }))
      const controller = new AbortController()
      const manager = new ModelManager(dir) as unknown as ModelManagerInternals

      const download = manager.downloadArchiveWithRetry(
        'https://example.com/model.tar.bz2',
        join(dir, 'model.tar.bz2'),
        PAYLOAD.length,
        'm',
        () => false,
        controller.signal
      )
      const outcome = download.then(
        () => 'resolved',
        (error: unknown) => (error instanceof Error ? error.message : String(error))
      )
      // Abort while the retry loop is in its first backoff sleep; the next
      // attempt must settle as Aborted without issuing another request.
      setTimeout(() => controller.abort(), 100)
      const message = await outcome

      expect(message).toBe('Aborted')
      expect(netRequestMock).toHaveBeenCalledTimes(1)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
