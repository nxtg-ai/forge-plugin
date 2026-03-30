# Gemini Framework

> Reference knowledge for Google Gemini CLI compatibility -- hierarchical context discovery, modular imports, and system prompt override patterns that enable NXTG-Forge to interoperate with Gemini-based workflows.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Framework |

---

## What It Provides

This skill is strictly reference material. It documents how Google's Gemini CLI discovers context, loads instructions, and can be configured so that NXTG-Forge can interoperate with Gemini-based workflows when a project needs to support both platforms. It maps Gemini concepts to their Claude Code equivalents, documents key architectural differences, and provides guidance for dual-platform projects.

Without this skill, agents asked to add Gemini compatibility would not understand Gemini's hierarchical context scanning (current directory up to .git root), its `@file.md` import syntax, or the full system prompt override via `.gemini/system.md`. They would create configurations that do not match Gemini's expectations, leading to broken or incomplete context loading.

The knowledge covers Gemini's context discovery mechanism, configuration system, directory structure conventions, memory commands, and the critical differences from Claude Code.

## When It Activates

- When a project needs to support both Claude Code and Gemini CLI
- When an agent encounters `GEMINI.md`, `.gemini/` directories, or playbook files
- When discussing cross-platform AI coding tool compatibility

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### Hierarchical Context Discovery

Gemini CLI concatenates `GEMINI.md` files from three levels: `~/.gemini/GEMINI.md` (global user instructions), the current directory and all parent directories up to the `.git` root (project instructions), and subdirectories under the current working directory (module-specific instructions). It respects `.gitignore` and `.geminiignore` for filtering. This is fundamentally different from Claude Code's flat CLAUDE.md model -- Gemini inherits context from the directory hierarchy automatically.

### Modular Imports

`GEMINI.md` supports `@file.md` imports (relative or absolute paths), enabling modular context: `@.gemini/rules/coding-standards.md` for always-on rules, `@.gemini/playbooks/feature-planning.md` for on-demand skill equivalents. This import mechanism is Gemini's answer to Claude Code's skills system -- playbooks referenced via `@import` serve a similar role to SKILL.md files, but they are explicitly included rather than dynamically discovered.

### System Prompt Override

Setting `GEMINI_SYSTEM_MD=1` in `.gemini/.env` makes Gemini CLI fully replace its built-in system prompt with `.gemini/system.md`. This is a full replacement, not a merge -- a critical distinction from Claude Code where CLAUDE.md extends the system prompt. Variable substitution (`${AvailableTools}`, `${AgentSkills}`) is supported. This power comes with responsibility: a bad system.md breaks Gemini's default behavior entirely.

### Platform Capability Differences

Six key differences: config file (CLAUDE.md vs GEMINI.md), hierarchical scanning (not native in Claude vs automatic in Gemini), imports (not supported in Claude vs @file.md syntax), skills (plugin SKILL.md with dynamic discovery vs playbooks via explicit import), plugin system (marketplace in Claude vs none in Gemini), system prompt (extend via CLAUDE.md vs full replacement via system.md), hooks (Pre/PostToolUse etc. in Claude vs none documented in Gemini).

### Memory Commands

`/memory show` inspects loaded context, `/memory refresh` rescans after edits, `/memory add <text>` appends to global GEMINI.md. These provide runtime visibility into what context Gemini has loaded -- a debugging capability that helps when context is not behaving as expected.

## How to Leverage It

This skill is passive reference material. It activates when agents encounter Gemini-related files or when users ask about cross-platform compatibility. It prevents agents from applying Claude Code patterns to Gemini configuration.

### Example: Adding Gemini Support

```
User: "Make this project work with both Claude Code and Gemini CLI"

What happens: The skill activates and the agent creates a GEMINI.md in the project root
with project context, sets up .gemini/ directory with settings.json and rules/playbooks
subdirectories, and configures @imports for shared coding standards. Both platforms read
.claude/governance.json for shared project state.
```

## Power Applications

Gemini's hierarchical context discovery is a genuine architectural advantage for monorepos. A module-specific GEMINI.md in `src/auth/` provides authentication context that only activates when working in that directory, while project-level context is always available. Understanding this pattern helps teams structure context efficiently across large codebases.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **claude-code-framework** | Claude Code's architecture, the primary platform that Gemini is compared against |
| **codex-framework** | Similar compatibility reference for OpenAI's Codex CLI |
| **core-nxtg-forge** | NXTG-Forge platform that bridges multiple AI coding tools |

## Tips

- This is reference-only. Do NOT create GEMINI.md, .gemini/ directories, or playbooks unless the user explicitly asks for Gemini CLI support.
- Gemini's system prompt override is a full replacement. Use it carefully -- a mistake removes all default Gemini behavior.

---

*See also: [codex-framework](codex-framework.md) | [claude-code-framework](claude-code-framework.md)*
