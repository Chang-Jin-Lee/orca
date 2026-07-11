import { useEffect, useState, type ReactNode } from 'react'
import { BarChart3, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { translate } from '@/i18n/i18n'
import { useAppStore } from '@/store'
import { shouldShowUsagePercentageDisplayChangeNotice } from '../../../../shared/usage-percentage-display-change-notice'

// Why: let startup modals settle before the status-bar callout competes for focus.
const SHOW_DELAY_MS = 1_800

function openUsagePercentageSettings(): void {
  const store = useAppStore.getState()
  // Why: openSettingsPage always wipes the search filter first — set the
  // Appearance target and filter after that wipe. The search string force-opens
  // Appearance → Window & Sidebar and surfaces the Usage percentages control.
  store.openSettingsPage()
  store.openSettingsTarget({ pane: 'appearance', repoId: null })
  store.setSettingsSearchQuery(
    translate(
      'auto.components.settings.appearance.search.usagePercentageDisplayTitle',
      'Usage percentages'
    )
  )
}

/**
 * Anchors a one-time high-contrast callout above the status-bar usage meters
 * after the default flipped from remaining → used. Permanent dismiss only.
 */
export function UsagePercentageDisplayChangeNotice({
  children,
  hasVisibleUsageMeters
}: {
  children: ReactNode
  // Why: StatusBar owns which meter children actually render (status-bar items,
  // CLI detection, MiniMax/Grok durability). Don't re-derive empty-state here.
  hasVisibleUsageMeters: boolean
}): React.JSX.Element {
  const persistedUIReady = useAppStore((s) => s.persistedUIReady)
  const dismissed = useAppStore((s) => s.usagePercentageDisplayChangeNoticeDismissed)
  const dismiss = useAppStore((s) => s.dismissUsagePercentageDisplayChangeNotice)
  const statusBarVisible = useAppStore((s) => s.statusBarVisible)
  const activeModal = useAppStore((s) => s.activeModal)
  const [delayElapsed, setDelayElapsed] = useState(false)

  const eligible = shouldShowUsagePercentageDisplayChangeNotice({
    persistedUIReady,
    usagePercentageDisplayChangeNoticeDismissed: dismissed,
    statusBarVisible,
    hasVisibleUsageMeters,
    activeModal
  })

  useEffect(() => {
    if (!eligible) {
      setDelayElapsed(false)
      return
    }
    const timer = window.setTimeout(() => {
      setDelayElapsed(true)
    }, SHOW_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [eligible])

  const open = eligible && delayElapsed

  const openSettings = (): void => {
    dismiss()
    openUsagePercentageSettings()
  }

  return (
    <Popover open={open}>
      <PopoverAnchor asChild>
        <div className="flex items-center gap-3">{children}</div>
      </PopoverAnchor>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        // Why: permanent dismiss is intentional only via Got it / X / Settings —
        // outside click must not silently clear a one-shot education surface.
        onInteractOutside={(event) => {
          event.preventDefault()
        }}
        onOpenAutoFocus={(event) => {
          // Why: keep focus in the terminal/workspace; this is a soft callout,
          // not a modal that should steal keyboard context.
          event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault()
          dismiss()
        }}
        // Why: reuse elevated glass popover chrome (border + blur + shadow) and
        // layer status-bar-change-notice so the caret + contrast boost still apply.
        className="status-bar-change-notice-popover w-[340px] max-w-[calc(100vw-24px)] overflow-visible p-3.5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-foreground"
                aria-hidden="true"
              >
                <BarChart3 className="size-3.5" />
              </span>
              <div className="text-sm font-semibold leading-snug">
                {translate(
                  'auto.components.status.bar.UsagePercentageDisplayChangeNotice.title',
                  'Usage now shows % used'
                )}
              </div>
            </div>
            <p className="text-sm leading-5 text-muted-foreground">
              {translate(
                'auto.components.status.bar.UsagePercentageDisplayChangeNotice.body',
                'Prefer remaining? Change it in Settings.'
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={dismiss}
            aria-label={translate(
              'auto.components.status.bar.UsagePercentageDisplayChangeNotice.dismiss',
              'Dismiss'
            )}
          >
            <X className="size-3.5" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="default" size="sm" className="min-w-0 flex-1" onClick={openSettings}>
            {translate(
              'auto.components.status.bar.UsagePercentageDisplayChangeNotice.openSettings',
              'Open Settings'
            )}
          </Button>
          <Button variant="secondary" size="sm" className="w-[84px]" onClick={dismiss}>
            {translate(
              'auto.components.status.bar.UsagePercentageDisplayChangeNotice.gotIt',
              'Got it'
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
