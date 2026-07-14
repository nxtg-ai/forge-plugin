# OWASP API Security Top 10 — Remediation Reference

## API1: Broken Object Level Authorization (BOLA)

APIs that expose object IDs and fail to verify the requesting user owns the object. The most prevalent API vulnerability.

**Detect:** any `/api/resource/:id` handler that fetches by ID without filtering by the authenticated user's ownership.

```typescript
// Always filter by authenticated user
const order = await db.orders.findOne({ where: { id: orderId, userId: req.user.id } });
```

## API2: Broken Authentication

Weak or missing authentication on API endpoints — missing auth on sensitive endpoints, weak token validation, credential stuffing exposure.

**Fix:** use proven auth libraries (Passport.js, FastAPI Security). Validate JWTs with algorithm pinning (`algorithms: ["RS256"]`). Never accept `alg: none`.

## API3: Broken Object Property Level Authorization

APIs that expose more object properties than the user should see, or allow mass assignment of protected fields.

**Detect:** responses returning full DB records; handlers spreading user input directly into DB updates.

```typescript
// Explicit response shaping — never res.json(user)
const publicFields = { id: user.id, name: user.name, email: user.email };
res.json(publicFields);

// Explicit field allowlist on updates — never spread req.body
const allowed = pick(req.body, ["name", "email", "avatar"]);
await db.users.update(req.user.id, allowed);
```

## API4: Unrestricted Resource Consumption

No rate limiting, pagination limits, or resource caps — DoS through legitimate API calls.

**Fix:** rate limit all endpoints; cap pagination (`limit` max 100); set request body size limits; timeout long-running queries; charge or throttle expensive operations.

## API5: Broken Function Level Authorization

Regular users access admin endpoints by guessing the URL pattern.

**Detect:** admin routes (`/api/admin/*`) without middleware enforcing admin role; endpoints checking role in the handler body instead of middleware.

**Fix:** enforce authorization in middleware, not handler logic. Deny by default — explicitly grant per role.

## API6: Unrestricted Access to Sensitive Business Flows

Automated abuse of business features: bulk account creation, ticket scalping, coupon abuse.

**Fix:** CAPTCHA on public-facing flows; device fingerprinting; velocity checks (≤ N actions per time window per user/IP).

## API7: Server Side Request Forgery

Same as A10:2025 but through API parameters. Particularly dangerous in microservices where internal services trust each other.

**Fix:** allowlist external hosts; block RFC 1918 addresses; use a dedicated egress proxy for outbound requests.

## API8: Security Misconfiguration

API-specific: verbose errors exposing stack traces, missing CORS restrictions, unnecessary HTTP methods enabled, default credentials on API gateways.

**Fix:** strip stack traces in production; disable `OPTIONS`/`TRACE` where not needed; audit API gateway configs.

## API9: Improper Inventory Management

Undocumented or forgotten API endpoints; old API versions still running; debug endpoints exposed in production.

**Fix:** maintain an API inventory; deprecate old versions with sunset headers; scan for exposed endpoints (`/debug`, `/test`, `/internal`).

## API10: Unsafe Consumption of APIs

Trusting data from third-party APIs without validation; failing to validate webhooks; no timeout on external calls.

```typescript
// Validate webhook signatures
function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Timeout and validate external API responses
const response = await fetch(externalUrl, { signal: AbortSignal.timeout(5000) });
const data = ExternalSchema.parse(await response.json());
```
