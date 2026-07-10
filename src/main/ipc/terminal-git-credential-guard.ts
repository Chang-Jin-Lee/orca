import { promptGuardGitEnv } from '../git/runner'
import { recognizeAgentProcessFromCommandLine } from '../../shared/agent-process-recognition'

/**
 * Disable git's interactive credential prompt for a terminal's environment so a
 * git operation that needs GitHub auth cannot make the OS credential helper
 * (Git Credential Manager on Windows) pop its "Connect to GitHub" OAuth window
 * — which, in a network-restricted intranet, can never complete and gets
 * re-triggered in a loop by git's credential retry (issue #7652).
 *
 * The credential *helper* is kept, so cached-token auth still works; only the
 * interactive fallback prompt is suppressed. Agent terminals are always guarded
 * (they can't dismiss a GUI popup); user terminals are guarded unless the user
 * opted out via settings.
 *
 * Mutates `env` in place to match how the PTY host assembles its environment.
 */
export function applyTerminalGitCredentialPromptGuard(
  env: Record<string, string>,
  opts: { launchCommand?: string | null; suppressUserTerminalPrompt: boolean }
): void {
  const isAgentTerminal = Boolean(recognizeAgentProcessFromCommandLine(opts.launchCommand))
  if (!isAgentTerminal && !opts.suppressUserTerminalPrompt) {
    return
  }
  for (const [key, value] of Object.entries(promptGuardGitEnv(env))) {
    if (typeof value === 'string') {
      env[key] = value
    }
  }
}
