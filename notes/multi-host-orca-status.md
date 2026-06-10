# Multi-Host Orca — Live Implementation Status

Tracking doc for implementing [`notes/multi-host-orca-plan.html`](./multi-host-orca-plan.html) (Issue #4697).

**Last updated:** 2026-06-09 (orchestrated session, final)
**Branch:** `Jinwoo-H/feature-control-multiple-orca-servers-concurrent`
**Commits:** `ea42a5c18` (inherited groundwork), `341291937` (owner routing + host actions + session partitioning), `1384d9f6b` (live status + composer default + SSH auth label), + final commit (host overrides, rename/remove, regression fixes, file splits). `notes/` stays untracked.

## STATUS: IMPLEMENTATION COMPLETE — acceptance audit 9/9 (8 PASS + criterion 4 closed by host-overrides work)

## Final verification
- [x] `npm run typecheck` — green
- [x] `npm run lint` (oxlint + switch-exhaustiveness + scrollbars + localization catalog/coverage) — green
- [x] Full vitest suite — green (15k+ tests; the 12 branch failures found mid-audit were all fixed: 2 stale host-stamping expectations, 9 lineage fixture/mocks missing new multi-host fields, 1 stale owner-routing assertion)
- [ ] Seeded Electron UI validation of the new host header menu / badges / Apply-to control (recommended before PR; prior session validated host scope flows this way)
- Note: origin/main has advanced past this branch's base — rebase/merge needed before PR.

## What shipped (by plan phase)

### Phase 0 — Host identity: ExecutionHostId/-Scope, registry w/ health+compat+capabilities (+label overrides)
### Phase 1 — Focus vs connection: repos stamped w/ executionHostId; owner helpers; workspaceHostScope; full call-site audit, all mutation-routing bugs fixed
### Phase 2 — Keepalive: switch teardown removed (inherited) + pinned by regression tests; host scope is filter-only (commented invariant)
### Phase 3 — Owner routing: SourceControl (23 sites), agent launch/notes/probe, work-item preflight, TabBar shell caps, repo icon, github project rows (slug-matched), repo.update pref; per-host reorder + sort-order splits; host grouping fix
### Phase 4 — Session: persistence partitioned by host (zero-copy migration, per-partition zod, host-keyed IPC/preload/web); renderer write path splits runtime-owned entries; boot merges local + known runtime partitions; SSH stays snapshot-flow
### Phase 5 — Sidebar/UI: scope strip + menu; host sections; host header menu (Focus, Manage deep-links, SSH Reconnect/Disconnect, runtime Check connection, Rename, Remove-with-confirm for ssh [inline] / runtime [deep-link]); blocked-host "Update server/client required" + describeRuntimeCompatBlock tooltip; "Authentication needed" SSH label; live runtimeStatusByEnvironmentId slice (boot hydration + manual checks + stale-drop) feeding all 4 buildSidebarHostOptions sites; Cmd+J host badges; composer defaults to focused host; host-partitioned port scans
### Phase 6 — Detached windows: NOT DONE (explicitly post-MVP per plan)

## Cross-cutting
- Version skew: protocol-range dispatch guard on every runtime RPC; per-host verdicts; never app-version equality; missing fields = protocol 0
- Capabilities: per-host advertisement; screencast + binary-stream consumed per owner host; no global gate (one old host can't poison others)
- Settings scope: client/host/repo panes distinct; "Apply to:" selector + `host override ?? client default` inheritance implemented for Workspace Directory (`hostSettingOverrides` in GlobalSettings, `src/shared/host-setting-overrides.ts`); host display labels = same override mechanism (Rename)

## Acceptance criteria (plan §Acceptance Criteria): all 9 verified with file:line evidence by audit agent; criterion 4 (settings scope) closed by the Apply-to/override work after the audit ran.

## Known follow-ups (non-blocking)
- `useCreatePullRequestDialogFields` reads focused settings internally (flagged during SourceControl fix; low impact)
- Seeded Electron UI validation pass for the new surfaces
- Rebase onto current main before PR
- Phase 6 detached host windows (post-MVP)
