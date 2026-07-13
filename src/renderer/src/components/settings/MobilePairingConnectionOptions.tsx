import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { translate } from '../../i18n/i18n'
import { useAppStore } from '../../store'
import type { MobileRelayStatus } from '../../../../shared/mobile-relay-status'
import type { MobilePairingConnectionMode } from '../../../../shared/mobile-pairing-connection-mode'

function relayStatusLabel(status: MobileRelayStatus): string {
  if (status === 'registered') {
    return translate('auto.components.settings.MobilePairingConnectionOptions.ready', 'Ready')
  }
  if (status === 'connecting') {
    return translate(
      'auto.components.settings.MobilePairingConnectionOptions.connecting',
      'Connecting'
    )
  }
  if (status === 'standby') {
    return translate(
      'auto.components.settings.MobilePairingConnectionOptions.available',
      'Available'
    )
  }
  if (status === 'draining') {
    return translate(
      'auto.components.settings.MobilePairingConnectionOptions.reconnecting',
      'Reconnecting'
    )
  }
  return translate(
    'auto.components.settings.MobilePairingConnectionOptions.unavailable',
    'Unavailable'
  )
}

export function MobilePairingConnectionOptions({
  value,
  onChange,
  compact = false
}: {
  value: MobilePairingConnectionMode
  onChange: (value: MobilePairingConnectionMode) => void
  compact?: boolean
}): React.JSX.Element {
  const authStatus = useAppStore((state) => state.orcaProfileAuthStatus)
  const connecting = useAppStore((state) => state.orcaProfileConnecting)
  const connect = useAppStore((state) => state.connectCurrentOrcaProfile)
  const [relayStatus, setRelayStatus] = useState<MobileRelayStatus>('offline')
  const signedIn = authStatus?.state === 'connected'
  const configured = authStatus?.configured !== false

  useEffect(() => {
    let receivedEvent = false
    let active = true
    const unsubscribe = window.api.mobile.onRelayStatusChanged((status) => {
      receivedEvent = true
      if (active) {
        setRelayStatus(status)
      }
    })
    void window.api.mobile
      .getRelayStatus()
      .then(({ status }) => {
        if (active && !receivedEvent) {
          setRelayStatus(status)
        }
      })
      .catch(() => {})
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return (
    <section className={cn('space-y-2', compact && 'max-w-md')}>
      <h3 className="text-sm font-medium">
        {translate(
          'auto.components.settings.MobilePairingConnectionOptions.title',
          'How should the new phone connect?'
        )}
      </h3>
      <div className="space-y-2" role="radiogroup">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border border-border/60 px-3',
            compact ? 'py-2' : 'py-3',
            value === 'automatic' && signedIn && 'bg-accent'
          )}
        >
          <label
            className={cn('flex min-w-0 flex-1 items-start gap-3', signedIn && 'cursor-pointer')}
          >
            <input
              type="radio"
              name="mobile-pairing-connection-mode"
              value="automatic"
              checked={value === 'automatic'}
              disabled={!signedIn}
              onChange={() => onChange('automatic')}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="min-w-0 space-y-0.5">
              <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {translate(
                  'auto.components.settings.MobilePairingConnectionOptions.anywhere',
                  'Connect from anywhere'
                )}
                <span className="text-xs font-normal text-muted-foreground">
                  {translate(
                    'auto.components.settings.MobilePairingConnectionOptions.recommended',
                    'Recommended'
                  )}
                </span>
              </span>
              <span className="block text-xs text-muted-foreground">
                {signedIn
                  ? translate(
                      'auto.components.settings.MobilePairingConnectionOptions.automaticDescription',
                      'Orca uses a direct connection when available and Relay otherwise.'
                    )
                  : translate(
                      'auto.components.settings.MobilePairingConnectionOptions.signInDescription',
                      'Sign in on this desktop to use Orca Relay.'
                    )}
              </span>
            </span>
          </label>
          {signedIn ? (
            <Badge variant="outline" className="shrink-0">
              {relayStatusLabel(relayStatus)}
            </Badge>
          ) : configured ? (
            <Button
              type="button"
              size="sm"
              className="w-24 shrink-0"
              disabled={connecting}
              onClick={() => void connect()}
            >
              {connecting ? <Loader2 className="animate-spin" /> : null}
              {translate(
                'auto.components.settings.MobilePairingConnectionOptions.signIn',
                'Sign in'
              )}
            </Button>
          ) : (
            <Badge variant="outline" className="shrink-0">
              {translate(
                'auto.components.settings.MobilePairingConnectionOptions.unavailable',
                'Unavailable'
              )}
            </Badge>
          )}
        </div>

        <label
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 px-3',
            compact ? 'py-2' : 'py-3',
            value === 'local-only' && 'bg-accent'
          )}
        >
          <input
            type="radio"
            name="mobile-pairing-connection-mode"
            value="local-only"
            checked={value === 'local-only'}
            onChange={() => onChange('local-only')}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="min-w-0 space-y-0.5">
            <span className="block text-sm font-medium">
              {translate(
                'auto.components.settings.MobilePairingConnectionOptions.localOnly',
                'Local network only'
              )}
            </span>
            <span className="block text-xs text-muted-foreground">
              {translate(
                'auto.components.settings.MobilePairingConnectionOptions.localDescription',
                'Uses LAN or Tailscale without connecting this phone through Orca Relay.'
              )}
            </span>
          </span>
        </label>
      </div>
    </section>
  )
}
