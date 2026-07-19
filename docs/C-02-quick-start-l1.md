# Quick Start — L1 Vibe Coder

Get AI-powered governance inside Claude Code in 30 seconds. No dependencies. No config. No runtime.

## Install

```bash
claude plugin marketplace add nxtg-ai/forge-plugin
claude plugin install nxtg-forge
```

That's it. The plugin loads 23 agents, 23 slash commands, 32 knowledge skills, and 7 governance hooks. Everything is pure markdown — no build step, no compilation.

## Your First Command

Open Claude Code in any project and run:

```
/forge:status
```

You'll see:

- **Project health score** — A through F grade based on 8 quality dimensions
- **Git status** — branch, uncommitted changes, recent commits
- **Test results** — test count, pass rate, coverage (if available)
- **Security scan** — patterns for secrets, unsafe code, dependency vulnerabilities

<!-- VISUAL: D-07 — health-score.gif -->

## Find What's Missing

```
/forge:gap-analysis
```

This scans your project across 5 dimensions and tells you exactly what's missing:

| Dimension | What It Checks |
|-----------|---------------|
| Testing | File ratio, coverage reports, missing test files |
| Documentation | README presence, inline docs, API documentation |
| Security | Hardcoded secrets, eval/exec usage, npm audit |
| Architecture | File organization, large files, circular patterns |
| Performance | Bundle size, dependency count, build configuration |

Each gap comes with an actionable recommendation and priority level.

## Build a Feature

```
/forge:feature "add user authentication"
```

This spawns a multi-agent team inside Claude Code:

1. **Planner** designs the architecture and breaks work into steps
2. **Builder** implements the feature with tests
3. **Guardian** runs quality checks on the output
4. **Security** reviews for vulnerabilities

You watch. They coordinate. The output is production-ready code with tests.

## What's Running Behind the Scenes

The plugin installs an MCP governance server that provides 8 tools:

| Tool | What It Does |
|------|-------------|
| `forge_get_governance_health` | Composite health score (0-100, A-F grade) |
| `forge_get_git_status` | Branch, commits, clean status |
| `forge_get_code_metrics` | Lines, files, dependencies, test ratio |
| `forge_run_tests` | Auto-detects runner (vitest/jest/pytest) |
| `forge_security_scan` | Pattern-based secret and vulnerability detection |
| `forge_list_checkpoints` | Saved governance snapshots |
| `forge_get_governance_state` | Full governance state object |
| `forge_open_dashboard` | Generate and launch HTML health dashboard |

These tools run automatically — agents and hooks call them as needed. You don't invoke them directly.

## Key Commands

| Command | What It Does |
|---------|-------------|
| `/forge:status` | Project health at a glance |
| `/forge:gap-analysis` | Find missing tests, docs, security gaps |
| `/forge:feature "desc"` | Multi-agent feature development |
| `/forge:test` | Run tests with analysis |
| `/forge:checkpoint` | Save restorable project state |
| `/forge:deploy` | Deploy with pre-flight checks |
| `/forge:docs-audit` | Check documentation coverage |

## When to Upgrade

L1 works standalone. You never need to install anything else.

But if you start running **multiple AI tools** on the same codebase (Claude Code + Codex + Gemini), you'll hit file conflicts and lost context. That's when [L2 Pro Builder](C-03-upgrade-to-pro-builder.md) earns its keep.

Signs you need L2:
- Two AI tools edited the same file and one overwrote the other
- You're manually copy-pasting context between tools
- You want a task board that tracks what each tool is working on
- You need decisions and patterns to persist across sessions

## Next Steps

- [Upgrade to Pro Builder (L2)](C-03-upgrade-to-pro-builder.md) — Multi-tool orchestration
- [Slash Commands Reference](C-11-slash-commands.md) — All 23 commands in detail
- [Agents Reference](C-13-agents-skills.md) — When to use each of the 23 agents
