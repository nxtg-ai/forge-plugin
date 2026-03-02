# CLAUDE.md — Forge Plugin

Claude Code plugin for AI-powered development governance. Pure markdown — no build step. Commands, agents, skills, and hooks are loaded by Claude Code at runtime.

## Quick Reference

```bash
# No build step. All content is markdown loaded by Claude Code.

# MCP server (auto-installs deps on first run)
cd plugins/nxtg-forge/servers/governance-mcp
npm install   # only if node_modules missing
node index.mjs

# Plugin lives at: plugins/nxtg-forge/
# Installed by Claude Code via: claude plugin marketplace add nxtg-ai/forge-plugin && claude plugin install forge
```

## Plugin Structure

```
plugins/nxtg-forge/
├── .claude-plugin/
│   └── plugin.json           # Manifest (name, version, description)
├── .mcp.json                 # MCP server config (governance-mcp via stdio)
├── commands/                 # 21 slash commands (*.md (slash commands))
├── agents/                   # 22 agent definitions ([AFRG]-*.md)
├── skills/                   # 29 skill directories (*/SKILL.md)
├── hooks/                    # 6 governance hooks (bash scripts)
│   ├── hooks.json            # Hook trigger definitions
│   └── scripts/lib.sh        # Shared utilities
└── servers/
    └── governance-mcp/       # Node.js MCP server (index.mjs, 8 tools)
        ├── package.json      # @nxtg-forge/governance-mcp v3.1.0
        ├── index.mjs         # 835 lines, ES module
        └── start.sh          # Auto-install launcher
```

## Components

### 21 Slash Commands

| Category | Commands |
|----------|----------|
| **Governance** | `/forge:init`, `/forge:status`, `/forge:status-enhanced`, `/forge:gap-analysis`, `/forge:compliance`, `/forge:command-center` |
| **Feature Dev** | `/forge:feature`, `/forge:spec`, `/forge:agent-assign`, `/forge:integrate` |
| **Quality** | `/forge:test`, `/forge:deploy`, `/forge:optimize`, `/forge:upgrade` |
| **State** | `/forge:checkpoint`, `/forge:restore`, `/forge:report` |
| **Docs** | `/forge:docs-status`, `/forge:docs-update`, `/forge:docs-audit` |
| **Dashboard** | `/forge:dashboard` |

**Format:** Markdown with YAML frontmatter (`description` field). Body contains structured instructions for Claude Code.

### 22 Agents

| Agent | Specialty | Model |
|-------|-----------|-------|
| `forge-planner` | Architecture design, task breakdown | sonnet |
| `forge-builder` | Feature implementation with tests | sonnet |
| `forge-guardian` | Quality gates, pre-commit checks | sonnet |
| `forge-security` | Vulnerability scanning, OWASP | sonnet |
| `forge-testing` | Test generation, coverage analysis | sonnet |
| `forge-performance` | Profiling, bundle optimization | sonnet |
| `forge-orchestrator` | Multi-agent coordination | opus |
| `forge-detective` | Root cause analysis, diagnostics | sonnet |
| `forge-refactor` | Code restructuring, DRY | sonnet |
| `forge-devops` | Docker, CI/CD, deployment | sonnet |
| `forge-api` | REST/GraphQL API design | sonnet |
| `forge-database` | Schema, migrations, query tuning | sonnet |
| `forge-ui` | Frontend components, UX | sonnet |
| `forge-docs` | Technical documentation | sonnet |
| `forge-analytics` | Metrics, monitoring | sonnet |
| `forge-compliance` | Regulatory, license auditing | sonnet |
| `forge-integration` | Third-party service connections | sonnet |
| `forge-learning` | Knowledge capture, team learning | sonnet |
| `release-sentinel` | Version management, releases | sonnet |
| `governance-verifier` | Quality gate enforcement | sonnet |
| `forge-oracle` | General advisory, decision support | sonnet |
| `NXTG-CEO-LOOP` | Executive oversight, strategic alignment | opus |

**Format:** Markdown with YAML frontmatter (`name`, `description`, `model`, `color`, `tools`). Body is the agent's system prompt.

### 29 Skills

| Category | Skills |
|----------|--------|
| **Core** | core-architecture, core-coding-standards, core-nxtg-forge, core-testing |
| **Domain** | architecture, coding-standards, documentation, security, testing-strategy, testing |
| **Frameworks** | claude-code-framework, claude-code-best-practices, codex-framework, gemini-framework |
| **Workflow** | dev-environment-patterns, git-workflow, runtime-validation |
| **Performance** | optimization, browser-debugging |
| **Knowledge** | skill-development, domain-knowledge, verify-governance |
| **Agent Roles** | agent-lead-architect, agent-backend-master, agent-cli-artisan, agent-platform-builder, agent-qa-sentinel, agent-development, agent-integration-specialist |

**Format:** `SKILL.md` with YAML frontmatter (`name`, `description`). Body is contextual knowledge auto-loaded when relevant.

### 6 Hooks

| Trigger | Script | Purpose |
|---------|--------|---------|
| UserPromptSubmit | `pre-task.sh` | Sync governance state, initialize context |
| Stop | `post-task.sh` | Quality checks on completed work |
| Stop | `audit-root-cleanliness.sh` | Flag unnecessary root files |
| Stop | `smoke-test-reminder.sh` | Remind to test after server/test changes |
| PostToolUse (Write) | `enforce-file-placement.sh` | Enforce file organization |
| PostToolUse (Edit/Write) | `governance-check.sh` | Advisory code quality check |

All hooks are **non-blocking** — they observe and advise, never prevent actions.

## MCP Server (Plugin-Side)

The plugin includes its own Node.js MCP server (8 tools) separate from forge-orchestrator's Rust MCP server (9 tools):

| Tool | Purpose |
|------|---------|
| `forge_get_health` | Health score (0-100, A-F grade) |
| `forge_get_governance_state` | Read `.claude/governance.json` |
| `forge_get_git_status` | Branch, commits, clean status |
| `forge_get_code_metrics` | Lines, files, deps, test ratio |
| `forge_run_tests` | Auto-detect runner (vitest/jest/pytest) |
| `forge_list_checkpoints` | Saved governance snapshots |
| `forge_security_scan` | Secrets, eval/exec, npm audit |
| `forge_open_dashboard` | Generate + launch HTML dashboard |

**Note:** These tools overlap conceptually with forge-orchestrator's MCP tools but run independently. The plugin's MCP server is lighter-weight and works without forge-orchestrator installed.

## Cross-Repo Integration

```
forge-plugin (this repo)    ──stdio MCP──►  forge-orchestrator (9 tools)
forge-plugin                ──spawns──►     forge-ui (http://localhost:5050)
```

- **forge-orchestrator** (`../forge-orchestrator/`): Rust CLI + MCP server. This plugin calls its 9 MCP tools via stdio for task management, knowledge capture, drift detection. The orchestrator runs independently as a binary.
- **forge-ui** (`../v3/`): React dashboard + Infinity Terminal. The `/forge:dashboard` command opens it in a browser.
- **MCP is the only integration layer.** No direct imports or shared code between repos.

### Two MCP Servers

| Server | Location | Runtime | Tools | Use Case |
|--------|----------|---------|-------|----------|
| **Orchestrator MCP** | forge-orchestrator | Rust (stdio) | 9 task/knowledge tools | Multi-agent task orchestration |
| **Plugin MCP** | forge-plugin | Node.js (stdio) | 8 governance tools | Project health, metrics, dashboard |

Both run as stdio MCP servers. Claude Code connects to both simultaneously when the plugin is installed and `forge` binary is in PATH.

**The Lego Snap (N-12):** As of v3.1.0, the plugin's `.mcp.json` registers BOTH MCP servers. When Claude Code loads the plugin, it automatically connects to:
1. `governance-mcp` — always available (Node.js, ships with plugin)
2. `orchestrator-mcp` — available when `forge` binary is installed (Rust, from forge-orchestrator)

Commands and agents are wired to call orchestrator MCP tools (`forge_get_tasks`, `forge_claim_task`, `forge_complete_task`, `forge_get_state`, `forge_get_plan`, `forge_capture_knowledge`, `forge_get_knowledge`, `forge_check_drift`, `forge_get_health`, `forge_set_project`) and gracefully fall back if the orchestrator is not running.

## File Format Conventions

### Commands (`*.md (slash commands)`)
```markdown
---
description: "Short description shown in /help"
---
# Command Title
Instructions for Claude Code to execute...
```

### Agents (`[AFRG]-*.md`)
```markdown
---
name: forge-agent-name
description: |
  When to use this agent...
  <example>...</example>
model: sonnet
color: cyan
tools: Glob, Grep, Read, Write, Edit, Bash, TodoWrite
---
# Agent System Prompt
Detailed personality and instructions...
```

### Skills (`SKILL.md`)
```markdown
---
name: Skill Name
description: When this skill is relevant...
---
# Skill Content
Contextual knowledge, patterns, best practices...
```

## Common Mistakes

- Adding build steps (this is a pure markdown plugin — no compilation)
- Creating duplicate MCP tools that conflict with forge-orchestrator's tools
- Making hooks blocking (all hooks must be advisory/non-blocking)
- Referencing absolute paths in commands (use `${CLAUDE_PLUGIN_ROOT}` instead)
- Forgetting YAML frontmatter in commands/agents/skills (required for discovery)

## Key Dimensions

- **Version:** 3.1.0
- **Components:** 21 commands, 22 agents, 29 skills, 6 hooks, 8 MCP tools
- **Build:** None (pure markdown, auto-loaded by Claude Code)
- **MCP Server:** Node.js ES module (`@modelcontextprotocol/sdk@^1.12.1`)
- **Repo:** github.com/nxtg-ai/forge-plugin

## ASIF Governance

This project is part of NXTG-Forge (P-03) in the ASIF portfolio (Developer Tools vertical).

On every session:
1. Read `../.asif/NEXUS.md` — check for `## CoS Directives` section
2. Execute any PENDING directives before other work (unless Asif overrides)
3. Write your response inline under each directive
4. Update initiative statuses in NEXUS if your work changes them
5. If you have questions for the CoS, add them under `## Team Questions` in NEXUS
