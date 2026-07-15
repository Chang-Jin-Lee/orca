import type { AgentTrustPreset } from './agent-trust-presets'
import { upsertProjectTrustLevelInContent } from './codex/config-toml-trust'
import { getActiveMultiplexer } from './ipc/ssh'
import { getSshFilesystemProvider } from './providers/ssh-filesystem-dispatch'
import type { IFilesystemProvider } from './providers/types'
import {
  isWindowsAbsolutePathLike,
  normalizeRuntimePathSeparators
} from '../shared/cross-platform-path'

export async function markRemoteAgentWorkspaceTrusted(args: {
  preset: AgentTrustPreset
  connectionId: string
  workspacePath: string
}): Promise<void> {
  const home = await resolveRemoteHome(args.connectionId)
  const fsProvider = getSshFilesystemProvider(args.connectionId)
  if (!home || !fsProvider) {
    return
  }

  const workspacePath = await canonicalizeRemoteWorkspacePath(fsProvider, args.workspacePath)
  if (args.preset === 'codex') {
    await markRemoteCodexProjectTrusted(fsProvider, home, workspacePath)
  } else if (args.preset === 'cursor') {
    await markRemoteCursorWorkspaceTrusted(fsProvider, home, workspacePath)
  } else if (args.preset === 'copilot') {
    await markRemoteCopilotFolderTrusted(fsProvider, home, workspacePath)
  } else if (args.preset === 'claude') {
    await markRemoteClaudeFolderTrusted(fsProvider, home, workspacePath)
  }
}

async function resolveRemoteHome(connectionId: string): Promise<string | null> {
  const mux = getActiveMultiplexer(connectionId)
  if (!mux || mux.isDisposed?.()) {
    return null
  }
  const result = (await mux.request('session.resolveHome', { path: '~' })) as {
    resolvedPath?: unknown
  }
  const home =
    typeof result.resolvedPath === 'string'
      ? normalizeRuntimePathSeparators(result.resolvedPath.trim())
      : ''
  return home &&
    (home.startsWith('/') || isWindowsAbsolutePathLike(home)) &&
    !hasRemotePathControlCharacter(home)
    ? home.replace(/\/$/, '')
    : null
}

function hasRemotePathControlCharacter(value: string): boolean {
  return value.includes(String.fromCharCode(0)) || value.includes('\r') || value.includes('\n')
}

async function canonicalizeRemoteWorkspacePath(
  fsProvider: IFilesystemProvider,
  workspacePath: string
): Promise<string> {
  try {
    return await fsProvider.realpath(workspacePath)
  } catch {
    return workspacePath
  }
}

async function readRemoteTextFile(
  fsProvider: IFilesystemProvider,
  filePath: string
): Promise<string> {
  try {
    const result = await fsProvider.readFile(filePath)
    return result.isBinary ? '' : result.content
  } catch {
    return ''
  }
}

async function markRemoteCodexProjectTrusted(
  fsProvider: IFilesystemProvider,
  remoteHome: string,
  workspacePath: string
): Promise<void> {
  const codexDir = `${remoteHome}/.codex`
  const configPath = `${codexDir}/config.toml`
  const existing = await readRemoteTextFile(fsProvider, configPath)
  const updated = upsertProjectTrustLevelInContent(existing, workspacePath, 'trusted', {
    // Why: workspacePath was resolved by the remote filesystem provider; local
    // realpath would canonicalize the wrong machine on SSH.
    alreadyCanonical: true
  })
  if (updated === existing) {
    return
  }
  await fsProvider.createDir(codexDir)
  await fsProvider.writeFile(configPath, updated)
}

async function markRemoteCursorWorkspaceTrusted(
  fsProvider: IFilesystemProvider,
  remoteHome: string,
  workspacePath: string
): Promise<void> {
  const slug = workspacePath.replace(/^[\\/]+/, '').replace(/[\\/:*?"<>|]+/g, '-')
  if (!slug) {
    return
  }
  const trustDir = `${remoteHome}/.cursor/projects/${slug}`
  const trustFile = `${trustDir}/.workspace-trusted`
  try {
    await fsProvider.stat(trustFile)
    return
  } catch {
    // Missing marker: write the same shape the local trust preset writes.
  }
  await fsProvider.createDir(trustDir)
  await fsProvider.writeFile(
    trustFile,
    `${JSON.stringify({ trustedAt: new Date().toISOString(), workspacePath }, null, 2)}\n`
  )
}

async function markRemoteClaudeFolderTrusted(
  fsProvider: IFilesystemProvider,
  remoteHome: string,
  workspacePath: string
): Promise<void> {
  // Why: Claude reads per-project trust from the remote user's ~/.claude.json;
  // pre-writing hasTrustDialogAccepted skips the "trust this folder?" dialog so
  // the --prefill issue draft lands (#6613). Mirrors the local preset.
  //
  // fs.writeFile truncates in place, so an existing ~/.claude.json keeps its
  // (owner-only) mode. Unlike the local preset it cannot force 0o600 on a
  // brand-new file because IFilesystemProvider.writeFile takes no mode — the
  // same limitation every remote trust preset (codex/cursor/copilot) has;
  // adding a mode-aware remote write is a cross-cutting follow-up.
  const configPath = `${remoteHome}/.claude.json`
  const raw = await readRemoteTextFile(fsProvider, configPath)
  let config: Record<string, unknown> = {}
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        config = parsed as Record<string, unknown>
      }
    } catch {
      return
    }
  }
  const projects =
    config.projects && typeof config.projects === 'object' && !Array.isArray(config.projects)
      ? (config.projects as Record<string, unknown>)
      : {}
  const existingEntry =
    projects[workspacePath] &&
    typeof projects[workspacePath] === 'object' &&
    !Array.isArray(projects[workspacePath])
      ? (projects[workspacePath] as Record<string, unknown>)
      : {}
  if (existingEntry.hasTrustDialogAccepted === true) {
    return
  }
  projects[workspacePath] = { ...existingEntry, hasTrustDialogAccepted: true }
  config.projects = projects
  await fsProvider.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

async function markRemoteCopilotFolderTrusted(
  fsProvider: IFilesystemProvider,
  remoteHome: string,
  workspacePath: string
): Promise<void> {
  const configDir = `${remoteHome}/.copilot`
  const configPath = `${configDir}/config.json`
  const raw = await readRemoteTextFile(fsProvider, configPath)
  let config: Record<string, unknown> = {}
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        config = parsed as Record<string, unknown>
      }
    } catch {
      return
    }
  }
  const existing = Array.isArray(config.trustedFolders) ? (config.trustedFolders as unknown[]) : []
  if (existing.includes(workspacePath)) {
    return
  }
  config.trustedFolders = [...existing.filter((entry) => typeof entry === 'string'), workspacePath]
  await fsProvider.createDir(configDir)
  await fsProvider.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
}
