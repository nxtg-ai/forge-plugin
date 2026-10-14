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
# Pure bash on purpose: a machine with uv need not have node or a system python. `read` on a
# pipe takes one byte at a time, so nothing is read past what is handed on.

set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
STANDIN="$HERE/../lib/unavailable-mcp.sh"

# guard <retry-hint> <command...>
guard() {
  local hint="$1"
  shift
  # coproc and {fd} redirections need bash 4.1 (macOS /bin/bash is 3.2): run unguarded there.
  if ((BASH_VERSINFO[0] < 4 || (BASH_VERSINFO[0] == 4 && BASH_VERSINFO[1] < 1))); then
    exec "$@"
  fi

  local in_fd up_out up_in fd up_pid
  exec {in_fd}<&0
  coproc UPSTREAM { exec "$@"; }
  up_pid=$UPSTREAM_PID
  # Private copies: bash closes a coproc's own descriptors when it reaps the process.
  exec {up_out}<&"${UPSTREAM[0]}" {up_in}>&"${UPSTREAM[1]}"
  fd=${UPSTREAM[0]}; exec {fd}<&-
  fd=${UPSTREAM[1]}; exec {fd}>&-

  local fwd=""
  trap 'kill "$up_pid" ${fwd:+"$fwd"} 2>/dev/null; exit 143' TERM INT HUP
  trap '' PIPE # a write to an upstream that already died must fail, not kill the launcher

  local -a buf=()
  local in_acc="" up_acc="" part rc in_open=1 answered=0 wait_s
  while :; do
    if ((in_open)); then
      if IFS= read -r -t 0.05 -u "$in_fd" part; then
        buf+=("$in_acc$part")
        printf '%s\n' "$in_acc$part" >&"$up_in" 2>/dev/null
        in_acc=""
      else
        rc=$?
        in_acc+="$part" # a timeout keeps the partial line
        if ((rc <= 128)); then # stdin closed
          in_open=0
          if [[ -n "$in_acc" ]]; then
            buf+=("$in_acc")
            printf '%s\n' "$in_acc" >&"$up_in" 2>/dev/null
            in_acc=""
          fi
          exec {up_in}>&-
        fi
      fi
    fi
    wait_s=0.05
    ((in_open)) || wait_s=1
    if IFS= read -r -t "$wait_s" -u "$up_out" part; then
      printf '%s\n' "$up_acc$part"
      answered=1
      break
    fi
    rc=$?
    up_acc+="$part"
    ((rc <= 128)) && break # upstream closed its stdout without a full line
  done

  if ((answered)); then
    [[ -n "$in_acc" ]] && printf '%s' "$in_acc" >&"$up_in" 2>/dev/null # still under the PIPE ignore
    trap - PIPE
    if ((in_open)); then
      cat <&"$in_fd" >&"$up_in" &
      fwd=$!
      exec {up_in}>&-
    fi
    exec {in_fd}<&-
    cat <&"$up_out"
    wait "$up_pid"
    rc=$?
    [[ -n "$fwd" ]] && kill "$fwd" 2>/dev/null
    exit "$rc"
  fi

  # The upstream exited (or closed stdout) before answering: the stand-in takes over.
  trap - PIPE
  exec {up_out}<&-
  ((in_open)) && exec {up_in}>&-
  # Give it up to 2 s to finish exiting (uvx outlives its python by a moment), so the exit code
  # in the reason is the real one; then stop it. `read <> <(:)` is a pure-bash sleep.
  local i
  for ((i = 0; i < 40; i++)); do
    kill -0 "$up_pid" 2>/dev/null || break
    read -r -t 0.05 part <> <(:) 2>/dev/null
  done
  kill "$up_pid" 2>/dev/null
  wait "$up_pid"
  rc=$?
  trap - TERM INT HUP
  echo "[semgrep-mcp] upstream exited with code $rc before answering; serving the stand-in" >&2
  {
    ((${#buf[@]})) && printf '%s\n' "${buf[@]}"
    if ((in_open)); then
      printf '%s' "$in_acc"
      cat <&"$in_fd"
    fi
  } | bash "$STANDIN" semgrep-mcp \
    "semgrep-mcp exited at startup (exit code $rc) before it answered, so Semgrep tools are off for this session; the published package may be broken. To see the error, run: $hint. Once it starts, open a new Claude Code session."
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
