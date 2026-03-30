# Orchestrator

> The command center that coordinates your entire development session -- context restoration, agent delegation, health checks, and strategic advice through a single 4-option menu.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Core Workflow |
| **Model** | Opus |

---

## What It Does

The Orchestrator is the conductor of the entire NXTG-Forge experience. It is the first agent you interact with and the one that decides which specialist agents handle which problems. When you activate Forge, the Orchestrator presents a canonical 4-option menu -- Continue/Resume, Review & Plan Features, Soundboard, Health Check -- and then coordinates everything that follows.

What makes the Orchestrator more than a menu is its context intelligence. When you choose "Continue," it does not just show you a file list. It reads your governance state, git history, orchestrator task board, and master plan to reconstruct exactly where you left off. It tells you which tasks are pending, which are blocked, whether your code has drifted from the project vision, and what the smartest next step is. The "pick up where we left off" experience should feel like having a senior engineer who was in the room yesterday.

The Orchestrator is also the delegation layer. When you choose to plan a feature, it invokes the Planner. When you want a health check, it coordinates Detective, Security, and the governance MCP tools. When you want to soundboard an idea, it enters discussion mode and provides strategic advice without executing any changes. It understands natural language -- "let's keep going," "I want to add a new feature," "how is my code quality?" all route to the correct workflow without requiring you to remember option numbers.

## When to Use It

- **Starting a development session**: When you activate Forge with `/enable-forge` or similar, the Orchestrator presents the command center and helps you orient.
- **Resuming previous work**: When you say "pick up where we left off" or "continue from yesterday," the Orchestrator restores your full context including branch, tasks, and plan state.
- **Needing strategic advice**: When you want to discuss approaches, architectural trade-offs, or priorities without committing to implementation.
- **Checking project health**: When you want a comprehensive view of code quality, test coverage, security posture, task completion rates, and vision alignment.

The Orchestrator is always the right starting point. It routes to the correct specialist. You do not need to know which agent handles what.

## How It Works

The Orchestrator follows a structured protocol for each of its four options:

**Option 1 (Continue/Resume):**
1. Calls `forge_get_state` for project state and tool detection
2. Calls `forge_get_tasks` for the full task board
3. Calls `forge_get_plan` for master plan progress
4. Calls `forge_check_drift` for vision alignment
5. Reads `.claude/governance.json` and `git log` for local context
6. Presents a context restoration summary with smart recommendations
7. When you pick a task, calls `forge_claim_task` and coordinates the right specialist

**Option 2 (Plan):**
1. Reads existing plan and past decisions to avoid rework
2. Invokes the Planner agent for architecture design
3. Records plan decisions via `forge_capture_knowledge`
4. Offers to transition from planning to implementation

**Option 3 (Soundboard):**
1. Enters discussion mode -- no execution, no file writes
2. Invokes Detective for project analysis
3. Provides strategic advice, suggests approaches with trade-offs
4. Offers to transition to Plan mode if you decide to implement

**Option 4 (Health Check):**
1. Calls `forge_get_health` for governance scores across five dimensions
2. Invokes Detective for local code analysis
3. Aggregates health data into a scored report (0-100)
4. Prioritizes recommendations by impact
5. Offers to fix high-priority issues immediately

## Examples

### Example 1: Morning Session Resume

```
User: "/enable-forge" then "1" (Continue)

Orchestrator:
  - Restores context: "Last session: 2h ago, branch: feat/notifications"
  - Shows task board: 3 pending, 1 in-progress (WebSocket handler), 0 blocked
  - Shows plan: Phase 2 of 3, 60% complete
  - Reports: No vision drift detected
  - Recommends: "Continue with the WebSocket handler (in-progress) or pick up EventStore (next dependency)"
  - Result: Full context in 5 seconds, clear next step
```

### Example 2: Soundboarding an Approach

```
User: "I need to think through how to approach this refactoring. Can we soundboard?"

Orchestrator:
  - Enters discussion mode (no execution)
  - Invokes Detective to analyze current code structure
  - Presents: "Your activity-service.ts has 5 responsibilities. Three approaches:
    A) Extract services incrementally (safest, 3 sessions)
    B) Rewrite from scratch (cleanest, but loses git blame)
    C) Facade pattern first, then gradual extraction (balanced)"
  - Offers trade-offs for each
  - Result: Strategic clarity without writing a single line of code
```

### Example 3: Health Check Before Release

```
User: "How is my code quality? Run diagnostics."

Orchestrator:
  - Runs health check across all dimensions
  - Reports: Overall 82/100
    - Tests: 89% coverage, all passing
    - Security: 1 medium (outdated dependency)
    - Docs: 73% of public APIs documented
    - Architecture: Clean layers, no circular deps
    - Git: 94% conventional commits
  - Recommends: "Update lodash (security), add JSDoc to 8 functions (docs)"
  - Offers: "Want me to fix the security issue now?"
  - Result: Clear picture of release readiness with prioritized actions
```

## Power Use Cases

**Full-Session Orchestration**: The Orchestrator manages an entire development session. Start with "Continue" to restore context, pick a task, watch it delegate to Planner then Builder then Guardian, and return to the menu for the next task. The Orchestrator tracks what was done, records knowledge, and maintains session continuity.

**Cross-Agent Knowledge Sharing**: When the Orchestrator invokes Detective for a health check, the findings get recorded via `forge_capture_knowledge`. When you later invoke Planner for a new feature, it recalls those findings via `forge_get_knowledge`. The Orchestrator is the bridge that makes agents learn from each other's work.

**Progressive Disclosure**: New users see four simple options. They do not need to know about Detective, Planner, Builder, Guardian, or any specialist agent. The Orchestrator routes transparently. As users grow, they can invoke specialists directly, but the Orchestrator remains the safe starting point.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Planner** | Orchestrator invokes Planner for Option 2 (Plan). Planner returns an approved plan, Orchestrator coordinates its execution. |
| **Detective** | Orchestrator invokes Detective for Option 3 (Soundboard) analysis and Option 4 (Health Check) diagnostics. |
| **Guardian** | After implementation tasks complete, Orchestrator queues Guardian for quality validation before marking tasks done. |
| **All Specialists** | The Orchestrator is the dispatcher. Every specialist agent can be reached through it. |
| **/forge:command-center** | The `/forge:command-center` command directly opens the Orchestrator's 4-option menu. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | 4-option command center menu. Agent delegation to specialists. Natural language input parsing. Error handling with recovery options. |
| **L2 Pro Builder** | Full MCP integration: `forge_get_state` for project state, `forge_get_tasks` for task board, `forge_get_plan` for master plan, `forge_claim_task`/`forge_complete_task` for task lifecycle, `forge_capture_knowledge`/`forge_get_knowledge` for cross-session learning, `forge_check_drift` for vision alignment, `forge_get_health` for governance scores. |
| **L3 Ship Lord** | Task board, health scores, agent activity, and plan progress rendered in the forge-ui dashboard at localhost:5050. Visual context restoration with timeline view. |

## Tips & Gotchas

- **Do**: Start every session with the Orchestrator. Even if you know exactly what you want to do, the context restoration catches things you forgot.
- **Don't**: Try to remember which specialist agent handles what. The Orchestrator routes for you. Say what you need in plain English.
- **Do**: Use Soundboard mode (Option 3) when you are unsure. It gives strategic advice without executing anything -- zero risk of unwanted changes.
- **Don't**: Skip the menu and go straight to implementation. The Orchestrator's context check often reveals blockers, stale branches, or forgotten tasks that save you time.

---

*See also: [Planner](planner.md) | [Detective](detective.md) | [/forge:command-center](../commands/command-center.md)*
