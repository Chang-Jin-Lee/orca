# SSH Relay Runtime Distribution — Short Implementation Checklist

Last updated: 2026-07-15

Use this file to track the project. The
[detailed evidence ledger](./2026-07-14-ssh-relay-github-release-implementation-checklist.md)
keeps commands, hashes, runner identities, timings, and failure details.

A checked box means the work has evidence in the detailed ledger. Design approval alone does not
complete a box.

Active checkpoint: **Milestone 5 / Work Package 4 desktop cache boundary — disconnected
cross-process content-lock all-six native gate, 2026-07-15, Codex implementation owner.** Exact-head run
[29449869519](https://github.com/stablyai/orca/actions/runs/29449869519) closes deterministic bounded
`.tar.br` under `E-M5-PORTABLE-ARCHIVE-CI-001`: all six primary Node 24 jobs and both Linux
oldest-userland supplements pass. PR Checks and Golden E2E are green; Windows x64 floor passes and
Windows arm64 passes smoke before the retained hosted build-26200 versus required-26100 rejection.
The isolated desktop extractor is locally green under `E-M5-ARTIFACT-EXTRACTION-LOCAL-001` and
`E-M5-ARTIFACT-EXTRACTION-BROAD-LOCAL-001`: 17 focused tests cover both archive families, hostile
inputs, exact tree/modes, mutation, cancellation, cleanup, and ownership; broad relay/release/static
gates pass. An exact downloaded 122,027,869-byte Darwin arm64 tree extracts in 878.73ms with
49,283,072-byte incremental RSS under `E-M5-ARTIFACT-EXTRACTION-FULL-SIZE-LOCAL-001`. Both native job
families now require synthetic cross-family and post-build full-size gates under
`E-M5-ARTIFACT-EXTRACTION-CI-WIRING-LOCAL-001`. Exact-head Darwin arm64 then supplied the required
native RED: Darwin arm64 uses 71,368,704 bytes and Linux x64 uses 68,505,600 bytes, disproving the
pre-implementation 64 MiB assumption and blocking upload under
`E-M5-ARTIFACT-EXTRACTION-CI-MEMORY-RED-001`. Evidence decision
`E-M5-ARTIFACT-EXTRACTION-BUDGET-CORRECTION-001` selects 80 MiB for cold desktop extraction only;
remote remains 32 MiB and no buffer exceeds 1 MiB. The strict bounded replacement is locally green
under `E-M5-ARTIFACT-EXTRACTION-TAR-MEMORY-LOCAL-001`: 21 focused tests and five exact payload runs
use at most 69,402,624 bytes. Replacement exact-head run
[29455294208](https://github.com/stablyai/orca/actions/runs/29455294208) closes all six native
extraction/full-tree cells under `E-M5-ARTIFACT-EXTRACTION-CI-001`: 33,517,568–45,989,888-byte
incremental RSS and 1,294.77–5,757.55ms. Both Linux oldest-userland supplements and Windows x64
floor pass; Windows arm64 runtime/extraction passes before the retained hosted build-26200 versus
required-26100 floor rejection. Exact-head PR Checks
[29455294230](https://github.com/stablyai/orca/actions/runs/29455294230) and Golden E2E
[29455294207](https://github.com/stablyai/orca/actions/runs/29455294207) are green. The cache audit
splits lock, immutable publication/quarantine, and in-use eviction into separate gates under
`E-M5-ARTIFACT-CACHE-AUDIT-001`. The absent-module RED is
`E-M5-ARTIFACT-CACHE-LOCK-LOCAL-RED-001`; the disconnected implementation and ten focused contracts
are locally green under `E-M5-ARTIFACT-CACHE-LOCK-LOCAL-001`, including a real second process,
heartbeat, cancellation, stale-dead reclaim, and live/ambiguous/displaced-owner safety. Artifact,
relay, release, typecheck, full lint, max-lines, and workflow gates pass. Both native job families
require the suite under `E-M5-ARTIFACT-CACHE-LOCK-CI-WIRING-LOCAL-001`. Exact-head Windows x64 then
found the open-heartbeat-handle directory-rename incompatibility under
`E-M5-ARTIFACT-CACHE-LOCK-CI-WINDOWS-RED-001`; Windows arm64 also found equivalent zlib truncation
wording outside the extraction test oracle under `E-M5-ARTIFACT-EXTRACTION-CI-WINDOWS-ARM64-RED-001`.
The ownership-preserving release order and equivalent-error assertion are locally green under
`E-M5-WINDOWS-NATIVE-GATE-CORRECTIONS-LOCAL-001`; a fresh all-six Node 24 run is now required. Desktop consumers, cache publication/quarantine/eviction, SSH transfer/install,
mode wiring, tuple enablement, publication, production keys/environment/seed, and merge to `main`
remain disconnected.

## Safety status

- [x] Existing SSH relay installation remains the default for every target.
- [x] The future bundled runtime is a per-target Beta option, off by default.
- [x] Missing, old, imported, unknown, or malformed settings select legacy behavior.
- [x] No bundled tuple is enabled and no runtime artifact is published.
- [x] Integrity, security, and corruption failures are designed to fail closed, not fall back.
- [x] Legacy removal or a default-on change requires a separate reviewed decision.

## Current gates

- [ ] **WP2 external gate — Prove oldest supported baselines and native trust.**
  - Proven: all-six target-native build/equality/smoke/metadata gates and direct payload audit.
  - Proven: exact-head run
    [29379227209](https://github.com/stablyai/orca/actions/runs/29379227209) builds both Linux tuples in
    digest-pinned Rocky 8 on native runners; both downloaded artifacts pass glibc 2.28/libstdc++
    6.0.25 execution, bundled Node, PTY, and watcher smoke.
  - Windows x64 passes its declared oldest-floor job. The hosted arm64 runner is build 26200, not the
    required build 26100, so its otherwise successful artifact/runtime smoke does not close that cell.
  - Proven: native-signing plan commit `9bdae7f5b` and CI correction `9c0357235` pass locally and on
    all six native jobs in exact-head run
    [29381495240](https://github.com/stablyai/orca/actions/runs/29381495240).
  - Proven locally and in exact-head run
    [29382772805](https://github.com/stablyai/orca/actions/runs/29382772805): credential-free exact
    signing selection, exclusive staging, returned-tree verification, and POSIX/Windows CI wiring.
  - Proven locally and in exact-head run
    [29384042509](https://github.com/stablyai/orca/actions/runs/29384042509): target-native pre-sign
    assessment and real first-build candidate staging without credentials.
  - Proven locally and in exact-head run
    [29385274738](https://github.com/stablyai/orca/actions/runs/29385274738): exact returned-file
    application into a fresh full runtime and final post-sign content identity contracts.
  - Proven locally and in exact-head run
    [29386372366](https://github.com/stablyai/orca/actions/runs/29386372366): final-tree-first,
    bounded strict-codesign and exact Node/Orca Developer ID policy contracts run under Node 24 on
    all six native jobs. This is contract proof, not proof of real Orca signatures or native trust.
  - Proven locally and in exact-head run
    [29387668264](https://github.com/stablyai/orca/actions/runs/29387668264): credential-free Windows
    final-tree-first Authenticode policy contracts execute under Node 24 on all six native jobs.
    This is contract proof, not proof of real SignPath returns or native trust.
  - Proven locally and on native x64/arm64 Windows jobs in exact-head run
    [29388734922](https://github.com/stablyai/orca/actions/runs/29388734922): official Node and both
    preserved Microsoft ConPTY files report `Valid`; downloaded reports match the exact identity,
    hashes, subjects, thumbprints, and signing-stage selection
    (`E-M3-WINDOWS-SOURCE-SIGNATURE-CI-001`). PR Checks
    [29388734935](https://github.com/stablyai/orca/actions/runs/29388734935) and Golden E2E
    [29388734914](https://github.com/stablyai/orca/actions/runs/29388734914) are green at `be32653a7`.
    The artifact workflow remains red only for the declared Windows arm64 floor mismatch (hosted
    build 26200 versus required 26100). Real SignPath returns and missing oldest-floor snapshots
    remain separately gated.
  - Next external proof: kernel 4.18, macOS 13.5, Windows arm64 build 26100, and native signing/trust.
  - No tuple is enabled; every SSH transfer/runtime and rollout cell remains open.
- [ ] **WP3 active implementation — disconnected native signing workflow locally proven.**
      Windows compatibility-kind parity is closed locally and on all six target-native jobs in
      exact-head run
      [29393022768](https://github.com/stablyai/orca/actions/runs/29393022768) under
      `E-M4-WINDOWS-MANIFEST-PARITY-LOCAL-001` and `E-M4-WINDOWS-MANIFEST-PARITY-CI-001`.
      Disconnected canonical assembly and signing-handoff modules are closed locally and on all six
      Node 24 native jobs in exact-head run
      [29395319239](https://github.com/stablyai/orca/actions/runs/29395319239) under
      `E-M4-MANIFEST-HANDOFF-CI-001`. The disconnected credential-free aggregate boundary is closed
      locally and on all six Node 24 native jobs in exact-head run
      [29397871159](https://github.com/stablyai/orca/actions/runs/29397871159) under
      `E-M4-MANIFEST-AGGREGATE-LOCAL-001`, `E-M4-MANIFEST-AGGREGATE-LOCAL-002`, and
      `E-M4-MANIFEST-AGGREGATE-CI-001`. Next, produce the exact post-sign tuple descriptor only from
      a fully verified returned runtime tree and bind it to the archive, SBOM, provenance, native
      assessment, and content identity under credential-free fail-closed tests. No production
      workflow, publication, desktop consumer, signing credential, or tuple is connected. The
      purpose-named missing-module RED is recorded under
      `E-M4-MANIFEST-TUPLE-LOCAL-RED-001`. The first implementation run exposed that both manifest
      validators incorrectly require one node-pty native file for Windows even though the proven
      closure contains `conpty.node` and `conpty_console_list.node`; correct and parity-test the exact
      per-platform role counts first (`E-M4-MANIFEST-TUPLE-SCHEMA-RED-001`). The correction,
      credential-free producer, 228-test release suite, 48-test desktop parity suite, and static gates
      are locally green under `E-M4-MANIFEST-TUPLE-LOCAL-001` and
      `E-M4-MANIFEST-TUPLE-LOCAL-002`. Exact-head run
      [29405619251](https://github.com/stablyai/orca/actions/runs/29405619251) passes the new seven-test
      tuple suite and full runtime construction on all six Node 24 native jobs under
      `E-M4-MANIFEST-TUPLE-CI-001`; PR Checks
      [29405619196](https://github.com/stablyai/orca/actions/runs/29405619196) and Golden E2E
      [29405619242](https://github.com/stablyai/orca/actions/runs/29405619242) are green. The artifact
      run is red only for the declared Windows arm64 floor mismatch (hosted build 26200 versus
      required 26100). Next, regenerate and semantically verify post-sign SBOM/provenance from the
      verified final tree. That implementation is locally green, but exact-head run
      [29408355188](https://github.com/stablyai/orca/actions/runs/29408355188) exposed a Windows x64
      test-fixture portability defect: the hardcoded Linux tar fixture cannot obtain its declared
      executable mode from a Windows filesystem, so strict archive inspection correctly rejects
      `bin/node` (`E-M4-POST-SIGN-METADATA-CI-RED-001`). The platform-native fixture correction is
      locally green across the 22-test focused suite, 233-test release suite, 48-test desktop parity
      suite, typecheck, and full lint without weakening production mode validation
      (`E-M4-POST-SIGN-METADATA-CORRECTION-LOCAL-001`). Replacement all-six exact-head evidence is
      complete in run
      [29409257513](https://github.com/stablyai/orca/actions/runs/29409257513): all six native build
      jobs pass the corrected four-test metadata suite and full artifact construction under
      `E-M4-POST-SIGN-METADATA-CI-001`. PR Checks
      [29409257568](https://github.com/stablyai/orca/actions/runs/29409257568) and Golden E2E
      [29409257636](https://github.com/stablyai/orca/actions/runs/29409257636) are green. The artifact
      run is red only for the separately declared Windows arm64 floor mismatch. The reusable native
      build prerequisite is closed locally and on all six build jobs under
      `E-M4-BUILD-PREREQUISITE-CI-001`. The next disconnected package reconstructs authenticated
      unsigned archives, signs only the exact native payload, applies returned bytes into an
      exclusive full tree, verifies native policy before PTY/watcher smoke, and regenerates the final
      archive, SBOM, provenance, and tuple descriptor. Its purpose-named RED and locally green
      implementation are recorded under `E-M4-NATIVE-SIGNING-WORKFLOW-LOCAL-RED-001` and
      `E-M4-NATIVE-SIGNING-WORKFLOW-LOCAL-001`. Exact-head native schema/contract execution is closed
      under `E-M4-NATIVE-SIGNING-WORKFLOW-CI-001`; real Apple/SignPath returned-byte/native-trust
      rehearsals remain open. Release-cut, publication, desktop consumers, and every tuple remain
      disconnected. Merging to `main` remains prohibited.

## Work packages, in required order

### WP0 — Existing Node/npm resolver correction

- [x] Implement and unit-test coherent remote Node/npm selection.
- [x] Prove live Linux arm64 SSH/PTY behavior.
- [x] Keep the fix independently reviewable from runtime distribution.
- [ ] Merge draft PR [#8724](https://github.com/stablyai/orca/pull/8724).

### WP1 — Contracts only

- [x] Define immutable signed manifests, content identity, exact asset URLs, and conservative tuple
      selection.
- [x] Add hostile manifest, schema, signature, and path tests.
- [ ] Finish archive-safety implementation and hostile archive tests.
- [ ] Update mode-qualified remote directory parsing and GC compatibility.
- [ ] Merge draft PR [#8728](https://github.com/stablyai/orca/pull/8728).

### WP2 — Target-native runtime artifacts

- [x] Pin and verify Node v24.18.0 inputs and signatures.
- [x] Build and smoke-test Node, patched `node-pty`, and `@parcel/watcher` on GitHub runners for
      Linux, macOS, and Windows on x64 and arm64.
- [x] Prove exact clean-build equality and exact runtime-tree closure on all six runner families.
- [x] Replace unpublished POSIX `.tar.xz` outputs with deterministic bounded `.tar.br` and rerun
      exact clean-build/archive/execution proof on all six native jobs
      (`E-M5-ARCHIVE-PORTABILITY-AUDIT-001` selects the correction;
      `E-M5-PORTABLE-ARCHIVE-LOCAL-RED-001` proves the old boundary fails;
      `E-M5-PORTABLE-ARCHIVE-LOCAL-001`, `E-M5-PORTABLE-ARCHIVE-PARENT-LOCAL-001`, and
      `E-M5-PORTABLE-ARCHIVE-CI-001`).
- [x] Complete the all-six SBOM, license, provenance, toolchain, and prohibited-content audit.
- [x] Rebuild both Linux artifacts in the digest-pinned glibc 2.28/libstdc++ 6.0.25 userland on
      native x64/arm64 runners; smoke and compare them there. (`E-M3-LINUX-NATIVE-USERLAND-CI-001`)
- [ ] Prove each candidate on its oldest supported OS/libc/kernel baseline.
- [ ] Sign macOS and Windows bytes and verify native trust on the target OS.
- [ ] Merge draft PR [#8741](https://github.com/stablyai/orca/pull/8741).

### WP3 — Release build and signing

- [x] Release/signing DAG contracts pass locally and on all six native build jobs under
      `E-M4-RELEASE-DAG-LOCAL-001` and `E-M4-RELEASE-DAG-CI-001`.
- [x] Aggregate-input and authenticated draft read-back verification pass locally and on all six
      native build jobs under `E-M4-AGGREGATE-READBACK-LOCAL-001` and
      `E-M4-AGGREGATE-READBACK-CI-001`.
- [x] Correct the Windows compatibility discriminator and `bin/node.exe` manifest parity; prove both
      regenerated Windows identities and all-six native regressions
      (`E-M4-WINDOWS-MANIFEST-PARITY-LOCAL-001`, `E-M4-WINDOWS-MANIFEST-PARITY-CI-001`).
- [x] Add disconnected canonical unsigned
      manifest assembly, a bounded signing request, and returned-signature verification. Keep final
      detached-signature asset encoding, production credentials, publication, desktop consumers, and
      every tuple outside this slice until their contracts and gates are explicit. Purpose-named RED
      and GREEN suites plus broad local regressions are recorded under
      `E-M4-MANIFEST-HANDOFF-LOCAL-RED-001`, `E-M4-MANIFEST-HANDOFF-LOCAL-001`, and
      `E-M4-MANIFEST-HANDOFF-LOCAL-002`; all-six Node 24 proof is recorded under
      `E-M4-MANIFEST-HANDOFF-CI-001`.
- [x] Add the disconnected, credential-free
      fail-closed aggregate boundary from exact verified runtime inputs through canonical request and
      verified final-manifest bytes. Keep native/manifest credentials, publication, desktop
      consumers, and every tuple outside this slice
      (`E-M4-MANIFEST-AGGREGATE-LOCAL-001`, `E-M4-MANIFEST-AGGREGATE-LOCAL-002`,
      `E-M4-MANIFEST-AGGREGATE-CI-001`).
- [x] Add the credential-free post-sign
      tuple-descriptor producer and native-verification handoff needed to supply the aggregate.
      Derive it only from a fully verified returned runtime tree; keep real signing, publication,
      desktop consumers, and every tuple outside this slice. The missing-module RED is recorded under
      `E-M4-MANIFEST-TUPLE-LOCAL-RED-001`. Before GREEN, correct release/desktop tuple-role
      cardinality for the real Windows closure under `E-M4-MANIFEST-TUPLE-SCHEMA-RED-001`. Code and
      local proof are complete under `E-M4-MANIFEST-TUPLE-LOCAL-001` and
      `E-M4-MANIFEST-TUPLE-LOCAL-002`; all-six exact-head Node 24 proof is recorded under
      `E-M4-MANIFEST-TUPLE-CI-001`.
- [x] Regenerate SBOM and provenance from
      the verified post-sign runtime tree and semantically bind both outputs to the final content
      identity before tuple assembly. Keep credentials, publication, desktop consumers, and every
      tuple disconnected. The purpose-named missing-module RED is recorded under
      `E-M4-POST-SIGN-METADATA-LOCAL-RED-001`. The implementation, semantic tuple-consumer gate,
      233-test release suite, 48-test desktop parity suite, and static gates are locally green under
      `E-M4-POST-SIGN-METADATA-LOCAL-001` and `E-M4-POST-SIGN-METADATA-LOCAL-002`; exact-head Node 24
      execution on all six native jobs is required before this item closes. Windows x64 job
      [87329210635](https://github.com/stablyai/orca/actions/runs/29408355188/job/87329210635)
      is the required CI RED: its filesystem cannot create the hardcoded Linux tar fixture's
      executable mode, and strict archive inspection rejects `bin/node`
      (`E-M4-POST-SIGN-METADATA-CI-RED-001`). The test-fixture-only correction now selects the exact
      native tuple/archive family on each runner and is locally green under
      `E-M4-POST-SIGN-METADATA-CORRECTION-LOCAL-001`; production type/mode validation is unchanged.
      Exact-head execution passes on all six native jobs under
      `E-M4-POST-SIGN-METADATA-CI-001`.
- [x] Add a reusable target-native runtime
      build prerequisite contract. Keep it disconnected from release-cut and every desktop build
      until exact floors, native signing/trust, aggregate, and publication gates are complete; no
      tuple is enabled by this slice. The purpose-named RED proves `workflow_call` was absent; the
      credential-free interface and both native test-family integrations are locally green while
      both release workflows remain disconnected (`E-M4-BUILD-PREREQUISITE-LOCAL-RED-001`,
      `E-M4-BUILD-PREREQUISITE-LOCAL-001`, `E-M4-BUILD-PREREQUISITE-CI-001`).
- [ ] **In progress — 2026-07-15, Codex implementation owner:** add platform-native signing jobs;
      hash only the returned signed bytes. Begin with a purpose-named disconnected workflow RED;
      no test double counts as real signing/native-trust evidence. The workflow, authenticated
      reconstruction, bounded signing boundary, transactional finalization, and credential-free
      regression gates are locally green (`E-M4-NATIVE-SIGNING-WORKFLOW-LOCAL-RED-001`,
      `E-M4-NATIVE-SIGNING-WORKFLOW-LOCAL-001`). Exact-head native contract proof is complete; real
      protected Apple/SignPath/native-trust evidence remains required before this item can close. First
      exact-head run
      [29415080004](https://github.com/stablyai/orca/actions/runs/29415080004) is the required Windows
      CI RED: both Windows contract jobs reject two hardcoded Darwin tar fixtures because NTFS cannot
      materialize their declared executable modes, while all four POSIX native build jobs pass and
      strict production mode validation remains unchanged (`E-M4-NATIVE-SIGNING-WORKFLOW-CI-RED-001`).
      The test-only native ZIP fixture correction at `85c70c5e9` and full 241-test release suite pass
      locally. Replacement exact-head run
      [29415642475](https://github.com/stablyai/orca/actions/runs/29415642475) at `70b3892ae` is
      complete: all six target-native jobs pass the corrected contracts and full runtime build,
      smoke, equality, and upload under `E-M4-NATIVE-SIGNING-WORKFLOW-CI-001`. Both Linux userland
      supplements and Windows x64 baseline pass. The run remains red only for the separately
      declared Windows arm64 floor mismatch (hosted build 26200 versus required 26100). Golden E2E
      and PR Checks are green at the exact head. The manual credentialed rehearsal starts with the
      missing-caller RED `E-M4-NATIVE-SIGNING-REHEARSAL-LOCAL-RED-001` and is locally green under
      `E-M4-NATIVE-SIGNING-REHEARSAL-LOCAL-001`. GitHub cannot dispatch a new workflow before it
      exists on the default branch; the exact confirmation-bound refusal is recorded under
      `E-M4-NATIVE-SIGNING-REHEARSAL-DISPATCH-BLOCKED-001`, so real signing/native trust remains
      blocked without merging. Exact-head run
      [29417449971](https://github.com/stablyai/orca/actions/runs/29417449971) passes the caller and
      default-preservation contracts plus full builds on all six native jobs under
      `E-M4-NATIVE-SIGNING-REHEARSAL-CI-001`; PR Checks and Golden E2E are green. The artifact run is
      red only for the retained Windows arm64 build-26100 floor mismatch.
- [ ] Add a fail-closed aggregate and immutable manifest-signing job.
      The missing Linux aggregate-ready prerequisite is closed by
      `E-M4-LINUX-FINALIZATION-LOCAL-RED-001`, `E-M4-LINUX-FINALIZATION-LOCAL-001`, and
      `E-M4-LINUX-FINALIZATION-CI-001`: both native Linux architectures emitted inspected,
      hash-bound descriptors/receipts. The active slice is the callable, disconnected aggregate and
      protected Ed25519-signing workflow contract. The environment/seed are not provisioned, so live
      signing remains blocked and no release, desktop, publication, or tuple consumer is connected.
      The missing-workflow/seed-signer RED is
      `E-M4-PROTECTED-MANIFEST-WORKFLOW-LOCAL-RED-001`; the seed signer is locally green under
      `E-M4-PROTECTED-MANIFEST-SEED-LOCAL-001` and all-six exact-head CI is closed by
      `E-M4-PROTECTED-MANIFEST-SEED-CI-001`. The filesystem prepare/finalize command is locally
      green under `E-M4-MANIFEST-AGGREGATE-COMMAND-LOCAL-RED-001` and
      `E-M4-MANIFEST-AGGREGATE-COMMAND-LOCAL-001`, with all-six exact-head CI closed by
      `E-M4-MANIFEST-AGGREGATE-COMMAND-CI-001`. The callable workflow remains open.
      Its disconnected three-job source contract is locally green under
      `E-M4-PROTECTED-MANIFEST-WORKFLOW-LOCAL-001`, and exact-head execution passes on all six native
      jobs under `E-M4-PROTECTED-MANIFEST-WORKFLOW-CI-001`. Live protected signing remains open; no
      accepted production key, environment, or seed is provisioned.
- [x] Add the disconnected relay-specific required-asset capability. It passes locally and on all
      six native jobs under `E-M4-RELEASE-ASSETS-LOCAL-RED-001`,
      `E-M4-RELEASE-ASSETS-LOCAL-001`, and `E-M4-RELEASE-ASSETS-CI-001`. Release/default workflow
      composition remains separately gated.
- [ ] Embed the exact signed manifest and accepted keys in each desktop build.
- [ ] Upload to a draft release, read back, re-hash, and execute the downloaded archives.
      A disconnected bounded upload/recovery implementation is locally green under
      `E-M4-DRAFT-UPLOAD-LOCAL-001` and passes all six native Node 24 jobs under
      `E-M4-DRAFT-UPLOAD-CI-001`; no real release write or downloaded archive execution has occurred,
      so this item remains open. The purpose-named transactional materialization RED is recorded
      under `E-M4-DRAFT-READBACK-MATERIALIZATION-LOCAL-RED-001`; one-pass persistence, exclusive
      temporary/final naming, cancellation/failure cleanup, and exact returned paths pass locally
      under `E-M4-DRAFT-READBACK-MATERIALIZATION-LOCAL-001`. Exact-head all-six Node 24 proof is
      closed under `E-M4-DRAFT-READBACK-MATERIALIZATION-CI-001`; downloaded archive execution and a
      real release write/read-back are still required. The purpose-named missing execution-boundary
      RED is recorded under `E-M4-READBACK-ARCHIVE-EXECUTION-LOCAL-RED-001`. Exact descriptor/path
      binding, exclusive extraction, full-tree verification, bundled Node/native smoke, cleanup,
      and real Darwin arm64 Actions-artifact execution pass locally under
      `E-M4-READBACK-ARCHIVE-EXECUTION-LOCAL-001`. All-six exact-head Node 24 archive execution is
      closed under `E-M4-READBACK-ARCHIVE-EXECUTION-CI-001`; a real authenticated release write/
      read-back remains open.
- [ ] Test timeouts, retries, approval denial, signing failure, partial output, and draft recovery.
      Disconnected upload/materialization/execution ordering, timeout/retry/partial-output stops,
      cancellation, identity drift, ownership-safe cleanup, and later-archive failure pass locally
      under `E-M4-DRAFT-RELEASE-COMPOSITION-LOCAL-001` and on all six native Node 24 jobs under
      `E-M4-DRAFT-RELEASE-COMPOSITION-CI-001`. Protected approval and real signing failure evidence
      remain blocked/open, so this item is not complete.

### WP4 — Desktop resolver and verified cache

- [ ] Select tuples offline from the embedded manifest and resolve immutable direct asset URLs.
      The verified immutable selection and URL boundary is locally green under
      `E-M5-OFFLINE-SELECTION-LOCAL-001`. The first post-push audit found that native jobs omitted
      these source suites; both job families are now locally pinned under
      `E-M5-OFFLINE-SELECTION-CI-WIRING-LOCAL-001`, and exact-head all-six native proof is closed by
      `E-M5-OFFLINE-SELECTION-CI-001`. The actual packaged embedded-manifest loader remains open.
- [ ] Stream bounded downloads; verify signature, size, archive hash, and extracted tree.
      The disconnected Electron downloader is locally green under
      `E-M5-ARTIFACT-DOWNLOAD-LOCAL-RED-001` and `E-M5-ARTIFACT-DOWNLOAD-LOCAL-001`; exact-head
      all-six native CI is closed under `E-M5-ARTIFACT-DOWNLOAD-CI-001`. Disconnected strict
      TAR/Brotli and ZIP extraction plus complete-tree verification are locally green under
      `E-M5-ARTIFACT-EXTRACTION-LOCAL-001`; an exact full-size Actions payload is locally within time
      and memory budgets under `E-M5-ARTIFACT-EXTRACTION-FULL-SIZE-LOCAL-001`; all-six native
      execution is closed under `E-M5-ARTIFACT-EXTRACTION-CI-001`. Packaged signature loading
      remains open.
- [ ] Add exclusive staging, atomic publication, quarantine, locking, and the 2 GiB cache policy.
      Exclusive owned staging and failure/cancellation cleanup are green locally and on all six
      native clients under `E-M5-ARTIFACT-EXTRACTION-LOCAL-001` and
      `E-M5-ARTIFACT-EXTRACTION-CI-001`; publication, quarantine, locking, and eviction are the
      active split packages and are not implemented yet. The lock-only audit/RED is recorded under
      `E-M5-ARTIFACT-CACHE-AUDIT-001` and `E-M5-ARTIFACT-CACHE-LOCK-LOCAL-RED-001`; the implementation
      is locally green and wired to both native families under `E-M5-ARTIFACT-CACHE-LOCK-LOCAL-001`
      and `E-M5-ARTIFACT-CACHE-LOCK-CI-WIRING-LOCAL-001`. All-six execution remains required before
      marking lock coordination complete.
- [ ] Prove verified cached bytes can be transferred while the client is offline.
- [ ] Preserve `ORCA_RELAY_PATH` behind the official-build trust boundary.

### WP5 — SSH transfer and remote install

- [ ] Implement bounded, cancellable SFTP transfer.
- [ ] Implement POSIX system-SSH transfer with optional tar and mandatory no-tar support.
- [ ] Implement bounded binary PowerShell/.NET transfer for Windows system SSH.
- [ ] Transfer verified bytes into exclusive staging and hash the complete staged tree with bundled
      Node before native probes.
- [ ] Prove probe → PTY/watcher smoke → sentinel → atomic publish → launch ordering.
- [ ] Trust warm installs under the immutable-directory rule; quarantine detected mutation.
- [ ] Keep SSH authentication, connection, and relay RPC transport unchanged.

### WP6 — Modes, fallback, diagnostics, and races

- [ ] Implement internal `legacy`, `auto`, and forced diagnostic `bundled` modes.
- [ ] Fall back automatically only for classified availability/compatibility failures.
- [ ] Fail closed for signature, hash, archive/tree, native-trust, bundled-Node, and cache-corruption
      failures.
- [ ] Abort and await bundled work before eligible legacy fallback begins.
- [ ] Separate bundled/legacy identities, locks, staging, sentinels, and generations.
- [ ] Test reconnect, reattach, concurrent clients, cancellation, GC, upgrades, and downgrades.

### WP7 — Per-target Beta and validation

- [ ] Add the per-target mode field with safe migration/default tests.
- [ ] Add the Beta-tagged option to SSH target add/edit UI, off by default.
- [ ] Apply a mode change only on next connection or explicit reconnect.
- [ ] Add actionable fail-closed recovery and privacy-safe Beta telemetry.
- [ ] Run every enabled remote tuple through built-in SFTP and system SSH.
- [ ] Run every supported client OS/architecture against representative POSIX and Windows remotes.
- [ ] Prove no remote GitHub egress, no-tar bootstrap, full-size transfer, slow-link cancellation,
      concurrency, RPC, and failure-injection behavior.
- [ ] Measure cold/warm latency, memory, channels/files, cancellation settlement, and fallback delay
      against legacy.
- [ ] Ship only as per-target, off-by-default Beta; gather real-host evidence before default-on review.
- [ ] Require three qualifying RCs and rollback proof before any default-on proposal.

## External blockers

- [ ] Release administrator chooses and provisions representative SSH remote snapshots, credentials,
      egress rules, teardown SLA, and cost/capacity ownership.
- [ ] Release administrator provisions protected manifest/native-signing environments, reviewers,
      test keys/certificates, and access auditing.
- [ ] After a separately authorized merge, dispatch the reviewed exact-source native-signing
      rehearsal; GitHub cannot dispatch its new workflow file while it exists only in this PR.

While blocked, artifact-only and test work may continue. No tuple may be enabled or published.

## Final go/no-go gates

- [ ] Every enabled tuple has native build, oldest-baseline, native-trust, SFTP, system-SSH, RPC,
      security, and performance evidence.
- [ ] Every desktop build embeds the signed manifest for the exact immutable assets it ships.
- [ ] Beta rollback to the existing legacy mechanism is proven in the same build.
- [ ] All required matrix cells have evidence IDs in the detailed ledger.
- [ ] Default-on receives a separate review after the Beta soak; legacy remains available until a
      separately reviewed removal decision.
