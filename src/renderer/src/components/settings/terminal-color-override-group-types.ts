import type { TerminalColorOverrides } from '../../../../shared/types'

export type TerminalColorOverrideGroup = {
  label: string
  keys: { key: keyof TerminalColorOverrides; label: string; description: string }[]
}
