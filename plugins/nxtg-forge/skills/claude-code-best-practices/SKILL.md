---
name: Claude Code Best Practices
description: >
  Actionable best practices for building and operating with Claude Code — CLAUDE.md
  memory, custom slash commands, subagents, skills, hooks, MCP servers, permissions,
  and headless/CI workflows. Use when writing or reviewing a CLAUDE.md, authoring a
  command/agent/skill/hook, configuring settings.json or permissions, debugging why an
  agent or skill won't auto-trigger, setting up worktree/parallel or CI (headless)
  workflows, or answering "how should I structure this for Claude Code."
when_to_use: >
  Triggers: "write a CLAUDE.md", "add a slash command", "create a subagent/skill/hook",
  "configure settings.json / permissions / allowedTools", "why won't my agent trigger",
  "run Claude Code in CI / headless", "git worktree parallel sessions", "MCP server setup",
  "context is bloating / clear context", "TDD workflow with Claude Code".
allowed-tools: Read, Grep, Glob
---

# Claude Code Best Practices

Procedural guidance for authoring Claude Code extensions (CLAUDE.md, commands, agents,
skills, hooks, MCP) and running effective sessions. Apply these directly; deep syntax
lives in the linked reference files.

## Core operating rules

1. **Plan before code on anything non-trivial.** Use Plan Mode (or a written plan) to
   agree on approach before edits. Discussion-then-code catches wrong turns cheaply.
2. **Keep CLAUDE.md lean and failure-focused.** Document what Claude gets *wrong* in this
   repo (build quirks, forbidden paths, naming rules), not what it does right. Target
   ~100-200 lines; past ~40k chars Claude Code warns it degrades performance — move depth
   into skills/docs and link them.
3. **Clear context aggressively.** `/clear` between unrelated tasks; don't let one session
   accumulate stale context. Provide only the files relevant to the current task.
4. **TDD as guardrail.** Write/keep failing tests first; let Claude iterate to green. Tests
   are the objective signal that beats "looks done."
5. **Split write vs. review contexts.** Have a fresh context or subagent verify code the
   first context wrote — a single context rationalizes its own mistakes.
6. **Checkpoints ≠ version control.** `/rewind` (or double-Esc) restores Claude's edits and
   conversation, but NOT your bash side effects (migrations, `rm`, pushes). Commit real
   milestones to git.

## Extending Claude Code — pick the right surface

| You want to… | Use | Lives in |
|---|---|---|
| Reusable prompt shortcut (`/thing`) | **Slash command** | `.claude/commands/*.md` |
| Specialized persona with its own context/tools | **Subagent** | `.claude/agents/*.md` |
| Auto-loaded domain knowledge (model-triggered) | **Skill** | `.claude/skills/*/SKILL.md` |
| Deterministic action on an event (lint, guard, sync) | **Hook** | `settings.json` + script |
| External tool/data integration | **MCP server** | `.mcp.json` / `claude mcp add` |
| Repo-wide standing context | **CLAUDE.md** | `./CLAUDE.md`, `~/.claude/CLAUDE.md` |

Rule of thumb: **command** = you invoke on demand; **skill** = Claude pulls it in when
relevant; **agent** = isolated context for a bounded job; **hook** = the harness runs it,
not the model, so it's the only way to *guarantee* an automated behavior.

- Command / agent / skill / MCP authoring + valid frontmatter fields → [reference/extending.md](reference/extending.md)
- settings.json tiers, permissions, hooks wiring → [reference/configuration.md](reference/configuration.md)
- CLI flags, headless/CI, worktrees, multi-Claude workflows → [reference/cli-workflows.md](reference/cli-workflows.md)

## Gotchas

Real, non-obvious failure modes when authoring for Claude Code:

- **Invalid frontmatter fields are silently ignored.** Agents/skills accept a fixed field
  set. `whenToUse` (camelCase), `shortname`, `avatar`, `exampleQueries`, `when_to_use` on an
  *agent* are dropped with no error — your intent never reaches the model. Check the valid
  field lists in [reference/extending.md](reference/extending.md).
- **Agent/skill `name` must be lowercase-with-hyphens** — no uppercase, no underscores,
  ≤64 chars. `NXTG-CEO-LOOP` breaks discovery; use `nxtg-ceo-loop`. `color` accepts only
  `purple|cyan|green|orange|blue|red`.
- **`disable-model-invocation: true` removes the skill's description from context AND blocks
  subagent preload.** The skill can no longer auto-trigger — it becomes invoke-only. Use it
  to save tokens on commands, but never on a skill you want Claude to pull in automatically.
- **A weak `description` is why your agent/skill won't fire.** Routing is decided from the
  description text. Write it as "<what it does>. Use when <concrete trigger phrases users
  say>." with the key case first; `<example>` blocks in agent descriptions sharpen
  auto-delegation.
- **Hooks are the harness, not the model — and blocking.** A `PreToolUse` hook exiting code
  `2` *denies* the tool call; a slow `SessionStart`/`UserPromptSubmit` hook delays every
  turn. Keep them fast and deterministic; set a `timeout`. Advisory hooks must exit 0.
- **Use `${CLAUDE_PLUGIN_ROOT}`, never absolute paths, in plugin command/hook bodies.**
  Absolute paths break when the plugin installs to a different machine/location.
- **Pinned model IDs and version numbers rot.** Don't hardcode `claude-sonnet-4-...` in a
  committed `settings.json` unless you mean to. Prefer `/model` at runtime or omit it to
  inherit; treat any "as of version X" claim as needing re-verification against live docs.
- **Permissions: `deny` beats `allow`, and patterns are literal.** `Read(.env*)` won't cover
  `config/.env`; scope deliberately (`Read(**/.env*)`). Verify with a dry Read before trusting.

## Worked example — an agent that won't auto-trigger

Symptom: you built `.claude/agents/db-migrator.md` but Claude never delegates to it.

1. **Read the frontmatter.** `name: DB_Migrator` → invalid (uppercase + underscore).
   Rename to `db-migrator`.
2. **Read the description.** "Handles database stuff." → no trigger signal. Rewrite:
   "Plans and applies database schema migrations with rollback. Use when the user adds a
   column, changes a table, writes an Alembic/Prisma migration, or mentions schema drift."
   Add a `<example>` with a realistic user request.
3. **Check for `disable-model-invocation: true`** on a skill you expected to preload — remove
   it if you need auto-trigger.
4. **Confirm the color** is in the allowed palette. Reload the session; test with a prompt
   that matches the new trigger phrases.

## Additional resources

- [reference/extending.md](reference/extending.md) — commands, subagents, skills, MCP: authoring patterns + complete valid-frontmatter field lists.
- [reference/configuration.md](reference/configuration.md) — settings.json three tiers, permissions model, hook events + wiring, CLAUDE.md structure.
- [reference/cli-workflows.md](reference/cli-workflows.md) — CLI flags, `@` file refs, headless/CI automation, git worktree parallelism, checklist-driven and multi-Claude verification patterns.

## Source

Distilled from Anthropic's official guidance: <https://code.claude.com/docs/en/overview>,
<https://www.anthropic.com/engineering/claude-code-best-practices>, and
<https://code.claude.com/docs/en/skills>. Verify version/model/pricing specifics against
live docs before relying on them.
