#!/bin/bash
# Quiet-state spinner energy diagnostic (macOS only — uses the per-process
# %CPU / idle-wakeup / energy-impact columns of `top`).
#
# Usage: config/scripts/quiet-spinner-ab-macos.sh [seconds-per-phase]
#
# Runs tests/e2e/quiet-spinner-diagnostic.spec.ts headful on the current
# checkout with NO terminal output and samples the renderer/GPU PIDs across
# four phases: idle, staggered spinners, phase-locked spinners, paused.
set -euo pipefail

if [ "$(uname)" != "Darwin" ]; then
  echo "This sampler relies on macOS top."
  exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SECONDS_PER_PHASE="${1:-60}"
if [ "$SECONDS_PER_PHASE" -lt 10 ]; then
  echo "seconds-per-phase must be >= 10"
  exit 1
fi
PHASES=(idle staggered locked paused)

rm -f /tmp/quiet-ab-idle /tmp/quiet-ab-staggered /tmp/quiet-ab-locked /tmp/quiet-ab-paused

echo "== launching quiet diagnostic app (a window will appear; leave it alone) =="
(
  cd "$REPO_DIR" &&
    QUIET_AB=1 QUIET_AB_SECONDS="$SECONDS_PER_PHASE" \
      npx playwright test tests/e2e/quiet-spinner-diagnostic.spec.ts \
      --config tests/playwright.config.ts --project electron-headful \
      --workers=1 --reporter=list >/tmp/quiet-ab.spec.log 2>&1
) &
SPEC_PID=$!

find_pid() {
  local type_flag="$1" best_pid="" best_cpu="0.0"
  for pid in $(pgrep -f -- "--type=$type_flag" || true); do
    local cmd
    cmd=$(ps -p "$pid" -o command= 2>/dev/null || true)
    case "$cmd" in
      *"$REPO_DIR"*)
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

waited=0
until [ -f /tmp/quiet-ab-idle ]; do
  sleep 2
  waited=$((waited + 2))
  if [ "$waited" -gt 420 ] || ! kill -0 "$SPEC_PID" 2>/dev/null; then
    echo "diagnostic app failed to reach idle phase; see /tmp/quiet-ab.spec.log"
    kill "$SPEC_PID" 2>/dev/null || true
    exit 1
  fi
done
sleep 2
RENDERER_PID=$(find_pid renderer)
GPU_PID=$(find_pid gpu-process)
if [ -z "$RENDERER_PID" ]; then
  echo "could not find renderer PID"
  kill "$SPEC_PID" 2>/dev/null || true
  exit 1
fi
echo "-- renderer pid=$RENDERER_PID gpu pid=${GPU_PID:-none} --"
echo "$RENDERER_PID ${GPU_PID:-0}" >/tmp/quiet-ab.pids

for phase in "${PHASES[@]}"; do
  waited=0
  until [ -f "/tmp/quiet-ab-$phase" ]; do
    sleep 1
    waited=$((waited + 1))
    if [ "$waited" -gt 180 ] || ! kill -0 "$SPEC_PID" 2>/dev/null; then
      echo "phase '$phase' never started; see /tmp/quiet-ab.spec.log"
      kill "$SPEC_PID" 2>/dev/null || true
      exit 1
    fi
  done
  echo "-- sampling phase '$phase' for ${SECONDS_PER_PHASE}s --"
  top_args=(-l $((SECONDS_PER_PHASE + 1)) -s 1 -stats pid,cpu,idlew,power -pid "$RENDERER_PID")
  if [ -n "$GPU_PID" ]; then
    top_args+=(-pid "$GPU_PID")
  fi
  top "${top_args[@]}" >"/tmp/quiet-ab-$phase.top.log" 2>/dev/null
done

wait "$SPEC_PID" || {
  echo "spec exited non-zero; see /tmp/quiet-ab.spec.log"
  exit 1
}

echo ""
echo "== results (mean per 1s top sample, first cumulative sample skipped) =="
python3 - <<'PY'
import statistics

renderer_pid, gpu_pid = open("/tmp/quiet-ab.pids").read().split()

def collect(phase):
    stats = {renderer_pid: {"cpu": [], "idlew": [], "power": []}}
    if gpu_pid != "0":
        stats[gpu_pid] = {"cpu": [], "idlew": [], "power": []}
    for line in open(f"/tmp/quiet-ab-{phase}.top.log", errors="ignore"):
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
        entry = {
            key: (statistics.mean(vals[1:]), statistics.stdev(vals[1:]))
            for key, vals in stats[pid].items()
            if key != "idlew"
        }
        # idlew is cumulative since process start; report the in-window rate.
        wakeups = stats[pid]["idlew"][1:]
        entry["idlew"] = ((wakeups[-1] - wakeups[0]) / (len(wakeups) - 1), 0.0)
        result[label] = entry
    return result

phases = ["idle", "staggered", "locked", "paused"]
data = {phase: collect(phase) for phase in phases}
header = f"{'metric':<26}" + "".join(f"{phase:>18}" for phase in phases)
print(header)
for proc in ("renderer", "gpu"):
    for key, label in (("cpu", "%CPU"), ("idlew", "idle wakeups/s"), ("power", "energy impact")):
        cells = []
        for phase in phases:
            entry = data[phase].get(proc, {}).get(key)
            if not entry:
                cells.append(f"{'n/a':>17}")
            elif key == "idlew":
                cells.append(f"{entry[0]:>14.1f}/s ")
            else:
                cells.append(f"{entry[0]:>10.1f}±{entry[1]:<6.1f}")
        if all(cell.strip() == "n/a" for cell in cells):
            continue
        print(f"{proc + ' ' + label:<26}" + "".join(cells))
print("\nraw logs: /tmp/quiet-ab-<phase>.top.log")
PY
