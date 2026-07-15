import { afterEach, describe, expect, it } from 'vitest'
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { captureCodexTrustConfig, restoreCodexTrustConfig } from './codex-trust-config-rollback'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

function tempConfigPath(): string {
  const root = mkdtempSync(join(tmpdir(), 'orca-codex-rollback-'))
  roots.push(root)
  return join(root, 'config.toml')
}

describe('Codex trust config rollback', () => {
  it('treats a missing config as absent and tolerates it remaining absent', () => {
    const configPath = tempConfigPath()
    const snapshot = captureCodexTrustConfig(configPath)

    expect(snapshot).toEqual({ existed: false })
    expect(() => restoreCodexTrustConfig(configPath, snapshot)).not.toThrow()
  })

  it('removes a config created after an absent snapshot', () => {
    const configPath = tempConfigPath()
    const snapshot = captureCodexTrustConfig(configPath)
    writeFileSync(configPath, 'rpc mutation')

    restoreCodexTrustConfig(configPath, snapshot)
    expect(() => readFileSync(configPath)).toThrowError(/ENOENT/)
  })

  it('atomically recreates exact contents and mode after the file disappears', () => {
    const configPath = tempConfigPath()
    const original = Buffer.from('# comment\r\n[hooks]\r\n')
    writeFileSync(configPath, original)
    chmodSync(configPath, 0o640)
    const snapshot = captureCodexTrustConfig(configPath)
    rmSync(configPath)

    restoreCodexTrustConfig(configPath, snapshot)

    expect(readFileSync(configPath)).toEqual(original)
    if (process.platform !== 'win32') {
      expect(statSync(configPath).mode & 0o777).toBe(0o640)
    }
  })
})
