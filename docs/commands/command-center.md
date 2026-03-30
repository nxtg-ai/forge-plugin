# /forge:command-center

> The canonical four-option mission control menu providing intelligent project orchestration: continue work, plan features, soundboard strategy, or run health checks.

| | |
|---|---|
| **Level** | L2 Pro Builder |
| **Category** | Governance |
| **Syntax** | `/forge:command-center` |

---

## What It Does

`/forge:command-center` is the command you run when you sit down and ask "what should I work on?" It presents a four-option menu -- Continue/Resume, Review & Plan Features, Soundboard, and Health Check -- each backed by real data from both local state and the forge-orchestrator. Before showing the menu, it runs a pre-flight check: governance.json exists, git is initialized, and the orchestrator connection is verified.

Option 1 (Continue) restores your full context: governance directive, recent git activity, uncommitted work, saved checkpoints, AND the orchestrator task board showing pending, in-progress, and blocked tasks plus drift detection. Option 2 (Plan Features) lets you design new work with access to the existing master plan and task decomposition from the orchestrator. Option 3 (Soundboard) opens a strategic discussion grounded in real project data. Option 4 (Health Check) runs a comprehensive health analysis equivalent to `/forge:gap-analysis`.

The command also handles natural language input. Instead of typing "1", you can say "let's keep going" or "how are we doing?" and it maps your intent to the right option.

## Syntax & Options

```
/forge:command-center
```

This command takes no arguments. It presents an interactive menu.

## When to Use It

- **Session start**: The ideal first command when you do not know where to begin. It gathers context and presents options.
- **Context recovery**: After a break, compaction, or context switch, use it to restore your bearings.
- **Decision point**: When you have finished a task and need to decide what comes next.

For a non-interactive status overview, use `/forge:status`. For going directly into feature development, use `/forge:feature`.

## Examples

### Example 1: Launching the Command Center

```
/forge:command-center
```

```
NXTG-FORGE COMMAND CENTER
===========================
Orchestrator: CONNECTED (v1.4.0)

What shall we accomplish today?

  1. Continue / Resume
     Pick up where we left off - restore context, show pending work

  2. Review & Plan Features
     Design and plan new work, create feature specs

  3. Soundboard
     Discuss strategy, get recommendations, explore options

  4. Health Check
     Review code quality, test coverage, security, and project metrics

Enter choice (1-4) or describe what you need:
```

### Example 2: Continue/Resume

Selecting option 1 produces:

```
CONTEXT RESTORED
=================
Branch: feature/auth
Last commit: a1b2c3d Add JWT validation (2 hours ago)
Uncommitted: 3 files

Current directive: Build secure authentication layer

ORCHESTRATOR TASK BOARD
  Pending:     T-004 Add refresh token rotation
  In Progress: T-003 JWT validation middleware
  Blocked:     none
  Drift:       aligned

What would you like to work on?
```

### Example 3: Natural Language Input

Instead of selecting "4", you type "how's the code quality looking?" The command maps this to the Health Check option and runs the full analysis.

## Power Use Cases

Use the command center as your session entry point. The Continue option pulls from both local state (git, governance, checkpoints) and the orchestrator (task board, plan, drift), giving you the most complete picture of where things stand. This is especially valuable after context compaction when some session memory may be lost.

The Soundboard option is underutilized. It enters an open discussion mode grounded in real project data (test coverage, architecture patterns, technical debt indicators) -- useful for exploring trade-offs before committing to an approach.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:status** | Command center runs status-level analysis internally; use status for quick non-interactive checks |
| **/forge:feature** | Planning option feeds into feature development |
| **/forge:gap-analysis** | Health check option runs gap-analysis-level analysis |
| **forge-orchestrator** | Task board, plan, drift, and knowledge all come from the orchestrator MCP |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Four-option menu with local state (git, governance, checkpoints) |
| **L2 Pro Builder** | Orchestrator integration: task board, master plan, drift detection, knowledge capture |
| **L3 Ship Lord** | Command center accessible from the forge-ui dashboard with visual task boards |

## Tips & Gotchas

- The command checks for `.claude/governance.json` on startup. If it is missing, it suggests running `/forge:init` first.
- Orchestrator connection is checked via `forge_get_state`. If the orchestrator is not running, the command still works with local data only and shows the connection status.
- Natural language mapping is keyword-based: "continue/resume" maps to option 1, "plan/feature/design" to option 2, "discuss/think/advice" to option 3, "health/quality/metrics" to option 4.
- After completing any option, the command offers to return to the command center for the next action.

---

*See also: [status](../commands/status.md) | [feature](../commands/feature.md) | [gap-analysis](../commands/gap-analysis.md)*
