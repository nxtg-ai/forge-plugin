---
description: "Activate the CEO Decision Loop in ORBIT mode. Starts a continuous multi-iteration governance cycle: OBSERVE pending decisions → REASON with precedent → BUILD decisions → INSPECT retrograde → TURN for next iteration. The Stop hook keeps the loop alive until the queue is empty or limits are reached. Usage: /forge:ceo-loop [max-iterations] [time-limit-minutes]"
disable-model-invocation: true
argument-hint: "[max-iterations] [time-limit-minutes]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite, Task
---

# /forge:ceo-loop — Activate CEO Decision Loop (ORBIT Mode)

Initialise and start the CEO-LOOP ORBIT cycle for this project.

## Usage

```
/forge:ceo-loop [max-iterations] [time-limit-minutes]
```

**Defaults**: max-iterations=20, time-limit=30

## Step 1 — Read current project state

Before initializing the loop, orient yourself:

```bash
# Check for pending decisions
cat .claude/ceo-decisions-pending.json 2>/dev/null | head -30

# Check existing decision journal (if resuming)
tail -5 .claude/ceo-loop-decisions.jsonl 2>/dev/null

# Check if a loop is already active (avoid double-starting)
cat .claude/ceo-loop-state.json 2>/dev/null | jq '.active'

# Check project governance state
cat .claude/governance.json 2>/dev/null | jq '{name: .project.name, phase: .current_phase}'

# Check git status for pending work context
git log --oneline -5 2>/dev/null
git status --short 2>/dev/null | head -10
```

**If a loop is already active** (`active: true`): Do NOT re-initialize. Report current state and ask if the user wants to cancel first (`/forge:ceo-loop-cancel`).

## Step 2 — Parse arguments

Parse `$ARGUMENTS` for:
- First arg (integer): `max_iterations` (default: 20)
- Second arg (integer): `time_limit_minutes` (default: 30)

Validate: max_iterations between 1-50, time_limit between 5-120.

## Step 3 — Write state file

Create `.claude/ceo-loop-state.json`:

```json
{
  "active": true,
  "iteration": 0,
  "max_iterations": <max_iterations>,
  "time_limit_minutes": <time_limit>,
  "started_at": "<ISO-8601 timestamp>",
  "trust_level": "standard",
  "depth_escalation_counter": 0,
  "correct_decisions": 0,
  "incorrect_decisions": 0
}
```

```bash
STARTED=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > .claude/ceo-loop-state.json << EOF
{
  "active": true,
  "iteration": 0,
  "max_iterations": 20,
  "time_limit_minutes": 30,
  "started_at": "$STARTED",
  "trust_level": "standard",
  "depth_escalation_counter": 0,
  "correct_decisions": 0,
  "incorrect_decisions": 0
}
EOF
```

## Step 4 — Write initial progress file

Create `.claude/ceo-loop-progress.md`:

```markdown
# CEO-LOOP Progress — Starting ORBIT Cycle

**Started**: <ISO timestamp> | **Max iterations**: <N> | **Time limit**: <M> min
**Trust level**: standard | **Accuracy**: N/A (no decisions yet)

## Status
Loop initialised. Iteration 1 beginning now.

## Pending Decisions
<list items from ceo-decisions-pending.json, or "None — will run proactive scan">

## Session Statistics
- Decisions made: 0
- Auto-approved: 0
- Deep decisions: 0
- Escalated: 0
```

## Step 5 — Announce and start Iteration 1

Output to the user:
```
[CEO-LOOP] ORBIT Mode Activated
├─ Max iterations: <N> | Time limit: <M> min
├─ Pending decisions: <count or "proactive scan">
├─ Trust level: standard
└─ Starting Iteration 1 now. Stop hook will continue the loop.
```

Then **immediately execute Iteration 1** using the `ceo-loop` ORBIT skill protocol:

Read your ORBIT skill (`skills/ceo-loop/SKILL.md`) and run a full ORBIT iteration:
OBSERVE → REASON → BUILD → INSPECT → TURN

When you complete Iteration 1, the Stop hook (`ceo-loop-stop.sh`) will automatically trigger the next iteration. You do not need to manually re-invoke — the hook handles loop persistence.

## Important Notes

- State files live in `.claude/` (user's project directory, not plugin directory)
- The loop runs until: queue empty, max iterations reached, time limit reached, or user cancels
- Cancel anytime with `/forge:ceo-loop-cancel`
- The decision journal (`.claude/ceo-loop-decisions.jsonl`) is append-only — never deleted
- If context compaction occurs, the progress file bridges the gap — the hook re-feeds it
