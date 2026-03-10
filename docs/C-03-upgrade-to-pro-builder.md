# Upgrade to Pro Builder — L2

L1 gives you governance inside Claude Code. L2 adds **multi-tool orchestration** — file locking, task planning, knowledge capture, and a TUI dashboard that coordinates Claude, Codex, and Gemini as a team.

## When You Need This

You need L2 when you're running multiple AI tools on the same codebase and hitting these problems:

- **File conflicts** — Claude refactors a module while Codex updates tests against the old interface
- **Lost context** — decisions made in one tool aren't visible to the other
- **No coordination** — each tool works on whatever seems important, with no shared plan
- **Session amnesia** — patterns and learnings evaporate between sessions

If you're using Claude Code solo, [L1](C-02-quick-start-l1.md) is sufficient. L2 is for multi-tool workflows.

## Install

```bash
curl -fsSL https://forge.nxtg.ai/install.sh | sh
```

Single binary. 4 MB. No runtime dependencies. Works on Linux and macOS.

Or via Homebrew:
```bash
brew install nxtg-ai/tap/forge
```

## Quick Demo

Four commands to see what the orchestrator does:

<!-- VISUAL: D-01 — forge-init-to-status.gif -->

```bash
# 1. Initialize Forge in your project
forge init
# Creates .forge/ directory with state, event log, and knowledge base

# 2. Configure the AI brain
forge config brain openai
# Sets up GPT-4o for task planning (or use 'rule-based' for free heuristics)

# 3. Generate tasks from your project
forge plan --generate
# Reads your SPEC.md or README, decomposes into dependency-aware tasks

# 4. See the task board
forge status
# Shows tasks, assignments, dependencies, and project health
```

## The Dashboard

```bash
forge dashboard --pty
```

<!-- VISUAL: D-02 — forge-dashboard-tui.gif -->

This launches a TUI dashboard with:

- **Task board** — all tasks with status, assignment, dependencies
- **Agent panes** — live interactive terminals for each AI tool (Claude, Codex, Gemini)
- **Event log** — real-time audit trail of every action
- **Health status** — project health score in the header

Each agent runs in its own PTY session. You see their actual TUI, not piped text. Press `Tab` to switch between panes, `i` to attach to a pane (type directly into the agent), and `Esc` to detach.

## What You Get Over L1

| Capability | L1 (Plugin Only) | L2 (+ Orchestrator) |
|-----------|:-:|:-:|
| Health scoring | Yes | Yes |
| Gap analysis | Yes | Yes |
| Specialized agents | 22 | 22 + multi-tool dispatch |
| **File locking** | No | Yes — exclusive locks per task |
| **Task planning** | No | Yes — dependency-aware graphs |
| **Knowledge capture** | No | Yes — decisions, patterns, learnings |
| **Drift detection** | No | Yes — compares work vs. spec |
| **TUI dashboard** | No | Yes — live agent panes |
| **Headless mode** | No | Yes — `forge run` for CI/CD |
| **MCP tools** | 8 | 8 + 10 orchestrator tools |

## How It Connects to L1

When you install the orchestrator binary, the L1 plugin auto-detects it. The plugin's `.mcp.json` registers both MCP servers:

1. **governance-mcp** (Node.js, 8 tools) — always available
2. **orchestrator-mcp** (Rust, 10 tools) — available when `forge` is in PATH

No manual configuration. The plugin starts calling orchestrator tools (`forge_get_tasks`, `forge_claim_task`, `forge_complete_task`) automatically. This is the "Lego Snap" — two independent pieces that click together via MCP.

## Key Commands

```bash
forge init                     # Initialize Forge in a project
forge config brain openai      # Configure AI brain (or 'rule-based' for free)
forge plan --generate          # Generate task plan from spec
forge status                   # Task board + health summary
forge dashboard                # TUI dashboard (text output)
forge dashboard --pty          # TUI dashboard (interactive agent panes)
forge run                      # Headless autonomous execution
forge mcp                      # Start MCP server (stdio)
```

## File Locking in Practice

When the orchestrator assigns a task to an agent, it locks the task's target files. If another agent tries to claim a task that touches those same files, the claim is rejected until the lock is released.

```
Agent A claims T-001 (editing src/auth.rs, src/auth_test.rs)
  → Files locked to Agent A

Agent B claims T-002 (editing src/auth.rs, src/db.rs)
  → REJECTED: src/auth.rs is locked by Agent A

Agent A completes T-001
  → Files unlocked

Agent B claims T-002
  → Success: all files available
```

No configuration. No manual lock management. The orchestrator handles it.

## When to Upgrade to L3

L2 gives you everything you need for multi-tool orchestration from the terminal.

L3 ([Ship Lord](C-04-full-platform.md)) adds a **visual web dashboard** with real-time graphs, the **Infinity Terminal** (sessions that survive browser close and network drops), and full mission control. You need it when:

- You want visual oversight of agent activity across projects
- You need a terminal that persists across browser sessions
- You're managing a team and want a shared dashboard

## Next Steps

- [CLI Commands Reference](C-10-cli-commands.md) — All orchestrator commands in detail
- [MCP Tools Reference](C-12-mcp-tools.md) — 17 tools across both MCP servers
- [AI Brain Configuration](C-07-brain-config.md) — Rule-based vs. OpenAI, API keys
