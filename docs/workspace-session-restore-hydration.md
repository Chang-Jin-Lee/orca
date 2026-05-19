# Workspace Session Restore and Incomplete Worktree Hydration

## Problem

A user reported that after reloading while Orca was updating, their workspaces did not load or were not interactable. The crash-report portion was a separate false positive caused by intentional Electron process teardown. The workspace symptom points at renderer startup state instead: persisted session state can be mounted against an incomplete worktree list.

## Original User Report

The report came from Orca `1.4.4` on macOS `25.4.0` arm64. The submitted crash report had:

- report ID `58535131-6384-4d30-a3dc-75d9b590544d`;
- reason `killed`;
- exit code `15`;
- submitted at `2026-05-19T19:26:41.784Z`;
- Electron `41.5.0`;
- Chrome `146.0.7680.216`.

The user feedback was:

```text
reload while was updating and it crashes
```

The crash breadcrumbs showed repeated Claude agent state changes followed by two main-window reloads:

```text
2026-05-19T19:03:35.386Z agent_state_changed (agentType=claude, state=working)
2026-05-19T19:04:09.363Z agent_state_changed (agentType=claude, state=done)
2026-05-19T19:04:38.275Z agent_state_changed (agentType=claude, state=working)
2026-05-19T19:04:55.528Z agent_state_changed (agentType=claude, state=working)
2026-05-19T19:04:55.634Z agent_state_changed (agentType=claude, state=working)
2026-05-19T19:05:05.455Z agent_state_changed (agentType=claude, state=working)
2026-05-19T19:06:08.980Z agent_state_changed (agentType=claude, state=working)
2026-05-19T19:06:09.118Z agent_state_changed (agentType=claude, state=working)
2026-05-19T19:06:16.802Z agent_state_changed (agentType=claude, state=working)
2026-05-19T19:07:06.856Z main_window_loaded
2026-05-19T19:07:14.583Z main_window_loaded
2026-05-19T19:08:17.053Z agent_state_changed (agentType=claude, state=working)
2026-05-19T19:08:22.818Z agent_state_changed (agentType=claude, state=working)
```

Follow-up investigation separated this into two issues:

- the crash dialog was likely caused by expected Electron process teardown during reload/update;
- the user-visible "workspaces did not load / were not interactable" symptom likely came from session restore proceeding with incomplete worktree hydration.

Orca startup restores state in this order:

1. Load settings.
2. Load repos.
3. Fetch all worktrees.
4. Load persisted UI.
5. Load the workspace session.
6. Hydrate terminal, editor, tab, and browser state.
7. Reconnect persisted terminals.
8. Mark hydration successful so the session writer can save again.

The risky edge is between steps 3 and 6. `hydrateWorkspaceSession` validates persisted worktree IDs against `worktreesByRepo`. For local repos, a missing worktree ID is treated as deleted and the corresponding saved tabs/workspace state is filtered out.

That is correct only when the worktree list is authoritative.

## Failure Mode

`fetchAllWorktrees` already had a safety gate for the hydration-time purge: if any repo's `worktrees.list` call fails, or if every repo returns an empty list, it defers purging stale `tabsByWorktree` entries. That prevents disk-backed saved tabs from being deleted by a transient Git or IPC problem.

However, startup still continued into session hydration after that degraded fetch. If the saved session referenced local workspaces and `worktreesByRepo` was empty or partial, `hydrateWorkspaceSession` classified those saved local workspaces as invalid in memory.

The likely user-visible result:

- The app shell mounts.
- The saved active worktree is missing.
- Terminal/editor/browser state for that worktree may be filtered out.
- The terminal surface can be hidden or inert because there is no active worktree.
- If reconnect completes, startup may mark hydration successful, allowing later session writes from the degraded in-memory state.

This matches the report better than a native crash: the app could restart, but the restored workspace model was empty or not actionable.

## Fix

`fetchAllWorktrees` now returns a small startup signal:

```ts
type FetchAllWorktreesResult = {
  canHydrateSession: boolean
}
```

The result separates two questions that used to be conflated:

- Can the hydration-time stale-state purge run?
- Is the current worktree map complete enough to validate a persisted session?

Startup now reads the persisted session after UI hydration, then asks `shouldDeferSessionHydrationUntilWorktreesLoaded` whether local session state would be validated against incomplete worktree data. If so, startup throws into the existing session-restore failure path.

That failure path intentionally:

- leaves the persisted session on disk untouched;
- keeps `hydrationSucceeded` false so the debounced session writer is gated;
- flips `workspaceSessionReady` so the app shell remains usable;
- shows the existing sticky "Session restore failed" toast with a restart action.

This is preferable to hydrating a partially empty session and treating it as a successful restore.

## SSH and Floating Terminal

The guard only defers when incomplete worktree hydration would affect local workspace state.

SSH-backed workspaces are exempt because they are reconstructed after SSH reconnect. Their worktree IDs can be valid even when `worktreesByRepo` is initially empty.

The floating terminal is also exempt because it is intentionally not a repo worktree and should not depend on repo worktree discovery.

## Tests

The regression tests cover:

- local workspace session state defers when worktree hydration is incomplete;
- local editor/browser/tab state keyed by worktree ID also defers;
- SSH-backed workspaces and the floating terminal can still hydrate during incomplete local worktree startup;
- `fetchAllWorktrees` reports `canHydrateSession=false` when every repo returns empty during initial hydration;
- existing purge behavior still defers stale-state cleanup until worktree lists are authoritative.

## Non-Goals

This change does not attempt to retry worktree hydration in place before session restore. A retry loop may be useful later, but the immediate safety requirement is to avoid successful hydration from incomplete data.

This change also does not alter the separate crash-report filtering for Electron SIGTERM process teardown. That fix lives in the crash-reporting path and addresses the false crash prompt, not the workspace restore state.
