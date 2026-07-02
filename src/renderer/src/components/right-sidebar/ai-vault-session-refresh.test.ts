// @vitest-environment happy-dom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiVaultListResult } from '../../../../shared/ai-vault-types'
import {
  resetAiVaultForcedRescanThrottleForTest,
  useAiVaultSessionRefresh
} from './ai-vault-session-refresh'

const EMPTY_RESULT: AiVaultListResult = {
  sessions: [],
  issues: [],
  scannedAt: '2026-07-01T00:00:00.000Z'
}

const listSessionsMock = vi.fn<(args: unknown) => Promise<AiVaultListResult>>()

const roots: Root[] = []
let latest: ReturnType<typeof useAiVaultSessionRefresh> | null = null

function HookProbe(props: { scopePaths: readonly string[] }): null {
  latest = useAiVaultSessionRefresh(props.scopePaths)
  return null
}

async function renderHook(scopePaths: readonly string[] = []): Promise<void> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  roots.push(root)
  await act(async () => {
    root.render(createElement(HookProbe, { scopePaths }))
  })
}

async function flushMicrotasks(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function dispatch(target: EventTarget, type: string): Promise<void> {
  await act(async () => {
    target.dispatchEvent(new Event(type))
  })
  await flushMicrotasks()
}

let nowMs = 1_000_000

function advanceClock(ms: number): void {
  nowMs += ms
}

beforeEach(() => {
  listSessionsMock.mockReset().mockResolvedValue(EMPTY_RESULT)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-only window.api shim
  ;(window as any).api = { aiVault: { listSessions: listSessionsMock } }
  nowMs = 1_000_000
  vi.spyOn(Date, 'now').mockImplementation(() => nowMs)
  resetAiVaultForcedRescanThrottleForTest()
})

afterEach(() => {
  roots.splice(0).forEach((root) => act(() => root.unmount()))
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('useAiVaultSessionRefresh refocus behavior', () => {
  it('bypasses the scan cache on mount so panel entry shows new sessions', async () => {
    await renderHook()
    await flushMicrotasks()

    expect(listSessionsMock).toHaveBeenCalledTimes(1)
    expect(listSessionsMock.mock.calls[0]?.[0]).toMatchObject({ force: true })
  })

  it('re-scans with a cache bypass on refocus once the throttle allows it', async () => {
    await renderHook()
    await flushMicrotasks()
    expect(listSessionsMock).toHaveBeenCalledTimes(1)

    // Within the throttle window a refocus still refreshes, but from cache.
    await dispatch(window, 'focus')
    expect(listSessionsMock).toHaveBeenCalledTimes(2)
    expect(listSessionsMock.mock.calls[1]?.[0]).toMatchObject({ force: false })

    advanceClock(6_000)
    await dispatch(window, 'focus')
    expect(listSessionsMock).toHaveBeenCalledTimes(3)
    expect(listSessionsMock.mock.calls[2]?.[0]).toMatchObject({ force: true })
  })

  it('re-scans when the document becomes visible again', async () => {
    await renderHook()
    await flushMicrotasks()
    expect(listSessionsMock).toHaveBeenCalledTimes(1)

    await dispatch(document, 'visibilitychange')

    expect(listSessionsMock).toHaveBeenCalledTimes(2)
  })

  it('ignores focus/visibility events while the document is hidden', async () => {
    await renderHook()
    await flushMicrotasks()
    expect(listSessionsMock).toHaveBeenCalledTimes(1)

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    await dispatch(document, 'visibilitychange')
    await dispatch(window, 'focus')

    expect(listSessionsMock).toHaveBeenCalledTimes(1)
  })

  it('stops listening after unmount', async () => {
    await renderHook()
    await flushMicrotasks()
    expect(listSessionsMock).toHaveBeenCalledTimes(1)

    roots.splice(0).forEach((root) => act(() => root.unmount()))
    await dispatch(window, 'focus')
    await dispatch(document, 'visibilitychange')

    expect(listSessionsMock).toHaveBeenCalledTimes(1)
  })

  it('does not raise the loading flag for refocus refreshes', async () => {
    await renderHook()
    await flushMicrotasks()

    let resolveScan: ((result: AiVaultListResult) => void) | null = null
    listSessionsMock.mockImplementationOnce(
      () => new Promise<AiVaultListResult>((resolve) => (resolveScan = resolve))
    )
    await dispatch(window, 'focus')

    expect(listSessionsMock).toHaveBeenCalledTimes(2)
    expect(latest?.loading).toBe(false)

    await act(async () => {
      resolveScan?.({ ...EMPTY_RESULT, scannedAt: '2026-07-01T00:00:01.000Z' })
    })
    await flushMicrotasks()
    expect(latest?.loading).toBe(false)
  })

  it('skips state updates when a refocus refresh returns the cached snapshot', async () => {
    await renderHook()
    await flushMicrotasks()
    const firstResult = latest?.scanResult

    // Same scannedAt = the main-process cache replayed the applied snapshot.
    listSessionsMock.mockResolvedValueOnce({ ...EMPTY_RESULT })
    await dispatch(window, 'focus')
    expect(latest?.scanResult).toBe(firstResult)

    listSessionsMock.mockResolvedValueOnce({
      ...EMPTY_RESULT,
      scannedAt: '2026-07-01T00:00:02.000Z'
    })
    await dispatch(window, 'focus')
    expect(latest?.scanResult).not.toBe(firstResult)
  })

  it('keeps the manual refresh button forcing a cache bypass', async () => {
    await renderHook()
    await flushMicrotasks()

    await act(async () => {
      await latest?.refresh({ force: true })
    })

    expect(listSessionsMock).toHaveBeenLastCalledWith(expect.objectContaining({ force: true }))
  })

  it('counts a manual force refresh against the rescan throttle', async () => {
    await renderHook()
    await flushMicrotasks()

    advanceClock(6_000)
    await act(async () => {
      await latest?.refresh({ force: true })
    })

    // The button just scanned; an immediate refocus reuses that fresh cache.
    await dispatch(window, 'focus')
    expect(listSessionsMock).toHaveBeenLastCalledWith(expect.objectContaining({ force: false }))
  })
})
