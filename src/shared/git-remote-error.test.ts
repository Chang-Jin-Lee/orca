import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  formatSubmodulePushFailureDetail,
  isNoUpstreamError,
  normalizeGitErrorMessage
} from './git-remote-error'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('normalizeGitErrorMessage', () => {
  it('keeps the submodule name when a recursive push is rejected', () => {
    const error = new Error(
      "Command failed: git push\nPushing submodule 'find-cmux-followers'\n" +
        'To https://github.com/stablyai/orca-internal\n' +
        ' ! [rejected]        master -> master (fetch first)\n' +
        "Unable to push submodule 'find-cmux-followers'\n" +
        'fatal: failed to push all needed submodules'
    )

    expect(normalizeGitErrorMessage(error, 'push')).toBe(
      "Submodule 'find-cmux-followers' has remote changes. Pull inside the submodule, then try again."
    )
  })

  it('explains how to configure a pull policy for divergent branches', () => {
    const error = new Error(
      'Command failed: git pull\n' +
        'hint: You have divergent branches and need to specify how to reconcile them.\n' +
        'fatal: Need to specify how to reconcile divergent branches.'
    )

    expect(normalizeGitErrorMessage(error, 'pull')).toBe(
      'Pull needs a Git pull policy for divergent branches. Configure one for this repository ' +
        'or host, then try again: git config pull.rebase false (merge), ' +
        'git config pull.rebase true (rebase), or git config pull.ff only (fast-forward only).'
    )
  })

  it('uses the tail diagnostic from newline-heavy failures without line-array splitting', () => {
    const splitSpy = vi.spyOn(String.prototype, 'split')
    const error = new Error(
      `Command failed: git fetch\r\n${'remote: progress update\r\n'.repeat(10_000)}remote side closed connection\r\n`
    )

    expect(normalizeGitErrorMessage(error, 'fetch')).toBe('remote side closed connection')

    const usedLineSplit = splitSpy.mock.calls.some(
      ([separator]) =>
        (typeof separator === 'string' && separator === '\n') ||
        (separator instanceof RegExp && separator.source === '\\r?\\n')
    )
    expect(usedLineSplit).toBe(false)
  })

  it('includes the rejected target and branch-specific remote config for push rejections', () => {
    const error = new Error(
      'Command failed: git push\n' +
        ' ! [rejected]        HEAD -> fix/cold-start-hides-local-repos (fetch first)\n'
    )

    expect(
      normalizeGitErrorMessage(error, 'push', {
        remote: 'https://github.com/omarshahine/orca.git',
        branchName: 'fix/cold-start-hides-local-repos',
        remoteUrl: 'https://github.com/omarshahine/orca.git',
        currentBranch: 'fix/cold-start-hides-local-repos',
        branchPushRemote: 'https://github.com/omarshahine/orca.git',
        branchRemote: 'https://github.com/omarshahine/orca.git',
        originUrl: 'https://github.com/stablyai/orca.git'
      })
    ).toBe(
      'Push rejected: remote has newer commits (non-fast-forward). ' +
        'Target: https://github.com/omarshahine/orca.git -> fix/cold-start-hides-local-repos. ' +
        'Branch config: branch.fix/cold-start-hides-local-repos.pushRemote=https://github.com/omarshahine/orca.git; ' +
        'branch.fix/cold-start-hides-local-repos.remote=https://github.com/omarshahine/orca.git. ' +
        'This differs from origin (https://github.com/stablyai/orca.git). ' +
        'Pull or sync only if this is the intended target; otherwise change the branch remote/pushRemote or publish to the intended remote, then try again.'
    )
  })

  it('scrubs credentials from push target diagnostics', () => {
    const error = new Error('Command failed: git push\n ! [rejected] HEAD -> feature (fetch first)')

    const message = normalizeGitErrorMessage(error, 'push', {
      remote: 'origin',
      branchName: 'feature',
      remoteUrl: 'https://token:secret@example.com/repo.git',
      currentBranch: 'feature',
      branchPushRemote: 'https://token:secret@example.com/repo.git',
      originUrl: 'https://user:password@example.com/base.git'
    })

    expect(message).toContain('https://example.com/repo.git')
    expect(message).toContain('https://example.com/base.git')
    expect(message).not.toContain('secret')
    expect(message).not.toContain('password')
  })
})

describe('formatSubmodulePushFailureDetail', () => {
  it('keeps normalized guidance when transport layers prefix the error', () => {
    expect(
      formatSubmodulePushFailureDetail(
        "Error invoking remote method 'git:push': Error: Submodule 'vendor/tools' has remote changes. Pull inside the submodule, then try again."
      )
    ).toBe(
      "Submodule 'vendor/tools' has remote changes. Pull inside the submodule, then try again."
    )
  })

  it('falls back to submodule-specific guidance when git omits the nested reason', () => {
    expect(
      formatSubmodulePushFailureDetail(
        "Unable to push submodule 'vendor/tools'\nfatal: failed to push all needed submodules"
      )
    ).toBe(
      "Submodule 'vendor/tools' could not be pushed. Resolve the submodule push error, then try again."
    )
  })

  it('checks newline-heavy output without full CRLF normalization', () => {
    const replaceSpy = vi.spyOn(String.prototype, 'replace')
    const message = `${'remote: progress\r\n'.repeat(10_000)}Unable to push submodule 'vendor/tools'\r\nfatal: failed to push all needed submodules\r\n`

    expect(formatSubmodulePushFailureDetail(message)).toBe(
      "Submodule 'vendor/tools' could not be pushed. Resolve the submodule push error, then try again."
    )

    const usedCrlfReplace = replaceSpy.mock.calls.some(
      ([pattern]) => pattern instanceof RegExp && pattern.source === '\\r\\n'
    )
    expect(usedCrlfReplace).toBe(false)
  })
})

describe('isNoUpstreamError', () => {
  it('treats a missing HEAD@{u} tracking ref as no upstream', () => {
    const error = new Error(
      "fatal: ambiguous argument 'HEAD@{u}': unknown revision or path not in the working tree.\n" +
        "Use '--' to separate paths from revisions, like this:\n" +
        "'git <command> [<revision>...] -- [<file>...]'"
    )

    expect(isNoUpstreamError(error)).toBe(true)
  })

  it('does not treat unrelated ambiguous refs as no upstream', () => {
    const error = new Error(
      "fatal: ambiguous argument 'feature': unknown revision or path not in the working tree."
    )

    expect(isNoUpstreamError(error)).toBe(false)
  })
})
