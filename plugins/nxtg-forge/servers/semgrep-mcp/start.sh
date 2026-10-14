#!/usr/bin/env bash
# Semgrep MCP launcher (optional SAST tools).
# Runs semgrep-mcp if installed, else via uvx. With neither, starts a stand-in that says what
# to install instead of failing: Claude Code caches a failed start for 15 minutes.
#
# The upstream can also die at startup on its own: the published semgrep-mcp 0.9.0 exits 1 at
# import (a pydantic ImportError) before it answers, which Claude Code shows as "MCP server
# failed". So the upstream runs behind a guard: everything the client sends is buffered and
# forwarded; if the upstream exits before writing its first stdout line, the buffer is replayed
# to the stand-in and the rest of stdin follows it. Once the upstream has answered, both
# directions are relayed unchanged until either side closes.
#
# Written for bash 3.2, because .mcp.json runs plain `bash` and that is /bin/bash 3.2 on macOS:
# no coproc, no {fd} allocation, no fractional `read -t`. The parts talk through signals:
#
#   launcher (this shell, $$): waits; relays USR1/USR2 to the session; on TERM/INT/HUP it kills
#       the session's whole process group, so nothing outlives it.
#   session (a background job, its own process group under `set -m`): reads stdin line by line,
#       keeps a copy until the upstream answers, writes each line to the upstream on fd 3.
#   watcher (reads the upstream's stdout): first full line -> prints it, USR2 ("answered"), then
#       copies the rest; stdout closed with no line -> USR1 ("fall back"); upstream done -> HUP.
#
# `read` on a pipe takes one byte at a time, so nothing is read past what is handed on, and a
# trapped signal runs its trap while `read` waits (checked on bash 3.2.57 and 5.1).

set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
STANDIN="$HERE/../lib/unavailable-mcp.sh"

# watch: stdin = the upstream's stdout. Runs in a subshell, where $$ is still the launcher.
watch() {
  local line
  if IFS= read -r line; then
    printf '%s\n' "$line"
    kill -USR2 $$ 2>/dev/null
    cat
    kill -HUP $$ 2>/dev/null
  else
    kill -USR1 $$ 2>/dev/null
  fi
}

# session <retry-hint> <command...>: the background job; stdin = the client's stdin.
session() {
  local hint="$1"
  shift
  local -a buf
  buf=()
  local line answered=0 in_open=1
  exec 5<&-

  on_answer() {
    answered=1
    buf=()
  }
  on_fall_back() {
    trap - PIPE USR1 USR2
    exec 3>&-
    echo "[semgrep-mcp] upstream exited before answering; serving the stand-in" >&2
    {
      if ((${#buf[@]})); then printf '%s\n' "${buf[@]}"; fi
      if ((in_open)); then cat; fi
    } | bash "$STANDIN" semgrep-mcp \
      "semgrep-mcp exited at startup before it answered, so Semgrep tools are off for this session; the published package may be broken. To see the error, run: $hint. Once it starts, open a new Claude Code session."
    exit 0
  }
  trap on_answer USR2
  trap on_fall_back USR1

  exec 3> >({ "$@"; echo "[semgrep-mcp] upstream exited with code $?" >&2; } | watch)
  trap '' PIPE # a write to an upstream that already died must fail, not end the session

  while IFS= read -r line || [[ -n "$line" ]]; do
    ((answered)) || buf+=("$line")
    printf '%s\n' "$line" >&3 2>/dev/null
  done
  in_open=0
  exec 3>&- # the upstream sees EOF
  # Stay until the watcher decides: a fall back replays the buffer and exits; after an answer the
  # launcher stops the session once the upstream is done. `wait` returns as soon as a trap fires.
  while :; do
    sleep 1 &
    wait $! 2>/dev/null
  done
}

# guard <retry-hint> <command...>
guard() {
  # Job control gives the session its own process group, so a signal reaches every process in
  # it. Skipped on a terminal, where a background job reading the terminal would be stopped.
  [ -t 0 ] || set -m
  exec 5<&0
  session_pid=""
  pending=""
  relay() {
    if [ -n "$session_pid" ]; then kill -"$1" "$session_pid" 2>/dev/null; else pending="$pending $1"; fi
  }
  stop() {
    trap '' TERM INT HUP USR1 USR2
    if [ -n "$session_pid" ]; then
      kill -TERM -- "-$session_pid" 2>/dev/null || kill -TERM "$session_pid" 2>/dev/null
    fi
    exit "$1"
  }
  trap 'relay USR1' USR1
  trap 'relay USR2' USR2
  trap 'stop 0' HUP # the upstream finished after answering: the session is over
  trap 'stop 143' TERM
  trap 'stop 130' INT

  (session "$@") <&5 &
  session_pid=$!
  exec 5<&-
  for sig in $pending; do relay "$sig"; done
  while kill -0 "$session_pid" 2>/dev/null; do
    wait "$session_pid"
  done
  exit 0
}

if command -v semgrep-mcp >/dev/null 2>&1; then
  guard "semgrep-mcp (to update it: pip install --upgrade semgrep-mcp)" semgrep-mcp
fi
if command -v uvx >/dev/null 2>&1; then
  guard "uvx --refresh semgrep-mcp" uvx semgrep-mcp
fi

exec bash "$STANDIN" semgrep-mcp \
  "Semgrep MCP tools are optional and need uv or semgrep-mcp. To add them, install uv (https://docs.astral.sh/uv/) or run: pip install semgrep-mcp, then start a new Claude Code session."
