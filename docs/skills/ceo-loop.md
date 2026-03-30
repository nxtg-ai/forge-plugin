# CEO Loop

> Defines the ORBIT governance engine -- a continuous, multi-iteration decision loop that processes product decisions with trust calibration, retrograde verification, and adaptive depth.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Workflow |

---

## What It Provides

The CEO Loop skill encodes the ORBIT (Observe, Reason, Build, Inspect, Turn) protocol that transforms the CEO agent from a single-pass decision oracle into a continuous governance engine. Each iteration processes a queue of product decisions with appropriate depth -- trivial items are batch-approved in seconds, while heavy architectural decisions receive full multi-agent analysis before a verdict.

Without this skill, product decisions are handled ad hoc with no precedent tracking, no retrograde verification of past decisions, and no trust calibration. With it, every decision is classified by depth (trivial/light/medium/heavy), processed with the appropriate investment of analysis, logged to an append-only decision journal, and retroactively verified for correctness in subsequent iterations.

The five innovations ORBIT adds: a real loop mechanism (Stop hook plus state file), cross-context continuity (progress file bridges compaction), iteration tracking with retrograde analysis, adaptive depth (30 seconds for linting decisions, 15 minutes with Agent Teams for architecture), and trust calibration (accuracy tracking with automatic escalation adjustments).

## When It Activates

- When the `/forge:ceo-loop` command starts a governance decision cycle
- When the CEO agent processes pending product decisions from the queue
- When retrograde analysis is needed to verify whether past decisions were correct
- When trust calibration alerts surface due to declining decision accuracy

## The Knowledge Inside

### The Five ORBIT Phases

**OBSERVE**: Read state files in sequence -- loop state (iteration count, trust level, limits), progress file (last iteration's results, retrograde status), decision queue (pending items or proactive scan), and retrograde data (verify last 3 pending decisions against git log). Classify each pending decision by depth: trivial (under 30 seconds), light (1-3 minutes), medium (5-15 minutes), heavy (15-30 minutes).

**REASON**: Retrieve precedent -- search the decision journal for the 3 most similar past decisions and use them as few-shot examples, avoiding patterns that had INCORRECT retrograde outcomes. Apply the decision matrix: low impact + reversible = auto_approve, medium impact + irreversible = deep_think, high impact + irreversible = escalate. Process all trivial items in batch, select one deeper item for focused analysis.

**BUILD**: Execute decisions in the appropriate mode. Batch mode for trivial items: output decision structs sequentially with tier, depth, category, reasoning, and next action. Deep mode for the focused item: light items get full reasoning chains, medium items spawn a detective or planner agent for context gathering, heavy items get a full Agent Team (detective for context, planner for recommendation, guardian for quality gate, CEO for synthesis).

**INSPECT**: Three mandatory checks. Action verification: did the agent act on the deep-focus decision? Decision retrograde: for decisions from 1-2 iterations ago, did the implementation align and pass tests? Trust calibration: compute accuracy, adjust trust level, and surface alerts if accuracy drops below 60%.

**TURN**: Evaluate continuation conditions. Queue empty with no proactive findings: stop. Token budget at 90%: stop. Max iterations or time limit reached: stop. Otherwise: update state file and let the Stop hook trigger the next iteration.

### Trust Calibration System

Trust starts at "standard" and evolves with decision accuracy. Above 90% accuracy after 20+ decisions: "elevated" trust, which auto-approves more and escalates less. Below 80% accuracy: "demoted" trust, which escalates medium-tier decisions to human review. Below 60% accuracy over 10 decisions: immediate human alert. This prevents a poorly calibrated CEO agent from silently making bad decisions.

### State File Architecture

Four files manage loop state. `ceo-loop-state.json`: hook control (active flag, iteration count, trust level, accuracy counters). `ceo-loop-decisions.jsonl`: append-only decision journal with tier, depth, category, reasoning, confidence, and retrograde outcome. `ceo-loop-progress.md`: human-readable iteration log that bridges context compaction. `ceo-decisions-pending.json`: input queue where other agents submit decisions for review.

## How to Leverage It

Start the loop with `/forge:ceo-loop` and let it run autonomously. Submit decisions to the pending queue for review. Monitor progress in the progress file.

### Example: Architecture Decision Review
```
User: "/forge:ceo-loop"
What happens: The loop starts, reads the pending queue, finds a "WebSocket vs
polling" architecture decision. It classifies it as medium depth, retrieves
similar past decisions from the journal, spawns a detective agent for context
gathering, reasons about latency vs. server complexity trade-offs, issues an
APPROVED verdict with full reasoning, and queues retrograde verification for
the next iteration.
```

## Power Applications

- Use the decision journal as institutional memory -- search it for precedent before any major product decision
- Monitor trust calibration trends to detect when the governance model is drifting
- Submit decisions from any agent using the pending queue to centralize product decision-making

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **parallel-execution** | Agent Teams pattern powers the heavy-depth decision analysis |
| **crucible-audit** | Quality decisions often trigger crucible audits for verification |
| **verify-governance** | Governance verification provides evidence for retrograde analysis |

## Tips

- Never modify state files manually during an active loop -- the hook and skill coordinate through these files
- The decision journal is append-only by design; retrograde outcomes are logged as new entries, not edits to old ones
- If trust drops below 80%, review recent decisions manually before restarting the loop

---

*See also: [parallel-execution](parallel-execution.md), [crucible-audit](crucible-audit.md)*
