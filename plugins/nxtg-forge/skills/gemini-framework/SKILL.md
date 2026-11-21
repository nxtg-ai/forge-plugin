---
name: Gemini Framework
description: Reference knowledge about Google's retired Gemini CLI, which Google replaced with Antigravity CLI (`agy`). Describes how the old client read GEMINI.md, .gemini/settings.json and a system-prompt override, for projects that still carry those files. Use when a user asks what GEMINI.md, @imports or .gemini/ files do, or whether to keep them. DO NOT create files from this skill, and do not tell a user to install or run `gemini`; it is reference material only.
disable-model-invocation: true
---

# Gemini CLI (retired) — Reference Knowledge

> **RETIRED TOOL.** Google retired Gemini CLI and replaced it with Antigravity CLI, whose executable is `agy` (Google's notice: https://github.com/google-gemini/gemini-cli/discussions/27274). Do not tell a user to install, authenticate or run `gemini`. For Google-model agents, Forge's orchestrator runs `agy` (its agent id stays `gemini`). This page records how the old client worked, for projects that still have `GEMINI.md` or `.gemini/` files. It does not describe which files `agy` reads.
>
> **REFERENCE ONLY.** Do NOT create `GEMINI.md`, `.gemini/`, playbooks, or rules files in the user's project. NXTG-Forge delivers all agent functionality through the Claude Code plugin system.

## How the Old Client Discovers Context

The old client builds its instructional context ("memory") by **concatenating** (not overriding) every `GEMINI.md` it finds, from broadest to most specific:
1. `~/.gemini/GEMINI.md` — global user instructions
2. Current directory and each parent up to the `.git` root — project instructions
3. Subdirectories under CWD — module-specific instructions

It respects `.gitignore` and `.geminiignore` when scanning. The context filename is configurable via `context.fileName` (see below), so it is not always literally `GEMINI.md`.

### Modular Imports

`GEMINI.md` supports `@path/to/file.md` imports (relative or absolute), which pull in:
- `@.gemini/rules/coding-standards.md` — always-on rules
- `@.gemini/playbooks/feature-planning.md` — on-demand skill-equivalents

### Memory Commands

- `/memory show` — inspect the fully-assembled loaded context
- `/memory refresh` — rescan after editing any `GEMINI.md`
- `/memory add <text>` — append to `~/.gemini/GEMINI.md`

## `.gemini/settings.json`

Project-level config (global variant: `~/.gemini/settings.json`). Later versions of the old client group keys under **nested categories** — `general`, `ui`, `model`, `context`, `tools`, `mcpServers`:

```json
{
  "general": { "vimMode": true, "defaultApprovalMode": "default" },
  "ui": { "theme": "Default", "hideBanner": true },
  "context": { "fileName": ["GEMINI.md"] },
  "tools": { "useRipgrep": true }
}
```

- `context.fileName` accepts a **single string OR an array of strings**.
- `general.defaultApprovalMode` values: `"default"` (prompt), `"auto_edit"` (auto-approve edits), `"plan"` (read-only). This is the tool-approval gate — it lives under `general`, **not** `tools` (see Gotchas).

## System Prompt Override (`.gemini/system.md`)

Set `GEMINI_SYSTEM_MD` in `.gemini/.env` (or the shell env) to **fully replace** the old client's built-in system prompt — this is a hard replacement, not a merge:
- `GEMINI_SYSTEM_MD=1` (or `true`) → loads `.gemini/system.md`
- `GEMINI_SYSTEM_MD=/abs/path/to/file.md` → treats the value as a path to the prompt file

Template variables let you re-inject the built-in pieces you replaced:
- `${AvailableTools}` — bulleted list of currently enabled tool names
- `${AgentSkills}` — the full agent-skills section
- `${SubAgents}` — the available sub-agents section
- `${<toolName>_ToolName}` — the resolved name of a specific tool

When an override is active, the old client shows a `|⌐■_■|` indicator in the UI. No indicator = your `system.md` was not picked up.

## Typical Dual-Platform Layout

```
project/
├── .gemini/
│   ├── settings.json    # nested-category CLI config
│   ├── .env             # GEMINI_SYSTEM_MD toggle
│   ├── system.md        # optional full system-prompt replacement
│   ├── .geminiignore    # context exclusions
│   ├── rules/           # always-on @imported rules
│   └── playbooks/       # on-demand @imported skill-equivalents
├── GEMINI.md            # main context file (Gemini's CLAUDE.md analog)
└── src/module/GEMINI.md # optional module-scoped context
```

## A Forge Project That Still Has Gemini Files

When a project uses Forge and still carries files from the old client:
1. **Forge owns Claude Code** — commands, agents, skills, hooks (the plugin).
2. **Only the old client read those files** — `GEMINI.md`, `.gemini/`. Nothing in Forge reads them.
3. **Forge's project state** is `.claude/governance.json`, whatever other files exist.
4. **Keep or remove them is the user's call.** Do not convert them for `agy` from this page: it does not describe which files `agy` reads.

## Claude Code vs the Old Gemini Client

| Aspect | Claude Code (Forge) | Gemini CLI (retired) |
|--------|--------------------|------------|
| Config file | `CLAUDE.md` | `GEMINI.md` (name configurable) |
| Hierarchical scan | `@import` chain, no auto parent-scan | Yes — scans parents to `.git` root |
| Imports | `@path` in CLAUDE.md | `@file.md` in GEMINI.md |
| Skills | Plugin `skills/*/SKILL.md` | Playbooks via `@import` |
| Plugin/marketplace | Yes | No |
| System prompt | Fixed; extend via CLAUDE.md | Full replacement via `system.md` |
| Hooks | Pre/PostToolUse, Stop, etc. | None documented |
| MCP servers | `.mcp.json` | `mcpServers` in settings.json |

## Gotchas

- **`approvalMode` is under `general`, not `tools`.** It is `general.defaultApprovalMode`. Older examples that wrote `tools.approvalMode` silently no-op — the key is ignored, and the CLI keeps prompting. Do not repeat that mistake when advising a user.
- **settings.json migrated flat → nested.** Pre-migration blog posts and README snippets use flat keys (`contextFileName`, `vimMode`, `autoAccept`) that are silently ignored by current versions. The live schema nests them (`context.fileName`, `general.vimMode`, `general.defaultApprovalMode`). Verify against `schemas/settings.schema.json` in the gemini-cli repo before quoting a key.
- **`GEMINI_SYSTEM_MD` wipes ALL built-in instructions**, including tool-use guidance. A minimal `system.md` that omits `${AvailableTools}`/`${AgentSkills}` produces a model that can't see its own tools/skills. Always re-inject the pieces you still need via template variables.
- **`GEMINI_SYSTEM_MD` value is overloaded.** `1`/`true` means "load `.gemini/system.md`"; any other string is treated as a **file path**, not a boolean. A typo'd truthy value (`yes`, `on`) becomes a path that doesn't exist and the override silently fails to apply.
- **Context is concatenated, not overridden.** A subdirectory `GEMINI.md` does NOT replace the project root's — both load. Contradictory instructions across levels both reach the model. There is no "most-specific-wins" resolution like some tools have.
- **`.geminiignore` filters context, not just tool access.** A `GEMINI.md` (or `@import` target) under an ignored path won't load, so context can silently go missing without an error.

## Sources

- Google's notice, "Transitioning Gemini CLI to Antigravity CLI" — https://github.com/google-gemini/gemini-cli/discussions/27274
- Gemini CLI configuration reference — https://geminicli.com/docs/reference/configuration/
- Gemini CLI system-prompt override — https://geminicli.com/docs/cli/system-prompt/
- settings.schema.json — https://github.com/google-gemini/gemini-cli/blob/main/schemas/settings.schema.json
