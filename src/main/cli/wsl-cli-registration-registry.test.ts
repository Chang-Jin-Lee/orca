import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  getWslCliRegistrationCandidates,
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
    await expect(
      readFile(join(userDataPath, 'wsl-cli-registrations.json'), 'utf8').then(JSON.parse)
    ).resolves.toEqual({
      schemaVersion: 1,
      registeredDistros: ['Debian'],
      inspectedDistros: ['Ubuntu', 'Debian']
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
})
