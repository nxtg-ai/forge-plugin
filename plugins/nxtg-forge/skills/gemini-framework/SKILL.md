---
name: Gemini Framework
description: Reference knowledge for Google Gemini CLI compatibility. Describes how Gemini CLI discovers context (GEMINI.md), configures settings.json, and overrides its system prompt so Forge can interoperate on a dual-platform project. Use when a user asks how Forge coexists with Gemini CLI, how GEMINI.md / @imports / .gemini/settings.json work, or how to add Gemini support alongside Claude Code. DO NOT create files from this skill — it is reference material only.
disable-model-invocation: true
---

# Gemini CLI — Reference Knowledge

> **REFERENCE ONLY.** Do NOT create `GEMINI.md`, `.gemini/`, playbooks, or rules files in the user's project unless the user explicitly asks to add Gemini CLI support. NXTG-Forge delivers all agent functionality through the Claude Code plugin system; this skill only explains the *other* tool so you can advise on interop.

## How Gemini CLI Discovers Context

Gemini CLI builds its instructional context ("memory") by **concatenating** (not overriding) every `GEMINI.md` it finds, from broadest to most specific:
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

Project-level config (global variant: `~/.gemini/settings.json`). Modern Gemini CLI groups keys under **nested categories** — `general`, `ui`, `model`, `context`, `tools`, `mcpServers`:

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

Set `GEMINI_SYSTEM_MD` in `.gemini/.env` (or the shell env) to **fully replace** Gemini CLI's built-in system prompt — this is a hard replacement, not a merge:
- `GEMINI_SYSTEM_MD=1` (or `true`) → loads `.gemini/system.md`
- `GEMINI_SYSTEM_MD=/abs/path/to/file.md` → treats the value as a path to the prompt file

Template variables let you re-inject the built-in pieces you replaced:
- `${AvailableTools}` — bulleted list of currently enabled tool names
- `${AgentSkills}` — the full agent-skills section
- `${SubAgents}` — the available sub-agents section
- `${<toolName>_ToolName}` — the resolved name of a specific tool

When an override is active, Gemini CLI shows a `|⌐■_■|` indicator in the UI. No indicator = your `system.md` was not picked up.

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

## Forge ↔ Gemini Interoperability

When a project must support BOTH Claude Code (via Forge) and Gemini CLI:
1. **Forge owns Claude Code** — commands, agents, skills, hooks (the plugin).
2. **Gemini reads only its own files** — `GEMINI.md`, `.gemini/`.
3. **Shared state** — both can read `.claude/governance.json` for project context.
4. **No duplication** — keep platform-specific agent instructions in separate files; Gemini has no plugin/slash-command layer, so the portable pattern is `GEMINI.md` + `@imports` (playbooks) + an optional `system.md` override.

## Claude Code vs Gemini CLI

| Aspect | Claude Code (Forge) | Gemini CLI |
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

- Gemini CLI configuration reference — https://geminicli.com/docs/reference/configuration/
- Gemini CLI system-prompt override — https://geminicli.com/docs/cli/system-prompt/
- settings.schema.json — https://github.com/google-gemini/gemini-cli/blob/main/schemas/settings.schema.json
