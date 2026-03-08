#!/bin/bash
#
# CEO-LOOP Stop Hook — ORBIT Loop Persistence
#
# Keeps the CEO Decision Loop alive across iterations.
# When CEO-LOOP is active, intercepts Claude Code's Stop event,
# increments the iteration counter, reads progress context, and
# re-feeds an adaptive prompt to continue the ORBIT cycle.
#
# CRITICAL: This hook is a strict NO-OP when CEO-LOOP is not active.
# It must never interfere with normal Forge sessions.
#
# Claude Code hook contract:
#   - Exit 0: allow Claude to stop normally
#   - Output JSON {"decision":"block","reason":"..."}: re-feed prompt and continue
#

# Do NOT use set -e — we want to fail silently and pass through
# Do NOT use set -u — env vars may be absent

# Determine project root (same as lib.sh pattern)
PROJECT_ROOT="$(pwd)"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
STATE_FILE="$CLAUDE_DIR/ceo-loop-state.json"
PROGRESS_FILE="$CLAUDE_DIR/ceo-loop-progress.md"
PENDING_FILE="$CLAUDE_DIR/ceo-decisions-pending.json"
DECISIONS_FILE="$CLAUDE_DIR/ceo-loop-decisions.jsonl"

# ── Guard 1: state file must exist ──────────────────────────────────────────
if [ ! -f "$STATE_FILE" ]; then
    exit 0  # No CEO-LOOP active — pass through
fi

# ── Guard 2: jq must be available ───────────────────────────────────────────
if ! command -v jq &>/dev/null; then
    exit 0  # Can't parse JSON — pass through safely
fi

# ── Guard 3: active must be true ────────────────────────────────────────────
ACTIVE=$(jq -r '.active // false' "$STATE_FILE" 2>/dev/null)
if [ "$ACTIVE" != "true" ]; then
    exit 0  # Loop is inactive — pass through
fi

# ── Read current state ───────────────────────────────────────────────────────
ITERATION=$(jq -r '.iteration // 0' "$STATE_FILE" 2>/dev/null)
MAX_ITERATIONS=$(jq -r '.max_iterations // 20' "$STATE_FILE" 2>/dev/null)
TIME_LIMIT=$(jq -r '.time_limit_minutes // 30' "$STATE_FILE" 2>/dev/null)
STARTED_AT=$(jq -r '.started_at // ""' "$STATE_FILE" 2>/dev/null)
TRUST_LEVEL=$(jq -r '.trust_level // "standard"' "$STATE_FILE" 2>/dev/null)
CORRECT=$(jq -r '.correct_decisions // 0' "$STATE_FILE" 2>/dev/null)
INCORRECT=$(jq -r '.incorrect_decisions // 0' "$STATE_FILE" 2>/dev/null)

# ── TURN: Check 1 — max iterations ──────────────────────────────────────────
if [ "$ITERATION" -ge "$MAX_ITERATIONS" ] 2>/dev/null; then
    # Mark inactive and allow exit
    jq '.active = false' "$STATE_FILE" > "$STATE_FILE.tmp" 2>/dev/null \
        && mv "$STATE_FILE.tmp" "$STATE_FILE"
    exit 0
fi

# ── TURN: Check 2 — time limit ──────────────────────────────────────────────
if [ -n "$STARTED_AT" ] && command -v python3 &>/dev/null; then
    ELAPSED=$(python3 -c "
import sys, datetime
try:
    start = datetime.datetime.fromisoformat('${STARTED_AT}'.replace('Z','+00:00'))
    now = datetime.datetime.now(datetime.timezone.utc)
    print(int((now - start).total_seconds() / 60))
except:
    print(0)
" 2>/dev/null)
    if [ -n "$ELAPSED" ] && [ "$ELAPSED" -ge "$TIME_LIMIT" ] 2>/dev/null; then
        jq '.active = false' "$STATE_FILE" > "$STATE_FILE.tmp" 2>/dev/null \
            && mv "$STATE_FILE.tmp" "$STATE_FILE"
        exit 0
    fi
else
    ELAPSED=0
fi

# ── Increment iteration counter ──────────────────────────────────────────────
NEXT_ITERATION=$((ITERATION + 1))
jq --argjson n "$NEXT_ITERATION" '.iteration = $n' "$STATE_FILE" \
    > "$STATE_FILE.tmp" 2>/dev/null \
    && mv "$STATE_FILE.tmp" "$STATE_FILE"

# ── Read progress context ────────────────────────────────────────────────────
PROGRESS_SUMMARY=""
if [ -f "$PROGRESS_FILE" ]; then
    # Extract last iteration summary (first 20 lines captures the key sections)
    PROGRESS_SUMMARY=$(head -30 "$PROGRESS_FILE" 2>/dev/null | sed 's/"/\\"/g' | tr '\n' ' ')
fi

# ── Read pending decisions count ─────────────────────────────────────────────
PENDING_COUNT=0
PENDING_PREVIEW=""
if [ -f "$PENDING_FILE" ]; then
    PENDING_COUNT=$(jq 'length' "$PENDING_FILE" 2>/dev/null || echo "0")
    if [ "$PENDING_COUNT" -gt 0 ] 2>/dev/null; then
        PENDING_PREVIEW=$(jq -r '.[0:3] | map(.title // .description // "unnamed") | join(", ")' \
            "$PENDING_FILE" 2>/dev/null || echo "")
    fi
fi

# ── Read last retrograde result ───────────────────────────────────────────────
LAST_RETROGRADE="PENDING"
if [ -f "$DECISIONS_FILE" ]; then
    LAST_RETROGRADE=$(tail -1 "$DECISIONS_FILE" 2>/dev/null \
        | jq -r '.retrograde.outcome // "PENDING"' 2>/dev/null || echo "PENDING")
fi

# ── Calculate trust stats ─────────────────────────────────────────────────────
TOTAL_DECIDED=$((CORRECT + INCORRECT))
ACCURACY_LINE=""
if [ "$TOTAL_DECIDED" -gt 0 ] 2>/dev/null; then
    ACCURACY_PCT=$(python3 -c "print(round(${CORRECT}/${TOTAL_DECIDED}*100,1))" 2>/dev/null || echo "?")
    ACCURACY_LINE="Decision accuracy: ${ACCURACY_PCT}% (${CORRECT}/${TOTAL_DECIDED}). Trust: ${TRUST_LEVEL}."
fi

# ── Build adaptive prompt ─────────────────────────────────────────────────────
# Budget estimate: rough guess based on iteration depth
BUDGET_REMAINING="~$((100 - NEXT_ITERATION * 4))%"

PENDING_LINE=""
if [ "$PENDING_COUNT" -gt 0 ] 2>/dev/null; then
    PENDING_LINE="Pending decisions: ${PENDING_COUNT} items awaiting review."
    if [ -n "$PENDING_PREVIEW" ]; then
        PENDING_LINE="${PENDING_LINE} Next up: ${PENDING_PREVIEW}."
    fi
else
    PENDING_LINE="Pending decisions: queue is empty — run proactive governance scan."
fi

RETROGRADE_LINE="Last iteration retrograde: ${LAST_RETROGRADE}."

PROMPT="You are the NXTG-Forge CEO-LOOP, iteration ${NEXT_ITERATION} of ${MAX_ITERATIONS}.
Estimated budget remaining: ${BUDGET_REMAINING}.

${PROGRESS_SUMMARY}

${PENDING_LINE}
${RETROGRADE_LINE}
${ACCURACY_LINE}

Run one full ORBIT iteration: OBSERVE → REASON → BUILD → INSPECT → TURN.
Read your ceo-loop ORBIT skill for the full protocol.
Update .claude/ceo-loop-progress.md and append to .claude/ceo-loop-decisions.jsonl when done.
If the decision queue is empty AND proactive scan finds nothing, set active:false in .claude/ceo-loop-state.json and write a session summary."

# ── Output block decision ─────────────────────────────────────────────────────
# Escape for JSON: replace newlines with \n, escape quotes
ESCAPED_PROMPT=$(printf '%s' "$PROMPT" \
    | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null \
    || printf '%s' "$PROMPT" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ' | sed 's/^/"/; s/$/"/')

printf '{"decision":"block","reason":%s}\n' "$ESCAPED_PROMPT"
