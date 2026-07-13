import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getWslCliRegistrationCandidates,
  invalidateWslCliRegistrationRegistry,
  recordWslCliRegistrationObservations,
  recordWslCliRegistrationRemoved
} from './wsl-cli-registration-registry'

describe('WSL CLI registration registry', () => {
  let userDataPath: string

  beforeEach(async () => {
    userDataPath = await mkdtemp(join(tmpdir(), 'orca-wsl-cli-registry-'))
  })

  afterEach(async () => {
    await rm(userDataPath, { recursive: true, force: true })
  })

  it('discovers each distro once while continuing to reconcile managed registrations', async () => {
    await expect(
      getWslCliRegistrationCandidates(userDataPath, ['Ubuntu', 'Debian'])
    ).resolves.toEqual(['Ubuntu', 'Debian'])

    await recordWslCliRegistrationObservations(userDataPath, [
      { distro: 'Ubuntu', inspected: true, managed: false },
      { distro: 'Debian', inspected: true, managed: true }
    ])

    await expect(
      getWslCliRegistrationCandidates(userDataPath, ['ubuntu', 'Debian', 'Fedora'])
    ).resolves.toEqual(['Debian', 'Fedora'])
    const state = JSON.parse(
      await readFile(join(userDataPath, 'wsl-cli-registrations.json'), 'utf8')
    ) as Record<string, unknown>
    expect(state).toMatchObject({
      schemaVersion: 2,
      registeredDistros: ['Debian'],
      inspectedDistros: ['Ubuntu', 'Debian'],
      inspectionTimes: {
        ubuntu: expect.any(Number),
        debian: expect.any(Number)
      }
    })
  })

  it('serializes concurrent registry updates without losing a distro', async () => {
    const updates = Promise.all([
      recordWslCliRegistrationObservations(userDataPath, [
        { distro: 'Ubuntu', inspected: true, managed: true }
      ]),
      recordWslCliRegistrationObservations(userDataPath, [
        { distro: 'Debian', inspected: true, managed: true }
      ])
    ])

    // Reads join the write queue, so startup cannot observe a half-updated registry.
    await expect(
      getWslCliRegistrationCandidates(userDataPath, ['Ubuntu', 'Debian'])
    ).resolves.toEqual(['Ubuntu', 'Debian'])
    await updates
    const state = JSON.parse(
      await readFile(join(userDataPath, 'wsl-cli-registrations.json'), 'utf8')
    ) as { registeredDistros: string[] }
    expect(state.registeredDistros).toEqual(['Ubuntu', 'Debian'])
  })

  it('rediscovers available distros when the registry is corrupt', async () => {
    await mkdir(userDataPath, { recursive: true })
    await writeFile(join(userDataPath, 'wsl-cli-registrations.json'), '{broken', 'utf8')

    await expect(
      getWslCliRegistrationCandidates(userDataPath, ['Ubuntu', 'Debian'])
    ).resolves.toEqual(['Ubuntu', 'Debian'])
  })

  it('stops reconciling a registration removed through Settings', async () => {
    await recordWslCliRegistrationObservations(userDataPath, [
      { distro: 'Ubuntu', inspected: true, managed: true }
    ])
    await recordWslCliRegistrationRemoved(userDataPath, 'ubuntu')

    await expect(getWslCliRegistrationCandidates(userDataPath, ['Ubuntu'])).resolves.toEqual([])
  })

  it('periodically re-inspects a negative entry so restored distros are discovered', async () => {
    await recordWslCliRegistrationObservations(
      userDataPath,
      [{ distro: 'Ubuntu', inspected: true, managed: false }],
      { now: 1_000 }
    )

    await expect(
      getWslCliRegistrationCandidates(userDataPath, ['Ubuntu'], {
        now: 1_001,
        negativeInspectionTtlMs: 10_000
      })
    ).resolves.toEqual([])
    await expect(
      getWslCliRegistrationCandidates(userDataPath, ['Ubuntu'], {
        now: 11_001,
        negativeInspectionTtlMs: 10_000
      })
    ).resolves.toEqual(['Ubuntu'])
  })

  it('rediscovers negative entries after the system clock moves backward', async () => {
    await recordWslCliRegistrationObservations(
      userDataPath,
      [{ distro: 'Ubuntu', inspected: true, managed: false }],
      { now: 100_000 }
    )

    await expect(
      getWslCliRegistrationCandidates(userDataPath, ['Ubuntu'], {
        now: 1_000,
        negativeInspectionTtlMs: 10_000
      })
    ).resolves.toEqual(['Ubuntu'])
  })

  it('safely rediscovers schema-v1 negative entries with no inspection time', async () => {
    await writeFile(
      join(userDataPath, 'wsl-cli-registrations.json'),
      JSON.stringify({
        schemaVersion: 1,
        registeredDistros: ['Debian'],
        inspectedDistros: ['Ubuntu', 'Debian']
      }),
      'utf8'
    )

    await expect(
      getWslCliRegistrationCandidates(userDataPath, ['Ubuntu', 'Debian'], {
        now: 1,
        negativeInspectionTtlMs: 1_000_000
      })
    ).resolves.toEqual(['Ubuntu', 'Debian'])
  })

  it('serializes invalidation before a newer registry update', async () => {
    await recordWslCliRegistrationObservations(userDataPath, [
      { distro: 'Ubuntu', inspected: true, managed: true }
    ])
    let releaseRemoval!: () => void
    let removalStarted!: () => void
    const started = new Promise<void>((resolve) => {
      removalStarted = resolve
    })
    const invalidation = invalidateWslCliRegistrationRegistry(userDataPath, {
      removeFile: async (filePath, options) => {
        removalStarted()
        await new Promise<void>((resolve) => {
          releaseRemoval = resolve
        })
        await rm(filePath, options)
      }
    })
    await started

    let updateSettled = false
    const update = recordWslCliRegistrationObservations(userDataPath, [
      { distro: 'Debian', inspected: true, managed: true }
    ]).then(() => {
      updateSettled = true
    })
    await Promise.resolve()
    expect(updateSettled).toBe(false)

    releaseRemoval()
    await Promise.all([invalidation, update])
    const state = JSON.parse(
      await readFile(join(userDataPath, 'wsl-cli-registrations.json'), 'utf8')
    ) as { registeredDistros: string[] }
    expect(state.registeredDistros).toEqual(['Debian'])
  })
})
