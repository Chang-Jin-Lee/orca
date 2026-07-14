// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SkillFreshnessInventory } from '../../../shared/skill-freshness'
import {
  _skillFreshnessCacheForTests,
  type SkillFreshnessState,
  useSkillFreshness
} from './useSkillFreshness'

function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => {
    resolve = complete
  })
  return { promise, resolve }
}

function inventory(scannedAt: number): SkillFreshnessInventory {
  return { schemaVersion: 1, installations: [], eligibleUpdateNames: [], scannedAt }
}

let root: Root | null = null
let container: HTMLDivElement | null = null
let state: SkillFreshnessState | null = null

function Probe(): null {
  state = useSkillFreshness()
  return null
}

describe('useSkillFreshness', () => {
  beforeEach(() => {
    _skillFreshnessCacheForTests.reset()
    state = null
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount())
    }
    root = null
    container?.remove()
    container = null
  })

  it('runs a follow-up scan when invalidated during an in-flight request', async () => {
    const first = deferred<SkillFreshnessInventory>()
    const second = deferred<SkillFreshnessInventory>()
    const freshnessInventory = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    window.api = { skills: { freshnessInventory } } as never

    await act(async () => root?.render(<Probe />))
    expect(freshnessInventory).toHaveBeenCalledTimes(1)

    await act(async () => window.dispatchEvent(new Event('focus')))
    await act(async () => first.resolve(inventory(1)))
    expect(freshnessInventory).toHaveBeenCalledTimes(2)

    await act(async () => second.resolve(inventory(2)))
    expect(state?.inventory?.scannedAt).toBe(2)
  })

  it('skips focus rescans inside the cooldown but honors install-change events', async () => {
    const first = deferred<SkillFreshnessInventory>()
    const second = deferred<SkillFreshnessInventory>()
    const freshnessInventory = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    window.api = { skills: { freshnessInventory } } as never

    await act(async () => root?.render(<Probe />))
    await act(async () => first.resolve(inventory(1)))
    expect(freshnessInventory).toHaveBeenCalledTimes(1)

    await act(async () => window.dispatchEvent(new Event('focus')))
    expect(freshnessInventory).toHaveBeenCalledTimes(1)

    await act(async () => window.dispatchEvent(new Event('orca:installed-agent-skills-changed')))
    await act(async () => second.resolve(inventory(2)))
    expect(freshnessInventory).toHaveBeenCalledTimes(2)
    expect(state?.inventory?.scannedAt).toBe(2)
  })

  it('coalesces multiple consumers into one rescan per invalidation event', async () => {
    const first = deferred<SkillFreshnessInventory>()
    const second = deferred<SkillFreshnessInventory>()
    const freshnessInventory = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValue(second.promise)
    window.api = { skills: { freshnessInventory } } as never

    await act(async () =>
      root?.render(
        <>
          <Probe />
          <Probe />
        </>
      )
    )
    await act(async () => first.resolve(inventory(1)))
    expect(freshnessInventory).toHaveBeenCalledTimes(1)

    await act(async () => window.dispatchEvent(new Event('orca:installed-agent-skills-changed')))
    await act(async () => second.resolve(inventory(2)))
    expect(freshnessInventory).toHaveBeenCalledTimes(2)
  })
})
