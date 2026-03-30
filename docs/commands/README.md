# Commands Reference

> 23 slash commands that turn Claude Code into a governed development platform. Type `/forge:` and Tab to see them all.

---

## How Commands Work

Commands are slash-invoked actions you type directly in Claude Code. Each one is a markdown file with structured instructions — Claude reads the command definition and executes it step by step.

Commands work at **L1** (plugin only) unless noted otherwise. Some commands pull additional data from the forge-orchestrator at L2, and one command requires forge-ui at L3.

---

## Command Selection Guide

**First time using Forge?**
→ [/forge:init](init.md) — 60-second setup, then [/forge:status](status.md) to see your project

**Want to build something?**
→ [/forge:feature](feature.md) orchestrates the full cycle, or [/forge:spec](spec.md) for just the design

**Shipping code?**
→ [/forge:test](test.md) → [/forge:deploy](deploy.md) — test then deploy with safety checks

**Worried about quality?**
→ [/forge:gap-analysis](gap-analysis.md) for a full audit, [/forge:compliance](compliance.md) for licenses and regulations

**Managing state?**
→ [/forge:checkpoint](checkpoint.md) before risky changes, [/forge:restore](restore.md) if things go wrong

---

## All 23 Commands by Category

### Governance

Project health, quality metrics, and compliance — the bird's-eye view.

| Command | What It Does |
|---------|-------------|
| [/forge:init](init.md) | 60-second setup wizard — detects your stack, captures your vision, creates governance config |
| [/forge:status](status.md) | Project health at a glance — git, tests, security, governance, orchestrator state |
| [/forge:status-enhanced](status-enhanced.md) | Deep status with dependency analysis, code quality trends, workstream breakdown |
| [/forge:gap-analysis](gap-analysis.md) | Analyze gaps across 5 dimensions: testing, docs, security, architecture, performance |
| [/forge:compliance](compliance.md) | License compatibility, OWASP checks, SBOM generation, regulatory scanning |
| [/forge:command-center](command-center.md) | Activate the 4-option command center with orchestrator integration **(L2)** |

### Feature Development

From idea to implementation with agent orchestration.

| Command | What It Does |
|---------|-------------|
| [/forge:feature](feature.md) | Full agent pipeline: Planner → Builder → Tester → Security — from description to working code |
| [/forge:spec](spec.md) | Generate technical specifications — architecture, data flow, API contracts, test strategy |
| [/forge:agent-assign](agent-assign.md) | Route tasks to specialized agents by type — security, testing, performance, etc. |
| [/forge:integrate](integrate.md) | Set up third-party integrations — API keys, SDKs, connection validation |

### Quality & Testing

Test, optimize, deploy — with safety nets.

| Command | What It Does |
|---------|-------------|
| [/forge:test](test.md) | Auto-detect test runner, execute tests, report failures, coverage, and trends |
| [/forge:deploy](deploy.md) | Pre-flight validation + deployment — quality gates, branch state, environment checks |
| [/forge:optimize](optimize.md) | Performance and maintainability analysis — bundle size, dependencies, complexity |

### State Management

Checkpoints and recovery — because risky changes need safety nets.

| Command | What It Does |
|---------|-------------|
| [/forge:checkpoint](checkpoint.md) | Save a restorable governance state snapshot — use before risky changes |
| [/forge:restore](restore.md) | Roll back governance state from a saved checkpoint |
| [/forge:report](report.md) | Session activity report — what changed, what's pending, what shipped |

### Documentation

Keep docs alive and accurate as code evolves.

| Command | What It Does |
|---------|-------------|
| [/forge:docs-status](docs-status.md) | Documentation health and coverage — what exists, what's missing, what's stale |
| [/forge:docs-update](docs-update.md) | Update stale docs based on code changes — finds outdated references and suggests fixes |
| [/forge:docs-audit](docs-audit.md) | Full documentation quality audit — completeness, accuracy, consistency |

### Setup & Maintenance

Install, configure, and keep Forge current.

| Command | What It Does |
|---------|-------------|
| [/forge:dashboard](dashboard.md) | Open the governance dashboard in your browser **(L3 — requires forge-ui on port 5050)** |
| [/forge:update](update.md) | Update Forge plugin to latest version (works around Claude Code git sync issues) |

### CEO Decision Loop

Autonomous strategic governance — the executive brain.

| Command | What It Does |
|---------|-------------|
| [/forge:ceo-loop](ceo-loop.md) | Start ORBIT governance cycle — OBSERVE → REASON → BUILD → INSPECT → TURN |
| [/forge:ceo-loop-cancel](ceo-loop-cancel.md) | Gracefully stop the CEO loop — preserves all decisions in the journal |

---

## Command Cheat Sheet

### The Daily Workflow
```
/forge:status              # Start of session — what's the state?
/forge:feature "add X"     # Build something
/forge:test                # Verify it works
/forge:gap-analysis        # Catch what you missed
```

### Before Risky Changes
```
/forge:checkpoint          # Save state
# ... do risky work ...
/forge:restore             # Roll back if needed
```

### Before a Release
```
/forge:test                # All tests pass
/forge:compliance          # License + security clean
/forge:docs-audit          # Docs accurate
/forge:deploy              # Ship it
```

### Deep Analysis
```
/forge:gap-analysis --scope security    # Just security gaps
/forge:gap-analysis --fix               # Gaps + remediation plan
/forge:status-enhanced                  # Full diagnostic
```

---

## Level Requirements

| Level | Commands Available |
|-------|-------------------|
| **L1 Vibe Coder** | All commands except /forge:command-center and /forge:dashboard |
| **L2 Pro Builder** | + /forge:command-center (orchestrator integration) |
| **L3 Ship Lord** | + /forge:dashboard (visual governance UI) |

Commands that work at L1 but gain features at L2: `/forge:status` (adds orchestrator state), `/forge:feature` (adds task tracking), `/forge:gap-analysis` (adds knowledge queries).
