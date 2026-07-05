import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  handlers,
  appExitMock,
  appRelaunchMock,
  destroySystemTrayMock,
  createLocalOrcaProfileMock,
  getOrcaProfileListStateMock,
  setActiveOrcaProfileMock,
  transferOrcaProfileProjectMock
} = vi.hoisted(() => ({
  handlers: new Map<string, (_event: unknown, args?: unknown) => unknown>(),
  appExitMock: vi.fn(),
  appRelaunchMock: vi.fn(),
  destroySystemTrayMock: vi.fn(),
  createLocalOrcaProfileMock: vi.fn(),
  getOrcaProfileListStateMock: vi.fn(),
  setActiveOrcaProfileMock: vi.fn(),
  transferOrcaProfileProjectMock: vi.fn()
}))

vi.mock('electron', () => ({
  app: {
    exit: appExitMock,
    relaunch: appRelaunchMock,
    getPath: () => '/tmp/orca-user-data'
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (_event: unknown, args?: unknown) => unknown) => {
      handlers.set(channel, handler)
    })
  }
}))

vi.mock('../tray/system-tray', () => ({
  destroySystemTray: destroySystemTrayMock
}))

vi.mock('../orca-profiles/profile-index-store', () => ({
  createLocalOrcaProfile: createLocalOrcaProfileMock,
  getOrcaProfileListState: getOrcaProfileListStateMock,
  setActiveOrcaProfile: setActiveOrcaProfileMock
}))

vi.mock('../orca-profiles/profile-project-transfer', () => ({
  transferOrcaProfileProject: transferOrcaProfileProjectMock
}))

import { registerOrcaProfileHandlers } from './orca-profiles'

describe('registerOrcaProfileHandlers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    handlers.clear()
    appExitMock.mockReset()
    appRelaunchMock.mockReset()
    destroySystemTrayMock.mockReset()
    createLocalOrcaProfileMock.mockReset()
    getOrcaProfileListStateMock.mockReset()
    setActiveOrcaProfileMock.mockReset()
    transferOrcaProfileProjectMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('registers list and create handlers', async () => {
    const listState = {
      activeProfileId: 'local-default',
      profiles: [{ id: 'local-default', name: 'Personal' }]
    }
    const createState = {
      ...listState,
      profile: { id: 'local-work', name: 'Work' }
    }
    getOrcaProfileListStateMock.mockReturnValue(listState)
    createLocalOrcaProfileMock.mockReturnValue(createState)

    registerOrcaProfileHandlers({ flush: vi.fn() } as never)

    await expect(Promise.resolve(handlers.get('orcaProfiles:list')?.(null))).resolves.toBe(
      listState
    )
    await expect(
      Promise.resolve(handlers.get('orcaProfiles:createLocal')?.(null, { name: 'Work' }))
    ).resolves.toBe(createState)
    expect(createLocalOrcaProfileMock).toHaveBeenCalledWith({ name: 'Work' })
  })

  it('marks the target profile active, flushes, and relaunches', async () => {
    const flush = vi.fn()
    const onBeforeRelaunch = vi.fn()
    getOrcaProfileListStateMock.mockReturnValue({
      activeProfileId: 'local-default',
      profiles: []
    })
    setActiveOrcaProfileMock.mockReturnValue({
      activeProfileId: 'local-work',
      profiles: []
    })
    registerOrcaProfileHandlers({ flush } as never, { onBeforeRelaunch })

    const resultPromise = Promise.resolve(
      handlers.get('orcaProfiles:switch')?.(null, { profileId: 'local-work' })
    )

    await expect(resultPromise).resolves.toEqual({ status: 'relaunching' })
    expect(setActiveOrcaProfileMock).toHaveBeenCalledWith('local-work')
    expect(flush).toHaveBeenCalledOnce()
    expect(onBeforeRelaunch).toHaveBeenCalledOnce()
    expect(flush.mock.invocationCallOrder[0]).toBeLessThan(
      setActiveOrcaProfileMock.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY
    )
    expect(appRelaunchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(150)

    expect(destroySystemTrayMock).toHaveBeenCalledOnce()
    expect(appRelaunchMock).toHaveBeenCalledOnce()
    expect(appExitMock).toHaveBeenCalledWith(0)
  })

  it('does not mark a profile active when current profile flush fails', async () => {
    const flush = vi.fn(() => {
      throw new Error('flush_failed')
    })
    getOrcaProfileListStateMock.mockReturnValue({
      activeProfileId: 'local-default',
      profiles: []
    })
    registerOrcaProfileHandlers({ flush } as never)

    await expect(
      Promise.resolve(handlers.get('orcaProfiles:switch')?.(null, { profileId: 'local-work' }))
    ).rejects.toThrow('flush_failed')

    expect(setActiveOrcaProfileMock).not.toHaveBeenCalled()
    expect(appRelaunchMock).not.toHaveBeenCalled()
  })

  it('does not relaunch when switching to the active profile', async () => {
    getOrcaProfileListStateMock.mockReturnValue({
      activeProfileId: 'local-default',
      profiles: []
    })
    registerOrcaProfileHandlers({ flush: vi.fn() } as never)

    await expect(
      Promise.resolve(handlers.get('orcaProfiles:switch')?.(null, { profileId: 'local-default' }))
    ).resolves.toEqual({ status: 'already-active' })

    expect(setActiveOrcaProfileMock).not.toHaveBeenCalled()
    expect(appRelaunchMock).not.toHaveBeenCalled()
  })

  it('rejects invalid profile ids', async () => {
    registerOrcaProfileHandlers({ flush: vi.fn() } as never)

    await expect(
      Promise.resolve(handlers.get('orcaProfiles:switch')?.(null, { profileId: ' ' }))
    ).rejects.toThrow('invalid_orca_profile_id')
  })

  it('transfers projects between inactive profiles after flushing active state', async () => {
    const flush = vi.fn()
    const result = {
      status: 'transferred',
      mode: 'copy',
      sourceProfileId: 'personal',
      targetProfileId: 'work',
      sourceRepoId: 'repo-1',
      targetRepoId: 'repo-2',
      targetProjectId: 'repo:repo-2'
    }
    getOrcaProfileListStateMock.mockReturnValue({
      activeProfileId: 'personal',
      profiles: []
    })
    transferOrcaProfileProjectMock.mockReturnValue(result)
    registerOrcaProfileHandlers({ flush } as never)

    await expect(
      Promise.resolve(
        handlers.get('orcaProfiles:transferProject')?.(null, {
          sourceProfileId: ' personal ',
          targetProfileId: ' work ',
          repoId: ' repo-1 ',
          mode: 'copy'
        })
      )
    ).resolves.toBe(result)

    expect(flush).toHaveBeenCalledOnce()
    expect(transferOrcaProfileProjectMock).toHaveBeenCalledWith(
      {
        sourceProfileId: 'personal',
        targetProfileId: 'work',
        repoId: 'repo-1',
        mode: 'copy'
      },
      '/tmp/orca-user-data'
    )
  })

  it('moves a project out of the active profile and relaunches into the target profile', async () => {
    const flush = vi.fn()
    const onBeforeRelaunch = vi.fn()
    const result = {
      status: 'transferred',
      mode: 'move',
      sourceProfileId: 'personal',
      targetProfileId: 'work',
      sourceRepoId: 'repo-1',
      targetRepoId: 'repo-1',
      targetProjectId: 'repo:repo-1'
    }
    getOrcaProfileListStateMock.mockReturnValue({
      activeProfileId: 'personal',
      profiles: []
    })
    transferOrcaProfileProjectMock.mockReturnValue(result)
    registerOrcaProfileHandlers({ flush } as never, { onBeforeRelaunch })

    await expect(
      Promise.resolve(
        handlers.get('orcaProfiles:transferProject')?.(null, {
          sourceProfileId: 'personal',
          targetProfileId: 'work',
          repoId: 'repo-1',
          mode: 'move'
        })
      )
    ).resolves.toEqual({ ...result, willRelaunch: true })

    expect(onBeforeRelaunch).toHaveBeenCalledOnce()
    expect(flush).toHaveBeenCalledOnce()
    expect(transferOrcaProfileProjectMock).toHaveBeenCalledWith(
      {
        sourceProfileId: 'personal',
        targetProfileId: 'work',
        repoId: 'repo-1',
        mode: 'move'
      },
      '/tmp/orca-user-data'
    )
    expect(setActiveOrcaProfileMock).toHaveBeenCalledWith('work')
    expect(appRelaunchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(150)

    expect(destroySystemTrayMock).toHaveBeenCalledOnce()
    expect(appRelaunchMock).toHaveBeenCalledOnce()
    expect(appExitMock).toHaveBeenCalledWith(0)
  })

  it('rejects transfers that would mutate the active target profile offline', async () => {
    getOrcaProfileListStateMock.mockReturnValue({
      activeProfileId: 'work',
      profiles: []
    })
    registerOrcaProfileHandlers({ flush: vi.fn() } as never)

    await expect(
      Promise.resolve(
        handlers.get('orcaProfiles:transferProject')?.(null, {
          sourceProfileId: 'personal',
          targetProfileId: 'work',
          repoId: 'repo-1',
          mode: 'copy'
        })
      )
    ).rejects.toThrow('active_target_orca_profile_transfer_requires_relaunch')

    expect(transferOrcaProfileProjectMock).not.toHaveBeenCalled()
  })
})
