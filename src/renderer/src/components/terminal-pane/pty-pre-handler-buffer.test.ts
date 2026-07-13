import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bufferPreHandlerPtyData,
  bufferPreHandlerPtyExit,
  clearPreHandlerPtyState,
  drainPreHandlerPtyData,
  drainPreHandlerPtyExit,
  reconcilePreHandlerPtyExitAfterOverflow
} from './pty-pre-handler-buffer'

const RESCAN_PTY_ID = 'pty-pre-handler-rescan'
const TRIM_PTY_ID = 'pty-pre-handler-trim'

describe('pre-handler PTY buffer', () => {
  afterEach(() => {
    clearPreHandlerPtyState(RESCAN_PTY_ID)
    clearPreHandlerPtyState(TRIM_PTY_ID)
    for (let index = 0; index <= 64; index += 1) {
      clearPreHandlerPtyState(`pty-exit-${index}`)
    }
  })

  it('does not rescan historical chunks while buffering small startup output', () => {
    const originalReduce = Array.prototype.reduce

    try {
      Object.defineProperty(Array.prototype, 'reduce', {
        configurable: true,
        writable: true,
        value() {
          throw new Error('Array.reduce should not be used by the pre-handler PTY buffer')
        }
      })
      for (let index = 0; index < 4_096; index += 1) {
        bufferPreHandlerPtyData(RESCAN_PTY_ID, 'x')
      }
    } finally {
      Object.defineProperty(Array.prototype, 'reduce', {
        configurable: true,
        writable: true,
        value: originalReduce
      })
    }

    const drained: string[] = []
    drainPreHandlerPtyData(RESCAN_PTY_ID, (data) => drained.push(data))
    expect(drained).toHaveLength(4_096)
  })

  it('does not shift the live array while trimming a capped backlog', () => {
    const originalShift = Array.prototype.shift
    const originalWarn = console.warn

    try {
      console.warn = () => {}
      Object.defineProperty(Array.prototype, 'shift', {
        configurable: true,
        writable: true,
        value() {
          throw new Error('Array.shift should not be used by the pre-handler PTY buffer')
        }
      })
      for (let index = 0; index < 2_048; index += 1) {
        bufferPreHandlerPtyData(TRIM_PTY_ID, 'x'.repeat(1_024))
      }
    } finally {
      console.warn = originalWarn
      Object.defineProperty(Array.prototype, 'shift', {
        configurable: true,
        writable: true,
        value: originalShift
      })
    }

    const drained: string[] = []
    drainPreHandlerPtyData(TRIM_PTY_ID, (data) => drained.push(data))
    expect(drained).toHaveLength(512)
    expect(drained.join('')).toHaveLength(512 * 1_024)
  })

  it('bounds exits that arrive after their owner unregistered', () => {
    for (let index = 0; index <= 64; index += 1) {
      bufferPreHandlerPtyExit(`pty-exit-${index}`, index)
    }
    const oldest = vi.fn()
    const newest = vi.fn()

    drainPreHandlerPtyExit('pty-exit-0', oldest)
    drainPreHandlerPtyExit('pty-exit-64', newest)

    expect(oldest).not.toHaveBeenCalled()
    expect(newest).toHaveBeenCalledWith(64)
  })

  it('reconciles an evicted pending exit with one targeted liveness readback', async () => {
    for (let index = 0; index <= 64; index += 1) {
      bufferPreHandlerPtyExit(`pty-exit-${index}`, index)
    }
    const handler = vi.fn()
    const hasPty = vi.fn(async () => false)

    for (let index = 0; index < 100; index += 1) {
      reconcilePreHandlerPtyExitAfterOverflow(
        `unrelated-live-pty-${index}`,
        hasPty,
        handler,
        () => true
      )
    }
    reconcilePreHandlerPtyExitAfterOverflow('pty-exit-0', hasPty, handler, () => true)
    await Promise.resolve()

    expect(hasPty).toHaveBeenCalledOnce()
    expect(hasPty).toHaveBeenCalledWith('pty-exit-0')
    expect(handler).toHaveBeenCalledWith(-1)
  })

  it('retains an evicted exit through unknown liveness and retries authoritative proof', async () => {
    for (let index = 0; index <= 64; index += 1) {
      bufferPreHandlerPtyExit(`pty-exit-${index}`, index)
    }
    const handler = vi.fn()
    const hasPty = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(false)

    reconcilePreHandlerPtyExitAfterOverflow('pty-exit-0', hasPty, handler, () => true)
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(handler).not.toHaveBeenCalled()

    reconcilePreHandlerPtyExitAfterOverflow('pty-exit-0', hasPty, handler, () => true)
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(hasPty).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledWith(-1)
  })

  it('keeps a replacement probe owned when an older same-id probe settles', async () => {
    const target = 'pty-reused-probe-owner'
    const oldPrefix = 'pty-reused-probe-old-'
    const newPrefix = 'pty-reused-probe-new-'
    const resolvers: ((alive: boolean | null) => void)[] = []
    const hasPty = vi.fn(
      () =>
        new Promise<boolean | null>((resolve) => {
          resolvers.push(resolve)
        })
    )
    const handler = vi.fn()
    try {
      bufferPreHandlerPtyExit(target, 1)
      for (let index = 0; index < 64; index += 1) {
        bufferPreHandlerPtyExit(`${oldPrefix}${index}`, index)
      }
      reconcilePreHandlerPtyExitAfterOverflow(target, hasPty, handler, () => true)

      clearPreHandlerPtyState(target)
      bufferPreHandlerPtyExit(target, 2)
      for (let index = 0; index < 64; index += 1) {
        bufferPreHandlerPtyExit(`${newPrefix}${index}`, index)
      }
      reconcilePreHandlerPtyExitAfterOverflow(target, hasPty, handler, () => true)
      expect(hasPty).toHaveBeenCalledTimes(2)

      resolvers[0]?.(true)
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      reconcilePreHandlerPtyExitAfterOverflow(target, hasPty, handler, () => true)

      expect(hasPty).toHaveBeenCalledTimes(2)
      expect(handler).not.toHaveBeenCalled()
      resolvers[1]?.(true)
      await Promise.resolve()
    } finally {
      clearPreHandlerPtyState(target)
      for (let index = 0; index < 64; index += 1) {
        clearPreHandlerPtyState(`${oldPrefix}${index}`)
        clearPreHandlerPtyState(`${newPrefix}${index}`)
      }
    }
  })

  it('caps eviction tombstones at exactly 1024 ids without probing unrelated PTYs', async () => {
    const prefix = 'pty-exact-tombstone-cap-'
    const hasPty = vi.fn(async () => false)
    const handler = vi.fn()
    try {
      // 64 payload slots + 1,024 tombstones + 1 eviction of the oldest tombstone.
      for (let index = 0; index <= 1_088; index += 1) {
        bufferPreHandlerPtyExit(`${prefix}${index}`, index)
      }

      reconcilePreHandlerPtyExitAfterOverflow(`${prefix}0`, hasPty, handler, () => true)
      reconcilePreHandlerPtyExitAfterOverflow(`${prefix}1`, hasPty, handler, () => true)
      reconcilePreHandlerPtyExitAfterOverflow(
        'unrelated-after-exact-cap',
        hasPty,
        handler,
        () => true
      )
      await Promise.resolve()

      expect(hasPty).toHaveBeenCalledOnce()
      expect(hasPty).toHaveBeenCalledWith(`${prefix}1`)
      expect(handler).toHaveBeenCalledOnce()
    } finally {
      for (let index = 0; index <= 1_088; index += 1) {
        clearPreHandlerPtyState(`${prefix}${index}`)
      }
      clearPreHandlerPtyState('unrelated-after-exact-cap')
    }
  })
})
