# Claude Code Best Practices

> Battle-tested practices for context engineering, autonomous execution, multi-agent verification, and CLAUDE.md optimization -- turning Claude Code from a code generator into a development partner.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Framework |

---

## What It Provides

This skill encodes the accumulated wisdom of heavy Claude Code usage: context engineering as the critical skill of 2025 (more important than prompt engineering), checkpoint-based safety nets, subagent patterns for parallel work, checklist-driven development for large migrations, the multi-Claude verification pattern (one instance writes, another validates), and the golden rules that separate productive usage from frustrated usage.

Without this skill, agents use Claude Code at a surface level -- typing prompts and accepting output. The skill teaches the meta-patterns that make Claude Code dramatically more effective: clearing context aggressively at 60k tokens, using Plan Mode before coding, writing tests first as guardrails, being specific rather than vague, and reviewing all output manually rather than trusting blindly.

The knowledge comes from Anthropic's own engineering practices, research into context engineering, community patterns from experienced users, and NXTG-Forge's operational experience. It covers CLAUDE.md optimization (100-200 lines, document failures not successes), the hierarchy of settings files, hook automation, the Skills system, subagent configuration, extended thinking management, and platform integrations.

## When It Activates

- When setting up a new Claude Code project or optimizing an existing workflow
- When agents need to manage their own context or token budget
- When designing multi-agent or multi-session workflows
- When configuring permissions, hooks, or security boundaries

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### Context Engineering Over Prompt Engineering

The unifying theme from Anthropic's 2025 research: managing what information Claude has access to matters more than how you phrase your request. Dynamic tool loading (MCP 2.0) transforms context from scarcity to access. Programmatic tool calling orchestrates 20+ tool calls in a single code block. Tool use examples improved accuracy from 72% to 90% on complex parameter handling. The skill teaches agents to optimize context usage: load tools on demand, clear context aggressively, provide specific file references with `@` syntax rather than asking Claude to search.

### CLAUDE.md as a Living Document

Keep it 100-200 lines. Document specifically what Claude gets wrong, not what it does right. Iterate on it like you iterate on prompts. Include common bash commands, core file locations, code style guidelines, testing instructions, branch naming conventions, and deployment processes. Commit it to version control. Update it as standards evolve. Auto-generate it by asking Claude to analyze the project structure. This single file replaces pages of repeated instructions.

### The Golden Rules

Use Planning Mode before coding (discuss approach first). Clear context aggressively (at 60k tokens or 30% threshold). Write tests first (TDD as guardrails). Be specific (detailed instructions beat vague descriptions). Review all code manually (never trust blindly). Use simple control loops (do not over-engineer multi-agent systems). Each rule addresses a specific failure mode observed in production Claude Code usage.

### Multi-Claude Verification Pattern

Split contexts for writing versus reviewing: one Claude instance writes the code, a fresh context (or subagent) validates the changes. This forces the model to "think twice" -- a reviewer without the writer's context catches errors that single-context agents miss. The pattern is especially valuable for security-sensitive code and architectural decisions.

### Permission and Security Configuration

The skill encodes specific permission patterns: allow Read, Write to src/**, and git/npm/pytest bash commands; deny access to .env files, .key files, production configs, rm commands, sudo, and admin endpoints. Use `.claude/settings.local.json` for sensitive personal settings (gitignored). Verify bash commands before execution. This configuration prevents agents from accidentally accessing secrets or running destructive commands.

## How to Leverage It

Apply the golden rules from the start of every project. Create a CLAUDE.md before your first Claude Code session. Set up permissions to prevent accidental damage. Use Plan Mode for any task that involves multiple files or architectural decisions.

### Example: Optimized Workflow

```
User: "I want to add authentication to my FastAPI app"

What happens: The skill guides the workflow -- start with Plan Mode to design the
auth architecture, create a checklist.md for the multi-step implementation, use
TDD (write test for login endpoint first), clear context between major phases,
and have a reviewer subagent validate the final implementation.
```

## Power Applications

The git worktree pattern enables true parallel development: create separate worktrees for different features, launch Claude in each (separate terminals), work on multiple features simultaneously, and clean up when done. This multiplies development throughput for independent features.

Headless CI/CD integration (`claude -p` in GitHub Actions) automates code review, issue triage, translation pipelines, and lint fixing. The skill teaches agents to set up these automations as part of project infrastructure.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **claude-code-framework** | Architectural knowledge that these best practices are built upon |
| **core-nxtg-forge** | Platform-specific patterns that extend these general practices |
| **git-workflow** | Git conventions referenced in CLAUDE.md and permission configuration |

## Tips

- CLAUDE.md is the highest-leverage investment you can make in a Claude Code project. Spend time getting it right.
- Context management is an ongoing discipline, not a one-time setup. Clear context before it becomes a problem.

---

*See also: [claude-code-framework](claude-code-framework.md) | [core-nxtg-forge](core-nxtg-forge.md)*
