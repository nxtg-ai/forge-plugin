# Backend Master Agent

> Encodes expert backend development knowledge -- API design, database patterns, authentication, error handling, and the discipline of type-safe, tested, documented server code.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Agent Roles |

---

## What It Provides

The Backend Master skill equips agents with comprehensive server-side development expertise spanning multiple languages (Python, Node.js, Go, Rust), frameworks (FastAPI, Django, Express, NestJS, Gin, Axum), databases (PostgreSQL, MongoDB, Redis), and API paradigms (REST, GraphQL, WebSockets, gRPC). It teaches agents to implement robust backend code that follows the architecture designed by the Lead Architect.

Without this skill, agents write backend code with incomplete error handling, missing type hints, bare exception clauses, and insufficient test coverage. With it, agents follow a nine-step implementation workflow (review spec, implement domain, create repository, implement use case, write unit tests, create API endpoint, write integration tests, add documentation, update state) and adhere to strict quality standards.

The skill emphasizes the handoff protocol: Backend Master receives architecture specifications from Lead Architect and produces tested, documented implementations that QA Sentinel can verify independently.

## When It Activates

- When implementing API endpoints, database models, or business logic
- When writing backend tests (unit, integration, API endpoint tests)
- When selecting database strategies, ORM configurations, or authentication approaches
- When an agent needs to implement a use case from an architectural specification

## The Knowledge Inside

### Implementation Workflow

The nine-step workflow ensures nothing is skipped. Review the architecture specification first. Implement domain entities and value objects. Create the repository implementation. Implement the use case logic with proper error handling. Write unit tests for the use case (minimum 85% coverage). Create the API endpoint with validation. Write integration tests. Add OpenAPI/Swagger documentation. Update project state with progress.

### Quality Standards

Six non-negotiable quality requirements: type hints on all function signatures, error handling with specific exceptions (never bare `except`), async/await for all I/O operations, test coverage at or above 85%, API documentation via OpenAPI/Swagger, and p95 response time under 200ms. The skill provides concrete code examples showing the contrast between good patterns (full type hints, specific error types) and bad patterns (no types, bare except, returning None on error).

### Database Selection Framework

A decision framework for choosing the right database: PostgreSQL when complex queries and ACID transactions are needed, MongoDB when flexible schemas and document-oriented data fit the model, Redis when caching, session storage, or real-time features are the priority. Agents learn to match database choice to the actual data access patterns rather than defaulting to a familiar option.

### Authentication and Security

The skill covers JWT tokens, OAuth 2.0/OpenID Connect, session-based authentication, password hashing (bcrypt, argon2), API key management, and rate limiting. Agents learn which authentication approach fits which scenario and how to implement it securely.

## How to Leverage It

Provide the agent with an architectural specification or describe the API endpoint you need. The agent will follow the nine-step workflow and produce implementation with tests and documentation.

### Example: User Registration Endpoint
```
User: "Implement user registration with email verification"
What happens: The agent creates the User entity with Email value object,
implements RegisterUserUseCase with proper validation, creates the
repository implementation, writes the POST /users/register endpoint with
request validation, generates unit and integration tests, and adds
OpenAPI documentation.
```

## Power Applications

- Use the handoff protocol to pipeline work: architect designs, backend implements, QA verifies -- all with clear contracts
- Apply the database selection framework before every new data model to avoid costly migration later
- Enforce the quality standards as CI gate criteria to prevent quality regression

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **agent-lead-architect** | Provides the architectural specifications that Backend Master implements |
| **agent-qa-sentinel** | Receives implementations from Backend Master for quality verification |
| **agent-integration-specialist** | Collaborates on external API adapter implementations |
| **optimization** | Backend Master applies optimization patterns for database and API performance |

## Tips

- Never use bare `except` clauses -- always catch specific exception types and handle them appropriately
- Write tests alongside implementation, not as an afterthought; the nine-step workflow interleaves them deliberately
- Type hints are not optional; they serve as both documentation and static analysis input

---

*See also: [agent-lead-architect](agent-lead-architect.md), [agent-qa-sentinel](agent-qa-sentinel.md)*
