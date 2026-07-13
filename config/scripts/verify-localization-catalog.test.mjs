import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { sourceHash } from './localization-catalog-model.mjs'
import { main as verifyLocalizationCatalog } from './verify-localization-catalog.mjs'

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function makeProject({ sourceText, enCatalog = {}, esCatalog = {}, messages = {} }) {
  const root = mkdtempSync(path.join(tmpdir(), 'orca-localization-catalog-'))
  const rendererDir = path.join(root, 'src', 'renderer', 'src', 'components')
  const mainDir = path.join(root, 'src', 'main')
  const localesDir = path.join(root, 'src', 'renderer', 'src', 'i18n', 'locales')
  const stateDir = path.join(root, 'config', 'localization-state')
  mkdirSync(rendererDir, { recursive: true })
  mkdirSync(mainDir, { recursive: true })
  mkdirSync(localesDir, { recursive: true })
  mkdirSync(stateDir, { recursive: true })
  writeFileSync(path.join(rendererDir, 'Example.tsx'), sourceText, 'utf8')
  writeFileSync(path.join(mainDir, 'empty.ts'), 'export {}\n', 'utf8')
  writeJson(path.join(localesDir, 'en.json'), enCatalog)
  writeJson(path.join(localesDir, 'es.json'), esCatalog)
  writeJson(path.join(stateDir, 'es.json'), { version: 1, locale: 'es', messages })
  writeJson(path.join(root, 'config', 'localization-dynamic-call-allowlist.json'), {
    version: 2,
    entries: {}
  })
  writeJson(path.join(root, 'config', 'localization-reviewed-corrections.json'), {
    version: 3,
    algorithm: 'classified-first-parent-target-only-current-value-v2',
    provenance: [],
    messages: { es: {}, ja: {}, ko: {}, zh: {} }
  })
  return { root, localesDir }
}

describe('verify-localization-catalog', () => {
  it('adds only the English fallback and leaves a missing target absent', async () => {
    const { root, localesDir } = makeProject({
      sourceText:
        "import { translate } from '@/i18n/i18n'\nexport const label = translate('auto.example.greeting', 'Hello {{name}}', { name: 'Orca' })\n"
    })
    await expect(verifyLocalizationCatalog(root, { fix: true })).resolves.toBe(0)
    expect(JSON.parse(readFileSync(path.join(localesDir, 'en.json'), 'utf8'))).toEqual({
      auto: { example: { greeting: 'Hello {{name}}' } }
    })
    expect(JSON.parse(readFileSync(path.join(localesDir, 'es.json'), 'utf8'))).toEqual({})
  })

  it('rejects but never overwrites an existing placeholder mismatch', async () => {
    const enValue = 'Hello {{name}}'
    const { root, localesDir } = makeProject({
      sourceText:
        "import { translate } from '@/i18n/i18n'\nexport const label = translate('auto.example.greeting', 'Hello {{name}}', { name: 'Orca' })\n",
      enCatalog: { auto: { example: { greeting: enValue } } },
      esCatalog: { auto: { example: { greeting: 'Hola' } } },
      messages: {
        'auto.example.greeting': { state: 'machine', sourceHash: sourceHash(enValue) }
      }
    })
    await expect(verifyLocalizationCatalog(root, { fix: true })).resolves.toBe(1)
    expect(JSON.parse(readFileSync(path.join(localesDir, 'es.json'), 'utf8'))).toEqual({
      auto: { example: { greeting: 'Hola' } }
    })
  })

  it('enforces sidecar-only intentional English and exact catalog/state bijection', async () => {
    const { root } = makeProject({
      sourceText: "export const label = translate('auto.example.product', 'Orca')\n",
      enCatalog: { auto: { example: { product: 'Orca' } } },
      messages: { 'auto.example.product': { state: 'intentional-english' } }
    })
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(0)
  })

  it('rejects conflicting defaults for one identifier', async () => {
    const { root } = makeProject({
      sourceText:
        "translate('auto.example.conflict', 'First')\ntranslate('auto.example.conflict', 'Second')\n",
      enCatalog: { auto: { example: { conflict: 'First' } } }
    })
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(1)
  })

  it('rejects named placeholders without matching static option values', async () => {
    const { root } = makeProject({
      sourceText:
        "import { translate } from '@/i18n/i18n'\nexport const label = translate('auto.example.greeting', 'Hello {{name}}')\n",
      enCatalog: { auto: { example: { greeting: 'Hello {{name}}' } } }
    })
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(1)
  })

  it('validates t object-form defaultValue placeholders', async () => {
    const { root } = makeProject({
      sourceText:
        "const label = t('auto.example.greeting', { defaultValue: 'Hello {{name}}', name })\n",
      enCatalog: { auto: { example: { greeting: 'Hello {{name}}' } } }
    })
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(0)
  })

  it('rejects reserved i18next option names as translate placeholders', async () => {
    const { root } = makeProject({
      sourceText:
        "import { translate } from '@/i18n/i18n'\ntranslate('auto.example.locale', 'Locale {{lng}}', { lng: 'es' })\n",
      enCatalog: { auto: { example: { locale: 'Locale {{lng}}' } } }
    })
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(1)
  })

  it('rejects reserved i18next option names as translateMain placeholders', async () => {
    const { root } = makeProject({
      sourceText:
        "import { translateMain } from './i18n/main-i18n'\ntranslateMain('auto.example.count', 'Count {{count}}', { count: 1 })\n",
      enCatalog: { auto: { example: { count: 'Count {{count}}' } } }
    })
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(1)
  })

  it('rejects reserved i18next option names in t object-form defaults', async () => {
    const { root } = makeProject({
      sourceText: "t('auto.example.namespace', { defaultValue: 'Namespace {{ns}}', ns: 'main' })\n",
      enCatalog: { auto: { example: { namespace: 'Namespace {{ns}}' } } }
    })
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(1)
  })

  it('rejects unsupported reviewed upgrades', async () => {
    const { root } = makeProject({
      sourceText:
        "import { translate } from '@/i18n/i18n'\ntranslate('auto.example.fake', 'Fake')\n",
      enCatalog: { auto: { example: { fake: 'Fake' } } },
      esCatalog: { auto: { example: { fake: 'Falso' } } },
      messages: {
        'auto.example.fake': { state: 'reviewed', sourceHash: sourceHash('Fake') }
      }
    })
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(1)
  })

  it('rejects reviewed provenance downgrades', async () => {
    const reviewedValue = 'PR'
    const { root, localesDir } = makeProject({
      sourceText:
        "import { translate } from '@/i18n/i18n'\ntranslate('auto.example.reviewed', 'PR')\n",
      enCatalog: { auto: { example: { reviewed: 'PR' } } },
      esCatalog: { auto: { example: { reviewed: reviewedValue } } },
      messages: {
        'auto.example.reviewed': { state: 'machine', sourceHash: sourceHash('PR') }
      }
    })
    writeJson(path.join(root, 'config', 'localization-reviewed-corrections.json'), {
      version: 3,
      algorithm: 'classified-first-parent-target-only-current-value-v2',
      provenance: [
        {
          commit: 'cd03928e94e5f7d8a0cae6abc6b2b10b371e5c17',
          subject: 'fix(i18n): correct Spanish "PR" mistranslated as "relaciones públicas" (#6749)',
          classification: 'reviewed-correction',
          reason: 'Single Spanish correction review.'
        }
      ],
      messages: {
        es: {
          'auto.example.reviewed': {
            value: reviewedValue,
            commits: ['cd03928e94e5f7d8a0cae6abc6b2b10b371e5c17'],
            reason: 'historical-target-only-correction'
          }
        },
        ja: {},
        ko: {},
        zh: {}
      }
    })
    expect(readFileSync(path.join(localesDir, 'es.json'), 'utf8')).toContain(reviewedValue)
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(1)
  })

  it('rejects malformed reviewed-audit JSON without throwing', async () => {
    const { root } = makeProject({ sourceText: '', enCatalog: {} })
    writeFileSync(path.join(root, 'config', 'localization-reviewed-corrections.json'), '{invalid')
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(1)
  })

  it('rejects malformed translation-state JSON without throwing', async () => {
    const { root } = makeProject({ sourceText: '', enCatalog: {} })
    writeFileSync(path.join(root, 'config', 'localization-state', 'es.json'), '{invalid')
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(1)
  })

  it('accepts reviewed target values after the reserved count placeholder migration', async () => {
    const enValue = 'Selected {{value0}}'
    const { root } = makeProject({
      sourceText:
        "import { translate } from '@/i18n/i18n'\ntranslate('auto.example.selected', 'Selected {{value0}}', { value0: 2 })\n",
      enCatalog: { auto: { example: { selected: enValue } } },
      esCatalog: { auto: { example: { selected: 'Seleccionados {{value0}}' } } },
      messages: {
        'auto.example.selected': { state: 'reviewed', sourceHash: sourceHash(enValue) }
      }
    })
    writeJson(path.join(root, 'config', 'localization-reviewed-corrections.json'), {
      version: 3,
      algorithm: 'classified-first-parent-target-only-current-value-v2',
      provenance: [
        {
          commit: '770a9d5dc3de6c6880f6a002e1e26f96c1906dd1',
          subject: 'Improve translation quality across es/ja/ko/zh locale files (#8040)',
          classification: 'reviewed-correction',
          reason: 'Reviewed multi-locale correction PR.'
        }
      ],
      messages: {
        es: {
          'auto.example.selected': {
            value: 'Seleccionados {{count}}',
            commits: ['770a9d5dc3de6c6880f6a002e1e26f96c1906dd1'],
            reason: 'historical-target-only-correction'
          }
        },
        ja: {},
        ko: {},
        zh: {}
      }
    })
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(0)
  })

  it('accepts exact-value localization PR evidence for confirmations and improvements', async () => {
    const { root } = makeProject({
      sourceText:
        "translate('auto.example.confirmed', 'Confirmed')\ntranslate('auto.example.improved', 'Improved')\n",
      enCatalog: { auto: { example: { confirmed: 'Confirmed', improved: 'Improved' } } },
      esCatalog: { auto: { example: { confirmed: 'Confirmado', improved: 'Mejorado' } } },
      messages: {
        'auto.example.confirmed': { state: 'reviewed', sourceHash: sourceHash('Confirmed') },
        'auto.example.improved': { state: 'reviewed', sourceHash: sourceHash('Improved') }
      }
    })
    const review = { provider: 'gitlab', changeId: 'orca/orca!123', reviewer: 'locale-owner' }
    writeJson(path.join(root, 'config', 'localization-reviewed-corrections.json'), {
      version: 3,
      algorithm: 'classified-first-parent-target-only-current-value-v2',
      provenance: [],
      messages: {
        es: {
          'auto.example.confirmed': {
            value: 'Confirmado',
            review,
            reason: 'localization-pr-review'
          },
          'auto.example.improved': {
            value: 'Mejorado',
            review,
            reason: 'localization-pr-review'
          }
        },
        ja: {},
        ko: {},
        zh: {}
      }
    })
    await expect(verifyLocalizationCatalog(root, { fix: false })).resolves.toBe(0)
  })
})
