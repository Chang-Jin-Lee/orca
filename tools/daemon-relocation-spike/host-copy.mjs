// Materializes a tier's copy plan into <work-dir>/daemon-host/, preserving the
// relative layout the daemon require-closure and node-pty native resolution
// expect. Returns the paths the launcher needs.

import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { HOST_EXE } from './app-inventory.mjs'

export const HOST_SUBDIR = 'daemon-host'

function destPath(hostRoot, destRel) {
  return join(hostRoot, ...destRel.split('/'))
}

/**
 * Execute the copy plan. Returns { hostRoot, hostExePath, daemonEntryPath,
 * nodePtyNativeDir, skipped } — nodePtyNativeDir is the <native>/ dir under the
 * copied node-pty, offered to callers that want to set ORCA_NODE_PTY_NATIVE_DIR
 * (see README: the current branch's node-pty patch does NOT read it, so it is
 * belt-and-suspenders here).
 */
export function copyHost(inv, plan, workDir) {
  const hostRoot = join(workDir, HOST_SUBDIR)
  mkdirSync(hostRoot, { recursive: true })

  const skipped = []
  for (const op of plan.ops) {
    const dest = destPath(hostRoot, op.destRel)
    if (!existsSync(op.sourcePath)) {
      if (!op.optional) {
        skipped.push(op.destRel)
      }
      continue
    }
    mkdirSync(dirname(dest), { recursive: true })
    // cpSync mirrors both files and directory trees; dereference symlinks so
    // the copy holds no link back into the app dir.
    cpSync(op.sourcePath, dest, {
      recursive: op.kind === 'dir',
      dereference: true,
      force: true
    })
  }

  const hostExePath = join(hostRoot, HOST_EXE)
  const daemonEntryPath = inv.daemonEntry.relFromUnpacked
    ? destPath(hostRoot, inv.daemonEntry.relFromUnpacked)
    : ''

  // The relocated node-pty native dir (build/Release or prebuilds/...), mirrored
  // under the host root at node-pty's unpacked-relative path.
  let nodePtyNativeDir = ''
  if (inv.nodePty.exists && inv.nodePty.nativeRel && inv.unpackedRoot) {
    const pkgRel = inv.nodePty.packageDir
      .slice(inv.unpackedRoot.length)
      .replace(/^[\\/]+/, '')
      .split('\\')
      .join('/')
    nodePtyNativeDir = destPath(hostRoot, `${pkgRel}/${inv.nodePty.nativeRel}`)
  }

  return { hostRoot, hostExePath, daemonEntryPath, nodePtyNativeDir, skipped }
}
