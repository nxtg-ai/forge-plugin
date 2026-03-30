# /forge:ceo-loop-cancel

> Gracefully stop the active CEO Decision Loop, write a final session summary with statistics, and preserve the complete decision journal for future sessions.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | CEO Decision Loop |
| **Syntax** | `/forge:ceo-loop-cancel` |

---

## What It Does

`/forge:ceo-loop-cancel` is the graceful exit from an active CEO-LOOP ORBIT cycle. It reads the current loop state, collects session statistics (iterations completed, decisions made, auto-approved count, escalated count, accuracy percentage, trust level), writes a final session summary to the progress file, sets the loop to inactive, and reports the results. Most importantly, it never deletes the decision journal -- all decisions from the session are preserved.

The command is idempotent and safe. If no loop is active, it reports that and exits. If a loop is running, it stops cleanly. Pending decisions that were not processed remain in `.claude/ceo-decisions-pending.json` for the next session. The next time you run `/forge:ceo-loop`, it picks up from the journal history.

Without this command, the only way to stop the loop would be to manually edit the state file or wait for the max-iterations or time-limit to expire. `/forge:ceo-loop-cancel` provides a clean, documented exit with full statistics.

## Syntax & Options

```
/forge:ceo-loop-cancel
```

This command takes no arguments. It always cancels the active loop.

## When to Use It

- **Ending a governance session**: When you have made enough decisions and want to return to normal work.
- **Before switching context**: Stop the loop before moving to a different project or task type.
- **Emergency stop**: If the loop is making decisions you disagree with, cancel it and review the journal.

To restart the loop after cancelling, run `/forge:ceo-loop` again. It starts a fresh session but retains the journal history.

## Examples

### Example 1: Standard Cancellation

```
/forge:ceo-loop-cancel
```

```
[CEO-LOOP] ORBIT Loop Cancelled
+-- Completed iterations: 7
+-- Decisions made: 12
+-- Decision accuracy: 83% (5/6 with retrograde)
+-- Remaining in queue: 2
+-- Journal preserved: .claude/ceo-loop-decisions.jsonl
+-- Resume with: /forge:ceo-loop
```

### Example 2: No Active Loop

```
/forge:ceo-loop-cancel
```

```
No CEO-LOOP is currently active.
```

Safe to run even when no loop is running.

## Power Use Cases

Cancel the loop, review the decision journal (`.claude/ceo-loop-decisions.jsonl`), and look for patterns. Are certain types of decisions consistently escalated? Are auto-approved decisions turning out well? Use this analysis to adjust your governance approach.

The final session summary appended to `.claude/ceo-loop-progress.md` creates a session log over time. Multiple start/cancel cycles produce a chronological record of governance sessions with statistics.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:ceo-loop** | Start the loop; cancel stops it. They are a matched pair. |
| **/forge:status** | Check project health after cancelling to see the impact of loop decisions |
| **/forge:report** | Session report can include loop statistics from the progress file |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full graceful cancellation with statistics, journal preservation, and session summary |
| **L2 Pro Builder** | Cancellation event recorded in orchestrator event trail |
| **L3 Ship Lord** | Loop session history visible in the forge-ui dashboard governance timeline |

## Tips & Gotchas

- The decision journal is never deleted. Not by cancel, not by starting a new loop. It is a permanent audit trail.
- The state file (`.claude/ceo-loop-state.json`) has `active` set to `false` after cancellation. It is not deleted.
- Session accuracy metrics (correct/incorrect) are per-session only. Historical accuracy lives in the journal.
- Pending decisions that were not processed remain in the queue for the next `/forge:ceo-loop` invocation.
- The progress file gets a "SESSION END" section appended with final statistics. This creates a multi-session log.

---

*See also: [ceo-loop](../commands/ceo-loop.md) | [status](../commands/status.md) | [command-center](../commands/command-center.md)*
