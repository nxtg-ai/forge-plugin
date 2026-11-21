# Gemini Framework

> Reference knowledge about Google's Gemini CLI, which Google is replacing with Antigravity CLI (`agy`): how Gemini CLI discovers context, imports files and overrides its system prompt, for projects that carry `GEMINI.md` or `.gemini/` files.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Framework |

---

## What It Provides

This skill is strictly reference material. Google is moving Gemini CLI users to Antigravity CLI, whose executable is `agy` ([Google's notice](https://github.com/google-gemini/gemini-cli/discussions/27274)). Since 2026-06-18 Gemini CLI no longer serves Google AI Pro, Ultra or free-of-charge use; Gemini Code Assist Standard or Enterprise licences, Google Cloud and paid API keys still work, and Google still maintains the repository. Forge's orchestrator runs `agy` for Google-model agents. The skill documents how Gemini CLI discovers context and loads instructions, so an agent can explain those files in a project that has them. It maps the old client's concepts to their Claude Code equivalents. It does not describe which files `agy` reads.

Without this skill, an agent that finds these files could misread them: the old client's hierarchical context scanning (current directory up to .git root), its `@file.md` import syntax, and the full system prompt override via `.gemini/system.md` all differ from Claude Code.

The knowledge covers Gemini's context discovery mechanism, configuration system, directory structure conventions, memory commands, and the critical differences from Claude Code.

## When It Activates

- When a project has Gemini CLI files (`GEMINI.md`, `.gemini/`)
- When an agent encounters `GEMINI.md`, `.gemini/` directories, or playbook files
- When discussing cross-platform AI coding tool compatibility

This skill does not load automatically (`disable-model-invocation: true`). Invoke it as `/nxtg-forge:gemini-framework`.

## The Knowledge Inside

### Hierarchical Context Discovery

The old client concatenates `GEMINI.md` files from three levels: `~/.gemini/GEMINI.md` (global user instructions), the current directory and all parent directories up to the `.git` root (project instructions), and subdirectories under the current working directory (module-specific instructions). It respects `.gitignore` and `.geminiignore` for filtering. This is fundamentally different from Claude Code's flat CLAUDE.md model -- Gemini inherits context from the directory hierarchy automatically.

### Modular Imports

`GEMINI.md` supports `@file.md` imports (relative or absolute paths), enabling modular context: `@.gemini/rules/coding-standards.md` for always-on rules, `@.gemini/playbooks/feature-planning.md` for on-demand skill equivalents. This import mechanism is Gemini's answer to Claude Code's skills system -- playbooks referenced via `@import` serve a similar role to SKILL.md files, but they are explicitly included rather than dynamically discovered.

### System Prompt Override

Setting `GEMINI_SYSTEM_MD=1` in `.gemini/.env` makes the old client fully replace its built-in system prompt with `.gemini/system.md`. This is a full replacement, not a merge -- a critical distinction from Claude Code where CLAUDE.md extends the system prompt. Variable substitution (`${AvailableTools}`, `${AgentSkills}`) is supported. This power comes with responsibility: a bad system.md breaks Gemini's default behavior entirely.

### Platform Capability Differences

Six key differences: config file (CLAUDE.md vs GEMINI.md), hierarchical scanning (not native in Claude vs automatic in Gemini), imports (not supported in Claude vs @file.md syntax), skills (plugin SKILL.md with dynamic discovery vs playbooks via explicit import), plugin system (marketplace in Claude vs none in Gemini), system prompt (extend via CLAUDE.md vs full replacement via system.md), hooks (Pre/PostToolUse etc. in Claude vs none documented in Gemini).

### Memory Commands

`/memory show` inspects loaded context, `/memory refresh` rescans after edits, `/memory add <text>` appends to global GEMINI.md. These provide runtime visibility into what context Gemini has loaded -- a debugging capability that helps when context is not behaving as expected.

## How to Leverage It

This skill is passive reference material. It activates when agents encounter Gemini-related files or when users ask about cross-platform compatibility. It prevents agents from applying Claude Code patterns to Gemini configuration.

### Example: A Project With Old Gemini Files

```
User: "This repo has a GEMINI.md and a .gemini/ folder. Do we still need them?"

What happens: The agent explains what Gemini CLI loads from those files, says Google is
moving Gemini CLI users to Antigravity CLI (agy), and leaves the files alone unless the
user decides to remove them. Forge itself reads .claude/governance.json.
```

## Power Applications

The old client's hierarchical context discovery suited monorepos. A module-specific GEMINI.md in `src/auth/` provides authentication context that only activates when working in that directory, while project-level context is always available. Understanding this pattern helps teams structure context efficiently across large codebases.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **claude-code-framework** | Claude Code's architecture, the primary platform that Gemini is compared against |
| **codex-framework** | Similar compatibility reference for OpenAI's Codex CLI |
| **core-nxtg-forge** | NXTG-Forge platform that bridges multiple AI coding tools |

## Tips

- This is reference-only. Do NOT create GEMINI.md, .gemini/ directories, or playbooks, and do not tell a user to install Gemini CLI for Forge: Forge's orchestrator runs `agy`.
- Gemini's system prompt override is a full replacement. Use it carefully -- a mistake removes all default Gemini behavior.

---

*See also: [codex-framework](codex-framework.md) | [claude-code-framework](claude-code-framework.md)*
