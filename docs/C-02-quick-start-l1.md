# Quick Start — L1 Vibe Coder

Get AI-powered governance inside Claude Code in 30 seconds. No config. The health score needs Node.js 20 or newer, and the security guards need `jq`; see [what each part needs](../README.md#what-each-part-needs).

## Install

```bash
claude plugin marketplace add nxtg-ai/forge-plugin
claude plugin install nxtg-forge
```

That's it. The plugin loads 33 agents, 24 slash commands, 27 knowledge skills, and 27 hook registrations (including 4 blocking security guards). Everything is pure markdown — no build step, no compilation.

## Your First Command

Open Claude Code in any project and run:

```
/nxtg-forge:status
```

You'll see:

- **Project health score** — A through F grade based on 8 quality dimensions
- **Git status** — branch, uncommitted changes, recent commits
- **Test results** — test count, pass rate, coverage (if available)
- **Security scan** — patterns for secrets, unsafe code, dependency vulnerabilities

<!-- VISUAL: D-07 — health-score.gif -->

## Find What's Missing

```
/nxtg-forge:gap-analysis
```

This runs fixed checks across 5 dimensions and prints what they found. It makes no accuracy claim: the checks find what they look for, and a clean report does not mean nothing is wrong.

| Dimension | What It Checks |
|-----------|---------------|
| Testing | File ratio, coverage reports, missing test files |
| Documentation | README presence, inline docs, API documentation |
| Security | Hardcoded secrets, eval/exec usage, npm audit |
| Architecture | File organization, large files, circular patterns |
| Performance | Bundle size, dependency count, build configuration |

At least one recommendation follows the checks, then a model review labelled as carrying no accuracy claim.

## Build a Feature

```
/nxtg-forge:feature "add user authentication"
```

This runs an agent team inside Claude Code in three phases:

1. **Planner** confirms the interface contracts in the feature spec
2. **Builder** writes the source while **Testing** writes the tests, in parallel
3. **Guardian** runs a quality gate: tests pass, no type errors, no security issues

You watch. They coordinate. Guardian reports what it found.

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
| `forge_open_dashboard` | Write a static HTML health snapshot and open it in the browser |

These tools run automatically — agents and hooks call them as needed. You don't invoke them directly.

## Key Commands

| Command | What It Does |
|---------|-------------|
| `/nxtg-forge:status` | Project health at a glance |
| `/nxtg-forge:gap-analysis` | Find missing tests, docs, security gaps |
| `/nxtg-forge:feature "desc"` | Multi-agent feature development |
| `/nxtg-forge:test` | Run tests with analysis |
| `/nxtg-forge:checkpoint` | Save restorable project state |
| `/nxtg-forge:deploy` | Deploy with pre-flight checks |
| `/nxtg-forge:docs-audit` | Check documentation coverage |

## When to Upgrade

L1 works standalone. You never need to install anything else.

But if you start running **multiple AI tools** on the same codebase (for example Claude Code + Codex CLI), you'll hit file conflicts and lost context. That's when [L2 Pro Builder](C-03-upgrade-to-pro-builder.md) helps (Forge orchestrates Claude Code, with Codex CLI and Antigravity CLI (`agy`) as task runners).

Signs you need L2:
- Two AI tools edited the same file and one overwrote the other
- You're manually copy-pasting context between tools
- You want a task board that tracks what each tool is working on
- You need decisions and patterns to persist across sessions

## Next Steps

- [Upgrade to Pro Builder (L2)](C-03-upgrade-to-pro-builder.md) — Multi-tool orchestration
- [Slash Commands Reference](C-11-slash-commands.md) — All 24 commands in detail
- [Agents Reference](C-13-agents-skills.md) — When to use each of the 33 agents
