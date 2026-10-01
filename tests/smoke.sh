#!/usr/bin/env bash
# Headless smoke test for Flying Unicorn.
#
#   GODOT_BIN=/path/to/Godot ./tests/smoke.sh
#
# Defaults to /Applications/Godot.app when GODOT_BIN is unset.
# Fails on any engine/SCRIPT error during import or gameplay in both
# orientations. The --quit-after teardown lines ("still in use at exit",
# "ObjectDB instances were leaked") are filtered: they are artifacts of
# the forced quit, not game errors.
set -u
GODOT_BIN="${GODOT_BIN:-/Applications/Godot.app/Contents/MacOS/Godot}"
FRAMES="${SMOKE_FRAMES:-600}"
cd "$(dirname "$0")/.." || exit 1

fail=0
check() { # $1 = label, rest = command
  local label="$1"; shift
  local out
  if ! out="$("$@" 2>&1)"; then
    echo "FAIL: $label (exit $?)"; echo "$out" | tail -5; fail=1; return
  fi
  local errs
  errs="$(echo "$out" | grep -E "ERROR|SCRIPT ERROR" | grep -vE "still in use at exit|ObjectDB instances were leaked" || true)"
  if [ -n "$errs" ]; then
    echo "FAIL: $label (errors)"; echo "$errs" | head -10; fail=1; return
  fi
  echo "ok: $label"
}

check "version" "$GODOT_BIN" --version
check "import" "$GODOT_BIN" --headless --path . --import
check "gameplay landscape" "$GODOT_BIN" --headless --path . --quit-after "$FRAMES" -- --autostart
check "gameplay portrait" "$GODOT_BIN" --headless --resolution 540x960 --path . --quit-after "$FRAMES" -- --autostart

[ "$fail" = 0 ] && echo "SMOKE PASS" || { echo "SMOKE FAIL"; exit 1; }
