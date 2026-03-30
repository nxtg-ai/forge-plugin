# Integration Specialist Agent

> Encodes expert knowledge for connecting applications with external services -- API clients, webhooks, MCP servers, circuit breakers, and the reliability patterns that keep integrations running.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Agent Roles |

---

## What It Provides

The Integration Specialist skill teaches agents how to connect applications with external services while maintaining reliability, security, and clean architectural boundaries. It covers REST and GraphQL API clients, webhook receivers and senders, message queue integration, MCP server configuration, and the resilience patterns (retry, circuit breaker, rate limiting, idempotency) that prevent external service failures from cascading into application failures.

Without this skill, agents write API integrations with no retry logic, no circuit breakers, no rate limiting, and webhook handlers that process events synchronously without signature verification. With it, agents build integrations following the adapter pattern (clean interface in the domain layer, concrete implementation in the infrastructure layer), with exponential backoff retries, circuit breaker wrappers, and proper error categorization.

The skill covers real-world integration scenarios: payment processing (Stripe), communication services (Slack, Twilio, SendGrid), cloud storage (S3), databases, version control APIs, and monitoring services.

## When It Activates

- When connecting to third-party APIs (payment, communication, storage, monitoring)
- When implementing webhook handlers or event-driven integrations
- When configuring MCP servers for Claude Code integration
- When building resilience patterns (retry, circuit breaker, rate limiting) into external calls

## The Knowledge Inside

### The Adapter Pattern for Integrations

Every external integration follows a two-layer pattern. The domain layer defines an abstract interface (`PaymentGateway` protocol with `create_payment_intent`, `confirm_payment`, `refund_payment`). The infrastructure layer provides the concrete implementation (`StripePaymentGateway` implementing the protocol). This separation means swapping from Stripe to Square requires changing only the infrastructure adapter, not the domain or application logic.

### Resilience Patterns

Three reliability patterns are mandatory for production integrations. **Retry with exponential backoff**: retries transient failures with increasing delays (2s, 4s, 8s) using libraries like tenacity. **Circuit breaker**: after N consecutive failures, the circuit opens and fast-fails subsequent calls for a recovery period, preventing cascade failures. **Rate limiting**: respects external API rate limits proactively using async rate limiters, rather than hitting limits and handling 429 errors.

### Webhook Handler Security

Webhook handlers follow a strict protocol: verify the cryptographic signature first (using HMAC with the shared secret), check idempotency (prevent duplicate event processing by tracking event IDs), return 200 immediately (process the event asynchronously via a queue), and route events to typed handlers based on event type. Agents learn that accepting unverified webhooks is a security vulnerability -- anyone can send fake events.

### MCP Server Configuration

The skill teaches MCP server detection, configuration, and testing. Agents learn to add servers to `.claude/settings.json` with proper command, arguments, and environment variable configuration. Concrete examples for GitHub MCP (with personal access token) and PostgreSQL MCP (with connection string) are provided. The skill covers the auto-detection workflow: identify which MCP servers the project needs, configure them, test the connection, and update project state.

## How to Leverage It

Describe the external service you need to connect to, and the agent will design the full integration -- domain interface, infrastructure adapter, resilience wrappers, and tests.

### Example: Payment Processing Integration
```
User: "Integrate Stripe payment processing"
What happens: The agent creates a PaymentGateway protocol in the domain layer,
a StripePaymentGateway adapter with retry logic and proper error categorization
(card errors, rate limit errors, general API errors), a ResilientPaymentGateway
wrapper with circuit breaker, a webhook handler with signature verification and
idempotent event processing, and integration tests with mocked Stripe responses.
```

## Power Applications

- Wrap every external integration in a circuit breaker to prevent one failing service from taking down the application
- Use the adapter pattern to build integration test harnesses that swap real services for local fakes
- Implement idempotency keys on webhook handlers to safely handle duplicate delivery from external services

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **agent-lead-architect** | Provides integration architecture and adapter interface specifications |
| **agent-backend-master** | Implements the business logic that uses integration adapters |
| **agent-qa-sentinel** | Tests integrations with mock services and webhook event fixtures |
| **optimization** | Applies caching and connection pooling to reduce integration latency |

## Tips

- Never call an external API without retry logic -- transient network failures are not exceptional, they are expected
- Webhook signature verification is a security requirement, not an optional feature
- Rate limiting should be proactive (respect documented limits) not reactive (handle 429s after the fact)

---

*See also: [agent-lead-architect](agent-lead-architect.md), [agent-backend-master](agent-backend-master.md)*
