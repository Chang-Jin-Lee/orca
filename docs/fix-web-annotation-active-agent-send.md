# Fix Web Annotation Sends to Active Agents

## Problem

Issue [#8303](https://github.com/stablyai/orca/issues/8303) reports that sending a browser annotation to an already-running agent on Windows can fail with “The selected terminal is not a recognized agent session.” The browser menu reaches the shared explicit-target path at `src/renderer/src/lib/active-agent-note-send.ts:82`; the message is the `no-agent` result at `src/renderer/src/lib/active-agent-note-send-result.ts:28`.

## Root cause

`getTerminalAgentStatus` trusts fresh pane-scoped hook state unless current title/wait evidence blocks it or `terminalHasShellForegroundProcess` reports a shell (`src/main/runtime/orca-runtime.ts:10229`, `src/main/runtime/orca-runtime.ts:10334`). On Windows, the ordinary foreground read can return the ConPTY shell (for example `powershell.exe`) while a recognized agent remains a live descendant, so readiness and guarded writes incorrectly return `no-agent`.

Local and daemon PTY providers already expose `confirmForegroundProcess` (`src/main/providers/types.ts:212`). Their Windows implementations perform a fresh process scan with exact ConPTY membership (`src/main/providers/local-pty-provider.ts:994`, `src/main/daemon/pty-subprocess.ts:1055`), but the send guard does not use that stronger evidence.

## Non-goals

- Change browser annotation UI, copy, formatting, telemetry, or note routing.
- Relax permission/action-required checks or authorize a shell from hook state alone.
- Add a process scanner, polling, retries, provider-specific runtime branching, or a runtime-global confirmation cache.
- Add confirmation support to SSH/WSL/legacy providers or change mixed-version compatibility.

## Reliability contract

- **Invariant (`terminal-input.guarded-agent-send-authorization`):** a guarded note send writes only to the exact PTY binding checked by the guard, and only while permission/wait evidence allows input. When ordinary foreground evidence identifies a shell, fresh hook state can authorize that PTY only after strong confirmation identifies an agent.
- **Oracle:** fresh explicit agent state + ordinary `powershell.exe` + confirmed `codex` writes to the same PTY. With the same ordinary-shell conflict, confirmed shell/non-agent, unavailable confirmation, PTY exit, or handle rebind writes zero bytes.
- **Gate:** add an experimental entry to `config/reliability-gates.jsonc` with the focused runtime/RPC/provider tests. The existing modified-Enter gate covers the confirmation primitive, not guarded note sends.
- **Diagnostics:** use guarded refusal results and deterministic zero-write/provider-call test evidence. Do not log annotation content or process command lines.

## Design

1. Preserve existing evidence precedence: live permission titles, blocked wait text, and management/shell titles still block before process confirmation.
2. For fresh explicit hook state, keep the ordinary foreground read. Only when it reports a shell and `confirmForegroundProcess` exists, perform one strong confirmation for that status evaluation. Preserve the explicit status only when `recognizeAgentProcess(confirmedProcess)` succeeds; missing, null, thrown, shell, and non-agent confirmation results remain fail-closed for that conflict.
3. Bind the complete status evaluation to one PTY. Capture the handle’s PTY binding before taking the status snapshot or starting either process read, pass that captured `ptyId` to the ordinary read and confirmation, and reject if the handle no longer has that binding after either await. In the guarded RPC callback, compare the callback’s actual write `ptyId` with the handle binding before and after status evaluation; a mismatch is not writable and writes no bytes.
4. Keep the runtime provider-agnostic and reuse the existing provider/daemon contracts. Add optional confirmation to the runtime controller and forward it through the existing PTY controller adapter to `getProviderForPty(ptyId).confirmForegroundProcess`; unsupported providers and routing errors return unavailable evidence. No renderer, RPC schema, daemon protocol, or `IPtyProvider` interface change is needed.

## Data flow

- Browser annotation menu selects an eligible agent pane.
- Renderer resolves the explicit terminal and requests agent readiness.
- Runtime sees fresh hook state plus an ordinary shell foreground result.
- Owning PTY provider confirms current agent identity; runtime revalidates the PTY binding.
- Recognized agent + unchanged binding → guarded paste/submit proceeds.
- Missing/unconfirmed agent or changed binding → reject before writing.

## Edge cases

- Agent or PTY exits during confirmation: reject.
- Handle rebinds while either foreground read is pending: reject as not writable; never transfer status evidence or authority to the replacement PTY.
- Confirmation finds an unrelated agent outside the ConPTY: existing membership filtering rejects it.
- Confirmation finds a different recognized agent in the same PTY: generic agent identity is sufficient; permission/title/wait evidence still decides sendability.
- Provider lacks confirmation or runs an older daemon/runtime: an ordinary-shell conflict remains fail-closed.
- macOS/Linux shell conflicts use the same provider-owned confirmation path; ordinary non-conflicting sends are unchanged.
- Concurrent sends keep independent PTY bindings while provider snapshot work may be deduplicated.

## Test plan

- Runtime unit: fresh explicit state + ordinary shell + confirmed recognized agent is sendable.
- Runtime unit: shell/non-agent/null/throw/missing confirmation remains rejected; confirmation is skipped for permission/wait/title blockers and ordinary recognized foreground evidence.
- Runtime unit: a deferred ordinary read or confirmation followed by PTY exit/rebind cannot authorize the stale or replacement PTY, and both process reads receive the originally captured `ptyId`.
- RPC unit: guarded callback checks the exact write `ptyId`; a rebind returns not writable and invokes no write.
- PTY controller routing unit: confirmation reaches the provider that owns the captured `ptyId`; an unsupported provider or routing failure returns unavailable evidence.
- Provider/daemon regression: existing fresh-scan ordering, ConPTY membership, delayed-exit, mixed-version, and cached-follow-up tests remain green.
- Renderer regression: existing active-agent note-send and browser annotation menu tests remain green.
- Static gates: focused Vitest slices, `pnpm typecheck`, `pnpm lint`, and `pnpm check:max-lines-ratchet`.
- Electron: create an annotation, choose an already-running agent, verify delivery without the recognition error, repeat the send, and smoke-test the adjacent New agent section.

## Performance and blast radius

This is not “one scan per send”: readiness and guarded writes evaluate status more than once, and long pastes retain the existing per-16 KiB guard. Each evaluation may add at most one confirmation only for the exceptional `fresh hook + ordinary shell` conflict. Existing provider snapshot/cache dedup remains authoritative. Tests must show no confirmation, polling, retry, session listing, or extra subprocess on non-conflicting checks.

Local and daemon PTYs on macOS, Linux, and Windows can use confirmation. SSH/older providers without it remain conservative. Renderer, startup, persistence, mobile, and multi-window contracts do not change; PTY-binding revalidation prevents a delayed result from crossing sessions.

## UI quality bar

No visual code changes. The annotation send menu must retain its existing STYLEGUIDE-compliant layout, existing-agent rows, New agent section, copy, focus behavior, and real refusal messaging. Successful sends must not show the recognition-error toast/dialog.

## Review screenshots

1. Browser annotation send menu open with the existing active agent and New agent section visible.
2. Existing agent terminal after the first annotation is delivered, with no recognition error visible.
3. Repeat-send result showing the same agent accepts another annotation.
4. Adjacent annotation menu state after delivery, proving the send UI remains intact.

## Rollout

1. Add runtime confirmation and exact-PTY revalidation with focused regression tests.
2. Add/update the experimental reliability gate and run focused/static checks.
3. Validate the browser annotation golden path, repeat path, and adjacent menu in Electron.
4. Open an unmerged PR with macOS Electron screenshots and deterministic Windows/ConPTY test evidence; note physical Windows as a residual validation gap.

## Lightweight Eng Review

- Scope: One runtime authorization fallback plus exact-PTY revalidation; no browser-specific bypass or new process-detection system.
- Architecture/data flow: Runtime remains authorization owner; the owning PTY provider supplies strong process truth; renderer only selects and maps results.
- Failure modes covered: agent/PTY exit, handle rebind, unavailable confirmation, unrelated process, permission state, concurrent sends, mixed-version providers.
- Test coverage required: runtime status/rebind units, guarded RPC zero-write unit, existing provider/daemon confirmation suites, renderer routing suites, Electron golden/repeat/adjacent scenarios.
- Performance/blast radius: Exceptional-path confirmation only; provider dedup is reused; non-conflicting call counts prove no added scans or loops.
- UI quality bar: No visual change; existing dropdown and refusal states stay consistent with `docs/STYLEGUIDE.md`.
- Required review screenshots: existing-agent/New agent menu, first delivery, repeat delivery, post-delivery adjacent state.
- Residual risks: Physical Windows validation is unavailable on this macOS host; deterministic ConPTY membership/confirmation tests cover the reported platform contract, while Electron proves live end-to-end routing on the available host.
