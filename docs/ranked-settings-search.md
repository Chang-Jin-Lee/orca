# Ranked Settings Search

## Problem

Settings search treated every matching field as a boolean hit. In `Settings.tsx`, the Settings page owns the visible section derivation ([src/renderer/src/components/settings/Settings.tsx](/Users/jinjingliang/Documents/projects/orca/shortcut-setting-not-searchable/src/renderer/src/components/settings/Settings.tsx:669)). When the active pane is no longer visible, fallback activation picks the first visible section ([src/renderer/src/components/settings/Settings.tsx](/Users/jinjingliang/Documents/projects/orca/shortcut-setting-not-searchable/src/renderer/src/components/settings/Settings.tsx:927)).

For the query `shortcuts`, Task Sources appears before Shortcuts in metadata ([src/renderer/src/hooks/useSettingsNavigationMetadata.ts](/Users/jinjingliang/Documents/projects/orca/shortcut-setting-not-searchable/src/renderer/src/hooks/useSettingsNavigationMetadata.ts:248), [src/renderer/src/hooks/useSettingsNavigationMetadata.ts](/Users/jinjingliang/Documents/projects/orca/shortcut-setting-not-searchable/src/renderer/src/hooks/useSettingsNavigationMetadata.ts:367)). Task Sources only matches because its search description mentions "sidebar shortcuts" ([src/renderer/src/components/settings/tasks-search.ts](/Users/jinjingliang/Documents/projects/orca/shortcut-setting-not-searchable/src/renderer/src/components/settings/tasks-search.ts:5)), while Shortcuts has an exact pane-title match plus pane entries ([src/renderer/src/components/settings/shortcuts-search.ts](/Users/jinjingliang/Documents/projects/orca/shortcut-setting-not-searchable/src/renderer/src/components/settings/shortcuts-search.ts:37)).

## Root Cause

Before this change, `matchesSettingsSearch` returned only `true` or `false` after scanning title, description, and keywords with equal strength. The compatibility wrapper now remains in place ([src/renderer/src/components/settings/settings-search.ts](/Users/jinjingliang/Documents/projects/orca/shortcut-setting-not-searchable/src/renderer/src/components/settings/settings-search.ts:150)), while the new scoring primitive provides the missing ranking signal ([src/renderer/src/components/settings/settings-search.ts](/Users/jinjingliang/Documents/projects/orca/shortcut-setting-not-searchable/src/renderer/src/components/settings/settings-search.ts:99)).

## Non-Goals

- Do not replace section-internal filtering in individual panes.
- Do not add fuzzy matching, stemming, persistence, IPC, network calls, or main-process behavior.
- Do not change Cmd-J settings search semantics; `cmdJKeywords` remains Cmd-J owned.
- Do not broadly refactor Settings layout, groups, or pane rendering.

## Design

1. Add a pure ranked Settings search primitive in `settings-search.ts` that scores `SettingsSearchEntry` values and arrays.
2. Preserve `matchesSettingsSearch` by implementing it on top of the score primitive so existing pane-internal callers keep their boolean API.
3. Treat the first entry in an array as the pane-level entry when callers include one. Pane-title exact, prefix, and substring matches score above entry-title, description, and keyword matches.
4. Rank `visibleNavSections` in `Settings.tsx` by descending score, preserving original navigation order for ties.
5. In non-empty search mode, order general sidebar groups by the first ranked section they contain so a stronger match in a later normal group can appear above a weaker match in an earlier group. Empty search keeps the documented navigation group order.
6. Keep the existing unsaved Git prompt special case visible, but give forced non-matches the lowest score so real search matches rank above it.

## Data Flow

- User types into `SettingsSidebar` search input.
- `Settings.tsx` reads `settingsSearchQuery` from app state.
- For each nav section, `Settings.tsx` builds `[paneEntry, ...section.searchEntries]`.
- `scoreSettingsSearch(...)` returns a numeric relevance score or `0` for no match.
- `visibleNavSections` includes matching sections, plus the existing forced Git section when needed, sorted by score then original index.
- During active search, general sidebar groups are ordered by the ranked sections they contain; empty search uses `SETTINGS_NAV_GROUPS`.
- Fallback activation reads the ranked `visibleNavSections`, so the strongest match becomes active first.

## Edge Cases

- Empty query keeps all sections visible and preserves navigation order.
- Oversized query returns no search matches without reading entry fields.
- Case-insensitive substring behavior remains.
- Ties preserve navigation order deterministically.
- The unsaved source-control prompt can keep Git visible for a non-matching query but must not outrank real matches.
- Search-mode sidebar group order must not affect empty-search navigation order.
- SSH, web, Windows, and macOS metadata variations keep using the same renderer-only scoring path.

## Test Plan

- Unit: `settings-search.test.ts` covers exact, prefix, and substring pane-title scores outranking description, entry-title, and keyword scores.
- Unit: `settings-search.test.ts` covers deterministic tie behavior via the score contract and existing boolean matching behavior.
- Unit: `settings-search.test.ts` preserves empty-query and oversized-query behavior, including not reading entries for oversized queries.
- Focused Settings derivation tests are optional if the ranking helper is pure and covered; otherwise verify the `shortcuts` regression through the scorer and Settings wiring.
- Existing metadata tests continue to cover platform-specific section availability and ordering inputs.
- Full verification: targeted settings-search tests, then `pnpm typecheck` and `pnpm lint`.

## UI Quality Bar

No new visual components, styling, copy, spacing, or controls. The visible behavior change is that filtered Settings sidebar rows, search-mode group order, and fallback pane activation follow relevance while retaining the existing sidebar design and row states.

## Review Screenshots

Stage 5 is out of scope for this dispatched worker, but later Electron validation should capture:

1. Settings search with query `shortcuts`, showing the Shortcuts group/row above Task Sources and the Shortcuts pane active.
2. Empty Settings search, showing the normal sidebar order.
3. A weaker description/keyword search that still shows matching panes without layout changes.

## Rollout

1. Add scoring and optional ranking helpers in `settings-search.ts`.
2. Add focused unit tests for scoring, tie handling, empty queries, oversized queries, and the `shortcuts` regression.
3. Use the score in `Settings.tsx` when deriving `visibleNavSections` and search-mode group order.
4. Run targeted tests, typecheck, and lint.

## Lightweight Eng Review

- Scope: Kept to one pure search primitive, search-mode Settings ordering, one design doc, and focused tests; no persistence, IPC, Cmd-J, or visual refactor.
- Architecture/data flow: Renderer-only score calculation sits beside the existing boolean matcher. `Settings.tsx` owns sidebar ranking because it already owns section visibility and fallback activation.
- Failure modes covered:
  - Oversized pasted query must short-circuit before reading entries.
  - Empty query must not reorder the sidebar.
  - Forced Git visibility must not outrank real matches.
  - Equal relevance must preserve navigation order.
  - Search-mode group ordering must not leak into empty search.
  - Platform-specific metadata must remain a caller input, not a scoring concern.
- Test coverage required:
  - Unit in `settings-search.test.ts` for score tiers and boolean compatibility.
  - Unit or focused pure assertion for the `shortcuts` regression using Task Sources and Shortcuts-like entries.
  - Existing `useSettingsNavigationMetadata.test.ts` remains the metadata boundary check.
- Performance/blast radius: Scores a small in-memory sidebar array on search input updates. No async work, IPC volume, caching, file watching, or memory growth.
- UI quality bar: No new UI surface; Electron validation should only judge search result/group order, active pane behavior, and unchanged sidebar styling against `docs/STYLEGUIDE.md`.
- Required review screenshots:
  1. Query `shortcuts` with Shortcuts ranked and active above Task Sources.
  2. Empty query with normal sidebar order.
  3. A non-title query with matching panes still displayed.
- Residual risks: The score contract assumes callers pass the pane-level entry first when they want pane-title priority; tests should lock that down.
