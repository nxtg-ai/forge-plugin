#!/usr/bin/env bash
# Portable checks for servers/semgrep-mcp/start.sh, written for bash 3.2 (stock macOS /bin/bash).
# Run it with the bash under test; the launcher and the fake upstreams run under the same `bash`.
# launchers.test.mjs runs it with this machine's bash, and inside the official `bash:3.2` image.
#
# Usage: semgrep-guard-check.sh <start.sh> <unavailable-mcp.sh>
# Prints PASS/FAIL per check; exit status = number of failures. Linux only (reads /proc).
set -u
L="$1"
STANDIN="$2"
echo "bash $BASH_VERSION"

T="$(mktemp -d)"
mkdir "$T/crash" "$T/slow" "$T/live" "$T/hang"
cleanup() {
  rm -f "$T"/crash/uvx "$T"/slow/uvx "$T"/live/uvx "$T"/hang/uvx "$T"/out "$T"/err
  rmdir "$T"/crash "$T"/slow "$T"/live "$T"/hang "$T"
}
trap cleanup EXIT

IMPORT_ERROR="ImportError: cannot import name 'eval_type_backport' from 'pydantic._internal._typing_extra'"
printf '#!/usr/bin/env bash\necho "%s" >&2\nexit 1\n' "$IMPORT_ERROR" > "$T/crash/uvx"
printf '#!/usr/bin/env bash\nsleep 1\necho "%s" >&2\nexit 1\n' "$IMPORT_ERROR" > "$T/slow/uvx"
printf '#!/usr/bin/env bash\nexec bash "%s" semgrep-upstream-live "fake upstream"\n' "$STANDIN" > "$T/live/uvx"
# Answers discover and initialize, then keeps running without reading stdin.
cat > "$T/hang/uvx" <<'H'
#!/usr/bin/env bash
IFS= read -r l
echo '{"jsonrpc":"2.0","id":"server-discover-probe-1","error":{"code":-32601,"message":"nope"}}'
IFS= read -r l
echo '{"jsonrpc":"2.0","id":0,"result":{"protocolVersion":"2025-06-18","capabilities":{},"serverInfo":{"name":"hang-upstream","version":"1"}}}'
sleep 600
H
chmod +x "$T"/*/uvx

D='{"jsonrpc":"2.0","id":"server-discover-probe-1","method":"server/discover","params":{}}'
I='{"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}},"jsonrpc":"2.0","id":0}'
LIST='{"method":"tools/list","jsonrpc":"2.0","id":"a1"}'
EMPTY_LIST='{"jsonrpc":"2.0","id":"a1","result":{"tools":[]}}'

fails=0
pass() { echo "PASS $1"; }
fail() { echo "FAIL $1: $2"; fails=$((fails + 1)); }
line() { sed -n "${1}p" "$T/out"; }
nlines() { grep -c . "$T/out"; }

# The stand-in must have answered discover (-32601), initialize and tools/list, and exited 0.
expect_standin() {  # <name> <rc>
  local n="$1" rc="$2"
  [ "$rc" = 0 ] || { fail "$n" "launcher exit $rc, stdout=$(head -c 200 "$T/out") stderr=$(tail -2 "$T/err")"; return; }
  [ "$(nlines)" = 3 ] || { fail "$n" "expected 3 replies, got $(nlines): $(head -c 300 "$T/out")"; return; }
  case "$(line 1)" in *'"id":"server-discover-probe-1"'*'"code":-32601'*) ;; *) fail "$n" "discover reply: $(line 1)"; return ;; esac
  case "$(line 2)" in *'"id":0'*'"serverInfo":{"name":"semgrep-mcp","version":"unavailable"}'*'semgrep-mcp exited at startup'*) ;;
    *) fail "$n" "initialize reply: $(line 2)"; return ;; esac
  [ "$(line 3)" = "$EMPTY_LIST" ] || { fail "$n" "tools/list reply: $(line 3)"; return; }
  pass "$n"
}

# 1. Upstream crashes at import; stdin stays open, as with Claude Code.
{ printf '%s\n%s\n' "$D" "$I"; sleep 2; printf '%s\n' "$LIST"; sleep 1; } |
  PATH="$T/crash:$PATH" bash "$L" > "$T/out" 2> "$T/err"
expect_standin "crash-stdin-open" $?

# 2. Upstream crashes at import; every frame sent and stdin closed at once.
printf '%s\n%s\n%s\n' "$D" "$I" "$LIST" | PATH="$T/crash:$PATH" bash "$L" > "$T/out" 2> "$T/err"
expect_standin "crash-stdin-closed" $?

# 3. Upstream exits 1 after 1 s; the frames sent meanwhile are replayed to the stand-in.
{ printf '%s\n%s\n' "$D" "$I"; sleep 3; printf '%s\n' "$LIST"; sleep 1; } |
  PATH="$T/slow:$PATH" bash "$L" > "$T/out" 2> "$T/err"
expect_standin "slow-crash-replay" $?

# 4. A working upstream is relayed and the stand-in does not engage.
{ printf '%s\n%s\n' "$D" "$I"; sleep 1; printf '%s\n' "$LIST"; sleep 1; } |
  PATH="$T/live:$PATH" bash "$L" > "$T/out" 2> "$T/err"
rc=$?
if [ "$rc" = 0 ] && [ "$(nlines)" = 3 ] && grep -q '"name":"semgrep-upstream-live"' "$T/out" &&
  [ "$(line 3)" = "$EMPTY_LIST" ] && ! grep -q 'exited at startup' "$T/out" "$T/err"; then
  pass "green-path-relay"
else
  fail "green-path-relay" "rc=$rc out=$(head -c 300 "$T/out")"
fi

# Every live descendant of a pid (zombies excluded), from /proc.
descendants() {
  local want="$1" f st pid ppid rest found=1
  local -a tree
  tree=("$want")
  while [ "$found" = 1 ]; do
    found=0
    for f in /proc/[0-9]*/stat; do
      read -r pid rest < "$f" 2>/dev/null || continue
      rest="${rest##*) }"; st="${rest%% *}"; rest="${rest#* }"; ppid="${rest%% *}"
      [ "$st" = Z ] && continue
      case " ${tree[*]} " in *" $pid "*) continue ;; esac
      case " ${tree[*]} " in *" $ppid "*) tree=("${tree[@]}" "$pid"); found=1 ;; esac
    done
  done
  echo "${tree[@]:1}"
}
alive() {  # print the pids among $@ that still run (not zombies)
  local p st rest out=""
  for p in "$@"; do
    read -r rest < "/proc/$p/stat" 2>/dev/null || continue
    rest="${rest##*) }"; st="${rest%% *}"
    [ "$st" = Z ] || out="$out $p"
  done
  echo "$out"
}

# 5/6. SIGTERM to the launcher ends it and its whole process tree, in both phases.
term_check() {  # <name> <fake dir>
  local n="$1" dir="$2" lp kids left
  # The feeder keeps stdin open and stops on SIGPIPE once the launcher is gone.
  { printf '%s\n%s\n' "$D" "$I"; while sleep 1; do echo; done; } 2>/dev/null |
    PATH="$dir:$PATH" bash "$L" > "$T/out" 2> "$T/err" &
  lp=$!
  sleep 2
  kids="$(descendants "$lp")"
  if [ "$(nlines)" -lt 2 ]; then
    fail "$n" "phase not reached: $(head -c 300 "$T/out")"
  elif [ -z "$kids" ]; then
    fail "$n" "launcher $lp had no children to check"
  else
    kill -TERM "$lp"
    sleep 2
    # shellcheck disable=SC2086
    left="$(alive "$lp" $kids)"
    if [ -z "${left// /}" ]; then
      pass "$n (children were:$kids)"
    else
      fail "$n" "survivors after SIGTERM:$left (of $lp $kids)"
    fi
  fi
  # shellcheck disable=SC2086
  kill -KILL $lp $kids 2>/dev/null
  wait 2>/dev/null
}
term_check "sigterm-green-phase" "$T/hang"
term_check "sigterm-standin-phase" "$T/crash"

echo "failures: $fails"
exit "$fails"
