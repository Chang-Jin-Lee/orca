import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import process from 'node:process'

import {
  flattenCatalog as flattenCatalogMap,
  getCatalogEntry,
  jsonText,
  setCatalogEntry,
  sourceHash,
  stateDocument
} from './localization-catalog-model.mjs'
import {
  LOCALIZATION_LOCALES,
  reviewedAuditValueMatches,
  reviewedByPolicy,
  validateReviewedAudit
} from './localization-reviewed-provenance.mjs'
import {
  collectCallSitePlaceholderErrors,
  collectInterpolationVariables,
  collectLocalizationKeyReferences,
  collectLocalizationSourceFiles,
  formatPlaceholderErrors
} from './localization-source-references.mjs'

const LOCALES_RELATIVE_DIR = path.join('src', 'renderer', 'src', 'i18n', 'locales')
const STATE_RELATIVE_DIR = path.join('config', 'localization-state')
const DYNAMIC_ALLOWLIST_PATH = path.join('config', 'localization-dynamic-call-allowlist.json')
const REVIEWED_AUDIT_PATH = path.join('config', 'localization-reviewed-corrections.json')
const SOURCE_RELATIVE_ROOTS = [path.join('src', 'renderer', 'src'), path.join('src', 'main')]

function normalizePath(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/')
}

function formatMissingReferences(missing) {
  return missing
    .map(
      (reference) => `${reference.filePath}:${reference.line}:${reference.column} ${reference.key}`
    )
    .join('\n')
}

function formatDynamicReferences(references) {
  return references
    .map(
      ({ filePath, line, column, dynamicSignature }) =>
        `${filePath}:${line}:${column} (${dynamicSignature})`
    )
    .join('\n')
}

function validateDynamicAllowlist(dynamicAllowlist) {
  const errors = []
  if (dynamicAllowlist.version !== 2) {
    errors.push('dynamic localization allowlist must use version 2')
  }
  if (
    !dynamicAllowlist.entries ||
    typeof dynamicAllowlist.entries !== 'object' ||
    Array.isArray(dynamicAllowlist.entries)
  ) {
    errors.push('dynamic localization allowlist entries must be an object')
    return errors
  }
  for (const [signature, reason] of Object.entries(dynamicAllowlist.entries)) {
    if (!/^[^#]+#sha256:[a-f0-9]{64}#\d+$/.test(signature)) {
      errors.push(`dynamic localization allowlist signature is invalid: ${signature}`)
    }
    if (typeof reason !== 'string' || reason.trim().length < 12) {
      errors.push(`dynamic localization allowlist reason is missing for ${signature}`)
    }
  }
  return errors
}

function formatMissingKeys(label, keys) {
  return keys.map((key) => `${label}: ${key}`).join('\n')
}

function normalizeInterpolationVariables(value) {
  return collectInterpolationVariables(value)
    .map((variable) => variable.slice(2, -2))
    .join('|')
}

function formatInconsistentFallbackVariables(inconsistentFallbackVariables) {
  return inconsistentFallbackVariables
    .map(({ key, references }) => {
      const locations = references
        .map(
          (reference) =>
            `  ${reference.filePath}:${reference.line}:${reference.column} ${JSON.stringify(reference.fallback)}`
        )
        .join('\n')
      return `${key}\n${locations}`
    })
    .join('\n\n')
}

function collectInconsistentFallbackVariables(references) {
  const byKey = new Map()

  for (const reference of references) {
    if (typeof reference.fallback !== 'string') {
      continue
    }
    const existing = byKey.get(reference.key) ?? []
    existing.push(reference)
    byKey.set(reference.key, existing)
  }

  return [...byKey.entries()]
    .map(([key, keyReferences]) => {
      const uniqueFallbackVariables = new Set(
        keyReferences.map((reference) => normalizeInterpolationVariables(reference.fallback))
      )
      return {
        key,
        references: keyReferences,
        uniqueFallbackVariableCount: uniqueFallbackVariables.size
      }
    })
    .filter(({ uniqueFallbackVariableCount }) => uniqueFallbackVariableCount > 1)
}

function collectInconsistentFallbackValues(references) {
  const byKey = new Map()
  for (const reference of references) {
    if (typeof reference.fallback !== 'string') {
      continue
    }
    const keyReferences = byKey.get(reference.key) ?? []
    keyReferences.push(reference)
    byKey.set(reference.key, keyReferences)
  }
  return [...byKey.entries()]
    .map(([key, keyReferences]) => ({
      key,
      references: keyReferences,
      values: new Set(keyReferences.map(({ fallback }) => fallback))
    }))
    .filter(({ values }) => values.size > 1)
}

function reviewedAuditMatches(reviewedAudit, localeName, key, localeEntries) {
  const entry = reviewedAudit?.messages?.[localeName]?.[key]
  if (typeof entry?.value !== 'string') {
    return false
  }
  return reviewedAuditValueMatches(entry, localeEntries.get(key))
}

function validateStateEntry(
  localeName,
  key,
  entry,
  enEntries,
  localeEntries,
  reviewedAudit,
  errors
) {
  const label = `${localeName}:${key}`
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(`${label} must be an object`)
    return { stale: false }
  }
  if (!enEntries.has(key)) {
    errors.push(`${label} references an unknown English key`)
  }
  if (entry.state === 'intentional-english') {
    if (Object.keys(entry).join('|') !== 'state') {
      errors.push(`${label} has invalid sidecar fields`)
    }
    if (localeEntries.has(key)) {
      errors.push(`${label} must not have a target catalog value`)
    }
    return { stale: false }
  }
  if (entry.state !== 'machine' && entry.state !== 'reviewed') {
    errors.push(`${label} has unknown state ${JSON.stringify(entry.state)}`)
    return { stale: false }
  }
  if (Object.keys(entry).join('|') !== 'state|sourceHash') {
    errors.push(`${label} has invalid fields`)
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(entry.sourceHash ?? '')) {
    errors.push(`${label} has a malformed sourceHash`)
  }
  if (!localeEntries.has(key)) {
    errors.push(`${label} requires exactly one target catalog value`)
  }
  const hasReviewedProvenance =
    enEntries.has(key) &&
    (reviewedByPolicy(localeName, key, enEntries.get(key)) ||
      reviewedAuditMatches(reviewedAudit, localeName, key, localeEntries))
  if (entry.state === 'reviewed' && !hasReviewedProvenance) {
    errors.push(`${label} is marked reviewed without reviewed policy or audit provenance`)
  }
  if (entry.state === 'machine' && hasReviewedProvenance) {
    errors.push(`${label} downgrades reviewed policy/audit provenance to machine`)
  }
  return { stale: enEntries.has(key) && entry.sourceHash !== sourceHash(enEntries.get(key)) }
}

async function readReviewedAudit(root) {
  const auditPath = path.join(root, REVIEWED_AUDIT_PATH)
  let raw
  try {
    raw = await fs.readFile(auditPath, 'utf8')
  } catch {
    console.error(`Missing reviewed localization audit: ${normalizePath(root, auditPath)}`)
    return null
  }
  let audit
  try {
    audit = JSON.parse(raw)
  } catch (error) {
    console.error('Reviewed localization audit is invalid:')
    console.error(`invalid JSON (${error instanceof Error ? error.message : String(error)})`)
    return null
  }
  const errors = validateReviewedAudit(audit)
  if (errors.length > 0) {
    console.error(`Reviewed localization audit is invalid:\n${errors.join('\n')}`)
    return null
  }
  return audit
}

async function verifyTranslationState(root, localeName, enCatalog, localeCatalog, reviewedAudit) {
  const statePath = path.join(root, STATE_RELATIVE_DIR, `${localeName}.json`)
  let raw
  try {
    raw = await fs.readFile(statePath, 'utf8')
  } catch {
    console.error(`Missing translation state: ${normalizePath(root, statePath)}`)
    return 1
  }
  let document
  try {
    document = JSON.parse(raw)
  } catch (error) {
    console.error(`Translation state validation failed for ${localeName}.json:`)
    console.error(
      `${localeName}: invalid JSON (${error instanceof Error ? error.message : String(error)})`
    )
    return 1
  }
  const errors = []
  if (Object.keys(document).join('|') !== 'version|locale|messages') {
    errors.push(`${localeName}: state document has invalid fields or ordering`)
  }
  if (document.version !== 1) {
    errors.push(`${localeName}: unsupported state schema version`)
  }
  if (document.locale !== localeName) {
    errors.push(`${localeName}: filename/locale mismatch`)
  }
  if (
    !document.messages ||
    typeof document.messages !== 'object' ||
    Array.isArray(document.messages)
  ) {
    errors.push(`${localeName}: messages must be an object`)
    document.messages = {}
  }
  const canonicalState = stateDocument(localeName, new Map(Object.entries(document.messages)))
  if (raw !== jsonText(canonicalState)) {
    errors.push(`${localeName}: state file is not deterministic JSON`)
  }
  const enEntries = flattenCatalogMap(enCatalog)
  const localeEntries = flattenCatalogMap(localeCatalog)
  const counts = { untranslated: 0, intentionalEnglish: 0, stale: 0, machine: 0, reviewed: 0 }
  for (const [key, entry] of Object.entries(document.messages)) {
    const result = validateStateEntry(
      localeName,
      key,
      entry,
      enEntries,
      localeEntries,
      reviewedAudit,
      errors
    )
    if (entry?.state === 'intentional-english') {
      counts.intentionalEnglish += 1
    }
    if (entry?.state === 'machine') {
      counts.machine += 1
    }
    if (entry?.state === 'reviewed') {
      counts.reviewed += 1
    }
    if (result.stale) {
      counts.stale += 1
    }
  }
  for (const [key, value] of localeEntries) {
    const entry = document.messages[key]
    if (!entry || !['machine', 'reviewed'].includes(entry.state)) {
      errors.push(`${localeName}:${key} has a target value without translation state`)
    }
    if (value.length === 0) {
      errors.push(`${localeName}:${key} has an empty target value`)
    }
  }
  for (const key of enEntries.keys()) {
    if (!localeEntries.has(key) && !document.messages[key]) {
      counts.untranslated += 1
    }
  }
  const coverage = enEntries.size === 0 ? 100 : (localeEntries.size / enEntries.size) * 100
  console.log(
    `${localeName}: ${coverage.toFixed(1)}% translated; ${Object.entries(counts)
      .map(([name, count]) => `${name}=${count}`)
      .join(' ')}`
  )
  if (errors.length > 0) {
    console.error(`Translation state validation failed for ${localeName}.json:`)
    console.error(errors.slice(0, 40).join('\n'))
    if (errors.length > 40) {
      console.error(`...and ${errors.length - 40} more error(s)`)
    }
    return 1
  }
  return 0
}

function collectLocaleParityIssues(enCatalog, localeCatalog) {
  const enEntries = flattenCatalogMap(enCatalog)
  const localeEntries = flattenCatalogMap(localeCatalog)
  const missingInLocale = [...enEntries.keys()].filter((key) => !localeEntries.has(key))
  const extraInLocale = [...localeEntries.keys()].filter((key) => !enEntries.has(key))
  const interpolationMismatches = []

  for (const key of enEntries.keys()) {
    if (!localeEntries.has(key)) {
      continue
    }
    const enVariables = collectInterpolationVariables(enEntries.get(key))
    const localeVariables = collectInterpolationVariables(localeEntries.get(key))
    if (enVariables.join('|') !== localeVariables.join('|')) {
      interpolationMismatches.push(key)
    }
  }

  return { enEntries, localeEntries, missingInLocale, extraInLocale, interpolationMismatches }
}

function referencesMissingFallbacks(missing) {
  return missing.filter((reference) => typeof reference.fallback !== 'string')
}

function collectMissingCatalogEntries(missing) {
  const entries = new Map()

  for (const reference of missing) {
    if (typeof reference.fallback !== 'string') {
      continue
    }
    if (!entries.has(reference.key)) {
      entries.set(reference.key, reference.fallback)
    }
  }

  return entries
}

function applyMissingEnglishEntries(catalog, missing) {
  const entries = collectMissingCatalogEntries(missing)
  let changed = 0

  for (const [key, fallback] of entries) {
    if (getCatalogEntry(catalog, key) !== undefined) {
      continue
    }
    setCatalogEntry(catalog, key, fallback)
    changed += 1
  }

  return changed
}

function verifyLocaleParity(enCatalog, localeName, localeCatalog) {
  const { localeEntries, missingInLocale, extraInLocale, interpolationMismatches } =
    collectLocaleParityIssues(enCatalog, localeCatalog)

  if (extraInLocale.length > 0 || interpolationMismatches.length > 0) {
    console.error(`Locale catalog validation failed for ${localeName}.json.`)
    if (extraInLocale.length > 0) {
      console.error('')
      console.error(formatMissingKeys('extra', extraInLocale.slice(0, 20)))
      if (extraInLocale.length > 20) {
        console.error(`...and ${extraInLocale.length - 20} more extra keys`)
      }
    }
    if (interpolationMismatches.length > 0) {
      console.error('')
      console.error(
        formatMissingKeys('interpolation mismatch', interpolationMismatches.slice(0, 20))
      )
      if (interpolationMismatches.length > 20) {
        console.error(`...and ${interpolationMismatches.length - 20} more interpolation mismatches`)
      }
    }
    return 1
  }

  console.log(
    `Verified ${localeName}.json structure (${localeEntries.size} translated, ${missingInLocale.length} fallback).`
  )
  return 0
}

function parseArgs(argv) {
  return {
    fix: argv.includes('--fix')
  }
}

export async function main(root = process.cwd(), options = parseArgs(process.argv.slice(2))) {
  const localesDir = path.join(root, LOCALES_RELATIVE_DIR)
  const catalogPath = path.join(localesDir, 'en.json')
  const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'))
  let catalogKeys = new Set(flattenCatalogMap(catalog).keys())
  const sourceRoots = SOURCE_RELATIVE_ROOTS.map((sourceRoot) => path.join(root, sourceRoot))
  const references = options.references ?? []

  if (!options.references) {
    for (const sourceRoot of sourceRoots) {
      const files = await collectLocalizationSourceFiles(root, sourceRoot)
      for (const filePath of files) {
        references.push(
          ...collectLocalizationKeyReferences(filePath, await fs.readFile(filePath, 'utf8'), root)
        )
      }
    }
  }

  const dynamicAllowlist = JSON.parse(await fs.readFile(path.join(root, DYNAMIC_ALLOWLIST_PATH)))
  const dynamicAllowlistErrors = validateDynamicAllowlist(dynamicAllowlist)
  if (dynamicAllowlistErrors.length > 0) {
    console.error('Dynamic localization allowlist is invalid.')
    console.error('')
    console.error(dynamicAllowlistErrors.join('\n'))
    return 1
  }
  const dynamicLocations = new Set(
    references
      .filter(({ key }) => key === undefined)
      .map(({ dynamicSignature }) => dynamicSignature)
  )
  const staleAllowlistEntries = Object.keys(dynamicAllowlist.entries).filter(
    (location) => !dynamicLocations.has(location)
  )
  if (staleAllowlistEntries.length > 0) {
    console.error('Dynamic localization allowlist contains stale entries.')
    console.error('')
    console.error(staleAllowlistEntries.join('\n'))
    return 1
  }
  const dynamicReferences = references.filter(({ key, dynamicSignature }) => {
    if (key !== undefined) {
      return false
    }
    return !dynamicAllowlist.entries[dynamicSignature]
  })
  if (dynamicReferences.length > 0) {
    console.error('Localization calls must use statically extractable string identifiers.')
    console.error('')
    console.error(formatDynamicReferences(dynamicReferences))
    return 1
  }
  const staticReferences = references.filter(({ key }) => key !== undefined)
  // Why: bounded dynamic-key calls still carry statically provable fallback contracts.
  const placeholderErrors = collectCallSitePlaceholderErrors(references)
  if (placeholderErrors.length > 0) {
    console.error('Localization interpolation options are invalid.')
    console.error('')
    console.error(formatPlaceholderErrors(placeholderErrors.slice(0, 40)))
    if (placeholderErrors.length > 40) {
      console.error(`...and ${placeholderErrors.length - 40} more error(s)`)
    }
    return 1
  }

  const missing = staticReferences.filter((reference) => !catalogKeys.has(reference.key))
  if (missing.length > 0) {
    const missingFallbacks = referencesMissingFallbacks(missing)
    if (options.fix && missingFallbacks.length === 0) {
      const added = applyMissingEnglishEntries(catalog, missing)
      await fs.writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
      catalogKeys = new Set(flattenCatalogMap(catalog).keys())
      console.log(`Added ${added} missing localization key(s) to en.json.`)
    } else {
      if (options.fix && missingFallbacks.length > 0) {
        console.error('Some missing localization keys do not have string fallbacks to bootstrap.')
        console.error('')
        console.error(formatMissingReferences(missingFallbacks))
        return 1
      }
      console.error('Localization keys are missing from src/renderer/src/i18n/locales/en.json.')
      console.error('')
      console.error(formatMissingReferences(missing))
      console.error('')
      console.error('Run `pnpm run sync:localization-catalog` to add keys with string fallbacks.')
      return 1
    }
  }

  const remainingMissing = staticReferences.filter((reference) => !catalogKeys.has(reference.key))
  if (remainingMissing.length > 0) {
    console.error('Localization keys are missing from src/renderer/src/i18n/locales/en.json.')
    console.error('')
    console.error(formatMissingReferences(remainingMissing))
    return 1
  }

  const inconsistentFallbackVariables = collectInconsistentFallbackVariables(staticReferences)
  if (inconsistentFallbackVariables.length > 0) {
    console.error('Localization keys are used with inconsistent interpolation placeholders.')
    console.error('')
    console.error(formatInconsistentFallbackVariables(inconsistentFallbackVariables))
    return 1
  }

  const inconsistentFallbackValues = collectInconsistentFallbackValues(staticReferences)
  if (inconsistentFallbackValues.length > 0) {
    console.error('Localization identifiers are used with conflicting English fallbacks.')
    console.error('')
    console.error(formatInconsistentFallbackVariables(inconsistentFallbackValues))
    return 1
  }

  console.log(`Verified ${staticReferences.length} localization key references against en.json.`)

  const reviewedAudit = await readReviewedAudit(root)
  if (!reviewedAudit) {
    return 1
  }
  for (const locale of LOCALIZATION_LOCALES) {
    if (!reviewedAudit.messages[locale]) {
      console.error(`Reviewed audit is missing locale ${locale}.`)
      return 1
    }
  }

  const localeFiles = (await fs.readdir(localesDir))
    .filter(
      (fileName) =>
        fileName.endsWith('.json') &&
        fileName !== 'en.json' &&
        !fileName.startsWith('.') &&
        !fileName.includes('-catalog-cache')
    )
    .sort()

  for (const fileName of localeFiles) {
    const localeName = fileName.replace(/\.json$/, '')
    const localeCatalogPath = path.join(localesDir, fileName)
    const localeCatalog = JSON.parse(await fs.readFile(localeCatalogPath, 'utf8'))
    const exitCode = verifyLocaleParity(catalog, localeName, localeCatalog)
    if (exitCode !== 0) {
      if (!options.fix) {
        console.error('')
        console.error('Fix the reported target value in a localization PR.')
      }
      return exitCode
    }
    if (
      (await verifyTranslationState(root, localeName, catalog, localeCatalog, reviewedAudit)) !== 0
    ) {
      return 1
    }
  }

  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main())
}
