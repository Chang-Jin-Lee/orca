# SSH Relay Runtime Distribution — Short Implementation Checklist

Last updated: 2026-07-14

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

## Active work

- [ ] **WP2 — Prove oldest supported baselines and native trust.**
  - Proven: all-six artifact metadata gate; local Rocky 8 x64 two-build equality, smoke, and glibc
    2.28/libstdc++ 6.0.25 execution; Windows checkout-newline contract.
  - Active red: exact-head run
    [29378160419](https://github.com/stablyai/orca/actions/runs/29378160419) prepares both native Linux
    builders, but both builds cannot create exclusive output through the runner-temp bind mount.
  - Active correction locally passes two complete offline x64 builds, exact equality, archive/tree
    verification, and bundled Node/PTY/watcher smoke as the host UID/GID with a mode-1777 tmpfs.
  - Next proof: both native Linux builds, supplemental userland jobs, and direct artifact audit.
  - Windows x64 passes its declared oldest-floor job. The hosted arm64 runner is build 26200, not the
    required build 26100, so its otherwise successful artifact/runtime smoke does not close that cell.
  - Still open: Windows arm64 build 26100, kernel 4.18, macOS 13.5, native signing/trust, and every SSH
    transfer/runtime cell.

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
- [ ] Rebuild both Linux artifacts in the digest-pinned glibc 2.28/libstdc++ 6.0.25 userland on
      native x64/arm64 runners; smoke and compare them there.
- [ ] Prove each candidate on its oldest supported OS/libc/kernel baseline.
- [ ] Sign macOS and Windows bytes and verify native trust on the target OS.
- [ ] Merge draft PR [#8741](https://github.com/stablyai/orca/pull/8741).

### WP3 — Release build and signing

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
