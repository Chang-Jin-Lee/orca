import { mkdtempSync } from 'fs'
import * as fs from 'fs/promises'
import { tmpdir } from 'os'
import * as path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GitExec } from './git-handler-ops'
import { clearNoEffectiveUpstreamStatusCache } from './git-status-upstream-negative-cache'
import { getStatusOp } from './git-handler-status-ops'

const LARGE_STATUS_ENTRY_COUNT = 150_000

function buildLargeStatusOutput(count: number): string {
  const lines: string[] = []
  for (let index = 0; index < count; index += 1) {
    lines.push(`1 A. N... 100644 100644 100644 000000 111111 generated-${index}.txt`)
  }
  return lines.join('\n')
}

describe('getStatusOp', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'relay-git-status-'))
    clearNoEffectiveUpstreamStatusCache()
  })

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
    clearNoEffectiveUpstreamStatusCache()
  })

  it('truncates huge status lists at the limit and flags didHitLimit', async () => {
    const statusOutput = buildLargeStatusOutput(LARGE_STATUS_ENTRY_COUNT)
    const git = vi.fn<GitExec>(async (args) => {
      if (args.includes('status')) {
        return { stdout: statusOutput, stderr: '' }
      }
      if (args.includes('diff')) {
        return { stdout: '', stderr: '' }
      }
      throw new Error(`Unexpected git command: ${args.join(' ')}`)
    })

    const result = await getStatusOp(git, { worktreePath: tmpDir, limit: 10_000 })

    expect(result.didHitLimit).toBe(true)
    expect(result.statusLength).toBe(LARGE_STATUS_ENTRY_COUNT)
    expect(result.entries).toHaveLength(10_000)
    expect(result.entries[0]).toEqual({
      path: 'generated-0.txt',
      status: 'added',
      area: 'staged'
    })
    // numstat (diff) must be skipped when the limit was hit.
    expect(git.mock.calls.some(([args]) => args.includes('diff'))).toBe(false)
  })

  it('returns the full list and no limit flag when under the limit', async () => {
    const statusOutput = buildLargeStatusOutput(5)
    const git = vi.fn<GitExec>(async (args) => {
      if (args.includes('status')) {
        return { stdout: statusOutput, stderr: '' }
      }
      if (args.includes('diff')) {
        return { stdout: '', stderr: '' }
      }
      throw new Error(`Unexpected git command: ${args.join(' ')}`)
    })

    const result = await getStatusOp(git, { worktreePath: tmpDir, limit: 10_000 })

    expect(result.didHitLimit).toBeUndefined()
    expect(result.entries).toHaveLength(5)
  })

  it('does not repeat failed effective-upstream probes for a branch with no upstream', async () => {
    const git = vi.fn<GitExec>(async (args) => {
      if (args.includes('status')) {
        return {
          stdout: '# branch.oid abcdef1234567890\n# branch.head Initi-Project\n',
          stderr: ''
        }
      }
      if (args[0] === 'symbolic-ref' && args.includes('HEAD')) {
        return { stdout: 'Initi-Project\n', stderr: '' }
      }
      if (args[0] === 'rev-parse' && args.includes('HEAD@{u}')) {
        throw new Error("fatal: no upstream configured for branch 'Initi-Project'")
      }
      if (args[0] === 'config' && args.some((arg) => arg.startsWith('branch.Initi-Project.'))) {
        throw new Error('missing branch config')
      }
      if (args[0] === 'config' && args.includes('remote.pushDefault')) {
        throw new Error('missing pushDefault')
      }
      if (args[0] === 'rev-parse' && args.includes('refs/remotes/origin/Initi-Project')) {
        throw new Error('missing remote branch')
      }
      throw new Error(`Unexpected git command: ${args.join(' ')}`)
    })

    await getStatusOp(git, { worktreePath: tmpDir })
    await getStatusOp(git, { worktreePath: tmpDir })
    await getStatusOp(git, { worktreePath: tmpDir })

    const upstreamProbeCalls = git.mock.calls.filter(([args]) => {
      return args[0] === 'rev-parse' && args.includes('HEAD@{u}')
    })
    const sameNameOriginProbeCalls = git.mock.calls.filter(([args]) => {
      return args[0] === 'rev-parse' && args.includes('refs/remotes/origin/Initi-Project')
    })

    expect(upstreamProbeCalls).toHaveLength(1)
    expect(sameNameOriginProbeCalls).toHaveLength(1)
  })

  it('coalesces concurrent failed effective-upstream probes for a branch with no upstream', async () => {
    const git = vi.fn<GitExec>(async (args) => {
      if (args.includes('status')) {
        return {
          stdout: '# branch.oid abcdef1234567890\n# branch.head Initi-Project\n',
          stderr: ''
        }
      }
      if (args[0] === 'symbolic-ref' && args.includes('HEAD')) {
        return { stdout: 'Initi-Project\n', stderr: '' }
      }
      if (args[0] === 'rev-parse' && args.includes('HEAD@{u}')) {
        await Promise.resolve()
        throw new Error("fatal: no upstream configured for branch 'Initi-Project'")
      }
      if (args[0] === 'config' && args.some((arg) => arg.startsWith('branch.Initi-Project.'))) {
        await Promise.resolve()
        throw new Error('missing branch config')
      }
      if (args[0] === 'config' && args.includes('remote.pushDefault')) {
        await Promise.resolve()
        throw new Error('missing pushDefault')
      }
      if (args[0] === 'rev-parse' && args.includes('refs/remotes/origin/Initi-Project')) {
        await Promise.resolve()
        throw new Error('missing remote branch')
      }
      throw new Error(`Unexpected git command: ${args.join(' ')}`)
    })

    await Promise.all([
      getStatusOp(git, { worktreePath: tmpDir }),
      getStatusOp(git, { worktreePath: tmpDir }),
      getStatusOp(git, { worktreePath: tmpDir })
    ])

    const upstreamProbeCalls = git.mock.calls.filter(([args]) => {
      return args[0] === 'rev-parse' && args.includes('HEAD@{u}')
    })
    const sameNameOriginProbeCalls = git.mock.calls.filter(([args]) => {
      return args[0] === 'rev-parse' && args.includes('refs/remotes/origin/Initi-Project')
    })

    expect(upstreamProbeCalls).toHaveLength(1)
    expect(sameNameOriginProbeCalls).toHaveLength(1)
  })
})
