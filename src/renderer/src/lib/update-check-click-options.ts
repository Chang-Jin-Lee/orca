import type { UpdateCheckOptions } from '../../../shared/types'
import { getShortcutPlatform } from './shortcut-platform'

type UpdateCheckClickEvent = Pick<MouseEvent, 'ctrlKey' | 'metaKey' | 'shiftKey'>

function isMacShortcutPlatform(): boolean {
  return getShortcutPlatform() === 'darwin'
}

export function getPerfUpdateModifierLabel(isMac = isMacShortcutPlatform()): string {
  return isMac ? '⌘' : 'Ctrl'
}

export function getUpdateCheckClickOptions(
  event: UpdateCheckClickEvent,
  isMac = isMacShortcutPlatform()
): UpdateCheckOptions {
  return {
    includePrerelease: event.shiftKey,
    includePerfPrerelease: isMac ? event.metaKey : event.ctrlKey
  }
}
