<p align="center">
  <img src="assets/forge-logo.png" alt="Forge" width="120">
</p>

# forge-plugin

[![MCP Registry](https://img.shields.io/badge/MCP_Registry-active-00b4ab)](https://registry.modelcontextprotocol.io) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![CI](https://github.com/nxtg-ai/forge-plugin/actions/workflows/quality-gates.yml/badge.svg)](https://github.com/nxtg-ai/forge-plugin/actions) [![GitHub stars](https://img.shields.io/github/stars/nxtg-ai/forge-plugin)](https://github.com/nxtg-ai/forge-plugin)

**Zero-dependency governance for Claude Code.**

This is L1: Vibe Coder.

Inside Claude Code, agents already coordinate well. They share orchestration and context. What's missing is judgment: automated checks that catch problems before they reach production, skills that encode your conventions, and hooks that validate before and after every task.

The plugin adds health scoring, gap analysis, quality gates, and specialized agents. Install in 30 seconds. No config. No dependencies. No runtime.

Every governance feature traces to a real failure mode. Hooks that validate before and after every task exist because I've watched audit findings pile up from shortcuts nobody caught in real time. Knowledge skills that encode project conventions exist because I've watched the same context re-explained across dozens of sessions. Gap analysis exists because the most expensive bugs are the ones you discover at deployment.

## Install

```bash
# Add the NXTG-Forge marketplace
claude plugin marketplace add nxtg-ai/forge-plugin

# Install the plugin
claude plugin install nxtg-forge
```

That's it. No build step. No config files. No runtime dependencies.

## What You Get

| Component | Count | What It Does |
|-----------|-------|-------------|
| Slash commands | 23 | Project health, gap analysis, feature planning, checkpoints, deployment, testing |
| Specialized agents | 33 | Builder, guardian, planner, detective, security, testing, refactor, docs, and more |
| Knowledge skills | 33 | Architecture, coding standards, OWASP security, testing strategy, git workflow |
| Security hooks | 4 | PreToolUse guards: block dangerous commands, secrets access, code injection, SQL injection |
| Governance hooks | 9 | Pre/post-task validation, quality checks, file placement, Semgrep auto-scan |
| MCP governance tools | 8 | Health scoring, git status, code metrics, security scanning |

## Key Commands

```
/forge:status              → Project health score at a glance
/forge:gap-analysis        → Find missing tests, docs, security gaps
/forge:feature "desc"      → Multi-agent feature development
/forge:checkpoint           → Save restorable project state
/forge:test                 → Run tests with detailed analysis
/forge:deploy               → Deploy with pre-flight validation
```

## How It Works

The plugin installs as agent definitions, command templates, skill documents, and hook scripts. Claude Code reads them directly. No compilation, no interpretation layer.

Governance hooks run automatically. Before every task, pre-task hooks validate that the work aligns with project constraints. After every task, post-task hooks check output quality. Governance becomes a background process, not a checklist item.

8 MCP governance tools expose health scoring, code metrics, and security scanning through the Model Context Protocol. Any tool in your workflow that speaks MCP can query NXTG-Forge's governance state.

## Upgrade Path

For multi-tool orchestration across Claude Code, Codex CLI, and Gemini CLI (file locking, shared knowledge, task boards), add the NXTG-Forge Orchestrator:

```bash
curl -fsSL https://forge.nxtg.ai/install.sh | sh
forge init
```

One Rust binary. 4MB. 356 tests. Zero runtime dependencies. The orchestrator is the delivery control plane that makes separate AI tools work as a team.

For visual dashboards and the Infinity Terminal (sessions that survive browser close, network drops, and server restarts), add NXTG-Forge UI:

```bash
git clone https://github.com/nxtg-ai/forge-ui && npm install && npm run dev
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
