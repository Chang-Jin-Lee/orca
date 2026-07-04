import { describe, expect, it } from 'vitest'
import {
  getPerfUpdateModifierLabel,
  getUpdateCheckClickOptions
} from './update-check-click-options'

function clickEvent(overrides: Partial<Pick<MouseEvent, 'ctrlKey' | 'metaKey' | 'shiftKey'>>) {
  return {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...overrides
  } as Pick<MouseEvent, 'ctrlKey' | 'metaKey' | 'shiftKey'>
}

describe('getUpdateCheckClickOptions', () => {
  it('uses Cmd on macOS for perf prerelease checks', () => {
    expect(getUpdateCheckClickOptions(clickEvent({ metaKey: true }), true)).toEqual({
      includePrerelease: false,
      includePerfPrerelease: true
    })
    expect(getUpdateCheckClickOptions(clickEvent({ ctrlKey: true }), true)).toEqual({
      includePrerelease: false,
      includePerfPrerelease: false
    })
  })

  it('uses Ctrl outside macOS for perf prerelease checks', () => {
    expect(getUpdateCheckClickOptions(clickEvent({ ctrlKey: true }), false)).toEqual({
      includePrerelease: false,
      includePerfPrerelease: true
    })
    expect(getUpdateCheckClickOptions(clickEvent({ metaKey: true }), false)).toEqual({
      includePrerelease: false,
      includePerfPrerelease: false
    })
  })

  it('keeps Shift as the RC prerelease modifier', () => {
    expect(
      getUpdateCheckClickOptions(clickEvent({ shiftKey: true, ctrlKey: true }), false)
    ).toEqual({
      includePrerelease: true,
      includePerfPrerelease: true
    })
  })

  it('formats the perf modifier label by platform', () => {
    expect(getPerfUpdateModifierLabel(true)).toBe('⌘')
    expect(getPerfUpdateModifierLabel(false)).toBe('Ctrl')
  })
})
