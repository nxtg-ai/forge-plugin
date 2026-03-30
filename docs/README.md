# NXTG-Forge Documentation

> Your AI Chief of Staff for software development. 33 specialized agents, 23 commands, 32 knowledge skills — orchestrated intelligence that makes you mass-productive.

---

## How to Read These Docs

NXTG-Forge grows with you. Start where you are, level up when you're ready.

### L1: Vibe Coder

**What you have:** The forge-plugin installed in Claude Code.

**What you get:** All 33 agents, 23 slash commands, 32 skills, and 7 governance hooks — working inside Claude Code with zero additional setup.

**Start here:**
1. [/forge:init](commands/init.md) — 60-second setup wizard
2. [/forge:status](commands/status.md) — see your project's health at a glance
3. [/forge:feature](commands/feature.md) — build your first feature with agent orchestration

**Read:** [Commands Reference](commands/README.md) for what you can do right now.

### L2: Pro Builder

**What you add:** The [forge-orchestrator](https://github.com/nxtg-ai/forge-orchestrator) Rust binary.

**What you unlock:** Multi-agent task management, persistent knowledge capture, vision drift detection, and cross-session memory. Agents coordinate through 10 MCP tools instead of working in isolation.

**Start here:**
1. Install: `curl -fsSL https://forge.nxtg.ai/install.sh | sh`
2. Initialize: `forge init` in your project
3. [/forge:command-center](commands/command-center.md) — activate the orchestrator

**Read:** [Agents Reference](agents/README.md) to see which agents gain orchestrator superpowers.

### L3: Ship Lord

**What you add:** [forge-ui](https://github.com/nxtg-ai/forge-ui) — the visual governance dashboard.

**What you unlock:** Real-time dashboard at `localhost:5050` with task boards, health visualizations, agent activity feeds, and the Infinity Terminal (browser-based terminal that survives disconnects).

**Start here:**
1. Clone and run: `cd forge-ui && npm install && npm run dev`
2. [/forge:dashboard](commands/dashboard.md) — open the dashboard

**Read:** The L3 sections in individual agent/command docs to see what becomes visual.

---

## Reference Sections

| Section | What's Inside | Count |
|---------|--------------|-------|
| [Agents](agents/README.md) | Autonomous AI specialists — each handles a domain | 33 |
| [Commands](commands/README.md) | Slash commands you type in Claude Code | 23 |
| [Skills](skills/README.md) | Knowledge that auto-loads when agents need it | 32 |

---

## The Architecture in 30 Seconds

```
You (in Claude Code)
  │
  ├── type /forge:feature "add auth"
  │     └── Planner agent designs architecture
  │           └── Builder agent writes the code
  │                 └── Testing agent writes tests (parallel)
  │                       └── Guardian agent runs quality gates
  │
  ├── type /forge:status
  │     └── Governance MCP checks health, tests, security
  │           └── Returns visual health report with scores
  │
  └── type /forge:command-center (L2)
        └── Orchestrator coordinates everything
              └── Tasks, knowledge, drift detection via MCP
```

**Three products, one experience:**
- **forge-plugin** (L1): Pure markdown. Commands, agents, skills loaded by Claude Code at runtime.
- **forge-orchestrator** (L2): Rust binary. Task management, knowledge, governance via MCP.
- **forge-ui** (L3): React dashboard. Visual governance, Infinity Terminal, real-time feeds.

No code dependencies between them. MCP (Model Context Protocol) is the only integration layer. Each product works independently. Together, they're a force multiplier.

---

## Quick Reference

### Most-Used Commands
| Command | What It Does |
|---------|-------------|
| `/forge:status` | Project health at a glance |
| `/forge:feature "X"` | Build a feature with full agent orchestration |
| `/forge:test` | Run tests with detailed analysis |
| `/forge:gap-analysis` | Find gaps in testing, docs, security, architecture |
| `/forge:checkpoint` | Save state before risky changes |

### Most-Used Agents
| Agent | When You Need It |
|-------|-----------------|
| [Builder](agents/builder.md) | Implement features from approved plans |
| [Planner](agents/planner.md) | Design architecture before building |
| [Guardian](agents/guardian.md) | Quality gates before committing |
| [Detective](agents/detective.md) | "What's wrong with this codebase?" |
| [Security](agents/security.md) | Vulnerability scanning and hardening |

---

## Installation

```bash
# Install the plugin (L1 — all you need to start)
claude plugin marketplace add nxtg-ai/forge-plugin
claude plugin install nxtg-forge

# Add the orchestrator (L2 — multi-agent coordination)
curl -fsSL https://forge.nxtg.ai/install.sh | sh
forge init

# Add the dashboard (L3 — visual governance)
git clone https://github.com/nxtg-ai/forge-ui
cd forge-ui && npm install && npm run dev
```
