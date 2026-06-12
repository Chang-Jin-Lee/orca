import { translate } from '@/i18n/i18n'
import type { TerminalColorOverrideGroup } from './terminal-color-override-group-types'

export const TERMINAL_BASE_COLOR_OVERRIDE_GROUPS: TerminalColorOverrideGroup[] = [
  {
    get label() {
      return translate('auto.components.settings.TerminalWindowSection.cf37ff69f6', 'Base')
    },
    keys: [
      {
        key: 'foreground',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.79f6bfb76e',
            'Foreground'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.026a0b8013',
            'Main text color'
          )
        }
      },
      {
        key: 'background',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.cc1b2ffeb2',
            'Background'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.da64e8f4c1',
            'Terminal background color'
          )
        }
      },
      {
        key: 'cursor',
        get label() {
          return translate('auto.components.settings.TerminalWindowSection.c9e1fdf42f', 'Cursor')
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.cd0700762b',
            'Cursor color'
          )
        }
      },
      {
        key: 'cursorAccent',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.a2d9f095a7',
            'Cursor Text'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.7f4063076c',
            'Color of text under the cursor (block cursor)'
          )
        }
      },
      {
        key: 'selectionBackground',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.40c3cfd30a',
            'Selection Background'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.74d8555f85',
            'Background color of selected text'
          )
        }
      },
      {
        key: 'selectionForeground',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.8b450b5305',
            'Selection Foreground'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.b2c0857c49',
            'Text color of selected text'
          )
        }
      },
      {
        key: 'bold',
        get label() {
          return translate('auto.components.settings.TerminalWindowSection.862e463f7f', 'Bold Text')
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.fb8c6f1967',
            'Color for bold text. Falls back to the normal color if not set.'
          )
        }
      }
    ]
  },
  {
    get label() {
      return translate('auto.components.settings.TerminalWindowSection.68e9f07de0', 'ANSI Normal')
    },
    keys: [
      {
        key: 'black',
        get label() {
          return translate('auto.components.settings.TerminalWindowSection.adfdee23cb', 'Black')
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.cf4437a2f7',
            'ANSI black color'
          )
        }
      },
      {
        key: 'red',
        get label() {
          return translate('auto.components.settings.TerminalWindowSection.3a78f30b50', 'Red')
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.b41270f5ca',
            'ANSI red color'
          )
        }
      },
      {
        key: 'green',
        get label() {
          return translate('auto.components.settings.TerminalWindowSection.8f2092b315', 'Green')
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.8a673d4206',
            'ANSI green color'
          )
        }
      },
      {
        key: 'yellow',
        get label() {
          return translate('auto.components.settings.TerminalWindowSection.bb516de873', 'Yellow')
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.09c1c6b096',
            'ANSI yellow color'
          )
        }
      },
      {
        key: 'blue',
        get label() {
          return translate('auto.components.settings.TerminalWindowSection.292a4c7316', 'Blue')
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.9635a71c51',
            'ANSI blue color'
          )
        }
      },
      {
        key: 'magenta',
        get label() {
          return translate('auto.components.settings.TerminalWindowSection.d5e92fcd94', 'Magenta')
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.1705318506',
            'ANSI magenta color'
          )
        }
      },
      {
        key: 'cyan',
        get label() {
          return translate('auto.components.settings.TerminalWindowSection.fb8bb4eb1f', 'Cyan')
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.bd4c759327',
            'ANSI cyan color'
          )
        }
      },
      {
        key: 'white',
        get label() {
          return translate('auto.components.settings.TerminalWindowSection.0cb4459fb8', 'White')
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.28846b1ca6',
            'ANSI white color'
          )
        }
      }
    ]
  }
]
