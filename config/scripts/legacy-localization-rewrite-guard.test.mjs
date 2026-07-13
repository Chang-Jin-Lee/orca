import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { main as bootstrapLocaleCatalog } from './bootstrap-locale-catalog.mjs'
import { main as bootstrapLocalizationState } from './bootstrap-localization-state.mjs'
import { main as repairLocaleCatalog } from './repair-locale-catalog.mjs'

const DENIED_MIGRATION = { argv: [], environment: {} }

function makeProject() {
  const root = mkdtempSync(path.join(tmpdir(), 'orca-legacy-localization-'))
  const localesDir = path.join(root, 'src', 'renderer', 'src', 'i18n', 'locales')
  mkdirSync(localesDir, { recursive: true })
  for (const locale of ['en', 'es', 'ja', 'ko', 'zh']) {
    writeFileSync(path.join(localesDir, `${locale}.json`), '{}\n')
  }
  return root
}

describe('legacy localization rewrite guards', () => {
  it('refuses machine-translation bootstrap without migration opt-in', async () => {
    await expect(bootstrapLocaleCatalog(makeProject(), 'es', DENIED_MIGRATION)).resolves.toBe(1)
  })

  it('refuses whole-catalog repair without migration opt-in', async () => {
    await expect(repairLocaleCatalog(makeProject(), 'es', DENIED_MIGRATION)).resolves.toBe(1)
  })

  it('refuses translation-state bootstrap without migration opt-in', async () => {
    await expect(bootstrapLocalizationState(makeProject(), [])).resolves.toBe(1)
  })
})
