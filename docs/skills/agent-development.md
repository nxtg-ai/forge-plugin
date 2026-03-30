# Agent Development

> Teaches agents how to create Claude Code agents with proper YAML frontmatter, system prompts, execution protocols, and quality gates -- the complete agent authoring guide.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Agent Roles |

---

## What It Provides

Agent Development is the definitive guide for creating NXTG-Forge agents. It covers the complete agent lifecycle: YAML frontmatter schema (required and optional fields), system prompt structure, execution protocol design, decision frameworks, quality gates, and coordination patterns (sequential, parallel, iterative).

Without this skill, agents produce agent definitions with missing required fields that fail to load, vague descriptions that never trigger correctly, no execution protocols that leave the agent directionless, and overlapping responsibilities that cause delegation conflicts. With it, agents create production-ready agent definitions with precise trigger descriptions, phased execution protocols, clear decision criteria, and explicit quality gates.

The skill provides three agent templates (specialist, coordinator, analyzer), a minimal valid example, and detailed guidance on the frontmatter fields that control model selection, tool access, isolation, memory persistence, and skill preloading.

## When It Activates

- When creating a new agent for the NXTG-Forge orchestration system
- When improving an existing agent's description, protocols, or quality gates
- When designing multi-agent coordination workflows
- When debugging why an agent fails to trigger or produces inconsistent results

## The Knowledge Inside

### Required Frontmatter Schema

Two fields are mandatory: `name` (lowercase letters, numbers, hyphens, max 64 characters) and `description` (when Claude should delegate to this agent, with `<example>` blocks for strong matching). Optional fields control the agent's capabilities: `model` (sonnet/opus/haiku), `color` (visual identification), `tools` (allowlist of available tools), `isolation` (worktree for parallel file work), `memory` (project/user/local persistence), and `skills` (preloaded skill content).

### System Prompt Structure

The skill teaches a five-section system prompt template. **Identity**: who the agent is and what it specializes in. **Core Responsibilities**: primary, secondary, tertiary duties with specific sub-tasks. **Execution Protocol**: phased workflow (Discovery, Planning, Execution, Validation) with numbered steps and timing estimates. **Decision Framework**: criteria for making choices within the agent's domain. **Quality Gates**: explicit definition of what "done" looks like.

### Agent Type Taxonomy

Three fundamental agent types serve different purposes. **Specialist agents** focus on one domain (QA, security, DevOps) with deep expertise, called for targeted tasks. **Coordinator agents** orchestrate other agents, manage workflows and dependencies, handle complex multi-step processes. **Analyzer agents** examine code, architecture, or systems, provide recommendations, and generate reports. Each type has a dedicated template.

### Coordination Patterns

Agents can work sequentially (A then B then C), in parallel (A, B, and C simultaneously with non-overlapping file scopes), or iteratively (A and B in a feedback loop). The skill teaches when each pattern is appropriate and how to declare file boundaries to prevent conflicts during parallel execution.

### Common Mistakes

Five failure modes to avoid: missing required frontmatter (agent will not load), vague descriptions (agent never triggers), no execution protocols (agent is directionless), overlapping responsibilities (delegation conflicts between agents), and no quality gates (no definition of success).

## How to Leverage It

Describe the agent you want to create, and the skill guides the agent through template selection, frontmatter configuration, and system prompt authoring.

### Example: Creating a Security Agent
```
User: "Create an agent that handles security audits"
What happens: The agent creates a specialist agent definition with name
"security-auditor", a description with <example> blocks matching security
audit scenarios, sonnet model, tools limited to read-only operations,
a four-phase execution protocol (scan, analyze, report, remediate),
and quality gates requiring all findings to include severity and fix.
```

## Power Applications

- Use `<example>` blocks in descriptions to train Claude's delegation accuracy for edge cases
- Set `isolation: worktree` on builder agents to enable safe parallel execution without merge conflicts
- Use `memory: project` on learning agents to persist patterns and preferences across sessions

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **skill-development** | Skill Development teaches knowledge creation; Agent Development teaches agent creation |
| **parallel-execution** | Defines which agents need the Task tool and how to coordinate parallel work |
| **domain-knowledge** | Provides the product context that agent descriptions reference |

## Tips

- The description field with `<example>` blocks is the primary trigger mechanism -- invest the most effort here
- Omit the Task tool from leaf worker agents to prevent uncontrolled sub-delegation chains
- Test new agents with the exact example queries from the frontmatter before deploying to production

---

*See also: [skill-development](skill-development.md), [parallel-execution](parallel-execution.md)*
