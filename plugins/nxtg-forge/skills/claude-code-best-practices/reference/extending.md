# Extending Claude Code — commands, subagents, skills, MCP

Authoring patterns and the **valid frontmatter fields** for each surface. Invalid fields
are silently ignored, so getting these right is load-bearing.

## Slash commands (`.claude/commands/*.md`)

A command is a reusable prompt you invoke on demand (`/name`). Body is the instruction
Claude executes; `$ARGUMENTS` (or `$1`, `$2`) interpolates args.

```markdown
---
description: "Analyze code for performance issues"   # shown in /help; used for routing
disable-model-invocation: true                        # commands should set this (invoke-only)
argument-hint: "[file-or-dir]"                         # autocomplete hint
allowed-tools: Read, Grep, Bash(git *)                # pre-approve tools this command uses
---
Analyze $ARGUMENTS for: DB query efficiency, memory patterns, API latency.
```

Best practice: give every command `disable-model-invocation: true` so it only runs when
explicitly called, never auto-triggered. `name` defaults to the filename.

## Subagents (`.claude/agents/*.md`)

An isolated context with its own tools and system prompt. Claude auto-delegates when a
task matches the `description`.

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

**INVALID (ignored):** `shortname`, `avatar`, `whenToUse`, `exampleQueries`, `when_to_use`.

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

## Skills (`.claude/skills/<name>/SKILL.md`)

Auto-loaded domain knowledge. Claude reads the `description` and pulls the skill in when
relevant — no explicit invocation needed (unless disabled).

**Valid skill frontmatter fields:**

| Field | Effect |
|---|---|
| `name` | Display name, ≤64 chars. |
| `description` | Auto-trigger matching. Include concrete "Use when…" phrases. |
| `disable-model-invocation: true` | Removes description from context AND blocks subagent preload → invoke-only. |
| `user-invocable: false` | Hides from the `/` menu but keeps it in Claude's context. |
| `argument-hint` | Autocomplete hint. |
| `allowed-tools` | Pre-approve tools the skill's procedure runs. |
| `context: fork` | Runs the skill in an isolated subagent context. |
| `model` | Per-skill model override. |

Progressive disclosure: keep `SKILL.md` under ~500 lines. Move detail into sibling
`reference/*.md` files and link them — body content stays in context every turn, so every
line is recurring token cost. Put *what to do*, not narration.

Token control: `disable-model-invocation` fully removes the description from context (max
savings, but no auto-trigger). `!\`command\`` in a skill body injects live command output
before Claude reads the skill. The keyword "ultrathink" anywhere enables extended thinking.

## MCP servers

Extend Claude Code with external tools/data via the Model Context Protocol.

```bash
claude mcp add my-server -e API_KEY=123 -- /path/to/server arg1 arg2
```

Or declare in a plugin's `.mcp.json` (stdio JSON-RPC). Servers degrade gracefully if the
backing binary/runtime isn't installed. Common uses: issue trackers, databases, design
docs, SAST scanners, custom dev tooling. Prefer dynamic tool loading so tool definitions
don't consume context until a tool is actually needed.
