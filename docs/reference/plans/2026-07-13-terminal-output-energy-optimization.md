# Terminal Output Energy Optimization

Date: 2026-07-13

Status: approved for implementation by the analysis below

## Problem and evidence

Visible terminal output converges in
`src/renderer/src/components/terminal-pane/pty-connection.ts`. Native, WSL, and SSH terminals
arrive through `createIpcPtyTransport`; remote-runtime terminals arrive through
`createRemoteRuntimePtyTransport`. Both transports invoke the same `dataCallback`, which preserves
renderer sequence handling, hidden-output recovery, protocol-query extraction, and then calls
`writePtyOutputToXterm`.

`writePtyOutputToXterm` currently classifies foreground output with
`isLatencySensitiveForegroundOutput` before calling
`src/renderer/src/lib/pane-manager/pane-terminal-output-scheduler.ts`:

- Every active-pane chunk at or below 2 KiB is classified as latency-sensitive, independent of
  whether the user recently typed or the bytes contain a terminal query.
- Larger ANSI redraws are also latency-sensitive for 150 ms after accepted terminal input.
- A rolling budget permits up to 128 KiB of immediate foreground writes in 500 ms. Inactive split
  panes have a separate 32 KiB immediate budget.
- Once the budget is exhausted, `latencySensitive: false` queues output, but the scheduler arms a
  zero-delay high-priority drain. A continuing series of separately delivered tiny chunks can
  therefore cause one renderer task and one xterm write per chunk instead of one write per visual
  frame.

The existing scheduler already supplies the safety mechanisms that a new cadence must retain:

- Per-terminal queues preserve byte order and coalesce adjacent chunks without changing their
  bytes.
- Parse-deferred PTY ACK credits are attached to chunks and fire exactly once after the final xterm
  slice parses, or on every discard/drop path. Main-process producer flow control therefore follows
  actual renderer parse progress.
- Foreground queues are capped, sliced into 16 KiB writes, drained cooperatively with an 8 ms task
  budget, and parse-clocked during large visible backlogs.
- Background/hidden terminals use a shared delayed drain and bounded backlog. Snapshot-backed
  hidden panes may park delivery in main and restore from authoritative terminal state.
- Native Windows synchronized output has separate hold/coalesce state, cursor-restore detection,
  and latency-sensitive fallbacks for frames opened near accepted input.
- Visibility resume, shutdown capture, scroll handling, and terminal disposal call the scheduler's
  flush/discard APIs rather than writing around its queue.

The main-process runtime RPC also batches output for remote subscribers, but that does not solve
this renderer issue: the PTY delivery boundaries seen by the active desktop renderer can still be
small and repeated, and the current <=2 KiB rule turns each one into immediate xterm activity.

## Goals

- Preserve immediate echo/redraw behavior when there is evidence of accepted user input.
- Preserve immediate parsing of reply-eliciting terminal protocol queries so DA, DSR/CPR, DECRQM,
  OSC color, and related replies meet programs' raw-mode read windows.
- Coalesce passive visible output to at most one initial scheduler drain per animation frame under
  normal visible-window operation.
- Keep continuous foreground output visually smooth at the display's animation-frame cadence; do
  not impose a fixed 30 fps throttle or limit an established backlog to one slice per frame.
- Materially reduce renderer tasks, xterm writes, repaints, and CPU wakeups for streaming agents
  that emit many tiny chunks, with or without GPU acceleration.
- Preserve exact bytes, ordering, parse-deferred ACK accounting, bounded memory, visibility
  transitions, synchronized output, and large-backlog throughput.
- Apply the same policy to local, SSH, WSL, and remote-runtime output without host-specific timing
  assumptions.

## Non-goals

- Do not disable or change `caffeinate`, agents, terminal processes, or shell behavior.
- Do not change GPU settings or assume WebGL is enabled.
- Do not alter main-process PTY batching, terminal stream protocol framing, mobile subscriptions, or
  Git polling.
- Do not change hidden-terminal parking, snapshot restoration, backlog loss policy, or terminal
  protocol reply contents.
- Do not introduce a user setting, UI, telemetry upload, or platform-specific cadence.
- Do not optimize xterm parsing or renderer internals beyond reducing how often Orca feeds passive
  chunks into them.
- Do not change agent/worktree status animation behavior in this rollout. Status animations are a
  separate renderer-energy follow-up documented below so their cost is measured independently from
  terminal writes.

## Alternatives considered

### Keep the 2 KiB rule and lower its byte budget

This reduces the longest immediate burst but preserves the incorrect signal: passive output remains
"interactive" solely because transport framing happened to be small. It also still produces many
immediate writes below the new budget.

### Add a fixed debounce such as 8-16 ms

A timer can coalesce chunks, but its wakeup is not aligned with the renderer's paint opportunity and
can add a second task immediately before or after a frame. Chromium timer clamping also varies when
the app is backgrounded. The repository already distinguishes visible from hidden delivery, so an
animation-frame boundary is the more direct visible-output signal.

### Cap passive output at approximately 30 fps or add battery/idle modes

A 30 fps cap could reduce wakeups further, but it requires a second cadence source, a reliable
definition of idle/battery state across macOS, Linux, and Windows, and policy for active prompts and
watched split panes. There is no measurement yet showing that once-per-display-frame batching is
insufficient. Starting at one animation frame is less risky and still collapses potentially many PTY
deliveries into one xterm write. A 30 fps policy should be considered only after the measurement plan
below shows a remaining material cost.

### Batch all foreground output, including input-driven and protocol traffic

This is simple but adds avoidable latency to typing and can make terminal protocol clients time out.
The existing input timestamp and shared renderer-query grammar provide stronger evidence than byte
length and allow the fast path to remain narrow.

### Change main-process delivery batching instead

Main batching affects IPC frequency but cannot safely infer renderer visibility, active-pane input,
or xterm reply ownership, and remote-runtime output has a different transport. Renderer scheduling is
the common point where all execution paths and paint cadence are known.

### Animate only the selected foreground agent

This could reduce the number of animated indicators, but it breaks an important status affordance:
users must be able to see that agents in other worktrees, tabs, and split panes are still working.
Selection is also not literal keyboard focus; Orca's selected terminal pane remains selected while
the user interacts with the sidebar or another window. Any status-animation optimization must be
based on actual visibility, not active-worktree or active-pane identity.

## Chosen design

### Evidence-based latency classification

Remove the rule that makes every active-pane chunk <=2 KiB latency-sensitive. Foreground output is
immediate only when one of these facts is present:

1. The bytes complete a reply-eliciting terminal query recognized by the existing shared query
   grammar. A small per-connection scan tail carries split CSI/OSC queries across PTY chunks.
2. The active split pane accepted terminal input within the existing 150 ms interactive redraw
   window, subject to the existing 128 KiB/500 ms safety budget.
3. A native Windows synchronized-output frame was opened within its existing interactive window;
   the current frame latch and 16/32 ms cursor-protection fallbacks remain unchanged.

Protocol-query evidence bypasses the byte budget because withholding a reply can block the program
that issued the query. Inactive visible split panes do not get an input fast path, but protocol
queries remain immediate. Output without one of these facts is passive even when it is one byte.
Prompts and ordinary command completion can wait until the next frame (normally <= one refresh
interval); direct keyboard echo and the redraw it triggers remain immediate.

### Shared animation-frame gate

`latencySensitive: false` foreground output remains in the existing per-terminal scheduler queue,
but its first drain waits for one shared `requestAnimationFrame`. All passive chunks and terminals
arriving before that callback share the frame. The frame callback releases those entries and invokes
the existing high-priority drain, so slicing, time budgets, parse pacing, refresh handling, and queue
caps are unchanged after the initial gate.

This aligns new passive output with the next available paint rather than introducing a coarse timer.
On a continuously rendering 60 Hz display the normal initial wait is at most one approximately
16.7 ms frame, and higher-refresh displays naturally get shorter waits. Once a backlog is released,
the existing cooperative continuation keeps making progress between renderer tasks; it is not
restricted to one chunk or one 16 KiB slice per animation frame. The design therefore removes
redundant within-frame writes without intentionally skipping frames or making a streaming terminal
advance at a fixed low cadence.

A one-shot 32 ms fallback is armed with the frame request. It exists only to bound starvation when
`requestAnimationFrame` is unavailable or suspended despite the pane being treated as foreground
(including stale Electron visibility recovery). The frame callback cancels the fallback and the
fallback cancels the frame. This is not a polling loop and does not enforce 30 fps during normal
visible rendering.

If latency-sensitive bytes arrive behind passive bytes waiting for a frame, the scheduler cancels
that terminal's frame wait and synchronously flushes the ordered queue before the new query/echo can
be parsed. Explicit flush, visibility resume, shutdown capture, and discard likewise release or
cancel frame-wait state so no callback can strand or replay an entry.

## Invariants

### Ordering and exact semantics

- Each terminal has one ordered queue. Coalescing concatenates bytes in arrival order without
  decoding, rewriting, dropping, or inserting bytes.
- Immediate traffic never overtakes earlier passive traffic. It first releases and flushes the
  earlier frame-waiting queue.
- Existing `beforeWrite`, `onParsed`, refresh, cursor-show stripping, and scroll-intent boundaries
  remain associated with the same ordered chunks.
- Scheduler flush/discard and hidden restore continue to be the only exceptional delivery paths.

### ACK credits and backpressure

- Every delivered PTY chunk contributes at most one fire-once ACK credit.
- Coalescing may attach multiple credits to one xterm write; all fire only after the corresponding
  bytes' final slices parse.
- Drop, overflow, disposal, write failure, and snapshot-recovery paths continue to fire credits for
  consumed deliveries exactly once.
- The frame wait delays credits by at most one visible frame or the 32 ms fallback. Main may briefly
  reach its in-flight cap and pause the PTY; the frame drain parses bytes, returns credits, and resumes
  production. No credit depends on a future chunk, so an idle producer cannot deadlock the queue.

### Latency and starvation

- Accepted active-pane input and complete reply-eliciting terminal queries take the immediate path,
  except that prior bytes must be parsed first to preserve ordering.
- Passive visible output starts draining on the next animation frame under normal operation.
- Continuous passive output may merge deliveries within a frame, but is never deliberately held to
  alternate frames or a 30 fps cadence.
- If no frame runs, the one-shot fallback releases it within 32 ms.
- Once a large passive backlog starts, the current high-priority parse-clocked drain continues; it is
  not limited to 16 KiB per frame and retains the existing 8 ms cooperative task budget.
- Hidden/background output retains its existing 50 ms shared delay and 16 ms continuation cadence.

### Synchronized output

- DEC 2026 hold/coalesce, cursor restoration, native Windows-only protection, and interactive frame
  latching are unchanged.
- Frame gating applies only when the existing synchronized-output state machine has released an entry
  as ordinary non-latency-sensitive foreground output.

## SSH and cross-platform implications

- Native macOS/Linux/Windows, WSL, and SSH PTYs use the IPC transport but converge on the same
  renderer callback. Remote-runtime PTYs use a separate subscription transport and converge before
  classification. No host clock, path syntax, shell, or Git behavior changes.
- Remote input debounce is not used for protocol replies today and remains bypassed. Query bytes are
  parsed immediately so the existing `sendDesktopQueryReplyImmediate` path can answer local and
  remote programs within their read windows.
- Native Windows ConPTY retains its synchronized-output and renderer-refresh repairs. The cadence
  does not depend on WebGL, so DOM rendering/GPU-disabled configurations benefit from fewer writes
  too.
- Hidden documents and hidden panes remain background delivery. The 32 ms one-shot fallback covers
  the exceptional stale-visibility case where Orca deliberately treats a pane as foreground even if
  Chromium may suppress animation frames.

## Related agent-status animation follow-up

This terminal-output change reduces xterm work but does not make the renderer fully idle if visible
status indicators continue animating. The follow-up is documented here because it is a measurement
confounder and may become the dominant avoidable activity while a working agent is quiet or waiting
on a remote tool. It is not implemented as part of this rollout.

### Current behavior and evidence

- `StatusIndicator` renders the aggregate working state on a worktree as an infinite stepped CSS
  rotation: `spin 1s steps(12, end)`.
- `AgentStateDot` uses the same 12-step rotation for working agent rows and terminal tabs. A visible
  worktree can therefore show both an aggregate working spinner and one or more agent-status
  spinners. Compact agent summaries group identities that share a state, so the adjacent provider
  icons are static and do not each represent another animation.
- The worktree list is virtualized with ten overscan rows. Collapsing the sidebar unmounts the list,
  but overscan-only rows can remain mounted outside the clipped viewport.
- Individual `AgentStateDot` spinners honor reduced-motion preferences. The aggregate
  `StatusIndicator` spinner does not currently have equivalent behavior.
- A stepped animation changes visible orientation 12 times per second, but that alone does not prove
  Chromium schedules only 12 compositor wakeups. Separately mounted spinners can also start out of
  phase, spreading their visual transitions across more frame opportunities. The actual renderer and
  GPU-process cost must be measured, especially with GPU acceleration disabled.

### Visibility and status invariants

- Every actually visible `working` agent remains animated regardless of which worktree, tab, or pane
  is active. Background work must not look idle merely to save energy.
- Aggregate worktree status remains live when visible; optimization must not replace visible
  background-agent motion with a selected-pane-only policy.
- Indicators may pause only when they cannot be seen: the document is hidden, the sidebar is
  collapsed, or a virtualized row is outside the real viewport rather than merely mounted as
  overscan. They resume when visible again.
- Non-working states remain static. A reduced-motion preference may intentionally override animation
  because it is an explicit accessibility choice.
- Visibility changes must be event-driven. Do not add a polling interval or perpetual JavaScript
  animation-frame loop to manage spinner cadence.

### Least-risk follow-up design

1. Move the working-ring animation into one shared status-indicator primitive/class used by
   aggregate worktree status, individual agent rows, compact summaries, and terminal tabs.
2. Phase-lock visible spinners to one shared stepped cadence, using the CSS/document timeline or a
   one-time phase offset rather than a recurring JavaScript clock. All visible working agents still
   move, but their steps occur together instead of creating staggered paint opportunities.
3. Pause overscan-only worktree rows using the virtualizer's real visible range, while preserving the
   existing mounted overscan needed for smooth scrolling.
4. Pause on document-hidden transitions and resume on visibility restoration. Sidebar collapse
   already unmounts its indicators and should keep doing so.
5. Apply reduced-motion behavior consistently to both `AgentStateDot` and the aggregate
   `StatusIndicator`.
6. Retain the current 12 visible steps per second initially. Compare 12 and 8 phase-locked steps in
   visual and energy measurements; adopt 8 only if it remains perceptually smooth and produces a
   material reduction. Lowering the CSS step count is not assumed to lower Chromium wakeups without
   profiler evidence.

Avoid `setInterval`, a throttled perpetual `requestAnimationFrame`, per-spinner timers, animated
image substitutions, and unconditional `will-change` layer promotion. Those approaches can add
main-thread wakeups, decoding, memory, or compositor layers without proving a net energy win.

## Test plan

Use deterministic fake timers and a manually controlled `requestAnimationFrame` queue.

Scheduler tests will prove:

- many passive tiny foreground chunks produce no write before the frame and one ordered coalesced
  write when it runs;
- interactive traffic stays immediate, and traffic arriving behind a frame-waiting passive prefix
  preserves order while cancelling the stale frame;
- multiple ACK credits coalesced into one write remain deferred until parse and fire exactly once;
- the 32 ms fallback drains when no animation frame runs;
- explicit flush/visibility transitions release frame-waiting output and stale frame callbacks do
  nothing;
- existing overflow, discard, background, synchronized-output, fairness, and large-throughput tests
  continue to pass.

PTY connection tests will prove:

- passive <=2 KiB chunks are frame-batched instead of treated as interactive by size;
- accepted keyboard input keeps echo/redraw output immediate;
- complete and split renderer-query sequences are immediate without recent input, including in an
  inactive split pane;
- native Windows synchronized-output fast and protected paths still meet their existing bounds;
- local/SSH/WSL/remote-runtime transports continue to share the same host-neutral classification
  boundary, with existing transport suites retained for runtime-specific framing and input.

Run focused Vitest suites for the scheduler and PTY connection, then lint/typecheck and the
repository max-lines ratchet in proportion to changed files. Run the existing scheduler e2e spec if
the local Electron test environment is available; otherwise record that remaining validation.

The separate status-animation follow-up should add focused tests proving that visible working agents
animate in active and inactive worktrees, overscan-only rows and hidden documents pause, visibility
restoration resumes at the shared phase, collapsed-sidebar behavior remains unchanged, and
reduced-motion disables both aggregate and per-agent animation. Tests should also prove that no
recurring JavaScript timer or animation-frame loop is introduced.

## Measurement plan

Use a representative visible agent workload that emits timestamped 20-200 byte chunks continuously
for at least five minutes, once with GPU acceleration enabled and once disabled. Keep `caffeinate`
and the agent configuration unchanged. Repeat each baseline and candidate run at least three times
after an idle settling period.

Enable the existing e2e terminal scheduler debug API and record:

- PTY deliveries/chunks generated by the workload;
- `foregroundWriteCount`, `deferredForegroundEnqueueCount`,
  `deferredForegroundWriteCount`, `scheduledDrainCount`, and `drainWrites`;
- xterm `write` calls and viewport refresh/render calls using a local diagnostic wrapper or the
  existing e2e instrumentation;
- peak queued characters and any dropped-backlog count;
- input-to-echo and query-to-reply latency samples, including p50/p95/max;
- renderer CPU time, wakeups/idle wakeups, and energy impact from the platform profiler (macOS
  Instruments Energy Log/Time Profiler, Windows WPA, or Linux `perf`/PowerTOP as available).

Expected result: for passive tiny chunks, xterm writes and foreground drain activations approach the
number of displayed frames rather than the number of PTY deliveries, with byte-for-byte output,
zero additional drops, stable ACK progress, and no material regression in interactive latency.

Status animations must be controlled as a separate variable. Repeat the steady-state portion of the
measurement with:

- one and many working agents, including agents in inactive but visible worktrees;
- compact and full agent rows, with the sidebar open and collapsed;
- the current status animations running and temporarily paused as a diagnostic baseline;
- current staggered phases and the proposed shared phase;
- overscan-only rows present, then explicitly paused; and
- GPU acceleration enabled and disabled.

Measure both a streaming workload and a quiet `working` state where the agent is waiting on a remote
tool and produces no terminal output. Record running animation counts, compositor/BeginFrame cadence,
renderer and GPU-process CPU, raster/paint activity, idle wakeups, and platform energy impact. Multiple
spinners may share compositor frames, so do not extrapolate linearly from element count. If pausing
status animations does not change the quiet baseline, further spinner work is not justified; if it
does, phase synchronization and invisible-row pausing should be evaluated before reducing visible
cadence.

## Rollout risks and mitigations

- **Misclassified protocol query:** use the existing shared query grammar with a cross-chunk tail and
  targeted complete/split-query tests. Do not infer queries from generic escape bytes.
- **ACK starvation:** retain parse-deferred credits and add coalesced-credit/fallback tests. The
  one-shot fallback provides an independent progress bound.
- **Ordering regression when input follows passive output:** release and flush the existing ordered
  queue before parsing the immediate suffix; test both bytes and callbacks.
- **Animation frames suppressed by Electron visibility state:** retain the current foreground/
  background visibility decision and add the 32 ms one-shot fallback.
- **Throughput regression for large floods:** gate only the initial drain; keep current slicing,
  high-priority parse pacing, caps, and throughput benchmark.
- **Windows TUI cursor regression:** leave synchronized-output and refresh policy unchanged and run
  its focused ConPTY tests.
- **Extra frame callbacks after flush/dispose:** cancel the shared gate when no entry is waiting and
  make stale callbacks generation-safe.
- **Misattributed residual wakeups:** visible working indicators can keep the compositor active after
  terminal writes are batched. Hold their state constant and run the status-animation measurement
  matrix before attributing total-process energy changes to this scheduler.
- **Future status visibility regression:** a follow-up must never gate animation on active worktree or
  selected pane. Test inactive visible worktrees and offscreen-to-visible transitions explicitly.

## Rollback strategy

The change is renderer-only and does not alter persisted data, IPC schemas, snapshots, or PTY wire
protocols. Rollback consists of removing the animation-frame wait state and restoring the prior
`scheduleDrain(0)` call for `latencySensitive: false`, plus restoring the <=2 KiB classification
branch. No migration or data repair is required. If classification alone is implicated, retain the
frame gate and temporarily restore the small-chunk fast path; if scheduling is implicated, retain the
evidence-based classifier and return passive output to the current zero-delay drain while collecting
measurements.
