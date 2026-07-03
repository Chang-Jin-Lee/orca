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

## Success criteria (baseline-relative; finalize after task 1)

- DSR-under-load p90 in Orca within striking distance of iTerm2 on the same
  box; zero DSR timeouts (today's freeze class).
- Fenced agent-tui throughput ≥ VS Code on the same box.
- Idle RSS with 0–1 agents materially down (target set after the memory
  harness lands; hidden-pane parking is the main lever).
- Zero >100 ms event-loop stalls in main/renderer during a 10 MB flood.
- Production P90 typing latency down and monitored continuously.
