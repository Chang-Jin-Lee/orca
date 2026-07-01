# SSH Terminal Reconnect Empty Pane

## Problem

- `TerminalPane` records PTY errors only after `connectPanePty` reports one, so a restored SSH terminal can mount with no visible instruction while it waits for user-driven reconnect state (`src/renderer/src/components/terminal-pane/TerminalPane.tsx:523`).
- `connectPanePty` intentionally waits for a user-initiated SSH connect when the target needs a passphrase/password, then returns without surfacing terminal UI if the user has not started that connect flow (`src/renderer/src/components/terminal-pane/pty-connection.ts:4495`).
- The existing reconnect action lives in `SshDisconnectedDialog`, not in the terminal pane, so users can miss the required action on the first landing terminal (`src/renderer/src/components/sidebar/SshDisconnectedDialog.tsx:73`).
- `WorktreeCard` auto-opens the disconnected dialog for active SSH worktrees, but that prompt is owned by the sidebar/card surface and is not a reliable terminal empty-state affordance (`src/renderer/src/components/sidebar/WorktreeCard.tsx:376`).

## Root Cause

The SSH deferred reattach path correctly avoids surprise passphrase prompts, but the active terminal pane does not render an inline SSH connection gate while that path waits. The first terminal can therefore look blank until a later action, such as opening another terminal, triggers a visible failure or prompt.

## Non-goals

- Do not change SSH credential, passphrase, or reconnect semantics.
- Do not auto-open passphrase prompts from terminal focus.
- Do not change runtime-owned SSH targets or remote Orca server behavior.
- Do not redesign the sidebar disconnected dialog.

## Design

1. Add a terminal-pane SSH reconnect overlay for user-managed SSH worktrees whose connection status is not `connected`.
2. Reuse the existing `window.api.ssh.connect({ targetId })` connection path from the sidebar dialog.
3. Show a primary `Connect` button for reconnectable statuses and a disabled `Connecting...` state for in-flight statuses.
4. Hide the overlay immediately when the store reports the SSH target as `connected`.
5. Keep the overlay visual treatment token-based and scoped to the terminal surface.

## Data Flow

- `TerminalPane` resolves the worktree SSH target from Zustand state.
- If the target is user-managed and `sshConnectionStates[targetId]?.status !== 'connected'`, render the overlay.
- The overlay button calls `window.api.ssh.connect({ targetId })` and writes a returned connection state into the renderer store.
- SSH store updates then drive both overlay state and the waiting `connectPanePty` deferred reattach continuation.

## Edge Cases

- Missing SSH state: treat as disconnected so the user still sees a connect action during hydration gaps.
- In-flight statuses (`connecting`, `deploying-relay`, `reconnecting`): show progress and disable the button.
- Failure statuses (`auth-failed`, `error`, `reconnection-failed`): keep the button available and surface connect failure via toast.
- Runtime-owned SSH targets: suppress this user-facing overlay because users cannot directly connect those hidden plumbing targets.
- Split terminal panes: render one worktree-level overlay rather than a repeated card per split pane.

## Test Plan

- Unit/component test for the overlay: disconnected renders a `Connect` button and clicking calls `window.api.ssh.connect` with the target ID.
- Unit/component test for the overlay: connecting renders a disabled progress button.
- Unit/component test for the overlay: failed connect shows an error toast and re-enables the button.
- Unit/component test for the overlay: returned connect state updates the renderer SSH store so deferred terminal reattach can resume before the state-change IPC lands.
- Typecheck and lint the touched renderer files.
- Electron validation: load a connected SSH worktree, simulate the target becoming disconnected, and verify the active terminal surface shows the connect instruction and button.

## UI Quality Bar

The overlay must read like a quiet Orca empty/error state: centered in the terminal pane, token-based colors, concise copy, one obvious primary action, no overlap with tab/header chrome, and no repeated cards in split layouts.

## Review Screenshots

1. Connected SSH worktree terminal before the drop: overlay absent and terminal usable.
2. Same terminal after the SSH target becomes disconnected: overlay visible with host label and `Connect`.
3. Same terminal after clicking `Connect`: disabled `Connecting...` state.
4. Reconnected SSH worktree terminal: overlay absent and terminal usable.

## Rollout

1. Add the terminal-pane overlay component and focused tests.
2. Wire `TerminalPane` to derive SSH reconnect state from the store and render the overlay.
3. Run targeted tests, typecheck/lint as feasible, and capture validation screenshots if Electron can be launched.

## Lightweight Eng Review

- Scope: kept to terminal-pane UI and the existing SSH connect API; no backend reconnect behavior changes.
- Architecture/data flow: `TerminalPane` owns the empty terminal surface, while SSH connection state remains in the existing store and `window.api.ssh.connect` path. The overlay mirrors a successful returned connect state into the store because the state-change IPC can arrive later than the call result.
- Failure modes covered:
  - Passphrase-gated reconnect waits without visible action.
  - Store status missing during hydration.
  - User cancels or fails authentication.
  - Runtime-owned SSH targets should not show a dead connect button.
- Test coverage required:
  - Component tests for overlay states and connect invocation.
  - Component test for returned connect-state publication.
  - Integration/Electron screenshots for connected -> disconnected -> reconnecting -> connected states.
- Performance/blast radius: no polling, no new IPC except user-clicked connect; one extra store subscription in mounted terminal panes.
- UI quality bar: token-based centered terminal empty state with a single primary action and no layout overlap.
- Required review screenshots:
  1. Connected terminal before simulated disconnect.
  2. Disconnected terminal with `Connect`.
  3. In-flight `Connecting...`.
  4. Connected terminal after recovery.
- Residual risks: Electron validation may require a live or mocked SSH target/passphrase flow; if unavailable, capture the nearest reachable state and stop before PR creation.
