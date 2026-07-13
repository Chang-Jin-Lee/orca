import { afterEach, describe, expect, it, vi } from 'vitest'
import { isLocalPtyProcessProvablyExited } from './local-pty-process-exit-proof'

describe('isLocalPtyProcessProvablyExited', () => {
  afterEach(() => vi.restoreAllMocks())

  it('accepts only ESRCH as process-death proof', () => {
    vi.spyOn(process, 'kill').mockImplementation(() => {
      throw Object.assign(new Error('gone'), { code: 'ESRCH' })
    })

    expect(isLocalPtyProcessProvablyExited(123)).toBe(true)
  })

  it('treats EPERM as a still-live process', () => {
    vi.spyOn(process, 'kill').mockImplementation(() => {
      throw Object.assign(new Error('denied'), { code: 'EPERM' })
    })

    expect(isLocalPtyProcessProvablyExited(123)).toBe(false)
  })

  it('rejects invalid pids without probing', () => {
    const kill = vi.spyOn(process, 'kill')

    expect(isLocalPtyProcessProvablyExited(0)).toBe(false)
    expect(kill).not.toHaveBeenCalled()
  })
})
