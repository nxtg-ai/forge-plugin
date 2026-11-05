# NXTG-Forge Documentation

> Your AI Chief of Staff for software development. 33 specialized agents, 24 commands, 27 knowledge skills, 27 hook registrations (including 4 blocking security guards).

---

## How to Read These Docs

NXTG-Forge grows with you. Start where you are, level up when you're ready.

### L1: Vibe Coder

**What you have:** The forge-plugin installed in Claude Code.

**What you get:** All 33 agents, 24 slash commands, 27 skills, and 27 hook registrations (including 4 blocking security guards) — working inside Claude Code. The health score needs Node.js 20 or newer, and the security guards need `jq`.

**Start here:**
1. [/nxtg-forge:init](commands/init.md) — 60-second setup wizard
2. [/nxtg-forge:status](commands/status.md) — see your project's health at a glance
3. [/nxtg-forge:feature](commands/feature.md) — build your first feature with agent orchestration

**Read:** [Commands Reference](commands/README.md) for what you can do right now.

### L2: Pro Builder

**What you add:** The [forge-orchestrator](https://github.com/nxtg-ai/forge-orchestrator) Rust binary.

**What you unlock:** Multi-agent task management, persistent knowledge capture, vision drift detection, and cross-session memory. Agents coordinate through 12 MCP tools instead of working in isolation.

**Start here:**
1. Install: `curl -fsSL https://forge.nxtg.ai/install.sh | sh`
2. Initialize: `forge init` in your project
3. [/nxtg-forge:command-center](commands/command-center.md) — activate the orchestrator

**Read:** [Agents Reference](agents/README.md) to see which agents gain orchestrator superpowers.

### L3: Ship Lord

**What you add:** [forge-ui](https://github.com/nxtg-ai/forge-ui) — the visual governance dashboard.

**What you unlock:** A dashboard at `localhost:5050` (sign-in with an access token) with a 0-100 health score, a command center, and the Infinity Terminal (a browser terminal whose shell keeps running if the tab closes or the network drops).

**Start here:**
1. Clone and run: `git clone --branch v3.5.4 https://github.com/nxtg-ai/forge-ui && cd forge-ui && npm install && npm run dev`
2. Open `http://localhost:5050` and sign in with the access token (the forge-ui README shows how to print the sign-in link). [/nxtg-forge:dashboard](commands/dashboard.md) is separate: it writes a static HTML health snapshot and does not start forge-ui.

**Read:** The L3 sections in individual agent/command docs to see what becomes visual.

---

## Reference Sections

| Section | What's Inside | Count |
|---------|--------------|-------|
| [Agents](agents/README.md) | Autonomous AI specialists — each handles a domain | 33 |
| [Commands](commands/README.md) | Slash commands you type in Claude Code | 24 |
| [Skills](skills/README.md) | Knowledge that auto-loads when agents need it | 27 |
| [Levels](LEVELS.md) | L1 → L2 → L3 upgrade journey with feature matrix | 3 |
| [Glossary](GLOSSARY.md) | Every Forge term explained in plain language | 17 |

---

## The Architecture in 30 Seconds

```mermaid
graph TD
    U[You in Claude Code] -->|/nxtg-forge:feature| F[Feature Pipeline]
    F --> P[Planner agent]
    P -->|approved plan| B[Builder agent]
    P -->|approved plan| T[Testing agent]
    B & T -->|code + tests| G[Guardian agent]
    G -->|quality gates pass| S[Ship it]

    U -->|/nxtg-forge:status| H[Governance MCP]
    H --> HR[Health report: score, grade, gaps]

    U -->|/nxtg-forge:command-center| O[Orchestrator MCP - L2]
    O --> TM[Tasks + Knowledge + Drift Detection]
```

**Three products, one experience:**
- **forge-plugin** (L1): 33 agents, 24 commands, 27 skills, 27 hook registrations (including 4 blocking security guards), 2 MCP servers
- **forge-orchestrator** (L2): Rust binary. Task management, knowledge, governance via 12 MCP tools.
- **forge-ui** (L3): React dashboard. Health score, command center, Infinity Terminal.

**Three MCP servers:**
- **governance-mcp** (Node.js, 8 tools) — ships with the plugin; needs Node.js 20 or newer
- **orchestrator-mcp** (Rust, 12 tools) — registered by the companion plugin `nxtg-forge-orchestrator` (same marketplace; install.sh adds it) when the `forge` binary is installed (L2)
- **semgrep-mcp** (Python, SAST tools) — available when `uv` or `semgrep-mcp` is installed

No code dependencies between products. MCP is the only integration layer. Each works independently. Together, they're a force multiplier.

---

## Quick Reference

### Most-Used Commands
| Command | What It Does |
|---------|-------------|
| `/nxtg-forge:status` | Project health at a glance |
| `/nxtg-forge:feature "X"` | Build a feature with full agent orchestration |
| `/nxtg-forge:test` | Run tests with detailed analysis |
| `/nxtg-forge:gap-analysis` | Find gaps in testing, docs, security, architecture |
| `/nxtg-forge:checkpoint` | Save state before risky changes |

### Most-Used Agents
| Agent | When You Need It |
|-------|-----------------|
| [Builder](agents/builder.md) | Implement features from approved plans |
| [Planner](agents/planner.md) | Design architecture before building |
| [Guardian](agents/guardian.md) | Quality gates before committing |
| [Detective](agents/detective.md) | "What's wrong with this codebase?" |
| [Security](agents/security.md) | Vulnerability scanning and hardening |

---

## Guides & Deep Dives

| Guide | What It Covers |
|-------|---------------|
| [C-01: What is Forge?](C-01-what-is-forge.md) | Conceptual overview — problem, solution, architecture |
| [C-02: Quick Start (L1)](C-02-quick-start-l1.md) | Get running in 5 minutes |
| [C-03: Upgrade to Pro Builder](C-03-upgrade-to-pro-builder.md) | L2 install + what changes |
| [C-04: Full Platform](C-04-full-platform.md) | L3 dashboard setup |
| [C-05: First Governed Project](C-05-first-governed-project.md) | End-to-end walkthrough: init → plan → build → ship |
| [C-06: Multi-Agent Orchestration](C-06-multi-agent-orchestration.md) | How agents coordinate (L2) |
| [C-07: Brain Config](C-07-brain-config.md) | LLM backend configuration |
| [C-08: Dashboard Guide](C-08-dashboard-guide.md) | forge-ui features and usage (L3) |
| [C-10: CLI Commands](C-10-cli-commands.md) | `forge` binary command reference (L2) |
| [C-12: MCP Tools](C-12-mcp-tools.md) | All 20 Forge MCP tools (8 governance + 12 orchestrator), plus Semgrep's |
| [C-12: Three Levels](C-12-three-levels.md) | Detailed level architecture and invariants |
| [C-14: Health Scoring](C-14-health-scoring.md) | How the 0-100 health score works |
| [C-15: Troubleshooting](C-15-troubleshooting.md) | Common issues and fixes |

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
git clone --branch v3.5.4 https://github.com/nxtg-ai/forge-ui
cd forge-ui && npm install && npm run dev
```
