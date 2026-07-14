---
name: ceo-loop
description: >
  CEO Decision Loop — the ORBIT execution protocol (OBSERVE → REASON → BUILD → INSPECT → TURN) for
  one iteration of NXTG-Forge autonomous product governance. Preloaded into the nxtg-ceo-loop agent and
  started by the /forge:ceo-loop command; the ceo-loop-stop.sh Stop hook re-invokes it each iteration
  until the queue empties or limits hit. Use when running or resuming a CEO-LOOP: classify pending
  decisions by depth, apply the impact×reversibility matrix, write the append-only decision journal +
  progress file, run retrograde verification, update trust calibration, and decide continue-or-stop.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite
---

# CEO Decision Loop — ORBIT Protocol

## Overview

The CEO-LOOP ORBIT model turns the CEO agent from a single-pass decision oracle into a **continuous governance engine**. Each invocation of this skill is one ORBIT iteration. The Stop hook (`ceo-loop-stop.sh`) re-invokes this skill after each iteration until the queue is empty or limits are reached.

**Five contributions ORBIT adds to CEO-LOOP:**
1. **Actual loop mechanism** — Stop hook + state file, not pseudocode
2. **Cross-context continuity** — progress file bridges compaction
3. **Iteration tracking + retrograde** — was the last decision correct?
4. **Adaptive depth** — ESLint fix in 30s, architecture in 15 min with Agent Teams
5. **Trust calibration** — accuracy tracked, demotion alert surfaces to human

---

## State Files (all in `$PROJECT_ROOT/.claude/`)

These are written and read by the loop. **Never modify manually during an active loop.**

### `ceo-loop-state.json` — Hook state
```json
{
  "active": true,
  "iteration": 7,
  "max_iterations": 20,
  "time_limit_minutes": 30,
  "started_at": "2026-03-08T10:00:00Z",
  "trust_level": "standard",
  "depth_escalation_counter": 0,
  "correct_decisions": 47,
  "incorrect_decisions": 2
}
```
- `active`: Stop hook checks this. If false, hook is a no-op.
- `iteration`: Current iteration number. Hook increments this before re-feed.
- `depth_escalation_counter`: How many consecutive trivial-only iterations. At 3, go proactive.
- `trust_level`: `"standard"` | `"elevated"` | `"demoted"`. Demoted = escalate more.

### `ceo-loop-decisions.jsonl` — Decision journal (append-only)
```json
{
  "id": "iter-7-1",
  "iteration": 7,
  "ts": "2026-03-08T10:15:00Z",
  "tier": "auto_approve",
  "depth": "trivial",
  "category": "quality",
  "input": "Add ESLint auto-fix to CI pipeline",
  "decision": "APPROVED",
  "reason": "Code quality improvements are always welcome. Low risk, high alignment.",
  "next_action": "Commit and move to next task.",
  "verification": "PENDING",
  "retrograde": { "previous_id": null, "outcome": "N/A" },
  "confidence": 0.98
}
```
**Tier values**: `auto_approve` | `quick_review` | `deep_think` | `escalate`
**Depth values**: `trivial` | `light` | `medium` | `heavy`
**Category values**: `feature` | `architecture` | `quality` | `scope` | `deploy`
**Decision values**: `APPROVED` | `NEEDS_REVIEW` | `REJECTED`
**Verification values**: `CONFIRMED` | `FAILED` | `PENDING`
**Retrograde outcome values**: `CORRECT` | `INCORRECT` | `PENDING` | `N/A`

### `ceo-loop-progress.md` — Human-readable iteration log
Updated by CEO-LOOP at the end of each INSPECT phase:
```markdown
# CEO-LOOP Progress — Iteration 7 of 20

**Started**: 2026-03-08T10:00:00Z | **Current**: 2026-03-08T10:15:00Z
**Trust level**: standard | **Accuracy**: 47/49 = 95.9%

## Last Iteration Summary
- Processed 3 trivial decisions in batch (all APPROVED)
- Deep focus: ESLint auto-fix architecture (APPROVED, reason: ...)
- Retrograde check: iter-6 decisions all CONFIRMED correct

## Queue Status
- Pending: 2 decisions remaining
- Next depth target: light (1 pending light item)

## Active since: 2026-03-08T10:00:00Z | Iterations: 7/20
```

### `ceo-decisions-pending.json` — Input queue (optional)
Agents write here to submit decisions for review:
```json
[
  {
    "id": "req-001",
    "submitted_at": "2026-03-08T10:01:00Z",
    "requestor": "forge:builder",
    "category": "architecture",
    "title": "WebSocket vs polling for agent communication",
    "description": "Should we implement WebSocket-based real-time agent communication or keep polling?",
    "impact": "medium",
    "reversible": true,
    "context": "Current polling adds 2-3s latency. WebSocket would require server changes."
  }
]
```
If this file is absent, CEO-LOOP does a proactive scan instead (see OBSERVE phase).

---

## Gotchas

Real failure modes of the loop mechanism (`hooks/scripts/ceo-loop-stop.sh` + the `nxtg-ceo-loop` agent). Read before running.

1. **State is keyed to the current working directory, not a fixed project.** The Stop hook sets `PROJECT_ROOT="$(pwd)"` and looks for `.claude/ceo-loop-state.json` under it (Guard 1). If the loop is running from a different CWD than where the state file was written, the hook silently exits 0 — the loop dies with **no error and no re-feed**. Always run from the same project root where `/forge:ceo-loop` wrote the state.

2. **No `jq` → the loop dies silently.** Guard 2 exits 0 if `jq` is not on PATH — no warning. Independently, the time-limit check needs `python3`; if it is missing, `ELAPSED=0` and the **time limit never fires** — only `max_iterations` or a manual `active:false` can stop the loop.

3. **You must set `active:false` yourself to stop cleanly.** The hook only auto-stops on `iteration >= max_iterations` or elapsed time. If the queue empties and TURN forgets to write `active:false`, the hook keeps re-feeding until it burns **all** remaining iterations running proactive scans. Empty queue + nothing to scan ⇒ set `active:false`.

4. **The decision journal is append-only — you cannot edit a past `verification` in place.** Retrograde outcomes (`CONFIRMED`/`FAILED`) are recorded in the **progress file** and folded into `correct_decisions`/`incorrect_decisions` in the state file. New decisions are appended fresh with `verification:"PENDING"`. Never rewrite old JSONL lines to "update" a verification.

5. **Only the top of the progress file survives to the next iteration.** The hook re-feeds `head -30 ceo-loop-progress.md` and only `tail -1` of the journal (for the retrograde line). Put queue status, next-depth target, and retrograde results **near the top** of the progress file, or the next iteration will not see them.

6. **"Budget remaining" is a fabricated estimate, not a real token gauge.** The hook computes `~(100 − iteration×4)%` — a linear guess. Phase-5 check 2 ("last 10% of token budget") is heuristic only; do not treat it as a measured context reading.

7. **Trust calibration only moves if INSPECT updates the counters.** `correct_decisions`/`incorrect_decisions` in the state file are the sole inputs to `trust_level` and the accuracy line the hook injects. If a retrograde check does not increment them, trust never changes and the injected accuracy line stays blank.

8. **Inside the `nxtg-ceo-loop` agent there is no Bash tool.** That agent's allowlist is `Read, Grep, Glob, TodoWrite, Task, Write, Edit` — no Bash. When this skill runs under that agent, the `cat`/`jq`/`git`/`grep -r` snippets below **will not execute**; read state files with `Read` and scan with `Grep`/`Glob` instead. The Bash snippets apply when the loop is driven directly by the `/forge:ceo-loop` command (whose `allowed-tools` does grant Bash).

---

## ORBIT Execution Protocol

### Phase 1 — OBSERVE

**Read in this order:**

1. **State file**: `cat .claude/ceo-loop-state.json`
   - What iteration is this? What limits remain?
   - What is the current trust level?
   - Has depth escalation counter hit 3? (→ proactive mode)

2. **Progress file**: `cat .claude/ceo-loop-progress.md`
   - What was done last iteration?
   - What is the retrograde status of last iteration's decisions?
   - What is the current queue status?

3. **Decision queue**:
   - If `.claude/ceo-decisions-pending.json` exists: load and classify all pending items
   - If absent or empty: **proactive mode** — scan for governance work:
     ```bash
     # Check test coverage drift
     cat .claude/governance.json 2>/dev/null | jq '.quality_gates'
     # Check uncommitted decisions in code (TODO: CEO-APPROVE comments)
     grep -r "CEO-APPROVE\|CEO-REVIEW" src/ --include="*.ts" -l 2>/dev/null | head -10
     # Check git status for pending work
     git status --short | head -20
     ```

4. **Last-iteration retrograde**: Check the last 3 entries in `ceo-loop-decisions.jsonl` where `verification == "PENDING"`. For each, determine if the agent implemented the decision:
   ```bash
   # Check recent commits match expected next_action
   git log --oneline -5
   # Check task state if forge-orchestrator is active
   cat .forge/state.json 2>/dev/null | jq '.tasks[-5:]'
   ```
   Update verification in progress file (don't rewrite the JSONL — note in progress file).

**Classify each pending decision:**
| Depth | Time budget | Criteria |
|-------|------------|---------|
| trivial | < 30s | Linting, docs, test coverage, formatting |
| light | 1-3 min | New feature aligned with vision, API addition |
| medium | 5-15 min | Architecture choice, API contract change |
| heavy | 15-30 min | Major pivot, production gate, feature removal |

---

### Phase 2 — REASON

**Precedent retrieval**: Before deciding, search the decision journal for the 3 most similar past decisions:
```bash
# Find recent decisions in the same category
tail -50 .claude/ceo-loop-decisions.jsonl 2>/dev/null | grep '"category":"architecture"'
```
Apply them as few-shot examples. Avoid repeating decisions that had `retrograde.outcome == "INCORRECT"`.

**Depth selection strategy:**
- Process ALL trivial items in batch (fast path, output decision structs sequentially)
- Select ONE light/medium/heavy item as the "deep focus" for this iteration
- Do NOT attempt all heavy items — the loop will return to them next iteration
- If all items are trivial for 3+ consecutive iterations → activate proactive mode

**Apply the CEO-LOOP decision matrix:**
| Impact | Reversible | → |
|--------|-----------|---|
| Low | Yes | auto_approve |
| Low | No | quick_review |
| Medium | Yes | quick_review |
| Medium | No | deep_think |
| High | Yes | quick_review |
| High | No | deep_think or escalate |

**For medium/heavy items — plan before deciding:**
State the alternatives, risks, reversibility, and vision alignment BEFORE outputting the decision struct. Externalise the reasoning.

---

### Phase 3 — BUILD (Execute decisions, mode-aware)

**Batch mode** (trivial items): Output decision structs in sequence using the CEO-LOOP format:
```
[CEO-LOOP] Decision on: <item title>
├─ Iteration: {N} | Depth: trivial | Category: quality
├─ Impact: Low | Risk: Low | Vision Alignment: 95/100
├─ Decision: APPROVED
├─ Reason: <brief>
└─ Next Action: <what agent should do>
```
Append each to the decision journal (JSONL format, one per line).

**Deep mode** (selected light/medium/heavy item):

- **light**: Decide with full reasoning chain logged. One Agent Team optional.
- **medium**: Research before deciding. Spawn `forge:detective` or `forge:planner` to gather context:
  ```
  Spawn forge:detective: "Gather context on [decision topic]: check codebase state,
  relevant files, test coverage, and technical constraints. Report back in 3 minutes."
  ```
  Then decide with that context.
- **heavy**: Full Agent Team:
  - `forge:detective` → gather context, identify risks
  - `forge:planner` → draft architecture recommendation
  - `forge:guardian` → check vision alignment and quality gates
  - CEO-LOOP synthesises all inputs and issues final decision

---

### Phase 4 — INSPECT

Three checks per iteration:

**1. Action verification** — For the deep-focus decision: did the agent receive and act on it?
- Check git log for expected changes
- Check `.forge/state.json` task updates
- Check if TodoWrite tasks were created
- Record the verification result in the **progress file** (the journal is append-only — do not edit past JSONL lines)

**2. Decision retrograde** — For decisions from 1-2 iterations ago with `verification == "PENDING"`:
- Did the agent's implementation align with what was approved?
- Did it pass tests? (`git log` + CI status if available)
- If INCORRECT: log it, update trust calibration, note what should have been different

**3. Trust calibration update**:
```
accuracy = correct_decisions / (correct_decisions + incorrect_decisions)
```
- accuracy > 90%: trust_level = "elevated" (after 20+ decisions)
- accuracy < 80% (last 20 decisions): trust_level = "demoted" → escalate more items
- accuracy < 60% (last 10 decisions): surface to human NOW — output warning

**4. Write progress file** — Update `.claude/ceo-loop-progress.md` with:
- What decisions were made this iteration
- Retrograde results
- Queue status (remaining items)
- Current accuracy

**5. Write decision journal** — Append each decision as a JSONL line to `.claude/ceo-loop-decisions.jsonl`. One entry per decision. Do NOT overwrite — always append.

---

### Phase 5 — TURN

Evaluate whether to continue. **The Stop hook handles the actual looping mechanism** — this phase updates the state file so the hook can make the right TURN decision.

**Check sequence:**
1. Is the decision queue empty (and proactive scan found nothing)? → Set `active: false` in state file. Write session summary to progress file. Exit.
2. Are we in the last 10% of token budget (estimated)? → Set `active: false`. Batch-only exit.
3. Has `max_iterations` been reached? → Set `active: false`. Write summary.
4. Has `time_limit_minutes` elapsed since `started_at`? → Set `active: false`. Write summary.
5. All clear → Update state file (the Stop hook will increment iteration and re-feed).

**Depth escalation rule**: If `depth_escalation_counter >= 3` and queue is empty → do proactive governance scan before marking done:
- Check vision alignment of last 5 shipped features
- Review test coverage against quality gates
- Check for stale decisions in the journal (`verification == "PENDING"` for > 2 iterations)

**Write state file update** at end of TURN:
```bash
# Update state file — only write if should continue
jq '.depth_escalation_counter += 1' .claude/ceo-loop-state.json > .claude/ceo-loop-state.json.tmp
mv .claude/ceo-loop-state.json.tmp .claude/ceo-loop-state.json
```
If stopping: set `active: false`.

---

## Worked Example — One Iteration

Queue (`ceo-decisions-pending.json`) holds 3 items: two trivial (add an ESLint rule, fix a README typo) and one medium (SQLite vs Postgres for state storage).

- **OBSERVE** — state shows iteration 7/20, trust `standard`, 47/49 correct. Progress file's last entry: iter-6 decisions all `CONFIRMED`. Load the 3 pending items → classify as 2 trivial, 1 medium.
- **REASON** — grep the journal for `"category":"architecture"` precedent → find iter-3 "chose SQLite, CONFIRMED". Batch the 2 trivials (Low impact, reversible → `auto_approve`). Pick the SQLite/Postgres item as the single deep focus.
- **BUILD** — emit two `auto_approve` structs for the trivials; spawn `forge:detective` to report current scale + infra constraints; decide SQLite (reversible, single-user), tier `quick_review`. Append all three as JSONL lines with `verification:"PENDING"`.
- **INSPECT** — verify iter-5's deep decision landed: `git log` shows the expected commit → mark it `CONFIRMED` in the progress file, bump `correct_decisions` to 48 in the state file. Rewrite the progress file with `queue: 0 remaining` **near the top** (gotcha 5).
- **TURN** — queue empty; proactive scan finds no drift → set `active:false`, write the session summary. On the next Stop the hook sees `active:false` (Guard 3) and lets the session end.

---

## Trust Calibration Rules

| Condition | Trust Level | Effect |
|-----------|-------------|--------|
| < 20 decisions | standard | Normal escalation thresholds |
| ≥ 20 decisions, accuracy > 90% | elevated | Fewer escalations, auto-approve more |
| ≥ 20 decisions, accuracy 80-90% | standard | Normal |
| ≥ 20 decisions, accuracy < 80% | demoted | Escalate medium → escalate tier |
| ≥ 10 decisions, accuracy < 60% | **ALERT** | Surface to human immediately |

When trust is demoted, output at start of next REASON phase:
```
⚠️ TRUST CALIBRATION ALERT: Decision accuracy at {X}% (last 20 decisions).
Elevated caution mode active. Escalating medium-tier decisions to human review.
```

---

## Progress File Template

Use this structure when writing `.claude/ceo-loop-progress.md`:

```markdown
# CEO-LOOP Progress — Iteration {N} of {max}

**Started**: {started_at} | **Updated**: {current_time}
**Trust level**: {trust_level} | **Accuracy**: {correct}/{total} = {pct}%
**Depth escalation counter**: {depth_escalation_counter}

## Iteration {N} Summary
- Trivial decisions (batch): {count} — all APPROVED / {N} REJECTED
- Deep focus: {title} ({depth}) — {APPROVED|REJECTED|NEEDS_REVIEW}
  Reason: {reason}
- Retrograde check: {results}

## Queue Status
- Remaining pending decisions: {count}
- Next depth target: {trivial|light|medium|heavy}
- Estimated iterations to completion: {estimate}

## Session Statistics
- Total decisions this session: {total}
- Auto-approved (trivial): {count}
- Deep decisions: {count}
- Escalated to human: {count}
- Incorrect (retrograde): {count}
```

---

## When the Loop Finishes

Output a session summary in the CEO-LOOP decision format, then write it to the progress file:
```
[CEO-LOOP] Session Complete — ORBIT Loop Finished

Iterations: {N} of {max_iterations}
Duration: {elapsed} minutes
Decisions made: {total}
  └─ Auto-approved: {count} | Deep: {count} | Escalated: {count}
Decision accuracy: {pct}% ({correct}/{total with retrograde})
Queue status: EMPTY / {N} remaining (time limit reached)

Vision alignment check: {all decisions aligned | N misaligned — see journal}

Next session: Re-run /forge:ceo-loop when decisions accumulate.
```
