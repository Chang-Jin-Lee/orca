import {
  isCodexAppServerUnsupportedError,
  type CodexHookTrustGrantSessionResult
} from './codex-app-server-client'

export type GrantEntryEnvelope =
  | { ok: true; result: CodexHookTrustGrantSessionResult }
  | { ok: false; errorName: string; message: string; unsupported?: boolean }

export function buildGrantEntryEnvelope(
  run: Promise<CodexHookTrustGrantSessionResult>
): Promise<GrantEntryEnvelope> {
  return run.then(
    (result) => ({ ok: true as const, result }),
    (error: unknown) => ({
      ok: false as const,
      errorName: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error),
      ...(isCodexAppServerUnsupportedError(error) ? { unsupported: true as const } : {})
    })
  )
}
