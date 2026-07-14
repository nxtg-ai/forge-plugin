# CWE Top 25 + ASVS 5.0 — Reference

## CWE Top 25 Most Dangerous Software Weaknesses

| Rank | CWE | Name | Detection Pattern |
|------|-----|------|-------------------|
| 1 | CWE-787 | Out-of-bounds Write | Buffer ops without bounds checking in C/C++/Rust unsafe blocks |
| 2 | CWE-79 | Cross-site Scripting (XSS) | `innerHTML`, `dangerouslySetInnerHTML`, unescaped template variables |
| 3 | CWE-89 | SQL Injection | String concatenation in SQL queries, missing parameterized queries |
| 4 | CWE-416 | Use After Free | Dangling pointers, double-free in unsafe Rust or C/C++ |
| 5 | CWE-78 | OS Command Injection | `exec()`, `system()`, `child_process.exec` with user input |
| 6 | CWE-20 | Improper Input Validation | Missing schema validation on API inputs, no type checks |
| 7 | CWE-125 | Out-of-bounds Read | Array access without length checks, buffer over-reads |
| 8 | CWE-22 | Path Traversal | `../` in file paths, `path.join` with user input without `path.resolve` |
| 9 | CWE-352 | Cross-Site Request Forgery | State-changing GET requests, missing CSRF tokens on forms |
| 10 | CWE-434 | Unrestricted File Upload | Upload without type/size validation, executable uploads |
| 11 | CWE-862 | Missing Authorization | Endpoints without auth middleware, direct object references |
| 12 | CWE-476 | NULL Pointer Dereference | Missing null checks, optional chaining gaps |
| 13 | CWE-287 | Improper Authentication | Custom auth instead of proven libraries, weak token validation |
| 14 | CWE-190 | Integer Overflow | Arithmetic on user-supplied numbers without range checks |
| 15 | CWE-502 | Deserialization of Untrusted Data | `pickle.loads()`, `unserialize()`, `JSON.parse` without schema |
| 16 | CWE-77 | Command Injection | Template strings in shell commands, unsanitized arguments |
| 17 | CWE-119 | Buffer Overflow | Fixed-size buffer operations, `strcpy`/`strcat` usage |
| 18 | CWE-798 | Hard-coded Credentials | Passwords, API keys, secrets as string literals in source |
| 19 | CWE-918 | Server-Side Request Forgery | `fetch`/`requests.get` with user-controlled URLs |
| 20 | CWE-306 | Missing Authentication for Critical Function | Admin endpoints without auth check |
| 21 | CWE-362 | Race Condition | TOCTOU patterns, shared mutable state without locking |
| 22 | CWE-269 | Improper Privilege Management | setuid misuse, running as root, capability escalation |
| 23 | CWE-94 | Code Injection | `eval()`, `Function()`, `vm.runInContext` with user input |
| 24 | CWE-863 | Incorrect Authorization | Auth check present but logically flawed (wrong role, OR vs AND) |
| 25 | CWE-276 | Incorrect Default Permissions | World-writable files, `0777` permissions, public S3 buckets |

## ASVS 5.0 Key Requirements

### V1: Architecture, Design and Threat Modeling
- Threat model every significant feature (STRIDE minimum)
- Define trust boundaries between components
- Document data flows for sensitive information
- Identify all entry points and their authentication requirements
- Design for failure: assume any component can be compromised

### V2: Authentication
- Passwords: min 8 chars, no max below 64, check against breach lists
- Credential storage: bcrypt/scrypt/argon2 with per-user salt, never SHA/MD5
- Session tokens: min 128 bits entropy, regenerate on privilege change
- Multi-factor: require for admin accounts and sensitive operations
- Account lockout: temporary lockout after 5–10 failed attempts, with CAPTCHA

### V3: Session Management
- Session IDs: cryptographically random, never in URLs
- Cookie attributes: `Secure`, `HttpOnly`, `SameSite=Strict`, reasonable `Max-Age`
- Invalidate sessions on logout, password change, privilege escalation
- Concurrent session limits for sensitive applications
- Idle timeout: 15–30 min for sensitive apps, re-auth for critical operations

### V4: Access Control
- Deny by default: explicitly grant, never explicitly deny
- Enforce server-side, never trust client-side access control
- Least privilege for every user, service account, and API key
- Log all access control failures for monitoring
- Rate limit access control checks to prevent enumeration

### V5: Validation, Sanitization, Encoding
- Validate all inputs server-side against a strict schema
- Output-encode for the target context (HTML, URL, JavaScript, SQL, OS command)
- Use allowlists over denylists for input validation
- Structured data: validate against JSON Schema, Zod, or Pydantic
- File uploads: validate type by content (magic bytes), not extension alone

### V6: Stored Cryptography
- Symmetric encryption: AES-256-GCM (authenticated encryption)
- Key management: use a KMS, never store keys alongside encrypted data
- Password hashing: argon2id preferred, bcrypt acceptable (cost ≥ 12)
- Random number generation: `crypto.randomBytes` (Node.js), `secrets` (Python)
- Deprecation: MD5, SHA1, DES, RC4, ECB mode are all prohibited

### V13: API and Web Service
- All API endpoints require authentication (except health checks, public resources)
- Input validation on every endpoint with strict schemas
- Response filtering: never return internal fields, stack traces, or debug info
- Rate limiting with progressive backoff
- API versioning with deprecation timeline
- CORS: explicit origin allowlist, never wildcard with credentials
