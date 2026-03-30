# Codex Framework

> Reference knowledge for OpenAI Codex CLI compatibility -- how Codex discovers agents and skills, and how NXTG-Forge can interoperate across AI coding platforms without duplicating configuration.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Framework |

---

## What It Provides

This skill is strictly reference material. It documents how OpenAI's Codex CLI discovers agent instructions and skills so that NXTG-Forge can interoperate with Codex-based workflows when a project needs to support both platforms. It maps Codex concepts to their Claude Code equivalents, documents the key differences between the two systems, and provides guidance for dual-platform projects.

Without this skill, agents asked to add Codex compatibility would copy NXTG-Forge agent definitions into `AGENTS.md` files, creating maintenance nightmares where two sets of instructions drift apart. The skill explicitly prevents this: Forge agents and Codex agents serve different runtimes with different capabilities, so they should be separate definitions that share project state through `.claude/governance.json` rather than duplicating content.

The knowledge is deliberately narrow -- it teaches agents what Codex expects, not how to use Codex. This is a compatibility reference, not a Codex tutorial.

## When It Activates

- When a project needs to support both Claude Code and Codex CLI
- When an agent encounters `AGENTS.md`, `AGENT.md`, or `.agents/` directories
- When discussing cross-platform AI coding tool compatibility

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### Codex Agent Discovery

Codex reads agent instructions from `AGENTS.md` (primary) or `AGENT.md` (alternative) in the repo root, plus `.agents/skills/*/SKILL.md` for skill modules. This is analogous to Claude Code's `CLAUDE.md`, `.claude/agents/*.md`, and `.claude/skills/*/SKILL.md`. A typical `AGENTS.md` defines role, prime directive, stack assumptions, output contract, quality gates, and collaboration rules -- similar in spirit to a Claude Code agent's YAML frontmatter and system prompt, but in a single file.

### Platform Capability Differences

The skill maps six dimensions where the platforms diverge: agent definitions (plugin agents vs repo-root AGENTS.md), skills (plugin SKILL.md vs .agents/skills/), project config (CLAUDE.md + governance.json vs AGENTS.md), plugin system (marketplace vs none), multi-agent support (Task tool for parallel agents vs sequential only), and hooks (Pre/PostToolUse, Stop vs pre/post-commit hooks). These differences mean agents cannot be mechanically translated between platforms -- they must be rewritten to leverage each platform's strengths.

### Interoperability Pattern

For dual-platform projects: Forge handles Claude Code via its plugin system, Codex reads its own `AGENTS.md` and `.agents/skills/` files, both platforms share project state through `.claude/governance.json`. No duplication of agent definitions across platforms. If a user explicitly requests Codex support, create `AGENTS.md` with project-specific instructions (not copies of Forge agent prompts) and point Codex to governance.json for shared context.

## How to Leverage It

This skill is passive reference material. It activates when agents encounter Codex-related files or when users ask about cross-platform compatibility. It prevents agents from making the common mistake of trying to make Claude Code agents work in Codex or vice versa.

### Example: Adding Codex Support

```
User: "Make this project work with both Claude Code and Codex CLI"

What happens: The skill activates and prevents the agent from copying Forge agent
definitions into AGENTS.md. Instead, it creates a Codex-specific AGENTS.md with
project instructions tailored to Codex's capabilities, and configures both platforms
to read shared project state from .claude/governance.json.
```

## Power Applications

The key insight is the "no duplication" principle. When teams use multiple AI coding tools, the temptation is to maintain identical instructions in each tool's format. This creates a synchronization burden that grows with every change. The skill teaches a shared-state architecture instead: each tool gets its own instructions optimized for its capabilities, but they share project state through a common file.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **claude-code-framework** | Claude Code's architecture, the primary platform that Codex is compared against |
| **gemini-framework** | Similar compatibility reference for Google's Gemini CLI |
| **core-nxtg-forge** | NXTG-Forge platform that bridges multiple AI coding tools |

## Tips

- This is reference-only. Do NOT create AGENTS.md, AGENT.md, or .agents/ directories unless the user explicitly asks for Codex support.
- Codex agents and Claude Code agents should never be copies of each other -- they serve different runtimes with different capabilities.

---

*See also: [gemini-framework](gemini-framework.md) | [claude-code-framework](claude-code-framework.md)*
