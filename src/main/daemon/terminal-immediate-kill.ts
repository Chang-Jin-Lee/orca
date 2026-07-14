import { killWithDescendantSweep } from '../pty-descendant-termination'
import type { Session } from './session'

/** Owns asynchronous agent teardown by session id so every duplicate caller
 * observes the same completion, even if the root exits and is reaped first. */
export class TerminalImmediateKillCoordinator {
  private operations = new Map<string, Promise<void>>()

  get(sessionId: string): Promise<void> | undefined {
    return this.operations.get(sessionId)
  }

  kill(sessionId: string, session: Session, finish: () => void): void | Promise<void> {
    if (!session.launchAgent) {
      finish()
      return
    }
    if (!session.beginTermination()) {
      return
    }

    // Why: agent tool children live in detached process groups the shell's
    // death never signals; the bounded snapshot defers teardown at most ~1s.
    const operation = Promise.resolve(killWithDescendantSweep(session.pid, finish))
    this.operations.set(sessionId, operation)
    const clearOperation = (): void => {
      if (this.operations.get(sessionId) === operation) {
        this.operations.delete(sessionId)
      }
    }
    void operation.then(clearOperation, clearOperation)
    return operation
  }
}
