# /forge:ceo-loop

> Activate the CEO Decision Loop in ORBIT mode -- a continuous multi-iteration governance cycle that observes pending decisions, reasons with precedent, builds decisions, inspects via retrograde, and turns for the next iteration.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | CEO Decision Loop |
| **Syntax** | `/forge:ceo-loop [max-iterations] [time-limit-minutes]` |

---

## What It Does

`/forge:ceo-loop` starts an autonomous decision-making engine that runs in a continuous ORBIT cycle: OBSERVE pending decisions and project state, REASON about each decision using precedent from the decision journal, BUILD the actual decisions (approve, modify, escalate), INSPECT via retrograde analysis of previous decisions to calibrate accuracy, and TURN to prepare for the next iteration. The loop persists across Claude Code's Stop events via a hook (`ceo-loop-stop.sh`) that automatically triggers the next iteration.

The loop manages its own state: `.claude/ceo-loop-state.json` tracks iteration count, trust level, accuracy metrics, and timing. `.claude/ceo-loop-decisions.jsonl` is an append-only journal of every decision made. `.claude/ceo-loop-progress.md` bridges context across compaction events. The trust system starts at "standard" and can escalate based on decision accuracy -- more correct decisions earn higher trust, which unlocks deeper autonomous authority.

Without this command, governance decisions accumulate in `.claude/ceo-decisions-pending.json` waiting for manual review. The CEO loop processes them systematically, with appropriate depth for each decision type (trivial decisions are auto-approved, complex decisions get deep analysis, risky decisions are escalated to the human).

## Syntax & Options

```
/forge:ceo-loop [max-iterations] [time-limit-minutes]
```

| Option | Description |
|--------|------------|
| `max-iterations` | Maximum number of ORBIT iterations to run (default: 20, range: 1-50) |
| `time-limit-minutes` | Maximum wall-clock time before the loop stops (default: 30, range: 5-120) |

## When to Use It

- **Accumulated governance decisions**: When `.claude/ceo-decisions-pending.json` has multiple items waiting for review.
- **Project strategy session**: Let the loop analyze project state, make governance decisions, and produce recommendations.
- **Autonomous oversight**: Start the loop and let it run through multiple iterations of observation, reasoning, and decision-making.

When you want to make a single decision manually, just review the pending decisions file directly. The CEO loop is for batch processing and autonomous governance.

## Examples

### Example 1: Default Loop

```
/forge:ceo-loop
```

```
[CEO-LOOP] ORBIT Mode Activated
+-- Max iterations: 20 | Time limit: 30 min
+-- Pending decisions: 5
+-- Trust level: standard
+-- Starting Iteration 1 now. Stop hook will continue the loop.
```

The loop then runs OBSERVE-REASON-BUILD-INSPECT-TURN for each iteration. After each iteration completes, the Stop hook triggers the next one automatically.

### Example 2: Custom Limits

```
/forge:ceo-loop 10 60
```

Runs up to 10 iterations with a 60-minute time limit. Useful for longer strategy sessions.

### Example 3: Resuming a Previous Session

```
/forge:ceo-loop
```

If a previous loop was cancelled, the command detects the existing state file and decision journal. It starts a new session but the journal history informs the retrograde analysis, creating continuity across sessions.

## Power Use Cases

Let the CEO loop run while you are away from the keyboard. It processes pending decisions, captures its reasoning in the decision journal, and updates the progress file. When you return, read `.claude/ceo-loop-progress.md` for a summary of what was decided and why.

The retrograde inspection phase is where the loop learns. It reviews previous decisions, checks if they led to good outcomes, and adjusts its trust level accordingly. Over multiple sessions, the loop builds a track record that informs future decision depth.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:ceo-loop-cancel** | Gracefully stop the loop at any time, preserving the decision journal |
| **/forge:status** | Check project health before starting the loop to set context |
| **/forge:command-center** | Command center shows pending decisions that the loop can process |
| **nxtg-ceo-loop agent** | The agent that powers each ORBIT iteration within the loop |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full ORBIT loop with decision journal, trust escalation, and retrograde analysis |
| **L2 Pro Builder** | Loop decisions integrated with orchestrator task board and knowledge base |
| **L3 Ship Lord** | Decision history and loop progress visible in the forge-ui dashboard |

## Tips & Gotchas

- If a loop is already active (`active: true` in state file), the command refuses to double-start and suggests using `/forge:ceo-loop-cancel` first.
- The decision journal (`.claude/ceo-loop-decisions.jsonl`) is append-only and never deleted, even when the loop is cancelled. This creates a permanent audit trail.
- The Stop hook (`ceo-loop-stop.sh`) is what keeps the loop running between iterations. It reads the state file and re-triggers the ORBIT cycle.
- Trust levels affect decision depth: "standard" analyzes all decisions normally; higher trust levels auto-approve low-risk decisions. Trust cannot be manually set -- it is earned through accuracy.
- The progress file (`ceo-loop-progress.md`) is designed to survive context compaction. If Claude Code compacts context mid-loop, the hook re-feeds the progress file to restore context.

---

*See also: [ceo-loop-cancel](../commands/ceo-loop-cancel.md) | [status](../commands/status.md) | [command-center](../commands/command-center.md)*
