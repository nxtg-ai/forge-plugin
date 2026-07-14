# Architecture Decision Records

Full ADR records for NXTG-Forge. Summaries in `SKILL.md` §Architecture Decision Records.

---

## ADR-001: Clean Architecture Adoption

**Decision**: Implement Clean Architecture pattern

**Context**: Need maintainable, testable codebase that can evolve independently of frameworks, databases, and UI.

**Rationale**:
- Clear separation of concerns across domain / application / infrastructure / interface layers
- Domain logic independent of frameworks — survives CLI rewrites, DB swaps
- Easy to test (pure functions, injectable deps, no mocks needed for domain logic)
- UI/infrastructure can change independently without touching business rules

**Consequences**:
- ✅ High testability — domain functions are pure, no side effects
- ✅ Clear boundaries — easy to know where new code belongs
- ✅ Independent replaceability of outer layers
- ⚠️ Initial complexity — more files and indirection than a flat script
- ⚠️ Learning curve — team must understand the layer rules and dependency direction

---

## ADR-002: Agent-Based Generation

**Decision**: Use specialized AI agents for different concerns (architecture, backend, CLI, platform, integration, QA)

**Context**: Project generation involves complex, multi-faceted work. A single-agent approach serializes everything and can't leverage parallel execution or domain specialization.

**Rationale**:
- Separation of expertise: each agent type optimized for its domain
- Parallel execution for independent tasks (e.g., backend schema + CLI scaffolding simultaneously)
- Clear ownership — unambiguous where an agent-related bug lives
- Config-driven: new agent types added via `.claude/config.json` without code changes

**Consequences**:
- ✅ Parallel execution — independent tasks run concurrently
- ✅ Specialized knowledge per agent domain
- ✅ Extensible via config (no code change to add new agent type)
- ⚠️ Coordination overhead — orchestrator logic required to assign and sequence tasks
- ⚠️ State synchronization — agents working in parallel must not corrupt shared state

---

## ADR-003: Immutable State

**Decision**: Use immutable state objects (Python frozen dataclasses) throughout the domain layer

**Context**: Mutable state objects lead to unexpected mutations, race conditions in async/parallel agent execution, and difficult-to-reason state transitions.

**Rationale**:
- No unexpected mutations — state can only change via explicit `replace()` / `with_*` methods
- Thread-safe by default — frozen objects can be shared across coroutines without locking
- Easier to reason about state transitions — each transition produces a new object
- Audit trail friendly — prior state preserved; history can be reconstructed

**Consequences**:
- ✅ Predictability — mutations are always explicit and traceable
- ✅ Thread-safety — safe to share across concurrent agent tasks
- ✅ Simpler debugging — snapshot-inspect any prior state
- ⚠️ More object creation — each state change creates a new object (mitigated by Python's allocator efficiency and the low frequency of state transitions in a CLI tool)

---

## Blank ADR Template

Use this for new architecture decisions. File as `ADR-NNN-short-title.md` or append to this file.

```
## ADR-NNN: <Title>

**Decision**: <One sentence — what was decided>

**Context**: <Why this decision was needed — the problem or constraint>

**Rationale**:
- <Reason 1>
- <Reason 2>
- <Reason 3>

**Alternatives Considered**:
- <Alternative A> — rejected because <reason>
- <Alternative B> — rejected because <reason>

**Consequences**:
- ✅ <Positive outcome>
- ✅ <Positive outcome>
- ⚠️ <Trade-off or risk>
- ⚠️ <Trade-off or risk>

**Status**: PROPOSED | ACCEPTED | SUPERSEDED by ADR-NNN
**Date**: YYYY-MM-DD
**Deciders**: <who was involved>
```

---

*Source: extracted from `SKILL.md` v1.0.0 — 2026-01-06*
