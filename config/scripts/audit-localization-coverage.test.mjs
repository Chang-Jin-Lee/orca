import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { main as auditLocalizationCoverage } from './audit-localization-coverage.mjs'

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function makeProject() {
  const root = mkdtempSync(path.join(tmpdir(), 'orca-localization-coverage-'))
  const sourceDir = path.join(root, 'src', 'main')
  const configDir = path.join(root, 'config')
  mkdirSync(sourceDir, { recursive: true })
  mkdirSync(configDir, { recursive: true })
  writeFileSync(
    path.join(sourceDir, 'example.ts'),
    "export const value = { message: 'Hello from main' }\n",
    'utf8'
  )
  return { root, allowlistPath: path.join('config', 'allowlist.json') }
}

describe('audit-localization-coverage allowlist schema', () => {
  it('accepts classified entries with entry-specific reasons', async () => {
    const { root, allowlistPath } = makeProject()
    writeJson(path.join(root, allowlistPath), [
      {
        filePath: 'src/main/example.ts',
        kind: 'object-property:message',
        text: 'Hello from main',
        dynamic: false,
        count: 1,
        classification: 'product-copy-pending-localization',
        reason:
          'Main-process product literal in src/main/example.ts is user-visible copy pending main-process localization: "Hello from main".'
      }
    ])
    await expect(
      auditLocalizationCoverage(root, [
        '--source-root',
        'src/main',
        '--allowlist',
        allowlistPath,
        '--check'
      ])
    ).resolves.toBe(0)
  })

  it('rejects the former generic unclassified reason', async () => {
    const { root, allowlistPath } = makeProject()
    writeJson(path.join(root, allowlistPath), [
      {
        filePath: 'src/main/example.ts',
        kind: 'object-property:message',
        text: 'Hello from main',
        dynamic: false,
        count: 1,
        reason: 'Pre-existing main-process candidate retained for explicit follow-up disposition.'
      }
    ])
    await expect(
      auditLocalizationCoverage(root, [
        '--source-root',
        'src/main',
        '--allowlist',
        allowlistPath,
        '--check'
      ])
    ).resolves.toBe(1)
  })

  it('rejects unsupported classifications', async () => {
    const { root, allowlistPath } = makeProject()
    writeJson(path.join(root, allowlistPath), [
      {
        filePath: 'src/main/example.ts',
        kind: 'object-property:message',
        text: 'Hello from main',
        dynamic: false,
        count: 1,
        classification: 'unclassified',
        reason: 'Entry in src/main/example.ts has unsupported classification: "Hello from main".'
      }
    ])
    await expect(
      auditLocalizationCoverage(root, [
        '--source-root',
        'src/main',
        '--allowlist',
        allowlistPath,
        '--check'
      ])
    ).resolves.toBe(1)
  })

  it('rejects stale allowance counts in both directions', async () => {
    const { root, allowlistPath } = makeProject()
    writeJson(path.join(root, allowlistPath), [
      {
        filePath: 'src/main/example.ts',
        kind: 'object-property:message',
        text: 'Hello from main',
        dynamic: false,
        count: 2,
        classification: 'product-copy-pending-localization',
        reason:
          'Main-process product literal in src/main/example.ts is user-visible copy pending main-process localization: "Hello from main".'
      }
    ])
    await expect(
      auditLocalizationCoverage(root, [
        '--source-root',
        'src/main',
        '--allowlist',
        allowlistPath,
        '--check'
      ])
    ).resolves.toBe(1)
  })

  it('preserves reviewed entries and makes new snapshot entries fail closed', async () => {
    const { root, allowlistPath } = makeProject()
    const existing = {
      filePath: 'src/main/example.ts',
      kind: 'object-property:message',
      text: 'Hello from main',
      dynamic: false,
      count: 1,
      classification: 'product-copy-pending-localization',
      reason:
        'Main-process product literal in src/main/example.ts is user-visible copy pending main-process localization: "Hello from main".'
    }
    writeJson(path.join(root, allowlistPath), [existing])
    writeFileSync(
      path.join(root, 'src', 'main', 'second.ts'),
      "export const value = { message: 'Second message' }\n"
    )
    await auditLocalizationCoverage(root, [
      '--source-root',
      'src/main',
      '--allowlist',
      allowlistPath,
      '--snapshot-allowlist'
    ])
    const snapshot = JSON.parse(readFileSync(path.join(root, allowlistPath), 'utf8'))
    expect(snapshot).toContainEqual(existing)
    expect(snapshot).toContainEqual(
      expect.objectContaining({ classification: 'pending-human-classification' })
    )
    await expect(
      auditLocalizationCoverage(root, [
        '--source-root',
        'src/main',
        '--allowlist',
        allowlistPath,
        '--check'
      ])
    ).resolves.toBe(1)
  })

  it('collects reports when callers prepare only the source file list', async () => {
    const { root, allowlistPath } = makeProject()
    writeJson(path.join(root, allowlistPath), [
      {
        filePath: 'src/main/example.ts',
        kind: 'object-property:message',
        text: 'Hello from main',
        dynamic: false,
        count: 1,
        classification: 'product-copy-pending-localization',
        reason:
          'Main-process product literal in src/main/example.ts is user-visible copy pending main-process localization: "Hello from main".'
      }
    ])
    await expect(
      auditLocalizationCoverage(
        root,
        ['--source-root', 'src/main', '--allowlist', allowlistPath, '--check'],
        { files: [path.join(root, 'src', 'main', 'example.ts')] }
      )
    ).resolves.toBe(0)
  })

  it('does not overwrite an unreadable allowlist snapshot', async () => {
    const { root, allowlistPath } = makeProject()
    const absoluteAllowlistPath = path.join(root, allowlistPath)
    writeFileSync(absoluteAllowlistPath, '{invalid', 'utf8')
    await expect(
      auditLocalizationCoverage(root, [
        '--source-root',
        'src/main',
        '--allowlist',
        allowlistPath,
        '--snapshot-allowlist'
      ])
    ).rejects.toThrow()
    expect(readFileSync(absoluteAllowlistPath, 'utf8')).toBe('{invalid')
  })
})
