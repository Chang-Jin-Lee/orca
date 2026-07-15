import { closeSync, fstatSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { renameFileWithWindowsRetry } from '../codex-accounts/fs-utils'

export type CodexTrustConfigSnapshot =
  | { existed: false }
  | { existed: true; contents: Buffer; mode: number }

export function captureCodexTrustConfig(tomlPath: string): CodexTrustConfigSnapshot {
  let descriptor: number
  try {
    descriptor = openSync(tomlPath, 'r')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { existed: false }
    }
    throw error
  }
  try {
    // Why: read and stat the same open file so replacement between two path
    // lookups cannot pair one file's contents with another file's mode.
    return {
      existed: true,
      contents: readFileSync(descriptor),
      mode: fstatSync(descriptor).mode
    }
  } finally {
    closeSync(descriptor)
  }
}

export function restoreCodexTrustConfig(
  tomlPath: string,
  snapshot: CodexTrustConfigSnapshot
): void {
  if (!snapshot.existed) {
    try {
      unlinkSync(tomlPath)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
    return
  }
  try {
    if (readFileSync(tomlPath).equals(snapshot.contents)) {
      return
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }
  // Why: rollback protects config integrity too; direct truncating writes can
  // leave Codex unusable if Orca exits midway through recovery.
  const tempPath = `${tomlPath}.${process.pid}.${randomUUID()}.rollback.tmp`
  try {
    writeFileSync(tempPath, snapshot.contents, { mode: snapshot.mode })
    renameFileWithWindowsRetry(tempPath, tomlPath)
  } catch (error) {
    try {
      unlinkSync(tempPath)
    } catch {
      // Best effort; preserve the rollback failure as the actionable error.
    }
    throw error
  }
}
