# Lead Architect Agent

> Encodes senior architectural decision-making expertise -- Clean Architecture, system design, technology selection, and cross-agent handoff protocols.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Agent Roles |

---

## What It Provides

The Lead Architect skill equips agents with the knowledge of a senior software architect. It teaches Clean Architecture principles (domain, application, infrastructure, interface layers with inward-pointing dependencies), system design patterns (hexagonal, event-driven, microservices, DDD), technology selection frameworks, and structured handoff protocols for delegating implementation to specialized agents.

Without this skill, agents make ad-hoc architectural decisions, mix infrastructure concerns into domain logic, or choose technologies without systematic evaluation. With it, agents follow a ten-step feature architecture review process, produce Architecture Decision Records (ADRs), and hand off implementation work with precise specifications that other agents can execute independently.

The skill covers the full architectural lifecycle: new feature design, refactoring existing systems, integration design with external services, and quality standards for layer separation, code organization, documentation, and performance.

## When It Activates

- When an agent needs to design the architecture for a new feature or system
- When reviewing or refactoring existing architecture for technical debt
- When selecting technology stacks, database engines, or backend frameworks
- When coordinating handoffs between the architect and implementation agents

## The Knowledge Inside

### Clean Architecture Enforcement

The skill codifies four strict layer rules. The domain layer has no infrastructure dependencies -- entities, value objects, and repository interfaces live here. The application layer depends only on domain, containing use cases and DTOs. The infrastructure layer implements domain interfaces with concrete persistence, external services, and configuration. The interface layer handles HTTP/CLI concerns exclusively. Agents learn to verify these boundaries and flag violations.

### Decision Frameworks

Two decision frameworks are provided. Architecture pattern selection: monolithic Clean Architecture for small-medium projects with single teams; microservices for large teams needing independent deployment; event-driven for async workflows with eventual consistency. Technology selection: PostgreSQL for complex queries and ACID; MongoDB for flexible schemas; Redis for caching; FastAPI for modern async Python; Django for batteries-included; Express for JavaScript full-stack; NestJS for enterprise TypeScript.

### Feature Architecture Review Process

The ten-step process ensures nothing is missed: review requirements, identify affected layers, design domain models, define use cases, specify infrastructure requirements, design API interfaces, document dependencies and data flow, update architecture diagrams, create technical specification, and hand off to specialized agents. Each step has concrete deliverables.

### Handoff Protocols

The skill defines precise handoff specifications for each downstream agent. To Backend Master: domain model definitions, use case specs, repository interfaces, API specs, database schema. To Platform Builder: infrastructure requirements, deployment architecture, scaling needs. To Integration Specialist: integration architecture, adapter interfaces, error handling requirements. To QA Sentinel: architecture test requirements, integration scenarios, performance criteria.

## How to Leverage It

Invoke architectural thinking before any feature that spans multiple layers or introduces new patterns. The agent will produce a structured specification before any code is written.

### Example: Payment Feature Design
```
User: "Design the architecture for payment processing"
What happens: The agent produces a four-layer specification: domain entities
(Payment, PaymentStatus), application use cases (ProcessPayment with DTOs),
infrastructure adapters (StripePaymentGateway implementing PaymentGateway
interface), and interface routes (POST /payments with response models).
```

## Power Applications

- Use ADRs to create a living record of architectural decisions with context, alternatives, and consequences
- Apply the handoff protocol to enable parallel agent execution -- architect designs while builder and tester wait
- Enforce the dependency rule in code reviews to prevent architectural erosion over time

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **agent-backend-master** | Receives handoffs from Lead Architect; implements the designed architecture |
| **agent-platform-builder** | Receives infrastructure specifications from Lead Architect |
| **domain-knowledge** | Provides the product context that informs architectural decisions |
| **parallel-execution** | Enables the Plan-Then-Parallel-Build pattern for architect-led workflows |

## Tips

- Always produce an ADR for decisions that affect multiple components or are hard to reverse
- The dependency rule (inner layers never depend on outer layers) is the single most important architectural constraint
- When in doubt between two patterns, choose the simpler one -- you can always evolve later, but premature complexity is expensive to undo

---

*See also: [agent-backend-master](agent-backend-master.md), [agent-platform-builder](agent-platform-builder.md)*
