import type { Session } from './session'
import type { TakePendingOutputResult, TerminalSnapshot } from './types'

type FinalCheckpointWriter = (
  sessionId: string,
  snapshot: TerminalSnapshot,
  records: TakePendingOutputResult['records']
) => void

export class TerminalHostShutdownDrain {
  private emptyWaiters = new Set<() => void>()

  constructor(
    private readonly sessions: Map<string, Session>,
    private readonly onFinalCheckpoint?: FinalCheckpointWriter
  ) {}

  async run(timeoutMs: number): Promise<void> {
    this.writeFinalCheckpoints()
    for (const [sessionId, session] of this.sessions) {
      session.detachAllClients()
      if (session.isAlive) {
        session.beginShutdownDrain()
      } else {
        session.disposeSubprocess()
        this.sessions.delete(sessionId)
      }
    }
    this.notifyIfEmpty()
    if (!(await this.waitForEmpty(timeoutMs))) {
      throw new Error(`Timed out waiting for ${this.sessions.size} daemon PTY session(s) to exit`)
    }
  }

  disposeImmediately(): void {
    this.writeFinalCheckpoints()
    for (const session of this.sessions.values()) {
      session.detachAllClients()
      // Why: kill only sessions still proven live. Killing an already-reaped
      // PID can target an unrelated process after POSIX PID reuse.
      if (session.isAlive) {
        session.forceKillAndDisposeSubprocess()
      } else {
        session.disposeSubprocess()
      }
    }
    this.sessions.clear()
    this.notifyIfEmpty()
  }

  writeFinalCheckpoints(): void {
    if (!this.onFinalCheckpoint) {
      return
    }
    // Why: checkpoint synchronously before shutdown starts so pending terminal
    // output survives even when native process teardown later fails.
    for (const [sessionId, session] of this.sessions) {
      if (!session.isAlive) {
        continue
      }
      const take = session.takePendingOutput(true, { teardownSnapshot: true })
      if (take?.snapshot) {
        try {
          this.onFinalCheckpoint(sessionId, take.snapshot, take.records)
        } catch {
          // Best-effort checkpointing must not prevent process cleanup.
        }
      }
    }
  }

  notifyIfEmpty(): void {
    if (this.sessions.size !== 0) {
      return
    }
    for (const waiter of this.emptyWaiters) {
      waiter()
    }
  }

  private waitForEmpty(timeoutMs: number): Promise<boolean> {
    if (this.sessions.size === 0) {
      return Promise.resolve(true)
    }
    return new Promise((resolve) => {
      const waiter = (): void => {
        clearTimeout(timer)
        this.emptyWaiters.delete(waiter)
        resolve(true)
      }
      const timer = setTimeout(() => {
        this.emptyWaiters.delete(waiter)
        resolve(false)
      }, timeoutMs)
      this.emptyWaiters.add(waiter)
    })
  }
}
