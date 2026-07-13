import {
  OFFICIAL_MARKETPLACE_OWNER,
  isOfficialMarketplaceGitSource,
  isOfficialOrganizationGitSource,
  isOfficialPluginIdentity,
  isReservedPluginIdentity,
  pluginMarketplaceGitSourceSchema,
  type PluginMarketplaceEntry,
  type PluginMarketplaceGitSource
} from '../../shared/plugins/plugin-marketplace'
import {
  fetchPluginMarketplace,
  type PluginMarketplaceFetchResult
} from './plugin-marketplace-fetch'
import {
  marketplaceSourceId,
  PluginMarketplaceStore,
  type PluginMarketplaceCachedSnapshot,
  type PluginMarketplaceRegisteredSource
} from './plugin-marketplace-store'
import type { PluginKillListEntry } from '../../shared/plugins/plugin-kill-list'

export type PluginMarketplaceSourceState = {
  id: string
  source: PluginMarketplaceGitSource
  addedAt: number
  marketplace: {
    name: string
    owner: string
    resolvedCommit: string
    fetchedAt: number
  } | null
  stale: boolean
  error?: string
}

export type PluginMarketplaceListing = {
  marketplaceSourceId: string
  marketplaceName: string
  marketplaceOwner: string
  marketplaceCommit: string
  pluginKey: string
  source: PluginMarketplaceEntry['source']
  description?: string
  categories: string[]
  official: boolean
  bundled: boolean
  blockedByKillList?: { reason: string; advisoryUrl?: string }
}

type MarketplaceFetcher = (
  source: PluginMarketplaceRegisteredSource
) => Promise<PluginMarketplaceFetchResult>

export class PluginMarketplaceService {
  private readonly store: PluginMarketplaceStore
  private readonly fetcher: MarketplaceFetcher
  private readonly getKillListEntry: (pluginKey: string) => PluginKillListEntry | null
  private readonly refreshChains = new Map<string, Promise<PluginMarketplaceSourceState>>()

  constructor(options: {
    pluginsDataDir: string
    fetcher?: MarketplaceFetcher
    store?: PluginMarketplaceStore
    getKillListEntry?: (pluginKey: string) => PluginKillListEntry | null
  }) {
    this.store = options.store ?? new PluginMarketplaceStore(options.pluginsDataDir)
    this.fetcher = options.fetcher ?? fetchPluginMarketplace
    this.getKillListEntry = options.getKillListEntry ?? (() => null)
  }

  async listSources(): Promise<PluginMarketplaceSourceState[]> {
    const sources = await this.store.listSources()
    return Promise.all(
      sources.map(async (source) => {
        try {
          return this.stateFromSnapshot(source, await this.store.readSnapshot(source.id), false)
        } catch (error) {
          return this.stateFromSnapshot(source, null, true, errorMessage(error))
        }
      })
    )
  }

  async addSource(source: PluginMarketplaceGitSource): Promise<PluginMarketplaceSourceState> {
    const parsedSource = pluginMarketplaceGitSourceSchema.parse(source)
    const sourceId = marketplaceSourceId(parsedSource)
    const existing = (await this.store.listSources()).find((candidate) => candidate.id === sourceId)
    const candidate: PluginMarketplaceRegisteredSource = existing ?? {
      id: sourceId,
      source: parsedSource,
      addedAt: Date.now()
    }
    const fetched = await this.fetchAndValidate(candidate)
    const registered = existing ?? (await this.store.addSource(parsedSource, candidate.addedAt))
    try {
      const snapshot = await this.store.writeSnapshot({ source: registered, ...fetched })
      return this.stateFromSnapshot(registered, snapshot, false)
    } catch (error) {
      if (!existing) {
        await this.store.removeSource(registered.id).catch(() => undefined)
      }
      throw error
    }
  }

  async removeSource(sourceId: string): Promise<boolean> {
    return this.store.removeSource(sourceId)
  }

  async refreshSource(sourceId: string): Promise<PluginMarketplaceSourceState> {
    const previous = this.refreshChains.get(sourceId) ?? Promise.resolve(null)
    const refresh = previous.catch(() => null).then(() => this.performRefresh(sourceId))
    this.refreshChains.set(sourceId, refresh)
    try {
      return await refresh
    } finally {
      if (this.refreshChains.get(sourceId) === refresh) {
        this.refreshChains.delete(sourceId)
      }
    }
  }

  async refreshAll(): Promise<PluginMarketplaceSourceState[]> {
    const sources = await this.store.listSources()
    return Promise.all(sources.map((source) => this.refreshSource(source.id)))
  }

  async listPlugins(): Promise<PluginMarketplaceListing[]> {
    const states = await this.listSnapshots()
    return states
      .flatMap(({ source, snapshot }) =>
        snapshot.marketplace.plugins.map((entry) => this.listingFromEntry(source, snapshot, entry))
      )
      .sort((left, right) =>
        `${left.pluginKey}\0${left.marketplaceSourceId}`.localeCompare(
          `${right.pluginKey}\0${right.marketplaceSourceId}`
        )
      )
  }

  async findPlugin(
    marketplaceSourceId: string,
    pluginKey: string
  ): Promise<PluginMarketplaceListing | null> {
    const source = (await this.store.listSources()).find(
      (candidate) => candidate.id === marketplaceSourceId
    )
    if (!source) {
      return null
    }
    const snapshot = await this.store.readSnapshot(source.id)
    const entry = snapshot?.marketplace.plugins.find((plugin) => plugin.id === pluginKey)
    return snapshot && entry ? this.listingFromEntry(source, snapshot, entry) : null
  }

  private async performRefresh(sourceId: string): Promise<PluginMarketplaceSourceState> {
    const source = (await this.store.listSources()).find((candidate) => candidate.id === sourceId)
    if (!source) {
      throw new Error(`unknown marketplace source: ${sourceId}`)
    }
    try {
      const fetched = await this.fetchAndValidate(source)
      const snapshot = await this.store.writeSnapshot({ source, ...fetched })
      return this.stateFromSnapshot(source, snapshot, false)
    } catch (error) {
      const cached = await this.store.readSnapshot(source.id).catch(() => null)
      if (!cached) {
        throw error
      }
      return this.stateFromSnapshot(source, cached, true, errorMessage(error))
    }
  }

  private async fetchAndValidate(
    source: PluginMarketplaceRegisteredSource
  ): Promise<PluginMarketplaceFetchResult> {
    const fetched = await this.fetcher(source)
    validateMarketplaceProvenance(source, fetched)
    return fetched
  }

  private async listSnapshots(): Promise<
    { source: PluginMarketplaceRegisteredSource; snapshot: PluginMarketplaceCachedSnapshot }[]
  > {
    const sources = await this.store.listSources()
    const snapshots = await Promise.all(
      sources.map(async (source) => ({
        source,
        snapshot: await this.store.readSnapshot(source.id)
      }))
    )
    return snapshots.filter(
      (
        candidate
      ): candidate is {
        source: PluginMarketplaceRegisteredSource
        snapshot: PluginMarketplaceCachedSnapshot
      } => candidate.snapshot !== null
    )
  }

  private listingFromEntry(
    source: PluginMarketplaceRegisteredSource,
    snapshot: PluginMarketplaceCachedSnapshot,
    entry: PluginMarketplaceEntry
  ): PluginMarketplaceListing {
    const official =
      isOfficialMarketplaceGitSource(source.source.url) &&
      snapshot.marketplace.owner.toLowerCase() === OFFICIAL_MARKETPLACE_OWNER &&
      isOfficialPluginIdentity(entry.id) &&
      isOfficialOrganizationGitSource(entry.source.url)
    const blocked = this.getKillListEntry(entry.id)
    return {
      marketplaceSourceId: source.id,
      marketplaceName: snapshot.marketplace.name,
      marketplaceOwner: snapshot.marketplace.owner,
      marketplaceCommit: snapshot.marketplaceCommit,
      pluginKey: entry.id,
      source: entry.source,
      ...(entry.description ? { description: entry.description } : {}),
      categories: entry.categories,
      official,
      bundled: false,
      ...(blocked
        ? {
            blockedByKillList: {
              reason: blocked.reason,
              ...(blocked.advisoryUrl ? { advisoryUrl: blocked.advisoryUrl } : {})
            }
          }
        : {})
    }
  }

  private stateFromSnapshot(
    source: PluginMarketplaceRegisteredSource,
    snapshot: PluginMarketplaceCachedSnapshot | null,
    stale: boolean,
    error?: string
  ): PluginMarketplaceSourceState {
    return {
      id: source.id,
      source: source.source,
      addedAt: source.addedAt,
      marketplace: snapshot
        ? {
            name: snapshot.marketplace.name,
            owner: snapshot.marketplace.owner,
            resolvedCommit: snapshot.marketplaceCommit,
            fetchedAt: snapshot.fetchedAt
          }
        : null,
      stale,
      ...(error ? { error } : {})
    }
  }
}

function validateMarketplaceProvenance(
  source: PluginMarketplaceRegisteredSource,
  fetched: PluginMarketplaceFetchResult
): void {
  if (
    isOfficialMarketplaceGitSource(source.source.url) &&
    fetched.marketplace.owner.toLowerCase() !== OFFICIAL_MARKETPLACE_OWNER
  ) {
    throw new Error('official marketplace metadata has an unexpected owner')
  }
  for (const entry of fetched.marketplace.plugins) {
    if (isReservedPluginIdentity(entry.id) && !isOfficialOrganizationGitSource(entry.source.url)) {
      throw new Error(
        `reserved plugin identity ${entry.id} must resolve to the stablyai organization`
      )
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
