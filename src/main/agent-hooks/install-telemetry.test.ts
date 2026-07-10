// Pins the contract of `recordManagedHookInstallFailure`: it fires the
// `agent_hook_install_failed` telemetry event with the correct agent label and a
// truncated error_message, and it swallows any throw from `track` so a broken
// telemetry client can never break the fail-open installer loop that calls it.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }))

vi.mock('../telemetry/client', () => ({ track: trackMock }))

import { recordManagedHookInstallFailure } from './install-telemetry'

describe('recordManagedHookInstallFailure', () => {
  beforeEach(() => {
    trackMock.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fires agent_hook_install_failed with the correct agent label', () => {
    recordManagedHookInstallFailure('codex', new Error('codex config malformed'))

    expect(trackMock).toHaveBeenCalledTimes(1)
    expect(trackMock).toHaveBeenCalledWith('agent_hook_install_failed', {
      agent: 'codex',
      error_message: 'codex config malformed'
    })
  })

  it('truncates error_message to 200 chars', () => {
    recordManagedHookInstallFailure('gemini', new Error('x'.repeat(500)))

    expect(trackMock).toHaveBeenCalledTimes(1)
    const [, props] = trackMock.mock.calls[0] as [string, { error_message: string }]
    expect(props.error_message.length).toBe(200)
  })

  it('handles non-Error throws', () => {
    recordManagedHookInstallFailure('cursor', 'cursor string failure')

    expect(trackMock).toHaveBeenCalledWith('agent_hook_install_failed', {
      agent: 'cursor',
      error_message: 'cursor string failure'
    })
  })

  it('serializes thrown objects through JSON.stringify', () => {
    recordManagedHookInstallFailure('cursor', { code: 'EACCES', path: '/tmp' })

    expect(trackMock).toHaveBeenCalledTimes(1)
    expect(trackMock).toHaveBeenCalledWith('agent_hook_install_failed', {
      agent: 'cursor',
      error_message: '{"code":"EACCES","path":"/tmp"}'
    })
  })

  it('does not throw on an undefined error (regression for JSON.stringify undefined)', () => {
    expect(() => recordManagedHookInstallFailure('cursor', undefined)).not.toThrow()
    expect(trackMock).toHaveBeenCalledTimes(1)
    const [eventName, props] = trackMock.mock.calls[0] as [string, { error_message: string }]
    expect(eventName).toBe('agent_hook_install_failed')
    expect(typeof props.error_message).toBe('string')
  })

  it('swallows a throw from track so the caller stays fail-open', () => {
    trackMock.mockImplementationOnce(() => {
      throw new Error('telemetry blew up')
    })
    expect(() =>
      recordManagedHookInstallFailure('claude', new Error('claude failed'))
    ).not.toThrow()
  })
})
