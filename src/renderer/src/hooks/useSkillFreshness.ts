import { useCallback, useEffect, useState } from 'react'
import type { SkillFreshnessInventory } from '../../../shared/skill-freshness'
import { useMountedRef } from './useMountedRef'

const INSTALLED_SKILLS_CHANGED_EVENT = 'orca:installed-agent-skills-changed'
// Why: window focus fires on every alt-tab, and each scan re-reads and re-hashes
// every installed package; a just-completed scan stays authoritative briefly.
const FOCUS_RESCAN_COOLDOWN_MS = 15_000
let cachedInventory: SkillFreshnessInventory | null = null
let pendingInventory: Promise<SkillFreshnessInventory> | null = null
let invalidationRevision = 0
let completedRevision = -1
let lastCompletedScanAt = 0
let sharedInvalidationPending = false

async function loadInventory(force: boolean): Promise<SkillFreshnessInventory> {
  if (force) {
    invalidationRevision += 1
  }
  const targetRevision = invalidationRevision
  for (;;) {
    if (cachedInventory && completedRevision >= targetRevision) {
      return cachedInventory
    }
    if (!pendingInventory) {
      const requestRevision = invalidationRevision
      const request = window.api.skills
        .freshnessInventory()
        .then((inventory) => {
          cachedInventory = inventory
          completedRevision = Math.max(completedRevision, requestRevision)
          lastCompletedScanAt = Date.now()
          return inventory
        })
        .finally(() => {
          if (pendingInventory === request) {
            pendingInventory = null
          }
        })
      pendingInventory = request
    }
    await pendingInventory
  }
}

export type SkillFreshnessState = {
  inventory: SkillFreshnessInventory | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useSkillFreshness(): SkillFreshnessState {
  const [inventory, setInventory] = useState<SkillFreshnessInventory | null>(cachedInventory)
  const [loading, setLoading] = useState(cachedInventory === null)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useMountedRef()

  const refresh = useCallback(
    async (force = true): Promise<void> => {
      setLoading(true)
      try {
        const next = await loadInventory(force)
        if (mountedRef.current) {
          setInventory(next)
          setError(null)
        }
      } catch (cause) {
        if (mountedRef.current) {
          setError(cause instanceof Error ? cause.message : 'Could not inspect Orca skills.')
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    },
    [mountedRef]
  )

  useEffect(() => {
    void refresh(false)
  }, [refresh])

  useEffect(() => {
    const invalidate = (respectCooldown: boolean): void => {
      if (respectCooldown && Date.now() - lastCompletedScanAt < FOCUS_RESCAN_COOLDOWN_MS) {
        return
      }
      // Why: the nudge and the panel both listen for the same events; one forced
      // rescan per event refreshes every consumer through the shared request.
      const alreadyInvalidated = sharedInvalidationPending
      sharedInvalidationPending = true
      queueMicrotask(() => {
        sharedInvalidationPending = false
      })
      cachedInventory = null
      void refresh(!alreadyInvalidated)
    }
    const onFocus = (): void => invalidate(true)
    const onInstalledSkillsChanged = (): void => invalidate(false)
    window.addEventListener('focus', onFocus)
    window.addEventListener(INSTALLED_SKILLS_CHANGED_EVENT, onInstalledSkillsChanged)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(INSTALLED_SKILLS_CHANGED_EVENT, onInstalledSkillsChanged)
    }
  }, [refresh])

  return { inventory, loading, error, refresh: () => refresh(true) }
}

export const _skillFreshnessCacheForTests = {
  reset(): void {
    cachedInventory = null
    pendingInventory = null
    invalidationRevision = 0
    completedRevision = -1
    lastCompletedScanAt = 0
    sharedInvalidationPending = false
  }
}
