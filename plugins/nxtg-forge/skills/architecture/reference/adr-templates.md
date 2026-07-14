# Architecture Decision Records — Format + Examples

Referenced from [`../SKILL.md`](../SKILL.md).

> **These ADRs are illustrative examples of the format**, not a record of decisions
> made in this repo. Use them as models for how to write your own, then use the
> blank template at the bottom for real decisions in your project.

---

## Example ADR-001: Adopt Clean Architecture

**Decision**: Structure the codebase into domain / application / infrastructure /
interface layers with dependencies pointing inward.

**Context**: A maintainable, testable codebase that can evolve independently of
frameworks, databases, and UI.

**Rationale**:
- Clear separation of concerns across the four layers.
- Domain logic independent of frameworks — survives CLI rewrites and DB swaps.
- Pure domain functions test without mocks; outer layers inject fakes.

**Alternatives Considered**:
- Flat single-module script — rejected: business logic entangles with I/O, untestable.
- MVC only — rejected: doesn't isolate business rules from the delivery mechanism.

**Consequences**:
- ✅ High testability, clear boundaries, replaceable outer layers.
- ⚠️ More files and indirection than a flat script; a learning curve for the layer rules.

---

## Example ADR-002: Immutable State Objects

**Decision**: Model domain/session state with immutable objects (e.g. frozen
dataclasses); mutate only by producing a new object.

**Context**: Mutable state causes unexpected mutations, races under concurrent work,
and hard-to-trace transitions.

**Rationale**:
- Mutations become explicit and greppable (`with_status()`, `replace()`).
- Frozen objects are safe to share across concurrent tasks without locks.
- Prior snapshots survive, so transition history can be reconstructed.

**Alternatives Considered**:
- Mutable objects + locks — rejected: lock discipline is error-prone and easy to forget.

**Consequences**:
- ✅ Predictability, concurrency-safety, snapshot debugging.
- ⚠️ More allocations (negligible for low-frequency transitions).
- ⚠️ Watch deep-immutability: collection fields stay mutable unless frozen too.

---

## Example ADR-003: Specialized Roles for Multi-Concern Work

**Decision**: Split complex generation work across specialized roles (architecture,
backend, CLI, platform, integration, QA) instead of one generalist path.

**Context**: Multi-faceted work serialized through a single path can't leverage
specialization or parallelism.

**Rationale**:
- Each role is optimized for its domain; ownership of bugs is unambiguous.
- Independent tasks (e.g. backend schema + CLI scaffolding) can run in parallel.

**Alternatives Considered**:
- Single generalist path — rejected: no specialization, everything serializes.

**Consequences**:
- ✅ Parallel execution, specialized knowledge, clear ownership.
- ⚠️ Coordination overhead; shared state must not be corrupted by parallel work.

---

## Blank ADR Template

Copy this for a new decision. File as `ADR-NNN-short-title.md`.

```
## ADR-NNN: <Title>

**Decision**: <One sentence — what was decided>

**Context**: <Why this decision was needed — the problem or constraint>

**Rationale**:
- <Reason 1>
- <Reason 2>

**Alternatives Considered**:
- <Alternative A> — rejected because <reason>
- <Alternative B> — rejected because <reason>

**Consequences**:
- ✅ <Positive outcome>
- ⚠️ <Trade-off or risk>

**Status**: PROPOSED | ACCEPTED | SUPERSEDED by ADR-NNN
**Date**: YYYY-MM-DD
**Deciders**: <who was involved>
```
