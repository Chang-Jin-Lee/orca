import { describe, expect, it } from 'vitest'

import { createSshRelayArtifactTestManifest } from './ssh-relay-artifact-test-manifest'
import { parseSshRelayArtifactManifest } from './ssh-relay-artifact-schema'
import { selectSshRelayArtifact } from './ssh-relay-artifact-selector'
import { computeSshRelayRuntimeContentId } from './ssh-relay-runtime-identity'
import { sshRelayRuntimeArchiveName } from './ssh-relay-release-asset'

const compatibleLinuxHost = {
  os: 'linux' as const,
  architecture: 'x64' as const,
  processTranslated: false,
  kernelVersion: '6.8.0',
  libc: { family: 'glibc' as const, version: '2.39' },
  libstdcxxVersion: '6.0.33',
  glibcxxVersion: '3.4.33'
}

function windowsManifest({
  architecture = 'x64',
  minimumBuild = architecture === 'x64' ? 19045 : 26100
}: {
  architecture?: 'x64' | 'arm64'
  minimumBuild?: number
} = {}) {
  const manifest = createSshRelayArtifactTestManifest()
  const tuple = structuredClone(manifest.tuples[0]) as unknown as Record<string, unknown>
  Object.assign(tuple, {
    tupleId: `win32-${architecture}`,
    os: 'win32',
    architecture,
    compatibility: {
      kind: 'windows',
      minimumBuild,
      minimumOpenSshVersion: '8.1p1',
      minimumPowerShellVersion: '5.1',
      minimumDotNetFrameworkRelease: 528040
    }
  })
  manifest.tuples = [tuple as never]
  return manifest
}

const compatibleWindowsHost = {
  os: 'win32' as const,
  architecture: 'x64' as const,
  processTranslated: false,
  build: 19045,
  openSshVersion: '8.1p1',
  powerShellVersion: '5.1',
  dotNetFrameworkRelease: 528040
}

describe('SSH relay artifact selector', () => {
  it('selects the single compatible glibc tuple', () => {
    const result = selectSshRelayArtifact(createSshRelayArtifactTestManifest(), compatibleLinuxHost)

    expect(result).toMatchObject({ kind: 'selected', tupleId: 'linux-x64-glibc' })
  })

  it('accepts every Linux compatibility value at its exact minimum', () => {
    expect(
      selectSshRelayArtifact(createSshRelayArtifactTestManifest(), {
        ...compatibleLinuxHost,
        kernelVersion: '4.18',
        libc: { family: 'glibc', version: '2.28' },
        libstdcxxVersion: '6.0.25',
        glibcxxVersion: '3.4.25'
      }).kind
    ).toBe('selected')
  })

  it('selects the detected libc family when both Linux variants exist', () => {
    const manifest = createSshRelayArtifactTestManifest()
    const musl = structuredClone(manifest.tuples[0])
    musl.tupleId = 'linux-x64-musl'
    musl.compatibility = {
      kind: 'linux',
      minimumKernelVersion: '4.18',
      libc: {
        family: 'musl',
        minimumVersion: '1.2.5',
        minimumLibstdcxxVersion: null,
        minimumGlibcxxVersion: null
      }
    }
    for (const entry of musl.entries) {
      entry.path = entry.path.replace('watcher-linux-x64-glibc', 'watcher-linux-x64-musl')
    }
    for (const attestation of musl.nativeVerification.files) {
      attestation.path = attestation.path.replace(
        'watcher-linux-x64-glibc',
        'watcher-linux-x64-musl'
      )
    }
    musl.contentId = computeSshRelayRuntimeContentId(musl)
    musl.archive.name = sshRelayRuntimeArchiveName(musl.tupleId, musl.contentId)
    manifest.tuples.push(musl)
    const parsed = parseSshRelayArtifactManifest(manifest)

    expect(selectSshRelayArtifact(parsed, compatibleLinuxHost)).toMatchObject({
      kind: 'selected',
      tupleId: 'linux-x64-glibc'
    })
    expect(
      selectSshRelayArtifact(parsed, {
        ...compatibleLinuxHost,
        libc: { family: 'musl', version: '1.2.5' }
      })
    ).toMatchObject({ kind: 'selected', tupleId: 'linux-x64-musl' })
  })

  it.each([
    [{ ...compatibleLinuxHost, kernelVersion: '4.17' }, 'kernel-too-old'],
    [
      { ...compatibleLinuxHost, libc: { family: 'glibc' as const, version: '2.27' } },
      'libc-too-old'
    ],
    [{ ...compatibleLinuxHost, glibcxxVersion: '3.4.24' }, 'libstdcxx-too-old'],
    [{ ...compatibleLinuxHost, libstdcxxVersion: undefined }, 'unknown-libstdcxx'],
    [{ ...compatibleLinuxHost, kernelVersion: 'not-a-version' }, 'unknown-kernel'],
    [{ ...compatibleLinuxHost, libc: { family: 'unknown' as const } }, 'unknown-libc'],
    [
      { ...compatibleLinuxHost, libc: { family: 'musl' as const, version: '1.2.5' } },
      'tuple-unavailable'
    ],
    [{ ...compatibleLinuxHost, processTranslated: true }, 'translated-process'],
    [{ ...compatibleLinuxHost, architecture: 'arm64' as const }, 'tuple-unavailable']
  ])('selects legacy for incompatible or unknown host evidence', (host, reason) => {
    expect(selectSshRelayArtifact(createSshRelayArtifactTestManifest(), host)).toEqual({
      kind: 'legacy',
      reason
    })
  })

  it('checks Windows bootstrap versions before selection', () => {
    const manifest = windowsManifest()
    expect(selectSshRelayArtifact(manifest, compatibleWindowsHost).kind).toBe('selected')
    expect(selectSshRelayArtifact(manifest, { ...compatibleWindowsHost, build: 19044 })).toEqual({
      kind: 'legacy',
      reason: 'os-too-old'
    })
    expect(
      selectSshRelayArtifact(manifest, {
        ...compatibleWindowsHost,
        openSshVersion: '8.0p1'
      })
    ).toEqual({ kind: 'legacy', reason: 'openssh-too-old' })
    expect(
      selectSshRelayArtifact(manifest, {
        ...compatibleWindowsHost,
        powerShellVersion: '5.0'
      })
    ).toEqual({ kind: 'legacy', reason: 'powershell-too-old' })
    expect(
      selectSshRelayArtifact(manifest, {
        ...compatibleWindowsHost,
        dotNetFrameworkRelease: 528039
      })
    ).toEqual({ kind: 'legacy', reason: 'dotnet-too-old' })
  })

  it.each([
    ['x64', 19044, 19045],
    ['arm64', 26099, 26100]
  ] as const)(
    'enforces the reviewed Windows %s build boundary',
    (architecture, rejectedBuild, acceptedBuild) => {
      const manifest = windowsManifest({ architecture })
      const host = { ...compatibleWindowsHost, architecture }

      expect(selectSshRelayArtifact(manifest, { ...host, build: rejectedBuild })).toEqual({
        kind: 'legacy',
        reason: 'os-too-old'
      })
      expect(selectSshRelayArtifact(manifest, { ...host, build: acceptedBuild }).kind).toBe(
        'selected'
      )
    }
  )

  it('selects legacy when Windows bootstrap evidence is absent or malformed', () => {
    const manifest = windowsManifest()
    expect(
      selectSshRelayArtifact(manifest, { ...compatibleWindowsHost, openSshVersion: '8.1.0' })
    ).toEqual({ kind: 'legacy', reason: 'unknown-openssh' })
    expect(
      selectSshRelayArtifact(manifest, { ...compatibleWindowsHost, powerShellVersion: undefined })
    ).toEqual({ kind: 'legacy', reason: 'unknown-powershell' })
    expect(
      selectSshRelayArtifact(manifest, {
        ...compatibleWindowsHost,
        dotNetFrameworkRelease: undefined
      })
    ).toEqual({ kind: 'legacy', reason: 'unknown-dotnet' })
  })

  it('checks the minimum macOS version before selection', () => {
    const manifest = createSshRelayArtifactTestManifest()
    const tuple = structuredClone(manifest.tuples[0]) as unknown as Record<string, unknown>
    Object.assign(tuple, {
      tupleId: 'darwin-arm64',
      os: 'darwin',
      architecture: 'arm64',
      compatibility: { kind: 'darwin', minimumVersion: '13.5' }
    })
    manifest.tuples = [tuple as never]

    expect(
      selectSshRelayArtifact(manifest, {
        os: 'darwin',
        architecture: 'arm64',
        processTranslated: false,
        version: '13.4'
      })
    ).toEqual({ kind: 'legacy', reason: 'os-too-old' })
  })
})
