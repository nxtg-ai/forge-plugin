---
description: "Assign tasks to specialized agents"
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

## Step 1: Inventory Available Agents

Read all agent files from `.claude/agents/`:
```bash
ls .claude/agents/*.md 2>/dev/null
```

For each agent, read the frontmatter to get name, description, and tools.

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
1. Display the chosen agent's full system prompt (from the .md file)
2. Suggest launching the agent with the Task tool:
```
To execute this task with {agent_name}:
  The agent will use these tools: {tools}

  Ready to launch? The agent will work autonomously on:
  "{task_description}"
```

Use AskUserQuestion to confirm before launching.

## Manual Override

If `--agent <name>` specified:
1. Verify the agent exists in `.claude/agents/`
2. Display agent info
3. Confirm assignment

## Error Handling

- No agents found: suggest running `/frg-init` to set up agents
- No matching agent: suggest the closest match and offer manual assignment
- Agent file unreadable: skip and note in output
