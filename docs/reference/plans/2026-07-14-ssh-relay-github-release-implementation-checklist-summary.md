# SSH Relay Runtime Distribution — Implementation Checklist

Last updated: 2026-07-14

This is the human-readable project tracker. The
[detailed evidence ledger](./2026-07-14-ssh-relay-github-release-implementation-checklist.md)
contains exact commands, runner identities, artifact hashes, metrics, and residual gaps.

A checked box here means the implementation or validation has exact evidence in that ledger.
Approved design decisions are listed separately and are not presented as implemented work.

## Current state

- Existing SSH relay behavior remains the default for every target.
- The bundled runtime path is not connected to production and no tuple is enabled.
- The future bundled path is a per-SSH-target Beta option, off by default.
- No runtime artifact has been published to a GitHub Release.
- Latest native proof: [GitHub Actions run 29367559831](https://github.com/stablyai/orca/actions/runs/29367559831)
  passed clean-build equality and runtime smoke on Linux x64/arm64, macOS x64/arm64, and Windows
  x64/arm64.
- Active work package: exact runtime closure is green on all six native runner families. The first
  metadata run failed closed before Windows build/upload because its linker-version probe was
  silent; the bounded probe correction and reviewed Windows 19045/26100 build-floor correction are
  in progress. Archive safety, oldest-baseline execution, and native trust remain open.

## Locked rollout decisions

- Legacy behavior remains the persisted and effective default.
- The Beta choice is per SSH target, off by default, and shown on target add/edit surfaces.
- Missing, old, imported, unknown, or malformed settings resolve to legacy.
- A mode change applies only on the next connection or explicit reconnect.
- Legacy remains available; removal or narrowing requires a separate review.
- Only availability/compatibility failures may fall back automatically. Integrity, security, and
  corruption failures fail closed.

## Rollout implementation remaining

- [ ] Implement the per-target configuration field and migration tests.
- [ ] Add the off-by-default Beta-tagged option to SSH target add/edit UI.
- [ ] Implement `bundled-auto` selection for explicitly opted-in targets.
- [ ] Implement automatic legacy fallback only for classified availability/compatibility failures.
- [ ] Fail closed for signature, hash, archive, tree, native-trust, bundled-Node, and cache-corruption
      failures.
- [ ] Add the explicit “disable Beta and reconnect” recovery action for fail-closed Beta errors.
- [ ] Collect privacy-safe Beta success, latency, failure-stage, and fallback-reason telemetry.
- [ ] Require a separate reviewed decision before changing any tuple to default-on.

## Work packages

### 0 — Existing Node/npm resolver correction

- [x] Implement coherent remote Node/npm selection.
- [x] Add focused unit/static proof.
- [x] Prove live Linux arm64 SSH behavior.
- [x] Keep this separate from artifact distribution.
- [ ] Merge the independently reviewable fix from draft PR
      [#8724](https://github.com/stablyai/orca/pull/8724).

### 1 — Manifest, identity, and platform contracts

- [x] Define signed immutable manifest and canonical content identity.
- [x] Define exact release tag/asset URL rules without mutable `latest` lookup.
- [x] Define conservative OS/architecture/libc selection.
- [x] Add hostile manifest/path/schema tests.
- [ ] Finish archive-safety implementation and hostile archive tests.
- [ ] Update mode-qualified remote directory parsing and GC compatibility.
- [ ] Merge the contract package from draft PR
      [#8728](https://github.com/stablyai/orca/pull/8728).

### 2 — Target-native runtime artifacts

- [x] Pin and verify Node v24.18.0 release inputs and signatures.
- [x] Produce and smoke-test candidate runtimes with patched `node-pty` and the matching
      `@parcel/watcher` native package on all six runner families.
- [x] Prove bundled Node, real PTY input/resize/exit, watcher events, and Windows resource settlement.
- [x] Prove two clean builds compare exactly on all six native GitHub runner families.
- [x] Keep `/guard:cf`; fix Windows arm64 drift with copied-artifact-only `/INCREMENTAL:NO`.
- [x] Enforce and prove an exact 34/35/42-file per-tuple closure that rejects undeclared package
      managers, sources, maps, build outputs, package drift, and missing licenses on all six native
      runner families.
- [x] Define and locally test file-to-package SPDX ownership, immutable archive-scoped SBOM identity,
      exact-commit builder identity, runner identity, and bounded SHA-256 toolchain records.
- [ ] Complete the runtime closure, license, SBOM, provenance, and prohibited-content allowlist audit.
- [ ] Prove each candidate on its oldest supported OS/libc/kernel baseline.
- [ ] Sign macOS and Windows native bytes and verify target-native trust policy.
- [ ] Record complete compiler/toolchain provenance for release promotion.
- [ ] Merge draft PR [#8741](https://github.com/stablyai/orca/pull/8741).

### 3 — Release build, signing, and publication

- [ ] Add target-native build jobs as release prerequisites.
- [ ] Add native signing jobs and return signed bytes before final hashing.
- [ ] Add the fail-closed aggregate and manifest-signing job.
- [ ] Embed the exact signed manifest and accepted keys into every desktop build.
- [ ] Upload the exact prebuilt runtime bytes to the matching draft release.
- [ ] Verify draft read-back hashes and execute downloaded archives.
- [ ] Test timeout, retry exhaustion, approval denial/timeout, signing failure, partial output, and
      recovered-draft behavior.
- [ ] Block publication whenever any required runtime/signing/manifest gate fails.

### 4 — Desktop resolver, verification, extraction, and cache

- [ ] Implement offline tuple selection from the embedded signed manifest.
- [ ] Implement exact direct release URL resolution and safe redirect handling.
- [ ] Stream download with size/time bounds and archive SHA-256 verification.
- [ ] Extract into exclusive staging with full hostile-archive defenses.
- [ ] Verify the complete extracted tree before atomic cache publication.
- [ ] Implement the 2 GiB bounded cache, locking, concurrency, quarantine, and eviction rules.
- [ ] Prove verified client-cache transfer works with the client offline.
- [ ] Preserve `ORCA_RELAY_PATH` behind the official-build trust boundary.

### 5 — Bounded SSH transfer and remote installation

- [ ] Implement bounded/cancellable SFTP transfer with executable-mode restoration.
- [ ] Keep compatible POSIX tar streaming as an optional fast path.
- [ ] Implement POSIX no-tar transfer using only the declared shell/file primitives.
- [ ] Implement bounded binary PowerShell/.NET transfer for Windows system SSH.
- [ ] Transfer only locally verified bytes into exclusive remote staging.
- [ ] Use bundled Node to hash the complete staged tree before any native probe.
- [ ] Run native probes, PTY/watcher smoke, structured sentinel, atomic publish, and launch in order.
- [ ] Trust the initial-install proof on warm launch under the immutable-directory assumption.
- [ ] Quarantine detected mutation and recover only from freshly verified bundled bytes.
- [ ] Preserve SSH authentication, connection, and relay RPC transport behavior.

### 6 — Modes, fallback, diagnostics, and concurrency

- [ ] Implement internal `legacy`, `auto`, and forced diagnostic `bundled` modes.
- [ ] Abort and await all bundled work before eligible legacy fallback starts.
- [ ] Keep bundled and legacy identities, locks, partials, sentinels, and generations separate.
- [ ] Add stable stage/failure codes and privacy-safe diagnostics.
- [ ] Prove fallback races, reconnect/reattach, concurrent clients, GC, upgrade, and downgrade.
- [ ] Prove every integrity/security/corruption class fails closed in `auto`.
- [ ] Prove eligible legacy fallback begins within the documented delay budget.

### 7 — Validation and Beta rollout

- [ ] Name and pin representative POSIX and Windows remote snapshots for Layer B.
- [ ] For every enabled remote tuple, pass built-in SFTP and system SSH.
- [ ] For every supported client OS/architecture, pass both transfer families against representative
      POSIX and Windows remotes.
- [ ] Prove remote GitHub egress is never required.
- [ ] Prove no-tar/no-Node/no-Python/no-Perl/no-hash-tool bootstrap cases.
- [ ] Run full-size, slow-link, cancellation, concurrency, and failure-injection tests.
- [ ] Measure cold/warm latency, memory, channels/files, cancellation settlement, and fallback delay
      against legacy baselines.
- [ ] Pass security review, SBOM/provenance, signing, key lifecycle, CVE, and emergency-refresh gates.
- [ ] Ship the per-target Beta with every target still defaulting to legacy.
- [ ] Accumulate approved real-host Beta evidence before any default-on proposal.
- [ ] Require three qualifying RCs plus rollback proof before default-on review.

## External blockers

- [ ] Repository release administrator: approve the representative Layer B remote provider,
      snapshots, credentials, egress policy, teardown SLA, and cost/capacity owner.
- [ ] Repository release administrator: provision the protected manifest/native-signing environment,
      reviewers, test keys/certificates, and access audit.

Safe behavior while either blocker remains: no bundled tuple is enabled or published; legacy remains
the default, and independent local/native-runner contract work may continue.

## Definition of done

- [ ] Every item above that applies to an enabled tuple has exact evidence in the detailed ledger.
- [ ] Every enabled tuple has target-native build, oldest-baseline, native-trust, SFTP, system-SSH,
      RPC, security, and performance proof.
- [ ] Every packaged desktop embeds the exact signed manifest for the published immutable assets.
- [ ] The Beta ships off by default per target and rollback to legacy is proven in the same build.
- [ ] No default-on rollout occurs without a separate reviewed decision and completed soak evidence.
- [ ] Legacy remains available until a separately reviewed removal decision.
