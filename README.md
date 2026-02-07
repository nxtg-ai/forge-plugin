# NXTG-Forge

AI-powered development governance plugin for Claude Code.

Forge adds **20 slash commands**, **22 specialized agents**, **29 skills**, and **6 governance hooks** to your Claude Code environment. It provides automated quality gates, agent orchestration, project health monitoring, and multi-backend support (Claude Code, Codex, Gemini).

## Quick Start

```bash
# Install the plugin
claude plugin add nxtg-ai/forge-plugin

# Initialize in your project
/[FRG]-init

# Check project health
/[FRG]-status
```

## What You Get

### Commands (20)

| Command | Purpose |
|---------|---------|
| `/[FRG]-init` | Initialize Forge in a project (60-second setup wizard) |
| `/[FRG]-status` | Display project state (git, tests, types, governance) |
| `/[FRG]-status-enhanced` | Full dashboard with health score and metrics |
| `/[FRG]-test` | Run test suite with detailed analysis |
| `/[FRG]-checkpoint` | Save project state snapshot |
| `/[FRG]-restore` | Restore from a checkpoint |
| `/[FRG]-report` | Session activity report |
| `/[FRG]-gap-analysis` | Analyze gaps across testing, docs, security, architecture |
| `/[FRG]-enable-forge` | Activate command center with 4-option menu |
| `/[FRG]-feature` | Add a feature with full agent orchestration |
| `/[FRG]-deploy` | Pre-flight validation and deployment |
| `/[FRG]-optimize` | Codebase performance and maintainability analysis |
| `/[FRG]-spec` | Generate technical specifications |
| `/[FRG]-agent-assign` | Assign tasks to specialized agents |
| `/[FRG]-upgrade` | Detect and fix configuration gaps |
| `/[FRG]-integrate` | Set up third-party service integrations |
| `/[FRG]-compliance` | License compatibility and SBOM generation |
| `/[FRG]-docs-status` | Documentation health and coverage |
| `/[FRG]-docs-update` | Detect and fix stale documentation |
| `/[FRG]-docs-audit` | Full documentation quality audit |

### Agents (22)

Specialized subagents that Claude Code can invoke automatically based on task context:

- **Builder** — Feature implementation with tests and documentation
- **Planner** — Architecture design and task breakdown
- **Guardian** — Quality gates, security validation, pre-commit checks
- **Detective** — Project health analysis and diagnostic investigation
- **Security** — Vulnerability scanning and security hardening
- **Testing** — Test generation and coverage analysis
- **Performance** — Profiling, bundle analysis, optimization
- **Refactor** — Code restructuring and complexity reduction
- **API** — Endpoint design and API integration
- **Database** — Schema design, migrations, query optimization
- **UI** — Component development, styling, accessibility
- **DevOps** — Docker, CI/CD, deployment automation
- **Docs** — Documentation generation and maintenance
- **Analytics** — Metrics tracking and usage analysis
- **Compliance** — License auditing and regulatory compliance
- **Integration** — External service connections
- **Learning** — Pattern recognition and recommendation improvement
- **Release Sentinel** — Documentation sync with code changes
- **Governance Verifier** — Automated governance validation
- **Orchestrator** — Multi-agent coordination
- **Oracle** — Proactive governance sentinel for autonomous development
- **CEO Loop** — Autonomous strategic decision-making

### Skills (29)

Auto-activating knowledge modules that inform Claude Code's responses:

- Architecture, coding standards, testing strategy, security
- Claude Code framework, Codex framework, Gemini framework
- Agent development, skill development, runtime validation
- Domain knowledge, git workflow, documentation standards
- 6 specialized agent role skills (backend, CLI, architect, platform, integration, QA)

### Hooks (6)

Advisory governance hooks that run automatically:

| Event | Hook | Purpose |
|-------|------|---------|
| UserPromptSubmit | pre-task.sh | State sync and initialization |
| Stop | post-task.sh | Quality checks on task completion |
| Stop | audit-root-cleanliness.sh | Prevent file sprawl in project root |
| Stop | smoke-test-reminder.sh | Remind to test after server/test changes |
| PostToolUse (Write) | enforce-file-placement.sh | Enforce file organization rules |
| PostToolUse (Edit/Write) | governance-check.sh | Advisory code quality check |

All hooks are **non-blocking** — they observe and advise, they do not prevent actions.

## Requirements

- [Claude Code](https://claude.ai/claude-code) CLI
- Git (for project status commands)
- Node.js 18+ (for test commands)

## Architecture

Forge is a **pure-markdown plugin** — no TypeScript compilation, no npm dependencies, no running services. Everything is Claude Code commands, agents, and skills defined in markdown files.

The plugin works by extending Claude Code's native capabilities:
- Commands use Claude's built-in tools (Bash, Read, Write, Glob, Grep)
- Agents are invoked via Claude's Task tool with specialized system prompts
- Skills provide context that Claude loads automatically based on task relevance
- Hooks run shell scripts in response to Claude Code events

## License

MIT
