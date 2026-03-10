# What is Forge?

You're using AI coding tools. Maybe Claude Code, maybe Codex, maybe Gemini. They're fast individually. But when you run two of them on the same repo, things break in familiar ways.

Claude refactors a module. Codex updates tests against the pre-refactor interface. Both save. Tests fail. Neither tool knows the other exists.

This is the same coordination problem human engineering teams have faced for decades. The solution has always been the same: shared state, exclusive access, and a plan.

**Forge is that coordination layer for AI coding tools.**

## What It Actually Does

Forge decomposes your project spec into tasks, assigns each task to the right AI tool, locks files so tools don't step on each other, captures every decision in a searchable knowledge base, and detects when work drifts from your spec.

It's the tech lead that never sleeps.

## Three Levels, Your Choice

Forge is designed as a graduated system. Start with what you need. Go deeper when the pain demands it.

<!-- VISUAL: A-01 — three-levels.svg -->

| Level | Name | What You Get | Install Time |
|-------|------|-------------|-------------|
| **L1** | Vibe Coder | 22 AI agents, 21 slash commands, automated quality checks inside Claude Code | 30 seconds |
| **L2** | Pro Builder | Multi-tool orchestration, file locking, task planning, knowledge capture, TUI dashboard | 60 seconds |
| **L3** | Ship Lord | Visual web dashboard, Infinity Terminal (sessions that survive browser close), full mission control | 2 minutes |

Each level builds on the last. Nothing forces you to go deeper. **Adoption follows the pain.**

- Using Claude Code solo? L1 gives you governance on autopilot.
- Running Claude + Codex on the same repo? L2 prevents them from conflicting.
- Managing a team or want visual oversight? L3 gives you the control room.

## The Problem, Concretely

Without orchestration, multi-tool AI development fails in predictable ways:

| Failure Mode | What Happens | Forge's Fix |
|-------------|-------------|------------|
| File conflicts | Two tools edit the same file simultaneously | Exclusive file locking per task |
| Lost context | Tool A's decisions aren't visible to Tool B | Shared knowledge base, auto-classified |
| No plan | Each tool works on whatever seems important | Dependency-aware task graph from your spec |
| Silent drift | Work diverges from the original spec | Drift detection compares progress vs. spec |
| No history | Decisions evaporate between sessions | Append-only event log + knowledge capture |

## How It Connects

Forge is three independent products that snap together via the Model Context Protocol (MCP):

```
forge-plugin (Claude Code)  ──MCP──►  forge-orchestrator (Rust binary)
                                              │
                                        forge-ui (React dashboard)
```

No shared code between the three. MCP is the only integration layer. Use any combination.

## Who It's For

**Solo developers** who use AI coding tools and want automated quality checks without overhead.

**Tech leads** managing teams where multiple developers use different AI tools on the same codebase.

**Platform engineers** who want a coordination substrate for AI-powered development pipelines.

## Next Steps

- [Quick Start (L1)](C-02-quick-start-l1.md) — Install the plugin, run your first command. 60 seconds.
- [Upgrade to Pro Builder (L2)](C-03-upgrade-to-pro-builder.md) — Add multi-tool orchestration when you need it.
