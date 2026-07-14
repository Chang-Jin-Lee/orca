import { Info } from 'lucide-react'
import { translate } from '@/i18n/i18n'
import { badgeVariants } from '../ui/badge'
import { Button } from '../ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card'

const TESTFLIGHT_URL = 'https://testflight.apple.com/join/YjeGMQBA'
const ANDROID_APK_URL =
  'https://github.com/stablyai/orca/releases/download/mobile-android-v0.0.27/app-release.apk'

export function MobileRelayBetaAvailability(): React.JSX.Element {
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={translate(
            'auto.components.settings.MobileRelayBetaAvailability.about',
            'About the Orca Relay beta'
          )}
          className={badgeVariants({
            variant: 'outline',
            className: 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
          })}
        >
          {translate('auto.components.settings.MobileRelayBetaAvailability.beta', 'Beta')}
          <Info />
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="start" className="w-72 space-y-2 p-3">
        <p className="text-xs text-muted-foreground">
          {translate(
            'auto.components.settings.MobileRelayBetaAvailability.availability',
            'Orca Relay is currently available on the iOS TestFlight preview and Android APK.'
          )}
        </p>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="link"
            size="xs"
            className="h-auto p-0"
            onClick={() => void window.api.shell.openUrl(TESTFLIGHT_URL)}
          >
            {translate(
              'auto.components.settings.MobileRelayBetaAvailability.testFlight',
              'Open TestFlight'
            )}
          </Button>
          <Button
            type="button"
            variant="link"
            size="xs"
            className="h-auto p-0"
            onClick={() => void window.api.shell.openUrl(ANDROID_APK_URL)}
          >
            {translate(
              'auto.components.settings.MobileRelayBetaAvailability.androidApk',
              'Download Android APK'
            )}
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
