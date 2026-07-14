# SSH Relay GitHub Release Distribution — Living Implementation Checklist

Date created: 2026-07-14<br>
Last updated: 2026-07-14<br>
Current phase: Milestone 1 decision closure — Work Package 0 is CI-green in draft PR #8724; no bundled-runtime path is enabled; runner and per-target Beta rollout policies are recorded<br>
Primary design: [SSH relay GitHub Release plan](./2026-07-14-ssh-relay-github-release-plan.html)<br>
Motivating issues: [#8450](https://github.com/stablyai/orca/issues/8450), [#1693](https://github.com/stablyai/orca/issues/1693)

## Mandatory Living-Document Protocol

This checklist is part of the implementation, not a planning artifact that may go stale. Every
agent or engineer working on this project must read it before editing code and update it in the
same change as the work it records.

- At the start of every implementation session, read this document and confirm the current phase,
  open decisions, accepted gaps, and existing evidence.
- Mark the active item with `**In progress — YYYY-MM-DD, owner/agent**` before changing code.
- Keep only one implementation item marked in progress unless independent PRs are deliberately
  running in parallel and each names its owner.
- Do not change `- [ ]` to `- [x]` until the implementation and its required verification are
  complete.
- Every completed item must cite an evidence-ledger ID such as `E-ARTIFACT-001` or a merged PR.
- Record exact commands, runner OS/architecture, commit SHA, result, duration, and artifact link for
  executable evidence. “Tests passed” is not adequate evidence.
- Record what a test does **not** prove. Mock coverage must not be presented as live SSH,
  native-module, release-asset, or platform coverage.
- If implementation changes the design, update both this checklist and the HTML plan in the same PR
  before continuing.
- If a supported tuple lacks required real-environment proof, leave it on a proven legacy path or
  mark it unsupported. Do not check it off based on cross-compilation or emulation alone.
- Never use “100% verified” without naming the exact declared matrix and showing that every required
  cell passed.
- Preserve unrelated worktree changes. At checklist creation, the existing edits to
  `ssh-remote-node-resolution.ts` and its test are user-owned issue #8450 work.
- Before every PR handoff, update Current Status, PR/Work-Package Status, Verification Ledger,
  Accepted Gaps, and Next Required Action.

## Status Legend

- `- [ ]` — not complete.
- `- [x]` — complete with linked evidence.
- `**In progress — date, owner**` — actively being implemented; the checkbox remains unchecked.
- `BLOCKED:` — cannot proceed without a named decision, authority, runner, credential, or external
  state. Include the exact unblock condition.
- `ACCEPTED GAP:` — deliberately not proved yet. Include scope, fallback behavior, owner, and
  promotion condition.

## Current Status

- Implementation status: Work Package 0 is committed at `c4259d94f` on current `main`, with refreshed
  focused, static, full-lint, live #8450 SSH/PTY, and GitHub Actions proof (E-M0-UNIT-002,
  E-M0-STATIC-002, E-M0-LIVE-002, E-M0-CI-001). Draft PR
  [#8724](https://github.com/stablyai/orca/pull/8724) is open and CI-green at implementation head
  `94e58d83e`.
- Active package: Milestone 1 decisions and Work Package 1 contracts are isolated in stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728); decision commit `a84d52dc6` changes no runtime
  behavior and enables no tuple.
- Production behavior: unchanged; Orca embeds relay JavaScript and installs `node-pty` plus
  `@parcel/watcher` with remote npm.
- New runtime assets published: none.
- Bundled runtime enabled: no.
- Declared supported bundled tuples: none until the baseline and runner decisions below are closed.
- Validation orchestration: GitHub Actions is the primary runner and evidence surface under
  E-M1-RUNNER-DECISION-001; exact native labels and representative remote targets remain open.
- Rollout control: existing per-SSH-target configuration; legacy is the default and the bundled
  runtime is an explicit per-target Beta opt-in under E-M1-ROLLOUT-DECISION-001.
- Legacy fallback removal: not authorized.
- Next required action: close the remaining Milestone 1 baselines, provenance/trust, numeric-budget,
  and concrete runner/remote decisions. Begin the contract-only package on its own branch/PR
  boundary; do not add Work Package 1 implementation to PR #8724.

## Non-Negotiable Invariants

- [ ] The bundled primary path never requires outbound HTTP, npm, a compiler, Python, or a system
      Node installation on the SSH host.
- [ ] The desktop downloads the runtime, verifies it locally, and transfers it through the existing
      authenticated SSH connection.
- [ ] SSH authentication/connection and relay RPC transport remain unchanged; bootstrap artifact
      transfer is a separately designed, measured, and gated subsystem.
- [ ] Every desktop build embeds the exact signed manifest needed to resolve a remote tuple to a
      content identity while the desktop is offline.
- [ ] Relay artifacts are built and signed before desktop packaging; app builds and GitHub Release
      uploads consume the exact same immutable bytes.
- [ ] No downloaded byte is extracted, transferred, or executed until manifest authenticity,
      expected tuple, size bounds, and archive SHA-256 are verified at the appropriate boundary.
- [ ] A completed remote install is immutable and content-addressed. A running old relay is never
      mutated in place.
- [ ] Bundled and legacy installs use distinct identities, locks, partial directories, sentinels,
      and launch generations.
- [ ] Fallback cannot start until all bundled download, extraction, upload, verification, and launch
      work is aborted, awaited, and unable to mutate state.
- [ ] Signature, archive hash/safety, extracted-tree, or native-signature failure fails closed in
      `auto`: rejected bytes never execute and automatic legacy fallback never starts.
- [ ] Detected local or remote cache corruption is quarantined and may recover only from freshly
      verified bundled bytes; failed/unavailable recovery fails closed without automatic legacy.
- [ ] Local signed-manifest/archive/tree verification plus authenticated SSH transfer into exclusive
      staging is the pre-execution integrity boundary; bundled Node then hashes the entire staged
      tree before any completion sentinel is written.
- [ ] Remote install proof establishes initial transfer/finalization correctness. Warm launch trusts
      Orca's completed-directory immutability assumption; the sentinel is not ongoing proof against
      later mutation or a hostile authenticated account that can replace runtime and sentinel.
- [ ] Platform support is never inferred from an artifact existing. Each enabled tuple requires a
      real-environment runtime proof.
- [ ] Unknown or conflicting platform/libc evidence deterministically selects proven legacy
      behavior; it never guesses an artifact.
- [ ] Runtime transfer has explicit memory, file-count, concurrency, cancellation, and time budgets.
- [ ] Bundled mode depends only on the explicitly declared POSIX or Windows bootstrap primitives; it
      never silently requires remote Node, Python, tar, `sha256sum`, or `shasum`.
- [ ] Every Node/CVE/runtime/key refresh produces a new desktop tag/build and embedded signed
      manifest. Old clients remain frozen to their embedded manifest and accepted keys.
- [ ] Current PTY, watcher, Git, filesystem, streaming, agent-hook, preflight, reconnect, and GC
      contracts remain intact.
- [ ] macOS, Linux, and Windows behavior remains behind runtime checks and uses platform-native
      paths and commands.
- [ ] No implementation file adds a max-lines disable or vague `helpers`/`utils` module name.

## Milestone 0 — Preserve and Prove the Legacy Safety Net

Goal: land the narrow #8450 correction independently because automatic fallback depends on a
coherent Node/npm resolver.

Work Package 0 implementation evidence was completed on 2026-07-14 by the Codex implementation
owner. No relay artifact-distribution behavior is included.

- [x] Confirm the #8450 implementation selects Node and npm from the same bin directory on POSIX.
      (E-M0-UNIT-001, E-M0-UNIT-002, E-M0-LIVE-002)
- [x] Confirm Windows selects `node.exe` and `npm.cmd` from one toolchain directory.
      (E-M0-UNIT-001; mocked Windows command construction, not live Windows)
- [x] Reject an incomplete system Node and continue to the usable NVM candidate.
      (E-M0-UNIT-001, E-M0-UNIT-002, E-M0-LIVE-002)
- [x] Preserve minimum supported Node-version enforcement. (E-M0-UNIT-001)
- [x] Preserve login-shell, known-path, version-manager, noisy-startup, cancellation, and
      `MaxSessions=1` behaviors. (E-M0-UNIT-001; live `MaxSessions=1` remains outside this WP0 proof)
- [x] Add the exact Ubuntu/system-Node-without-npm/NVM-below-`.bashrc`-guard regression fixture.
      (E-M0-UNIT-001, E-M0-LIVE-001)
- [x] Add negative tests for Node present/npm missing, npm present/Node too old, mismatched bin
      directories, and an unusable npm shim. (E-M0-UNIT-001)
- [x] Run focused resolver and deploy tests and record evidence. (E-M0-UNIT-001, E-M0-UNIT-002)
- [x] Run a live SSH reproduction matching issue #8450 and record the selected paths and successful
      relay/PTY launch without recording usernames or home paths in committed evidence.
      (E-M0-LIVE-001, E-M0-LIVE-002)
- [x] Keep this fix in a separate PR or commit from GitHub Release distribution. The reviewed plan
      is commit `2b67de870`; WP0 code is the separate commit `c4259d94f` in draft PR #8724.
      (E-M0-PR-001)
- [x] Document which tuples have a live passing legacy E2E. Fallback is only a support claim for
      those tuples. (E-M0-LIVE-001)

| Legacy remote tuple                                                               | Client           | Transport                                    | Evidence                     | Scope limit                                                       |
| --------------------------------------------------------------------------------- | ---------------- | -------------------------------------------- | ---------------------------- | ----------------------------------------------------------------- |
| Ubuntu 24.04 arm64, glibc, system Node 18 without npm, guarded NVM Node 22/npm 10 | macOS 26.2 arm64 | Built-in SSH2 connection + SFTP relay upload | E-M0-LIVE-001, E-M0-LIVE-002 | Does not prove x64, system SSH, Windows, musl, or `MaxSessions=1` |

Completion evidence required: focused red/green tests, live #8450 SSH run, typecheck, lint, and PR
link.

## Milestone 1 — Close Blocking Product and Support Decisions

No production implementation begins until every blocking item has an owner and decision record.

### Supported runtime baselines

**In progress — 2026-07-14, Codex implementation owner:** resolve the baseline, provenance, trust,
runner/remote, and numeric-budget decisions with authoritative evidence before starting Work Package
1 implementation on a separate branch/PR boundary.

- [x] Define the oldest supported glibc version as 2.28 for initial Linux x64/arm64 candidates.
      (E-M1-BASELINE-001)
- [x] Define the oldest supported libstdc++/C++ ABI level as libstdc++ 6.0.25 with
      `GLIBCXX_3.4.25`. (E-M1-BASELINE-001)
- [x] Define the minimum supported Linux kernel as 4.18. (E-M1-BASELINE-001)
- [x] Define no enabled musl baseline initially. Alpine/musl remains a selector and legacy-path test
      family until Orca produces and proves its own target-native Node/runtime build; no unofficial
      Node binary is accepted. (E-M1-BASELINE-001, E-M1-NODE-PROVENANCE-001)
- [x] Define macOS 13.5 as the minimum for both x64 and arm64 candidates. (E-M1-BASELINE-001)
- [x] Define the initial Windows candidates as Windows 10 22H2 build 19045 or Server 2022 build
      20348 for x64, and Windows 11 24H2 build 26100 for arm64, with OpenSSH for Windows 8.1p1,
      Windows PowerShell 5.1, and .NET Framework 4.8 as minimum bootstrap primitives.
      (E-M1-BASELINE-001)
- [x] Treat a Rosetta-translated shell as x64 process architecture, but keep it on legacy until an
      x64 artifact passes a live Rosetta SSH cell. A native arm64 shell selects arm64; detection
      never forces a native-architecture artifact across a translated process boundary.
      (E-M1-BASELINE-001)
- [ ] Document currently supported legacy tuples separately from proposed bundled tuples.

Decision owner: Codex implementation owner for #8450. Decision authority: conservative
implementation boundary under the user-approved legacy-default Beta rollout. These are minimum
eligibility constraints, not support claims: every candidate remains disabled until its two-layer
live evidence cells pass.

The initial candidate families are Linux glibc x64/arm64, macOS x64/arm64, and Windows x64/arm64.
Linux musl, WSL, Rosetta-translated macOS, and any unlisted OS/architecture remain legacy-only.
Version parsing is exact and fail-conservative; an unknown, missing, older, or conflicting baseline
probe selects legacy rather than guessing a compatible artifact.

### Validation runner and network topology

Decision owner: Codex implementation owner for #8450. Decision authority: worktree owner direction
on 2026-07-14. GitHub Actions is the primary orchestration and durable evidence surface because it
can couple target-native build jobs, packaged-client jobs, logs, metrics, and immutable artifacts to
the exact commit under test without introducing a second release-control plane.

- [x] Use GitHub Actions for the PR, nightly, release, and promotion evidence workflows.
      (E-M1-RUNNER-DECISION-001)
- [x] Permit a GitHub-hosted runner to fill a required evidence cell only when it provides real
      hardware or native virtualization for the declared OS/architecture and the job records the
      runner label, image/version, architecture, and native-versus-emulated status.
      (E-M1-RUNNER-DECISION-001)
- [x] Require a real OpenSSH daemon, the full-size packaged runtime, and the production built-in
      SSH/SFTP or system-SSH path named by the cell. A mock server, reduced fixture, cross-build,
      QEMU-only run, or artifact existence cannot fill a live cell. Same-host or native-container
      targets qualify only when they preserve the declared remote OS/architecture, SSH daemon,
      primitive, egress, and isolation conditions. (E-M1-RUNNER-DECISION-001)
- [x] For Layer B cross-family cells, have the GitHub Actions job provision or connect to an
      ephemeral native SSH target or an approved self-hosted target pool. The remote need not itself
      be GitHub-hosted, but its image/snapshot identity and teardown result are part of the evidence;
      do not assume networking between unrelated hosted jobs. (E-M1-RUNNER-DECISION-001)
- [x] Keep any tuple without an available qualifying native runner or reachable representative
      remote disabled and on its proven legacy path. (E-M1-RUNNER-DECISION-001)
- [x] Inventory the repository's available GitHub-hosted runner labels and record native
      architecture, image/version policy, and unreserved capacity. No approved self-hosted SSH
      target pool currently exists. (E-M1-RUNNER-INVENTORY-001)
- [ ] Name and pin the representative POSIX and Windows remote images/snapshots used for Layer B,
      including their OpenSSH and bootstrap-primitive baselines and network-egress controls.
- [ ] Select a repeatable GitHub runner class or approved dedicated runner for numeric regression
      baselines. If hosted-runner variance prevents the Milestone 1 thresholds from being evaluated,
      use the dedicated runner for the affected metric rather than weakening the threshold.

#### Native runner inventory decision

Decision owner: Codex implementation owner for #8450. Image authority: GitHub-hosted runner image
catalog; repository workflow inventory at this branch. Pin explicit OS labels in new relay workflows
and record the resolved image version from every job because GitHub refreshes images weekly.
`*-latest` is not permitted for qualifying tuple evidence.

| Client/build architecture | Qualifying label   | Native image family | Capacity/update rule                                                                 |
| ------------------------- | ------------------ | ------------------- | ------------------------------------------------------------------------------------ |
| Linux x64                 | `ubuntu-24.04`     | Ubuntu 24.04 x64    | GitHub-hosted ephemeral, unreserved/queue-dependent; weekly image, log exact version |
| Linux arm64               | `ubuntu-24.04-arm` | Ubuntu 24.04 arm64  | GitHub-hosted ephemeral, unreserved/queue-dependent; weekly image, log exact version |
| macOS x64                 | `macos-15-intel`   | macOS 15 x64        | GitHub-hosted ephemeral, unreserved/queue-dependent; weekly image, log exact version |
| macOS arm64               | `macos-15`         | macOS 15 arm64      | GitHub-hosted ephemeral, unreserved/queue-dependent; weekly image, log exact version |
| Windows x64               | `windows-2022`     | Server 2022 x64     | GitHub-hosted ephemeral, unreserved/queue-dependent; weekly image, log exact version |
| Windows arm64             | `windows-11-arm`   | Windows 11 arm64    | GitHub-hosted ephemeral, unreserved/queue-dependent; weekly image, log exact version |

The repository already uses `ubuntu-latest`, `ubuntu-24.04-arm`, `macos-15`, `windows-2022`, and a
third-party macOS release label. Existing `latest` and third-party labels may remain for their
current workflows but do not qualify a relay tuple unless the relay job pins the explicit label and
records its resolved image. No approved self-hosted SSH target pool, reserved hosted-runner capacity,
or cross-family remote endpoint is inferred from this inventory; those unresolved Layer B cells keep
the affected tuple disabled.

### Remote bootstrap primitives

- [ ] Define the exact POSIX baseline, including POSIX `sh`, byte-preserving stdin-to-file via `cat`
      or a proven equivalent, and required `mkdir`/`rm`/`mv`/`chmod`/`test`/`nohup` semantics.
- [ ] Define the exact Windows OpenSSH, PowerShell, and .NET baseline plus binary file I/O, exclusive
      staging, atomic rename, permission, and detached-process primitives.
- [ ] Decide how each required primitive is capability-probed without Node or Python and how probe
      results are scoped to the remote host/connection.
- [ ] Define missing-command behavior as compatibility failure, eligible for legacy in `auto` only
      where that legacy tuple is proven.
- [ ] Record BusyBox variants whose semantics satisfy the POSIX baseline and disable bundled mode for
      variants that do not.

### Node runtime ownership

- [x] Pin the first runtime contract to official Node v24.18.0 LTS (Krypton). Stay on Node 24 LTS
      until a separately reviewed major upgrade; never silently float a desktop build to a newer
      patch. (E-M1-NODE-PROVENANCE-001)
- [x] Use unchanged official nodejs.org binaries for Linux glibc x64/arm64, macOS x64/arm64, and
      Windows x64/arm64. Build all relay code and native dependencies in target-native Orca jobs;
      do not substitute cross-built Node executables. (E-M1-NODE-PROVENANCE-001)
- [x] Produce no musl Node binary in the initial release. A later musl candidate requires an
      Orca-owned target-native source build, reproducible provenance, signing, and the same live
      gates; unofficial community binaries are prohibited. (E-M1-NODE-PROVENANCE-001)
- [x] Check Node security/release status at least weekly and at every desktop release cut. Triage a
      published Node/runtime CVE within one business day; ship an applicable critical fix within
      seven calendar days and high-severity fix within fourteen, or disable the affected bundled
      tuple while legacy remains available. (E-M1-NODE-PROVENANCE-001)
- [x] Require every Node patch, CVE remediation, native-code change, dependency change, manifest-key
      change, or accepted-key change to create a new runtime content ID and a new desktop tag/build
      with a newly embedded signed manifest. Old clients remain pinned. (E-M1-NODE-PROVENANCE-001)
- [x] Verify the detached Node `SHASUMS256.txt.sig` against a build-input-pinned Node release
      keyring before extraction, record the signer fingerprint and source archive digest in
      provenance, and preserve official executable bytes/signatures. Orca-built native executables
      and libraries still require the target-native signing policy decided below.
      (E-M1-NODE-PROVENANCE-001)

### Trust and signing

- [ ] Choose manifest signature algorithm and library based on existing Orca dependencies and
      platform availability.
- [ ] Define canonical manifest serialization byte-for-byte.
- [ ] Define signing-key creation, storage, protected-environment access, auditability, and least
      privilege.
- [ ] Define key IDs, accepted-key embedding, dual-key rotation window, revocation response, and
      emergency replacement. Revocation and emergency replacement ship through the desktop update
      path; old clients remain pinned and no mutable freshness lookup is introduced.
- [ ] Define exact-tag anti-rollback behavior and whether downgrading the desktop may use older
      manifests.
- [ ] Decide whether keyless build provenance supplements or replaces any long-lived CI credential.
- [ ] Define macOS code-signing/notarization requirements for Node, `spawn-helper`, and native
      modules.
- [ ] Define Windows Authenticode requirements for Node, `.node`, DLL, and helper executables.
- [ ] Define WDAC, Gatekeeper, antivirus, and endpoint-protection validation environments.

### Operational budgets and rollout policy

- [ ] Record current legacy cold-install and warm-connect baselines on representative networks.
- [ ] Set numeric local cache size and eviction budgets.
- [ ] Set archive compressed-size, expanded-size, file-count, and per-file limits.
- [ ] Set local download, extraction, transfer, remote verification, launch, cancellation, and total
      bootstrap time budgets.
- [ ] Set desktop and remote peak-memory budgets for every transfer path.
- [ ] Set SFTP concurrency and open-channel limits.
- [ ] Define acceptable warm-path and cold-path latency regressions numerically.
- [ ] Define how long legacy fallback remains and the evidence required before narrowing it.
- [x] Use existing per-SSH-target configuration for rollout control; do not add a rollout backend.
      This closes the control-mechanism decision, not its implementation.
      (E-M1-ROLLOUT-DECISION-001)
- [ ] Decide user-facing behavior when the client is offline, the asset is absent locally, the
      remote cache is absent, and legacy prerequisites are unavailable.

#### Per-target Beta rollout decision

Decision owner: Codex implementation owner for #8450. Decision authority: worktree owner direction
on 2026-07-14. The purpose is to gather real-host evidence without changing behavior for existing
SSH users or making all of a user's hosts depend on one experimental path.

- [x] Keep `legacy` as the persisted and effective default for every existing and newly added SSH
      target. An absent or unknown configuration value must deserialize conservatively to `legacy`.
      (E-M1-ROLLOUT-DECISION-001)
- [x] Expose the bundled-preferred path as a Beta-tagged option on SSH target add and edit surfaces,
      stored per target rather than as a global experiment. (E-M1-ROLLOUT-DECISION-001)
- [x] Represent the persisted choice as an extensible mode such as `legacy | bundled-auto`, not a
      boolean. Keep forced `bundled` as a separate engineering/support diagnostic and do not expose
      it as the normal Beta choice. Exact schema naming remains an implementation detail.
      (E-M1-ROLLOUT-DECISION-001)
- [x] Apply a setting change only to the next connection or explicit reconnect. Never hot-swap the
      relay underneath a live PTY, watcher, RPC, reconnect, or reattach generation.
      (E-M1-ROLLOUT-DECISION-001)
- [x] In Beta mode, allow only classified availability/compatibility failures to enter proven
      legacy automatically. Integrity/security failures remain fail-closed; recovery is an explicit
      local action that disables Beta for that target and reconnects through legacy.
      (E-M1-ROLLOUT-DECISION-001)
- [x] Require a separate reviewed rollout decision and completed evidence gates before changing the
      default for any tuple. Shipping the Beta setting does not authorize default-on or legacy
      removal. (E-M1-ROLLOUT-DECISION-001)

Decision evidence required: reviewed decision record with owners, dates, rationale, and affected
matrix cells.

## Milestone 2 — Define the Artifact, Manifest, and Identity Contract

Suggested modules are provisional; update this file before choosing different names.

### Manifest schema

- [ ] Add a versioned relay artifact schema in a concrete domain module such as
      `src/main/ssh/ssh-relay-artifact-schema.ts`.
- [ ] Include schema version, exact Orca build tag, relay protocol version, runtime content ID,
      OS, architecture, libc family/version requirements, minimum OS/kernel requirements, Node
      version, dependency versions, archive name, archive size, expanded size, file count, and
      archive SHA-256.
- [ ] Include every runtime file’s relative path, type, size, SHA-256, and required executable mode.
- [ ] Include signing key ID, signature algorithm/version, creation timestamp, and provenance/SBOM
      references without making wall-clock time part of runtime identity.
- [ ] Include target-native code-signing verification attestation, policy/tool identity, and the
      exact attested byte hashes inside the signed manifest.
- [ ] Reject duplicate tuple entries, duplicate/case-colliding paths, unsafe Windows names,
      unsupported schema versions, missing required files, extra native platform packages, and
      inconsistent aggregate sizes.
- [ ] Define exact archive naming for stable, RC, and perf builds.
- [ ] Define exact direct release URL construction. Runtime code must not call the GitHub API or use
      a mutable `latest` URL.

### Content identity

- [ ] Compute the content identity from canonical full-runtime metadata and file digests, including
      Node, relay entries, native modules, helper executables, and runtime JavaScript.
- [ ] Prove changing only Node changes the identity.
- [ ] Prove changing only `node-pty` changes the identity.
- [ ] Prove changing only `@parcel/watcher` changes the identity.
- [ ] Prove changing only `relay-watcher.js` changes the identity.
- [ ] Prove mode changes for executable files change the identity or are otherwise authenticated.
- [ ] Prove metadata that should not affect execution does not create nondeterministic identities.
- [ ] Update remote directory parsing and GC rules for the new mode-qualified identity without
      breaking legacy directory recognition.

### Archive safety

- [ ] Permit only regular files and explicitly declared directories; reject devices, FIFOs,
      sockets, hard links, and symlinks unless a separately reviewed safe policy is adopted.
- [ ] Reject absolute paths, `..`, drive/UNC paths, path separators inappropriate for the local
      extraction platform, Windows alternate data streams, device names, trailing spaces/dots, and
      case-fold collisions.
- [ ] Enforce compressed size, expanded size, file count, nesting depth, and per-file limits before
      and during extraction.
- [ ] Verify the extracted tree exactly matches the manifest with no missing or extra files.
- [ ] Add deterministic schema, identity, canonicalization, URL, and hostile-archive tests.

Completion evidence required: schema and test files, red/green evidence, canonical test vectors,
and reviewed compatibility contract.

## Milestone 3 — Build Minimal Self-Contained Runtime Archives

Each runtime must contain only the executable closure required by the relay.

- [ ] Replace or extend `config/scripts/build-relay.mjs` without weakening its existing relay and
      watcher content-hash guarantees.
- [ ] Add a clearly named runtime assembly script, for example
      `config/scripts/build-ssh-relay-runtime.mjs`.
- [ ] Pin Node and verify downloaded source/binary checksums and upstream signatures.
- [ ] Build Orca’s patched `node-pty@1.1.0` against the exact bundled Node runtime.
- [ ] Assert Orca-required patched exports/diagnostics exist; do not silently use an upstream
      prebuild that omits the patch.
- [ ] Include exactly one compatible `@parcel/watcher@2.5.6` native optional package.
- [ ] Include relay JavaScript, watcher child, required runtime JavaScript closure, licenses, SBOM,
      provenance, and runtime metadata.
- [ ] Exclude package managers, development dependencies, compilers, sources, caches, build
      directories, and debug symbols unless an approved diagnostics requirement needs them.
- [ ] Make archive output deterministic or document and isolate unavoidable nondeterminism.
- [ ] Verify required executable modes before archiving.
- [ ] Sign native code according to the platform decisions in Milestone 1.
- [ ] Verify platform-native signatures/policy on target-native runners after signing and before
      aggregation; attest the exact verified bytes for the signed manifest.
- [ ] Run local archive inspection and target-runtime smoke before upload.

### Per-tuple build and executable proof

| Runtime tuple     | Build/provenance | Bundled Node | `node-pty` load + real PTY | Watcher events | Oldest baseline | Native trust | Evidence |
| ----------------- | ---------------- | ------------ | -------------------------- | -------------- | --------------- | ------------ | -------- |
| linux-x64-glibc   | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —        |
| linux-arm64-glibc | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —        |
| linux-x64-musl    | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —        |
| linux-arm64-musl  | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —        |
| darwin-x64        | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —        |
| darwin-arm64      | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —        |
| win32-x64         | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —        |
| win32-arm64       | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —        |

Rules:

- [ ] Real hardware or native virtualized execution is required for release promotion. QEMU or
      cross-compilation may add coverage but cannot fill the evidence column alone.
- [ ] A tuple without a trustworthy runtime source or real runner stays disabled.
- [ ] Every archive executes the exact bundled Node, loads both native dependencies, spawns a real
      PTY, performs input/resize/exit, and observes create/modify/rename/delete watcher events.
- [ ] Every build records compiler/toolchain/container image digests and runner architecture.

## Milestone 4 — Make Relay Artifacts Prerequisites of Desktop Builds

- [ ] Add target-native runtime build jobs for every enabled tuple; do not treat a cross-build alone
      as native execution evidence.
- [ ] Add platform-native signing jobs. Signed macOS and Windows runtime bytes must return as
      immutable outputs before final hashes are computed.
- [ ] Add one fail-closed aggregate job that waits for all required native build/signing outputs,
      validates them, computes final hashes, builds the canonical manifest, and signs it.
- [ ] Make Linux, Windows, and macOS desktop build jobs depend on the successful aggregate output.
- [ ] Download the immutable manifest artifact into every desktop build workspace.
- [ ] Embed the exact signed manifest and accepted public keys in the packaged desktop.
- [ ] Prove all desktop variants embed byte-identical manifest contents.
- [ ] Ensure development builds can use a deterministic local unsigned/development manifest without
      weakening official-build verification.
- [ ] Upload the exact prebuilt runtime bytes—not rebuilt equivalents—to the same draft GitHub
      Release as the app.
- [ ] Aggregate platform job outputs without clobbering or duplicating asset names.
- [ ] Extend `config/scripts/verify-release-required-assets.mjs` or add a narrowly named relay gate
      that verifies every enabled asset, manifest, signature, size, and upload state.
- [ ] Download every draft asset back through the authenticated release API, verify byte identity,
      and execute the archive before allowing publication.
- [ ] Confirm stable, RC, and perf tag identities remain exact and cannot cross channels.
- [ ] Confirm a partial or failed relay build leaves the release draft and blocks publication.
- [ ] Confirm artifact upload retries do not change signed bytes or silently replace the manifest.
- [ ] Define bounded retry/timeout behavior for every native build, signing, aggregate, upload, and
      read-back job; exhaustion must block downstream jobs.
- [ ] Make manual signing approval absence, denial, or timeout fail closed rather than allowing an
      unsigned or stale asset through the aggregate.
- [ ] Rehearse signing-service failure and recovery of the same draft without changing already signed
      bytes or accidentally publishing it.

Completion evidence required: release workflow tests, a draft rehearsal, read-back hashes, embedded
manifest extraction from every packaged app, and blocked-publication failure rehearsal.

## Milestone 5 — Implement Desktop Artifact Selection, Download, and Cache

Suggested concrete modules:

- `src/main/ssh/ssh-relay-artifact-selector.ts`
- `src/main/ssh/ssh-relay-libc-detection.ts`
- `src/main/ssh/ssh-relay-artifact-download.ts`
- `src/main/ssh/ssh-relay-artifact-cache.ts`
- `src/main/ssh/ssh-relay-artifact-extraction.ts`

### Platform and libc selection

- [ ] Reuse current OS/architecture detection without changing supported relay-platform parsing.
- [ ] Add marked, noise-resistant, no-Node libc probes.
- [ ] Prefer `getconf GNU_LIBC_VERSION` when present; parse only output following Orca’s marker.
- [ ] Detect musl through marked `ldd --version` output and known loader paths without treating
      arbitrary startup text as evidence.
- [ ] Validate required libc/libstdc++/kernel/OS versions against manifest constraints.
- [ ] Treat absent, ambiguous, conflicting, or unparseable results as unknown and choose proven
      legacy behavior in `auto` mode.
- [ ] Cover GNU coreutils, BusyBox, Alpine, containers, old glibc, Rosetta, Windows, macOS, startup
      noise, missing commands, localization, cancellation, and `MaxSessions=1`.

### Manifest verification and exact URL resolution

- [ ] Load the embedded manifest for official builds and verify its signature before trusting fields.
- [ ] Verify the manifest-authenticated target-native attestation and exact byte hashes portably; do
      not assume a macOS client can run Authenticode tooling or a Windows client can run `codesign`.
- [ ] Resolve the expected tuple and content ID while fully offline.
- [ ] Construct the exact `/releases/download/<tag>/<asset>` URL without an API lookup.
- [ ] Reject redirects that violate the approved GitHub release-asset origin policy.
- [ ] Ensure authorization, cookies, proxy credentials, and custom headers do not leak across redirect
      origins.
- [ ] Use Electron networking that respects supported system proxy and certificate behavior.

### Download and local cache

- [ ] Store archives and extracted trees under an app-owned cache, keyed by signed content identity.
- [ ] Stream downloads into exclusive temporary files; never buffer a full runtime in memory.
- [ ] Apply download size and time budgets while streaming.
- [ ] Verify archive SHA-256 before extraction.
- [ ] Extract into an exclusive temporary directory with all archive-safety checks from Milestone 2.
- [ ] Verify the exact expanded tree before atomically publishing the cache entry.
- [ ] Coordinate cache ownership across multiple Orca processes and windows.
- [ ] Recover stale download/extraction locks without deleting an active writer.
- [ ] Never select partial files, partial directories, or entries with a failed verification record.
- [ ] Re-verify cached metadata and expected identity before use; define when full file rehashing is
      required.
- [ ] Implement bounded eviction that never removes an in-use entry.
- [ ] Handle read-only cache, permission failures, disk full, quota, inode exhaustion, cancellation,
      crash, corruption, and concurrent download deterministically.
- [ ] Preserve `ORCA_RELAY_PATH` for explicit development/test use with an official-build safety
      boundary.
- [ ] Prefetch only last-known target tuples under an explicit size/network policy; prefetch must not
      block app startup or a normal connection.

### Required offline/cache cases

| Remote runtime    | Local verified cache | Client internet | Expected bundled behavior                                               | Legacy/error behavior                                        | Evidence |
| ----------------- | -------------------- | --------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ | -------- |
| Present, matching | Any                  | Offline         | Launch remote cache without GitHub                                      | None                                                         | —        |
| Missing           | Present              | Offline         | Transfer local cache over SSH                                           | None                                                         | —        |
| Missing           | Missing              | Online          | Download locally, verify, transfer                                      | Fallback only on eligible failure                            | —        |
| Missing           | Missing              | Offline         | Bundled unavailable                                                     | Proven legacy or precise error                               | —        |
| Partial/corrupt   | Present              | Offline         | Quarantine remote entry; replace from verified local cache              | Fail closed if verified reinstall fails; no automatic legacy | —        |
| Missing           | Corrupt              | Online          | Quarantine local entry; redownload and fully verify                     | Fail closed if recovery fails; no automatic legacy           | —        |
| Missing           | Corrupt              | Offline         | Quarantine and reject corrupt cache                                     | Fail closed; no automatic legacy                             | —        |
| Corrupt           | Missing              | Any             | Quarantine remote entry; recover only from newly verified bundled bytes | Fail closed if recovery is unavailable/fails                 | —        |

## Milestone 6 — Add Bounded Runtime Transfer for Every SSH Transport

Current behavior must not be assumed adequate for a much larger runtime:

- POSIX system SSH currently streams a tar archive and requires remote `tar`.
- Windows system SSH currently collects the tree and sends one JSON/base64 package.
- SFTP currently walks files serially and does not preserve executable modes.

### Shared transfer contract

- [ ] Define one transport-neutral source-tree contract based on the verified manifest.
- [ ] Pre-scan and reject local source mutation, symlinks, special files, extra files, and path
      collisions before creating remote files.
- [ ] Stream files with bounded buffers; prohibit whole-tree memory materialization.
- [ ] Pass one AbortSignal through enumeration, channel creation, reads, writes, permission repair,
      and remote cleanup.
- [ ] Close and await every local stream, SSH channel, child process, SFTP session, and cleanup task
      on success, failure, cancellation, and timeout.
- [ ] Track transferred bytes/file counts for progress and bounded diagnostics without logging paths.
- [ ] Restore every executable mode declared by the manifest, including bundled Node and
      `spawn-helper`, before validation.
- [ ] Require exclusive per-file staging so no concurrent writer or launcher can observe a partial
      file as complete.

### POSIX system SSH

- [ ] Capability-probe remote tar with a narrow cache scoped to the SSH host/connection.
- [ ] Keep streaming tar as an optional fast path when proven available and compatible.
- [ ] Add a no-tar bounded file-stream path: frame each manifest file locally, open an authenticated
      SSH exec channel, and stream raw bytes through stdin into its exclusive staged path using only
      the declared POSIX shell/file primitives.
- [ ] Prove the no-tar path does not invoke remote Node, Python, Perl, archive tools, `sha256sum`, or
      `shasum`.
- [ ] Preserve remote path quoting and avoid shell injection for spaces and non-ASCII homes.
- [ ] Verify local and remote tar failures, pipeline failures, and cancellation are all observed and
      joined.
- [ ] Fail with a compatibility classification when a required POSIX primitive is missing or has
      incompatible semantics; do not improvise a text/base64 transfer.

### Windows system SSH

- [ ] Replace whole-tree JSON/base64 buffering with a framed or per-file bounded binary stream.
- [ ] Implement against the declared PowerShell/.NET baseline using binary stdin/file APIs and
      exclusive staged paths; do not depend on implicit console text encodings.
- [ ] Avoid command-line length, PowerShell string, and full-input buffering limits.
- [ ] Handle case-insensitive collisions, reserved names, long paths, endpoint-protection locks, and
      partial writes.
- [ ] Prove binary fidelity without relying on text encoding.
- [ ] Fail with a compatibility classification when the declared PowerShell/.NET primitives are
      missing or incompatible.

### SFTP

- [ ] Add bounded concurrency without exceeding restrictive server session/channel limits.
- [ ] Preserve per-file abortability and close handles deterministically.
- [ ] Restore modes after upload and verify mode-repair failure is fatal before finalization.
- [ ] Compare serial and bounded-concurrency behavior on high-latency SSH.

### Transfer validation

- [ ] Test zero-byte, large, many-small-file, and maximum-allowed trees.
- [ ] Test required-command absence one primitive at a time on POSIX and Windows.
- [ ] Test supported and unsupported BusyBox command variants, including byte fidelity and exit-code
      behavior.
- [ ] Test source mutation and local symlink replacement during upload.
- [ ] Test network interruption at beginning, middle, final file, permission repair, and sentinel
      write.
- [ ] Test local and remote disk full, quota, inode exhaustion, read-only target, noexec target,
      Windows antivirus lock, and SSH channel closure.
- [ ] Measure peak RSS, bytes buffered, open file handles, channels, duration, and cancellation
      settlement against Milestone 1 budgets.
- [ ] Prove cancelled transfer performs no later writes.

## Milestone 7 — Install, Verify, Launch, Reconnect, and Garbage-Collect

Suggested concrete modules:

- `src/main/ssh/ssh-relay-runtime-transfer.ts`
- `src/main/ssh/ssh-relay-runtime-validation.ts`
- `src/main/ssh/ssh-relay-bootstrap-mode.ts`

- [ ] Refactor `ssh-relay-deploy.ts` without adding a max-lines disable; split by domain
      responsibility where necessary.
- [ ] Resolve expected bundled content identity before remote install-state probing.
- [ ] Verify embedded manifest signature, tuple, limits, archive SHA-256, and exact extracted tree on
      the client before transfer begins.
- [ ] Use mode-qualified, content-addressed remote directories and locks.
- [ ] Upload into a mode-qualified partial/staging directory that no launcher or GC can treat as
      complete.
- [ ] Treat local verification plus authenticated SSH transfer into exclusive staging as the
      pre-execution integrity boundary; document that a hostile authenticated account is out of scope.
- [ ] Do not require a remote hash utility. Run bundled Node from the transferred staging path as the
      first staged binary execution, verify its exact version, and use it to hash every manifest file.
- [ ] Compare the complete staged-tree sizes and SHA-256 values before any sentinel or publish step.
- [ ] Load `node-pty` and `@parcel/watcher` through bundled Node.
- [ ] Repeat target-native execution/policy probes before finalization; any native-trust failure is an
      integrity/security failure even though transfer may already have occurred.
- [ ] Run a minimal real PTY input/resize/exit smoke and watcher event smoke before finalization.
- [ ] Write structured `.install-complete` contents containing schema, mode, content ID, manifest
      digest, and validation version; do not use an empty sentinel.
- [ ] Assert the ordering: full-tree hash comparison, native loads, PTY/watcher smoke, then completion
      sentinel and atomic publication. No earlier stage may write a success sentinel.
- [ ] Atomically publish the completed install or otherwise prove no observer can see it as complete
      before validation finishes.
- [ ] On warm reconnect, require the expected structured sentinel identity plus required-file
      presence and signed-manifest size metadata before treating the directory as initially validated.
- [ ] Do not full-tree rehash every warm launch. Trust the structured initial-install proof under the
      completed-directory immutability assumption to protect latency; explicitly document that the
      sentinel is not ongoing proof against post-install filesystem mutation.
- [ ] Treat any detected warm-cache absence, size/hash mismatch, unexpected file, or changed sentinel
      as integrity failure: quarantine it, recover only from freshly verified bundled bytes, and fail
      closed without automatic legacy if recovery cannot complete.
- [ ] Launch `relay.js` with bundled Node and an environment that cannot accidentally resolve remote
      user packages ahead of bundled dependencies.
- [ ] Preserve protocol-handshake and version-mismatch behavior.
- [ ] Preserve `MaxSessions=1` sequential fallback for probes.
- [ ] Preserve concurrent install locking, stale-lock recovery, cross-version isolation, reconnect,
      PTY reattach, watcher isolation, and best-effort GC.
- [ ] Ensure GC recognizes bundled, legacy, partial, locked, active, and malformed directories and
      never deletes a live version.
- [ ] Ensure a failed bundled install never mutates a completed legacy install or running relay.
- [ ] Confirm primary-path command capture contains no npm, curl, wget, registry, compiler, Python,
      system-Node, `sha256sum`, or `shasum` invocation.

Completion evidence required: deterministic install/failure tests, built-runtime harness, live SSH
connect/reconnect/upgrade/downgrade, PTY/watcher proof, and command audit.

## Milestone 8 — Implement a Safe, Explicit Fallback State Machine

Modes:

- `auto`: bundled primary; eligible availability/compatibility failures may use proven legacy.
- `bundled`: bundled only; fail with exact stage and recovery guidance.
- `legacy`: current embedded relay plus coherent remote Node/npm behavior.

The public per-target Beta choice maps `bundled-auto` configuration to internal `auto` behavior.
Missing, unknown, or disabled configuration maps to `legacy`; forced `bundled` remains an
engineering/support control.

- [ ] Add the versioned per-target runtime-mode field and prove existing, missing, malformed,
      imported, and newly created target configurations resolve to `legacy` unless explicitly
      opted in.
- [ ] Add the Beta-tagged option to SSH target add and edit surfaces using the existing design-system
      Beta treatment; persist it only for that target.
- [ ] Prove toggling the option does not mutate or restart a live relay and takes effect only on the
      next connection or explicit reconnect.
- [ ] For fail-closed Beta errors, provide an explicit local “disable Beta and reconnect” recovery
      action that updates the target before starting legacy; never disguise it as automatic fallback.
- [ ] Record privacy-safe tuple, transport, stage, duration, outcome, and fallback reason under
      existing telemetry consent without hostname, username, path, command, or target identity.

### State and cancellation

- [ ] Model explicit states for manifest resolution, local-cache lookup, download, extraction,
      transfer, remote verification, launch, bundled cleanup, legacy bootstrap, and connected.
- [ ] Give every state a named timeout budget and child AbortSignal derived from one parent.
- [ ] Replace timeout-only `Promise.race` behavior where underlying deployment can continue after the
      caller fails.
- [ ] On eligible bundled failure, abort, close, and await all bundled work before legacy begins.
- [ ] Invalidate callbacks by generation so late completion cannot write a sentinel, launch a relay,
      report success, or mutate cache/install state.
- [ ] Use separate bundled/legacy identities, locks, partial dirs, completion records, and GC rules.
- [ ] Ensure two simultaneous clients choosing different modes cannot modify one another’s install.
- [ ] Preserve the original bundled failure and fallback outcome in bounded diagnostics.

### Failure classification

- [ ] Classify GitHub unavailable, client offline, asset missing, approved redirect failure, proxy
      failure, local cache unavailable, unsupported tuple, and bundled runtime incompatibility.
- [ ] Classify signature mismatch, archive hash mismatch, unsafe archive, extracted/transferred-tree
      mismatch, bundled-Node corruption, and native-signature failure as integrity/security failures.
- [ ] Permit automatic legacy only for explicitly classified availability/compatibility failures and
      only for remote tuples with current legacy evidence.
- [ ] Make every integrity/security failure fail closed in `auto`; assert no legacy process, lock,
      partial directory, or diagnostic “fallback success” is created.
- [ ] Never execute rejected bytes. Delete/quarantine them according to an explicit policy.
- [ ] If legacy prerequisites are unproved or fail, return an error that includes bundled stage,
      fallback stage, actionable recovery, and no sensitive paths.
- [ ] Forced `bundled` never silently changes mode.
- [ ] Forced `legacy` never performs a GitHub runtime download.

### Race and fallback proof

- [ ] Timeout during download, extraction, SFTP transfer, system-SSH transfer, chmod, hash, PTY
      smoke, watcher smoke, sentinel write, and launch.
- [ ] Cancellation while a sibling connection waits on the bundled lock.
- [ ] Bundled failure while an old bundled relay remains live.
- [ ] Bundled failure while legacy install is complete and live.
- [ ] Legacy failure after bundled cleanup.
- [ ] App shutdown during every state.
- [ ] Assert zero post-fallback bundled writes, processes, channels, locks, and callbacks.

## Milestone 9 — Diagnostics, Progress, Support, and Privacy

- [ ] Define stable stage codes for selection, manifest, cache, download, extraction, transfer,
      permission repair, remote hash, native probe, smoke, launch, fallback, and connected.
- [ ] Define stable fallback reason codes without embedding remote output, usernames, hostnames, IPs,
      repository names, or paths.
- [ ] Preserve exact low-level errors in local diagnostic logs with existing redaction boundaries.
- [ ] Add aggregate duration/byte/count metrics only through existing authorized diagnostics or
      telemetry mechanisms; do not imply authorization for a new backend.
- [ ] Provide progress labels for operations exceeding the style-guide thresholds; avoid flashing
      progress for warm cache hits.
- [ ] Keep connection controls disabled immediately while maintaining stable focus.
- [ ] Document `auto`, `bundled`, and `legacy` support overrides and their intended support use.
- [ ] Add troubleshooting for client offline, remote offline, missing asset, unsupported tuple,
      signature failure, noexec home, disk full, proxy, and fallback failure.
- [ ] Make user-visible wording state facts only after the corresponding stage result exists.
- [ ] Add tests for diagnostic bounds, redaction, stage ordering, duplicate suppression, and
      cancellation/fallback reporting.

## Milestone 10 — Deterministic Test and Fault-Injection Coverage

### Schema, selector, and trust

- [ ] Canonical manifest serialization golden vectors.
- [ ] Valid/invalid signatures, unknown key IDs, rotated keys, revoked keys, wrong tag, rollback, and
      unsupported schema.
- [ ] Valid/tampered/missing target-native trust attestations and attested-byte hash mismatches,
      verified from clients running a different OS than the target tuple.
- [ ] Every OS/architecture/libc selection plus unknown/conflicting/noisy probes.
- [ ] Minimum-version boundaries for libc, libstdc++, kernel, macOS, and Windows.
- [ ] Exact stable/RC/perf URL and channel mapping.

### Cache and download

- [ ] 200 and approved redirects, redirect loop, wrong origin, missing `Location`, 404, 429 with
      retry policy, 5xx, timeout, proxy auth, certificate failure, truncated body, oversized body,
      wrong content length, wrong hash, and deleted asset.
- [ ] Cold, warm, offline, corrupt, partial, concurrent, multi-process, stale-lock, eviction, read-only,
      permission, local disk full, quota, and inode cases.
- [ ] Archive traversal, absolute path, symlink/hardlink/device, Windows name/path, case collision,
      archive bomb, too many files, deep nesting, unexpected file, and source mutation cases.
- [ ] Assert bad manifest signature, archive hash, archive safety, extracted-tree hash, and native
      signature each fail closed in `auto` without entering legacy.

### Install and fallback

- [ ] Full identity change and remote-directory change for every executable component.
- [ ] Lock first acquisition, waiter, concurrent probe, stale recovery, cancellation, and host
      isolation.
- [ ] Partial install is never complete; structured sentinel must match expected mode/content/schema.
- [ ] Transfer corruption is detected before finalization.
- [ ] Missing remote `sha256sum`/`shasum` still succeeds through bundled-Node full-tree hashing.
- [ ] Corrupt one uploaded file after transfer and before verification; prove no sentinel is written
      and no relay launches.
- [ ] Corrupt or prevent execution of the transferred bundled Node; prove verification fails before
      sentinel and does not automatically enter legacy as an integrity failure.
- [ ] Corrupt local and completed remote caches; prove quarantine plus recovery from freshly verified
      bytes, or fail-closed behavior with zero automatic legacy when recovery is unavailable/fails.
- [ ] Mutate a warm remote file/sentinel and prove every detected case fails closed. Separately prove
      an unchanged warm path trusts initial-install proof without a full-tree rehash and meets latency.
- [ ] Instrument stage ordering and prove tree hash → native loads → PTY/watcher smoke → sentinel →
      publish/launch with no alternative success path.
- [ ] Existing legacy and bundled installs never overlap or mutate.
- [ ] All fallback transition and stale-generation cases from Milestone 8.

### Relay behavior

- [ ] Protocol handshake and frame compatibility.
- [ ] PTY spawn, attach, input, resize, signal, exit, reconnect, and error mapping.
- [ ] Filesystem read/write/stat/readdir/search and bulk streaming.
- [ ] Filesystem watch registration, overflow, cancellation, crash isolation, and recovery.
- [ ] Git status/diff/blob/worktree/submodule/ignore and response streaming using Git 2.25-compatible
      commands and existing capability rules.
- [ ] Agent hooks, managed hook installation, remote CLI, preflight, port scan, subprocess, and aborts.
- [ ] Grace-period detach/reattach, two clients, app restart, remote restart, upgrade, downgrade, and
      GC.

## Milestone 11 — Live Platform and Environment Matrix

Use a risk-based two-layer matrix. This does **not** claim every client × remote tuple combination.
Every required cell must contain one or more evidence IDs rather than a bare checkmark or prose.

### Layer A — every enabled remote tuple across both transport families

Each cell’s evidence must cover a native real runner, no Node/npm/compiler, blocked remote egress,
PTY, watcher, every relay RPC family, reconnect/upgrade, and eligible legacy fallback. POSIX system
SSH evidence includes the no-tar path; Windows system SSH is a mandatory distinct path.

| Remote tuple      | Built-in SSH/SFTP evidence ID | System SSH evidence ID | `MaxSessions=1` evidence ID | Baseline/native-policy evidence ID |
| ----------------- | ----------------------------- | ---------------------- | --------------------------- | ---------------------------------- |
| linux-x64-glibc   | —                             | —                      | —                           | —                                  |
| linux-arm64-glibc | —                             | —                      | —                           | —                                  |
| linux-x64-musl    | —                             | —                      | —                           | —                                  |
| linux-arm64-musl  | —                             | —                      | —                           | —                                  |
| darwin-x64        | —                             | —                      | —                           | —                                  |
| darwin-arm64      | —                             | —                      | —                           | —                                  |
| win32-x64         | —                             | —                      | —                           | —                                  |
| win32-arm64       | —                             | —                      | —                           | —                                  |

### Layer B — every supported client against representative remote families

Each supported client OS/architecture must prove resolver/cache behavior and both transfer families
against representative POSIX and Windows remotes. This layer catches client-specific process,
filesystem, proxy/certificate, executable-bit, quoting, and cache behavior without pretending to be
a full Cartesian product.

| Client        | Resolver/cache evidence ID | Built-in → POSIX evidence ID | Built-in → Windows evidence ID | System SSH → POSIX evidence ID | System SSH → Windows evidence ID |
| ------------- | -------------------------- | ---------------------------- | ------------------------------ | ------------------------------ | -------------------------------- |
| macOS x64     | —                          | —                            | —                              | —                              | —                                |
| macOS arm64   | —                          | —                            | —                              | —                              | —                                |
| Linux x64     | —                          | —                            | —                              | —                              | —                                |
| Linux arm64   | —                          | —                            | —                              | —                              | —                                |
| Windows x64   | —                          | —                            | —                              | —                              | —                                |
| Windows arm64 | —                          | —                            | —                              | —                              | —                                |

- [ ] Define and record the representative POSIX and Windows remotes used by Layer B.
- [ ] Require Windows remote/system-SSH and `MaxSessions=1` evidence before any Windows remote tuple
      is enabled.
- [ ] Reject promotion if any required cell still contains `—`; do not roll up partial evidence into
      an unsupported “all combinations” claim.

### Required environment variants

- [ ] Exact #8450: system Node without npm plus usable NVM below `.bashrc` non-interactive guard.
- [ ] No Node, npm, Python, make, compiler, registry, curl, or wget.
- [ ] No tar, `sha256sum`, or `shasum`; no-tar transfer and bundled-Node verification still succeed.
- [ ] Remove each required POSIX and Windows bootstrap primitive in turn and verify deterministic
      compatibility classification.
- [ ] Remote egress denied at the network layer and audited for attempted connections.
- [ ] `~/.npmrc` with `ignore-scripts=true`, broken registry, and read-only npm cache.
- [ ] `MaxSessions=1`, noisy startup, slow SSH, packet interruption, proxy jump, and system SSH.
- [ ] Spaces, Unicode, long paths, case collisions, restrictive umask, read-only home, noexec home,
      disk quota, inode exhaustion, and endpoint-protection locks.
- [ ] Supported and unsupported BusyBox/Alpine primitive variants, old supported glibc boundary,
      containerized host, Rosetta, Windows OpenSSH, and enterprise native-code policy.
- [ ] Two Orca clients connecting/installing simultaneously.
- [ ] Existing live PTY during app/relay upgrade and downgrade.
- [ ] Remote reboot, app crash/restart, interrupted first install, stale lock, and GC with a live old
      relay.

## Milestone 12 — Performance and Resource Regression Gates

Baseline measurements must be captured before product behavior changes.

- [ ] Record legacy cold install p50/p95, warm connect p50/p95, transferred bytes, remote CPU/RSS,
      desktop CPU/RSS, process/channel/file counts, and failure timeout on the same machines used for
      comparison.
- [ ] Measure bundled cold download + transfer, local-cache transfer, remote-cache launch, GitHub
      failure-to-fallback, and client-offline behavior.
- [ ] Test at 1, 10, and 100 Mbps with 50, 100, and 200 ms latency and defined loss/jitter.
- [ ] Prove remote-cache warm connect meets the numeric Milestone 1 budget.
- [ ] Prove local-cache transfer and cold download meet the numeric Milestone 1 budgets.
- [ ] Prove SFTP and system-SSH transfer peak memory remain bounded by the numeric budgets.
- [ ] Prove file count does not cause unbounded sequential round trips or channel fanout.
- [ ] Prove cache verification/eviction does not block Electron startup or the renderer main thread.
- [ ] Prove failed bundled attempts do not add an unacceptable delay before eligible legacy fallback.
- [ ] Record before/after results, machine identity, network shaping, commit SHA, command, raw artifact,
      and statistical interpretation.
- [ ] Add demotion thresholds for latency, memory, transfer flakes, cache corruption, and fallback
      delay.

## Milestone 13 — Supply-Chain and Security Completion

- [ ] Write the explicit threat model and trust boundaries.
- [ ] Generate and publish an SBOM per runtime and aggregate release.
- [ ] Record build provenance, source revisions, toolchain/container digests, and native signatures.
- [ ] Verify official Node checksums/signatures before assembly and preserve native trust where
      possible.
- [ ] Verify Orca-built native code signatures on target macOS and Windows policies.
- [ ] Verify target-native attestation generation/read-back, signed-manifest authentication, portable
      client verification, and pre-finalization target policy probes on exact bytes.
- [ ] Exercise manifest key rotation and dual-key migration in a release rehearsal.
- [ ] Exercise compromised/revoked-key response by shipping a new desktop build with newly embedded
      keys/manifest; prove there is no mutable freshness or `latest` lookup.
- [ ] Exercise anti-rollback across stable, RC, perf, desktop upgrade, and desktop downgrade.
- [ ] Add dependency and Node CVE monitoring with a named owner and response SLA.
- [ ] Exercise an emergency runtime refresh through a new desktop tag/build, embedded manifest,
      identity, release, download, remote coexistence, and GC; prove an installed old client remains
      pinned to its original manifest.
- [ ] Review archive parsing, redirect handling, cache permissions, local TOCTOU, remote quoting,
      native loading search paths, and diagnostic redaction.
- [ ] Complete security review before `auto` becomes default for any stable tuple.

## Milestone 14 — Release, Rollout, Rollback, and Fallback Retirement

### Asset-only

- [ ] Publish complete runtime assets and signed manifest without production consumption.
- [ ] Run read-back, direct public URL, archive execution, and packaged-manifest comparison.
- [ ] Accumulate build/release flake and duration evidence.
- [ ] Rehearse native build/signing timeout, bounded retry success/exhaustion, manual approval
      absence/denial, signing failure, aggregate failure, and recovery of an unpublished draft.

### Per-target Beta — legacy remains default

- [ ] Ship the Beta-tagged per-target option in RC and stable builds with every existing and new
      target defaulting to `legacy`.
- [ ] Enable forced `bundled` only for engineering and support diagnostics; normal testers use the
      per-target `bundled-auto` Beta choice.
- [ ] Verify diagnostics and support recovery for every failure class.
- [ ] Run the full enabled tuple matrix and security/performance gates.
- [ ] Exercise forced `legacy` rollback from the same build.
- [ ] Accumulate approved privacy-safe Beta usage, success, classified fallback, integrity failure,
      latency, PTY/watcher, reconnect, and support evidence per exact tuple.

### Future default-on evaluation — separately authorized

- [ ] Obtain a separate reviewed decision before changing any target's default from `legacy`; this
      issue and the Beta implementation do not authorize that change.
- [ ] Consider default `auto` only for tuples whose artifact, live matrix, Beta usage, and support
      evidence are complete.
- [ ] Require three consecutive RC builds with no unexplained fallback, cache-corruption, PTY,
      watcher, reconnect, native-policy, or release failures.
- [ ] Test GitHub outage, client offline, remote offline, missing asset, unsupported tuple, and
      integrity failure from the packaged RC.
- [ ] Prove every integrity/security failure in that RC fails closed without automatic legacy.
- [ ] Confirm non-enabled tuples deterministically retain proven legacy behavior.

### Stable Beta soak

- [ ] Publish the opt-in Beta to stable only after its release-blocking gates pass against exact
      uploaded bytes; stable publication still leaves every target on `legacy` unless opted in.
- [ ] Keep automatic legacy fallback for at least the decided number of stable cycles.
- [ ] Monitor approved privacy-safe success/fallback/error signals and support reports.
- [ ] Define immediate demotion/rollback signals and owner.
- [ ] Exercise rollback without deleting live bundled or legacy remote installs.
- [ ] Do not narrow fallback until every retirement criterion below is satisfied.

### Fallback retirement criteria

- [ ] Every claimed supported tuple has stable real-environment bundled proof.
- [ ] Both layers of the risk-based client/transport/environment matrix are complete with an evidence
      ID in every required cell.
- [ ] Soak duration and release count meet the Milestone 1 policy.
- [ ] No unexplained fallback remains.
- [ ] GitHub outage and offline behavior remain acceptable without hidden remote requirements.
- [ ] Support has a tested downgrade/recovery path for old app versions and old remote installs.
- [ ] A separate reviewed decision explicitly authorizes removing or narrowing remote npm fallback.

## Proposed PR / Work-Package Split

Update status and evidence as work begins. Do not combine these into one large behavior switch.

| Work package              | Scope                                                                                      | Default behavior change     | Status                                                        | PR/evidence                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 0. #8450 legacy fix       | Coherent Node/npm selection and live repro                                                 | Fixes legacy selection only | Complete and CI-green in draft PR #8724                       | E-M0-UNIT-002, E-M0-LIVE-002, E-M0-STATIC-002, E-M0-PR-001, E-M0-CI-001 |
| 1. Contract and selectors | Manifest schema, identity, platform/libc selection, hostile inputs                         | None                        | Milestone 1 decisions in progress; implementation not started | Draft PR #8728; a84d52dc6                                               |
| 2. Runtime builds         | Per-tuple assembly, native smoke, SBOM/provenance/signing                                  | None                        | Not started                                                   | —                                                                       |
| 3. Release publication    | Prerequisite DAG, embedded manifest, draft upload/read-back gates                          | Asset-only                  | Not started                                                   | —                                                                       |
| 4. Desktop resolver/cache | Verified download, extraction, cache, offline behavior                                     | None/forced mode only       | Not started                                                   | —                                                                       |
| 5. Transfer/install       | Bounded transports, structured sentinel, bundled launch behind per-target Beta/forced mode | Per-target opt-in only      | Not started                                                   | —                                                                       |
| 6. Fallback/diagnostics   | Abort-and-join state machine, mode isolation, reason codes, target-mode configuration/UI   | Per-target Beta only        | Not started                                                   | —                                                                       |
| 7. Live gates/rollout     | Matrix, security, performance, release promotion                                           | Per-tuple staged            | Not started                                                   | —                                                                       |

Every PR must document:

- [ ] Named invariant and motivating issue.
- [ ] Exact product behavior changed and deliberately unchanged.
- [ ] Performance-risk inventory and numeric budgets.
- [ ] Correctness oracle and exact commands.
- [ ] Platform/provider/transport coverage: covered, unaffected, or accepted gap.
- [ ] Red/green evidence where a bug or failure contract is added.
- [ ] Residual gaps and fallback behavior.
- [ ] Rollback/demotion rule.
- [ ] Checklist and HTML plan updates.
- [ ] No unrelated worktree changes included.

## Verification Command Inventory

Do not mark commands passed here until they have actually run on the implementation commit. Add new
focused commands as their scripts/tests are introduced.

### Existing focused commands

- [x] `pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-remote-node-resolution.test.ts` (E-M0-UNIT-001)
- [x] `pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-native-deps-install.test.ts` (E-M0-UNIT-001)
- [x] `pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-versioned-install.test.ts` (E-M0-UNIT-001)
- [x] `pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-deploy.test.ts` (E-M0-UNIT-001)
- [x] `pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-cross-version-isolation.test.ts` (E-M0-UNIT-001)
- [x] `pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-remote-platform-detection.test.ts` (E-M0-UNIT-001)
- [ ] `pnpm exec vitest run --config config/vitest.config.ts src/relay/pty-handler.test.ts src/relay/fs-handler.test.ts src/relay/subprocess.test.ts`
- [x] `pnpm run build:relay` (E-M0-LIVE-001)
- [ ] `node config/scripts/relay-watcher-fault-harness.mjs`
- [ ] `pnpm run test:e2e:ssh-docker-watcher-isolation`
- [ ] `pnpm run test:e2e:ssh-docker-perf`
- [x] `pnpm run typecheck` (E-M0-STATIC-001, E-M0-STATIC-002, E-M0-CI-001)
- [x] `pnpm run lint` (E-M0-STATIC-002, E-M0-CI-001)
- [x] `pnpm run check:max-lines-ratchet` (E-M0-STATIC-001, E-M0-STATIC-002, E-M0-CI-001)

### Milestone 0 commands added

- [x] `pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-remote-node-toolchain-resolution.test.ts` (E-M0-UNIT-001)
- [x] `pnpm run test:e2e:ssh-node-toolchain-resolution` (E-M0-LIVE-001)

### Commands/scripts that must be added or formally identified

- [ ] Manifest/schema/identity unit-test command.
- [ ] Per-tuple runtime assembly command.
- [ ] Per-tuple archive inspection and native smoke command.
- [ ] Embedded-manifest extraction/comparison command for every packaged app.
- [ ] Draft release relay-asset completeness/read-back command.
- [ ] Release-DAG failure rehearsal covering native signing, aggregate, timeout/retry/manual approval,
      and recovered draft behavior.
- [ ] Hostile-archive and cache fault suite.
- [ ] Full-size transfer memory/cancellation suite for SFTP, POSIX system SSH, and Windows system SSH.
- [ ] Remote primitive/binary-fidelity suite for missing commands, BusyBox variants, no-tar POSIX,
      and bounded PowerShell/.NET Windows transfer.
- [ ] Remote verification-order suite for absent hash tools, corrupt upload, broken bundled Node, and
      sentinel/publish ordering.
- [ ] No-Node/no-egress packaged Electron SSH E2E.
- [ ] Full relay RPC conformance E2E using the packaged runtime.
- [ ] Upgrade/downgrade/concurrent-client/live-PTY E2E.
- [ ] macOS Gatekeeper and Windows Authenticode/WDAC/AV rehearsal commands.
- [ ] Network-shaped cold/warm/fallback performance report.
- [ ] Manifest key rotation/revocation/anti-rollback rehearsal.

## Verification Evidence Ledger

Append entries; do not rewrite history. If evidence becomes invalid after code or matrix changes,
mark it superseded and link the replacement.

Required entry format:

```text
### E-<AREA>-<NNN> — <short title>

- Date:
- Commit SHA / PR:
- Runner: <OS, version, architecture, native/emulated>
- Remote: <OS, version, architecture, libc, relevant restrictions>
- Transport/network:
- Exact command:
- Result: PASS | FAIL | FLAKE | SUPERSEDED
- Duration and resource metrics:
- Artifact/log/trace link:
- Oracle proved:
- Does not prove:
- Checklist items satisfied:
- Follow-up:
```

### E-PLAN-001 — Initial checklist creation

- Date: 2026-07-14
- Commit SHA / PR: uncommitted working tree
- Runner: documentation-only local worktree
- Remote: not applicable
- Transport/network: not applicable
- Exact command:

  ````sh
  node --input-type=module -e 'import fs from "node:fs"; import path from "node:path"; import { marked } from "marked"; const file="docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md"; const source=fs.readFileSync(file,"utf8"); const html=marked.parse(source); const links=[...source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(m=>m[1]).filter(h=>!(/^(https?:|#)/.test(h))); for(const href of links){if(!fs.existsSync(path.resolve(path.dirname(file),href))) throw new Error(`Missing link: ${href}`)} const fences=(source.match(/^```/gm)||[]).length; if(fences%2) throw new Error(`Unbalanced fences: ${fences}`); const open=(source.match(/^- \[ \]/gm)||[]).length; const done=(source.match(/^- \[[xX]\]/gm)||[]).length; if(done) throw new Error(`Unexpected completed boxes: ${done}`); if(!html.includes("type=\"checkbox\"")) throw new Error("Task lists did not render"); console.log(`PASS links=${links.length} fences=${fences} open=${open} complete=${done}`)'
  ````

- Result: SUPERSEDED after subsequent review-driven plan expansion; originally PASS for document
  creation only.
- Duration and resource metrics: 1.0 second; `links=1 fences=2 open=349 complete=0`.
- Artifact/log/trace link: this file and the linked HTML plan
- Oracle proved: the living checklist exists and covers implementation, validation, release, and
  rollback work.
- Does not prove: any product behavior, artifact build, SSH runtime, platform, security, release, or
  performance claim.
- Checklist items satisfied: none of the implementation milestones.
- Follow-up: replaced by E-PLAN-002; close Milestone 1 decisions before production implementation.

### E-PLAN-002 — Post-round-3 plan validation

- Date: 2026-07-14
- Commit SHA / PR: uncommitted planning worktree; implementation not started
- Runner: macOS arm64 local documentation validation
- Remote: not applicable
- Transport/network: local file rendering only
- Exact command:

  ````sh
  git diff --check
  node --input-type=module - <<'NODE'
  import fs from 'node:fs'
  import path from 'node:path'
  import { marked } from 'marked'
  import { parse } from 'parse5'
  const mdFile = 'docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md'
  const source = fs.readFileSync(mdFile, 'utf8')
  const rendered = marked.parse(source)
  const links = [...source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(m => m[1]).filter(h => !/^(https?:|#)/.test(h))
  for (const href of links) if (!fs.existsSync(path.resolve(path.dirname(mdFile), href))) throw new Error(`Missing link: ${href}`)
  const fences = (source.match(/^```/gm) || []).length
  const open = (source.match(/^- \[ \]/gm) || []).length
  const done = (source.match(/^- \[[xX]\]/gm) || []).length
  if (fences % 2 || done || !rendered.includes('type="checkbox"')) throw new Error('Invalid Markdown checklist')
  const html = fs.readFileSync('docs/reference/plans/2026-07-14-ssh-relay-github-release-plan.html', 'utf8')
  const errors = []
  parse(html, { onParseError: error => errors.push(error) })
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1])
  const hrefs = [...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1])
  if (errors.length || new Set(ids).size !== ids.length || hrefs.some(id => !ids.includes(id))) throw new Error('Invalid HTML plan')
  console.log({ links: links.length, fences, open, done, htmlIds: ids.length, fragmentLinks: hrefs.length })
  NODE
  ````

- Result: SUPERSEDED after the round-4 tuple-status correction; originally PASS for the working-tree
  artifacts after round-3 findings were resolved.
- Duration and resource metrics: 7.1 seconds; `links=1 fences=2 open=402 complete=0
htmlIds=11 fragmentLinks=9`.
- Artifact/log/trace link: this file, the linked HTML plan, and local screenshots
  `/tmp/relay-plan-desktop-light.png` and `/tmp/relay-plan-mobile-dark.png`.
- Oracle proved: Markdown rendered with balanced fences, valid local links, and no prematurely
  completed implementation boxes; HTML parsed without parse errors, duplicate IDs, or broken
  fragment links; `git diff --check` passed. HTML SHA-256 was
  `375659e4ed3c4ec06b8077cae5badf39761ea5d92267612081195d6a027e073f`; the checklist prefix
  before this ledger was `b599bf0c7ce6ca5ceb6188a153deb3437443f61d8a09069c8dc8dd6f21cdf9ad`.
- Does not prove: any product behavior, artifact build, SSH runtime, platform, security, release, or
  performance claim. Visual mobile emulation must be repeated after the final review because the
  first CLI session relaunched at its default viewport.
- Checklist items satisfied: none of the implementation milestones.
- Follow-up: replaced by E-PLAN-003; complete final visual validation before implementation handoff.

### E-PLAN-003 — Post-round-4 static validation

- Date: 2026-07-14
- Commit SHA / PR: uncommitted planning worktree; implementation not started
- Runner: macOS arm64 local documentation validation
- Remote: not applicable
- Transport/network: local file parsing only
- Exact command: the exact `git diff --check` and inline `marked`/`parse5` command block recorded in
  E-PLAN-002, followed by `shasum -a 256` for the HTML and the checklist prefix before this ledger.
- Result: PASS for current static planning artifacts.
- Duration and resource metrics: under 1 second; `links=1 fences=2 open=402 complete=0 htmlIds=11
fragmentLinks=9`.
- Artifact/log/trace link: this file and the linked HTML plan.
- Oracle proved: Markdown/HTML structure, links, task-state integrity, fragment IDs, whitespace, and
  current artifact identity. HTML SHA-256 is
  `728fa4edcf37e834f064a32308b2901a455402a61016bd7b047b151a75100bf1`; the checklist prefix
  before this ledger is `b599bf0c7ce6ca5ceb6188a153deb3437443f61d8a09069c8dc8dd6f21cdf9ad`.
- Does not prove: any product behavior or final visual responsiveness.
- Checklist items satisfied: none of the implementation milestones.
- Follow-up: obtain an explicit clean independent review, then run final desktop/mobile visual
  validation and implementation handoff.

### E-PLAN-004 — Clean review and final visual validation

- Date: 2026-07-14
- Commit SHA / PR: uncommitted planning worktree; implementation not started
- Runner: macOS arm64, agent-browser Chromium
- Remote: not applicable
- Transport/network: local `file://` rendering
- Exact command: independent subagent round 5 reviewed both files completely and returned `CLEAN`;
  agent-browser opened the HTML at 1440×1000 light mode and 390×844 @3x dark/reduced-motion mode,
  captured screenshots, queried document/table widths and media state, and checked page errors.
- Result: PASS.
- Duration and resource metrics: desktop `documentWidth=1440`, no page overflow, both tables
  `clientWidth=scrollWidth=966`; mobile `documentWidth=390`, no page overflow, table regions scroll
  internally at `352→363` and `352→505`; dark mode and reduced motion both active; no page errors.
- Artifact/log/trace link: `/tmp/relay-plan-final-desktop.png` and
  `/tmp/relay-plan-final-mobile.png` in the handoff machine, plus the round-5 `CLEAN` verdict.
- Oracle proved: current plan is visually usable at representative desktop/mobile widths, table
  overflow is contained, dark/reduced-motion media behavior activates, and an independent reviewer
  found no remaining actionable implementation, regression, security, cross-platform, release,
  evidence, HTML, or Markdown issue.
- Does not prove: product implementation or runtime behavior; all implementation checklist boxes
  remain open until backed by implementation evidence.
- Checklist items satisfied: planning review/validation only; none of Milestones 0–14.
- Follow-up: implementation agent must begin at Milestone 0/1, maintain this checklist, and attach
  evidence before marking any product item complete.

### E-M0-UNIT-001 — Coherent Node/npm resolver and legacy deploy regression suite

- Date: 2026-07-14
- Commit SHA / PR: `1ef0551bc138724d736583eac788f4183bef07e2` plus uncommitted Work Package 0 changes; no PR created
- Runner: macOS 26.2 arm64, native; Node v26.0.0 and pnpm 10.24.0 (repository requests Node 24)
- Remote: local POSIX shell fixture for the guarded-NVM case; mocked Windows PowerShell command
  construction; no live SSH remote in this entry
- Transport/network: local Vitest only
- Exact command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-remote-node-resolution.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-remote-node-toolchain-resolution.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-native-deps-install.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-versioned-install.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-deploy.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-cross-version-isolation.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-remote-platform-detection.test.ts
  ```

- Result: PASS; respectively 32/32, 8/8, 16/16, 26/26, 21/21, 1/1, and 6/6 tests
- Duration and resource metrics: respectively 577 ms, 1.21 s, 634 ms, 538 ms, 642 ms, 546 ms,
  and 156 ms Vitest duration; resource usage not instrumented
- Artifact/log/trace link: local command output; source fixtures in
  `ssh-remote-node-toolchain-resolution.test.ts`
- Oracle proved: POSIX and Windows probes require colocated Node/npm, Node 18 minimum remains,
  missing/failing/no-op npm candidates are skipped, guarded NVM is found without sourcing it,
  startup noise is marker-bounded, non-POSIX login shells receive a `/bin/sh`-wrapped toolchain
  probe, strict session-limit errors/cancellation remain classified, and the selected NVM bin
  directory reaches legacy `npm install`.
- Does not prove: live SSH, live Windows, system SSH, `MaxSessions=1` on a real server, release
  artifacts, or an executable red run against the pre-fix source. The original #8450 report is the
  field red observation; these green tests are discriminating but were not run after temporarily
  reverting user-owned code.
- Checklist items satisfied: Milestone 0 coherent pairing, negative cases, version enforcement,
  strategy/cancellation/session-limit preservation, and focused resolver/deploy verification.
- Follow-up: keep this work package separate; add live Windows or `MaxSessions=1` evidence only if
  those claims are needed for a later support matrix.

### E-M0-LIVE-001 — Ubuntu 24.04 guarded-NVM relay and PTY reproduction

- Date: 2026-07-14
- Commit SHA / PR: `1ef0551bc138724d736583eac788f4183bef07e2` plus uncommitted Work Package 0 changes; no PR created
- Runner: macOS 26.2 arm64 native client; Docker 29.2.1; Electron 43.1.0
- Remote: Ubuntu 24.04 Linux arm64/glibc container
  (`sha256:4fbb8e6a8395de5a7550b33509421a2bafbc0aab6c06ba2cef9ebffbc7092d90`);
  system Node v18.19.1 with no sibling npm; NVM-layout Node v22.22.3/npm 10.9.8 below a
  non-interactive `.bashrc` return guard; build-essential and Python present for the legacy native
  dependency install
- Transport/network: authenticated built-in SSH2 over Docker loopback; SFTP relay upload; remote
  registry and Node header egress available for the legacy npm install
- Exact command:

  ```sh
  pnpm run test:e2e:ssh-node-toolchain-resolution
  SKIP_BUILD=1 pnpm run test:e2e:ssh-node-toolchain-resolution
  ```

- Result: PASS twice; one purpose-named Playwright test passed on each run
- Duration and resource metrics: fresh Electron/relay build plus E2E 1.8 minutes; repeated E2E 1.2
  minutes with test evidence `durationMs=62553`; memory/channel/file counts not instrumented for this
  narrow legacy resolver proof
- Artifact/log/trace link: local Playwright stdout included
  `systemNode=v18.19.1 nvmNode=v22.22.3 npm=10.9.8 selected=nvm relayPty=pass`;
  fixture and runner are checked into this worktree
- Oracle proved: non-interactive and login-shell PATH both expose the incomplete system Node, the
  complete NVM directory remains discoverable below the guard, Orca connects, the detached relay's
  argv[0] is the NVM Node path, and a marker round-trips through a real remote PTY.
- Does not prove: Linux x64, musl, Windows, macOS remote, system SSH, `MaxSessions=1`, blocked remote
  egress, absence of build tools, fallback behavior, performance budgets, or bundled runtimes.
- Checklist items satisfied: Milestone 0 exact live #8450 reproduction and documented passing legacy
  tuple.
- Follow-up: keep this evidence scoped to the one declared legacy tuple; do not generalize it into a
  bundled or cross-platform support claim.

### E-M0-STATIC-001 — Work Package 0 type, format, line-budget, and diff gates

- Date: 2026-07-14
- Commit SHA / PR: `1ef0551bc138724d736583eac788f4183bef07e2` plus uncommitted Work Package 0 changes
- Runner: macOS 26.2 arm64 native; Node v26.0.0 and pnpm 10.24.0
- Remote: not applicable
- Transport/network: local only
- Exact command:

  ```sh
  pnpm run typecheck
  pnpm exec oxlint src/main/ssh/ssh-remote-node-resolution.ts src/main/ssh/ssh-remote-node-toolchain-probe.ts src/main/ssh/ssh-remote-node-resolution.test.ts src/main/ssh/ssh-remote-node-toolchain-resolution.test.ts src/main/ssh/ssh-relay-native-deps-install.test.ts tests/e2e/helpers/docker-ssh-relay-target.ts tests/e2e/helpers/docker-ssh-relay-processes.ts tests/e2e/ssh-node-toolchain-resolution.spec.ts
  pnpm exec oxfmt --check src/main/ssh/ssh-remote-node-resolution.ts src/main/ssh/ssh-remote-node-toolchain-probe.ts src/main/ssh/ssh-remote-node-resolution.test.ts src/main/ssh/ssh-remote-node-toolchain-resolution.test.ts src/main/ssh/ssh-relay-native-deps-install.test.ts tests/e2e/helpers/docker-ssh-relay-target.ts tests/e2e/helpers/docker-ssh-relay-processes.ts tests/e2e/ssh-node-toolchain-resolution.spec.ts config/scripts/run-ssh-node-toolchain-resolution-e2e.mjs package.json
  pnpm run check:max-lines-ratchet
  git diff --check
  ```

- Result: PASS
- Duration and resource metrics: typecheck 7.94 s; formatting check 144 ms; other gates under 1 s;
  resource usage not instrumented
- Artifact/log/trace link: local command output
- Oracle proved: Node/CLI/web TypeScript projects compile, touched TypeScript has no oxlint errors,
  all touched files are formatted, no new max-lines bypass exists, and the diff has no whitespace
  errors.
- Does not prove: repository-wide lint completion; see E-M0-LINT-001.
- Checklist items satisfied: Milestone 0 typecheck and max-lines/diff handoff gates.
- Follow-up: resolve or explicitly baseline E-M0-LINT-001 before calling the full lint gate green.

### E-M0-LINT-001 — Repository-wide lint blocked outside Work Package 0

- Date: 2026-07-14
- Commit SHA / PR: `1ef0551bc138724d736583eac788f4183bef07e2` plus uncommitted Work Package 0 changes
- Runner: macOS 26.2 arm64 native; Node v26.0.0 and pnpm 10.24.0
- Remote: not applicable
- Transport/network: local only
- Exact command: `pnpm run lint`
- Result: SUPERSEDED for current PR by E-M0-STATIC-002 after rebasing onto `origin/main`; originally
  FAIL after 4.56 s
- Duration and resource metrics: 4.56 s; resource usage not instrumented
- Artifact/log/trace link: local lint output
- Oracle proved: repository-wide oxlint completed with warnings only, then the type-aware
  switch-exhaustiveness subgate failed at the untouched
  `src/renderer/src/components/tab-bar/TerminalTabLeadingIcon.tsx:31` because `active | inactive`
  cases are unhandled.
- Does not prove: a WP0 lint regression. The failing renderer file is clean in `git status` and is
  outside this work package; touched-file oxlint passes in E-M0-STATIC-001.
- Checklist items satisfied: none; the full `pnpm run lint` checkbox remains open.
- Follow-up: none for WP0. Upstream `main` added the missing cases before this branch rebased; the
  full lint command now passes at `c4259d94f` without an authored renderer change in this PR.

### E-M0-UNIT-002 — Rebased Work Package 0 focused regression suites

- Date: 2026-07-14
- Commit SHA / PR: `c4259d94fccf8d1465280b8e69c22db328710f9e`; draft PR
  [#8724](https://github.com/stablyai/orca/pull/8724)
- Runner: macOS 26.2 arm64 native; Node v26.0.0 and pnpm 10.24.0 (repository requests Node 24)
- Remote: local POSIX fixture and mocked Windows PowerShell command construction; no live SSH remote
- Transport/network: local Vitest only
- Exact command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-remote-node-resolution.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-remote-node-toolchain-resolution.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-native-deps-install.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-versioned-install.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-deploy.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-relay-cross-version-isolation.test.ts
  pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/ssh-remote-platform-detection.test.ts
  ```

- Result: PASS; respectively 32/32, 8/8, 16/16, 26/26, 21/21, 1/1, and 6/6 tests (110 total)
- Duration and resource metrics: respectively 461 ms, 1.73 s, 324 ms, 339 ms, 284 ms, 245 ms, and
  189 ms Vitest duration; 10.52 s aggregate wall time; resource usage not instrumented
- Artifact/log/trace link: local command output and the exact sources in PR #8724
- Oracle proved: the focused resolver/deploy contracts from E-M0-UNIT-001 remain green after rebasing
  onto `9d5173252`, including colocated toolchains, guarded NVM, shell-noise markers, cancellation,
  session-limit classification, and propagation of the selected bin directory to npm install.
- Does not prove: live SSH, live Windows, system SSH, a real `MaxSessions=1` server, or bundled runtime
  behavior.
- Checklist items satisfied: refreshed Milestone 0 focused regression gate on the exact PR commit.
- Follow-up: use E-M0-LIVE-002 for the one claimed live tuple and PR CI for additional runner signal.

### E-M0-STATIC-002 — Rebased Work Package 0 full static and repository lint gates

- Date: 2026-07-14
- Commit SHA / PR: `c4259d94fccf8d1465280b8e69c22db328710f9e`; draft PR
  [#8724](https://github.com/stablyai/orca/pull/8724)
- Runner: macOS 26.2 arm64 native; Node v26.0.0 and pnpm 10.24.0 (repository requests Node 24)
- Remote: not applicable
- Transport/network: local only
- Exact command:

  ```sh
  pnpm run typecheck
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check src/main/ssh/ssh-remote-node-resolution.ts src/main/ssh/ssh-remote-node-toolchain-probe.ts src/main/ssh/ssh-remote-node-resolution.test.ts src/main/ssh/ssh-remote-node-toolchain-resolution.test.ts src/main/ssh/ssh-relay-native-deps-install.test.ts tests/e2e/helpers/docker-ssh-relay-target.ts tests/e2e/helpers/docker-ssh-relay-processes.ts tests/e2e/ssh-node-toolchain-resolution.spec.ts config/scripts/run-ssh-node-toolchain-resolution-e2e.mjs package.json docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md docs/reference/plans/2026-07-14-ssh-relay-github-release-plan.html
  git diff --check
  pnpm run lint
  ```

- Result: PASS; typecheck, 355-entry max-lines ratchet, 12-file formatting check, diff check, and the
  complete repository lint/reliability/localization chain all exited zero
- Duration and resource metrics: typecheck/max-lines/format/diff group 7.39 s; full lint 14.11 s;
  resource usage not instrumented
- Artifact/log/trace link: local command output; exact PR commits
- Oracle proved: the exact rebased PR commit compiles, adds no line-budget bypass, is formatted, has
  no tracked whitespace errors, and passes the full repository lint chain. E-M0-LINT-001 is no
  longer a current blocker; its renderer fix came from upstream `main`, not this PR's authored diff.
- Does not prove: packaged runtime behavior, live SSH, or GitHub-hosted runner behavior.
- Checklist items satisfied: Milestone 0 typecheck, full lint, max-lines, format, and diff gates.
- Follow-up: record the GitHub-hosted `verify` result separately when PR #8724 completes.

### E-M0-LIVE-002 — Rebased Ubuntu 24.04 guarded-NVM relay and PTY reproduction

- Date: 2026-07-14
- Commit SHA / PR: `c4259d94fccf8d1465280b8e69c22db328710f9e`; draft PR
  [#8724](https://github.com/stablyai/orca/pull/8724)
- Runner: macOS 26.2 arm64 native client; Docker 29.2.1; Node v26.0.0; pnpm 10.24.0
- Remote: Ubuntu 24.04 Linux arm64/glibc container,
  `ubuntu@sha256:4fbb8e6a8395de5a7550b33509421a2bafbc0aab6c06ba2cef9ebffbc7092d90`;
  system Node v18.19.1 with no sibling npm; guarded NVM-layout Node v22.22.3/npm 10.9.8
- Transport/network: authenticated built-in SSH2 over Docker loopback; SFTP relay upload; remote
  registry and Node-header egress available for the legacy native dependency install
- Exact command: `pnpm run test:e2e:ssh-node-toolchain-resolution`
- Result: PASS; one purpose-named Playwright test passed
- Duration and resource metrics: test oracle `durationMs=144224`; full build plus E2E 3.2 minutes;
  memory/channel/file counts not instrumented for this narrow legacy resolver proof
- Artifact/log/trace link: local Playwright stdout recorded
  `remote=ubuntu-24.04 architecture=arm64 systemNode=v18.19.1 nvmNode=v22.22.3 npm=10.9.8 selected=nvm relayPty=pass durationMs=144224`
- Oracle proved: the exact rebased app/relay build selects the complete guarded NVM toolchain,
  launches the detached relay with that Node, and round-trips a marker through a real remote PTY.
- Does not prove: Linux x64, musl, Windows, macOS remote, system SSH, `MaxSessions=1`, blocked remote
  egress, fallback behavior, performance budgets, or bundled runtimes.
- Checklist items satisfied: refreshed Milestone 0 exact live #8450 reproduction on the PR commit.
- Follow-up: retain this narrow tuple claim and use later matrix work for all broader coverage.

### E-M0-PR-001 — Independent draft PR boundary

- Date: 2026-07-14
- Commit SHA / PR: plan/checklist `2b67de870120b9a9230cb4464bff39665fa9bb44`; WP0 code
  `c4259d94fccf8d1465280b8e69c22db328710f9e`; draft PR
  [#8724](https://github.com/stablyai/orca/pull/8724)
- Runner: GitHub PR metadata; execution checks still running when recorded
- Remote: not applicable
- Transport/network: authenticated Git push and GitHub API
- Exact command:

  ```sh
  git push -u origin Jinwoo-H/bug-8450-ssh-node-npm-toolchain
  gh pr create --repo stablyai/orca --draft --base main --head Jinwoo-H/bug-8450-ssh-node-npm-toolchain
  gh pr view 8724 --repo stablyai/orca --json number,url,isDraft,state,headRefOid,baseRefOid,mergeStateStatus,statusCheckRollup
  ```

- Result: PASS for the independent review boundary; PR is open and draft with the expected head/base
- Duration and resource metrics: push and PR creation 7.1 s; metadata read 0.8 s
- Artifact/log/trace link: https://github.com/stablyai/orca/pull/8724
- Oracle proved: reviewed planning artifacts and the WP0 resolver correction are separate commits;
  no bundled-runtime distribution implementation is present; GitHub Actions checks were triggered.
- Does not prove: CI success, reviewer approval, mergeability after later base changes, or any bundled
  runtime behavior.
- Checklist items satisfied: Milestone 0 separate commit/PR boundary.
- Follow-up: GitHub-hosted runner/check details were appended as E-M0-CI-001 after completion.

### E-M0-CI-001 — Draft PR full regression and packaged-app checks

- Date: 2026-07-14
- Commit SHA / PR: `94e58d83eabfba30b90e9714e91485ba5e3cf8d7`; draft PR
  [#8724](https://github.com/stablyai/orca/pull/8724)
- Runner: GitHub-hosted native runners:
  - `ubuntu-latest` resolved to x64 `ubuntu-24.04` image `20260705.232.1` for verify and Linux
    golden jobs; runner image provisioner `20260624.560`
  - `macos-15` resolved to arm64 `macos-15-arm64` image `20260706.0213.1` for the macOS golden job;
    runner image provisioner `20260624.560`
- Remote: not applicable; these workflows did not provision or connect to an SSH server
- Transport/network: GitHub Actions checkout/package-network traffic only; no built-in SFTP or
  system-SSH relay transport was exercised
- Exact command:

  ```sh
  gh run watch 29325885071 --repo stablyai/orca --exit-status
  gh pr view 8724 --repo stablyai/orca --json url,state,isDraft,headRefOid,baseRefOid,mergeStateStatus,statusCheckRollup
  gh api repos/stablyai/orca/actions/jobs/87061960266
  gh api repos/stablyai/orca/actions/jobs/87061960006
  gh api repos/stablyai/orca/actions/jobs/87061960091
  gh run view 29325885071 --repo stablyai/orca --job 87061960266 --log
  gh run view 29325884997 --repo stablyai/orca --job 87061960006 --log
  gh run view 29325884997 --repo stablyai/orca --job 87061960091 --log
  ```

- Result: PASS; `verify`, `golden e2e linux experiment`, and `golden e2e mac experiment` all
  completed successfully on the expected PR head
- Duration and resource metrics: verify job 13m13s; Linux golden job 4m23s; macOS golden job 5m57s;
  verify configured a 4 GiB Node heap ceiling but the workflows did not report peak process memory,
  channels, or file counts
- Artifact/log/trace link:
  - verify run/job: https://github.com/stablyai/orca/actions/runs/29325885071/job/87061960266
  - golden Linux job: https://github.com/stablyai/orca/actions/runs/29325884997/job/87061960006
  - golden macOS job: https://github.com/stablyai/orca/actions/runs/29325884997/job/87061960091
- Oracle proved: the PR head passes repository lint, reliability and max-lines gates, typecheck, Git
  2.25 compatibility, full tests, unpacked-app packaging, packaged CLI smoke, and the existing Linux
  and macOS golden Electron suites.
- Does not prove: live SSH, Windows, Linux arm64, musl, system SSH, SFTP bootstrap transfer,
  `MaxSessions=1`, no-egress remotes, full-size runtime transfer, cancellation/resource budgets, or
  any bundled-runtime behavior. E-M0-LIVE-002 remains the only live SSH claim for WP0.
- Checklist items satisfied: Work Package 0 required PR checks, full repository lint, and independent
  CI boundary.
- Follow-up: keep PR #8724 limited to WP0; use separate work-package branches and purpose-built SSH
  workflows for all later tuple claims.

### E-M1-RUNNER-DECISION-001 — GitHub Actions validation topology decision

- Date: 2026-07-14
- Commit SHA / PR: `1ef0551bc138724d736583eac788f4183bef07e2` plus uncommitted planning and Work Package 0 changes
- Runner: documentation decision in the macOS 26.2 arm64 native worktree
- Remote: not applicable; exact native runner labels and representative remotes remain open
- Transport/network: not applicable
- Exact command: no executable runner command applies to the policy decision; both artifacts were
  structurally validated by the exact command recorded in E-M1-ROLLOUT-DECISION-001.
- Result: PASS for recording the user-authorized decision; no runner cell is claimed complete.
- Duration and resource metrics: not applicable to the decision; shared structural validation took
  46 ms.
- Artifact/log/trace link: the Milestone 1 “Validation runner and network topology” section and the
  HTML “GitHub Actions runner policy” callout
- Oracle proved: both planning artifacts name GitHub Actions as the primary orchestrator and define
  when hosted, ephemeral, or self-hosted native execution may fill an evidence cell.
- Does not prove: availability, capacity, permissions, networking, signing access, native execution,
  or any live matrix cell for a concrete runner label.
- Checklist items satisfied: Milestone 1 runner-provider and qualification-policy decisions only.
- Follow-up: inventory exact labels/images and pin representative POSIX/Windows remotes before
  claiming any tuple.

### E-M1-ROLLOUT-DECISION-001 — Per-SSH-target Beta with legacy default

- Date: 2026-07-14
- Commit SHA / PR: `1ef0551bc138724d736583eac788f4183bef07e2` plus uncommitted planning and Work Package 0 changes
- Runner: macOS 26.2 arm64 native; Node v26.0.0 and pnpm 10.24.0
- Remote: not applicable; documentation/content validation only
- Transport/network: local files only
- Exact command:

  ````sh
  node --input-type=module - <<'NODE'
  import fs from 'node:fs'
  import path from 'node:path'
  import { marked } from 'marked'
  import { parse } from 'parse5'
  const started = performance.now()
  const mdFile = 'docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md'
  const htmlFile = 'docs/reference/plans/2026-07-14-ssh-relay-github-release-plan.html'
  const source = fs.readFileSync(mdFile, 'utf8')
  const rendered = marked.parse(source)
  const links = [...source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(match => match[1]).filter(href => !/^(https?:|#)/.test(href))
  for (const href of links) if (!fs.existsSync(path.resolve(path.dirname(mdFile), href))) throw new Error(`Missing link: ${href}`)
  const fences = (source.match(/^```/gm) || []).length
  const open = (source.match(/^- \[ \]/gm) || []).length
  const done = (source.match(/^- \[[xX]\]/gm) || []).length
  if (fences % 2 || !rendered.includes('type="checkbox"')) throw new Error('Invalid Markdown checklist')
  const html = fs.readFileSync(htmlFile, 'utf8')
  const errors = []
  parse(html, { onParseError: error => errors.push(error) })
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  const hrefs = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1])
  if (errors.length || new Set(ids).size !== ids.length || hrefs.some(id => !ids.includes(id))) throw new Error('Invalid HTML plan')
  const requiredMd = ['Per-target Beta rollout decision', 'E-M1-ROLLOUT-DECISION-001', 'missing, malformed,', 'separate reviewed rollout decision']
  const requiredHtml = ['Per-target Beta contract', 'bundled-auto', 'Future default review']
  for (const value of requiredMd) if (!source.includes(value)) throw new Error(`Missing checklist contract: ${value}`)
  for (const value of requiredHtml) if (!html.includes(value)) throw new Error(`Missing HTML contract: ${value}`)
  console.log(JSON.stringify({ result: 'PASS', links: links.length, fences, open, done, htmlIds: ids.length, fragmentLinks: hrefs.length, durationMs: Math.round(performance.now() - started) }))
  NODE
  pnpm exec oxfmt --check docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md docs/reference/plans/2026-07-14-ssh-relay-github-release-plan.html
  git diff --check
  ````

- Result: PASS; `links=1 fences=2 open=393 complete=33 htmlIds=11 fragmentLinks=9` and no
  `git diff --check` findings; both planning artifacts pass `oxfmt --check`.
- Duration and resource metrics: 46 ms for Markdown/HTML parsing; resource usage not instrumented.
- Artifact/log/trace link: this checklist and the linked HTML plan
- Oracle proved: both artifacts record a Beta-tagged per-target opt-in, conservative legacy
  deserialization, next-connection-only application, classified fallback, explicit fail-closed
  recovery, and separate authorization before any default change.
- Does not prove: configuration migration, add/edit UI, Beta badge rendering, live-session
  preservation, telemetry, fallback behavior, or any bundled runtime execution.
- Checklist items satisfied: Milestone 1 rollout-control mechanism and per-target Beta policy
  decisions only; implementation boxes in Milestones 8 and 14 remain open.
- Follow-up: implement and test the target configuration/UI in its reviewable work package after the
  Work Package 0 boundary and remaining Milestone 1 blockers are closed.

### E-M1-BASELINE-001 — Conservative initial runtime eligibility baselines

- Date: 2026-07-14
- Commit SHA / PR: `a84d52dc6`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: macOS 26.2 arm64 native; authoritative Node v24.18.0 release/build metadata fetched over
  HTTPS
- Remote: no SSH remote; local AlmaLinux 8 arm64 container reported glibc 2.28 and
  `libstdc++-8.5.0`
- Transport/network: HTTPS to nodejs.org and raw.githubusercontent.com; local Docker execution only
- Exact command:

  ```sh
  curl -fsSL https://nodejs.org/dist/index.json | jq -r '[.[] | select(.version | startswith("v24."))][0] | {version,date,lts,security,files}'
  curl -fsSL https://raw.githubusercontent.com/nodejs/node/v24.18.0/BUILDING.md | sed -n '65,190p'
  docker run --rm almalinux:8 sh -lc 'uname -m; getconf GNU_LIBC_VERSION; rpm -q libstdc++ glibc'
  ```

- Result: PASS for a decision record. Node v24.18.0 is LTS and publishes official Linux glibc,
  macOS, and Windows archives for x64/arm64. Its supported-platform contract states Linux kernel
  4.18, glibc 2.28, libstdc++ 6.0.25/`GLIBCXX_3.4.25`, macOS 13.5, Windows 10/Server 2016 x64,
  and Windows 10 arm64 minimums. Orca adopts those Linux/macOS floors and stricter Windows floors
  aligned with the declared SSH bootstrap primitives.
- Duration and resource metrics: network reads under 1 s each; local AlmaLinux probe 0.6 s; no
  runtime load or memory metric applies to the policy decision
- Artifact/log/trace link:
  - https://nodejs.org/dist/v24.18.0/
  - https://github.com/nodejs/node/blob/v24.18.0/BUILDING.md#supported-platforms
- Oracle proved: the recorded minimums do not claim compatibility below the upstream official Node
  binary ABI/OS floors, and musl is excluded because Node publishes no official musl archive.
- Does not prove: any Orca runtime archive, native module, SSH primitive, Rosetta behavior, Windows
  host, minimum-kernel VM, or enabled tuple. Every candidate remains disabled pending live evidence.
- Checklist items satisfied: Milestone 1 glibc, libstdc++, kernel, musl, macOS, Windows, and Rosetta
  eligibility decisions.
- Follow-up: encode these floors in the manifest/selector contract and fill every target-native live
  cell before enabling a tuple.

### E-M1-NODE-PROVENANCE-001 — Pinned official Node 24 LTS provenance policy

- Date: 2026-07-14
- Commit SHA / PR: `a84d52dc6`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: macOS 26.2 arm64 native orchestrating an Ubuntu 24.04 arm64 Docker container for GPG
  verification
- Remote: not applicable; provenance inputs were verified locally before any extraction or transfer
- Transport/network: HTTPS to nodejs.org and the Node release-key repository; no SSH
- Exact command:

  ```sh
  curl -fsSL https://nodejs.org/dist/v24.18.0/SHASUMS256.txt | rg 'node-v24\.18\.0-(linux-(x64|arm64)|darwin-(x64|arm64)|win-(x64|arm64))\.(tar\.xz|zip)$'
  docker run --rm ubuntu:24.04 bash -lc 'apt-get update -qq && apt-get install -y -qq ca-certificates curl gpgv >/dev/null && curl -fsSL https://github.com/nodejs/release-keys/raw/refs/heads/main/gpg-only-active-keys/pubring.kbx -o /tmp/nodejs-active.kbx && curl -fsSL https://nodejs.org/dist/v24.18.0/SHASUMS256.txt -o /tmp/SHASUMS256.txt && curl -fsSL https://nodejs.org/dist/v24.18.0/SHASUMS256.txt.sig -o /tmp/SHASUMS256.txt.sig && gpgv --keyring /tmp/nodejs-active.kbx /tmp/SHASUMS256.txt.sig /tmp/SHASUMS256.txt && sha256sum /tmp/SHASUMS256.txt'
  ```

- Result: PASS; detached signature timestamp `2026-06-23T23:07:59Z` verified with active Node release
  key `C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C` (Richard Lau); verified checksum-file SHA-256
  `3927bab574a00ca0560c9583fe19655ba19603a1c5851414e4325d34ac50e469`
- Duration and resource metrics: checksum fetch 0.3 s; clean-container key/signature verification
  11.9 s including package installation; resource usage not instrumented
- Artifact/log/trace link:
  - https://nodejs.org/dist/v24.18.0/SHASUMS256.txt
  - https://nodejs.org/dist/v24.18.0/SHASUMS256.txt.sig
  - https://github.com/nodejs/release-keys
- Oracle proved: the selected six upstream archives exist and their checksum list has a valid
  signature from the active Node release keyring. The policy pins the exact patch and requires a
  new desktop identity for every refresh.
- Does not prove: that future CI pins rather than mutably fetches the keyring, verifies archives,
  preserves native signatures, builds native modules, meets the CVE SLA, or signs Orca artifacts.
  Those remain implementation/release gates.
- Checklist items satisfied: Milestone 1 Node version, provenance, musl-source, update/CVE, refresh
  identity, and upstream-signature decisions.
- Follow-up: vendor a reviewed keyring/input digest into the build contract, implement fail-closed
  verification, and add target-native signing/provenance jobs.

### E-M1-RUNNER-INVENTORY-001 — Native GitHub-hosted runner catalog

- Date: 2026-07-14
- Commit SHA / PR: `a84d52dc6`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: macOS 26.2 arm64 native; GitHub runner-image catalog plus repository workflow inventory
- Remote: not applicable; no SSH target is claimed
- Transport/network: HTTPS to the GitHub runner-image catalog and GitHub Actions logs
- Exact command:

  ```sh
  curl -fsSL https://raw.githubusercontent.com/actions/runner-images/main/README.md | sed -n '/Available Images/,/Beta Images/p'
  rg -n 'runs-on:' .github/workflows
  gh run view 29325885071 --repo stablyai/orca --job 87061960266 --log
  gh run view 29325884997 --repo stablyai/orca --job 87061960091 --log
  ```

- Result: PASS for inventory. The catalog exposes native x64/arm64 Linux, macOS, and Windows labels
  selected above and documents weekly image refresh. PR evidence independently resolved
  `ubuntu-latest` to x64 `ubuntu-24.04` image `20260705.232.1` and `macos-15` to arm64
  `macos-15-arm64` image `20260706.0213.1`.
- Duration and resource metrics: catalog fetch 0.2 s; workflow scan 0.1 s; prior log reads under 3 s;
  hosted capacity is unreserved and queue-dependent rather than a fixed resource guarantee
- Artifact/log/trace link:
  - https://github.com/actions/runner-images#available-images
  - E-M0-CI-001 job links
- Oracle proved: explicit native labels exist for the six client/build architectures and new relay
  workflows can avoid mutable `latest` aliases while recording exact resolved images.
- Does not prove: repository access to paid capacity at a future run, runner availability, SSH
  server reachability, cross-family networking, image stability, or any runtime tuple. No approved
  self-hosted target pool was found or inferred.
- Checklist items satisfied: Milestone 1 runner-label/architecture/image-update/capacity inventory.
- Follow-up: pin representative remote images/snapshots, provision cross-family endpoints, and run
  a minimal native label smoke before assigning any evidence cell.

### E-M1-DECISION-DOC-001 — Baseline/provenance plan-content validation

- Date: 2026-07-14
- Commit SHA / PR: `a84d52dc6`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: macOS 26.2 arm64 native; Node v26.0.0 and pnpm 10.24.0
- Remote: not applicable; documentation/content validation only
- Transport/network: local files only
- Exact command: purpose-built inline Node validation using `marked` and `parse5`, followed by
  `pnpm exec oxfmt --check` for both plan artifacts and `git diff --check`
- Result: PASS; `links=1 fences=2 htmlIds=11 fragmentLinks=9`, no parse/fragment/duplicate-ID,
  formatting, or whitespace findings
- Duration and resource metrics: structural validation 42 ms; formatter check 243 ms; resource
  usage not instrumented
- Artifact/log/trace link: this checklist and the linked HTML plan
- Oracle proved: both artifacts contain the baseline, Node provenance, musl legacy-only, and explicit
  native-runner inventory decisions and remain structurally valid.
- Does not prove: implementation, live compatibility, runner access, SSH transport, signing, or any
  enabled tuple.
- Checklist items satisfied: evidence-backed synchronization of the Milestone 1 decision content in
  both required plan artifacts.
- Follow-up: continue the remaining Milestone 1 gates and keep contract implementation in stacked
  draft PR #8728 with no default behavior change.

## Accepted Gaps

No product gap is accepted merely because it appears in this list. Each entry requires explicit
owner and promotion condition.

| Gap                                            | Current behavior                                                                       | Risk                                          | Owner                              | Promotion/removal condition                                          | Status |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- | ------ |
| Bundled runtime not implemented                | Remote Node/npm installer                                                              | #8450/#1693 failure classes remain            | Unassigned                         | Milestones 1–14                                                      | Open   |
| Bundled support matrix undeclared              | Legacy support only where proven                                                       | Cannot claim tuple coverage                   | Unassigned                         | Baselines and real runners decided                                   | Open   |
| musl Node provenance undecided                 | Legacy eligibility only                                                                | Untrusted/incompatible binary risk            | Unassigned                         | Reviewed runtime source/build                                        | Open   |
| Windows arm64 real runner undecided            | Legacy eligibility only                                                                | Cross-build may hide runtime failure          | Unassigned                         | Native runner and full proof                                         | Open   |
| Linux arm64 real runner undecided              | Existing Docker evidence is not full runtime matrix                                    | Native regression may escape                  | Unassigned                         | Native full-matrix proof                                             | Open   |
| No numeric perf budgets yet                    | Current legacy behavior                                                                | “No regression” is unmeasurable               | Unassigned                         | Baselines and thresholds recorded                                    | Open   |
| Signing/key lifecycle undecided                | GitHub app-release trust only                                                          | Relay-specific supply-chain gap               | Unassigned                         | Milestone 1 trust decisions                                          | Open   |
| Remote bootstrap primitive baselines undecided | Existing transport-specific shell assumptions                                          | Hidden tool dependency or corrupt transfer    | Unassigned                         | Milestone 1 POSIX/Windows decisions and live tests                   | Open   |
| WP0 commit/PR boundary absent                  | Uncommitted, independently scoped worktree diff                                        | Starting WP1 now would mix review packages    | User authorization required        | Separately authorized WP0 commit/PR or equivalent reviewed boundary  | Open   |
| Repository-wide lint failure outside WP0       | Touched-file oxlint passes; full lint stops on untouched renderer exhaustiveness error | Required handoff gate cannot be claimed green | Existing renderer owner unassigned | Fix or explicitly baseline E-M0-LINT-001, then rerun `pnpm run lint` | Open   |

## Final Definition of Done

The project is not complete until every applicable item below is checked with evidence IDs.

- [ ] Milestone 0 legacy safety net is merged and live-proven.
- [ ] All Milestone 1 decisions are closed and reviewed.
- [ ] Artifact/manifest schema and full-runtime identity are implemented and hostile-input tested.
- [ ] Every enabled runtime tuple passes build, native, oldest-baseline, trust, and live SSH proofs.
- [ ] Relay artifacts are immutable prerequisites of every desktop build.
- [ ] Target-native builds, native signing jobs, and the fail-closed aggregate/manifest job pass all
      failure and recovered-draft rehearsals before desktop packaging.
- [ ] Every packaged desktop embeds the exact signed manifest whose bytes are published.
- [ ] Client download/cache/extraction passes online, offline, proxy, integrity, concurrency, and
      resource-failure gates.
- [ ] Every SSH transfer path is bounded, cancellable, no-tar-capable, mode-correct, and full-size
      tested.
- [ ] Remote installation uses full-tree verification and a structured, mode-qualified completion
      record.
- [ ] Declared POSIX/Windows bootstrap primitives, missing-command behavior, BusyBox variants, and
      no-remote-hash-tool behavior are live-proven.
- [ ] The primary path launches with bundled Node and performs no remote npm or HTTP operation.
- [ ] Fallback aborts and joins bundled work, uses separate state, and is race/failure tested.
- [ ] Every integrity/security failure fails closed in `auto` without automatic legacy.
- [ ] The exact online/offline/cache matrix is live-proven.
- [ ] Every relay RPC family, reconnect, reattach, upgrade, downgrade, concurrent-client, and GC
      contract passes through the packaged runtime.
- [ ] Security review, SBOM, provenance, key lifecycle, native signing, CVE ownership, and emergency
      refresh through a new desktop build/embedded manifest are operational; old clients stay pinned.
- [ ] Numeric performance and resource budgets pass on the required matrix.
- [ ] Draft release read-back and public direct-URL behavior pass for exact stable/RC/perf tags.
- [ ] Three consecutive qualifying RCs pass without unexplained fallback or relay regression.
- [ ] Stable soak and rollback criteria pass.
- [ ] Every accepted gap is closed or explicitly retained with owner, fallback, and promotion rule.
- [ ] HTML plan, this checklist, reliability-gate metadata, troubleshooting docs, and PR evidence are
      current.
- [ ] Legacy fallback remains unless a separate reviewed decision authorizes narrowing/removal.

## Next Required Action

Place the implementation/live-proven Milestone 0 diff behind its separately authorized commit/PR
boundary and resolve or explicitly baseline E-M0-LINT-001. Then assign owners and close Milestone
1’s support baseline, remote bootstrap primitives, Node provenance/refresh policy, signing
lifecycle, transfer/resource budgets, and rollout-policy decisions. Do not start a production
default-path change before those decisions are reflected here.
