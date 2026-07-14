---
name: OWASP Security
description: >
  OWASP vulnerability detection + remediation knowledge for security code review.
  Use when reviewing or hardening authentication, authorization, input validation,
  cryptography, API endpoints, session management, deserialization, SSRF, or file
  uploads — or auditing a Claude Code plugin / MCP server / agent for excessive
  agency, prompt injection, or supply-chain risk. Covers OWASP Top 10:2025,
  API Security Top 10, Agentic AI Security (ASI01–ASI10), CWE Top 25, ASVS 5.0.
when_to_use: >
  "security audit before we ship", "review this auth/JWT/login code", "is this
  SQL injectable", "check for secrets / hardcoded credentials", "is this endpoint
  authorized", "SSRF / open redirect", "review the MCP server / agent tool
  permissions", "OWASP Top 10 check", "harden this API".
allowed-tools: Bash, Read, Grep
---

# OWASP Security Knowledge

Detection-first reference for security-sensitive code review. The tables below are the **triage layer** — one detection signal per category, kept inline so this skill is useful the moment it preloads into the security agent. When a signal fires, open the matching `reference/*.md` for the vulnerable→fixed code.

## How to use this skill

1. Scan the diff/codebase against the **detection signals** below (grep the patterns).
2. On a hit, open the linked reference for the remediation pattern.
3. Before reporting, run the **Security Review Checklist** (§ below).
4. Filter results through **False Positive Filters** — do not report noise.
5. For Forge's own plugin/MCP/agent code, apply **Forge-Specific Patterns**.

## OWASP Top 10:2025 — detection signals

Full vulnerable→fixed code: [reference/owasp-top10.md](reference/owasp-top10.md).

| ID | Category | Grep for |
|----|----------|----------|
| A01 | Broken Access Control | routes without auth middleware; queries using user IDs with no ownership filter; missing role checks; `origin: "*"` |
| A02 | Cryptographic Failures | `secret\|password\|key\|token` literals in source (not env); MD5/SHA1 on passwords; `Math.random()`/`random.random()` for security; `verify=False`; `rejectUnauthorized: false` |
| A03 | Injection | string concatenation in queries; `exec()`/`eval()` with user input; `render_template_string()`; `$where` in Mongo; unsanitized `innerHTML` |
| A04 | Insecure Design | no rate limit on auth; predictable reset tokens; client-only validation; no lockout; no re-auth on privilege change |
| A05 | Security Misconfiguration | `origin: "*"`; missing `helmet()`/headers; `DEBUG=true` in prod; stack traces in responses; directory listing |
| A06 | Vulnerable Components | run `npm audit --production` / `pip-audit` / `cargo audit`; unpinned or unmaintained deps |
| A07 | Auth Failures | password min length < 8; sessions in URLs; no rate limit on `/login`/`/register`; plaintext passwords; missing `httpOnly`/`secure` cookie flags |
| A08 | Integrity Failures | `pickle.loads()`; `yaml.load()` without `SafeLoader`; `eval()`; `curl … \| bash`; missing CDN subresource integrity |
| A09 | Logging Failures | no logging middleware; `console.log`-only; secrets/tokens in log output; no alerting on repeated auth failures |
| A10 | SSRF | `fetch()`/`axios()`/`requests.get()` with user-supplied URL; no hostname allowlist; no protocol restriction; no private-IP block |

## API Security Top 10 — detection signals

Full remediation: [reference/api-security.md](reference/api-security.md).

| ID | Category | Grep for |
|----|----------|----------|
| API1 | Broken Object Level Auth (BOLA) | `/resource/:id` handler fetching by ID without `userId`/ownership filter |
| API2 | Broken Authentication | missing auth on sensitive endpoints; `alg: none`; no JWT algorithm pinning |
| API3 | Broken Object Property Level Auth | `res.json(user)` (full record); `req.body` spread into DB update (mass assignment) |
| API4 | Unrestricted Resource Consumption | no rate limit; uncapped `limit` param; no body-size limit; no query timeout |
| API5 | Broken Function Level Auth | `/api/admin/*` without role middleware; role checked in handler body |
| API6 | Sensitive Business Flow abuse | no CAPTCHA/velocity check on signup, checkout, coupon flows |
| API7 | SSRF (API params) | user URL reaching internal microservices; no RFC 1918 block |
| API8 | Security Misconfiguration | stack traces in prod; `OPTIONS`/`TRACE` enabled; default gateway creds |
| API9 | Improper Inventory | `/debug`, `/test`, `/internal`, old API versions still live |
| API10 | Unsafe API Consumption | unvalidated third-party responses; unverified webhooks; no external-call timeout |

## Agentic AI Security (ASI01–ASI10)

Applies to Claude Code plugins, MCP servers, and autonomous agents — including this repo. Full per-risk detail with Forge relevance: [reference/agentic-ai.md](reference/agentic-ai.md).

| ID | Risk | Forge check |
|----|------|-------------|
| ASI01 | Excessive Agency | agent `tools:` list wider than the role needs (leaf worker with `Task`/`Bash`/`Write`) |
| ASI02 | Inadequate Sandboxing | file-writing agent without `isolation: worktree`; `dangerouslyDisableSandbox` |
| ASI03 | Prompt Injection | tool results / file contents / hook input treated as instructions |
| ASI04 | Insecure Tool Use | MCP handler using a parameter without schema validation |
| ASI05 | Insufficient Monitoring | no event log / hook trail for agent tool calls |
| ASI06 | Data Exfiltration | `Bash` agent able to `curl` out; `.env` piped through an MCP tool |
| ASI07 | Uncontrolled Escalation | agent with write access to `agents/`/`commands/`; subagent tools ⊄ parent tools |
| ASI08 | Model Manipulation | raw external content fed straight into an agent prompt |
| ASI09 | Supply Chain | unaudited MCP server / marketplace plugin; unpinned MCP deps |
| ASI10 | Denial of Service | agent retry loop; MCP handler with no timeout; blocking hook |

## CWE Top 25 & ASVS 5.0

Full CWE-25 detection table and ASVS V1–V13 requirements: [reference/cwe-asvs.md](reference/cwe-asvs.md). Use CWE for classifying a finding by ID and ASVS for the "what does secure look like" bar during design review.

---

## Forge-Specific Security Patterns

These target Forge's own code. Grounded in the real plugin source.

### governance-mcp (`servers/governance-mcp/tools.mjs`)

The MCP tools call `execSync` (single helper, line ~29, `timeout: 15000`) to run **fixed governance commands** (`git status`, `npm audit`, test runners) — no user- or tool-supplied value currently reaches the shell. Keep it that way:

1. **Never interpolate a user- or tool-supplied value into those `execSync` calls.** The current safety is that the command strings are constants; a future edit that string-builds a command from a tool argument reintroduces CWE-78.
2. Validate every tool parameter against expected type/range before use.
3. If a handler ever accepts a path, resolve it and confirm it stays under the project root (forward guidance — not yet in source):
   ```javascript
   function safePath(root, userPath) {
     const resolved = path.resolve(root, userPath);
     if (!resolved.startsWith(path.resolve(root))) throw new Error("Path traversal blocked");
     return resolved;
   }
   ```
4. Return structured errors, never raw exception messages.
5. Keep the `timeout` on every `execSync`/file operation.

### Plugin hooks (`hooks/scripts/`)

The four PreToolUse guards (`security-command-guard`, `security-secret-shield`, `security-injection-guard`, `security-sql-guard`) are **BLOCKING** (`exit 2` denies the tool call). `security-semgrep-scan` (PostToolUse) is **advisory** (`exit 0`). When editing or adding a hook:

- Non-blocking by default; only the four named PreToolUse guards may `exit 2`, and only on a confirmed dangerous pattern.
- Never write secrets to stdout/stderr (hook output is user-visible).
- Handle missing files/commands gracefully; use `set -euo pipefail`.
- Hooks observe — they never modify source files.

### Dual stack

**Rust (forge-orchestrator):** compiler-enforced memory safety; `unsafe` blocks need justification; no `unwrap()` on user paths (use `?`); validate all MCP JSON-RPC inputs before dispatch.
**TypeScript (forge-ui, governance-mcp):** `strict: true`; never `Object.assign({}, userInput)` on untrusted data (prototype pollution); Zod at API boundaries; JSX auto-escapes but `dangerouslySetInnerHTML` bypasses it.

### Claude Code agents

Every agent must specify `tools:` explicitly (omission grants all tools). File-writing agents use `isolation: worktree`. Leaf workers get read-only tools; only orchestrators get `Task`. Subagent tool lists must be a subset of the parent's.

---

## Security Review Checklist

Run before reporting findings.

**Auth & Session:** all endpoints require auth (except explicitly public) · passwords bcrypt/scrypt/argon2 (never MD5/SHA) · session tokens ≥128 bits random · cookies `Secure`+`HttpOnly`+`SameSite` · sessions invalidated on logout/password-change · rate limiting on auth · account lockout.

**Authorization:** every data access checks ownership or role · server-side enforcement · deny by default · admin endpoints behind role middleware · no unauthorized direct object references.

**Input Validation:** all inputs validated server-side with strict schemas · parameterized queries everywhere · no string concat in SQL/shell/templates · file uploads validated by content type · path inputs resolved + checked against allowed dirs.

**Cryptography:** no hardcoded secrets · secrets from env/secret-manager · TLS enforced · cryptographic randomness for tokens/keys · no MD5/SHA1/DES/RC4.

**API:** rate limiting on all endpoints · responses contain only necessary fields · errors do not expose internals · CORS explicit origin allowlist · webhook signatures verified.

**Logging:** auth events logged (success + failure) · authorization failures logged · no secrets/tokens/passwords in logs · structured format · alerting on anomalies.

**Dependencies:** `npm audit`/`pip-audit`/`cargo audit` clean · no known-vulnerable prod deps · versions pinned · unused deps removed.

**Agent & Plugin (Forge):** agent tool lists follow least privilege · MCP handlers validate all inputs · hooks non-blocking + no secret leaks · no `eval()`/`exec()` with unsanitized input in MCP · subagent tools ⊆ parent tools.

---

## False Positive Filters

Skip these low-signal patterns to avoid noise:

- **ReDoS:** flag only if a regex processes untrusted input in a hot path with no timeout. Standard form-validation regexes are not worth flagging.
- **Info disclosure in dev-mode errors:** stack traces are expected in development. Flag only if the **production** error handler exposes internals (check `NODE_ENV=production` guards).
- **Rate limiting on internal endpoints:** endpoints behind a VPC / gateway with its own rate limiting are fine. Flag only if publicly accessible.
- **Test files:** issues in `__tests__/`, `tests/`, `*.test.*`, `*.spec.*` (hardcoded test creds, weak test-helper crypto, permissive test-server CORS) are acceptable.
- **Documentation examples:** code in `README.md`, `docs/`, JSDoc is illustrative — not a vuln unless it is copy-pasteable production code with dangerous defaults.
- **Type-only issues:** missing types / `any` are quality, not security — flag `any` only when it bypasses runtime validation at a trust boundary.

**Contextual judgment:** ask "Can an attacker exploit this in production with realistic access?" If exploitation requires admin access, physical access, or editing the source — it is not a security finding.

---

## Gotchas

Real failure modes specific to reviewing in this plugin's environment:

- **A clean Semgrep hook run ≠ clean code.** `security-semgrep-scan.sh` is PostToolUse and advisory (`exit 0`) — the write already landed and the scan never blocks it. The reviewer, not the hook, is the gate. Do not treat "no Semgrep output" as "no vulnerability."
- **The PreToolUse guards are pattern-based, not semantic.** `security-command-guard` matches literals like `rm -rf /` and `chmod 777`; `security-sql-guard` matches string-concat-with-SQL-keyword. Obfuscated or logically-equivalent forms slip through. A passing guard is not proof of safety — still review by hand.
- **governance-mcp is safe today by construction, not by validation.** Its `execSync` calls run constant command strings; there is no input-sanitization layer. A refactor that builds a command from a tool argument silently converts a safe call into CWE-78 with no test catching it. Treat any new interpolation into `execSync` as a finding.
- **`res.json(record)` is the most common Forge-adjacent BOLA/API3 miss.** Returning a full DB row leaks fields the client should not see AND enables mass-assignment on the write path. Always look for explicit field shaping.
- **Agent `tools:` omission = all tools.** An agent `.md` with no `tools:` frontmatter is not "no tools" — it inherits everything. Missing `tools:` on a leaf worker is an ASI01 finding, not a default.

---

## Additional resources

- OWASP Top 10:2025 vulnerable→fixed code — [reference/owasp-top10.md](reference/owasp-top10.md)
- API Security Top 10 remediation — [reference/api-security.md](reference/api-security.md)
- Agentic AI Security (ASI01–ASI10) with Forge relevance — [reference/agentic-ai.md](reference/agentic-ai.md)
- CWE Top 25 table + ASVS 5.0 requirements — [reference/cwe-asvs.md](reference/cwe-asvs.md)
