# Skill Development

> Teaches agents how to create, structure, and optimize Claude Code skills using the SKILL.md format, progressive disclosure, and bundled resources.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Knowledge & Learning |

---

## What It Provides

Skill Development is a meta-skill -- it teaches agents how to build other skills. It contains the complete Anthropic engineering reference for Agent Skills: the SKILL.md file format, YAML frontmatter requirements, progressive disclosure architecture, bundled code execution, and best practices for evaluation and iteration.

Without this skill, agents create unstructured knowledge files that waste context tokens, fail to trigger at the right times, or load too much information at once. With it, agents build skills that follow the three-level progressive disclosure model: metadata loaded at startup, SKILL.md body loaded when relevant, and additional bundled files loaded only when specific scenarios arise.

The skill draws directly from Anthropic's engineering blog and product documentation, providing authoritative guidance on how Claude discovers, loads, and uses skills across Claude apps, Claude Code, and the API.

## When It Activates

- When you ask an agent to create a new skill or improve an existing one
- When designing the knowledge architecture for a project or plugin
- When a skill's description needs refinement for better trigger accuracy
- When deciding how to split large knowledge bases into progressive disclosure layers

## The Knowledge Inside

### The SKILL.md Anatomy

Every skill starts with YAML frontmatter containing two required fields: `name` and `description`. The name identifies the skill; the description is the trigger mechanism -- Claude reads it at startup and uses it to decide when the skill is relevant. The body is the second level of detail, loaded only when Claude determines the skill matches the current task. This two-layer approach keeps context lean while enabling deep expertise.

### Progressive Disclosure Architecture

The skill teaches a three-level information hierarchy. Level 1: name and description (always loaded, minimal tokens). Level 2: SKILL.md body (loaded when relevant). Level 3: additional bundled files referenced by name from SKILL.md (loaded on demand for specific scenarios). This architecture means a skill can contain effectively unbounded knowledge without overwhelming the context window.

### Bundled Code Execution

Skills can include scripts that Claude executes as tools. Some operations (sorting, PDF parsing, form field extraction) are better handled by deterministic code than by token generation. The skill teaches when to bundle executable code vs. when to write instructions, and how to structure scripts so Claude can run them without loading them into context.

### Evaluation-Driven Development

The recommended workflow is: identify capability gaps by running agents on representative tasks, build skills incrementally to address those gaps, monitor how Claude uses the skill in real scenarios, and iterate based on observations. The skill warns against trying to anticipate all needed context upfront -- instead, iterate with Claude and let it self-reflect on what went wrong when things go off track.

## How to Leverage It

When creating a new skill, start by describing what gap it fills. The agent will structure it with proper frontmatter, progressive disclosure, and appropriate bundled resources.

### Example: Creating a Domain Skill
```
User: "Create a skill that teaches agents about our payment processing domain"
What happens: The agent creates a SKILL.md with a focused description that
triggers on payment-related work, a body covering the domain model and
business rules, and references to separate files for Stripe integration
details and refund workflow specifics.
```

## Power Applications

- Build organization-specific skills that encode institutional knowledge and coding conventions
- Split large skills into progressive disclosure layers to minimize context usage
- Use the evaluation-driven approach to discover what context agents actually need, rather than guessing

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **agent-development** | Agent Development teaches agent creation; Skill Development teaches knowledge creation |
| **domain-knowledge** | A product of skill development -- an example of a comprehensive domain skill |
| **verify-governance** | Governance verification is a specialized skill built using these patterns |

## Tips

- The description field is the most important part of a skill -- it controls when the skill triggers. Invest time in writing it precisely
- If a SKILL.md exceeds 200 lines, split supporting content into bundled files and reference them
- Monitor Claude's chain of thought to see when and why it loads your skill, then refine the description accordingly

---

*See also: [agent-development](agent-development.md), [domain-knowledge](domain-knowledge.md)*
