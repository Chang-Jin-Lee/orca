#!/bin/bash
# Renderer energy A/B for terminal output scheduling (macOS only — uses the
# per-process %CPU / idle-wakeup / energy-impact columns of `top`; use WPA on
# Windows or perf/PowerTOP on Linux with the same workload spec).
#
# Usage: config/scripts/terminal-output-watt-ab-macos.sh [baseline-ref] [seconds]
#
# Runs tests/e2e/watt-ab-workload.spec.ts headful on a temp worktree of the
# baseline ref ("before") and on the current checkout ("after"), streaming
# ~250 tiny PTY chunks/s through a visible terminal, and samples the target
# renderer/GPU PIDs during the steady-state window. The baseline worktree
# reuses this checkout's node_modules, so pick a ref with compatible deps.
set -euo pipefail

if [ "$(uname)" != "Darwin" ]; then
  echo "This sampler relies on macOS top; see docs/reference/2026-07-13-terminal-output-energy-optimization.md for Windows/Linux tooling."
  exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
BASELINE_REF="${1:-main}"
SECONDS_PER_PHASE="${2:-90}"
# Why the floor: SAMPLES must stay positive — `top -l 0` samples forever and
# a tiny window leaves fewer than the 3 records the summary requires.
if [ "$SECONDS_PER_PHASE" -lt 35 ]; then
  echo "seconds-per-phase must be >= 35 (sampling window is seconds - 25)"
  exit 1
fi
SAMPLES=$((SECONDS_PER_PHASE - 25))
BASELINE_DIR="$(mktemp -d /tmp/orca-watt-baseline.XXXXXX)"
rmdir "$BASELINE_DIR"

cleanup() {
  git -C "$REPO_DIR" worktree remove --force "$BASELINE_DIR" 2>/dev/null || true
}
trap cleanup EXIT

echo "== preparing baseline worktree ($BASELINE_REF) at $BASELINE_DIR =="
git -C "$REPO_DIR" worktree add --detach "$BASELINE_DIR" "$BASELINE_REF"
ln -sfn "$REPO_DIR/node_modules" "$BASELINE_DIR/node_modules"
cp "$REPO_DIR/tests/e2e/watt-ab-workload.spec.ts" "$BASELINE_DIR/tests/e2e/"

find_pid() {
  local type_flag="$1" dir="$2" best_pid="" best_cpu="0.0"
  for pid in $(pgrep -f -- "--type=$type_flag" || true); do
    local cmd
    cmd=$(ps -p "$pid" -o command= 2>/dev/null || true)
    case "$cmd" in
      *"$dir"*)
        local cpu
        cpu=$(ps -p "$pid" -o %cpu= 2>/dev/null | tr -d ' ' || echo 0)
        if [ -z "$best_pid" ] || [ "$(echo "$cpu > $best_cpu" | bc)" = "1" ]; then
          best_pid="$pid"
          best_cpu="$cpu"
        fi
        ;;
    esac
  done
  echo "$best_pid"
}

run_phase() {
  local name="$1" dir="$2"
  echo ""
  echo "== phase '$name' ($dir): building + launching (an app window will appear) =="
  rm -f "/tmp/watt-ab-started-$name" "/tmp/watt-ab-finished-$name"
  (
    cd "$dir" &&
      WATT_AB_SECONDS="$SECONDS_PER_PHASE" WATT_AB_PHASE="$name" \
        npx playwright test tests/e2e/watt-ab-workload.spec.ts \
        --config tests/playwright.config.ts --project electron-headful \
        --workers=1 --reporter=list >"/tmp/watt-ab-$name.spec.log" 2>&1
  ) &
  local SPEC_PID=$!

  local waited=0
  until [ -f "/tmp/watt-ab-started-$name" ]; do
    sleep 2
    waited=$((waited + 2))
    if [ "$waited" -gt 420 ] || ! kill -0 "$SPEC_PID" 2>/dev/null; then
      echo "phase '$name' failed to start streaming; see /tmp/watt-ab-$name.spec.log"
      kill "$SPEC_PID" 2>/dev/null || true
      return 1
    fi
  done
  sleep 4
  local RENDERER_PID GPU_PID
  RENDERER_PID=$(find_pid renderer "$dir")
  GPU_PID=$(find_pid gpu-process "$dir")
  if [ -z "$RENDERER_PID" ]; then
    echo "phase '$name': could not find renderer PID"
    kill "$SPEC_PID" 2>/dev/null || true
    return 1
  fi
  echo "-- sampling renderer pid=$RENDERER_PID gpu pid=${GPU_PID:-none} for ${SAMPLES}s --"
  local top_args=(-l $((SAMPLES + 1)) -s 1 -stats pid,cpu,idlew,power -pid "$RENDERER_PID")
  if [ -n "$GPU_PID" ]; then
    top_args+=(-pid "$GPU_PID")
  fi
  top "${top_args[@]}" >"/tmp/watt-ab-$name.top.log" 2>/dev/null
  echo "$RENDERER_PID ${GPU_PID:-0}" >"/tmp/watt-ab-$name.pids"
  wait "$SPEC_PID" || {
    echo "phase '$name' spec failed; see /tmp/watt-ab-$name.spec.log"
    return 1
  }
  echo "-- phase '$name' complete --"
}

run_phase before "$BASELINE_DIR"
run_phase after "$REPO_DIR"

echo ""
echo "== results (mean per 1s top sample, first cumulative sample skipped) =="
python3 - <<'PY'
import statistics

def collect(phase):
    renderer_pid, gpu_pid = open(f"/tmp/watt-ab-{phase}.pids").read().split()
    stats = {renderer_pid: {"cpu": [], "idlew": [], "power": []}}
    if gpu_pid != "0":
        stats[gpu_pid] = {"cpu": [], "idlew": [], "power": []}
    for line in open(f"/tmp/watt-ab-{phase}.top.log", errors="ignore"):
        tokens = line.split()
        if len(tokens) < 4 or tokens[0] not in stats:
            continue
        try:
            cpu, idlew, power = float(tokens[1]), float(tokens[2]), float(tokens[3])
        except ValueError:
            continue
        entry = stats[tokens[0]]
        entry["cpu"].append(cpu)
        entry["idlew"].append(idlew)
        entry["power"].append(power)
    result = {}
    for label, pid in (("renderer", renderer_pid), ("gpu", gpu_pid)):
        if pid == "0" or pid not in stats or len(stats[pid]["cpu"]) < 3:
            continue
        # First top record reports cumulative totals since process start.
        entry = {
            key: (statistics.mean(vals[1:]), statistics.stdev(vals[1:]))
            for key, vals in stats[pid].items()
            if key != "idlew"
        }
        # idlew stays cumulative in every record; report the in-window rate.
        wakeups = stats[pid]["idlew"][1:]
        entry["idlew"] = ((wakeups[-1] - wakeups[0]) / (len(wakeups) - 1), 0.0)
        result[label] = entry
    return result

before, after = collect("before"), collect("after")
print(f"{'metric':<24}{'before':>16}{'after':>17}{'delta':>9}")
for proc in ("renderer", "gpu"):
    for key, label in (("cpu", "%CPU"), ("idlew", "idle wakeups/s"), ("power", "energy impact")):
        b = before.get(proc, {}).get(key)
        a = after.get(proc, {}).get(key)
        if not b or not a:
            continue
        delta = (a[0] - b[0]) / b[0] * 100 if b[0] else float("nan")
        print(
            f"{proc + ' ' + label:<24}"
            f"{b[0]:>10.1f}±{b[1]:<5.1f}{a[0]:>10.1f}±{a[1]:<5.1f}{delta:>8.1f}%"
        )
print("\nraw logs: /tmp/watt-ab-before.top.log /tmp/watt-ab-after.top.log")
PY
