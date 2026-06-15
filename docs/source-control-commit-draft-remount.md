# Preserve Source Control Commit Drafts Across Panel Remounts

## Problem

Issue [#5369](https://github.com/stablyai/orca/issues/5369) reports that typing a Source Control commit message, minimizing/closing the VCS panel to inspect a diff, then reopening Source Control loses the draft.

Relevant code:
- `src/renderer/src/components/right-sidebar/index.tsx:161-176` only renders `RightSidebarPanelContent` while `rightSidebarOpen` is true, so closing the right sidebar unmounts the active panel tree.
- `src/renderer/src/components/right-sidebar/right-sidebar-panel-content.tsx:21-31` renders only the effective tab, so switching away from Source Control also unmounts `SourceControl`.
- `src/renderer/src/components/right-sidebar/SourceControl.tsx:848-850` stores commit drafts in `useState` local to `SourceControl`.
- `src/renderer/src/components/right-sidebar/SourceControl.tsx:894` reads the visible textarea value from that local map.
- `src/renderer/src/components/right-sidebar/SourceControl.tsx:4174-4181` writes textarea changes back into the local map.
- `src/renderer/src/components/right-sidebar/SourceControl.tsx:1506-1519` clears the draft after a successful commit only if it still matches the committed message.
- `src/renderer/src/components/right-sidebar/SourceControl.tsx:1627-1636` preserves manual text over a late AI-generated message.

## Root cause

The commit draft already has the correct worktree-scoped shape, but its owner is the `SourceControl` component. Closing the right sidebar or switching to another right-sidebar tab unmounts that component, discarding the in-memory draft map before the user returns.

## Non-goals

- Persist drafts across app restart, reload, or account/session boundaries.
- Change commit behavior, staging behavior, AI generation, hosted review creation, or git polling.
- Add main-process IPC, disk storage, migrations, or backend state.
- Redesign the Source Control UI.

## Design

Move only the commit-message draft lifetime from `SourceControl` component state to a renderer-session Zustand slice. Do not persist it to disk and do not move commit execution, AI generation, errors, or in-flight flags.

1. Add `src/renderer/src/store/slices/source-control-commit-drafts.ts`.
   - State: `sourceControlCommitDraftsByWorktree: Record<string, string>`.
   - Actions:
     - `setSourceControlCommitDraft(worktreeId, value)`.
     - `clearSourceControlCommitDraftIfUnchanged(worktreeId, committedTrimmedMessage)`.
     - `setSourceControlCommitDraftIfEmpty(worktreeId, generatedMessage)` for AI generation.
     - `omitSourceControlCommitDraftsForWorktrees(removedWorktreeIds)`.
   - Export pure helpers from this slice, not from `SourceControl.tsx`, so draft tests do not import the full React component.
   - Return the previous record when a write would be a no-op; otherwise every keystroke with an unchanged value still creates a store update.
2. Wire the slice into `src/renderer/src/store/index.ts` and `src/renderer/src/store/types.ts`.
3. Update `SourceControl` to read and write drafts through the slice.
   - Select only the active worktree's draft, e.g. `useAppStore((s) => activeWorktreeId ? s.sourceControlCommitDraftsByWorktree[activeWorktreeId] ?? '' : '')`; do not subscribe `SourceControl` to the whole draft map.
   - Keep action selectors separate/stable as this file already does for most store actions.
   - `onCommitMessageChange` writes the active worktree draft.
   - Successful commit calls `clearSourceControlCommitDraftIfUnchanged(activeWorktreeId, message)`, where `message` is the trimmed value passed to `commitRuntimeGit`.
   - AI generation calls `setSourceControlCommitDraftIfEmpty`; it must still refuse to overwrite any non-empty stored draft when the async generation resolves.
4. Prune drafts from the always-alive worktree cleanup paths, not only from a `SourceControl` effect.
   - Add `sourceControlCommitDraftsByWorktree` to `buildWorktreePurgeState` in `src/renderer/src/store/slices/worktrees.ts` so authoritative worktree scans purge drafts for deleted worktrees even while Source Control is unmounted.
   - Also clear the removed worktree's draft in the explicit `removeWorktree` success cleanup block, which currently duplicates parts of the purge helper instead of routing through it.
   - Remove draft pruning from the `SourceControl`-local cleanup effect. That effect should continue to own only component-local error/in-flight/history records.
5. Move/extend the existing draft helper tests to the new slice file or a focused draft-helper test. Avoid adding more assertions to tests that import the whole `SourceControl.tsx` unless those assertions actually need component-level exports.

## Data flow

- User types in `CommitArea` textarea.
- `CommitArea.onCommitMessageChange` -> `SourceControl` -> `setSourceControlCommitDraft(activeWorktreeId, value)`.
- Closing the right sidebar or switching right-sidebar tabs unmounts `SourceControl`, but the renderer store remains alive.
- Reopening Source Control remounts `SourceControl`, which reads the active draft from `sourceControlCommitDraftsByWorktree[activeWorktreeId]`.
- Successful commit -> `clearSourceControlCommitDraftIfUnchanged(worktreeId, committedTrimmedMessage)`.
- Worktree deletion/store pruning -> `omitSourceControlCommitDraftsForWorktrees(removedWorktreeIds)` through the worktree store cleanup path.

## Edge cases

- Switching worktrees keeps independent drafts per worktree.
- Switching away from Source Control and back preserves the active worktree draft.
- Closing/reopening the right sidebar preserves the active worktree draft during the current renderer session.
- Closing the app window, renderer reload/crash, or store recreation still loses drafts; that is intentional for this bug.
- Multiple app windows, if present, do not share renderer stores. A draft typed in one window is not expected to appear in another without adding persistence or IPC, both out of scope.
- Successful commit clears the draft only if the stored draft still trims to the committed message.
- If the user types more while commit is in flight, successful commit does not clear the newer text. The textarea is currently still editable during commit; the commit button is what becomes in-flight/disabled.
- If a commit fails, the draft remains.
- If the user replaces the draft with whitespace while a commit is in flight, the unchanged-trim guard will clear it after success because the committed value and current trimmed value match. This matches existing behavior.
- AI-generated commit messages do not overwrite a non-empty manual draft after async completion.
- Deleted worktrees do not leave stale draft entries that a reused ID could inherit, including deletes discovered while Source Control is unmounted.
- External git mutations, status polling, staging changes, branch comparison refreshes, and hosted review refreshes do not clear the draft. Only successful Orca commit and worktree pruning clear it.
- SSH worktrees use the same renderer worktree ID path; no local filesystem assumption is introduced.
- Windows/Linux/macOS behavior is identical because the change is renderer state only.

## Invalidation and consistency

- Draft identity is `activeWorktreeId`, not repo path or branch. This is correct for the current bug because existing Source Control state and cleanup are keyed by worktree ID, but it means a branch change inside the same worktree intentionally keeps the draft.
- Pruning must use renderer worktree IDs from the store cleanup path (`buildWorktreePurgeState` and explicit remove-worktree success cleanup). Do not invent filesystem existence checks; remote/SSH worktrees may not be locally inspectable.
- Store actions must use functional `set` so async commit/generation completions compare against the latest draft, not the stale `commitMessage` captured when the request started.
- This design does not attempt cross-window or cross-process conflict resolution. Adding that would require persistence/IPC and a newer-wins policy, which is outside the issue scope.

## Test plan

- Unit: new/focused draft slice tests, or `SourceControl.commit-drafts.test.ts` after moving draft helpers out of `SourceControl.tsx`:
  - read missing/null worktree as empty string;
  - write/read independent per-worktree drafts;
  - unchanged write returns the same record;
  - clear succeeds only when current draft trims to the committed trimmed message;
  - clear preserves newer text typed after commit start;
  - AI set-if-empty writes into an empty/missing draft and preserves non-empty manual text;
  - prune removes deleted worktree IDs and returns the same record when nothing changes;
  - a store-level regression showing the draft survives simulated component owner recreation by writing through one store read path and reading through another;
  - a worktree-store cleanup regression showing removed worktree IDs also drop their drafts when Source Control is not mounted.
- Relevant targeted test command:
  - `pnpm vitest run src/renderer/src/store/slices/source-control-commit-drafts.test.ts src/renderer/src/components/right-sidebar/SourceControl.commit-drafts.test.ts`
  - If no component-level draft test remains after moving helpers, run only the new slice test.
- Broader checks:
  - `pnpm typecheck`
  - `pnpm lint`
- Electron validation:
  - Type a commit message in Source Control, close the right sidebar, reopen Source Control, confirm the message remains.
  - Type a commit message, switch to another right-sidebar tab, return to Source Control, confirm the message remains.
  - Start a commit, type additional text before it completes, and confirm the additional text is not cleared after success.
  - Smoke-check normal Source Control staging/diff browsing remains usable.

## UI quality bar

UI-visible behavior changes only by preserving the textarea value. The Source Control UI should look unchanged and continue to use the existing textarea, spacing, typography, colors, icons, and enabled/disabled states from adjacent Source Control UI and `docs/STYLEGUIDE.md`.

## Review screenshots

Required for yolo-lite validation:

1. Source Control with a typed unsent commit message before closing/switching panels.
2. Source Control reopened after the right sidebar was closed, showing the same commit message.
3. Source Control after switching to another right-sidebar tab and back, showing the same commit message.
4. Adjacent diff/staged-file smoke state while the preserved message remains visible.

## Rollout

1. Add the draft slice and pure draft helpers.
2. Register the slice with the app store types and store factory.
3. Update `SourceControl` to read/write/clear drafts through the store while leaving local error/in-flight/history state local.
4. Add draft pruning to the worktree store cleanup paths.
5. Move/extend targeted unit tests.
6. Run targeted unit test, typecheck, lint.
7. Validate in Electron.

## Lightweight Eng Review

- Scope: Correctly reduced to renderer-session, worktree-scoped draft lifetime. No disk persistence, IPC, migrations, or UI redesign.
- Architecture/data flow: Zustand is an appropriate renderer-owned boundary for surviving right-sidebar panel unmounts. The slice should own draft-only state and pure helper logic; `SourceControl` should keep commit execution, errors, in-flight refs, generation state, and history state where they are.
- Failure modes covered:
  - right-sidebar close unmounts `SourceControl`;
  - source-control tab switch unmounts `SourceControl`;
  - async commit completion after further typing;
  - failed commit preserving the draft;
  - late AI generation after manual typing;
  - deleted worktree stale draft retention, including deletes discovered while Source Control is unmounted;
  - SSH worktree IDs flowing through the same renderer state path.
- Gaps intentionally not solved:
  - app restart/reload/crash;
  - cross-window draft synchronization;
  - branch-specific draft invalidation inside the same worktree;
  - external git operations clearing or rewriting drafts.
- Test coverage required: helper/slice tests for per-worktree drafts, unchanged-only clear, AI set-if-empty, prune, no-op identity, and store lifetime; worktree/store cleanup coverage for deleting draft state with removed worktrees; Electron validation for close/reopen and tab-switch paths. No separate SSH E2E is required because no runtime/file-path code changes.
- Performance/blast radius: No polling, IPC, file watching, startup, or persistence cost. Keystrokes now write to the global renderer store, so select only the active draft string and avoid subscribing to the full draft map. This keeps re-renders bounded to Source Control consumers that actually read the active draft.
- UI quality bar: Rendered Source Control must be visually unchanged; only the textarea value should survive remounts. Validate against `docs/STYLEGUIDE.md` if any markup/class changes slip in.
- Screenshot requirement: Required by the yolo-lite validation flow for the visible Source Control states listed above, even though the intended UI change is state lifetime rather than layout.
- Residual risks: If future code remounts the entire renderer/store, drafts will still be lost. If future product expectations shift toward restart or multi-window persistence, this design is the wrong layer and should be replaced with an IPC/persistence-backed draft store.
