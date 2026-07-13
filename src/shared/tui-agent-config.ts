import type { BuiltInTuiAgent, CustomTuiAgentId, TuiAgent } from './types'
import { getOrcaCliCommandNameForPlatform } from './orca-cli-command-name'

export type AgentPromptInjectionMode =
  | 'argv'
  | 'flag-prompt'
  | 'flag-prompt-interactive'
  | 'flag-interactive'
  | 'hermes-query'
  | 'stdin-after-start'

export type DraftPasteReadySignal =
  | 'render-quiet-after-bracketed-paste'
  | 'codex-composer-prompt'
  | 'render-cursor-after-bracketed-paste'

export type TuiAgentDetectionRuntime = NodeJS.Platform | 'wsl'

export type TuiAgentConfig = {
  detectCmd: string
  /** Additional executable names that identify the same agent on PATH. */
  detectCmdAliases?: readonly string[]
  /** Other commands that must also be present before this agent counts as installed. */
  detectRequiredCommands?: readonly string[]
  /** Detection runtimes where this launch mode is not available as a detected agent. */
  detectUnsupportedRuntimes?: readonly TuiAgentDetectionRuntime[]
  /** Trusted complete launch argv: executable plus fixed subcommands. Structured
   *  so multi-token commands (`kiro-cli chat --tui`) cannot be lost or re-split
   *  by a shell; the startup planner quotes each element exactly once. */
  launchArgv: readonly [string, ...string[]]
  /** Platform-specific launch argv when the public binary name differs. */
  launchArgvByPlatform?: Partial<Record<NodeJS.Platform, readonly [string, ...string[]]>>
  expectedProcess: string
  promptInjectionMode: AgentPromptInjectionMode
  /** Option terminator required before positional prompts that may look like CLI syntax. */
  argvPromptSeparator?: '--'
  /** Why: flag that launches the TUI with the given text already in the
   * input box but NOT submitted, so the user still gets a reviewable draft.
   * Only set when the CLI documents native support — e.g. Claude's
   * `--prefill <text>`. The draft-launch flow prefers this over the
   * post-launch bracketed-paste path because it eliminates the empirical
   * agent-readiness wait entirely: the TUI mounts with the input pre-filled.
   * Agents without native support fall through to the paste-after-ready
   * code path in agent-paste-draft.ts. */
  draftPromptFlag?: string
  /** Why: agents that don't expose a `--prefill <text>`-style CLI flag but
   * CAN read an env var on startup to seed their input box without
   * submitting. Today only pi uses this (via Orca's overlay-installed
   * `orca-prefill` extension reading `ORCA_PI_PREFILL`). Equivalent in
   * effect to `draftPromptFlag`: avoids the bracketed-paste-after-ready
   * race when the agent's startup output is long (pi prints banner,
   * skills, and extensions for several seconds, which keeps the
   * readiness quiet-timer resetting). When set, the draft-launch plan
   * passes the text via this env var instead of pasting after ready. */
  draftPromptEnvVar?: string
  /** Why: agents that gate first-launch behind a "Do you trust this
   * folder?" menu (Cursor-Agent, GitHub Copilot CLI, Codex) consume the
   * bracketed paste as menu input. Pre-write the same trust artifact the
   * agent writes after the user accepts so the menu never fires. The actual
   * file/path written lives in src/main/agent-trust-presets.ts; this flag
   * just routes the workspace path through the matching preset before the
   * agent spawns. */
  preflightTrust?: 'cursor' | 'copilot' | 'codex'
  /** Why: most TUIs need both bracketed-paste enablement and a quiet render
   * window before pasted bytes reliably land in the composer. Codex can use
   * a stronger signal from its own renderer: chat_composer.rs writes the
   * `›` prompt only when the composer row exists, so Orca can paste as soon
   * as that prompt appears after bracketed paste is enabled. */
  draftPasteReadySignal?: DraftPasteReadySignal
  /** Windows Shift+Enter override. Omitted agents keep the legacy Esc+CR path
   * because the renderer cannot infer every local or remote TUI's decoder. */
  windowsShiftEnterEncoding?: 'csi-u'
}

// Why: keyed by BuiltInTuiAgent only — a widened TuiAgent key would silently
// return undefined for custom ids at runtime; dynamic ids resolve their base
// through the catalog identity accessor before indexing this table.
export const TUI_AGENT_CONFIG: Record<BuiltInTuiAgent, TuiAgentConfig> = {
  claude: {
    detectCmd: 'claude',
    launchArgv: ['claude'],
    expectedProcess: 'claude',
    promptInjectionMode: 'argv',
    // Why: `claude --prefill <text>` lands the TUI with `<text>` in the
    // input box, nothing submitted. Strictly better than the paste-after-
    // ready fallback because it eliminates the readiness race entirely.
    // See PR https://github.com/stablyai/orca/pull/926 for context.
    draftPromptFlag: '--prefill'
  },
  'claude-agent-teams': {
    // Why: this is an Orca-provided launch mode, not a separate upstream
    // binary. Detection follows the Orca CLI and requires Claude below.
    detectCmd: 'orca',
    detectCmdAliases: ['orca-dev', 'orca-ide'],
    // Why: the Orca shim alone exists on fresh installs. Require Claude too so
    // onboarding does not report Agent Teams when no agent CLI is installed.
    detectRequiredCommands: ['claude'],
    // Why: native Windows and WSL use Claude's in-process Agent Teams fallback,
    // not the Orca native-pane/tmux-shim wrapper exposed by this agent entry.
    detectUnsupportedRuntimes: ['win32', 'wsl'],
    launchArgv: ['orca', 'claude-teams'],
    launchArgvByPlatform: {
      linux: [getOrcaCliCommandNameForPlatform('linux'), 'claude-teams'],
      win32: [getOrcaCliCommandNameForPlatform('win32'), 'claude-teams']
    },
    expectedProcess: 'claude',
    promptInjectionMode: 'stdin-after-start'
  },
  openclaude: {
    detectCmd: 'openclaude',
    launchArgv: ['openclaude'],
    expectedProcess: 'openclaude',
    promptInjectionMode: 'argv',
    draftPromptFlag: '--prefill'
  },
  codex: {
    detectCmd: 'codex',
    launchArgv: ['codex'],
    expectedProcess: 'codex',
    promptInjectionMode: 'argv',
    preflightTrust: 'codex',
    draftPasteReadySignal: 'codex-composer-prompt'
  },
  autohand: {
    detectCmd: 'autohand',
    launchArgv: ['autohand'],
    expectedProcess: 'autohand',
    promptInjectionMode: 'stdin-after-start'
  },
  ante: {
    detectCmd: 'ante',
    launchArgv: ['ante'],
    expectedProcess: 'ante',
    // Why: `ante --prompt` is Ante's documented headless mode (runs the task
    // once and exits), so Orca launches the bare interactive TUI and injects
    // the composed prompt after startup to keep the hosted session alive.
    promptInjectionMode: 'stdin-after-start'
  },
  opencode: {
    detectCmd: 'opencode',
    launchArgv: ['opencode'],
    expectedProcess: 'opencode',
    promptInjectionMode: 'flag-prompt',
    // Why: opencode enables bracketed paste before its composer mounts; wait
    // for post-\x1b[?2004h show-cursor (\x1b[?25h) so paste hits mounted input.
    draftPasteReadySignal: 'render-cursor-after-bracketed-paste'
  },
  'mimo-code': {
    detectCmd: 'mimo',
    launchArgv: ['mimo'],
    expectedProcess: 'mimo',
    promptInjectionMode: 'flag-prompt',
    // Why: mimo-code shares opencode's flag-prompt paste route, so it gets the
    // same cursor-gated signal by parity (its startup stream is not separately
    // validated); the quiet-window fallback bounds the risk if it differs.
    draftPasteReadySignal: 'render-cursor-after-bracketed-paste'
  },
  pi: {
    detectCmd: 'pi',
    launchArgv: ['pi'],
    expectedProcess: 'pi',
    promptInjectionMode: 'argv',
    // Why: pi has no `--prefill` flag, and bracketed-paste-after-ready
    // races against its multi-second startup output (banner + skills +
    // extensions list) so the paste frequently never lands. Orca's
    // overlay installs an `orca-prefill` pi extension (see
    // src/main/pi/titlebar-extension-service.ts) that reads this env var
    // on session_start and calls `pi.ui.setEditorText(text)`. Same
    // user-visible behavior as `claude --prefill <text>`.
    draftPromptEnvVar: 'ORCA_PI_PREFILL'
  },
  omp: {
    detectCmd: 'omp',
    launchArgv: ['omp'],
    expectedProcess: 'omp',
    promptInjectionMode: 'argv',
    draftPromptEnvVar: 'ORCA_OMP_PREFILL'
  },
  gemini: {
    detectCmd: 'gemini',
    launchArgv: ['gemini'],
    expectedProcess: 'gemini',
    promptInjectionMode: 'flag-prompt-interactive'
  },
  antigravity: {
    detectCmd: 'agy',
    launchArgv: ['agy'],
    expectedProcess: 'agy',
    promptInjectionMode: 'flag-prompt-interactive'
  },
  aider: {
    detectCmd: 'aider',
    launchArgv: ['aider'],
    expectedProcess: 'aider',
    promptInjectionMode: 'stdin-after-start'
  },
  goose: {
    detectCmd: 'goose',
    launchArgv: ['goose'],
    expectedProcess: 'goose',
    promptInjectionMode: 'stdin-after-start'
  },
  amp: {
    detectCmd: 'amp',
    launchArgv: ['amp'],
    expectedProcess: 'amp',
    promptInjectionMode: 'stdin-after-start'
  },
  kilo: {
    detectCmd: 'kilo',
    launchArgv: ['kilo'],
    expectedProcess: 'kilo',
    promptInjectionMode: 'stdin-after-start'
  },
  kiro: {
    // Why: the official Kiro installer (https://cli.kiro.dev/install) places a
    // binary named `kiro-cli` on PATH — there is no `kiro` binary. Keep the
    // TuiAgent id as 'kiro' for stored preferences, but detect/launch/identify
    // the real binary name so the agent is recognized as active.
    detectCmd: 'kiro-cli',
    // Why: trust flags are accepted by Kiro's chat subcommand, not the
    // top-level kiro-cli command. Keep TUI startup explicit so default args
    // like --trust-all-tools are appended where the installed CLI accepts them.
    launchArgv: ['kiro-cli', 'chat', '--tui'],
    expectedProcess: 'kiro-cli',
    promptInjectionMode: 'stdin-after-start'
  },
  crush: {
    detectCmd: 'crush',
    launchArgv: ['crush'],
    expectedProcess: 'crush',
    promptInjectionMode: 'stdin-after-start'
  },
  aug: {
    // Why: the published @augmentcode/auggie npm package installs a binary
    // named `auggie` (not `aug`). Keep the TuiAgent id as 'aug' for stored
    // preferences, but detect/launch/identify the real binary name.
    detectCmd: 'auggie',
    launchArgv: ['auggie'],
    expectedProcess: 'auggie',
    promptInjectionMode: 'stdin-after-start'
  },
  cline: {
    detectCmd: 'cline',
    launchArgv: ['cline'],
    expectedProcess: 'cline',
    promptInjectionMode: 'stdin-after-start'
  },
  codebuff: {
    detectCmd: 'codebuff',
    launchArgv: ['codebuff'],
    expectedProcess: 'codebuff',
    promptInjectionMode: 'stdin-after-start'
  },
  'command-code': {
    // Why: `npm i -g command-code` installs two binaries — `command-code` and
    // the shorter alias `cmd`. Use the full `command-code` name so detection
    // does not collide with Windows' built-in `cmd.exe` shell, which
    // agent-process-recognition normalizes to `cmd` after stripping the .exe.
    detectCmd: 'command-code',
    // Why: Command Code's documented positional prompt starts the turn, while
    // paste-after-start can leave the prompt sitting in the composer. `--trust`
    // mirrors the preflight trust behavior Orca applies to other first-run
    // TUIs so launch prompts do not consume the task text.
    launchArgv: ['command-code', '--trust'],
    expectedProcess: 'command-code',
    promptInjectionMode: 'argv'
  },
  continue: {
    // Why: Continue's CLI binary is `cn`; `continue` is a shell builtin in
    // bash/zsh, so using it here can resolve to the shell keyword instead of
    // the coding agent.
    detectCmd: 'cn',
    launchArgv: ['cn'],
    expectedProcess: 'cn',
    promptInjectionMode: 'stdin-after-start'
  },
  cursor: {
    detectCmd: 'cursor-agent',
    launchArgv: ['cursor-agent'],
    expectedProcess: 'cursor-agent',
    promptInjectionMode: 'argv',
    // Why: cursor-agent's first-launch trust menu ([a]/[w]/[q]) used to
    // swallow our bracketed paste. Pre-writing the same `.workspace-trusted`
    // marker the CLI itself writes after the user accepts (see
    // agent-trust-presets.ts) makes the menu skip entirely, so the draft
    // URL paste lands in the input as intended.
    preflightTrust: 'cursor'
  },
  droid: {
    detectCmd: 'droid',
    launchArgv: ['droid'],
    expectedProcess: 'droid',
    promptInjectionMode: 'argv',
    // Why: Droid decodes CSI-u on Windows and treats Orca's legacy Esc+CR
    // fallback as plain Enter, which submits instead of inserting a newline.
    windowsShiftEnterEncoding: 'csi-u'
  },
  kimi: {
    detectCmd: 'kimi',
    launchArgv: ['kimi'],
    expectedProcess: 'kimi',
    promptInjectionMode: 'stdin-after-start'
  },
  'mistral-vibe': {
    // Why: Mistral's installer and PyPI package expose `vibe` even though the
    // package/project name is mistral-vibe. Keep the old name as an alias for
    // manually wrapped installs.
    detectCmd: 'vibe',
    detectCmdAliases: ['mistral-vibe'],
    launchArgv: ['vibe'],
    expectedProcess: 'vibe',
    promptInjectionMode: 'stdin-after-start'
  },
  'qwen-code': {
    // Why: the upstream package is QwenLM/qwen-code, but its installed CLI
    // executable on PATH is `qwen`, so detect/launch/recognition must use that.
    detectCmd: 'qwen',
    launchArgv: ['qwen'],
    expectedProcess: 'qwen',
    promptInjectionMode: 'stdin-after-start'
  },
  rovo: {
    detectCmd: 'rovo',
    launchArgv: ['rovo'],
    expectedProcess: 'rovo',
    promptInjectionMode: 'stdin-after-start'
  },
  hermes: {
    detectCmd: 'hermes',
    // Why: bare `hermes` opens the classic REPL in recent Hermes releases;
    // `--tui` starts the full-screen agent UI Orca is designed to host.
    launchArgv: ['hermes', '--tui'],
    expectedProcess: 'hermes',
    // Why: Hermes owns prompt delivery through its startup-query contract,
    // which submits only after the TUI composer and session are ready.
    promptInjectionMode: 'hermes-query'
  },
  openclaw: {
    detectCmd: 'openclaw',
    launchArgv: ['openclaw'],
    expectedProcess: 'openclaw',
    promptInjectionMode: 'stdin-after-start'
  },
  copilot: {
    detectCmd: 'copilot',
    launchArgv: ['copilot'],
    expectedProcess: 'copilot',
    // Why: `copilot --prompt <text>` runs non-interactively and exits on
    // completion, which would kill the TUI session Orca is hosting.
    // `-i/--interactive <prompt>` starts an interactive session with the
    // initial prompt pre-executed — the behavior Orca needs.
    promptInjectionMode: 'flag-interactive',
    // Why: Copilot's first-launch trust menu used to swallow our bracketed
    // paste. Pre-appending the workspace path to `trustedFolders` in
    // ~/.copilot/config.json (the same array Copilot's own
    // `addTrustedFolder` writes after the user accepts) makes the menu skip
    // entirely. See agent-trust-presets.ts for the file layout.
    preflightTrust: 'copilot'
  },
  grok: {
    detectCmd: 'grok',
    launchArgv: ['grok'],
    expectedProcess: 'grok',
    // Why: Grok CLI accepts an initial prompt as a positional argv
    // (`grok "fix the bug"`). Prefer argv over stdin-after-start so multi-line
    // / special-character prompts are not typed as raw PTY keystrokes, and so
    // clipboard-derived launch text is not mangled by line-edit shortcuts.
    promptInjectionMode: 'argv',
    // Why: prompts such as `help` or `--version` otherwise select Grok CLI
    // syntax instead of starting an interactive turn with that literal text.
    argvPromptSeparator: '--'
  },
  devin: {
    detectCmd: 'devin',
    launchArgv: ['devin'],
    expectedProcess: 'devin',
    // Why: `devin -- <prompt>` auto-submits immediately (docs.devin.ai/cli).
    // `stdin-after-start` starts the REPL with no argv prompt; Orca then sends
    // `followupPrompt` to the PTY as plain input + Enter after startup (not
    // bracketed paste). Use `draftPrompt` / agent-paste-draft for review-before-send.
    promptInjectionMode: 'stdin-after-start'
  }
}

export function isBuiltInTuiAgent(value: unknown): value is BuiltInTuiAgent {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(TUI_AGENT_CONFIG, value)
}

/** True for a built-in id or a syntactically well-formed custom id. Id syntax alone
 *  never grants launch/fallback authority — callers must still resolve the id against
 *  the live catalog/tombstones. */
export function isTuiAgent(value: unknown): value is TuiAgent {
  if (isBuiltInTuiAgent(value)) {
    return true
  }
  return typeof value === 'string' && isWellFormedCustomTuiAgentId(value)
}

// Canonical lowercase RFC 4122 UUID as produced by crypto.randomUUID().
const CUSTOM_TUI_AGENT_ID_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** Syntax-only check: `custom-agent:<built-in base>:<canonical lowercase UUID>`.
 *  Existence/authority must be proven separately against the catalog. */
export function isWellFormedCustomTuiAgentId(value: unknown): value is CustomTuiAgentId {
  if (typeof value !== 'string' || !value.startsWith('custom-agent:')) {
    return false
  }
  const rest = value.slice('custom-agent:'.length)
  const lastColon = rest.lastIndexOf(':')
  if (lastColon <= 0) {
    return false
  }
  const base = rest.slice(0, lastColon)
  const suffix = rest.slice(lastColon + 1)
  return isBuiltInTuiAgent(base) && CUSTOM_TUI_AGENT_ID_UUID_RE.test(suffix)
}

export function getTuiAgentDetectCommands(config: TuiAgentConfig): string[] {
  return [config.detectCmd, ...(config.detectCmdAliases ?? [])]
}

export function getTuiAgentLaunchArgv(
  config: TuiAgentConfig,
  platform: NodeJS.Platform,
  opts?: { isRemote?: boolean }
): string[] {
  // Why: the SSH relay shim is always named `orca` on Unix, so the local-only
  // `orca-ide` rename (avoids shadowing the GNOME Orca screen reader) must not
  // leak to Linux remotes — the remote has no such desktop binary on PATH.
  if (opts?.isRemote && platform === 'linux') {
    return [...config.launchArgv]
  }
  return [...(config.launchArgvByPlatform?.[platform] ?? config.launchArgv)]
}

/** Legacy space-joined form for pre-resolver callers; catalog argv elements are
 *  single shell-safe tokens, so the join is lossless. Removed with U3. */
export function getTuiAgentLaunchCommand(
  config: TuiAgentConfig,
  platform: NodeJS.Platform,
  opts?: { isRemote?: boolean }
): string {
  return getTuiAgentLaunchArgv(config, platform, opts).join(' ')
}
