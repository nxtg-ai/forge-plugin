---
description: "Cancel the active CEO Decision Loop gracefully. Sets the loop to inactive, writes a final session summary to the progress file, and logs session statistics. Does NOT delete the decision journal — all decisions are preserved. Safe to run at any time, even if no loop is active."
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Bash
---

# /forge:ceo-loop-cancel — Cancel CEO Decision Loop

Graceful exit from the CEO-LOOP ORBIT cycle.

## Step 1 — Check current state

```bash
cat .claude/ceo-loop-state.json 2>/dev/null
```

If no state file exists or `active: false`: report "No CEO-LOOP is currently active" and exit.

## Step 2 — Collect session statistics

Read stats for the final summary:

```bash
# Get state values
ITERATION=$(jq -r '.iteration // 0' .claude/ceo-loop-state.json 2>/dev/null)
STARTED=$(jq -r '.started_at // "unknown"' .claude/ceo-loop-state.json 2>/dev/null)
CORRECT=$(jq -r '.correct_decisions // 0' .claude/ceo-loop-state.json 2>/dev/null)
INCORRECT=$(jq -r '.incorrect_decisions // 0' .claude/ceo-loop-state.json 2>/dev/null)
TRUST=$(jq -r '.trust_level // "standard"' .claude/ceo-loop-state.json 2>/dev/null)

# Count decisions in journal
TOTAL_DECISIONS=$(wc -l < .claude/ceo-loop-decisions.jsonl 2>/dev/null || echo 0)
AUTO_APPROVED=$(grep -c '"tier":"auto_approve"' .claude/ceo-loop-decisions.jsonl 2>/dev/null || echo 0)
ESCALATED=$(grep -c '"tier":"escalate"' .claude/ceo-loop-decisions.jsonl 2>/dev/null || echo 0)

# Count pending items remaining
PENDING=$(jq 'length' .claude/ceo-decisions-pending.json 2>/dev/null || echo 0)
```

## Step 3 — Write final session summary to progress file

Append a final section to `.claude/ceo-loop-progress.md`:

```markdown

---

## SESSION END — Cancelled by user

**Cancelled at**: <ISO timestamp>
**Started**: <started_at>
**Completed iterations**: <N>

### Final Session Statistics
| Metric | Value |
|--------|-------|
| Total decisions | <TOTAL_DECISIONS> |
| Auto-approved (trivial) | <AUTO_APPROVED> |
| Escalated to human | <ESCALATED> |
| Deep decisions | <TOTAL - AUTO - ESCALATED> |
| Correct (retrograde confirmed) | <CORRECT> |
| Incorrect (retrograde failed) | <INCORRECT> |
| Final accuracy | <pct>% |
| Trust level at exit | <TRUST> |

### Queue at cancellation
- Remaining pending decisions: <PENDING>
- Decision journal preserved at: `.claude/ceo-loop-decisions.jsonl`

Resume next session with: `/forge:ceo-loop` (will pick up from journal)
```

## Step 4 — Set loop inactive

```bash
jq '.active = false' .claude/ceo-loop-state.json > .claude/ceo-loop-state.json.tmp 2>/dev/null \
    && mv .claude/ceo-loop-state.json.tmp .claude/ceo-loop-state.json
```

## Step 5 — Report to user

Output:
```
[CEO-LOOP] ORBIT Loop Cancelled
├─ Completed iterations: <N>
├─ Decisions made: <total>
├─ Decision accuracy: <pct>% (<correct>/<total with retrograde>)
├─ Remaining in queue: <pending>
├─ Journal preserved: .claude/ceo-loop-decisions.jsonl
└─ Resume with: /forge:ceo-loop
```

## What is preserved

- `.claude/ceo-loop-decisions.jsonl` — Full decision journal, never deleted
- `.claude/ceo-loop-progress.md` — Progress log with final summary appended
- `.claude/ceo-loop-state.json` — State file with `active: false`
- `.claude/ceo-decisions-pending.json` — Unprocessed decisions remain for next session

## What is reset on next /forge:ceo-loop

- `active` → true
- `iteration` → 0
- `started_at` → new timestamp
- `correct_decisions`, `incorrect_decisions` — reset for fresh session accuracy tracking
  (historical accuracy in journal is always preserved)
