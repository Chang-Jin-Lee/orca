import { describe, expect, it, vi } from 'vitest'
import { forceDeleteWorkspaceFromSpace } from './workspace-space-force-delete'

describe('forceDeleteWorkspaceFromSpace', () => {
  it('passes lock override only for an explicitly locked row', async () => {
    const removeWorktree = vi.fn().mockResolvedValue({ ok: true })

    await forceDeleteWorkspaceFromSpace(removeWorktree, 'locked-worktree', 'locked')
    await forceDeleteWorkspaceFromSpace(removeWorktree, 'dirty-worktree', 'dirty')

    expect(removeWorktree).toHaveBeenNthCalledWith(1, 'locked-worktree', true, {
      overrideLock: true
    })
    expect(removeWorktree).toHaveBeenNthCalledWith(2, 'dirty-worktree', true, undefined)
  })

  it.each(['orphan-directory', 'missing-registration'] as const)(
    'keeps %s recovery on ordinary force semantics',
    async (reason) => {
      const removeWorktree = vi.fn().mockResolvedValue({ ok: true })

      await forceDeleteWorkspaceFromSpace(removeWorktree, 'worktree', reason)

      expect(removeWorktree).toHaveBeenCalledWith('worktree', true, undefined)
    }
  )
})
