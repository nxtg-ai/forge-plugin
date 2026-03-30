# Core NXTG-Forge

> Provides comprehensive platform knowledge of the NXTG-Forge system -- state management, agent orchestration, checkpoint recovery, and MCP integration -- so agents understand the infrastructure they operate within.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Core |

---

## What It Provides

This skill is the system manual for NXTG-Forge itself. It teaches agents how the platform works: how state is tracked in `.claude/state.json`, how agents are coordinated through an orchestration layer, how checkpoints enable zero-context recovery, and how MCP servers are auto-detected and configured. Any agent operating within an NXTG-Forge project needs this knowledge to maintain state correctly, hand off work cleanly, and leverage the platform's recovery capabilities.

Without this skill, agents would treat each session as a blank slate, ignore state updates, skip checkpoints, and fail to leverage MCP integrations that are already configured. The result is lost context, duplicated work, and brittle workflows that break on session interruption. This skill ensures agents are good citizens of the NXTG-Forge ecosystem.

The knowledge is operational: it covers the specific JSON structure of state files, the agent handoff protocol (what information must be passed between agents), the checkpoint creation and restoration workflow, and the MCP auto-detection system that scans project dependencies for needed integrations.

## When It Activates

- When you are working inside any NXTG-Forge managed project
- When an agent needs to update project state or create a checkpoint
- When recovering from a session interruption or context loss
- When configuring MCP servers or checking project health

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### State Management as Source of Truth

The skill defines `state.json` as the single source of truth for project status. It encodes the exact structure: project metadata (name, type, forge version), development state (current phase, feature lists by status), active agents, and quality metrics (test coverage, linting status). Agents are taught to update state after every significant change -- completing a feature, changing phases, updating coverage numbers. Stale state means broken recovery, so the skill emphasizes frequent, accurate updates.

### Agent Coordination Protocol

NXTG-Forge uses specialized agents (Lead Architect, Backend Master, CLI Artisan, Platform Builder, Integration Specialist, QA Sentinel). The skill teaches the handoff protocol: when one agent finishes its work, it must document what was done, what was decided, and what the next agent needs to know. A handoff from Lead Architect to Backend Master includes domain model locations, use case specifications, API endpoint designs, and database schemas. Vague handoffs like "implement user stuff" are explicitly flagged as anti-patterns.

### Zero-Context Recovery

Checkpoints are state snapshots that enable time-travel recovery. The skill teaches agents to create meaningful checkpoints at milestones (not "stuff" but "User auth: JWT implementation + tests complete (92% coverage)"). On recovery, agents can check `forge recovery` to see the last active session, in-progress features, and available checkpoints. This turns session interruptions from disasters into minor inconveniences.

### MCP Auto-Detection

The skill covers the MCP integration system: how `forge mcp detect` scans the project for GitHub repos, database dependencies, payment providers, and communication tools, then configures the appropriate MCP servers. Agents learn to check MCP availability before attempting tool calls and to configure missing servers when needed.

## How to Leverage It

When starting work in an NXTG-Forge project, check state first. The skill teaches agents to read `state.json` before making any changes, ensuring they understand the current phase, active features, and quality metrics. After completing significant work, update state and create a checkpoint.

### Example: Session Recovery

```
User: "Continue where we left off on the authentication feature"

What happens: The skill activates and guides the agent to read state.json for current
progress, check the last checkpoint for context, identify in-progress work, and
resume from exactly where the previous session ended.
```

## Power Applications

The skill enables autonomous multi-session development. Because agents know how to save state, create checkpoints, and recover context, a complex feature can span multiple sessions without information loss. Each session picks up where the last one left off, with full awareness of what was completed, what failed, and what remains.

It also enables parallel agent work. When two agents know the handoff protocol, they can divide a feature (one handles backend, another handles tests) and merge their work through state updates.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **core-architecture** | Defines the code structure that state.json tracks |
| **core-testing** | Quality metrics in state.json reflect testing standards defined here |
| **claude-code-framework** | Platform capabilities that NXTG-Forge builds upon |

## Tips

- State updates should happen after every completed feature or milestone, not at end of session.
- Checkpoint descriptions should be specific enough to enable recovery without reading code.

---

*See also: [claude-code-framework](claude-code-framework.md) | [architecture](architecture.md)*
