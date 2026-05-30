# Move AI Capabilities To The Top In Settings

## Problem

The Settings sidebar should make AI capabilities the first thing users see, but the current order still leaves the AI Capabilities group below Set Up. `SETTINGS_NAV_GROUPS` in `src/renderer/src/components/settings/Settings.tsx` controls whole-sidebar group order, while `buildSettingsNavigationMetadata` in `src/renderer/src/hooks/useSettingsNavigationMetadata.ts` controls section order for the sidebar, Settings search, and Cmd+J Settings results.

The rendered pane order in `src/renderer/src/components/settings/Settings.tsx` should match the same information architecture because non-empty Settings search renders every matching `SettingsSection` in JSX order.

## Goal

Put `AI Capabilities` at the very top of the Settings sidebar and make the first rows clearly AI-oriented. Move `Agents` and `AI Provider Accounts` into the AI Capabilities group, followed by Orchestration, Computer Use, and Voice. Keep Set Up below that for General app setup and Integrations.

## Non-goals

- Do not rename panes, labels, descriptions, or badges.
- Do not change any setting behavior, persistence, provider account behavior, agent launch behavior, remote runtime behavior, or SSH behavior.
- Do not move generic provider/service integrations into AI Capabilities.
- Do not add new visual styling or tokens.

## Design

1. Reorder `SETTINGS_NAV_GROUPS` so `capabilities` appears before `setup`.

2. Reclassify AI-specific setup sections in `buildSettingsNavigationMetadata`:
   - Move `agents` from `setup` to `capabilities`.
   - Move `accounts` from `setup` to `capabilities`.
   - Keep `integrations` in `setup`; it covers GitHub, GitLab, Linear, and source-hosting services beyond AI capabilities.

3. Reorder metadata so the top desktop prefix is:
   - `agents`
   - `accounts`
   - `orchestration`
   - desktop-only `computer-use`
   - desktop-only `voice`
   - `general`
   - `integrations`
   - then the existing Workflows, Interface, Remote Access, Safety, Experimental, and Projects order

4. Reorder the JSX `SettingsSection` blocks in `Settings.tsx` to match metadata/search order. Keep IDs and `searchEntries={getSectionSearchEntries(id)}` aligned.

5. Update metadata tests for desktop and web ordering. Web should still hide `computer-use` and `voice`, while keeping `agents`, `accounts`, and `orchestration` first.

## Edge Cases

- The default active pane can remain `general`; this change is about sidebar/menu prominence, not changing the initial Settings destination.
- Web client must still hide `computer-use` and `voice`.
- Search and deep links must keep working because section IDs and `SettingsNavTarget` values do not change.
- Existing lazy mounting should keep loading only General initially; do not add capability IDs to `EAGER_SECTION_IDS`.
- Remote/SSH behavior is unaffected because this is static renderer ordering only.

## Rollout

1. Update group order in `Settings.tsx`.
2. Update metadata group assignments and order in `useSettingsNavigationMetadata.ts`.
3. Reorder corresponding `SettingsSection` JSX blocks in `Settings.tsx`.
4. Update `useSettingsNavigationMetadata.test.ts`.
5. Run the focused metadata test, typecheck, lint, and update the existing PR.
