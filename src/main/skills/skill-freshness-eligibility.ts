import {
  SUPPORTED_GLOBAL_SKILL_TOPOLOGIES,
  type SkillFreshnessInstallation
} from '../../shared/skill-freshness'

export function eligibleSkillUpdateNames(
  installations: readonly SkillFreshnessInstallation[]
): string[] {
  const byName = new Map<string, SkillFreshnessInstallation[]>()
  for (const installation of installations) {
    const entries = byName.get(installation.name) ?? []
    entries.push(installation)
    byName.set(installation.name, entries)
  }

  const eligible: string[] = []
  for (const [name, entries] of byName) {
    const hasOutdated = entries.some((entry) => entry.status === 'outdated')
    const everyPlacementIsSafe = entries.every(
      (entry) =>
        (entry.status === 'current' || entry.status === 'outdated') &&
        SUPPORTED_GLOBAL_SKILL_TOPOLOGIES.has(entry.topology) &&
        Boolean(entry.resolvedPath && entry.physicalIdentity)
    )
    if (hasOutdated && everyPlacementIsSafe) {
      eligible.push(name)
    }
  }
  return eligible.sort((left, right) => left.localeCompare(right, 'en'))
}
