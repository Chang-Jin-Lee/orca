import type { CliInstallState } from '../../shared/cli-install-types'
import { listWslDistrosAsync } from '../wsl'
import { CliInstaller } from './cli-installer'
import {
  getWslCliRegistrationCandidates,
  recordWslCliRegistrationObservations,
  type WslCliRegistrationObservation
} from './wsl-cli-registration-registry'
import { WslCliInstaller } from './wsl-cli-installer'
import { runSerializedWslCliRegistrationOperation } from './wsl-cli-registration-operation'

type ManagedWslCliInstaller = {
  repairManagedRegistration: () => Promise<{
    changed: boolean
    managed: boolean
    status: { state: CliInstallState }
  }>
}

type WslCliRegistrationRegistry = {
  getCandidates: (availableDistros: string[]) => Promise<string[]>
  recordObservations: (observations: WslCliRegistrationObservation[]) => Promise<void>
}

type WslCliRegistrationReconciliationOptions = {
  platform?: NodeJS.Platform
  isPackaged: boolean
  userDataPath: string
  listDistros?: () => Promise<string[]>
  createInstaller?: (distro: string) => ManagedWslCliInstaller
  registry?: WslCliRegistrationRegistry
}

export type WslCliRegistrationReconciliationResult =
  | {
      distro: string
      outcome: 'repaired' | 'unchanged'
      state: CliInstallState
      managed: boolean
    }
  | {
      distro: string
      outcome: 'failed'
      error: string
    }

export async function reconcileManagedWslCliRegistrations(
  options: WslCliRegistrationReconciliationOptions
): Promise<WslCliRegistrationReconciliationResult[]> {
  const platform = options.platform ?? process.platform
  if (platform !== 'win32' || !options.isPackaged) {
    return []
  }

  const registry =
    options.registry ??
    ({
      getCandidates: (availableDistros) =>
        getWslCliRegistrationCandidates(options.userDataPath, availableDistros),
      recordObservations: (observations) =>
        recordWslCliRegistrationObservations(options.userDataPath, observations)
    } satisfies WslCliRegistrationRegistry)
  const availableDistros = await (options.listDistros ?? listWslDistrosAsync)()
  const distros = await registry.getCandidates(availableDistros)
  if (distros.length === 0) {
    return []
  }

  let createInstaller = options.createInstaller
  if (!createInstaller) {
    const hostInstaller = new CliInstaller()
    let hostStatus: ReturnType<CliInstaller['getStatus']> | null = null
    // Why: every distro must target this app install; share one Windows PATH /
    // launcher probe instead of spawning a PowerShell probe per distro.
    createInstaller = (distro: string) =>
      new WslCliInstaller({
        distro,
        hostInstaller: {
          getStatus: () => (hostStatus ??= hostInstaller.getStatus())
        }
      })
  }

  // Why: one unavailable distro must not prevent a managed registration in
  // another distro from receiving the current launcher and bridge contract.
  const results = await Promise.all(
    distros.map((distro) =>
      runSerializedWslCliRegistrationOperation(
        distro,
        async (): Promise<WslCliRegistrationReconciliationResult> => {
          try {
            const repair = await createInstaller(distro).repairManagedRegistration()
            const result = {
              distro,
              outcome: repair.changed ? ('repaired' as const) : ('unchanged' as const),
              state: repair.status.state,
              managed: repair.managed
            }
            // Why: ownership metadata must commit before a concurrent Settings
            // operation can mutate this distro, or stale startup state can win.
            await registry.recordObservations([
              {
                distro,
                inspected: result.state !== 'unsupported',
                managed: result.managed
              }
            ])
            return result
          } catch (error) {
            return {
              distro,
              outcome: 'failed',
              error: error instanceof Error ? error.message : String(error)
            }
          }
        }
      )
    )
  )
  return results
}
