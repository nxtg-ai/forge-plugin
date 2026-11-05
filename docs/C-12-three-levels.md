# The Three Levels

Forge is structured as three independent products that snap together. Each level adds capability without breaking the previous level. You choose your depth based on your needs.

## The Levels

<!-- VISUAL: A-01 — three-levels.svg -->

### L1: Vibe Coder

**Product**: forge-plugin (Claude Code plugin)
**Install**: `claude plugin marketplace add nxtg-ai/forge-plugin && claude plugin install nxtg-forge`
**What it adds**: 33 specialized agents, 24 slash commands, 27 knowledge skills, 27 hook registrations, 8 MCP tools

L1 gives you governance inside Claude Code. Health scoring, gap analysis, quality gates, and specialized agents for building, testing, security review, and documentation — all running automatically through hooks and on-demand through slash commands.

**You need L1 when**: You want automated quality checks on your AI-assisted development without leaving Claude Code.

**You don't need L2 yet when**: You're using Claude Code alone and don't run other AI tools on the same repo.

### L2: Pro Builder

**Product**: forge-plugin + forge-orchestrator (Rust binary) + the companion plugin `nxtg-forge-orchestrator`
**Install**: `curl -fsSL https://forge.nxtg.ai/install.sh | sh`, then `claude plugin install nxtg-forge-orchestrator@nxtg-forge`
**What it adds**: File locking, task planning, knowledge capture, drift detection, TUI dashboard, headless mode, 12 additional MCP tools

L2 adds multi-tool orchestration. When you run several AI tools on the same codebase (Claude Code, with Codex CLI and Antigravity CLI (`agy`) as task runners), the orchestrator prevents them from conflicting. It plans work, assigns tasks, locks files, captures decisions, and detects when work drifts from your spec.

**You need L2 when**: You're running multiple AI tools on the same codebase and hitting file conflicts, lost context, or coordination chaos.

**You don't need L3 yet when**: The terminal is sufficient for your workflow and you don't need visual oversight.

### L3: Ship Lord

**Product**: forge-plugin + forge-orchestrator + forge-ui (React dashboard)
**Install**: `git clone --branch v3.5.6 https://github.com/nxtg-ai/forge-ui && cd forge-ui && npm install && npm run dev` (sign in with the access token, see the forge-ui README)
**What it adds**: Visual web dashboard, Infinity Terminal (sessions survive a closed tab), real-time graphs, governance HUD, multi-device access

L3 adds a browser dashboard: a governance dashboard with a health score, a command center that runs a fixed set of project commands, and the Infinity Terminal — a browser-based terminal whose shell keeps running across a closed tab or a network drop (reopen within 5 minutes); restarting the forge-ui server ends it.

**You need L3 when**: You want visual oversight of multi-agent activity, need a terminal that survives a closed tab, or manage a team and want a shared dashboard.

## How They Connect

<!-- VISUAL: A-02 — lego-snap.svg -->

The three levels are independent git repos with no shared code. They connect through MCP (Model Context Protocol) — a stdio-based JSON-RPC 2.0 transport.

```
forge-plugin (Claude Code)  ──MCP──►  forge-orchestrator (Rust binary)
                                              │
                                        forge-ui (React dashboard)
```

Two plugins register the MCP servers:

1. **governance-mcp** (Node.js, 8 tools) — registered by `nxtg-forge`, ships with the plugin
2. **orchestrator-mcp** (Rust, 12 tools) — registered by the companion plugin `nxtg-forge-orchestrator`; available when that plugin and the `forge` binary are installed

Once both are installed, commands and agents call orchestrator tools when they are present. If the orchestrator isn't installed, those tools don't appear and the session-start hook prints one optional install line.

This is the **Lego Snap**: two independent pieces that click together through a standard protocol.

## Invariants

These rules are always true, regardless of which levels are installed:

- **L1 works completely standalone** — no errors referencing L2 or L3 components
- **L2 activates** when the `forge` binary and the companion plugin `nxtg-forge-orchestrator` are both installed (new session)
- **L3 is never required** for any CLI workflow — it's a visual layer, not a dependency
- **Each level can be removed** without breaking the others
- **Adoption follows the pain** — you go deeper when the problems at your current level demand it

## MCP Tool Distribution

| Server | Location | Runtime | Tools |
|--------|----------|---------|-------|
| governance-mcp | forge-plugin | Node.js | 8 (health, metrics, git, tests, security, checkpoints, governance state, dashboard) |
| orchestrator-mcp | nxtg-forge-orchestrator (runs `forge mcp`) | Rust | 12 (tasks, task creation, claims, completions, state, plan, events, knowledge, drift, health, project) |

Both servers run as stdio MCP servers. Claude Code connects to both simultaneously when both are available. No conflicts — the tool names are distinct.
