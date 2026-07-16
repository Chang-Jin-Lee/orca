import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import type * as NodeOs from 'node:os'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { CodexManagedTrustGrantPlan } from './codex-hook-trust-grant'
import {
  computeTrustKey,
  readHookTrustEntries,
  upsertHookTrustEntriesInContent,
  type CodexTrustEntry
} from './config-toml-trust'

const { homedirMock, grantMock } = vi.hoisted(() => ({
  homedirMock: vi.fn<() => string>(),
  grantMock: vi.fn()
}))

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof NodeOs>('node:os')
  return { ...actual, homedir: homedirMock }
})

vi.mock('./codex-hook-trust-grant', () => ({
  CODEX_TRUST_GRANT_TRANSIENT_RETRY_INTERVAL_MS: 300_000,
  grantManagedCodexHookTrust: grantMock
}))

import {
  ensureRealHomeCodexHookState,
  getRealHomeCodexHookLane,
  _internals
} from './codex-real-home-hook-install'
import { getCodexManagedHookInstallMaterial } from './hook-service'

let fakeHomeDir: string
let userDataDir: string
let previousUserDataPath: string | undefined

function getRealHooksJsonPath(): string {
  return join(fakeHomeDir, '.codex', 'hooks.json')
}

function getRealConfigTomlPath(): string {
  return join(fakeHomeDir, '.codex', 'config.toml')
}

function readRealHooksJson(): {
  hooks?: Record<string, { hooks?: { command?: string }[] }[]>
  [key: string]: unknown
} {
  return JSON.parse(readFileSync(getRealHooksJsonPath(), 'utf-8'))
}

function grantSucceeds(): void {
  grantMock.mockImplementation((plan: CodexManagedTrustGrantPlan) => ({
    lane: 'rpc',
    entries: plan.managedEntries.map((entry) => ({ ...entry, trustedHash: 'codex-hash' }))
  }))
}

function grantUnavailable(): void {
  grantMock.mockReturnValue({ lane: 'fallback', reason: 'unsupported' })
}

beforeEach(() => {
  grantMock.mockReset()
  fakeHomeDir = mkdtempSync(join(tmpdir(), 'orca-real-home-hooks-home-'))
  userDataDir = mkdtempSync(join(tmpdir(), 'orca-real-home-hooks-user-data-'))
  previousUserDataPath = process.env.ORCA_USER_DATA_PATH
  process.env.ORCA_USER_DATA_PATH = userDataDir
  homedirMock.mockReturnValue(fakeHomeDir)
  mkdirSync(join(fakeHomeDir, '.codex'), { recursive: true })
  _internals.setLaneForTesting('pending')
})

afterEach(() => {
  rmSync(fakeHomeDir, { recursive: true, force: true })
  rmSync(userDataDir, { recursive: true, force: true })
  if (previousUserDataPath === undefined) {
    delete process.env.ORCA_USER_DATA_PATH
  } else {
    process.env.ORCA_USER_DATA_PATH = previousUserDataPath
  }
  vi.clearAllMocks()
})

describe('ensureRealHomeCodexHookState (install)', () => {
  it('creates hooks.json with the Orca entry in every managed event for a fresh home', () => {
    grantSucceeds()

    const lane = ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })

    expect(lane).toBe('installed')
    const material = getCodexManagedHookInstallMaterial()
    const config = readRealHooksJson()
    for (const eventName of material.events) {
      const definitions = config.hooks?.[eventName]
      expect(definitions).toHaveLength(1)
      expect(definitions?.[0]?.hooks?.[0]?.command).toBe(material.command)
    }
    // The grant plan targeted the real home with append-position trust keys.
    const plan = grantMock.mock.calls[0]![0] as CodexManagedTrustGrantPlan
    expect(plan.runtimeHomePath).toBe(join(fakeHomeDir, '.codex'))
    expect(plan.host).toEqual({ kind: 'native' })
    expect(plan.managedEntries.every((entry) => entry.groupIndex === 0)).toBe(true)
  })

  it('appends LAST and preserves user entries, unknown fields, and trust positions', () => {
    grantSucceeds()
    const userConfig = {
      hooks: {
        Stop: [{ matcher: 'deploy-*', hooks: [{ type: 'command', command: 'my-stop-hook.sh' }] }],
        PreCompact: [{ hooks: [{ type: 'command', command: 'my-compact-hook.sh' }] }]
      },
      _pluginManagerMetadata: { owner: 'someone-else' }
    }
    writeFileSync(getRealHooksJsonPath(), `${JSON.stringify(userConfig, null, 2)}\n`, 'utf-8')

    const lane = ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })

    expect(lane).toBe('installed')
    const config = readRealHooksJson()
    // User's Stop entry keeps position 0; Orca's entry is appended after it.
    expect(config.hooks?.Stop).toHaveLength(2)
    expect(config.hooks?.Stop?.[0]).toEqual(userConfig.hooks.Stop[0])
    // Non-managed events Orca does not subscribe to stay untouched.
    expect(config.hooks?.PreCompact).toEqual(userConfig.hooks.PreCompact)
    // Unknown top-level metadata survives, unlike the managed-home writer.
    expect(config._pluginManagerMetadata).toEqual(userConfig._pluginManagerMetadata)
    // The appended entry's trust key uses its appended position.
    const plan = grantMock.mock.calls[0]![0] as CodexManagedTrustGrantPlan
    const stopEntry = plan.managedEntries.find((entry) => entry.eventLabel === 'stop')
    expect(stopEntry?.groupIndex).toBe(1)
    // Pristine pre-Orca backup lands under userData, not in ~/.codex.
    expect(
      readFileSync(join(userDataDir, 'codex-real-home-hooks', 'hooks.json.pre-orca'), 'utf-8')
    ).toBe(`${JSON.stringify(userConfig, null, 2)}\n`)
  })

  it('updates a symlinked hooks.json target without replacing the symlink', () => {
    grantSucceeds()
    const dotfilesDir = join(fakeHomeDir, 'dotfiles')
    const targetPath = join(dotfilesDir, 'hooks.json')
    mkdirSync(dotfilesDir, { recursive: true })
    writeFileSync(
      targetPath,
      `${JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'mine.sh' }] }] } }, null, 2)}\n`,
      'utf-8'
    )
    symlinkSync(targetPath, getRealHooksJsonPath())

    expect(ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })).toBe(
      'installed'
    )

    expect(lstatSync(getRealHooksJsonPath()).isSymbolicLink()).toBe(true)
    expect(JSON.parse(readFileSync(targetPath, 'utf-8')).hooks.Stop).toHaveLength(2)
  })

  it('keeps the managed lane and original bytes when the pristine backup cannot be created', () => {
    grantSucceeds()
    const original = `${JSON.stringify({ hooks: { Stop: [] } }, null, 2)}\n`
    writeFileSync(getRealHooksJsonPath(), original, 'utf-8')
    writeFileSync(join(userDataDir, 'codex-real-home-hooks'), 'blocks backup directory', 'utf-8')

    expect(ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })).toBe(
      'unavailable'
    )

    expect(readFileSync(getRealHooksJsonPath(), 'utf-8')).toBe(original)
    expect(grantMock).not.toHaveBeenCalled()
  })

  it.skipIf(process.platform === 'win32')('preserves restrictive hooks.json permissions', () => {
    grantSucceeds()
    writeFileSync(getRealHooksJsonPath(), '{ "hooks": {} }\n', 'utf-8')
    chmodSync(getRealHooksJsonPath(), 0o600)

    expect(ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })).toBe(
      'installed'
    )

    expect(statSync(getRealHooksJsonPath()).mode & 0o777).toBe(0o600)
  })

  it.skipIf(process.platform === 'win32')(
    'restores restrictive hooks.json permissions after grant fallback',
    () => {
      grantUnavailable()
      writeFileSync(getRealHooksJsonPath(), '{ "hooks": {} }\n', 'utf-8')
      chmodSync(getRealHooksJsonPath(), 0o600)

      expect(ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })).toBe(
        'unavailable'
      )

      expect(statSync(getRealHooksJsonPath()).mode & 0o777).toBe(0o600)
    }
  )

  it('rolls the file back byte-exactly when the grant lane is unavailable', () => {
    grantUnavailable()
    const userRaw = `${JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: 'command', command: 'mine.sh' }] }] } }, null, 2)}\n`
    writeFileSync(getRealHooksJsonPath(), userRaw, 'utf-8')

    const lane = ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })

    expect(lane).toBe('unavailable')
    expect(getRealHomeCodexHookLane()).toBe('unavailable')
    expect(readFileSync(getRealHooksJsonPath(), 'utf-8')).toBe(userRaw)
  })

  it('removes a freshly created hooks.json when the grant lane is unavailable', () => {
    grantUnavailable()

    const lane = ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })

    expect(lane).toBe('unavailable')
    expect(existsSync(getRealHooksJsonPath())).toBe(false)
  })

  it('does no hook-file or grant work on repeated unsupported launches', () => {
    grantUnavailable()
    expect(ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })).toBe(
      'unavailable'
    )
    expect(existsSync(getRealHooksJsonPath())).toBe(false)

    expect(ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })).toBe(
      'unavailable'
    )

    expect(grantMock).toHaveBeenCalledTimes(1)
    expect(existsSync(getRealHooksJsonPath())).toBe(false)
  })

  it('leaves an unparseable hooks.json untouched and keeps the managed lane', () => {
    writeFileSync(getRealHooksJsonPath(), '{not json', 'utf-8')

    const lane = ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })

    expect(lane).toBe('unavailable')
    expect(readFileSync(getRealHooksJsonPath(), 'utf-8')).toBe('{not json')
    expect(grantMock).not.toHaveBeenCalled()
  })

  it('is idempotent: a second ensure keeps a single appended entry per event', () => {
    grantSucceeds()
    ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })
    const firstRaw = readFileSync(getRealHooksJsonPath(), 'utf-8')

    const lane = ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })

    expect(lane).toBe('installed')
    expect(readFileSync(getRealHooksJsonPath(), 'utf-8')).toBe(firstRaw)
  })

  it('keeps later user hook trust positions stable when reconciling an existing install', () => {
    grantSucceeds()
    const userBefore = { hooks: [{ type: 'command', command: 'before.sh' }] }
    writeFileSync(
      getRealHooksJsonPath(),
      `${JSON.stringify({ hooks: { Stop: [userBefore] } }, null, 2)}\n`,
      'utf-8'
    )
    ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })
    const installed = readRealHooksJson()
    const userAfter = { hooks: [{ type: 'command', command: 'after.sh' }] }
    installed.hooks!.Stop!.push(userAfter)
    writeFileSync(getRealHooksJsonPath(), `${JSON.stringify(installed, null, 2)}\n`, 'utf-8')

    expect(ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })).toBe(
      'installed'
    )

    const reconciled = readRealHooksJson().hooks?.Stop
    expect(reconciled?.[0]).toEqual(userBefore)
    expect(reconciled?.[2]).toEqual(userAfter)
    const plan = grantMock.mock.calls.at(-1)![0] as CodexManagedTrustGrantPlan
    expect(plan.managedEntries.find((entry) => entry.eventLabel === 'stop')?.groupIndex).toBe(1)
  })

  it("keeps later user handler trust positions stable inside Orca's hook group", () => {
    grantSucceeds()
    ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })
    const installed = readRealHooksJson()
    const userAfter = { type: 'command', command: 'after.sh' }
    installed.hooks!.Stop![0]!.hooks!.push(userAfter)
    writeFileSync(getRealHooksJsonPath(), `${JSON.stringify(installed, null, 2)}\n`, 'utf-8')

    expect(ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })).toBe(
      'installed'
    )

    expect(readRealHooksJson().hooks?.Stop?.[0]?.hooks?.[1]).toEqual(userAfter)
    const plan = grantMock.mock.calls.at(-1)![0] as CodexManagedTrustGrantPlan
    const stopEntry = plan.managedEntries.find((entry) => entry.eventLabel === 'stop')
    expect(stopEntry).toMatchObject({ groupIndex: 0, handlerIndex: 0 })
  })
})

describe('ensureRealHomeCodexHookState (opt-out sweep)', () => {
  it('removes only Orca entries and reports the removed lane', () => {
    grantSucceeds()
    const userStop = {
      matcher: 'deploy-*',
      hooks: [{ type: 'command', command: 'my-stop-hook.sh' }]
    }
    writeFileSync(
      getRealHooksJsonPath(),
      `${JSON.stringify({ hooks: { Stop: [userStop] } }, null, 2)}\n`,
      'utf-8'
    )
    ensureRealHomeCodexHookState({ hooksEnabled: true, userDataPath: userDataDir })
    expect(readRealHooksJson().hooks?.Stop).toHaveLength(2)

    const lane = ensureRealHomeCodexHookState({ hooksEnabled: false, userDataPath: userDataDir })

    expect(lane).toBe('removed')
    const config = readRealHooksJson()
    expect(config.hooks?.Stop).toEqual([userStop])
    const material = getCodexManagedHookInstallMaterial()
    for (const eventName of material.events) {
      if (eventName === 'Stop') {
        continue
      }
      expect(config.hooks?.[eventName]).toBeUndefined()
    }
  })

  it('no-ops the sweep when the real home has no hooks.json', () => {
    const lane = ensureRealHomeCodexHookState({ hooksEnabled: false, userDataPath: userDataDir })

    expect(lane).toBe('removed')
    expect(existsSync(getRealHooksJsonPath())).toBe(false)
  })

  it('removes only hash-proven Orca trust from a mixed hook group', () => {
    const material = getCodexManagedHookInstallMaterial()
    const userCommand = 'my-user-hook.sh'
    writeFileSync(
      getRealHooksJsonPath(),
      `${JSON.stringify(
        {
          hooks: {
            Stop: [
              {
                hooks: [
                  { type: 'command', command: userCommand },
                  { type: 'command', command: material.command, timeout: 10 }
                ]
              }
            ]
          }
        },
        null,
        2
      )}\n`,
      'utf-8'
    )
    const entries: CodexTrustEntry[] = [
      {
        sourcePath: getRealHooksJsonPath(),
        eventLabel: 'stop',
        groupIndex: 0,
        handlerIndex: 0,
        command: userCommand
      },
      {
        sourcePath: getRealHooksJsonPath(),
        eventLabel: 'stop',
        groupIndex: 0,
        handlerIndex: 1,
        command: material.command,
        timeoutSec: 10
      }
    ]
    writeFileSync(getRealConfigTomlPath(), upsertHookTrustEntriesInContent('', entries), 'utf-8')

    expect(ensureRealHomeCodexHookState({ hooksEnabled: false, userDataPath: userDataDir })).toBe(
      'removed'
    )

    expect(readRealHooksJson().hooks?.Stop).toEqual([
      { hooks: [{ type: 'command', command: userCommand }] }
    ])
    const trust = readHookTrustEntries(getRealConfigTomlPath())
    expect(trust.has(computeTrustKey(entries[0]!))).toBe(true)
    expect(trust.has(computeTrustKey(entries[1]!))).toBe(false)
  })
})
