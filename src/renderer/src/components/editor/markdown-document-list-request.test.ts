import { describe, expect, it, vi } from 'vitest'
import type { MarkdownDocument } from '../../../../shared/types'
import type { RuntimeFileOperationArgs } from '@/runtime/runtime-file-client'
import {
  getMarkdownDocumentListRequestKey,
  requestSharedMarkdownDocumentList
} from './markdown-document-list-request'

function context(overrides: Partial<RuntimeFileOperationArgs> = {}): RuntimeFileOperationArgs {
  return {
    settings: { activeRuntimeEnvironmentId: null },
    worktreeId: 'worktree-1',
    worktreePath: '/repo',
    ...overrides
  }
}

function deferred<T>(): {
  promise: Promise<T>
  reject: (error: Error) => void
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

describe('shared Markdown document list requests', () => {
  it('collapses concurrent pane scans and releases the result after settlement', async () => {
    const pending = deferred<MarkdownDocument[]>()
    const load = vi.fn(() => pending.promise)
    const requests = Array.from({ length: 200 }, () =>
      requestSharedMarkdownDocumentList(context(), '/repo', load)
    )

    expect(load).toHaveBeenCalledTimes(1)
    expect(new Set(requests).size).toBe(1)

    const documents = [{ filePath: '/repo/README.md', relativePath: 'README.md' }]
    pending.resolve(documents as MarkdownDocument[])
    await expect(Promise.all(requests)).resolves.toEqual(
      Array.from({ length: 200 }, () => documents)
    )

    const nextDocuments = [{ filePath: '/repo/notes.md', relativePath: 'notes.md' }]
    load.mockResolvedValueOnce(nextDocuments as MarkdownDocument[])
    await expect(requestSharedMarkdownDocumentList(context(), '/repo', load)).resolves.toBe(
      nextDocuments
    )
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('keeps runtime routes isolated and encodes unusual paths losslessly', () => {
    const local = context()
    const ssh = context({ connectionId: 'ssh-1' })
    const runtime = context({ settings: { activeRuntimeEnvironmentId: ' runtime-1 ' } })
    const unusualRoot = '/repo\nwith-newline'

    expect(getMarkdownDocumentListRequestKey(local, unusualRoot)).not.toBe(
      getMarkdownDocumentListRequestKey(ssh, unusualRoot)
    )
    expect(getMarkdownDocumentListRequestKey(ssh, unusualRoot)).not.toBe(
      getMarkdownDocumentListRequestKey(runtime, unusualRoot)
    )
    expect(JSON.parse(getMarkdownDocumentListRequestKey(local, unusualRoot)).at(-1)).toBe(
      unusualRoot
    )
  })

  it('clears rejected requests so a retry can run', async () => {
    const failure = deferred<MarkdownDocument[]>()
    const load = vi.fn(() => failure.promise)
    const first = requestSharedMarkdownDocumentList(context(), '/retry', load)
    const second = requestSharedMarkdownDocumentList(context(), '/retry', load)

    failure.reject(new Error('offline'))
    await expect(first).rejects.toThrow('offline')
    await expect(second).rejects.toThrow('offline')

    load.mockResolvedValueOnce([])
    await expect(requestSharedMarkdownDocumentList(context(), '/retry', load)).resolves.toEqual([])
    expect(load).toHaveBeenCalledTimes(2)
  })
})
