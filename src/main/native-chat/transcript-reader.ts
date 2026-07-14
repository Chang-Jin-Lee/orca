import { createReadStream } from 'node:fs'
import type { AgentType, NativeChatMessage } from '../../shared/native-chat-types'
import { errorMessage } from '../ai-vault/session-scanner-values'
import { resolveSessionFilePath, type ResolveSessionFileOptions } from './session-file-resolver'
import {
  decodeClaudeTranscriptLine,
  decodeCodexTranscriptLine,
  decodeGrokTranscriptLine
} from './transcript-line-decoders'
import { decodeTranscriptStream } from './transcript-stream-lines'

export type ReadTranscriptResult =
  | { messages: NativeChatMessage[] }
  // `notFound` marks a RETRYABLE miss (the session .jsonl isn't flushed yet — see
  // #8401), distinct from a hard read/parse error. Callers may retry a notFound
  // and must not cache it; a plain `error` is surfaced to the user immediately.
  | { error: string; notFound?: true }

// Why: a not-yet-created (or momentarily-vanished) transcript file surfaces as
// ENOENT once resolve returns a path — the lazy-flush race (#8401), not a real
// failure. On Windows an antivirus/indexer can also briefly lock the just-created
// file, which surfaces as EBUSY (a share/lock violation) in that same window; a
// regular file's EBUSY on read is inherently transient on every platform. Both
// become a RETRYABLE notFound so the caller polls until the first write settles;
// every other errno (EISDIR/EACCES/EIO) and any parse failure stays a hard error.
export function isRetryableTranscriptReadError(err: unknown): boolean {
  if (!(err instanceof Error) || !('code' in err)) {
    return false
  }
  const code = (err as NodeJS.ErrnoException).code
  return code === 'ENOENT' || code === 'EBUSY'
}

export type ReadTranscriptOptions = ResolveSessionFileOptions & {
  /** Resolve directly to this file, skipping path discovery (used by tests). */
  filePath?: string
}

/**
 * Read the ENTIRE Claude/Codex JSONL transcript for an agent + session id into
 * the NativeChatMessage model. Unlike the AI-Vault preview scan, this applies
 * NO message cap. Unknown record types are skipped rather than throwing, so a
 * single malformed/unrecognized line cannot fail the whole read. The per-line
 * record-to-message mapping is shared with the live tailer.
 */
export async function readNativeChatTranscript(
  agent: AgentType,
  sessionId: string,
  options: ReadTranscriptOptions = {}
): Promise<ReadTranscriptResult> {
  const filePath = options.filePath ?? (await resolveSessionFilePath(agent, sessionId, options))
  if (!filePath) {
    // The file hasn't been flushed yet (or was resolved away). Retryable, not a
    // hard error — the caller polls/backs off until the lazy first write lands.
    return { error: `No transcript found for ${agent} session ${sessionId}`, notFound: true }
  }
  try {
    if (agent === 'claude') {
      return { messages: await readTranscript(filePath, decodeClaudeTranscriptLine) }
    }
    if (agent === 'codex') {
      return { messages: await readTranscript(filePath, decodeCodexTranscriptLine) }
    }
    if (agent === 'grok') {
      return { messages: await readTranscript(filePath, decodeGrokTranscriptLine) }
    }
    return { error: `Unsupported agent for native chat transcript: ${agent}` }
  } catch (err) {
    if (isRetryableTranscriptReadError(err)) {
      return { error: errorMessage(err), notFound: true }
    }
    return { error: errorMessage(err) }
  }
}

async function readTranscript(
  filePath: string,
  decode: (line: string, fallbackId: string) => NativeChatMessage | null
): Promise<NativeChatMessage[]> {
  const stream = createReadStream(filePath, { encoding: 'utf-8' })
  const { messages } = await decodeTranscriptStream(stream, filePath, 0, decode, true)
  return messages
}
