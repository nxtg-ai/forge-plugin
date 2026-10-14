#!/usr/bin/env bash
# Prints the path of the NXTG forge orchestrator binary, or nothing. Exit 0 when found, 1 when not.
#
# Looks beyond PATH on purpose. The documented installer (https://forge.nxtg.ai/install.sh)
# puts forge in ~/.local/bin, which a fresh shell or the process that launches Claude Code may
# not have on its PATH. Order: $FORGE_BIN, PATH, $FORGE_INSTALL_DIR, ~/.local/bin, ~/.cargo/bin.
# Sourced by servers/orchestrator-mcp/start.sh and the pre-task hook, so both agree.

# Only NXTG forge counts. Other CLIs are also named forge (Atlassian's prints a bare version number,
# Laravel's names itself), and `forge mcp` fails in them, which Claude Code shows as a failed server.
# Every NXTG forge release prints `forge X.Y.Z` for --version.
# The probe runs an unknown binary, so it is bounded: FORGE_PROBE_TICKS x 0.05 s (2 s by default), then
# killed, and a slow one counts as not NXTG forge. Background-and-poll, because stock macOS has no
# `timeout` and runs bash 3.2. Output goes to a file, not a pipe, so a child that keeps the pipe open
# cannot hold the probe either.
is_nxtg_forge() {
  local out pid i v rc
  out="$(mktemp "${TMPDIR:-/tmp}/forge-version.XXXXXX" 2>/dev/null)" || out="${TMPDIR:-/tmp}/forge-version.$$.$RANDOM"
  "$1" --version >"$out" 2>/dev/null </dev/null &
  pid=$!
  for ((i = 0; i < ${FORGE_PROBE_TICKS:-40}; i++)); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.05
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null
    wait "$pid" 2>/dev/null
    rm -f "$out"
    return 1
  fi
  wait "$pid"
  rc=$?
  IFS= read -r v <"$out" || true
  rm -f "$out"
  [[ $rc -eq 0 && "$v" =~ ^forge\ [0-9]+\.[0-9]+ ]]
}

# Every executable named forge, in search order.
forge_candidates() {
  local candidate dir
  [[ -n "${FORGE_BIN:-}" && -x "${FORGE_BIN}" ]] && printf '%s\n' "$FORGE_BIN"
  if candidate="$(command -v forge 2>/dev/null)" && [[ -n "$candidate" ]]; then
    printf '%s\n' "$candidate"
  fi
  for dir in "${FORGE_INSTALL_DIR:-}" "${HOME:-}/.local/bin" "${HOME:-}/.cargo/bin"; do
    [[ -n "$dir" && -x "$dir/forge" && ! -d "$dir/forge" ]] && printf '%s\n' "$dir/forge"
  done
  return 0
}

# Sets FORGE_FOUND to the first NXTG forge and FORGE_OTHER to the first rejected candidate (empty when
# none), probing each candidate once. Call it directly, not in $(...), to read both; returns 0 when found.
locate_forge() {
  local candidate seen="|"
  FORGE_FOUND=""
  FORGE_OTHER=""
  while IFS= read -r candidate; do
    [[ "$seen" == *"|$candidate|"* ]] && continue # PATH often resolves to ~/.local/bin/forge too
    seen="$seen$candidate|"
    if is_nxtg_forge "$candidate"; then FORGE_FOUND="$candidate"; return 0; fi
    [[ -n "$FORGE_OTHER" ]] || FORGE_OTHER="$candidate"
  done < <(forge_candidates)
  return 1
}

find_forge() {
  locate_forge || return 1
  printf '%s\n' "$FORGE_FOUND"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  find_forge
fi
