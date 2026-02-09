---
name: Gemini Framework
description: Reference knowledge for Google Gemini CLI compatibility. Describes how Gemini discovers context and configuration so Forge can interoperate. DO NOT create files from this skill — it is reference material only.
---

# Gemini CLI — Reference Knowledge

> **IMPORTANT:** This skill is REFERENCE ONLY. Do NOT create `GEMINI.md`, `.gemini/` directories, playbooks, or rules files in the user's project unless the user explicitly asks to add Gemini CLI support. NXTG-Forge provides all agent functionality through the Claude Code plugin system.

## How Gemini CLI Discovers Context

Gemini CLI loads instructional context by concatenating `GEMINI.md` files from:
1. `~/.gemini/GEMINI.md` — global user instructions
2. Current directory and parents up to `.git` root — project instructions
3. Subdirectories under CWD — module-specific instructions

It respects `.gitignore` and `.geminiignore` for filtering.

### Modular Imports

`GEMINI.md` supports `@file.md` imports (relative or absolute paths), enabling:
- `@.gemini/rules/coding-standards.md` — always-on rules
- `@.gemini/playbooks/feature-planning.md` — on-demand skill equivalents

### Memory Commands

- `/memory show` — inspect loaded context
- `/memory refresh` — rescan after edits
- `/memory add <text>` — append to `~/.gemini/GEMINI.md`

## Gemini CLI Configuration

### `.gemini/settings.json`

Project-level settings (also supports `~/.gemini/settings.json` for global):
```json
{
  "general": { "vimMode": true },
  "ui": { "showCitations": true },
  "tools": { "approvalMode": "default" },
  "context": { "fileName": ["GEMINI.md"] }
}
```

### System Prompt Override (`.gemini/system.md`)

Setting `GEMINI_SYSTEM_MD=1` in `.gemini/.env` makes Gemini CLI fully replace its built-in system prompt with `.gemini/system.md`. This is a **full replacement**, not a merge.

Supports variable substitution: `${AvailableTools}`, `${AgentSkills}`.

## Gemini CLI Directory Structure

When a project supports Gemini CLI, the typical layout is:
```
project/
├── .gemini/
│   ├── settings.json    # CLI configuration
│   ├── .env             # GEMINI_SYSTEM_MD toggle
│   ├── system.md        # Optional system prompt override
│   ├── .geminiignore    # Context exclusions
│   ├── rules/           # Always-on imported rules
│   └── playbooks/       # On-demand skill equivalents
├── GEMINI.md            # Main context file (like CLAUDE.md)
└── src/
    └── module/
        └── GEMINI.md    # Module-specific context (optional)
```

## Forge ↔ Gemini Interoperability

When a project needs to support BOTH Claude Code (via Forge) and Gemini CLI:

1. **Forge handles Claude Code** — via plugin (commands, agents, skills, hooks)
2. **Gemini reads its own files** — `GEMINI.md`, `.gemini/` directory
3. **Shared state** — both can read `.claude/governance.json` for project context
4. **No duplication** — keep agent instructions separate per platform

Gemini CLI does NOT have a plugin system or slash-command skills. The reliable cross-version pattern is `GEMINI.md` + `@imports` (playbooks) + optional system prompt override.

## Key Differences: Claude Code vs Gemini CLI

| Aspect | Claude Code (Forge) | Gemini CLI |
|--------|-------------------|------------|
| Config file | `CLAUDE.md` | `GEMINI.md` |
| Hierarchical | Not natively | Yes (scans parent dirs to `.git` root) |
| Imports | Not supported | `@file.md` syntax |
| Skills | Plugin `skills/*/SKILL.md` | Playbooks via `@import` |
| Plugin system | Yes (marketplace) | No |
| System prompt | Fixed (extend via CLAUDE.md) | Full replacement via `system.md` |
| Hooks | Pre/PostToolUse, Stop, etc. | None documented |

## Sources

- Google Gemini CLI documentation on `GEMINI.md` discovery and hierarchical context
- Gemini CLI documentation on settings, system prompt override, and memory commands
