import { describe, expect, it } from 'vitest'
import {
  buildJiraCreateCustomFields,
  buildJiraCreateFieldValue,
  isJiraUserPickerField,
  isMultiJiraUserPickerField
} from './jira-create-field-value'
import type { JiraCreateField } from '../../../shared/types'

function field(overrides: Partial<JiraCreateField> = {}): JiraCreateField {
  return {
    key: 'reporter',
    name: 'Reporter',
    required: true,
    ...overrides
  }
}

describe('isJiraUserPickerField', () => {
  it('detects schema.type "user"', () => {
    expect(isJiraUserPickerField(field({ schema: { type: 'user' } }))).toBe(true)
  })

  it('detects array of users as a user picker', () => {
    expect(isJiraUserPickerField(field({ schema: { type: 'array', items: 'user' } }))).toBe(true)
  })

  it('detects user-picker custom types', () => {
    expect(
      isJiraUserPickerField(
        field({ schema: { type: 'any', custom: 'com.atlassian.jira.plugin:userpicker' } })
      )
    ).toBe(true)
    expect(
      isJiraUserPickerField(
        field({ schema: { type: 'array', custom: 'com.atlassian.jira.plugin:multiuserpicker' } })
      )
    ).toBe(true)
  })

  it('is false for non-user fields', () => {
    expect(isJiraUserPickerField(field({ schema: { type: 'string' } }))).toBe(false)
    expect(isJiraUserPickerField(field({}))).toBe(false)
  })
})

describe('isMultiJiraUserPickerField', () => {
  it('is true only for array user pickers', () => {
    expect(isMultiJiraUserPickerField(field({ schema: { type: 'array', items: 'user' } }))).toBe(
      true
    )
    expect(isMultiJiraUserPickerField(field({ schema: { type: 'user' } }))).toBe(false)
  })
})

describe('buildJiraCreateFieldValue user pickers', () => {
  it('returns { id: accountId } for a single user-picker field', () => {
    expect(buildJiraCreateFieldValue(field({ schema: { type: 'user' } }), '5b10ac')).toEqual({
      id: '5b10ac'
    })
  })

  it('trims surrounding whitespace before wrapping the accountId', () => {
    expect(buildJiraCreateFieldValue(field({ schema: { type: 'user' } }), '  5b10ac  ')).toEqual({
      id: '5b10ac'
    })
  })

  it('returns an array of { id } for a multi-user-picker field', () => {
    expect(
      buildJiraCreateFieldValue(field({ schema: { type: 'array', items: 'user' } }), 'a1, b2 ,c3')
    ).toEqual([{ id: 'a1' }, { id: 'b2' }, { id: 'c3' }])
  })

  it('returns undefined when the user-picker draft is empty', () => {
    expect(buildJiraCreateFieldValue(field({ schema: { type: 'user' } }), '   ')).toBeUndefined()
    expect(
      buildJiraCreateFieldValue(field({ schema: { type: 'array', items: 'user' } }), '')
    ).toBeUndefined()
  })

  it('does not regress plain string fields', () => {
    expect(
      buildJiraCreateFieldValue(field({ key: 'x', schema: { type: 'string' } }), 'hello')
    ).toBe('hello')
  })
})

describe('buildJiraCreateCustomFields', () => {
  it('shapes a required Reporter user-picker as { reporter: { id } }', () => {
    const fields = [field({ key: 'reporter', schema: { type: 'user' } })]
    expect(buildJiraCreateCustomFields(fields, { reporter: '5b10ac' })).toEqual({
      reporter: { id: '5b10ac' }
    })
  })

  it('omits empty user-picker fields', () => {
    const fields = [field({ key: 'reporter', schema: { type: 'user' } })]
    expect(buildJiraCreateCustomFields(fields, { reporter: '' })).toBeUndefined()
  })
})
