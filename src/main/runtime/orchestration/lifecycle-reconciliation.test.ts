import { afterEach, describe, expect, it } from 'vitest'
import { OrchestrationDb } from './db'
import { reconcileLifecycleMessage } from './lifecycle-reconciliation'

describe('lifecycle reconciliation', () => {
  let db: OrchestrationDb

  afterEach(() => db?.close())

  it('completes an active dispatch from payload IDs after its terminal handle is reminted', () => {
    db = new OrchestrationDb(':memory:')
    const task = db.createTask({ spec: 'work' })
    const dispatch = db.createDispatchContext(task.id, 'term_before_restart')
    const logs: string[] = []
    const message = db.insertMessage({
      from: 'term_after_restart',
      to: 'term_coordinator',
      subject: 'Done',
      type: 'worker_done',
      payload: JSON.stringify({ taskId: task.id, dispatchId: dispatch.id })
    })

    expect(reconcileLifecycleMessage(db, message, (line) => logs.push(line))).toEqual({
      action: 'completed',
      taskId: task.id,
      dispatchId: dispatch.id
    })
    expect(db.getTask(task.id)?.status).toBe('completed')
    expect(db.getDispatchContextById(dispatch.id)?.status).toBe('completed')
    expect(logs.some((line) => line.includes('accepting payload provenance'))).toBe(true)
  })

  it('suppresses same-dispatch heartbeats once worker_done is reconciled', () => {
    db = new OrchestrationDb(':memory:')
    const task = db.createTask({ spec: 'work' })
    const dispatch = db.createDispatchContext(task.id, 'term_worker')
    const otherTask = db.createTask({ spec: 'other work' })
    const otherDispatch = db.createDispatchContext(otherTask.id, 'term_other')
    const insertHeartbeat = (dispatchId: string, from: string) =>
      db.insertMessage({
        from,
        to: 'term_coordinator',
        subject: 'alive',
        type: 'heartbeat',
        payload: JSON.stringify({ dispatchId })
      })
    const staleHeartbeat = insertHeartbeat(dispatch.id, 'term_worker')
    const otherHeartbeat = insertHeartbeat(otherDispatch.id, 'term_other')
    reconcileLifecycleMessage(db, staleHeartbeat)
    reconcileLifecycleMessage(db, otherHeartbeat)
    const done = db.insertMessage({
      from: 'term_worker',
      to: 'term_coordinator',
      subject: 'Done',
      type: 'worker_done',
      payload: JSON.stringify({ taskId: task.id, dispatchId: dispatch.id })
    })

    reconcileLifecycleMessage(db, done)

    expect(db.getUnreadMessages('term_coordinator', ['heartbeat']).map((row) => row.id)).toEqual([
      otherHeartbeat.id
    ])
    const archived = db
      .getAllMessagesForHandle('term_coordinator')
      .find((row) => row.id === staleHeartbeat.id)
    expect(archived).toMatchObject({ read: 1 })
    expect(archived?.delivered_at).not.toBeNull()

    const lateHeartbeat = insertHeartbeat(dispatch.id, 'term_worker')
    expect(reconcileLifecycleMessage(db, lateHeartbeat)).toEqual({ action: 'ignored' })
    expect(db.getMessageById(lateHeartbeat.id)).toMatchObject({ read: 1 })
    expect(db.getMessageById(lateHeartbeat.id)?.delivered_at).not.toBeNull()
  })
})
