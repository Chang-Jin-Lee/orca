import { describe, expect, it } from 'vitest'

import {
  assertSshRelayRuntimeToolchain,
  collectSshRelayRuntimeToolchain,
  selectSshRelayRuntimeToolVersion,
  sshRelayRuntimeBuilderIdentity,
  sshRelayRuntimeRunnerIdentity
} from './ssh-relay-runtime-toolchain.mjs'

const commit = 'a'.repeat(40)

describe('SSH relay runtime build provenance', () => {
  it('selects the real Windows compiler version instead of its stdout usage line', () => {
    expect(
      selectSshRelayRuntimeToolVersion(
        {
          stdout: 'usage: cl [ option... ] filename... [ /link linkoption... ]',
          stderr: [
            'Microsoft (R) C/C++ Optimizing Compiler Version 19.44.35228 for ARM64',
            'Copyright (C) Microsoft Corporation.'
          ].join('\r\n')
        },
        /Compiler Version/i
      )
    ).toBe('Microsoft (R) C/C++ Optimizing Compiler Version 19.44.35228 for ARM64')
  })

  it('pins GitHub builder identity to the exact source commit', () => {
    expect(
      sshRelayRuntimeBuilderIdentity({
        gitCommit: commit,
        env: {
          GITHUB_ACTIONS: 'true',
          GITHUB_REPOSITORY: 'stablyai/orca',
          GITHUB_WORKFLOW_REF:
            'stablyai/orca/.github/workflows/ssh-relay-runtime-artifacts.yml@refs/pull/8741/merge'
        }
      })
    ).toBe(
      `https://github.com/stablyai/orca/blob/${commit}/.github/workflows/ssh-relay-runtime-artifacts.yml`
    )
    expect(() =>
      sshRelayRuntimeBuilderIdentity({
        gitCommit: commit,
        env: {
          GITHUB_ACTIONS: 'true',
          GITHUB_REPOSITORY: 'stablyai/orca',
          GITHUB_WORKFLOW_REF: 'other/repo/.github/workflows/untrusted.yml@refs/heads/main'
        }
      })
    ).toThrow(/workflow identity/i)
  })

  it('requires the resolved runner label, architecture, environment, and image identity', () => {
    expect(
      sshRelayRuntimeRunnerIdentity({
        env: {
          GITHUB_ACTIONS: 'true',
          RUNNER_OS: 'Windows',
          RUNNER_ARCH: 'ARM64',
          RUNNER_ENVIRONMENT: 'github-hosted',
          ORCA_RUNTIME_REQUESTED_RUNNER: 'windows-11-arm',
          ImageOS: 'win11-arm64',
          ImageVersion: '20260706.102.1'
        }
      })
    ).toEqual({
      os: 'Windows',
      architecture: 'ARM64',
      environment: 'github-hosted',
      requestedLabel: 'windows-11-arm',
      image: { os: 'win11-arm64', version: '20260706.102.1' }
    })
    expect(() =>
      sshRelayRuntimeRunnerIdentity({
        env: {
          GITHUB_ACTIONS: 'true',
          RUNNER_OS: 'Windows',
          RUNNER_ARCH: 'ARM64'
        }
      })
    ).toThrow(/runner identity/i)
  })

  it('records bounded native tool versions and SHA-256 executable or code digests', async () => {
    const toolchain = await collectSshRelayRuntimeToolchain(process.execPath)
    const tuple = process.platform === 'win32' ? 'win32-x64' : 'linux-x64-glibc'
    expect(() => assertSshRelayRuntimeToolchain(toolchain, tuple)).not.toThrow()
    expect(toolchain).toMatchObject({
      bundledNode: { version: process.version },
      buildNode: { version: process.version },
      nodeGyp: { version: expect.any(String) },
      nodeAddonApi: { version: expect.any(String) },
      compiler: { version: expect.any(String) },
      buildSystem: { version: expect.any(String) },
      python: { version: expect.any(String) },
      archive: { version: expect.any(String) }
    })
    for (const record of Object.values(toolchain)) {
      expect(record.sha256).toMatch(/^sha256:[0-9a-f]{64}$/)
      expect(Buffer.byteLength(record.version)).toBeGreaterThan(0)
      expect(Buffer.byteLength(record.version)).toBeLessThanOrEqual(512)
    }
    expect(() =>
      assertSshRelayRuntimeToolchain(
        { ...toolchain, compiler: { version: toolchain.compiler.version } },
        tuple
      )
    ).toThrow(/compiler/i)
  })
})
