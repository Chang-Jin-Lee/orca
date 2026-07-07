// Why: BrowserWindow instances are recreated on macOS dock re-activation, so
// long-lived main-process services (e.g. the SSH port scanner) subscribe to
// this process-global signal instead of a specific window instance; index.ts
// re-wires each new window's show/restore events into notifyMainWindowBecameVisible.
type MainWindowBecameVisibleListener = () => void

const listeners = new Set<MainWindowBecameVisibleListener>()

export function notifyMainWindowBecameVisible(): void {
  for (const listener of Array.from(listeners)) {
    listener()
  }
}

export function onMainWindowBecameVisible(listener: MainWindowBecameVisibleListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
