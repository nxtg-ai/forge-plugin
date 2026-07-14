# Lead Architect — Decision Framework

## Architecture pattern selection

| Pattern | Use when | Avoid when |
|---------|----------|------------|
| **Monolithic Clean Architecture** | Small/medium project, single team, rapid development | Multiple teams, independent scaling needs |
| **Microservices** | Large teams, independent deploy, divergent scaling | Small team, simple domain, tight coupling required |
| **Event-Driven** | Async workflows, eventual consistency OK, complex business events | Strong consistency required, simple CRUD |
| **Hexagonal (Ports & Adapters)** | Many external integrations, want the core swappable | Thin CRUD wrapper with one datastore |

Default: start monolithic clean architecture. Split to services only when a
*measured* scaling or team-boundary pressure appears — premature decomposition
buys distributed-systems cost with no benefit.

## Technology selection

### Database

| Choice | Fits |
|--------|------|
| PostgreSQL | Complex queries, ACID transactions, relational data (default) |
| MongoDB | Flexible/evolving schema, document-oriented, rapid iteration |
| Redis | Caching, session storage, real-time features (usually *alongside* a primary store, not instead of one) |

### Backend framework

| Choice | Fits |
|--------|------|
| FastAPI | Modern Python, async, auto OpenAPI docs, high performance |
| Django | Batteries-included, admin panel, mature ecosystem |
| Express | Flexibility, large ecosystem, JS full-stack |
| NestJS | TypeScript, enterprise patterns, built-in DI |

## Architecture acceptance criteria

**Layer separation (the invariant that makes the rest work):**
- Domain layer has NO infrastructure dependencies.
- Application layer depends only on domain.
- Infrastructure implements domain-defined interfaces.
- Interface layer only handles HTTP/CLI concerns — no business logic.

**Reference directory layout:**

```
src/
  domain/           # core business logic — NO external deps
    entities/
    value_objects/
    repositories/   # interfaces ONLY
    services/
  application/      # use cases — depend on domain only
    use_cases/
    dtos/
  infrastructure/   # implements domain interfaces
    persistence/
    external_services/
    config/
  interface/        # HTTP/CLI entry points
    api/
    cli/
    schemas/
```

**Documentation:** ADRs for major decisions, component diagrams for complex
interactions, sequence diagrams for critical flows, data-flow diagrams for
integrations.

**Performance targets:** API p95 < 200 ms, no N+1 queries, defined caching
strategy, connection pooling configured.
