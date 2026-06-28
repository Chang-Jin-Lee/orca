import type { JiraCreateField } from '../../../shared/types'
import { buildJiraCreateTextAdf } from '@/components/jira-create-adf'

const JIRA_CREATE_SYSTEM_FIELD_KEYS = new Set(['project', 'issuetype', 'summary', 'description'])

export function isVisibleJiraCreateField(field: JiraCreateField): boolean {
  return field.required && !JIRA_CREATE_SYSTEM_FIELD_KEYS.has(field.key)
}

// Why: Jira v3 only accepts a user as { id: accountId } (display names/usernames
// were removed in the 2019 GDPR change), so any free-text value is rejected.
// User-picker fields carry no allowedValues, so detect them via the schema.
const JIRA_USER_PICKER_CUSTOM_SUFFIXES = [':userpicker', ':people', ':multiuserpicker']

export function isJiraUserPickerField(field: JiraCreateField): boolean {
  const schema = field.schema
  if (!schema) {
    return false
  }
  if (schema.type === 'user') {
    return true
  }
  if (schema.type === 'array' && schema.items === 'user') {
    return true
  }
  const custom = schema.custom ?? ''
  return JIRA_USER_PICKER_CUSTOM_SUFFIXES.some((suffix) => custom.includes(suffix))
}

export function isMultiJiraUserPickerField(field: JiraCreateField): boolean {
  return (
    field.schema?.type === 'array' &&
    (field.schema.items === 'user' || (field.schema.custom ?? '').includes(':multiuserpicker'))
  )
}

export function getJiraCreateAllowedValueLabel(
  value: NonNullable<JiraCreateField['allowedValues']>[number]
): string {
  return value.name ?? value.value ?? value.id ?? 'Option'
}

function findJiraCreateAllowedValue(field: JiraCreateField, draftValue: string) {
  return field.allowedValues?.find((value) => {
    return value.id === draftValue || value.value === draftValue || value.name === draftValue
  })
}

function getJiraCreateOptionPayload(
  value: NonNullable<JiraCreateField['allowedValues']>[number] | undefined,
  fallback: string
): Record<string, string> | string {
  if (value?.id) {
    return { id: value.id }
  }
  if (value?.value) {
    return { value: value.value }
  }
  if (value?.name) {
    return { name: value.name }
  }
  return fallback
}

function splitCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function buildJiraCreateFieldValue(field: JiraCreateField, draftValue: string): unknown {
  const trimmed = draftValue.trim()
  if (!trimmed) {
    return undefined
  }
  // Why: user-picker fields store accountId(s) in the draft and Jira v3 requires
  // the { id: accountId } shape, so this must run before the generic array path.
  if (isJiraUserPickerField(field)) {
    if (isMultiJiraUserPickerField(field)) {
      return splitCommaSeparated(trimmed).map((id) => ({ id }))
    }
    return { id: trimmed }
  }
  if (field.schema?.type === 'array') {
    const parts = splitCommaSeparated(trimmed)
    if (field.allowedValues?.length) {
      return parts.map((part) =>
        getJiraCreateOptionPayload(findJiraCreateAllowedValue(field, part), part)
      )
    }
    return parts
  }
  if (field.allowedValues?.length) {
    return getJiraCreateOptionPayload(findJiraCreateAllowedValue(field, trimmed), trimmed)
  }
  if (field.schema?.type === 'number') {
    const numberValue = Number(trimmed)
    return Number.isFinite(numberValue) ? numberValue : trimmed
  }
  if (field.schema?.custom?.includes(':textarea') || field.schema?.type === 'textarea') {
    return buildJiraCreateTextAdf(trimmed)
  }
  return trimmed
}

export function buildJiraCreateCustomFields(
  fields: readonly JiraCreateField[],
  values: Record<string, string>
): Record<string, unknown> | undefined {
  const customFields: Record<string, unknown> = {}
  for (const field of fields) {
    const value = buildJiraCreateFieldValue(field, values[field.key] ?? '')
    if (value !== undefined) {
      customFields[field.key] = value
    }
  }
  return Object.keys(customFields).length > 0 ? customFields : undefined
}
