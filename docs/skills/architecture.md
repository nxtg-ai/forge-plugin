# Architecture

> Language-agnostic guidance for structuring a codebase: Clean Architecture layering, the dependency rule, structural and DDD tactical patterns, backend building blocks, and ADRs for recording decisions.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Knowledge |

---

## What It Provides

Reusable guidance for structuring *your* project. The skill says plainly that it is not a description of NXTG-Forge's own internals; for those, read each Forge repo's `CLAUDE.md`. Its examples are illustrative patterns, shown in Python as one concrete language.

## When It Activates

- When designing a new system or feature, or deciding which layer code belongs in
- When refactoring a tangled or God-object codebase, or reviewing coupling and boundaries
- When choosing a design pattern, shaping a REST API, or fixing persistence issues such as N+1 queries
- When writing an Architecture Decision Record

This skill does not load automatically (`disable-model-invocation: true`). Invoke it as `/nxtg-forge:architecture`.

## The Knowledge Inside

### Clean Architecture Layers

Four layers with dependencies pointing inward: Domain (entities, value objects, pure business rules), Application (use cases, orchestration, DTOs, transaction boundaries), Infrastructure (repository implementations, file/DB/network access), and Interface (CLI/HTTP/UI entry points). A worked example places each piece of a `/generate` command in its layer and says why.

### Structural and DDD Patterns

A pick-by-intent table for Repository, Strategy, Observer, Command and DI containers, each with the trade-off to weigh. DDD tactical patterns: entities (identity), value objects (immutable, self-validating) and aggregates (mutate only through the root).

### Backend Building Blocks

REST resource design and status codes, Repository plus Unit of Work, the N+1 query defect, cache-aside eviction, domain events, and a layered error hierarchy. Immutable state is presented as a default, with the reasons.

### ADRs

Minimum fields for an Architecture Decision Record (Decision, Context, Rationale, Alternatives, Consequences, Status, Date), with worked examples and a blank template in `reference/adr-templates.md`.

### Gotchas

Failure modes such as dependency-rule inversion, anemic domain models, over-engineering small projects, leaky repository interfaces, and frozen objects with mutable fields.

## Reference Files

| File | Content |
|------|---------|
| `reference/patterns.md` | Illustrative code for every layer, pattern and state transition |
| `reference/backend-patterns.md` | DDD code and backend patterns with language equivalents |
| `reference/adr-templates.md` | Example ADRs and a copy-paste template |

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **coding-standards** | Coding conventions that apply within this architecture |
| **testing** | How to test components structured this way |

---

*See also: [coding-standards](coding-standards.md) | [testing](testing.md)*
