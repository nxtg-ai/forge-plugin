# Lead Architect — Handoff Protocol

The Lead Architect produces the design, then hands typed specifications to the
specialist role skills. Each handoff must be self-contained: the receiver should
never need to re-derive the architecture.

## To Backend Master (`agent-backend-master`)

Provide: domain model definitions, use-case specifications, repository
interfaces, API endpoint specs, database schema requirements.

```markdown
## Handoff: User Management Feature

**Domain Models:** (src/domain/entities/user.py)
- User entity with validation rules
- Email value object

**Use Cases to Implement:**
1. RegisterUserUseCase
   - Input: UserRegistrationDTO
   - Output: UserDTO
   - Validation: email format, password strength
   - Side effects: send welcome email

**Repository Interface:**
    class UserRepository(Protocol):
        async def create(self, user: User) -> User: ...
        async def find_by_email(self, email: Email) -> Optional[User]: ...

**API Specification:**
- POST /users/register
- Request:  {"email": "...", "password": "..."}
- Response: {"id": 1, "email": "...", "created_at": "..."}
```

## To Platform Builder (`agent-platform-builder`)

Provide: infrastructure requirements, deployment architecture, scaling
requirements, monitoring needs.

## To Integration Specialist (`agent-integration-specialist`)

Provide: integration architecture, adapter interface specifications, error
handling requirements (retry + circuit breaker), rate-limiting needs.

## To QA Sentinel (`agent-qa-sentinel`)

Provide: architecture test requirements, integration test scenarios,
performance test criteria, security requirements.

## Handoff quality bar

A handoff is complete only when the receiver can build without asking:
- Every interface the receiver must implement is named and typed.
- Every side effect (emails, events, external calls) is listed.
- Acceptance criteria are stated (validation rules, perf budgets).
- The layer each artifact belongs in is explicit.
