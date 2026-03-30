# /forge:feature

> Design, plan, and implement a new feature end-to-end with structured specs, parallel agent teams, and quality gates.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Feature Development |
| **Syntax** | `/forge:feature [feature name or description]` |

---

## What It Does

`/forge:feature` is the full-lifecycle feature builder. It takes a feature idea from description through codebase analysis, spec generation, implementation, testing, and validation -- all in one command. The intelligence behind it is a three-phase agent pipeline: Phase A locks interface contracts via the planner agent, Phase B spawns builder and testing agents in parallel to write code and tests simultaneously, and Phase C runs a guardian agent quality gate to catch type errors, test failures, and security issues before you commit.

Before writing a single line, the command analyzes your existing codebase: directory structure, existing patterns, test conventions, and available dependencies. This means the generated spec accounts for how your project actually works, not how a generic project might work. The spec is saved to `.claude/plans/` so you can review, modify, or revisit it later.

Without this command, planning a feature means mentally mapping the codebase, writing a spec document by hand, implementing sequentially (code first, tests after), and hoping you catch integration issues. `/forge:feature` parallelizes the build-and-test phase, enforces quality gates, and records the implementation as knowledge in the orchestrator for future reference.

## Syntax & Options

```
/forge:feature [feature name or description]
```

| Option | Description |
|--------|------------|
| `feature name` | A short name or description of what to build. If omitted, the command asks interactively. |

## When to Use It

- **Adding a new capability**: Describe what you want ("user authentication with JWT") and let Forge analyze the codebase, plan the implementation, and build it with tests.
- **Implementing a spec you already have**: If a spec file exists in `.claude/plans/`, reference it and skip straight to implementation.
- **Rapid prototyping**: Even for small features, the structured spec and parallel test generation save time over ad-hoc implementation.

For generating just the spec without implementation, use `/forge:spec` instead. For assigning a task to a specific agent without the full pipeline, use `/forge:agent-assign`.

## Examples

### Example 1: Feature from Description

```
/forge:feature "rate limiting middleware for the API"
```

Forge analyzes the codebase, finds existing middleware patterns, and generates a spec:

```
FEATURE SPEC: rate-limiting-middleware
==============================

Files to Create:
  - src/middleware/rate-limiter.ts - Token bucket rate limiter
  - src/middleware/__tests__/rate-limiter.test.ts - Unit tests

Files to Modify:
  - src/app.ts - Register middleware

Implementation Steps:
  1. Define RateLimitConfig interface
  2. Implement token bucket algorithm
  3. Create Express middleware wrapper
  4. Add tests for burst, sustained, and edge cases
  5. Wire into app.ts

Estimated Complexity: MEDIUM
```

After you approve, parallel agents build the code and tests simultaneously.

### Example 2: Interactive Feature Discovery

```
/forge:feature
```

Without arguments, the command asks what you want to build and what scope to target (small/medium/large), then proceeds with the same pipeline.

## Power Use Cases

Chain `/forge:spec "feature name"` to create and refine a spec, then `/forge:feature "feature name"` to implement it. The feature command detects existing specs in `.claude/plans/` and uses them directly.

For large features, the parallel agent pipeline (Phase B) can cut implementation time significantly. The builder agent writes source files while the testing agent writes test files -- they never conflict because the spec defines file boundaries upfront in Phase A.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:spec** | Generate a spec first, refine it, then hand off to feature for implementation |
| **/forge:test** | Run after feature completion to verify the full test suite still passes |
| **/forge:checkpoint** | Save state before starting a feature so you can roll back if needed |
| **/forge:agent-assign** | Use for simpler tasks that do not need the full three-phase pipeline |
| **guardian agent** | Phase C quality gate runs automatically; you can also invoke the guardian manually |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full feature pipeline with spec, implementation, tests, and validation |
| **L2 Pro Builder** | Completed features are recorded via `forge_capture_knowledge`; tasks are tracked via `forge_complete_task` |
| **L3 Ship Lord** | Feature progress and task status are visible in the forge-ui dashboard |

## Tips & Gotchas

- The spec is saved to `.claude/plans/{feature-slug}-spec.md`. You can edit this file and re-run the command to implement a modified plan.
- Phase B (parallel build + test) requires the Task tool. If it is unavailable, the command falls back to sequential inline implementation.
- The quality gate in Phase C checks types (`tsc --noEmit`), tests (`vitest run`), and security. If it finds issues, they are addressed before the feature is marked complete.
- Governance state in `.claude/governance.json` is updated with the new workstream automatically.

---

*See also: [/forge:spec](spec.md) | [/forge:agent-assign](agent-assign.md) | [/forge:test](test.md)*

*Agents in the pipeline: [Planner](../agents/planner.md) (Phase A) | [Builder](../agents/builder.md) + [Testing](../agents/testing.md) (Phase B, parallel) | [Guardian](../agents/guardian.md) (Phase C)*
