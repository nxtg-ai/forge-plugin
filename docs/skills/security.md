# Security

> Encodes defense-in-depth principles, OWASP Top 10 awareness, secure coding patterns, and security testing automation so agents build secure software by default rather than by afterthought.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Knowledge |

---

## What It Provides

This skill teaches agents to think about security as a design concern, not a checklist to run after implementation. It covers the CIA triad (Confidentiality, Integrity, Availability), defense-in-depth strategy, the OWASP Top 10 vulnerabilities, secure coding practices for input validation and authentication, data protection patterns, static and dynamic analysis tools, container and cloud security, and incident response procedures.

Without this skill, agents produce code that works but is vulnerable: user inputs flow into SQL queries without parameterization, passwords are stored in plaintext or weak hashes, API keys are hardcoded, CORS is configured to allow all origins, sessions lack expiration, error messages expose internal stack traces, dependencies include known CVEs, and docker containers run as root. The skill prevents each of these by encoding specific secure alternatives.

The knowledge is organized around the security lifecycle: secure design principles (least privilege, zero trust, assume breach), secure implementation patterns (input validation, parameterized queries, bcrypt hashing), security testing (SAST, DAST, secret detection, fuzzing), infrastructure hardening (minimal containers, IAM policies, network segmentation), and incident response (detect, contain, investigate, remediate, recover, learn).

## When It Activates

- When an agent is implementing authentication, authorization, or session management
- When writing code that handles user input, file uploads, or external data
- When configuring deployment, containers, or cloud infrastructure
- When reviewing code for security vulnerabilities

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### OWASP Top 10 Awareness

The skill catalogs the ten most critical web application vulnerabilities: injection (SQL, NoSQL, command), broken authentication, sensitive data exposure, XML external entities, broken access control, security misconfiguration, cross-site scripting, insecure deserialization, vulnerable components, and insufficient logging. For each vulnerability, agents learn the attack pattern and the corresponding defense. This is not theoretical -- it translates directly into code decisions like using parameterized queries instead of string concatenation, bcrypt instead of MD5, and structured logging instead of silent failures.

### Authentication and Authorization Patterns

Strong password policies, multi-factor authentication, bcrypt for password storage, secure session management, JWT best practices for authentication. Role-based access control, attribute-based access control, API key management, OAuth 2.0 for authorization. The skill distinguishes between authentication (who are you?) and authorization (what can you do?) and teaches agents to implement both correctly. A common agent mistake -- checking authentication but skipping authorization -- is explicitly prevented.

### Data Protection

Encryption in transit (TLS), encryption at rest (AES), key management, certificate pinning for transport security. PII identification, data masking, secure deletion, audit logging for data handling. The skill teaches agents to identify sensitive data fields and apply appropriate protections automatically -- email addresses get masked in logs, passwords never appear in API responses, and financial data is encrypted at rest.

### Security Automation in CI/CD

The skill includes a GitHub Actions workflow for automated security scanning: Snyk for dependency vulnerabilities, TruffleHog for secret detection. This turns security from a manual review step into an automated gate. Agents that set up CI pipelines include these security stages by default.

## How to Leverage It

Mention security concerns in your prompts when implementing features that handle sensitive data. The skill activates more strongly when the context includes authentication, user input, or data storage. For existing code, ask agents to "security audit" specific modules.

### Example: Secure Authentication

```
User: "Implement user login with password authentication"

What happens: The skill activates alongside core-architecture. The agent uses bcrypt
for password hashing (not MD5 or SHA), implements rate limiting on the login endpoint,
adds session expiration, logs failed attempts without exposing passwords, and returns
generic error messages that don't reveal whether the email or password was wrong.
```

## Power Applications

The incident response framework (detect, contain, investigate, remediate, recover, learn) is valuable beyond code security. When agents encounter production errors or data inconsistencies, the same structured response approach applies: contain the damage first, investigate the root cause, fix it, and document lessons learned.

The security checklist (inputs validated, authentication implemented, authorization enforced, data encrypted, secrets managed, dependencies updated, headers configured, logging implemented, rate limiting enabled, CORS configured) serves as a final gate before deployment.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **coding-standards** | Security-hardened coding patterns (input validation, safe subprocess) |
| **core-architecture** | Layer separation that isolates security concerns |
| **testing** | Security testing as part of the overall testing strategy |

## Tips

- Security is a design concern, not a feature to add later. Include it from the first implementation.
- The OWASP Top 10 list in this skill is a reference, not a complete security program. Real security requires ongoing assessment.

---

*See also: [coding-standards](coding-standards.md) | [testing](testing.md)*
