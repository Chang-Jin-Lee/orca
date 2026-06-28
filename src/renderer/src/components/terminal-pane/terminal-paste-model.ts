export type TerminalPasteSource =
  | 'keyboard'
  | 'paste-event'
  | 'app-menu'
  | 'context-menu'
  | 'right-click'
  | 'middle-click'
  | 'programmatic'

export type TerminalPasteRuntime = {
  platform: NodeJS.Platform
  runtimeKey: string
  kind: 'local' | 'wsl' | 'ssh' | 'remote-runtime'
  isWindowsConpty?: boolean
}

export type TerminalPasteTarget = {
  kind: 'terminal'
  paneId: number
  leafId: string
  ptyId: string | null
  runtime: TerminalPasteRuntime
}

export type TerminalPastePayload = {
  plainText: string
  source: TerminalPasteSource
  byteLength: number
  lineCount: number
  hasRichText: boolean
  hasControlSequences: boolean
}

export type TerminalPastePlan = {
  target: TerminalPasteTarget
  payload: TerminalPastePayload
  mode: 'direct' | 'chunked' | 'bracketed-terminal' | 'reject'
  newlinePolicy: 'preserve' | 'windows-crlf' | 'posix-lf' | 'target-default'
  runtimeKey: string
  maxChunkBytes?: number
  bracketed: boolean
  // Whether the bytes reach the TUI wrapped in bracketed-paste escapes — true
  // either because Orca brackets them (`bracketed`) or because the terminal has
  // bracketed-paste mode on and wraps a direct paste itself. The corrupting TUI
  // redraw (issue #5960) keys off this, not `bracketed` alone.
  bracketedToTerminal: boolean
  redactedDiagnostic: string
  rejectReason?: TerminalPasteExecutionReason
}

export type TerminalPasteTextOptions = {
  forceBracketedPaste?: boolean
  forceBracketedPasteForMultiline?: boolean
}

export type TerminalPasteExecutionReason =
  | 'operation-timeout'
  | 'paste-rejected'
  | 'payload-too-large'
  | 'pty-writer-unavailable'
  | 'stale-target'
  | 'target-disconnected'

export type TerminalPasteExecutionResult = {
  status: 'pasted' | 'rejected' | 'cancelled'
  chunksWritten: number
  diagnostic: string
  durationMs: number
  reason?: TerminalPasteExecutionReason
}
