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
# Installed by Claude Code via: claude plugin marketplace add nxtg-ai/forge-plugin && claude plugin install nxtg-forge
```

## Plugin Structure

```
plugins/nxtg-forge/
├── .claude-plugin/
│   └── plugin.json           # Manifest (name, version, description)
├── .mcp.json                 # MCP server config (governance-mcp via stdio)
├── commands/                 # 23 slash commands (*.md)
├── agents/                   # 23 agent definitions (*.md)
├── skills/                   # 32 skill directories (*/SKILL.md)
├── hooks/                    # 6 governance hooks (bash scripts)
│   ├── hooks.json            # Hook trigger definitions
│   └── scripts/lib.sh        # Shared utilities
└── servers/
    └── governance-mcp/       # Node.js MCP server (index.mjs, 8 tools)
        ├── package.json      # @nxtg-forge/governance-mcp v3.5.1
        ├── index.mjs         # 835 lines, ES module
        └── start.sh          # Auto-install launcher
```

## Components

### 21 Slash Commands

| Category | Commands |
|----------|----------|
| **Governance** | `/forge:init`, `/forge:status`, `/forge:status-enhanced`, `/forge:gap-analysis`, `/forge:compliance`, `/forge:command-center` |
| **Feature Dev** | `/forge:feature`, `/forge:spec`, `/forge:agent-assign`, `/forge:integrate` |
| **Quality** | `/forge:test`, `/forge:deploy`, `/forge:optimize`, `/forge:update` |
| **State** | `/forge:checkpoint`, `/forge:restore`, `/forge:report` |
| **Docs** | `/forge:docs-status`, `/forge:docs-update`, `/forge:docs-audit` |
| **Dashboard** | `/forge:dashboard` |

**Format:** Markdown with YAML frontmatter (`description` field). Body contains structured instructions for Claude Code.

### 22 Agents

| Agent | Specialty | Model |
|-------|-----------|-------|
| `planner` | Architecture design, task breakdown | sonnet |
| `builder` | Feature implementation with tests | sonnet |
| `guardian` | Quality gates, pre-commit checks | sonnet |
| `security` | Vulnerability scanning, OWASP | sonnet |
| `testing` | Test generation, coverage analysis | sonnet |
| `performance` | Profiling, bundle optimization | sonnet |
| `orchestrator` | Multi-agent orchestration | opus |
| `detective` | Root cause analysis, diagnostics | sonnet |
| `refactor` | Code restructuring, DRY | sonnet |
| `devops` | Docker, CI/CD, deployment | sonnet |
| `api` | REST/GraphQL API design | sonnet |
| `database` | Schema, migrations, query tuning | sonnet |
| `ui` | Frontend components, UX | sonnet |
| `docs` | Technical documentation | sonnet |
| `analytics` | Metrics, monitoring | sonnet |
| `compliance` | Regulatory, license auditing | sonnet |
| `integration` | Third-party service connections | sonnet |
| `learning` | Knowledge capture, team learning | sonnet |
| `release-sentinel` | Version management, releases | sonnet |
| `governance-verifier` | Quality gate enforcement | sonnet |
| `oracle` | General advisory, decision support | sonnet |
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

### 13 Hook Scripts

| Trigger | Script | Purpose |
|---------|--------|---------|
| **PreToolUse (Bash)** | `security-command-guard.sh` | **BLOCKS** dangerous commands: `rm -rf /`, `chmod 777`, `curl\|sh`, fork bombs, force push to main |
| **PreToolUse (Read/Write/Edit)** | `security-secret-shield.sh` | **BLOCKS** access to `.env`, `*.pem`, `*.key`, credentials, `~/.ssh/` |
| **PreToolUse (Write/Edit)** | `security-injection-guard.sh` | **BLOCKS** `eval()`, `os.system()`, `subprocess(shell=True)`, `child_process.exec()` |
| **PreToolUse (Write/Edit)** | `security-sql-guard.sh` | **BLOCKS** string concatenation with SQL keywords (CWE-89) |
| UserPromptSubmit | `pre-task.sh` | Sync governance state, initialize context |
| Stop | `post-task.sh` | Quality checks on completed work |
| Stop | `audit-root-cleanliness.sh` | Flag unnecessary root files |
| Stop | `smoke-test-reminder.sh` | Remind to test after server/test changes |
| PostToolUse (Write) | `enforce-file-placement.sh` | Enforce file organization |
| PostToolUse (Edit/Write) | `governance-check.sh` | Advisory code quality check |
| **PostToolUse (Write/Edit)** | `security-semgrep-scan.sh` | Auto-runs Semgrep SAST on every file write/edit |

PreToolUse security hooks are **BLOCKING** (exit 2 = deny tool call). All other hooks are **advisory** (non-blocking).

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

### Three MCP Servers

| Server | Location | Runtime | Tools | Use Case |
|--------|----------|---------|-------|----------|
| **Orchestrator MCP** | forge-orchestrator | Rust (stdio) | 9 task/knowledge tools | Multi-agent task orchestration |
| **Plugin MCP** | forge-plugin | Node.js (stdio) | 8 governance tools | Project health, metrics, dashboard |
| **Semgrep MCP** | pip/uvx | Python (stdio) | SAST scanning tools | Static analysis via Semgrep |

All three run as stdio MCP servers. Claude Code connects to all simultaneously. Orchestrator-mcp requires `forge` binary; semgrep-mcp requires `pip install semgrep-mcp` or `uvx`. Both degrade gracefully if not installed.

**The Lego Snap (N-12):** As of v3.5.1, the plugin's `.mcp.json` registers BOTH MCP servers. When Claude Code loads the plugin, it automatically connects to:
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

### Agents (`*.md`)
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

- **Version:** 3.5.1
- **Components:** 23 commands, 33 agents, 33 skills, 13 hook scripts (8 PreToolUse + 5 PostToolUse + 4 Stop + 1 UserPromptSubmit), 8 MCP tools
- **MCP Servers:** 3 (governance-mcp Node.js, orchestrator-mcp Rust, semgrep-mcp Python)
- **Security Hooks:** 4 PreToolUse guards (command, secret, injection, SQL) + 1 PostToolUse Semgrep auto-scan
- **Build:** None (pure markdown, auto-loaded by Claude Code)
- **Repo:** github.com/nxtg-ai/forge-plugin

## ASIF Governance

This project is part of NXTG-Forge (P-03) in the ASIF portfolio (Developer Tools vertical).

On every session (check BOTH your own NEXUS and the program NEXUS):
1. Read `.asif/NEXUS.md` (your own) — check for `## CoS Directives` section
1a. ALSO read `../.asif/NEXUS.md` (program-level) — check for directives targeting this repo
2. Execute any PENDING directives before other work (unless Asif overrides)
3. Write your response inline under each directive
4. Update initiative statuses in NEXUS if your work changes them
5. If you have questions for the CoS, add them under `## Team Questions` in NEXUS

## Team Voice

Our voice is `am_eric`. Speak via:
  ~/ASIF/scripts/cos-speak-remote --voice am_eric "text"
Use on cycle exit, deliverable shipped, blocker, escalation.


## Release Protocol Enforcement (ASIF Standard, ADR-036)

This repo is currently NOT registered as a public-package distribution target, so the release-protocol gate skips on every push. Pre-push hook (Layer 1, `.git/hooks/pre-push`) and daily drift workflow (Layer 2) are installed and benign.

If this repo later publishes to a registry (npm, PyPI, crates.io, GitHub Packages, etc.), add `.asif-ci` at the repo root:

```
release_protocol_enabled: true
release_protocol_manifest: <path-to-published-manifest>
```

Then on each version bump in that manifest:
1. **Tag**: `git tag vX.Y.Z && git push origin vX.Y.Z`
2. **GH Release**: `gh release create vX.Y.Z --notes-from-tag`
3. **Publish**: `<registry-specific publish command>`
4. **CHANGELOG**: roll `[Unreleased]` → `[vX.Y.Z] — YYYY-MM-DD` in CHANGELOG.md
5. **Docs**: update any pinned version references in README.md / docs

Wolf's nightly sense pass surfaces drift portfolio-wide via `===SECTION:RELEASE_DRIFT===` once enabled.

**Bypass (EMERGENCY ONLY)**: `git push --no-verify` — and document the bypass in NEXUS or HANDOFF.
## Dx3 Brain Integration
On every session start, recall relevant context from Dx3 before starting work:
- Use recall() to check for prior decisions, lessons, and patterns related to your current task
- After shipping work, use remember() to store what you learned
- The brain at dx3-cognitive MCP has context from ALL projects — use it

This is how the portfolio compounds intelligence. Your work benefits from every other team's learning.
