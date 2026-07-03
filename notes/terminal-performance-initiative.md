# Terminal Performance Initiative

Working plan for the `orca-performance` branch. Goal: make Orca's terminal as
performant as the architecture allows, with every claim backed by a number.
Started 2026-07-02.

## Why (user-reported, from the team meeting)

1. Typing in the terminal is sometimes laggy — occasionally seconds of delay.
2. Users say the terminal is slower than iTerm (unclear if typing or scrolling).
3. Scrolling in Claude Code / OpenCode is slow.
4. Idle memory is high (1–2 GB).
5. Battery usage is high.

Goals: legit performance complaints ≤ 1/week; sampled P90 typing/scrolling
latency down significantly; lower memory with 0–1 agents.

## Ground truth (verified against source, 2026-07-02)

Research corpus: xterm.js 6 / VS Code / Ghostty internals study (verified
file:line claims) — see the archived digest and the "xterm.js vs Ghostty"
deep-dive. The Orca-specific findings below were re-verified against this
repo's code:

- **Electron main sits on every terminal byte's path** (daemon → main →
  renderer). VS Code ships the same xterm.js but bypasses main entirely: its
  ptyHost is a UtilityProcess with a direct MessagePort to each renderer.
- **The PTY producer is never paused.** `acknowledgeDataEvent` is a no-op in
  both `LocalPtyProvider` and `DaemonPtyAdapter`. Only main→renderer delivery
  is watermarked (512 KB, `src/main/ipc/pty.ts:1374`); main's own buffer can
  grow toward a 512 MB cap under flood. VS Code pauses the actual pty at 100k
  unacked chars (kernel backpressure blocks the shell).
- Renderer terminals share one thread with the entire React app; xterm.js
  parses in 12 ms slices at a documented 5–35 MB/s ceiling.
- Renderer scrollback default is 5,000 rows (`src/shared/terminal-scrollback-policy.ts`),
  5× VS Code's default; 12 B/cell plus per-line JS objects; O(all lines)
  reflow on column resize.
- Latency physics: Ghostty ~4 ms median keypress latency, VS Code ~31 ms
  (same-library reference), native class 5–10 ms. Realistic target: beat
  VS Code, close on iTerm2, eliminate the stall/jank class entirely (P99
  dominates perception).

## Current state

Branch `orca-performance` (long-lived testing line, from main @ `8e8a08ac7`):

1. `tools/benchmarks/terminal-pipeline-bench.mjs` — cross-terminal rig
   (see Benchmark protocol below).
2. Merge of PR #7153 = #7150 (freeze/memory: backlog caps, wedge guards,
   probe-certified replay release) + #7139 (cooperative drain: paced backlog
   draining keeps typing responsive under floods). Post-merge on this base:
   `pnpm typecheck` clean, 626 targeted tests green (scheduler, guards,
   pty/pty-connection/pty-transport suites). #7153 itself is a disposable
   testing PR; #7139 and #7150 land separately on main.

## Workstreams

### 1. Baseline benchmarks (now; human-in-terminal required)

Run the rig in each terminal on the same machine — Orca pane, iTerm2, Ghostty,
Terminal.app, VS Code (T3Code if available):

```
node tools/benchmarks/terminal-pipeline-bench.mjs --label <machine>-<date>
node tools/benchmarks/terminal-pipeline-bench.mjs report
```

These numbers answer "are we actually slower than iTerm, and where," and are
the before/after for everything below.

### 2. Validate #7153 on orca-performance (this week, extended testing)

Watch for: typing responsiveness under agent floods, bounded memory,
skip-notice + snapshot repaint on overflow, no permanent input loss. When
validated, land #7139 and #7150 as separate PRs on main.

### 3. Revive term-speed-2 (the headline structural work)

History: nwparker's ~38-branch chain (+20k lines) implementing the terminal
model/view contract — hidden view parking, hidden delivery gate, side-effect
authority in main, model query authority, skip-grammar deletion — all
kill-switched, documented in
`origin/nwparker/term-speed-2-architecture-docs:docs/reference/terminal-model-view-contract.md`.
It shipped only in v1.4.78-rc.1, a deliberate personal-testing build; it was
never rejected and never reached main. Directly targets complaints 3–5
(hidden panes stop receiving bytes and unmount their xterm + WebGL atlases).

Merge scout (2026-07-02, chain tip into orca-performance): 144 files, 34
conflicted, 115 hunks. Hotspots: `pty-connection.ts` (31), `pty.ts` (16),
`daemon-pty-adapter.ts` (6), `orca-runtime.ts` (5).
`pane-terminal-output-scheduler.ts` does NOT conflict — #7139/#7150 and the
chain touch different layers; runtime interaction (drain pacing × hidden
gate) still needs deliberate testing.

Execution: dedicated focused session; resolve on `revive/term-speed-2` off
orca-performance; keep both sides' kill switches; validate with typecheck +
the contract tests listed in the model-view-contract doc + #7153's suites;
merge back to orca-performance for extended testing. Estimated ~1 day of
careful resolution + validation.

### 4. Remaining stall-bug fixes (parallel, independently shippable)

The "seconds of delay" class = discrete thread-blocking events, not
steady-state latency:

- PR #7105 (open): skip synchronous cold-restore replay for live daemon
  sessions in doSpawn.
- `SerializeAddon.serialize()` audit: ~1.2 s renderer block at 50k scrollback
  rows (#5096 follow-up, never done). Call sites include the mobile snapshot
  path (`pty-connection.ts:2861`) and sleep/hibernate serialization.
- #2836 frozen-terminal leads: replay-guard latch, codex-stale gate, uncapped
  buffers (repro harness exists).
- Checkpoint-RPC main-thread scrub (measured ~2–10 ms bursts per hot 5 s
  tick; small, part of the same program).

### 5. Producer-side PTY flow control

Ack-driven pause/resume of the actual PTY through the daemon protocol
(node-pty supports it), watermarks per the xterm.js flow-control guide
(≤500 KB). Converts flood-induced buffered lag into shell blocking — the
correct physics. Sequence after #7139 lands (interacts with its drain pacing).

Design (2026-07-03, implement after the term-speed-2 revival merges —
same files):

- Signal source: main already tracks per-pty pending + in-flight
  (`pendingData`, `rendererInFlightCharsByPty` in `ipc/pty.ts`). When a
  pty's pending exceeds HIGH (256 KB), main asks the producer to pause;
  below LOW (32 KB), resume.
- Producer side: two new protocol notifications (`pausePty`/`resumePty`,
  protocol vNext, version-gated like `supportsIncrementalCheckpoints`);
  daemon `Session` calls node-pty `pause()`/`resume()` — stops reading the
  pty fd, kernel buffer fills, the shell blocks on write: true kernel
  backpressure, identical physics to VS Code's 100k/5k design.
  `LocalPtyProvider` calls pause/resume directly.
- Safety invariants: (1) failsafe auto-resume after 5 s regardless of
  watermark, so a lost resume can never wedge a shell; (2) resume on
  detach/exit/kill/daemon-reconnect; (3) pause must not suppress the
  interactive-echo bypass — with the pipeline fixed (11.5 MB/s dev), the
  HIGH watermark is only reachable during genuine floods where echo is
  already queued; (4) PTY reads never stop for model/tail ingestion
  (term-speed-2 invariant #1) — pause gates the fd read, so daemon-side
  emulator state pauses with it, which is correct (state = what was read).
- Tests: watermark transition unit tests, lost-resume failsafe, kill/exit
  cleanup, plus an e2e pressure scenario asserting bounded main memory and
  a blocked producer (`yes` exits promptly on SIGINT while paused).

### 6. Extend the measurement rig

- True keypress→pixel latency: Typometer manual protocol (the DSR probe stops
  at the parser reply, before paint).
- Idle memory + battery: per-process RSS breakdown + `powermetrics` sampling
  at 0/1/5 agents (goal-3 metric).
- FPS under flood; event-loop-delay probes (`monitorEventLoopDelay`) in
  main/daemon/renderer behind a debug flag for pipeline attribution.

### 7. utilityProcess terminal router (structural endgame; gated on data)

An Electron UtilityProcess owns the daemon socket and hands each renderer a
MessagePort — VS Code's topology while keeping Orca's detached daemon (warm
reattach). Takes main off the terminal data path entirely; daemon-side
history persistence falls out naturally. Prototype only after baselines show
how much tail latency lives in the main hop.

### 8. Production P90 telemetry

Sampled keypress→echo latency + long-task/stall counts from real users;
defines the success criterion and becomes the permanent regression gate.
Design after the local rig stabilizes so the metrics match.

## Benchmark protocol

`tools/benchmarks/terminal-pipeline-bench.mjs` measures, from inside any
terminal:

- **DSR idle latency** — ESC[6n round trips (p50/p90/p99); replies come only
  after the parser reaches the query, so it proxies the input pipeline
  without keystroke injection.
- **Fenced throughput** — 4 deterministic fixtures (`ascii-log`, `cjk-emoji`,
  `agent-tui` — Claude-Code-shaped transcript + DEC-2026 status repaints —
  and labeled-pathological `styles-stress`), each run ended by a DSR fence so
  xterm.js-class ingest queues can't flatter the result.
- **DSR under load** — latency sampled during a paced 1 MB/s agent-TUI
  stream: "typing while the agent works," quantified.

Rules: same machine, AC power, comparable window size, no tmux/screen, hands
off the keyboard during runs. Never compare numbers across machines.

## Sequencing

```
now:        [1] baselines        [2] #7153 testing      (parallel)
next:       [3] term-speed-2 revival (dedicated session)
parallel:   [4] stall fixes, [6] rig extensions
after 2/3:  [5] flow control
gated:      [7] utility router   [8] telemetry
```

BMW-group crash work remains the team's priority gate above all of this
(#7150's wedge guards overlap it); this plan runs measurement and revival
prep in parallel without displacing it.

## Findings log

### 2026-07-02 — baseline + decomposition (results committed in tools/benchmarks/results/)

Same machine, unattended serial runs (Orca 1.4.91 prod, Terminal.app, Ghostty
1.3.1; iTerm2 not installed, VS Code pending):

| metric | Orca prod | Terminal.app | Ghostty |
|---|---|---|---|
| DSR idle p50/p99 (ms) | 0.69 / 22.7 | 0.35 / 0.68 | 0.19 / 0.72 |
| DSR under 1 MB/s agent load p50/p99 (ms) | **134 / 292** | 0.45 / 7.9 | 0.21 / 6.1 |
| agent-tui fenced throughput | **2.0 MB/s** | 37 | 78 |
| ascii-log fenced throughput | 13 MB/s | 39 | 93 |

Decomposition of the 51× agent-tui gap — both pipeline ends are fast:

- Bare `@xterm/headless` (114×85, scrollback 5000): agent-tui **103 MB/s**
  (`terminal-headless-parse-bench.mjs`). The xterm parser is not the problem.
- Daemon `Session` ingest (emulator + pending-output recording + fanout):
  agent-tui **103 MB/s** (`session-ingest-throughput.bench.test.ts`,
  `ORCA_TERMINAL_PERF_BENCH=1`). The daemon is not the problem.

Conclusions: (1) idle latency is fine — the extra process hop costs ~0.5 ms,
so the utilityProcess router is deprioritized by data; (2) the crisis is
queueing between daemon egress and renderer parse completion — main
per-chunk processing, the 512 KB delivery/ACK pacing (ACKs fire after
renderer write callbacks, so renderer slowness throttles delivery
multiplicatively), and renderer per-chunk layers above xterm; (3) the
agent-TUI shape (DEC-2026 frames + erase/repaint) is 6.5× worse than plain
text inside Orca while being equal-cost everywhere else — profile it in the
renderer first (task #9).

### 2026-07-02 — dev-build check of #7139/#7150 (confounded; directional only)

Dev build of orca-performance (282-col window, 3MB fixtures, dev-mode
overhead): DSR idle p50 0.64 ms (unchanged), **DSR under load p50 161 ms** —
the cooperative-drain branch does not move the under-load class. In
hindsight this is structural: DSR replies are ordered within the output
stream, so the metric measures output-queue depth; #7139 paces draining to
protect input-send responsiveness but cannot reorder the queue. Implications:
(1) the 134 ms-class number is fixed only by shrinking the queue (producer
flow control) or raising drain rate (the 51× throughput hunt); (2) #7153's
own wins (freeze class, bounded memory, input-loss guards) must be validated
with freeze scenarios and real typing, not DSR. Also learned: dev-mode runs
are ~2× slower across the board and fences need `--dsr-timeout-ms` headroom.

### 2026-07-02 — 51× loss attributed: scheduler fixed-nap drip (task #9)

The renderer output scheduler (`pane-terminal-output-scheduler.ts`) drained
at most 2×16KB per tick, then slept 4ms (high-priority) / 16ms (background)
regardless of parse speed. Isolation bench (fake timers, instant-parse
terminal — `pane-terminal-output-scheduler-throughput.bench.test.ts`,
`ORCA_TERMINAL_PERF_BENCH=1`): **background cadence = 1.9 MB/s — matching
prod's measured 2.0 MB/s agent-tui ceiling**; foreground = 27 MB/s (only
when arrivals re-poke 0ms drains; Chromium's ~4ms timer clamp makes the
sustained real-world HP ceiling ~8 MB/s). Classification: pty-connection's
`isLatencySensitiveForegroundOutput` routes sizable no-recent-input chunks
to the queue, so floods always ride the drip.

Fix (committed 9e8bb2243): high-priority drains are now **parse-clocked** —
a pacer re-arms a 0ms drain when xterm's write callback confirms the batch
parsed — and carry 8 writes/tick (128KB ≈ 1.3ms parse). Isolation ceiling:
27 → **117.6 MB/s** (parse-limited). Background cadence deliberately
unchanged (protects the focused pane; hidden panes are term-speed-2's job).
`DRAIN_TIME_BUDGET_MS` still bounds tick work (cooperative-drain intent of
#7139 preserved; its budget-yield test still passes). 621 tests green.

Open follow-ups from this attribution: (a) end-to-end dev verification (in
progress); (b) whether main's `background:true` delivery marking demotes
visible-pane floods to the background drip — check
`window.__terminalOutputSchedulerDebug` counters in a dev run; (c) ascii-log
gap (13 vs 83 MB/s headless) — likely per-chunk `beforeWrite` side-effect
scanning; profile after (a).

### 2026-07-03 — THE WHALE: main's retained-tail redraw path is O(tail) per chunk

Parse-clock fix didn't move end-to-end (agent-tui still 0.7 MB/s dev). Layered
probes (renderer scheduler counters → main whole-method timer → per-section
timers → targeted micro-benches) attributed it fully:

- Renderer receives only ~350–770 KB/s — it is **starved**, not slow.
- `OrcaRuntime.onPtyData` consumes **~93% of main's event loop** during the
  flood (~950 ms/s at ~450 chunks/s ≈ 2.1 ms/chunk).
- All wrapped sub-calls (OSC scanners, agent detect, watchers, headless
  track, leaves loop, mobile touch) together: **~3.5%**. The remainder is the
  pty-record tail block.
- Micro-bench (`appendNormalizedToTailBuffer` with a real agent-TUI frame
  containing `ESC[10A ESC[0J`): **0.888 ms/chunk at a 2,000-line tail** — 32×
  the plain-append path. Cause: `appendNormalizedToMultilineTailBuffer`
  materializes ~2,001 row objects per chunk (orca-runtime.ts:22324) and
  `finalizeRetainedTerminalRows` allocates them all again plus runs a
  trailing-whitespace regex per row (:22458) — ~4k allocations + 2k regexes
  per tiny chunk, twice the tail length in O(n) passes. Every Claude-Code
  frame (cursor-up + erase-below) takes this path; plain logs don't — which
  is exactly the measured agent-tui vs ascii asymmetry.

Chain: TUI flood → O(tail) work per chunk in main → main event loop
saturates → daemon socket backpressures → renderer starved at ~0.4 MB/s →
deep queue → 134 ms DSR-under-load.

Fix (in progress): run the existing algorithm on a lazy suffix window (the
cursor's maximum upward reach, computed from the chunk) with the untouched
prefix shared by reference; differential fuzz test proves output equality
against the original implementation. Worst case (pathological full-height
cursor-up) falls back to today's cost.

### 2026-07-03 — windowed-tail fix: partial end-to-end win; next suspect queued

Dev-build bench after the windowed redraw-tail fix (label dev-tailfix, same
protocol as dev-parseclock): agent-tui **0.7 → 1.0 MB/s (+43%)**, DSR-under-
load **p50 161 → 108 ms, p99 624 → 154 ms (4×)**. Real movement for the
first time, but the pipeline is still far from the renderer's 27–117 MB/s
capacity — another main-side consumer remains hot.

Next cycle (exact recipe): re-apply the whole-method main probe
(`onPtyDataMs` sampler in `pty.ts` bindProviderListeners) on the fixed
build. If onPtyData still dominates, the remaining O(tail)/per-chunk
suspects in priority order: (1) `buildTerminalWaitText` ×2 per chunk (full
tail join, 0.116 ms/chunk in prod-node isolation — likely 2-4× that in
dev); (2) `normalizeTerminalChunk` (regex over every chunk, never measured);
(3) the per-leaf duplicate tail path when `tailStateMatches` fails. If
onPtyData no longer dominates, probe the main→renderer delivery batching
next. The probe/bench cycle is mechanical: relaunch dev
(`ELECTRON_ENABLE_LOGGING=1 pnpm dev`), `orca-dev terminal create --command
"<bench> --label X --size-mb 3 --dsr-timeout-ms 120000"`, grep the log.

### 2026-07-03 — post-fix attribution: `blockedCheck` is the remaining whale

Post-windowed-tail probe run (dev build, agent-tui): `onPtyData` still
~90% of main's event loop (~930 ms/s). Bucket split per second:
**blockedCheck ≈ 700–790 ms (~85%)**, waitText ≈ 70, append ≈ 25 (windowed
fix confirmed), normalize ≈ 7, preview ≈ 0.

Mechanism (orca-runtime.ts:23128 `nextTailHasNewerBlockedReason` + its
callers): per chunk, TWO full wait texts are built (`buildTerminalWaitText`
joins the whole ≤256KB tail), then the check calls `.toLowerCase()` on both
(another ~512KB of string allocation per chunk) and runs multi-pattern
blocked/ready scans (`findTerminalWaitBlockedSignal`,
`findKnownReadyPromptIndex` — lastIndexOf/regex passes over the full text)
— all to timestamp `waitBlockedAt` for `terminal wait`.

Fix design (next session): blocked/ready prompts are end-anchored — an
actionable prompt is at the END of output. (1) Run the check on a bounded
suffix of the wait text (last ~64 lines / 16KB) instead of the full tail;
(2) cheap pre-filter: skip entirely unless the appended chunk (plus a small
carry for split keywords) can contain a blocked keyword; (3) build the two
wait texts only when the check runs. Verification mirrors the windowed-tail
pattern: keep the full-text check as reference + differential fuzz over
randomized tails/prompts (split-across-chunks cases included — the
`appendCandidateSignal` ordering semantics at :23146 must be preserved),
plus the terminal-wait contract tests. Expected effect: removes ~85% of
remaining onPtyData cost; combined with the two landed fixes should
finally unlock the pipeline toward the renderer's measured 27–117 MB/s.

### 2026-07-03 — pipeline unlocked: three stacked fixes, 16× throughput, 9× latency

Dev-build bench with all three fixes (parse-clocked drains 9e8bb2243,
windowed tail 4e08a28cd, throttled blocked-check 66f20258e), label
dev-blockedfix, same protocol/config as prior dev rows:

| metric | pre-fix dev | +tail fix | +blocked fix |
|---|---|---|---|
| agent-tui MB/s | 0.7 | 1.0 | **11.5** |
| DSR load p50/p99 (ms) | 161 / 624 | 108 / 154 | **18.8 / 24.9** |
| DSR idle p50/p99 (ms) | 0.95 / 21 | 1.09 / 18 | **0.52 / 8.6** |
| ascii-log MB/s | 6.4 | 4.7 | **9.6** |

The agent-TUI-specific penalty is gone (agent-tui ≈ cjk ≈ ascii now). The
throttled blocked-check delivered the predicted ~85% cut. Dev mode carries
~2× overhead vs prod, so the prod build should land near ~10ms DSR-under-
load — from the 134ms baseline (~13×) — pending a packaged-build rerun.
Remaining floor is structural cadence (8ms daemon batch + 4ms HP drain
ticks + xterm 12ms slices), which flow control (#6) does not target;
re-evaluate the "within 10× of Terminal.app" goal line after a prod
measurement. Next: term-speed-2 revival (#4), then flow control (#6).

## Success criteria (baseline-relative; finalize after task 1)

- DSR-under-load p90 in Orca within striking distance of iTerm2 on the same
  box; zero DSR timeouts (today's freeze class).
- Fenced agent-tui throughput ≥ VS Code on the same box.
- Idle RSS with 0–1 agents materially down (target set after the memory
  harness lands; hidden-pane parking is the main lever).
- Zero >100 ms event-loop stalls in main/renderer during a 10 MB flood.
- Production P90 typing latency down and monitored continuously.
