# Skill Guide Indirection (Thin Stubs + `orca skills get`)

Status: FOLDED INTO `skill-freshness-design.md` (2026-07-13) — read that instead. The stub/CLI
contract and prior-art survey carried over; the migration-via-in-app-updater section here is
superseded (migration now rides `npx skills update`, no in-app writes).

## Principle

Version-sensitive content must not live in distributed files; only discovery metadata should.
Every hard problem in the current system — staleness, adoption consent, installer attribution,
transactional replacement, remote-host reconciliation — descends from shipping full skill
bodies as mutable files that must track the installed Orca binary. Move the bodies into the
binary and the problems shrink to a residue the existing machinery already handles.

## Design

### 1. The binary serves the instructions

New CLI surface (topic names match skill names):

```
orca skills list                 # enumerate available guides, one line each
orca skills get <topic>          # full version-matched guide for one skill, markdown to stdout
orca skills get <topic> --full   # include bundled reference docs, if any
```

- Content is compiled into the CLI at build time from the same `skills/` sources — authoring
  workflow does not change; the skill file and the served guide are projections of one source.
- Output contract: plain markdown on stdout, exit 0; unknown topic exits nonzero with the
  topic list. No network, no filesystem reads outside the binary's own resources.
- Verb choice: `skills get` (not `guide`) to match the convention agents are already being
  taught by other tools (see Prior art).

### 2. The installed SKILL.md becomes a permanent thin stub

One stub per skill (frontmatter descriptions are the agent-routing layer and must stay
per-skill registry entries). Shape:

```markdown
---
name: orca-cli
description: <unchanged per-skill trigger copy — this is the discovery surface>
allowed-tools: Bash(orca:*)
---

# Orca CLI

This file is a discovery stub, not the usage guide. The full, version-matched reference
lives in the `orca` binary itself.

Before using Orca commands, run once per session:

    orca skills get orca-cli

Don't guess subcommands or flags from memory or from cached copies of this skill — they
change between Orca releases; the command above always matches the installed binary.
```

Stub rules:
- Body is deliberately version-independent: it says when to engage Orca and where to fetch
  the how — never the how itself. A stub should survive many releases unchanged.
- `allowed-tools: Bash(orca:*)` so the fetch costs no permission prompt in Claude Code.
- Stub must not ship before the binary that serves its topic: gate stub rollout on the
  release that includes `orca skills get` (a stub pointing at a command that does not exist
  is worse than a fat skill). Enforce with a build check: every stub topic must resolve
  against the compiled guide table.
- Stub should degrade honestly when `orca` is not on PATH: one line telling the agent the
  skill requires the Orca app/CLI and how to check (`command -v orca`).

### 3. What this retires, what it keeps

Retired / collapsed:
- Per-release skill-content updates as the normal case. Stub churn is rare (new skill,
  reworded trigger, spec change), so the background updater becomes a low-frequency
  maintenance rail. The auto-vs-manual default argument mostly evaporates.
- Phases 3–4 of skill-auto-update-design.md (WSL/SSH remote file reconcilers). Wherever the
  skill is useful the `orca` binary is present, and the remote binary serves the guide
  matching its own host's version. No remote file-sync problem remains.

Kept (and required by the migration):
- Detection/inventory + content-addressed registry + release mapping + CI gates: stubs are
  still content with identity; modified stubs, unknown copies, and "newer than Orca" states
  still need classification, and the fat→stub migration must recognize exact official fat
  copies in the field.
- Adoption consent + ledger + installer attribution: a stub replacement is still a write to
  a user-owned directory; nothing about consent changes.
- Transactional publish/rollback/orphan sweep: the fat→stub conversion is a normal managed
  update executed by exactly this machinery.
- The skills-CLI round-trip CI: still proves the install rail preserves stub bytes.
- Settings UI: rows/statuses unchanged; update-available simply becomes rare.

## Prior art (verified live 2026-07-13)

- vercel-labs/agent-browser — canonical stub + `agent-browser skills get core`; docs frame
  it explicitly: "the installed SKILL.md rarely changes, while the CLI always serves content
  matching its own version." Stub self-describes as a discovery stub that "cannot change
  between releases."
- Canner/WrenAI (skills/wren/SKILL.md) — independent (non-Vercel) adopter: "The actual
  workflow guides … live inside the `wren` CLI itself, so they always match the installed
  wrenai version (no skill cache, no version drift)." Uses `wren skills list` /
  `wren skills get <topic>` / `--full` — the verb convention to match.
- vercel-labs/zerolang (skills/zero/SKILL.md) — "This file is only a discovery stub… ask the
  installed compiler for the skill content that matches that exact binary." Adds the nuance
  of warning agents not to replace a pinned binary.
- vercel/next.js (skills/next-dev-loop/SKILL.md) — consumes the pattern: instructs agents to
  "run `agent-browser skills get core` once for the version-matched usage guide — don't
  guess subcommands from memory." Normalization signal.
- Ecosystem discourse (Snyk threat model, HN, vercel-labs/skills issues #500/#542, Anthropic
  skill-trust guidance) demands pinning + reviewable updates and condemns silent pulls from
  mutable remotes. Stub indirection satisfies the audit-once trust model: the audited file
  never changes meaning; served content is exactly as trusted as the installed binary.

## Migration plan

0. **Spike (gate for everything else): pointer compliance.** Convert orca-cli's skill to a
   stub in a test home, run our real agents (Claude Code, Codex) on representative Orca
   tasks, measure how often the agent fetches the guide before its first orca command, and
   compare task success vs the fat skill. Ship nothing until compliance is demonstrated.
   Also measure token deltas (stub preload + one fetch vs fat preload).
1. `orca skills get`/`list` in the CLI, content compiled from `skills/` at build; build
   check that stub topics resolve. Unit + CLI tests.
2. Convert orca-cli to a stub in `skills/` (one skill first). This bumps its registry
   revision like any content change; the shipped updater delivers fat→stub to managed
   installs; the adoption nudge covers legacy unmanaged fat installs (their migration path
   is: adopt → auto/manual update to stub).
3. Watch a release cycle; then convert the remaining skills (orchestration, computer-use,
   orca-linear, linear-tickets, per-workspace-env, emulator skills).
4. Retire the WSL/SSH reconciler phases from skill-auto-update-design.md; note the
   indirection design as the remote strategy.

## Open questions

- Compliance failure mode: if agents skim the stub and skip the fetch, options are stronger
  stub wording, frontmatter `description` nudging ("requires running orca skills get"),
  or hybrid stubs carrying a minimal command table plus the pointer. Spike decides.
- Multi-file skills: current shipped packages are single-file; if a future skill needs
  scripts/assets, decide whether the binary serves them (`--script <name>` like WrenAI) or
  they stay in the package (then that skill keeps the fat-update path).
- Topic/verb naming: `orca skills get` collides conceptually with the `skills` installer
  CLI; confirm no confusion in agent behavior during the spike.
- Old binaries: a user can hold a stub while running an older orca without `skills get`
  (downgrade case). Stub wording should fail gracefully ("if the command is missing, update
  Orca"); acceptable residual.
- Whether settings should surface "guide served by binary" as a distinct row state so
  support can tell stub-era installs from fat-era ones at a glance.
