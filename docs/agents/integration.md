# Integration

> Connects your application to external services -- GitHub, Sentry, webhooks, OAuth providers -- with retry logic, signature verification, and rate limit awareness built in.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Specialist |
| **Model** | Sonnet |

---

## What It Does

The Integration agent specializes in the fragile boundary between your application and the outside world. External APIs fail, webhooks arrive with forged signatures, OAuth tokens expire mid-session, and rate limits get hit at the worst possible time. The Integration agent writes the code that handles all of this gracefully -- HTTP clients with retry and exponential backoff, webhook handlers with cryptographic signature verification, OAuth flows with proper token storage, and rate limit tracking that slows requests before hitting 429 errors.

What separates this agent from "just use fetch" is its understanding of failure modes. Every external call it writes includes error handling for the specific ways that service can fail. GitHub returns 403 when rate-limited (track `X-RateLimit-Remaining`). Sentry webhooks include HMAC signatures that must be verified before processing. OAuth refresh tokens expire and need re-authentication flows. The Integration agent knows these patterns because they are encoded in its service-specific knowledge, not discovered at 3 AM when production breaks.

The agent also understands the architectural principle of decoupling. An integration failure should degrade the feature that depends on it, not crash the application. If the GitHub API is down, the PR status widget shows "unavailable" instead of throwing an unhandled error. The Integration agent builds this resilience into every service connection.

## When to Use It

- **Adding a GitHub integration**: When you need to fetch repos, PRs, issues, or Actions status from the GitHub API with proper authentication, pagination, and rate limit handling.
- **Implementing webhook handlers**: When you need to receive and process events from external services with signature verification, event routing, and idempotent processing.
- **Setting up OAuth flows**: When you need third-party authentication with token exchange, refresh handling, and secure storage.
- **Connecting to monitoring services**: When you need to send errors to Sentry, metrics to Datadog, or alerts to PagerDuty with proper formatting and retry logic.

Do not use the Integration agent for internal API endpoints (use API), database connections (use Database), or security auditing of integrations (use Security). The Integration agent builds the connection; Security audits it.

## How It Works

The Integration agent follows a defense-in-depth approach for every external connection:

1. **Client Design** -- Creates a typed HTTP client class for each external service. The client encapsulates the base URL, authentication headers, request formatting, and response parsing. All service-specific knowledge lives in one place.

2. **Authentication** -- Implements the service's auth mechanism: Bearer tokens from environment variables, API keys in headers, OAuth2 token exchange, or HMAC-signed requests. Tokens are never stored in localStorage or source code.

3. **Error Handling** -- Maps service-specific errors to application errors. A GitHub 404 becomes a typed `NotFoundError`, not a generic `Error`. A 429 becomes a `RateLimitError` with retry-after information.

4. **Retry Logic** -- Wraps every external call in retry logic with exponential backoff. Transient failures (408, 429, 500, 502, 503) are retried. Permanent failures (400, 401, 404) are not. Maximum 3 attempts with increasing delay.

5. **Webhook Security** -- Every incoming webhook is verified before processing. HMAC signatures are checked against a shared secret. Replay attacks are prevented with timestamp validation. Invalid webhooks return 401 immediately.

6. **Rate Limit Management** -- Tracks rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`) and proactively slows requests before hitting the limit. This prevents burst-then-block patterns.

## Examples

### Example 1: GitHub API Integration

```
User: "Connect to GitHub to show PR status in the dashboard"

Integration:
  - Creates: GitHubClient class with Bearer token auth
  - Implements:
    - getRepo(owner, repo) -- repository metadata
    - getPullRequests(owner, repo, state) -- with pagination
    - getPRChecks(owner, repo, pr) -- CI check status
  - Adds: Rate limit tracking (reads X-RateLimit-Remaining, backs off at 10%)
  - Adds: Retry with exponential backoff (3 attempts, 1s/2s/4s)
  - Adds: Error mapping (403 -> RateLimitError, 404 -> NotFoundError)
  - Result: Type-safe GitHub client that gracefully handles API limits and failures
```

### Example 2: Webhook Handler with Verification

```
User: "Set up a webhook endpoint for GitHub push events"

Integration:
  - Creates: POST /webhooks/github endpoint
  - Implements:
    1. Verify X-Hub-Signature-256 against GITHUB_WEBHOOK_SECRET
    2. Parse X-GitHub-Event header to route events
    3. Handle 'push' events: extract commits, update dashboard state
    4. Handle 'pull_request' events: update PR status widget
    5. Return 200 immediately (process asynchronously to avoid timeout)
  - Security: Rejects requests with invalid or missing signatures
  - Idempotency: Deduplicates by X-GitHub-Delivery header
  - Result: Secure webhook handler that processes events reliably
```

### Example 3: OAuth Flow Implementation

```
User: "Add GitHub OAuth login to the dashboard"

Integration:
  - Implements OAuth2 authorization code flow:
    1. GET /auth/github -- redirects to GitHub authorization URL
    2. GET /auth/github/callback -- exchanges code for access token
    3. Stores token in httpOnly cookie (not localStorage)
    4. POST /auth/refresh -- refreshes expired tokens
  - Adds: CSRF protection with state parameter
  - Adds: Token expiration handling (auto-refresh before expiry)
  - Security: Tokens never exposed to client-side JavaScript
  - Result: Complete OAuth flow with secure token management
```

## Power Use Cases

**Multi-Service Orchestration**: For features that span multiple external services (e.g., "when a GitHub PR is merged, create a Sentry release and notify Slack"), the Integration agent creates the service clients and orchestrates the multi-step workflow with proper error handling at each step.

**API + Integration Pairing**: The API agent designs internal endpoints; the Integration agent connects those endpoints to external services. For example, API creates `GET /api/github/repos`, and Integration builds the GitHubClient that powers it. The separation keeps external service concerns out of internal API design.

**Graceful Degradation Design**: The Integration agent builds every connection with a fallback path. If GitHub is unreachable, the dashboard shows cached data. If Sentry is down, errors are logged locally. This resilience pattern prevents external failures from cascading into application failures.

## Combines With

| Feature | Synergy |
|---------|---------|
| **API** | API designs internal endpoints; Integration builds the external service clients behind them. |
| **Security** | Integration builds connections with auth and signatures; Security audits them for vulnerabilities. |
| **DevOps** | Integration needs environment variables for API keys and secrets; DevOps manages the environment configuration. |
| **Planner** | Planner routes third-party integration features to the Integration agent after core implementation. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Typed HTTP clients for external services. Retry with exponential backoff. Webhook signature verification. Rate limit tracking. OAuth flow implementation. Error mapping. |
| **L2 Pro Builder** | Integration patterns recorded via `forge_capture_knowledge`. Service configuration and connection details tracked in orchestrator state. |
| **L3 Ship Lord** | External service health status visible in the forge-ui dashboard. WebSocket connection indicators show real-time connectivity. |

## Tips & Gotchas

- **Do**: Store all API keys and tokens in environment variables. Never in source code, never in localStorage, never in committed config files.
- **Don't**: Process webhooks synchronously. Acknowledge receipt (200) immediately and process the payload asynchronously. External services have timeout limits.
- **Do**: Implement retry with exponential backoff for all external calls. Transient failures are the norm, not the exception, for external services.
- **Don't**: Ignore rate limit headers. Hitting a rate limit produces 429 errors that are often cached for longer than the limit window. Track remaining quota and slow down proactively.
- **Do**: Verify webhook signatures before processing any payload. Unverified webhooks are a command injection vector.

---

*See also: [API](api.md) | [Security](security.md) | [DevOps](devops.md)*
