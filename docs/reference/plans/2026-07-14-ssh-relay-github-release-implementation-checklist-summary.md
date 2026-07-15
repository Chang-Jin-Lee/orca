# SSH Relay Runtime Distribution — Short Implementation Checklist

Last updated: 2026-07-15

Use this file to track the project. The
[detailed evidence ledger](./2026-07-14-ssh-relay-github-release-implementation-checklist.md)
keeps commands, hashes, runner identities, timings, and failure details.

A checked box means the work has evidence in the detailed ledger. Design approval alone does not
complete a box.

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
- [ ] **WP3 active implementation — Correct Windows compatibility-kind parity before canonical
      manifest assembly.** Native build identities currently emit `kind: "win32"`, but the reviewed
      manifest schema requires `kind: "windows"`. Add a narrow RED/GREEN contract correction before
      the signing-handoff slice. Local RED/GREEN, full SSH-relay, type, lint, line-budget, and
      workflow-wiring gates pass; exact-head native CI is next. No production workflow, publication,
      desktop consumer, signing credential, or tuple is connected.

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
- [ ] **In progress — 2026-07-15, Codex implementation owner:** correct the Windows runtime
      compatibility discriminator from `win32` to the manifest-contract `windows`, prove both Windows
      tuples and full regressions, then resume disconnected canonical manifest/signing handoff. Local
      proof passes at `707a9da23` under `E-M4-WINDOWS-MANIFEST-PARITY-LOCAL-001`; exact-head native CI
      is next.
- [ ] Add target-native runtime jobs as desktop release prerequisites.
- [ ] Add native signing jobs; hash only the returned signed bytes.
- [ ] Add a fail-closed aggregate and immutable manifest-signing job.
- [ ] Embed the exact signed manifest and accepted keys in each desktop build.
- [ ] Upload to a draft release, read back, re-hash, and execute the downloaded archives.
- [ ] Test timeouts, retries, approval denial, signing failure, partial output, and draft recovery.

### WP4 — Desktop resolver and verified cache

- [ ] Select tuples offline from the embedded manifest and resolve immutable direct asset URLs.
- [ ] Stream bounded downloads; verify signature, size, archive hash, and extracted tree.
- [ ] Add exclusive staging, atomic publication, quarantine, locking, and the 2 GiB cache policy.
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

While blocked, artifact-only and test work may continue. No tuple may be enabled or published.

## Final go/no-go gates

- [ ] Every enabled tuple has native build, oldest-baseline, native-trust, SFTP, system-SSH, RPC,
      security, and performance evidence.
- [ ] Every desktop build embeds the signed manifest for the exact immutable assets it ships.
- [ ] Beta rollback to the existing legacy mechanism is proven in the same build.
- [ ] All required matrix cells have evidence IDs in the detailed ledger.
- [ ] Default-on receives a separate review after the Beta soak; legacy remains available until a
      separately reviewed removal decision.
