# SSH Relay GitHub Release Distribution — Living Implementation Checklist

Human-readable tracker:
[SSH Relay Runtime Distribution — Implementation Checklist](./2026-07-14-ssh-relay-github-release-implementation-checklist-summary.md)

This file is the detailed evidence ledger. Use the tracker above for project status and remaining
work; keep exact commands, runner identities, hashes, metrics, and residual gaps here.

Date created: 2026-07-14<br>
Last updated: 2026-07-15<br>
Current phase: Milestone 4 / Work Package 3 Windows compatibility-kind parity prerequisite — **In progress — 2026-07-15, Codex implementation owner**. The disconnected release-DAG and aggregate/read-back byte boundaries are closed locally and on all six native build jobs under E-M4-RELEASE-DAG-LOCAL-001, E-M4-RELEASE-DAG-CI-001, E-M4-AGGREGATE-READBACK-LOCAL-001, and E-M4-AGGREGATE-READBACK-CI-001. Pre-assembly inspection found that target-native Windows build identities use compatibility `kind: "win32"` while the reviewed manifest schema and desktop consistency verifier require `kind: "windows"`. The active package is limited to a RED/GREEN parity correction and exact regressions before canonical manifest/signature-handoff work resumes; it may not publish, connect desktop consumers, use signing credentials, or enable a tuple. Production/default behavior is unchanged, no bundled-runtime path is enabled, and no artifact is published.<br>
Session checkpoint: **In progress — 2026-07-15, Codex implementation owner** — exact-head artifact run [29391666358](https://github.com/stablyai/orca/actions/runs/29391666358) executes aggregate-input and authenticated draft read-back suites under Node 24 on all six target-native build jobs at `87a8e4dc3`; every native build and both Linux supplemental userland jobs pass under E-M4-AGGREGATE-READBACK-CI-001. The run remains red only because Windows arm64 runner build 26200 is not the required build 26100, after archive/tree/Node/PTY/watcher smoke settles in 8,032.7284 ms with 49,922,048-byte RSS. Golden E2E [29391666362](https://github.com/stablyai/orca/actions/runs/29391666362) and PR Checks [29391666360](https://github.com/stablyai/orca/actions/runs/29391666360) are green. Inspection for the next manifest slice exposed the unpublished Windows `win32`/`windows` compatibility-kind and root-`node.exe`/`bin/node.exe` verifier mismatches. The narrow correction is committed at `707a9da23e3955bed6ed00ad3afc24b5ab808243` and passes local RED/GREEN, purpose-named workflow wiring, 36-file/203-test full SSH-relay, type, lint, line-budget, formatting, and diff gates under E-M4-WINDOWS-MANIFEST-PARITY-LOCAL-RED-001 and E-M4-WINDOWS-MANIFEST-PARITY-LOCAL-001; push and exact-head native CI are next. Real Apple/SignPath signing, returned production signatures, Gatekeeper/notarization, Defender/WDAC, missing exact-floor snapshots, protected manifest signing, and native trust remain separately gated. Nothing is published or enabled, and legacy remains the production default.<br>
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
  [#8724](https://github.com/stablyai/orca/pull/8724) is open and CI-green at current PR head
  `9a8f98fd9`; the implementation evidence remains anchored at `94e58d83e`.
- Completed package: Work Package 1's disconnected manifest, content-identity, signature,
  release-asset, and conservative selector contracts are locally and CI-green under E-M2-RED-001,
  E-M2-CONTRACT-001, and E-M2-CI-001. They remain isolated in stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728), which is CI-green at current PR head
  `0c299fe18`; implementation evidence remains anchored at `b9d80a4cb`. No deploy/resolver call site
  is connected and no tuple is enabled.
- Completed Work Package 3 gate: credential-free aggregate-input and authenticated draft read-back
  verification binds each input and returned byte to exact name, size, SHA-256, tuple, content
  identity, source draft, approved HTTPS asset origin, and exact HTTP 200 under
  E-M4-AGGREGATE-READBACK-LOCAL-001 and E-M4-AGGREGATE-READBACK-CI-001.
- Active package: Work Package 3 Windows compatibility-kind parity prerequisite. Correct the
  artifact builder's compatibility discriminator from `win32` to the manifest contract's `windows`,
  prove both Windows tuples and content-identity behavior, and run exact regressions before resuming
  canonical unsigned-manifest/signing-handoff work. No broader Milestone 4 box is checked until the
  corresponding implementation and exact tests exist.
- Completed Work Package 2 gate: target-native Windows source-signature reports from exact-head
  artifact jobs 87267322867 and 87267322870 were independently downloaded and matched to their
  identities and signing-stage reports under E-M3-WINDOWS-SOURCE-SIGNATURE-CI-001. PR Checks
  29388734935 and Golden E2E 29388734914 are green. Exact floors and real native signing/trust remain
  open, so Work Package 2 as a whole is not complete and no tuple is enabled.
- Historical Work Package 2 progression: target-native runtime assembly, archive inspection, executable
  smoke, SBOM, and provenance only. The Windows x64/arm64 artifact candidate and portability
  corrections are implemented through `b6903b220`, with bounded smoke diagnostics in `3aab5aff8`,
  explicit PTY smoke settlement in `ddf28eb8d`, and bounded active-resource diagnostics in
  `6bba90020`, in stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741). Exact-head run
  [29341643555](https://github.com/stablyai/orca/actions/runs/29341643555) proves the bundled Node,
  patched PTY input/resize/exit, and watcher lifecycle complete on x64 in 3,357.413 ms with
  56,905,728-byte RSS and arm64 in 6,593.663 ms with 54,505,472-byte RSS, but each child retains a
  Windows handle until the parent kills it at its 45-second bound. Exact-head run
  [29343816558](https://github.com/stablyai/orca/actions/runs/29343816558) now classifies the resource
  on both native architectures: after all public PTY cleanup and a two-second observation window,
  one `MessagePort` remains alongside only the expected parent stdio `PipeWrap` resources
  (E-M3-WINDOWS-RESOURCE-DIAGNOSTIC-CI-RED-001). The active slice is an exact-source, fail-closed
  correction applied only to the copied node-pty Windows JavaScript inside runtime artifact
  staging; the repository-wide node-pty patch and legacy/default desktop path must remain unchanged.
  That local contract is green at `c04b4f630` under E-M3-WINDOWS-CONPTY-WORKER-LOCAL-001. Exact-head
  run [29345126283](https://github.com/stablyai/orca/actions/runs/29345126283) then passed all six
  native jobs; both Windows architectures shed the `MessagePort` within the two-second observation
  window, exited normally, and uploaded unpublished evidence (E-M3-WINDOWS-CI-001). This package
  may produce test artifacts but must not publish, resolve, transfer, install, launch, or enable
  them.
- Historical evidence progression: the immutable Node v24.18.0 contract, pinned release key, bounded verifier,
  and artifact-only CLI are locally green under E-M3-NODE-RED-001 and E-M3-NODE-PROVENANCE-001.
  E-M3-RUNTIME-LOCAL-001 additionally proves one unpublished Linux arm64 glibc assembly, exact-tree
  archive inspection, deterministic repack, bundled Node 24.18.0 execution, real patched PTY, and
  watcher events. E-M3-STATIC-001 records the current focused, type, lint, format, line-budget, and
  diff gates. The first exact-head native run exposed a macOS `/var` versus `/private/var` watcher
  oracle mismatch under E-M3-CI-RED-001. The corrected exact-head run passed target-native build,
  archive/tree verification, bundled Node, patched PTY, and watcher smoke for Linux x64/arm64 and
  macOS x64/arm64 under E-M3-CI-001. A bounded comparator now rejects incomplete outputs and any
  runtime-tree, archive, identity, SPDX, provenance, type, mode, size, or digest drift after two
  independently verified clean builds; its exact implementation-commit contract and static gates
  are locally green under E-M3-REPRODUCIBILITY-LOCAL-001. Exact-head run
  [29347236627](https://github.com/stablyai/orca/actions/runs/29347236627) passed both Linux cells,
  exposed macOS x64/arm64 runtime identity drift, and failed Windows x64/arm64 while collecting the
  new comparator suite under E-M3-REPRODUCIBILITY-CI-RED-001.
  E-M3-REPRODUCIBILITY-DIAGNOSTIC-LOCAL-001 removes the comparator shebang, checks both new files
  with `node --check` on POSIX and Windows, and reports runtime-tree drift before derived metadata
  drift. E-M3-REPRODUCIBILITY-DIAGNOSTIC-CI-RED-001 proves those diagnostics on all six native
  runners: Linux x64/arm64 remain equal, both macOS builds first differ at `pty.node`, and both
  Windows builds first differ at `conpty_console_list.node`. The bounded correction in
  `a09b02ec4` makes macOS retain a reproducible loadable UUID, applies `/Brepro` only to copied
  Windows artifact source, and requires exclusive caller-owned work paths; `3e433b343` makes the CI
  path canonical across runs. E-M3-REPRODUCIBILITY-LINKER-CI-RED-001 proves both Linux and macOS
  architectures now build, verify, smoke, compare exactly, and upload, but both Windows jobs fail
  closed in contract collection because `ssh-relay-runtime-build.test.mjs` imports a builder with an
  unused Unix shebang. E-M3-REPRODUCIBILITY-BUILDER-PARSER-LOCAL-001 proves the bounded correction at
  exact commit `f864d3fa6`. Exact-head run 29351557922 then parses and builds on all six native
  runners: Linux x64/arm64, macOS x64/arm64, and Windows x64 compare exactly and upload, while
  Windows arm64 fully builds, verifies, and smokes both outputs but fails closed before upload when
  `conpty_console_list.node` differs (E-M3-REPRODUCIBILITY-WINDOWS-ARM64-CI-RED-001). Documentation-
  only exact-head repeat run 29352510414 reproduces the same isolated arm64 drift while all five
  controls compare and upload under E-M3-REPRODUCIBILITY-WINDOWS-ARM64-REPEAT-CI-RED-001. Native
  Windows arm64 equality remains mandatory; oldest-baseline, native-trust, SSH, and musl cells
  remain open. E-M3-WINDOWS-PE-DIAGNOSTIC-LOCAL-001 proves the bounded diagnostic and fail-closed
  workflow ordering locally at exact implementation commit `39ee3451b`; both native Windows cells
  remained required before interpreting or correcting the producer. Exact-head run 29353432240
  keeps x64 and all POSIX controls green, then reports the real arm64 PE hashes/layout/ranges and
  fails without upload under E-M3-WINDOWS-PE-DIAGNOSTIC-CI-RED-001. Because the 128 detailed-range
  cap is exhausted by `.text`, the active diagnostic-only correction adds raw-section labels and a
  bounded summary across all 2,887 ranges before any producer change. Exact-head run 29357355064
  keeps all five controls reproducible and proves both generated x64 option blocks, but the native
  arm64 build fails closed at the new Release-condition verifier before runtime staging under
  E-M3-WINDOWS-MSBUILD-PLATFORM-CASE-CI-RED-001. The runner exposes `Platform=arm64`; the active
  correction accepts only a case-insensitive exact match for the expected architecture and retains
  every option/cardinality check. Exact-head run 29358223742 proves that correction on the real
  arm64 runner, preserves five exact controls, and reaches paired disassembly under
  E-M3-WINDOWS-ARM64-THUNK-DISASSEMBLY-CI-RED-001. The arm64 outputs have 2,879 linker-emitted
  16-byte function thunks whose three control-flow instructions match and whose unreachable fourth
  `udf` instruction differs, plus 68 derived identity bytes. Strict comparison and rejected-output
  no-upload remain intact. The active diagnostic must prove the generated incremental-link state
  before any producer change. No comparator, publication, or production behavior changes.
- Windows input correction: E-M3-WINDOWS-INPUT-GAP-001 proved the official Windows ZIP lacks headers
  and `node.lib`. Both artifacts now require the exact signed headers archive and tuple import
  library as explicit inputs. The schema, signed-checksum verifier, bounded ZIP/header extraction,
  and import-library staging are locally green under E-M3-WINDOWS-INPUT-001; native Windows build
  proof remains active and no implicit `node-gyp` download is allowed.
- Windows PTY-closure correction: E-M3-WINDOWS-CONPTY-GAP-001 proved the candidate omitted the
  `conpty.dll` and `OpenConsole.exe` files required by Orca's production `useConptyDll: true` path
  and therefore exercised a weaker system-ConPTY smoke. E-M3-WINDOWS-LOCAL-002 proves the corrected
  local tree-closure and smoke configuration contracts. E-M3-WINDOWS-CI-001 proves the corrected
  native x64/arm64 closure executes and settles; oldest-baseline and native-trust cells remain open.
- Windows native progression: E-M3-WINDOWS-CI-RED-002 captured and corrected NTFS fixture modes,
  Windows shebang parsing, authenticated-key checkout bytes, and POSIX-only mode assertions. At the
  corrected exact head, E-M3-WINDOWS-CI-RED-003 proves 20 passing and one intentionally skipped test
  on each native architecture, exact input download, and a common fail-closed Git-for-Windows
  `gpgv` drive-letter keyring incompatibility. E-M3-WINDOWS-CI-RED-004 proves that correction with
  21 passing and one intentionally skipped test, signed input acceptance, native compilation, and
  runtime/ZIP assembly on each architecture; both 45-second bundled smoke commands then time out
  without propagating their already bounded child stderr. E-M3-WINDOWS-SMOKE-SETTLEMENT-CI-RED-001
  and E-M3-WINDOWS-SMOKE-SETTLEMENT-CI-RED-002 then proved functional PTY/watcher smoke still did not
  settle after public listener and terminal cleanup. E-M3-WINDOWS-RESOURCE-DIAGNOSTIC-CI-RED-001
  identifies the persistent native resource as one `MessagePort` on both x64 and arm64 after a
  two-second drain window. E-M3-WINDOWS-CI-001 proves the artifact-only correction removes that
  resource before normal exit on both architectures and retains the uploaded bytes. No oldest-
  baseline, native-trust, SSH, reproducibility, or enabled-tuple claim is made.
- Production behavior: unchanged; Orca embeds relay JavaScript and installs `node-pty` plus
  `@parcel/watcher` with remote npm.
- New runtime assets published: none.
- Bundled runtime enabled: no.
- Declared supported bundled tuples: none until the required target-native and two-layer live
  evidence cells are complete.
- Validation orchestration: GitHub Actions is the primary runner and evidence surface under
  E-M1-RUNNER-DECISION-001; exact native labels are recorded, while representative cross-family
  remote targets remain open.
- Rollout control: the Beta-tagged option lives on SSH target add/edit surfaces and is persisted per
  target through existing target configuration. It is off by default for existing, new, imported,
  missing, unknown, and malformed configurations, all of which resolve to legacy. Only an explicit
  per-target opt-in selects bundled-preferred behavior, and implementing the setting does not
  authorize default-on rollout or legacy removal (E-M1-ROLLOUT-DECISION-001).
- Legacy fallback removal: not authorized.
- Next required action: implement and prove the disconnected credential-free release/signing DAG
  failure contract, including timeout, retry exhaustion, absent/denied approval, signing failure,
  incomplete output, and recovered-draft cases. Keep real native-signing credentials, endpoint trust,
  missing exact-floor snapshots, production workflow wiring, publication, desktop consumers, and
  every tuple's enabled state outside this slice.

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
      Windows PowerShell 5.1, and .NET Framework 4.8 as minimum bootstrap primitives. Because the
      manifest has one monotonic `minimumBuild` per tuple, encode 19045 for x64 (which admits Server
      2022 build 20348 and newer) and 26100 for arm64.
      (E-M1-BASELINE-001)
- [x] Treat a Rosetta-translated shell as x64 process architecture, but keep it on legacy until an
      x64 artifact passes a live Rosetta SSH cell. A native arm64 shell selects arm64; detection
      never forces a native-architecture artifact across a translated process boundary.
      (E-M1-BASELINE-001)
- [x] Document current legacy platform families separately from bundled candidates and distinguish a
      code-declared family from a live-evidenced fallback claim. (E-M1-LEGACY-INVENTORY-001)

Decision owner: Codex implementation owner for #8450. Decision authority: conservative
implementation boundary under the user-approved legacy-default Beta rollout. These are minimum
eligibility constraints, not support claims: every candidate remains disabled until its two-layer
live evidence cells pass.

The initial candidate families are Linux glibc x64/arm64, macOS x64/arm64, and Windows x64/arm64.
Linux musl, WSL, Rosetta-translated macOS, and any unlisted OS/architecture remain legacy-only.
Version parsing is exact and fail-conservative; an unknown, missing, older, or conflicting baseline
probe selects legacy rather than guessing a compatible artifact.

| Remote family        | Current legacy path                                                                 | Proposed bundled candidate                           | Live fallback evidence in this project |
| -------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| Linux x64 glibc      | Declared `linux-x64`; coherent remote Node/npm plus remote native npm install       | `linux-x64-glibc`                                    | None yet                               |
| Linux arm64 glibc    | Declared `linux-arm64`; coherent remote Node/npm plus remote native npm install     | `linux-arm64-glibc`                                  | E-M0-LIVE-002 (Ubuntu 24.04 arm64)     |
| Linux x64/arm64 musl | Shares current Linux platform key; compatibility depends on legacy npm/native build | None initially; selector returns legacy              | None                                   |
| macOS x64            | Declared `darwin-x64`; coherent remote Node/npm plus remote native npm install      | `darwin-x64`                                         | None                                   |
| macOS arm64          | Declared `darwin-arm64`; coherent remote Node/npm plus remote native npm install    | `darwin-arm64`                                       | None                                   |
| Windows x64          | Declared `win32-x64`; coherent `node.exe`/`npm.cmd` plus remote native install      | `win32-x64`                                          | None                                   |
| Windows arm64        | Declared `win32-arm64`; coherent `node.exe`/`npm.cmd` plus remote native install    | `win32-arm64`                                        | None                                   |
| WSL/Rosetta/other    | No separate current platform identity; behavior follows detected process family     | No candidate until a separately identified live cell | None                                   |

“Declared” above means the current source accepts the platform and has deterministic unit coverage;
it is not a claim that this project has a passing live SSH fallback cell. Automatic legacy fallback
for a bundled tuple is permitted only where the last column has current evidence for the relevant
family/transport conditions.

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
- [x] Use the explicit native GitHub runner labels below for paired legacy-versus-bundled regression
      measurements in the same job, with local network shaping and at least ten samples per path. If
      three qualifying reruns have over 15% coefficient of variation or disagree on the threshold,
      require an approved dedicated runner; do not weaken the threshold. (E-M1-BUDGET-DECISION-001)

BLOCKED for cross-family live evidence, not for contract-only work: the Codex implementation owner
owns repo-local fixture/workflow definitions, but a repository release administrator must approve an
ephemeral cloud credential/environment or a self-hosted target pool before immutable POSIX and
Windows Layer B snapshots can be named as reachable infrastructure. The unblock record must include
provider, snapshot IDs, credential owner, egress policy, teardown SLA, and cost/capacity owner. Safe
default: no Layer B cell and no bundled tuple is enabled; continue schema/selector and local
same-family test work without secrets.

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

- [x] Define the exact POSIX baseline as POSIX `sh` with builtin `command`/`printf` plus
      byte-preserving `cat`, `mkdir`, `rm`, `mv`, `chmod`, `test`, and `nohup`; no Node, Python,
      Perl, tar, base64, checksum tool, or compiler is permitted. (E-M1-BOOTSTRAP-DECISION-001)
- [x] Define the exact Windows baseline as OpenSSH for Windows 8.1p1, Windows PowerShell 5.1, and
      .NET Framework 4.8 with `FileStream`, `FileMode.CreateNew`, 64 KiB binary reads/writes,
      same-volume `Directory.Move`, ACL-preserving filesystem operations, and the existing detached
      relay launch mechanism. (E-M1-BOOTSTRAP-DECISION-001)
- [x] Capability-probe required semantics with a client-generated nonce and byte fixture, without
      Node or Python, once per authenticated SSH connection. Never persist or share the result
      across hosts or reconnect generations. (E-M1-BOOTSTRAP-DECISION-001)
- [x] Treat missing or semantically incorrect bootstrap primitives as compatibility failure,
      eligible for legacy in `auto` only where that exact legacy family has current evidence.
      (E-M1-BOOTSTRAP-DECISION-001)
- [x] Record no BusyBox-only variant as qualified initially. Ubuntu 24.04 arm64 BusyBox 1.36.1 lacks
      the required `nohup` applet and therefore selects legacy; any BusyBox host must pass the full
      semantic probe with external required commands before it can become a candidate.
      (E-M1-BUSYBOX-001)

#### Bootstrap primitive decision

POSIX system SSH and built-in SSH2 both open a dedicated stdin byte stream for each manifest file.
The remote command creates that file with restrictive permissions and `cat > file`; the client sends
exactly the declared size and closes stdin. The initial semantic probe round-trips a binary fixture
containing NUL, CR, LF, high-bit bytes, and no trailing newline through the same path. Per-file
channels are bounded and become sequential under `MaxSessions=1`. Full staged-tree integrity is
still checked later by transferred bundled Node, not by trusting `cat` or a remote checksum command.

Windows transfer sends raw bytes to a purpose-built PowerShell script that reads
`Console.OpenStandardInput()` into a 64 KiB buffer and writes with `FileStream`. A `CreateNew` lock
file containing an unguessable client token establishes exclusive staging ownership before the
directory is created; every later command verifies that token. The reader rejects early EOF and one
extra byte beyond the declared safe-integer size. It never materializes the file as a string,
JSON/base64 value, or whole-file buffer. Publish uses same-volume rename only after bundled-Node
tree verification and native probes. Probe artifacts and locks are removed on success, failure, or
cancellation; cleanup settlement is part of the timeout oracle.

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
- [x] For Windows native-module builds, authenticate the exact-version `headers.tar.gz` and
      architecture-specific `win-*/node.lib` through that same signed checksum document in addition
      to the tuple ZIP. The official Windows ZIP does not contain either build input; implicit
      `node-gyp` downloads are prohibited. (E-M3-WINDOWS-INPUT-GAP-001)

### Trust and signing

- [x] Use Ed25519 detached signatures through the existing direct `tweetnacl@1.0.3` dependency;
      reject non-64-byte signatures, non-32-byte public keys, unknown algorithms, and unknown keys.
      (E-M1-TRUST-DECISION-001)
- [x] Canonicalize only a fully validated unsigned manifest projection: fixed schema field order,
      tuples sorted by canonical tuple ID, files sorted by portable relative path, safe integers,
      portable ASCII identity/path fields, no optional `undefined`, and UTF-8 `JSON.stringify`
      bytes with no whitespace or trailing newline. Signatures are outside the signed projection.
      (E-M1-TRUST-DECISION-001)
- [x] Generate Ed25519 keys offline, store only the base64-encoded 32-byte seed in a tag-restricted
      `relay-runtime-manifest-signing` GitHub Environment with required reviewers, expose it only to
      the fail-closed aggregate job, pin every action by commit SHA, grant no write permission except
      the separate draft-release upload job, and rely on environment deployment logs for audit.
      (E-M1-TRUST-DECISION-001)
- [x] Define key ID as `sha256:<lowercase hex SHA-256 of the 32-byte Ed25519 public key>`. Embed the
      accepted key set in the desktop. Rotation dual-signs at least two consecutive desktop releases
      and 30 days; old-key removal/revocation and emergency replacement ship only in a new desktop
      build. Old clients and manifests remain pinned with no freshness lookup.
      (E-M1-TRUST-DECISION-001)
- [x] Require embedded manifest tag/channel/version to equal the compiled desktop identity and use
      only that exact release URL. A newer desktop never accepts an older manifest. A user-initiated
      desktop downgrade may use its own embedded older manifest/cache namespace but cannot rewrite a
      newer content-addressed install. (E-M1-TRUST-DECISION-001)
- [x] Use GitHub artifact attestations/keyless OIDC provenance as a supplement, never as a replacement
      for the offline-verifiable embedded Ed25519 manifest signature. (E-M1-TRUST-DECISION-001)
- [x] Preserve valid official Node signatures. Sign every Orca-built macOS executable, `.node`,
      dylib, and `spawn-helper` with the existing Developer ID Application identity before final
      hashes; verify strict codesign and notarized containing-app provenance on a native runner.
      (E-M1-TRUST-DECISION-001)
- [x] Preserve valid upstream Authenticode signatures and send every unsigned Orca-built Windows
      `.exe`, `.dll`, and `.node` through the existing SignPath inner-binary flow before final hashes;
      verify `Get-AuthenticodeSignature` and signer policy on returned bytes.
      (E-M1-TRUST-DECISION-001)
- [x] Define target-native trust environments: clean macOS 13.5 x64/arm64 snapshots with quarantine
      plus Gatekeeper/codesign assessment; Windows Server 2022 x64 and Windows 11 24H2 arm64
      snapshots with current Microsoft Defender signatures; and a disposable Windows 11 24H2 x64
      VM with the release WDAC policy in audit then enforced mode. Record snapshot/policy/signature
      IDs in every run; third-party EDR observations may supplement but not replace these gates.
      (E-M1-ENDPOINT-DECISION-001)

#### Manifest-key operational gate

Decision owner: Codex implementation owner for #8450. Operational owners: repository release
administrators for GitHub Environment/reviewer policy, existing Apple credential owners for macOS,
and existing SignPath organization approvers for Windows. No key or secret is created by this
decision. Runtime publication remains blocked until the protected environment, two test keys,
dual-sign/unknown-key/revocation rehearsals, action-SHA allowlist, and access audit are executable.

The signing job receives canonical unsigned bytes and returns only key ID plus signature. The
aggregate job reconstructs and verifies the signed projection before emitting the final manifest.
The desktop repeats the same validation and rejects duplicates before cryptographic verification.
At least one accepted signature is required, every signature entry must be unique, and a malformed
or unknown extra signature fails closed rather than being ignored. Key compromise cannot alter an
old client's embedded manifest or archive hashes; emergency response stops asset publication and
ships a new desktop build with revised accepted keys.

The trust-environment decision does not imply those snapshots exist in an approved pool. Gatekeeper
tests add a quarantine attribute to the downloaded runtime before assessment and execution. Windows
tests update Defender intelligence, scan the unpacked tree, verify every PE signature, run native
PTY/watcher smoke, then repeat under the enforced WDAC policy. Detection, quarantine, or policy
denial is release-blocking and must retain logs without weakening the security product.

### Operational budgets and rollout policy

- [ ] Record current legacy cold-install and warm-connect baselines on representative networks.
- [x] Set the local verified-runtime cache to 2 GiB, with an atomic LRU that never evicts referenced,
      locked, staging, current-manifest, or running content; retain at least current plus previous
      content per used tuple when they fit. (E-M1-BUDGET-DECISION-001)
- [x] Reject an archive over 100 MiB compressed, 350 MiB expanded, 5,000 entries, 250 MiB for one
      file, a path over 240 UTF-8 bytes, or aggregate metadata arithmetic outside safe integers.
      (E-M1-BUDGET-DECISION-001)
- [x] Set stage ceilings: cache lookup 2 s, connect/DNS availability decision 15 s, download 5 min,
      extraction 2 min, transfer 20 min, remote full-tree verification 3 min, native/smoke probes
      2 min, launch/handshake 30 s, cancellation-and-join 10 s, and total cold bootstrap 30 min.
      (E-M1-BUDGET-DECISION-001)
- [x] Limit incremental transfer/extraction memory to 64 MiB on the desktop and 32 MiB on the remote,
      excluding the launched relay's measured steady-state runtime; no single buffer exceeds 1 MiB.
      (E-M1-BUDGET-DECISION-001)
- [x] Limit SFTP to four in-flight files and four bootstrap channels by default, reduce to one after
      the existing `MaxSessions=1` capability result, and never exceed eight open file handles in
      either process. (E-M1-BUDGET-DECISION-001)
- [x] Require warm-connect p95 to be no more than 100 ms or 10% slower than paired legacy, whichever
      allowance is larger. Cold p95 must not exceed the smaller of the 30-minute hard cap or 115% of
      the measured bytes/throughput lower bound plus five minutes at 1/10/100 Mbps and 50/100/200 ms
      RTT. Offline/connectivity classification completes within 20 s, and legacy starts within 10 s
      after any eligible failure is classified and bundled work is joined. (E-M1-BUDGET-DECISION-001)
- [x] Keep automatic legacy fallback through at least two stable releases and 30 days after any
      separately authorized default-on change. Narrowing fallback or removing legacy requires a
      separate review plus complete matrix, soak, support, and rollback evidence.
      (E-M1-BUDGET-DECISION-001)
- [x] Use existing per-SSH-target configuration for rollout control; do not add a rollout backend.
      This closes the control-mechanism decision, not its implementation.
      (E-M1-ROLLOUT-DECISION-001)
- [x] Define offline/missing-asset behavior: use a verified client cache without GitHub or remote
      egress; otherwise classified offline/404/cache-unavailable errors may use proven legacy in
      Beta `auto`. If legacy prerequisites also fail, return both stage codes and actionable retry,
      update, or disable-Beta guidance without hiding the original error. Integrity failures never
      fallback. (E-M1-BUDGET-DECISION-001)

#### Per-target Beta rollout decision

Decision owner: Codex implementation owner for #8450. Decision authority: worktree owner direction
on 2026-07-14. The purpose is to gather real-host evidence without changing behavior for existing
SSH users or making all of a user's hosts depend on one experimental path.

- [x] Keep `legacy` as the persisted and effective default for every existing and newly added SSH
      target. An absent or unknown configuration value must deserialize conservatively to `legacy`.
      (E-M1-ROLLOUT-DECISION-001)
- [x] Expose the bundled-preferred path as an off-by-default option on SSH target add and edit
      surfaces, using the same Beta-tag treatment as existing Beta features and storing the choice
      per target rather than as a global experiment. (E-M1-ROLLOUT-DECISION-001)
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

**Work Package 1 complete — 2026-07-14, Codex implementation owner:** implemented the pure manifest schema,
canonical unsigned bytes/signature verification, content identity, and fail-conservative
platform/libc selector with hostile-input tests only. No deploy/resolver call site or bundled tuple is
enabled in this package. Local and exact-head draft PR evidence is recorded under E-M2-RED-001,
E-M2-CONTRACT-001, and E-M2-CI-001.

### Manifest schema

- [x] Add a versioned relay artifact schema in `src/main/ssh/ssh-relay-artifact-schema.ts`.
      (E-M2-CONTRACT-001)
- [x] Include schema version, exact Orca build tag, relay protocol version, runtime content ID,
      OS, architecture, libc family/version requirements, minimum OS/kernel requirements, Node
      version, dependency versions, archive name, archive size, expanded size, file count, and
      archive SHA-256. (E-M2-CONTRACT-001)
- [x] Include every runtime file’s relative path, type, size, SHA-256, and required executable mode.
      (E-M2-CONTRACT-001)
- [x] Include signing key ID, signature algorithm/version, creation timestamp, and provenance/SBOM
      references without making wall-clock time part of runtime identity. (E-M2-CONTRACT-001)
- [x] Include target-native code-signing verification attestation, policy/tool identity, and the
      exact attested byte hashes inside the signed manifest. (E-M2-CONTRACT-001)
- [x] Reject duplicate tuple entries, duplicate/case-colliding paths, unsafe Windows names,
      unsupported schema versions, missing required files, extra native platform packages, and
      inconsistent aggregate sizes. (E-M2-CONTRACT-001)
- [x] Define exact archive naming for stable, RC, and perf builds. (E-M2-CONTRACT-001)
- [x] Define exact direct release URL construction. Runtime code must not call the GitHub API or use
      a mutable `latest` URL. (E-M2-CONTRACT-001)

### Content identity

- [x] Compute the content identity from canonical full-runtime metadata and file digests, including
      Node, relay entries, native modules, helper executables, and runtime JavaScript.
      (E-M2-CONTRACT-001)
- [x] Prove changing only Node changes the identity. (E-M2-CONTRACT-001)
- [x] Prove changing only `node-pty` changes the identity. (E-M2-CONTRACT-001)
- [x] Prove changing only `@parcel/watcher` changes the identity. (E-M2-CONTRACT-001)
- [x] Prove changing only `relay-watcher.js` changes the identity. (E-M2-CONTRACT-001)
- [x] Prove mode changes for executable files change the identity or are otherwise authenticated.
      (E-M2-CONTRACT-001)
- [x] Prove metadata that should not affect execution does not create nondeterministic identities.
      (E-M2-CONTRACT-001)
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

**In progress — 2026-07-14, Codex implementation owner:** isolate target-native runtime assembly,
archive inspection, bundled-Node/native-module/PTY/watcher smoke, SBOM, and provenance capabilities
behind purpose-named scripts and CI artifacts. No release publication, desktop resolver, SSH
transfer, install, fallback, rollout setting, or tuple enablement belongs in this package.

**Current active gate — 2026-07-14, Codex implementation owner:** exact-head run 29379227209 and
direct inspection of all six downloaded payloads close the native Linux producer plus glibc
2.28/libstdc++ 6.0.25 userland gates under E-M3-LINUX-NATIVE-USERLAND-CI-001 and the Windows x64
Server 2022 build-20348 gate under E-M3-WINDOWS-X64-BASELINE-CI-001. Exact Linux kernel 4.18,
macOS 13.5, Windows arm64 build 26100, and target-native signing/trust remain open. A newer hosted
runner, static symbol scan, or container may add evidence but cannot silently stand in for an
unavailable qualifying snapshot. Every tuple remains disabled and no production consumer is
connected.

**Active native-trust contract slice — 2026-07-14, Codex implementation owner:** before any
credentialed Apple or SignPath job, derive one exact signing plan from the builder-enforced runtime
identity. The plan must keep the official Node executable immutable, enumerate every native file
that requires platform verification, select no Linux signing targets, select every non-Node macOS
native file for Developer ID signing, and select every non-Node Windows PE file as a SignPath
candidate whose already-valid upstream signature may be preserved. Unknown roles/extensions,
duplicates, missing expected files, or identity/closure drift fail before credentials or signing
side effects. This package is contract/test-only and cannot sign, publish, aggregate, or enable a
tuple. The local contract and all-six actual-identity proof pass under
E-M3-NATIVE-SIGNING-PLAN-LOCAL-001. E-M3-NATIVE-SIGNING-PLAN-CI-RED-001 proves the first exact-head
workflow omitted the new suite despite otherwise healthy builds; explicitly wiring it into both
native job families is implemented at `9c0357235` and locally green under
E-M3-NATIVE-SIGNING-PLAN-WORKFLOW-LOCAL-001. Replacement exact-head proof passes under
E-M3-NATIVE-SIGNING-PLAN-CI-001; the next safe package is credential-free exact signing-stage and
returned-byte verification, without credentials or publication.

**Active signing-stage contract slice — 2026-07-14, Codex implementation owner:** consume the proven
plan to normalize one exact candidate selection before filesystem or signing side effects. macOS
must select every Developer ID target. Windows may preserve an exact source file only when a native
assessment classifies its existing Authenticode signature as valid upstream; it may stage only a
truly unsigned candidate, while invalid, unknown, malformed, missing, duplicate, or extra assessment
states fail closed. Verify every native source file against its identity size/hash before creating an
exclusive payload tree, never stage official Node, preserve portable relative paths, and clean up a
partial stage on failure. A returned tree must contain exactly the staged regular files, no links or
special entries, remain within explicit size/growth bounds, and change every staged source hash.
This slice does not invoke Apple/SignPath, mutate a runtime, accept native trust, publish, aggregate,
or enable a tuple. Implementation commit `c847c4a11` and local proof
E-M3-NATIVE-SIGNING-STAGE-LOCAL-001 close the credential-free contract and workflow-source gates;
exact-head run 29382772805 closes execution on all six native runner families under
E-M3-NATIVE-SIGNING-STAGE-CI-001.

**Active target-native assessment slice — 2026-07-14, Codex implementation owner:** authenticate
every real first-build candidate before and after bounded platform inspection. Linux must create no
payload; macOS must stage exactly three non-Node candidates; Windows must invoke one noninteractive,
30-second/64-KiB-bounded PowerShell Authenticode probe per exact PE path, accept only `NotSigned` or
`Valid`, preserve exact `OpenConsole.exe` and `conpty.dll` bytes only when valid, and stage exactly
the three unsigned Orca-built `.node` files. Candidate paths stay out of PowerShell source, any
hash/status/certificate drift fails closed, stage JSON is retained only as unpublished evidence,
and the temporary payload is removed. Local implementation passes at `1a79e4921` under
E-M3-NATIVE-ASSESSMENT-LOCAL-001; exact-head run 29384042509 closes all six real candidate cells
under E-M3-NATIVE-ASSESSMENT-CI-001.

**Baseline correction — 2026-07-14, Codex implementation owner:**
E-M3-LINUX-BASELINE-LOCAL-RED-001 proves the existing Linux x64 candidate cannot load its patched
`node-pty` on Rocky 8.9/glibc 2.28 because the Ubuntu 24.04 producer emitted references to
`GLIBC_2.32` and `GLIBC_2.34`. This exposes a producer flaw, not permission to weaken the declared
floor. The Linux jobs must compile and smoke native modules inside the digest-pinned oldest
glibc/libstdc++ userland on native x64/arm64 runners, repeat exact clean-build equality and metadata
gates for the new bytes, and retain the exact kernel 4.18 cell as an explicit residual gap. A newer
host build followed by container execution is not qualifying evidence.

**Active sub-gate — 2026-07-14, Codex implementation owner:** exact-head run 29345126283 proves all
six target-native artifact/executable jobs, including normal Windows x64/arm64 settlement and
unpublished upload. E-M3-REPRODUCIBILITY-LOCAL-001 proves the bounded comparator requires two
independently verified clean outputs and exact type/mode/size/SHA-256 equality for the runtime tree,
archive, identity, SPDX, and provenance before uploading only the first output. Exact-head run
29347236627 first exposed native reproducibility and Windows parser failures. Diagnostic run
29348424235 then passed the parser/contracts on all six runners, kept both Linux tuples equal, and
isolated the first native differences to macOS `pty.node` and Windows `conpty_console_list.node`
under E-M3-REPRODUCIBILITY-DIAGNOSTIC-CI-RED-001. Artifact consumers, publication, the
repository-wide node-pty patch, and the legacy/default path remain unchanged.

**Active correction — 2026-07-14, Codex implementation owner:** exact-head run 29351557922 proves
the parser and `/Brepro` correction on both Windows architectures, with complete equality on x64.
Windows arm64 builds, verifies, and smokes both complete outputs but first differs at copied-artifact
`conpty_console_list.node`, so the comparator rejects the cell and uploads neither output under
E-M3-REPRODUCIBILITY-WINDOWS-ARM64-CI-RED-001. The active bounded package adds a test-covered PE
mismatch diagnostic before cleanup: hashes, sizes, coalesced differing byte ranges, and relevant PE
headers only, with bounded reads/output and no failed-binary upload. Exact-head repeat run
29352510414 reproduces the same arm64-only drift while all five controls compare and upload under
E-M3-REPRODUCIBILITY-WINDOWS-ARM64-REPEAT-CI-RED-001. No comparator weakening, post-build
normalization, producer correction, repository-wide node-pty change, tuple enablement, or production
consumer is authorized without the diagnostic evidence. Exact implementation commit `39ee3451b` is
locally green under E-M3-WINDOWS-PE-DIAGNOSTIC-LOCAL-001. Exact-head run 29353432240 proves the x64
control and real arm64 parser, but its 128 detailed ranges are exhausted by `.text`; the active
diagnostic-only correction adds bounded full-scan section totals/samples before any producer change.
Exact implementation commit `cd7f94136` is locally green under
E-M3-WINDOWS-PE-FULL-SCAN-LOCAL-001. Exact-head run 29354676731 then classifies the complete
arm64 drift under E-M3-WINDOWS-PE-FULL-SCAN-CI-RED-001: 2,879 one-byte `.text` differences at
16-byte intervals plus 68 `/Brepro`-derived metadata bytes, with five controls reproducible and
uploaded and no rejected arm64 upload. Exact implementation commit `6546f54d5` applies the native
toolchain's reproducible compiler and linker settings only to the copied node-pty `binding.gyp` and
is locally green under E-M3-WINDOWS-COMPILER-DETERMINISM-LOCAL-001. Exact-head run 29355973362 then
kept five controls reproducible but reproduced the identical Windows arm64 PE drift under
E-M3-WINDOWS-COMPILER-DETERMINISM-CI-RED-001. Exact implementation commit `0d3a0c9d3` now
fail-closed verifies how those settings reach the generated `conpty_console_list.vcxproj` and adds
bounded paired ARM64 disassembly after a mismatch under E-M3-WINDOWS-MSBUILD-DISASSEMBLY-LOCAL-001;
no second producer correction is justified before the target-native evidence. Exact-head run
29357355064 proves both generated option blocks twice on Windows x64 but fails closed on native
Windows arm64 before staging because the Release group lookup does not accept the runner's lowercase
`arm64` platform spelling (E-M3-WINDOWS-MSBUILD-PLATFORM-CASE-CI-RED-001).

Exact-head run 29358223742 then proves that correction on native Windows arm64 and retains all five
reproducible controls. Both arm64 clean builds log the required compiler/linker options, assemble,
verify, and execute, but strict comparison still rejects `conpty_console_list.node` and uploads no
arm64 artifact. The complete PE scan reports 5,826 differing bytes: 5,758 bytes across 2,879
two-byte `.text` ranges exactly 16 bytes apart plus 68 derived COFF/debug/CodeView bytes. Paired
disassembly proves each 16-byte function thunk has byte-identical `adrp x16`, `add x16`, and
`br x16` instructions; only the unreachable fourth instruction changes from `udf #0x24d` to
`udf #0x16d` (E-M3-WINDOWS-ARM64-THUNK-DISASSEMBLY-CI-RED-001).

Exact-head run 29359948742 proves `MSBuild.exe -getProperty:LinkIncremental` returns an empty value
after each native Windows build. The strict parser rejects that value before staging on x64 and
arm64; all four POSIX controls compare exactly and upload, and neither Windows job uploads. This is
valid negative evidence under E-M3-WINDOWS-LINK-INCREMENTAL-CI-RED-001, but an unset evaluated
property does not classify the actual linker command or authorize a producer change.

**In progress — 2026-07-14, Codex implementation owner:** the disproved property oracle is replaced
locally by a bounded, post-build parser for the target's actual MSBuild linker-command tracking
record under E-M3-WINDOWS-LINK-COMMAND-TRACKING-LOCAL-001. The file read is capped at 256 KiB plus
one rejection byte; logs contain only an allowlisted summary of `/INCREMENTAL`, `/GUARD`, `/DEBUG`,
`/OPT`, `/Brepro`, and `/experimental:deterministic` switches; missing, duplicate, oversized,
malformed, or ambiguous inputs fail before staging. The active gate is the exact-head six-cell
native run. Retain the existing architecture, generated-option, strict comparison, and no-upload
gates. Do not normalize bytes, change the producer, modify repository-wide node-pty, or connect a
production consumer.

Exact-head run 29361673339 proves the assumed fixed tracking path is absent on both native Windows
architectures after the target compiles successfully. The active correction must discover
`link.command.1.tlog` candidates under a bounded build-tree entry/depth/cardinality budget, select
exactly one whose bounded decoded record names `conpty_console_list.node`, and retain the existing
strict parser and no-upload boundary. It must not log command contents or authorize a producer
change (E-M3-WINDOWS-LINK-COMMAND-PATH-CI-RED-001).

The bounded discovery correction is locally green under
E-M3-WINDOWS-LINK-COMMAND-DISCOVERY-LOCAL-001: it scans at most 10,000 entries and eight levels,
rejects symbolic links and more than 32 tracking candidates, reads each candidate under the
existing 256 KiB cap, and requires exactly one exact target-output match before strict parsing. The
active gate is now a new exact-head native run; no producer change is authorized locally.

Exact-head run 29362672415 proves both native Windows builds reach the discovery gate after target
compilation but reject because scanning from the entire generated `build` tree encounters unrelated
dependency directories beyond depth eight. All four POSIX controls compare and upload. The active
correction may narrow only the traversal root to `build/Release`, the output tree where both logs
show MSBuild emitted `conpty_console_list.node`; every existing depth, entry, candidate, byte,
encoding, target-cardinality, parser, comparator, and no-upload bound remains unchanged
(E-M3-WINDOWS-LINK-COMMAND-DISCOVERY-CI-RED-001).

The correction now scopes the same bounded discovery to `build/Release` only and is locally green
under E-M3-WINDOWS-LINK-COMMAND-RELEASE-ROOT-LOCAL-001. No budget, parser, producer, comparison,
staging, upload, legacy, or production behavior changed. The active gate is another exact-head
six-cell native run.

Exact-head run 29363423068 proves the scoped discovery on both native Windows runners. Both clean
builds on both architectures select three tracking candidates under 82 Release-tree entries and
report the same allowlisted command summary: `/brepro`, `/debug`, `/experimental:deterministic`,
and `/guard:cf`, with no explicit `/incremental` switch. Windows x64 and all four POSIX controls
compare and upload; Windows arm64 still fails strict comparison at the same 2,879 linker thunks and
uploads nothing (E-M3-WINDOWS-LINK-COMMAND-RELEASE-ROOT-CI-RED-001). Because `/DEBUG` may imply
incremental linking without an explicit command switch, the next bounded diagnostic records only
the exact target `.ilk` file's presence and size from the already bounded clean Release tree before
any copied-artifact producer change.

Exact-head run 29364581781 proves both Windows architectures create a stable target `.ilk` in each
clean build: 4,238,838 bytes on x64 and 4,980,517 bytes on arm64. Microsoft documents that
`/DEBUG` implies `/INCREMENTAL`, incremental linking creates the `.ilk`, and `/INCREMENTAL:NO` is
the explicit override. Five controls compare and upload; arm64 retains the exact thunk drift and
fails before upload (E-M3-WINDOWS-INCREMENTAL-DATABASE-CI-RED-001). This authorizes one narrow
producer correction: add `/INCREMENTAL:NO` only to the copied node-pty Windows linker options,
retain `/guard:cf`, and fail closed unless the generated project and actual command each contain
exactly one disable switch and the clean output tree contains no target `.ilk`.

Exact-head run 29365815434 passes all six target-native jobs. Both Windows architectures propagate
exactly one disable switch in both clean builds, retain `/guard:cf`, report no target `.ilk`, execute
the full bundled runtime smoke, compare every runtime/archive/identity/SBOM/provenance byte exactly,
and upload. Windows arm64 now has one stable content ID and archive digest, closing the native
clean-build reproducibility gap without post-build normalization (E-M3-REPRODUCIBILITY-CI-001).

Exact implementation commit `ec5461aff` replaces workflow-only prohibited-file checks as the
authoritative boundary with an exact builder-enforced per-tuple closure. It pins 34 Linux, 35 macOS,
and 42 Windows files; exact package metadata and dependency versions; exactly one tuple-native
watcher; file roles/modes; runtime metadata; and ordered, non-empty license sections. The local
hostile suite and all six downloaded prior candidate archives pass under
E-M3-RUNTIME-CLOSURE-LOCAL-001. Target-native execution of the new gate remains required before the
related implementation claims are checked.

Each runtime must contain only the executable closure required by the relay.

- [x] Replace or extend `config/scripts/build-relay.mjs` without weakening its existing relay and
      watcher content-hash guarantees. (E-M3-RUNTIME-CLOSURE-CI-001)
- [x] Add a clearly named runtime assembly script, for example
      `config/scripts/build-ssh-relay-runtime.mjs`.
      (E-M3-RUNTIME-LOCAL-001)
- [x] Pin Node and verify downloaded source/binary checksums and upstream signatures.
      (E-M3-NODE-PROVENANCE-001; real archive execution remains a separate per-tuple gate)
- [x] Extend the immutable Node input contract for Windows to include the signed exact-version
      headers archive and tuple-specific `node.lib`; verify/copy them into an exclusive local build
      root and configure `node-gyp` to fail rather than fetch an unstaged input.
      (E-M3-WINDOWS-INPUT-001; successful target-native offline build remains a per-tuple gate)
- [x] Build Orca’s patched `node-pty@1.1.0` against the exact bundled Node runtime.
      (E-M3-RUNTIME-CLOSURE-CI-001)
- [x] Assert Orca-required patched exports/diagnostics exist; do not silently use an upstream
      prebuild that omits the patch. (E-M3-RUNTIME-CLOSURE-CI-001)
- [x] For Windows, copy the tuple-architecture `conpty.dll` and `OpenConsole.exe` from the pinned
      node-pty source into `build/Release/conpty`, hash them into the runtime identity as native
      runtime files, and prove PTY spawn/resize/exit with `useConptyDll: true`. Do not substitute a
      system-ConPTY smoke for the production path. (E-M3-WINDOWS-CONPTY-GAP-001,
      E-M3-WINDOWS-CI-001)
- [x] Include exactly one compatible `@parcel/watcher@2.5.6` native optional package.
      (E-M3-RUNTIME-CLOSURE-CI-001)
- [x] Include relay JavaScript, watcher child, required runtime JavaScript closure, licenses, SBOM,
      provenance, and runtime metadata. (E-M3-RUNTIME-CLOSURE-CI-001, E-M3-METADATA-CI-001)
- [x] Exclude package managers, development dependencies, compilers, sources, caches, build
      directories, and Orca-built debug symbols unless an approved diagnostics requirement needs
      them. Preserve verified official Node executable bytes without stripping or rewriting them,
      even when the upstream binary contains debug metadata. (E-M3-RUNTIME-CLOSURE-CI-001)
- [x] Make POSIX `tar.xz` and Windows ZIP output deterministic for the same tree, epoch, and pinned
      compression toolchain. (E-M3-RUNTIME-LOCAL-001, E-M3-REPRODUCIBILITY-CI-001,
      E-M3-RUNTIME-CLOSURE-CI-001)
- [x] Verify required executable modes before archiving. (E-M3-RUNTIME-LOCAL-001)
- [ ] Sign native code according to the platform decisions in Milestone 1.
- [ ] Verify platform-native signatures/policy on target-native runners after signing and before
      aggregation; attest the exact verified bytes for the signed manifest.
- [x] Run target-native archive inspection and target-runtime smoke before upload for every current
      glibc/macOS/Windows candidate. (E-M3-RUNTIME-LOCAL-001, E-M3-CI-001,
      E-M3-WINDOWS-CI-001)

### Per-tuple build and executable proof

| Runtime tuple     | Build/provenance | Bundled Node | `node-pty` load + real PTY | Watcher events | Oldest baseline | Native trust | Evidence                                            |
| ----------------- | ---------------- | ------------ | -------------------------- | -------------- | --------------- | ------------ | --------------------------------------------------- |
| linux-x64-glibc   | [x]              | [x]          | [x]                        | [x]            | [ ]             | [ ]          | E-M3-LINUX-NATIVE-USERLAND-CI-001; kernel 4.18 open |
| linux-arm64-glibc | [x]              | [x]          | [x]                        | [x]            | [ ]             | [ ]          | E-M3-LINUX-NATIVE-USERLAND-CI-001; kernel 4.18 open |
| linux-x64-musl    | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —                                                   |
| linux-arm64-musl  | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —                                                   |
| darwin-x64        | [x]              | [x]          | [x]                        | [x]            | [ ]             | [ ]          | E-M3-CI-001                                         |
| darwin-arm64      | [x]              | [x]          | [x]                        | [x]            | [ ]             | [ ]          | E-M3-CI-001                                         |
| win32-x64         | [x]              | [x]          | [x]                        | [x]            | [x]             | [ ]          | E-M3-WINDOWS-X64-BASELINE-CI-001                    |
| win32-arm64       | [x]              | [x]          | [x]                        | [x]            | [ ]             | [ ]          | E-M3-WINDOWS-ARM64-BASELINE-CI-RED-001              |

Rules:

- [ ] Real hardware or native virtualized execution is required for release promotion. QEMU or
      cross-compilation may add coverage but cannot fill the evidence column alone.
- [ ] A tuple without a trustworthy runtime source or real runner stays disabled.
- [x] Every current candidate archive executes the exact bundled Node, loads both native
      dependencies, spawns a real PTY, performs input/resize/exit, and observes
      create/modify/rename/delete watcher events. (E-M3-REPRODUCIBILITY-CI-001)
- [x] Every build records compiler/toolchain/container image digests and runner architecture.
      Current jobs use no build container; each hosted runner records its requested label, resolved
      image/version, native architecture, exact tool versions, and executable/code SHA-256 values.
      (E-M3-METADATA-CI-001)

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
- [ ] Prove the add-target control is visibly off, the edit-target control reflects only that
      target's persisted mode, and saving or reconnecting one target cannot change another target.
- [ ] Prove an off, absent, unknown, malformed, existing, or imported setting routes directly through
      the current legacy bootstrap without entering bundled manifest, cache, download, transfer, or
      install work.
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

| Work package              | Scope                                                                                      | Default behavior change     | Status                                                                      | PR/evidence                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------ | --------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 0. #8450 legacy fix       | Coherent Node/npm selection and live repro                                                 | Fixes legacy selection only | Complete and CI-green in draft PR #8724                                     | E-M0-UNIT-002, E-M0-LIVE-002, E-M0-STATIC-002, E-M0-PR-001, E-M0-CI-001 |
| 1. Contract and selectors | Manifest schema, identity, platform/libc selection, hostile inputs                         | None                        | Complete and CI-green in draft PR #8728                                     | `b9d80a4cb`; E-M2-RED-001, E-M2-CONTRACT-001, E-M2-CI-001               |
| 2. Runtime builds         | Per-tuple assembly, native smoke, SBOM/provenance/signing                                  | None                        | Draft PR #8741; native build/source trust green; real signing/trust pending | `be32653a7`; E-M3-METADATA-CI-001, E-M3-WINDOWS-SOURCE-SIGNATURE-CI-001 |
| 3. Release publication    | Prerequisite DAG, embedded manifest, draft upload/read-back gates                          | Asset-only                  | **In progress — 2026-07-15, Codex implementation owner**                    | E-M4-RELEASE-DAG-CI-001; E-M4-AGGREGATE-READBACK-CI-001                 |
| 4. Desktop resolver/cache | Verified download, extraction, cache, offline behavior                                     | None/forced mode only       | Not started                                                                 | —                                                                       |
| 5. Transfer/install       | Bounded transports, structured sentinel, bundled launch behind per-target Beta/forced mode | Per-target opt-in only      | Not started                                                                 | —                                                                       |
| 6. Fallback/diagnostics   | Abort-and-join state machine, mode isolation, reason codes, target-mode configuration/UI   | Per-target Beta only        | Not started                                                                 | —                                                                       |
| 7. Live gates/rollout     | Matrix, security, performance, release promotion                                           | Per-tuple staged            | Not started                                                                 | —                                                                       |

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

### Milestone 3 commands added

- [x] `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-node-release-verification.test.mjs` (E-M3-NODE-RED-001, E-M3-NODE-PROVENANCE-001)
- [x] `node config/scripts/verify-ssh-relay-node-release-inputs.mjs --inputs-directory <verified-input-directory> --archive linux-x64-glibc` (E-M3-NODE-PROVENANCE-001; metadata and archive verification only)
- [x] `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-node-zip-inspection.test.mjs config/scripts/ssh-relay-runtime-zip.test.mjs` (E-M3-WINDOWS-ZIP-RED-001, E-M3-WINDOWS-INPUT-001; synthetic ZIP/input contracts only)
- [x] `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-runtime-windows-tree.test.mjs` (E-M3-WINDOWS-LOCAL-002; structural Windows ConPTY closure only, no execution)
- [x] `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-runtime-pty-smoke.test.mjs` (E-M3-WINDOWS-SMOKE-SETTLEMENT-LOCAL-RED-001, E-M3-WINDOWS-SMOKE-SETTLEMENT-LOCAL-001; native evidence remains pending)
- [x] `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs` (E-M3-WINDOWS-RESOURCE-DIAGNOSTIC-LOCAL-001; native classification pending)
- [x] `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs` (E-M3-WINDOWS-CONPTY-WORKER-LOCAL-RED-001, E-M3-WINDOWS-CONPTY-WORKER-LOCAL-001; native settlement pending)
- [x] `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-runtime-reproducibility.test.mjs config/scripts/ssh-relay-runtime-workflow.test.mjs` (E-M3-REPRODUCIBILITY-LOCAL-001; synthetic comparator/workflow contract only, native execution pending)
- [x] `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-node-pty-build.test.mjs config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs config/scripts/ssh-relay-runtime-build.test.mjs config/scripts/ssh-relay-runtime-workflow.test.mjs` (E-M3-REPRODUCIBILITY-LINKER-LOCAL-001; command/linker/work-path contracts plus local macOS native proof; Windows native equality pending)
- [x] `node --check config/scripts/build-ssh-relay-runtime.mjs && node --check config/scripts/ssh-relay-runtime-build.test.mjs` (E-M3-REPRODUCIBILITY-BUILDER-PARSER-LOCAL-001; exact local parser proof; native Windows remains pending)
- [x] `node config/scripts/verify-ssh-relay-node-release-inputs.mjs --inputs-directory <verified-windows-input-directory> --archive win32-x64` (E-M3-WINDOWS-INPUT-001; signed real Node ZIP, headers, and import library; no Windows execution)
- [x] `node config/scripts/build-ssh-relay-runtime.mjs --tuple linux-arm64-glibc --inputs-directory <verified-input-directory> --output-directory <exclusive-output> --work-directory <exclusive-stable-work> --source-date-epoch <epoch> --git-commit <full-sha>` (E-M3-RUNTIME-LOCAL-001, E-M3-REPRODUCIBILITY-LINKER-LOCAL-001; local native Linux arm64 history plus current stable-work contract)
- [x] `node config/scripts/verify-ssh-relay-runtime.mjs --runtime-directory <runtime-tree> --identity <identity.json> --archive <runtime.tar.xz>` (E-M3-RUNTIME-LOCAL-001; local native Linux arm64 only)
- [x] `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs` (E-M3-RUNTIME-CLOSURE-LOCAL-001; 68 local artifact-contract tests plus static reuse of six prior candidate archives; new target-native builder execution remains pending)
- [x] `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs && pnpm run typecheck && pnpm run lint && pnpm run check:max-lines-ratchet` (E-M3-METADATA-LOCAL-001; 76 local artifact-contract tests, typecheck, full lint, reliability gates, localization gates, and max-lines ratchet; native metadata/toolchain proof remains pending)

### Milestone 4 commands added

- [x] `pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 config/scripts/ssh-relay-runtime-release-stage-gate.test.mjs config/scripts/ssh-relay-runtime-draft-recovery.test.mjs` (E-M4-RELEASE-DAG-LOCAL-RED-001, E-M4-RELEASE-DAG-LOCAL-001; disconnected credential-free stage/recovery contract only)
- [x] `pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 config/scripts/ssh-relay-runtime-release-stage-gate.test.mjs config/scripts/ssh-relay-runtime-draft-recovery.test.mjs config/scripts/ssh-relay-runtime-workflow.test.mjs` (E-M4-RELEASE-DAG-LOCAL-001; static native-job wiring only, no real release/signing execution)
- [x] `pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 config/scripts/ssh-relay-runtime-aggregate-input.test.mjs config/scripts/ssh-relay-runtime-draft-readback.test.mjs` (E-M4-AGGREGATE-READBACK-LOCAL-RED-001, E-M4-AGGREGATE-READBACK-LOCAL-001; local filesystem plus mocked GitHub responses only)
- [x] `pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 config/scripts/ssh-relay-runtime-aggregate-input.test.mjs config/scripts/ssh-relay-runtime-draft-readback.test.mjs config/scripts/ssh-relay-runtime-workflow.test.mjs` (E-M4-AGGREGATE-READBACK-LOCAL-001; static native-job wiring only)
- [x] `pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 config/scripts/ssh-relay-runtime-compatibility.test.mjs` (E-M4-WINDOWS-MANIFEST-PARITY-LOCAL-RED-001, E-M4-WINDOWS-MANIFEST-PARITY-LOCAL-001; exact Windows compatibility discriminator and canonical vector)
- [x] `pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 config/scripts/ssh-relay-runtime-compatibility.test.mjs config/scripts/ssh-relay-runtime-workflow.test.mjs src/main/ssh/ssh-relay-artifact-schema.test.ts` (E-M4-WINDOWS-MANIFEST-PARITY-LOCAL-RED-001, E-M4-WINDOWS-MANIFEST-PARITY-LOCAL-001; build/desktop contract parity and static native-job wiring)

### Commands/scripts that must be added or formally identified

- [x] Manifest/schema/identity/signature/selector unit-test command. (E-M2-CONTRACT-001)
- [x] Per-tuple POSIX runtime assembly command. (E-M3-RUNTIME-LOCAL-001; Windows command remains open)
- [x] Per-tuple POSIX archive inspection and native smoke command. (E-M3-RUNTIME-LOCAL-001; Windows command remains open)
- [ ] Embedded-manifest extraction/comparison command for every packaged app.
- [ ] Draft release relay-asset completeness/read-back command.
- [ ] Live release-DAG failure rehearsal covering native signing, aggregate, timeout/retry/manual
      approval, and recovered draft behavior. The disconnected contract is implemented under
      E-M4-RELEASE-DAG-LOCAL-001; real workflow/service evidence remains open.
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

### E-M1-LEGACY-INVENTORY-001 — Current legacy families versus bundled candidates

- Date: 2026-07-14
- Commit SHA / PR: `5c37e8efe`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: macOS 26.2 arm64 native; Vitest Node environment
- Remote: none; source-declared platform identities and deterministic tests only
- Transport/network: local files only
- Exact command:
  `pnpm exec vitest run --config config/vitest.config.ts src/main/ssh/relay-protocol.test.ts src/main/ssh/ssh-remote-platform-detection.test.ts`
- Result: PASS; 35/35 tests across two files, including Linux/macOS/Windows x64/arm64 parsing and
  conservative unsupported-platform rejection
- Duration and resource metrics: 253 ms; memory, channels, and files not instrumented
- Artifact/log/trace link: local Vitest stdout; current `RelayPlatform` source and the living table
- Oracle proved: current source has six deterministic legacy platform identities and rejects unknown
  OS/architectures; the plan now separates those identities from libc-aware bundled candidates and
  from live fallback claims.
- Does not prove: a live SSH connection, native npm install, PTY/watcher health, libc compatibility,
  or fallback on any family. E-M0-LIVE-002 remains the only live legacy evidence in this project.
- Checklist items satisfied: Milestone 1 legacy-versus-bundled family inventory.
- Follow-up: fill current legacy E2E cells before allowing automatic fallback for each corresponding
  bundled tuple.

### E-M1-BOOTSTRAP-DECISION-001 — No-Node POSIX and bounded Windows primitive contract

- Date: 2026-07-14
- Commit SHA / PR: `5c37e8efe`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: macOS 26.2 arm64 native; Docker Desktop native arm64 Linux containers
- Remote: local Ubuntu 24.04, Debian 12/bookworm-slim, and AlmaLinux 8 arm64 containers; no SSH
  daemon, Windows host, or BusyBox image
- Transport/network: Docker stdin/stdout only; the fixture exercised the proposed raw per-file
  stream but not an authenticated SSH channel
- Exact command: inline Node harness spawned each image with `docker run --rm -i ... sh -c`, sent a
  ten-byte fixture containing NUL/CR/LF/high-bit bytes, and required exact output after
  `mkdir`/`cat`/`chmod`/`mv`/`test`/`nohup`/`rm`
- Result: PASS; exact ten-byte round trip on Ubuntu 24.04, Debian bookworm-slim, and AlmaLinux 8
- Duration and resource metrics: Ubuntu 4,384 ms, Debian 569 ms, AlmaLinux 506 ms including container
  startup; one stdin/stdout stream; peak memory and open-file counts not instrumented
- Artifact/log/trace link: local harness stdout recorded in the implementation session
- Oracle proved: the declared POSIX command subset can preserve the binary fixture without Node,
  Python, Perl, tar, base64, or checksum tools on three glibc userlands.
- Does not prove: SSH framing, cancellation, short/extra input rejection, concurrency,
  `MaxSessions=1`, BusyBox, Windows PowerShell/.NET, exclusive lock races, full-size transfer, or
  complete-tree verification.
- Checklist items satisfied: Milestone 1 POSIX/Windows primitive, per-connection probe, and
  compatibility-failure decisions only. Windows is a specified contract, not executable evidence.
- Follow-up: turn this into purpose-named unit/live tests, add BusyBox and bounded Windows binary
  transfer, and do not enable any tuple from this local semantic probe.

### E-M1-BUSYBOX-001 — BusyBox-only primitive baseline fails closed

- Date: 2026-07-14
- Commit SHA / PR: `5c37e8efe`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: macOS 26.2 arm64 native; Ubuntu 24.04 arm64 Docker container
- Remote: BusyBox v1.36.1, Ubuntu package `1:1.36.1-6ubuntu3.1`; no SSH daemon
- Transport/network: Docker stdin and Ubuntu package mirror; no SSH
- Exact command: install BusyBox, enumerate applets, install its applet symlinks into an isolated
  `PATH`, then run the declared `sh`/`cat`/`mkdir`/`rm`/`mv`/`chmod`/`test`/`nohup` semantic probe
- Result: PASS for fail-conservative classification; the probe exited 127 because this BusyBox build
  provides all declared applets except `nohup`, so it is ineligible and must select legacy
- Duration and resource metrics: 4.6 s including package installation; one container/process stream;
  peak memory not instrumented
- Artifact/log/trace link: local stdout recorded
  `BusyBox v1.36.1 (Ubuntu 1:1.36.1-6ubuntu3.1) multi-call binary`; applet inventory omitted `nohup`
- Oracle proved: the selector cannot infer compatibility from “BusyBox 1.36.1” alone and the exact
  declared primitive probe rejects this variant rather than attempting a partial bundled install.
- Does not prove: Alpine's BusyBox build, BusyBox plus an external `nohup`, SSH behavior, or any
  passing BusyBox tuple. No BusyBox bundled support is claimed.
- Checklist items satisfied: Milestone 1 initial BusyBox variant record and deterministic disable
  rule.
- Follow-up: add this missing-`nohup` case to the committed selector/primitive suite and retain
  legacy unless a complete BusyBox environment passes live SSH evidence.

### E-M1-BUDGET-DECISION-001 — Fail-closed resource, timeout, and rollout budgets

- Date: 2026-07-14
- Commit SHA / PR: `5c37e8efe`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: documentation decision in the macOS 26.2 arm64 native worktree
- Remote: not applicable; measured legacy and bundled baselines remain open
- Transport/network: not applicable; the decision defines later 1/10/100 Mbps and 50/100/200 ms
  shaped tests
- Exact command: plan/checklist content validation plus arithmetic review of every byte/count/time
  ceiling; no runtime benchmark is represented by this entry
- Result: PASS for recording release-blocking upper bounds and paired comparison rules; no
  performance gate is claimed passed
- Duration and resource metrics: decision/content validation only; runtime metrics intentionally
  absent until the baseline harness is implemented
- Artifact/log/trace link: “Operational budgets and rollout policy” in this checklist and “Hard
  resource and latency budgets” in the HTML plan
- Oracle proved: implementation now has explicit rejection, cache, memory, concurrency, timeout,
  cancellation, warm/cold latency, fallback-delay, and legacy-retention thresholds to test against.
- Does not prove: that the limits fit the final full-size archive, that either implementation stays
  below them, hosted-runner stability, or any baseline/regression result. Those boxes remain open.
- Checklist items satisfied: Milestone 1 cache/archive/time/memory/channel/latency/fallback-duration,
  paired-runner-method, and offline/missing-asset policy decisions.
- Follow-up: measure legacy first, instrument file/channel/memory/cancellation metrics, and revise
  both plan files before implementation only if evidence proves a limit infeasible.

### E-M1-TRUST-DECISION-001 — Manifest and native-signing trust policy

- Date: 2026-07-14
- Commit SHA / PR: `5c37e8efe`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: macOS 26.2 arm64 native for local Ed25519 probe; historical native Windows Server 2022 x64
  GitHub-hosted signing rehearsal jobs
- Remote: not applicable; no SSH transfer or target-native execution of a relay artifact
- Transport/network: local `tweetnacl` sign/verify plus GitHub Actions/SignPath artifact round trips
- Exact command:

  ```sh
  rg -n 'tweetnacl|CSC_LINK|APPLE_ID|SIGNPATH|SignPath|Get-AuthenticodeSignature' package.json .github/workflows config
  node --input-type=module <inline-tweetnacl-sign-mutate-verify-harness>
  gh run view 28987534795 --repo stablyai/orca --json status,conclusion,createdAt,updatedAt,url,jobs
  gh run view 28988432001 --repo stablyai/orca --json status,conclusion,createdAt,updatedAt,url,jobs
  ```

- Result: PASS for technical feasibility and existing Windows signing evidence. The local probe made
  and verified a 64-byte Ed25519 signature with `tweetnacl`, derived the SHA-256 public-key ID, and
  rejected a changed payload. SignPath test-policy run `28987534795` and release-policy run
  `28988432001` both signed/restored inner PE files, rebuilt/signed the installer, and passed
  end-to-end signature verification.
- Duration and resource metrics: local Ed25519 probe under 0.1 s; test SignPath job 10m7s; production
  SignPath rehearsal 17m24s; signing memory not instrumented
- Artifact/log/trace link:
  - https://github.com/stablyai/orca/actions/runs/28987534795/job/86019904578
  - https://github.com/stablyai/orca/actions/runs/28988432001/job/86022677749
- Oracle proved: the chosen signature primitive works through an already packaged dependency, and
  the repository's existing Windows release machinery can return signed inner native bytes before
  final packaging/hashing.
- Does not prove: canonical serializer implementation, protected manifest environment/secret,
  dual-key rotation, revocation, action-SHA pinning, artifact attestations, macOS relay-native
  signing/notarization, key custody, WDAC/Gatekeeper/AV, or any signed relay runtime. Those remain
  release-blocking implementation/operational gates.
- Checklist items satisfied: Milestone 1 algorithm, canonical-byte, key-custody policy, rotation,
  anti-rollback, keyless-provenance, and native macOS/Windows signing decisions only.
- Follow-up: implement hostile-input/canonical/signature tests without real secrets, then provision
  and rehearse the protected environment before any release workflow can sign a manifest.

### E-M1-ENDPOINT-DECISION-001 — Native trust validation environment contract

- Date: 2026-07-14
- Commit SHA / PR: `5c37e8efe`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: documentation decision in the macOS 26.2 arm64 native worktree
- Remote: no approved macOS 13.5, Windows Server 2022/Windows 11 arm64, or WDAC-enforced snapshot was
  executed
- Transport/network: not applicable
- Exact command: repository signing-workflow inspection plus synchronized checklist/HTML content
  validation; no endpoint-protection command is represented by this decision entry
- Result: PASS for defining exact target-native environments and fail-closed outcomes; all execution
  gates remain open
- Duration and resource metrics: decision/content validation only
- Artifact/log/trace link: Milestone 1 trust section and HTML “OS-native trust controls” risk
- Oracle proved: future Gatekeeper/Defender/WDAC evidence has concrete OS/architecture, quarantine,
  policy mode, identity logging, and release-blocking requirements.
- Does not prove: snapshot/provider availability, policy ownership, actual signature acceptance,
  antivirus behavior, native loading, PTY/watcher smoke, or any endpoint-protection pass.
- Checklist items satisfied: Milestone 1 endpoint-protection environment decision only.
- Follow-up: provision or approve the snapshot pool and keep every affected tuple disabled until the
  target-native runs pass.

### E-M1-DECISION-DOC-002 — Remaining Milestone 1 plan-content validation

- Date: 2026-07-14
- Commit SHA / PR: `5c37e8efe`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: macOS 26.2 arm64 native; Node v26.0.0 and pnpm 10.24.0
- Remote: not applicable; documentation/content validation only
- Transport/network: local files only
- Exact command: purpose-built inline Node validation using `marked` and `parse5`, required-content
  assertions for all newly recorded Milestone 1 decisions, `pnpm exec oxfmt --check` on both
  artifacts, and `git diff --check`
- Result: PASS; `links=1 fences=2 htmlIds=11 fragmentLinks=9`, no
  parse/fragment/duplicate-ID/content/format/whitespace findings
- Duration and resource metrics: structural validation 42 ms; formatter check 253 ms; resource
  usage not instrumented
- Artifact/log/trace link: this checklist and the linked HTML plan
- Oracle proved: both artifacts contain synchronized legacy-family, bootstrap, BusyBox,
  offline/fallback, numeric-budget, manifest-trust, native-signing, and endpoint-environment decisions
  and remain structurally valid.
- Does not prove: implementation, measured budget compliance, key provisioning, native trust, live
  transfer, or any enabled tuple.
- Checklist items satisfied: evidence-backed synchronization of the remaining safely decidable
  Milestone 1 policy content.
- Follow-up: keep unresolved remote-pool and measured-baseline gates open while contract-only work
  proceeds without secrets or a runtime behavior switch.

### E-M2-RED-001 — Missing contract modules and canonical-vector red baseline

- Date: 2026-07-14
- Commit SHA / PR: `959bc05caca7e5ccb4c69b47c1bf6f5b47671c57` plus uncommitted Work
  Package 1 tests; stacked draft PR [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: macOS 26.2 arm64 native; Node v26.0.0 and pnpm 10.24.0
- Remote: not applicable; pure local contract tests
- Transport/network: local Vitest only; no SSH or GitHub request
- Exact command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    src/main/ssh/ssh-relay-artifact-schema.test.ts \
    src/main/ssh/ssh-relay-runtime-identity.test.ts \
    src/main/ssh/ssh-relay-manifest-signature.test.ts \
    src/main/ssh/ssh-relay-release-asset.test.ts \
    src/main/ssh/ssh-relay-artifact-selector.test.ts
  ```

- Result: FAIL as the intended executable red baseline: signature and selector suites failed to
  import because their production modules did not exist; the identity vector still contained its
  explicit replacement marker; and one native-package fixture reached the undeclared-parent guard
  before the intended native-package guard. Four files failed, one passed, with 35 tests executed
  (33 passed and 2 failed) plus two import-failed suites.
- Duration and resource metrics: 292 ms Vitest duration; no runtime-transfer resources apply.
- Artifact/log/trace link: local command output retained in the implementation session; test paths
  above are the durable repro.
- Oracle proved: the new tests were discriminating before the missing signature/selector modules and
  canonical vector were implemented, and the native-package fixture needed to preserve tree
  consistency to reach its intended oracle.
- Does not prove: behavior before all schema/identity files existed, live SSH, a real archive,
  cryptographic key custody, target-native execution, or any production-path failure.
- Checklist items satisfied: red half of the Work Package 1 contract-test gate only.
- Follow-up: implemented and superseded for green behavior by E-M2-CONTRACT-001; retained as red
  history.

### E-M2-CONTRACT-001 — Manifest, identity, signature, URL, and selector contracts

- Date: 2026-07-14
- Commit SHA / PR: `b9d80a4cbca43c344a3a5fbdc669fa97c7527da0`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728); PR CI evidence pending
- Runner: macOS 26.2 arm64 native; Node v26.0.0 and pnpm 10.24.0 (repository requests Node 24)
- Remote: not applicable; pure local schema, cryptography, identity, release-name, and selection tests
- Transport/network: local Vitest/static tools only; no SSH, release download, or GitHub API call
- Exact command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    src/main/ssh/ssh-relay-artifact-schema.test.ts \
    src/main/ssh/ssh-relay-runtime-identity.test.ts \
    src/main/ssh/ssh-relay-manifest-signature.test.ts \
    src/main/ssh/ssh-relay-release-asset.test.ts \
    src/main/ssh/ssh-relay-artifact-selector.test.ts
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    src/main/ssh/ssh-relay-artifact-consistency.ts \
    src/main/ssh/ssh-relay-artifact-path-policy.ts \
    src/main/ssh/ssh-relay-artifact-schema.ts \
    src/main/ssh/ssh-relay-artifact-selector.ts \
    src/main/ssh/ssh-relay-manifest-signature.ts \
    src/main/ssh/ssh-relay-release-asset.ts \
    src/main/ssh/ssh-relay-runtime-identity.ts \
    src/main/ssh/ssh-relay-artifact-schema.test.ts \
    src/main/ssh/ssh-relay-artifact-selector.test.ts \
    src/main/ssh/ssh-relay-manifest-signature.test.ts \
    src/main/ssh/ssh-relay-release-asset.test.ts \
    src/main/ssh/ssh-relay-runtime-identity.test.ts \
    src/main/ssh/ssh-relay-artifact-test-manifest.ts \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --cached --check
  ```

- Result: PASS locally. Five suites passed with 68/68 tests; Node/CLI/web typecheck passed; the full
  repository lint/reliability/localization chain exited zero with pre-existing warnings only; the
  355-entry max-lines ratchet reported no new bypass; touched-file formatting and tracked diff checks
  passed.
- Duration and resource metrics: final Vitest duration 540 ms (1.33 s wall); typecheck 3.91 s; full
  lint 23.62 s; formatting check 874 ms; max-lines and diff checks under 1 s. Runtime memory,
  channels, handles, files, and cancellation do not apply to this disconnected pure contract layer
  and were not instrumented.
- Artifact/log/trace link: local command output; canonical runtime identity vector
  `sha256:5afe9c8094ec61a5eec6f7be6d1035faacee7362871985c74cc6ee6aceea8677`; canonical
  unsigned-manifest byte hash `e78bf4416628a91055035dc7926035cbf633f29d3618be34e041c6dc5e0794fb`;
  draft PR #8728
- Oracle proved: strict versioned parsing; bounded sizes/counts; portable path and special-entry
  rejection; required runtime closure and executable Node mode; tuple/archive/attestation
  cross-consistency; stable content identity; exact stable/RC/perf tag and direct-URL rules; initial
  and dual Ed25519 signing with canonical unsigned bytes; unknown/malformed/duplicate/mismatched
  key failure; conservative Linux glibc/musl, macOS, Windows-bootstrap, translated-process, unknown,
  old, unavailable, and ambiguous selection.
- Does not prove: Node 24 execution, real archive parsing/extraction, local cache/download, target
  probes, SSH/SFTP/system-SSH transfer, runtime build/native loading, signing environment custody,
  release publication, fallback state, UI rollout, performance, or any live matrix cell. No module
  is connected to a production call site and no tuple is enabled.
- Checklist items satisfied: Milestone 2 manifest-schema, signed-content, content-identity,
  release-name/URL, schema-level hostile path/type, and pure selector contract items explicitly
  marked above; verification command inventory entry.
- Follow-up: push and record the exact GitHub Actions result, then begin Work Package 2 target-native
  runtime assembly without production consumption.

### E-M2-CI-001 — Work Package 1 full PR verification and packaging gate

- Date: 2026-07-14
- Commit SHA / PR: exact checked head `6732d911a8e81ad071925e68d3a60fec2e3e452a`, containing
  implementation commit `b9d80a4cbca43c344a3a5fbdc669fa97c7527da0`; stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728)
- Runner: GitHub-hosted native x64 `ubuntu-latest`, resolved to Ubuntu 24.04 image
  `20260705.232.1`; image provisioner `20260624.560`; runner `2.335.1`; Node v24.18.0
- Remote: not applicable; the workflow provisioned no SSH server and exercised no remote tuple
- Transport/network: GitHub Actions checkout/package traffic only; no SSH/SFTP/system-SSH runtime
  transfer
- Exact command:

  ```sh
  gh run watch 29329963564 --repo stablyai/orca --exit-status
  gh pr view 8728 --repo stablyai/orca \
    --json url,isDraft,state,headRefOid,baseRefOid,mergeStateStatus,statusCheckRollup
  gh api repos/stablyai/orca/actions/jobs/87075275741
  gh run view 29329963564 --repo stablyai/orca --job 87075275741 --log
  ```

- Result: PASS. The `verify` job completed successfully on the exact PR head; repository lint,
  reliability gates, max-lines, typecheck, Git 2.25 compatibility, 2,803 passing test files with
  29,695 passing tests, unpacked Linux app packaging, packaged daemon load, and packaged CLI smoke
  all passed. Nine test files and 55 tests were intentionally skipped by the existing suite.
- Duration and resource metrics: 11m52s from `2026-07-14T11:44:44Z` to
  `2026-07-14T11:56:36Z`; the workflow did not report peak memory, channel, handle, or file counts.
- Artifact/log/trace link:
  https://github.com/stablyai/orca/actions/runs/29329963564/job/87075275741
- Oracle proved: Work Package 1 compiles and passes the repository's full PR regression/package gate
  under the pinned Node 24 runtime on a native Linux x64 runner; PR #8728 is draft, open, and reports
  a clean merge state at the checked head.
- Does not prove: live SSH, Linux arm64, macOS, Windows, musl, archive assembly/extraction, native
  runtime execution, signing, release assets, download/cache, transfer/install, fallback, UI,
  performance budgets, or any enabled tuple. The existing relay build exercised by packaging remains
  the legacy JavaScript build, not a self-contained runtime artifact.
- Checklist items satisfied: Work Package 1 exact-head PR CI gate only; no live matrix or runtime
  tuple cell.
- Follow-up: keep PR #8728 draft and isolated; begin Work Package 2 on a new stacked branch with no
  production consumer.

### E-M3-NODE-RED-001 — Node release verifier red gate

- Date: 2026-07-14
- Commit SHA / PR: `0c299fe189310b6dbd539f0f0f506b240524ba6a` plus uncommitted Work Package 2 test; no Work Package 2 PR yet
- Runner: macOS 26.2 arm64 native; Node v26.0.0 and pnpm 10.24.0
- Remote: not applicable; local test discovery only
- Transport/network: none
- Exact command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs
  ```

- Result: expected FAIL before implementation. Vitest could not import the intentionally missing
  `config/scripts/ssh-relay-node-release-verification.mjs`; one suite failed before collecting tests.
- Duration and resource metrics: 136 ms Vitest duration; archive/runtime resources do not apply.
- Artifact/log/trace link: durable test path above; local command output retained in the
  implementation session.
- Oracle proved: the focused suite was discriminating before the verifier facade and domain modules
  existed.
- Does not prove: any validation behavior, cryptographic verification, downloaded byte, archive,
  extraction, runtime execution, SSH behavior, or platform tuple.
- Checklist items satisfied: red half of the Milestone 3 Node provenance implementation gate only.
- Follow-up: green implementation and real release-input proof are recorded in
  E-M3-NODE-PROVENANCE-001.

### E-M3-NODE-PROVENANCE-001 — Pinned Node metadata and archive verification

- Date: 2026-07-14
- Commit SHA / PR: implementation commit `f2b387b21bbe6a3863ff1a492a1a03b65e0a0477` in stacked
  draft PR [#8741](https://github.com/stablyai/orca/pull/8741); native PR CI pending
- Runner: focused tests on macOS 26.2 arm64 with Node v26.0.0/pnpm 10.24.0; real proof in
  Docker Engine 29.2.1 on Linux/arm64 using `node:24-bookworm` resolved to
  `node@sha256:032e78d7e54e352129831743737e3a83171d9cc5b5896f411649c597ce0b11ea`,
  Node v24.17.0, and GnuPG/gpgv 2.2.40
- Remote: not applicable; local container build-input verification only
- Transport/network: HTTPS downloads from exact `https://nodejs.org/dist/v24.18.0/` URLs; Debian
  package mirrors supplied `ca-certificates`, `curl`, `gnupg`, and `gpgv`; no SSH transport
- Exact command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs

  docker run --rm -v "$PWD:/workspace:ro" -w /workspace node:24-bookworm \
    bash -lc 'set -euo pipefail
      apt-get update -qq
      DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ca-certificates curl gnupg gpgv >/dev/null
      mkdir -p /tmp/node-inputs
      curl --fail --silent --show-error --location --proto "=https" --tlsv1.2 https://nodejs.org/dist/v24.18.0/SHASUMS256.txt --output /tmp/node-inputs/SHASUMS256.txt
      curl --fail --silent --show-error --location --proto "=https" --tlsv1.2 https://nodejs.org/dist/v24.18.0/SHASUMS256.txt.sig --output /tmp/node-inputs/SHASUMS256.txt.sig
      curl --fail --silent --show-error --location --proto "=https" --tlsv1.2 https://nodejs.org/dist/v24.18.0/node-v24.18.0-linux-x64.tar.xz --output /tmp/node-inputs/node-v24.18.0-linux-x64.tar.xz
      node config/scripts/verify-ssh-relay-node-release-inputs.mjs --inputs-directory /tmp/node-inputs --archive linux-x64-glibc'
  ```

- Result: PASS. Seven focused tests passed. The real verifier accepted the pinned release-key hash
  `84b1ca614406f341cb86e72920f5a64687a13ab67ab84038bcf2abba97898a84`, exact signer
  `C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C`, authenticated checksum-document hash
  `3927bab574a00ca0560c9583fe19655ba19603a1c5851414e4325d34ac50e469`, all six pinned
  checksum entries, and the 31,511,588-byte Linux x64 archive hash
  `55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742`.
- Duration and resource metrics: final focused Vitest duration 160 ms; container provisioning,
  metadata download, archive download, and verification completed in approximately 11 seconds.
  Peak memory and network bytes were not instrumented; the accepted archive size was 31,511,588
  bytes and hashing was streaming/bounded.
- Artifact/log/trace link: committed contract, pinned ASCII release key, purpose-named verifier
  modules/CLI, and local command output; no artifact was published or retained in the repository.
- Oracle proved: strict immutable six-tuple contract validation; bounded metadata/archive hashing;
  exact release-key bytes; detached-signature success through gpgv; exact signer fingerprint;
  authenticated checksum-to-archive cross-checking; duplicate/malformed/missing/mismatched input
  rejection in focused tests; and one real official Linux x64 archive byte hash.
- Does not prove: archive safety or extraction, Linux x64 execution (the container was arm64), any
  bundled Node/native dependency/PTY/watcher behavior, the other five archive downloads, target-native
  assembly/signing, SSH transfer, release publication, cache behavior, or any enabled tuple.
- Checklist items satisfied: Milestone 3 pinned Node/downloaded-binary checksum/upstream-signature
  implementation gate and the two Milestone 3 verification-command inventory entries only.
- Follow-up: assemble the first runtime on a target-native runner, inspect its archive, execute its
  bundled Node and native dependencies, then fill only the evidence cells actually proved.

### E-M3-WINDOWS-CONPTY-GAP-001 — Candidate omitted the production ConPTY runtime closure

- Date: 2026-07-14
- Commit SHA / PR: source audit while preparing implementation commit
  `922edb6ff28199b394f508731fd18a635bec49a0`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; source and installed-package inspection only
- Remote and transport: none
- Exact commands:

  ```sh
  rg -n "useConpty|nodePty\\.spawn|pty\\.spawn" src/main src/shared
  sed -n '470,515p' src/main/daemon/pty-subprocess.ts
  sed -n '1,130p' node_modules/node-pty/scripts/post-install.js
  find node_modules/node-pty/third_party/conpty -maxdepth 3 -type f -print | sort
  rg -n "conpty\\.dll|OpenConsole|useConptyDll" \
    config/scripts/ssh-relay-runtime-tree.mjs \
    config/scripts/ssh-relay-runtime-smoke-child.cjs
  ```

- Result: discriminating discovery. Orca's daemon PTY spawn passes `useConptyDll: true` on Windows.
  Pinned `node-pty@1.1.0` supplies architecture-specific `conpty.dll` and `OpenConsole.exe` under
  `third_party/conpty/1.23.251008001/win10-{x64,arm64}` and its postinstall copies those files to
  `build/Release/conpty`. The candidate directly invoked `node-gyp`, copied only `conpty.node` and
  `conpty_console_list.node`, and smoked with `useConpty: true` but not `useConptyDll: true`.
- Oracle proved: the candidate artifact could pass its proposed smoke while omitting files required
  by the production relay PTY configuration. Both plan artifacts now require the exact ConPTY
  runtime closure and production-mode smoke before a Windows executable cell can pass.
- Does not prove: corrected staging, artifact-tree identity, ConPTY execution, Authenticode/native
  trust, Windows build, SSH, transfer, install, or any enabled tuple.
- Checklist items satisfied: none; this is a red gap record and its implementation item remains open.
- Follow-up: stage the tuple-specific files without running an implicit downloader, copy and hash
  them into the runtime, use `useConptyDll: true` in native smoke, and obtain Windows x64/arm64 CI
  evidence before checking the implementation item.

### E-M3-WINDOWS-INPUT-GAP-001 — Windows ZIP lacks native build inputs

- Date: 2026-07-14
- Commit SHA / PR: investigation while implementing the Windows artifact-only slice in draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741); no Windows artifact was produced or enabled
- Runner: macOS 26.2 arm64; `curl` plus system `unzip`; inspection only
- Remote and transport: exact HTTPS download from
  `https://nodejs.org/dist/v24.18.0/node-v24.18.0-win-x64.zip`; no SSH or release upload
- Exact commands:

  ```sh
  curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
    --connect-timeout 20 --max-time 300 --retry 2 --retry-delay 2 --retry-all-errors \
    https://nodejs.org/dist/v24.18.0/node-v24.18.0-win-x64.zip \
    --output /tmp/orca-node-win-input-check/node-v24.18.0-win-x64.zip
  unzip -l /tmp/orca-node-win-input-check/node-v24.18.0-win-x64.zip | \
    rg 'node\\.exe$|include/node/node\\.h$|node\\.lib$|LICENSE$'
  curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
    https://nodejs.org/dist/v24.18.0/SHASUMS256.txt | \
    rg 'headers|win-(x64|arm64)/node\\.lib|win-(x64|arm64)\\.zip'
  ```

- Result: discriminating discovery. The authenticated x64 ZIP contains 2,449 files and 105,728,964
  expanded bytes, including the 92,534,088-byte `node.exe` and root `LICENSE`, but no
  `include/node/node.h` and no `node.lib`. The same signed checksum document authenticates
  `node-v24.18.0-headers.tar.gz` as
  `6c7d41d83c3481d2301115b8ce4a44b7d4fbfa52859b1aac14f445d460137887`,
  `win-x64/node.lib` as
  `589684168a73547ca47cd22d76a4e465ef561abe89fb1b2b23fe35bbe857d505`, and
  `win-arm64/node.lib` as
  `7da03c5111815b69bbe63ffd2e51b28cd69eec9f545b7ccb8756efffdbb88dc2`.
- Oracle proved: the original six-binary-archive contract is insufficient to build `node-pty` on
  Windows without an unrecorded `node-gyp` download. Both plan artifacts now require the signed
  headers archive and per-architecture import library as explicit immutable build inputs.
- Does not prove: headers/import-library download or extraction, Windows build, ZIP determinism,
  bundled Node/ConPTY/watcher execution, signing/trust, SSH, or any enabled tuple.
- Checklist items satisfied: Windows build-input policy correction only; implementation remains
  unchecked.
- Follow-up: extend the signed input schema/verifier and hostile-input tests, stage only the required
  headers and `node.lib`, then run the native Windows build with implicit downloads disabled.

### E-M3-WINDOWS-ZIP-RED-001 — Windows ZIP/input contract red gate

- Date: 2026-07-14
- Commit SHA / PR: uncommitted Windows artifact-only tests on top of `c308107a9`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0
- Remote and transport: none; synthetic local test discovery only
- Exact command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs
  ```

- Result: expected FAIL before implementation. Both suites failed at import because the deliberately
  missing `ssh-relay-runtime-zip.mjs` and `ssh-relay-node-zip-inspection.mjs` modules did not exist;
  zero tests were collected.
- Duration and resource metrics: 196 ms Vitest duration; archive/runtime resources do not apply.
- Oracle proved: both Windows ZIP boundaries were discriminating before their implementations.
- Does not prove: any ZIP validation, real Node input, Windows build/execution, SSH, or tuple support.
- Checklist items satisfied: red half of the Windows ZIP/input contract gate only.
- Follow-up: E-M3-WINDOWS-INPUT-001 records the first green implementation and real signed inputs.

### E-M3-WINDOWS-INPUT-001 — Signed Windows Node inputs and bounded selective extraction

- Date: 2026-07-14
- Commit SHA / PR: implementation commit `922edb6ff28199b394f508731fd18a635bec49a0`;
  draft PR [#8741](https://github.com/stablyai/orca/pull/8741); native Windows CI pending
- Runners: focused tests and real selective extraction on macOS 26.2 arm64 with Node v26.0.0/pnpm
  10.24.0; signature/checksum/file verification in native Linux arm64 container
  `node@sha256:032e78d7e54e352129831743737e3a83171d9cc5b5896f411649c597ce0b11ea`
  with GnuPG/gpgv 2.2.40
- Remote and transport: exact HTTPS inputs from `nodejs.org/dist/v24.18.0`; no SSH, release upload,
  Windows execution, or remote-host egress
- Exact commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs

  docker run --rm \
    -v "$PWD:/workspace:ro" -v /tmp/orca-node-win-input-check:/inputs:ro \
    -w /workspace \
    node@sha256:032e78d7e54e352129831743737e3a83171d9cc5b5896f411649c597ce0b11ea \
    bash -lc 'set -euo pipefail
      apt-get update -qq
      DEBIAN_FRONTEND=noninteractive apt-get install -y -qq gnupg gpgv >/dev/null
      node config/scripts/verify-ssh-relay-node-release-inputs.mjs \
        --inputs-directory /inputs --archive win32-x64'

  node --input-type=module -e \
    "import {readFile} from 'node:fs/promises';
     import {extractVerifiedSshRelayNodeZipBuildInputs} from
       './config/scripts/ssh-relay-node-zip-inspection.mjs';
     const release=JSON.parse(await readFile(
       './config/ssh-relay-node-release-v24.18.0.json','utf8'));
     console.log(await extractVerifiedSshRelayNodeZipBuildInputs(
       release,'win32-x64','<node-zip>','<exclusive-destination>',
       {headersArchivePath:'<headers.tar.gz>',importLibraryPath:'<win-x64/node.lib>'}));"
  ```

- Result: PASS. Six focused suites passed 19/19 tests. The real verifier authenticated signer
  `C82FA3AE1CBEDC6BE46B9360C43CEC45C17AB93C`, the exact signed checksum document, all nine pinned
  release inputs, the 37,176,245-byte x64 ZIP, 9,951,449-byte headers archive, and 2,986,260-byte x64
  import library. Bounded ZIP inspection consumed 2,449 entries/1,984 files/105,728,964 expanded
  bytes and selectively staged only `node.exe` plus `LICENSE`. Bounded headers inspection consumed
  3,326 entries/2,726 files/58,969,198 expanded bytes and staged only `include`; `node.lib` was
  rehashed before and after exclusive copy to `Release/node.lib`.
- Resource and integrity details: all input hashing and archive entry verification streamed; each
  file was bounded by 256 MiB, aggregate input expansion by 1 GiB, path depth by 32, path bytes by
  512, and entries by 100,000. Synthetic runtime ZIP creation was byte-identical for the same tree
  and epoch and rejected extra entries and content mismatch. Peak RSS, open files, and cancellation
  settlement were not instrumented in this local slice.
- Oracle proved: exact schema and signed-checksum coverage for the Windows ZIP, common headers, and
  tuple import library; missing/malformed input rejection; safe portable ZIP paths, traversal and
  case-fold collision rejection; CRC-32 plus SHA-256 streaming; bounded selective extraction; exact
  post-copy hashes; and deterministic synthetic runtime ZIP packing/inspection.
- Does not prove: native Windows `node-pty` build, that `node-gyp` succeeds offline, bundled
  `node.exe`/ConPTY/watcher execution, full-runtime ZIP identity on Windows, Windows x64/arm64
  signing/trust, oldest baseline, SSH/SFTP/system-SSH, release publication, cache/fallback/UI, or any
  enabled tuple. Local `gpg`/`gpgv` were unavailable on macOS, so the signature proof is the pinned
  Linux container command above; Windows jobs explicitly select Git for Windows' bundled tools.
- Checklist items satisfied: explicit signed Windows build-input contract and bounded local staging
  only; no Windows per-tuple build/executable cell is checked.
- Follow-up: run the exact builder on native `windows-2022` and `windows-11-arm`, require the
  loopback-only `node-gyp` fallback URL to remain unused, and record only the cells actually passed.

### E-M3-WINDOWS-LOCAL-002 — Corrected Windows artifact contracts and local static gates

- Date: 2026-07-14
- Commit SHA / PR: implementation commit `922edb6ff28199b394f508731fd18a635bec49a0`;
  draft PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0. The repository requires Node 24, so
  exact-head draft-PR CI is the authoritative supported-Node result.
- Remote and transport: none; synthetic contracts and repository static checks only
- Exact commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run typecheck
  pnpm exec oxlint
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-plan.html
  git diff --check
  ```

- Result: PASS. Seven focused suites passed 21/21 tests in 290 ms. Typecheck, oxlint, max-lines,
  full lint/reliability/localization gates, plan formatting, and diff whitespace passed. Oxlint
  reported only pre-existing warnings outside this package. Full lint used `GOMAXPROCS=2` because
  the external Go type-aware linter had previously segfaulted on an existing dependency declaration
  at unconstrained concurrency.
- Oracle proved: deterministic synthetic Windows ZIP packing and complete ZIP reinspection;
  signed-input schema and bounded ZIP/header staging contracts; Windows-unsafe header path
  rejection; the Windows runtime-tree identity contains `conpty.dll` and `OpenConsole.exe` as
  native runtime files; the smoke configuration selects `useConptyDll: true`; the workflow declares
  exact x64/arm64 native runners and has read-only, unpublished artifact authority.
- Resource metrics: focused Vitest duration 290 ms. Runtime RSS, open files/channels, cancellation
  settlement, artifact size, and native build/smoke duration do not apply to these synthetic checks
  and remain open for target-native evidence.
- Does not prove: Windows native compilation, offline `node-gyp`, staged ConPTY execution,
  bundled-Node/PTY/watcher smoke, full artifact bytes or reproducibility, native trust/signing,
  oldest baseline, SSH transfer/install, publication, resolver/cache/fallback/UI, or any enabled
  tuple.
- Checklist items satisfied: the added purpose-named local Windows-tree command only. Windows
  per-tuple build/executable and ConPTY implementation boxes remain unchecked pending native CI.
- Follow-up: push this exact implementation head and record exact Windows x64/arm64 jobs, images,
  artifact IDs/hashes/sizes, build/verify/smoke durations, RSS, and any discriminating failure.

### E-M3-WINDOWS-CI-RED-002 — First Windows native jobs stopped at contract tests

- Date: 2026-07-14
- Commit SHA / PR: exact workflow head `539cd060e74386ba33bf1291c940b68fba9af13b` containing
  implementation commit `922edb6ff28199b394f508731fd18a635bec49a0`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Run: [SSH Relay Runtime Artifacts 29338911990](https://github.com/stablyai/orca/actions/runs/29338911990)
- Native jobs:
  - x64 job `87105197603`: requested `windows-2022`; resolved `win22` image
    `20260706.237.1`, GitHub-hosted X64, Windows Server 2022 Datacenter build 20348, Node v24.18.0;
    failed after 1m17s.
  - arm64 job `87105197605`: requested `windows-11-arm`; resolved `win11-arm64` image
    `20260706.102.1`, GitHub-hosted ARM64, Windows 10 Enterprise build 26200, Node v24.18.0; failed
    after 3m37s.
- Remote and transport: none. Both jobs stopped before Node input download, native build, runtime
  smoke, or artifact upload.
- Exact commands:

  ```sh
  gh api repos/stablyai/orca/actions/jobs/87105197603/logs > /tmp/orca-win-x64-red.log
  gh api repos/stablyai/orca/actions/jobs/87105197605/logs > /tmp/orca-win-arm64-red.log
  rg -n "requested_runner=|resolved_image_os=|resolved_image_version=|runner_arch=|WindowsProductName|WindowsVersion|OsBuildNumber|source_commit=|FAIL|SyntaxError|Node archive is missing" \
    /tmp/orca-win-x64-red.log /tmp/orca-win-arm64-red.log
  ```

- Result: FAIL as a discriminating pre-build gate on both architectures. Each run reported three
  failed and four passed suites, with one failed and ten passed collected tests. The x64 test phase
  took 1.26s; arm64 took 1.33s. `ssh-relay-node-tar-inspection.test.mjs` created its POSIX tar
  fixture from an NTFS file and therefore lost the declared `bin/node` execute bit; the production
  inspector correctly rejected it. `ssh-relay-node-release-verification.test.mjs` and
  `ssh-relay-runtime-artifact.test.mjs` separately failed at import with only `SyntaxError: Invalid
or unexpected token`; the first logs did not identify a source location.
- Discriminating follow-up: exact head `55f7137c6e065481d2f58fed1353df9a75914fc8` reran in
  [run 29339487426](https://github.com/stablyai/orca/actions/runs/29339487426). X64 job
  `87107170544` proved the explicit tar-mode correction: five suites and all 11 collected tests
  passed in 1.24s. Only the same two import-time syntax errors remained. Both failing suites import
  a command-line `.mjs` file with a Unix shebang, while every supported call site already invokes
  those files through `node`; the next correction removes only those unused shebangs and preserves
  the CLI main guards.
- Second follow-up: exact head `ef94c90663740c657d44e93f758c99016e66b61a` reran in
  [run 29339742904](https://github.com/stablyai/orca/actions/runs/29339742904). X64 job
  `87108126824` collected all seven suites and 21 tests, proving the shebang correction. Eighteen
  tests passed, one POSIX archive test skipped as designed, and two Windows-specific assertions
  failed in 1.17s: Git checkout converted the pinned armored key from LF to CRLF, and a POSIX
  `chmod(0o600)` rejection assertion ran even though the Windows verifier intentionally takes modes
  from verified ZIP metadata. The received key hash
  `25cc2da386fe54cfc6a3d683f1df2a5f636014a31be8efadd73a9ecc2208dbec` exactly matches
  `sed 's/$/\r/' <pinned-key> | shasum -a 256`; the committed LF bytes remain
  `84b1ca614406f341cb86e72920f5a64687a13ab67ab84038bcf2abba97898a84`.
- Oracle proved: both requested hosted runner labels resolve to native Node 24 environments, MSVC
  setup succeeds, Git for Windows supplies both required GPG tools, frozen source installation
  succeeds, and the test command stops the artifact build before any download or upload. It also
  discriminated one cross-platform fixture assumption.
- Does not prove: that the explicit-mode fixture correction is green on Windows; the cause of the
  two import-time syntax errors; Node input download/signature verification; native compilation;
  offline `node-gyp`; bundled Node/ConPTY/watcher execution; ZIP output; native trust; SSH; or any
  enabled tuple.
- Checklist items satisfied: exact Windows runner-label resolution only. No Windows build,
  executable, archive, or artifact cell is checked.
- Follow-up: mark the pinned armored key `-text` so checkout preserves its authenticated bytes,
  keep the filesystem-mode mutation assertion POSIX-only, and rerun both native architectures.
  Continue to block input download/build until all seven suites pass.

### E-M3-WINDOWS-CI-RED-003 — Native Windows input verification exposed GPG path incompatibility

- Date: 2026-07-14
- Commit SHA / PR: exact workflow head `b387ac48cda70b60a5a148c03ce740f9afedf9cb`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Run: [SSH Relay Runtime Artifacts 29339998273](https://github.com/stablyai/orca/actions/runs/29339998273)
- Native jobs:
  - x64 job `87109014067`: requested `windows-2022`; resolved `win22` image
    `20260706.237.1`, GitHub-hosted X64, Windows Server 2022 Datacenter build 20348, Node v24.18.0;
    failed after 1m21s.
  - arm64 job `87109014073`: requested `windows-11-arm`; resolved `win11-arm64` image
    `20260706.102.1`, GitHub-hosted ARM64, Windows 10 Enterprise build 26200, Node v24.18.0; failed
    after approximately 3m.
- Remote and transport: none. Each job downloaded exact HTTPS inputs from
  `nodejs.org/dist/v24.18.0`; neither reached archive extraction, native compilation, smoke, ZIP
  creation, or artifact upload.
- Exact commands:

  ```sh
  gh run view 29339998273 --repo stablyai/orca \
    --json databaseId,headSha,status,conclusion,url,createdAt,updatedAt,jobs
  gh api repos/stablyai/orca/actions/jobs/87109014067/logs | \
    rg -n -C 12 "SSH relay runtime build failed|gpgv rejected|invalid key resource|Process completed with exit code"
  gh api repos/stablyai/orca/actions/jobs/87109014073/logs | \
    rg -n -C 12 "SSH relay runtime build failed|gpgv rejected|invalid key resource|Process completed with exit code"
  ```

- Result: FAIL as a discriminating signed-input gate on both architectures. All seven focused suites
  collected on each runner; 20 tests passed and one POSIX-only test skipped as designed in 1.17s on
  x64 and 1.47s on arm64. Exact Node inputs downloaded successfully. Git for Windows `gpgv` then
  rejected the exclusive verified-copy keyring path before signature acceptance:
  `invalid key resource URL 'C:\\...\\release-key.gpg'`. GnuPG interprets the drive-letter colon
  as a resource-URL scheme at this option boundary. Both runners failed closed with `No public key`;
  no unverified archive was extracted or executed.
- Oracle proved: the preceding fixture, shebang, checkout-byte, and filesystem-mode corrections are
  green on both native Windows architectures; exact release inputs are downloadable; the production
  signature gate executes and prevents unverified bytes from progressing. The identical x64/arm64
  failure isolates command-path representation rather than architecture-specific cryptography.
- Does not prove: successful Windows signature verification, archive/header/import-library
  extraction, offline `node-gyp`, native compilation, bundled Node/ConPTY/watcher execution, ZIP
  output or determinism, native trust/signing, oldest baseline, SSH, or any enabled tuple.
- Checklist items satisfied: Windows contract-test portability and fail-closed signed-input behavior
  only. No Windows build, executable, archive, or artifact cell is checked.
- Follow-up: run both GPG commands in the exclusive verified-copy directory with cwd-relative paths,
  assert the command boundary never receives an absolute drive-letter path, and rerun both native
  architectures before any broader Windows correction.

### E-M3-WINDOWS-GPG-PATH-RED-001 — Relative verified-copy command boundary red gate

- Date: 2026-07-14
- Commit SHA / PR: red test introduced before its implementation in correction commit
  `b6903b220`; exact base `b387ac48cda70b60a5a148c03ce740f9afedf9cb`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0
- Remote and transport: none; mocked child-process command boundary only
- Exact command:
  `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-node-release-verification.test.mjs`
- Result: expected FAIL; one new test failed and seven existing tests passed in 163 ms. The failure
  diff showed absolute temporary paths passed to both `gpg --output` and `gpgv --keyring`, while the
  required oracle expected cwd-relative verified-copy names and a common exclusive working directory.
- Oracle proved: the regression test discriminates the exact command representation rejected by Git
  for Windows in E-M3-WINDOWS-CI-RED-003 without weakening signature/fingerprint validation.
- Does not prove: real GPG execution, Windows compatibility, successful signature verification,
  archive extraction/build/smoke, or any tuple support.
- Checklist items satisfied: red half of the Windows GPG path-portability correction only.
- Follow-up: add cwd support to the bounded command runner, pass only explicit relative verified-copy
  names, rerun this focused suite, and require native x64/arm64 CI before claiming the correction.

### E-M3-WINDOWS-GPG-PATH-LOCAL-001 — Relative verified-copy command boundary correction

- Date: 2026-07-14
- Commit SHA / PR: implementation commit `b6903b220` on exact base
  `b387ac48cda70b60a5a148c03ce740f9afedf9cb`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0. The repository requires Node 24, so
  exact-head draft-PR CI remains authoritative.
- Remote and transport: none; mocked GPG command-boundary regression plus local contract/static
  checks
- Exact commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run typecheck
  pnpm exec oxlint
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-plan.html
  git diff --check
  ```

- Result: PASS. The focused signature suite passed 8/8 tests in 151 ms; all seven artifact suites
  passed 22/22 tests in 313 ms. Typecheck, full oxlint, max-lines ratchet, full
  lint/reliability/localization gates, plan formatting, and diff whitespace passed. Oxlint reported
  only existing warnings outside this package; full lint used `GOMAXPROCS=2` for the previously
  recorded external Go linter stability constraint.
- Oracle proved: both GPG invocations share the exclusive verified-copy directory as their cwd and
  receive only explicit `./` paths for the key, keyring, checksum, and signature; existing hash,
  command-failure, and exact-fingerprint tests remain green.
- Does not prove: real GPG execution, Git for Windows compatibility, Node 24 support, Windows native
  build/smoke, archive output, or any tuple support.
- Checklist items satisfied: local green half of the path-portability correction only. Native CI is
  still mandatory before the E-M3-WINDOWS-CI-RED-003 failure is considered corrected.
- Follow-up: run the exact correction on Windows x64/arm64 and all four POSIX artifact jobs, then
  record any next discriminating native boundary without broadening this work package.

### E-M3-WINDOWS-CI-RED-004 — Native Windows assembly reached an opaque bounded smoke timeout

- Date: 2026-07-14
- Commit SHA / PR: exact workflow head `42aa02fa9eccf81e40d80f87461ddd232a1cda1f`, containing
  implementation commit `b6903b220`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Run: [SSH Relay Runtime Artifacts 29340686444](https://github.com/stablyai/orca/actions/runs/29340686444),
  conclusion `failure`; all four POSIX regression jobs passed and uploaded only unpublished
  seven-day Actions artifacts.
- Native Windows jobs:
  - x64 job `87111302431`: `windows-2022`, resolved `win22` image `20260706.237.1`, GitHub-hosted
    X64, Windows Server 2022 Datacenter build 20348, Node v24.18.0; failed after 4m37s.
  - arm64 job `87111302486`: `windows-11-arm`, resolved `win11-arm64` image `20260706.102.1`,
    GitHub-hosted ARM64, Windows 10 Enterprise build 26200, Node v24.18.0; failed after 7m9s.
- Remote and transport: no SSH remote. Exact inputs came from `nodejs.org/dist/v24.18.0`; no release
  publication or Windows artifact upload occurred.
- Exact commands:

  ```sh
  gh run view 29340686444 --repo stablyai/orca \
    --json databaseId,headSha,status,conclusion,url,createdAt,updatedAt,jobs
  gh api repos/stablyai/orca/actions/jobs/87111302431/logs | \
    rg -n -C 25 "SSH relay runtime verification failed|durationMs|contentId|Process completed with exit code"
  gh api repos/stablyai/orca/actions/jobs/87111302486/logs | \
    rg -n -C 25 "SSH relay runtime verification failed|durationMs|contentId|Process completed with exit code"
  gh api --paginate repos/stablyai/orca/actions/runs/29340686444/artifacts
  ```

- Result: FAIL at the native bundled smoke on both architectures. Each runner passed all seven
  contract suites with 21 passing and one intentionally skipped test, authenticated the exact Node
  checksum/signature plus ZIP/headers/import library, compiled the patched native modules, assembled
  and reinspected a 60-entry/42-file deterministic-format ZIP, and entered verification's smoke only
  after archive/tree integrity checks. X64 produced a 37,212,065-byte ZIP expanding to 97,248,414
  bytes, content ID `90823b2c6bf7dad748a4399fe74fdfa8be82ef4a00d727e3a6be173f274fd43f`,
  archive SHA-256 `ee7634dea179026b3ba8232294016d939e32edc34e1fd3697dd9e11722285d6a`,
  and 146,511.617 ms build duration. Arm64 produced a 33,261,531-byte ZIP expanding to 86,189,740
  bytes, content ID `09ec2772bb8c47ee240fd226963b7e251a8060e7f84321cb24d2668bf993e2ca`,
  archive SHA-256 `5cb50521ec88d491f1a4183fc13f0b0f688e242e290038c4d34e0125d8e8b2c2`,
  and 176,108.728 ms build duration.
- Failure boundary: each bundled-Node smoke exceeded the parent command's 45-second timeout. The
  child already bounds PTY and watcher waits at 15 seconds and writes its classified failure to
  stderr, but `verify-ssh-relay-runtime.mjs` currently reports only the generic `execFile` stack.
  The logs therefore cannot distinguish PTY, watcher, cleanup-handle, or combined failure. Upload
  remained skipped. Smoke RSS, channel/file counts, and cancellation settlement were not emitted.
- Oracle proved: the GPG relative-path correction works through real Git-for-Windows GPG on native
  x64 and arm64; signed-input gating, offline native build inputs, patched native compilation,
  bundled Node v24.18.0 staging, ZIP construction/inspection, and pre-execution archive/tree gates
  all precede the failing smoke. The four POSIX jobs remain green on the exact same source head.
- Does not prove: successful Windows PTY/ConPTY/watcher execution, which smoke substage failed,
  prompt child-process settlement, ZIP clean-rebuild identity, durable Windows artifact bytes,
  native trust/signing, oldest baseline, SSH, or any enabled tuple.
- Checklist items satisfied: native GPG path portability and pre-smoke Windows assembly progression
  only. Windows per-tuple cells remain unchecked because executable smoke and artifact retention did
  not pass.
- Follow-up: preserve bounded child stdout, stderr, timeout, exit, and signal details in the parent
  diagnostic; add a failure-path unit test; rerun x64 first and change no PTY/watcher behavior until
  the classified child failure is visible.

### E-M3-WINDOWS-SMOKE-DIAGNOSTIC-RED-001 — Bounded child-detail propagation red gate

- Date: 2026-07-14
- Commit SHA / PR: red test introduced before its implementation in `3aab5aff8`; exact base
  `42aa02fa9eccf81e40d80f87461ddd232a1cda1f`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0
- Remote and transport: none; synthetic child-process error object only
- Exact command:
  `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-runtime-artifact.test.mjs`
- Result: expected FAIL; the new diagnostic test failed and three existing tests passed in 239 ms
  because `formatSshRelayRuntimeSmokeFailure` did not exist. The required oracle supplies timeout,
  exit/signal state, partial stdout, and a greater-than-limit stderr whose final classified failure
  must survive explicit truncation.
- Oracle proved: existing parent diagnostics cannot satisfy the bounded failure-detail contract and
  the new test discriminates both missing metadata and unbounded/error-tail-losing implementations.
- Does not prove: child execution, Windows behavior, the actual PTY/watcher failure, cleanup
  settlement, or any tuple support.
- Checklist items satisfied: red half of the smoke-diagnostic correction only.
- Follow-up: implement a 64-KiB tail-preserving formatter around the already 4-MiB-bounded child
  process, wrap `execFile` failure with it, and rerun focused/static gates before native x64 CI.

### E-M3-WINDOWS-SMOKE-DIAGNOSTIC-LOCAL-001 — Bounded child-detail propagation correction

- Date: 2026-07-14
- Commit SHA / PR: implementation commit `3aab5aff8` on exact base
  `42aa02fa9eccf81e40d80f87461ddd232a1cda1f`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0. Exact-head Node 24 CI remains
  authoritative.
- Remote and transport: none; synthetic child-process error plus local artifact contracts
- Exact commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-artifact.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run typecheck
  pnpm exec oxlint \
    config/scripts/verify-ssh-relay-runtime.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs
  pnpm exec oxlint
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-plan.html
  git diff --check
  ```

- Result: PASS. The focused artifact suite passed 4/4 tests in 194 ms; all seven artifact suites
  passed 23/23 tests in 293 ms. Typecheck, focused and full oxlint, max-lines ratchet, full
  lint/reliability/localization gates, plan formatting, and diff whitespace passed. Full lint
  reported only existing warnings outside this package and used the recorded `GOMAXPROCS=2`
  stability constraint.
- Oracle proved: any failed bundled-smoke child now propagates the declared 45-second parent timeout,
  exit code, kill state, signal, message, stdout, and stderr; each stream retains at most its final
  64 KiB with an explicit omitted-byte count. The real command remains capped at 4 MiB and no
  success-path parsing or smoke behavior changed.
- Does not prove: real child failure propagation on Windows, which PTY/watcher stage fails,
  process-tree settlement after timeout, successful native smoke, or any tuple support.
- Checklist items satisfied: local green half of the bounded smoke-diagnostic correction only.
- Follow-up: rerun native Windows x64, capture the classified child tail, and make no execution-path
  change until that evidence identifies the actual failure.

### E-M3-WINDOWS-SMOKE-SETTLEMENT-CI-RED-001 — Native Windows smoke succeeds but does not settle

- Date: 2026-07-14
- Commit SHA / PR: exact workflow head `df661e370102b9b66c26f4c708e641abef0aa1ae`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runners and jobs: GitHub Actions run
  [29341643555](https://github.com/stablyai/orca/actions/runs/29341643555); Windows x64 job
  [87114639412](https://github.com/stablyai/orca/actions/runs/29341643555/job/87114639412),
  `windows-2022` image `20260706.237.1`, Windows Server 2022 10.0.20348, native x64, Node
  v24.18.0; Windows arm64 job
  [87114639449](https://github.com/stablyai/orca/actions/runs/29341643555/job/87114639449),
  `windows-11-arm64` image `20260706.102.1`, Windows 11 Enterprise 10.0.26200, native arm64,
  Node v24.18.0
- Remote and transport: no SSH remote; target-native artifact build and bundled-runtime execution
  on the hosted runner; exact signed inputs downloaded from pinned nodejs.org URLs
- Exact command:

  ```sh
  gh api repos/stablyai/orca/actions/jobs/87114639412/logs | \
    rg -n -C 16 'Bundled runtime smoke command failed|timeoutMs=|Image:|Version:'
  gh api repos/stablyai/orca/actions/jobs/87114639449/logs | \
    rg -n -C 16 'Bundled runtime smoke command failed|timeoutMs=|Image:|Version:'
  ```

- Result: expected discriminating FAIL. The exact signed inputs, offline native build, archive and
  complete-tree verification all passed. Bundled Node v24.18.0/ABI 137 then completed the patched
  ConPTY smoke with exit 23, 101×37 resize, input marker, and both native modules loaded from
  `build/Release`; watcher create, update, rename-as-delete/create, and delete also completed. The
  x64 child emitted valid JSON after 3,357.413 ms with 56,905,728-byte RSS; arm64 emitted the same
  functional result after 6,593.663 ms with 54,505,472-byte RSS. Both remained alive until the
  parent killed them at 45 seconds (`code=null`, `killed=true`, `signal="SIGTERM"`, empty stderr).
- Artifact metrics: x64 content ID
  `sha256:8cf9eb4e04459e25d710a28235a57e777d39f65168841c2408ab658243a21d94`; ZIP
  37,212,068 bytes with SHA-256
  `sha256:11f83971ed20cde7be41aa2f753cfd4350cd4a70a3fe46a27540ebc872c4ca56`; build
  151,226.208 ms. Arm64 content ID
  `sha256:dda60b6237b320c74236f57bece072d0f847479eb322f43f22c829daf2ce9bf6`; ZIP
  33,261,533 bytes with SHA-256
  `sha256:f3fefed7b959fb6c3945170e8f0f7d2766cf26240aef9928b0e25770e5b19a26`; 86,189,740
  expanded bytes; build 248,307.259 ms. Uploads remained skipped because prompt process settlement
  is part of executable proof.
- Oracle proved: Windows x64 and arm64 PTY/ConPTY and watcher functionality succeeds through each
  exact bundled runtime, and the common remaining failure occurs after successful JSON emission in
  child-process handle settlement rather than in PTY, watcher, archive, or tree validation.
- Does not prove: prompt cleanup, durable artifact upload, clean-rebuild identity, native
  trust/signing, oldest baseline, SSH, or any enabled tuple. Both per-tuple rows remain unchecked
  until the child exits normally and exact-head CI retains each artifact.
- Follow-up: retain and dispose the PTY listener subscriptions, call the supported Windows terminal
  cleanup after a validated successful exit, and prove normal child settlement without
  `process.exit()` on both native architectures.

### E-M3-WINDOWS-SMOKE-SETTLEMENT-LOCAL-RED-001 — PTY lifecycle cleanup contract red gate

- Date: 2026-07-14
- Commit SHA / PR: uncommitted contract test and behavior-preserving PTY-smoke module extraction on
  exact base `df661e370102b9b66c26f4c708e641abef0aa1ae`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0
- Remote and transport: none; injected terminal/listener lifecycle only
- Exact command:
  `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-runtime-pty-smoke.test.mjs`
- Result: expected FAIL in 122 ms. The Windows success case returned a valid exit result but called
  `terminal.kill()` zero times; the POSIX success case and Windows case both disposed zero of their
  three `onData`/`onExit` subscriptions. Two tests failed, with no timeout or synthetic forced exit.
- Oracle proved: the current success path lacks the exact listener and ConPTY cleanup operations
  required by the native x64 diagnostic, and the purpose-named suite distinguishes Windows-only
  terminal cleanup from platform-neutral listener disposal.
- Does not prove: the green implementation, actual Windows handle release, timeout/error cleanup,
  full child-process settlement, arm64 behavior, or any tuple support.
- Checklist items satisfied: red half of the Windows PTY smoke-settlement correction only.
- Follow-up: add idempotent finally cleanup, preserve successful POSIX no-kill behavior, rerun this
  suite and all artifact/static gates, then require exact-head native Windows CI.

### E-M3-WINDOWS-SMOKE-SETTLEMENT-LOCAL-001 — Explicit PTY resource settlement

- Date: 2026-07-14
- Commit SHA / PR: implementation commit
  `ddf28eb8dba3ade4806082cfc5edd6526389cf94`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0. Exact-head Node 24 native CI remains
  authoritative.
- Remote and transport: none; injected terminal lifecycle plus local source/static verification
- Exact commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run typecheck
  pnpm exec oxlint \
    config/scripts/ssh-relay-runtime-smoke-child.cjs \
    config/scripts/ssh-relay-runtime-pty-smoke.cjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-smoke-child.cjs \
    config/scripts/ssh-relay-runtime-pty-smoke.cjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Result: PASS. The lifecycle suite passed 2/2 tests in 117 ms; the eight artifact suites passed
  25/25 tests in 417 ms. Typecheck, focused oxlint, max-lines ratchet, full
  lint/reliability/localization checks, formatting, and diff whitespace passed. Full lint reported
  only pre-existing warnings outside this package.
- Oracle proved: the success path retains and disposes both data subscriptions and the exit
  subscription exactly once; a validated Windows exit additionally calls the supported node-pty
  terminal cleanup exactly once, while a successful POSIX exit does not kill its terminal. Cleanup
  is in `finally`, the existing timeout/error path still kills the terminal, and no `process.exit()`
  was introduced. Both native workflow families now run the lifecycle contract.
- Does not prove: actual Windows ConPTY handle release, prompt bundled child-process exit, exact-head
  Node 24 behavior, artifact retention, clean-rebuild identity, native trust, oldest baseline, SSH,
  or any enabled tuple. Both Windows per-tuple cells remain unchecked.
- Checklist items satisfied: local green half of the PTY smoke-settlement correction and its
  purpose-named verification-command inventory only.
- Follow-up: commit and push the isolated correction, run both target-native Windows jobs at the
  exact head, and require normal smoke completion plus artifact upload before advancing.

### E-M3-WINDOWS-SMOKE-SETTLEMENT-CI-RED-002 — Explicit PTY cleanup is insufficient on native x64

- Date: 2026-07-14
- Commit SHA / PR: exact workflow head `b6291e55b1781b4c4e6f46a4965152f4a0d2334f`, containing
  PTY settlement implementation `ddf28eb8dba3ade4806082cfc5edd6526389cf94`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runners and jobs: GitHub Actions run
  [29342918504](https://github.com/stablyai/orca/actions/runs/29342918504); Windows x64 job
  [87119092333](https://github.com/stablyai/orca/actions/runs/29342918504/job/87119092333),
  `windows-2022` native x64 with Node v24.18.0; Windows arm64 job
  [87119092293](https://github.com/stablyai/orca/actions/runs/29342918504/job/87119092293),
  `windows-11-arm64` native arm64 with Node v24.18.0
- Remote and transport: no SSH remote; target-native artifact build and bundled-runtime execution
- Exact commands:
  `gh api repos/stablyai/orca/actions/jobs/87119092333/logs | rg -n -C 20 'SSH relay runtime verification failed|timeoutMs=|durationMs|rssBytes|contentId'` and the same command for job `87119092293`
- Result: expected discriminating FAIL. The new 25/25 contract suite passed, followed by signed
  inputs, offline native compilation, archive/tree inspection, and functional bundled smoke. The
  child emitted PTY exit 23, 101×37 resize, input, patched native paths, all watcher events, and
  valid JSON in 3,344.690 ms with 59,699,200-byte RSS, then again remained alive until the parent
  killed it at 45 seconds with empty stderr. ZIP size was 37,212,067 bytes, content ID
  `sha256:68a49782761c411494e677be9c2dc5038fb4f85f066316edc7b92ee25a3c3fbd`, archive SHA-256
  `sha256:11688158da540cdfa1e10e5f632dac7487adf61e600e46d3fb0303fa42fc15b6`, and build duration
  139,167.307 ms. Artifact upload remained skipped.
- Arm64 result: the same valid PTY/watcher JSON arrived in 3,772.018 ms with 54,095,872-byte RSS,
  followed by the identical 45-second timeout and empty stderr. ZIP size was 33,261,534 bytes,
  content ID `sha256:cff683eba32500f95d4a1a87d8f8a8eaf06613753b75d8eff55ccce23a0160c6`, archive
  SHA-256 `sha256:12640e6003547cf94f6ab13c6fdecb6373254b724fb561aa38023a3d33b5fa17`, and build
  duration 155,781.418 ms. Upload remained skipped.
- Oracle proved: disposing all public PTY subscriptions and calling public Windows terminal cleanup
  after validated exit does not by itself settle the bundled child. The failure remains post-smoke
  and is not a PTY/watcher functional failure, but the retained resource type is still unknown.
- Does not prove: which PTY worker/socket, watcher, stdio, timer, or other resource remains; safe
  dependency-level remediation; normal child exit; artifact retention; or any tuple.
- Checklist items satisfied: none beyond a new native red boundary; Windows rows remain unchecked.
- Follow-up: emit bounded `process.getActiveResourcesInfo()` data after all smoke cleanup, retain it
  through the existing parent diagnostic, and make no further cleanup change until the resource
  class is visible on native Windows.

### E-M3-WINDOWS-RESOURCE-DIAGNOSTIC-LOCAL-001 — Bounded post-cleanup resource observation

- Date: 2026-07-14
- Commit SHA / PR: diagnostic implementation commit
  `6bba900209543a53b7673ca12173159d40d9fc87`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0. Native Windows classification remains
  authoritative.
- Remote and transport: none; injected public active-resource lists plus local source/static gates
- Exact commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run typecheck
  pnpm exec oxlint config/scripts/ssh-relay-runtime-resource-diagnostics.cjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-smoke-child.cjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-resource-diagnostics.cjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-smoke-child.cjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Result: PASS. The resource/PTY/workflow slice passed 6/6 tests in 173 ms; all nine artifact
  suites passed 27/27 tests in 297 ms. Typecheck, focused oxlint, max-lines, full
  lint/reliability/localization, formatting, and whitespace gates passed with only existing
  out-of-package lint warnings.
- Oracle proved: Windows diagnostics use the public `process.getActiveResourcesInfo()` API, retain
  only at most 256 resource type strings capped at 128 characters, report omitted counts, and take
  snapshots immediately after all functional cleanup and after a two-second drain window. POSIX
  smoke receives neither the delay nor a resource probe. Both native workflow families run the
  contract.
- Does not prove: the actual retained native Windows resource types, whether the culprit is PTY or
  watcher state, safe cleanup, normal child exit, artifact retention, or any tuple.
- Checklist items satisfied: bounded local diagnostic contract and verification-command inventory
  only; no behavior, matrix, or tuple item.
- Follow-up: commit and push the diagnostic, capture both native Windows snapshots through the
  existing 45-second failure formatter, then change only the resource owner identified by evidence.

### E-M3-WINDOWS-RESOURCE-DIAGNOSTIC-CI-RED-001 — Native Windows retains one `MessagePort`

- Date: 2026-07-14
- Commit SHA / PR: exact workflow head `2aaea70465dc80ced2ba4662b5bc1475a9c2f8c5`, containing
  bounded diagnostic implementation `6bba900209543a53b7673ca12173159d40d9fc87`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runners and jobs: GitHub Actions run
  [29343816558](https://github.com/stablyai/orca/actions/runs/29343816558); Windows x64 job
  [87122172498](https://github.com/stablyai/orca/actions/runs/29343816558/job/87122172498),
  `windows-2022` image `20260706.237.1`, native x64, runner `2.335.1`; Windows arm64 job
  [87122172553](https://github.com/stablyai/orca/actions/runs/29343816558/job/87122172553),
  `windows-11-arm64` image `20260706.102.1`, native arm64, runner `2.335.1`
- Remote and transport: no SSH remote; target-native artifact build and bundled-runtime execution
- Exact commands:

  ```sh
  gh api 'repos/stablyai/orca/actions/runs/29343816558/jobs?per_page=100' \
    --jq '.jobs[] | [.id,.name,.status,.conclusion,.head_sha,.html_url] | @tsv'
  gh api repos/stablyai/orca/actions/jobs/87122172498/logs | \
    rg -n -C 10 'resourceSettlement|Bundled runtime smoke command failed|timeoutMs=|contentId|durationMs|rssBytes'
  gh api repos/stablyai/orca/actions/jobs/87122172553/logs | \
    rg -n -C 10 'resourceSettlement|Bundled runtime smoke command failed|timeoutMs=|contentId|durationMs|rssBytes'
  ```

- Result: expected discriminating FAIL on both Windows jobs after 27/27 contract tests, exact signed
  inputs, offline native compilation, archive/tree inspection, and valid functional smoke output.
  Immediately after smoke each child reported three `PipeWrap` resources plus one `MessagePort`;
  after the two-second observation window one `PipeWrap` settled but the `MessagePort` remained.
  Each child then remained alive until the unchanged 45-second parent timeout sent `SIGTERM`.
- X64 metrics: functional smoke completed in 5,368.1555 ms with 60,022,784-byte RSS. The ZIP was
  37,212,066 bytes with content ID
  `sha256:4ee246445ad65eec49b70fceab92fbd954de2f7fd8608a0646cc9a79ce53e69a`, archive SHA-256
  `sha256:20c98e2db2aaa9245fb2c632d37c4963e70f65a0e5257aff4e196dc64fb984dd`, and build
  duration 143,545.9941 ms.
- Arm64 metrics: functional smoke completed in 5,873.1038 ms with 54,059,008-byte RSS. The ZIP was
  33,261,530 bytes with content ID
  `sha256:9418590ffa09d21145dd1ff4d8492d1ff8b0328df496e300edec1969365df3a3`, archive SHA-256
  `sha256:52477f9714e7ac38b9f40ce5642b7f1c9e838f98af48387c7a88ef53b1dcf385`, and build
  duration 169,800.5025 ms.
- POSIX control: Linux x64/arm64 and macOS x64/arm64 jobs at the same exact head all completed
  successfully; the Windows-only observation did not add a POSIX delay or resource probe.
- Oracle proved: the retained native resource class is one persistent `MessagePort` on both Windows
  architectures after successful PTY/ConPTY/watcher behavior and public PTY cleanup. The remaining
  `PipeWrap` resources are the smoke child's parent stdio and are not sufficient to explain the
  Windows-only non-exit because the same child-process boundary exits on POSIX.
- Does not prove: which dependency object owns the `MessagePort`, a safe correction, normal Windows
  child exit, uploaded artifact retention, clean-rebuild identity, native trust, SSH, or any tuple.
  Both Windows executable cells remain unchecked.
- Checklist items satisfied: native resource classification only.
- Follow-up: inspect the copied node-pty ConPTY worker lifecycle, add an exact-source fail-closed
  transform contract scoped to Windows artifact staging, then require both native jobs to exit and
  upload unpublished evidence before advancing.

### E-M3-WINDOWS-CONPTY-WORKER-LOCAL-RED-001 — Copied-source settlement contract red gate

- Date: 2026-07-14
- Commit SHA / PR: uncommitted red-test working tree based on
  `2aaea70465dc80ced2ba4662b5bc1475a9c2f8c5`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0. Node 24 and native Windows remain the
  authoritative artifact environments.
- Remote and transport: none; synthetic copied-source fixtures only
- Exact command:
  `pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs`
- Result: expected discriminating FAIL, 4/4 tests failed in 136 ms. The copied Windows source was
  unchanged, POSIX returned no explicit no-op result, and missing/duplicate source patterns did not
  fail closed.
- Oracle proved: the new contract failed for each missing behavior before the correction existed.
- Does not prove: the green transform, production wiring, native Windows execution, prompt worker
  settlement, or any tuple.
- Checklist items satisfied: red half of the copied ConPTY worker settlement correction only.
- Follow-up: implement the exact one-match transform against exclusive artifact staging and rerun
  focused, artifact, and repository gates.

### E-M3-WINDOWS-CONPTY-WORKER-LOCAL-001 — Fail-closed artifact-only worker settlement

- Date: 2026-07-14
- Commit SHA / PR: implementation commit `c04b4f630`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0. Node 24 and native Windows remain the
  authoritative artifact environments.
- Remote and transport: none; pinned installed node-pty source, synthetic source-drift fixtures,
  workflow contract, and repository static gates
- Exact commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run typecheck
  pnpm exec oxlint config/scripts/ssh-relay-node-pty-build.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    .github/workflows/ssh-relay-runtime-artifacts.yml
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-node-pty-build.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Result: PASS. The purpose-named suite passed 5/5 tests in 124 ms; the settlement/PTY/resource/tree/
  workflow slice passed 12/12 tests across five suites in 201 ms; all ten artifact suites passed
  32/32 tests in 378 ms. Typecheck, focused oxlint, max-lines, full lint/reliability/localization,
  formatting, and whitespace gates passed with only existing out-of-package lint warnings.
- Duration and resource metrics: the combined repository static command completed in approximately
  12.4 seconds. Peak memory and open-file counts were not instrumented by these local static tests.
- Oracle proved: the transform accepts the exact pinned installed node-pty source, starts the
  ConPTY `Worker` drain even when no later output arrives, preserves later-data timer resets, modifies
  only the copied Windows artifact source after exclusive staging, and does not inspect a POSIX copy.
  Missing, drifted, duplicate, or already-transformed source rejects before a write. Both native
  workflow families run the purpose-named contract. The repository-wide
  `config/patches/node-pty@1.1.0.patch` and legacy/default desktop node-pty behavior are unchanged.
- Does not prove: native Windows worker termination, normal smoke child exit, absence of a persistent
  `MessagePort`, artifact upload, reproducibility, native trust, oldest baseline, SSH, or any tuple.
- Checklist items satisfied: purpose-named local copied-source settlement contract and verification
  command inventory only; Windows executable rows remain unchecked.
- Follow-up: push the exact head and require both target-native Windows jobs to exit normally, show
  no persistent `MessagePort` after the observation window, and upload unpublished evidence.

### E-M3-WINDOWS-CI-001 — Native Windows artifacts execute, settle, and upload

- Date: 2026-07-14
- Commit SHA / PR: exact workflow head `d9a556b9c8b3d3a639d4fc93a8ba25926089d20f`, containing
  implementation commit `c04b4f630`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Run: GitHub Actions
  [29345126283](https://github.com/stablyai/orca/actions/runs/29345126283), completed success with all
  six target-native jobs green
- Windows runners and jobs: x64 job
  [87126693074](https://github.com/stablyai/orca/actions/runs/29345126283/job/87126693074),
  `windows-2022` image `20260706.237.1`, Windows Server 2022 build 20348, native X64, Node v24.18.0;
  arm64 job
  [87126693105](https://github.com/stablyai/orca/actions/runs/29345126283/job/87126693105),
  `windows-11-arm64` image `20260706.102.1`, Windows build 26200, native ARM64, Node v24.18.0
- Remote and transport: no SSH remote; target-native artifact build, bundled-runtime execution, and
  GitHub Actions unpublished artifact upload
- Exact commands:

  ```sh
  gh run watch 29345126283 --repo stablyai/orca --interval 10 --exit-status
  gh api 'repos/stablyai/orca/actions/runs/29345126283/jobs?per_page=100' \
    --jq '.jobs[] | [.id,.name,.status,.conclusion,.started_at,.completed_at,.head_sha,.html_url] | @tsv'
  gh api repos/stablyai/orca/actions/jobs/87126693074/logs | \
    rg -n -C 12 'resourceSettlement|contentId|archive|durationMs|rssBytes|Artifact .* has been successfully uploaded'
  gh api repos/stablyai/orca/actions/jobs/87126693105/logs | \
    rg -n -C 12 'resourceSettlement|contentId|archive|durationMs|rssBytes|Artifact .* has been successfully uploaded'
  gh api 'repos/stablyai/orca/actions/runs/29345126283/artifacts?per_page=100' \
    --jq '.artifacts[] | [.id,.name,.size_in_bytes,.expired,.created_at,.archive_download_url] | @tsv'
  gh api repos/stablyai/orca/actions/artifacts/8315822805/zip > <temporary-x64-actions.zip>
  gh api repos/stablyai/orca/actions/artifacts/8315904862/zip > <temporary-arm64-actions.zip>
  shasum -a 256 <temporary-x64-actions.zip> <temporary-arm64-actions.zip>
  unzip -l <temporary-x64-actions.zip>
  unzip -p <temporary-x64-actions.zip> '*identity.json' | jq
  unzip -l <temporary-arm64-actions.zip>
  unzip -p <temporary-arm64-actions.zip> '*identity.json' | jq
  ```

- Result: PASS. Both Windows jobs passed 32/32 artifact contract tests, exact signed Node input
  verification, offline target-native compilation, exact archive/tree inspection, bundled Node
  v24.18.0, production-DLL ConPTY input/101×37 resize/exit 23, watcher lifecycle, normal child exit,
  and unpublished upload. Immediately after smoke, each child reported three `PipeWrap` resources,
  one `MessagePort`, and the diagnostic's own `Timeout`; after the two-second observation only the
  two parent stdio `PipeWrap` resources remained. No `MessagePort` or timer survived, and neither
  45-second parent timeout fired.
- X64 metrics and bytes: build 135,657.3557 ms; full verification 6,495.1387 ms; smoke 5,353.5073 ms
  with 54,075,392-byte RSS. The 42-file ZIP was 37,212,121 bytes, expanded to 97,248,569 bytes, had
  content ID `sha256:32efa708b1fbefb05a11b0de6703551e5680d64c8015bb956095db3b50292c92`, and archive
  SHA-256 `sha256:2ec9db55b5c417ea7ed9ab6cf5a960be4b9c305e68c68f8123a11dab0e3119a4`.
  Uploaded artifact
  [8315822805](https://github.com/stablyai/orca/actions/runs/29345126283/artifacts/8315822805) was
  37,075,355 bytes and downloaded with SHA-256
  `d98d1c935514667ea5c48a160ef54b9674a93f995ca24df2c19759735c62eefb`; total job duration was
  4m06s.
- Arm64 metrics and bytes: build 190,135.9561 ms; full verification 7,908.8115 ms; smoke 5,874.805 ms
  with 51,843,072-byte RSS. The 42-file ZIP was 33,261,582 bytes, expanded to 86,189,895 bytes, had
  content ID `sha256:e1d5eab84a7b1eb38d55acb9f87d852569995e22c47c02d202f29eb293467944`, and archive
  SHA-256 `sha256:577285df23333a3de89489dec52027afd76aeb9ef23f74ffb6d5706e06a75ae8`.
  Uploaded artifact
  [8315904862](https://github.com/stablyai/orca/actions/runs/29345126283/artifacts/8315904862) was
  33,137,908 bytes and downloaded with SHA-256
  `77b78cb33117c8c8b4f5d639dada063651f7d303a815a097bfa36d9e651a2419`; total job duration was
  7m09s.
- POSIX control: Linux x64/arm64 and macOS x64/arm64 passed the same exact-head contract, build,
  verification, smoke, and unpublished upload steps. All six run artifacts exist with seven-day
  retention; no release asset was published.
- Oracle proved: the copied-source correction terminates the node-pty ConPTY worker on both native
  Windows architectures without masking the process with `process.exit()`, while preserving full
  PTY/watcher behavior and the four POSIX controls. The exact uploaded evidence contains the runtime
  ZIP, identity, SPDX SBOM, and provenance files.
- Does not prove: same-runner clean-rebuild identity, oldest baselines, Authenticode/native trust,
  SSH/SFTP/system-SSH transfer, relay RPC behavior, cancellation, publication, or any enabled tuple.
- Checklist items satisfied: Milestone 3 Windows `conpty.dll`/`OpenConsole.exe` production-path item;
  Windows x64 and arm64 build/provenance, bundled Node, real PTY, and watcher cells; target-native
  pre-upload inspection/smoke command.
- Follow-up: add and execute the separately gated same-head/same-runner two-clean-build identity
  oracle before oldest-baseline or trust work.

### E-M3-RUNTIME-LOCAL-001 — First target-native Linux arm64 runtime artifact

- Date: 2026-07-14
- Commit SHA / PR: implementation commit `f2b387b21bbe6a3863ff1a492a1a03b65e0a0477` in stacked
  draft PR [#8741](https://github.com/stablyai/orca/pull/8741); native PR CI pending
- Runner: macOS 26.2 arm64 host with Docker Engine 29.2.1; native Linux/arm64 container
  `node@sha256:032e78d7e54e352129831743737e3a83171d9cc5b5896f411649c597ce0b11ea`
  (Debian bookworm, build Node v24.17.0), bundled Node v24.18.0 ABI 137, Python 3.11.2, GNU
  C++ 12.2.0, GNU strip 2.40, XZ Utils 5.4.1, GnuPG/gpgv 2.2.40
- Remote: none; native container artifact build/execution only, not an SSH host or oldest-baseline VM
- Transport/network: exact HTTPS downloads from `nodejs.org/dist/v24.18.0`; Debian package mirrors
  for build/signature-verification tools; no SSH, SFTP, system SSH, release upload, or remote egress
- Exact command:

  ```sh
  docker run --rm \
    -v "$PWD:/workspace" \
    -v /tmp/orca-runtime-linux-arm64-v3:/evidence \
    -w /workspace \
    node@sha256:032e78d7e54e352129831743737e3a83171d9cc5b5896f411649c597ce0b11ea \
    bash -lc 'set -euo pipefail
      apt-get update -qq
      DEBIAN_FRONTEND=noninteractive apt-get install -y -qq build-essential ca-certificates curl gnupg gpgv python3 xz-utils >/dev/null
      mkdir -p /tmp/node-inputs
      base=https://nodejs.org/dist/v24.18.0
      for asset in SHASUMS256.txt SHASUMS256.txt.sig node-v24.18.0-linux-arm64.tar.xz; do
        curl --fail --silent --show-error --location --proto "=https" --tlsv1.2 \
          --connect-timeout 20 --max-time 300 --retry 2 --retry-delay 2 --retry-all-errors \
          "$base/$asset" --output "/tmp/node-inputs/$asset"
      done
      output=/evidence/new-parent/artifact
      node config/scripts/build-ssh-relay-runtime.mjs --tuple linux-arm64-glibc --inputs-directory /tmp/node-inputs --output-directory "$output" --source-date-epoch 1784030321 --git-commit 0c299fe189310b6dbd539f0f0f506b240524ba6a
      identity="$output/orca-ssh-relay-runtime-linux-arm64-glibc.identity.json"
      archive=$(find "$output" -maxdepth 1 -name "*.tar.xz" -print -quit)
      node config/scripts/verify-ssh-relay-runtime.mjs --runtime-directory "$output/runtime" --identity "$identity" --archive "$archive"'
  ```

  A second clean `createSshRelayRuntimeArchive` invocation used the same runtime tree,
  `SOURCE_DATE_EPOCH`, container digest, Node tar implementation, and XZ 5.4.1, followed by `cmp`
  and `sha256sum` against the first archive.

- Result: PASS. The target-native build authenticated the official Node metadata/archive, inspected
  5,774 upstream tar entries before selective extraction, executed Node v24.18.0, source-built
  Orca-patched `node-pty@1.1.0` against the exact Node 24 headers, stripped the resulting Linux
  addon, copied exactly one Linux arm64 glibc watcher native package, and preserved the existing
  relay/watcher content hash. Full archive and unpacked-tree verification agreed on content ID
  `sha256:cf0acba7a8839d5ee422755562ce30ffa4433a663991054d0b5d9681ebc54832`.
  The bundled runtime produced PTY input, 101×37 resize, and exit code 23 plus watcher create,
  update, rename-as-delete/create, and delete events. The same tree repacked byte-for-byte
  identically: both archives hashed to
  `sha256:b1b9857a42d45a068f03f2484f98fcebe82b3d21ddd53eac7d0bdabf494a7f9e`.
- Duration and resource metrics: exclusive artifact staging to finalized identity took 138.666
  seconds based on output birth/finalization timestamps; deterministic repack compression took
  approximately 109 seconds; full archive/tree/native verification took 3,746.221 ms; bundled
  PTY/watcher smoke took 248.879 ms with 35,328,000-byte RSS. The archive is 28,192,132 bytes,
  expands to 122,865,156 bytes, and contains 34 files/49 total entries. Build peak memory, open-file
  count, and cancellation settlement were not instrumented and remain CI follow-ups. After adding
  bounded native-command/xz execution, compressed-size prechecks, exact mode verification, frozen
  installs, and automatic parent creation, a fresh build into the previously absent
  `/evidence/new-parent/artifact` completed in 89,580.560 ms and retained the exact content/archive
  hashes above; verification took 3,515.039 ms and smoke took 192.609 ms with 34,885,632-byte RSS.
- Artifact/log/trace link: unpublished local artifact directory
  `/tmp/orca-runtime-linux-arm64-v3/new-parent/artifact`; archive hash above; SBOM hash
  `sha256:27f81b5650b088dc8e01563b0229c978f8ea05828e90a1a4fd0d11640d6cc54a`;
  provenance hash
  `sha256:dc1433c481b57de44929248ddb033f2a35bfdb40fc32d9f442b9d8f8ed7f816c`;
  identity hash
  `sha256:95b4ca6bcce846c65c6b15c35df548db0598d8156aee1c54c196b95f998824a6`.
- Oracle proved: one native Linux arm64 glibc artifact-only build; exact official Node signature and
  archive input; bounded source-tar inspection; exclusive selective extraction; Node-ABI-matched
  patched `node-pty`; one correct watcher package; runtime-only JavaScript/license closure; SPDX
  SBOM/provenance/identity assets; executable modes; deterministic `tar.xz`; exact archive/tree
  hashes; and direct bundled Node/native PTY/watcher execution before any upload.
- Does not prove: GitHub runner reproducibility, Linux x64, macOS, Windows/zip, musl, oldest glibc or
  kernel, native code signing/trust, quarantine/Gatekeeper/WDAC/AV, SSH/SFTP/system-SSH transfer,
  relay RPC conformance, cancellation/file-handle/peak-memory budgets, release publication, cache,
  fallback, UI, or any enabled tuple. Docker Desktop architecture is native arm64 but this is not an
  approved oldest-baseline or cross-family remote cell. The verified official Node binary reports
  upstream debug metadata and was intentionally preserved byte-for-byte; only Orca-built
  `pty.node` was stripped. Both plan artifacts now state that precedence explicitly.
- Checklist items satisfied: named assembly script; POSIX deterministic archive; pre-archive mode
  verification; local POSIX archive/smoke commands; Linux arm64 build/provenance, bundled Node,
  patched real PTY, and watcher cells only.
- Follow-up: run `.github/workflows/ssh-relay-runtime-artifacts.yml` on the exact draft-PR head,
  record resolved runner image identities and artifacts, implement Windows zip/native assembly
  separately, and leave every tuple disabled until oldest-baseline, trust, and both live SSH layers
  are complete.

### E-M3-STATIC-001 — Work Package 2 focused and repository static gates

- Date: 2026-07-14
- Commit SHA / PR: implementation commit `f2b387b21bbe6a3863ff1a492a1a03b65e0a0477` in stacked
  draft PR [#8741](https://github.com/stablyai/orca/pull/8741); native PR CI pending
- Runner: macOS 26.2 arm64; Node v26.0.0 and pnpm 10.24.0
- Remote and transport: not applicable; local source/static verification only
- Exact commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/*ssh-relay* config/ssh-relay-node-release-v24.18.0.json
  pnpm run check:max-lines-ratchet
  git diff --check
  ```

- Result: PASS. Four focused suites passed 15/15 tests in 993 ms; typecheck passed; repository lint
  passed with only pre-existing warnings outside Work Package 2; formatting passed for 20 matched
  files; max-lines reported 355 grandfathered suppressions and no new bypass; diff check passed.
- Duration and resource metrics: full lint completed in 20.438 seconds. Peak memory, open files, and
  cancellation settlement were not instrumented by these static commands.
- Artifact/log/trace link: purpose-named tests and local command output; durable GitHub job links are
  pending the draft PR.
- Oracle proved: hostile release-input/archive cases, canonical identity parity, deterministic
  archive/exact-tree and permission rejection, workflow runner/action/no-publication/frozen-install
  contracts, compilation, repository lint policy, formatting, line budget, and whitespace safety.
- Does not prove: Node 24 source-tool execution, target-native runners beyond E-M3-RUNTIME-LOCAL-001,
  macOS/x64, signing/trust, oldest baselines, SSH transfer, relay RPCs, publication, cancellation
  settlement, or any enabled tuple. The exact workflow head and Node 24 gates require PR CI.
- Checklist items satisfied: current Work Package 2 local handoff/static gate only.
- Follow-up: create the isolated stacked draft PR, run the four target-native POSIX jobs, and replace
  uncommitted/local evidence with exact commit, run, job, image, artifact, and duration identifiers.

### E-M3-CI-RED-001 — Native macOS watcher path-oracle failure

- Date: 2026-07-14
- Commit SHA / PR: exact draft-PR head `f8a230ef301fc6f2bb76082f549e3b3ae725c142` in
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner and jobs: GitHub Actions run
  [29335018198](https://github.com/stablyai/orca/actions/runs/29335018198); macOS arm64 job
  [87092056703](https://github.com/stablyai/orca/actions/runs/29335018198/job/87092056703) used
  `macos-15-arm64` image `20260706.0213.1`, macOS 15.7.7, runner arm64, and Node v24.18.0;
  macOS x64 job
  [87092056769](https://github.com/stablyai/orca/actions/runs/29335018198/job/87092056769) used
  `macos-15` image `20260629.0276.1`, runner x64, and Node v24.18.0
- Remote and transport: no SSH remote; target-native artifact build and local execution on each
  hosted runner; Node inputs downloaded from the exact pinned nodejs.org URLs
- Exact workflow/log commands:

  ```sh
  gh run watch 29335018198 --repo stablyai/orca --exit-status --interval 10
  gh api -H 'Accept: application/vnd.github+json' \
    repos/stablyai/orca/actions/jobs/87092056703/logs
  gh api -H 'Accept: application/vnd.github+json' \
    repos/stablyai/orca/actions/jobs/87092056769/logs
  ```

- Result: expected discriminating FAIL. Both macOS jobs passed exact-head checkout, Node 24 setup,
  frozen dependency install, 15/15 contract tests, authenticated Node input download, target-native
  Node/`node-pty`/watcher assembly, deterministic archive inspection, and full tree hashing. Native
  smoke then timed out after 15 seconds waiting for watcher `create`; evidence upload correctly did
  not run. Both Linux jobs completed build, verification, smoke, and unpublished upload, but their
  cells remain provisional until the corrected exact-head matrix reruns.
- Duration and resource metrics: macOS arm64 job failed in 1m51s after a 54,699.324 ms artifact
  build; macOS x64 failed in 3m44s after a 105,665.482 ms artifact build. Each watcher wait settled
  at its declared 15-second bound. Peak memory and open-file counts were not recorded in the failed
  macOS smoke because no success payload was emitted.
- Artifact/log/trace link: run and job links above. The arm64 pre-smoke artifact had content ID
  `sha256:cc205af32168718f9662e8513338ad844ba4c1210c247623d84f92778afa1610` and archive hash
  `sha256:cd9cca6f56c9645a73b6b022515668ef7392c2eeb8f01d63b8a46b046cf337a3`;
  the x64 pre-smoke artifact had content ID
  `sha256:82a7017f6c1f703258a9d6b9f3d5ad4d5c57320f1b667fd87902cb1f4cd21cd3` and archive hash
  `sha256:88670165fcdf55236fb2a81d70566b913b39824362b5cf5f0136e646bf9c9b2c`.
- Oracle proved: the native matrix and exact-head provenance gates discriminate after successful
  builds; macOS FSEvents can report canonical `/private/var/...` paths while `tmpdir()` supplied the
  `/var/...` symlink spelling, so the equality oracle could reject the same filesystem object.
- Does not prove: a passing macOS watcher, upload, native trust/signing, oldest baseline, SSH,
  relay RPCs, Windows, or any enabled tuple. Successful Linux results from this failed aggregate do
  not satisfy the final corrected-head evidence requirement.
- Checklist items satisfied: red half of the macOS target-native watcher-smoke gate only; no tuple
  checkbox was changed.
- Follow-up: canonicalize the watched temporary directory before constructing expected event paths,
  retain bounded observed-event diagnostics, rerun all four jobs, and require every upload to pass.

### E-M3-CI-001 — Corrected four-tuple POSIX native artifact run

- Date: 2026-07-14
- Commit SHA / PR: exact draft-PR head `151628992f8d05d11902604650b3ed884992da5c` in
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Workflow: GitHub Actions run
  [29335399279](https://github.com/stablyai/orca/actions/runs/29335399279), conclusion `success`;
  no release asset was published
- Exact evidence commands:

  ```sh
  gh run view 29335399279 --repo stablyai/orca --json databaseId,headSha,status,conclusion,url,jobs
  gh run view 29335399279 --repo stablyai/orca --job <job-id> --log
  gh api --paginate repos/stablyai/orca/actions/runs/29335399279/artifacts
  gh api repos/stablyai/orca/actions/artifacts/<artifact-id>/zip
  unzip -p <downloaded-artifact.zip> '*.identity.json' | jq
  ```

- Native runner, artifact, identity, and resource results:

  | Tuple               | Job / requested runner / resolved image                                                                                                                | Artifact ID / Actions ZIP bytes | Runtime archive bytes / expanded bytes / files | Content ID / archive SHA-256                                                                                                            | Build / full verify / smoke / RSS                             |
  | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
  | `darwin-arm64`      | [87093265074](https://github.com/stablyai/orca/actions/runs/29335399279/job/87093265074); `macos-15`; `macos15` `20260706.0213.1`; native ARM64        | `8311761833`; 24,755,748        | 24,742,840 / 122,027,869 / 35                  | `16a9814a2af4adfbcce55ead3ab53f3982d8043d4b18d85762586212a481bdca` / `a7e31f92c1a0793b656f79ceff5fe63b7a1cf56a70394336a92c2ab207d30ea7` | 52,648.921 ms / 2,090.791 ms / 556.324 ms / 51,068,928 bytes  |
  | `darwin-x64`        | [87093265143](https://github.com/stablyai/orca/actions/runs/29335399279/job/87093265143); `macos-15-intel`; `macos15` `20260629.0276.1`; native X64    | `8311834044`; 26,420,360        | 26,405,780 / 124,316,655 / 35                  | `ad3a4cdaf25cd8f2657e348fca5c68df69923f9f50295afa2227a8c195e2014b` / `9b6c492b4fda250c6b6688e343499e79afc7ca53be355b1e687e61ed8430a759` | 108,328.464 ms / 1,956.297 ms / 325.008 ms / 40,546,304 bytes |
  | `linux-x64-glibc`   | [87093265139](https://github.com/stablyai/orca/actions/runs/29335399279/job/87093265139); `ubuntu-24.04`; `ubuntu24` `20260705.232.1`; native X64      | `8311766570`; 29,276,673        | 29,260,688 / 124,846,502 / 34                  | `960546cd96c67fcf9bb0a61e96ecdbecbffd9104d3a495578f8bb19dd810649a` / `b28fc4837d17399246926ab4d565e30f21b6adc6c22401910627e820aca7c52b` | 61,805.875 ms / 2,288.790 ms / 159.950 ms / 56,315,904 bytes  |
  | `linux-arm64-glibc` | [87093265142](https://github.com/stablyai/orca/actions/runs/29335399279/job/87093265142); `ubuntu-24.04-arm`; `ubuntu24` `20260706.52.2`; native ARM64 | `8311785832`; 28,215,447        | 28,200,600 / 122,865,172 / 34                  | `aa3aa8ae8b42334ba7b0dbe5c43fd1184e36b3f4f4a9bec0e990e9b78f090756` / `d73d03c0507408e538b93549d449359e78c986c45f1bd5811c15197720fc5da8` | 69,030.100 ms / 1,618.140 ms / 159.037 ms / 52,219,904 bytes  |

- Result: PASS. All four jobs checked out the exact source head, used Node v24.18.0, authenticated
  the pinned Node release metadata and tuple archive, used a frozen source install, passed 15/15
  focused contracts, assembled on the target-native architecture, verified the complete archive and
  unpacked tree before native execution, loaded the Orca-patched PTY addon, exercised a real PTY
  input/101×37 resize/exit-23 lifecycle, observed bounded create/update/rename/delete watcher events,
  and uploaded only an unpublished seven-day Actions artifact.
- Oracle proved: target-native build/provenance, bundled Node execution, patched native PTY load and
  lifecycle, watcher lifecycle, exact archive/tree equality, size bounds, and artifact-only workflow
  behavior for the four named POSIX tuples on the exact runner images above.
- Does not prove: deterministic native rebuilding. The local versus CI Linux arm64 runtime differed
  in the Orca-built `pty.node`, and the red versus corrected macOS runs produced different content
  identities despite no intended runtime-tree source change. The current jobs record image and
  toolchain versions but do not pin all apt/Homebrew/compiler inputs or compare two clean native
  builds on the same runner. This evidence also does not prove oldest OS/libc/kernel baselines,
  native signing/trust, Windows/ZIP, musl, SSH/SFTP/system-SSH transfer, relay RPC conformance,
  cancellation/file/channel peaks, release publication/read-back, cache, fallback, UI, or any
  enabled tuple.
- Checklist items satisfied: build/provenance, bundled Node, real patched PTY, and watcher cells for
  `linux-x64-glibc`, `linux-arm64-glibc`, `darwin-x64`, and `darwin-arm64` only. Oldest-baseline and
  native-trust cells remain unchecked.
- Follow-up: add a same-head/same-runner two-clean-build identity comparison, implement bounded
  deterministic Windows ZIP assembly and native Windows jobs, and leave all tuples disabled until
  the remaining trust, baseline, and two-layer live SSH gates pass.

### E-M3-REPRODUCIBILITY-LOCAL-001 — Bounded two-clean-build identity oracle

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `c70e96374cafb681c52b3d60e42322ba5a76791c` in stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741); native PR CI pending
- Runner: macOS 26.2 build 25C56 arm64, native; Node v26.0.0 and pnpm 10.24.0. Node v24.18.0 on
  each target-native GitHub runner remains the authoritative artifact environment.
- Remote and transport: none; synthetic output trees and parsed GitHub Actions workflow only
- Exact commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run typecheck
  pnpm exec oxlint config/scripts/ssh-relay-runtime-reproducibility.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-reproducibility.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff HEAD^ --check
  ```

- Result: PASS. The purpose-named comparator/workflow command passed 10/10 tests in 200 ms; the
  complete artifact set passed 40/40 tests across 11 suites in 1.09 seconds. Typecheck, focused
  oxlint, the 355-entry max-lines ratchet, full repository lint/reliability/localization, formatting,
  and exact-commit diff checks all exited zero. Full lint emitted only pre-existing warnings outside
  this package.
- Duration and resource metrics: purpose suite 0.87 seconds wall; full artifact suite 3.02 seconds;
  typecheck 8.47 seconds; focused oxlint 1.94 seconds; max-lines 4.95 seconds; full lint 26.34 seconds;
  formatting 5.56 seconds; diff check 90 ms. Comparator file reads are incremental, bounded to 250
  MiB per file and 500 MiB per output, with 6,000 entries, 512-byte paths, depth 40, a five-minute
  AbortSignal, and sequential tree walks. Peak RSS/open files were not instrumented for synthetic
  fixtures; native CI remains responsible for real artifact duration and size evidence.
- Artifact/log/trace link: exact source and test files in commit `c70e96374`; durable target-native
  run and job links pending
- Oracle proved: distinct real output roots are required; symlinks and special files reject before
  hashing; complete runtime/archive/identity/SPDX/provenance output is mandatory; archive bytes must
  match their identity; any path type, mode, size, or SHA-256 drift fails closed. Both POSIX and
  Windows jobs build and independently verify/smoke two exclusive outputs, compare only afterward,
  and copy/upload only the first verified equal output. The workflow retains read-only permissions,
  exact-head checkout, SHA-pinned actions, explicit runner labels, and no release publication path.
- Does not prove: any real native build is reproducible, Node v24 execution, compiler/linker
  determinism, Linux/macOS/Windows output equality, oldest baselines, native trust/signing, SSH,
  publication, transfer, cache, fallback, UI, or an enabled tuple.
- Checklist items satisfied: purpose-named local reproducibility/workflow command and exact-commit
  static handoff only; no per-tuple or native-trust checkbox changes.
- Follow-up: push the exact head, run all six native jobs, and record the exact differing path/field
  for every red result before correcting producer nondeterminism without weakening this oracle.

### E-M3-REPRODUCIBILITY-CI-RED-001 — First native clean-build comparison

- Date: 2026-07-14
- Commit SHA / PR: exact head `09b047f4eee224b45ca337b46b8402016290a1a9` in stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29347236627](https://github.com/stablyai/orca/actions/runs/29347236627);
  Linux x64 `87134028593`, Linux arm64 `87134028669`, macOS arm64 `87134028547`, macOS x64
  `87134028651`, Windows x64 `87134028652`, Windows arm64 `87134028632`
- Runners: `ubuntu-24.04` x64, `ubuntu-24.04-arm` arm64, `macos-15-intel` x64,
  `macos-15` arm64, `windows-2022` x64, and `windows-11-arm` arm64; Node v24.18.0. The macOS
  arm64 failure ran on macOS 15.7.7 image `20260706.0213.1`; the x64 failure ran on macOS 15.7.7
  image `20260629.0276.1`. Both used Xcode 16.4 build 16F6.
- Remote and transport: none; GitHub-hosted target-native artifact jobs only
- Exact evidence commands:

  ```sh
  gh run view 29347236627 --repo stablyai/orca \
    --json databaseId,headSha,status,conclusion,url,jobs
  gh api -H 'Accept: application/vnd.github+json' \
    repos/stablyai/orca/actions/jobs/<completed-job-id>/logs
  ```

- Result: Linux x64 and arm64 independently built, verified, smoked, compared equal, and uploaded
  unpublished evidence. macOS arm64 independently verified and smoked both outputs but failed the
  equality gate: content IDs were
  `sha256:f1bbc1de26d6e9aae3899754c4ac4aea694ad9f5197fcf1c773e29fc50401129` and
  `sha256:c26eba0226e73542a0cd7aec0ca5fa7e3809051453e40095e47fe9d154ba944f`; archive
  digests/sizes were
  `sha256:9cd56317ff03eb4e89a811e46736dc7558e447b9f0cd2d7e20fdeb5e5c40114a` /
  24,714,656 bytes and
  `sha256:cde8fa92470fdf73ec02e8e6ebbf23417e43d98b465fa9c6bdea4373be8c3e84` /
  24,714,700 bytes. macOS x64 likewise failed with content IDs
  `sha256:b71d7d50bba78b6cf9e6dc24b006d48c709a784c7eb77f500e86ab5fe692690b` and
  `sha256:ceae81924c97c917855af864239b87a7d2eecc28de7d00c21c32c47c5385354f`;
  archive digests/sizes were
  `sha256:01f7d4c6d54241e211c5063b89e92a3511433b18a50cb643bbfbe0384546a50e` /
  26,384,540 bytes and
  `sha256:f98dfdead87f4884382fedc3e3bff0197a3b2aa6981c38107e198cb38e8bdf67` /
  26,384,576 bytes. The committed comparator first reported identity SHA-256 drift on both macOS
  architectures. Windows x64 and arm64 stopped before downloading Node inputs or building artifacts
  because Vitest collected zero comparator tests with `SyntaxError: Invalid or unexpected token`;
  the other 10 suites passed with 31 tests passed and one skipped.
- Duration and resource metrics: Linux build/compare steps completed in 125 seconds (x64) and 131
  seconds (arm64); macOS arm64 failed after 123 seconds in the build/compare step. Windows contract
  suites completed in 1.54 seconds on arm64 and before artifact assembly on both architectures.
  Peak RSS, file/channel counts, and cancellation settlement were not instrumented by this gate.
- Artifact/log/trace link: run and job links above. The two Linux evidence artifacts are unpublished;
  failed cells uploaded no runtime artifact.
- Oracle proved: the equality gate accepts both Linux glibc tuples and detects real macOS
  clean-build drift; Windows contract collection fails before unverified artifact work can start.
  No asset was published and no production or default path changed.
- Does not prove: Windows parser correction, macOS producer determinism, oldest baselines, native
  trust/signing, SSH, SFTP/system-SSH, release publication, resolver/cache,
  transfer/install, fallback, UI, or any enabled tuple.
- Checklist items satisfied: none newly complete; native reproducibility remains open.
- Follow-up: remove the comparator shebang, add explicit native `node --check` gates, report
  runtime-tree drift before derived metadata, rerun all six jobs, and correct the macOS producer only
  after the exact differing runtime file is identified. Never ignore or normalize unequal bytes in
  the comparator.

### E-M3-REPRODUCIBILITY-DIAGNOSTIC-LOCAL-001 — Windows parser and runtime-first drift diagnostics

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `e58913d1a571f4c578a7fe1dc51ef5c93e9b3136` in stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: macOS 26.2 build 25C56 arm64, native; Node v26.0.0 and pnpm 10.24.0. Node v24.18.0
  target-native GitHub execution remains pending.
- Remote and transport: none; local synthetic comparator fixtures and workflow source contract only
- Exact commands:

  ```sh
  node --check config/scripts/ssh-relay-runtime-reproducibility.mjs
  node --check config/scripts/ssh-relay-runtime-reproducibility.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run typecheck
  pnpm exec oxlint config/scripts/ssh-relay-runtime-reproducibility.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-reproducibility.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Result: PASS. Both new files passed `node --check`; the purpose suite passed 11/11 tests; the
  complete artifact set passed 41/41 tests across 11 suites. Typecheck, focused oxlint, the
  355-entry max-lines ratchet, full repository lint/reliability/localization, formatting, and diff
  checks exited zero. Full lint emitted only pre-existing warnings outside this package.
- Duration and resource metrics: syntax checks 60 ms and 50 ms; purpose suite 850 ms wall; complete
  artifact suite 1.27 seconds wall; typecheck 2.00 seconds; focused oxlint 480 ms; max-lines 780 ms;
  full lint 11.96 seconds. Synthetic fixture peak RSS/open files were not instrumented.
- Artifact/log/trace link: exact sources in commit `e58913d1a`; target-native rerun pending
- Oracle proved: the comparator and its test import parse locally without the shebang; both POSIX
  and Windows workflow contract stages run explicit syntax checks before Vitest or artifact inputs;
  a simultaneous runtime/identity drift reports the runtime-tree path first. The comparator still
  compares every byte and does not normalize or ignore drift.
- Does not prove: Windows x64/arm64 parsing, any native build, the differing macOS runtime path,
  macOS determinism, oldest baselines, native trust, SSH, publication, transfer, fallback, UI, or an
  enabled tuple.
- Checklist items satisfied: no native or tuple box; this closes only the local diagnostic
  correction required after E-M3-REPRODUCIBILITY-CI-RED-001.
- Follow-up: push the exact commit, rerun all six native jobs, require both Windows syntax checks to
  pass, and use the macOS runtime-first failure path to correct producer nondeterminism.

### E-M3-REPRODUCIBILITY-DIAGNOSTIC-CI-RED-001 — Native drift paths isolated on all six runners

- Date: 2026-07-14
- Commit SHA / PR: exact head `c62b0d0a9580b132fec5f11c3234a983503a011c`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29348424235](https://github.com/stablyai/orca/actions/runs/29348424235),
  conclusion `failure`; Linux x64 `87138091964`, Linux arm64 `87138091995`, macOS arm64
  `87138091994`, macOS x64 `87138092013`, Windows x64 `87138091948`, and Windows arm64
  `87138091977`
- Runners: `ubuntu-24.04` x64 image `20260705.232.1`, `ubuntu-24.04-arm` arm64 image
  `20260706.52.2`, `macos-15` arm64 image `20260706.0213.1`, `macos-15-intel` x64 image
  `20260629.0276.1`, `windows-2022` x64 image `20260706.237.1`, and `windows-11-arm` arm64
  image `20260706.102.1`; all native and using Node v24.18.0
- Remote and transport: none; target-native artifact assembly/execution and unpublished Actions
  artifact upload only
- Exact evidence commands:

  ```sh
  gh run view 29348424235 --repo stablyai/orca \
    --json databaseId,headSha,status,conclusion,url,createdAt,updatedAt,jobs
  gh api -H 'Accept: application/vnd.github+json' \
    repos/stablyai/orca/actions/jobs/<job-id>/logs
  ```

- Result: FAIL as an evidence-producing native gate. Every POSIX runner passed 41/41 contracts;
  Windows passed 38 and skipped three POSIX-only tests. Linux x64 and arm64 built, verified,
  smoked, compared exactly, and uploaded unpublished artifacts `8317161547` and `8317164595`.
  macOS arm64 first differed at
  `runtime/node_modules/node-pty/build/Release/pty.node`, with content IDs
  `sha256:206de506d0499ded3c16913e28f76c528f5bead5214e6675ee4a5ee6bb0a642c` and
  `sha256:68e23c3608b3d3bc95d591e6f99a5126ab6a6b0066c84c8340f4bc4195e64ac8`;
  macOS x64 differed at the same path with
  `sha256:eda4590b97d003f9a94fb59595a84273f3660fb920d85ff699c9d7925c52a7a2` and
  `sha256:701b4310acbeb1f7340d50b554cfe65e2802c5346aca0036aae4ebb3f974becf`.
  Windows x64 first differed at
  `runtime/node_modules/node-pty/build/Release/conpty_console_list.node`, with content IDs
  `sha256:df55ffd5a5614a61e5fd2ae8cd990f28b84b9a0d557df861989c92b9e66652eb` and
  `sha256:1bbf496013af3d0172a275ba48dcb1a054aeb1b17261b606ecdd4c2dd3ce95fb`;
  Windows arm64 differed at the same path with
  `sha256:4d93459ffefb8f8b8250c6b0267e34f04a9ac5b5f99b60671f484fb34054519a` and
  `sha256:844c6f07a92ed3602af74bba92c8c98047313b97080b668aeb0b3a51ef7d2db8`.
- Duration and resource metrics: build/compare steps were 138 seconds for Linux x64, 132 seconds
  for Linux arm64, 100 seconds for macOS arm64, 301 seconds for macOS x64, 296 seconds for Windows
  x64, and 285 seconds for Windows arm64. Both builds in every failing cell completed bundled
  Node/native PTY/watcher smoke before comparison. Smoke RSS ranged from 40,615,936 to 53,633,024
  bytes in failing cells. Peak build RSS, open files/channels, and cancellation settlement were not
  instrumented by this gate.
- Artifact/log/trace link: run/job links above; Linux x64 upload
  [8317161547](https://github.com/stablyai/orca/actions/runs/29348424235/artifacts/8317161547) and
  Linux arm64 upload
  [8317164595](https://github.com/stablyai/orca/actions/runs/29348424235/artifacts/8317164595);
  failing cells correctly uploaded nothing
- Oracle proved: the parser and runtime-first diagnostic corrections execute on all native runner
  families; Linux reproducibility remains green; macOS and Windows drift is inside native node-pty
  outputs rather than archive/identity derivation; rejected cells cannot upload or publish bytes.
- Does not prove: either linker correction, macOS/Windows equality, cross-run identity, oldest
  baselines, native trust/signing, SSH, transfer, publication, resolver/cache, fallback, UI, or an
  enabled tuple.
- Checklist items satisfied: no new completion checkbox; this closes only the diagnostic run and
  identifies the bounded producer corrections required next.
- Follow-up: retain the complete-output comparator, correct native producers without post-build
  normalization, and require a new same-head six-runner pass before advancing.

### E-M3-REPRODUCIBILITY-LINKER-LOCAL-001 — Canonical work path and native linker correction

- Date: 2026-07-14
- Commit SHA / PR: implementation `a09b02ec4e623cc8cac8ece089e4ff734014dd5b`; canonical-path
  follow-up `3e433b3438e8e1aa11d2728e3f2258996b3d37f2`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741), push/native CI pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; local test/static process Node v26.0.0
  and pnpm 10.24.0; native harness used official bundled Node v24.18.0, node-gyp 12.3.0,
  Apple Clang/make, and Python 3.13.5
- Remote and transport: none; exact Node archive downloaded over HTTPS, then local native builds;
  no SSH, publication, or production consumer
- Exact commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint \
    config/scripts/build-ssh-relay-runtime.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check \
    .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/build-ssh-relay-runtime.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  git diff HEAD --check
  ```

  The native oracle downloaded `node-v24.18.0-darwin-arm64.tar.xz`, twice extracted it under the
  fixed exclusive `/tmp/orca-ssh-relay-runtime-build-work/node-inputs` path, called
  `buildPatchedSshRelayNodePty` twice with the same clean `node-pty` path, compared both outputs,
  required one `LC_UUID` from `otool -l`, and then repeated the build in a separate process session
  against the prior hashes.

- Result: PASS locally. The focused command passed 8/8 tests; all 14 artifact suites passed 47/47.
  Typecheck, focused oxlint, the 355-entry max-lines ratchet, full repository
  lint/reliability/localization, formatting, syntax, and diff gates exited zero. Full lint emitted
  only pre-existing out-of-package warnings. Two clean native passes and the separate repeat session
  produced byte-identical outputs: `pty.node` was 83,256 bytes with SHA-256
  `e73f80560b8ecc0ae19421fc82fb612e4f50e66f17dfd491cdf95599bc7b685a`, and
  `spawn-helper` was 50,192 bytes with SHA-256
  `3396961b0f8f9cdb0fcd2155eb54035276ee7ee2813d84faa1dfae5ba84dc95d`.
  Each retained exactly one `LC_UUID`, and every `buildPatchedSshRelayNodePty` call completed its
  bundled-Node native-load oracle. A separate `-Wl,-no_uuid` diagnostic made bytes equal but caused
  bundled Node/dlopen to reject `pty.node` with `missing LC_UUID load command`; that approach was
  discarded and is not present in the implementation.
- Duration and resource metrics: focused tests 229 ms; exact-head full artifact suite 1.35 seconds;
  parallel static gate 11.5 seconds; two-pass canonical native harness 11.126 seconds; separate
  repeat native build 2.511 seconds excluding archive download/extraction. Native harness peak RSS,
  file counts, and cancellation settlement were not instrumented.
- Artifact/log/trace link: exact source commits and local command output; no artifact was published
- Oracle proved: output/work overlap rejects; both paths are exclusive; a caller-provided canonical
  work path is reused cleanly and safely; macOS configures then links with `-Wl,-reproducible`
  without deleting `LC_UUID`; copied Windows `binding.gyp` receives exactly one `/Brepro` and source
  drift fails closed; Linux and legacy/repository-wide node-pty behavior are unchanged; both native
  workflow families use the same canonical runner-local path while retaining run-scoped outputs.
- Does not prove: native Windows `/Brepro` behavior, macOS x64, GitHub-hosted equality, different
  runner-image/toolchain revisions, oldest baselines, native signatures/trust, SSH, transfer,
  publication, resolver/cache, fallback, UI, or any enabled tuple.
- Checklist items satisfied: exact-head local linker/work-path contracts and macOS arm64 native
  correction only; native reproducibility remains open until all six jobs pass together.
- Follow-up: push `3e433b343`, run all six target-native jobs, and require complete equality plus
  upload in each cell without weakening the comparator.

### E-M3-REPRODUCIBILITY-LINKER-CI-RED-001 — POSIX equality and Windows builder parser boundary

- Date: 2026-07-14
- Commit SHA / PR: exact head `54df2cb998ae564c1a19cf32a8c93bf28770d07a`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29350639822](https://github.com/stablyai/orca/actions/runs/29350639822),
  conclusion `failure`; Linux x64 `87145674443`, Linux arm64 `87145674440`, macOS arm64
  `87145674422`, macOS x64 `87145674490`, Windows x64 `87145674413`, and Windows arm64
  `87145674455`
- Runners: `ubuntu-24.04` x64 image `20260705.232.1`, `ubuntu-24.04-arm` arm64 image
  `20260706.52.2`, `macos-15` arm64 image `20260706.0213.1`, `macos-15-intel` x64 image
  `20260629.0276.1`, `windows-2022` x64 image `20260706.237.1`, and `windows-11-arm` arm64
  image `20260706.102.1`; all native, runner `2.335.1`, provisioner `20260624.560`, and Node
  v24.18.0. Windows x64 was Server 2022 build 20348; arm64 was Windows Enterprise build 26200.
- Remote and transport: none; target-native artifact assembly/execution and unpublished Actions
  artifact upload only
- Exact evidence commands:

  ```sh
  gh run view 29350639822 --repo stablyai/orca \
    --json databaseId,headSha,headBranch,status,conclusion,url,createdAt,updatedAt,jobs
  gh api repos/stablyai/orca/actions/jobs/<job-id>/logs
  gh api 'repos/stablyai/orca/actions/runs/29350639822/artifacts?per_page=100'
  ```

- Result: FAIL as an evidence-producing six-runner gate. Linux x64/arm64 and macOS x64/arm64 each
  passed 47/47 contracts, authenticated exact Node inputs, performed two exclusive native builds,
  fully inspected and smoked both outputs, compared the runtime tree/archive/identity/SPDX/
  provenance byte-for-byte, and uploaded only the first equal output. Windows x64/arm64 each passed
  42 tests and skipped three POSIX-only tests across 13 suites, then failed while collecting
  `ssh-relay-runtime-build.test.mjs` with `SyntaxError: Invalid or unexpected token`: that test
  imports `build-ssh-relay-runtime.mjs`, whose first line was an unused Unix shebang. Input download,
  native build, verification, comparison, and upload were all skipped on both Windows jobs.
- Equal-output and upload details:

  | Tuple               | Content ID / runtime archive SHA-256                                                                                                    | Archive / expanded / files    | Build 1 / build 2 / max smoke RSS     | Actions artifact                                                                                               |
  | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
  | `linux-x64-glibc`   | `960546cd96c67fcf9bb0a61e96ecdbecbffd9104d3a495578f8bb19dd810649a` / `1881a082b5c8ab1caf28801e42a8f62601b0275096ec67468498d1a370c4af3b` | 29,266,692 / 124,846,502 / 34 | 67,504 / 65,510 ms / 56,438,784 bytes | [8318063540](https://github.com/stablyai/orca/actions/runs/29350639822/artifacts/8318063540), 29,282,697 bytes |
  | `linux-arm64-glibc` | `aa3aa8ae8b42334ba7b0dbe5c43fd1184e36b3f4f4a9bec0e990e9b78f090756` / `909a8f69acf9edb294e5d74b4323adc399821e049f0cba933206621f75c3effe` | 28,197,220 / 122,865,172 / 34 | 67,457 / 65,054 ms / 52,596,736 bytes | [8318072302](https://github.com/stablyai/orca/actions/runs/29350639822/artifacts/8318072302), 28,212,074 bytes |
  | `darwin-arm64`      | `40ff5d2036784b794e7b09f78596409f63f3145280c530bece5280d40897f6cb` / `132b0b6b3ecd4386ecf72119a950334f54ec34fe46e51c4f871d8c7878247775` | 24,736,104 / 122,027,869 / 35 | 55,320 / 52,391 ms / 51,658,752 bytes | [8318052438](https://github.com/stablyai/orca/actions/runs/29350639822/artifacts/8318052438), 24,749,047 bytes |
  | `darwin-x64`        | `585ea6034cdd07487d8667059f975a877c795a45dc0d6eeee1617f2e3749faa2` / `b47ed8b464989b1638a2024ac5980a45a494ff33f9a3dbe648c8f7974efb1e33` | 26,373,464 / 124,316,655 / 35 | 88,815 / 78,961 ms / 40,665,088 bytes | [8318098409](https://github.com/stablyai/orca/actions/runs/29350639822/artifacts/8318098409), 26,388,039 bytes |

- Duration and resource metrics: total jobs were 3m12s Linux x64, 3m28s Linux arm64, 2m50s macOS
  arm64, 4m28s macOS x64, 1m19s Windows x64, and 3m42s Windows arm64. Windows contract collection
  took 1.97s and 2.76s. POSIX comparison scanned 54/55 entries and 146.8–154.1 MB in 285–895 ms.
  Build peak RSS, open files/channels, and cancellation settlement were not instrumented.
- Artifact/log/trace link: run/job links and four unpublished seven-day artifacts above; Windows
  correctly produced no artifact
- Oracle proved: the canonical clean-work directory plus `-Wl,-reproducible` makes both native
  macOS architectures byte-identical while retaining successful bundled-Node/native PTY/watcher
  execution; both Linux controls remain equal; failed contract collection prevents Windows inputs,
  execution, and upload. The parser boundary is the imported builder shebang, not `/Brepro` output.
- Does not prove: Windows builder parsing after correction, native `/Brepro` equality, a six-job
  pass, cross-run identity, oldest baselines, native trust/signing, SSH, transfer, publication,
  resolver/cache, fallback, UI, or an enabled tuple.
- Checklist items satisfied: native macOS linker reproducibility evidence only; native
  reproducibility remains open until all six same-head jobs pass together.
- Follow-up: remove only the unused builder shebang, syntax-check the builder and its test on POSIX
  and Windows before Vitest, rerun local gates, then require a new six-runner exact-head pass.

### E-M3-REPRODUCIBILITY-BUILDER-PARSER-LOCAL-001 — Imported builder parser correction

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `f864d3fa6df7a938e509c7622604e2fd2bd85493`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741), push/native CI pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. The
  repository requires Node 24, so the new target-native run remains authoritative for Windows.
- Remote and transport: none; local syntax, contract, and repository static gates only
- Exact commands:

  ```sh
  node --check config/scripts/build-ssh-relay-runtime.mjs
  node --check config/scripts/ssh-relay-runtime-build.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint config/scripts/build-ssh-relay-runtime.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    .github/workflows/ssh-relay-runtime-artifacts.yml
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/build-ssh-relay-runtime.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  git diff HEAD --check
  ```

- Result: PASS at the exact implementation commit. Both syntax checks exited zero; all 14 artifact
  suites passed 47/47 tests. Typecheck, focused oxlint, the 355-entry max-lines ratchet, full
  repository lint/reliability/localization, formatting, and exact-head diff checks exited zero.
  Full lint emitted only pre-existing warnings outside this package.
- Duration and resource metrics: full artifact command 3.08s wall; typecheck 3.30s; focused oxlint
  0.49s; max-lines 0.76s; full lint 12.79s. Synthetic test peak RSS, open files/channels, and
  cancellation settlement were not instrumented.
- Artifact/log/trace link: exact commit and local command output; no runtime artifact was produced
- Oracle proved: the builder and importing test parse after removing only the unused shebang; every
  real builder invocation remains explicitly through `node`; both workflow families syntax-check
  the builder and test before Vitest or Node input download; workflow source contracts require both
  POSIX and Windows checks without changing permissions, artifact scope, or production behavior.
- Does not prove: native Windows parsing, Node 24 behavior, `/Brepro` output equality, any native
  build, oldest baselines, native trust, SSH, transfer, publication, resolver/cache, fallback, UI,
  or an enabled tuple.
- Checklist items satisfied: exact local builder parser/syntax-gate correction only; no native or
  tuple checkbox.
- Follow-up: push the exact commit and require all six target-native jobs to pass together before
  closing native reproducibility.

### E-M3-REPRODUCIBILITY-WINDOWS-ARM64-CI-RED-001 — Native arm64 residual binary drift

- Date: 2026-07-14
- Commit SHA / PR: exact head `de541efd11989d2e6dce0402307912afffae3510`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29351557922](https://github.com/stablyai/orca/actions/runs/29351557922),
  conclusion `failure`; Linux arm64 `87148758201`, Linux x64 `87148758213`, Windows x64
  `87148758259`, macOS arm64 `87148758282`, macOS x64 `87148758287`, and failing Windows arm64
  `87148758290`
- Runners: `ubuntu-24.04-arm` image `20260706.52.2`, `ubuntu-24.04` image `20260705.232.1`,
  `windows-2022` image `20260706.237.1`, `macos-15-arm64` image `20260706.0213.1`, `macos-15`
  image `20260629.0276.1`, and `windows-11-arm64` image `20260706.102.1`; all native, runner
  `2.335.1`, provisioner `20260624.560`, and Node v24.18.0
- Remote and transport: none; target-native artifact assembly/execution and unpublished Actions
  artifact upload only
- Exact evidence commands:

  ```sh
  gh run view 29351557922 --repo stablyai/orca \
    --json databaseId,headSha,headBranch,status,conclusion,url,createdAt,updatedAt,jobs
  gh api repos/stablyai/orca/actions/jobs/<job-id>/logs
  gh api 'repos/stablyai/orca/actions/runs/29351557922/artifacts?per_page=100'
  ```

- Result: FAIL as a six-runner reproducibility gate. All six jobs passed the builder/test syntax
  checks and artifact contracts, authenticated the exact Node inputs, and completed two native
  builds. Linux x64/arm64, macOS x64/arm64, and Windows x64 inspected and smoked both outputs,
  compared every runtime/archive/identity/SPDX/provenance entry exactly, and uploaded only after
  equality. Windows arm64 also inspected and smoked both complete 60-entry, 42-file, 86,189,895-byte
  outputs, including PTY input/resize/exit, watcher lifecycle, and resource settlement, but the
  comparator first found SHA-256 drift at
  `runtime/node_modules/node-pty/build/Release/conpty_console_list.node`; no arm64 artifact uploaded.
- Equal-output artifacts: Linux x64 `8318426445` (29,283,624 bytes), Linux arm64 `8318449064`
  (28,212,246 bytes), macOS arm64 `8318457230` (24,710,997 bytes), Windows x64 `8318478579`
  (37,075,312 bytes), and macOS x64 `8318524353` (26,365,330 bytes), all unpublished seven-day
  Actions artifacts. Their runtime content IDs are respectively `960546cd96c6`, `aa3aa8ae8b42`,
  `40ff5d203678`, `2a6bfa06b445`, and `585ea6034cdd` (prefixes shown; full values remain in logs).
- Windows arm64 drift details: build one content ID `58afdfbe6b3e48ee1a46bcb09f20a9c7d4d6fe25bdf346e82038fa0a2211ea86`,
  archive 33,261,552 bytes with SHA-256 `0277fa35bb1ec644a509e3068bf120294c99484ac3638fdd352ae386f83bdd2f`;
  build two content ID `6e64071c12f58b0f73a34339c6f1f1dac725d852224537c32d2c87f8e587bdb9`,
  archive 33,261,545 bytes with SHA-256 `234aa56026009c91abdfa37abae484723a39f027f8afa00760afc784a3ecfd05`.
- Duration and resource metrics: jobs were 3m43s Linux arm64, 2m57s Linux x64, 4m54s Windows x64,
  4m7s macOS arm64, 6m34s macOS x64, and 10m37s Windows arm64. Windows arm64 native builds took
  152,711 ms and 132,480 ms; smoke took 5,845 ms and 5,408 ms at 53,018,624 and 51,732,480 bytes
  RSS. Build peak RSS, open files/channels, and cancellation settlement were not instrumented.
- Oracle proved: the parser correction works natively on both Windows architectures; `/Brepro`
  yields complete equality on Windows x64; all four POSIX controls remain equal; a native arm64
  residual is isolated to the copied node-pty `conpty_console_list.node`; mismatch prevents upload.
- Does not prove: the differing byte region or PE field, a Windows arm64 correction, all-six
  equality, cross-run identity, oldest baselines, native trust/signing, SSH, transfer, publication,
  resolver/cache, fallback, UI, or an enabled tuple.
- Checklist items satisfied: native parser boundary and five same-head reproducibility cells only;
  native reproducibility remains open.
- Follow-up: add a bounded PE-diff diagnostic for the two Windows arm64 binaries, record byte ranges
  and headers, then correct only the copied artifact build if evidence identifies a safe source.
  Do not weaken comparison, upload failed outputs, or change repository-wide/legacy node-pty.

### E-M3-REPRODUCIBILITY-WINDOWS-ARM64-REPEAT-CI-RED-001 — Independent repeat of arm64-only drift

- Date: 2026-07-14
- Commit SHA / PR: documentation-only exact head `a7151f9750fd9bfcdcff8c01c1fd6caff2e6116a`;
  implementation bytes remain `de541efd11989d2e6dce0402307912afffae3510`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29352510414](https://github.com/stablyai/orca/actions/runs/29352510414),
  conclusion `failure`; Linux x64 `87151980265`, Linux arm64 `87151980298`, macOS arm64
  `87151980396`, macOS x64 `87151980327`, Windows x64 `87151980324`, and failing Windows arm64
  `87151980264`
- Runners: the same six native labels/toolchain family recorded in
  E-M3-REPRODUCIBILITY-WINDOWS-ARM64-CI-RED-001. The failing cell was Windows 11 Enterprise
  10.0.26200 arm64, image `windows-11-arm64` `20260706.102.1`, runner `2.335.1`, provisioner
  `20260624.560`, Node v24.18.0, MSVC 19.44.35228 / tools 14.44.35207, Windows SDK 10.0.26100.0,
  and Python 3.13.14.
- Remote and transport: none; independent target-native artifact assembly/execution and unpublished
  Actions artifact upload only
- Exact evidence commands:

  ```sh
  gh run view 29352510414 --repo stablyai/orca \
    --json databaseId,headSha,status,conclusion,url,updatedAt,jobs
  gh api repos/stablyai/orca/actions/jobs/87151980264/logs
  gh api 'repos/stablyai/orca/actions/runs/29352510414/artifacts?per_page=100'
  ```

- Result: FAIL as expected at the unchanged native boundary. All 14 contract suites passed on
  Windows arm64 with 44 tests passed and three POSIX-only skips. Linux x64/arm64, macOS x64/arm64,
  and Windows x64 independently built twice, inspected, smoked, compared exactly, and uploaded
  unpublished artifacts `8318818618`, `8318833832`, `8318812505`, `8318846378`, and `8318866333`.
  Windows arm64 again built, inspected, and smoked two complete 60-entry, 42-file,
  86,189,895-byte outputs, then first differed at
  `runtime/node_modules/node-pty/build/Release/conpty_console_list.node`; upload was skipped.
- Windows arm64 rejected outputs: first content ID
  `e13f39ae96eba36c3ed41054da7429533e2eebbdd7d845a712d802d002906bc8`, ZIP 33,261,548 bytes
  with SHA-256 `ca1be18b572e353ac2eb3a390d91e5d0acb93100735f387ce74300cb48ba39d1`;
  second content ID `4989a282c6529df6066aefbb5667ca96777907d54f1d9a48041f8ff98555b9c0`,
  ZIP 33,261,548 bytes with SHA-256
  `e91664074aa2f434ea0e2603596410c119b89b2a4a4d7eab453bfb7407ff91d0`.
- Duration and resource metrics: jobs completed in 3m9s Linux x64, 3m39s Linux arm64, 2m56s macOS
  arm64, 4m9s macOS x64, 4m53s Windows x64, and 8m48s Windows arm64. Arm64 native builds took
  145,700 ms and 124,010 ms; smoke took 6,042 ms and 5,564 ms at 53,075,968 and 52,977,664 bytes
  RSS. Build peak RSS, open files/channels, and cancellation settlement were not instrumented.
- Artifact/log/trace link: run/job above and the five unpublished seven-day artifacts; no failed
  arm64 bytes were uploaded
- Oracle proved: the Windows arm64 difference repeats across an independent run while the same-head
  Windows x64 and four POSIX controls remain reproducible; the strict gate consistently prevents a
  rejected output from upload. The drift is not a transient failure from run 29351557922.
- Does not prove: differing PE byte ranges/headers, a producer correction, arm64 equality,
  cross-run equality, oldest baselines, native trust/signing, SSH, publication, transfer, fallback,
  UI, or any enabled tuple.
- Checklist items satisfied: no new completion checkbox; this repeat evidence justifies the bounded
  PE diagnostic before any producer change.
- Follow-up: run the bounded diagnostic on both native Windows runners, require x64 to remain equal,
  and use only the rejected arm64 headers/ranges to choose or reject a copied-artifact correction.

### E-M3-WINDOWS-PE-DIAGNOSTIC-LOCAL-001 — Bounded rejected-binary diagnostics

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `39ee3451b8cc38b5311a0cb1085ad48a1f302185`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741), push/native execution pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. The
  repository requires Node 24, so target-native Windows jobs remain authoritative.
- Remote and transport: none; synthetic PE32+ arm64 fixtures and workflow source contracts only
- Exact commands:

  ```sh
  node --check config/scripts/ssh-relay-runtime-windows-pe-diagnostic.mjs
  node --check config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint config/scripts/ssh-relay-runtime-windows-pe-diagnostic.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Result: PASS at the exact implementation commit. Both syntax checks exited zero; the purpose
  command passed 5/5 tests across two suites; all 15 artifact suites passed 50/50 tests. Typecheck,
  focused oxlint, the 355-entry max-lines ratchet, full repository
  lint/reliability/localization, formatting, staged hooks, and diff checks exited zero. Full lint
  emitted only pre-existing warnings outside this package.
- Duration and resource metrics: syntax checks 50 ms and 40 ms; purpose suite 142 ms Vitest / 0.76s
  wall; complete artifact suite 470 ms Vitest / 1.15s wall; typecheck 2.68s; focused oxlint 0.69s;
  max-lines 1.58s; full lint 11.92s; formatting check 1.82s. The implementation rejects inputs over
  64 MiB, reads in 64 KiB chunks, caps the header at 1 MiB, the section/debug tables at 96/32
  entries, byte/header differences at 128 each, and the whole diagnostic at 60 seconds. Synthetic
  peak RSS/open files were not instrumented.
- Artifact/log/trace link: exact source commit; no binary artifact was created or uploaded
- Oracle proved: valid PE32+ fixtures report whole-file sizes/SHA-256, coalesced file-offset ranges,
  COFF/optional/data-directory/section/debug headers, and hashed—not printed—CodeView paths;
  oversized, malformed, same-file, unknown-argument, and pre-aborted inputs fail boundedly. Workflow
  contracts require diagnostic syntax/tests on Windows, invoke it only after the strict comparator
  rejects the two retained `conpty_console_list.node` files, throw afterward, and leave evidence
  copying unreachable, so rejected binaries are not uploaded. No max-lines bypass was added.
- Does not prove: parsing the real x64/arm64 linker outputs, native Node 24 behavior, the actual
  differing ranges/headers, x64 equality after the workflow change, a producer correction, arm64
  equality, oldest baselines, native trust, SSH, publication, transfer, fallback, UI, or an enabled
  tuple.
- Checklist items satisfied: local bounded diagnostic and fail-closed workflow ordering only; no
  native, tuple, or production checkbox.
- Follow-up: push the exact implementation, require native x64 equality and arm64 diagnostic output
  with no upload, then record the exact PE evidence before changing the producer.

### E-M3-WINDOWS-PE-DIAGNOSTIC-CI-RED-001 — Real arm64 PE drift with x64 control

- Date: 2026-07-14
- Commit SHA / PR: exact documentation head `27c6a5718c544cd3f559d6adc24cc0beca2ed59e`,
  containing diagnostic implementation `39ee3451b8cc38b5311a0cb1085ad48a1f302185`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29353432240](https://github.com/stablyai/orca/actions/runs/29353432240),
  conclusion `failure`; Windows arm64 `87155072734`, macOS x64 `87155072752`, Linux x64
  `87155072794`, macOS arm64 `87155072820`, Linux arm64 `87155072837`, and Windows x64
  `87155072849`
- Runners: the six target-native labels recorded in prior reproducibility evidence. The diagnostic
  cell was Windows 11 Enterprise 10.0.26200 arm64, image `windows-11-arm64` `20260706.102.1`,
  runner `2.335.1`, provisioner `20260624.560`, Node v24.18.0, MSVC 19.44.35228 / tools
  14.44.35207, Windows SDK 10.0.26100.0, and Python 3.13.14.
- Remote and transport: none; target-native artifact assembly/execution, rejected-file diagnostics,
  and unpublished Actions artifact upload only
- Exact evidence commands:

  ```sh
  gh run view 29353432240 --repo stablyai/orca \
    --json headSha,status,conclusion,url,createdAt,updatedAt,jobs
  gh api repos/stablyai/orca/actions/jobs/87155072734/logs
  gh api 'repos/stablyai/orca/actions/runs/29353432240/artifacts?per_page=100'
  ```

- Result: FAIL as the intended evidence-producing gate. Both Windows jobs passed 15 suites with 47
  tests passed and three POSIX-only skips, including native Node 24 execution of the new diagnostic
  contracts. Linux x64/arm64, macOS x64/arm64, and Windows x64 built twice, inspected, smoked,
  compared exactly, and uploaded unpublished artifacts `8319201464`, `8319207054`, `8319191783`,
  `8319227039`, and `8319248077`. Windows x64 therefore proves the diagnostic package does not
  disturb the successful comparator/upload path. Windows arm64 again built, inspected, and smoked
  both complete outputs, then failed at `conpty_console_list.node`; the diagnostic ran before the
  fatal throw and artifact upload was skipped.
- Rejected arm64 runtime outputs: first content ID
  `bb05f852159277dea617679f84304d2bc3b01d446ceffd07fb58c9469038bcf6`, ZIP 33,261,545 bytes
  with SHA-256 `248a4962141e5b1b1c5b24433993923171c5c1d342b8db4de624b92a1019823c`;
  second content ID `9d937233f63b142f03e504af2ffeeeb05b2de2b979047a369a79dd1d793b1786`,
  ZIP 33,261,544 bytes with SHA-256
  `24f752754890704e991f5cc85663a6bb7a6934fc5d64f81ea2414ea12778c249`.
- PE diagnostic result: both native modules are exactly 956,928 bytes with identical machine
  `0xaa64`, 12-section layout, PE32+ image/section/file alignment, 840,192-byte code section,
  data directories, load config, imports, relocations, and linker version 14.44. Their SHA-256 values
  are `7ef783c59d73cd6101fbed4ef634ef3d075448726c118b36cca4d17145e35afa` and
  `196dc3373e52350abdf33c30f80a00e0b9b71c96b53b47ba337b1abe428ac8fc`.
  Exactly 2,946 bytes differ across 2,887 coalesced ranges. The first code difference is at file
  offset `0x41c`, followed by one-byte ranges at 16-byte intervals in the retained sample. Header
  differences are confined to COFF/debug timestamps `dd34d0b3` versus `0211cbf1` and CodeView IDs
  `383b9420683f05ced18d65c8e95b4a72` versus `459643a06a5ac306094361fd1788cbe5`;
  CodeView age and the SHA-256 of the unprinted 92-byte PDB path are identical. The detailed-range
  list correctly reports truncation after 128 of 2,887 ranges.
- Duration and resource metrics: jobs were 8m48s Windows arm64, 4m12s macOS x64, 3m15s Linux x64,
  2m57s macOS arm64, 3m24s Linux arm64, and 5m0s Windows x64. Arm64 native builds took 148,290 ms
  and 120,068 ms; smoke took 5,871 ms and 5,421 ms at 51,417,088 and 52,633,600 bytes RSS. The PE
  diagnostic completed between log timestamps 17:30:23.088 and 17:30:23.272 UTC. Build peak RSS,
  open files/channels, and cancellation settlement were not instrumented.
- Artifact/log/trace link: run/job above and five unpublished seven-day artifacts; no rejected
  arm64 bytes were uploaded
- Oracle proved: native Windows parses and bounds the real PE files, x64 remains fully reproducible,
  arm64 output layout and PDB path are stable, and drift affects thousands of mostly single-byte
  code ranges plus `/Brepro`-derived identity fields rather than only a timestamp. The comparator
  and no-upload boundary remain strict.
- Does not prove: the full per-section distribution because the first diagnostic version labels raw
  section data as unmapped and caps detailed ranges at 128; the responsible compiler/linker input,
  a safe producer correction, arm64 equality, cross-run equality, oldest baselines, native trust,
  SSH, publication, transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: native PE diagnostic and Windows x64 control only; no tuple or
  production checkbox.
- Follow-up: add raw-section attribution plus bounded per-section totals/samples across the complete
  scan, rerun both Windows cells, and do not change the producer until that evidence is recorded.

### E-M3-WINDOWS-PE-FULL-SCAN-LOCAL-001 — Bounded complete-region PE summary

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `cd7f941365bf6e631cf0f9947f517ecef02afc8e`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741), native execution pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. The
  repository requires Node 24, so the target-native jobs remain authoritative.
- Remote and transport: none; synthetic PE32+ fixtures and workflow-source contracts only
- Exact commands:

  ```sh
  node --check config/scripts/ssh-relay-runtime-windows-pe-diagnostic.mjs
  node --check config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint config/scripts/ssh-relay-runtime-windows-pe-diagnostic.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Result: PASS. Both syntax checks exited zero; the purpose command passed 6/6 tests across two
  suites; all 15 artifact suites passed 51/51 tests. Typecheck, focused oxlint, the 355-entry
  max-lines ratchet, full repository lint/reliability/localization, formatting, staged hooks, and
  diff checks exited zero. Full lint emitted only pre-existing warnings outside this package.
- Duration and resource metrics: purpose suite 246 ms Vitest; complete artifact suite 963 ms Vitest
  / 2.24s wall; typecheck 2.52s; focused oxlint 0.68s; max-lines 1.54s; full lint 11.09s; formatting
  and diff check 1.06s. The full scan still reads in 64 KiB chunks; detailed ranges remain capped at
  128, each byte excerpt at 32 bytes, each region at eight samples, and the entire diagnostic at 60
  seconds. Synthetic peak RSS/open files were not instrumented.
- Artifact/log/trace link: exact source commit; no binary artifact was created or uploaded
- Oracle proved: every coalesced range contributes to bounded per-region differing-byte and range
  totals even after the detailed-range cap is exhausted; raw PE section data is attributed by the
  most specific overlapping region, preserving CodeView/debug labels; excerpts and region samples
  remain bounded. The comparator, fatal failure, and no-upload ordering are unchanged.
- Does not prove: the real arm64 section distribution, Windows x64 control, arm64 reproducibility,
  a producer correction, oldest baselines, native trust, SSH, publication, transfer, fallback, UI,
  or any enabled tuple.
- Checklist items satisfied: diagnostic observability only; no artifact, tuple, or production box.
- Follow-up: push the exact implementation and ledger head, run all six target-native cells, require
  five reproducible uploads plus a rejected Windows arm64 full-scan summary, and record that evidence
  before changing any copied-artifact producer input.

### E-M3-WINDOWS-PE-FULL-SCAN-CI-RED-001 — Complete native arm64 region classification

- Date: 2026-07-14
- Commit SHA / PR: exact head `a51093f009a03a1105e9f0b86be14797a8046414`, containing exact
  diagnostic implementation `cd7f941365bf6e631cf0f9947f517ecef02afc8e`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29354676731](https://github.com/stablyai/orca/actions/runs/29354676731),
  conclusion `failure`; Windows arm64 `87159223395`, Linux arm64 `87159223407`, macOS x64
  `87159223419`, macOS arm64 `87159223455`, Windows x64 `87159223488`, and Linux x64
  `87159223544`
- Runners: the six target-native labels recorded in prior reproducibility evidence. The diagnostic
  cell was Windows 11 Enterprise 10.0.26200 arm64, image `windows-11-arm64` `20260706.102.1`,
  runner `2.335.1`, provisioner `20260624.560`, Node v24.18.0, MSVC 19.44.35228 / tools
  14.44.35207, Windows SDK 10.0.26100.0, and Python 3.13.14.
- Remote and transport: none; target-native artifact assembly/execution, rejected-file diagnostics,
  and unpublished Actions artifact upload only
- Exact evidence commands:

  ```sh
  gh run view 29354676731 --repo stablyai/orca \
    --json headSha,status,conclusion,url,createdAt,updatedAt,jobs
  gh api repos/stablyai/orca/actions/jobs/87159223395/logs
  gh api 'repos/stablyai/orca/actions/runs/29354676731/artifacts?per_page=100'
  ```

- Result: FAIL as the intended evidence-producing gate. All Windows contract suites passed before
  execution; Linux x64/arm64, macOS x64/arm64, and Windows x64 built twice, inspected, smoked,
  compared exactly, and uploaded. Windows arm64 built, inspected, and smoked both outputs, then the
  strict comparator rejected `conpty_console_list.node`; the full-scan diagnostic completed before
  the fatal throw and the upload step was skipped.
- Uploaded controls: `ssh-relay-runtime-linux-x64-glibc` artifact `8319697674` (29,282,973 bytes),
  Linux arm64 `8319710845` (28,211,514), macOS x64 `8319759300` (26,374,729), macOS arm64
  `8319686475` (24,756,958), and Windows x64 `8319797990` (37,075,313). All are unpublished and
  expire 2026-07-21; the run contains exactly five artifacts and no Windows arm64 artifact.
- Rejected arm64 outputs: content IDs
  `75f048e2216c5a88b5dec886d7ce43f8c54768c42184835cfd0d9a22ea3f1e53` and
  `dddc49d84bdafd5bef136be5050352555e99943b21f49781f1604bd9e37051bc`; ZIP sizes 33,261,549
  and 33,261,550 bytes with SHA-256
  `4c21eaba04e514dee246ee23ea6b4559369fc37eaf90dc0634f11146427bb45a` and
  `aecde9c9982d972d194417cc2d076353fb808f39ba4f018b8d9e64cfdf5c3411`.
- PE diagnostic result: both modules are 956,928-byte machine `0xaa64` PE32+ files with identical
  12-section layout, data directories, imports, relocations, 840,192-byte code section, and linker
  version 14.44. Their SHA-256 values are
  `52d4909f106a4e8f85e7fc4c8cc0ccae93eaa74a83342b569d71f67619f15a1e` and
  `6926210ec6208caa2a79655e2af544b74d8a0d6d1b8c7637d4ece017c89046de`. Exactly 2,947 bytes
  differ across 2,886 ranges:
  - `.text`: 2,879 one-byte ranges from file offsets 1,052 through 47,100, exactly 16 bytes apart;
    all eight retained samples change `85` to `0e`.
  - COFF header: one four-byte `/Brepro` timestamp range.
  - Debug directory: three four-byte ranges carrying that timestamp.
  - CodeView data: one 16-byte identifier range.
  - `.rdata`: two ranges totaling 36 bytes, containing the derived CodeView/build identities and
    timestamp.

  The CodeView path remains 92 bytes with identical SHA-256
  `401080e65f10d7483583537fc7394ddf416fa36febfd76e6d1c17c64bb36f3ea`; no other section
  differs. The detailed list remains capped while every range contributes to the five bounded region
  summaries.

- Duration and resource metrics: jobs were 9m50s Windows arm64, 6m56s Windows x64, 5m33s macOS x64,
  3m44s Linux arm64, 3m18s Linux x64, and 2m55s macOS arm64. Arm64 builds took 152,517 ms and
  130,926 ms; smoke took 5,963 ms and 5,414 ms at 51,884,032 and 51,789,824 bytes RSS. The complete
  smoke stages took 7,978 ms and 7,203 ms. Build peak RSS, open files/channels, and cancellation
  settlement were not instrumented.
- Artifact/log/trace link: run/jobs and five unpublished seven-day artifacts above; rejected arm64
  bytes remained runner-local
- Oracle proved: the arm64 failure is copied-source producer nondeterminism concentrated in a
  regular `.text` pattern, with only derived `/Brepro` identities elsewhere. It is not ZIP order,
  tree metadata, comparator normalization, a changing PDB path, or a cross-platform regression. The
  strict no-upload boundary remains effective.
- Does not prove: which compiler input causes the repeating `.text` byte, a safe producer
  correction, arm64 equality, cross-run equality, oldest baselines, native trust, SSH, publication,
  transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: complete native PE region classification and five control cells only;
  no tuple or production checkbox.
- Follow-up: evaluate a test-covered reproducible compiler input only in the copied node-pty source,
  rerun all local gates and all six target-native cells, and require exact arm64 equality without
  normalizing binaries or weakening the comparator.

### E-M3-WINDOWS-COMPILER-DETERMINISM-LOCAL-001 — Copied-source MSVC reproducibility inputs

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `6546f54d53446015f10681fffff9fe895e460232`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741), native execution pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. This
  runner cannot execute MSVC, so target-native Windows jobs remain authoritative.
- Remote and transport: none; copied `binding.gyp` source-shape contracts only
- Exact red command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  ```

- Red result: FAIL as intended, one failed and one passed test. The copied compiler block lacked
  `/Brepro`; no implementation change had yet been made.
- Exact green commands:

  ```sh
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Green result: PASS. Both syntax checks exited zero; the purpose command passed 6/6 tests across
  three suites; all 15 artifact suites passed 51/51 tests. Typecheck, focused oxlint, the 355-entry
  max-lines ratchet, full repository lint/reliability/localization, formatting, staged hooks, and
  diff checks exited zero. Full lint emitted only pre-existing warnings outside this package.
- Duration and resource metrics: purpose suite 183 ms Vitest; complete artifact suite 1.27s Vitest
  / 2.65s wall; typecheck 2.85s; focused oxlint 0.76s; max-lines 1.81s; full lint 10.91s; formatting
  and diff check 1.10s. Synthetic peak RSS/open files were not instrumented.
- Artifact/log/trace link: exact source commit; no binary artifact was created or uploaded
- Oracle proved: Windows builds receive `/Brepro` and `/experimental:deterministic` in both the
  compiler and linker option blocks after an exact reviewed-source match. POSIX tuples are untouched,
  unexpected or already-modified source fails closed, and the installed repository
  `node_modules/node-pty/binding.gyp` remains byte-identical because only the exclusive copied source
  is rewritten.
- Does not prove: that MSVC 19.44 accepts the flags on both architectures, Windows arm64 equality,
  native execution, cross-run equality, oldest baselines, native trust, SSH, publication, transfer,
  fallback, UI, or any enabled tuple.
- Checklist items satisfied: copied-source compiler/linker input contract only; no tuple or
  production checkbox.
- Follow-up: push the exact implementation and ledger head, run all six target-native cells, and
  require exact equality and successful unpublished upload on both Windows architectures.

### E-M3-WINDOWS-COMPILER-DETERMINISM-CI-RED-001 — Compiler-setting correction does not remove arm64 drift

- Date: 2026-07-14
- Commit SHA / PR: exact head `a6b423f33f0f0f7b4e7975ed80d901f168563e61`, containing exact
  implementation commit `6546f54d53446015f10681fffff9fe895e460232`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29355973362](https://github.com/stablyai/orca/actions/runs/29355973362),
  conclusion `failure`; Linux arm64 `87163591039`, Windows x64 `87163591059`, macOS x64
  `87163591076`, Windows arm64 `87163591141`, macOS arm64 `87163591145`, and Linux x64
  `87163591207`
- Runners: the six target-native labels recorded in prior reproducibility evidence. The failing cell
  was GitHub-hosted `windows-11-arm`, resolved image `win11-arm64` `20260706.102.1`, native
  `ARM64`, Node v24.18.0, MSVC 19.44.35228 / tools 14.44.35207, Windows SDK 10.0.26100.0, and
  Python 3.13.14.
- Remote and transport: none; target-native artifact assembly/execution, rejected-file diagnostics,
  and unpublished Actions artifact upload only
- Exact evidence commands:

  ```sh
  gh run view 29355973362 --repo stablyai/orca \
    --json headSha,status,conclusion,url,createdAt,updatedAt,jobs
  gh run view 29355973362 --repo stablyai/orca --job 87163591141 --log-failed
  gh api repos/stablyai/orca/actions/runs/29355973362/artifacts --paginate
  ```

- Result: FAIL as the intended strict evidence gate. All 15 Windows contract suites passed with
  48 passing and three intentionally skipped tests. Linux x64/arm64, macOS x64/arm64, and Windows
  x64 built twice, inspected, executed, compared exactly, and uploaded. Windows arm64 built and
  executed both complete outputs, then the comparator rejected
  `runtime/node_modules/node-pty/build/Release/conpty_console_list.node`; the diagnostic ran, the
  job failed, and no Windows arm64 artifact was uploaded.
- Uploaded controls: Linux x64 artifact `8320207112` (29,282,626 bytes), Linux arm64
  `8320217472` (28,211,075), macOS x64 `8320277866` (26,390,709), macOS arm64 `8320191810`
  (24,741,051), and Windows x64 `8320261436` (37,075,310). All are unpublished seven-day
  artifacts; the run contains exactly five artifacts.
- Rejected arm64 outputs: content IDs
  `5523ec111f63a53edb3da090cf90bedb0421c2c9862dc0356e106fdf5a6519f2` and
  `faadd0f5285a449fd0aad0960918edc72d565dc150171e8e292c160931340235`; ZIP sizes
  33,261,550 and 33,261,546 bytes with SHA-256
  `769fc2b8a4761b8d19b9d4b02adc2add6b4232ed73a1ee154e6e073760f52eda` and
  `217e9f8b500837130e0978a7aa03dba2790a926b42410752c7d804e6d5a38143`.
- PE diagnostic result: both rejected modules remain 956,928-byte machine `0xaa64` PE32+ files
  with the identical 12-section layout. Their SHA-256 values are
  `548ff529facca76eb3a30c79f96e2170336b7cf01a3e55aabc2a5cd615cd1111` and
  `e0039271e09a898d3edf9eb4506f3d895cd3282a893a1e15acb4abec2f9cb69c`. Exactly the
  same 2,947 bytes differ across 2,886 ranges: 2,879 one-byte `.text` ranges every 16 bytes from
  offsets 1,052 through 47,100, plus 68 bytes of derived COFF/debug/CodeView identity. The retained
  `.text` samples all change `45` to `2d`; the 92-byte PDB path hash remains identical.
- Duration and resource metrics: jobs were 8m25s Windows arm64, 5m50s macOS x64, 5m15s Windows
  x64, 3m37s Linux arm64, 3m16s Linux x64, and 2m41s macOS arm64. Arm64 builds took 141,484 ms
  and 116,582 ms; smoke took 5,784 ms and 5,439 ms at 53,014,528 and 53,047,296 bytes RSS. The
  complete smoke stages took 7,448 ms and 7,383 ms. Build peak RSS, open files/channels, and
  cancellation settlement were not instrumented.
- Artifact/log/trace link: run/jobs and the five unpublished artifacts above; rejected arm64 bytes
  remained runner-local
- Oracle proved: adding the reviewed compiler/linker settings did not alter the arm64 failure
  signature, while all five controls and both arm64 runtime executions remain healthy. The strict
  comparator and no-upload boundary still work. This falsifies the hypothesis that the copied
  settings alone are sufficient.
- Does not prove: whether the generated MSBuild project actually propagates both settings to every
  `conpty_console_list` compile/link invocation, what the repeated ARM64 instruction represents, a
  safe producer correction, arm64 or cross-run equality, oldest baselines, native trust, SSH,
  publication, transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: native negative evidence and five reproducible control cells only; no
  tuple or production checkbox.
- Follow-up: inspect the generated `conpty_console_list.vcxproj` fail-closed for the expected
  compiler/linker inputs and emit bounded paired ARM64 instruction/disassembly context around the
  first differing ranges. Do not change the producer, normalize binaries, weaken comparison, or
  upload rejected bytes before that evidence.

### E-M3-WINDOWS-MSBUILD-DISASSEMBLY-LOCAL-001 — Generated-project and bounded disassembly contracts

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `0d3a0c9d3f0eee78d3106a646369cc3fc5db96b1`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741), native execution pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. This
  runner cannot generate or execute native MSBuild/ARM64 PE inputs, so the target-native Windows
  jobs remain authoritative.
- Remote and transport: none; synthetic generated-project fixtures and workflow-source contracts
  only
- Exact red command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  ```

- Red result: FAIL as intended, two failed and two passed tests because no generated-project
  verifier existed.
- Exact green commands:

  ```sh
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  node --check config/scripts/ssh-relay-node-pty-build.mjs
  node --check config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  pnpm exec lint-staged
  git diff --check
  ```

- Green result: PASS. All syntax checks exited zero; the purpose command passed 8/8 tests across
  three suites; all 15 artifact suites passed 53/53 tests. Typecheck, focused oxlint, the
  355-entry max-lines ratchet, full repository lint/reliability/localization, formatting, staged
  hooks, and diff checks exited zero. Full lint emitted only pre-existing warnings outside this
  package.
- Duration and resource metrics: purpose suite 156 ms Vitest; complete artifact suite 1.11s
  Vitest. Static-gate wall time, synthetic peak RSS, open files/channels, and cancellation
  settlement were not instrumented.
- Artifact/log/trace link: exact source commit and local command output; no binary artifact was
  created or uploaded
- Oracle proved: Windows artifact builds now reject a missing, duplicate, non-inherited, or
  wrong-architecture Release `ClCompile`/`Link` option in the generated
  `conpty_console_list.vcxproj` before runtime staging, and log the exact accepted setting summary.
  On an arm64 mismatch the workflow retains the existing structured PE diagnostic, then requests
  only absolute image addresses `0x180001000` through `0x180001200` from native
  `llvm-objdump.exe` before the fatal throw. Rejected bytes still cannot reach artifact staging.
- Does not prove: the real generated XML shape, native `llvm-objdump` availability/output, which
  repeated ARM64 instruction differs, a safe producer correction, arm64 equality, oldest
  baselines, native trust, SSH, publication, transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: local generated-project and bounded-disassembly contracts only; no
  tuple or production checkbox.
- Follow-up: push the exact implementation and ledger head, run all six target-native cells, and
  require both Windows jobs to prove generated settings. If arm64 still differs, record the two
  bounded disassemblies and retain strict failure/no-upload before any producer correction.

### E-M3-WINDOWS-MSBUILD-PLATFORM-CASE-CI-RED-001 — Native arm64 Release-group lookup fails closed

- Date: 2026-07-14
- Commit SHA / PR: exact head `65d44d72f7a5da382ffddc194f302b4386b2391c`, containing exact
  diagnostic implementation commit `0d3a0c9d3f0eee78d3106a646369cc3fc5db96b1`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29357355064](https://github.com/stablyai/orca/actions/runs/29357355064),
  conclusion `failure`; Linux x64 `87168238852`, Windows x64 `87168238867`, macOS x64
  `87168238889`, Windows arm64 `87168238935`, macOS arm64 `87168238945`, and Linux arm64
  `87168238954`
- Runners: the six target-native labels recorded in prior reproducibility evidence. The failing cell
  was GitHub-hosted `windows-11-arm`, image `win11-arm64` release `20260706.102`, native `ARM64`,
  runner 2.335.1, Node v24.18.0, MSVC tools 14.44.35207, Windows SDK 10.0.26100.0, and an arm64
  developer environment exposing `Platform=arm64`.
- Remote and transport: none; target-native artifact assembly, generated-project verification, and
  unpublished Actions artifact upload only
- Exact evidence commands:

  ```sh
  gh run view 29357355064 --repo stablyai/orca \
    --json headSha,status,conclusion,url,createdAt,updatedAt,jobs
  gh run view 29357355064 --repo stablyai/orca --job 87168238867 --log
  gh run view 29357355064 --repo stablyai/orca --job 87168238935 --log-failed
  gh api repos/stablyai/orca/actions/runs/29357355064/artifacts --paginate
  ```

- Result: FAIL as the intended strict evidence gate. Linux x64/arm64, macOS x64/arm64, and Windows
  x64 built twice, inspected, executed, compared exactly, and uploaded. Windows x64 logged the
  required `/Brepro` and `/experimental:deterministic` compiler and linker settings for both clean
  builds. Native Windows arm64 completed compilation of the first copied node-pty tree, then the
  generated-project verifier rejected it with `generated MSBuild settings lack one exact Release
configuration` before runtime staging, verification, smoke, comparison, or diagnostics. Its
  artifact upload was skipped.
- Uploaded controls: Linux x64 artifact `8320756625` (29,278,781 bytes,
  `sha256:50bab609edc8e4eb776f462622c5e1310e926049e5ec0e759692ea4ae74142a4`), Linux arm64
  `8320758083` (28,215,186,
  `sha256:0b2770363a95717b0193c58ee066242ab08a9fa80eb0060049e912f6314776a8`), macOS x64
  `8320845963` (26,407,443,
  `sha256:70b4217dc54ff2015638e7407714208f7e399acadf0cbcd0d8d5340025235d34`), macOS arm64
  `8320753136` (24,774,283,
  `sha256:8f5c1a65e88d79b036cabf24d80656e6b987335c5d0a908d4fff241026d74467`), and Windows x64
  `8320806874` (37,075,312,
  `sha256:a325d8e09c0391ee971328da397ac23412024ce2e4bf0dc633f897f8b923add2`). The run contains
  exactly five unpublished seven-day artifacts and no Windows arm64 artifact.
- Duration and resource metrics: jobs were 6m43s macOS x64, 6m24s Windows arm64, 5m15s Windows
  x64, 3m24s Linux x64, 3m23s Linux arm64, and 3m16s macOS arm64. The arm64 verifier failure
  occurred 2m24s into the build/inspect step before runtime smoke, so no new arm64 smoke RSS,
  channel/file count, cancellation, or fallback metric exists for this run.
- Artifact/log/trace link: run/jobs and the five unpublished artifacts above; no rejected arm64
  runtime or binary was staged or uploaded
- Oracle proved: the generated-setting verifier executes after native compilation and fails closed
  before staging when its Release-group architecture spelling does not match. Windows x64 proves
  both required settings in both generated projects. The native arm64 developer environment uses a
  lowercase platform spelling, while all five architecture controls and the no-upload boundary
  remain intact.
- Does not prove: the exact native arm64 generated XML condition, that a case-insensitive exact
  architecture match reaches its option blocks, a complete arm64 runtime, paired disassembly, a
  safe producer correction, arm64 equality, oldest baselines, native trust, SSH, publication,
  transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: native negative verifier evidence and five reproducible control cells
  only; no tuple or production checkbox.
- Follow-up: cover lowercase `arm64` with a purpose fixture and compare only the expected Release
  architecture case-insensitively, retaining exact group and option cardinality. Rerun both Windows
  cells and all four POSIX controls before interpreting the underlying PE drift.

### E-M3-WINDOWS-MSBUILD-PLATFORM-CASE-LOCAL-001 — Lowercase native platform contract

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `4207c207ab932ef67522b4f73b98d63fa32d0924`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741), native execution pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. This
  runner cannot generate or execute native MSBuild/ARM64 PE inputs, so the target-native Windows
  jobs remain authoritative.
- Remote and transport: none; synthetic generated-project fixtures and workflow/source contracts
  only
- Exact red command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  ```

- Red result: FAIL as intended, one failed and three passed tests because a generated
  `Release|arm64` condition was rejected for the `win32-arm64` tuple.
- Exact green commands:

  ```sh
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  pnpm exec lint-staged
  git diff --check
  ```

- Green result: PASS. Both syntax checks exited zero; the purpose command passed 8/8 tests across
  three suites; all 15 artifact suites passed 53/53 tests. Typecheck, focused oxlint, the
  355-entry max-lines ratchet, full repository lint/reliability/localization, formatting, staged
  hooks, and diff checks exited zero. Full lint emitted only pre-existing warnings outside this
  package.
- Duration and resource metrics: red suite 382 ms Vitest; purpose suite 181 ms Vitest; complete
  artifact suite 1.51 s Vitest; typecheck 3.41 s; focused lint/line ratchet 3.28 s; full lint
  13.30 s. Synthetic peak RSS, open files/channels, and cancellation settlement were not
  instrumented.
- Artifact/log/trace link: exact source commit and local command output; no binary artifact was
  created or uploaded
- Oracle proved: `Release|arm64` is accepted for only the expected `win32-arm64` architecture while
  the quoted Release condition remains exact apart from case. Wrong architecture, missing or
  duplicate group/option blocks, missing inheritance, and missing or duplicated required flags
  still fail closed. No source rewrite, producer, comparator, staging, or production path changed.
- Does not prove: the exact native generated XML, native flag propagation, complete arm64 build,
  paired disassembly, a safe producer correction, arm64 equality, oldest baselines, native trust,
  SSH, publication, transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: local generated-project platform-casing contract only; no tuple or
  production checkbox.
- Follow-up: push the exact implementation and ledger head, then run all six target-native cells and
  require both Windows architectures to log the accepted generated settings before interpreting any
  later comparator mismatch.

### E-M3-WINDOWS-ARM64-THUNK-DISASSEMBLY-CI-RED-001 — Native linker-thunk drift isolated

- Date: 2026-07-14
- Commit SHA / PR: exact head `e1a63930b4d350e8677e2be3a35b0bdec95f268c`, containing exact
  lowercase-platform implementation commit `4207c207ab932ef67522b4f73b98d63fa32d0924`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29358223742](https://github.com/stablyai/orca/actions/runs/29358223742),
  conclusion `failure`; Linux arm64 `87171219009` success, Windows arm64 `87171219067` expected
  strict failure, Linux x64 `87171219080` success, Windows x64 `87171219167` success, macOS arm64
  `87171219192` success, and macOS x64 `87171219210` success
- Runners: GitHub-hosted `ubuntu-24.04-arm` / `ubuntu24-arm64` `20260706.52.2` native ARM64;
  `windows-11-arm` / `win11-arm64` `20260706.102.1` native ARM64; `ubuntu-24.04` / `ubuntu24`
  `20260705.232.1` native X64; `windows-2022` / `win22` `20260706.237.1` native X64; `macos-15` /
  `macos15` `20260706.0213.1` native ARM64; and `macos-15-intel` / `macos15`
  `20260629.0276.1` native X64. Every job recorded Node v24.18.0 and the exact source commit.
- Remote and transport: none; target-native artifact assembly, generated-project verification,
  bundled-Node/native-module execution, strict comparison, and unpublished Actions artifacts only
- Exact evidence commands:

  ```sh
  gh pr view 8741 --repo stablyai/orca \
    --json number,state,isDraft,headRefName,headRefOid,url,statusCheckRollup,updatedAt
  gh api repos/stablyai/orca/actions/runs/29358223742
  gh api 'repos/stablyai/orca/actions/runs/29358223742/jobs?per_page=100'
  gh api 'repos/stablyai/orca/actions/runs/29358223742/artifacts?per_page=100'
  gh run view 29358223742 --repo stablyai/orca --job 87171219167 --log
  gh run view 29358223742 --repo stablyai/orca --job 87171219067 --log-failed
  gh api repos/stablyai/orca/actions/jobs/87171219067/logs | \
    sed -n '/windows_arm64_disassembly=first/,$p'
  gh run download 29358223742 --repo stablyai/orca --dir <temporary-directory>
  jq -c '{tupleId,contentId,nodeVersion,archive,fileCount}' \
    <temporary-directory>/*/*.identity.json
  ```

- Result: FAIL as the intended strict reproducibility gate. The lowercase `arm64` correction reaches
  the one expected Release group on both native arm64 clean builds. Both log exactly one inherited
  compiler and linker option block containing `/Brepro` and `/experimental:deterministic`, then
  assemble, inspect, verify, and execute the complete runtime. Each bundled Node v24.18.0 smoke
  proves ABI 137, patched PTY input/resize/exit code 23, watcher create/update/delete, and settled
  Windows resources. Strict comparison then rejects only
  `runtime/node_modules/node-pty/build/Release/conpty_console_list.node`; no arm64 output is staged
  for upload.
- Windows arm64 outputs: both PE files are 956,928 bytes. The first content identity is
  `sha256:a6adc716ec39503f68f4e322624ed9193b9343ca4b5f74d22843c47635e81519`, with
  33,261,547-byte ZIP
  `sha256:5aebde73ef6cad605d13c5c27977f1229729aa28a6959649989d8ecd4a6d2a9e`; the second is
  `sha256:2aef13722dd084941069d260591c529d1ca5ebf0b1e2defa34da4c43f44c2d24`, with the same
  ZIP size and digest
  `sha256:974612580fa7a008bcf3377ddd13ce5f99b78cc31c99c7b9b720066b3f9dc91c`. Both archives
  contain 42 files and expand to 86,189,895 bytes.
- PE oracle: the complete scan reports 5,826 differing bytes across 2,886 coalesced ranges. The
  `.text` contribution is 5,758 bytes across 2,879 two-byte ranges from file offsets 1,052 through
  47,102, exactly 16 bytes apart. The remaining 68 bytes are one four-byte COFF timestamp, three
  four-byte debug timestamps, one 16-byte CodeView identifier, and 36 derived `.rdata` bytes.
  Section layout, file size, executable control-flow bytes, and all other bytes match.
- Paired disassembly oracle: the first 512 `.text` bytes contain repeated 16-byte function thunks.
  For every displayed thunk, `adrp x16, target`, `add x16, x16, offset`, and `br x16` are
  byte-identical. Only the unreachable fourth instruction differs: first build `0000024d`
  (`udf #0x24d`), second build `0000016d` (`udf #0x16d`). This classifies the changing bytes as
  linker-emitted thunk padding; it does not yet prove the generated linker setting responsible.
- Uploaded controls: exactly five unpublished seven-day artifacts and no Windows arm64 artifact:
  Linux x64 `8321096098`, 29,281,909 bytes,
  `sha256:cbe4d1be7664227fa34fb977f568ba0fc9409d5b5f5139fd4937013e46501074`, content ID
  `sha256:960546cd96c67fcf9bb0a61e96ecdbecbffd9104d3a495578f8bb19dd810649a`, archive
  `sha256:c87306e069af8c849b7679ccdf0504cc48c51b0ac0586edcdbf698972156bab5`; Linux arm64
  `8321099340`, 28,212,775 bytes,
  `sha256:0502a9710a9612c44fc2aa4792ee1f30859158fcac40668b59c35ca670eb83f2`, content ID
  `sha256:aa3aa8ae8b42334ba7b0dbe5c43fd1184e36b3f4f4a9bec0e990e9b78f090756`, archive
  `sha256:f017fcd7808cd8ba86175b2fad63103e880d57ccbec70412938e0cc145310eda`; macOS x64
  `8321127611`, 26,376,349 bytes,
  `sha256:9297b99e9605c065cbf04d3431edadf8312ee19dd1b60d8790cba95f090bd68e`, content ID
  `sha256:585ea6034cdd07487d8667059f975a877c795a45dc0d6eeee1617f2e3749faa2`, archive
  `sha256:5669d69085d268e01fe5ece6e4372832c3f61c89bcefa9acaf732c81eb460775`; macOS arm64
  `8321085541`, 24,740,934 bytes,
  `sha256:8ab194c0d0c08ab40aa8f7821738fd5c2e3b1821fb83df6d59992b6106ba46f2`, content ID
  `sha256:40ff5d2036784b794e7b09f78596409f63f3145280c530bece5280d40897f6cb`, archive
  `sha256:b51e5a6a53aeff2ae47e4156900981395516c9b246ab1ae3fff5c4c34500ee0a`; and Windows x64
  `8321159937`, 37,075,308 bytes,
  `sha256:dcadebbcbb7d3c6f308badeefa7940350022b22bb76fd31baed15bb304af56c1`, content ID
  `sha256:2a6bfa06b445fb78d6e4a5abba6ec379cbed6f7830c805e82c7145d18a1c3d8b`, archive
  `sha256:ee1a0cc8bdf55d783ed1c1232dedd788710a1d88edd7e89a2ddfa84e0986d7ca`.
- Duration and resource metrics: jobs ran 3m07s Linux arm64, 9m15s Windows arm64, 3m02s Linux x64,
  5m22s Windows x64, 2m41s macOS arm64, and 4m11s macOS x64. Windows arm64 clean builds took
  149,415.066 ms and 130,574.341 ms; verification took 7,688.862 ms and 8,012.846 ms, with smoke
  taking 5,865.144 ms at 53,235,712-byte RSS and 5,553.779 ms at 53,133,312-byte RSS. Cancellation,
  SSH channel/file counts, and fallback delay are outside this artifact-only run.
- Artifact/log/trace link: run/jobs and the five unpublished artifacts above; rejected arm64 bytes
  exist only in the bounded job workspace and log diagnostics and were not uploaded
- Oracle proved: real native lowercase platform acceptance, exact generated compiler/linker option
  propagation, two complete executable arm64 candidates, strict rejection, exact five-control
  reproducibility, bounded linker-thunk classification, and rejected-output no-upload.
- Does not prove: whether MSBuild enabled incremental linking, that disabling it is the safe producer
  correction, arm64 equality, oldest baselines, native trust, SSH, publication, transfer, fallback,
  UI, or any enabled tuple. No executable byte may be normalized from this evidence.
- Checklist items satisfied: target-native platform-case gate and bounded ARM64 instruction
  diagnostic only; no tuple or production checkbox.
- Follow-up: add a purpose-tested bounded parser for the exact generated Release
  `LinkIncremental` state, require both Windows clean builds to report it, and rerun all six native
  controls before considering one copied-artifact producer correction.

### E-M3-WINDOWS-LINK-INCREMENTAL-DIAGNOSTIC-LOCAL-001 — Effective MSBuild link-state gate

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `36a19f525cc63e488f49daa5c3a6aafc590acc08`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741), target-native execution pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. This runner
  cannot evaluate a native MSBuild project, so the two Windows jobs remain authoritative.
- Remote and transport: none; strict command/output contracts and builder ordering only
- Exact red command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  ```

- Red result: FAIL as intended, one failed and four passed tests because
  `windowsNodePtyLinkIncrementalCommand` was not implemented.
- Exact green commands:

  ```sh
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  node --check config/scripts/ssh-relay-node-pty-build.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  pnpm exec lint-staged
  git diff --check
  ```

- Green result: PASS. All syntax checks exited zero; the purpose command passed 9/9 tests across
  three suites; all 15 artifact suites passed 54/54 tests. Typecheck, focused oxlint, the 355-entry
  max-lines ratchet, full repository lint/reliability/localization, formatting, staged hooks, and
  diff checks exited zero. Full lint emitted only pre-existing warnings outside this package;
  `lint-staged` reported no staged files in its standalone run and the commit hook subsequently ran
  oxlint, React Doctor, and oxfmt successfully over all four staged files.
- Duration and resource metrics: purpose gate 1.93 s wall / 459 ms Vitest; complete artifact gate
  2.87 s wall / 1.35 s Vitest; typecheck 3.10 s; focused lint and line ratchet 3.09 s; full lint
  12.91 s. Synthetic peak RSS, open files/channels, cancellation settlement, and fallback delay
  were not instrumented.
- Artifact/log/trace link: exact implementation commit and local command output; no binary artifact
  was created or uploaded
- Oracle proved: Windows builds form a bounded `MSBuild.exe` query for the exact generated
  `conpty_console_list.vcxproj`, Release configuration, and tuple architecture; request only the
  evaluated `LinkIncremental` property; accept exactly one case-insensitive boolean result; and
  fail before staging on missing, noisy, or non-boolean output. x64 and arm64 commands are covered,
  POSIX creates no query, and the result is appended to the existing generated-setting record.
- Does not prove: `MSBuild.exe -getProperty` availability or result on either native Windows image,
  the actual effective incremental-link state, the thunk owner, a safe producer correction, arm64
  equality, oldest baselines, native trust, SSH, publication, transfer, fallback, UI, or any enabled
  tuple.
- Checklist items satisfied: local bounded effective-link-state diagnostic only; no tuple or
  production checkbox.
- Follow-up: push the exact implementation and ledger head, run all six target-native cells, and
  require both Windows clean builds to report `linkIncremental` before changing the producer.

### E-M3-WINDOWS-LINK-INCREMENTAL-CI-RED-001 — Native property oracle is empty and fails closed

- Date: 2026-07-14
- Commit SHA / PR: exact head `2d4433bbd0d2481d3f91c56d10155989cd6e7e44`, containing exact
  diagnostic implementation commit `36a19f525cc63e488f49daa5c3a6aafc590acc08`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29359948742](https://github.com/stablyai/orca/actions/runs/29359948742),
  conclusion `failure`; macOS x64 `87177167723` success, Linux x64 `87177167732` success, Windows
  x64 `87177167740` expected diagnostic failure, Windows arm64 `87177167757` expected diagnostic
  failure, macOS arm64 `87177167776` success, and Linux arm64 `87177167801` success
- Runners: GitHub-hosted Windows x64 used `windows-2022` / `win22` `20260706.237.1`, native X64;
  Windows arm64 used `windows-11-arm` / `win11-arm64` `20260706.102.1`, native ARM64. Both recorded
  Node v24.18.0 and exact source head `2d4433bbd`. The four POSIX cells used the same target-native
  labels as E-M3-WINDOWS-ARM64-THUNK-DISASSEMBLY-CI-RED-001.
- Remote and transport: none; target-native artifact assembly, strict pre-staging diagnostic, and
  unpublished Actions artifacts only
- Exact evidence commands:

  ```sh
  gh run view 29359948742 --repo stablyai/orca \
    --json headSha,status,conclusion,url,createdAt,updatedAt,jobs
  gh api repos/stablyai/orca/actions/jobs/87177167740/logs
  gh api repos/stablyai/orca/actions/jobs/87177167757/logs
  gh api 'repos/stablyai/orca/actions/runs/29359948742/artifacts?per_page=100'
  ```

- Result: FAIL as the intended diagnostic boundary. Each native Windows job completes the first
  copied node-pty build and validates the generated Release compiler/linker option blocks. The
  subsequent `MSBuild.exe -getProperty:LinkIncremental` query exits zero but writes only an empty
  value. The strict parser rejects it with `unexpected LinkIncremental evaluation from MSBuild`
  before runtime staging, archive creation, verification, smoke, comparison, or upload. This
  proves the property oracle is not usable and does not prove that incremental linking is enabled
  or disabled.
- Uploaded controls: exactly four unpublished seven-day POSIX artifacts and no Windows artifacts:
  Linux x64 `8321792649`, 29,280,250 bytes,
  `sha256:81b21c5f0670cd0337a9b8c666a154c474f52780d19d745497e25bbe69adcfe3`; Linux arm64
  `8321797660`, 28,211,154 bytes,
  `sha256:deca7d86e20442287878c6d17f6d533ba6be626dd7ff765f7cd841986272ffc8`; macOS x64
  `8321944562`, 26,386,865 bytes,
  `sha256:045573de326e8f9532ac31d5449f4aed4a201bbf152c98d971aa761c76e5ec37`; and macOS arm64
  `8321811571`, 24,727,700 bytes,
  `sha256:8fc66890341f548671ec15d0875186ca5ea128cb1ea959a2a69cacc14b9c0864`.
- Duration and resource metrics: jobs ran 9m08s macOS x64, 3m13s Linux x64, 2m50s Windows x64,
  6m31s Windows arm64, 3m56s macOS arm64, and 3m21s Linux arm64. Both Windows failures occur after
  one native build but before runtime smoke, so no new Windows RSS, channel/file count,
  cancellation, or fallback metric exists.
- Artifact/log/trace link: run/jobs and the four unpublished POSIX artifacts above; no Windows
  runtime or binary was staged or uploaded
- Oracle proved: both native Windows architectures return an empty evaluated Release
  `LinkIncremental` property and the bounded diagnostic rejects it before staging. All four POSIX
  controls remain reproducible and upload.
- Does not prove: the actual linker command, whether `/INCREMENTAL` was passed, the thunk owner, a
  safe producer correction, Windows runtime equality, oldest baselines, native trust, SSH,
  publication, transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: native negative property-oracle evidence only; no tuple or production
  checkbox.
- Follow-up: inspect the actual post-build `link.command.1.tlog` under a byte cap, emit only an
  allowlisted switch summary, and retain all existing strict comparison/no-upload controls.

### E-M3-WINDOWS-LINK-COMMAND-TRACKING-LOCAL-001 — Bounded native linker-command gate

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `4a66435b71b158624645c614543d139a9ea45d51`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741), target-native execution pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. This runner
  cannot generate the native MSBuild tracking file, so Windows x64/arm64 jobs remain authoritative.
- Remote and transport: none; bounded local file/parser and builder-ordering contracts only
- Exact red commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  /usr/bin/time -lp pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  ```

- Red result: the pre-implementation purpose suite failed two and passed four tests because the
  tracking-path/parser contracts did not exist. The later bounded-reader audit deliberately added
  malformed UTF-16 input and failed one of eleven tests because `Buffer.toString('utf16le')`
  preserved a lone surrogate instead of rejecting it. Fatal `TextDecoder` decoding closed that
  gap; the audit red run took 0.99 s wall with 131,973,120-byte maximum RSS and
  96,196,032-byte peak memory footprint.
- Exact green commands:

  ```sh
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  node --check config/scripts/ssh-relay-node-pty-build.mjs
  /usr/bin/time -lp pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  /usr/bin/time -lp pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Green result: PASS. The purpose suites pass 11/11 tests and all 15 artifact suites pass 56/56.
  Syntax checks, typecheck, focused oxlint, the 355-entry max-lines ratchet, full repository
  lint/reliability/localization, formatting, and diff checks exit zero. Full lint emits only
  pre-existing warnings outside this artifact package.
- Duration and resource metrics: purpose gate 0.89 s wall / 166 ms Vitest with 132,513,792-byte
  maximum RSS and 96,720,296-byte peak footprint; complete artifact gate 1.35 s wall / 550 ms Vitest
  with 137,068,544-byte maximum RSS and 95,819,104-byte peak footprint; typecheck 3.10 s, focused
  lint 0.34 s, max-lines 2.01 s, full lint 10.89 s, and format 2.24 s. No SSH channels/files,
  cancellation, fallback, or runtime latency is exercised by this diagnostic-only package.
- Artifact/log/trace link: current exact source/tests and local command output; no runtime artifact
  was created, staged, published, or uploaded
- Oracle proved: the builder locates the target-specific post-build
  `conpty_console_list.tlog/link.command.1.tlog`, reads at most 256 KiB plus one rejection byte,
  accepts fatal UTF-16LE-BOM or UTF-8 decoding, requires exactly one command record and one each of
  `/Brepro`, `/guard:cf`, and `/experimental:deterministic`, classifies incremental linking as
  enabled/disabled/unspecified, and emits only the allowlisted switch summary. Oversize, malformed
  encoding/switches, duplicate records/switches, ambiguous incremental states, and missing required
  switches fail before runtime staging. POSIX paths create no tracking-file lookup.
- Does not prove: the file path/encoding/record shape on either native Windows runner, the emitted
  switch summary, the incremental-link state, thunk ownership, a safe producer correction, arm64
  equality, oldest baselines, native trust, SSH, publication, transfer, fallback, UI, or any enabled
  tuple.
- Checklist items satisfied: local bounded post-build tracking diagnostic only; no tuple or
  production checkbox.
- Follow-up: push the exact implementation and ledger head, run all six target-native cells, and
  require both Windows clean builds to emit the same accepted summary before changing the producer.

### E-M3-WINDOWS-LINK-COMMAND-PATH-CI-RED-001 — Native fixed tracking path is absent

- Date: 2026-07-14
- Commit SHA / PR: exact head `dafca2060f2daf4ba27b54a0eb18bb9700136f5b`, containing exact
  tracking implementation commit `4a66435b71b158624645c614543d139a9ea45d51`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29361673339](https://github.com/stablyai/orca/actions/runs/29361673339),
  conclusion `failure`; macOS arm64 `87183054190` success, Linux arm64 `87183054293` success,
  Windows arm64 `87183054295` expected diagnostic failure, macOS x64 `87183054306` success, Linux
  x64 `87183054310` success, and Windows x64 `87183054318` expected diagnostic failure
- Runners: GitHub-hosted Windows x64 used `windows-2022` / `win22` `20260706.237.1`, native X64;
  Windows arm64 used `windows-11-arm64` / `win11-arm64` `20260706.102.1`, native ARM64. Both used
  runner `2.335.1`, Node v24.18.0, MSVC 14.44.35207, and exact source head `dafca2060`. The four
  POSIX controls used their previously recorded target-native labels.
- Remote and transport: none; target-native artifact assembly, strict pre-staging diagnostic, and
  unpublished Actions artifacts only
- Exact evidence commands:

  ```sh
  gh run view 29361673339 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh api repos/stablyai/orca/actions/jobs/87183054318/logs
  gh api repos/stablyai/orca/actions/jobs/87183054295/logs
  gh api 'repos/stablyai/orca/actions/runs/29361673339/artifacts?per_page=100'
  ```

- Result: FAIL as the intended diagnostic boundary. Each Windows job successfully compiles
  `conpty_console_list.node` for its native architecture, then the bounded reader receives `ENOENT`
  for the locally assumed fixed `build/Release/obj/conpty_console_list/conpty_console_list.tlog/`
  `link.command.1.tlog` location. Both jobs fail before runtime staging, verification, smoke,
  comparison, or upload. This proves only that the fixed path is wrong; it does not show whether a
  target-matching tracking file exists elsewhere.
- Uploaded controls: exactly four unpublished seven-day POSIX artifacts and no Windows artifacts:
  Linux x64 `8322467354`, 29,282,467 bytes,
  `sha256:75a29015224b0dd96e479f94d362be7023af0263373192332488ca4cc30647ae`; Linux arm64
  `8322477826`, 28,215,101 bytes,
  `sha256:07e9be64b1ab7fd2a9ebf9a30672bd275c670d5f0c95bd624b933d3bc870515e`; macOS x64
  `8322529916`, 26,372,643 bytes,
  `sha256:a0c3fdd314b19b0f371b5ea88eb862dfe335a785506b8011f8fde915f1323b1c`; and macOS arm64
  `8322474835`, 24,749,773 bytes,
  `sha256:11ddd1291e7b104edae6e54d18ab44a20a90aa28a29ed3d2bd92e2f3202d215c`.
- Duration and resource metrics: jobs ran 3m25s macOS arm64, 3m27s Linux arm64, 6m40s Windows
  arm64, 5m37s macOS x64, 3m06s Linux x64, and 3m00s Windows x64. Both Windows failures occur
  after one native compile but before runtime smoke; no new Windows RSS, channel/file count,
  cancellation, or fallback metric exists.
- Artifact/log/trace link: run/jobs and the four unpublished POSIX artifacts above; no Windows
  runtime or rejected binary was staged or uploaded
- Oracle proved: both native Windows architectures share the same absent fixed tracking path while
  the target native build itself completes; all four POSIX controls remain reproducible and upload;
  rejected Windows output remains unavailable to consumers.
- Does not prove: the actual tracking-file path, candidate cardinality, command record shape,
  allowlisted switch summary, incremental-link state, thunk ownership, a safe producer correction,
  Windows runtime equality, oldest baselines, native trust, SSH, publication, transfer, fallback,
  UI, or any enabled tuple.
- Checklist items satisfied: native negative path-shape evidence only; no tuple or production
  checkbox.
- Follow-up: replace the false fixed-path assumption with bounded build-tree discovery that requires
  exactly one target-matching `link.command.1.tlog`, then rerun all six native cells without
  weakening parsing, comparison, or no-upload controls.

### E-M3-WINDOWS-LINK-COMMAND-DISCOVERY-LOCAL-001 — Bounded target-matching discovery

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `6198f0ddd5b31704ab72902e9a21e78412da870d`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741), target-native execution pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. This runner
  cannot generate the native MSBuild tree, so Windows x64/arm64 jobs remain authoritative.
- Remote and transport: none; bounded build-tree discovery, target selection, and builder-ordering
  contracts only
- Red evidence: E-M3-WINDOWS-LINK-COMMAND-PATH-CI-RED-001 on both native Windows architectures;
  no synthetic local failure is substituted for that real path-shape evidence
- Exact green commands:

  ```sh
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  node --check config/scripts/ssh-relay-node-pty-build.mjs
  /usr/bin/time -lp pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Green result: PASS. The purpose suites pass 13/13 tests and all 15 artifact suites pass 58/58.
  Syntax checks, typecheck, focused oxlint, the 355-entry max-lines ratchet, full repository
  lint/reliability/localization, formatting, and diff checks exit zero. Full lint emits only
  pre-existing warnings outside this artifact package.
- Duration and resource metrics: focused purpose gate 1.03 s wall / 227 ms Vitest with
  131,825,664-byte maximum RSS and 95,999,352-byte peak footprint; complete artifact gate 2.96 s
  wall / 1.36 s Vitest; typecheck 3.08 s, focused lint 0.66 s, max-lines 1.47 s, and full lint
  13.87 s. The final full artifact run was parallel with static gates, so its process RSS was not
  isolated. No SSH channels/files, cancellation, fallback, or runtime latency is exercised.
- Artifact/log/trace link: current exact source/tests and local command output; no runtime artifact
  was created, staged, published, or uploaded
- Oracle proved: discovery is deterministic and bounded to 10,000 build-tree entries, depth eight,
  and 32 exact-name candidates; symbolic links fail closed; each candidate read remains bounded;
  target selection requires exactly one token-bounded `conpty_console_list.node` output rather than
  a lookalike or path assumption. Missing/duplicate targets, excessive depth/cardinality, oversized
  bytes, malformed contents, and all existing strict-parser failures settle before staging. POSIX
  performs no discovery.
- Does not prove: that either native Windows tree contains a candidate, candidate cardinality on the
  runners, the actual record shape, allowlisted switch summary, incremental-link state, thunk
  ownership, a safe producer correction, arm64 equality, oldest baselines, native trust, SSH,
  publication, transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: local bounded tracking discovery only; no tuple or production checkbox.
- Follow-up: push the exact implementation and ledger head, rerun all six target-native cells, and
  require both Windows clean builds to select one target record and emit the same accepted summary
  before changing the producer.

### E-M3-WINDOWS-LINK-COMMAND-DISCOVERY-CI-RED-001 — Whole build tree exceeds depth bound

- Date: 2026-07-14
- Commit SHA / PR: exact head `f9a49d53123b27b19713eadef927de1102ec08de`, containing exact
  discovery implementation commit `6198f0ddd5b31704ab72902e9a21e78412da870d`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29362672415](https://github.com/stablyai/orca/actions/runs/29362672415),
  conclusion `failure`; Windows x64 `87186432938` expected diagnostic failure, Windows arm64
  `87186432948` expected diagnostic failure, macOS arm64 `87186432965` success, Linux arm64
  `87186432979` success, Linux x64 `87186432980` success, and macOS x64 `87186433013` success
- Runners: GitHub-hosted Windows x64 and arm64 used the same native labels, images, runner, Node,
  and MSVC versions recorded by E-M3-WINDOWS-LINK-COMMAND-PATH-CI-RED-001; exact source head was
  `f9a49d531`. The four POSIX controls used their previously recorded target-native labels.
- Remote and transport: none; target-native artifact assembly, bounded build-tree discovery, and
  unpublished Actions artifacts only
- Exact evidence commands:

  ```sh
  gh run view 29362672415 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh api repos/stablyai/orca/actions/jobs/87186432938/logs
  gh api repos/stablyai/orca/actions/jobs/87186432948/logs
  gh api 'repos/stablyai/orca/actions/runs/29362672415/artifacts?per_page=100'
  ```

- Result: FAIL as the intended discovery boundary. Each Windows job successfully compiles the
  target and enters bounded discovery, then rejects with `MSBuild linker tracking discovery exceeds
the bounded depth` before opening or parsing a candidate. Starting at the complete generated
  `build` tree includes unrelated dependency/project subtrees; the evidence does not justify
  raising the eight-level limit. Both logs show the target binary is emitted under `build/Release`,
  which is the narrow output-tree root for the next correction.
- Uploaded controls: exactly four unpublished seven-day POSIX artifacts and no Windows artifacts:
  Linux x64 `8322871131`, 29,278,807 bytes,
  `sha256:b11ceb6bd42d28d379d32b3627a242f60cf62f78e9a7267589220ce7737b9c63`; Linux arm64
  `8322874205`, 28,209,038 bytes,
  `sha256:f2195e1f4c03d1fb6507e32b5d5328a65f351c2c22b56a8144aa1c9449c3f733`; macOS x64
  `8322934998`, 26,370,804 bytes,
  `sha256:6fea712fd57b06cc93a7e8f0f3ebda4526307258be66ba901cd3fc190f7a03ed`; and macOS arm64
  `8322879006`, 24,728,020 bytes,
  `sha256:2407308e60002c5e735cd301f1f30e9754d5c383a18f36009d14f08085f1f577`.
- Duration and resource metrics: jobs ran 2m58s Windows x64, 6m25s Windows arm64, 3m45s macOS
  arm64, 3m25s Linux arm64, 3m22s Linux x64, and 5m56s macOS x64. Windows fails after one native
  compile but before runtime smoke; no new Windows RSS, channel/file count, cancellation, or
  fallback metric exists.
- Artifact/log/trace link: run/jobs and four unpublished POSIX artifacts above; no Windows runtime
  or rejected binary was staged or uploaded
- Oracle proved: both native Windows architectures reach and enforce the same traversal-depth
  bound; whole-build-tree discovery is too broad; the target output tree is `build/Release`; all
  four POSIX controls remain reproducible and upload.
- Does not prove: whether `build/Release` contains tracking candidates, candidate/target cardinality,
  record shape, allowlisted switch summary, incremental-link state, thunk ownership, a safe producer
  correction, Windows equality, oldest baselines, native trust, SSH, publication, transfer,
  fallback, UI, or any enabled tuple.
- Checklist items satisfied: native negative discovery-root evidence only; no tuple or production
  checkbox.
- Follow-up: narrow the discovery root to `build/Release` without raising or removing any bound,
  then rerun all six native cells and require exactly one target record on both Windows runners.

### E-M3-WINDOWS-LINK-COMMAND-RELEASE-ROOT-LOCAL-001 — Release output-tree discovery scope

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `6f28a8cbf53d1cfe889ce259476eb4aaaead2d87`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741), target-native execution pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. This runner
  cannot generate the native MSBuild tree, so Windows x64/arm64 jobs remain authoritative.
- Remote and transport: none; bounded discovery-root and builder-ordering contracts only
- Red evidence: E-M3-WINDOWS-LINK-COMMAND-DISCOVERY-CI-RED-001 on both native Windows
  architectures; no synthetic local failure substitutes for that real traversal-shape evidence
- Exact green commands:

  ```sh
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  node --check config/scripts/ssh-relay-node-pty-build.mjs
  /usr/bin/time -lp pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Green result: PASS. The purpose suites pass 13/13 tests and all 15 artifact suites pass 58/58.
  Syntax checks, typecheck, focused oxlint, the 355-entry max-lines ratchet, full repository
  lint/reliability/localization, formatting, and diff checks exit zero. Full lint emits only
  pre-existing warnings outside this package.
- Duration and resource metrics: focused purpose gate 1.26 s wall / 263 ms Vitest with
  131,710,976-byte maximum RSS and 95,868,256-byte peak footprint; complete artifact gate 4.01 s
  wall / 1.92 s Vitest; typecheck 4.21 s, focused lint 0.90 s, max-lines 2.37 s, and full lint
  13.78 s. The final artifact run was parallel with static gates, so its process RSS was not
  isolated. No SSH channels/files, cancellation, fallback, or runtime latency is exercised.
- Artifact/log/trace link: current exact source/tests and local command output; no runtime artifact
  was created, staged, published, or uploaded
- Oracle proved: target discovery begins at `build/Release`, matching the exact native output tree
  evidenced by both Windows logs; tests place valid, irrelevant, duplicate, oversized, deep, and
  over-cardinality fixtures below that root. The existing entry/depth/candidate/byte, symbolic-link,
  encoding, target-cardinality, strict-parser, and POSIX no-op contracts remain unchanged.
- Does not prove: that either native Release tree contains a candidate, candidate/target
  cardinality, record shape, allowlisted switch summary, incremental-link state, thunk ownership, a
  safe producer correction, arm64 equality, oldest baselines, native trust, SSH, publication,
  transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: local Release-tree discovery scope only; no tuple or production
  checkbox.
- Follow-up: push the exact implementation and ledger head, rerun all six target-native cells, and
  require both Windows clean builds to select one target record and emit the same accepted summary
  before changing the producer.

### E-M3-WINDOWS-LINK-COMMAND-RELEASE-ROOT-CI-RED-001 — Native command classified; arm64 drift retained

- Date: 2026-07-14
- Commit SHA / PR: exact head `2db46d91b17789ce70eed5e5e496dec2ff56442a`, containing exact
  Release-root implementation commit `6f28a8cbf53d1cfe889ce259476eb4aaaead2d87`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29363423068](https://github.com/stablyai/orca/actions/runs/29363423068),
  conclusion `failure`; Windows x64 `87188953411` success, Windows arm64 `87188953416` expected
  strict-comparison failure, Linux arm64 `87188953471` success, Linux x64 `87188953495` success,
  macOS x64 `87188953507` success, and macOS arm64 `87188953532` success
- Runners: Windows x64 used `windows-2022` / `win22` `20260706.237.1`, native X64, Windows Server
  2022 build 20348; Windows arm64 used `windows-11-arm` / `win11-arm64` `20260706.102.1`, native
  ARM64, Windows build 26200. Both used Node v24.18.0 and MSVC 14.44.35207 / compiler 19.44.35228.
  Linux x64 used `ubuntu-24.04` / `ubuntu24` `20260705.232.1`; Linux arm64 used
  `ubuntu-24.04-arm` / `ubuntu24-arm64` `20260706.52.2`; macOS x64 used `macos-15-intel` /
  `macos15` `20260629.0276.1`; macOS arm64 used `macos-15` / `macos15` `20260706.0213.1`.
  Every runner checked out the exact head above.
- Remote and transport: none; target-native artifact assembly, strict comparison, and unpublished
  seven-day Actions artifacts only
- Exact evidence commands:

  ```sh
  gh run view 29363423068 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh api repos/stablyai/orca/actions/jobs/87188953411/logs
  gh api repos/stablyai/orca/actions/jobs/87188953416/logs
  gh api 'repos/stablyai/orca/actions/runs/29363423068/artifacts?per_page=100'
  ```

- Result: FAIL as the intended strict reproducibility boundary. Each clean build on both Windows
  architectures discovers three `link.command.1.tlog` candidates under 82 `build/Release` entries,
  selects exactly one record naming `conpty_console_list.node`, and accepts fatal UTF-16LE input.
  The two x64 records are 2,114 bytes and the two arm64 records are 2,092 bytes. All four report
  `incremental: unspecified` and the identical allowlisted switches `/brepro`, `/debug`,
  `/experimental:deterministic`, and `/guard:cf`; no explicit `/incremental` or `/opt` switch is
  present. Windows x64 and all four POSIX jobs compare exactly. Windows arm64 builds, verifies, and
  executes both candidates, then strict comparison rejects only
  `runtime/node_modules/node-pty/build/Release/conpty_console_list.node` and skips upload.
- Arm64 diagnostic: the two 956,928-byte modules differ at 5,826 bytes across 2,886 ranges: 5,758
  bytes in 2,879 two-byte `.text` ranges spaced 16 bytes apart, plus 68 derived
  COFF/debug/CodeView bytes. Their content IDs are
  `sha256:4c4cc3b9ee0bac3a391a49ebfce230fef1d94984ef0f66eeba59fd2833b2a0d2` and
  `sha256:26afc17c33337f6f1b8e767504a58207f4fc68cb26e807aca68a9d5e8040aba5`.
- Uploaded controls: exactly five unpublished artifacts and no Windows arm64 artifact: Windows x64
  `8323220212`, 37,075,312 bytes,
  `sha256:10a07ff4863e4a0b4aef3325540660952f03f88cc7b2c2a4013f3081b5c9310c`; Linux x64
  `8323166437`, 29,285,377 bytes,
  `sha256:21ee42d19e6a9f15e7afda18f9e27ff5ae280a19da61ef4042ca5b0a3ce608fe`; Linux arm64
  `8323165493`, 28,220,691 bytes,
  `sha256:19cb887221810cd9e9df160d6ba6a185fd6282adee90d2dde6c66ad9a83e4fe1`; macOS x64
  `8323238492`, 26,405,918 bytes,
  `sha256:af41bae838a26b1e127bc1bd20c3d1f2a6d0d5de1f6aeb9372d2b19561a2351a`; and macOS arm64
  `8323152771`, 24,729,554 bytes,
  `sha256:aff001434f0d00db32d92a13ffbb40ed4f0cc0199cf29925109fc7f7bbf84977`.
- Duration and resource metrics: jobs ran 5m33s Windows x64, 8m15s Windows arm64, 3m25s Linux
  arm64, 3m30s Linux x64, 6m18s macOS x64, and 2m55s macOS arm64. Windows arm64 clean builds took
  135,371.797 ms and 118,713.734 ms; smoke took 5,767.417 ms at 53,186,560-byte RSS and
  5,443.331 ms at 51,802,112-byte RSS. SSH channels/files, cancellation, and fallback delay remain
  outside this artifact-only run.
- Artifact/log/trace link: run/jobs and the five unpublished artifacts above; rejected arm64 bytes
  existed only in the bounded job workspace and logs and were not uploaded
- Oracle proved: the native Release-tree shape, candidate and target cardinality, record encoding,
  and allowlisted linker summary on both Windows architectures; no explicit incremental-link switch;
  five exact clean-build controls; unchanged arm64 thunk drift; strict rejection and no-upload.
- Does not prove: effective incremental linking when `/DEBUG` supplies a default, the target `.ilk`
  state, a safe producer correction, arm64 equality, oldest baselines, native trust, SSH,
  publication, transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: native Release-root/command diagnostic only; no tuple or production
  checkbox.
- Follow-up: inspect only the exact target `.ilk` file's presence and size within the already
  bounded clean Release tree on both architectures. If it is present, require target-native evidence
  before considering copied-artifact `/INCREMENTAL:NO`; if absent, investigate the next bounded
  linker feature. Preserve `/guard:cf`, strict comparison, rejected-output no-upload, and all
  repository-wide/default behavior.

### E-M3-WINDOWS-INCREMENTAL-DATABASE-LOCAL-001 — Bounded target `.ilk` diagnostic

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `e7d9a1c8d3222ff5923679ad69b76b57d963c4f3`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741), target-native execution pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. This runner
  cannot produce a native MSVC `.ilk`, so Windows x64/arm64 jobs remain authoritative.
- Remote and transport: none; bounded local discovery/result-shape contracts only
- Red evidence: E-M3-WINDOWS-LINK-COMMAND-RELEASE-ROOT-CI-RED-001 proves both native commands carry
  `/DEBUG` but no explicit `/INCREMENTAL`; no synthetic local result substitutes for the pending
  target-native file-state evidence
- Exact green commands:

  ```sh
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  /usr/bin/time -lp pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  /usr/bin/time -lp pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Result: PASS. The purpose suites pass 13/13 tests and all 15 artifact suites pass 58/58. Syntax,
  typecheck, focused oxlint, the 355-entry max-lines ratchet, full repository
  lint/reliability/localization, formatting, diff, and staged pre-commit hooks exit zero. Full lint
  emits only pre-existing warnings outside this artifact package.
- Duration and resource metrics: purpose gate 0.94 s wall / 204 ms Vitest with 131,940,352-byte
  maximum RSS and 96,081,224-byte peak footprint; complete artifact gate 3.50 s wall / 1.59 s
  Vitest with 132,235,264-byte maximum RSS and 96,392,544-byte peak footprint. The parallel
  typecheck/focused-lint/max-lines group completed in 3.8 s; full lint completed in 17.3 s and
  formatting/diff checks in 0.8 s. No runtime archive, SSH channel/file, cancellation, fallback, or
  launch-latency metric is exercised by this diagnostic-only package.
- Artifact/log/trace link: exact implementation commit and local command output; no runtime artifact
  was created, staged, published, or uploaded
- Oracle proved: the already bounded and deterministic `build/Release` traversal detects at most one
  exact case-insensitive `conpty_console_list.ilk`; duplicate target databases fail closed; a present
  file reports only a safe numeric byte size, absence reports no guessed link state, symbolic links
  retain the existing rejection, and POSIX remains a no-op. The diagnostic result is appended to
  the existing allowlisted MSBuild summary before staging.
- Does not prove: whether either native Windows build emits the target `.ilk`, that `.ilk` presence
  alone owns the arm64 thunk drift, that `/INCREMENTAL:NO` is a safe correction, arm64 equality,
  oldest baselines, native trust, SSH, publication, transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: local bounded target incremental-database diagnostic only; no tuple or
  production checkbox.
- Follow-up: push the exact implementation plus ledger head, rerun all six native cells, and require
  both clean builds on both Windows architectures to report the target `.ilk` state before any
  producer change. Preserve `/guard:cf`, strict comparison, no rejected upload, and every
  default/legacy boundary.

### E-M3-WINDOWS-INCREMENTAL-DATABASE-CI-RED-001 — Native `.ilk` proves implicit incremental link

- Date: 2026-07-14
- Commit SHA / PR: exact ledger head `d1eca8a55dec3e96f9ecf1600e8e6e169cdfd3fe`, containing exact
  diagnostic implementation commit `e7d9a1c8d3222ff5923679ad69b76b57d963c4f3`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29364581781](https://github.com/stablyai/orca/actions/runs/29364581781),
  conclusion `failure`; Windows x64 `87192850326` success, Windows arm64 `87192850417` expected
  strict-comparison failure, Linux arm64 `87192850309` success, Linux x64 `87192850444` success,
  macOS x64 `87192850303` success, and macOS arm64 `87192850364` success
- Runners: Windows x64 used `windows-2022` / `win22` `20260706.237.1`, native X64; Windows arm64
  used `windows-11-arm` / `win11-arm64` `20260706.102.1`, native ARM64. Linux x64 used
  `ubuntu-24.04` / `ubuntu24` `20260705.232.1`; Linux arm64 used `ubuntu-24.04-arm` /
  `ubuntu24-arm64` `20260706.52.2`; macOS x64 used `macos-15-intel` / `macos15`
  `20260629.0276.1`; macOS arm64 used `macos-15` / `macos15` `20260706.0213.1`. Every runner
  checked out the exact head above; both Windows jobs used Node v24.18.0 and MSVC 14.44.35207 /
  compiler 19.44.35228.
- Remote and transport: none; target-native artifact assembly, strict comparison, and unpublished
  seven-day Actions artifacts only
- Exact evidence commands:

  ```sh
  gh run view 29364581781 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh api repos/stablyai/orca/actions/jobs/87192850326/logs
  gh api repos/stablyai/orca/actions/jobs/87192850417/logs
  gh api 'repos/stablyai/orca/actions/runs/29364581781/artifacts?per_page=100'
  curl -fsSL --proto '=https' --tlsv1.2 \
    'https://learn.microsoft.com/en-us/cpp/build/reference/incremental-link-incrementally?view=msvc-170' \
    | rg -i -C 2 'DEBUG|incremental.*default|\.ilk|INCREMENTAL:NO'
  ```

- Result: FAIL as the intended strict evidence boundary. Both clean x64 builds report the same
  4,238,838-byte `conpty_console_list.ilk`; both clean arm64 builds report the same 4,980,517-byte
  target database. All four still report `/debug` with `incremental: unspecified` and no explicit
  `/incremental` or `/opt` switch in the command record. Microsoft documents that `/DEBUG` implies
  `/INCREMENTAL`, incremental links create/update an `.ilk`, and `/INCREMENTAL:NO` overrides the
  default. Windows x64 and all four POSIX controls compare exactly. Windows arm64 builds, verifies,
  and executes both candidates, then rejects only `conpty_console_list.node` and skips upload.
- Arm64 diagnostic: the two 956,928-byte modules again differ at 5,826 bytes across 2,886 ranges:
  5,758 bytes in 2,879 two-byte `.text` ranges spaced 16 bytes apart, plus the same 68 derived
  COFF/debug/CodeView bytes. Their content IDs are
  `sha256:b38d3343e96f339eb7197a4fb379b5f636d5f6752d42434b508bb7c67803f57c` and
  `sha256:9d937233f63b142f03e504af2ffeeeb05b2de2b979047a369a79dd1d793b1786`.
- Uploaded controls: exactly five unpublished artifacts and no Windows arm64 artifact: Windows x64
  `8323660213`, 37,075,309 bytes,
  `sha256:788c43c94db25e995e6d36ab437d841e01a24846f3b8ec519f62fd7bebeb4fbd`; Linux x64
  `8323618920`, 29,280,401 bytes,
  `sha256:0b19a0b1dd78793ae0d55f7077eb871a7a8f98d3f7e4c3b8fd5f457f8f008fd6`; Linux arm64
  `8323624757`, 28,207,487 bytes,
  `sha256:cf4bb8255b260fc9109b9180b05d561a3b3cb0c3eeb791d111aff649368a5c86`; macOS x64
  `8323808296`, 26,420,419 bytes,
  `sha256:4117ae641972cad3936b9733b8461148ab2e4e3280cb3d27d31b479d966e412a`; and macOS arm64
  `8323599375`, 24,749,802 bytes,
  `sha256:b29cba1d66f7fedfa89bd4994d0186b5f2e0f89a17b95d709727808e0ccf3590`.
- Duration and resource metrics: jobs ran 4m56s Windows x64, 10m25s Windows arm64, 3m32s Linux
  arm64, 3m22s Linux x64, 10m47s macOS x64, and 2m38s macOS arm64. Windows arm64 clean builds took
  156,490.445 ms and 135,338.371 ms; smoke took 5,949.372 ms at 53,084,160-byte RSS and
  5,425.281 ms at 52,871,168-byte RSS. SSH channels/files, cancellation, and fallback delay remain
  outside this artifact-only run.
- Artifact/log/trace link: run/jobs, Microsoft linker reference above, and the five unpublished
  artifacts; rejected arm64 bytes existed only in the bounded job workspace and logs and were not
  uploaded
- Oracle proved: a fresh target incremental-link database on both clean builds and both native
  architectures; the documented `/DEBUG`-implied incremental state; stable target database sizes;
  five exact controls; unchanged arm64 thunk drift; strict rejection and no rejected upload.
- Does not prove: that `/INCREMENTAL:NO` removes the thunk drift, that all six outputs compare,
  oldest baselines, native trust, SSH, publication, transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: native implicit-incremental-link classification only; no tuple or
  production checkbox.
- Follow-up: add exactly one `/INCREMENTAL:NO` to only the copied node-pty Windows linker options.
  Fail closed unless the generated project and actual command each contain it exactly once and the
  clean tree contains no target `.ilk`; rerun all six native cells with `/guard:cf`, strict
  comparison, and rejected-output no-upload unchanged.

### E-M3-WINDOWS-INCREMENTAL-DISABLE-LOCAL-001 — Copied-artifact full-link correction

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `6dfdfa0bd0d812c20981ffb728ddd18273097e6a`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741), target-native execution pending
- Runner: macOS 26.2 build 25C56, native Apple M4 arm64; Node v26.0.0 and pnpm 10.24.0. This runner
  cannot execute MSVC, so Windows x64/arm64 jobs remain authoritative.
- Remote and transport: none; copied-source, generated-project, actual-command/result-shape, and
  ordering contracts only
- Red evidence: E-M3-WINDOWS-INCREMENTAL-DATABASE-CI-RED-001 proves both native architectures use
  `/DEBUG`-implied incremental linking, create stable target `.ilk` files, and retain the arm64 thunk
  drift; no synthetic local failure substitutes for that target-native evidence
- Exact green commands:

  ```sh
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs
  node --check config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs
  /usr/bin/time -lp pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  /usr/bin/time -lp pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-node-release-verification.test.mjs \
    config/scripts/ssh-relay-node-tar-inspection.test.mjs \
    config/scripts/ssh-relay-node-pty-build.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-windows-settlement.test.mjs \
    config/scripts/ssh-relay-node-zip-inspection.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-build.test.mjs \
    config/scripts/ssh-relay-runtime-pty-smoke.test.mjs \
    config/scripts/ssh-relay-runtime-reproducibility.test.mjs \
    config/scripts/ssh-relay-runtime-resource-diagnostics.test.mjs \
    config/scripts/ssh-relay-runtime-windows-pe-diagnostic.test.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs
  pnpm run typecheck
  pnpm exec oxlint \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs
  pnpm run check:max-lines-ratchet
  GOMAXPROCS=2 pnpm run lint
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.mjs \
    config/scripts/ssh-relay-node-pty-windows-build-determinism.test.mjs \
    config/scripts/ssh-relay-node-pty-build.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Result: PASS. The purpose suites pass 13/13 tests and all 15 artifact suites pass 58/58. Syntax,
  typecheck, focused oxlint, the 355-entry max-lines ratchet, full repository
  lint/reliability/localization, formatting, diff, and staged pre-commit hooks exit zero. Full lint
  emits only pre-existing warnings outside this artifact package.
- Duration and resource metrics: purpose gate 1.00 s wall / 202 ms Vitest with 132,235,264-byte
  maximum RSS and 96,408,952-byte peak footprint; complete artifact gate 2.63 s wall / 1.13 s
  Vitest with 132,251,648-byte maximum RSS and 96,490,944-byte peak footprint. The parallel
  typecheck/focused-lint/max-lines group completed in 3.1 s; full lint and format/diff gates settled
  within 10.1 s. No runtime archive, SSH channel/file, cancellation, fallback, or launch-latency
  metric is exercised by this local package.
- Artifact/log/trace link: exact implementation commit and local command output; no runtime artifact
  was created, staged, published, or uploaded
- Oracle proved: only the copied Windows node-pty linker options gain exactly one
  `/INCREMENTAL:NO`; compiler options remain separate and `/guard:cf` remains present; source drift
  or repeat transformation fails closed; generated Release projects must inherit exactly one disable
  switch; actual target commands must classify it as disabled; any target `.ilk` fails before
  staging; POSIX and the installed repository source remain unchanged. Both source and test modules
  remain below 300 lines without a max-lines bypass.
- Does not prove: MSVC accepts/propagates the option on either native architecture, that target
  `.ilk` is absent, that the arm64 thunks become stable, that all six outputs compare and upload,
  oldest baselines, native trust, SSH, publication, transfer, fallback, UI, or any enabled tuple.
- Checklist items satisfied: local copied-artifact incremental-disable contract only; no tuple or
  production checkbox.
- Follow-up: push the exact implementation plus ledger head and rerun all six target-native cells.
  Require both Windows clean builds to report `/incremental:no`, no target `.ilk`, complete runtime
  smoke, exact output equality, and upload before accepting the correction.

### E-M3-REPRODUCIBILITY-CI-001 — All six target-native clean builds compare and upload

- Date: 2026-07-14
- Commit SHA / PR: exact ledger head `3ec1a48afde95618fb7e3f6be71303410e6701dd`, containing exact
  incremental-disable implementation commit `6dfdfa0bd0d812c20981ffb728ddd18273097e6a`; stacked draft
  PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29365815434](https://github.com/stablyai/orca/actions/runs/29365815434),
  conclusion `success`; Windows arm64 `87196982746`, Windows x64 `87196982776`, Linux arm64
  `87196982798`, Linux x64 `87196982795`, macOS x64 `87196982820`, and macOS arm64 `87196982760`
  all passed
- Runners: Windows x64 used `windows-2022` / `win22` `20260706.237.1`, native X64; Windows arm64
  used `windows-11-arm` / `win11-arm64` `20260706.102.1`, native ARM64. Linux x64 used
  `ubuntu-24.04` / `ubuntu24` `20260705.232.1`; Linux arm64 used `ubuntu-24.04-arm` /
  `ubuntu24-arm64` `20260706.52.2`; macOS x64 used `macos-15-intel` / `macos15`
  `20260629.0276.1`; macOS arm64 used `macos-15` / `macos15` `20260706.0213.1`. Every runner
  checked out the exact head above; both Windows jobs used Node v24.18.0 and MSVC 14.44.35207 /
  compiler 19.44.35228.
- Remote and transport: none; target-native runtime assembly, exact clean-build comparison, and
  unpublished seven-day Actions artifacts only
- Exact evidence commands:

  ```sh
  gh run view 29365815434 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh api repos/stablyai/orca/actions/jobs/87196982776/logs
  gh api repos/stablyai/orca/actions/jobs/87196982746/logs
  gh api 'repos/stablyai/orca/actions/runs/29365815434/artifacts?per_page=100'
  ```

- Result: PASS. Both clean x64 builds report one generated and actual `/INCREMENTAL:NO`, retain
  `/guard:cf`, parse a 2,146-byte UTF-16LE command record, search 79 bounded Release-tree entries,
  and find no target `.ilk`. Both clean arm64 builds report the same contract with a 2,124-byte
  command record and no target `.ilk`. Each architecture then executes bundled Node v24.18.0,
  loads the exact ABI-137 native modules, proves PTY input/resize/exit and watcher
  create/update/delete, settles Windows native resources, verifies the archive, and compares the
  complete runtime tree, archive, identity, SPDX, and provenance exactly before upload. No PE
  mismatch diagnostic runs.
- Stable Windows identities: x64 content ID
  `sha256:6f7cbeb120e67766037649f6079099346220973e6158e1429b6ebf42729f1564` and archive
  `sha256:d24ca7ee8734e948c845d792ba0974a2590df7c8b60068a46f3eb1dc24af5f36`; arm64 content ID
  `sha256:741765a10ddc824cd305b9a50c8efd91477517c05d9cfe1ca46342c002652186` and archive
  `sha256:3e1e89234cd0d139a2a1376e7cd5e17ab47e31a6c3c2f9dcb8e73317ead5c6aa`.
- Uploaded evidence: exactly six unpublished artifacts: Windows arm64 `8324239473`, 33,083,333
  bytes, `sha256:51d590835597969b1261f81487eea433f23e1c04818c96f2f1e5d48b16688b42`;
  Windows x64 `8324177555`, 37,033,210 bytes,
  `sha256:3bde38ab4159bea7b420118862db3725ce845084ab515cc3e08de439aceb308a`; Linux arm64
  `8324115839`, 28,209,475 bytes,
  `sha256:4f7272d896616326a5231170054a71134122c0263200361cf46431951fe01307`; Linux x64
  `8324100611`, 29,286,004 bytes,
  `sha256:346afca964edbe932f868a8ff00e13adba7d3d0c489ef0bdce8ca275134dc27e`; macOS x64
  `8324167852`, 26,427,328 bytes,
  `sha256:0d265ebc18798680de250955daf9038fded4a45c596cb6609f847eef328d9668`; and macOS arm64
  `8324088333`, 24,713,338 bytes,
  `sha256:aed95365e3cf309f723142eb6638caad2faf46cacde60661c95cffb1703734cf`.
- Duration and resource metrics: jobs ran 8m39s Windows arm64, 6m07s Windows x64, 3m42s Linux
  arm64, 3m10s Linux x64, 5m45s macOS x64, and 2m43s macOS arm64. Windows x64 clean builds took
  127,019.748 ms and 80,495.086 ms; smoke took 5,383.956 ms at 53,903,360-byte RSS and
  5,343.569 ms at 53,874,688-byte RSS. Windows arm64 clean builds took 139,406.185 ms and
  123,440.275 ms; smoke took 5,782.042 ms at 51,310,592-byte RSS and 5,463.552 ms at
  51,372,032-byte RSS. SSH channels/files, cancellation, fallback delay, and connection latency
  remain outside this artifact-only run.
- Artifact/log/trace link: run/jobs and six unpublished artifacts above; no release asset was
  published and no production consumer exists
- Oracle proved: target-native generated/actual full-link settings, absence of incremental-link
  databases, all-six clean-build reproducibility, exact archive/identity/SBOM/provenance equality,
  complete candidate runtime smoke, strict comparison, and successful evidence upload. The prior
  Windows arm64 thunk drift is closed at the copied producer without byte normalization.
- Does not prove: oldest supported OS/kernel/libc execution, native code-signing trust, packaged
  desktop embedding, SSH/SFTP/system-SSH transfer, remote install/launch, fallback, UI, performance,
  publication, or any enabled tuple.
- Checklist items satisfied: current-candidate native clean-build reproducibility and the exact
  bundled Node/native PTY/watcher archive-execution rule. No tuple or production path is enabled.
- Follow-up: audit the remaining runtime closure/SBOM/provenance claims against the exact staged
  allowlist and purpose tests, then address oldest-baseline and native-trust gates. Preserve the
  artifact-only boundary and all legacy/default behavior.

### E-M3-RUNTIME-CLOSURE-LOCAL-001 — Exact per-tuple closure fails before archiving

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `ec5461aff61d6868c18d4db1ce27f409a43ecf47`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: local macOS 26.2 build 25C56, Darwin 25.2.0 arm64 on Apple Silicon; Node v26.0.0 and
  pnpm 10.24.0 for the pure contract suite. Candidate inputs came from all six target-native jobs in
  prior run [29365815434](https://github.com/stablyai/orca/actions/runs/29365815434); the new builder
  gate has not yet executed on those native runners.
- Remote and transport: none; artifact-only local validation of downloaded unpublished evidence
- Exact evidence commands:

  ```sh
  gh run download 29365815434 --repo stablyai/orca \
    --dir /tmp/orca-ssh-relay-runtime-29365815434
  for archive in /tmp/orca-ssh-relay-runtime-29365815434/*/*.tar.xz; do
    tar -tf "$archive"
  done
  for archive in /tmp/orca-ssh-relay-runtime-29365815434/*/*.zip; do
    unzip -Z1 "$archive"
  done
  rm -rf /tmp/orca-ssh-relay-runtime-29365815434/extracted
  mkdir -p /tmp/orca-ssh-relay-runtime-29365815434/extracted
  for directory in /tmp/orca-ssh-relay-runtime-29365815434/ssh-relay-runtime-*; do
    tuple=${directory##*/ssh-relay-runtime-}
    destination=/tmp/orca-ssh-relay-runtime-29365815434/extracted/$tuple
    mkdir -p "$destination"
    archive=$(find "$directory" -maxdepth 1 -type f \
      \( -name '*.tar.xz' -o -name '*.zip' \) -print -quit)
    case "$archive" in
      *.tar.xz) tar -xf "$archive" -C "$destination" ;;
      *.zip) unzip -q "$archive" -d "$destination" ;;
    esac
  done
  node --input-type=module -e 'import {readdir,readFile} from "node:fs/promises"; import {join} from "node:path"; import {verifySshRelayRuntimeClosure} from "./config/scripts/ssh-relay-runtime-closure.mjs"; const root="/tmp/orca-ssh-relay-runtime-29365815434"; for (const dir of (await readdir(root)).filter((name)=>name.startsWith("ssh-relay-runtime-")).sort()) { const tuple=dir.slice("ssh-relay-runtime-".length); const names=await readdir(join(root,dir)); const identity=JSON.parse(await readFile(join(root,dir,names.find((name)=>name.endsWith(".identity.json"))),"utf8")); const result=await verifySshRelayRuntimeClosure(join(root,"extracted",tuple),identity); console.log(JSON.stringify({tuple,...result,contentId:identity.contentId})); }'
  pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs
  pnpm exec oxlint config/scripts/ssh-relay-runtime-closure.mjs \
    config/scripts/ssh-relay-runtime-closure.test.mjs \
    config/scripts/ssh-relay-runtime-tree.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-closure.mjs \
    config/scripts/ssh-relay-runtime-closure.test.mjs \
    config/scripts/ssh-relay-runtime-tree.mjs
  pnpm run check:max-lines-ratchet
  git diff --check
  ```

- Result: PASS. Sixteen artifact test files passed 68 tests. The new closure suite fixes the exact
  candidate file counts at 34 for Linux, 35 for macOS, and 42 for Windows; admits exactly one
  tuple-native `@parcel/watcher@2.5.6` package; pins `node-pty@1.1.0` and all runtime JavaScript
  dependency metadata; requires canonical roles/modes, runtime metadata, and eight ordered,
  non-empty license sections; and rejects an undeclared package manager, source map, PDB, missing
  native dependency, wrong role, version refresh, omitted license, or empty license before archive
  creation. Focused syntax, lint, formatting, max-lines ratchet, and diff checks passed.
- Downloaded-candidate audit: all six prior candidate identities and extracted metadata satisfy the
  new contract without changing their content IDs: Linux x64
  `sha256:960546cd96c67fcf9bb0a61e96ecdbecbffd9104d3a495578f8bb19dd810649a`, Linux arm64
  `sha256:aa3aa8ae8b42334ba7b0dbe5c43fd1184e36b3f4f4a9bec0e990e9b78f090756`, macOS x64
  `sha256:585ea6034cdd07487d8667059f975a877c795a45dc0d6eeee1617f2e3749faa2`, macOS arm64
  `sha256:40ff5d2036784b794e7b09f78596409f63f3145280c530bece5280d40897f6cb`, Windows x64
  `sha256:6f7cbeb120e67766037649f6079099346220973e6158e1429b6ebf42729f1564`, and Windows arm64
  `sha256:741765a10ddc824cd305b9a50c8efd91477517c05d9cfe1ca46342c002652186`.
- Oracle proved: the artifact builder now has one cross-platform, fail-closed, exact closure boundary
  rather than depending on incomplete POSIX/PowerShell workflow blocklists; dependency refreshes and
  new runtime files require an explicit reviewed contract change; the prior six candidate trees
  conform to that contract.
- Does not prove: execution of this new gate on any target-native runner, that the current SBOM has
  complete package/file relationships, complete compiler/toolchain/image provenance, oldest-
  baseline execution, native trust, SSH transfer/install, publication, fallback, UI, or any enabled
  tuple.
- Checklist items satisfied: local exact-closure/prohibited-content implementation and purpose tests
  only. The broader Milestone 3 closure/SBOM/provenance items remain unchecked until the new gate
  passes all six native cells and the metadata audit closes its residual gaps.
- Follow-up: push the implementation plus this exact evidence ledger, rerun all six native jobs, and
  require unchanged runtime content IDs, builder-enforced closure, complete smoke, clean-build
  equality, and upload. Then fix and prove SBOM/provenance completeness separately.

### E-M3-RUNTIME-CLOSURE-CI-001 — Exact closure passes all six target-native builds

- Date: 2026-07-14
- Commit SHA / PR: exact ledger head `ace3d4f416b1c710d601aa72c4b45824266b5cad`, containing exact
  closure implementation commit `ec5461aff61d6868c18d4db1ce27f409a43ecf47`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Run and jobs: [run 29367559831](https://github.com/stablyai/orca/actions/runs/29367559831),
  conclusion `success`; Windows arm64 `87202773590`, Windows x64 `87202773643`, macOS arm64
  `87202773645`, macOS x64 `87202773658`, Linux x64 `87202773669`, and Linux arm64 `87202773674`
  all passed
- Runners: `windows-11-arm` / `win11-arm64` `20260706.102.1` native ARM64;
  `windows-2022` / `win22` `20260706.237.1` native X64; `macos-15` / `macos15`
  `20260706.0213.1` native ARM64; `macos-15-intel` / `macos15` `20260629.0276.1` native X64;
  `ubuntu-24.04` / `ubuntu24` `20260705.232.1` native X64; and `ubuntu-24.04-arm` /
  `ubuntu24-arm64` `20260706.52.2` native ARM64. Every job checked out the exact head above in a
  GitHub-hosted environment.
- Remote and transport: none; target-native artifact build/inspection/smoke and unpublished
  seven-day Actions artifacts only
- Exact evidence commands:

  ```sh
  gh run view 29367559831 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh run view 29367559831 --repo stablyai/orca --log | \
    rg 'requested_runner=|resolved_image_os=|resolved_image_version=|runner_arch=|runner_environment=|source_commit='
  gh run view 29367559831 --repo stablyai/orca --log | \
    rg 'Test Files|"contentId"|windows_node_pty_msbuild_settings|clean_build_output=|runtime-evidence/'
  gh api 'repos/stablyai/orca/actions/runs/29367559831/artifacts?per_page=100'
  ```

- Result: PASS. All four POSIX jobs passed 15 artifact-contract files and both Windows jobs passed 16. Each clean build then executed the builder-enforced exact closure before archiving, archive
  inspection, bundled Node/native PTY/watcher smoke, strict clean-output comparison, and upload.
  Both Windows builds retained exactly one `/INCREMENTAL:NO`, `/guard:cf`, no target `.ilk`, and
  identical native output. No tuple changed content identity: Linux x64
  `sha256:960546cd96c67fcf9bb0a61e96ecdbecbffd9104d3a495578f8bb19dd810649a`, Linux arm64
  `sha256:aa3aa8ae8b42334ba7b0dbe5c43fd1184e36b3f4f4a9bec0e990e9b78f090756`, macOS x64
  `sha256:585ea6034cdd07487d8667059f975a877c795a45dc0d6eeee1617f2e3749faa2`, macOS arm64
  `sha256:40ff5d2036784b794e7b09f78596409f63f3145280c530bece5280d40897f6cb`, Windows x64
  `sha256:6f7cbeb120e67766037649f6079099346220973e6158e1429b6ebf42729f1564`, and Windows arm64
  `sha256:741765a10ddc824cd305b9a50c8efd91477517c05d9cfe1ca46342c002652186`.
- Uploaded evidence: exactly six unpublished artifacts: Windows arm64 `8324892474`, 33,083,332
  bytes, `sha256:1b90d23c5573116cf855926db294dff906407a5703260099d0d0f58bb500eb6a`;
  Windows x64 `8324831155`, 37,033,206 bytes,
  `sha256:013fa42e0bf29a36f378dffe6d327090a042be9e5947e55e6e097d3382418c5d`; macOS arm64
  `8324786647`, 24,734,978 bytes,
  `sha256:87e2632c542964df47ab4f981da0909532c51be6b2131692e539aaa1c77d409c`; macOS x64
  `8324870620`, 26,400,500 bytes,
  `sha256:d9ddf9b00d77aa05785e0813e3a61fcb07cd8f5f06b270e9703d5f2e28c03370`; Linux arm64
  `8324781748`, 28,205,869 bytes,
  `sha256:47d40a3eacf149270efabe7688f700dcfca7c1e155bbc2188298c7e78948469b`; and Linux x64
  `8324772777`, 29,281,599 bytes,
  `sha256:5b1552f4e2d28db1f552068e3bad6eb174e83ad88800101120a92cf2f0e44121`.
- Duration and resource metrics: job wall times were 7m51s Windows arm64, 5m26s Windows x64, 3m38s
  macOS arm64, 6m58s macOS x64, 3m06s Linux x64, and 3m23s Linux arm64. SSH channels/files,
  cancellation, fallback delay, and connection latency remain outside this artifact-only run.
- Oracle proved: the exact closure is enforced inside the artifact builder on all six native runner
  families; the reviewed Node, patched native PTY, one tuple-native watcher, relay/watcher JavaScript,
  runtime metadata, and license bundle are present; package managers, development/build/source/map/
  PDB/ILK content and any unreviewed path are absent; complete smoke, reproducibility, and no-upload-
  before-success ordering remain intact.
- Does not prove: the subsequent SPDX/toolchain correction at `26bbd7b67`, oldest-baseline execution,
  native signing/trust, SSH transfer/install, publication, fallback, UI, performance, or any enabled
  tuple.
- Checklist items satisfied: build the exact patched `node-pty`; assert patch markers; include one
  compatible watcher and the complete declared runtime/license/metadata closure; exclude all
  undeclared content. No tuple or production path is enabled.
- Follow-up: prove the separately committed metadata correction on all six native cells before
  checking SBOM/toolchain completeness, then proceed to oldest-baseline and native-trust gates.

### E-M3-METADATA-LOCAL-001 — SPDX ownership and bounded toolchain provenance

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `26bbd7b67a035cdf309ccdbbaab5985f4cc797fe`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: local macOS 26.2 build 25C56, Darwin 25.2.0 arm64 on Apple Silicon; Node v26.0.0 and
  pnpm 10.24.0 for pure metadata/tool-discovery tests
- Remote and transport: none; artifact-only local contract tests
- Exact evidence commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/build-ssh-relay-runtime.mjs \
    config/scripts/ssh-relay-runtime-provenance.mjs \
    config/scripts/ssh-relay-runtime-provenance.test.mjs \
    config/scripts/ssh-relay-runtime-sbom.mjs \
    config/scripts/ssh-relay-runtime-sbom.test.mjs \
    config/scripts/ssh-relay-runtime-toolchain.mjs \
    config/scripts/ssh-relay-runtime-toolchain.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  git diff --check
  ```

- Result: PASS. Nineteen artifact test files passed 76 tests; typecheck, full lint and its
  reliability/localization/line-budget sub-gates, focused formatting, and diff checks passed. The
  SPDX builder assigns every runtime file to exactly one package with `CONTAINS`, records relay
  `DEPENDS_ON` relationships, uses the immutable content ID as relay package version, uses the exact
  archive SHA-256 in the unique document namespace, and rejects unowned paths, identifier collisions,
  or a missing archive digest. The provenance collector pins the builder URL to the exact Git commit,
  requires the requested/resolved runner label, OS, architecture, hosted environment, and image
  version, selects the real Windows compiler/linker version from stderr rather than the usage line,
  and records bounded SHA-256 plus version for bundled/build Node, compiler, linker where applicable,
  build system, Python, archive tool, strip tool where applicable, and complete bounded trees for
  `node-gyp`, `node-addon-api`, and `yazl` where applicable.
- Oracle proved: the prior placeholder relay SBOM version, unowned file inventory, content-ID-only
  document namespace, merge-ref builder identity, missing runner identity, un-hashed tool strings,
  and Windows compiler usage-string record are corrected by one fail-closed metadata boundary; local
  native discovery produces only bounded version/digest records without absolute host paths.
- Does not prove: Windows tool discovery/version parsing, all six runner-image records, clean-build
  equality of the new SBOM/provenance bytes, uploaded metadata, an external SPDX consumer, native
  signing/trust, oldest baselines, SSH, publication, or any enabled tuple.
- Checklist items satisfied: local SBOM/provenance/toolchain implementation and purpose tests only;
  native metadata/toolchain boxes remain unchecked.
- Follow-up: push the exact implementation plus this ledger head, rerun all six native cells, inspect
  each uploaded SPDX/provenance document, and require complete bounded records and clean-build
  equality before closing the remaining Milestone 3 metadata/toolchain claims.

### E-M3-METADATA-CI-RED-001 — Native metadata probes fail closed on Windows

- Date: 2026-07-14
- Commit SHA / PR: exact tested head `27e932c8cbc44f09d9b410d3aca519e7d1b8e9fe`;
  stacked draft PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: [GitHub Actions run 29368482959](https://github.com/stablyai/orca/actions/runs/29368482959),
  final conclusion `failure` after 7m56s. Native job IDs: Linux x64 `87205814073`, Linux arm64
  `87205814134`, macOS x64 `87205814075`, macOS arm64 `87205814110`, Windows x64 `87205814074`,
  and Windows arm64 `87205814066`.
- Remote and transport: none; target-native artifact-only build workflow
- Exact evidence commands:

  ```sh
  gh run view 29368482959 --repo stablyai/orca --json status,conclusion,headSha,url,jobs
  gh api repos/stablyai/orca/actions/jobs/87205814074/logs
  gh api repos/stablyai/orca/actions/jobs/87205814066/logs
  gh api repos/stablyai/orca/actions/runs/29368482959/artifacts
  gh run download 29368482959 --repo stablyai/orca --dir /tmp/orca-8450-metadata-red-29368482959
  # Parse every downloaded identity/SPDX/provenance document and hash every archive locally.
  ```

- Result: EXPECTED RED. Linux x64 completed in 2m58s, Linux arm64 in 3m24s, macOS arm64 in 4m08s,
  and macOS x64 in 7m56s; each passed the 19-file/76-test native contract suite, built twice, smoked,
  compared every runtime/archive/identity/SPDX/provenance byte exactly, and uploaded. Windows x64
  failed in 1m32s and Windows arm64 in 4m09s at
  `ssh-relay-runtime-toolchain.test.mjs` before input download, build, smoke, comparison, or upload:
  line 217 could not select a linker version because direct no-argument `link.exe` invocation was
  silent on both hosted MSVC environments. The four POSIX artifact IDs are Linux x64 `8325127644`,
  Linux arm64 `8325138929`, macOS arm64 `8325153830`, and macOS x64 `8325244087`; no Windows
  artifact exists for this run.
- Downloaded-artifact audit: all four archive hashes match identity and provenance; every SPDX
  namespace is scoped to the exact archive SHA-256; all 34 Linux and 35 macOS files have exactly one
  package `CONTAINS` owner; each document has eight relay dependency relationships; builder URLs pin
  exact commit `27e932c8c`; and runner labels, OS, architecture, hosted environment, image OS, and
  image version are present and correct. POSIX content IDs remain `960546cd…` Linux x64,
  `aa3aa8ae…` Linux arm64, `585ea603…` macOS x64, and `40ff5d20…` macOS arm64.
- Additional defect exposed by direct payload inspection: both Linux provenance documents record
  the first no-argument GNU `strip` usage line instead of a version. macOS records Xcode 16.4 and
  has no equivalent defect. A green job alone would not have caught this semantic provenance gap.
- Oracle proved: native metadata generation, equality, archive-scoped SPDX identity, package/file
  ownership, dependency relationships, commit-pinned builder identity, and runner identity work on
  all four POSIX cells; both Windows cells reject incomplete linker provenance before producing or
  uploading bytes; direct artifact audit detects semantically wrong tool-version records.
- Does not prove: any Windows metadata/build output, valid GNU strip version records, complete
  all-six toolchain provenance, regenerated Windows compatibility identities, oldest baselines,
  native trust/signing, SSH, publication, or an enabled tuple.
- Checklist items satisfied: no new completion box; the compiler/toolchain item remains in progress.
- Follow-up: explicitly request bounded linker help, request GNU `strip --version`, correct the
  reviewed Windows 19045/26100 compatibility floors, and rerun every native cell from one exact head.

### E-M3-METADATA-CORRECTION-LOCAL-001 — Native version probes and Windows build floors

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `e3f76d3ba70c860242b5300aa765fbf75ef21317`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: local macOS 26.2 build 25C56, Darwin 25.2.0 arm64 on Apple Silicon; Node v26.0.0 and
  pnpm 10.24.0 for pure contract tests
- Remote and transport: none; artifact/selector-only local contract tests
- Exact evidence commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-*.test.mjs \
    src/main/ssh/ssh-relay-artifact-selector.test.ts
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-toolchain.mjs \
    config/scripts/ssh-relay-runtime-toolchain.test.mjs \
    config/scripts/ssh-relay-runtime-tree.mjs \
    config/scripts/ssh-relay-runtime-windows-tree.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    src/main/ssh/ssh-relay-artifact-selector.test.ts \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-plan.html \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist-summary.md
  git diff --check
  ```

- Result: PASS. Twenty test files passed 96 tests; typecheck, full lint and its
  reliability/localization/line-budget sub-gates, max-lines ratchet, focused formatting, and diff
  checks passed. The only full-lint diagnostics are pre-existing unrelated warnings. `link.exe` is
  now invoked with `/?`, GNU strip with `--version`, and Apple strip remains tied to the selected
  Xcode version. Generated Windows runtime identities now encode the reviewed monotonic build floors:
  x64 `19045` and arm64 `26100`. Purpose-named selector tests reject x64 `19044` and arm64 `26099`
  while accepting x64 `19045` and arm64 `26100`; both runtime-tree variants carry the same floors.
- Oracle proved: the two native probe regressions have bounded explicit invocation contracts; the
  artifact producer, ZIP fixture, and desktop selector tests agree with the reviewed Windows
  compatibility decision; unknown/older Windows evidence still takes the classified legacy path.
- Does not prove: either corrected probe on a native Windows/Linux runner, actual compiler/linker/
  strip values in uploaded provenance, clean-build equality after Windows identity changes, oldest
  Windows execution, native trust/signing, SSH, publication, or an enabled tuple. The Windows
  compatibility change intentionally changes both Windows content IDs and requires fresh native
  evidence.
- Checklist items satisfied: local correction only; the compiler/toolchain, oldest-baseline, and
  native-trust boxes remain unchecked.
- Follow-up: push the exact implementation and ledger head, then require all six native jobs plus
  direct inspection of every uploaded metadata document before closing the metadata/toolchain gate.
- Subsequent native evidence: E-M3-METADATA-CI-RED-002 disproves the locally inferred
  `link.exe /?` behavior;
  both hosted Windows architectures remain silent when the help output is piped by Node.

### E-M3-METADATA-CI-RED-002 — Linker help remains silent on native Windows

- Date: 2026-07-14
- Commit SHA / PR: exact tested head `c906c21ce117021885ec4db68c62ef28c141d7ba`;
  stacked draft PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: [GitHub Actions run 29369350259](https://github.com/stablyai/orca/actions/runs/29369350259),
  final conclusion `failure` after 6m15s. Native job IDs: Linux x64 `87208675566`, Linux arm64
  `87208675357`, macOS x64 `87208675363`, macOS arm64 `87208675377`, Windows x64 `87208675364`,
  and Windows arm64 `87208675391`.
- Remote and transport: none; target-native artifact-only build workflow
- Exact evidence commands:

  ```sh
  gh run view 29369350259 --repo stablyai/orca --json status,conclusion,headSha,jobs
  gh api repos/stablyai/orca/actions/jobs/87208675364/logs
  gh api repos/stablyai/orca/actions/jobs/87208675391/logs
  gh api repos/stablyai/orca/actions/runs/29369350259/artifacts
  gh run download 29369350259 --repo stablyai/orca --dir /tmp/orca-8450-metadata-red-29369350259
  # Parse every downloaded identity/SPDX/provenance document and hash every archive locally.
  ```

- Result: EXPECTED RED. Linux x64 completed in 2m53s, Linux arm64 in 3m30s, macOS arm64 in 2m52s,
  and macOS x64 in 6m14s; each passed native contracts, built twice, smoked, compared every
  runtime/archive/identity/SPDX/provenance byte exactly, and uploaded. Windows x64 failed in 1m24s
  and Windows arm64 in 3m51s at the same linker-version selector before input download, build,
  smoke, comparison, or upload. Explicit `link.exe /?` is still silent when invoked through the
  bounded Node child-process pipe on both hosted MSVC environments. The four POSIX artifact IDs are
  Linux x64 `8325461679`, Linux arm64 `8325476952`, macOS arm64 `8325460610`, and macOS x64
  `8325542377`; no Windows artifact exists for this run.
- Downloaded-artifact audit: all four archive hashes match identity and provenance; every SPDX
  namespace is scoped to the exact archive SHA-256; all 34 Linux and 35 macOS files have exactly one
  package owner and eight dependency relationships; builder URLs pin exact commit `c906c21ce`;
  runner identities are complete; Linux x64/arm64 now record `GNU strip (GNU Binutils for Ubuntu)
2.42`; and no tool record contains a usage line. POSIX content IDs remain unchanged.
- Oracle proved: the corrected GNU version probe works and stays reproducible on both Linux
  architectures; all four POSIX metadata contracts are complete for this head; direct linker banner
  parsing is not a portable Windows provenance source and fails closed on both native architectures.
- Does not prove: Windows metadata/build output, regenerated Windows content identities, native
  linker file versions, oldest baselines, native trust/signing, SSH, publication, or an enabled tuple.
- Checklist items satisfied: no new completion box; the compiler/toolchain item remains in progress.
- Follow-up: retain SHA-256 of the resolved linker but obtain its actual PE file version without
  relying on linker stdout/stderr, then rerun every native cell from one exact head.

### E-M3-WINDOWS-LINKER-FILE-VERSION-LOCAL-001 — Authenticated linker PE version

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `e85f0c700c1bd40e76e08ef5063f9b3128acb600`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: local macOS 26.2 build 25C56, Darwin 25.2.0 arm64 on Apple Silicon; Node v26.0.0 and
  pnpm 10.24.0 for pure invocation/metadata tests
- Remote and transport: none; artifact-only local contract tests
- Exact evidence commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-*.test.mjs \
    src/main/ssh/ssh-relay-artifact-selector.test.ts
  pnpm run typecheck
  pnpm run lint
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-runtime-toolchain.mjs \
    config/scripts/ssh-relay-runtime-toolchain.test.mjs
  git diff --check
  ```

- Result: PASS. Twenty test files passed 97 tests; typecheck, full lint and its
  reliability/localization/line-budget sub-gates, focused formatting, and diff checks passed. The
  linker record still hashes the resolved `link.exe` bytes. Its version now comes from
  `System.Diagnostics.FileVersionInfo` through `pwsh.exe -NoLogo -NoProfile -NonInteractive`; the
  resolved path is a separate positional argument and is never interpolated into executable script
  text. Only a bounded numeric three- or four-component file version is accepted.
- Oracle proved: the native-silent banner is no longer a provenance dependency; exact linker bytes
  remain authenticated; paths containing spaces cannot alter the PowerShell expression; malformed,
  missing, or nonnumeric file versions still fail closed.
- Does not prove: the PE file-version call on either native Windows architecture, the exact returned
  linker versions, Windows build/equality/upload, regenerated Windows content IDs, oldest baselines,
  native trust/signing, SSH, publication, or an enabled tuple.
- Checklist items satisfied: local correction only; the compiler/toolchain item remains unchecked.
- Follow-up: push this exact implementation plus the ledger head and require all six native jobs and
  direct inspection of every uploaded metadata document before closing the metadata/toolchain gate.

### E-M3-METADATA-CI-RED-003 — Positional PE-version lookup remains empty on Windows

- Date: 2026-07-14
- Commit SHA / PR: exact tested head `01acba8608e3446bb921cfb812a7026817a53032`;
  stacked draft PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: [GitHub Actions run 29369925932](https://github.com/stablyai/orca/actions/runs/29369925932),
  final conclusion `failure` after 7m05s. Native job IDs and wall durations: Linux x64
  `87210560419` / 3m03s, Linux arm64 `87210560395` / 3m21s, macOS x64 `87210560388` /
  6m59s, macOS arm64 `87210560695` / 3m18s, Windows x64 `87210560429` / 1m24s, and
  Windows arm64 `87210560403` / 4m49s.
- Remote and transport: none; target-native artifact-only build workflow
- Exact evidence commands:

  ```sh
  gh run view 29369925932 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh api repos/stablyai/orca/actions/runs/29369925932/artifacts
  gh api repos/stablyai/orca/actions/jobs/87210560429/logs
  gh api repos/stablyai/orca/actions/jobs/87210560403/logs
  gh run download 29369925932 --repo stablyai/orca \
    --dir /tmp/orca-8450-metadata-red-29369925932
  find /tmp/orca-8450-metadata-red-29369925932 -maxdepth 3 -type f -print
  bash -eu -o pipefail <<'SH'
  evidence=/tmp/orca-8450-metadata-red-29369925932
  commit=01acba8608e3446bb921cfb812a7026817a53032
  run_id=29369925932
  find "$evidence" -type f \( -name '*.tar.xz' -o -name '*.zip' \) \
    -exec shasum -a 256 {} +
  for directory in "$evidence"/*; do
    identity=$(find "$directory" -type f -name '*.identity.json')
    provenance=$(find "$directory" -type f -name '*.provenance.json')
    spdx=$(find "$directory" -type f -name '*.spdx.json')
    archive=$(find "$directory" -type f \( -name '*.tar.xz' -o -name '*.zip' \))
    archive_sha=$(shasum -a 256 "$archive" | cut -d ' ' -f 1)
    jq -e --arg sha "$archive_sha" --arg commit "$commit" --arg run "$run_id" \
      --slurpfile provenance "$provenance" --slurpfile spdx "$spdx" '
        ($spdx[0].relationships | map(select(.relationshipType == "CONTAINS")) |
          group_by(.relatedSpdxElement) |
          map({key: .[0].relatedSpdxElement, value: length}) | from_entries) as $owners |
        .archive.sha256 == ("sha256:" + $sha) and
        .fileCount == ($spdx[0].files | length) and
        ([.entries[] | select(.type == "file")] | length) == ($spdx[0].files | length) and
        all($spdx[0].files[]; $owners[.SPDXID] == 1) and
        ($spdx[0].relationships | map(select(.relationshipType == "DEPENDS_ON")) | length) == 8 and
        $spdx[0].documentNamespace ==
          ("https://github.com/stablyai/orca/ssh-relay-runtime/spdx/" + $sha) and
        $provenance[0].subject[0].digest.sha256 == $sha and
        $provenance[0].predicate.runDetails.metadata.invocationId == $run and
        $provenance[0].predicate.runDetails.builder.id ==
          ("https://github.com/stablyai/orca/blob/" + $commit +
            "/.github/workflows/ssh-relay-runtime-artifacts.yml") and
        ($provenance[0].predicate.buildDefinition.resolvedDependencies |
          any(.digest.gitCommit == $commit and (.uri | endswith("@" + $commit)))) and
        ($provenance[0].predicate.runDetails.metadata.runner |
          .os != "" and .architecture != "" and .environment == "github-hosted" and
          .requestedLabel != "" and .image.os != "" and .image.version != "") and
        ($provenance[0].predicate.buildDefinition.internalParameters.toolchain | to_entries |
          all(.[]; (.value.version | length) > 0 and
            (.value.version | test("usage:"; "i") | not) and
            (.value.sha256 | test("^sha256:[0-9a-f]{64}$")))) and
        all(.entries[];
          (.path | test(
            "(^|/)(npm|npx|corepack)([.](cmd|exe))?$|[.](map|cc|cpp|h|hpp|o|obj|pdb|lib)$";
            "i"
          ) | not))
      ' "$identity" >/dev/null
    jq -c '{tupleId, contentId, fileCount, archive}' "$identity"
  done
  SH
  ```

- Result: EXPECTED RED. All four POSIX cells passed native contracts, built twice, inspected and
  smoked both outputs, compared runtime/archive/identity/SPDX/provenance bytes exactly, and uploaded.
  Windows x64 and arm64 each failed in `ssh-relay-runtime-toolchain.test.mjs` with `Runtime build
tool did not report a bounded version line`; input download, build, smoke, comparison, and upload
  were skipped. The two Windows failures occurred after target-native MSVC setup and dependency
  install, so the x64 `windows-2022` and arm64 `windows-11-arm` environments independently disprove
  the positional PowerShell path transport. No Windows artifact exists for this run.
- Downloaded-artifact audit:

  | Tuple             | Artifact ID  | Archive SHA-256                                                    | Content ID prefix | Files | Runner image                   |
  | ----------------- | ------------ | ------------------------------------------------------------------ | ----------------- | ----- | ------------------------------ |
  | linux-x64-glibc   | `8325687973` | `c71778c6ea716eb694b8d961b6bcf0c2a379761a535fa069434a7e755903b06a` | `960546cd…`       | 34    | `ubuntu24` 20260705.232.1      |
  | linux-arm64-glibc | `8325696189` | `6dc95917b828675a4700444378b96c89ff5b538e1848b3a167cc10c4702794d7` | `aa3aa8ae…`       | 34    | `ubuntu24-arm64` 20260706.52.2 |
  | darwin-x64        | `8325779710` | `332510ffba04959fbc16fdce54334fc9cca55f7b87fb19d78f1e4ce570c5b388` | `585ea603…`       | 35    | `macos15` 20260629.0276.1      |
  | darwin-arm64      | `8325693875` | `1474f808f8d1e5668060468284236ba4c81e395931fa1bf5d3dcbfed4b45a994` | `40ff5d20…`       | 35    | `macos15` 20260706.0213.1      |

  Every archive hash matches its identity and provenance subject. Every SPDX namespace ends in the
  exact archive hash; every file has exactly one package owner; each document has nine packages and
  eight dependency relationships. Builder and source identities pin exact commit `01acba860`; the
  invocation is `29369925932`; requested runner labels, native architectures, environment, and image
  versions are present. Linux records GCC 13.3.0, GNU Make 4.3, Python 3.12.3, XZ 5.4.5, and GNU
  strip 2.42. macOS records Apple clang 17.0.0, GNU Make 3.81, Python 3.14.6, XZ 5.8.3, and Xcode
  16.4. Every tool record carries a SHA-256 and no version contains a usage line.

- Oracle proved: all four POSIX metadata payloads remain semantically complete after the PE-version
  change; direct audit agrees with workflow equality; both target-native Windows architectures
  reject an empty PE-version result before unverified/incompletely described bytes can be built or
  uploaded.
- Does not prove: a working native Windows PE-version lookup, Windows build/metadata/equality/upload,
  regenerated Windows content IDs for the 19045/26100 floors, oldest baselines, native trust/signing,
  SSH, publication, or an enabled tuple.
- Checklist items satisfied: no new completion box; the all-six SBOM/provenance/toolchain item
  remains in progress.
- Follow-up: transport the resolved linker path outside PowerShell argument parsing, retain exact
  linker-byte hashing and bounded output validation, then rerun and directly audit all six cells.

### E-M3-WINDOWS-LINKER-ENV-LOCAL-001 — Environment-isolated linker path transport

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `714308114dee85a6f241a43b75c6ac9122769c3e`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: local macOS 26.2 build 25C56, Darwin 25.2.0 arm64 on Apple Silicon; Node v26.0.0 and
  pnpm 10.24.0 for pure invocation/metadata tests
- Remote and transport: none; artifact-only local contracts
- Exact evidence commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-*.test.mjs \
    src/main/ssh/ssh-relay-artifact-selector.test.ts
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-runtime-toolchain.mjs \
    config/scripts/ssh-relay-runtime-toolchain.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist-summary.md
  git diff --check
  ```

- Result: PASS. Twenty focused test files passed 98 tests in 5.90s. Typecheck passed all three
  TypeScript projects. Full lint passed oxlint, switch exhaustiveness, styled-scrollbar,
  reliability-gate, max-lines, bundled-skill, localization-catalog, and localization-coverage gates;
  its diagnostics remain pre-existing unrelated warnings. The independent max-lines ratchet,
  focused formatting, and diff checks passed.
- Oracle proved: the PowerShell expression no longer relies on `$args` parsing and never
  interpolates the linker path into executable script text; the exact resolved path is supplied in
  a dedicated child-only environment value; the child inherits the required native build
  environment; three- and four-component PE file versions with bounded release suffixes are
  accepted; missing, malformed, oversized, or unrelated output remains rejected with at most 512
  diagnostic bytes; and the resolved linker executable remains SHA-256 authenticated.
- Does not prove: the environment-value lookup on either native Windows architecture, the actual
  linker version, regenerated Windows metadata/content IDs, build/smoke/equality/upload, oldest
  Windows execution, native trust/signing, SSH, publication, or an enabled tuple.
- Checklist items satisfied: local correction only; the all-six compiler/toolchain item remains
  unchecked.
- Follow-up: push this exact implementation and ledger head, then require all six native jobs and
  direct inspection of every uploaded artifact before closing any metadata/provenance claim.

### E-M3-METADATA-CI-RED-004 — Native PE FileVersion strings are empty

- Date: 2026-07-14
- Commit SHA / PR: exact tested head `756165552d31ee962c99a3a454bce2bebb29092b`;
  stacked draft PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: [GitHub Actions run 29370926985](https://github.com/stablyai/orca/actions/runs/29370926985),
  final conclusion `failure` after 7m09s. Native job IDs and wall durations: Linux x64
  `87213791478` / 3m13s, Linux arm64 `87213791425` / 3m34s, macOS x64 `87213791432` /
  7m04s, macOS arm64 `87213791418` / 4m32s, Windows x64 `87213791403` / 2m28s, and
  Windows arm64 `87213791472` / 3m52s.
- Remote and transport: none; target-native artifact-only build workflow
- Exact evidence commands:

  ```sh
  gh run view 29370926985 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh api repos/stablyai/orca/actions/runs/29370926985/artifacts
  gh api repos/stablyai/orca/actions/jobs/87213791403/logs
  gh api repos/stablyai/orca/actions/jobs/87213791472/logs
  gh run download 29370926985 --repo stablyai/orca \
    --dir /tmp/orca-8450-metadata-red-29370926985
  # Repeat the exact fail-closed jq/shasum audit in E-M3-METADATA-CI-RED-003 with:
  # evidence=/tmp/orca-8450-metadata-red-29370926985
  # commit=756165552d31ee962c99a3a454bce2bebb29092b
  # run_id=29370926985
  ```

- Result: EXPECTED RED. All four POSIX cells passed contracts, two clean native builds, archive/tree
  inspection, bundled runtime smoke, byte-for-byte comparison, and upload. Both Windows cells passed
  MSVC setup, runner-identity collection, dependency install, and 77 contract tests, then the live
  toolchain contract failed with the now-bounded diagnostic `Runtime build tool did not report a
bounded version line: <empty>`. The PE lookup returned successfully but the `FileVersion` string
  emitted no stdout on either architecture. Input download, build, smoke, comparison, and upload
  remained skipped; no Windows artifact exists.
- Downloaded-artifact audit:

  | Tuple             | Artifact ID  | Archive SHA-256                                                    | Content ID prefix | Files |
  | ----------------- | ------------ | ------------------------------------------------------------------ | ----------------- | ----- |
  | linux-x64-glibc   | `8326078824` | `3fbd5895c66a81cef6e97c0fcc1efd210377fee6fdbb5bc56548a36377d373e5` | `960546cd…`       | 34    |
  | linux-arm64-glibc | `8326088493` | `2f1ae08f794d9a8154b0e0714d394e8da447cff7958febc904d3f68cae493a68` | `aa3aa8ae…`       | 34    |
  | darwin-x64        | `8326164493` | `b84c3d8a7c8e0c195d82185d0476f77685d171dde13ea5b5652b1ce12917564a` | `585ea603…`       | 35    |
  | darwin-arm64      | `8326107962` | `d940054bb24d79fe31b5eaad6269fcc6bbaef6ca2c1e4703b398b631dbe85081` | `40ff5d20…`       | 35    |

  All archive/subject hashes, archive-scoped SPDX namespaces, one-owner-per-file counts, eight
  dependency relationships, prohibited-content assertions, exact commit/run identities, runner
  labels/images/architectures, and bounded tool version/hash records passed. Content IDs and native
  tool versions remain identical to E-M3-METADATA-CI-RED-003; builder/source identities now pin
  exact head `756165552` and invocation `29370926985`.

- Oracle proved: environment-isolated path transport does not fix the semantic defect because the
  string `FileVersion` property itself is empty on both native hosted Windows environments; the
  bounded diagnostic distinguishes that from command failure or unexpected output; all four POSIX
  controls remain complete and reproducible at the exact tested head.
- Does not prove: that numeric PE version fields are populated, any Windows artifact or metadata,
  regenerated Windows content IDs, oldest baselines, native trust/signing, SSH, publication, or an
  enabled tuple.
- Checklist items satisfied: no new completion box; the all-six SBOM/provenance/toolchain item
  remains in progress.
- Follow-up: format the four integer PE version fields, reject `0.0.0.0`, retain exact linker-byte
  hashing and environment-isolated path transport, then rerun and directly audit all six cells.

### E-M3-WINDOWS-LINKER-NUMERIC-LOCAL-001 — Bounded numeric PE file version

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `1b775e6afe730c237f49b2d203591e07db11bfd8`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: local macOS 26.2 build 25C56, Darwin 25.2.0 arm64 on Apple Silicon; Node v26.0.0 and
  pnpm 10.24.0 for pure invocation/metadata tests
- Remote and transport: none; artifact-only local contracts
- Exact evidence commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-*.test.mjs \
    src/main/ssh/ssh-relay-artifact-selector.test.ts
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-runtime-toolchain.mjs \
    config/scripts/ssh-relay-runtime-toolchain.test.mjs
  git diff --check
  ```

- Result: PASS. Twenty focused test files passed 99 tests in 1.85s. Typecheck passed all three
  TypeScript projects. Full lint passed oxlint, switch exhaustiveness, styled-scrollbar,
  reliability-gate, max-lines, bundled-skill, localization-catalog, and localization-coverage gates;
  its diagnostics remain pre-existing unrelated warnings. The independent max-lines ratchet,
  focused formatting, and diff checks passed.
- Oracle proved: the PowerShell expression formats `FileMajorPart`, `FileMinorPart`, `FileBuildPart`,
  and `FilePrivatePart` as one exact four-component value; the selector rejects malformed versions,
  suffixes, missing output, and the version-resource-absent `0.0.0.0` form; the resolved linker path
  remains a child-only environment value and never enters executable script text; the exact resolved
  `link.exe` bytes remain SHA-256 authenticated.
- Does not prove: that either native Windows linker exposes nonzero numeric fields, the actual native
  version, Windows build/smoke/equality/upload, regenerated Windows content IDs, oldest Windows
  execution, native trust/signing, SSH, publication, or an enabled tuple.
- Checklist items satisfied: local correction only; the all-six compiler/toolchain item remains
  unchecked.
- Follow-up: push this exact implementation and ledger head, then require all six native jobs and
  direct inspection of every uploaded artifact before closing any metadata/provenance claim.

### E-M3-METADATA-CI-RED-005 — Native linkers have no PE version resource

- Date: 2026-07-14
- Commit SHA / PR: exact tested head `3c3d47fc4bf06610d43dcdb267eadfed46627b0f`;
  stacked draft PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: [GitHub Actions run 29371551072](https://github.com/stablyai/orca/actions/runs/29371551072),
  final conclusion `failure` after 7m31s. Native job IDs and wall durations: Linux x64
  `87215769010` / 3m09s, Linux arm64 `87215769039` / 3m16s, macOS x64 `87215769046` /
  7m20s, macOS arm64 `87215769029` / 2m37s, Windows x64 `87215768998` / 1m29s, and
  Windows arm64 `87215769056` / 3m55s.
- Remote and transport: none; target-native artifact-only build workflow
- Exact evidence commands:

  ```sh
  gh run view 29371551072 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh api repos/stablyai/orca/actions/runs/29371551072/artifacts
  gh api repos/stablyai/orca/actions/jobs/87215768998/logs
  gh api repos/stablyai/orca/actions/jobs/87215769056/logs
  gh run download 29371551072 --repo stablyai/orca \
    --dir /tmp/orca-8450-metadata-red-29371551072
  # Repeat the exact fail-closed jq/shasum audit in E-M3-METADATA-CI-RED-003 with:
  # evidence=/tmp/orca-8450-metadata-red-29371551072
  # commit=3c3d47fc4bf06610d43dcdb267eadfed46627b0f
  # run_id=29371551072
  ```

- Result: EXPECTED RED. All four POSIX cells again passed contracts, two clean native builds,
  archive/tree inspection, bundled runtime smoke, byte-for-byte comparison, and upload. Windows x64
  and arm64 each passed 78 contract tests after native MSVC setup, then rejected the exact diagnostic
  `Runtime build tool did not report a bounded version line: 0.0.0.0`. This proves both resolved
  `link.exe` binaries lack a usable PE version resource rather than merely an empty formatted string.
  Input download, build, smoke, comparison, and upload remained skipped; no Windows artifact exists.
- Downloaded-artifact audit:

  | Tuple             | Artifact ID  | Archive SHA-256                                                    | Content ID prefix | Files |
  | ----------------- | ------------ | ------------------------------------------------------------------ | ----------------- | ----- |
  | linux-x64-glibc   | `8326313178` | `fb30c981c7d8ef32a57485cad75850058b6bb38988c5fe34a269d6e0bd33eb06` | `960546cd…`       | 34    |
  | linux-arm64-glibc | `8326316547` | `0d70e0646540461676fe4eeb8db38c13d13e4bd747db5609dec90a957c4db79d` | `aa3aa8ae…`       | 34    |
  | darwin-x64        | `8326400647` | `fe4a79d356baf0523822e4524989df4c3b3153e36e777fc44a09b96d2926df68` | `585ea603…`       | 35    |
  | darwin-arm64      | `8326301297` | `891489f352ae978aff91c227af908514df827ee7f4aba0513f5f0891a2b99ccd` | `40ff5d20…`       | 35    |

  All archive/subject hashes, archive-scoped SPDX namespaces, one-owner-per-file counts, eight
  dependency relationships, prohibited-content assertions, exact commit/run identities, runner
  labels/images/architectures, and bounded tool version/hash records passed. POSIX content IDs and
  native tool versions remain unchanged; builder/source identities pin exact head `3c3d47fc4` and
  invocation `29371551072`.

- Oracle proved: neither string nor integer PE version metadata can identify the hosted MSVC linker;
  both architectures fail closed before producing incomplete provenance; four independent POSIX
  controls remain complete and reproducible at the exact head.
- Does not prove: a bounded alternative linker identity on Windows, any Windows artifact/metadata,
  regenerated Windows content IDs, oldest baselines, native trust/signing, SSH, publication, or an
  enabled tuple.
- Checklist items satisfied: no new completion box; the all-six SBOM/provenance/toolchain item
  remains in progress.
- Follow-up: derive the vendor toolset version from the canonical resolved MSVC linker directory,
  reject malformed/ambiguous/non-MSVC layouts, retain the exact linker SHA-256, and rerun all cells.

### E-M3-WINDOWS-LINKER-TOOLSET-LOCAL-001 — Resolved MSVC toolset identity

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `18d10da2750af66ae3486b61382ab90d5c410f8a`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: local macOS 26.2 build 25C56, Darwin 25.2.0 arm64 on Apple Silicon; Node v26.0.0 and
  pnpm 10.24.0 for pure path/provenance tests
- Remote and transport: none; artifact-only local contracts
- Exact evidence commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-*.test.mjs \
    src/main/ssh/ssh-relay-artifact-selector.test.ts
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-runtime-toolchain.mjs \
    config/scripts/ssh-relay-runtime-toolchain.test.mjs
  git diff --check
  ```

- Result: PASS. Twenty focused test files passed 98 tests in 1.47s. Typecheck passed all three
  TypeScript projects. Full lint passed oxlint, switch exhaustiveness, styled-scrollbar,
  reliability-gate, max-lines, bundled-skill, localization-catalog, and localization-coverage gates;
  its diagnostics remain pre-existing unrelated warnings. The independent max-lines ratchet,
  focused formatting, and diff checks passed.
- Oracle proved: x64 and arm64 canonical Visual Studio paths produce the bounded identity
  `MSVC 14.44.35207`; path parsing uses Windows semantics on every client OS; it requires one exact
  case-insensitive `MSVC` segment, a three-component numeric version, the immediate `bin` segment,
  an absolute path, and terminal `link.exe`; non-MSVC and ambiguous paths fail closed. The resolved
  linker executable remains SHA-256 authenticated, so the path version is provenance metadata rather
  than the byte-identity boundary. No PowerShell, PE metadata, stdout, or mutable version lookup is
  required.
- Does not prove: the exact native hosted paths, a Windows toolchain record/build/smoke/equality/
  upload, regenerated Windows content IDs, oldest Windows execution, native trust/signing, SSH,
  publication, or an enabled tuple.
- Checklist items satisfied: local correction only; the all-six compiler/toolchain item remains
  unchecked.
- Follow-up: push this exact implementation and ledger head, then require all six native jobs and
  direct inspection of every uploaded artifact before closing any metadata/provenance claim.

### E-M3-METADATA-CI-RED-006 — Hosted linker paths reject the assumed MSVC layout

- Date: 2026-07-14
- Commit SHA / PR: exact tested head `2ed6c8e3b3609a9cb4785011996988de915e807a`;
  stacked draft PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: [GitHub Actions run 29372156145](https://github.com/stablyai/orca/actions/runs/29372156145),
  final conclusion `failure` after 6m15s. Native job IDs and wall durations: Linux x64
  `87217674004` / 3m06s, Linux arm64 `87217674003` / 3m34s, macOS x64 `87217674012` /
  6m09s, macOS arm64 `87217674005` / 3m44s, Windows x64 `87217674050` / 1m29s, and
  Windows arm64 `87217674002` / 3m52s.
- Remote and transport: none; target-native artifact-only build workflow
- Exact evidence commands:

  ```sh
  gh run view 29372156145 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh api repos/stablyai/orca/actions/runs/29372156145/artifacts
  gh api repos/stablyai/orca/actions/jobs/87217674050/logs
  gh api repos/stablyai/orca/actions/jobs/87217674002/logs
  gh run download 29372156145 --repo stablyai/orca \
    --dir /tmp/orca-8450-metadata-red-29372156145
  # Repeat the exact fail-closed jq/shasum audit in E-M3-METADATA-CI-RED-003 with:
  # evidence=/tmp/orca-8450-metadata-red-29372156145
  # commit=2ed6c8e3b3609a9cb4785011996988de915e807a
  # run_id=29372156145
  ```

- Result: EXPECTED RED. All four POSIX cells passed contracts, two clean native builds,
  archive/tree inspection, bundled runtime smoke, byte-for-byte comparison, and upload. Windows x64
  and arm64 each rejected `Resolved Windows linker is not in a bounded MSVC toolset path` during
  contract tests after native MSVC setup. Both stopped before input download, build, smoke,
  comparison, or upload, so no Windows artifact exists.
- Downloaded-artifact audit:

  | Tuple             | Artifact ID  | Archive SHA-256                                                    | Content ID prefix | Files |
  | ----------------- | ------------ | ------------------------------------------------------------------ | ----------------- | ----- |
  | linux-x64-glibc   | `8326530355` | `ec09bf6a0068b3a5954af0fa17e538c9972a8389ccf420a525546fc7c63dfeb4` | `960546cd…`       | 34    |
  | linux-arm64-glibc | `8326541076` | `c13d1454e3e2592bf667a7c5925d147fd06e0f68eec7fb875dbc3750628f88b7` | `aa3aa8ae…`       | 34    |
  | darwin-x64        | `8326590799` | `5de3e4ae940a47839f8a7a2ec24bc7b63d54954357beccf7916ff7c72fab7ff3` | `585ea603…`       | 35    |
  | darwin-arm64      | `8326543567` | `8ee92c0d45d25b0fa05360c2dada50c21b2ac4ac837089a5c40c64d22ac2b9f5` | `40ff5d20…`       | 35    |

  All archive/subject hashes, archive-scoped SPDX namespaces, one-owner-per-file counts, eight
  dependency relationships, prohibited-content assertions, exact commit/run identities, runner
  labels/images/architectures, and bounded tool version/hash records passed.

- Oracle proved: the assumed strict MSVC directory layout does not match either hosted Windows
  architecture; both jobs fail closed before consuming inputs; four independent POSIX controls
  remain complete at the exact head.
- Does not prove: either actual resolved Windows path shape, a corrected bounded parser, any Windows
  artifact/metadata, oldest baselines, native trust/signing, SSH, publication, or an enabled tuple.
- Checklist items satisfied: no new completion box; the all-six SBOM/provenance/toolchain item
  remains in progress.
- Follow-up: expose only a bounded path-tail diagnostic, rerun both native Windows architectures,
  and correct the parser only after inspecting those exact paths.

### E-M3-WINDOWS-LINKER-PATH-DIAGNOSTIC-LOCAL-001 — Bounded native path evidence

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `d1eb45d613f504d7363230420f14a0c8126fe125`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: local macOS 26.2 build 25C56, Darwin 25.2.0 arm64 on Apple Silicon; Node v26.0.0 and
  pnpm 10.24.0 for pure path/provenance tests
- Remote and transport: none; artifact-only local contracts
- Exact evidence commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-*.test.mjs \
    src/main/ssh/ssh-relay-artifact-selector.test.ts
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-runtime-toolchain.mjs \
    config/scripts/ssh-relay-runtime-toolchain.test.mjs
  git diff --check
  ```

- Result: PASS. Twenty focused test files passed 99 tests. Typecheck passed all three TypeScript
  projects. Full lint passed with only existing unrelated warnings; the independent max-lines,
  focused formatting, and diff checks passed.
- Oracle proved: linker-path rejection includes at most the final 12 path segments and at most 512
  characters; truncation and suffix retention are purpose-tested. The strict identity parser and
  exact linker SHA-256 requirement remain unchanged.
- Does not prove: either native path shape, that 12 segments are sufficient to identify the correct
  bounded grammar, a Windows build/smoke/equality/upload, oldest Windows execution, native trust,
  SSH, publication, or an enabled tuple.
- Checklist items satisfied: local diagnostic only; the all-six compiler/toolchain item remains
  unchecked.
- Follow-up: push this exact commit and ledger head, inspect both bounded native path tails, and make
  only the parser correction supported by that evidence.

### E-M3-METADATA-CI-RED-007 — Git for Windows shadows the configured MSVC linker

- Date: 2026-07-14
- Commit SHA / PR: exact tested head `92f9b76101d4214c07291f6d9befa647fbc0dd86`;
  stacked draft PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: [GitHub Actions run 29372816457](https://github.com/stablyai/orca/actions/runs/29372816457),
  final conclusion `failure` after 8m11s. Native job IDs and wall durations: Linux x64
  `87219773628` / 2m44s, Linux arm64 `87219773618` / 3m33s, macOS x64 `87219773620` /
  8m06s, macOS arm64 `87219773629` / 2m59s, Windows x64 `87219773636` / 1m18s, and
  Windows arm64 `87219773684` / 5m10s.
- Remote and transport: none; target-native artifact-only build workflow
- Exact evidence commands:

  ```sh
  gh run view 29372816457 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh api repos/stablyai/orca/actions/runs/29372816457/artifacts
  gh api repos/stablyai/orca/actions/jobs/87219773636/logs
  gh api repos/stablyai/orca/actions/jobs/87219773684/logs
  gh run download 29372816457 --repo stablyai/orca \
    --dir /tmp/orca-8450-metadata-red-29372816457
  # Repeat the exact fail-closed jq/shasum audit in E-M3-METADATA-CI-RED-003 with:
  # evidence=/tmp/orca-8450-metadata-red-29372816457
  # commit=92f9b76101d4214c07291f6d9befa647fbc0dd86
  # run_id=29372816457
  ```

- Result: EXPECTED RED. All four POSIX cells passed contracts, two clean native builds,
  archive/tree inspection, bundled runtime smoke, byte-for-byte comparison, and upload. Windows x64
  and arm64 each passed 18 contract files before the live toolchain test rejected
  `C:\Program Files\Git\usr\bin\link.exe` as non-MSVC. Both stopped before input download, build,
  smoke, comparison, or upload, so no Windows artifact exists.
- Downloaded-artifact audit:

  | Tuple             | Artifact ID  | Archive SHA-256                                                    | Content ID prefix | Files |
  | ----------------- | ------------ | ------------------------------------------------------------------ | ----------------- | ----- |
  | linux-x64-glibc   | `8326768093` | `c312a404515db43b7219ec7c0f5ff8c33a1424a32b3cf42754820a1599afcec0` | `960546cd…`       | 34    |
  | linux-arm64-glibc | `8326787062` | `5e31f1377be855fdddba08dab19af92360236fc9c4a08a3c6320162aa4dca4a0` | `aa3aa8ae…`       | 34    |
  | darwin-x64        | `8326884270` | `a3cacc1aaf16c659218987972a39ff367584da456d167906b13e293874297777` | `585ea603…`       | 35    |
  | darwin-arm64      | `8326773209` | `612e7328700bef7886df5caaef92c22cbbc38ad872ca40b17f0758b28e75bd92` | `40ff5d20…`       | 35    |

  All archive/subject hashes, archive-scoped SPDX namespaces, one-owner-per-file counts, eight
  dependency relationships, prohibited-content assertions, exact commit/run identities, runner
  labels/images/architectures, and bounded tool version/hash records passed.

- Oracle proved: appending Git's signature-tool directory through `GITHUB_PATH` shadows `link.exe`
  identically on x64 and arm64; the first PATH match is not the configured compiler toolchain; both
  jobs fail closed before consuming release inputs; four independent POSIX controls remain complete.
- Does not prove: that `where.exe` exposes exactly one later canonical MSVC candidate, a Windows
  artifact/metadata record, oldest baselines, native trust/signing, SSH, publication, or an enabled
  tuple.
- Checklist items satisfied: no new completion box; the all-six SBOM/provenance/toolchain item
  remains in progress.
- Follow-up: select exactly one canonical MSVC linker from all resolved candidates, retain its exact
  SHA-256, reject zero/ambiguous matches, and rerun all six native cells.

### E-M3-WINDOWS-LINKER-SELECTION-LOCAL-001 — Unique canonical MSVC candidate

- Date: 2026-07-14
- Commit SHA / PR: exact implementation commit
  `5f0c1417d5e28a0c01f1914c41d129814237e28e`; stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: local macOS 26.2 build 25C56, Darwin 25.2.0 arm64 on Apple Silicon; Node v26.0.0 and
  pnpm 10.24.0 for pure path/provenance tests
- Remote and transport: none; artifact-only local contracts
- Exact evidence commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-*.test.mjs \
    src/main/ssh/ssh-relay-artifact-selector.test.ts
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-runtime-toolchain.mjs \
    config/scripts/ssh-relay-runtime-toolchain.test.mjs
  git diff --check
  ```

- Result: PASS. Twenty focused test files passed 100 tests. Typecheck passed all three TypeScript
  projects. Full lint passed with only existing unrelated warnings; the independent max-lines,
  focused formatting, and diff checks passed.
- Oracle proved: a non-MSVC Git `link.exe` may precede either canonical x64 or arm64 MSVC path;
  selection accepts exactly one case-insensitively deduplicated strict MSVC match, rejects zero or
  multiple matches, and bounds rejection diagnostics. The strict absolute `MSVC/<version>/bin/...`
  grammar and exact SHA-256 of the selected linker remain required. The corrected test also proves
  the long-path fixtures actually interpolate and exercise the 512-byte bounds.
- Does not prove: the exact native candidate list, a Windows build/smoke/equality/upload, regenerated
  Windows content IDs, oldest Windows execution, native trust, SSH, publication, or an enabled tuple.
- Checklist items satisfied: local correction only; the all-six compiler/toolchain item remains
  unchecked.
- Follow-up: push this exact commit and ledger head, then require all six native jobs and direct
  inspection of every uploaded artifact before closing any metadata/provenance claim.

### E-M3-METADATA-CI-001 — All-six native metadata and provenance closure

- Date: 2026-07-14
- Commit SHA / PR: exact tested head `ff3ebf37e32e9dad5834e669438efd46a974a708`;
  stacked draft PR [#8741](https://github.com/stablyai/orca/pull/8741)
- Runner: [GitHub Actions run 29373507297](https://github.com/stablyai/orca/actions/runs/29373507297),
  final conclusion `success` after 9m13s. Native job IDs and wall durations: Linux x64
  `87221923438` / 2m55s, Linux arm64 `87221923415` / 3m06s, macOS x64 `87221923414` /
  7m02s, macOS arm64 `87221923432` / 3m29s, Windows x64 `87221923434` / 4m50s, and
  Windows arm64 `87221923449` / 9m08s.
- Remote and transport: none; target-native artifact-only build workflow
- Exact evidence commands:

  ```sh
  gh run view 29373507297 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh api repos/stablyai/orca/actions/runs/29373507297/artifacts
  gh run download 29373507297 --repo stablyai/orca \
    --dir /tmp/orca-8450-metadata-green-29373507297
  # Repeat the exact fail-closed jq/shasum audit in E-M3-METADATA-CI-RED-003 with:
  # evidence=/tmp/orca-8450-metadata-green-29373507297
  # commit=ff3ebf37e32e9dad5834e669438efd46a974a708
  # run_id=29373507297
  ```

- Result: PASS. All six native cells passed contract tests, authenticated exact Node inputs, two
  independent clean builds, archive/tree inspection, bundled Node/native PTY/watcher smoke,
  byte-for-byte runtime/archive/identity/SPDX/provenance comparison, and unpublished upload. Direct
  inspection of all six downloaded payloads passed every archive/subject hash, archive-scoped SPDX
  namespace, one-owner-per-file count, eight-dependency relationship, prohibited-content, exact
  commit/run/builder/source identity, runner identity, and bounded tool version/hash assertion.
- Downloaded-artifact audit:

  | Tuple             | Artifact ID  | Archive SHA-256                                                    | Content ID prefix | Files | Runner image                   |
  | ----------------- | ------------ | ------------------------------------------------------------------ | ----------------- | ----- | ------------------------------ |
  | linux-x64-glibc   | `8327034796` | `177ad16222b08beb972bf66910bbafd32bf1e820deb007fef3304057cb6a01b8` | `960546cd…`       | 34    | `ubuntu24` 20260705.232.1      |
  | linux-arm64-glibc | `8327039534` | `9042214412ce73cd1febf94ff48a17de7bd979808e2226485fbbbf4b73fc093a` | `aa3aa8ae…`       | 34    | `ubuntu24-arm64` 20260706.52.2 |
  | darwin-x64        | `8327118454` | `449d96e0230f9f07437df571ccf4ab64bc124f9b398013e59c0d2ca1c4be0db8` | `585ea603…`       | 35    | `macos15` 20260629.0276.1      |
  | darwin-arm64      | `8327045964` | `cb593b9a30a82c743e4fffb201b57192c55af927bfce71a0cf9f6dc643dd20cb` | `40ff5d20…`       | 35    | `macos15` 20260706.0213.1      |
  | win32-x64         | `8327073419` | `b59aa25e59fb148b24dcc56d3c5ef6f1545a42673ba4e4f99a4b27fa1d0fb253` | `7ddad668…`       | 42    | `win22` 20260706.237.1         |
  | win32-arm64       | `8327157772` | `6b2fa8471a85c4d6872df34caf32acfdb7e9bf6c94cf83af06d5f19cecc1f33e` | `2955cec7…`       | 42    | `win11-arm64` 20260706.102.1   |

  Windows x64 records `MSVC 14.44.35207` with exact linker SHA-256
  `ca11e6c45debd34bf652dfe984c5360a531a005ed78bf72852330c9c2590cf0d`; Windows arm64 records the
  same bounded toolset identity with distinct exact linker SHA-256
  `f167f4e80fe6c38ba7099c22d83ef189e906b97b03d316b3cbfbac1eadc9fa6a`. No build job uses a
  container; every job records the requested native runner label, resolved image/version,
  architecture, environment, and exact tool executable or package-tree digests.

- Oracle proved: the current six candidates have complete target-native build metadata, exact
  clean-build identity, SPDX file/package ownership, license/closure contracts, runner identity,
  bounded compiler/toolchain records, and direct payload consistency at the tested exact head. The
  Git-for-Windows `link.exe` collision does not change the selected MSVC binary or its recorded hash.
- Does not prove: execution on declared oldest OS/libc/kernel floors, native signing/trust,
  cross-family SSH transfer/install, release aggregation/publication, packaged desktop consumption,
  fallback, rollout UI, performance, or an enabled tuple.
- Checklist items satisfied: the Milestone 3 compiler/toolchain/runner record item and the short
  tracker's all-six SBOM/license/provenance/toolchain/prohibited-content item.
- Follow-up: implement and run purpose-named oldest-supported-baseline checks, then prove native
  signing/trust before connecting any artifact consumer or enabling any tuple.

### E-M3-LINUX-BASELINE-LOCAL-RED-001 — Ubuntu-built Linux candidate fails the glibc 2.28 floor

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source artifact: exact-head Actions run
  [29373507297](https://github.com/stablyai/orca/actions/runs/29373507297), unpublished
  `linux-x64-glibc` artifact `8327034796`, archive SHA-256
  `177ad16222b08beb972bf66910bbafd32bf1e820deb007fef3304057cb6a01b8`, content ID
  `960546cd96c67fcf9bb0a61e96ecdbecbffd9104d3a495578f8bb19dd810649a`.
- Runner/environment: local macOS arm64 controller, Docker 29.2.1, native artifact architecture
  executed through Docker Desktop's bounded `linux/amd64` VM; container
  `docker.io/library/rockylinux@sha256:2d05a9266523bbf24f33ebc3a9832e4d5fd74b973c220f2204ca802286aa275d`
  (Rocky Linux 8.9, glibc 2.28, libstdc++.so.6.0.25). This is local red evidence only; native
  GitHub x64/arm64 repetition remains required.
- Remote and transport: no SSH remote; read-only bind-mounted unpublished runtime, container
  networking disabled, all capabilities dropped, `no-new-privileges`, 128 PIDs, 1 GiB memory, two
  CPUs, and a 64 MiB `/tmp` tmpfs.
- Commands:

  ```bash
  tar -xJf orca-ssh-relay-runtime-v1-linux-x64-glibc-960546cd….tar.xz -C "$runtime"
  docker run --rm --platform linux/amd64 --network none --read-only --cap-drop all \
    --security-opt no-new-privileges --pids-limit 128 --memory 1g --cpus 2 \
    --tmpfs /tmp:rw,nosuid,size=64m \
    --mount "type=bind,src=$PWD,dst=/workspace,readonly" \
    --mount "type=bind,src=$runtime,dst=/runtime,readonly" \
    --workdir /workspace "$image" \
    /runtime/bin/node config/scripts/ssh-relay-runtime-smoke-child.cjs /runtime
  docker run --rm --platform linux/amd64 --network none --read-only --cap-drop all \
    --security-opt no-new-privileges --pids-limit 128 --memory 1g --cpus 2 \
    --tmpfs /tmp:rw,nosuid,size=64m \
    --mount "type=bind,src=$runtime,dst=/runtime,readonly" "$image" \
    /runtime/bin/node -e "require('/runtime/node_modules/node-pty/build/Release/pty.node')"
  ```

- Result: expected RED. The complete smoke stops before PTY/watcher evidence because patched
  `node-pty` cannot load. Direct loading reports `/lib64/libc.so.6: version 'GLIBC_2.34' not found`;
  `ldd` additionally reports `GLIBC_2.32` missing. The file exists and is the identity-authenticated
  x64 ELF, so this is an ABI-floor mismatch rather than a missing archive entry.
- Verifier defect exposed: the first baseline CLI run also rejected with `Runtime baseline did not
resolve one bounded libstdc++ ABI library`; inspection found its filename parser accidentally
  removed the SONAME `6` from `libstdc++.so.6.0.25`. This is
  E-M3-BASELINE-VERIFIER-LOCAL-RED-001 and requires a focused parser test/correction before CI.
- Oracle proved: Ubuntu 24.04 producer smoke and target-native architecture alone do not prove the
  declared Linux ABI floor; current Linux candidate bytes are ineligible.
- Does not prove: native x64 timing, Linux arm64 behavior, kernel 4.18, SSH transfer/install, native
  trust, or any enabled tuple.
- Follow-up: build both Linux tuples in the digest-pinned Rocky 8.9 userland on native runners,
  correct the bounded libstdc++ filename parser, repeat smoke/baseline/equality/metadata gates, and
  keep kernel 4.18 explicitly open.

### E-M3-LINUX-BUILDER-PYTHON-LOCAL-RED-001 — Rocky 8 default Python is too old for node-gyp 12

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: uncommitted local WP2 correction at Git HEAD
  `775f2cbcc7f66f6e728fa06ae2d6822edd50f7b0`; no artifact was emitted or published.
- Runner/environment: local macOS arm64 controller, Docker 29.2.1, `linux/amd64` Docker Desktop
  emulation; builder base
  `docker.io/library/rockylinux@sha256:2d05a9266523bbf24f33ebc3a9832e4d5fd74b973c220f2204ca802286aa275d`
  (Rocky Linux 8.9, glibc 2.28, libstdc++.so.6.0.25), derived local builder image ID
  `sha256:1f06eda13b33be5d30aa1b256895516b322d329753f9743614a5c8ebf1286291`.
- Remote and transport: no SSH remote; workflow-equivalent local container with networking
  disabled, read-only root, all capabilities dropped, `no-new-privileges`, 512 PIDs, 6 GiB memory,
  four CPUs, and a 1 GiB `/tmp` tmpfs.
- Command:

  ```bash
  docker run --rm --platform linux/amd64 --network none --read-only --cap-drop all \
    --security-opt no-new-privileges --pids-limit 512 --memory 6g --cpus 4 \
    --tmpfs /tmp:rw,nosuid,size=1g <builder> \
    /usr/bin/node config/scripts/ssh-relay-runtime-linux-build-evidence.mjs \
      --tuple linux-x64-glibc --inputs-directory /evidence/inputs \
      --output-root /evidence/native-output --work-directory /evidence/native-work \
      --evidence-directory /evidence/verified-output \
      --source-date-epoch 1784069324 \
      --git-commit 775f2cbcc7f66f6e728fa06ae2d6822edd50f7b0
  ```

- Result: expected RED. The evidence driver stopped during the first `node-pty` native build before
  creating or copying any candidate. node-gyp 12.3.0 selected `/usr/bin/python3` version 3.6.8 and
  failed parsing its own `if flags := ...` syntax. The container capability probe then proved
  distro package `python39-3.9.25-2.module+el8.10.0+40046+11e46e10` installs as
  `/usr/bin/python3.9` without changing the glibc/libstdc++ floor.
- Correction: the digest-pinned prepared builder installs `python39`, asserts Python 3.9, and sets
  `NODE_GYP_FORCE_PYTHON=/usr/bin/python3.9`; the focused workflow contract passes 4/4. Package
  installation remains in the networked preparation phase, while both native builds remain
  network-disabled.
- Oracle proved: the earlier builder definition could not build the artifact and failed before
  output; a modern build controller is compatible with the old runtime ABI userland when installed
  before the isolated compilation phase.
- Does not prove: a complete x64 build, x64 reproducibility/smoke/baseline, native arm64, kernel
  4.18, SSH transfer/install, signing/trust, or any enabled tuple.
- Follow-up: repeat the full two-build x64 evidence command with the corrected builder, run the
  purpose-named Linux userland verifier over its verified output, then repeat on native GitHub x64
  and arm64 runners.

### E-M3-LINUX-BUILDER-GCC-LOCAL-RED-001 — Rocky GCC 8 rejects Node v24's final C++20 spelling

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: uncommitted local WP2 correction at Git HEAD
  `775f2cbcc7f66f6e728fa06ae2d6822edd50f7b0`; no artifact was emitted or published.
- Runner/environment: the same local macOS arm64/Docker `linux/amd64` emulation and digest-pinned
  Rocky 8.9 base as E-M3-LINUX-BUILDER-PYTHON-LOCAL-RED-001; corrected builder selected Python
  3.9.25 and retained glibc 2.28/libstdc++.so.6.0.25.
- Command: the E-M3-LINUX-BUILDER-PYTHON-LOCAL-RED-001 two-build evidence command, repeated with
  `NODE_GYP_FORCE_PYTHON=/usr/bin/python3.9` in the corrected builder.
- Result: expected RED after 36.42 seconds, 148,564 KiB peak RSS. node-gyp 12.3.0 successfully
  selected Python 3.9.25, then GCC 8.5.0 rejected Node v24's generated `-std=gnu++20` argument and
  suggested its supported draft spelling, `-std=gnu++2a`. The evidence driver removed the failed
  first output and copied no candidate.
- Correction: the Linux-only build now replaces exactly one `'-std=gnu++20',` entry with
  `'-std=gnu++2a',` in the already signature/hash-verified extracted Node `common.gypi`; zero or
  multiple matches fail closed and non-Linux inputs are unchanged. The extracted headers are build
  inputs only, so bundled official Node bytes remain unchanged. Four focused compatibility tests
  cover replace, non-Linux preservation, and both rejected counts.
- Oracle proved: the oldest declared GCC/libstdc++ toolchain cannot consume the unmodified Node v24
  header spelling; silently selecting a newer compiler could narrow the libstdc++ floor.
- Does not prove: successful native compilation with the corrected flag, runtime smoke, exact
  equality, x64/arm64 native runners, kernel 4.18, SSH transfer/install, signing/trust, or an enabled
  tuple.

### E-M3-LINUX-BUILDER-TOOLCHAIN-LOCAL-RED-001 — Minimal builder cannot record its compiler

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source and environment: the same uncommitted source, base digest, local controller, and bounded
  offline container as E-M3-LINUX-BUILDER-GCC-LOCAL-RED-001.
- Command: the same two-build evidence command after the exact Linux C++ flag correction.
- Result: expected RED after 1 minute 40.14 seconds, 694,188 KiB peak RSS. The first native module
  compiled and the runtime reached metadata collection, but the minimal Rocky image lacked the
  `which` locator used by the fail-closed toolchain collector. It therefore refused to claim a
  compiler identity and removed the incomplete output. The collector would also have probed
  generic `python3` instead of the exact forced node-gyp interpreter.
- Correction: the prepared builder explicitly installs distro-signed `which`, and Linux provenance
  resolves and hashes `NODE_GYP_FORCE_PYTHON` (`/usr/bin/python3.9`) rather than a generic alias.
  The focused toolchain/workflow suite passes 15/15 and asserts both contracts.
- Oracle proved: artifact compilation alone is insufficient; missing or inaccurate toolchain
  identity fails the build before any candidate is copied.
- Does not prove: a complete first build, a second equal build, runtime smoke, baseline execution,
  native runner behavior, kernel 4.18, or any enabled tuple.

### E-M3-LINUX-BASELINE-LOCAL-GREEN-001 — Corrected x64 bytes pass the oldest Linux userland

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: uncommitted local WP2 correction at Git HEAD
  `775f2cbcc7f66f6e728fa06ae2d6822edd50f7b0`; the artifact-affecting correction was subsequently
  committed as `0cb3f7510`, while later fail-closed artifact-selection, `ldd` stderr, and test-cleanup
  hardening did not change built bytes. This remains unpublished local evidence only.
- Runner/environment: local macOS arm64 controller, Docker 29.2.1, Docker Desktop bounded
  `linux/amd64` emulation. Build base and separate baseline image:
  `docker.io/library/rockylinux@sha256:2d05a9266523bbf24f33ebc3a9832e4d5fd74b973c220f2204ca802286aa275d`;
  corrected builder image
  `sha256:9c32993d7a91557657593ae8258568a71f9832b0ce7c8824a1229b939ef49968`.
  Compilation used glibc 2.28, libstdc++.so.6.0.25, GCC 8.5.0, Python 3.9.25, GNU Make 4.2.1,
  GNU strip 2.30, distro Node 20.20.2 as controller, and verified bundled Node v24.18.0.
- Build command:

  ```bash
  repo=$PWD
  root=/private/tmp/orca-8450-linux-floor-build-v6
  docker run --rm --platform linux/amd64 --network none --read-only --cap-drop all \
    --security-opt no-new-privileges --pids-limit 512 --memory 6g --cpus 4 \
    --tmpfs /tmp:rw,nosuid,size=1g \
    --mount type=bind,src=/private/tmp/orca-8450-linux-floor-build/workspace,dst=/workspace \
    --mount type=bind,src=$repo/node_modules,dst=/workspace/node_modules,readonly \
    --mount type=bind,src=$repo/config/scripts,dst=/workspace/config/scripts,readonly \
    --mount type=bind,src=/private/tmp/orca-8450-linux-floor-build/inputs,dst=/inputs,readonly \
    --mount type=bind,src=$root,dst=/evidence \
    --workdir /workspace orca-ssh-relay-linux-builder:local-x64-python39 \
    /usr/bin/time -v /usr/bin/node \
      config/scripts/ssh-relay-runtime-linux-build-evidence.mjs \
      --tuple linux-x64-glibc --inputs-directory /inputs \
      --output-root /evidence/output --work-directory /evidence/work \
      --evidence-directory /evidence/verified --source-date-epoch 1784069324 \
      --git-commit 775f2cbcc7f66f6e728fa06ae2d6822edd50f7b0
  ```

- Build result: PASS in 6 minutes 48.16 seconds with 694,196 KiB peak RSS. Both complete builds
  produced content ID `fc63ca342a5990f460ec6d72262a8542173dab20ce03c9b9cfb755b1c6057e6d`
  and byte-identical 29,268,776-byte archive SHA-256
  `8f9095d1017fda387d66762ca6ccdd10a05d0138ff1b4ca6835d4b2a6eb7be83`.
  Reproducibility compared 54 entries, 38 files, and 154,157,598 bytes. First/second build durations
  were 256,687.12/127,672.46 ms; verifier durations were 9,541.30/5,525.82 ms. Both smokes reported
  Node v24.18.0, modules ABI 137, PTY exit 23 after resize to 101x37, the required five watcher
  events, 377.22/378.81 ms smoke duration, and 58,380,288/58,052,608 RSS bytes.
- Verified metadata SHA-256 values: identity
  `edc57658e5d245b4652f4418a70f0b8a519d287ab570ceac582ba6ead0221715`, SPDX
  `a7b58dc14ea671c60d5111eb9ade8141e502a4562161ed540b4de75f9703346b`, and provenance
  `c19086b3fb511cca04a31311d6677df58f47d0f10d91e30b180b88b6775b839d`.
- Separate boundary/baseline commands:

  ```bash
  repo=$PWD
  root=/private/tmp/orca-8450-linux-floor-build-v6
  runtime=$root/baseline-runtime
  archive=orca-ssh-relay-runtime-v1-linux-x64-glibc-fc63ca342a5990f460ec6d72262a8542173dab20ce03c9b9cfb755b1c6057e6d.tar.xz
  identity=orca-ssh-relay-runtime-linux-x64-glibc.identity.json
  mkdir $runtime
  tar -xJf $root/verified/$archive -C $runtime
  docker run --rm --platform linux/amd64 --network none --read-only --cap-drop all \
    --security-opt no-new-privileges --pids-limit 128 --memory 1g --cpus 2 \
    --tmpfs /tmp:rw,nosuid,size=64m \
    --mount type=bind,src=$repo/config/scripts,dst=/workspace/config/scripts,readonly \
    --mount type=bind,src=$repo/node_modules,dst=/workspace/node_modules,readonly \
    --mount type=bind,src=$root/verified,dst=/evidence,readonly \
    --mount type=bind,src=$runtime,dst=/runtime,readonly \
    --workdir /workspace orca-ssh-relay-linux-builder:local-x64-python39 \
    /runtime/bin/node config/scripts/verify-ssh-relay-runtime.mjs \
      --runtime-directory /runtime --identity /evidence/$identity --archive /evidence/$archive
  image=docker.io/library/rockylinux@sha256:2d05a9266523bbf24f33ebc3a9832e4d5fd74b973c220f2204ca802286aa275d
  docker run --rm --platform linux/amd64 --network none --read-only --cap-drop all \
    --security-opt no-new-privileges --pids-limit 128 --memory 1g --cpus 2 \
    --tmpfs /tmp:rw,nosuid,size=64m \
    --mount type=bind,src=$repo/config/scripts,dst=/workspace/config/scripts,readonly \
    --mount type=bind,src=$runtime,dst=/runtime,readonly --workdir /workspace $image \
    /runtime/bin/node config/scripts/ssh-relay-runtime-smoke-child.cjs /runtime
  docker run --rm --platform linux/amd64 --network none --read-only --cap-drop all \
    --security-opt no-new-privileges --pids-limit 128 --memory 1g --cpus 2 \
    --tmpfs /tmp:rw,nosuid,size=64m \
    --mount type=bind,src=$repo/config/scripts,dst=/workspace/config/scripts,readonly \
    --mount type=bind,src=$runtime,dst=/runtime,readonly --workdir /workspace $image \
    /runtime/bin/node config/scripts/ssh-relay-runtime-baseline.mjs \
      --tuple linux-x64-glibc --scope linux-userland --runtime-directory /runtime
  ```

- Boundary/baseline result: PASS. Fresh archive/tree verification matched 49 entries, 34 files,
  124,846,430 expanded bytes, and the exact content ID; smoke took 280.64 ms at 58,208,256 RSS
  bytes. The separate unmodified Rocky base smoke took 438.55 ms at 58,908,672 RSS bytes. The
  baseline evaluator returned `qualified: true` for platform x64, glibc 2.28, and libstdc++ 6.0.25,
  with explicit residual gap `kernel`: observed shared Docker kernel 6.12.72-linuxkit versus required
  4.18.
- Oracle proved: corrected x64 artifacts can be built twice without egress in the oldest declared
  Linux userland, remain byte-identical, pass archive/tree/Node/PTY/watcher checks, and execute in an
  unmodified glibc 2.28/libstdc++ 6.0.25 userland.
- Does not prove: a target-native x64 runner, native arm64, exact kernel 4.18, SSH transfer/install,
  native trust, release aggregation, packaged desktop use, fallback, performance against legacy, or
  an enabled tuple.
- Follow-up: push the exact correction to draft PR #8741, require the native x64 and arm64 build and
  supplemental userland cells to pass, audit the downloaded artifacts, and retain the kernel 4.18
  and native-trust blockers.

### E-M3-LINUX-BUILDER-LOCAL-VALIDATION-001 — Corrected WP2 source gates pass locally

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: the same uncommitted WP2 source and Git HEAD as
  E-M3-LINUX-BASELINE-LOCAL-GREEN-001.
- Commands:

  ```bash
  pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/ssh-relay-runtime-linux-builder.Containerfile \
    config/scripts/build-ssh-relay-runtime.mjs \
    config/scripts/ssh-relay-linux-node-gyp-compiler.mjs \
    config/scripts/ssh-relay-linux-node-gyp-compiler.test.mjs \
    config/scripts/ssh-relay-runtime-baseline.mjs \
    config/scripts/ssh-relay-runtime-baseline.test.mjs \
    config/scripts/ssh-relay-runtime-compatibility.mjs \
    config/scripts/ssh-relay-runtime-linux-build-evidence.mjs \
    config/scripts/ssh-relay-runtime-linux-build-evidence.test.mjs \
    config/scripts/ssh-relay-runtime-toolchain.mjs \
    config/scripts/ssh-relay-runtime-toolchain.test.mjs \
    config/scripts/ssh-relay-runtime-tree.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist-summary.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-plan.html
  git diff --check
  ```

- Result: PASS. The expanded focused suite passed 22 files/100 tests. Typecheck passed. Lint passed
  with only existing unrelated repository warnings; its reliability, max-lines, bundled-skill,
  localization-catalog, and localization-coverage sub-gates all passed. The direct max-lines ratchet
  passed with 355 grandfathered suppressions and no new bypass. Focused formatting and
  `git diff --check` passed.
- Runner detail: local macOS arm64 shell used Node v26.0.0 and pnpm 10.24.0, which emitted the
  expected package-engine warning because repository CI requires Node 24. Draft-PR jobs install
  exact Node 24.18.0 and remain the qualifying contract cells.
- Does not prove: GitHub workflow parsing/execution, native x64/arm64 builds, oldest kernel 4.18,
  native signing/trust, SSH transfer/install, or any enabled tuple.
- Follow-up: commit this evidence update, push both reviewable commits, and audit every draft-PR job
  and downloaded artifact before closing any runner-backed cell.

### E-M3-WORKFLOW-WINDOWS-CRLF-CI-RED-001 — Containerfile contract was newline-sensitive

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source/run: exact draft-PR head `3973e68d772008a20c2664ad90708f6d0e00b403`, Actions run
  [29377854121](https://github.com/stablyai/orca/actions/runs/29377854121), Windows x64 job
  [87234935616](https://github.com/stablyai/orca/actions/runs/29377854121/job/87234935616).
- Runner/environment: GitHub-hosted `windows-2022` x64; exact image/tool identities remain in the
  job log. The failure occurred in the purpose-named runtime artifact contract-test step before Node
  inputs, native compilation, verification, or upload.
- Command: the workflow's exact Node 24.18.0 PowerShell contract suite, including
  `config/scripts/ssh-relay-runtime-workflow.test.mjs`.
- Result: expected RED. Git's Windows checkout supplied the Containerfile with CRLF line endings;
  the test compared `ARG BASE_IMAGE=scratch\nFROM ${BASE_IMAGE}` literally and failed at line 164.
  No Windows x64 candidate was built or uploaded. Linux contract cells passed the same assertion
  with LF, proving the implementation text was present but the oracle was not checkout-portable.
- Correction: normalize CRLF to LF only within the test's in-memory Containerfile text before
  asserting exact content. Commit `53082dd1f` adds the explicit CRLF fixture; the purpose-named
  workflow suite passes 5/5 and the expanded artifact suite passes 22 files/101 tests. Production
  workflow/Containerfile bytes and runtime behavior remain unchanged.
- Does not prove: the corrected Windows contract, any candidate from this job, the complete run,
  baseline execution, signing/trust, SSH behavior, or an enabled tuple.
- Follow-up: commit this evidence, push both commits, and audit the replacement exact-head run from
  the beginning.

### E-M3-LINUX-RUNNER-MOUNT-PERMISSION-CI-RED-001 — Root container cannot stage into runner temp

- Date: 2026-07-14 (job timestamps 2026-07-15 UTC)
- Owner: Codex implementation owner
- Source/run: exact draft-PR head `24153775b2327001e581c341301dfc41bb9cb61f`, Actions run
  [29378160419](https://github.com/stablyai/orca/actions/runs/29378160419), Linux arm64 job
  [87235847644](https://github.com/stablyai/orca/actions/runs/29378160419/job/87235847644). Linux x64 job
  [87235847575](https://github.com/stablyai/orca/actions/runs/29378160419/job/87235847575) fails with
  the same exception in the first second of the same build step.
- Runner/environment: GitHub-hosted native `ubuntu-24.04` x64 and `ubuntu-24.04-arm`; requested runner
  and architecture were recorded by the workflow. Digest-pinned Rocky arm64 base
  `sha256:3c2d0ce12bf79fc5ff05e43b1000e30ff062dc89405525f3307cbff71661f1a0`; produced builder image
  `sha256:6384da2f38157d93856beb31f6ba45dffeec8e7cc139cd4468cdf5df2fa5619c`. Digest-pinned Rocky x64
  base `sha256:2d05a9266523bbf24f33ebc3a9832e4d5fd74b973c220f2204ca802286aa275d`; produced builder image
  `sha256:4adbb55dff700b55b8cf1c20e4be6099869e3bd43236688bf462116b92da40dc`.
- Command: the workflow's offline `docker run --rm --network none --read-only --cap-drop all ...`
  invocation of `ssh-relay-runtime-linux-build-evidence.mjs`, with the workspace and
  `/home/runner/work/_temp` bind-mounted at identical container paths.
- Result: expected RED. Builder preparation passed after 3 minutes 25 seconds. The evidence driver
  then failed immediately with `EACCES: permission denied, mkdir
'/home/runner/work/_temp/ssh-relay-runtime'`; no build, archive, smoke, comparison, upload, or
  dependent baseline job ran. The container defaulted to root while the hosted runner bind mount did
  not grant root write access under this isolation configuration.
- Plan correction: run the offline build container as `$(id -u):$(id -g)` and make `/tmp` an explicit
  mode-1777 tmpfs. Retain read-only root, no network, dropped capabilities, no-new-privileges, and the
  existing process/memory/CPU bounds. Do not broaden permissions on `RUNNER_TEMP` or leave root-owned
  host output.
- Does not prove: the correction, any Linux runtime bytes from this run, Linux userland/kernel
  baselines, native trust, SSH behavior, or an enabled tuple.
- Follow-up: add a workflow contract for UID/GID and tmpfs mode, validate the exact invocation
  locally, then repeat both native Linux cells and audit their downloaded artifacts.

### E-M3-LINUX-RUNNER-MOUNT-PERMISSION-LOCAL-GREEN-001 — Non-root build preserves the full gate

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: implementation commit `05b3a4b18` (`build(ssh): preserve Linux runner ownership`), based
  on `24153775b2327001e581c341301dfc41bb9cb61f`; runtime-building scripts are unchanged from the base.
- Runner/environment: local macOS arm64 Docker Desktop running the existing amd64 Rocky 8 builder
  `sha256:9c32993d7a91557657593ae8258568a71f9832b0ce7c8824a1229b939ef49968` under emulation. This is
  supplemental permission/functional evidence, not a qualifying native architecture cell.
- Commands: the purpose-named workflow suite, plus a clean disposable workspace invocation of
  `ssh-relay-runtime-linux-build-evidence.mjs` using `--network none --read-only --cap-drop all`,
  `--user "$(id -u):$(id -g)"`, `--security-opt no-new-privileges`, the existing process/memory/CPU
  bounds, and `--tmpfs /tmp:rw,nosuid,size=1g,mode=1777`. A separate bounded mount probe recorded the
  runtime UID/GID, tmpfs mode, and host ownership of created output.
- Static commands: `pnpm exec vitest run --config config/vitest.config.ts
config/scripts/ssh-relay-*.test.mjs`; `pnpm run typecheck`; `pnpm run lint`; `pnpm run
check:max-lines-ratchet`; focused `pnpm exec oxfmt --check` over the five changed files; and `git
diff --check`.
- Result: PASS. Workflow contract 5/5. The probe observed UID 501, GID 20, `/tmp` mode 1777, and output
  owned by local user `jinwoohong:wheel`. The complete driver passed in 4 minutes 47.48 seconds with
  694,172 KiB peak RSS. Both builds produced content ID
  `fc63ca342a5990f460ec6d72262a8542173dab20ce03c9b9cfb755b1c6057e6d`, identical 29,270,716-byte
  archive SHA-256 `94b2d5c1e28835aab05fc84578298199c300d7d5d0cd4e76057a3f44451356c3`, 49 archive entries,
  34 files, and 124,846,430 expanded bytes.
- Runtime result: both bundled-Node checks reported v24.18.0/modules ABI 137; both PTY checks resized
  to 101x37 and exited 23; both watcher checks observed the required five create/update/delete events.
  First/second build durations were 138,118.53/130,370.80 ms; verification durations were
  6,235.84/5,041.08 ms; smoke durations were 431.46/348.38 ms at 58,347,520/58,040,320 RSS bytes.
- Static result: PASS. The expanded artifact suite passed 22 files/101 tests. Typecheck, full lint,
  reliability metadata, max-lines (355 grandfathered suppressions and no new bypass), bundled-skill,
  localization catalog/coverage, focused formatting, and `git diff --check` passed. Lint emitted only
  the existing unrelated repository warnings. Local Node v26.0.0 emitted the expected engine warning;
  draft-PR jobs install exact Node 24.18.0.
- Does not prove: native x64 or arm64 hosted-runner behavior, exact Linux kernel 4.18, SSH
  transfer/install, native trust, release aggregation, or an enabled tuple.
- Follow-up: run the exact correction on both native GitHub labels and audit every resulting artifact
  and supplemental userland job before closing either cell.

### E-M3-WINDOWS-ARM64-BASELINE-CI-RED-001 — Hosted build 26200 cannot prove build 26100

- Date: 2026-07-14 (job timestamps 2026-07-15 UTC)
- Owner: Codex implementation owner
- Source/run: exact draft-PR head `24153775b2327001e581c341301dfc41bb9cb61f`, Actions run
  [29378160419](https://github.com/stablyai/orca/actions/runs/29378160419), Windows arm64 artifact job
  [87235847556](https://github.com/stablyai/orca/actions/runs/29378160419/job/87235847556), and baseline
  job [87237242684](https://github.com/stablyai/orca/actions/runs/29378160419/job/87237242684). Windows x64
  baseline control [87237242686](https://github.com/stablyai/orca/actions/runs/29378160419/job/87237242686)
  passed.
- Runner/environment: GitHub-hosted native `windows-11-arm`. The baseline evaluator observed native
  arm64 Windows `10.0.26200`; the declared oldest arm64 contract is exactly Windows 11 24H2 build 26100. Downloaded artifact ID `8328797474`, 33,084,426 bytes, Actions transport digest
  `2453ddd8eefd9b371be296bebe0bcec15fdbaa245dca3a89b1eb2c668450cd23`.
- Result: expected RED for oldest-floor qualification. The native artifact built twice, verified,
  compared, uploaded, downloaded, re-verified, and completed bundled Node/PTY/watcher smoke; smoke
  settled to only the parent stdio pipes after the two-second observation window and used 48,525,312
  RSS bytes. The baseline evaluator returned platform and architecture true, `osBuild: false`, and
  `qualified: false`, so the job correctly failed closed rather than presenting a newer hosted image
  as proof of build 26100. Windows x64 passed the analogous declared-floor job.
- Does not prove: Windows arm64 build 26100 compatibility, native signature/trust, SSH behavior, or an
  enabled tuple. A successful artifact/smoke run on build 26200 is deliberately insufficient.
- Follow-up: provision or select a native arm64 build-26100 snapshot/runner before closing this cell;
  keep the tuple disabled and do not weaken the exact oldest-floor oracle.

- Repeat evidence: exact-head run
  [29379227209](https://github.com/stablyai/orca/actions/runs/29379227209), artifact job
  [87239051368](https://github.com/stablyai/orca/actions/runs/29379227209/job/87239051368), and baseline
  job [87240257136](https://github.com/stablyai/orca/actions/runs/29379227209/job/87240257136) reproduce
  the same bounded result at `cc4c45c8981fd87b5681e8c0be7b3b06f2cfab22`: native build, equality,
  upload, download, verification, PTY/watcher smoke, and 48,361,472-byte RSS pass; observed build
  26200 returns `osBuild: false` and the job fails closed. Artifact ID `8329167066`, 33,084,426 bytes,
  Actions digest `4956ad608ede84372a393248dc90c03b13bd5e28345d8c3940df0419b9fdb192`;
  archive SHA-256 `87a9c749f6aced6d2c63a3f2b80033dfa3ecc7524c2f232baaa199340c562cf1`.

### E-M3-LINUX-NATIVE-USERLAND-CI-001 — Native Linux producers pass the oldest userland

- Date: 2026-07-14 (job timestamps 2026-07-15 UTC)
- Owner: Codex implementation owner
- Source/run: exact draft-PR head `cc4c45c8981fd87b5681e8c0be7b3b06f2cfab22`, containing
  implementation commit `05b3a4b18`; Actions run
  [29379227209](https://github.com/stablyai/orca/actions/runs/29379227209). Linux x64 artifact job
  [87239051400](https://github.com/stablyai/orca/actions/runs/29379227209/job/87239051400), Linux arm64
  artifact job [87239051434](https://github.com/stablyai/orca/actions/runs/29379227209/job/87239051434),
  x64 userland job [87240706426](https://github.com/stablyai/orca/actions/runs/29379227209/job/87240706426),
  and arm64 userland job
  [87240706430](https://github.com/stablyai/orca/actions/runs/29379227209/job/87240706430) all pass.
- Aggregate status: the artifact workflow concludes `failure` only because the separately required
  Windows arm64 build-26100 floor fails closed on hosted build 26200. Exact-head PR Checks
  [29379227222](https://github.com/stablyai/orca/actions/runs/29379227222) and Golden E2E Experiment
  [29379227283](https://github.com/stablyai/orca/actions/runs/29379227283) both pass with no failed jobs.
- Runners/builders: GitHub-hosted native `ubuntu-24.04` / `ubuntu24` `20260705.232.1` x64 and
  `ubuntu-24.04-arm` / `ubuntu24-arm64` `20260706.52.2` arm64. Digest-pinned Rocky bases are
  `2d05a926...aa275d` x64 and `3c2d0ce1...61f1a0` arm64; produced builder IDs are
  `sha256:4e260f8acb74ac4800e31af90160aac0c9eed00c5fc4e8cb1aa83d0f1b1a8f4b` and
  `sha256:a2f683970a2fcef419610f77bdc0af332d991dc0cf19fa4f239771dfe5b06a94`.
- Exact evidence commands:

  ```sh
  gh run view 29379227209 --repo stablyai/orca \
    --json headSha,status,conclusion,createdAt,updatedAt,url,jobs
  gh run view 29379227209 --repo stablyai/orca --log | \
    rg 'requested_runner=|resolved_image_|runner_arch=|linux_floor_|"contentId"|"qualified"|"residualGaps"'
  gh api repos/stablyai/orca/actions/runs/29379227209/artifacts --paginate
  gh run download 29379227209 --repo stablyai/orca \
    --dir /private/tmp/orca-8450-run-29379227209-artifacts
  # Repeat the fail-closed jq/shasum audit from E-M3-METADATA-CI-RED-003 with:
  # evidence=/private/tmp/orca-8450-run-29379227209-artifacts
  # commit=cc4c45c8981fd87b5681e8c0be7b3b06f2cfab22
  # run_id=29379227209
  # Extract each exact archive, then repeat the closure verifier command from
  # E-M3-RUNTIME-CLOSURE-LOCAL-001 against all six extracted directories.
  ```

- Result: PASS. Both offline, non-root builders preserve the read-only/no-network/capability/resource
  envelope; build twice; inspect archive/tree; execute bundled Node v24.18.0, native PTY
  input/resize/exit, and five watcher events twice; compare runtime/archive/identity/SPDX/provenance
  exactly; and upload. Artifact job wall times were 6m49s x64 and 11m57s arm64, including builder
  preparation. Clean x64 builds took 67,398.98/64,050.97 ms with 55,918,592/55,955,456-byte smoke
  RSS; clean arm64 builds took 75,230.87/74,661.31 ms with 52,195,328/52,207,616-byte smoke RSS.
- Supplemental userland result: PASS after download and fresh byte/tree verification. Both execute in
  glibc 2.28/libstdc++ 6.0.25 Rocky userland and report `qualified: true`; x64 PTY/watcher smoke takes
  161.43 ms at 55,611,392 RSS bytes and arm64 takes 161.85 ms at 51,658,752 RSS bytes. Both retain the
  explicit kernel residual: observed shared runner kernel `6.17.0-1018-azure`, not required 4.18.
- Downloaded artifacts/direct audit: exact cardinality, archive/identity/provenance/SPDX hashes,
  archive-scoped namespace, one owner per file, eight dependency relationships, exact
  commit/run/builder/runner/toolchain identities, prohibited-content rules, and extracted-tree
  closure all pass for all six run artifacts. Linux x64 artifact `8329137098`, 29,290,715 bytes,
  Actions digest `4859448ad465600836700884449b56b65cc65b13e71588813a5341c7eee2ef3b`,
  content ID `fc63ca342a5990f460ec6d72262a8542173dab20ce03c9b9cfb755b1c6057e6d`, archive SHA-256
  `c771c13d23fb7384ad0b018cb4a91e04066d53d07b021fa2ff4e0ae55f701467`. Linux arm64 artifact
  `8329223012`, 28,216,772 bytes, Actions digest
  `f3a834de03714c4bd702d933261cc8c3c8f3ea6472b97d74737904d5b7461a06`, content ID
  `96f07f62af9b35304bb8ca0870ca4d8095e059bfa61dd1bc57e81b20f3fbca67`, archive SHA-256
  `ea52c7fadbc100e055e489d14ddf01daca5f90b1f83cdff93c1f3d728cfcaa34`.
- Six-artifact audit controls:

  | Tuple             | Artifact ID  | Actions digest                                                     | Archive SHA-256                                                    | Content ID prefix | Files |
  | ----------------- | ------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ----------------- | ----- |
  | linux-x64-glibc   | `8329137098` | `4859448ad465600836700884449b56b65cc65b13e71588813a5341c7eee2ef3b` | `c771c13d23fb7384ad0b018cb4a91e04066d53d07b021fa2ff4e0ae55f701467` | `fc63ca34…`       | 34    |
  | linux-arm64-glibc | `8329223012` | `f3a834de03714c4bd702d933261cc8c3c8f3ea6472b97d74737904d5b7461a06` | `ea52c7fadbc100e055e489d14ddf01daca5f90b1f83cdff93c1f3d728cfcaa34` | `96f07f62…`       | 34    |
  | darwin-x64        | `8329119914` | `d86a6deac1c5f6b38a1824197b19de69c5f5df6bc7081266a636e86cfae34a87` | `470b69a5317d212cab99cf1dc12841b09e0984c70cfbc90c3f46be040a263374` | `585ea603…`       | 35    |
  | darwin-arm64      | `8329097437` | `d2200b01c983afbc2b7ca0d08d36f9e7962932113c67ab604c1072488b6ebb26` | `54a2fb49a0bc63c04622525bada57ccfa4cf7884e09bfb88c4c87f30a363616d` | `40ff5d20…`       | 35    |
  | win32-x64         | `8329104979` | `3168b4b29c635502ceb5320fc1e96a19a394b2a36ea5f8083c8502a81a385063` | `e8c1165df331602027f548228f8b09791d27aa353d829c575b9b6dbf86833670` | `7ddad668…`       | 42    |
  | win32-arm64       | `8329167066` | `4956ad608ede84372a393248dc90c03b13bd5e28345d8c3940df0419b9fdb192` | `87a9c749f6aced6d2c63a3f2b80033dfa3ecc7524c2f232baaa199340c562cf1` | `2955cec7…`       | 42    |

- Oracle proved: the exact native Linux producer bytes are compatible with the declared oldest
  glibc/libstdc++ userland on both architectures; the original Ubuntu-linked ABI defect and the
  runner bind-mount defect are closed without weakening isolation.
- Does not prove: exact kernel 4.18, SSH transfer/install, native trust, release aggregation,
  packaged desktop use, fallback/performance, or an enabled tuple.
- Follow-up: retain both tuples disabled until kernel 4.18, native trust, and the remaining required
  live SSH evidence pass.

### E-M3-WINDOWS-X64-BASELINE-CI-001 — Windows x64 passes the declared Server floor

- Date: 2026-07-14 (job timestamps 2026-07-15 UTC)
- Owner: Codex implementation owner
- Source/run: exact head `cc4c45c8981fd87b5681e8c0be7b3b06f2cfab22`, Actions run
  [29379227209](https://github.com/stablyai/orca/actions/runs/29379227209), artifact job
  [87239051373](https://github.com/stablyai/orca/actions/runs/29379227209/job/87239051373), and baseline
  job [87240257128](https://github.com/stablyai/orca/actions/runs/29379227209/job/87240257128).
- Runner/result: GitHub-hosted native `windows-2022` / `win22` `20260706.237.1` x64 observed exact
  build `10.0.20348`; archive/tree verification and bundled Node/PTY/watcher smoke pass, then the full
  baseline evaluator returns `qualified: true` with no residual gaps. Smoke took 5,382.17 ms at
  50,561,024 RSS bytes; the baseline job wall time was 1m29s.
- Artifact/audit: artifact `8329104979`, 37,034,298 bytes, Actions digest
  `3168b4b29c635502ceb5320fc1e96a19a394b2a36ea5f8083c8502a81a385063`; content ID
  `7ddad668780ce5b2592d86afcebf9d897172bdf07c618ae238b5d51eebfe1596`; archive SHA-256
  `e8c1165df331602027f548228f8b09791d27aa353d829c575b9b6dbf86833670`. The independent all-six
  metadata and extracted-closure audit passes.
- Does not prove: native signature/trust, Windows arm64 build 26100, SSH transfer/install, release
  aggregation, fallback/performance, or an enabled tuple.
- Follow-up: keep the tuple disabled until native trust and the remaining required live SSH evidence
  pass.

### E-M3-NATIVE-SIGNING-PLAN-SORT-LOCAL-RED-001 — Locale collation changes Windows signing order

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: local macOS arm64 shell at Git HEAD
  `c6a7277cc6f56d453662ebd373e9e8e4e278f4ac`; no runtime or signing credentials were used.
- Command:

  ```sh
  node - <<'NODE'
  const paths = [
    'node_modules/node-pty/build/Release/conpty.node',
    'node_modules/node-pty/build/Release/conpty/OpenConsole.exe',
    'node_modules/node-pty/build/Release/conpty/conpty.dll',
    'node_modules/node-pty/build/Release/conpty_console_list.node'
  ]
  console.log(JSON.stringify({
    locale: [...paths].sort((left, right) => left.localeCompare(right)),
    portable: [...paths].sort((left, right) => left < right ? -1 : left > right ? 1 : 0)
  }, null, 2))
  NODE
  ```

- Result: expected RED control. Locale collation ordered `conpty_console_list.node`, `conpty.node`,
  `conpty/conpty.dll`, then `conpty/OpenConsole.exe`; portable byte ordering produced
  `conpty.node`, `conpty/OpenConsole.exe`, `conpty/conpty.dll`, then
  `conpty_console_list.node`, matching `canonicalSshRelayRuntimeIdentityBytes`.
- Correction/oracle: the signing plan uses explicit `<`/`>` path comparison, and the Windows x64
  and arm64 expected-path assertions lock that order. Locale-sensitive `localeCompare` is not used.
- Does not prove: target-native execution, any signature, native trust, release aggregation, SSH
  behavior, or an enabled tuple.

### E-M3-NATIVE-SIGNING-PLAN-LOCAL-001 — Exact credential-free signing plans pass for all six identities

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: implementation commit `9bdae7f5bd7d5df838ab8c59af9346fc2282443c`, based on
  `c6a7277cc6f56d453662ebd373e9e8e4e278f4ac`; downloaded identities are from exact-head Actions run
  [29379227209](https://github.com/stablyai/orca/actions/runs/29379227209) and were already audited
  under E-M3-LINUX-NATIVE-USERLAND-CI-001.
- Runner/remote/network: local macOS arm64 shell, Node v26.0.0 and pnpm 10.24.0; no remote, signing
  service, credential, publication, or network access was used by the plan command. The source
  artifacts were produced on the six native GitHub runner families recorded by the prior evidence.
- Commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-native-signing-plan.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    config/scripts/ssh-relay-runtime-native-signing-plan.mjs \
    config/scripts/ssh-relay-runtime-native-signing-plan.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist-summary.md
  git diff --check
  for identity in /private/tmp/orca-8450-run-29379227209-artifacts/ssh-relay-runtime-*/*.identity.json; do
    node config/scripts/ssh-relay-runtime-native-signing-plan.mjs --identity "$identity"
  done
  ```

- Static result: PASS. The purpose-named contract passed 1 file/6 tests in 944 ms; the aggregate SSH
  relay artifact suite passed 23 files/107 tests in 6.91 seconds. Typecheck, full lint, reliability
  gates, max-lines (355 grandfathered suppressions and no new bypass), bundled-skill verification,
  localization catalog/coverage, focused formatting, and `git diff --check` passed. Lint emitted only
  existing unrelated warnings; the local Node 26 shell emitted the expected Node-24 engine warning.
- Actual-identity result: PASS. Every plan retained one official Node executable as
  `preserve-exact-bytes`, copied the exact identity digest into `sourceSha256`, and produced this
  closed cardinality:

  | Tuple             | Policy                     | Immutable vendor files | Signing candidates | Verification files |
  | ----------------- | -------------------------- | ---------------------- | ------------------ | ------------------ |
  | linux-x64-glibc   | `linux-hash-only-v1`       | 1                      | 0                  | 3                  |
  | linux-arm64-glibc | `linux-hash-only-v1`       | 1                      | 0                  | 3                  |
  | darwin-x64        | `apple-developer-id-v1`    | 1                      | 3                  | 4                  |
  | darwin-arm64      | `apple-developer-id-v1`    | 1                      | 3                  | 4                  |
  | win32-x64         | `signpath-authenticode-v1` | 1                      | 5                  | 6                  |
  | win32-arm64       | `signpath-authenticode-v1` | 1                      | 5                  | 6                  |

- Fail-closed coverage: wrong tuple/OS, role/path/count/extension drift, duplicates, missing exact
  Node, non-executable native entries, malformed invocation, malformed JSON, directories, and input
  larger than 4 MiB reject. Every native file is present in `verificationFiles`; Linux selects no
  signing target, macOS requires Developer ID for all three non-Node native files, and Windows sends
  all five non-Node PE files through the preserve-valid-upstream-signature SignPath policy.
- Oracle proved: one bounded, deterministic, credential-free contract derives the complete platform
  signing/verification plan from the builder-enforced closure before signing side effects, while
  keeping official Node outside Orca signing.
- Does not prove: Apple or SignPath credential wiring, returned signed-byte hashes, Gatekeeper,
  quarantine, notarized containing-app provenance, Authenticode signer policy, Defender, WDAC, exact
  oldest-OS snapshots, release aggregation, SSH transfer/install, packaged desktop use, fallback,
  performance, or an enabled tuple.
- Follow-up: commit this evidence separately, require exact-head CI, then make native signing staging
  consume this plan without weakening any remaining credential/snapshot gate.

### E-M3-NATIVE-SIGNING-PLAN-CI-RED-001 — First exact-head workflow omitted the new suite

- Date: 2026-07-14 (run timestamps 2026-07-15 UTC)
- Owner: Codex implementation owner
- Source/run: exact draft-PR head `8ac54159c6f9d95858358f11746117c5480440cf`, containing
  implementation commit `9bdae7f5bd7d5df838ab8c59af9346fc2282443c`; Actions run
  [29380684866](https://github.com/stablyai/orca/actions/runs/29380684866).
- Commands:

  ```sh
  gh run view 29380684866 --repo stablyai/orca \
    --json headSha,status,conclusion,createdAt,updatedAt,url,jobs
  gh run view 29380684866 --repo stablyai/orca --job 87243480614 --log | \
    rg 'Run runtime artifact contract tests|Test Files|Tests|Duration|24.18.0'
  gh run view 29380684866 --repo stablyai/orca --job 87243480598 --log | \
    rg 'Run runtime artifact contract tests|Test Files|Tests|Duration'
  ```

- Result: expected RED evidence for the new contract's CI gate. All six native build jobs and their
  existing contract steps passed; both Linux userland supplements, Windows x64 build-20348 floor,
  exact-head PR Checks
  [29380684876](https://github.com/stablyai/orca/actions/runs/29380684876), and Golden E2E
  [29380684872](https://github.com/stablyai/orca/actions/runs/29380684872) also passed. The artifact
  workflow concluded failure only because Windows arm64 correctly rejected hosted build 26200
  against required build 26100.
- Missing oracle: inspection of the exact command/log showed the POSIX job ran 21 files/97 tests and
  the Windows job ran 22 files/98 passed plus 3 skipped; neither explicit list named
  `ssh-relay-runtime-native-signing-plan.test.mjs`, and neither syntax-checked its source. Healthy
  builds cannot substitute for a test that did not run, so this exact head does not qualify the new
  package.
- Native build job controls: Linux x64/arm64, macOS x64/arm64, and Windows x64/arm64 jobs all passed
  at 3m43s/9m57s, 7m30s/2m41s, and 5m27s/8m7s respectively. PR Checks passed in 14m57s; Golden Linux
  and macOS passed in 4m37s/5m25s. These are regression controls only, not the omitted contract proof.
- Does not prove: the new suite on Node 24/native runners, signing credentials, returned signed bytes,
  native trust, release aggregation, SSH behavior, or an enabled tuple.
- Correction: explicitly syntax-check the source/test and name the suite in both POSIX and Windows
  native workflow commands; lock all four test references and both source syntax checks in the
  workflow contract before repeating the exact head.

### E-M3-NATIVE-SIGNING-PLAN-WORKFLOW-LOCAL-001 — Both native job families now execute the suite

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: correction commit `9c0357235867cb2ff1ab8cbeed4901e6f013cf1d`, based on
  `8ac54159c6f9d95858358f11746117c5480440cf`.
- Runner: local macOS arm64 shell, Node v26.0.0 and pnpm 10.24.0; no remote, network, credential,
  artifact, or signing service was used.
- Commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-plan.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs
  node --check config/scripts/ssh-relay-runtime-native-signing-plan.mjs
  node --check config/scripts/ssh-relay-runtime-native-signing-plan.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist-summary.md
  git diff --check
  ```

- Result: PASS. The workflow plus signing-plan suites passed 2 files/11 tests in 1.53 seconds; the
  aggregate SSH relay artifact suite passed 23 files/107 tests in 4.64 seconds. Both files passed
  direct syntax checks. Typecheck, full lint, reliability gates, max-lines (355 grandfathered
  suppressions and no new bypass), bundled-skill verification, localization catalog/coverage,
  focused formatting, and `git diff --check` passed with only existing unrelated lint warnings and
  the expected local Node-24 engine warning.
- Workflow oracle: POSIX and Windows each syntax-check the plan source and test, and each exact Vitest
  command names the purpose-built suite. The workflow test requires four test-path occurrences and
  two source syntax-check occurrences, preventing one native family from silently dropping it.
- Does not prove: GitHub workflow parsing/execution, Node 24, any native runner, native signing/trust,
  returned signed bytes, release aggregation, SSH behavior, or an enabled tuple.
- Follow-up: push the correction plus this evidence separately and require the replacement exact-head
  POSIX and Windows logs to contain the 6-test suite before accepting CI proof.

### E-M3-NATIVE-SIGNING-PLAN-CI-001 — Replacement exact head executes the suite on all six native jobs

- Date: 2026-07-14 (run timestamps 2026-07-15 UTC)
- Owner: Codex implementation owner
- Source/run: exact draft-PR head `0f589ea299e9363a3988a9bc92b721f23c1ce1f4`, containing plan
  implementation `9bdae7f5bd7d5df838ab8c59af9346fc2282443c` and CI correction
  `9c0357235867cb2ff1ab8cbeed4901e6f013cf1d`; Actions run
  [29381495240](https://github.com/stablyai/orca/actions/runs/29381495240).
- Commands:

  ```sh
  gh run view 29381495240 --repo stablyai/orca \
    --json headSha,status,conclusion,createdAt,updatedAt,url,jobs
  gh run view 29381495240 --repo stablyai/orca --job 87245905347 --log | \
    rg 'native-signing-plan|Test Files|Tests|Duration'
  gh run view 29381495240 --repo stablyai/orca --job 87245905412 --log | \
    rg 'native-signing-plan|Test Files|Tests|Duration'
  gh run view 29381494930 --repo stablyai/orca \
    --json headSha,status,conclusion,createdAt,updatedAt,url,jobs
  gh run view 29381494940 --repo stablyai/orca \
    --json headSha,status,conclusion,createdAt,updatedAt,url,jobs
  ```

- Contract result: PASS on all six native jobs. Job-step metadata reports the purpose-named contract
  step successful for Linux x64/arm64, macOS x64/arm64, and Windows x64/arm64. The macOS arm64 log
  directly records both syntax checks, the named suite passing 6/6 in 29 ms, and the aggregate
  22 files/103 tests in 6.11 seconds. The Windows x64 log records both syntax checks, the suite
  passing 6/6 in 37 ms, and 23 files/104 passed plus 3 platform skips out of 107 in 5.63 seconds.
- Build/regression controls: all six native artifact jobs passed. Linux x64/arm64 took 3m50s/8m53s;
  macOS x64/arm64 took 7m26s/3m36s; Windows x64/arm64 took 4m49s/8m33s. Both Linux oldest-userland
  supplements passed in 43s/54s, and Windows x64 passed exact build 20348 in 1m25s.
- Expected aggregate status: the artifact workflow concludes failure only because the Windows arm64
  floor job again rejects hosted build 26200 against required build 26100 in 3m23s. This preserves
  E-M3-WINDOWS-ARM64-BASELINE-CI-RED-001 and is not a signing-plan regression.
- Other exact-head controls: PR Checks
  [29381494930](https://github.com/stablyai/orca/actions/runs/29381494930) passed in 14m16s. Golden E2E
  [29381494940](https://github.com/stablyai/orca/actions/runs/29381494940) passed Linux/macOS in
  4m35s/5m56s.
- Oracle proved: the credential-free plan contract parses and executes under exact Node 24.18.0 in
  both shell families on every native runner, while all existing artifact, smoke, equality,
  userland, packaging, and E2E controls retain their prior outcomes.
- Does not prove: Apple/SignPath credentials, signing requests, approval behavior, returned signed
  bytes, final post-signing hashes, Gatekeeper/quarantine/notarized-app provenance,
  Authenticode/Defender/WDAC policy, exact missing oldest snapshots, release aggregation, SSH
  transfer/install, packaged desktop use, fallback/performance, or an enabled tuple.
- Follow-up: keep every tuple disabled; implement a credential-free exact signing-stage/returned-byte
  contract that consumes the proven plan before any protected Apple or SignPath job is connected.

### E-M3-NATIVE-SIGNING-STAGE-LOCAL-RED-001 — Missing signing-stage modules fail the focused contract

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: pre-implementation head `30496bacf11a7e727ca6bf97c23ececd89c351ad`.
- Command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-native-signing-selection.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-payload.test.mjs
  ```

- Result: expected RED. Both purpose-named test files failed to load because
  `ssh-relay-runtime-native-signing-selection.mjs` and
  `ssh-relay-runtime-native-signing-payload.mjs` did not exist. No production or artifact behavior
  changed. The exact RED duration was not retained and is deliberately not reconstructed.
- Oracle proved: the new selection, staging, and returned-tree requirements were not already
  satisfied by the signing-plan module or an unrelated artifact test.
- Does not prove: any implementation behavior, native runner execution, signing, native trust,
  release aggregation, SSH behavior, or an enabled tuple.
- Correction: implement the two purpose-named modules, keep official Node out of signing payloads,
  and require both native workflow families to execute their contracts explicitly.

### E-M3-NATIVE-SIGNING-STAGE-LOCAL-001 — Exact selection, exclusive staging, and returned-tree contracts pass

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: implementation commit `c847c4a11d60ee37d161564ca3685955ce3c2d6d`, based on
  `30496bacf11a7e727ca6bf97c23ececd89c351ad`.
- Runner/remote/network: local macOS 26.2 build 25C56 arm64, Node v26.0.0 and pnpm 10.24.0; no
  remote, network, credential, signing service, native-trust environment, or publication path was
  used.
- Commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-native-signing-selection.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-payload.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-native-signing-selection.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-payload.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs
  node --check config/scripts/ssh-relay-runtime-native-signing-selection.mjs
  node --check config/scripts/ssh-relay-runtime-native-signing-selection.test.mjs
  node --check config/scripts/ssh-relay-runtime-native-signing-payload.mjs
  node --check config/scripts/ssh-relay-runtime-native-signing-payload.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-selection.mjs \
    config/scripts/ssh-relay-runtime-native-signing-selection.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-payload.mjs \
    config/scripts/ssh-relay-runtime-native-signing-payload.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md
  git diff --check
  ```

- Result: PASS. The focused selection/payload command passed 2 files/18 tests in 247 ms. The two
  suites plus workflow contract passed 3 files/23 tests in 264 ms. The complete purpose-named SSH
  relay script suite passed 25 files/125 tests in 2.55 seconds. Four direct syntax checks, typecheck,
  full lint and reliability gates, max-lines (355 grandfathered suppressions with no new bypass),
  bundled-skill verification, localization catalog/coverage, focused formatting, and
  `git diff --check` passed. Lint emitted only existing unrelated warnings; local Node 26 emitted the
  expected repository Node-24 engine warning. An intermediate lint run rejected an ASCII-control
  regular expression and formatting check rejected all four new files; the implementation was
  corrected without a disable and the complete gate was rerun green.
- Selection oracle: Linux accepts no assessments and creates no signing payload. macOS selects all
  three non-Node Developer ID candidates. Windows requires exactly one hash-bound assessment per PE
  candidate, stages only `unsigned`, preserves only `valid-upstream` with a bounded non-control
  signer subject and exact 40-hex thumbprint, and rejects invalid/unknown status, missing, duplicate,
  extra, hash-mismatched, malformed, or status-incompatible fields.
- Payload oracle: every native source file is authenticated by safe-integer size and SHA-256 before
  an exclusive stage is created; official Node is never copied. The physical stage must be outside
  the runtime, source/staged files must be regular, portable relative paths are preserved, and a
  partial stage is removed on copy/authentication failure. Linux verifies without creating a stage.
- Returned-tree oracle: the root and every entry must be real directories or regular files; links,
  special entries, unexpected/missing files or directories, unchanged hashes, per-file growth over
  4 MiB, or aggregate size over 64 MiB reject. Every accepted returned file records its exact new
  size and SHA-256 without mutating the runtime.
- Workflow oracle: POSIX and Windows native job families each syntax-check both sources and tests and
  explicitly name both suites. The workflow contract locks four occurrences per test and two source
  syntax-check occurrences so one shell family cannot silently omit the package.
- Does not prove: Node 24 behavior or parsing on GitHub Actions, native filesystem behavior on all
  six runners, Apple/SignPath credentials or calls, native trust, final signed-byte identity,
  Gatekeeper/quarantine/notarized-app provenance, Authenticode/Defender/WDAC policy, oldest missing
  snapshots, release aggregation, SSH transfer/install, packaged desktop use, fallback/performance,
  or an enabled tuple.
- Follow-up: push the implementation and evidence separately, then inspect an exact-head run to prove
  both suites executed under Node 24.18.0 in all six native jobs while existing build/smoke/equality
  controls retain their outcomes.

### E-M3-NATIVE-SIGNING-STAGE-CI-001 — Both staging suites execute on all six native jobs

- Date: 2026-07-14 (run timestamps 2026-07-15 UTC)
- Owner: Codex implementation owner
- Source/run: exact draft-PR head `9e08ac123039b827ebacbe1918ef8d3c3b989ae9`, containing
  implementation `c847c4a11d60ee37d161564ca3685955ce3c2d6d` and local evidence
  `9e08ac123039b827ebacbe1918ef8d3c3b989ae9`; Actions run
  [29382772805](https://github.com/stablyai/orca/actions/runs/29382772805).
- Commands:

  ```sh
  gh run view 29382772805 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh run view 29382772805 --repo stablyai/orca --job 87249764747 --log | \
    awk -F '\t' '$2 == "Run runtime artifact contract tests"' | \
    rg 'native-signing-(selection|payload)|Test Files|Tests|Duration'
  gh run view 29382772805 --repo stablyai/orca --job 87249764693 --log | \
    awk -F '\t' '$2 == "Run runtime artifact contract tests"' | \
    rg 'native-signing-(selection|payload)|Test Files|Tests|Duration'
  gh run view 29382772805 --repo stablyai/orca --job 87251086934 --log | \
    rg 'Operating System|OsBuildNumber|26100|26200'
  gh run view 29382772825 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh run view 29382772821 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  ```

- Contract result: PASS on Linux x64/arm64, macOS x64/arm64, and Windows x64/arm64. Every native
  build job reports `Run runtime artifact contract tests` successful under exact Node 24.18.0. The
  shared POSIX log on macOS arm64 records four new syntax checks, selection 7/7 in 9 ms, payload
  11/11 in 204 ms, and aggregate 24 files/121 tests in 3.94 seconds. The shared PowerShell log on
  Windows x64 records the same four syntax checks, selection 7/7 in 27 ms, payload 8 passed plus the
  three declared POSIX-only symlink skips in 1.736 seconds, and aggregate 25 files/119 passed plus
  six total platform skips out of 125 in 6.04 seconds.
- Native build/regression controls: all six two-build, smoke, exact-equality, metadata, and
  unpublished-upload jobs passed. Durations were Linux x64 4m16s, Linux arm64 4m26s, macOS x64
  5m16s, macOS arm64 2m58s, Windows x64 4m58s, and Windows arm64 10m40s. Linux x64/arm64
  digest-pinned glibc 2.28/libstdc++ 6.0.25 supplemental jobs passed in 37s/54s. Windows x64 exact
  build-20348 floor passed in 1m23s.
- Expected aggregate status: the artifact workflow concluded failure only because Windows arm64
  hosted image 10.0.26200 again failed the exact declared 10.0.26100 floor in 4m9s. This preserves
  E-M3-WINDOWS-ARM64-BASELINE-CI-RED-001 and is not a signing-stage regression.
- Other exact-head controls: PR Checks
  [29382772825](https://github.com/stablyai/orca/actions/runs/29382772825) passed in 14m8s after lint,
  typecheck, Git 2.25 compatibility, full tests, unpacked-app build, and packaged-CLI smoke. Golden
  E2E [29382772821](https://github.com/stablyai/orca/actions/runs/29382772821) passed macOS/Linux in
  3m00s/4m29s.
- Oracle proved: both shell families parse and execute the exact credential-free selection and
  payload contracts on every target-native runner while the artifact build, executable smoke,
  clean-build equality, oldest-userland, packaging, and E2E regression controls retain their prior
  outcomes.
- Does not prove: real candidate assessment or staging, Apple/SignPath credentials or calls,
  returned signed bytes, native trust, final post-signing hashes, Gatekeeper/quarantine/notarized-app
  provenance, Authenticode/Defender/WDAC policy, exact missing oldest snapshots, release
  aggregation, SSH transfer/install, packaged desktop use, fallback/performance, or an enabled tuple.
- Follow-up: keep every tuple disabled; execute pre-sign assessment and staging against the actual
  target-native candidate tree without credentials before connecting any protected signing job.

### E-M3-NATIVE-ASSESSMENT-LOCAL-RED-001 — Missing native assessment and orchestration modules fail focused contracts

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: pre-implementation head `e478ae458fa634845e9d9a7fd1d5a01cb41ed6ed`.
- Commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-windows-authenticode-assessment.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-native-signing-stage.test.mjs
  ```

- Result: expected RED. The Authenticode suite failed 1 file/0 tests in 396 ms because
  `ssh-relay-runtime-windows-authenticode-assessment.mjs` did not exist. The target-native stage
  suite independently failed 1 file/0 tests in 159 ms because
  `ssh-relay-runtime-native-signing-stage.mjs` did not exist. No production or artifact behavior
  changed.
- Oracle proved: neither actual Windows signature classification nor target-native first-build
  orchestration was already provided by the credential-free selection/payload modules.
- Does not prove: any implementation, real native candidate inspection, credentials, signing,
  native trust, release aggregation, SSH behavior, or an enabled tuple.
- Correction: add purpose-named bounded Authenticode assessment and target-native stage modules,
  then wire real first-build candidate execution into all native artifact jobs.

### E-M3-NATIVE-ASSESSMENT-LOCAL-001 — Bounded target-native assessment and first-build staging pass locally

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: implementation commit `1a79e492145a1297949a10ab6870d2118c5f5cd3`, based on exact staging-CI evidence commit
  `e478ae458fa634845e9d9a7fd1d5a01cb41ed6ed`.
- Runner/remote/network: local macOS 26.2 build 25C56 arm64, Node v26.0.0, pnpm 10.24.0, and
  PowerShell 7 at `/opt/homebrew/bin/pwsh`; no remote, network, credential, signing service,
  native-trust environment, or publication path was used. Windows execution was dependency-injected
  locally and remains an explicit CI requirement.
- Commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-windows-authenticode-assessment.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-stage.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs
  node --check config/scripts/ssh-relay-runtime-windows-authenticode-assessment.mjs
  node --check config/scripts/ssh-relay-runtime-windows-authenticode-assessment.test.mjs
  node --check config/scripts/ssh-relay-runtime-native-signing-stage.mjs
  node --check config/scripts/ssh-relay-runtime-native-signing-stage.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-windows-authenticode-assessment.mjs \
    config/scripts/ssh-relay-runtime-windows-authenticode-assessment.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-stage.mjs \
    config/scripts/ssh-relay-runtime-native-signing-stage.test.mjs
  node --input-type=module -e \
    'import {readFile} from "node:fs/promises"; import {parse} from "yaml"; const workflow=parse(await readFile(".github/workflows/ssh-relay-runtime-artifacts.yml","utf8")); process.stdout.write(workflow.jobs["build-windows-runtime"].steps.find((step)=>step.name==="Build twice, inspect, smoke, and compare exact runtime").run)' | \
    pwsh -NoLogo -NoProfile -NonInteractive -Command \
    '$source=[Console]::In.ReadToEnd(); $tokens=$null; $errors=$null; [System.Management.Automation.Language.Parser]::ParseInput($source,[ref]$tokens,[ref]$errors)|Out-Null; if($errors.Count){exit 1}'
  git diff --check
  ```

- Result: PASS. The assessment, stage, and workflow suites passed 3 files/19 tests in 1.31 seconds;
  the complete SSH relay script suite passed 27 files/139 tests in 5.82 seconds. Four direct syntax
  checks, typecheck, full lint/reliability gates, max-lines (355 grandfathered suppressions and no
  new bypass), bundled-skill verification, localization catalog/coverage, focused formatting,
  direct PowerShell parsing of the modified Windows step, and `git diff --check` passed. Lint emitted
  only existing unrelated warnings; local Node 26 emitted the expected repository Node-24 engine
  warning.
- Assessment oracle: the Windows module derives exactly five candidates from the authenticated
  identity, validates every size/hash before the first probe, passes the local path only through a
  dedicated environment variable, and uses `pwsh -NoLogo -NoProfile -NonInteractive` with a
  30-second timeout, 64-KiB output bound, and hidden window. It accepts only exact three-field JSON:
  `NotSigned` without certificate metadata or `Valid` with a bounded non-control subject and exact
  40-hex thumbprint. Hash mismatch, invalid/unknown status, malformed fields/JSON, stderr, nonzero
  exit, timeout/error, links, host mismatch, or mutation during the probe reject.
- Orchestration oracle: host platform must equal the identity OS before assessment. Linux
  authenticates three native files without creating a stage; macOS stages exactly its three non-Node
  candidates; Windows runs assessment once, preserves valid-upstream candidates, and stages only
  unsigned candidates. Official Node remains verification-only.
- Workflow oracle: both native shell families syntax-check and execute both new suites. The actual
  first clean-build tree is assessed only after archive/tree verification and clean-build equality.
  Linux requires no stage, macOS requires three staged files, and Windows requires five assessments,
  three unsigned staged `.node` files, and the exact preserved upstream `OpenConsole.exe` and
  `conpty.dll` paths. Every temporary stage excludes official Node, is removed after inspection, and
  emits one unpublished `.signing-stage.json` evidence file. No signing secret, credential, service,
  permission, or publication authority was introduced.
- Does not prove: real Windows PowerShell status/signer output, actual macOS/Linux candidate staging,
  Node 24 behavior, target-native filesystem behavior, Apple/SignPath calls, returned signed bytes,
  native trust, final post-signing hashes, missing oldest snapshots, release aggregation, SSH
  transfer/install, packaged desktop use, fallback/performance, or an enabled tuple.
- Follow-up: push the implementation and evidence separately; require exact-head logs and downloaded
  stage reports from all six jobs before accepting real candidate behavior.

### E-M3-NATIVE-ASSESSMENT-CI-001 — All six real candidates pass native assessment and exclusive staging

- Date: 2026-07-14 (run timestamps 2026-07-15 UTC)
- Owner: Codex implementation owner
- Source/run: exact draft-PR head `82f6c0cefa9d7ac031d56bcfd0b85a2ab71a7d8b`, containing
  implementation `1a79e492145a1297949a10ab6870d2118c5f5cd3` and local evidence
  `82f6c0cefa9d7ac031d56bcfd0b85a2ab71a7d8b`; Actions run
  [29384042509](https://github.com/stablyai/orca/actions/runs/29384042509).
- Commands:

  ```sh
  gh run view 29384042509 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh run view 29384042509 --repo stablyai/orca --job 87253495614 --log | \
    awk -F '\t' '$2 == "Run runtime artifact contract tests"' | \
    rg 'native-signing-stage|windows-authenticode-assessment|Test Files|Tests|Duration'
  gh run view 29384042509 --repo stablyai/orca --job 87253495617 --log | \
    awk -F '\t' '$2 == "Run runtime artifact contract tests"' | \
    rg 'native-signing-stage|windows-authenticode-assessment|Test Files|Tests|Duration'
  gh run download 29384042509 --repo stablyai/orca \
    --dir /private/tmp/orca-8450-run-29384042509-artifacts \
    --pattern 'ssh-relay-runtime-*'
  node --input-type=module  # inline six-report identity/cardinality/hash audit recorded below
  gh run view 29384042507 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh run view 29384042498 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  ```

- Contract result: PASS on Linux x64/arm64, macOS x64/arm64, and Windows x64/arm64. Every native
  build job syntax-checked and ran both new suites under exact Node 24.18.0. The POSIX log records
  Authenticode contract 8/8, target-native stage 5/5, and aggregate 26 files/135 tests in 6.78
  seconds. The PowerShell log records Authenticode contract 7 passed plus one POSIX-only symlink skip,
  target-native stage 5/5, and aggregate 27 files/132 passed plus seven total platform skips out of
  139 in 7.33 seconds.
- Real first-build result: PASS. Both Linux reports authenticate the exact three native identity
  entries, select/stage zero files, and create no payload. Both macOS reports select and stage exactly
  three non-Node files, with no assessment or preserved-upstream entry. Both Windows reports contain
  exactly five hash-bound PowerShell assessments, preserve exactly `OpenConsole.exe` and
  `conpty.dll` as `Valid`, and stage exactly the three `NotSigned` Orca-built `.node` files. All six
  builds confirm official Node is verification-only, delete the temporary stage, and upload only the
  JSON report plus the prior unpublished evidence set.
- Downloaded-report audit: PASS. Six artifacts contained exactly one identity and signing-stage
  report each. An inline Node audit required tuple/platform equality; matched every immutable,
  assessment, signing, preserved, and staged path/size/SHA-256 back to the identity; required staged
  paths and size totals to equal the signing selection; enforced the platform cardinalities; and
  rechecked official-Node exclusion and the exact Windows preserved set. Exact report evidence:

  | Tuple             | Report SHA-256                                                     | Assess | Sign | Preserve | Stage | Staged bytes |
  | ----------------- | ------------------------------------------------------------------ | ------ | ---- | -------- | ----- | ------------ |
  | linux-x64-glibc   | `9376647f4ac66060a82bab660752b961fedfc374d1b3fbc76fe60b6f35590a3b` | 0      | 0    | 0        | 0     | 0            |
  | linux-arm64-glibc | `453fe413e81aa475149f92180f54713293de0562fe86b049746d8ec77c449f1e` | 0      | 0    | 0        | 0     | 0            |
  | darwin-x64        | `ae9ac0afb40bd5a07ff2dba78d9a4c62bb7662f4f21a9483bd0c7f5469ef0162` | 0      | 3    | 0        | 3     | 393,744      |
  | darwin-arm64      | `dbfae0d923d3a18cd042939d8fa174e1e0420aad548bb5caf6256aed2b37a22e` | 0      | 3    | 0        | 3     | 459,592      |
  | win32-x64         | `69d6685d8c8dc54682a3af25402a1e489d11fc4a1771fd9ca599ea2c7864ddff` | 5      | 3    | 2        | 3     | 2,114,048    |
  | win32-arm64       | `50f85ebb09695bdc4443add6f267add66f099ee2b4b0fe9108a35f1f7db644f3` | 5      | 3    | 2        | 3     | 2,224,128    |

- Windows signer evidence: all four preserved entries report exact subject
  `CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US`. x64
  `OpenConsole.exe` and `conpty.dll` use thumbprint
  `3F56A45111684D454E231CFDC4DA5C8D370F9816`. arm64 `conpty.dll` uses that thumbprint and arm64
  `OpenConsole.exe` uses `F5877012FBD62FABCBDC8D8CEE9C9585BA30DF79`. These observations bind the
  unchanged source bytes but do not establish final Orca native trust.
- Native build/regression controls: all six double-build, smoke, exact-equality, metadata, stage,
  cleanup, and unpublished-upload jobs passed in Linux x64 3m58s, Linux arm64 4m48s, macOS x64
  6m08s, macOS arm64 3m32s, Windows x64 5m35s, and Windows arm64 9m02s. Linux x64/arm64 oldest-
  userland supplements passed in 37s/53s; Windows x64 exact build-20348 floor passed in 1m24s.
- Expected aggregate status: the artifact workflow concluded failure only because Windows arm64
  hosted image 10.0.26200 again rejected the exact declared 10.0.26100 floor in 3m46s. The failure
  preserves E-M3-WINDOWS-ARM64-BASELINE-CI-RED-001 and is not an assessment/staging regression.
- Other exact-head controls: PR Checks
  [29384042507](https://github.com/stablyai/orca/actions/runs/29384042507) passed in 13m59s. Golden E2E
  [29384042498](https://github.com/stablyai/orca/actions/runs/29384042498) passed macOS/Linux in
  4m02s/4m31s.
- Oracle proved: real first-build native candidate bytes on all six runner families obey the exact
  credential-free pre-sign assessment, preservation, exclusive staging, evidence, and cleanup
  contract without changing prior build/runtime outcomes.
- Does not prove: Apple Developer ID or SignPath invocation/approval, returned signed bytes, final
  post-signing hashes, Gatekeeper/quarantine/notarized-app provenance, final SignPath signer policy,
  Defender/WDAC, exact missing oldest snapshots, release aggregation, SSH transfer/install, packaged
  desktop use, fallback/performance, or an enabled tuple.
- Follow-up: keep every tuple disabled; implement exact returned-file application and final runtime
  identity/closure contracts before any credentialed signing job is allowed to feed aggregation.

### E-M3-NATIVE-SIGNING-APPLY-LOCAL-RED-001 — Missing return-application module fails the focused contract

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: pre-implementation head `6b93976909f9df6373414ecc65daf6e3eaff29b9`.
- Command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-native-signing-apply.test.mjs
  ```

- Result: expected RED. The purpose-named test file failed to load because
  `ssh-relay-runtime-native-signing-apply.mjs` did not exist: 1 failed file/0 tests in 525 ms. No
  runtime, workflow, signing, publication, or production behavior changed.
- Oracle proved: the existing payload verifier authenticated the returned file closure but did not
  yet construct and re-authenticate a complete post-sign runtime or derive its final content ID.
- Does not prove: any implementation behavior, native runner execution, signed bytes, native trust,
  release aggregation, SSH behavior, or an enabled tuple.
- Correction: add a purpose-named apply module that keeps all roots physically disjoint, copies into
  an exclusive candidate, substitutes only the exact verified returned files, derives the new full
  identity, and deletes any candidate that fails final-tree verification.

### E-M3-NATIVE-SIGNING-APPLY-LOCAL-001 — Exact returned-file application and final identity contracts pass locally

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: implementation commit `3eeea7bdb8b10825416d7f9bac03d5a820a997f5`, based on exact
  native-assessment evidence head `6b93976909f9df6373414ecc65daf6e3eaff29b9`.
- Runner/remote/network: local macOS 26.2 build 25C56 arm64, Node v26.0.0 and pnpm 10.24.0; no
  remote, network, credential, signing service, native-trust environment, artifact publication, or
  production path was used.
- Commands:

  ```sh
  node --check config/scripts/ssh-relay-runtime-native-signing-apply.mjs
  node --check config/scripts/ssh-relay-runtime-native-signing-apply.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-plan.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-selection.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-payload.test.mjs \
    config/scripts/ssh-relay-runtime-windows-authenticode-assessment.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-stage.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-apply.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-apply.mjs \
    config/scripts/ssh-relay-runtime-native-signing-apply.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist-summary.md
  git diff --check
  ```

- Result: PASS. The complete signing-contract family passed 7 files/48 tests in 721 ms; the final
  apply-plus-workflow check passed 2 files/12 tests in 319 ms; and the complete purpose-named SSH
  relay script suite passed 28 files/145 tests in 3.79 seconds. Both direct syntax checks, typecheck,
  full lint/reliability gates, max-lines (355 grandfathered suppressions and no new bypass),
  bundled-skill verification, localization catalog/coverage, focused formatting, and
  `git diff --check` passed. Lint emitted only existing unrelated warnings; local Node 26 emitted the
  expected repository Node-24 engine warning. An intermediate focused run exposed a macOS `/var`
  versus `/private/var` test-oracle alias and an intermediate lint run rejected three missing braces;
  both were corrected without weakening assertions or adding a disable, and the complete gates were
  rerun green.
- Apply oracle: source, returned, and exclusive output roots must be physically disjoint real
  locations. The complete unsigned source tree is authenticated first; the selection is
  independently reconstructed from and deeply matched to that identity; and the exact bounded
  returned closure is reverified. The implementation creates a fresh full-runtime candidate,
  substitutes only the returned signer files, preserves official Node and valid upstream Windows
  bytes exactly, drops stale unsigned-archive metadata, recalculates file sizes, hashes, expanded
  size, file count, and content ID, then re-verifies the complete final tree before returning it.
  It never mutates the unsigned source and removes the whole output on partial copy, source race,
  returned-file race, mode failure, or final integrity failure.
- Root/race oracle: existing, nested, overlapping, or physically redirected roots reject before an
  output is owned. The output is cleaned only after this invocation wins its exclusive creation, so
  a racing pre-existing path is never removed. Tests force returned and unsigned-source mutation
  after initial verification and require final-tree failure plus complete output cleanup.
- Workflow oracle: POSIX and Windows native contract jobs each syntax-check the source and test and
  explicitly execute the suite. The workflow lock requires four test-path occurrences and two
  source syntax-check occurrences. No fake signer output is produced and no post-sign artifact is
  built until a real protected signing job returns bytes.
- Does not prove: parsing or execution under Node 24/GitHub Actions, real Apple or SignPath returned
  bytes, native signature/trust policy, Gatekeeper/quarantine/notarized-app provenance,
  Authenticode/Defender/WDAC policy, exact missing oldest snapshots, release aggregation, SSH
  transfer/install, packaged desktop use, fallback/performance, or an enabled tuple.
- Follow-up: commit this evidence separately, push both commits, and require exact-head POSIX and
  Windows logs to show the apply suite executing under Node 24.18.0 on all six native jobs while all
  prior artifact, smoke, equality, baseline, PR-check, and Golden controls retain their outcomes.

### E-M3-NATIVE-SIGNING-APPLY-CI-001 — Return application executes on all six native jobs

- Date: 2026-07-14 (run timestamps 2026-07-15 UTC)
- Owner: Codex implementation owner
- Source/run: exact draft-PR head `a0e9ea91773287bd3779f6fb3c800aa0f5f1be01`, containing apply
  implementation `3eeea7bdb8b10825416d7f9bac03d5a820a997f5` and local evidence
  `a0e9ea91773287bd3779f6fb3c800aa0f5f1be01`; Actions run
  [29385274738](https://github.com/stablyai/orca/actions/runs/29385274738).
- Commands:

  ```sh
  gh run view 29385274738 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh run view 29385274738 --repo stablyai/orca --job 87257092104 --log | \
    awk -F '\t' '$2 == "Run runtime artifact contract tests"' | \
    rg 'native-signing-apply|Test Files|Tests|Duration'
  gh run view 29385274738 --repo stablyai/orca --job 87257092096 --log | \
    awk -F '\t' '$2 == "Run runtime artifact contract tests"' | \
    rg 'native-signing-apply|Test Files|Tests|Duration'
  gh run view 29385274738 --repo stablyai/orca --job 87258165496 --log | \
    rg 'Operating System|OsBuildNumber|26100|26200|declared Windows floor'
  gh run view 29385274716 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh run view 29385274721 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  ```

- Contract result: PASS on Linux x64/arm64, macOS x64/arm64, and Windows x64/arm64. Every native
  build job reports its purpose-named contract step successful under exact Node 24.18.0. The macOS
  arm64 POSIX log records both apply syntax checks, the apply suite passing 6/6 in 245 ms, and the
  aggregate 27 files/141 tests in 3.58 seconds. The Windows x64 PowerShell log records both syntax
  checks, the apply suite passing 6/6 in 1.638 seconds, and the aggregate 28 files/138 passed plus
  seven declared platform skips out of 145 in 7.13 seconds.
- Native build/regression controls: all six double-build, smoke, exact-equality, metadata,
  assessment/stage, cleanup, and unpublished-upload jobs passed. Durations were Linux x64 3m51s,
  Linux arm64 4m54s, macOS x64 5m58s, macOS arm64 2m31s, Windows x64 5m22s, and Windows arm64
  8m37s. Digest-pinned Linux x64/arm64 glibc 2.28/libstdc++ 6.0.25 supplements passed in 49s/58s.
  Windows x64 passed exact build 20348 in 1m39s.
- Expected aggregate status: the artifact workflow concluded failure only because the Windows arm64
  hosted image identified itself as Windows 11 build 10.0.26200 and rejected the exact declared
  build-26100 floor after 3m47s. The report records platform and architecture checks true with
  `osBuild: false`, preserving E-M3-WINDOWS-ARM64-BASELINE-CI-RED-001 without weakening its oracle.
- Other exact-head controls: PR Checks
  [29385274716](https://github.com/stablyai/orca/actions/runs/29385274716) passed in 13m50s after lint,
  typecheck, Git 2.25 compatibility, full tests, unpacked-app build, and packaged-CLI smoke. Golden
  E2E [29385274721](https://github.com/stablyai/orca/actions/runs/29385274721) passed Linux/macOS in
  4m42s/6m54s.
- Oracle proved: both native shell families parse and execute the exact post-sign application
  contract on every target-native runner while all existing artifact, bundled-Node, PTY/watcher,
  clean-build equality, oldest-userland, packaging, and E2E controls retain their prior outcomes.
- Does not prove: real Apple/SignPath returned bytes, final native trust, Gatekeeper/quarantine or
  notarized-app provenance, Authenticode/Defender/WDAC policy, exact missing oldest snapshots,
  release aggregation, SSH transfer/install, packaged desktop use, fallback/performance, or an
  enabled tuple.
- Follow-up: keep every tuple disabled and all signing credentials disconnected. Continue with
  credential-free native-trust and release-DAG failure contracts; require separately provisioned
  protected signing services and exact-floor runners before any native-signing/trust checkbox or
  aggregate output can pass.

### E-M3-MACOS-SIGNATURE-LOCAL-RED-001 — Missing macOS signature verifier fails the focused contract

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: pre-implementation head `2d4eab2c592adb0fd6396d6312394dddc6be6bc2`.
- Command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-macos-signature-verification.test.mjs
  ```

- Result: expected RED. The purpose-named test file failed to load because
  `ssh-relay-runtime-macos-signature-verification.mjs` did not exist: 1 failed file/0 tests in
  385 ms. No runtime, workflow, credential, signing, publication, or production behavior changed.
- Oracle proved: final-tree application did not yet enforce strict native macOS signature validity
  or exact upstream Node/Orca signer policy after returned bytes were substituted.
- Does not prove: any implementation, signed Orca bytes, native trust, Gatekeeper/notarization,
  release aggregation, SSH behavior, or an enabled tuple.
- Correction: authenticate the complete final runtime before native probes, bind the selection and
  unsigned/final identities, run bounded argument-array codesign probes on every native file, pin
  official Node policy, require the configured Orca team, and hash each file again after probing.

### E-M3-MACOS-SIGNATURE-LOCAL-001 — Final-tree-first macOS Developer ID policy passes locally

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: implementation commit `debb13f3011dc750e54826a4820f109e7d80f959`, based on exact
  apply-CI evidence commit `2d4eab2c592adb0fd6396d6312394dddc6be6bc2`.
- Runner/remote/network: local macOS 26.2 build 25C56 arm64, Node v26.0.0 and pnpm 10.24.0; no
  remote, network, credential, signing service, artifact publication, Gatekeeper/notarization, or
  production path was used. Synthetic Developer ID output was dependency-injected; the two real
  official Node checks used previously downloaded unpublished artifacts from run 29384042509.
- Commands:

  ```sh
  node --check config/scripts/ssh-relay-runtime-macos-signature-verification.mjs
  node --check config/scripts/ssh-relay-runtime-macos-signature-verification.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-native-signing-payload.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-selection.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-apply.test.mjs \
    config/scripts/ssh-relay-runtime-macos-signature-verification.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-payload.mjs \
    config/scripts/ssh-relay-runtime-native-signing-selection.mjs \
    config/scripts/ssh-relay-runtime-native-signing-apply.mjs \
    config/scripts/ssh-relay-runtime-macos-signature-verification.mjs \
    config/scripts/ssh-relay-runtime-macos-signature-verification.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist-summary.md
  for archive in <downloaded-darwin-arm64.tar.xz> <downloaded-darwin-x64.tar.xz>; do
    tar -xJf "$archive" -C <exclusive-temp-directory>
    /usr/bin/codesign --verify --strict --verbose=4 <exclusive-temp-directory>/bin/node
    /usr/bin/codesign --display --verbose=4 <exclusive-temp-directory>/bin/node
  done
  git diff --check
  ```

- Result: PASS. The signing payload/selection/application/macOS/workflow command passed 5 files/36
  tests in 1.08 seconds; the final macOS-plus-workflow check passed 2 files/13 tests in 2.32
  seconds; and the complete purpose-named SSH relay script suite passed 29 files/152 tests in 8.81
  seconds. Both direct syntax checks, typecheck, full lint/reliability gates, max-lines (355
  grandfathered suppressions and no new bypass), bundled-skill verification, localization
  catalog/coverage, focused formatting, and `git diff --check` passed. Lint emitted only existing
  unrelated warnings; local Node 26 emitted the expected repository Node-24 engine warning.
- Real official-Node result: PASS for both previously audited Node v24.18.0 candidates. Strict
  codesign reports each file valid on disk and satisfying its designated requirement. The arm64 and
  x86_64 display output both record signature size 8,986, exact first authority
  `Developer ID Application: Node.js Foundation (HX7739G8FX)`, the Developer ID Certification
  Authority and Apple Root CA chain, and team identifier `HX7739G8FX`. This authenticates the pinned
  vendor policy only; the three Orca-built files in those unsigned candidates remain ad-hoc signed.
- Verification oracle: the verifier runs only on macOS, requires an exact ten-character configured
  Orca team ID, reconstructs the selection from the authenticated unsigned identity, rejects stale
  unsigned archive metadata, and permits changes only to the exact three selected files within the
  established 4-MiB/file and 64-MiB/return bounds. It verifies final totals/content identity and the
  complete physical tree before any native command. Every target is a regular file whose SHA-256
  matches before and after two `/usr/bin/codesign` argument-array probes bounded to 30 seconds and
  64 KiB. Node requires the exact pinned authority/team; every Orca-built target requires the Apple
  Developer ID chain and configured Orca team. Ad-hoc, malformed/duplicate output, wrong authority,
  wrong team, command error/nonzero/oversized output, source/final/selection drift, and probe-time
  mutation fail closed.
- Workflow oracle: POSIX and Windows native contract jobs each syntax-check the source/test and
  explicitly execute the suite. Four test-path and two source-check occurrences are locked by the
  workflow contract. No job invokes codesign on fake returned bytes, connects credentials, signs,
  publishes, aggregates, or enables a tuple.
- Does not prove: real Developer ID signatures on the three returned Orca files, the actual Orca
  team/authority, target-native post-sign execution, macOS 13.5, quarantine/Gatekeeper, notarized
  containing-app provenance, Apple credential/timeout behavior, Windows final trust, release
  aggregation, SSH transfer/install, packaged desktop use, fallback/performance, or an enabled
  tuple.
- Follow-up: commit this evidence separately, push both commits, and require exact-head POSIX and
  Windows logs to show the macOS policy suite under Node 24.18.0 on all six native jobs while every
  prior build/smoke/equality/baseline, PR-check, and Golden control retains its outcome. Keep native
  signing/trust unchecked until real returned bytes pass target-native policy and endpoint gates.

### E-M3-MACOS-SIGNATURE-CI-001 — macOS signature-policy contracts pass on all six native jobs

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: exact head `6d47ef1458a9c57cc96fa26e1745eba8d73a7987`.
- Runner/remote/network: GitHub-hosted target-native Linux x64/arm64, macOS x64/arm64, and Windows
  x64/arm64 artifact jobs under Node v24.18.0. This used no SSH remote, signing credential/service,
  artifact publication, production path, or enabled tuple.
- Runs:
  - Artifact: [29386372366](https://github.com/stablyai/orca/actions/runs/29386372366)
  - PR Checks: [29386372337](https://github.com/stablyai/orca/actions/runs/29386372337)
  - Golden E2E: [29386372362](https://github.com/stablyai/orca/actions/runs/29386372362)
- Result: PASS. All six native artifact jobs passed their macOS signature contract step. The macOS
  arm64 job ran the focused suite 7/7 in 345 ms and the aggregate 28 files/148 tests in 3.95
  seconds. The Windows x64 job ran the suite 7/7 in 2.944 seconds and the aggregate 29 files/152
  tests (145 pass, 7 platform skips) in 8.69 seconds. Native job durations were Linux x64 4m09s,
  Linux arm64 4m37s, macOS x64 10m27s, macOS arm64 2m47s, Windows x64 5m37s, and Windows arm64
  10m29s.
- Regression controls: both digest-pinned oldest-Linux-userland supplements passed (x64 35s, arm64
  53s); Windows x64 build-20348 passed in 1m10s. Windows arm64 retained the expected floor failure:
  hosted build 10.0.26200 does not prove required build 26100 (`osBuild: false`). PR Checks passed
  in about 14m05s; Golden Linux/macOS passed in about 4m37s/3m01s.
- Oracle proved: the credential-free policy suite parses and executes under the pinned release Node
  on every target-native shell family while prior artifact and repository controls retain their
  expected outcomes.
- Does not prove: real Orca Developer ID signatures, actual Apple signing or returned production
  bytes, Gatekeeper/notarization, macOS 13.5, Windows Authenticode/Defender/WDAC, Windows arm64 build
  26100, SSH transfer/install, packaged desktop use, fallback/performance, or an enabled tuple.
- Follow-up: keep native signing/trust and every tuple unchecked. Implement the independent
  credential-free Windows final-signature policy contract, and require real returned bytes plus
  target-native endpoint gates before recording native-trust evidence.

### E-M3-WINDOWS-SIGNATURE-LOCAL-RED-001 — Missing final Windows signature verifier fails focused contract

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: pre-implementation head `0efd19c9c3e82979554804d4e72b6fb5a3cbff7e` plus the new
  uncommitted purpose-named test.
- Command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-windows-signature-verification.test.mjs
  ```

- Result: expected RED. The focused suite failed 1 file/0 tests in 463 ms because
  `ssh-relay-runtime-windows-signature-verification.mjs` did not exist. No credential, signing
  service, workflow, publication, tuple, SSH, or production behavior changed.
- Oracle proved: the existing pre-sign assessment and return-application modules did not already
  authenticate the complete final Windows tree and enforce final official-Node, Orca SignPath, and
  preserved-upstream signer policy.
- Does not prove: the implementation, real SignPath returned bytes, Windows trust, Defender/WDAC,
  target-native behavior, SSH transfer/install, fallback/performance, or an enabled tuple.
- Correction: authenticate the complete final tree before native probes; require `Valid` on every
  native file; pin the exact official Node and SignPath subjects; require preserved files to retain
  their assessed subject and thumbprint; bound PowerShell; and hash every target before and after
  probing.

### E-M3-WINDOWS-SIGNATURE-LOCAL-001 — Final-tree-first Windows signer policy passes locally

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: implementation commit `072c0d434e91013fc29ce16059da82c1ac7bfc12`, based on local
  evidence commit `0efd19c9c3e82979554804d4e72b6fb5a3cbff7e`.
- Runner/remote/network: local macOS 26.2 build 25C56 arm64, Node v26.0.0 and pnpm 10.24.0. No SSH
  remote, credential, signing service, PowerShell trust execution, publication, or production path
  was used. Synthetic `Get-AuthenticodeSignature` output was dependency-injected. Exact unpublished
  win32 x64/arm64 artifacts were downloaded from run 29386372366 solely for authenticated embedded
  certificate inspection.
- Commands:

  ```sh
  node --check config/scripts/ssh-relay-runtime-windows-signature-verification.mjs
  node --check config/scripts/ssh-relay-runtime-windows-signature-verification.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts \
    config/scripts/ssh-relay-runtime-native-signing-selection.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-apply.test.mjs \
    config/scripts/ssh-relay-runtime-windows-authenticode-assessment.test.mjs \
    config/scripts/ssh-relay-runtime-windows-signature-verification.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-windows-signature-verification.mjs \
    config/scripts/ssh-relay-runtime-windows-signature-verification.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist-summary.md
  gh run download 29386372366 --repo stablyai/orca --pattern 'ssh-relay-runtime-win32-*'
  unzip -p <authenticated-runtime.zip> bin/node.exe | shasum -a 256
  unzip -p <authenticated-runtime.zip> bin/node.exe | node -e <bounded-PE-certificate-table-slice> | \
    openssl pkcs7 -inform DER -print_certs -noout
  git diff --check
  ```

- Result: PASS. The focused five-suite command passed 5 files/32 tests in 3.89 seconds. The complete
  purpose-named SSH relay suite passed 30 files/158 tests in 5.39 seconds; the final post-format
  verifier/workflow rerun passed 2 files/12 tests in 368 ms. Both syntax checks, typecheck, full lint
  and reliability/localization/bundled-skill gates, max-lines (355 grandfathered suppressions and no
  new bypass), focused formatting, and `git diff --check` passed. Lint emitted only existing
  unrelated warnings; local Node 26 emitted the expected repository Node-24 engine warning.
- Verification oracle: the verifier accepts only Windows, reconstructs and authenticates the
  signing selection, enforces the bounded source-to-final identity transition and final content ID,
  and verifies the complete physical final tree before any native command. It probes all six native
  files through the existing argument-array PowerShell contract bounded to 30 seconds and 64 KiB,
  requires `Valid`, and hashes each file before and after probing. Official Node requires exact
  subject `CN=OpenJS Foundation, O=OpenJS Foundation, L=San Francisco, S=California, C=US`; every
  returned Orca file requires exact SignPath Foundation subject; preserved Microsoft files must
  retain both their source-assessed subject and 40-hex thumbprint. Wrong/malformed status or signer,
  stale selection/identity/archive metadata, unbounded growth, tree mutation, and probe-time mutation
  fail closed.
- Exact official-Node certificate evidence: the arm64/x64 `bin/node.exe` bytes match their identities
  at SHA-256 `c7225670c3f477778e18c43a55867f7a0d76468221245e5981ab80eb953c8102` (81,067,848
  bytes) and `9a4eb5f1c29c6a2e93852ead46b999e284a6a5ca8bab4d4e241d587d025a52de` (92,534,088
  bytes). Both PE certificate tables contain the OpenJS Foundation subject in San Francisco,
  California, issued by Microsoft ID Verified CS AOC CA 04. This establishes the signer subject
  encoded in the exact authenticated inputs; local OpenSSL inspection does not establish Windows
  Authenticode `Valid` status or endpoint trust.
- Workflow oracle: both POSIX and Windows artifact job families syntax-check the verifier source and
  test and run the suite. Four test-path and two source-check occurrences are locked. No job invokes
  SignPath, fabricates final bytes, accepts native trust, publishes, or enables a tuple.
- Does not prove: real SignPath signatures on the three returned Orca files, target-native final-tree
  execution, Windows Server 2022/Windows 11 trust, Defender/WDAC, the arm64 build-26100 floor, signing
  approval/timeout behavior, release aggregation, SSH transfer/install, packaged desktop use,
  fallback/performance, or an enabled tuple.
- Follow-up: commit and push the implementation/evidence separately, then require exact-head POSIX
  and PowerShell logs to show the new suite under Node 24.18.0 on all six native jobs while every
  prior artifact, baseline, PR-check, and Golden control retains its expected outcome. Keep native
  signing/trust unchecked until real returned bytes pass target-native policy and endpoint gates.

### E-M3-WINDOWS-SIGNATURE-CI-001 — Windows signer-policy contracts pass on all six native jobs

- Date: 2026-07-14 (run timestamps 2026-07-15 UTC)
- Owner: Codex implementation owner
- Source/run: exact draft-PR head `cce37cd415600e9bd77093d250b5cb8e3ad9f3ce`, containing
  implementation `072c0d434e91013fc29ce16059da82c1ac7bfc12`; Actions run
  [29387668264](https://github.com/stablyai/orca/actions/runs/29387668264).
- Commands:

  ```sh
  gh run view 29387668264 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh run view 29387668264 --repo stablyai/orca --job 87264193814 --log | \
    awk -F '\t' '$2 == "Run runtime artifact contract tests"' | \
    rg 'windows-signature-verification|Test Files|Tests|Duration'
  gh run view 29387668264 --repo stablyai/orca --job 87264193803 --log | \
    awk -F '\t' '$2 == "Run runtime artifact contract tests"' | \
    rg 'windows-signature-verification|Test Files|Tests|Duration'
  gh run view 29387668264 --repo stablyai/orca --job 87264193809 --log | \
    awk -F '\t' '$2 == "Run runtime artifact contract tests"' | \
    rg 'windows-signature-verification|Test Files|Tests|Duration'
  gh run view 29387668264 --repo stablyai/orca --job 87265321571 --log | \
    rg 'OsBuildNumber|26100|26200|osBuild'
  gh run view 29387668227 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  gh run view 29387668205 --repo stablyai/orca \
    --json status,conclusion,headSha,createdAt,updatedAt,url,jobs
  ```

- Contract result: PASS on Linux x64/arm64, macOS x64/arm64, and Windows x64/arm64. Every native
  build job syntax-checked the source/test and executed the new suite under exact Node 24.18.0. The
  macOS arm64 log records 6/6 in 372 ms and aggregate 29 files/154 tests in 4.86 seconds. Windows
  x64 records 6/6 in 2.643 seconds and aggregate 30 files/158 tests (151 pass, 7 platform skips) in
  8.13 seconds; Windows arm64 records 6/6 in 3.722 seconds and the same aggregate in 11.35 seconds.
- Native build/regression controls: all six double-build, smoke, exact-equality, metadata, stage,
  cleanup, and unpublished-upload jobs passed. Durations were Linux x64 4m08s, Linux arm64 4m20s,
  macOS x64 9m42s, macOS arm64 2m58s, Windows x64 5m14s, and Windows arm64 9m13s. Linux x64/arm64
  digest-pinned glibc 2.28/libstdc++ 6.0.25 supplements passed in 52s/52s. Windows x64 exact
  build-20348 passed in 1m17s.
- Expected aggregate status: the artifact workflow concluded failure only because the Windows arm64
  hosted image is build 10.0.26200 rather than the declared 10.0.26100 floor (`osBuild: false`) in
  4m41s. This retains E-M3-WINDOWS-ARM64-BASELINE-CI-RED-001 and is not a verifier regression.
- Other exact-head controls: PR Checks
  [29387668227](https://github.com/stablyai/orca/actions/runs/29387668227) passed in about 13m27s,
  including lint, reliability/max-lines, typecheck, Git 2.25 compatibility, full tests, unpacked app,
  and packaged-CLI smoke. Golden E2E
  [29387668205](https://github.com/stablyai/orca/actions/runs/29387668205) passed Linux/macOS in about
  4m49s/5m18s.
- Oracle proved: both native shell families parse and execute the exact final-tree/signer-policy
  contract on every target-native runner while all prior artifact, bundled-Node, PTY/watcher,
  clean-build equality, oldest-userland, packaging, and E2E controls retain their expected outcome.
- Does not prove: a real final signed Windows runtime, SignPath invocation or returned Orca bytes,
  target-native `Valid` status for those returned bytes, Defender/WDAC, exact Windows arm64 build
  26100, Apple signing/trust, release aggregation, SSH transfer/install, packaged desktop use,
  fallback/performance, or an enabled tuple.
- Follow-up: keep native signing/trust and every tuple unchecked. Prove exact official-Node and
  preserved-upstream source signatures target-natively without credentials, then keep real returned
  SignPath bytes plus Defender/WDAC and exact-floor execution as separate required gates.

### E-M3-WINDOWS-SOURCE-SIGNATURE-LOCAL-RED-001 — Missing Windows source-signature gate fails import contract

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: pre-implementation head `bd3e40dc52ede75e44ded2f5e84f5092be5b2d87` plus the new
  uncommitted purpose-named test.
- Command:

  ```sh
  node --input-type=module -e \
    "import('./config/scripts/ssh-relay-runtime-windows-source-signature-verification.test.mjs')"
  ```

- Result: expected RED with `ERR_MODULE_NOT_FOUND` for
  `ssh-relay-runtime-windows-source-signature-verification.mjs`. A concurrent focused Vitest launch
  was stopped after unrelated workspace CPU contention prevented a bounded result; it is not used as
  evidence. No workflow, credential, signing, publication, tuple, SSH, or production behavior
  changed.
- Oracle proved: neither the pre-sign assessment nor final-runtime verifier already exposed a
  reusable gate that authenticated the complete source tree and target-natively verified official
  Node plus preserved upstream signer policy.
- Does not prove: implementation, Windows execution, a `Valid` signature, SignPath returns,
  Defender/WDAC, SSH behavior, or an enabled tuple.
- Correction: consume the exact signing-stage assessment and selection, authenticate the complete
  source tree, run three bounded native probes, require exact Node/preserved identity, re-hash each
  target, and retain a separate report from each Windows runner.

### E-M3-WINDOWS-SOURCE-SIGNATURE-LOCAL-001 — Immutable and preserved Windows source policy passes locally

- Date: 2026-07-14
- Owner: Codex implementation owner
- Source: implementation commit `6ef2943dedd0165ae4b84d8295763aa06682d6cc`, based on CI
  evidence commit `bd3e40dc52ede75e44ded2f5e84f5092be5b2d87`.
- Runner/remote/network: local macOS 26.2 build 25C56 arm64, Node v26.0.0 and pnpm 10.24.0. No SSH
  remote, Windows trust execution, credential, signing service, publication, or production path was
  used. Native output was dependency-injected; exact target-native execution remains the next gate.
- Commands:

  ```sh
  node --check config/scripts/ssh-relay-runtime-windows-source-signature-verification.mjs
  node --check config/scripts/ssh-relay-runtime-windows-source-signature-verification.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-runtime-windows-source-signature-verification.test.mjs \
    config/scripts/ssh-relay-runtime-windows-signature-verification.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts config/scripts/ssh-relay-*.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    config/scripts/ssh-relay-runtime-windows-signature-verification.mjs \
    config/scripts/ssh-relay-runtime-windows-source-signature-verification.mjs \
    config/scripts/ssh-relay-runtime-windows-source-signature-verification.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist-summary.md
  git diff --check
  ```

- Result: PASS. The final focused command passed 3 files/17 tests in 4.98 seconds; the complete
  purpose-named SSH relay suite passed 31 files/163 tests in 5.16 seconds. Both syntax checks,
  typecheck, full lint and reliability/localization/bundled-skill gates, max-lines (355
  grandfathered suppressions and no new bypass), focused formatting, and `git diff --check` passed.
  Lint emitted only existing unrelated warnings; local Node 26 emitted the expected repository
  Node-24 engine warning.
- Verification oracle: a bounded regular signing-stage report must exactly reproduce the
  hash-authenticated tuple/platform/policy, assessments, immutable file, signing set, and preserved
  set. On Windows, the verifier authenticates the complete source runtime before any probe, then
  reuses the final verifier's exact signer policy and 30-second/64-KiB PowerShell boundary for the
  one official Node file and two source-preserved Microsoft files. Every file is hashed before and
  after probing. Cross-platform execution, report/selection drift, wrong signer/status/thumbprint,
  prior tree mutation, and probe-time mutation fail closed.
- Workflow oracle: both native shell families syntax-check and run the source contract. After the
  real Windows first-build assessment, each native Windows job invokes the source verifier before
  removing signing staging, requires exactly one `official-node` and two `preserved-upstream`
  results, and retains a distinct `.source-signatures.json` evidence file. It has no credentials and
  does not invoke SignPath or change runtime bytes.
- Does not prove: target-native x64/arm64 execution, actual `Valid` status or signer outputs, real
  SignPath returned Orca files, final Windows trust, Defender/WDAC, build 26100, release aggregation,
  SSH transfer/install, fallback/performance, or an enabled tuple.
- Follow-up: push the implementation and evidence, inspect both exact source-signature reports and
  runner logs, and keep returned-byte/native-trust boxes unchecked until the separately gated real
  SignPath and endpoint checks pass.

### E-M3-WINDOWS-SOURCE-SIGNATURE-CI-001 — Native Windows source signatures match retained identity

- Date: 2026-07-15
- Owner: Codex implementation owner
- Source: exact head `be32653a7b77eeaed168d91b790fc2e006b438db`; artifact run
  [29388734922](https://github.com/stablyai/orca/actions/runs/29388734922), PR Checks
  [29388734935](https://github.com/stablyai/orca/actions/runs/29388734935), and Golden E2E
  [29388734914](https://github.com/stablyai/orca/actions/runs/29388734914).
- Native jobs:
  - `win32-x64`: job
    [87267322870](https://github.com/stablyai/orca/actions/runs/29388734922/job/87267322870),
    GitHub-hosted `windows-2022`, resolved `win22` image `20260706.237.1`, native `X64`,
    runner `GitHub Actions 1000055156`; PASS in 5 minutes 23 seconds. Its combined two-build,
    verify, smoke, compare, signing-stage, and source-signature step ran for 3 minutes 45 seconds.
  - `win32-arm64`: job
    [87267322867](https://github.com/stablyai/orca/actions/runs/29388734922/job/87267322867),
    GitHub-hosted `windows-11-arm`, resolved `win11-arm64` image `20260706.102.1`, native `ARM64`,
    runner `GitHub Actions 1000055154`; PASS in 11 minutes 7 seconds. Its combined two-build,
    verify, smoke, compare, signing-stage, and source-signature step ran for 5 minutes 30 seconds.
  - The workflow does not time the three source-signature probes separately. Each probe retains the
    implemented 30-second process timeout and 64-KiB output bound; the combined step timings above
    are the narrowest exact native timing available from this run.
- Artifact retrieval and identity command:

  ```sh
  gh run download 29388734922 --repo stablyai/orca \
    --name ssh-relay-runtime-win32-x64 --dir <exclusive-x64-directory>
  gh run download 29388734922 --repo stablyai/orca \
    --name ssh-relay-runtime-win32-arm64 --dir <exclusive-arm64-directory>
  node --input-type=module -e '<bounded identity/signing-report comparison>' <artifact-directory>
  shasum -a 256 <artifact-directory>/*.source-signatures.json
  wc -c <artifact-directory>/*.source-signatures.json
  ```

- Result: PASS. Each artifact contains exactly one identity, archive, SPDX statement, provenance
  statement, signing-stage report, and source-signature report. The bounded comparison requires one
  report, exact tuple/content identity, exactly three verified files, one `official-node`, two
  `preserved-upstream`, identity-entry hash equality for every verified file, and exact preserved
  subject/thumbprint equality with the authenticated signing-stage report.
- Retained report identities:
  - x64 report: 1,401 bytes, SHA-256
    `9ceb6b3dadf85ea7d338dbd11e1397e58b83455842378f3465ccb945b5ec0805`, source content ID
    `sha256:7ddad668780ce5b2592d86afcebf9d897172bdf07c618ae238b5d51eebfe1596`.
  - arm64 report: 1,403 bytes, SHA-256
    `5a63a7f31d64cc6a8b825461e9729f59f0176d8d03293fa0ce2c05df39734d22`, source content ID
    `sha256:2955cec7f22447a1303dad548df6c2fa2470b62ba1d70924b8b169e718a7701e`.
- Exact native signer evidence:
  - Both official Node files report `Valid` with subject
    `CN=OpenJS Foundation, O=OpenJS Foundation, L=San Francisco, S=California, C=US` and thumbprint
    `CECD9673E955CA766047DD43706D31E48A6BD3B5`. The x64 Node hash is
    `sha256:9a4eb5f1c29c6a2e93852ead46b999e284a6a5ca8bab4d4e241d587d025a52de`; arm64 is
    `sha256:c7225670c3f477778e18c43a55867f7a0d76468221245e5981ab80eb953c8102`.
  - Every preserved file reports `Valid` with subject
    `CN=Microsoft Corporation, O=Microsoft Corporation, L=Redmond, S=Washington, C=US`. x64
    `OpenConsole.exe` and `conpty.dll` use thumbprint
    `3F56A45111684D454E231CFDC4DA5C8D370F9816`. Arm64 `OpenConsole.exe` uses
    `F5877012FBD62FABCBDC8D8CEE9C9585BA30DF79`; arm64 `conpty.dll` uses
    `3F56A45111684D454E231CFDC4DA5C8D370F9816`.
- Concurrent regression result: PR Checks and both Golden E2E jobs completed successfully at the
  exact head. The artifact run concluded `failure` solely because its separate Windows arm64
  oldest-baseline job observed `10.0.26200` rather than the exact required build `26100`, after the
  runtime itself passed bundled Node, PTY, watcher, and settlement smoke in 8,275.5554 ms with a
  49,852,416-byte RSS measurement. This is the retained
  E-M3-WINDOWS-ARM64-BASELINE-CI-RED-001 gap, not a source-signature failure.
- Does not prove: real SignPath returned Orca signatures, final-tree Authenticode trust, Defender or
  WDAC policy, Windows arm64 build 26100, macOS trust, draft release aggregation/read-back, SSH
  transfer/install, fallback/performance, or an enabled tuple. Nothing was published or connected to
  production behavior.

### E-M4-RELEASE-DAG-LOCAL-RED-001 — Missing release-stage and draft-recovery gates fail imports

- Date: 2026-07-15
- Owner: Codex implementation owner
- Source: exact implementation base `be32653a7b77eeaed168d91b790fc2e006b438db` plus the two new
  uncommitted purpose-named test files.
- Command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-runtime-release-stage-gate.test.mjs \
    config/scripts/ssh-relay-runtime-draft-recovery.test.mjs
  ```

- Result: expected RED in 346 ms. Both suites fail before collecting tests with
  `ERR_MODULE_NOT_FOUND` for `ssh-relay-runtime-release-stage-gate.mjs` and
  `ssh-relay-runtime-draft-recovery.mjs`.
- Oracle proved: the current worktree has no reusable contract that requires a complete immutable
  build → native-signing approval/return → aggregate/manifest-signature → upload → authenticated
  read-back chain, and no contract that permits same-draft recovery only for exact already-uploaded
  runtime bytes.
- Does not prove: implementation, workflow wiring, GitHub release behavior, signing-service behavior,
  a real draft recovery, publication, desktop embedding, SSH behavior, or an enabled tuple.
- Correction: implement bounded exact-stage validation and hash/size-bound same-draft reuse as
  disconnected credential-free modules; retain every production/default and tuple state unchanged.

### E-M4-RELEASE-DAG-LOCAL-001 — Fail-closed release stages and same-draft recovery pass locally

- Date: 2026-07-15
- Owner: Codex implementation owner
- Source: exact implementation commit `6f13e94f8a7a315ac3da6bb2067b99da8e02a803`, based on
  `be32653a7b77eeaed168d91b790fc2e006b438db`.
- Runner/remote/network: local macOS 26.2 build 25C56 arm64, Node v26.0.0 and pnpm 10.24.0. No
  GitHub release, signing service, credential, approval environment, SSH remote, publication, or
  production consumer was used. The repository emits its expected Node-24 engine warning.
- Commands:

  ```sh
  node --check config/scripts/ssh-relay-runtime-release-stage-gate.mjs
  node --check config/scripts/ssh-relay-runtime-release-stage-gate.test.mjs
  node --check config/scripts/ssh-relay-runtime-draft-recovery.mjs
  node --check config/scripts/ssh-relay-runtime-draft-recovery.test.mjs
  /usr/bin/time -l pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-runtime-release-stage-gate.test.mjs \
    config/scripts/ssh-relay-runtime-draft-recovery.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-runtime-release-stage-gate.test.mjs \
    config/scripts/ssh-relay-runtime-draft-recovery.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-*.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check \
    .github/workflows/ssh-relay-runtime-artifacts.yml \
    config/scripts/ssh-relay-runtime-release-stage-gate.mjs \
    config/scripts/ssh-relay-runtime-release-stage-gate.test.mjs \
    config/scripts/ssh-relay-runtime-draft-recovery.mjs \
    config/scripts/ssh-relay-runtime-draft-recovery.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist.md \
    docs/reference/plans/2026-07-14-ssh-relay-github-release-implementation-checklist-summary.md
  git diff --check
  ```

- Result: PASS. The two purpose-named suites pass 2 files/21 tests in 245 ms; `/usr/bin/time -l`
  records 0.91 seconds wall time, 131,825,664-byte maximum RSS, zero swaps, and 95,933,720-byte peak
  memory footprint for the Vitest process tree. The workflow-inclusive focus passes 3 files/27
  tests; the final complete SSH-relay suite passes 33 files/184 tests in 8.52 seconds. All four syntax
  checks, typecheck, full lint/reliability/localization/bundled-skill gates, max-lines (355
  grandfathered suppressions and no new bypass), focused formatting, and `git diff --check` pass.
  Lint emits only existing unrelated warnings.
- Stage oracle: candidate tuples must use exact supported identities; every candidate requires one
  bounded successful build, every macOS/Windows candidate requires one single-attempt approved
  native-signing return that changes immutable identity, and Linux cannot invent a signing stage.
  Aggregate inputs must exactly equal final per-tuple outputs and produce bounded manifest/signature
  assets. Upload and authenticated read-back must reproduce the complete ordered hash/size chain.
  Missing, duplicate, unexpected, failed, cancelled, timed-out, retry-exhausted, over-budget,
  approval-absent, approval-denied, approval-timed-out, input-drifted, incomplete, or byte-drifted
  results fail closed.
- Bound policy: build is at most 30 minutes and three attempts; native signing is one attempt and at
  most four hours; aggregate is one attempt and 15 minutes; upload and read-back are each at most
  three attempts and 15 minutes. Signing is deliberately single-attempt so one approval cannot
  silently authorize a second set of bytes after timeout or service failure.
- Recovery oracle: only the same draft tag and exact 40-hex source commit may be resumed. Existing
  managed assets are reusable only when name, SHA-256, and non-zero size exactly match expected
  immutable output. Changed, empty, duplicate, unexpected managed, published, cross-tag, and
  cross-commit states fail closed; unrelated desktop assets are ignored rather than overwritten.
- Workflow oracle: both POSIX and Windows artifact jobs syntax-check and execute the new suites under
  the same Node 24 native job families. The workflow retains read-only contents permission and has
  no release, signing credential, or publication authority.
- Does not prove: a real native-signing approval/timeout, signing-service retry behavior, a real
  aggregate or signed manifest, upload/read-back through GitHub's draft release API, recovered-draft
  execution, desktop prerequisites/embedding, native trust, SSH transfer/install, fallback,
  performance, or an enabled tuple. Production release workflow wiring remains absent.
- Follow-up: run the contract on all six native jobs at the exact implementation head, then add the
  credential-free aggregate-input/read-back implementation without connecting publication or a
  desktop consumer.

### E-M4-RELEASE-DAG-CI-001 — Release-DAG contracts pass all six native build jobs

- Date: 2026-07-15
- Owner: Codex implementation owner
- Source: exact PR head `97164470cb9abad670634b9d4f04424bcc8662b5`; implementation commit
  `6f13e94f8a7a315ac3da6bb2067b99da8e02a803`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741).
- Runner/network: GitHub-hosted native runners with normal artifact-build egress and no SSH remote,
  signing service, release credential, approval environment, draft upload, publication, or desktop
  consumer. Exact jobs and resolved images:
  - linux-x64-glibc job 87271365779: `ubuntu-24.04`, `ubuntu24` image `20260705.232.1`, X64,
    04:53:59Z–04:58:13Z.
  - linux-arm64-glibc job 87271365815: `ubuntu-24.04-arm`, `ubuntu24-arm64` image
    `20260714.61.1`, ARM64, 04:54:03Z–04:59:11Z.
  - darwin-x64 job 87271365782: `macos-15-intel`, `macos15` image `20260629.0276.1`, X64,
    04:53:59Z–04:59:21Z.
  - darwin-arm64 job 87271365773: `macos-15`, `macos15` image `20260706.0213.1`, ARM64,
    04:53:59Z–04:57:05Z.
  - win32-x64 job 87271365831: `windows-2022`, `win22` image `20260706.237.1`, X64,
    04:53:59Z–04:59:34Z.
  - win32-arm64 job 87271365776: `windows-11-arm`, `win11-arm64` image `20260706.102.1`, ARM64,
    04:53:59Z–05:03:25Z.
- Command: the workflow's `Run runtime artifact contract tests` step syntax-checks both new modules
  and tests, then includes
  `ssh-relay-runtime-release-stage-gate.test.mjs` and
  `ssh-relay-runtime-draft-recovery.test.mjs` in the purpose-named native Vitest command. Inspection
  used `gh run view 29390079639 --repo stablyai/orca --job <job-id> --log` for every job.
- Result: PASS for all six target-native build jobs. Each runner passes the release-stage suite's 15
  tests and draft-recovery suite's 6 tests under Node v24.18.0. The four POSIX jobs report 32 passing
  contract files; the two Windows jobs report 33, including the Windows-only PE diagnostic suite.
  Both Linux oldest-userland jobs and Windows x64 floor job also pass. Overall workflow conclusion is
  the expected `failure` only because downstream Windows arm64 floor job 87272581856 observes build
  26200 instead of required 26100 after the exact runtime passes archive/tree verification, bundled
  Node, PTY, watcher, and resource settlement in 7,721.7682 ms with 48,504,832-byte RSS.
- Concurrent regression: Golden E2E run
  [29390079632](https://github.com/stablyai/orca/actions/runs/29390079632) passes both macOS job
  87271365717 and Linux job 87271365749. PR Checks run 29390079665 attempt 1 job 87271365846 passes
  lint, typecheck, Git compatibility, and tests, then flakes during `Build unpacked app` when a
  125-MB Electron GitHub asset download receives `read: connection reset by peer`. Authorized
  attempt 2 job 87272898091 runs from 05:05:54Z to 05:21:00Z and passes the complete verify job,
  including unpacked packaging and packaged CLI smoke.
- Oracle proved: the disconnected build → signing → aggregate → upload → read-back failure contract
  and same-draft immutable recovery contract parse and execute identically on all six native runner
  families, including Windows PowerShell workflow wiring. No platform can omit its required signing
  stage, invent a Linux signing stage, exceed the bounded retry/time policy, or accept missing,
  duplicate, drifted, failed, cancelled, approval-rejected, or recovered cross-release state.
- Does not prove: real Apple/SignPath signing or approval, target-native trust of returned Orca bytes,
  aggregate/manifest generation, manifest signing, GitHub draft upload/read-back, packaged manifest
  embedding, SSH transfer/install, fallback, performance, or an enabled tuple.
- Follow-up: implement disconnected aggregate-input and authenticated draft read-back verification,
  then execute it on all six native job families. Retain every production/default and tuple state.

### E-M4-AGGREGATE-READBACK-LOCAL-RED-001 — Aggregate and draft byte verifiers are absent

- Date: 2026-07-15
- Owner: Codex implementation owner
- Source: exact implementation base `97164470cb9abad670634b9d4f04424bcc8662b5` plus the two new
  uncommitted purpose-named test files.
- Command:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-runtime-aggregate-input.test.mjs \
    config/scripts/ssh-relay-runtime-draft-readback.test.mjs
  ```

- Result: expected RED in 284 ms. Both suites fail before collecting tests with
  `ERR_MODULE_NOT_FOUND` for `ssh-relay-runtime-aggregate-input.mjs` and
  `ssh-relay-runtime-draft-readback.mjs`.
- Oracle proved: the exact head had only declarative stage/recovery contracts; it had no filesystem
  implementation binding aggregate input declarations to stable archive bytes and no authenticated,
  bounded draft asset read-back implementation.
- Does not prove: implementation, GitHub API behavior, actual release assets, native runners,
  manifest generation/signing, publication, desktop embedding, SSH behavior, or an enabled tuple.
- Correction: implement both byte boundaries as disconnected modules with bounded streaming,
  cancellation, exact identity/asset checks, and credential-safe redirect handling.

### E-M4-AGGREGATE-READBACK-LOCAL-001 — Immutable aggregate and draft read-back bytes pass locally

- Date: 2026-07-15
- Owner: Codex implementation owner
- Source: implementation commit `e995186545d4b584840cb7ec8cd1403fbd045a7b`, based on exact prior
  head `97164470cb9abad670634b9d4f04424bcc8662b5`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741).
- Runner/network: local macOS 26.2 build 25C56 arm64, Node v26.0.0 and pnpm 10.24.0. Aggregate tests
  use exclusive local temporary directories. Draft tests use injected WHATWG `Response` objects and
  make no network, GitHub API, release, credential, signing-service, SSH, publication, or production
  call. The repository emits its expected Node-24 engine warning.
- Commands:

  ```sh
  node --check config/scripts/ssh-relay-runtime-aggregate-input.mjs
  node --check config/scripts/ssh-relay-runtime-aggregate-input.test.mjs
  node --check config/scripts/ssh-relay-runtime-draft-readback.mjs
  node --check config/scripts/ssh-relay-runtime-draft-readback.test.mjs
  /usr/bin/time -l pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-runtime-aggregate-input.test.mjs \
    config/scripts/ssh-relay-runtime-draft-readback.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-runtime-aggregate-input.test.mjs \
    config/scripts/ssh-relay-runtime-draft-readback.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-*.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check <eight touched implementation/workflow/checklist files>
  git diff --check
  ```

- Result: PASS. Four syntax checks pass. After exact-HTTP-200 hardening, the two purpose-named suites
  pass 2 files/17 tests in 295 ms; `/usr/bin/time -l` records 0.89 seconds wall time,
  132,104,192-byte maximum RSS, zero swaps, and 96,277,880-byte peak memory footprint.
  Workflow-inclusive focus passes 3 files/23 tests in 410 ms. The complete SSH-relay suite passes 35
  files/201 tests in 6.63 seconds. Typecheck, full
  lint/reliability/localization/bundled-skill gates, max-lines (355 grandfathered suppressions and no
  new bypass), focused formatting, and `git diff --check` all pass; lint emits only existing unrelated
  warnings.
- Aggregate oracle: accepts at most eight declared supported tuples and derives each immutable
  archive name from its tuple/content identity. The exclusive input directory must contain exactly
  those regular files, with no extras or links; each file is streamed under a 100-MiB/file and
  15-minute bound, and exact size, SHA-256, and stable pre/post file metadata must match before the
  declared asset chain is returned. Duplicate tuple/name, unsupported tuple, malformed identity,
  cancellation, missing/extra input, or byte drift fails closed.
- Draft read-back oracle: requires one exact draft ID and stable/RC/perf tag, exact managed asset
  names, uploaded state, nonzero declared size, at most 100 MiB per asset/1 GiB total, and a 15-minute
  bound. It manually handles the authenticated GitHub asset API redirect, accepts only HTTPS
  `release-assets.githubusercontent.com`, never forwards authorization to the CDN, requires exact
  HTTP 200 from either direct or redirected downloads, streams every body, and requires exact size
  and SHA-256. Published/cross-tag/incomplete/unexpected drafts, unsafe redirects, unexpected 2xx
  statuses, changed/truncated/oversized bytes, and cancellation fail closed.
- Workflow oracle: both POSIX and Windows artifact jobs syntax-check and execute the two new suites
  under the same Node 24 native job families. The workflow retains read-only contents permission and
  has no release, signing credential, or publication authority.
- Does not prove: a real GitHub API/CDN redirect, a real draft or full-size asset, aggregate manifest
  generation, Ed25519 signing, native signing/trust, upload/recovery execution, desktop
  prerequisites/embedding, SSH transfer/install, fallback, performance, or an enabled tuple. The
  local symlink fixture is skipped on Windows, although the shared implementation rejects all
  non-regular directory entries and exact-head Windows execution remains required.
- Follow-up: exact-head native execution is closed by E-M4-AGGREGATE-READBACK-CI-001. Add
  credential-free canonical manifest assembly/signature handoff without production credentials,
  publication, or a desktop consumer.

### E-M4-AGGREGATE-READBACK-CI-001 — Aggregate and draft byte verifiers pass all six native jobs

- Date: 2026-07-15
- Owner: Codex implementation owner
- Source: exact PR head `87a8e4dc3461ee1c118c223918f36c672749a60b`; implementation commit
  `e995186545d4b584840cb7ec8cd1403fbd045a7b`; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741).
- Runner/network: GitHub-hosted native runners with normal artifact-build egress. The aggregate tests
  use runner-local exclusive temporary directories. Draft read-back tests inject WHATWG `Response`
  objects and make no GitHub API, CDN, release, signing-service, SSH, publication, or production call.
  Exact jobs, resolved images, and full contract-suite durations:
  - linux-x64-glibc job 87276316322: `ubuntu-24.04`, `ubuntu24` image `20260705.232.1`, X64,
    Node v24.18.0; 34 files/197 tests in 3.64 s; job 05:31:27Z–05:35:54Z.
  - linux-arm64-glibc job 87276316371: `ubuntu-24.04-arm`, `ubuntu24-arm64` image
    `20260706.52.2`, ARM64, Node v24.18.0; 34 files/197 tests in 3.67 s; job
    05:31:30Z–05:43:37Z. The digest-pinned builder-image pull took 8m20s; the subsequent two-build
    runtime step passed in 2m33s.
  - darwin-x64 job 87276316387: `macos-15-intel`, `macos15` image `20260629.0276.1`, X64,
    Node v24.18.0; 34 files/197 tests in 17.99 s; job 05:31:28Z–05:37:13Z.
  - darwin-arm64 job 87276316336: `macos-15`, `macos15` image `20260706.0213.1`, ARM64,
    Node v24.18.0; 34 files/197 tests in 5.08 s; job 05:31:27Z–05:34:29Z.
  - win32-x64 job 87276316353: `windows-2022`, `win22` image `20260706.237.1`, X64,
    Node v24.18.0; 35 files/193 passing and 8 skipped tests in 9.35 s; job
    05:31:27Z–05:36:57Z.
  - win32-arm64 job 87276316340: `windows-11-arm`, `win11-arm64` image `20260706.102.1`,
    ARM64, Node v24.18.0; 35 files/193 passing and 8 skipped tests in 10.03 s; job
    05:31:27Z–05:39:57Z.
- Commands: the workflow syntax-checks both modules and tests, then includes
  `ssh-relay-runtime-aggregate-input.test.mjs` and
  `ssh-relay-runtime-draft-readback.test.mjs` in `Run runtime artifact contract tests`. Evidence
  inspection used `gh run view 29391666358 --repo stablyai/orca --log`, purpose-named `rg` filters,
  and `gh run view 29391666358 --repo stablyai/orca --job <job-id> --log`.
- Result: PASS on all six target-native build jobs. Draft read-back passes 10 tests on each runner;
  aggregate input passes 7 on each POSIX runner and 6 with the one POSIX-symlink fixture skipped on
  each Windows runner. Purpose-suite timings were draft/aggregate: linux x64 66/36 ms, Linux arm64
  52/37 ms, macOS x64 258/54 ms, macOS arm64 46/22 ms, Windows x64 70/62 ms, and Windows arm64
  86/49 ms. Shared implementation still rejects non-regular entries on Windows.
- Concurrent regression: both Linux oldest-userland jobs 87277915889 and 87277915838 pass. Windows
  x64 oldest-floor job 87277415457 passes. Overall artifact run conclusion is the expected `failure`
  only because Windows arm64 oldest-floor job 87277415503 observes build 26200 instead of the exact
  required build 26100; before that gate, archive/tree/Node/PTY/watcher smoke settles in 8,032.7284
  ms with 49,922,048-byte RSS. PR Checks run
  [29391666360](https://github.com/stablyai/orca/actions/runs/29391666360) job 87276316191 passes the
  complete verify/package/CLI-smoke job from 05:31:28Z to 05:46:00Z. Golden E2E run
  [29391666362](https://github.com/stablyai/orca/actions/runs/29391666362) passes Linux job
  87276316058 and macOS job 87276316073.
- Oracle proved: exact immutable archive declarations are bound to stable runner-local bytes on all
  six native families; draft metadata, authenticated redirect handling, exact HTTP 200, bounded
  streaming, cancellation, size, and SHA-256 policies execute consistently under Node 24. The
  workflow remains read-only and cannot publish, access a signing environment, or connect a desktop
  consumer.
- Does not prove: real GitHub API/CDN behavior, a real/full-size draft asset, canonical manifest
  generation, Ed25519 signing, native signing/trust, upload/recovery execution, desktop
  prerequisites/embedding, SSH transfer/install, fallback, performance, or an enabled tuple.
- Follow-up: implement credential-free canonical unsigned-manifest assembly plus bounded signing
  request and returned-signature verification. Do not connect production credentials, publication,
  desktop consumers, or tuple enablement.

### E-M4-WINDOWS-MANIFEST-PARITY-LOCAL-RED-001 — Windows artifact/manifest identity mismatch

- Date: 2026-07-15
- Owner: Codex implementation owner
- Source: exact base `90da7e14b` plus uncommitted purpose-named tests; draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741).
- Runner/network: local macOS 26.2 build 25C56 arm64, Node v26.0.0 and pnpm 10.24.0; no network,
  runner, signing, release, SSH, publication, desktop consumer, or production call.
- Commands:

  ```sh
  pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-runtime-compatibility.test.mjs
  pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    src/main/ssh/ssh-relay-artifact-schema.test.ts
  ```

- Result: expected RED. The compatibility suite fails 2/2 tests in 144 ms: both Windows tuple
  contracts return `kind: "win32"` rather than manifest-compatible `kind: "windows"`, and the actual
  canonical content ID `sha256:704e9381bc99c97dfbdc4cfc902101879ab6990aa202114120855a5eb02aa6f5`
  disagrees with the fixed `windows` vector
  `sha256:b3eb5c89f079ed735cb83cf2595102fe010b8dd78d3096ddf592109b2ac222b0`.
  After correcting only that discriminator locally, the schema suite's new Windows fixture fails
  1/30 tests in 196 ms because the desktop consistency verifier expects root `node.exe`; every
  target-native Windows artifact and the detailed plan use `bin/node.exe`.
- Oracle proved: the artifact builder's Windows identities could not be consumed by the reviewed
  signed-manifest schema even though both sides were individually tested. The failure was caught
  before canonical assembly, publication, desktop embedding, or tuple enablement.
- Does not prove: the correction, target-native regeneration, archive equality after the intentional
  content-ID change, native signing/trust, manifest assembly/signing, SSH behavior, or an enabled
  tuple.
- Correction: use `windows` only as the compatibility-union discriminator while retaining `win32`
  as the tuple OS, and make the desktop verifier accept the already-reviewed `bin/node.exe` archive
  layout. Add both contracts to every native artifact job.

### E-M4-WINDOWS-MANIFEST-PARITY-LOCAL-001 — Windows artifact and manifest identities align locally

- Date: 2026-07-15
- Owner: Codex implementation owner
- Source: implementation commit `707a9da23e3955bed6ed00ad3afc24b5ab808243`, based on exact prior
  head `90da7e14b`; draft PR [#8741](https://github.com/stablyai/orca/pull/8741).
- Runner/network: local macOS 26.2 build 25C56 arm64, Node v26.0.0 and pnpm 10.24.0; no network,
  native runner, signing, release, SSH, publication, desktop consumer, or production call. The
  repository emits its expected Node-24 engine warning.
- Commands:

  ```sh
  node --check config/scripts/ssh-relay-runtime-compatibility.mjs
  node --check config/scripts/ssh-relay-runtime-compatibility.test.mjs
  /usr/bin/time -l pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-runtime-compatibility.test.mjs \
    config/scripts/ssh-relay-runtime-workflow.test.mjs \
    src/main/ssh/ssh-relay-artifact-schema.test.ts
  pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-runtime-compatibility.test.mjs \
    config/scripts/ssh-relay-runtime-zip.test.mjs \
    config/scripts/ssh-relay-runtime-artifact.test.mjs \
    config/scripts/ssh-relay-runtime-native-signing-apply.test.mjs \
    config/scripts/ssh-relay-runtime-windows-signature-verification.test.mjs \
    config/scripts/ssh-relay-runtime-windows-source-signature-verification.test.mjs \
    src/main/ssh/ssh-relay-artifact-schema.test.ts \
    src/main/ssh/ssh-relay-runtime-identity.test.ts
  pnpm exec vitest run --config config/vitest.config.ts --maxWorkers=1 \
    config/scripts/ssh-relay-*.test.mjs
  pnpm run typecheck
  pnpm run lint
  pnpm run check:max-lines-ratchet
  pnpm exec oxfmt --check <nine touched implementation/workflow/checklist files>
  git diff --check
  ```

- Result: PASS. Both syntax checks pass. The compatibility/schema/workflow focus passes 3 files/38
  tests in 1.59 s; `/usr/bin/time -l` records 3.41 seconds wall time, 133,152,768-byte maximum RSS,
  zero swaps, and 96,572,816-byte peak memory footprint. The eight affected contract files pass 62
  tests in 5.46 s. The complete SSH-relay suite passes 36 files/203 tests in 14.88 s. Typecheck, full
  lint/reliability/localization/bundled-skill gates, max-lines (355 grandfathered suppressions and no
  new bypass), focused formatting, and `git diff --check` pass; lint emits only existing unrelated
  warnings.
- Oracle proved: both target-native Windows tuple definitions now use the manifest schema's
  `windows` compatibility discriminator while preserving `win32` tuple IDs/OS values. The MJS
  canonical identity matches the fixed Windows vector, the TypeScript schema accepts the exact
  `bin/node.exe` archive layout, and both POSIX and Windows workflow families syntax-check and run
  the parity suite. The intentional content-ID/archive-name change occurs before publication or
  enablement.
- Does not prove: target-native Windows rebuild/reproducibility with the new content IDs, macOS/Linux
  non-regression on native runners, native signing/trust, canonical manifest assembly/signing,
  publication, desktop embedding, SSH transfer/install, fallback, performance, or an enabled tuple.
- Follow-up: run the parity suite and regenerate all six native artifacts at the exact implementation
  head. If green, record the new Windows content IDs and resume credential-free canonical manifest
  assembly/signature handoff.

## Accepted Gaps

No product gap is accepted merely because it appears in this list. Each entry requires explicit
owner and promotion condition.

| Gap                                        | Current behavior                                                        | Risk                                           | Owner                                                   | Promotion/removal condition                                                   | Status       |
| ------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------ |
| Bundled runtime only partially implemented | Six unpublished native artifact proofs; no production consumer          | #8450/#1693 environment failures remain        | Codex implementation owner                              | Complete Work Packages 2–7 plus Milestones 3–14                               | Open         |
| No bundled tuple enabled                   | Every target's default and effective mode remains legacy                | No bundled support claim can be made           | Codex implementation owner                              | Complete target-native build/trust and both required live-evidence layers     | Open         |
| Windows runtime smoke incomplete           | Native x64/arm64 smoke settles and uploads exact evidence               | Historical blocker is closed                   | Codex implementation owner                              | Met by E-M3-WINDOWS-CI-001                                                    | CLOSED       |
| Native clean-rebuild identity unproved     | All six native cells pass exact clean-build equality                    | Historical blocker is closed                   | Codex implementation owner                              | Met by E-M3-REPRODUCIBILITY-CI-001                                            | CLOSED       |
| Cross-family Layer B remotes unavailable   | GitHub native runner labels exist; no approved reachable target pool    | Client/remote integration gaps may escape      | Repository release administrator + implementation owner | Approve provider/snapshots/credentials/egress/teardown/cost owner             | BLOCKED      |
| Musl has no accepted official Node binary  | Musl is deliberately legacy-only                                        | Unofficial binary would break provenance trust | Codex implementation owner                              | Orca-owned target-native source build, signing, provenance, and live gates    | ACCEPTED GAP |
| Native arm64 live matrices incomplete      | Hosted Linux/Windows arm64 labels exist; full SSH/runtime cells do not  | Cross-build or unit tests may hide native bugs | Codex implementation owner                              | Full native archive, trust, SFTP/system-SSH, RPC, and baseline evidence       | Open         |
| Legacy performance baseline unmeasured     | Numeric budgets exist; paired cold/warm measurements do not             | Regression thresholds lack a measured baseline | Codex implementation owner                              | Purpose-built paired harness with ten samples on pinned runner classes        | Open         |
| Manifest signing environment unprovisioned | Ed25519/key-rotation policy exists; no protected runtime signing secret | Runtime assets cannot be safely published      | Repository release administrator                        | Protected environment, reviewers, two test keys, rehearsals, and access audit | BLOCKED      |
| Bootstrap primitives lack full live proof  | POSIX/Windows contracts exist; bounded SSH implementations do not       | Hidden dependency or transfer corruption       | Codex implementation owner                              | Purpose-named full-size SFTP/POSIX/Windows system-SSH live suites             | Open         |

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

Commit and run the disconnected aggregate-input and authenticated draft read-back verifiers on all
six native jobs at the exact implementation head. If green, record exact job evidence and implement
the next credential-free canonical-manifest assembly/signature-handoff slice without release
publication, production signing credentials, or a desktop consumer. In parallel, provision
qualifying exact-floor execution for Linux kernel 4.18, macOS 13.5, and Windows arm64 build 26100 and
real macOS/Windows signing and trust. Keep every tuple disabled until the applicable baseline and
trust cells pass.

Cross-family Layer B targets, the protected manifest-signing environment, oldest-baseline/native-
trust cells, and the paired legacy performance baseline remain release/default-path blockers. No
publication, desktop resolver, SSH transfer/install, per-target Beta, fallback, tuple enablement, or
default behavior may be connected by this package.
