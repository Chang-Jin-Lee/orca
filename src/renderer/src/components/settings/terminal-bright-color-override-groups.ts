import { translate } from '@/i18n/i18n'
import type { TerminalColorOverrideGroup } from './terminal-color-override-group-types'

export const TERMINAL_BRIGHT_COLOR_OVERRIDE_GROUPS: TerminalColorOverrideGroup[] = [
  {
    get label() {
      return translate('auto.components.settings.TerminalWindowSection.1be593d3e8', 'ANSI Bright')
    },
    keys: [
      {
        key: 'brightBlack',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.260d69ce9a',
            'Bright Black'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.f30c492769',
            'ANSI bright black color'
          )
        }
      },
      {
        key: 'brightRed',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.32b1b6acd7',
            'Bright Red'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.667de68863',
            'ANSI bright red color'
          )
        }
      },
      {
        key: 'brightGreen',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.7dafd57730',
            'Bright Green'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.0ffb02f921',
            'ANSI bright green color'
          )
        }
      },
      {
        key: 'brightYellow',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.936a326be3',
            'Bright Yellow'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.e2ef5f4ab7',
            'ANSI bright yellow color'
          )
        }
      },
      {
        key: 'brightBlue',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.66820332fa',
            'Bright Blue'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.bef6c0f6bf',
            'ANSI bright blue color'
          )
        }
      },
      {
        key: 'brightMagenta',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.e56e7d6ea0',
            'Bright Magenta'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.fe4d89ef85',
            'ANSI bright magenta color'
          )
        }
      },
      {
        key: 'brightCyan',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.f94adc4113',
            'Bright Cyan'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.1601140f03',
            'ANSI bright cyan color'
          )
        }
      },
      {
        key: 'brightWhite',
        get label() {
          return translate(
            'auto.components.settings.TerminalWindowSection.16948119cb',
            'Bright White'
          )
        },
        get description() {
          return translate(
            'auto.components.settings.TerminalWindowSection.42e01a6055',
            'ANSI bright white color'
          )
        }
      }
    ]
  }
]
