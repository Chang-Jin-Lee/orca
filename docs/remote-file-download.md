# Remote File Download

## Problem

SSH worktrees can browse and edit remote files, but the file explorer offers no GUI download action. The current file row menu has copy, duplicate, preview, browser, reveal, rename, and delete actions, but no download item for SSH files (`src/renderer/src/components/right-sidebar/FileExplorerRow.tsx:510`). The file explorer already knows the active repo connection at the toolbar boundary (`src/renderer/src/components/right-sidebar/FileExplorer.tsx:457`), while filesystem IPC and the SSH provider can read remote files (`src/main/ipc/filesystem.ts:338`, `src/main/providers/ssh-filesystem-provider.ts:104`). That preview/read path is not a safe download implementation because it can impose preview limits or transform bytes into text/base64.

## Goal

Add a file explorer context-menu action that lets users download a single file from an SSH worktree to a local destination selected by the native save dialog.

## Non-Goals

- Local file "download" or save-as behavior.
- Folder download, recursive archives, or multi-file download.
- Background queue/progress UI.
- Changing remote relay protocol.
- Electron screenshot validation for this issue; the user explicitly asked to skip Electron verification.

## Design

1. Add a raw-download capability to the SSH filesystem provider.
   - Extend `IFilesystemProvider` with optional `downloadFile(sourcePath, destinationPath)`.
   - Implement it in `SshFilesystemProvider` with a fresh SFTP channel, wrapping `fastGet` so arbitrary binary files copy byte-for-byte and bypass preview-size/content conversion.
   - Fail closed with a clear reconnect-style error such as `Remote file download is unavailable. Reconnect the SSH target and retry.` when the provider has no SFTP factory.
   - Always close the SFTP channel in `finally`.

2. Add a main-process IPC handler `fs:downloadFile`.
   - Accept only `{ filePath, connectionId }`; the renderer must never provide the local destination path. Return `{ canceled: true } | { canceled: false; destinationPath: string }`.
   - Require trimmed, non-empty `filePath` and `connectionId`; local paths are out of scope.
   - Resolve the SSH provider, `stat` the remote path, reject directories, then show `dialog.showSaveDialog` with the remote basename as `defaultPath`.
   - Use `BrowserWindow.fromWebContents(event.sender)` to parent the native dialog when possible.
   - Use `getRuntimePathBasename`, not host `path.basename`, for the suggested filename so Windows-style remote paths work from macOS/Linux hosts.
   - Sanitize only the suggested local filename before passing it to the save dialog; do not alter the remote source path. Cover path separators, NUL/control characters, Windows reserved names, trailing dots/spaces, and empty basenames.
   - If the user cancels, return `{ canceled: true }`.
   - Treat the native dialog result as the authorization for the chosen local destination. Do not pass that destination through workspace `resolveAuthorizedPath`, because downloads may legitimately save outside Orca's registered roots.
   - After the dialog returns, inspect the chosen local destination before transfer. Reject an existing directory, record whether a file already existed, and download to a unique temporary sibling file.
   - Promote only the completed temp file. If the destination existed when inspected, handle the confirmed overwrite with a sibling backup-swap: rename existing destination to a unique backup, rename temp to destination, then delete the backup; restore the backup best-effort if promotion fails. If the destination did not exist when inspected but appears before promotion, fail rather than clobber an unconfirmed file.
   - Clean up temporary and backup files on failure so interrupted transfers do not leave a truncated final file.
   - Return `{ canceled: false, destinationPath }` after the rename succeeds.

3. Expose the IPC through preload types.
   - Add `window.api.fs.downloadFile(...)` to `src/preload/index.ts`.
   - Add checked TypeScript declarations in `src/preload/api-types.ts`.
   - Update `src/renderer/src/web/web-preload-api.ts` with an unsupported stub or equivalent so the shared `PreloadApi['fs']` type still typechecks; the visible action remains desktop-only because this design depends on Electron's native save dialog.

4. Add the UI action to SSH file rows.
   - Thread `connectionId` from `FileExplorer.tsx` into `FileExplorerVirtualRows` and `FileExplorerRow`.
   - Show `Download` only when `connectionId` exists, the renderer is not the paired web client (`globalThis.__ORCA_WEB_CLIENT__ !== true`), and the node is not a directory; keep symlink rows visible and let IPC reject symlinks that resolve to directories.
   - Use a lucide download icon and the existing `ContextMenuItem` primitive.
   - Put the action near other file-only actions, before the local reveal/open-containing-folder item.
   - On success, show a concise toast with an `Open` action that reveals the saved local file. On cancel, stay quiet. On error, show a failure toast.
   - Keep the existing local reveal guard untouched; this action is a separate remote-to-local save path.
   - Keep new row logic small. Prefer a named predicate such as `shouldShowRemoteDownloadAction` for visibility tests, and do not add or change `max-lines` disables.

5. Tests.
   - Main IPC: missing/empty file path/connection, unavailable provider, directory rejection before dialog, cancel behavior before transfer, dialog parenting, sanitized default filename including Windows-reserved cases, destination-directory rejection, temp/backup cleanup, Windows overwrite handling, fail-on-unconfirmed-destination-appears, selected destination promotion, and unavailable raw download capability.
   - SSH provider: SFTP download calls the raw transfer and closes the session on success and failure.
   - Renderer: row/menu logic shows Download for desktop SSH files, hides it for local files, folders, and paired web clients, calls the API, suppresses cancel toasts, and shows failure toasts.

## Data Flow

- User right-clicks remote file row.
- `FileExplorerRow` sees `connectionId` in a desktop renderer and renders `Download`.
- Selecting it calls `window.api.fs.downloadFile({ filePath, connectionId })`.
- Main process validates provider/path and opens native Save dialog.
- Main process downloads remote bytes over SFTP into a temp file beside the chosen local path, then promotes that file into place with overwrite-safe handling.
- Renderer shows success or failure toast; the success toast can reveal the saved local file.

## Edge Cases

- User cancels the save dialog: no toast and no transfer.
- SSH provider disconnected before action: existing provider lookup error surfaces through the failure toast.
- Remote path is now a directory: IPC rejects before save dialog.
- Raw SFTP download unavailable: IPC throws a clear unavailable error.
- Destination exists: native Save dialog owns overwrite confirmation; provider writes only after a path is returned.
- Existing destination on Windows: confirmed overwrite still needs explicit backup-swap handling because `fs.rename(temp, dest)` does not clobber there.
- Existing destination is a directory: reject after the dialog and before transfer.
- Destination appears after a no-overwrite dialog result: fail rather than silently replacing a file the user did not confirm overwriting.
- Destination parent is missing or unwritable: transfer fails before the success toast; temp file cleanup is best effort.
- Transfer fails after bytes have started moving: final destination must remain untouched because bytes first land in a temp sibling.
- Remote file changes during transfer: transfer writes the bytes provided by SFTP at transfer time; no explorer cache invalidation is required.
- Symlink row: UI treats it as file-like. IPC follows provider `stat`; reject only if it resolves to a directory.
- Multiple windows or duplicate clicks: each action owns its dialog and unique temp/backup paths. Do not add global state or explorer cache invalidation for downloads; if two confirmed downloads target the same destination, normal last-promoter-wins filesystem behavior is acceptable.
- External mutations: a remote delete, chmod, or disconnect between `stat` and transfer should fail normally and leave no final local write.
- Paired web client: hide the menu action; the web preload type surface may reject if called directly, but users should not see an Electron-only native-save action there.
- Remote basename is illegal on the local OS: use a sanitized save-dialog suggestion while preserving the exact remote source path for SFTP.

## Test Plan

- Unit: `src/main/ipc/filesystem.test.ts` for `fs:downloadFile` success, cancel, remote directory, selected local directory, missing/empty file path/connection, unavailable provider/method, filename sanitization, temp-file rename/cleanup, Windows overwrite handling, fail-on-destination-created-after-dialog, and dialog parenting; extend the Electron mock with `dialog.showSaveDialog` and `BrowserWindow.fromWebContents`, and the `fs/promises` mock with the local promotion primitives used by the handler.
- Unit: `src/main/providers/ssh-filesystem-provider.test.ts` for SFTP `fastGet`/close behavior, including rejection cleanup.
- Renderer unit: add a small predicate for Download visibility or row-focused coverage in `src/renderer/src/components/right-sidebar/FileExplorer.test.tsx`; cover SSH file visible, SSH folder hidden, local file hidden, paired-web-client hidden, API invocation, cancel-toast suppression, failure toasts, and the success-toast `Open` action. Do not rely on a full Electron run for this behavior.
- Validation: run targeted tests plus `pnpm typecheck` and `pnpm lint`. Skip Electron validation per user request.

## UI Quality Bar

The menu item should match the existing file explorer context menu: lucide icon, normal row height, same typography, no new colors, no visible item for local worktrees, folders, or paired web clients, no layout shift in dense rows.

## Review Screenshots

Electron screenshots are intentionally skipped by user request. If manually reviewed later, capture:

1. SSH file row context menu with `Download`.
2. SSH folder row context menu without `Download`.
3. Local file row context menu without `Download`.
4. Success toast after saving a remote file, including the `Open` action.

## Rollout

1. Add provider/type support for raw SSH file download.
2. Add main IPC, preload API, and web preload compatibility stub.
3. Thread `connectionId` to explorer rows and render the context-menu action.
4. Add unit tests.
5. Run typecheck, lint, and targeted tests.

## Lightweight Eng Review

- Scope: Kept to single-file SSH downloads from the existing file explorer context menu; no hover button, progress system, folder archive, or local save-as path.
- Architecture/data flow: Renderer only requests a remote file download. Main process owns the native dialog, chosen local path, temp file, and final rename. SSH provider owns raw SFTP transfer. This preserves Electron trust boundaries and keeps SSH behavior behind provider dispatch.
- Failure modes covered:
  - Disconnected SSH provider before transfer.
  - User cancels native save dialog.
  - Remote path becomes a directory.
  - Provider lacks SFTP/raw-download support.
  - Existing destination confirmation remains native-dialog-owned.
  - Confirmed overwrite still needs cross-platform local replacement handling.
  - Local destination directories and unconfirmed destination-appears races must not be overwritten.
  - Partial transfer never truncates the final destination; temp cleanup is best effort.
  - Remote path changes between `stat` and transfer.
  - Paired web clients must not show an Electron-only native-save action.
  - Remote filenames that are illegal locally must be sanitized only for the save-dialog suggestion.
- Test coverage required:
  - Main IPC unit tests in `src/main/ipc/filesystem.test.ts`.
  - SSH provider unit test for raw byte transfer and SFTP cleanup.
  - Renderer row/menu unit test for SSH-only desktop visibility and API invocation.
  - Web preload/typecheck coverage for the added `fs` API surface.
- Performance/blast radius: No startup cost, no polling, no renderer streaming. Transfer is user-initiated and main-process/SFTP-bound; large files have no progress UI and will occupy one SFTP channel for the duration.
- UI quality bar: Context menu item only; must match existing menu density, icon style, copy, and hide rules, including no item in paired web clients.
- Required review screenshots:
  1. SSH file context menu with `Download`.
  2. SSH folder context menu without `Download`.
  3. Local file context menu without `Download`.
  4. Success toast after download, including the `Open` action.
- Residual risks: No progress UI or cancellation for large files; acceptable for first scoped implementation but should stay explicit in release notes if users can trigger multi-GB downloads.
