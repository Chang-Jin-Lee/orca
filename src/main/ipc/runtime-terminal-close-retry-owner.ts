import type { RuntimeRpcResponse } from '../../shared/runtime-rpc-envelope'
import type { Store } from '../persistence'
import {
  callRuntimeEnvironment,
  getRuntimeEnvironmentStatus
} from './runtime-environment-transport-routing'

type RetainedTerminalClose = {
  generation: number
  environmentId: string
  handle: string
  runtimeId: string | null
  attempts: number
  nextRetryAt: number
  inFlight: Promise<RuntimeRpcResponse<unknown>> | null
}

const retainedCloses = new Map<string, RetainedTerminalClose>()
const MAX_BACKOFF_MS = 30_000
let retryTimer: ReturnType<typeof setTimeout> | null = null
let store: Store | null = null
let userDataPath = ''
let ownerGeneration = 0

function key(environmentId: string, handle: string): string {
  return `${environmentId}\0${handle}`
}

function schedule(): void {
  if (retryTimer) {
    clearTimeout(retryTimer)
  }
  retryTimer = null
  let nextRetryAt = Number.POSITIVE_INFINITY
  for (const close of retainedCloses.values()) {
    if (!close.inFlight) {
      nextRetryAt = Math.min(nextRetryAt, close.nextRetryAt)
    }
  }
  if (!Number.isFinite(nextRetryAt)) {
    return
  }
  retryTimer = setTimeout(
    () => {
      retryTimer = null
      const now = Date.now()
      for (const close of retainedCloses.values()) {
        if (!close.inFlight && close.nextRetryAt <= now) {
          void attempt(close)
        }
      }
    },
    Math.max(0, nextRetryAt - Date.now())
  )
}

function attempt(close: RetainedTerminalClose): Promise<RuntimeRpcResponse<unknown>> {
  if (close.inFlight) {
    return close.inFlight
  }
  const closeKey = key(close.environmentId, close.handle)
  const noOpResponse = (runtimeId?: string | null) => ({
    id: 'terminal.close',
    ok: true as const,
    result: { close: false, reason: 'retry_owner_replaced' },
    _meta: { runtimeId: runtimeId ?? close.runtimeId ?? 'unknown-runtime' }
  })
  const request = getRuntimeEnvironmentStatus(userDataPath, close.environmentId)
    .then((status) => {
      if (close.generation !== ownerGeneration) {
        return noOpResponse(status._meta?.runtimeId)
      }
      if (!status.ok) {
        throw Object.assign(new Error(status.error.message), { response: status })
      }
      const currentRuntimeId = status._meta.runtimeId
      if (close.runtimeId && close.runtimeId !== currentRuntimeId) {
        retainedCloses.delete(closeKey)
        store?.removePendingRuntimeTerminalClose?.(close.environmentId, close.handle)
        return {
          id: 'terminal.close',
          ok: true as const,
          result: { close: false, reason: 'runtime_replaced' },
          _meta: { runtimeId: currentRuntimeId }
        }
      }
      if (!close.runtimeId) {
        close.runtimeId = currentRuntimeId
        store?.upsertPendingRuntimeTerminalClose?.({
          environmentId: close.environmentId,
          handle: close.handle,
          runtimeId: currentRuntimeId,
          requestedAt: Date.now()
        })
      }
      return callRuntimeEnvironment(userDataPath, close.environmentId, 'terminal.close', {
        terminal: close.handle,
        expectedRuntimeId: close.runtimeId
      })
    })
    .then((response) => {
      if (close.generation !== ownerGeneration) {
        return noOpResponse(response._meta?.runtimeId)
      }
      if (!response.ok) {
        const responseRuntimeId = response._meta?.runtimeId
        if (close.runtimeId && responseRuntimeId && responseRuntimeId !== close.runtimeId) {
          retainedCloses.delete(closeKey)
          store?.removePendingRuntimeTerminalClose?.(close.environmentId, close.handle)
          return {
            id: 'terminal.close',
            ok: true as const,
            result: { close: false, reason: 'runtime_replaced' },
            _meta: { runtimeId: responseRuntimeId }
          }
        }
        throw Object.assign(new Error(response.error.message), { response })
      }
      retainedCloses.delete(closeKey)
      if (typeof store?.removePendingRuntimeTerminalClose === 'function') {
        store.removePendingRuntimeTerminalClose(close.environmentId, close.handle)
      }
      return response
    })
    .catch((error: unknown) => {
      if (close.generation !== ownerGeneration) {
        return noOpResponse()
      }
      close.attempts += 1
      close.nextRetryAt =
        Date.now() + Math.min(MAX_BACKOFF_MS, 250 * 2 ** Math.min(close.attempts - 1, 7))
      if (close.attempts <= 2 || close.attempts === 8) {
        console.warn('[runtime-environments] retained terminal close failed:', error)
      }
      const response = (error as { response?: RuntimeRpcResponse<unknown> }).response
      if (response) {
        return response
      }
      throw error
    })
    .finally(() => {
      if (close.generation !== ownerGeneration) {
        return
      }
      if (close.inFlight === request) {
        close.inFlight = null
      }
      schedule()
    })
  close.inFlight = request
  return request
}

function retain(
  environmentId: string,
  handle: string,
  runtimeId?: string | null
): RetainedTerminalClose {
  const closeKey = key(environmentId, handle)
  let close = retainedCloses.get(closeKey)
  if (!close) {
    close = {
      generation: ownerGeneration,
      environmentId,
      handle,
      runtimeId: runtimeId ?? null,
      attempts: 0,
      nextRetryAt: 0,
      inFlight: null
    }
    retainedCloses.set(closeKey, close)
    if (typeof store?.upsertPendingRuntimeTerminalClose === 'function') {
      store.upsertPendingRuntimeTerminalClose({
        environmentId,
        handle,
        ...(runtimeId ? { runtimeId } : {}),
        requestedAt: Date.now()
      })
    }
  } else if (!close.runtimeId && runtimeId) {
    close.runtimeId = runtimeId
  }
  return close
}

export function initializeRuntimeTerminalCloseRetryOwner(
  nextStore: Store,
  nextUserDataPath: string
): void {
  ownerGeneration += 1
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  retainedCloses.clear()
  store = nextStore
  userDataPath = nextUserDataPath
  const persisted =
    typeof store.getPendingRuntimeTerminalCloses === 'function'
      ? store.getPendingRuntimeTerminalCloses()
      : []
  for (const close of persisted) {
    retain(close.environmentId, close.handle, close.runtimeId)
  }
  schedule()
}

export function closeRuntimeTerminalWithRetryOwnership(
  environmentId: string,
  handle: string,
  runtimeId?: string | null
): Promise<RuntimeRpcResponse<unknown>> {
  return attempt(retain(environmentId, handle, runtimeId))
}

export function releaseRuntimeTerminalClosesForEnvironment(environmentId: string): void {
  for (const [closeKey, close] of retainedCloses) {
    if (close.environmentId === environmentId) {
      retainedCloses.delete(closeKey)
    }
  }
  if (typeof store?.removePendingRuntimeTerminalClosesForEnvironment === 'function') {
    store.removePendingRuntimeTerminalClosesForEnvironment(environmentId)
  }
  schedule()
}
