# Security

> Dedicated vulnerability hunter -- scans dependencies, detects secrets in source, audits authentication flows, and checks your code against the OWASP Top 10.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Specialist |
| **Model** | Sonnet |

---

## What It Does

The Security agent is a focused penetration tester for your codebase. While the Guardian runs security as one dimension of its broad quality gate, the Security agent goes deep -- it checks all ten OWASP categories, audits authentication and authorization implementations, validates CSP and CORS configurations, scans for secrets with pattern matching, and classifies every finding by severity with specific remediation steps.

What makes this agent valuable is the depth of its security knowledge. It does not just run `npm audit`. It reads your authentication code and checks for common JWT mistakes (missing expiration, weak signing algorithms, tokens in localStorage). It scans your API endpoints for missing rate limiting, input validation without schema enforcement, and CORS configurations that allow any origin. It checks your frontend for `dangerouslySetInnerHTML` with user-controlled input, `eval()` calls, and missing Content Security Policy headers.

Every finding follows a structured format: severity, file location, issue description, attacker impact, and specific code fix. A finding like "HIGH: Hardcoded API key in src/services/github.ts:42" is immediately actionable. The Security agent does not leave you with vague warnings -- it tells you what is wrong, why it matters, and exactly how to fix it.

## When to Use It

- **Before a release**: When you need a comprehensive security audit that goes beyond dependency scanning into code-level vulnerability assessment.
- **After implementing authentication**: When you have built JWT, OAuth, session management, or any auth system and want an expert review for common security mistakes.
- **When onboarding third-party dependencies**: When you have added new packages and want to verify they do not introduce known vulnerabilities or problematic licenses.
- **After a security incident**: When you need to find all instances of a vulnerability pattern across the codebase, not just the one that was exploited.

Do not use the Security agent for general code quality (use Guardian), performance issues (use Performance), or broad project health (use Detective). The Security agent is deep and narrow -- security only.

## How It Works

The Security agent runs a five-part audit:

1. **Dependency Vulnerabilities** -- Runs `npm audit` (JavaScript) or `safety check` (Python) and classifies results by severity. Flags outdated packages with known security patches.

2. **Secrets Detection** -- Pattern-matches across the entire codebase for hardcoded API keys, tokens, passwords, connection strings, and private keys. Verifies `.env` files are in `.gitignore`. Checks git history for accidentally committed secrets.

3. **OWASP Top 10 Review** -- Systematically checks for injection (SQL, NoSQL, command), broken authentication, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialization, known vulnerable components, and insufficient logging.

4. **API Security Audit** -- Verifies rate limiting on sensitive endpoints, authentication on protected routes, input validation with schema libraries (Zod/Joi), CORS restrictions, and absence of sensitive data in URLs and logs.

5. **Frontend Security Check** -- Validates CSP headers, scans for dangerous DOM manipulation, checks cookie flags (HttpOnly, Secure, SameSite), and verifies React's built-in XSS protection is not bypassed.

Findings are classified as Critical (fix immediately), High (fix before release), Medium (fix in next sprint), or Low (track and plan).

## Examples

### Example 1: Pre-Release Security Scan

```
User: "Run a security scan before we ship v3.1"

Security:
  - Runs: npm audit -- 2 moderate, 0 high, 0 critical
  - Scans: Source code for secrets -- clean
  - Checks: OWASP Top 10 -- no injection risks, auth looks solid
  - Finds:
    [MEDIUM] express v4.18.2 has moderate severity CVE -- update to 4.19.2
    [MEDIUM] CORS allows localhost origins in production config
  - Recommends: Update express, restrict CORS to production domains
  - Result: Two medium findings with specific fixes, no blockers for release
```

### Example 2: JWT Authentication Review

```
User: "I just implemented JWT authentication, can you review it for security?"

Security:
  - Reads: auth/jwt-service.ts, auth/middleware.ts, auth/routes.ts
  - Finds:
    [HIGH] JWT signed with HS256 (symmetric) -- use RS256 for production
    [HIGH] No token expiration set -- add exp claim with 15-minute window
    [MEDIUM] Refresh token stored in localStorage -- use httpOnly cookie
    [LOW] Missing rate limit on /auth/login endpoint
  - Provides: Code fix for each finding with before/after examples
  - Result: Four findings ranked by severity with exact code changes needed
```

### Example 3: Secrets Audit After Developer Offboarding

```
User: "A team member left -- check for any hardcoded credentials they might have added"

Security:
  - Scans: All source files for key/token/password/secret patterns
  - Checks: Git history for committed-then-removed secrets
  - Finds:
    [CRITICAL] AWS access key in src/services/s3.ts:17 (committed 3 months ago)
    [HIGH] Database connection string in docker-compose.yml (not in .env)
  - Recommends: Rotate the AWS key immediately, move DB string to .env
  - Result: Two findings including one from git history that a file scan alone would miss
```

## Power Use Cases

**Guardian Subagent Mode**: The Guardian spawns the Security agent as a parallel subagent during quality gate runs. Security performs deep vulnerability scanning while Guardian handles tests and types. Results are aggregated into the final quality report.

**Compliance Pipeline Integration**: Combine Security with Compliance for pre-release audits. Security finds technical vulnerabilities; Compliance checks license compatibility and regulatory requirements. Together they cover the full legal and technical risk surface.

**Targeted Auth Auditing**: After implementing any authentication or authorization feature, invoke Security directly. Its OWASP-informed checklist catches the JWT pitfalls, session management mistakes, and access control gaps that developers commonly miss on first implementation.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Guardian** | Guardian spawns Security as a parallel subagent during quality gates. Security provides the deep scan; Guardian aggregates with other dimensions. |
| **Compliance** | Security handles technical vulnerabilities; Compliance handles legal and regulatory. Together they cover the full risk surface for release readiness. |
| **Detective** | Detective includes a security dimension in its health score. For deep dives, Detective delegates to the Security agent. |
| **/forge:deploy** | Deployment workflows should include a Security scan. Critical findings block deployment; medium findings are logged. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full OWASP Top 10 scanning. Dependency vulnerability audit. Secrets detection. API and frontend security checks. Severity classification with remediation guidance. |
| **L2 Pro Builder** | Security findings recorded via `forge_capture_knowledge` for cross-session tracking. Past findings recalled via `forge_get_knowledge` to verify regressions are fixed. |
| **L3 Ship Lord** | Security scan results visible in the forge-ui dashboard governance panel. Vulnerability counts displayed on the health score card. |

## Common Rationalizations (Don't Fall For These)

| What You Tell Yourself | Why It's Wrong |
|----------------------|---------------|
| "We're an internal tool, security doesn't matter" | Internal tools get compromised first. They often have weaker auth, more privilege, and direct database access. Internal ≠ safe. |
| "npm audit says 0 vulnerabilities" | `npm audit` only checks *known CVEs in dependencies*. It doesn't find hardcoded secrets, weak JWT config, SQL injection in your code, or missing rate limiting. |
| "I removed the secret from the code" | It's still in git history. Anyone with repo access can find it. Secrets must be rotated after accidental commit, not just deleted. |
| "We'll do a security review before launch" | Pre-launch reviews find 10x more issues than you budgeted time to fix. Run Security incrementally — after auth changes, after new endpoints, after dependency updates. |
| "It's just a Low severity finding" | Five Lows can chain into a Critical. Missing rate limiting + verbose errors + no CSRF + weak session + exposed debug endpoint = account takeover. |
| "HTTPS handles our security" | HTTPS encrypts transport. It doesn't prevent XSS, CSRF, SQL injection, broken auth, or any of the OWASP Top 10 application-level attacks. |

## Tips & Gotchas

- **Do**: Run the Security agent after implementing authentication, authorization, or any feature that handles sensitive data. These are the highest-risk areas.
- **Don't**: Rely solely on `npm audit`. Dependency scanning catches known CVEs but misses code-level vulnerabilities like hardcoded secrets, weak crypto, and missing input validation.
- **Do**: Check git history, not just current files. Secrets that were committed and then removed still exist in git history and are exploitable.
- **Don't**: Ignore Low severity findings indefinitely. Low-severity issues compound -- five "best practice violations" can become one exploitable attack chain.

---

*See also: [Guardian](guardian.md) | [Compliance](compliance.md) | [/forge:deploy](../commands/deploy.md)*
