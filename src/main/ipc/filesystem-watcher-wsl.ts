/** WSL file watching with native Linux events and a recursive scan fallback. */
import type { WebContents } from 'electron'
import type { Event as WatcherEvent } from '@parcel/watcher'
import { queueWatcherEvents } from './filesystem-watcher-event-batch'
import {
  createWslNativeEngine,
  createWslSnapshotEngine,
  type WslEngineContext,
  type WslWatchEngine
} from './filesystem-watcher-wsl-engine'
import { isWslDistroRunning } from './filesystem-watcher-wsl-runtime'
import { parseWslUncPath } from '../../shared/wsl-paths'

export type WatcherSubscription = {
  unsubscribe(): Promise<void>
}

type DebouncedBatch = {
  events: WatcherEvent[]
  overflowed: boolean
  timer: ReturnType<typeof setTimeout> | null
  firstEventAt: number
}

export type WatchedRoot = {
  subscription: WatcherSubscription
  listeners: Map<number, WebContents>
  batch: DebouncedBatch
}

export type WslWatcherDeps = {
  ignoreDirs: string[]
  scheduleBatchFlush: (rootKey: string, root: WatchedRoot) => void
}

const RESTART_DELAYS_MS = [500, 1_000, 2_000, 5_000, 10_000] as const
const STABLE_ENGINE_MS = 30_000
const STOPPED_DISTRO_RECHECK_MS = 5_000

function markOverflow(root: WatchedRoot): void {
  if (root.batch.timer) {
    clearTimeout(root.batch.timer)
    root.batch.timer = null
  }
  root.batch.events = []
  root.batch.overflowed = true
}

export async function createWslWatcher(
  rootKey: string,
  worktreePath: string,
  deps: WslWatcherDeps
): Promise<WatchedRoot> {
  const wsl = parseWslUncPath(worktreePath)
  if (!wsl) {
    throw new Error(`Not a WSL path: ${worktreePath}`)
  }

  const root: WatchedRoot = {
    subscription: null!,
    listeners: new Map(),
    batch: { events: [], overflowed: false, timer: null, firstEventAt: 0 }
  }
  let activeEngine: WslWatchEngine | null = null
  let startingEngine: WslWatchEngine | null = null
  let disposed = false
  let nativeUnavailable = false
  let restartAttempt = 0
  let restartTimer: ReturnType<typeof setTimeout> | null = null
  let stabilityTimer: ReturnType<typeof setTimeout> | null = null
  const maximumRestartDelay = RESTART_DELAYS_MS.at(-1) ?? 10_000

  const context: WslEngineContext = {
    distro: wsl.distro,
    linuxPath: wsl.linuxPath,
    worktreePath,
    ignoreDirs: deps.ignoreDirs,
    onEvents: (events) => {
      queueWatcherEvents(root.batch, events)
      deps.scheduleBatchFlush(rootKey, root)
    },
    onOverflow: () => {
      markOverflow(root)
      deps.scheduleBatchFlush(rootKey, root)
    }
  }

  const startEngine = async (): Promise<WslWatchEngine> => {
    if (!nativeUnavailable) {
      const native = createWslNativeEngine(context)
      startingEngine = native
      try {
        await native.ready
        startingEngine = null
        return native
      } catch (error) {
        startingEngine = null
        nativeUnavailable = true
        native.stop()
        if (disposed) {
          throw error
        }
      }
    }
    const snapshot = createWslSnapshotEngine(context)
    startingEngine = snapshot
    try {
      await snapshot.ready
    } catch (error) {
      snapshot.stop()
      throw error
    } finally {
      startingEngine = null
    }
    return snapshot
  }

  let installEngine: () => Promise<void>
  const scheduleRestart = (delay: number): void => {
    restartTimer = setTimeout(() => {
      restartTimer = null
      void isWslDistroRunning(wsl.distro).then((running) => {
        if (disposed) {
          return
        }
        if (!running) {
          // Why: restarting a watcher through `wsl.exe -d` would undo an
          // intentional WSL shutdown; the running-distro query does not wake it.
          scheduleRestart(STOPPED_DISTRO_RECHECK_MS)
          return
        }
        void installEngine().catch(() => {
          if (!disposed) {
            scheduleRestart(maximumRestartDelay)
          }
        })
      })
    }, delay)
  }

  installEngine = async (): Promise<void> => {
    const engine = await startEngine()
    if (disposed) {
      engine.stop()
      return
    }
    activeEngine = engine
    stabilityTimer = setTimeout(() => {
      restartAttempt = 0
    }, STABLE_ENGINE_MS)
    void engine.stopped.then(() => {
      if (disposed || activeEngine !== engine) {
        return
      }
      activeEngine = null
      if (stabilityTimer) {
        clearTimeout(stabilityTimer)
      }
      markOverflow(root)
      deps.scheduleBatchFlush(rootKey, root)
      const delay =
        RESTART_DELAYS_MS.at(Math.min(restartAttempt, RESTART_DELAYS_MS.length - 1)) ??
        maximumRestartDelay
      restartAttempt += 1
      // Why: WSL shutdowns and transient distro failures must not permanently
      // orphan an active renderer subscription.
      scheduleRestart(delay)
    })
  }

  await installEngine()
  root.subscription = {
    unsubscribe: async () => {
      disposed = true
      if (restartTimer) {
        clearTimeout(restartTimer)
      }
      if (stabilityTimer) {
        clearTimeout(stabilityTimer)
      }
      startingEngine?.stop()
      startingEngine = null
      activeEngine?.stop()
      activeEngine = null
    }
  }
  return root
}
