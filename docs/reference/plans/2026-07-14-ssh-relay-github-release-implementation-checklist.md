# SSH Relay GitHub Release Distribution — Living Implementation Checklist

Date created: 2026-07-14<br>
Last updated: 2026-07-14<br>
Current phase: Milestone 3 / Work Package 2 target-native runtime assembly — four POSIX native-runner artifact builds are CI-green; Windows runtime/ZIP, reproducibility, oldest-baseline, native-trust, cross-family remote, and measured-baseline gates remain open; no bundled-runtime path is enabled<br>
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
- Completed package: Work Package 1's disconnected manifest, content-identity, signature,
  release-asset, and conservative selector contracts are locally and CI-green under E-M2-RED-001,
  E-M2-CONTRACT-001, and E-M2-CI-001. They remain isolated in stacked draft PR
  [#8728](https://github.com/stablyai/orca/pull/8728) at implementation commit `b9d80a4cb`; no
  deploy/resolver call site is connected and no tuple is enabled.
- Active package: Work Package 2 target-native runtime assembly, archive inspection, executable
  smoke, SBOM, and provenance only. The Windows x64/arm64 artifact candidate is implemented at exact
  head `922edb6ff28199b394f508731fd18a635bec49a0` in stacked draft PR
  [#8741](https://github.com/stablyai/orca/pull/8741) and awaits exact-head native CI. It may produce
  test artifacts but must not publish, resolve, transfer, install, launch, or enable them.
- Active evidence gate: the immutable Node v24.18.0 contract, pinned release key, bounded verifier,
  and artifact-only CLI are locally green under E-M3-NODE-RED-001 and E-M3-NODE-PROVENANCE-001.
  E-M3-RUNTIME-LOCAL-001 additionally proves one unpublished Linux arm64 glibc assembly, exact-tree
  archive inspection, deterministic repack, bundled Node 24.18.0 execution, real patched PTY, and
  watcher events. E-M3-STATIC-001 records the current focused, type, lint, format, line-budget, and
  diff gates. The first exact-head native run exposed a macOS `/var` versus `/private/var` watcher
  oracle mismatch under E-M3-CI-RED-001. The corrected exact-head run passed target-native build,
  archive/tree verification, bundled Node, patched PTY, and watcher smoke for Linux x64/arm64 and
  macOS x64/arm64 under E-M3-CI-001. Same-runner clean-rebuild identity, oldest-baseline,
  native-trust, SSH, Windows, and musl cells remain open.
- Windows input correction: E-M3-WINDOWS-INPUT-GAP-001 proved the official Windows ZIP lacks headers
  and `node.lib`. Both artifacts now require the exact signed headers archive and tuple import
  library as explicit inputs. The schema, signed-checksum verifier, bounded ZIP/header extraction,
  and import-library staging are locally green under E-M3-WINDOWS-INPUT-001; native Windows build
  proof remains active and no implicit `node-gyp` download is allowed.
- Windows PTY-closure correction: E-M3-WINDOWS-CONPTY-GAP-001 proved the candidate omitted the
  `conpty.dll` and `OpenConsole.exe` files required by Orca's production `useConptyDll: true` path
  and therefore exercised a weaker system-ConPTY smoke. E-M3-WINDOWS-LOCAL-002 proves the corrected
  local tree-closure and smoke configuration contracts; native execution remains open and no
  Windows executable cell is complete.
- First Windows native run: E-M3-WINDOWS-CI-RED-002 failed before download/build on both Windows
  architectures. One failure is a confirmed NTFS fixture-mode assumption; two import-time
  `SyntaxError` failures remain unexplained until the corrected exact-head rerun. No Windows
  executable evidence is claimed from the run.
- Production behavior: unchanged; Orca embeds relay JavaScript and installs `node-pty` plus
  `@parcel/watcher` with remote npm.
- New runtime assets published: none.
- Bundled runtime enabled: no.
- Declared supported bundled tuples: none until the required target-native and two-layer live
  evidence cells are complete.
- Validation orchestration: GitHub Actions is the primary runner and evidence surface under
  E-M1-RUNNER-DECISION-001; exact native labels are recorded, while representative cross-family
  remote targets remain open.
- Rollout control: existing per-SSH-target configuration; legacy is the default and the bundled
  runtime is an explicit per-target Beta opt-in under E-M1-ROLLOUT-DECISION-001.
- Legacy fallback removal: not authorized.
- Next required action: finish the final local audit of the bounded Windows runtime/ZIP builder and
  verifier, correct the Windows-only test failures from E-M3-WINDOWS-CI-RED-002, and collect exact
  Windows x64/arm64 plus POSIX regression evidence from the corrected draft-PR head. A
  same-head/same-runner clean-rebuild identity oracle for native build reproducibility remains a
  separate open gate. Keep cross-family remote infrastructure, signing/trust, and measured legacy
  baseline gates open; do not introduce publication, resolver, transfer, rollout, tuple enablement,
  or default behavior.

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
      Windows PowerShell 5.1, and .NET Framework 4.8 as minimum bootstrap primitives.
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

Each runtime must contain only the executable closure required by the relay.

- [ ] Replace or extend `config/scripts/build-relay.mjs` without weakening its existing relay and
      watcher content-hash guarantees.
- [x] Add a clearly named runtime assembly script, for example
      `config/scripts/build-ssh-relay-runtime.mjs`.
      (E-M3-RUNTIME-LOCAL-001)
- [x] Pin Node and verify downloaded source/binary checksums and upstream signatures.
      (E-M3-NODE-PROVENANCE-001; real archive execution remains a separate per-tuple gate)
- [x] Extend the immutable Node input contract for Windows to include the signed exact-version
      headers archive and tuple-specific `node.lib`; verify/copy them into an exclusive local build
      root and configure `node-gyp` to fail rather than fetch an unstaged input.
      (E-M3-WINDOWS-INPUT-001; successful target-native offline build remains a per-tuple gate)
- [ ] Build Orca’s patched `node-pty@1.1.0` against the exact bundled Node runtime.
- [ ] Assert Orca-required patched exports/diagnostics exist; do not silently use an upstream
      prebuild that omits the patch.
- [ ] For Windows, copy the tuple-architecture `conpty.dll` and `OpenConsole.exe` from the pinned
      node-pty source into `build/Release/conpty`, hash them into the runtime identity as native
      runtime files, and prove PTY spawn/resize/exit with `useConptyDll: true`. Do not substitute a
      system-ConPTY smoke for the production path. (E-M3-WINDOWS-CONPTY-GAP-001)
- [ ] Include exactly one compatible `@parcel/watcher@2.5.6` native optional package.
- [ ] Include relay JavaScript, watcher child, required runtime JavaScript closure, licenses, SBOM,
      provenance, and runtime metadata.
- [ ] Exclude package managers, development dependencies, compilers, sources, caches, build
      directories, and Orca-built debug symbols unless an approved diagnostics requirement needs
      them. Preserve verified official Node executable bytes without stripping or rewriting them,
      even when the upstream binary contains debug metadata.
- [x] Make POSIX `tar.xz` output deterministic for the same tree, epoch, and pinned compression
      toolchain; keep Windows zip determinism as an open per-tuple gate. (E-M3-RUNTIME-LOCAL-001)
- [x] Verify required executable modes before archiving. (E-M3-RUNTIME-LOCAL-001)
- [ ] Sign native code according to the platform decisions in Milestone 1.
- [ ] Verify platform-native signatures/policy on target-native runners after signing and before
      aggregation; attest the exact verified bytes for the signed manifest.
- [x] Run local POSIX archive inspection and target-runtime smoke before any upload; Windows remains
      open until its separate builder/verifier exists. (E-M3-RUNTIME-LOCAL-001)

### Per-tuple build and executable proof

| Runtime tuple     | Build/provenance | Bundled Node | `node-pty` load + real PTY | Watcher events | Oldest baseline | Native trust | Evidence                            |
| ----------------- | ---------------- | ------------ | -------------------------- | -------------- | --------------- | ------------ | ----------------------------------- |
| linux-x64-glibc   | [x]              | [x]          | [x]                        | [x]            | [ ]             | [ ]          | E-M3-CI-001                         |
| linux-arm64-glibc | [x]              | [x]          | [x]                        | [x]            | [ ]             | [ ]          | E-M3-RUNTIME-LOCAL-001; E-M3-CI-001 |
| linux-x64-musl    | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —                                   |
| linux-arm64-musl  | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —                                   |
| darwin-x64        | [x]              | [x]          | [x]                        | [x]            | [ ]             | [ ]          | E-M3-CI-001                         |
| darwin-arm64      | [x]              | [x]          | [x]                        | [x]            | [ ]             | [ ]          | E-M3-CI-001                         |
| win32-x64         | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —                                   |
| win32-arm64       | [ ]              | [ ]          | [ ]                        | [ ]            | [ ]             | [ ]          | —                                   |

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

| Work package              | Scope                                                                                      | Default behavior change     | Status                                                | PR/evidence                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------ | --------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 0. #8450 legacy fix       | Coherent Node/npm selection and live repro                                                 | Fixes legacy selection only | Complete and CI-green in draft PR #8724               | E-M0-UNIT-002, E-M0-LIVE-002, E-M0-STATIC-002, E-M0-PR-001, E-M0-CI-001                                                         |
| 1. Contract and selectors | Manifest schema, identity, platform/libc selection, hostile inputs                         | None                        | Complete and CI-green in draft PR #8728               | `b9d80a4cb`; E-M2-RED-001, E-M2-CONTRACT-001, E-M2-CI-001                                                                       |
| 2. Runtime builds         | Per-tuple assembly, native smoke, SBOM/provenance/signing                                  | None                        | Draft PR #8741; four POSIX jobs green; Windows active | `151628992`; E-M3-NODE-RED-001, E-M3-NODE-PROVENANCE-001, E-M3-RUNTIME-LOCAL-001, E-M3-STATIC-001, E-M3-CI-RED-001, E-M3-CI-001 |
| 3. Release publication    | Prerequisite DAG, embedded manifest, draft upload/read-back gates                          | Asset-only                  | Not started                                           | —                                                                                                                               |
| 4. Desktop resolver/cache | Verified download, extraction, cache, offline behavior                                     | None/forced mode only       | Not started                                           | —                                                                                                                               |
| 5. Transfer/install       | Bounded transports, structured sentinel, bundled launch behind per-target Beta/forced mode | Per-target opt-in only      | Not started                                           | —                                                                                                                               |
| 6. Fallback/diagnostics   | Abort-and-join state machine, mode isolation, reason codes, target-mode configuration/UI   | Per-target Beta only        | Not started                                           | —                                                                                                                               |
| 7. Live gates/rollout     | Matrix, security, performance, release promotion                                           | Per-tuple staged            | Not started                                           | —                                                                                                                               |

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
- [x] `node config/scripts/verify-ssh-relay-node-release-inputs.mjs --inputs-directory <verified-windows-input-directory> --archive win32-x64` (E-M3-WINDOWS-INPUT-001; signed real Node ZIP, headers, and import library; no Windows execution)
- [x] `node config/scripts/build-ssh-relay-runtime.mjs --tuple linux-arm64-glibc --inputs-directory <verified-input-directory> --output-directory <exclusive-output> --source-date-epoch <epoch> --git-commit <full-sha>` (E-M3-RUNTIME-LOCAL-001; local native Linux arm64 only)
- [x] `node config/scripts/verify-ssh-relay-runtime.mjs --runtime-directory <runtime-tree> --identity <identity.json> --archive <runtime.tar.xz>` (E-M3-RUNTIME-LOCAL-001; local native Linux arm64 only)

### Commands/scripts that must be added or formally identified

- [x] Manifest/schema/identity/signature/selector unit-test command. (E-M2-CONTRACT-001)
- [x] Per-tuple POSIX runtime assembly command. (E-M3-RUNTIME-LOCAL-001; Windows command remains open)
- [x] Per-tuple POSIX archive inspection and native smoke command. (E-M3-RUNTIME-LOCAL-001; Windows command remains open)
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
- Follow-up: declare `0o755` in the tar fixture's archive metadata instead of relying on NTFS,
  rerun the same seven suites on both native architectures, and diagnose the two import failures if
  they recur before allowing either job to download inputs.

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

## Accepted Gaps

No product gap is accepted merely because it appears in this list. Each entry requires explicit
owner and promotion condition.

| Gap                                        | Current behavior                                                        | Risk                                           | Owner                                                   | Promotion/removal condition                                                    | Status       |
| ------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------ |
| Bundled runtime only partially implemented | Four unpublished POSIX native artifact proofs; no production consumer   | #8450/#1693 environment failures remain        | Codex implementation owner                              | Complete Work Packages 2–7 plus Milestones 3–14                                | Open         |
| No bundled tuple enabled                   | Every target's default and effective mode remains legacy                | No bundled support claim can be made           | Codex implementation owner                              | Complete target-native build/trust and both required live-evidence layers      | Open         |
| Windows runtime/zip builder absent         | Windows targets remain entirely on the legacy path                      | POSIX proof cannot establish Windows behavior  | Codex implementation owner                              | Bounded deterministic zip, Node/native build, signing, smoke, and live gates   | Open         |
| Native clean-rebuild identity unproved     | One successful artifact per corrected-head hosted runner                | Toolchain drift may change native content IDs  | Codex implementation owner                              | Same-head, same-runner clean builds match or a reviewed reproducibility policy | Open         |
| Cross-family Layer B remotes unavailable   | GitHub native runner labels exist; no approved reachable target pool    | Client/remote integration gaps may escape      | Repository release administrator + implementation owner | Approve provider/snapshots/credentials/egress/teardown/cost owner              | BLOCKED      |
| Musl has no accepted official Node binary  | Musl is deliberately legacy-only                                        | Unofficial binary would break provenance trust | Codex implementation owner                              | Orca-owned target-native source build, signing, provenance, and live gates     | ACCEPTED GAP |
| Native arm64 live matrices incomplete      | Hosted Linux/Windows arm64 labels exist; full SSH/runtime cells do not  | Cross-build or unit tests may hide native bugs | Codex implementation owner                              | Full native archive, trust, SFTP/system-SSH, RPC, and baseline evidence        | Open         |
| Legacy performance baseline unmeasured     | Numeric budgets exist; paired cold/warm measurements do not             | Regression thresholds lack a measured baseline | Codex implementation owner                              | Purpose-built paired harness with ten samples on pinned runner classes         | Open         |
| Manifest signing environment unprovisioned | Ed25519/key-rotation policy exists; no protected runtime signing secret | Runtime assets cannot be safely published      | Repository release administrator                        | Protected environment, reviewers, two test keys, rehearsals, and access audit  | BLOCKED      |
| Bootstrap primitives lack full live proof  | POSIX/Windows contracts exist; bounded SSH implementations do not       | Hidden dependency or transfer corruption       | Codex implementation owner                              | Purpose-named full-size SFTP/POSIX/Windows system-SSH live suites              | Open         |

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

Implement bounded deterministic Windows ZIP/native assembly as its own evidence-gated slice, add
native Windows x64/arm64 jobs without publishing assets, and add a same-head/same-runner clean-build
identity comparison for native reproducibility. The cross-family Layer B target pool, protected
manifest-signing environment, and paired legacy performance baseline remain release/default-path
blockers; no publication, desktop resolver, SSH transfer/install, per-target Beta, fallback, tuple
enablement, or default behavior may be connected by this package.
