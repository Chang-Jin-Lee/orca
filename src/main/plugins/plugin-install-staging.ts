import { existsSync } from 'node:fs'
import { cp, mkdir, rename, rm } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import {
  PLUGIN_MANIFEST_FILENAME,
  parsePluginManifest,
  qualifiedPluginKey,
  satisfiesOrcaEngineRange,
  type PluginManifest
} from '../../shared/plugins/plugin-manifest'
import { fingerprintPluginConsent } from '../../shared/plugins/plugin-consent-fingerprint'
import type {
  PluginInstallSource,
  PluginLockEntry
} from '../../shared/plugins/plugin-install-lockfile'
import {
  validateDeclaredPluginArtifacts,
  validatePluginInstallContent,
  type PluginArtifactValidationResult
} from './plugin-artifact-validation'
import { hashPluginTree } from './plugin-content-hash'
import { publishPluginInstall } from './plugin-install-publication'
import { readPluginManifestText } from './plugin-manifest-file'

export type PluginInstallResult =
  | {
      ok: true
      pluginKey: string
      version: string
      contentHash: string
      consentFingerprint: string
      resolvedCommit: string | null
    }
  | { ok: false; error: string }

async function validatePluginInstallTree(
  rootDir: string,
  manifest: PluginManifest
): Promise<PluginArtifactValidationResult> {
  const declared = await validateDeclaredPluginArtifacts(rootDir, manifest)
  return declared.ok ? validatePluginInstallContent(rootDir, manifest) : declared
}

async function readInstallManifest(
  rootDir: string,
  hostVersion: string
): Promise<{ ok: true; manifest: PluginManifest } | { ok: false; error: string }> {
  let raw: unknown
  try {
    raw = JSON.parse(await readPluginManifestText(rootDir))
  } catch (error) {
    return {
      ok: false,
      error: `unreadable ${PLUGIN_MANIFEST_FILENAME}: ${error instanceof Error ? error.message : String(error)}`
    }
  }
  const parsed = parsePluginManifest(raw)
  if (!parsed.ok) {
    return { ok: false, error: `invalid manifest: ${parsed.error}` }
  }
  if (!satisfiesOrcaEngineRange(hostVersion, parsed.manifest.engines.orca)) {
    return {
      ok: false,
      error: `plugin requires Orca ${parsed.manifest.engines.orca} (this is ${hostVersion})`
    }
  }
  return { ok: true, manifest: parsed.manifest }
}

/** Installs a validated staging tree into the hash-addressed layout. */
export async function installStagedPluginTree(input: {
  pluginsDir: string
  stagingDir: string
  hostVersion: string
  source: PluginInstallSource
  resolvedCommit: string | null
}): Promise<PluginInstallResult> {
  const sourceManifest = await readInstallManifest(input.stagingDir, input.hostVersion)
  if (!sourceManifest.ok) {
    return sourceManifest
  }
  let manifest = sourceManifest.manifest
  const declaredArtifacts = await validatePluginInstallTree(input.stagingDir, manifest)
  if (!declaredArtifacts.ok) {
    return { ok: false, error: `invalid declared artifact: ${declaredArtifacts.error}` }
  }
  // Hash before copy: also enforces the symlink/entry-count/size limits.
  const treeHash = await hashPluginTree(input.stagingDir)
  if (!treeHash.ok) {
    return { ok: false, error: treeHash.error }
  }
  const pluginKey = qualifiedPluginKey(manifest)
  const pluginDir = join(input.pluginsDir, pluginKey)
  const versionDir = join(pluginDir, treeHash.hash)
  if (!existsSync(versionDir)) {
    const stagedVersionDir = `${versionDir}.staging`
    try {
      await rm(stagedVersionDir, { recursive: true, force: true })
      await mkdir(pluginDir, { recursive: true })
      // Source trees can change while copying. Hashing the destination closes
      // that race before the immutable directory becomes current.
      const stagingRoot = resolve(input.stagingDir)
      await cp(stagingRoot, stagedVersionDir, {
        recursive: true,
        verbatimSymlinks: true,
        // Source-control metadata is not plugin content. Skip it at the copy
        // boundary so a large local repository cannot bypass install limits.
        filter: (source) => {
          const fromRoot = relative(stagingRoot, resolve(source))
          return fromRoot !== '.git' && !fromRoot.startsWith(`.git${sep}`)
        }
      })
      const copiedHash = await hashPluginTree(stagedVersionDir)
      if (!copiedHash.ok || copiedHash.hash !== treeHash.hash) {
        return {
          ok: false,
          error: copiedHash.ok
            ? 'plugin content changed while it was being copied'
            : copiedHash.error
        }
      }
      const copiedManifest = await readInstallManifest(stagedVersionDir, input.hostVersion)
      if (!copiedManifest.ok) {
        return { ok: false, error: `copied ${copiedManifest.error}` }
      }
      if (qualifiedPluginKey(copiedManifest.manifest) !== pluginKey) {
        return { ok: false, error: 'plugin manifest identity changed while it was being staged' }
      }
      manifest = copiedManifest.manifest
      const copiedArtifacts = await validatePluginInstallTree(stagedVersionDir, manifest)
      if (!copiedArtifacts.ok) {
        return { ok: false, error: `copied artifact validation failed: ${copiedArtifacts.error}` }
      }
      await rename(stagedVersionDir, versionDir)
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) }
    } finally {
      await rm(stagedVersionDir, { recursive: true, force: true })
    }
  } else {
    // Never repoint at an existing hash directory without proving its bytes;
    // a previous partial/tampered install must not be revived by reinstall.
    const existingHash = await hashPluginTree(versionDir)
    if (!existingHash.ok || existingHash.hash !== treeHash.hash) {
      return {
        ok: false,
        error: existingHash.ok
          ? 'existing plugin content failed integrity verification'
          : existingHash.error
      }
    }
    const existingManifest = await readInstallManifest(versionDir, input.hostVersion)
    if (!existingManifest.ok) {
      return { ok: false, error: `installed ${existingManifest.error}` }
    }
    if (qualifiedPluginKey(existingManifest.manifest) !== pluginKey) {
      return { ok: false, error: 'installed plugin manifest identity does not match its directory' }
    }
    manifest = existingManifest.manifest
    const existingArtifacts = await validatePluginInstallTree(versionDir, manifest)
    if (!existingArtifacts.ok) {
      return {
        ok: false,
        error: `installed artifact validation failed: ${existingArtifacts.error}`
      }
    }
  }
  const consentFingerprint = fingerprintPluginConsent(manifest, treeHash.hash)
  const entry: PluginLockEntry = {
    pluginKey,
    version: manifest.version,
    source: input.source,
    resolvedCommit: input.resolvedCommit,
    contentHash: treeHash.hash,
    consentFingerprint,
    installedAt: Date.now()
  }
  try {
    await publishPluginInstall({ pluginsDir: input.pluginsDir, pluginDir, entry })
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
  return {
    ok: true,
    pluginKey,
    version: manifest.version,
    contentHash: treeHash.hash,
    consentFingerprint,
    resolvedCommit: input.resolvedCommit
  }
}
