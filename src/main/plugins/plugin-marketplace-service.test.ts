import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  PluginMarketplace,
  PluginMarketplaceGitSource
} from '../../shared/plugins/plugin-marketplace'
import { OFFICIAL_MARKETPLACE_GIT_SOURCE } from '../../shared/plugins/plugin-marketplace'
import type { PluginMarketplaceFetchResult } from './plugin-marketplace-fetch'
import { PluginMarketplaceService } from './plugin-marketplace-service'
import {
  marketplaceSourceId,
  type PluginMarketplaceRegisteredSource,
  type PluginMarketplaceStore
} from './plugin-marketplace-store'

const roots: string[] = []

async function tempRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'orca-marketplace-service-'))
  roots.push(root)
  return root
}

function source(url = 'https://github.com/community/plugins.git'): PluginMarketplaceGitSource {
  return { kind: 'git', url, ref: 'main' }
}

function marketplace(
  name = 'Community',
  pluginKey = 'community.theme',
  pluginUrl = 'https://github.com/community/theme.git'
): PluginMarketplace {
  return {
    name,
    owner: name.toLowerCase(),
    plugins: [
      {
        id: pluginKey,
        source: { kind: 'git', url: pluginUrl, ref: 'v1' },
        description: 'A theme',
        categories: ['themes']
      }
    ]
  }
}

function fetched(value = marketplace(), commit = 'a'.repeat(40)): PluginMarketplaceFetchResult {
  return { marketplaceCommit: commit, marketplace: value }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('PluginMarketplaceService', () => {
  it('fetches before registration, then serves browse data from the local snapshot', async () => {
    const fetcher = vi
      .fn<
        (registration: PluginMarketplaceRegisteredSource) => Promise<PluginMarketplaceFetchResult>
      >()
      .mockResolvedValue(fetched())
    const service = new PluginMarketplaceService({ pluginsDataDir: await tempRoot(), fetcher })

    const added = await service.addSource(source())

    expect(added).toMatchObject({ marketplace: { name: 'Community' }, stale: false })
    expect(fetcher).toHaveBeenCalledTimes(1)
    await expect(service.listPlugins()).resolves.toEqual([
      expect.objectContaining({
        marketplaceSourceId: added.id,
        pluginKey: 'community.theme',
        official: false,
        bundled: false
      })
    ])
    await service.listSources()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('keeps and labels the last valid snapshot when a refresh is offline', async () => {
    const fetcher = vi
      .fn<
        (registration: PluginMarketplaceRegisteredSource) => Promise<PluginMarketplaceFetchResult>
      >()
      .mockResolvedValueOnce(fetched())
      .mockRejectedValueOnce(new Error('offline'))
    const service = new PluginMarketplaceService({ pluginsDataDir: await tempRoot(), fetcher })
    const added = await service.addSource(source())

    await expect(service.refreshSource(added.id)).resolves.toMatchObject({
      marketplace: { name: 'Community', resolvedCommit: 'a'.repeat(40) },
      stale: true,
      error: 'offline'
    })
    await expect(service.listPlugins()).resolves.toEqual([
      expect.objectContaining({ pluginKey: 'community.theme' })
    ])
  })

  it('atomically replaces the cache only after a valid refreshed index', async () => {
    const fetcher = vi
      .fn<
        (registration: PluginMarketplaceRegisteredSource) => Promise<PluginMarketplaceFetchResult>
      >()
      .mockResolvedValueOnce(fetched())
      .mockResolvedValueOnce(fetched(marketplace('Updated'), 'b'.repeat(40)))
    const root = await tempRoot()
    const service = new PluginMarketplaceService({ pluginsDataDir: root, fetcher })
    const added = await service.addSource(source())

    await expect(service.refreshSource(added.id)).resolves.toMatchObject({
      marketplace: { name: 'Updated', resolvedCommit: 'b'.repeat(40) },
      stale: false
    })
    await expect(
      new PluginMarketplaceService({ pluginsDataDir: root, fetcher }).listPlugins()
    ).resolves.toEqual([expect.objectContaining({ marketplaceName: 'Updated' })])
  })

  it('does not persist a source whose first fetch fails', async () => {
    const service = new PluginMarketplaceService({
      pluginsDataDir: await tempRoot(),
      fetcher: async () => {
        throw new Error('authentication failed')
      }
    })

    await expect(service.addSource(source())).rejects.toThrow('authentication failed')
    await expect(service.listSources()).resolves.toEqual([])
  })

  it('rejects reserved identities outside the official organization', async () => {
    const service = new PluginMarketplaceService({
      pluginsDataDir: await tempRoot(),
      fetcher: async () =>
        fetched(
          marketplace('Attack', 'community.orca-secrets', 'https://github.com/attacker/x.git')
        )
    })

    await expect(service.addSource(source())).rejects.toThrow(
      'reserved plugin identity community.orca-secrets'
    )
    await expect(service.listSources()).resolves.toEqual([])
  })

  it('derives the Official badge only from the canonical marketplace and source organization', async () => {
    const officialMarketplace: PluginMarketplace = {
      name: 'Orca Plugins',
      owner: 'stablyai',
      plugins: [
        {
          id: 'stablyai.orca-skills',
          source: {
            kind: 'git',
            url: 'git@github.com:stablyai/orca-skills.git',
            ref: 'main'
          },
          categories: ['skills']
        }
      ]
    }
    const service = new PluginMarketplaceService({
      pluginsDataDir: await tempRoot(),
      fetcher: async () => fetched(officialMarketplace)
    })

    await service.addSource(source('https://github.com/stablyai/orca-plugins.git'))

    await expect(service.listPlugins()).resolves.toEqual([
      expect.objectContaining({ pluginKey: 'stablyai.orca-skills', official: true })
    ])
  })

  it('seeds the official marketplace once and keeps it configured across restarts', async () => {
    const root = await tempRoot()
    const officialMarketplace = marketplace(
      'Orca Plugins',
      'stablyai.orca-theme',
      'https://github.com/stablyai/orca-theme.git'
    )
    officialMarketplace.owner = 'stablyai'
    const fetcher = vi.fn(async () => fetched(officialMarketplace))
    const first = new PluginMarketplaceService({ pluginsDataDir: root, fetcher })

    await expect(first.seedOfficialSource()).resolves.toMatchObject({
      official: true,
      marketplace: { name: 'Orca Plugins' }
    })
    await expect(first.seedOfficialSource()).resolves.toMatchObject({ official: true })
    expect(fetcher).toHaveBeenCalledTimes(1)

    const restarted = new PluginMarketplaceService({ pluginsDataDir: root, fetcher })
    await expect(restarted.seedOfficialSource()).resolves.toMatchObject({ official: true })
    expect(fetcher).toHaveBeenCalledTimes(1)
    await expect(restarted.listSources()).resolves.toHaveLength(1)
  })

  it('persists an offline official source for a later refresh and does not remove it', async () => {
    const service = new PluginMarketplaceService({
      pluginsDataDir: await tempRoot(),
      fetcher: async () => {
        throw new Error('offline')
      }
    })

    const seeded = await service.seedOfficialSource()

    expect(seeded).toMatchObject({ official: true, stale: true, marketplace: null })
    await expect(service.removeSource(seeded.id)).rejects.toThrow('cannot be removed')
    await expect(service.listSources()).resolves.toEqual([seeded])
  })

  it('keeps reads usable and allows retry after official seeding rejects', async () => {
    const registered: PluginMarketplaceRegisteredSource = {
      id: marketplaceSourceId(OFFICIAL_MARKETPLACE_GIT_SOURCE),
      source: OFFICIAL_MARKETPLACE_GIT_SOURCE,
      addedAt: 1
    }
    const officialMarketplace = marketplace(
      'Orca Plugins',
      'stablyai.orca-theme',
      'https://github.com/stablyai/orca-theme.git'
    )
    officialMarketplace.owner = 'stablyai'
    const listSources = vi
      .fn<() => Promise<readonly PluginMarketplaceRegisteredSource[]>>()
      .mockRejectedValueOnce(new Error('source store temporarily unavailable'))
      .mockResolvedValue([registered])
    const store = {
      listSources,
      readSnapshot: vi.fn().mockResolvedValue(null),
      writeSnapshot: vi.fn(async ({ source: snapshotSource, ...snapshot }) => ({
        schemaVersion: 1 as const,
        sourceId: snapshotSource.id,
        source: snapshotSource.source,
        fetchedAt: 2,
        ...snapshot
      }))
    } as unknown as PluginMarketplaceStore
    const service = new PluginMarketplaceService({
      pluginsDataDir: await tempRoot(),
      store,
      fetcher: async () => fetched(officialMarketplace)
    })

    await expect(service.seedOfficialSource()).rejects.toThrow('temporarily unavailable')
    await expect(service.listSources()).resolves.toEqual([
      expect.objectContaining({ id: registered.id, official: true })
    ])
    await expect(service.seedOfficialSource()).resolves.toMatchObject({
      marketplace: { name: 'Orca Plugins' },
      official: true
    })
  })

  it('removes source metadata and browse listings together', async () => {
    const service = new PluginMarketplaceService({
      pluginsDataDir: await tempRoot(),
      fetcher: async () => fetched()
    })
    const added = await service.addSource(source())

    await expect(service.removeSource(added.id)).resolves.toBe(true)
    await expect(service.listSources()).resolves.toEqual([])
    await expect(service.listPlugins()).resolves.toEqual([])
  })
})
