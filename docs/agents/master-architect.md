# Master Architect

> The senior technical authority who says "no, don't build it that way" -- and then explains exactly why and what to do instead, backed by decades of patterns for systems that survive production.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Engineering Leadership |
| **Model** | Opus |

---

## What It Does

The Master Architect is the senior engineer who has seen systems fail and succeed at scale. It reviews, challenges, and shapes every system design decision through a lens of radical simplicity: if a junior developer cannot understand it in 10 minutes, it is too complex. Complexity is not sophistication -- it is insufficient thought.

It operates on eight core principles, in priority order: simple beats clever, boring technology wins, one-way door decisions deserve deliberation, optimize for deletion not extension, YAGNI, Conway's Law is real, every dependency is a liability, and failure is a feature. These are not theoretical -- they are the principles that keep systems maintainable at 2 AM when something breaks.

The agent covers the full architecture surface: system design pattern selection (monolith vs. microservices vs. event-driven, with honest guidance on when each applies), Architecture Decision Records, database selection and query optimization, REST/GraphQL/gRPC/WebSocket API design, security architecture (zero-trust checklist, OAuth 2.0, RBAC), performance architecture (4-layer caching, connection pooling, load patterns), infrastructure decisions, monorepo vs. polyrepo trade-offs, technical debt assessment with prioritization scoring, and migration planning using the strangler fig pattern. Every recommendation includes the trade-off -- the cost of the recommendation, not just its benefit.

## When to Use It

- **System design decisions**: When choosing between architectures (monolith vs. microservices), databases (PostgreSQL vs. SQLite vs. MongoDB), or deployment strategies (serverless vs. containers).
- **Architecture review**: When a design needs senior-level critique before implementation begins, with specific findings rated by severity.
- **API design**: When designing REST, GraphQL, or gRPC interfaces that need to be correct, versioned, and maintainable long-term.
- **Technical debt assessment**: When accumulated debt needs to be scored, prioritized, and scheduled for paydown based on impact and compounding rate.
- **Migration planning**: When migrating between frameworks, databases, or architectures and you need a phased plan with rollback checkpoints.

Do not use this agent for implementation -- the Builder handles that. Do not use it for visual design or DX -- those are the Design Vanguard and DX Engineer respectively.

## How It Works

1. **Requirements Gathering**: Before recommending any architecture, the agent asks eight questions: consistency requirements, team size, traffic pattern, latency requirements, data lifecycle, deployment environment, regulatory environment, and operational maturity. If these cannot be answered, the recommendation is "go gather requirements."
2. **Pattern Matching**: Matches the requirements against a decision matrix of system design patterns, each with clear "Use When" and "Do NOT Use When" criteria.
3. **ADR Generation**: Documents every significant decision as an Architecture Decision Record with status, context, options considered (minimum two), decision rationale, consequences (positive and negative), and a review date.
4. **Review Delivery**: Produces structured architecture reviews with overall rating (SOUND / NEEDS WORK / RETHINK), findings by severity and category, and prioritized recommendations.

## Examples

### Example 1: Architecture Topology Decision

```
User: "Should we split this into microservices?"

Master Architect:
  - Gathers context: 3-person team, shared database, single
    deploy target, early product seeking PMF
  - Assessment: Your team is too small for microservices
    operational overhead. Conway's Law says a 3-person team
    produces a 3-service architecture -- that's a distributed
    monolith, not microservices.
  - Recommendation: Modular monolith. Define module boundaries
    in code (separate packages/directories), enforce import
    rules, deploy as one unit. Extract services when a team
    genuinely needs an independent deploy cadence.
  - Trade-off: Less independent scaling per module, but
    dramatically lower operational complexity.
  - ADR generated: ADR-001: Monolith over Microservices
```

### Example 2: Database Selection

```
User: "PostgreSQL or MongoDB for the event store?"

Master Architect:
  - Analyzes: Event data has a known schema (event type, timestamp,
    payload). Queries need time-range filtering and aggregation.
    Consistency matters for audit trail. Team has PostgreSQL
    experience.
  - Decision: PostgreSQL with JSONB payload column
  - Reasoning: You have a schema (event type + metadata are
    structured). JSONB handles the variable payload. Time-range
    queries with B-tree indexes are PostgreSQL's strength.
    MongoDB's document model adds operational cost (replica sets,
    sharding) for a problem PostgreSQL solves natively.
  - Trade-off: Slightly more upfront schema design, but
    significantly lower operational cost and better query
    performance for your access patterns.
```

### Example 3: Migration Planning

```
User: "Migrate from Express to Fastify without downtime"

Master Architect:
  - Pattern: Strangler Fig (never big-bang migrate)
  - Phase 1: Add reverse proxy in front of Express
  - Phase 2: Route /api/health to Fastify (canary)
  - Phase 3: Migrate one non-critical endpoint per sprint
  - Phase 4: Run shadow traffic comparison on migrated endpoints
  - Phase 5: Migrate critical endpoints after shadow validation
  - Phase 6: Decommission Express when all routes migrated
  - Each phase has: rollback plan, monitoring, kill switch
  - Migration checklist: current state documented, target state
    documented, feature parity matrix, production-sized data
    testing, communication plan
  - Result: 6-phase migration plan with zero-downtime guarantee.
```

## Power Use Cases

**Technical Debt Scoring and Prioritization**: The Master Architect scores each debt item across four dimensions: Impact (how much it slows the team), Blast radius (how many features it affects), Paydown cost (effort to fix), and Compounding rate (how fast it is getting worse). Priority score = (Impact x Blast radius x Compounding rate) / Paydown cost. High scores are fixed first -- the best ROI.

**Security Architecture Review**: Runs a zero-trust checklist against any system: every request authenticated, every request authorized at the data layer (not just API), TLS everywhere (even internally), secrets in a proper KMS, input validated at every boundary, output encoded for context, audit logging for all mutations, dependency scanning in CI, least privilege for all accounts. This is not a theoretical exercise -- it is the checklist that prevents the breach.

**Anti-Pattern Detection**: The agent maintains a library of architecture anti-patterns it recognizes and rejects: Resume-Driven Development (choosing tech for the resume), Premature Microservices (splitting before understanding boundaries), Distributed Monolith (microservices that must deploy together), Golden Hammer ("we use Kafka for everything"), and Cargo Culting ("Google does it this way" -- Google has 10,000 engineers, you have 5).

## Combines With

| Feature | Synergy |
|---------|---------|
| **Builder agent** | Architect designs; Builder implements. ADRs become implementation specs. |
| **Incident Commander** | Architect designs for resilience; Commander handles when resilience fails |
| **CEO Loop** | Architect advises on one-way door decisions; CEO Loop makes the final call |
| **DX Engineer** | Architect designs the system internals; DX Engineer ensures the external surface is pleasant |
| **/forge:spec** | Architecture decisions feed directly into feature specifications |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | System design patterns, ADR generation, database selection, API design, security review, tech debt scoring, migration planning |
| **L2 Pro Builder** | + `forge_capture_knowledge` records architecture decisions; `forge_get_knowledge` recalls past decisions as precedent; `forge_check_drift` verifies implementation matches architecture |
| **L3 Ship Lord** | + Dashboard panel showing ADR history, tech debt scores, architecture review results, and drift metrics |

## Tips & Gotchas

- **Do**: Write ADRs for every significant architecture decision. Future-you will thank past-you.
- **Do**: Evaluate one-way doors (database engine, wire protocol, primary language) with 10x the deliberation of two-way doors (framework, CI provider).
- **Don't**: Start with Kubernetes. If you need to ask whether you need Kubernetes, you do not need Kubernetes.
- **Don't**: Choose a database because it is trendy. Choose it because your query patterns, consistency requirements, and operational maturity match its strengths.

---

*See also: [incident-commander](incident-commander.md), [dx-engineer](dx-engineer.md)*
