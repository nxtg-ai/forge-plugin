# The Three Levels

Forge is structured as three independent products that snap together. Each level adds capability without breaking the previous level. You choose your depth based on your needs.

## The Levels

<!-- VISUAL: A-01 — three-levels.svg -->

### L1: Vibe Coder

**Product**: forge-plugin (Claude Code plugin)
**Install**: `claude plugin marketplace add nxtg-ai/forge-plugin && claude plugin install nxtg-forge`
**What it adds**: 23 specialized agents, 23 slash commands, 32 knowledge skills, 7 governance hooks, 8 MCP tools

L1 gives you governance inside Claude Code. Health scoring, gap analysis, quality gates, and specialized agents for building, testing, security review, and documentation — all running automatically through hooks and on-demand through slash commands.

**You need L1 when**: You want automated quality checks on your AI-assisted development without leaving Claude Code.

**You don't need L2 yet when**: You're using Claude Code alone and don't run other AI tools on the same repo.

### L2: Pro Builder

**Product**: forge-plugin + forge-orchestrator (Rust binary)
**Install**: `curl -fsSL https://forge.nxtg.ai/install.sh | sh`
**What it adds**: File locking, task planning, knowledge capture, drift detection, TUI dashboard, headless mode, 10 additional MCP tools

L2 adds multi-tool orchestration. When you run Claude Code, Codex CLI, and Gemini CLI on the same codebase, the orchestrator prevents them from conflicting. It plans work, assigns tasks, locks files, captures decisions, and detects when work drifts from your spec.

**You need L2 when**: You're running multiple AI tools on the same codebase and hitting file conflicts, lost context, or coordination chaos.

**You don't need L3 yet when**: The terminal is sufficient for your workflow and you don't need visual oversight.

### L3: Ship Lord

**Product**: forge-plugin + forge-orchestrator + forge-ui (React dashboard)
**Install**: `git clone https://github.com/nxtg-ai/forge-ui && cd forge-ui && npm install && npm run dev`
**What it adds**: Visual web dashboard, Infinity Terminal (sessions survive browser close), real-time graphs, governance HUD, multi-device access

L3 adds a visual control room. Real-time dashboard with agent activity feeds, governance health visualization, and the Infinity Terminal — a browser-based terminal where sessions persist across browser close, network drops, and server restarts.

**You need L3 when**: You want visual oversight of multi-agent activity, need a terminal that never dies, or manage a team and want a shared dashboard.

## How They Connect

<!-- VISUAL: A-02 — lego-snap.svg -->

The three levels are independent git repos with no shared code. They connect through MCP (Model Context Protocol) — a stdio-based JSON-RPC 2.0 transport.

```
forge-plugin (Claude Code)  ──MCP──►  forge-orchestrator (Rust binary)
                                              │
                                        forge-ui (React dashboard)
```

When you install the orchestrator binary (`forge`), the L1 plugin auto-detects it in your PATH. The plugin's `.mcp.json` registers both MCP servers:

1. **governance-mcp** (Node.js, 8 tools) — ships with the plugin, always available
2. **orchestrator-mcp** (Rust, 10 tools) — available when `forge` is in PATH

No manual configuration. The plugin starts calling orchestrator tools automatically. If the orchestrator isn't installed, those tools simply don't appear — no errors, no warnings.

This is the **Lego Snap**: two independent pieces that click together through a standard protocol.

## Invariants

These rules are always true, regardless of which levels are installed:

- **L1 works completely standalone** — no errors referencing L2 or L3 components
- **L2 auto-activates** when the `forge` binary appears in PATH — no manual config
- **L3 is never required** for any CLI workflow — it's a visual layer, not a dependency
- **Each level can be removed** without breaking the others
- **Adoption follows the pain** — you go deeper when the problems at your current level demand it

## MCP Tool Distribution

| Server | Location | Runtime | Tools |
|--------|----------|---------|-------|
| governance-mcp | forge-plugin | Node.js | 8 (health, metrics, git, tests, security, checkpoints, governance state, dashboard) |
| orchestrator-mcp | forge-orchestrator | Rust | 10 (tasks, claims, completions, state, plan, knowledge, drift, health, project) |

Both servers run as stdio MCP servers. Claude Code connects to both simultaneously when both are available. No conflicts — the tool names are distinct.
