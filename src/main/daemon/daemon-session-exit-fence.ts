export type PendingDaemonExit = {
  code: number
  sessionGeneration?: string
}

export class DaemonSessionExitFence {
  // Why global-monotonic: forgetting and then reusing the same id must not
  // recreate a revision that an older async list snapshot can mistake as live.
  private nextRevision = 0
  private clearEpoch = 0
  private revisions = new Map<string, number>()
  private admissions = new Map<string, number>()
  private sessionGenerations = new Map<string, string>()
  private pendingExits = new Map<string, PendingDaemonExit>()

  beginAdmission(sessionId: string): () => void {
    const admissionEpoch = this.clearEpoch
    this.bump(sessionId)
    this.admissions.set(sessionId, (this.admissions.get(sessionId) ?? 0) + 1)
    let completed = false
    return () => {
      if (completed) {
        return
      }
      completed = true
      // Why: dispose/fanout clears every owner; a late spawn finally block
      // must not recreate per-session fence state after that terminal event.
      if (admissionEpoch !== this.clearEpoch) {
        return
      }
      const remaining = (this.admissions.get(sessionId) ?? 1) - 1
      if (remaining === 0) {
        this.admissions.delete(sessionId)
      } else {
        this.admissions.set(sessionId, remaining)
      }
      this.bump(sessionId)
    }
  }

  rememberGeneration(sessionId: string, generation: string | undefined): void {
    if (!generation || this.sessionGenerations.get(sessionId) === generation) {
      return
    }
    this.sessionGenerations.set(sessionId, generation)
    this.bump(sessionId)
  }

  isStaleGeneration(sessionId: string, generation: string | undefined): boolean {
    const current = this.sessionGenerations.get(sessionId)
    return generation !== undefined && current !== undefined && generation !== current
  }

  snapshot(sessionId: string): number | undefined {
    return this.revisions.get(sessionId)
  }

  isStable(sessionId: string, snapshot: number | undefined): boolean {
    return !this.admissions.has(sessionId) && this.revisions.get(sessionId) === snapshot
  }

  defer(sessionId: string, exit: PendingDaemonExit): void {
    this.pendingExits.set(sessionId, exit)
  }

  getPending(sessionId: string): PendingDaemonExit | undefined {
    return this.pendingExits.get(sessionId)
  }

  pendingEntries(): [string, PendingDaemonExit][] {
    return [...this.pendingExits]
  }

  clearPending(sessionId: string): void {
    this.pendingExits.delete(sessionId)
  }

  forget(sessionId: string): void {
    this.bump(sessionId)
    this.pendingExits.delete(sessionId)
    this.sessionGenerations.delete(sessionId)
    this.admissions.delete(sessionId)
    this.revisions.delete(sessionId)
  }

  clear(): void {
    this.clearEpoch++
    this.pendingExits.clear()
    this.sessionGenerations.clear()
    this.admissions.clear()
    this.revisions.clear()
  }

  private bump(sessionId: string): void {
    this.revisions.set(sessionId, ++this.nextRevision)
  }
}
