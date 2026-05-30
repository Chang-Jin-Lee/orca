import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { GitExec } from './git-handler-ops'
import { getStatusOp } from './git-handler-status-ops'

function modifiedStatusLine(path: string): string {
  return `1 .M N... 100644 100644 100644 aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb ${path}`
}

describe('getStatusOp', () => {
  it('preserves very large status result sets from the SSH relay', async () => {
    const fileCount = 130_000
    const stdout = Array.from({ length: fileCount }, (_, index) =>
      modifiedStatusLine(`src/generated/file-${index}.ts`)
    ).join('\n')
    const git = vi.fn<GitExec>(async (args) => {
      if (args.includes('status')) {
        return { stdout, stderr: '' }
      }
      return { stdout: '', stderr: '' }
    })

    const result = await getStatusOp(git, {
      worktreePath: join(tmpdir(), 'orca-relay-status-large')
    })

    expect(result.entries).toHaveLength(fileCount)
    expect(result.entries.at(-1)).toMatchObject({
      path: 'src/generated/file-129999.ts',
      status: 'modified',
      area: 'unstaged'
    })
  })
})
