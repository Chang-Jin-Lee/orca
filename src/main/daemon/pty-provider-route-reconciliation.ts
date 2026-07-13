import type { IPtyProvider, PtyProcessInfo } from '../providers/types'

export async function listProviderProcessesAndReconcileRoutes<T extends IPtyProvider>(
  providers: readonly T[],
  routes: Map<string, T>
): Promise<PtyProcessInfo[]> {
  const routesAtStart = [...routes]
  const listings = await Promise.all(
    providers.map(async (provider) => ({ provider, sessions: await provider.listProcesses() }))
  )
  const liveIdsByProvider = new Map(
    listings.map(({ provider, sessions }) => [provider, new Set(sessions.map(({ id }) => id))])
  )
  for (const [id, provider] of routesAtStart) {
    // Why: spawn/exit can mutate routing while remote listings are in flight.
    // Never let that older snapshot delete a route rebound to another owner.
    if (routes.get(id) === provider && !liveIdsByProvider.get(provider)?.has(id)) {
      routes.delete(id)
    }
  }
  return listings.flatMap(({ sessions }) => sessions)
}

export function providerSessionIds<T>(routes: Map<string, T>, provider: T): string[] {
  return [...routes].filter(([, routedProvider]) => routedProvider === provider).map(([id]) => id)
}
