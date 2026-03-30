# CEO Loop

> The founder's digital twin -- an autonomous decision engine that approves fast, rejects distractions, and keeps agents shipping toward the vision without waiting for human sign-off.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Executive & Strategy |
| **Model** | Opus |

---

## What It Does

The CEO Loop is the autonomous executive decision-maker for NXTG-Forge. It embodies the founder's vision, risk tolerance, and decision-making patterns, enabling agents to get approvals, strategic direction, and priority calls without waiting for a human. Its default bias is APPROVE -- because rollback exists, done beats perfect, and speed is a feature.

It runs on the ORBIT model -- five phases per iteration: Observe (read progress, pending decisions), Reason (apply the 4-tier decision matrix with precedent retrieval), Build (batch trivial decisions, deep-focus on complex ones, spawn agents if needed), Inspect (verify previous decisions landed, run retrograde checks, update trust calibration), and Turn (check exit conditions, update state for the next iteration). A Stop hook keeps the loop running across context windows, making it persistent.

The decision framework is concrete: bug fixes, linting, and test improvements are auto-approved. New features get a 30-second alignment check. Architecture changes get deeper analysis. Distractions are rejected immediately. Every decision is logged to a JSONL journal for retrograde analysis, and the system tracks its own accuracy over time -- if decision quality drops below 80%, it automatically escalates more decisions to human review.

## When to Use It

- **Decision queue backlog**: When agents have accumulated decisions waiting for approval and forward motion has stalled.
- **Strategic direction needed**: When agents are stuck choosing between competing approaches and need a tiebreaker aligned with product vision.
- **Priority conflicts**: When multiple tasks compete for limited engineering time and you need a ranked priority list.
- **Scope management**: When feature requests or scope expansions threaten to distract from the core mission.
- **End-of-day review / morning planning**: As a strategic check-in to review progress, clear pending decisions, and set direction.

Do not invoke the CEO Loop for tactical code decisions -- the Builder handles those. Do not use it as a rubber stamp -- it is designed to reject distractions and scope creep as vigorously as it approves aligned work.

## How It Works

The ORBIT loop cycles through five phases per iteration:

1. **OBSERVE**: Reads the progress file, pending decisions from `ceo-decisions-pending.json`, and recent agent output. Checks for stalls or blockers.
2. **REASON**: Classifies each pending decision into one of four tiers -- auto-approve (trivial), light review (quick check), medium analysis (2-5 minutes), or heavy deliberation (escalate if needed). Retrieves precedent from the decision journal.
3. **BUILD**: Batches and approves all trivial decisions. Deep-focuses on one medium or heavy decision. Spawns sub-agents if the decision requires investigation.
4. **INSPECT**: Reviews decisions from 1-2 iterations ago. Did the agent implement the decision? Did it pass tests? Updates verification status and trust calibration score.
5. **TURN**: Checks exit conditions (time limit, iteration limit, all decisions cleared). If continuing, updates `.claude/ceo-loop-state.json` for the Stop hook to re-feed.

## Examples

### Example 1: Auto-Approving a Code Quality Improvement

```
[CEO-LOOP] Decision on: Add ESLint auto-fix
  - Iteration: 3 | Depth: trivial
  - Impact: Low
  - Risk: Low (auto-fixes are reversible)
  - Vision Alignment: 100/100
  - Decision: APPROVED
  - Reason: Code quality improvements are always welcome.
  - Next Action: Commit and move to next task.
```

### Example 2: Rejecting Scope Creep

```
[CEO-LOOP] Decision on: Build admin dashboard for metrics
  - Iteration: 5 | Depth: medium
  - Impact: Medium
  - Risk: Medium (new surface area)
  - Vision Alignment: 40/100 (not in core vision)
  - Decision: REJECTED
  - Reason: Metrics are good but not core to autonomous agents.
    Focus on making agents work. Metrics can wait.
  - Next Action: Return to agent implementation. Park for post-v3.
```

### Example 3: Strategic Architecture Guidance

```
[CEO-LOOP] Decision on: SQLite vs PostgreSQL for state storage
  - Iteration: 8 | Depth: medium
  - Impact: High (one-way door)
  - Risk: Medium
  - Decision: SQLITE
  - Reason: Single-user dog-fooding right now. SQLite is simpler,
    zero infrastructure. Design schema to be DB-agnostic for
    future migration. Don't prematurely optimize for scale we
    don't have.
  - Next Action: Implement with SQLite. Add migration path
    in architecture docs.
```

## Power Use Cases

**Overnight Autonomous Operation**: Activate the CEO Loop before leaving for the night. It processes the decision queue, unblocks agents, and keeps development moving. In the morning, review the decision journal to see what was approved, rejected, and why.

**Trust Calibration System**: The CEO Loop tracks its own decision accuracy over time. After 20+ decisions, if accuracy drops below 80%, it automatically enters "elevated caution mode" -- escalating medium-tier items to human review instead of deciding autonomously. This self-correcting mechanism prevents cascading bad decisions.

**Retrograde Analysis**: Every iteration includes a look-back at previous decisions. Did the approved feature pass tests? Did the rejected scope expansion get requested again? This feedback loop means the CEO Loop gets smarter over time, building a precedent library that informs future decisions.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Builder agent** | CEO Loop unblocks Builder by approving or rejecting pending decisions |
| **Product Strategist** | Strategist provides market context; CEO Loop makes the final call |
| **Oracle** | Oracle detects drift; CEO Loop decides whether to correct course or accept the drift |
| **/forge:ceo-loop** | Activates the loop with configurable iteration and time limits |
| **/forge:ceo-loop-cancel** | Gracefully stops the loop, preserving the decision journal |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | ORBIT loop, 4-tier decision matrix, decision journal, trust calibration, retrograde analysis |
| **L2 Pro Builder** | + `forge_get_tasks` for task-aware prioritization; `forge_get_plan` for plan-aligned decision-making |
| **L3 Ship Lord** | + Dashboard panel showing decision history, trust calibration trends, and active loop status |

## Tips & Gotchas

- **Do**: Set realistic iteration and time limits. `/forge:ceo-loop 10 30` runs up to 10 iterations or 30 minutes.
- **Do**: Review the decision journal (`ceo-loop-decisions.jsonl`) periodically to ensure decisions align with your actual preferences.
- **Don't**: Leave the CEO Loop running indefinitely without review -- it is autonomous but not infallible.
- **Don't**: Use it for decisions that require user research or market data it does not have -- those should go to the Product Strategist or Scout first.

---

*See also: [product-strategist](product-strategist.md), [master-architect](master-architect.md)*
