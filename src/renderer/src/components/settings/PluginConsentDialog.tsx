import { useRef, useState } from 'react'
import { AlertTriangle, Check, Loader2 } from 'lucide-react'
import type { PluginHostListEntry } from '../../../../preload/api-types'
import { translate } from '@/i18n/i18n'
import { pluginConsentErrorMessage } from './plugin-error-presentation'
import { Button } from '../ui/button'
import { PluginVmRecipeConsentPreview } from './PluginVmRecipeConsentPreview'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'

type PluginConsentDialogProps = {
  plugin: PluginHostListEntry | null
  onDecision: (
    pluginKey: string,
    reviewedFingerprint: string,
    decision: 'approve' | 'keep-disabled'
  ) => Promise<void>
}

function trustTier(plugin: PluginHostListEntry): string {
  if (plugin.hasWorker) {
    return translate(
      'auto.components.settings.PluginConsentDialog.workerTrust',
      'Background worker — runs its own process'
    )
  }
  if (plugin.hasSkills || (plugin.vmRecipes?.length ?? 0) > 0) {
    return translate(
      'auto.components.settings.PluginConsentDialog.instructionalTrust',
      'Instructional content — runs later under user or agent authority'
    )
  }
  return translate(
    'auto.components.settings.PluginConsentDialog.panelTrust',
    'Panel or inert content — no worker process'
  )
}

function capabilityDescription(kind: string, fallback: string): string {
  switch (kind) {
    case 'workspace:read':
      return translate(
        'auto.components.settings.PluginConsentDialog.capability.workspaceRead',
        'Read the name, branch, and terminal list of your focused worktree'
      )
    case 'terminal:send':
      return translate(
        'auto.components.settings.PluginConsentDialog.capability.terminalSend',
        'Type text into a terminal you can see (always a specific terminal)'
      )
    case 'notifications:show':
      return translate(
        'auto.components.settings.PluginConsentDialog.capability.notificationsShow',
        'Show desktop notifications labeled with the plugin name'
      )
    case 'storage':
      return translate(
        'auto.components.settings.PluginConsentDialog.capability.storage',
        "Store data in the plugin's own storage folder"
      )
    case 'secrets':
      return translate(
        'auto.components.settings.PluginConsentDialog.capability.secrets',
        "Store and read secrets in the plugin's own encrypted vault"
      )
    case 'events:subscribe':
      return translate(
        'auto.components.settings.PluginConsentDialog.capability.eventsSubscribe',
        'Get notified when worktrees are created or removed and when agent status changes'
      )
    case 'settings:own':
      return translate(
        'auto.components.settings.PluginConsentDialog.capability.settingsOwn',
        "Read and change the plugin's own settings"
      )
    default:
      return fallback
  }
}

function hasInstructionalContent(plugin: PluginHostListEntry): boolean {
  return plugin.hasSkills || (plugin.vmRecipes?.length ?? 0) > 0
}

function consentTitle(plugin: PluginHostListEntry): string {
  if (!hasInstructionalContent(plugin)) {
    return translate('auto.components.settings.PluginConsentDialog.title', 'Review permissions')
  }
  if (plugin.hasWorker || plugin.capabilities.length > 0) {
    return translate(
      'auto.components.settings.PluginConsentDialog.mixedTitle',
      'Review access and content'
    )
  }
  return translate(
    'auto.components.settings.PluginConsentDialog.instructionalTitle',
    'Review plugin content'
  )
}

export function PluginConsentDialog({
  plugin: currentPlugin,
  onDecision
}: PluginConsentDialogProps): React.JSX.Element {
  // Why: a same-key update must not replace the trust boundary while the user is reviewing it.
  const plugin = useRef(currentPlugin).current
  const keepDisabledRef = useRef<HTMLButtonElement>(null)
  const [busyDecision, setBusyDecision] = useState<'approve' | 'keep-disabled' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const decide = async (decision: 'approve' | 'keep-disabled'): Promise<void> => {
    if (!plugin?.consentFingerprint || busyDecision) {
      return
    }
    setBusyDecision(decision)
    setError(null)
    try {
      // Why: consent is conditional on the exact trust boundary rendered by this dialog.
      await onDecision(plugin.pluginKey, plugin.consentFingerprint, decision)
    } catch (cause) {
      console.warn('[plugins] consent update failed:', cause)
      setError(pluginConsentErrorMessage(cause))
    } finally {
      setBusyDecision(null)
    }
  }

  return (
    <Dialog
      open={Boolean(plugin)}
      onOpenChange={(open) => {
        if (!open) {
          void decide('keep-disabled')
        }
      }}
    >
      <DialogContent
        className="max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-sleek sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          // Why: dismissal is the safety-preserving path, so it receives initial focus.
          event.preventDefault()
          keepDisabledRef.current?.focus()
        }}
      >
        {plugin ? (
          <>
            <DialogHeader>
              <DialogTitle>{consentTitle(plugin)}</DialogTitle>
              <DialogDescription>
                {translate(
                  'auto.components.settings.PluginConsentDialog.subtitle',
                  '{{value0}} v{{value1}} · {{value2}}',
                  { value0: plugin.name, value1: plugin.version, value2: plugin.publisher }
                )}
              </DialogDescription>
            </DialogHeader>
            {plugin.needsReconsent ? (
              <p className="border-l-2 border-foreground/25 py-0.5 pl-3 text-sm leading-6">
                {translate(
                  'auto.components.settings.PluginConsentDialog.reconsent',
                  'Permissions, the worker trust tier, or instructional content changed since you last reviewed this plugin. Review it again before it can run.'
                )}
              </p>
            ) : null}
            <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
              <dt className="text-xs text-muted-foreground">
                {translate('auto.components.settings.PluginConsentDialog.source', 'Source')}
              </dt>
              <dd className="truncate font-mono text-xs" title={plugin.source?.reference}>
                {plugin.source?.reference ??
                  translate(
                    'auto.components.settings.PluginConsentDialog.unknownSource',
                    'Not available'
                  )}
              </dd>
              <dt className="text-xs text-muted-foreground">
                {translate('auto.components.settings.PluginConsentDialog.commit', 'Commit')}
              </dt>
              <dd
                className={plugin.source?.resolvedCommit ? 'truncate font-mono text-xs' : 'text-sm'}
                title={plugin.source?.resolvedCommit ?? undefined}
              >
                {plugin.source?.resolvedCommit ??
                  translate(
                    'auto.components.settings.PluginConsentDialog.localCommit',
                    'Not available (local folder)'
                  )}
              </dd>
              <dt className="text-xs text-muted-foreground">
                {translate('auto.components.settings.PluginConsentDialog.trust', 'Trust tier')}
              </dt>
              <dd>{trustTier(plugin)}</dd>
            </dl>
            {plugin.capabilities.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                  {translate(
                    'auto.components.settings.PluginConsentDialog.capabilities',
                    'This plugin can'
                  )}
                </p>
                <div className="space-y-2">
                  {plugin.capabilities.map((capability) => (
                    <div key={capability.kind} className="flex items-start gap-2 text-sm leading-6">
                      <Check className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                      <span>
                        {capabilityDescription(capability.kind, capability.description)}{' '}
                        <span className="font-mono text-[11px] text-muted-foreground">
                          ({capability.kind})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3.5 py-3 text-sm leading-6">
              <AlertTriangle className="mt-1 size-4 shrink-0" />
              <span>
                {plugin.hasWorker
                  ? translate(
                      'auto.components.settings.PluginConsentDialog.warning',
                      "These permissions limit how the plugin uses Orca's API. Its worker still runs as a normal process on your computer with full access to your files, network, and other processes."
                    )
                  : hasInstructionalContent(plugin)
                    ? translate(
                        'auto.components.settings.PluginConsentDialog.instructionalWarning',
                        'This plugin has no worker process. Its instructional content can still cause actions when you or an agent use it. Review the instructions and commands below before enabling it.'
                      )
                    : translate(
                        'auto.components.settings.PluginConsentDialog.panelWarning',
                        "These permissions limit how the plugin uses Orca's API. This plugin has no worker process."
                      )}
              </span>
            </div>
            {plugin.hasSkills ? (
              <div className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3.5 py-3 text-sm leading-6">
                <AlertTriangle className="mt-1 size-4 shrink-0" />
                <span>
                  {translate(
                    'auto.components.settings.PluginConsentDialog.skillWarning',
                    'This plugin installs instructional skills. Agents read those instructions and may act on them with the full authority you give the agent.'
                  )}
                </span>
              </div>
            ) : null}
            <PluginVmRecipeConsentPreview recipes={plugin.vmRecipes ?? []} />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                disabled={Boolean(busyDecision)}
                onClick={() => void decide('approve')}
              >
                {busyDecision === 'approve' ? <Loader2 className="animate-spin" /> : null}
                {translate('auto.components.settings.PluginConsentDialog.enable', 'Enable plugin')}
              </Button>
              <Button
                ref={keepDisabledRef}
                size="sm"
                disabled={Boolean(busyDecision)}
                onClick={() => void decide('keep-disabled')}
              >
                {busyDecision === 'keep-disabled' ? <Loader2 className="animate-spin" /> : null}
                {translate(
                  'auto.components.settings.PluginConsentDialog.keepDisabled',
                  'Keep Disabled'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
