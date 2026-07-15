import { createHash } from 'node:crypto'
import { appendFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createSshRelayRuntimeArchive } from './ssh-relay-runtime-archive.mjs'
import { expectedSshRelayRuntimeClosureEntries } from './ssh-relay-runtime-closure.mjs'
import { sshRelayRuntimeCompatibility } from './ssh-relay-runtime-compatibility.mjs'
import { computeSshRelayRuntimeContentId } from './ssh-relay-runtime-identity.mjs'
import {
  verifySshRelayRuntimePostSignMetadata,
  writeSshRelayRuntimePostSignMetadata
} from './ssh-relay-runtime-post-sign-metadata.mjs'

const temporaryDirectories = []
const SOURCE_DATE_EPOCH = 1_788_739_200
const GIT_COMMIT = '1'.repeat(40)

function sha256(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`
}

function toolchain() {
  return Object.fromEntries(
    [
      'buildNode',
      'bundledNode',
      'compiler',
      'buildSystem',
      'python',
      'archive',
      'nodeAddonApi',
      'nodeGyp',
      'strip'
    ].map((name, index) => [
      name,
      { version: `${name} version`, sha256: `sha256:${(index + 6).toString(16).repeat(64)}` }
    ])
  )
}

async function runtimeFixture() {
  const root = await mkdtemp(join(tmpdir(), 'ssh-relay-post-sign-metadata-'))
  temporaryDirectories.push(root)
  const runtimeRoot = join(root, 'runtime')
  const outputDirectory = join(root, 'output')
  await Promise.all([mkdir(runtimeRoot), mkdir(outputDirectory)])
  const tupleId = 'linux-x64-glibc'
  const entries = []
  for (const entry of expectedSshRelayRuntimeClosureEntries(tupleId)) {
    const path = join(runtimeRoot, ...entry.path.split('/'))
    if (entry.type === 'directory') {
      await mkdir(path, { recursive: true, mode: entry.mode })
      entries.push(entry)
      continue
    }
    const bytes = Buffer.from(`final signed fixture:${entry.path}`)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, bytes, { mode: entry.mode })
    entries.push({ ...entry, size: bytes.length, sha256: sha256(bytes) })
  }
  const base = {
    identitySchemaVersion: 1,
    tupleId,
    os: 'linux',
    architecture: 'x64',
    compatibility: sshRelayRuntimeCompatibility[tupleId],
    nodeVersion: '24.18.0',
    dependencies: { nodePtyVersion: '1.1.0', parcelWatcherVersion: '2.5.6' },
    entries
  }
  const files = entries.filter((entry) => entry.type === 'file')
  const finalIdentity = {
    ...base,
    contentId: computeSshRelayRuntimeContentId(base),
    fileCount: files.length,
    expandedSize: files.reduce((total, entry) => total + entry.size, 0)
  }
  const archive = await createSshRelayRuntimeArchive({
    runtimeRoot,
    outputDirectory,
    identity: finalIdentity,
    sourceDateEpoch: SOURCE_DATE_EPOCH
  })
  return {
    root,
    runtimeRoot,
    outputDirectory,
    finalIdentity,
    archive,
    nodeRelease: {
      baseUrl: 'https://nodejs.org/dist/v24.18.0',
      archives: {
        [tupleId]: {
          name: 'node-v24.18.0-linux-x64.tar.xz',
          sha256: 'b'.repeat(64)
        }
      },
      signature: {
        key: {
          sourceUrl: 'https://github.com/nodejs/release-keys/raw/commit/gpg/key.asc',
          sha256: 'c'.repeat(64)
        }
      }
    },
    builder: `https://github.com/stablyai/orca/blob/${GIT_COMMIT}/.github/workflows/ssh-relay-runtime-artifacts.yml`,
    runner: {
      os: 'Linux',
      architecture: 'X64',
      environment: 'github-hosted',
      requestedLabel: 'ubuntu-24.04',
      image: { os: 'ubuntu24', version: '20260705.232.1' }
    },
    toolchain: toolchain()
  }
}

function writerInput(fixture) {
  return {
    runtimeRoot: fixture.runtimeRoot,
    outputDirectory: fixture.outputDirectory,
    finalIdentity: fixture.finalIdentity,
    archive: fixture.archive,
    nodeRelease: fixture.nodeRelease,
    sourceDateEpoch: SOURCE_DATE_EPOCH,
    gitCommit: GIT_COMMIT,
    builder: fixture.builder,
    runner: fixture.runner,
    toolchain: fixture.toolchain
  }
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

describe('SSH relay runtime post-sign metadata', () => {
  it('regenerates exact SBOM and provenance from the verified final tree', async () => {
    const fixture = await runtimeFixture()

    const result = await writeSshRelayRuntimePostSignMetadata(writerInput(fixture))
    const sbom = JSON.parse(await readFile(join(fixture.outputDirectory, result.sbom.name), 'utf8'))
    const provenance = JSON.parse(
      await readFile(join(fixture.outputDirectory, result.provenance.name), 'utf8')
    )

    expect((await readdir(fixture.outputDirectory)).toSorted()).toEqual(
      [fixture.archive.name, result.sbom.name, result.provenance.name].toSorted()
    )
    expect(result).toMatchObject({
      tupleId: fixture.finalIdentity.tupleId,
      contentId: fixture.finalIdentity.contentId,
      archive: {
        name: fixture.archive.name,
        size: fixture.archive.size,
        sha256: fixture.archive.sha256
      }
    })
    expect(sbom.documentNamespace).toBe(
      `https://github.com/stablyai/orca/ssh-relay-runtime/spdx/${fixture.archive.sha256.slice('sha256:'.length)}`
    )
    expect(sbom.packages.find((entry) => entry.name === 'orca-ssh-relay').versionInfo).toBe(
      fixture.finalIdentity.contentId
    )
    expect(sbom.files).toHaveLength(fixture.finalIdentity.fileCount)
    expect(provenance.subject).toEqual([
      {
        name: fixture.archive.name,
        digest: { sha256: fixture.archive.sha256.slice('sha256:'.length) }
      }
    ])
    expect(provenance.predicate.buildDefinition.externalParameters).toMatchObject({
      tuple: fixture.finalIdentity.tupleId,
      nodeVersion: fixture.finalIdentity.nodeVersion,
      contentId: fixture.finalIdentity.contentId,
      sourceDateEpoch: SOURCE_DATE_EPOCH
    })
    expect(provenance.predicate.runDetails.byproducts).toContainEqual(
      expect.objectContaining({ name: 'native-files', content: expect.any(Array) })
    )
  })

  it('rejects tree or archive mutation and removes partial metadata', async () => {
    const tree = await runtimeFixture()
    await appendFile(join(tree.runtimeRoot, 'relay.js'), ':mutated')
    await expect(writeSshRelayRuntimePostSignMetadata(writerInput(tree))).rejects.toThrow(
      /tree.*integrity|integrity.*tree/i
    )
    expect(await readdir(tree.outputDirectory)).toEqual([tree.archive.name])

    const archive = await runtimeFixture()
    await writeFile(archive.archive.path, 'mutated archive')
    await expect(writeSshRelayRuntimePostSignMetadata(writerInput(archive))).rejects.toThrow(
      /archive|digest|size/i
    )
    expect(await readdir(archive.outputDirectory)).toEqual([archive.archive.name])
  })

  it('makes tuple consumers reject stale SBOM and provenance bindings', async () => {
    const sbomFixture = await runtimeFixture()
    const sbomAssets = await writeSshRelayRuntimePostSignMetadata(writerInput(sbomFixture))
    const sbomPath = join(sbomFixture.outputDirectory, sbomAssets.sbom.name)
    const sbom = JSON.parse(await readFile(sbomPath, 'utf8'))
    sbom.packages.find((entry) => entry.name === 'orca-ssh-relay').versionInfo =
      `sha256:${'e'.repeat(64)}`
    await writeFile(sbomPath, `${JSON.stringify(sbom)}\n`)
    await expect(
      verifySshRelayRuntimePostSignMetadata({
        finalIdentity: sbomFixture.finalIdentity,
        archive: sbomFixture.archive,
        sbomPath,
        provenancePath: join(sbomFixture.outputDirectory, sbomAssets.provenance.name)
      })
    ).rejects.toThrow(/SBOM.*content|content.*SBOM/i)

    const provenanceFixture = await runtimeFixture()
    const provenanceAssets = await writeSshRelayRuntimePostSignMetadata(
      writerInput(provenanceFixture)
    )
    const provenancePath = join(provenanceFixture.outputDirectory, provenanceAssets.provenance.name)
    const provenance = JSON.parse(await readFile(provenancePath, 'utf8'))
    provenance.subject[0].digest.sha256 = 'd'.repeat(64)
    await writeFile(provenancePath, `${JSON.stringify(provenance)}\n`)
    await expect(
      verifySshRelayRuntimePostSignMetadata({
        finalIdentity: provenanceFixture.finalIdentity,
        archive: provenanceFixture.archive,
        sbomPath: join(provenanceFixture.outputDirectory, provenanceAssets.sbom.name),
        provenancePath
      })
    ).rejects.toThrow(/provenance.*archive|archive.*provenance/i)

    provenance.subject[0].digest.sha256 = provenanceFixture.archive.sha256.slice('sha256:'.length)
    provenance.predicate.buildDefinition.externalParameters.contentId = `sha256:${'c'.repeat(64)}`
    await writeFile(provenancePath, `${JSON.stringify(provenance)}\n`)
    await expect(
      verifySshRelayRuntimePostSignMetadata({
        finalIdentity: provenanceFixture.finalIdentity,
        archive: provenanceFixture.archive,
        sbomPath: join(provenanceFixture.outputDirectory, provenanceAssets.sbom.name),
        provenancePath
      })
    ).rejects.toThrow(/provenance.*content|content.*provenance/i)

    provenance.predicate.buildDefinition.externalParameters.contentId =
      provenanceFixture.finalIdentity.contentId
    provenance.predicate.runDetails.byproducts[0].content[0].sha256 = `sha256:${'b'.repeat(64)}`
    await writeFile(provenancePath, `${JSON.stringify(provenance)}\n`)
    await expect(
      verifySshRelayRuntimePostSignMetadata({
        finalIdentity: provenanceFixture.finalIdentity,
        archive: provenanceFixture.archive,
        sbomPath: join(provenanceFixture.outputDirectory, provenanceAssets.sbom.name),
        provenancePath
      })
    ).rejects.toThrow(/provenance.*native|native.*provenance/i)
  })

  it('requires an exclusive archive input and honors cancellation', async () => {
    const extra = await runtimeFixture()
    await writeFile(join(extra.outputDirectory, 'unexpected.json'), '{}')
    await expect(writeSshRelayRuntimePostSignMetadata(writerInput(extra))).rejects.toThrow(
      /exclusive|unexpected|exact/i
    )

    const cancelled = await runtimeFixture()
    const controller = new AbortController()
    controller.abort(new Error('cancel post-sign metadata'))
    await expect(
      writeSshRelayRuntimePostSignMetadata({
        ...writerInput(cancelled),
        signal: controller.signal
      })
    ).rejects.toThrow(/cancel post-sign metadata/i)
    expect(await readdir(cancelled.outputDirectory)).toEqual([cancelled.archive.name])
  })
})
