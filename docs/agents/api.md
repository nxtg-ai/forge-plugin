# API

> Designs and implements clean REST endpoints with Zod validation, consistent error handling, OpenAPI specs, and WebSocket protocols -- so every endpoint follows the same conventions.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Specialist |
| **Model** | Sonnet |

---

## What It Does

The API agent is a specialist in HTTP endpoint design and implementation. It encodes the conventions that make APIs consistent, predictable, and maintainable: RESTful URL structures, Zod schema validation at every boundary, structured error responses (never stack traces), proper status codes, and middleware patterns for cross-cutting concerns like authentication, logging, and rate limiting.

Without this agent, API endpoints accumulate inconsistencies over time. One endpoint returns `{ data: user }`, another returns the user object directly. One validates with Zod, another uses manual if-checks. One returns 400 for validation errors, another returns 422. The API agent eliminates this drift by applying the same conventions to every endpoint: success responses wrapped in `{ data: T, meta?: {...} }`, errors in `{ error: { code, message, details? } }`, input validated with Zod schemas, and proper HTTP status codes (200 for reads, 201 for creates, 204 for deletes, 400 for validation, 404 for not found, 500 for server errors).

The agent also handles WebSocket protocol design for real-time features. It defines message formats with typed payloads (`{ type: string, payload: unknown, timestamp: string }`), connection lifecycle management, and reconnection strategies. For external API integrations (GitHub, Sentry, monitoring services), it implements proper HTTP clients with error handling, retry logic, and rate limit awareness.

## When to Use It

- **Adding a new endpoint**: When you need a new REST endpoint with proper validation, error handling, and response formatting that matches your existing API conventions.
- **Integrating an external API**: When you need to connect to GitHub, Sentry, or any third-party service with proper error handling, retries, and rate limit management.
- **Designing a WebSocket protocol**: When you need real-time communication with typed message formats, connection lifecycle management, and reconnection logic.
- **Standardizing existing endpoints**: When your API has inconsistent response formats, error handling, or validation patterns and needs to be brought into alignment.

Do not use the API agent for database queries (use Database), frontend components (use UI), or security auditing of endpoints (use Security). The API agent designs and builds the HTTP layer.

## How It Works

The API agent follows a structured approach for each endpoint:

1. **URL Design** -- Follows REST conventions: plural nouns for collections (`/api/agents`), singular with ID for resources (`/api/agents/:id`), nested for relationships (`/api/agents/:id/tasks`). HTTP verbs map to operations (GET=read, POST=create, PATCH=update, DELETE=remove).

2. **Input Validation** -- Creates Zod schemas for request bodies, query parameters, and URL parameters. Validation runs at the boundary before any business logic. Failed validation returns 400 with structured error details.

3. **Handler Implementation** -- Writes Express route handlers that follow a consistent pattern: validate input, call service layer, format response, handle errors. Handlers stay thin -- business logic lives in services.

4. **Error Handling** -- Implements centralized error middleware. Application errors carry status codes and structured messages. Unexpected errors return 500 with generic messages (never stack traces in production). Every error is logged with context.

5. **Documentation** -- Generates OpenAPI spec entries for each endpoint: URL, method, request schema, response schema, error codes, and authentication requirements.

For WebSocket endpoints, the agent defines the message type enum, payload schemas, connection lifecycle hooks (open, close, error), and heartbeat/reconnection logic.

## Examples

### Example 1: Creating a CRUD Endpoint

```
User: "Add a PATCH endpoint for updating agent configuration"

API:
  - Designs: PATCH /api/agents/:id with partial update semantics
  - Creates Zod schema:
    UpdateAgentSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      config: z.record(z.unknown()).optional(),
      enabled: z.boolean().optional(),
    })
  - Implements handler: validate -> find agent -> apply update -> return updated agent
  - Error cases: 400 (invalid body), 404 (agent not found), 500 (server error)
  - Response: { data: Agent } with 200 status
  - Result: Production-ready endpoint matching existing API conventions
```

### Example 2: External API Integration

```
User: "Connect to the GitHub API to fetch repo stats"

API:
  - Creates: GitHubClient class with Bearer token auth
  - Implements: getRepo(owner, repo), getIssues(owner, repo, options), getPullRequests(...)
  - Adds: Rate limit tracking via X-RateLimit-Remaining header
  - Adds: Retry with exponential backoff for 429/503 responses
  - Adds: Error mapping: GitHub 404 -> IntegrationError, GitHub 403 -> RateLimitError
  - Creates: /api/github/repos/:owner/:repo proxy endpoint with caching
  - Result: Type-safe GitHub client with retry, rate limiting, and caching
```

### Example 3: WebSocket Protocol Design

```
User: "Design the WebSocket protocol for real-time agent activity"

API:
  - Defines message types: 'agent.started', 'agent.progress', 'agent.completed', 'agent.error'
  - Creates payload schemas with Zod for each message type
  - Implements: Connection lifecycle (auth on connect, heartbeat every 30s, reconnect with backoff)
  - Adds: Client-side message queue for offline resilience
  - Documents: Full protocol spec with example messages
  - Result: Typed WebSocket protocol with lifecycle management and offline support
```

## Power Use Cases

**API Consistency Audit**: Run the API agent on an existing codebase to identify endpoints that deviate from conventions. It finds endpoints with inconsistent response formats, missing validation, raw error messages, or wrong status codes, and brings them into alignment.

**Planner Domain Routing**: When the Planner detects a feature involves API endpoints, it routes to the API agent after Builder completes the core implementation. The API agent adds validation schemas, error handling middleware, and OpenAPI documentation that Builder might skip.

**Contract-First Design**: For features where the API is the product (public APIs, partner integrations), invoke the API agent first to design the contract (URL structure, request/response schemas, error codes). Then hand the contract to Builder for implementation. This prevents the common problem of APIs shaped by implementation convenience rather than consumer needs.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Planner** | Planner routes API-domain features to the API agent. API designs the contract; Builder implements against it. |
| **Database** | API agent designs the endpoint; Database agent designs the query and schema behind it. They share the data model. |
| **Security** | Security audits the endpoints API creates: checks for missing auth, rate limiting, input validation, and CORS. |
| **Integration** | For external service connections, API handles the HTTP client; Integration handles the service-level orchestration and retry logic. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | REST endpoint design and implementation. Zod validation schemas. Structured error handling. WebSocket protocol design. OpenAPI spec generation. Express middleware patterns. |
| **L2 Pro Builder** | API endpoints integrate with orchestrator task tracking. Endpoint metrics captured via `forge_capture_knowledge`. |
| **L3 Ship Lord** | API health metrics (response times, error rates) visible in the forge-ui dashboard. WebSocket connection status displayed in real-time. |

## Tips & Gotchas

- **Do**: Use Zod for all input validation, even for simple endpoints. Schema validation catches malformed requests before they reach business logic.
- **Don't**: Return raw error objects or stack traces from endpoints. Every error response should be `{ error: { code, message } }` with appropriate status codes.
- **Do**: Design the API contract before implementing the handler. URL structure, request/response schemas, and error codes should be decided before writing business logic.
- **Don't**: Put business logic in route handlers. Handlers validate, delegate to services, and format responses. Keep them under 15 lines.

---

*See also: [Database](database.md) | [Integration](integration.md) | [Security](security.md)*
