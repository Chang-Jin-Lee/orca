// Tier definitions as DATA, so trimming the copied file set is a config change
// rather than a code change. A tier resolves (given a discovered inventory) to a
// flat list of copy operations { sourcePath, destRel, kind }.

// GPU/render DLLs that a run-as-node Electron host plausibly never loads. The
// spike measures whether dropping them still yields a working ConPTY host.
// ffmpeg.dll is deliberately NOT here — it is kept in the no-gpu tier.
export const GPU_DLLS = new Set([
  'libegl.dll',
  'libglesv2.dll',
  'vk_swiftshader.dll',
  'vulkan-1.dll',
  'd3dcompiler_47.dll'
])

// Each tier declares which top-level DLLs to include. The exe, runtime data
// blobs, daemon bundle, and node-pty are in every tier — they are the
// irreducible core (Orca.exe needs icu + snapshots even as node; the daemon
// needs its bundle; node-pty needs its native + conpty runtime).
export const TIER_DEFINITIONS = {
  full: { label: 'TIER_FULL_RUNTIME', dlls: 'all' },
  'no-gpu': { label: 'TIER_NO_GPU_DLLS', dlls: 'non-gpu' },
  minimal: { label: 'TIER_MINIMAL', dlls: 'none' }
}

function isGpuDll(name) {
  return GPU_DLLS.has(name.toLowerCase())
}

/**
 * Which top-level DLL entries a tier keeps. Pure over the inventory's DLL list
 * so selftest can exercise it without a real build.
 */
export function selectTierDlls(topLevelDlls, tier) {
  const def = TIER_DEFINITIONS[tier]
  if (!def || def.dlls === 'none') {
    return []
  }
  if (def.dlls === 'all') {
    return topLevelDlls
  }
  return topLevelDlls.filter((e) => !isGpuDll(e.name))
}

// Copy the whole node-pty package tree so its default native/conpty resolution
// (relative to node-pty's own __dirname) keeps working from the relocated path,
// and so the daemon require-closure resolves `node-pty` by walking up from the
// mirrored daemon-entry.js. destRel mirrors the app.asar.unpacked layout.
function nodePtyRelDir(inv) {
  // node-pty's package dir relative to the unpacked root, normalized to '/'.
  const root = inv.unpackedRoot ?? ''
  const rel = inv.nodePty.packageDir.slice(root.length).replace(/^[\\/]+/, '')
  return rel.split('\\').join('/')
}

/**
 * Build the ordered copy plan for a tier. Returns { ops, warnings } where each
 * op is { sourcePath, destRel, kind: 'file' | 'dir' }. Missing required inputs
 * are surfaced as warnings rather than thrown, so the report stays complete.
 */
export function resolveTierFileSet(inv, tier) {
  const ops = []
  const warnings = []

  const addFile = (entry, destRel, requiredLabel) => {
    if (!entry || !entry.exists) {
      if (requiredLabel) {
        warnings.push(`missing required input: ${requiredLabel}`)
      }
      return
    }
    ops.push({ sourcePath: entry.path, destRel, kind: 'file' })
  }

  // Core: exe + runtime data blobs live next to Orca.exe in win-unpacked, so
  // they mirror to the host-dir root.
  addFile(inv.hostExe, inv.hostExe.name, 'Orca.exe')
  for (const entry of inv.runtimeData) {
    addFile(entry, entry.name, entry.name)
  }

  // Top-level DLLs per tier.
  for (const dll of selectTierDlls(inv.topLevelDlls, tier)) {
    addFile(dll, dll.name)
  }

  // Daemon bundle: the entry plus its sibling chunks + the unpacked
  // out/package.json (module-type resolution). Mirror the unpacked layout so the
  // relative require-closure resolves unchanged.
  if (inv.daemonEntry.exists && inv.unpackedRoot) {
    ops.push({
      sourcePath: inv.daemonEntry.path,
      destRel: inv.daemonEntry.relFromUnpacked,
      kind: 'file'
    })
    const entryDir = inv.daemonEntry.relFromUnpacked.includes('/')
      ? inv.daemonEntry.relFromUnpacked.slice(0, inv.daemonEntry.relFromUnpacked.lastIndexOf('/'))
      : ''
    // chunks/ sit beside the entry (out/main/chunks per asarUnpack config).
    ops.push({
      sourcePath: `${inv.unpackedRoot}\\${entryDir.split('/').join('\\')}\\chunks`,
      destRel: entryDir ? `${entryDir}/chunks` : 'chunks',
      kind: 'dir',
      optional: true
    })
    // out/package.json is unpacked so Node can resolve the CJS/ESM loader.
    ops.push({
      sourcePath: `${inv.unpackedRoot}\\out\\package.json`,
      destRel: 'out/package.json',
      kind: 'file',
      optional: true
    })
  } else {
    warnings.push('missing required input: daemon-entry.js (+ chunks)')
  }

  // node-pty package tree (native binding + conpty runtime), mirrored at its
  // app.asar.unpacked-relative path.
  if (inv.nodePty.exists && inv.nodePty.conptyNode && inv.unpackedRoot) {
    ops.push({
      sourcePath: inv.nodePty.packageDir,
      destRel: nodePtyRelDir(inv),
      kind: 'dir'
    })
  } else {
    warnings.push('missing required input: node-pty (with conpty.node)')
  }

  return { ops, warnings, label: TIER_DEFINITIONS[tier].label }
}
