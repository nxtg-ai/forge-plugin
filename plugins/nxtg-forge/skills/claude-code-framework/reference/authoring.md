# Authoring Claude Code Extensions — commands, subagents, skills, MCP

Field tables and authoring patterns for each surface. **Invalid frontmatter fields are
silently ignored**, so getting these exactly right is load-bearing. Ground against
<https://code.claude.com/docs>.

---

## Slash commands (`.claude/commands/*.md`)

A command is a reusable prompt you invoke on demand (`/name`). Body is the instruction
Claude executes; `$ARGUMENTS` (or `$1`, `$2`) interpolates args. `name` defaults to the
filename.

```markdown
---
description: "Analyze code for performance issues"   # shown in /help; used for routing
disable-model-invocation: true                        # commands should set this (invoke-only)
argument-hint: "[file-or-dir]"                         # autocomplete hint
allowed-tools: Read, Grep, Bash(git *)                # pre-approve tools this command uses
---
Analyze $ARGUMENTS for: DB query efficiency, memory patterns, API latency.
```

Best practice: give every command `disable-model-invocation: true` so it runs only when
explicitly called, never auto-triggered.

---

## Subagents (`.claude/agents/*.md`)

An isolated context with its own tools and system prompt. Claude auto-delegates when a task
matches the `description`.

**Valid agent frontmatter fields:**

| Field | Notes |
|---|---|
| `name` | REQUIRED. lowercase-hyphens only, no uppercase/underscores, ≤64 chars. |
| `description` | REQUIRED. Routing signal. Use `<example>` blocks for strong auto-delegation. |
| `model` | `sonnet` \| `opus` \| `haiku` (omit to inherit). |
| `color` | ONLY `purple\|cyan\|green\|orange\|blue\|red`. |
| `tools` | Allowlist. Omit `Task` for leaf workers so they can't spawn sub-agents. |
| `disallowedTools` | Denylist. |
| `isolation` | `worktree` — parallel file work without conflicts. |
| `memory` | `user` \| `project` \| `local` — cross-session persistence. |
| `skills` | Preload full skill content at agent startup. |
| `permissionMode` | `default\|acceptEdits\|dontAsk\|bypassPermissions\|plan`. |
| `background` | `true` — always run as a background task. |

**INVALID (silently ignored):** `shortname`, `avatar`, `whenToUse`, `exampleQueries`,
`when_to_use`.

Strong description shape:

```markdown
---
name: security-reviewer
description: |
  Use this agent for security-focused code review. Use when the user adds auth,
  handles user input, touches secrets, or asks "is this safe."
  <example>
  Context: user wrote a login endpoint.
  user: "review my new /login route"
  assistant: "Launching the security-reviewer agent to audit auth + input handling."
  </example>
model: opus
color: red
tools: Read, Grep, Glob
---
You are a security expert. Focus on authn/authz, input validation, secret handling,
dependency vulns. Report findings ranked by severity.
```

### Orchestrator vs leaf worker

- **Orchestrator** (`planner`, `builder`, `guardian`, `detective`, `orchestrator`): INCLUDE
  `Task` in `tools` so it can spawn subagents. Typically `model: opus`.
- **Leaf worker** (`testing`, `security`, `docs`, …): OMIT `Task`. Focus on one bounded job;
  never spawn subagents.

---

## Skills (`.claude/skills/<name>/SKILL.md`)

Auto-loaded domain knowledge. Claude reads the `description` and pulls the skill in when
relevant — no explicit invocation needed unless disabled.

**Valid skill frontmatter fields:**

| Field | Effect |
|---|---|
| `name` | Display name, ≤64 chars. |
| `description` | Auto-trigger matching. Include concrete "Use when…" phrases. |
| `disable-model-invocation: true` | Removes description from context AND blocks subagent preload → invoke-only. |
| `user-invocable: false` | Hides from the `/` menu but keeps it in Claude's context. |
| `argument-hint` | Autocomplete hint. |
| `allowed-tools` | Pre-approve tools the skill's procedure runs (does NOT restrict). |
| `context: fork` | Runs the skill in an isolated subagent context. |
| `model` | Per-skill model override. |

Progressive disclosure: keep `SKILL.md` under ~500 lines. Move detail into sibling
`reference/*.md` and link them — body content stays in context every turn, so every line is
recurring token cost. Put *what to do*, not narration.

Token control tricks:
- `disable-model-invocation` fully removes the description from context (max savings, no
  auto-trigger).
- `` !`command` `` in a skill body injects live command output before Claude reads the skill.
- The keyword `ultrathink` anywhere in the body enables extended thinking.
- Raise the command-description budget when many skills compete: `export
  SLASH_COMMAND_TOOL_CHAR_BUDGET=30000`.

---

## MCP servers

Extend Claude Code with external tools/data via the Model Context Protocol.

```bash
claude mcp add my-server -e API_KEY=123 -- /path/to/server arg1 arg2
```

Or declare in a plugin's `.mcp.json` (stdio JSON-RPC). Servers degrade gracefully if the
backing binary/runtime isn't installed. Common uses: issue trackers, databases, design docs,
SAST scanners, custom dev tooling. Prefer dynamic tool loading (`ENABLE_TOOL_SEARCH`) so tool
definitions don't consume context until a tool is actually needed. Full server template and
`.mcp.json` registration example: [../patterns.md](../patterns.md).
