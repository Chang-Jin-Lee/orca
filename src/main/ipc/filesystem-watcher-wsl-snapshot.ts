import type { Event as WatcherEvent } from '@parcel/watcher'
import { validateWslWatcherIgnoreDirs } from './filesystem-watcher-wsl-native-script'

const POLL_INTERVAL_SECONDS = 5
export const SNAPSHOT_START = '\x1e'
export const SNAPSHOT_END = '\x1f'

type WslSnapshotEntry = {
  path: string
  type: string
  mtime: string
}

export type WslSnapshot = Map<string, WslSnapshotEntry>

export function toWslUncPath(linuxPath: string, distro: string): string {
  return `\\\\wsl.localhost\\${distro}${linuxPath.replace(/\//g, '\\')}`
}

function buildPruneExpression(ignoreDirs: readonly string[]): string {
  validateWslWatcherIgnoreDirs(ignoreDirs)
  if (ignoreDirs.length === 0) {
    return ''
  }
  const names = ignoreDirs.map((name) => `-name '${name}'`).join(' -o ')
  return `\\( -type d \\( ${names} \\) -prune \\) -o`
}

export function buildSnapshotScript(ignoreDirs: readonly string[]): string {
  const prune = buildPruneExpression(ignoreDirs)
  return [
    'set -efu',
    'root=$1',
    'while :; do',
    "  printf '\\036'",
    '  if [ -d "$root" ]; then',
    // Why: this is the compatibility path; correctness still requires every
    // nested open file while high-churn directories are pruned during traversal.
    `    find "$root" -mindepth 1 ${prune} -printf '%y\\t%T@\\t%p\\0' 2>/dev/null || true`,
    '  fi',
    "  printf '\\037'",
    `  sleep ${POLL_INTERVAL_SECONDS} || exit 0`,
    'done'
  ].join('\n')
}

export function parseSnapshotFrame(frame: string, distro: string): WslSnapshot {
  const snapshot: WslSnapshot = new Map()
  for (const rawEntry of frame.split('\0')) {
    if (!rawEntry) {
      continue
    }
    const firstTab = rawEntry.indexOf('\t')
    const secondTab = firstTab === -1 ? -1 : rawEntry.indexOf('\t', firstTab + 1)
    if (firstTab <= 0 || secondTab <= firstTab + 1) {
      continue
    }
    const linuxPath = rawEntry.slice(secondTab + 1)
    if (!linuxPath.startsWith('/')) {
      continue
    }
    const entry: WslSnapshotEntry = {
      type: rawEntry.slice(0, firstTab),
      mtime: rawEntry.slice(firstTab + 1, secondTab),
      path: toWslUncPath(linuxPath, distro)
    }
    snapshot.set(entry.path, entry)
  }
  return snapshot
}

export function diffSnapshots(prev: WslSnapshot, next: WslSnapshot): WatcherEvent[] {
  const events: WatcherEvent[] = []
  for (const [entryPath, nextEntry] of next) {
    const prevEntry = prev.get(entryPath)
    if (!prevEntry) {
      events.push({ type: 'create', path: entryPath } as WatcherEvent)
    } else if (prevEntry.type !== nextEntry.type) {
      events.push({ type: 'delete', path: entryPath } as WatcherEvent)
      events.push({ type: 'create', path: entryPath } as WatcherEvent)
    } else if (prevEntry.mtime !== nextEntry.mtime) {
      events.push({ type: 'update', path: entryPath } as WatcherEvent)
    }
  }
  for (const entryPath of prev.keys()) {
    if (!next.has(entryPath)) {
      events.push({ type: 'delete', path: entryPath } as WatcherEvent)
    }
  }
  return events
}
