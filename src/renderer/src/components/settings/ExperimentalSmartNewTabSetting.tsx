import type { GlobalSettings } from '../../../../shared/types'
import { SearchableSetting } from './SearchableSetting'
import { SettingsSwitchRow } from './SettingsFormControls'
import { getExperimentalSearchEntry } from './experimental-search'
import { translate } from '@/i18n/i18n'

type ExperimentalSmartNewTabSettingProps = {
  enabled: boolean
  updateSettings: (updates: Partial<GlobalSettings>) => void
}

export function ExperimentalSmartNewTabSetting({
  enabled,
  updateSettings
}: ExperimentalSmartNewTabSettingProps): React.JSX.Element {
  return (
    <SearchableSetting
      title={translate(
        'auto.components.settings.ExperimentalPane.847886cf3e',
        'Smart New Tab menu'
      )}
      description={translate(
        'auto.components.settings.ExperimentalPane.523b819a55',
        'Type in the New Tab menu to open a terminal, launch an agent, visit a URL, or open/create a file.'
      )}
      keywords={getExperimentalSearchEntry().unifiedNewTabLauncher.keywords}
      className="space-y-3 py-2"
    >
      <SettingsSwitchRow
        label={translate(
          'auto.components.settings.ExperimentalPane.847886cf3e',
          'Smart New Tab menu'
        )}
        description={translate(
          'auto.components.settings.ExperimentalPane.523b819a55',
          'Type in the New Tab menu to open a terminal, launch an agent, visit a URL, or open/create a file.'
        )}
        checked={enabled}
        onChange={() =>
          updateSettings({
            experimentalUnifiedNewTabLauncher: !enabled
          })
        }
        ariaLabel={translate(
          'auto.components.settings.ExperimentalPane.smartNewTab.toggleLabel',
          'Toggle Smart New Tab menu'
        )}
      />
    </SearchableSetting>
  )
}
