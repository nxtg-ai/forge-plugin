# OWASP Top 10:2025 — Remediation Reference

Vulnerable→fixed code for each category. The one-line detection signals live in SKILL.md; this file is the lookup material for writing the fix.

## A01:2025 Broken Access Control

Failure to enforce that users only act within their intended permissions. The most common web application vulnerability.

**Vulnerable:**
```typescript
// Direct object reference without ownership check
app.get("/api/orders/:id", async (req, res) => {
  const order = await db.orders.findById(req.params.id);
  res.json(order); // Anyone can view any order
});
```
```python
# Missing function-level access control
@app.route("/admin/users", methods=["DELETE"])
def delete_user():
    user_id = request.json["user_id"]
    db.session.delete(User.query.get(user_id))  # No role check
```

**Fixed:**
```typescript
// Enforce ownership on every data access
app.get("/api/orders/:id", authenticate, async (req, res) => {
  const order = await db.orders.findById(req.params.id);
  if (!order || order.userId !== req.user.id) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(order);
});
```
```python
# Decorator-based role enforcement
@app.route("/admin/users", methods=["DELETE"])
@require_role("admin")
def delete_user():
    user_id = request.json["user_id"]
    db.session.delete(User.query.get(user_id))
```

## A02:2025 Cryptographic Failures

Weak or missing encryption for data in transit or at rest. Includes hardcoded secrets, weak algorithms, and improper key management.

**Vulnerable:**
```typescript
const JWT_SECRET = "mysecretkey123";               // hardcoded
import { createHash } from "crypto";
const hashed = createHash("md5").update(password).digest("hex"); // weak hash
```
```python
import random
token = "".join(random.choice("abcdef0123456789") for _ in range(32)) # insecure RNG
requests.get("https://api.example.com", verify=False)                  # no TLS verify
```

**Fixed:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}
import { scrypt, randomBytes } from "crypto";
const salt = randomBytes(16).toString("hex");
scrypt(password, salt, 64, (err, derivedKey) => {
  const hashed = `${salt}:${derivedKey.toString("hex")}`;
});
```
```python
import secrets
token = secrets.token_hex(32)
requests.get("https://api.example.com", verify=True)
```

## A03:2025 Injection

Untrusted data sent to an interpreter as part of a command or query. Covers SQL, NoSQL, OS command, LDAP, and template injection.

**Vulnerable:**
```typescript
const query = `SELECT * FROM users WHERE id = '${req.params.id}'`; // SQLi
await db.query(query);
const { exec } = require("child_process");
exec(`ls ${req.query.path}`);                                       // command injection
```
```python
users.find({"username": request.json["username"],                  # NoSQL injection
            "password": request.json["password"]})
template = f"Hello {user_input}"                                    # template injection
return render_template_string(template)
```

**Fixed:**
```typescript
const query = "SELECT * FROM users WHERE id = $1";
await db.query(query, [req.params.id]);
import { execFile } from "child_process";
execFile("ls", [sanitizedPath], { cwd: allowedDir });
```
```python
user = users.find_one({"username": str(request.json["username"])})
if user and bcrypt.checkpw(password, user["password_hash"]):
    ...
return render_template("hello.html", name=user_input)  # never render_template_string on user input
```

## A04:2025 Insecure Design

Flawed architecture that cannot be fixed by perfect implementation. Missing threat modeling, no abuse case analysis, no security requirements.

**Indicators:** no rate limiting on auth endpoints; password reset via predictable tokens; business logic trusting client-side validation exclusively; no account lockout; sensitive operations without re-authentication.

**Approach:** threat model every new feature (STRIDE or PASTA); define abuse cases alongside use cases; enforce server-side validation for all business rules; design rate limiting and lockout into the architecture; require re-authentication for privilege changes.

## A05:2025 Security Misconfiguration

Default credentials, unnecessary features enabled, overly permissive settings, missing security headers.

**Vulnerable:**
```typescript
app.use(cors({ origin: "*" }));                                    // CORS wide open
app.use(errorHandler({ showStack: true }));                        // debug in prod
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";      // default cred
```

**Fixed:**
```typescript
app.use(cors({ origin: ["https://app.example.com"], credentials: true }));
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) throw new Error("ADMIN_PASSWORD required");
```

## A06:2025 Vulnerable and Outdated Components

Using libraries with known vulnerabilities or components no longer maintained.

**Detect:**
```bash
npm audit --production && npx npm-check-updates --target minor   # Node.js
pip-audit && safety check                                        # Python
cargo audit                                                      # Rust
```

**Fix:** pin dependency versions, automate vulnerability scanning in CI, subscribe to advisories, remove unused dependencies, prefer actively maintained libraries.

## A07:2025 Identification and Authentication Failures

Weak authentication, credential stuffing exposure, session fixation, missing MFA.

**Vulnerable:**
```typescript
if (password.length >= 4) { /* accept */ }                       // weak policy
res.redirect(`/dashboard?session=${sessionId}`);                 // session in URL
app.post("/login", async (req, res) => {                         // no brute-force protection
  const user = await authenticate(req.body.email, req.body.password);
});
```

**Fixed:**
```typescript
import { zxcvbn } from "zxcvbn";
const result = zxcvbn(password);
if (result.score < 3) return { error: "Password too weak", feedback: result.feedback };

app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: { secure: true, httpOnly: true, sameSite: "strict", maxAge: 3600000 },
  resave: false, saveUninitialized: false,
}));
app.use("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }));
```

## A08:2025 Software and Data Integrity Failures

Code and infrastructure that does not protect against integrity violations: CI/CD pipeline attacks, unsigned updates, insecure deserialization.

**Vulnerable:**
```typescript
const obj = JSON.parse(userInput);
await processOrder(obj);                                          // no schema validation
exec("curl https://example.com/install.sh | bash");              // unsigned install
```
```python
import pickle
data = pickle.loads(request.data)  # remote code execution
```

**Fixed:**
```typescript
import { z } from "zod";
const OrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(100),
});
const result = OrderSchema.safeParse(JSON.parse(userInput));
if (!result.success) return res.status(400).json({ error: result.error });
await processOrder(result.data);
```
```python
import json
data = json.loads(request.data)
validated = OrderSchema(**data)  # Pydantic validation
```

## A09:2025 Security Logging and Monitoring Failures

Insufficient logging of security events, no alerting, logs that leak sensitive data.

**Log:** auth attempts (success + failure), authorization failures, input validation failures, server errors, privilege changes, access to sensitive records.
**Never log:** passwords, tokens, credit card numbers, PII beyond identification need.

```typescript
function logSecurityEvent(event: {
  action: string; userId: string; ip: string; success: boolean;
  metadata?: Record<string, unknown>;
}) {
  logger.info({ type: "security", timestamp: new Date().toISOString(), ...event });
}
app.post("/login", async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);
  logSecurityEvent({ action: "login", userId: req.body.email, ip: req.ip, success: !!user });
});
```

## A10:2025 Server-Side Request Forgery (SSRF)

Application fetches a user-supplied URL without validation, allowing access to internal services.

**Vulnerable:**
```typescript
app.get("/proxy", async (req, res) => {
  const response = await fetch(req.query.url as string);
  res.send(await response.text());
});
```

**Fixed:**
```typescript
const ALLOWED_HOSTS = new Set(["api.github.com", "cdn.example.com"]);
app.get("/proxy", async (req, res) => {
  const url = new URL(req.query.url as string);
  if (!ALLOWED_HOSTS.has(url.hostname)) return res.status(403).json({ error: "Host not allowed" });
  if (url.protocol !== "https:") return res.status(403).json({ error: "HTTPS required" });
  const resolved = await dns.resolve4(url.hostname);
  if (isPrivateIP(resolved[0])) return res.status(403).json({ error: "Internal addresses blocked" });
  const response = await fetch(url.toString());
  res.send(await response.text());
});
```
