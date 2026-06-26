import { afterEach, describe, expect, it, vi } from 'vitest'

import { resolveRemoteOperationErrorMessage } from './source-control-remote-error'

describe('source-control remote error formatting', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prefers fatal detail over an earlier remote detail for publish failures', () => {
    const error = new Error('remote: protected branch\r\nfatal: Authentication failed\r\n')

    expect(resolveRemoteOperationErrorMessage(error, { publish: true })).toBe(
      'Publish Branch failed. Authentication failed. Check your remote access and try again.'
    )
  })

  it('extracts publish details from newline-heavy output without full line-array splitting', () => {
    const splitSpy = vi.spyOn(String.prototype, 'split')
    const replaceSpy = vi.spyOn(String.prototype, 'replace')
    const progress = 'remote: Enumerating objects\r\n'.repeat(10_000)
    const error = new Error(
      `${progress}fatal: unable to access https://token:secret@example.com/repo.git\r\n`
    )

    const result = resolveRemoteOperationErrorMessage(error, { publish: true })

    expect(result).toContain('Publish Branch failed. unable to access https://example.com/repo.git')
    const usedLineSplit = splitSpy.mock.calls.some(([separator]) => {
      if (typeof separator === 'string') {
        return separator === '\n'
      }
      return separator instanceof RegExp && separator.source === '\\r?\\n'
    })
    const usedCrlfReplace = replaceSpy.mock.calls.some(
      ([pattern]) => pattern instanceof RegExp && pattern.source === '\\r\\n'
    )
    expect(usedLineSplit).toBe(false)
    expect(usedCrlfReplace).toBe(false)
  })

  it('preserves detailed push target context for publish non-fast-forward errors', () => {
    const detailed =
      'Push rejected: remote has newer commits (non-fast-forward). ' +
      'Target: fork (https://gitlab.example.com/team/project.git) -> feature/fix. ' +
      'Branch config: branch.feature/fix.pushRemote=fork; branch.feature/fix.remote=fork. ' +
      'This differs from origin (https://gitlab.example.com/upstream/project.git). ' +
      'Pull or sync only if this is the intended target; otherwise change the branch remote/pushRemote or publish to the intended remote, then try again.'
    const error = new Error(`Error invoking remote method 'git:push': Error: ${detailed}`)

    expect(resolveRemoteOperationErrorMessage(error, { publish: true })).toBe(detailed)
  })
})
