# Core Architecture

> Teaches agents Clean Architecture principles, layer separation, and the dependency rule so every generated codebase has a maintainable, testable foundation from day one.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Core |

---

## What It Provides

This skill encodes the fundamental architectural patterns that NXTG-Forge considers non-negotiable: Clean Architecture layer separation, Domain-Driven Design building blocks, and the dependency rule. When an agent generates a new service, feature, or module, this skill ensures the output follows a strict four-layer structure -- domain, application, infrastructure, and interface -- with dependencies always pointing inward.

Without this skill, agents would produce monolithic code where database queries live next to business rules, HTTP handlers contain validation logic, and domain objects import framework-specific libraries. The result is code that is hard to test, hard to change, and hard to reason about. This skill prevents that by teaching agents the structural grammar of professional-grade applications.

The knowledge spans concrete patterns: Repository interfaces defined in the domain layer, use cases that orchestrate domain objects without knowing about databases, infrastructure implementations that satisfy domain contracts, and thin interface layers that translate between external formats and application DTOs. It also covers event-driven architecture, caching strategies, and the Unit of Work pattern for transactional boundaries.

## When It Activates

- When you ask an agent to scaffold a new project or feature module
- When an agent is designing data access patterns or service layers
- When your project involves API design, database schema work, or domain modeling
- When refactoring code to improve separation of concerns

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### The Four-Layer Structure

The skill defines a precise directory layout: `domain/` (entities, value objects, repository interfaces, domain services), `application/` (use cases, DTOs), `infrastructure/` (persistence implementations, external service clients, configuration), and `interface/` (API routes, CLI commands, request/response schemas). Each layer has strict rules about what it may import. The domain layer imports nothing from outer layers. The application layer depends only on domain. Infrastructure implements domain interfaces. Interface delegates to application. This inward dependency flow is the single most important architectural constraint the skill enforces.

### Domain-Driven Design Building Blocks

The skill teaches the distinction between entities (objects with identity that change over time), value objects (immutable objects defined by their attributes), and aggregates (consistency boundaries accessed through a root entity). It shows agents how to enforce business rules through aggregate roots rather than scattering validation across services. An Order aggregate, for example, prevents negative quantities by controlling access to its OrderItems -- callers go through `add_item()`, never through direct list manipulation.

### Data Access and Transactional Patterns

Repository Pattern, Unit of Work, and cache-aside/write-through caching are all encoded here. The Repository Pattern separates the interface (defined in domain) from the implementation (living in infrastructure). The Unit of Work pattern manages transaction boundaries across multiple repositories. Caching patterns show agents when to check cache before database and how to keep both in sync. These patterns prevent the N+1 query problem, inconsistent transaction handling, and cache staleness.

### Event-Driven Architecture

Domain events decouple side effects from core logic. The skill teaches agents to emit events (like `UserRegisteredEvent`) from domain operations and handle them in separate handlers (`SendWelcomeEmailHandler`). This keeps domain logic pure while enabling extensibility -- adding a new side effect means adding a new handler, not modifying existing domain code.

## How to Leverage It

Structure your prompts around features and business requirements rather than technical instructions. When you say "add user registration," the skill activates and guides the agent to create the User entity in domain, the RegisterUserUseCase in application, the SQLAlchemyUserRepository in infrastructure, and the POST /users endpoint in interface -- each in the correct layer with the correct dependencies.

### Example: Feature Implementation

```
User: "Add a payment processing feature with Stripe integration"

What happens: The skill activates and informs the agent to create domain entities
(Payment, PaymentMethod), a use case (ProcessPaymentUseCase) that depends on a
PaymentGateway protocol, a StripePaymentGateway implementation in infrastructure,
and API endpoints in interface. Stripe-specific code never leaks into domain.
```

## Power Applications

The real power emerges during refactoring. When you ask an agent to extract a monolithic service into clean layers, this skill provides the target architecture. The agent knows exactly where each piece of code should land and how to introduce interfaces at layer boundaries without breaking existing functionality.

It also prevents subtle coupling bugs. An agent taught by this skill will never let a domain entity import SQLAlchemy, never let a use case construct HTTP responses, and never let an API handler contain business logic beyond input validation and delegation.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **core-coding-standards** | Provides the code-level conventions that implement these architectural patterns |
| **core-testing** | Defines how to test each layer in isolation using the interfaces this skill establishes |
| **architecture** | Extends these principles with NXTG-Forge-specific architecture (agents, hooks, state) |

## Tips

- This skill teaches structure, not technology choices. It works equally well for FastAPI, Express, or any framework.
- The dependency rule is absolute. If an agent generates code where domain imports from infrastructure, the skill was not loaded or the prompt overrode it.

---

*See also: [architecture](architecture.md) | [coding-standards](coding-standards.md)*
