---
name: Claude Code Framework
description: >
  Authoritative reference for how Claude Code itself works AND how to build for it —
  CLAUDE.md memory, custom slash commands, subagents, skills, hooks, MCP servers,
  settings precedence, permissions, plan mode, CLI/headless/CI, worktrees, and
  multi-platform surfaces. Use when authoring or debugging a plugin component
  (command/agent/skill/hook), wiring an MCP server, choosing frontmatter fields,
  configuring settings.json or permissions, figuring out why an agent/skill won't
  auto-trigger, running headless/CI or worktree-parallel sessions, or answering
  "how does Claude Code X work / how should I structure this for Claude Code."
when_to_use: >
  Triggers: "write/review a CLAUDE.md", "add a slash command", "create a
  subagent/skill/hook", "wire an MCP server", "configure settings.json /
  permissions / allowedTools", "why won't my agent or skill trigger", "run Claude
  Code in CI / headless", "git worktree parallel sessions", "context is bloating /
  clear context", "TDD workflow", "how does Claude Code <feature> work".
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# Claude Code Framework — Reference & Decision Guide

Authoritative reference for Claude Code's behavior and for authoring its extensions.
Ground every claim to current behavior at <https://code.claude.com/docs>. Model IDs,
pricing, and "as of version X" specifics rot — re-verify against live docs before relying
on them. This file is the index; depth lives in the linked reference files.

---

## CORE OPERATING RULES

Apply these directly when working *with* Claude Code on real tasks:

1. **Plan before code on anything non-trivial.** Use Plan Mode (or a written plan) to agree
   on approach before edits. Discussion-then-code catches wrong turns cheaply.
2. **Keep CLAUDE.md lean and failure-focused.** Document what Claude gets *wrong* in this
   repo (build quirks, forbidden paths, naming rules), not what it does right. ~100–200
   lines; past ~40k chars Claude Code warns performance degrades — move depth into
   skills/docs and link them.
3. **Clear context aggressively.** `/clear` between unrelated tasks; provide only files
   relevant to the current task. Don't let one session accumulate stale context.
4. **TDD as guardrail.** Write/keep failing tests first, let Claude iterate to green. Tests
   are the objective signal that beats "looks done."
5. **Split write vs. review contexts.** Have a fresh context or subagent verify code the
   first context wrote — a single context rationalizes its own mistakes.
6. **Checkpoints ≠ version control.** `/rewind` (or double-Esc) restores Claude's edits and
   conversation, but NOT your bash side effects (migrations, `rm`, pushes). Commit real
   milestones to git.

---

## EXTENDING CLAUDE CODE — PICK THE RIGHT SURFACE

| You want to… | Use | Lives in |
|---|---|---|
| Reusable prompt shortcut (`/thing`) | **Slash command** | `.claude/commands/*.md` |
| Specialized persona with its own context/tools | **Subagent** | `.claude/agents/*.md` |
| Auto-loaded domain knowledge (model-triggered) | **Skill** | `.claude/skills/*/SKILL.md` |
| Deterministic action on an event (lint, guard, sync) | **Hook** | `settings.json` + script |
| External tool/data integration | **MCP server** | `.mcp.json` / `claude mcp add` |
| Repo-wide standing context | **CLAUDE.md** | `./CLAUDE.md`, `~/.claude/CLAUDE.md` |

Rule of thumb: **command** = you invoke on demand; **skill** = Claude pulls it in when
relevant; **agent** = isolated context for a bounded job; **hook** = the harness runs it
(not the model), so it's the only way to *guarantee* an automated behavior.

> Frontmatter field tables + authoring patterns: [reference/authoring.md](reference/authoring.md)

---

## 1. CORE CAPABILITIES

Claude Code is an autonomous coding agent in your terminal: feature implementation
(plan → implement → verify), bug fixing, codebase navigation, and task automation.

```bash
cd your-project && claude      # Interactive session
claude "explain this project"  # Start with an initial prompt
claude -p "prompt text"        # Print mode: query once, exit (scriptable/pipeable)
claude -c                      # Continue most recent conversation
claude --resume <session-id>   # Resume a specific session
claude mcp serve               # Run Claude Code itself as an MCP server
```

---

## 2. MCP INTEGRATION (Quick Reference)

MCP is an open standard connecting Claude Code to external tools, databases, and APIs.

```bash
claude mcp add --transport http  <name> <url>              # HTTP remote
claude mcp add --transport sse   <name> <url>              # Server-Sent Events
claude mcp add --transport stdio <name> -- <cmd>           # Local process (fastest)
claude mcp add-json <name> '{"type":"http","url":"..."}'   # From JSON
claude mcp add-from-claude-desktop                         # Import from Desktop
claude mcp list / get <name> / remove <name>               # Manage
/mcp                                                       # Status (in-session)
```

### Scope & precedence

| Scope | File | When |
|-------|------|------|
| `local` (default) | `~/.claude.json` | Current project only |
| `project` | `.mcp.json` | Team-shared, version controlled |
| `user` | `~/.claude.json` | All projects |

**Precedence: Local > Project > User** — a same-named `local` server shadows a `project` one.

### In-session usage

```bash
@github:issue://123                 # Reference an MCP resource
/mcp__github__list_prs              # Execute an MCP prompt (no args)
/mcp__jira__create_issue "Bug" high # Execute with args
```

### Context tuning

```bash
ENABLE_TOOL_SEARCH=auto:5 claude    # Dynamic tool loading — fires at 5% of context
ENABLE_TOOL_SEARCH=true  claude     # Always dynamic
ENABLE_TOOL_SEARCH=false claude     # Load all tools upfront
export MAX_MCP_OUTPUT_TOKENS=50000  # Warn at 10k; default max 25k tokens
```

> Full MCP details (transports, `@`-mentions, enterprise `managed-mcp.json`, popular
> integrations): [reference.md](reference.md)

---

## 3. CLAUDE.MD — PROJECT MEMORY

Auto-loaded at session start. Commit it so the whole team benefits.

- **Import other files:** `@path/to/import` (relative to the importing file).
- **`CLAUDE.local.md`** — auto-gitignored, private per-machine overrides.
- **`.claude/rules/*.md`** — auto-loaded as project memory; support `paths` globs for
  file-scoped rules.
- **Hierarchy:** `~/.claude/CLAUDE.md` (global) → `./CLAUDE.md` (project) → subdirectory
  CLAUDE.md (component-specific).

```bash
/init      # Bootstrap a CLAUDE.md by analyzing the project
/memory    # Open and edit memory files in your editor (in-session)
```

Keep it failure-focused, lean (~100–200 lines, hard ceiling ~40k chars), and iterated like
a prompt: add the one line that prevents a repeated mistake; delete rules that stop mattering.

---

## 4. SKILLS SYSTEM

Skills are context-aware capabilities that activate on task context — pure LLM reasoning,
no embeddings or classifiers.

1. **Discovery** — session start scans available skills (~100 tokens of YAML metadata each).
2. **Contextual activation** — Claude decides which to invoke from the `description`.
3. **Dynamic loading** — full skill body loads only when needed.

Locations: `~/.claude/skills/` (user), `.claude/skills/` (project), plugin-provided.

```yaml
name: skill-name
description: When this skill is relevant...    # Auto-trigger matching; put "Use when…" first
disable-model-invocation: true                 # Manual-only: removes description from context
user-invocable: false                          # Hide from / menu but keep in context
argument-hint: "[args]"                         # Autocomplete hint
allowed-tools: Read, Grep                      # Pre-approve tools the procedure runs
context: fork                                   # Run in an isolated subagent context
model: sonnet                                   # Per-skill model override
```

Progressive disclosure: keep `SKILL.md` under ~500 lines; move detail into sibling
`reference/*.md` and link it (body content is recurring per-turn token cost).

> Skill/agent/command authoring + field tables: [reference/authoring.md](reference/authoring.md).
> Ready-to-copy skill templates: [patterns.md](patterns.md).

---

## 5. PLAN MODE

Use plan mode for complex features before any implementation.

```bash
> "Build a task management API with user authentication"
# Claude generates: DB schema, endpoint structure, auth flow, testing strategy
> "Use TypeScript instead of JavaScript"   # Refine the plan
> "Looks good, proceed"                     # Approve → Claude implements
```

Catch issues in the planning phase, not during debugging — like aligning with a senior
architect before execution.

---

## 6. UNIX PHILOSOPHY — COMPOSABILITY

```bash
tail -f app.log | claude -p "Slack me if you see any anomalies"
git diff main   | claude -p "Review changes and generate a commit message"
cat metrics.csv | claude -p "Identify the slowest endpoints"
find . -name "*.py" | xargs -I {} claude -p "Add type hints to {}"
```

---

## 7. SETTINGS & CONFIGURATION

### Hierarchy (highest → lowest precedence)

1. Organizational policies (managed settings — system-level `managed-mcp.json`)
2. `.claude/settings.json` — team conventions (project root, version controlled)
3. `.claude/settings.local.json` — machine-specific (project root, gitignored)
4. `~/.claude/settings.json` / `~/.claude.json` — user-level global

```json
{
  "permissions": {
    "allow": ["Read", "Write(src/**)", "Bash(git *)", "Bash(npm *)"],
    "deny":  ["Read(**/.env*)", "Read(**/*.key)", "Bash(rm *)", "Bash(sudo *)"]
  },
  "env": { "MAX_MCP_OUTPUT_TOKENS": "50000", "ENABLE_TOOL_SEARCH": "auto:5" }
}
```

**Permissions:** `deny` overrides `allow`; patterns are literal globs — `Read(.env*)` does
NOT match `config/.env`, use `Read(**/.env*)`. Scope Bash narrowly (`Bash(git *)`), never
blanket `Bash`. Don't pin a dated `"model"` in a committed settings file — it freezes the
team on a rotting model; omit to inherit or use `/model` at runtime.

> settings tiers, hooks wiring, and the full permissions model: [reference.md](reference.md).

---

## 8. SUBAGENTS & PARALLEL EXECUTION

```bash
> "Spawn a subagent to write unit tests while you implement the API endpoints"
```

- **Desktop app / CLI:** multiple sessions via git worktrees (or agent `isolation: worktree`).
- **Web interface:** built-in parallel task execution.
- **`tools: Task`** in agent frontmatter enables spawning subagents.

**forge-plugin rule:** leaf workers (testing, security, docs) OMIT `Task`; orchestrators
(planner, builder, guardian, detective, orchestrator) INCLUDE `Task`.

> Headless/CI, worktree parallelism, multi-Claude verification: [reference/workflows.md](reference/workflows.md).

---

## 9. MULTI-PLATFORM

| Platform | Notes |
|----------|-------|
| Terminal (CLI) | `claude` in any terminal — primary interface |
| Web (`claude.ai/code`) | No local setup, parallel tasks, built-in diff view |
| Desktop App | Visual diff, parallel sessions via git worktrees |
| VS Code Extension | Inline diffs, @-mentions, plan review UI |
| JetBrains Plugin | IntelliJ/PyCharm/WebStorm support |
| GitHub Actions | `anthropic/claude-code-action@v1` |

---

## QUICK REFERENCE CARD

```bash
# CLI
claude / claude -p "prompt" / claude -c / claude --resume <id>
claude mcp list | add <config> | serve

# In-session
/mcp        # MCP status        /init      # bootstrap CLAUDE.md
/memory     # edit memory       /clear     # drop context between tasks
/rewind     # restore edits (NOT bash side effects)
@<file>     # reference a file   @<mcp-resource>  # reference an MCP resource

# Config files
CLAUDE.md                     # Project context (auto-loaded)
.mcp.json                     # Project MCP servers (version controlled)
.claude/settings.json         # Team settings
.claude/settings.local.json   # Local overrides (gitignored)
~/.claude.json                # User config
```

---

## WORKED EXAMPLE — an agent that won't auto-trigger

Symptom: you built `.claude/agents/db-migrator.md` but Claude never delegates to it.

1. **Read the frontmatter `name`.** `name: DB_Migrator` → invalid (uppercase + underscore).
   Rename to `db-migrator`. The `name` is the wiring key, not a label.
2. **Read the `description`.** "Handles database stuff." → no trigger signal. Rewrite:
   "Plans and applies database schema migrations with rollback. Use when the user adds a
   column, changes a table, writes an Alembic/Prisma migration, or mentions schema drift."
   Add a realistic `<example>` block.
3. **Check for `disable-model-invocation: true`** on any skill/agent you expected to preload
   — it removes the description from context, so auto-trigger can never fire. Remove it if
   you need routing.
4. **Confirm `color`** is in the allowed palette, reload the session, and test with a prompt
   that matches the new trigger phrases.

---

## GOTCHAS

Real, non-obvious traps — verified against this plugin's own source (`agents/*.md`,
`servers/governance-mcp/`) and current Claude Code behavior.

- **A weak `description` is the #1 reason an agent/skill won't fire.** Routing is decided
  purely from description text. Write "<what it does>. Use when <concrete phrases users
  say>." with the key case first; `<example>` blocks in agent descriptions sharpen delegation.
- **`disable-model-invocation: true` removes the description from context entirely** and
  blocks subagent preload — it's not merely "manual-only." This skill uses it; it's reachable
  only by explicit invocation. Never set it on a skill you want Claude to auto-route to.
- **Agent `name` must be lowercase-hyphens, ≤64 chars — no uppercase, no underscores.** A
  display-cased name (`NXTG-CEO-LOOP`) silently fails discovery; the fix was `nxtg-ceo-loop`.
- **`color` accepts ONLY `purple|cyan|green|orange|blue|red`.** Any other value is ignored.
- **Leaf-worker agents must OMIT `Task`; orchestrators must INCLUDE it.** Give `Task` to a
  leaf and you invite unintended recursion; withhold it from an orchestrator and delegation
  silently no-ops.
- **Invalid frontmatter fields are silently dropped, not errored.** `shortname`, `avatar`,
  `whenToUse` (camelCase), `exampleQueries`, `when_to_use` on an *agent* look accepted but do
  nothing. Verify names against the valid set; never assume a field "took."
- **`model` in an agent/skill overrides the session model** — an agent pinned to `sonnet`
  will NOT inherit an Opus session. Omit to inherit; set only for a deliberately fixed tier.
- **Hooks are the harness, not the model — and can block.** A `PreToolUse` hook exiting code
  `2` *denies* the tool call (stderr goes to Claude); advisory hooks must exit `0`. A slow
  `SessionStart`/`UserPromptSubmit` hook delays every turn — set a `timeout`.
- **Use `${CLAUDE_PLUGIN_ROOT}`, never absolute paths, in plugin command/hook bodies.**
  Absolute paths break when the plugin installs to a different machine/location.
- **An MCP entry file that runs `server.connect()` at import time breaks test harnesses.**
  `governance-mcp/index.mjs` guards it (`if (!process.env.FORGE_TEST_MODE) server.connect(...)`)
  and dropped its `#!/usr/bin/env node` shebang because the shebang blocked vitest's ESM
  transform. Gate the transport connect behind an env flag if you import the module in tests.
- **`allowed-tools` pre-approves; it does NOT restrict.** It only suppresses permission
  prompts. To actually limit reach, use `permissions.deny` / `disallowedTools` in settings.
- **Pinned model IDs and version numbers rot.** Don't hardcode `claude-sonnet-4-...` in a
  committed `settings.json` unless you mean to; treat any "as of version X" claim as needing
  re-verification against live docs.
- **CLAUDE.md hard ceiling is ~40k characters.** Past it Claude Code warns and recall
  degrades. Move deep detail into `.claude/rules/*.md` (path-scoped) or linked docs.
- **Many skills can exceed the ~15k-char command budget** and get their descriptions dropped
  from context. Raise it: `export SLASH_COMMAND_TOOL_CHAR_BUDGET=30000`.

---

## LIMITATIONS & BEST PRACTICES

- Use `.claudeignore` to exclude large irrelevant files from context.
- Never commit API keys to `.mcp.json` — use environment variables.
- Local stdio servers are faster than remote HTTP/SSE; audit third-party MCP servers first.
- Keep MCP Tool Search's `auto:N` threshold consistent with the `ENABLE_TOOL_SEARCH` value.
- Enterprise: use `managed-mcp.json` for exclusive policy control.

---

## ADDITIONAL RESOURCES

- [reference.md](reference.md) — MCP transports/`@`-mentions/enterprise, settings & hooks
  schema, session management, install, platform integration, practical examples.
- [reference/authoring.md](reference/authoring.md) — commands, subagents, skills, MCP:
  authoring patterns + complete valid-frontmatter field tables.
- [reference/workflows.md](reference/workflows.md) — CLI flags, headless/CI automation, git
  worktree parallelism, checklist-driven and multi-Claude verification, checkpoints & rewind.
- [patterns.md](patterns.md) — copy-ready CLAUDE.md / rules / skill / agent / hook / MCP templates.

| Doc | URL |
|-----|-----|
| Overview | https://code.claude.com/docs/en/overview |
| MCP | https://code.claude.com/docs/en/mcp |
| Skills | https://code.claude.com/docs/en/skills |
| Hooks | https://code.claude.com/docs/en/hooks |
| Settings | https://code.claude.com/docs/en/settings |
| Best Practices | https://www.anthropic.com/engineering/claude-code-best-practices |
