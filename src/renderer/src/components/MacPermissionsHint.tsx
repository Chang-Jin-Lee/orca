import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useAppStore } from '@/store'
import { openDeveloperPermissionsSettings } from '@/lib/developer-permissions-settings-link'
import type { WorkspaceVisibleTabType } from '../../../shared/types'

type MacPermissionsHintProps = {
  activeView: 'terminal' | 'settings' | 'tasks'
  activeTabType: WorkspaceVisibleTabType
  activeWorktreeId: string | null
}

const TOAST_ID = 'mac-permissions-hint'

// Passive over eager: Superset-style osascript probes at app.whenReady were
// verified to silently fail under TCC (no Privacy → Automation row appears),
// so we rely on discoverability into DeveloperPermissionsPane instead.
//
// Why a toast (not a banner): an inline banner above the terminal pushed the
// inline tab strip down by one row, breaking the tabs-flush-to-titlebar
// attachment in split-group layouts. A sonner toast has no layout footprint
// and dismisses cleanly.
export function MacPermissionsHint({
  activeView,
  activeTabType,
  activeWorktreeId
}: MacPermissionsHintProps): null {
  const dismissed = useAppStore((s) => s.terminalMacPermissionsHintDismissed)
  const dismiss = useAppStore((s) => s.dismissTerminalMacPermissionsHint)
  // Why: persisted dismissal arrives async after first paint; without this
  // gate, returning users see the toast fire before the `?? false` hydrate
  // resolves to `true` and suppresses it.
  const persistedUIReady = useAppStore((s) => s.persistedUIReady)

  // Why: TCC (the macOS permission system) is host-local — a Mac client
  // SSH'd into a remote worktree can't grant permissions on the remote.
  // Subscribe to the slices getConnectionId would read (worktreesByRepo +
  // repos) so this re-evaluates when remote metadata hydrates after the
  // worktree is already active. Until both worktree and repo are resolved
  // we treat the connection as unknown (undefined), not local (null) —
  // otherwise an SSH worktree can briefly trigger this Mac-only toast
  // during the hydration window where repos hasn't populated yet.
  const connectionId = useAppStore((s) => {
    if (!activeWorktreeId) {
      return null
    }
    const allWorktrees = Object.values(s.worktreesByRepo ?? {}).flat()
    const worktree = allWorktrees.find((w) => w.id === activeWorktreeId)
    if (!worktree) {
      return undefined
    }
    const repo = s.repos?.find((r) => r.id === worktree.repoId)
    if (!repo) {
      return undefined
    }
    return repo.connectionId ?? null
  })
  const isLocalWorktree = connectionId === null
  const isTerminalView =
    activeView === 'terminal' && activeTabType === 'terminal' && activeWorktreeId !== null
  const shouldShow = persistedUIReady && isTerminalView && isLocalWorktree && !dismissed

  // Why: only fire once per process. React StrictMode double-mounts effects
  // in dev, and the gate can re-flip true→false→true as the user navigates;
  // a session-scoped ref is the simplest way to keep this as a one-shot.
  const firedRef = useRef(false)

  useEffect(() => {
    if (!shouldShow || firedRef.current) {
      return
    }
    firedRef.current = true
    toast.message('Need macOS device permissions for CLIs?', {
      id: TOAST_ID,
      duration: Infinity,
      action: {
        label: 'Open Settings',
        onClick: () => {
          openDeveloperPermissionsSettings()
          dismiss()
          toast.dismiss(TOAST_ID)
        }
      },
      // Why: closing the toast is treated as the dismissal — without this,
      // a user who clicks the X expects the toast not to come back next
      // launch, but the persisted flag would stay false.
      onDismiss: () => {
        dismiss()
      },
      onAutoClose: () => {
        dismiss()
      }
    })
  }, [shouldShow, dismiss])

  return null
}
