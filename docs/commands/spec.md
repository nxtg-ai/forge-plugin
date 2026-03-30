# /forge:spec

> Generate a comprehensive technical specification for a feature by analyzing your codebase and producing a structured plan with requirements, architecture, implementation steps, and test cases.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Feature Development |
| **Syntax** | `/forge:spec [feature name or description] [--interactive] [--output <file>]` |

---

## What It Does

`/forge:spec` is the planning-only counterpart to `/forge:feature`. It analyzes your existing codebase -- directory structure, code patterns, test conventions, and available dependencies -- then produces a structured specification document covering requirements (functional and non-functional), architecture (components, data models, integration points), implementation plan (files to create, files to modify, ordered steps), testing strategy (unit tests, integration tests, edge cases), and acceptance criteria.

The spec is grounded in your actual code. Instead of producing a generic template, Forge reads your existing implementations via Glob and Grep to understand naming conventions, module organization, and testing patterns. The resulting spec follows those patterns so that implementation feels natural, not foreign.

Without this command, writing a spec means manually surveying the codebase, documenting the plan in a separate file, and hoping you did not miss an integration point. `/forge:spec` automates the survey and produces a spec that directly feeds into `/forge:feature` for implementation.

## Syntax & Options

```
/forge:spec [feature name or description] [--interactive] [--output <file>]
```

| Option | Description |
|--------|------------|
| `feature name` | A short name or description of what to spec. If omitted, the command asks interactively. |
| `--interactive` | Step-by-step spec building with guided questions about requirements, constraints, and test coverage. |
| `--output <file>` | Save the spec to a specific file path instead of the default `.claude/plans/{slug}-spec.md`. |

## When to Use It

- **Before a complex feature**: When the feature touches multiple files or modules, write the spec first to catch design issues before writing code.
- **Team alignment**: Generate a spec to share with collaborators so everyone agrees on the approach before implementation starts.
- **Exploring a new codebase**: Use `--interactive` mode to learn how a project is structured while planning your first contribution.

When you want to go straight from idea to working code, use `/forge:feature` instead -- it generates a spec internally as part of its pipeline.

## Examples

### Example 1: Quick Spec Generation

```
/forge:spec "WebSocket notification system"
```

Forge analyzes the codebase and produces a spec saved to `.claude/plans/websocket-notification-system-spec.md` with sections for Overview, Requirements, Architecture, Implementation Plan, Testing, and Acceptance Criteria.

```
Spec saved: .claude/plans/websocket-notification-system-spec.md

Next steps:
  /forge:feature WebSocket notification system   Implement this feature
  /forge:checkpoint save                         Save state before starting
```

### Example 2: Interactive Mode

```
/forge:spec --interactive
```

Asks guided questions one at a time:

```
What feature are you building?
> Real-time dashboard metrics

What are the key requirements?
> Sub-second latency, historical playback, SSE fallback

Any specific technical constraints?
> Must work behind nginx reverse proxy

What should the tests cover?
> Connection lifecycle, reconnection, message ordering
```

Builds the spec from your answers, incorporating codebase analysis.

## Power Use Cases

Use `/forge:spec` to create specs for multiple features, review and prioritize them, then implement in order with `/forge:feature`. The `.claude/plans/` directory becomes your backlog.

In `--interactive` mode, the questions surface architectural decisions you might not have considered. Use this as a design thinking tool, not just a document generator.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:feature** | Specs feed directly into the feature implementation pipeline |
| **/forge:checkpoint** | Save state before implementing a spec so you can roll back |
| **/forge:agent-assign** | Assign specific parts of a spec to specialized agents |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full spec generation with codebase analysis, requirements, and test planning |
| **L2 Pro Builder** | Specs are recorded as decisions via `forge_capture_knowledge` for project memory |
| **L3 Ship Lord** | Spec status and implementation progress visible in the forge-ui dashboard |

## Tips & Gotchas

- Specs are saved to `.claude/plans/` by default. Create this directory structure once and it persists across sessions.
- The complexity estimate (LOW/MEDIUM/HIGH) is based on file count and integration point count -- use it as a rough guide, not a commitment.
- The `--output` flag lets you save specs alongside your project docs (e.g., `--output docs/specs/auth-spec.md`).
- Acceptance criteria always include "All tests passing" and "TypeScript compiles without errors" as baseline gates.

---

*See also: [feature](../commands/feature.md) | [agent-assign](../commands/agent-assign.md) | [checkpoint](../commands/checkpoint.md)*
