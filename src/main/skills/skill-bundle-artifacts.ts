import { app } from 'electron'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type {
  SkillBundleManifest,
  SkillKnownSnapshot,
  SkillReleaseMapping,
  SkillSnapshotRegistry
} from '../../shared/skill-freshness'

export type SkillBundleArtifacts = {
  manifest: SkillBundleManifest
  registry: SkillSnapshotRegistry
  releaseMapping: SkillReleaseMapping
  knownSnapshots: Record<string, SkillKnownSnapshot[]>
  releasedAppVersions: Record<string, Record<number, string>>
}

function assertSupportedSchema(
  value: unknown,
  label: string
): asserts value is { schemaVersion: 1 } {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('schemaVersion' in value) ||
    value.schemaVersion !== 1
  ) {
    throw new Error(`Unsupported ${label} schema`)
  }
}

const artifactsByResourceRoot = new Map<string, Promise<SkillBundleArtifacts>>()

// Why: the artifacts ship with the binary and never change within a run, while
// focus-triggered rescans would otherwise re-read and re-parse them every time.
export function loadSkillBundleArtifacts(
  resourceRoot = app.isPackaged ? process.resourcesPath : resolve(process.cwd(), 'resources')
): Promise<SkillBundleArtifacts> {
  const cached = artifactsByResourceRoot.get(resourceRoot)
  if (cached) {
    return cached
  }
  const loading = readSkillBundleArtifacts(resourceRoot)
  artifactsByResourceRoot.set(resourceRoot, loading)
  loading.catch(() => {
    artifactsByResourceRoot.delete(resourceRoot)
  })
  return loading
}

async function readSkillBundleArtifacts(resourceRoot: string): Promise<SkillBundleArtifacts> {
  const bundleRoot = join(resourceRoot, 'skills')
  const [manifest, registry, releaseMapping] = await Promise.all([
    readFile(join(bundleRoot, 'current-manifest.json'), 'utf8').then(JSON.parse),
    readFile(join(bundleRoot, 'snapshot-registry.json'), 'utf8').then(JSON.parse),
    readFile(join(bundleRoot, 'release-mapping.json'), 'utf8').then(JSON.parse)
  ])
  assertSupportedSchema(manifest, 'skill bundle manifest')
  assertSupportedSchema(registry, 'skill snapshot registry')
  assertSupportedSchema(releaseMapping, 'skill release mapping')
  if (!('skills' in manifest) || !Array.isArray(manifest.skills)) {
    throw new Error('Invalid skill bundle manifest')
  }
  if (!('appVersion' in manifest) || typeof manifest.appVersion !== 'string') {
    throw new Error('Invalid skill bundle manifest')
  }
  if (!('skills' in registry) || typeof registry.skills !== 'object' || registry.skills === null) {
    throw new Error('Invalid skill snapshot registry')
  }
  if (!('releases' in releaseMapping) || !Array.isArray(releaseMapping.releases)) {
    throw new Error('Invalid skill release mapping')
  }

  const releasedAppVersions: Record<string, Record<number, string>> = {}
  for (const release of (releaseMapping as SkillReleaseMapping).releases) {
    for (const [name, revision] of Object.entries(release.skills)) {
      releasedAppVersions[name] ??= {}
      releasedAppVersions[name][revision] ??= release.appVersion
    }
  }
  for (const current of (manifest as SkillBundleManifest).skills) {
    releasedAppVersions[current.name] ??= {}
    releasedAppVersions[current.name][current.releaseRevision] = current.appVersion
  }

  return {
    manifest: manifest as SkillBundleManifest,
    registry: registry as SkillSnapshotRegistry,
    releaseMapping: releaseMapping as SkillReleaseMapping,
    // Why: newer-known classification needs every identity packaged with this
    // build, while release mapping remains the provenance record for shipped revisions.
    knownSnapshots: (registry as SkillSnapshotRegistry).skills,
    releasedAppVersions
  }
}
