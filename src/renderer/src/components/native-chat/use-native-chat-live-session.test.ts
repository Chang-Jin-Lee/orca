// @vitest-environment happy-dom

import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NativeChatMessage } from '../../../../shared/native-chat-types'
import { useAppStore } from '@/store'
import { mergeNativeChatLiveSession } from './native-chat-live-status'
import { NATIVE_CHAT_INITIAL_LIMIT } from './native-chat-pagination'

// Mock the session transport so the hook's IO is observable and controllable
// per owner id. Each distinct owner gets its own read/subscribe/unsubscribe mocks.
const { transportFactory, getMockTransport, resetMockTransports } = vi.hoisted(() => {
  type MockTransport = {
    readSession: ReturnType<typeof vi.fn>
    subscribe: ReturnType<typeof vi.fn>
    unsubscribe: ReturnType<typeof vi.fn>
  }
  const transports = new Map<string | null, MockTransport>()
  const getMockTransport = (ownerId: string | null): MockTransport => {
    let transport = transports.get(ownerId)
    if (!transport) {
      const unsubscribe = vi.fn()
      transport = {
        unsubscribe,
        readSession: vi.fn().mockResolvedValue({ messages: [] }),
        subscribe: vi.fn(() => unsubscribe)
      }
      transports.set(ownerId, transport)
    }
    return transport
  }
  return {
    getMockTransport,
    resetMockTransports: () => transports.clear(),
    transportFactory: vi.fn((ownerId: string | null) => getMockTransport(ownerId))
  }
})

vi.mock('./native-chat-session-transport', () => ({
  getNativeChatSessionTransport: transportFactory
}))

// Imported after vi.mock is hoisted, so it binds to the mocked transport.
import {
  useNativeChatLiveSession,
  type NativeChatLiveSession,
  type UseNativeChatLiveSessionArgs
} from './use-native-chat-live-session'

function assistant(id: string, text: string): NativeChatMessage {
  return {
    id,
    role: 'assistant',
    blocks: [{ type: 'text', text }],
    timestamp: 2,
    source: 'transcript'
  }
}

function user(id: string, text: string): NativeChatMessage {
  return { id, role: 'user', blocks: [{ type: 'text', text }], timestamp: 1, source: 'transcript' }
}

describe('mergeNativeChatLiveSession', () => {
  it("surfaces live 'working' before the assistant turn lands in the transcript", () => {
    const session = mergeNativeChatLiveSession({
      sources: { transcript: [user('u-1', 'do a thing')] },
      sessionId: 'sess',
      agent: 'claude',
      hookState: 'working'
    })
    expect(session.status).toBe('working')
    expect(session.messages).toHaveLength(1)
  })

  it("clears 'working' once the assistant message flushes to the transcript", () => {
    const session = mergeNativeChatLiveSession({
      sources: { transcript: [user('u-1', 'do a thing'), assistant('a-1', 'done')] },
      sessionId: 'sess',
      agent: 'claude',
      hookState: 'working'
    })
    expect(session.status).toBe('ready')
  })

  it('leaves completed states (done/waiting/blocked) on the derived status', () => {
    const session = mergeNativeChatLiveSession({
      sources: { transcript: [user('u-1', 'hi')] },
      sessionId: 'sess',
      agent: 'claude',
      hookState: 'done'
    })
    expect(session.status).toBe('ready')
  })

  it('honors loading and error overrides outright', () => {
    expect(
      mergeNativeChatLiveSession({
        sources: { transcript: [] },
        sessionId: null,
        agent: 'claude',
        hookState: 'working',
        loading: true
      }).status
    ).toBe('loading')

    const errored = mergeNativeChatLiveSession({
      sources: { transcript: [] },
      sessionId: 'sess',
      agent: 'claude',
      hookState: null,
      error: 'unreadable'
    })
    expect(errored.status).toBe('error')
    expect(errored.error).toBe('unreadable')
  })

  it('assembles an empty transcript with no live work as empty', () => {
    const session = mergeNativeChatLiveSession({
      sources: { transcript: [] },
      sessionId: 'sess',
      agent: 'claude',
      hookState: null
    })
    expect(session.status).toBe('empty')
  })
})

describe('useNativeChatLiveSession — transport routing', () => {
  const AGENT = 'claude' as const
  const SESSION = 'sess-1'
  const PANE = 'pane-1'
  const roots: Root[] = []
  let latest: NativeChatLiveSession | null = null

  function Probe(props: UseNativeChatLiveSessionArgs): null {
    latest = useNativeChatLiveSession(props)
    return null
  }

  async function flush(): Promise<void> {
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
  }

  async function render(props: UseNativeChatLiveSessionArgs): Promise<Root> {
    const container = document.createElement('div')
    const root = createRoot(container)
    roots.push(root)
    await act(async () => {
      root.render(createElement(Probe, props))
    })
    await flush()
    return root
  }

  async function rerender(root: Root, props: UseNativeChatLiveSessionArgs): Promise<void> {
    await act(async () => {
      root.render(createElement(Probe, props))
    })
    await flush()
  }

  beforeEach(() => {
    useAppStore.setState({ agentStatusByPaneKey: {} })
  })

  afterEach(() => {
    for (const root of roots.splice(0)) {
      act(() => root.unmount())
    }
    latest = null
    vi.clearAllMocks()
    resetMockTransports()
  })

  it('routes the initial read and subscribe through the runtime transport', async () => {
    await render({ paneKey: PANE, agent: AGENT, sessionId: SESSION, runtimeEnvironmentId: 'env-1' })

    expect(transportFactory).toHaveBeenCalledWith('env-1')
    const transport = getMockTransport('env-1')
    expect(transport.readSession).toHaveBeenCalledWith(
      AGENT,
      SESSION,
      expect.any(Number),
      undefined
    )
    expect(transport.subscribe).toHaveBeenCalledOnce()
  })

  it('re-subscribes against the new owner on an owner flip (R5)', async () => {
    const root = await render({
      paneKey: PANE,
      agent: AGENT,
      sessionId: SESSION,
      runtimeEnvironmentId: 'env-1'
    })
    const first = getMockTransport('env-1')

    await rerender(root, {
      paneKey: PANE,
      agent: AGENT,
      sessionId: SESSION,
      runtimeEnvironmentId: 'env-2'
    })
    const second = getMockTransport('env-2')

    expect(first.unsubscribe).toHaveBeenCalledOnce()
    expect(second.subscribe).toHaveBeenCalledOnce()
  })

  it('tears down the subscription on unmount (no watcher leak)', async () => {
    const root = await render({
      paneKey: PANE,
      agent: AGENT,
      sessionId: SESSION,
      runtimeEnvironmentId: 'env-1'
    })
    const transport = getMockTransport('env-1')

    await act(async () => {
      root.unmount()
    })

    expect(transport.unsubscribe).toHaveBeenCalledOnce()
  })

  it('surfaces a runtime read error in the error phase (R4 end-to-end)', async () => {
    getMockTransport('env-1').readSession.mockResolvedValueOnce({ error: 'runtime too old' })

    await render({ paneKey: PANE, agent: AGENT, sessionId: SESSION, runtimeEnvironmentId: 'env-1' })
    await flush()

    expect(latest?.status).toBe('error')
    expect(latest?.error).toBe('runtime too old')
  })

  it('retries a notFound read on backoff instead of surfacing an error (#8401)', async () => {
    vi.useFakeTimers()
    try {
      const transport = getMockTransport('env-1')
      // First read races the lazy first flush → retryable notFound; the flush
      // lands before the backoff retry, which then reads the real transcript.
      transport.readSession
        .mockResolvedValueOnce({ error: 'No transcript found', notFound: true })
        .mockResolvedValueOnce({ messages: [assistant('a-1', 'flushed')] })

      await render({
        paneKey: PANE,
        agent: AGENT,
        sessionId: SESSION,
        runtimeEnvironmentId: 'env-1'
      })

      // notFound must NOT become an error: the pane stays loading and retries.
      expect(latest?.status).toBe('loading')
      expect(latest?.status).not.toBe('error')
      expect(transport.readSession).toHaveBeenCalledTimes(1)

      // Advance past the first backoff step so the retry fires and resolves.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000)
      })

      expect(transport.readSession).toHaveBeenCalledTimes(2)
      expect(latest?.status).toBe('ready')
      expect(latest?.messages.map((m) => m.id)).toContain('a-1')
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops the notFound retry after unmount (no stale read against the old session)', async () => {
    vi.useFakeTimers()
    try {
      const transport = getMockTransport('env-1')
      // Every read races the lazy flush → notFound, so the backoff keeps retrying
      // until teardown clears the pending timer.
      transport.readSession.mockResolvedValue({ error: 'No transcript found', notFound: true })

      const root = await render({
        paneKey: PANE,
        agent: AGENT,
        sessionId: SESSION,
        runtimeEnvironmentId: 'env-1'
      })
      expect(transport.readSession).toHaveBeenCalledTimes(1)

      await act(async () => {
        root.unmount()
      })

      // Advancing well past several backoff steps must fire NO further read: an
      // uncleared retry timer would leak a stale readSession against the old id.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000)
      })
      expect(transport.readSession).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('never calls the transport when there is no session id', async () => {
    await render({ paneKey: PANE, agent: AGENT, sessionId: null, runtimeEnvironmentId: 'env-1' })

    const transport = getMockTransport('env-1')
    expect(transport.readSession).not.toHaveBeenCalled()
    expect(transport.subscribe).not.toHaveBeenCalled()
  })

  it('uses the local transport when the owner is null (unchanged behavior, R6)', async () => {
    await render({ paneKey: PANE, agent: AGENT, sessionId: SESSION })

    expect(transportFactory).toHaveBeenCalledWith(null)
    const transport = getMockTransport(null)
    expect(transport.readSession).toHaveBeenCalledOnce()
    expect(transport.subscribe).toHaveBeenCalledOnce()
  })

  it('discards a load-earlier resolve from the previous owner after a flip', async () => {
    // Fill the initial window so hasMore is true and load-earlier can fire.
    const many = Array.from({ length: NATIVE_CHAT_INITIAL_LIMIT }, (_unused, n) =>
      assistant(`m-${n}`, 't')
    )
    const first = getMockTransport('env-1')
    first.readSession.mockResolvedValueOnce({ messages: many })
    let resolveEarlier: (result: { messages: NativeChatMessage[] }) => void = () => {}
    first.readSession.mockImplementationOnce(
      () => new Promise((resolve) => (resolveEarlier = resolve))
    )

    const root = await render({
      paneKey: PANE,
      agent: AGENT,
      sessionId: SESSION,
      runtimeEnvironmentId: 'env-1'
    })
    // Kick off load-earlier against env-1, then flip the owner before it resolves.
    await act(async () => {
      latest?.loadEarlier()
    })
    await rerender(root, {
      paneKey: PANE,
      agent: AGENT,
      sessionId: SESSION,
      runtimeEnvironmentId: 'env-2'
    })
    // The stale env-1 page resolves now; the transport-identity guard must drop it
    // so it can't paint the previous host's history into the env-2 pane.
    await act(async () => {
      resolveEarlier({ messages: [assistant('stale', 'from-env-1')] })
      await Promise.resolve()
    })

    expect(latest?.messages.map((m) => m.id)).not.toContain('stale')
  })
})
