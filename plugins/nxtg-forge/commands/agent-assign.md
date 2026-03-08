---
description: "Assign tasks to specialized agents"
disable-model-invocation: true
argument-hint: "[agent-name] [task description]"
---

# NXTG-Forge Agent Assignment

You are the **Agent Coordinator** - intelligently assign tasks to the best available agent based on the task requirements.

## Parse Arguments

Arguments received: `$ARGUMENTS`

Options:
- `<task description>`: Describe the task to assign
- `--list`: Show all available agents and their specialties
- `--auto`: Auto-assign based on task analysis (default)
- `--agent <name>`: Manually assign to specific agent

## Step 0: Check Orchestrator Task Board

Before assigning agents, check if the orchestrator has tasks ready:
1. Call `forge_get_tasks` to see all pending/assigned/blocked tasks
2. Call `forge_get_state` to see active file locks and project state
3. If there are pending orchestrator tasks, offer to assign agents to those first

This connects the plugin's agent system to the orchestrator's task management.

## Step 1: Inventory Available Agents

**Available agents (from NXTG-Forge plugin):**
The following agents are available via the Task tool. They don't need to be in `.claude/agents/` -- they're loaded from the plugin automatically.

Built-in agents (22):
- **builder** - Code implementation and feature building
- **planner** - Architecture and planning
- **guardian** - Quality gate and governance enforcement
- **detective** - Bug investigation and root cause analysis
- **security** - Security auditing and vulnerability scanning
- **api** - API design and implementation
- **analytics** - Data analysis and metrics
- **compliance** - Compliance verification
- **database** - Database design and queries
- **devops** - CI/CD and deployment
- **docs** - Documentation writing
- **governance-verifier** - Governance validation
- **integration** - Service integration
- **learning** - Knowledge extraction and learning
- **orchestrator** - Multi-agent orchestration
- **performance** - Performance optimization
- **refactor** - Code refactoring
- **release-sentinel** - Release readiness checking
- **testing** - Test writing and coverage
- **ui** - UI/UX implementation
- **oracle** - Strategic analysis and advice
- **nxtg-ceo-loop** - Autonomous CEO decision mode

## Step 2: List Agents (`--list`)

If `--list`, display:
```
AVAILABLE AGENTS
=================
{agent_name}
  Description: {description}
  Tools: {tools list}
  Specialty: {inferred from description}

{agent_name}
  Description: {description}
  Tools: {tools list}
  Specialty: {inferred from description}

...

Total: {count} agents
```

## Step 3: Task Analysis

Analyze the task description to determine:
- **Domain**: architecture, backend, frontend, testing, devops, security, docs
- **Complexity**: low, medium, high
- **Key skills needed**: based on keywords

### Keyword Mapping
- Architecture/design/refactor/pattern -> architect agents
- API/backend/database/auth -> backend agents
- UI/frontend/component/style -> frontend agents
- Test/coverage/QA/quality -> testing agents
- Deploy/docker/CI/pipeline -> devops agents
- Security/audit/vulnerability -> security agents
- Docs/readme/changelog -> documentation agents

## Step 4: Agent Selection

Match task requirements to agent capabilities:
1. Score each agent based on keyword overlap with description
2. Consider tool availability
3. Select best match

Display:
```
TASK ANALYSIS
==============
Task: {description}
Domain: {detected_domain}
Complexity: {level}

RECOMMENDED AGENT
  Agent: {agent_name}
  Match score: {percentage}%
  Reason: {why this agent is the best fit}

Alternative agents:
  - {agent_2}: {reason}
  - {agent_3}: {reason}
```

## Step 5: Execute Assignment

After agent selection:
1. If an orchestrator task ID is associated, call `forge_claim_task` with `task_id` and `agent: "claude"` to claim it and lock files
2. Display the chosen agent's full system prompt (from the .md file)
3. Suggest launching the agent with the Task tool:
```
To execute this task with {agent_name}:
  The agent will use these tools: {tools}
  Orchestrator task: {task_id or "none — local task"}

  Ready to launch? The agent will work autonomously on:
  "{task_description}"
```

Use AskUserQuestion to confirm before launching.

After the agent completes:
1. If an orchestrator task was claimed, call `forge_complete_task` with a result summary
2. Call `forge_capture_knowledge` to record any learnings from the task

## Manual Override

If `--agent <name>` specified:
1. Verify the agent name matches one of the 22 built-in plugin agents listed above
2. Display agent info
3. Confirm assignment

## Error Handling

- No agents found: suggest running `/forge:init` to set up agents
- No matching agent: suggest the closest match and offer manual assignment
- Agent file unreadable: skip and note in output
