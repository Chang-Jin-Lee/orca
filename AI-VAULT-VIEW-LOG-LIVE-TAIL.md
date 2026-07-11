# AI Vault View Log — Live tail (streaming append)

> Pick-up brief for a follow-up to the shipped **AI Vault Session Log Viewer** (v1).
> Design doc: `docs/ai-vault-session-log-viewer.md` (see "Use snapshot and explicit
> reload semantics" and the "Implement live tailing now" rejected-alternative).

## Why this exists

v1 is **snapshot only**. Opening a View Log tab performs one bounded read; an
active agent that keeps appending makes the buffer stale with no notice beyond
documented behavior. The only refresh path today is re-invoking **View Log**
(which forces a fresh generation-safe read on non-dirty tabs). The design doc
deliberately rejected live-tail for v1 because a naive poll / whole-file-reload
loop violates the performance budget.

This track builds a **correct** live tail so a running agent's log updates in
place without re-clicking.

## Goal

For a read-only View Log tab backed by an appendable local (and later remote)
log, stream newly appended content into the existing Monaco model as it is
written — bounded, cancellable, and without re-reading the whole file.

## Why it's hard (what the doc calls out)

A correct live tail needs all of:

- **Byte-offset range reads** — read only the appended tail, not the whole file.
- **Streaming UTF-8 decode with incomplete-line carry state** — a multi-byte
  char or a partial final JSONL record can straddle a read boundary; carry the
  partial bytes/line to the next chunk.
- **Append vs. truncate/rotate detection** — if the file shrinks or its inode/
  identity changes (log rotation), fall back to a full re-read rather than
  appending garbage.
- **Remote framing limits + cancellation** — over the relay/runtime, tail reads
  must respect framing/size limits and cancel cleanly when the tab closes.
- **No watcher outside the worktree root** (v1 rule) — needs an explicit,
  scoped, provider-aware tail mechanism, not a broad filesystem watcher.

## Design sketch (starting point — refine)

- Main-process (or runtime) **read-only** ranged reader: `readLogTail({ resource,
  fromByteOffset }) -> { bytes, nextOffset, truncated }`. Keep it read-only; it
  must never share write capability.
- Renderer tail controller bound to the read-only tab lifecycle:
  - Track last applied byte offset + carried partial-line bytes.
  - On append, decode the new range, split complete lines, append to the Monaco
    model via a read-only-safe edit (bypassing the normal dirty/draft path — the
    tab stays read-only and non-dirty).
  - On `truncated`/identity change, drop state and do a full bounded re-read.
  - Cancel + dispose on tab close (respect the perf budget: release model refs).
- Snapshot remains the default; live mode is opt-in per tab (small affordance) or
  auto for sessions known to be active. **Do not** add a poll loop or reload the
  whole file on a timer.
- Preserve v1 integrity: appended content is display-only; typing/save/rename
  stay hard no-ops; the tab never becomes dirty.

## Interaction with the `logResource` track

Live tail composes with the provider-owned `logResource` contract (separate
brief). Do local file tail first; remote tail depends on the runtime read-only
ranged-read path landing in that track. Coordinate so both use the same
read-only resource abstraction rather than two parallel readers.

## Files to study first

- `docs/ai-vault-session-log-viewer.md` ("Use snapshot and explicit reload
  semantics", "Implement live tailing now" rejected alternative, "Performance
  Budget").
- v1 read path: `src/renderer/src/components/editor/useEditorPanelContentState.ts`
  (bounded read + `reloadContent`, read-generation guard).
- Read-only tab plumbing: `OpenFile.readOnly` and mutation gates in
  `src/renderer/src/store/slices/editor.ts`, `editor-autosave*.ts`.
- Main-process file read + caps: `fs:readFile` path, `src/main/ipc/filesystem-auth.ts`.
- Remote reads: `src/renderer/src/runtime/runtime-file-client.ts`.

## Acceptance / test plan

- Open a local active JSONL log; append records externally; the same tab shows
  appended lines without a full re-read and without re-clicking View Log.
- A record split across a read boundary renders correctly once complete.
- Truncation/rotation triggers a clean full re-read, not corrupted appends.
- Closing the tab cancels the tail and releases the model/reader (no leak, no
  long tasks / jank on multi-MB logs).
- Integrity: live-appended read-only tab cannot be dirtied, saved, or renamed.
- Snapshot behavior unchanged when live mode is off.

## Non-goals

- Normalized conversation rendering.
- Raising the size cap or unbounded buffering of huge logs.
- Multipart/SQLite resolution (that's the `logResource` track).

## Suggested branch / PR

Branch base: `origin/main`. Local-file live tail is a self-contained first PR;
remote tail is a follow-up gated on the runtime read-only ranged-read from the
`logResource` track.
