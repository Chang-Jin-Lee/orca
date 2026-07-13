import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { repairCacheMap } from './locale-translation-policy.mjs'

describe('context-sensitive translation policy', () => {
  it('keeps the mobile Continue policy anchored to extracted source', () => {
    const extracted = JSON.parse(readFileSync('config/localization-extraction/en.json', 'utf8'))
    expect(extracted.auto.components.mobile.MobileHero.a8fb43cf1c).toBe('Continue')
  })

  it('preserves mobile Continue translations in the value-only migration cache', () => {
    const cache = new Map([['Continue', '继续']])
    expect(repairCacheMap(cache, 'zh')).toBe(0)
    expect(cache.get('Continue')).toBe('继续')
  })
})
