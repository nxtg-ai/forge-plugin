# Skills Reference

> 27 knowledge modules. Most load automatically when a task needs them; 8 load only when you invoke them. Skills are the expertise behind the agents — patterns, conventions, best practices, and anti-patterns that make AI output match senior engineering standards.

**Most skills need no setup.** When an agent works on a task, the relevant skills load in the background. Eight skills set `disable-model-invocation: true` and load only when you invoke them as `/nxtg-forge:<skill>`: architecture, ceo-loop, claude-code-framework, codex-framework, coding-standards, domain-knowledge, gemini-framework and skill-development.

---

## How Skills Work

Skills are contextual knowledge documents, not executable agents. When an agent starts working, Claude Code matches the task context against skill descriptions and loads the most relevant ones automatically. The eight invoke-only skills listed above are the exception: they load only when you type `/nxtg-forge:<skill>`.

**Example:** You ask Builder to implement a REST API. Claude Code can load the `testing` skill (test methodology) and the `runtime-validation` skill (validation at system boundaries) on its own. For layering and naming guidance, invoke `/nxtg-forge:architecture` and `/nxtg-forge:coding-standards` as well.

Skills are the difference between "AI-generated code" and "code that looks like your senior engineer wrote it."

---

## Why Skills Matter

Without skills, agents start from zero on every request. They might:
- Use inconsistent naming conventions across files
- Write tests that pass but prove nothing (hollow assertions)
- Miss your project's specific patterns and conventions
- Generate code that works but doesn't fit your architecture

With skills loaded, agents know:
- Your project's architecture patterns and boundaries
- Testing standards — coverage targets, assertion quality, integration patterns
- Security best practices — OWASP patterns, secrets handling, auth flows
- How Claude Code, Codex, and Gemini discover context (framework skills)
- Performance optimization strategies for your stack

---

## All 27 Skills by Category

### Core

Foundation knowledge loaded across many contexts. These define the baseline standards.

| Skill | What It Provides |
|-------|-----------------|
| [Core NXTG-Forge](core-nxtg-forge.md) | Forge-specific conventions — MCP tool usage, governance patterns, plugin architecture |

### Domain Knowledge

Deep expertise in specific engineering domains.

| Skill | What It Provides |
|-------|-----------------|
| [Architecture](architecture.md) | Clean Architecture layers, design and DDD patterns, backend building blocks, ADRs (invoke-only) |
| [Coding Standards](coding-standards.md) | Cross-language conventions, complexity limits, pre-PR checklist (invoke-only) |
| [Documentation](documentation.md) | Doc structure, API documentation patterns, README conventions, JSDoc standards |
| [OWASP Security](owasp-security.md) | OWASP detection and remediation, plus why a Forge security guard blocked a command and the correct fix |
| [Testing](testing.md) | Test framework usage, assertion patterns, coverage tools, fixture management |

### Framework Knowledge

How AI coding tools discover context — critical for multi-tool workflows.

| Skill | What It Provides |
|-------|-----------------|
| [Claude Code Framework](claude-code-framework.md) | Claude Code architecture, tool usage, agent patterns, extension points |
| [Codex Framework](codex-framework.md) | Codex CLI conventions — AGENTS.md, task mode, skill discovery (reference only) |
| [Gemini Framework](gemini-framework.md) | Gemini CLI conventions — GEMINI.md, context loading, modular imports (reference only) |

### Workflow

Development process patterns — from environment setup to deployment.

| Skill | What It Provides |
|-------|-----------------|
| [Dev Environment Patterns](dev-environment-patterns.md) | Environment setup, WSL2 patterns, toolchain configuration, CI/CD integration |
| [Git Workflow](git-workflow.md) | Branching strategy, commit conventions, PR review practices, release patterns |
| [Runtime Validation](runtime-validation.md) | Input validation, error boundaries, data integrity, type safety at system boundaries |
| [Parallel Execution](parallel-execution.md) | Plan Mode + Agent Teams — Claude Code's two force-multipliers |

### Performance & Debugging

Optimization and troubleshooting knowledge.

| Skill | What It Provides |
|-------|-----------------|
| [Optimization](optimization.md) | Performance profiling, bundle optimization, caching strategies, hot path analysis |
| [Browser Debugging](browser-debugging.md) | Playwright MCP for console errors, screenshots, network monitoring, UI debugging |

### Knowledge & Learning

Meta-skills about the system itself.

| Skill | What It Provides |
|-------|-----------------|
| [Skill Development](skill-development.md) | How to create new skills — SKILL.md format, progressive disclosure, triggers |
| [Domain Knowledge](domain-knowledge.md) | Project-specific domain concepts, business rules, terminology |
| [Verify Governance](verify-governance.md) | Adjudicates a flagged governance concern with evidence and issues a JUSTIFIED or REVERT verdict |
| [CEO Loop](ceo-loop.md) | ORBIT protocol for autonomous governance — iteration model, decision tracking |
| [Crucible Audit](crucible-audit.md) | Forensic test quality methodology — the 8 fraud patterns, detection techniques |

### Agent Roles

Expertise modules that inform specific agent personalities.

| Skill | What It Provides |
|-------|-----------------|
| [Agent Lead Architect](agent-lead-architect.md) | System design leadership, architecture decisions, trade-off analysis frameworks |
| [Agent Backend Master](agent-backend-master.md) | Backend patterns — API design, data layer, server architecture, caching |
| [Agent CLI Artisan](agent-cli-artisan.md) | CLI tool design — argument parsing, output formatting, terminal UX |
| [Agent Platform Builder](agent-platform-builder.md) | Platform engineering — infrastructure, deployment, scaling, observability |
| [Agent QA Sentinel](agent-qa-sentinel.md) | QA leadership — test coverage analysis, bug detection, quality gates |
| [Agent Development](agent-development.md) | Agent creation guide — frontmatter, system prompts, tool selection, examples |
| [Agent Integration Specialist](agent-integration-specialist.md) | Service integration — API connections, webhooks, auth flows, data sync |

---

## How Skills Load

```
You type a prompt
  │
  Claude Code analyzes context
  │
  ├── Matches task against skill descriptions
  │     └── "Implement a REST API" → may load: testing, runtime-validation
  │
  ├── Matches project type
  │     └── Dev server on WSL2 → may load: dev-environment-patterns
  │
  └── Matches agent invocation
        └── Builder agent → loads: parallel-execution (knows about Plan Mode)
```

Skills don't conflict — they layer. When multiple skills activate, their knowledge combines to give agents a comprehensive understanding of what "good" looks like for your specific task.

---

## Creating Custom Skills

Skills are `SKILL.md` files in directories under your plugin's `skills/` folder. See [Skill Development](skill-development.md) for the complete guide.

```yaml
---
name: My Custom Skill
description: When this skill is relevant — triggers automatic loading
---

# Skill Content

Your knowledge, patterns, best practices...
```

The `description` field is the trigger — Claude Code matches it against task context to decide when to load the skill. Write descriptions that capture the *situations* where this knowledge helps, not just the topic.
