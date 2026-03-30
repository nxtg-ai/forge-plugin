# Domain Knowledge

> Encodes the complete NXTG-Forge product domain -- vision, core concepts, architecture, workflows, and terminology -- so agents understand what they are building and why.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Knowledge & Learning |

---

## What It Provides

Domain Knowledge is the foundational context skill for the entire NXTG-Forge ecosystem. It teaches agents what NXTG-Forge is (a self-deploying AI development infrastructure), what problem it solves (static scaffolding tools lack intelligence, context awareness, and state management), and how its components work together (specifications, agent orchestration, state management, gap analysis, MCP integration).

Without this skill, agents treat NXTG-Forge as a generic code project. With it, they understand the product vision ("From Specification to Production in Minutes, Not Days"), the Clean Architecture foundation, the six-agent orchestration model, and the intelligence loop that turns problems into documented, automated prevention.

The skill is a living document that accumulates institutional knowledge from real debugging sessions. It includes lessons learned (such as the multi-device CORS issue caused by hardcoded localhost URLs) alongside the architectural overview and workflow documentation.

## When It Activates

- When an agent needs to understand what NXTG-Forge does and how its components relate
- When making architectural decisions that must align with the product vision
- When onboarding to the project or working on cross-cutting concerns
- When an agent needs terminology definitions (checkpoint, health score, orchestrator, skill, hook)

## The Knowledge Inside

### Core Concepts

The skill teaches six foundational concepts. **Project Specification**: natural language descriptions parsed into structured project generation. **Agent Orchestration**: six specialized agents (Lead Architect, Backend Master, CLI Artisan, Platform Builder, Integration Specialist, QA Sentinel) coordinated by capability matching. **State Management**: persistent JSON state in `.claude/state.json` enabling session recovery, progress tracking, and checkpoint/restore. **Clean Architecture**: four-layer dependency model where inner layers never depend on outer layers. **Gap Analysis**: continuous quality scanning across testing, architecture, security, documentation, and code quality. **MCP Integration**: automatic detection and configuration of required Model Context Protocol servers.

### Key Workflows

Four canonical workflows are documented. New project generation (spec, generate, initialize, develop). Feature development (status check, architect planning, agent handoff chain, checkpoint, quality check). Recovery from interruption (recovery info, checkpoint restore or session resume). Quality improvement (gap analysis, recommendations review, health check, targeted improvements, verification).

### Architecture and Data Flow

The skill maps the complete data flow: user input becomes a specification, which feeds the spec generator, file generator, state manager, orchestrator, agents, gap analyzer, and hooks. Each component's role and relationship is documented, along with the standard directory structure for NXTG-Forge projects.

### Institutional Knowledge

A living knowledge base section captures lessons from real debugging sessions. Each entry follows the pattern: issue, root cause, solution, artifacts created. This demonstrates the intelligence loop (problem, debug, document, automate prevention) that makes NXTG-Forge a learning system.

## How to Leverage It

This skill activates automatically when agents encounter NXTG-Forge-specific concepts. Reference it explicitly when you need agents to make decisions aligned with the product vision.

### Example: Architecture Decision
```
User: "Should we add a real-time notification system?"
What happens: The agent consults domain knowledge to understand NXTG-Forge's
architecture (MCP integration, agent orchestration, state management) and
evaluates the notification system against the product vision and existing
data flow patterns, rather than designing in isolation.
```

## Power Applications

- Use the terminology glossary to maintain consistent naming across documentation and code
- Reference the gap analysis categories when designing new quality checks
- Apply the intelligence loop pattern (problem, debug, document, automate) to all debugging sessions

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **agent-lead-architect** | Lead Architect uses domain knowledge for architectural decisions |
| **skill-development** | Domain Knowledge is an example of a well-structured comprehensive skill |
| **verify-governance** | Governance verification references domain concepts like scope and directives |

## Tips

- This is the skill to read first when joining the NXTG-Forge project -- it provides the vocabulary and mental model
- The lessons learned section grows over time; check it for known pitfalls before debugging novel issues
- Clean Architecture's dependency rule (dependencies point inward) is non-negotiable in NXTG-Forge projects

---

*See also: [agent-lead-architect](agent-lead-architect.md), [skill-development](skill-development.md)*
