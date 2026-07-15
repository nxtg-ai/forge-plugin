---
name: Architecture
disable-model-invocation: true
description: >
  Clean Architecture, Domain-Driven Design, and backend system-design guidance:
  organizing a codebase into layers with the right dependency direction, choosing
  structural design patterns (Repository, Strategy, Observer, Command, DI), applying
  DDD tactical patterns (entities vs value objects, aggregates), designing REST
  resources and status codes, persistence (unit-of-work, N+1), caching, domain
  events, layered error handling, and recording decisions as ADRs. Use when
  designing a new system or feature, deciding which layer code belongs in,
  refactoring a tangled/God-object codebase, reviewing coupling and boundaries,
  shaping an API, or writing an Architecture Decision Record.
when_to_use: >
  Trigger on requests like "how should I structure this", "which layer does X go
  in", "design the architecture for <feature>", "this module is too coupled / hard
  to test", "should this be an interface or concrete class", "add a new backend
  without touching business logic", "entity or value object", "define an aggregate",
  "REST endpoint design", "what status code", "repository / unit of work",
  "fix the N+1", "cache-aside vs write-through", "domain events", "error handling
  across layers", "write an ADR for <decision>", "review our dependency direction",
  "is this the right design pattern here".
allowed-tools: Read, Grep, Glob
---

# Architecture & System Design

**What this skill is**: reusable, language-agnostic guidance for structuring a
codebase — Clean Architecture layering, the dependency rule, the structural design
patterns that keep boundaries clean, and the ADR format for recording decisions.

**What this skill is NOT**: a description of the shipped NXTG-Forge implementation.
The real forge repos are polyglot (Rust orchestrator, Node governance MCP, React
UI) — for their actual internals read the repo `CLAUDE.md` files, not this skill.
The examples below are illustrative reference patterns you apply to *a* project,
shown in Python as one concrete language.

---

## Clean Architecture in one rule

**Dependencies point inward. Inner layers know nothing about outer layers.**

```
┌─────────────────────────────────────────────┐
│  Interface   (CLI / HTTP / UI)               │  ─┐
├─────────────────────────────────────────────┤   │
│  Infrastructure  (files, DB, network, I/O)   │  ─┤  imports allowed
├─────────────────────────────────────────────┤   │  in this direction ▼
│  Application  (use cases, orchestration)     │  ─┤
├─────────────────────────────────────────────┤   │
│  Domain  (entities, value objects, rules)    │  ◄┘  imports nothing outward
└─────────────────────────────────────────────┘
```

The payoff: business rules survive a CLI rewrite, a DB swap, or a UI change,
because none of those outer things are imported by the domain. The domain is
testable with no mocks because it has no I/O.

---

## The four layers — what lands where

| Layer | Holds | Never holds | Example dir |
|---|---|---|---|
| **Domain** | Entities (identity), value objects (attributes), pure business rules | I/O, framework imports, DB calls | `domain/` |
| **Application** | Use cases, orchestration of domain objects, DTOs, transaction boundaries | business rules of its own, I/O details | `application/` |
| **Infrastructure** | Repository *implementations*, file/DB/network access, serialization | domain logic | `infrastructure/` |
| **Interface** | CLI/HTTP/UI entry points, input validation, output formatting | business logic (delegates immediately) | `interface/` |

**The tell for a misplaced piece**: if a domain file imports a database driver, a
web framework, or a file path, it is in the wrong layer. Move the I/O to
infrastructure behind an interface the domain defines.

→ Full code for all four layers: [reference/patterns.md](reference/patterns.md) §Layer Examples

---

## Worked example — "add a `/generate` command that renders a template to disk"

Trace one feature through the layers instead of guessing:

| Piece of the feature | Layer | Why |
|---|---|---|
| `Template`, `ProjectConfig` (the data + invariants) | Domain | Pure, no I/O — a template is valid or not regardless of where it's stored |
| `TemplateRepository` (interface) | Domain | The domain declares *what* it needs ("find a template by name"), not *how* |
| `GenerateProjectUseCase.execute()` | Application | Orchestrates: load → validate → render → return result |
| `FileTemplateRepository`, `FileGenerator` (Jinja2) | Infrastructure | The actual disk reads/writes, implementing the domain interface |
| `generate` CLI command parsing `--template --name` | Interface | Parses args, calls the use case, formats the result — nothing more |

Dependency check: Interface → Application → Domain ← Infrastructure. The arrows
converge on Domain; nothing leaves it. That is the rule holding.

→ Repository/DTO/use-case code: [reference/patterns.md](reference/patterns.md)

---

## Structural design patterns — pick by intent

| Pattern | Use when | Trade-off to weigh |
|---|---|---|
| **Repository** | You want to swap storage (file ↔ DB ↔ network) without touching business code | One indirection layer; don't add it for a single hardcoded store |
| **Strategy** | 3+ interchangeable algorithms for the same operation (e.g. template selection) | Overkill for 2 variants — a conditional is fine there |
| **Observer** | Decouple event producers from consumers (hooks, notifications) | Execution order not guaranteed → observers must be idempotent |
| **Command** | Operations need queuing, logging, or undo/redo | A wrapper object per operation |
| **DI Container** | Wiring is sprawling and you want tests to inject fakes | For small projects, manual constructor wiring beats a custom container — reach for an established DI framework before hand-rolling one |

→ Pattern implementations + trade-offs: [reference/patterns.md](reference/patterns.md) §Design Pattern Code Examples

---

## DDD tactical patterns — entities, value objects, aggregates

Inside the Domain layer, three building blocks decide *where identity and
invariants live*:

| Concept | Has identity? | Mutable? | Model as | Compare by |
|---|---|---|---|---|
| **Entity** | Yes (a stable id) | Yes — but only via its own methods | class with behavior | identity |
| **Value object** | No — it *is* its attributes | No (immutable, self-validating) | frozen record / readonly struct | value |
| **Aggregate** | Root is an entity | Only through the root | root + private children | root identity |

- **Entity**: `User` stays the same user after changing email. Business rules
  (`change_email`, `change_password`) belong *on* the entity, not in a service.
- **Value object**: `Email`, `Money`, `DateRange` — immutable and self-validating in
  its constructor. Modeled as `@dataclass(frozen=True)` / `record` / `readonly
  struct` / frozen class depending on language.
- **Aggregate**: mutate only through the root so invariants can't be bypassed;
  reference *other* aggregates by id (`customer_id`), never by object.

→ Full DDD code + language equivalents: [reference/backend-patterns.md](reference/backend-patterns.md) §Domain-Driven Design

---

## Backend building blocks — API, persistence, caching, events, errors

Concise rules; full illustrative code is in
[reference/backend-patterns.md](reference/backend-patterns.md).

- **REST resources**: URLs name resources, the HTTP method is the verb — `GET
  /users/123`, `POST /users`, `DELETE /users/123`. Never `POST /getUser`. Split
  status codes: `2xx` success (`201` create, `204` empty delete), `400` unparseable
  vs `422` semantically invalid, `401` no-auth vs `403` no-permission, `409`
  conflict. Many frameworks already emit `422` on body validation — don't re-raise a
  custom `400` for the same error.
- **Repository + Unit of Work**: the repository interface lives in Domain and speaks
  domain types; the implementation lives in Infrastructure. Wrap a multi-repository
  write in a unit-of-work / transaction so it commits or rolls back atomically.
- **N+1**: a query inside a per-row loop is the defect. Eager-load relations up
  front. With async ORMs a lazy relation access *raises* rather than silently
  issuing the extra query — eager-loading is mandatory, not an optimization.
- **Caching**: cache-aside populates on read but you must evict on every write;
  write-through updates DB+cache together but still leaves a stale window. A cache
  with no invalidation plan is a bug.
- **Domain events**: record events on the aggregate, then have the unit-of-work /
  use case drain and publish them *after commit*. An `_events` list nobody reads is
  the classic "event fired, nothing happened" bug.
- **Layered errors**: define a domain error hierarchy (`DomainError` →
  `ValidationError` / `NotFoundError` / `ConflictError`). Domain raises them;
  the *interface* layer is the only one that maps them to a transport (HTTP status,
  gRPC code, CLI exit code). Domain code never imports the transport.

---

## Immutable state as a default

Model state with immutable objects (Python `@dataclass(frozen=True)`, records,
readonly structs). Mutate by producing a *new* object (`replace()`, `with_status()`),
never by editing in place.

- Predictable: state only changes at explicit, greppable call sites.
- Concurrency-safe: a frozen object is safe to share across tasks without locks.
- Debuggable: prior snapshots survive, so a transition history can be reconstructed.

Cost: more object allocations — negligible for low-frequency transitions (CLI/session
state), reconsider only on hot paths churning millions of updates/sec.

→ State object + transition code: [reference/patterns.md](reference/patterns.md) §State Management Examples

---

## Recording decisions — ADRs

When you make a non-obvious structural choice, capture it as an Architecture
Decision Record so the *why* survives. Minimum fields: Decision, Context,
Rationale, Alternatives Considered, Consequences (✅ gains / ⚠️ trade-offs),
Status, Date.

→ Worked example ADRs + a blank copy-paste template:
[reference/adr-templates.md](reference/adr-templates.md)

---

## Gotchas

Real, non-obvious failure modes when applying these patterns:

1. **Dependency-rule inversion (the #1 violation)**: importing infrastructure from
   the domain — e.g. a "pure" entity that imports `sqlalchemy`, `requests`, or
   `pathlib` to load itself. This silently re-couples everything and kills the
   testability payoff. Detect it: `grep -rE "import (sqlalchemy|requests|boto3|open\()" domain/` should return nothing.

2. **Anemic domain model**: entities become bags of getters/setters with all logic
   living in "services" or use cases. That is not Clean Architecture — it's a
   procedural script with extra folders. Business rules belong *on* the domain
   objects; the application layer only *orchestrates* them.

3. **Over-engineering small projects**: full four-layer separation + DI container +
   Repository abstraction on a 200-line script is negative value — more indirection
   than logic. Layer only when the codebase is large enough that the boundaries pay
   for themselves. "Correct for 3+, overkill for 1" applies to every pattern here.

4. **Leaky abstractions in Repository interfaces**: a domain interface that returns
   an ORM row, a raw SQL cursor, or a framework `Response` object has leaked
   infrastructure back into the domain through its *return type*. The interface must
   speak in domain types (`Template`), not storage types (`TemplateRow`).

5. **Immutable ≠ deep-immutable**: a `frozen=True` dataclass with a `list` or `dict`
   field is still mutable through that field (`state.errors.append(...)` succeeds).
   Freeze the contents too (use tuples / `frozenset` / `MappingProxyType`) or the
   thread-safety and audit-trail guarantees are false.

6. **Circular use-case dependencies**: two use cases that call each other are a sign
   a domain service is missing — extract the shared logic down into the domain layer
   rather than letting the application layer form a cycle.

7. **Async lazy-loading raises — it does not silently N+1**: with async ORMs (async
   SQLAlchemy, Prisma in some modes, etc.) touching an unloaded relation outside its
   session/context *throws* (`MissingGreenlet`/`DetachedInstanceError`), not a
   convenient extra query. Eager-load up front. The classic N+1 (a query per row in a
   loop) is the *sync* trap; async turns the same mistake into a runtime crash.

8. **Domain events collected but never dispatched**: the `_events`-on-the-aggregate
   pattern only works if something drains and publishes the list after commit. A
   frequent bug: events appended, aggregate saved, `_events` never read — so the
   handler never fires. Fix the dispatch point (unit-of-work / use case after
   `commit`) and clear the list once published.

9. **Cache-aside with no invalidation path**: populating the cache on read but never
   evicting on write means reads serve stale data until the TTL expires. Every
   mutation path must delete or overwrite the key. Write-through narrows but doesn't
   close the window between DB commit and cache write.

10. **Fighting the framework's validation default**: many web frameworks already
    return `422` for body/schema validation failures. Raising a custom `400` for the
    *same* class of error makes the API inconsistent. Reserve `400` for malformed
    requests and `422` for semantically invalid ones, and let the framework default
    stand.

11. **Aggregates referencing each other by object, not id**: holding a direct
    `Order.customer: Customer` reference across an aggregate boundary creates load
    fan-out, transactional coupling, and circular imports. Reference other aggregate
    roots by identity (`customer_id`) and load them separately.

---

## Additional resources

- [reference/patterns.md](reference/patterns.md) — full illustrative code for every
  layer, each design pattern, DI container, and state management.
- [reference/backend-patterns.md](reference/backend-patterns.md) — DDD (entities /
  value objects / aggregates), REST resources + status codes + pagination,
  repository / unit-of-work, N+1, caching, domain events, and layered error handling,
  with language-agnostic notes (TS/JS, Rust, Go).
- [reference/adr-templates.md](reference/adr-templates.md) — example ADRs showing the
  format + a blank template for new decisions.

## Related skills

- [Coding Standards](../coding-standards/SKILL.md) — implementation conventions
- [Testing](../testing/SKILL.md) — how to test a layered design
- [Domain Knowledge](../domain-knowledge/SKILL.md) — forge business concepts
