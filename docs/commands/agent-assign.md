# /forge:agent-assign

> Intelligently match tasks to the best specialized agent by analyzing task domain, complexity, and required skills, then launch the agent to execute autonomously.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Feature Development |
| **Syntax** | `/forge:agent-assign [task description] [--list] [--auto] [--agent <name>]` |

---

## What It Does

`/forge:agent-assign` is the intelligent dispatcher for Forge's 22 specialized agents. You describe a task, and the command analyzes its domain (architecture, backend, frontend, testing, devops, security, docs), complexity, and required skills, then recommends the best-fit agent with a match score and reasoning. It also suggests alternative agents in case you want a different approach.

Behind the scenes, the command uses keyword mapping to score each agent against the task description. Terms like "refactor" and "pattern" score high for the architect agents; "deploy" and "docker" score high for the devops agent; "vulnerability" and "audit" score high for the security agent. The scoring is transparent -- you see why a particular agent was chosen.

Without this command, you would need to memorize which of the 22 agents handles what, manually invoke the Task tool with the right agent type and prompt, and handle orchestrator task claiming yourself. `/forge:agent-assign` automates the matching, handles orchestrator integration (claiming tasks, locking files, recording knowledge), and confirms before launching.

## Syntax & Options

```
/forge:agent-assign [task description] [--list] [--auto] [--agent <name>]
```

| Option | Description |
|--------|------------|
| `task description` | Natural language description of the task to assign |
| `--list` | Display all 22 available agents with their specialties and tools |
| `--auto` | Auto-assign based on task analysis without asking for confirmation (default behavior) |
| `--agent <name>` | Manually assign to a specific agent by name, bypassing the matching algorithm |

## When to Use It

- **Delegating specialized work**: "Scan the codebase for XSS vulnerabilities" goes to the security agent; "Refactor the auth module into smaller functions" goes to the refactor agent.
- **Exploring available agents**: Run `--list` to see all 22 agents and what they can do.
- **Connecting orchestrator tasks to agents**: The command checks the orchestrator task board for pending tasks and offers to assign agents to them.

For full-lifecycle feature implementation with specs and quality gates, use `/forge:feature` instead. For running multiple agents in a coordinated pipeline, use the orchestrator agent or `/forge:command-center`.

## Examples

### Example 1: Auto-Matched Assignment

```
/forge:agent-assign "Add comprehensive unit tests for the payment service"
```

```
TASK ANALYSIS
==============
Task: Add comprehensive unit tests for the payment service
Domain: testing
Complexity: medium

RECOMMENDED AGENT
  Agent: testing
  Match score: 92%
  Reason: Task mentions tests, unit testing, and coverage -- direct match for testing agent

Alternative agents:
  - guardian: Can run quality gates after tests are written
  - builder: Can implement tests as part of feature building
```

After confirmation, the testing agent is launched with the Task tool.

### Example 2: Listing All Agents

```
/forge:agent-assign --list
```

Displays all 22 agents with descriptions, available tools, and specialties. Useful for discovering agents you did not know existed.

### Example 3: Manual Assignment

```
/forge:agent-assign --agent security "Review all API endpoints for OWASP Top 10"
```

Bypasses the matching algorithm and directly assigns to the security agent.

## Power Use Cases

Before assigning an agent, the command checks `forge_get_tasks` for pending orchestrator tasks. If there are unassigned tasks on the board, it offers to assign agents to those first -- bridging the gap between orchestrator planning and agent execution.

After an agent completes its work, the command calls `forge_complete_task` and `forge_capture_knowledge` to record what was done and what was learned, building institutional memory.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:feature** | Feature uses agents internally; agent-assign is for standalone tasks |
| **/forge:command-center** | Command center's "Continue" option shows pending tasks that can be assigned to agents |
| **orchestrator MCP** | Tasks from `forge_get_tasks` can be claimed and completed through agent assignment |
| **guardian agent** | Assign the guardian after other agents finish to run quality gates on their output |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full agent matching, scoring, and launch with all 22 plugin agents |
| **L2 Pro Builder** | Orchestrator task board integration: claim tasks, lock files, complete tasks, capture knowledge |
| **L3 Ship Lord** | Agent activity and task completion visible in the forge-ui dashboard |

## Tips & Gotchas

- The 22 agents are loaded from the plugin automatically. You do not need to create or configure them.
- Agents run via the Task tool and execute autonomously. Review their output after completion.
- The `--agent` flag requires an exact agent name from the list (e.g., `security`, `testing`, `refactor`). Use `--list` to see valid names.
- If no agent is a strong match (all scores below 50%), the command suggests the closest option and offers manual selection.

---

*See also: [feature](../commands/feature.md) | [command-center](../commands/command-center.md) | [spec](../commands/spec.md)*
