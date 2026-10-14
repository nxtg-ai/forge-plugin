<p align="center">
  <img src="assets/forge-logo.png" alt="Forge" width="120">
</p>

# forge-plugin

[![stage: public preview](https://img.shields.io/badge/stage-public_preview-blue)](STAGE) [![MCP Registry](https://img.shields.io/badge/MCP_Registry-active-00b4ab)](https://registry.modelcontextprotocol.io) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![CI](https://github.com/nxtg-ai/forge-plugin/actions/workflows/quality-gates.yml/badge.svg)](https://github.com/nxtg-ai/forge-plugin/actions) [![GitHub stars](https://img.shields.io/github/stars/nxtg-ai/forge-plugin)](https://github.com/nxtg-ai/forge-plugin)

**Stage: Public preview.** Forge is public: anyone may install and use it. Its maturity is below alpha (pre-alpha): no SLA, and interfaces may change without notice.

**Zero-dependency governance for Claude Code.** *(Today, health scoring needs Node.js 20+; build B3, target 2026-10-20.)*

This is L1: Vibe Coder.

Inside Claude Code, agents already coordinate well. They share orchestration and context. What's missing is judgment: automated checks that catch problems before they reach production, skills that encode your conventions, and hooks that validate before and after every task.

The plugin adds health scoring, gap analysis, quality gates, and specialized agents. Install in 30 seconds. No config. Health scoring needs Node.js 20 or newer; [what each part needs](#what-each-part-needs) is below.

Every governance feature traces to a real failure mode. Hooks that validate before and after every task exist because I've watched audit findings pile up from shortcuts nobody caught in real time. Knowledge skills that encode project conventions exist because I've watched the same context re-explained across dozens of sessions. Gap analysis exists because the most expensive bugs are the ones you discover at deployment.

## Install

```bash
# Add the NXTG-Forge marketplace
claude plugin marketplace add nxtg-ai/forge-plugin

# Install the plugin
claude plugin install nxtg-forge
```

That's it. No build step. No config files.

### What each part needs

| Part | Needs | Without it |
|------|-------|------------|
| Commands, agents, skills, advisory hooks | Claude Code and bash | — |
| 4 blocking security guards | `jq`, or `awk` (present on Linux and macOS) | With neither, the guards block every call they cover, and Forge says why |
| Health score and governance tools (`governance-mcp`) | Node.js 20 or newer, with npm on first start | `/nxtg-forge:status` shows "Not scored", and Forge says Node is missing |
| Orchestrator, L2 (`orchestrator-mcp`) | The `forge` binary: `curl -fsSL https://forge.nxtg.ai/install.sh \| sh` | Optional. Status shows "Not connected" with the install line; once installed, "Connected; not initialized here" until you run `forge init` |
| Semgrep tools (`semgrep-mcp`) | `uv` (for `uvx`) or `pip install semgrep-mcp` | Optional |

A server whose runtime is missing still connects, with no tools and a message that names the fix, so it never shows as a failed install. Whatever you install later is picked up by your next new Claude Code session. The plugin finds `forge` in `~/.local/bin` even when that directory is not on your PATH.

Either init sets a project up. `/nxtg-forge:init` writes `.claude/governance.json` (project vision, goals and quality gates), and `forge init` writes `.forge/governance.json`. The plugin accepts either one and reads `.claude/` first, so after `forge init` you are never asked to run a second init.

## What You Get

| Component | Count | What It Does |
|-----------|-------|-------------|
| Slash commands | 23 | Project health, gap analysis, feature planning, checkpoints, deployment, testing |
| Specialized agents | 33 | Builder, guardian, planner, detective, security, testing, refactor, docs, and more |
| Knowledge skills | 27 | Architecture, coding standards, OWASP security, testing strategy, git workflow |
| Security hooks | 4 | PreToolUse guards: block dangerous commands, secrets access, code injection, SQL injection |
| Governance hooks | 8 | Pre/post-task validation, quality checks, file placement, Semgrep auto-scan |
| MCP governance tools | 8 | Health scoring, git status, code metrics, security scanning |

## Key Commands

```
/nxtg-forge:status              → Project health score at a glance
/nxtg-forge:gap-analysis        → Optional review prompt (no accuracy claim, see below)
/nxtg-forge:feature "desc"      → Multi-agent feature development
/nxtg-forge:checkpoint           → Save restorable project state
/nxtg-forge:test                 → Run tests with detailed analysis
/nxtg-forge:deploy               → Deploy with pre-flight validation
```

### Review commands are optional conveniences

`/nxtg-forge:gap-analysis` and `/nxtg-forge:crucible-audit` are structured review prompts. They make **no accuracy claim**: a prompt finds what the model finds, and a clean report is not evidence that nothing is wrong. On two deliberately seeded public cases, [forge-done-fixture](https://github.com/nxtg-ai/forge-done-fixture) and [forge-done-fixture-2](https://github.com/nxtg-ai/forge-done-fixture-2), a plain review prompt found the same defects as both commands, at roughly a third to a quarter of their cost (fixtures 1 and 2, 24 runs). Use them if you like the structure; they are not a substitute for running the tests.

## How It Works

The plugin installs as agent definitions, command templates, skill documents, and hook scripts. Claude Code reads them directly. No compilation, no interpretation layer.

Governance hooks run automatically. Before every task, pre-task hooks validate that the work aligns with project constraints. After every task, post-task hooks check output quality. Governance becomes a background process, not a checklist item.

8 MCP governance tools expose health scoring, code metrics, and security scanning through the Model Context Protocol. Any tool in your workflow that speaks MCP can query NXTG-Forge's governance state.

## Upgrade Path

For multi-tool orchestration (file locking, shared knowledge, task boards), add the NXTG-Forge Orchestrator. Today it is for Claude Code; Codex CLI as a task runner; Gemini CLI support in development (build B1, target 2026-10-27):

```bash
curl -fsSL https://forge.nxtg.ai/install.sh | sh
forge init
```

One Rust binary. 4MB. 356 tests. Zero runtime dependencies. The orchestrator is the delivery control plane that makes separate AI tools work as a team.

Once `forge init` has run, `/nxtg-forge:feature` tracks each feature as an orchestrator task. It writes a one-heading spec to `.forge/feature-requests/F-NNN.md`, runs `forge plan --generate --spec` on it, claims the new task as `claude`, and completes it with a summary of the work. An existing `.forge/plan.md` is kept: the feature's plan is appended below it, and a copy of the plan as it was is saved next to the spec.

For visual dashboards and the Infinity Terminal (sessions that survive browser close, network drops, and server restarts), add NXTG-Forge UI:

```bash
git clone https://github.com/nxtg-ai/forge-ui && cd forge-ui && npm install && npm run dev
```

58 components. 4,165 tests. 87% coverage.

Each depth builds on the last. Nothing forces you to go deeper. Adoption follows the pain.

## Links

- [Documentation](https://forge.nxtg.ai/forge/docs) — Quick Start, commands, agents, skills
- [NXTG-Forge Product Page](https://forge.nxtg.ai)
- [NXTG-Forge Orchestrator](https://github.com/nxtg-ai/forge-orchestrator) (L2: Pro Builder)
- [NXTG-Forge UI](https://github.com/nxtg-ai/forge-ui) (L3: Ship Lord)

## License

See [LICENSE](./LICENSE).
