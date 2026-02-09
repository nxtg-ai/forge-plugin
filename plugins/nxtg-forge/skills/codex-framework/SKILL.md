---
name: Codex Framework
description: Reference knowledge for OpenAI Codex CLI compatibility. Describes how Codex discovers agents and skills so Forge can interoperate. DO NOT create files from this skill — it is reference material only.
---

# Codex CLI — Reference Knowledge

> **IMPORTANT:** This skill is REFERENCE ONLY. Do NOT create `AGENTS.md`, `SKILLS.md`, `AGENT.md`, or `.agents/` directories in the user's project. NXTG-Forge provides agents and skills through the Claude Code plugin system, not through Codex-style files.

## How Codex CLI Discovers Agents

Codex CLI reads agent instructions from these locations (in priority order):

1. `AGENTS.md` in repo root — persistent agent persona and rules
2. `AGENT.md` in repo root — alternative single-agent file
3. `.agents/skills/*/SKILL.md` — skill modules (like Claude Code's `skills/` directory)

This is analogous to how Claude Code uses:
- `CLAUDE.md` → equivalent to `AGENTS.md`
- `.claude/agents/*.md` → agent definitions
- `.claude/skills/*/SKILL.md` → skill modules

## Codex Agent Configuration Pattern

A typical `AGENTS.md` defines:
- **Role** — the agent's persona and expertise
- **Prime directive** — core behavioral rules
- **Stack assumptions** — default technology choices
- **Output contract** — expected deliverable format
- **Quality gates** — non-negotiable standards
- **Collaboration rules** — how to interact with humans

## Codex Skills Pattern

Codex skills use the same `SKILL.md` format as Claude Code:
```
.agents/skills/
  skill-name/
    SKILL.md    # YAML frontmatter (name, description) + instructions
```

## Forge ↔ Codex Interoperability

When a project needs to support BOTH Claude Code (via Forge) and Codex CLI:

1. **Forge handles Claude Code** — via plugin (commands, agents, skills, hooks)
2. **Codex reads its own files** — `AGENTS.md`, `.agents/skills/`
3. **Shared state** — both can read `.claude/governance.json` for project context
4. **No duplication** — Forge agents and Codex agents serve different runtimes

If a user explicitly asks to add Codex CLI support to their project, the recommended approach is:
- Create `AGENTS.md` with project-specific instructions (not Forge agent copies)
- Point Codex to `.claude/governance.json` for shared project state
- Keep agent definitions separate per platform (Claude has different capabilities than Codex)

## Key Differences: Claude Code vs Codex CLI

| Aspect | Claude Code (Forge) | Codex CLI |
|--------|-------------------|-----------|
| Agent definitions | Plugin `.claude/agents/*.md` | `AGENTS.md` in repo root |
| Skills | Plugin `skills/*/SKILL.md` | `.agents/skills/*/SKILL.md` |
| Project config | `CLAUDE.md` + `governance.json` | `AGENTS.md` |
| Plugin system | Yes (marketplace) | No (repo-level only) |
| Multi-agent | Agent Teams (Task tool) | Sequential only |
| Hooks | Pre/PostToolUse, Stop, etc. | Pre/post-commit hooks |

## Sources

- OpenAI Codex docs on `AGENTS.md` discovery and precedence
- OpenAI Codex docs on Skills (`SKILL.md`, locations, invocation)
- VS Code docs on Agent Skills locations (`.github/skills/`)
