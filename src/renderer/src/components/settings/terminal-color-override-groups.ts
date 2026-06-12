import { TERMINAL_BASE_COLOR_OVERRIDE_GROUPS } from './terminal-base-color-override-groups'
import { TERMINAL_BRIGHT_COLOR_OVERRIDE_GROUPS } from './terminal-bright-color-override-groups'
import type { TerminalColorOverrideGroup } from './terminal-color-override-group-types'

export const COLOR_OVERRIDE_GROUPS: TerminalColorOverrideGroup[] = [
  ...TERMINAL_BASE_COLOR_OVERRIDE_GROUPS,
  ...TERMINAL_BRIGHT_COLOR_OVERRIDE_GROUPS
]
