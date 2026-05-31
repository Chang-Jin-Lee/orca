import { planCommitMessageGeneration } from '../../../shared/commit-message-plan'
import { renderSourceControlActionCommandTemplate } from '../../../shared/source-control-ai-actions'
import type { ResolvedSourceControlAiGenerationParams } from '../../../shared/source-control-ai'

export type SourceControlGenerationPlanResult =
  | { ok: true; commandLabel: string; delivery: string; caveat: string }
  | { ok: false; error: string }

const SYNTHETIC_COMMIT_PROMPT =
  'Generate a concise git commit message for a synthetic dry-run diff. Return only the commit message.'

export function planSourceControlCommitMessageGeneration(
  params: ResolvedSourceControlAiGenerationParams
): SourceControlGenerationPlanResult {
  const prompt =
    params.commandInputTemplate !== undefined
      ? renderSourceControlActionCommandTemplate(params.commandInputTemplate, {
          basePrompt: SYNTHETIC_COMMIT_PROMPT,
          branch: 'feature/example',
          stagedFiles: 'M src/example.ts',
          stagedPatch: 'diff --git a/src/example.ts b/src/example.ts'
        })
      : SYNTHETIC_COMMIT_PROMPT
  if (!prompt.trim()) {
    return { ok: false, error: 'Command input is empty.' }
  }
  const planned = planCommitMessageGeneration(params, prompt)
  if (!planned.ok) {
    return { ok: false, error: planned.error }
  }
  const delivery =
    planned.plan.stdinPayload === null
      ? 'Prompt is delivered as command arguments.'
      : 'Prompt is piped to the agent over stdin.'
  return {
    ok: true,
    commandLabel: [planned.plan.binary, ...planned.plan.args].join(' '),
    delivery,
    caveat:
      'This checks Orca’s planner only. It does not invoke the CLI, prove PATH or binary availability, or reproduce main-process Windows .cmd resolution.'
  }
}
