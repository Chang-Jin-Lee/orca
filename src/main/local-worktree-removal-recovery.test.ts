import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  gitExecFileAsyncMock,
  listWorktreesStrictMock,
  removeLocalWorktreePathMock,
  removeWorktreeMock
} = vi.hoisted(() => ({
  gitExecFileAsyncMock: vi.fn(),
  listWorktreesStrictMock: vi.fn(),
  removeLocalWorktreePathMock: vi.fn(),
  removeWorktreeMock: vi.fn()
}))

vi.mock('./git/runner', () => ({
  gitExecFileAsync: gitExecFileAsyncMock
}))

vi.mock('./local-worktree-filesystem', () => ({
  removeLocalWorktreePath: removeLocalWorktreePathMock
}))

vi.mock('./git/worktree', () => ({
  listWorktreesStrict: listWorktreesStrictMock,
  removeWorktree: removeWorktreeMock
}))

import {
  recoverLocalWindowsWorktreeRemoval,
  removeStaleLocalWorktreeRegistrationAfterFilesystemRemoval
} from './local-worktree-removal-recovery'

async function withPlatform<T>(platform: NodeJS.Platform, fn: () => Promise<T>): Promise<T> {
  const original = process.platform
  Object.defineProperty(process, 'platform', { configurable: true, value: platform })
  try {
    return await fn()
  } finally {
    Object.defineProperty(process, 'platform', { configurable: true, value: original })
  }
}

describe('recoverLocalWindowsWorktreeRemoval', () => {
  beforeEach(() => {
    gitExecFileAsyncMock.mockReset()
    listWorktreesStrictMock.mockReset()
    removeLocalWorktreePathMock.mockReset()
    removeWorktreeMock.mockReset()
    gitExecFileAsyncMock.mockResolvedValue({ stdout: '', stderr: '' })
    listWorktreesStrictMock.mockResolvedValue([])
    removeLocalWorktreePathMock.mockResolvedValue(undefined)
    removeWorktreeMock.mockResolvedValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('recovers Git for Windows partial filesystem deletion failures', async () => {
    await withPlatform('win32', async () => {
      const error = Object.assign(new Error('git worktree remove failed'), {
        stderr: "error: failed to delete 'C:/repo/worktree/delete-e2e-held-cwd': Permission denied"
      })

      const result = await recoverLocalWindowsWorktreeRemoval({
        error,
        force: true,
        canonicalWorktreePath: 'C:/repo/worktree/delete-e2e-held-cwd',
        repoPath: 'C:/repo',
        localWorktreeGitOptions: {},
        registeredWorktree: { branch: 'refs/heads/delete-e2e-held-cwd', head: 'abc123' },
        deleteBranch: true,
        overrideLock: false,
        closeWatcher: vi.fn().mockResolvedValue(undefined)
      })

      expect(removeLocalWorktreePathMock).toHaveBeenCalledWith(
        'C:/repo/worktree/delete-e2e-held-cwd',
        {}
      )
      expect(gitExecFileAsyncMock).toHaveBeenCalledWith(['worktree', 'prune'], {
        cwd: 'C:/repo'
      })
      expect(result).toEqual({
        preservedBranch: {
          branchName: 'delete-e2e-held-cwd',
          head: 'abc123'
        }
      })
    })
  })

  it('finishes a clean non-force deletion after Git leaves a Windows directory behind', async () => {
    await withPlatform('win32', async () => {
      const error = Object.assign(new Error('git worktree remove failed'), {
        stderr:
          "error: failed to delete 'C:/repo/worktree/delete-e2e-held-cwd': Directory not empty"
      })

      const result = await recoverLocalWindowsWorktreeRemoval({
        error,
        force: false,
        canonicalWorktreePath: 'C:/repo/worktree/delete-e2e-held-cwd',
        repoPath: 'C:/repo',
        localWorktreeGitOptions: {},
        registeredWorktree: { branch: 'refs/heads/delete-e2e-held-cwd', head: 'abc123' },
        deleteBranch: true,
        overrideLock: false,
        closeWatcher: vi.fn().mockResolvedValue(undefined)
      })

      expect(removeLocalWorktreePathMock).toHaveBeenCalledWith(
        'C:/repo/worktree/delete-e2e-held-cwd',
        {}
      )
      expect(gitExecFileAsyncMock).toHaveBeenCalledWith(['worktree', 'prune'], {
        cwd: 'C:/repo'
      })
      expect(result).toEqual({
        preservedBranch: {
          branchName: 'delete-e2e-held-cwd',
          head: 'abc123'
        }
      })
    })
  })

  it('recovers localized Windows failures after Git already removed the registration', async () => {
    await withPlatform('win32', async () => {
      const result = await recoverLocalWindowsWorktreeRemoval({
        error: Object.assign(new Error('git worktree remove failed'), {
          stderr: "Fehler: 'C:/repo/worktree/feature' konnte nicht gelöscht werden"
        }),
        force: false,
        canonicalWorktreePath: 'C:/repo/worktree/feature',
        repoPath: 'C:/repo',
        localWorktreeGitOptions: {},
        registeredWorktree: { branch: 'refs/heads/feature', head: 'abc123' },
        deleteBranch: false,
        overrideLock: false,
        closeWatcher: vi.fn().mockResolvedValue(undefined)
      })

      expect(removeLocalWorktreePathMock).toHaveBeenCalledWith('C:/repo/worktree/feature', {})
      expect(result).toEqual({})
    })
  })

  it('does not recover unrelated localized failures while Git still owns the row', async () => {
    await withPlatform('win32', async () => {
      listWorktreesStrictMock.mockResolvedValue([
        {
          path: 'C:/repo/worktree/feature',
          head: 'abc123',
          branch: 'refs/heads/feature',
          isBare: false,
          isMainWorktree: false
        }
      ])

      await expect(
        recoverLocalWindowsWorktreeRemoval({
          error: Object.assign(new Error('git worktree remove failed'), {
            stderr: 'Fehler: unerwarteter Git-Zustand'
          }),
          force: false,
          canonicalWorktreePath: 'C:/repo/worktree/feature',
          repoPath: 'C:/repo',
          localWorktreeGitOptions: {},
          registeredWorktree: { branch: 'refs/heads/feature', head: 'abc123' },
          deleteBranch: false,
          overrideLock: false,
          closeWatcher: vi.fn().mockResolvedValue(undefined)
        })
      ).resolves.toBeUndefined()
      expect(removeLocalWorktreePathMock).not.toHaveBeenCalled()
    })
  })

  it('does not recover partial filesystem deletion wording off Windows', async () => {
    await withPlatform('linux', async () => {
      const error = Object.assign(new Error('git worktree remove failed'), {
        stderr: "error: failed to delete 'C:/repo/worktree/delete-e2e-held-cwd': Permission denied"
      })

      await expect(
        recoverLocalWindowsWorktreeRemoval({
          error,
          force: true,
          canonicalWorktreePath: 'C:/repo/worktree/delete-e2e-held-cwd',
          repoPath: 'C:/repo',
          localWorktreeGitOptions: {},
          registeredWorktree: { branch: 'refs/heads/delete-e2e-held-cwd', head: 'abc123' },
          deleteBranch: true,
          overrideLock: false,
          closeWatcher: vi.fn().mockResolvedValue(undefined)
        })
      ).resolves.toBeUndefined()
      expect(removeLocalWorktreePathMock).not.toHaveBeenCalled()
    })
  })

  it('uses explicit lock override when long-path cleanup leaves a locked registration', async () => {
    await withPlatform('win32', async () => {
      const registeredWorktree = {
        branch: 'refs/heads/feature',
        head: 'abc123',
        locked: true,
        lockReason: 'active agent'
      }

      await recoverLocalWindowsWorktreeRemoval({
        error: Object.assign(new Error('git worktree remove failed'), {
          stderr: 'error: failed to delete deep/file.txt: Filename too long'
        }),
        force: true,
        canonicalWorktreePath: 'C:/workspaces/feature',
        repoPath: 'C:/repo',
        localWorktreeGitOptions: {},
        registeredWorktree,
        deleteBranch: true,
        overrideLock: true,
        closeWatcher: vi.fn().mockResolvedValue(undefined)
      })

      expect(removeWorktreeMock).toHaveBeenCalledWith(
        'C:/repo',
        'C:/workspaces/feature',
        true,
        expect.objectContaining({
          overrideLock: true,
          knownRemovedWorktree: registeredWorktree
        })
      )
    })
  })
})

describe('removeStaleLocalWorktreeRegistrationAfterFilesystemRemoval', () => {
  beforeEach(() => {
    gitExecFileAsyncMock.mockReset()
    listWorktreesStrictMock.mockReset()
    removeWorktreeMock.mockReset()
    gitExecFileAsyncMock.mockResolvedValue({ stdout: '', stderr: '' })
    listWorktreesStrictMock.mockResolvedValue([])
    removeWorktreeMock.mockResolvedValue({})
  })

  it('uses explicit double-force removal for a locked missing registration', async () => {
    const registeredWorktree = {
      branch: 'refs/heads/feature',
      head: 'abc123',
      locked: true,
      lockReason: 'active agent'
    }

    await removeStaleLocalWorktreeRegistrationAfterFilesystemRemoval({
      canonicalWorktreePath: 'C:/workspaces/feature',
      repoPath: 'C:/repo',
      localWorktreeGitOptions: {},
      registeredWorktree,
      deleteBranch: false,
      overrideLock: true
    })

    expect(gitExecFileAsyncMock).not.toHaveBeenCalledWith(['worktree', 'prune'], expect.anything())
    expect(removeWorktreeMock).toHaveBeenCalledWith('C:/repo', 'C:/workspaces/feature', true, {
      deleteBranch: false,
      overrideLock: true,
      knownRemovedWorktree: registeredWorktree
    })
    expect(listWorktreesStrictMock).toHaveBeenCalledWith('C:/repo', {})
  })

  it('does not override a locked missing registration without explicit permission', async () => {
    await expect(
      removeStaleLocalWorktreeRegistrationAfterFilesystemRemoval({
        canonicalWorktreePath: 'C:/workspaces/feature',
        repoPath: 'C:/repo',
        localWorktreeGitOptions: {},
        registeredWorktree: {
          branch: 'refs/heads/feature',
          head: 'abc123',
          locked: true,
          lockReason: 'active agent'
        },
        deleteBranch: true,
        overrideLock: false
      })
    ).rejects.toThrow('Worktree is locked by Git')

    expect(removeWorktreeMock).not.toHaveBeenCalled()
    expect(gitExecFileAsyncMock).not.toHaveBeenCalled()
  })

  it('does not report success when prune leaves the registration behind', async () => {
    listWorktreesStrictMock.mockResolvedValue([
      {
        path: 'C:/workspaces/feature',
        head: 'abc123',
        branch: 'refs/heads/feature',
        isBare: false,
        isMainWorktree: false
      }
    ])

    await expect(
      removeStaleLocalWorktreeRegistrationAfterFilesystemRemoval({
        canonicalWorktreePath: 'C:/workspaces/feature',
        repoPath: 'C:/repo',
        localWorktreeGitOptions: {},
        registeredWorktree: { branch: 'refs/heads/feature', head: 'abc123' },
        deleteBranch: true,
        overrideLock: false
      })
    ).rejects.toThrow('Git still has stale worktree registration')
  })
})
