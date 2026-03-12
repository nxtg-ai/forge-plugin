# Slash Commands Reference

All 23 slash commands provided by the forge-plugin. These are available inside Claude Code after installing the plugin.

## Governance

| Command | Description |
|---------|------------|
| `/forge:status` | Display complete project state — health score, git status, test results, security scan. Zero-context-friendly (safe to run at any point). |
| `/forge:status-enhanced` | Enhanced status with detailed dashboard and metrics. Includes dependency analysis, code quality trends, and workstream breakdown. |
| `/forge:gap-analysis` | Analyze project gaps across 5 dimensions: testing, docs, security, architecture, and performance. Returns prioritized remediation plan. |
| `/forge:compliance` | Scan tech stack, check license compatibility, and generate SBOM (Software Bill of Materials). Covers OWASP, dependency licenses, and regulatory requirements. |
| `/forge:command-center` | Activate the orchestrator command center — connects to forge-orchestrator MCP tools for task management, knowledge queries, and drift detection. Requires L2. |

## Feature Development

| Command | Description |
|---------|------------|
| `/forge:feature "description"` | Add a new feature with full agent orchestration. Spawns planner → builder → tester → security reviewer. Pass a description of what you want to build. |
| `/forge:spec "description"` | Generate a technical specification for a feature. Produces architecture, data flow, API contracts, and test strategy. |
| `/forge:agent-assign` | Assign tasks to specialized agents. Routes work to the right agent based on task type (security, testing, performance, etc.). |
| `/forge:integrate` | Set up third-party service integrations. Guides through API key setup, SDK installation, and connection validation. |

## Quality & Testing

| Command | Description |
|---------|------------|
| `/forge:test` | Execute project tests with detailed analysis. Auto-detects test runner (vitest, jest, pytest, cargo test). Reports failures, coverage, and trends. |
| `/forge:deploy` | Deploy with pre-flight validation and safety checks. Runs quality gates, confirms branch state, and validates environment before deployment. |
| `/forge:optimize` | Analyze and optimize codebase for performance and maintainability. Covers bundle size, dependency weight, hot paths, and code complexity. |

## State Management

| Command | Description |
|---------|------------|
| `/forge:checkpoint` | Save a restorable project state checkpoint. Captures governance state, git status, and test results. Use before risky changes. |
| `/forge:restore` | Restore project state from a previously saved checkpoint. Rolls back governance state (does not roll back git changes). |
| `/forge:report` | Display comprehensive session activity report. Shows what was accomplished, what changed, and what's pending. |

## Documentation

| Command | Description |
|---------|------------|
| `/forge:docs-status` | Show documentation health and coverage. Reports which areas have docs, which are missing, and staleness indicators. |
| `/forge:docs-update` | Update stale documentation based on code changes. Identifies docs that reference outdated code and suggests updates. |
| `/forge:docs-audit` | Comprehensive documentation quality audit. Checks completeness, accuracy, and consistency across all doc files. |

## Setup & Maintenance

| Command | Description |
|---------|------------|
| `/forge:init` | Initialize Forge in a project — 60-second setup wizard. Creates governance hooks, detects project stack, and configures quality baselines. |
| `/forge:dashboard` | Open the Forge governance dashboard in your browser. Requires forge-ui (L3) to be running on port 5050. |
| `/forge:update` | Update Forge to the latest version. Syncs past Claude Code bug [#29071](https://github.com/anthropics/claude-code/issues/29071) which causes `git fetch` without `git merge`. |

## CEO Decision Loop

| Command | Description |
|---------|------------|
| `/forge:ceo-loop [max-iterations] [time-limit]` | Activate the CEO Decision Loop in ORBIT mode. Continuous multi-iteration governance cycle: OBSERVE pending decisions → REASON with precedent → BUILD decisions → INSPECT retrograde → TURN for next iteration. |
| `/forge:ceo-loop-cancel` | Cancel the active CEO Decision Loop gracefully. Sets the loop to inactive, writes a final summary, and preserves all decisions in the journal. |

## Usage Tips

- **Start with `/forge:status`** — it's the fastest way to understand any project's state
- **Use `/forge:gap-analysis` after major changes** — catches regressions across all 5 dimensions
- **Save checkpoints before risky changes** — `/forge:checkpoint` then `/forge:restore` if things go wrong
- **Commands work without L2** — all slash commands function with just the plugin installed. L2 (orchestrator) adds task management and knowledge features but is not required.
