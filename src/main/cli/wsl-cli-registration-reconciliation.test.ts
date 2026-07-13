import { describe, expect, it, vi } from 'vitest'
import { reconcileManagedWslCliRegistrations } from './wsl-cli-registration-reconciliation'
import { runSerializedWslCliRegistrationOperation } from './wsl-cli-registration-operation'

describe('reconcileManagedWslCliRegistrations', () => {
  it('repairs known and newly discovered registrations, then records ownership', async () => {
    const registry = {
      getCandidates: vi.fn(async () => ['Ubuntu', 'Debian']),
      recordObservations: vi.fn(async () => undefined)
    }
    const repairUbuntu = vi.fn(async () => ({
      changed: true,
      managed: true,
      status: { state: 'installed' as const }
    }))
    const repairDebian = vi.fn(async () => ({
      changed: false,
      managed: false,
      status: { state: 'not_installed' as const }
    }))

    const results = await reconcileManagedWslCliRegistrations({
      platform: 'win32',
      isPackaged: true,
      userDataPath: '/user-data',
      listDistros: async () => ['Ubuntu', 'Debian', 'Fedora'],
      registry,
      createInstaller: (distro) => {
        if (distro === 'Ubuntu') {
          return { repairManagedRegistration: repairUbuntu }
        }
        return { repairManagedRegistration: repairDebian }
      }
    })

    expect(registry.getCandidates).toHaveBeenCalledWith(['Ubuntu', 'Debian', 'Fedora'])
    expect(registry.recordObservations).toHaveBeenCalledTimes(2)
    expect(registry.recordObservations).toHaveBeenCalledWith([
      { distro: 'Ubuntu', inspected: true, managed: true }
    ])
    expect(registry.recordObservations).toHaveBeenCalledWith([
      { distro: 'Debian', inspected: true, managed: false }
    ])
    expect(results).toEqual([
      { distro: 'Ubuntu', outcome: 'repaired', state: 'installed', managed: true },
      { distro: 'Debian', outcome: 'unchanged', state: 'not_installed', managed: false }
    ])
  })

  it('does not mark failed or unsupported distros as inspected', async () => {
    const registry = {
      getCandidates: vi.fn(async () => ['Broken Distro', 'No Interop']),
      recordObservations: vi.fn(async () => undefined)
    }

    const results = await reconcileManagedWslCliRegistrations({
      platform: 'win32',
      isPackaged: true,
      userDataPath: '/user-data',
      listDistros: async () => ['Broken Distro', 'No Interop'],
      registry,
      createInstaller: (distro) => ({
        repairManagedRegistration: async () => {
          if (distro === 'Broken Distro') {
            throw new Error('WSL interop failed')
          }
          return {
            changed: false,
            managed: false,
            status: { state: 'unsupported' as const }
          }
        }
      })
    })

    expect(results).toEqual([
      { distro: 'Broken Distro', outcome: 'failed', error: 'WSL interop failed' },
      { distro: 'No Interop', outcome: 'unchanged', state: 'unsupported', managed: false }
    ])
    expect(registry.recordObservations).toHaveBeenCalledWith([
      { distro: 'No Interop', inspected: false, managed: false }
    ])
  })

  it.each([
    { platform: 'darwin' as const, isPackaged: true },
    { platform: 'linux' as const, isPackaged: true },
    { platform: 'win32' as const, isPackaged: false }
  ])('does not inspect local, SSH, or development hosts for $platform', async (host) => {
    const listDistros = vi.fn(async () => ['Ubuntu'])

    await expect(
      reconcileManagedWslCliRegistrations({
        ...host,
        userDataPath: '/user-data',
        listDistros
      })
    ).resolves.toEqual([])
    expect(listDistros).not.toHaveBeenCalled()
  })

  it('lets a Settings removal win over a late startup repair for the same distro', async () => {
    const events: string[] = []
    let repairStarted!: () => void
    let finishRepair!: () => void
    const started = new Promise<void>((resolve) => {
      repairStarted = resolve
    })
    const registry = {
      getCandidates: vi.fn(async () => ['Ubuntu']),
      recordObservations: vi.fn(async () => {
        events.push('repair-observed')
      })
    }
    const reconciliation = reconcileManagedWslCliRegistrations({
      platform: 'win32',
      isPackaged: true,
      userDataPath: '/user-data',
      listDistros: async () => ['Ubuntu'],
      registry,
      createInstaller: () => ({
        repairManagedRegistration: async () => {
          events.push('repair-started')
          repairStarted()
          await new Promise<void>((resolve) => {
            finishRepair = resolve
          })
          events.push('repair-finished')
          return {
            changed: true,
            managed: true,
            status: { state: 'installed' as const }
          }
        }
      })
    })
    await started

    const removal = runSerializedWslCliRegistrationOperation('ubuntu', async () => {
      events.push('settings-remove')
    })
    await Promise.resolve()
    expect(events).toEqual(['repair-started'])

    finishRepair()
    await Promise.all([reconciliation, removal])
    expect(events).toEqual([
      'repair-started',
      'repair-finished',
      'repair-observed',
      'settings-remove'
    ])
  })
})
