#!/bin/bash
#
# NXTG-Forge enforced task: hook entry for scripts/forge-task.mjs (DIRECTIVE-NXTG-20261013-16 A).
#   task-enforce.sh guard   PreToolUse  (Write|Edit|MultiEdit|NotebookEdit|Bash)  exit 2 = refused
#   task-enforce.sh gate    Stop        prints {"decision":"block",...} while the task is not done
#   task-enforce.sh auto    UserPromptSubmit  begins a task when FORGE_ENFORCE or .claude/forge-enforce.json asks
#
# A strict no-op, without starting node, unless a Forge task is active (or, for auto, requested).
# With a task active and no node, the guard refuses and the gate blocks: it never allows because it
# could not check.

MODE="$1"
SD="${FORGE_TASK_STATE_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/nxtg-forge/tasks}"
ENGINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/forge-task.mjs"

if [ "$MODE" = "auto" ]; then
    ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
    if [ -z "${FORGE_ENFORCE:-}" ] && [ ! -f "$ROOT/.claude/forge-enforce.json" ]; then exit 0; fi
    command -v node >/dev/null 2>&1 || { echo "[Forge] Enforcement was requested but node is not installed; no task began."; exit 0; }
    exec node "$ENGINE" auto
fi

# Fast path: no active task anywhere -> nothing to enforce.
grep -lqs '"status": "active"' "$SD"/*.json 2>/dev/null || exit 0

if ! command -v node >/dev/null 2>&1; then
    if [ "$MODE" = "guard" ]; then
        echo "FORGE TASK GUARD: a Forge task is active but node is not installed, so the guard cannot check this call. Refused." >&2
        exit 2
    fi
    printf '%s' '{"decision":"block","reason":"FORGE TASK GATE: a Forge task is active but node is not installed, so the gate cannot run the tests. Not done."}'
    exit 0
fi
exec node "$ENGINE" "$MODE"
