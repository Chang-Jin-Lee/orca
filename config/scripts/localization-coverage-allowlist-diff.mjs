import fs from 'node:fs/promises'
import path from 'node:path'

import { allowlistEntryForCandidate } from './localization-coverage-allowlist-schema.mjs'
import { compareCodeUnits } from './localization-code-unit-order.mjs'

function candidateSignature(candidate) {
  return JSON.stringify({
    filePath: candidate.filePath,
    kind: candidate.kind,
    text: candidate.text,
    dynamic: candidate.dynamic
  })
}

function countBySignature(reports) {
  const counts = new Map()
  for (const report of reports) {
    const signature = candidateSignature(report)
    counts.set(signature, (counts.get(signature) ?? 0) + 1)
  }
  return counts
}

export async function writeAllowlistSnapshot(root, allowlistPath, reports) {
  const counts = countBySignature(reports)
  let existing = []
  try {
    existing = await readAllowlist(root, allowlistPath)
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error
    }
  }
  const existingBySignature = new Map(existing.map((entry) => [candidateSignature(entry), entry]))
  const currentEntries = [...counts.entries()].map(([signature, count]) => {
    const prior = existingBySignature.get(signature)
    return prior ?? allowlistEntryForCandidate({ ...JSON.parse(signature), count })
  })
  const entries = [
    ...currentEntries,
    ...existing.filter((entry) => !counts.has(candidateSignature(entry)))
  ].sort((left, right) => compareCodeUnits(candidateSignature(left), candidateSignature(right)))
  await fs.writeFile(path.resolve(root, allowlistPath), `${JSON.stringify(entries, null, 2)}\n`)
}

export async function readAllowlist(root, allowlistPath) {
  const absolutePath = path.resolve(root, allowlistPath)
  const raw = await fs.readFile(absolutePath, 'utf8')
  return JSON.parse(raw)
}

export function findNewCandidates(reports, allowlist) {
  const allowedCounts = new Map(
    allowlist.map((entry) => [
      JSON.stringify({
        filePath: entry.filePath,
        kind: entry.kind,
        text: entry.text,
        dynamic: entry.dynamic
      }),
      entry.count
    ])
  )
  const seenCounts = countBySignature(reports)
  const newCandidates = []

  for (const report of reports) {
    const signature = candidateSignature(report)
    const seenCount = seenCounts.get(signature) ?? 0
    const allowedCount = allowedCounts.get(signature) ?? 0
    if (seenCount > allowedCount) {
      newCandidates.push(report)
      seenCounts.set(signature, seenCount - 1)
    }
  }

  return newCandidates
}

export function findAllowlistCountMismatches(reports, allowlist) {
  const seenCounts = countBySignature(reports)
  return allowlist.flatMap((entry) => {
    const actual = seenCounts.get(candidateSignature(entry)) ?? 0
    return actual === entry.count ? [] : [{ entry, actual }]
  })
}
