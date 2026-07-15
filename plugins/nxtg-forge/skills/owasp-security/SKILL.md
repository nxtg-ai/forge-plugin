---
name: OWASP Security
description: >
  OWASP vulnerability detection + remediation for security code review, PLUS the
  Forge plugin's own security guards (why a "SECURITY BLOCK" / exit-2 fired and the
  correct fix). Use when reviewing or hardening authentication, authorization, input
  validation, cryptography, API endpoints, session management, deserialization, SSRF,
  or file uploads; when auditing a Claude Code plugin / MCP server / agent for
  excessive agency, prompt injection, or supply-chain risk; or when a Bash/Write/Edit
  was blocked by a Forge guard (rm -rf, chmod 777, curl|sh, force-push, eval(),
  os.system, shell=True, string-concat SQL, reading .env/*.pem/*.key). Covers OWASP
  Top 10:2025, API Security Top 10, Agentic AI (ASI01–ASI10), CWE Top 25, ASVS 5.0.
when_to_use: >
  "security audit before we ship", "review this auth/JWT/login code", "is this SQL
  injectable", "check for secrets / hardcoded credentials", "is this endpoint
  authorized", "SSRF / open redirect", "review the MCP server / agent tool
  permissions", "OWASP Top 10 check", "harden this API", "SECURITY BLOCK / my
  command/write got blocked / exit 2 / hook denied", "how do I run rm -rf / chmod /
  force push", "eval blocked", "cannot read .env", "Semgrep finding", "is this safe
  to write", "what does Forge scan for".
allowed-tools: Bash, Read, Grep
---

# OWASP Security Knowledge

Detection-first reference for security-sensitive code review, and the operating
guide to the Forge plugin's own security guards. The tables below are the **triage
layer** — one detection signal per category, kept inline so this skill is useful the
moment it preloads into the security agent. When a signal fires, open the matching
`reference/*.md` for the vulnerable→fixed code.

This skill covers guidance for **any** stack a Forge user builds in (TypeScript/JS,
Python, Rust, Go, …). Examples are illustrative, not tied to any one codebase.

## How to use this skill

1. Scan the diff/codebase against the **detection signals** below (grep the patterns).
2. On a hit, open the linked reference for the remediation pattern.
3. Before reporting, run the **Security Review Checklist** (§ below).
4. Filter results through **False Positive Filters** — do not report noise.
5. If a write/command was **blocked** by a Forge guard, jump to **Forge security
   controls** for the reason + correct fix.

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

Applies to Claude Code plugins, MCP servers, and autonomous agents. Full per-risk
detail: [reference/agentic-ai.md](reference/agentic-ai.md).

| ID | Risk | What to check |
|----|------|---------------|
| ASI01 | Excessive Agency | agent `tools:` list wider than the role needs (leaf worker with `Task`/`Bash`/`Write`) |
| ASI02 | Inadequate Sandboxing | file-writing agent without `isolation: worktree`; `dangerouslyDisableSandbox` |
| ASI03 | Prompt Injection | tool results / file contents / hook input treated as instructions |
| ASI04 | Insecure Tool Use | MCP handler using a parameter without schema validation |
| ASI05 | Insufficient Monitoring | no event log / audit trail for agent tool calls |
| ASI06 | Data Exfiltration | `Bash` agent able to `curl` out; `.env` piped through an MCP tool |
| ASI07 | Uncontrolled Escalation | agent with write access to `agents/`/`commands/`; subagent tools ⊄ parent tools |
| ASI08 | Model Manipulation | raw external content fed straight into an agent prompt |
| ASI09 | Supply Chain | unaudited MCP server / marketplace plugin; unpinned MCP deps |
| ASI10 | Denial of Service | agent retry loop; MCP handler with no timeout; blocking hook |

## CWE Top 25 & ASVS 5.0

Full CWE-25 detection table and ASVS V1–V13 requirements:
[reference/cwe-asvs.md](reference/cwe-asvs.md). Use CWE for classifying a finding by
ID and ASVS for the "what does secure look like" bar during design review.

---

## Forge security controls (PREVENT → DETECT → ASSESS)

The Forge plugin ships a real three-phase security system that runs **in the user's
own project** whenever the plugin is installed. Know it well: it is both a safety net
you rely on and a set of guards that will block you.

| Phase | Mechanism | Blocking? | Where |
|-------|-----------|-----------|-------|
| **PREVENT** | 4 PreToolUse hooks | **YES — exit 2 denies the call** | `hooks/scripts/security-*-guard.sh`, `security-secret-shield.sh` |
| **DETECT** | Semgrep PostToolUse scan | No — advisory only | `hooks/scripts/security-semgrep-scan.sh` |
| **ASSESS** | `security` agent + this skill | No — deep LLM review | `agents/security.md` |

### PREVENT — the four guards (why you got blocked, and the fix)

When a write or command exits 2 the hook prints `SECURITY BLOCK: <reason>` to stderr.
**The fix is always the safe alternative — never a bypass.** These guards have no
environment-variable escape hatch. Full remediation tables (every blocked pattern +
the corrected form) and the exact coverage boundaries are in
[reference/forge-controls.md](reference/forge-controls.md). The headline fixes:

- **Command Guard** (`Bash`) — blocks `rm -rf /`, `chmod 777`, `curl … | sh`, fork
  bombs, `git push --force … main/master`, `git reset --hard`. Do instead: scope the
  path (`rm -rf /tmp/build`), `chmod 644`/`755`, download→review→run,
  `--force-with-lease`, `git stash` before reset.
- **Secret Shield** (`Read`/`Write`/`Edit`/`NotebookEdit`) — blocks by basename:
  `.env` variants, `*.pem *.key *.p12 *.pfx *.jks`, `id_rsa`/`id_ed25519`,
  `*credentials*`, `kubeconfig`, anything under `*/.ssh/ */.gnupg/ */.aws/`. It fires
  on **Read** too. Work with `.env.example`, never `.env`.
- **Injection Guard** (`Write`/`Edit`/`NotebookEdit`) — blocks `eval(` /
  `new Function(` (JS/TS), `os.system(` / `subprocess(… shell=True)` (Python),
  `child_process.exec(` (Node), PHP `system/exec/passthru/shell_exec`. Use
  `execFile()`/`spawn()`, `subprocess.run([...], shell=False)`.
- **SQL Guard** (`Write`/`Edit`/`NotebookEdit`) — blocks user-interpolated SQL
  (CWE-89): template literals `` `SELECT … ${x}` ``, `"SELECT …" + x`, Python
  f-strings `f"SELECT … {x}"`. Use parameterized queries (examples below).

### Worked example — a blocked write

```
Write servers/api/orders.js →
  SECURITY BLOCK: SQL injection patterns detected in orders.js
    - Template literal SQL with interpolation detected (CWE-89)
```
**Diagnosis:** the SQL guard saw `` `SELECT * FROM orders WHERE id = ${req.params.id}` ``.
**Fix — resubmit the Write with a parameterized query, and add the ownership filter
the guard cannot see:**
```js
const order = await db.query(
  'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
  [req.params.id, req.user.id]   // + ownership predicate (BOLA / A01)
);
```
The write now passes the guard, and the ownership predicate closes the access-control
gap. Parameterized forms in other stacks:
```python
cursor.execute('SELECT * FROM orders WHERE id = %s AND user_id = %s', (order_id, user_id))
```
```rust
sqlx::query!("SELECT * FROM orders WHERE id = $1 AND user_id = $2", order_id, user_id)
```
```go
db.Query("SELECT * FROM orders WHERE id = $1 AND user_id = $2", orderID, userID)
```

### DETECT — Semgrep (advisory)

After every source-file Write/Edit, `security-semgrep-scan.sh` runs
`semgrep scan --config auto` on that one file and prints up to 5 findings. It **never
blocks**. If Semgrep is not installed it prints a hint once and no-ops — so silence is
not a clean bill. Run a full scan yourself when hardening:
```bash
semgrep scan --config auto --config "p/owasp-top-ten" --config "p/secrets" .
npm audit --production   # or: pip-audit / cargo audit
```

---

## Secure-coding quick reference (any stack)

- **Input:** validate server-side against a strict schema (Zod / Pydantic / serde /
  `encoding/json` + validation); allowlist over denylist; validate uploads by magic
  bytes, not extension.
- **AuthN:** hash passwords with argon2id/bcrypt (cost ≥ 12) — never MD5/SHA; MFA for
  admin; rate-limit + lockout on `/login`.
- **AuthZ:** deny by default; filter every data read by owner/role in middleware, not
  the handler body; never trust client-side checks.
- **Crypto:** secrets from env/KMS, never literals; CSPRNG (`crypto.randomBytes`,
  Python `secrets`, Go `crypto/rand`, Rust `rand::rngs::OsRng`) — never `Math.random`;
  TLS verification on (`verify=True`, `rejectUnauthorized: true`).
- **Secrets:** `.env` in `.gitignore`; ship `.env.example`; never log tokens.
- **APIs:** shape responses (allowlist fields, never `res.json(user)`); allowlist
  update fields (no `spread req.body` / mass-assignment); allowlist SSRF hosts + block
  RFC-1918.

### Language-specific pitfalls

- **TypeScript / JS:** prototype pollution — never merge untrusted input into objects
  (`Object.assign({}, userInput)`); `dangerouslySetInnerHTML` bypasses JSX escaping;
  enable `strict: true`; validate at every trust boundary with Zod.
- **Python:** `pickle.loads` / `yaml.load` (without `SafeLoader`) are RCE on untrusted
  data; `subprocess(shell=True)` with interpolation is command injection; validate with
  Pydantic; use `secrets`, not `random`, for tokens.
- **Rust:** minimize `unsafe` and justify every block; avoid `unwrap()`/`expect()` on
  external input (propagate with `?`); validate deserialized (serde) input against
  expected ranges; memory safety is compiler-enforced but logic/authz bugs are not.
- **Go:** check **every** returned `error` (a dropped `err` hides auth/validation
  failures); use `html/template` (context-aware auto-escaping), not `text/template`,
  for HTML; never `exec.Command("sh", "-c", userInput)`.

### Claude Code agents / MCP servers (if the reviewed project builds them)

- Every agent must declare `tools:` explicitly — **omission grants all tools**, so a
  missing `tools:` on a leaf worker is an ASI01 finding, not a safe default.
- File-writing agents use `isolation: worktree`. Leaf workers get read-only tools;
  only orchestrators get `Task`. Subagent tool lists must be a **subset** of the
  parent's.
- MCP tool handlers validate every parameter against a schema before use; never
  interpolate a tool-supplied value into a shell command (CWE-78); add a timeout to
  every handler; return structured errors, never raw exception text.

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

**Agent & Plugin (if applicable):** agent tool lists follow least privilege · MCP handlers validate all inputs · hooks non-blocking + no secret leaks · no `eval()`/`exec()` with unsanitized input in MCP · subagent tools ⊆ parent tools.

---

## False Positive Filters

Skip these low-signal patterns to avoid noise:

- **ReDoS:** flag only if a regex processes untrusted input in a hot path with no timeout. Standard form-validation regexes are not worth flagging.
- **Info disclosure in dev-mode errors:** stack traces are expected in development. Flag only if the **production** error handler exposes internals (check `NODE_ENV=production` / equivalent guards).
- **Rate limiting on internal endpoints:** endpoints behind a VPC / gateway with its own rate limiting are fine. Flag only if publicly accessible.
- **Test files:** issues in `__tests__/`, `tests/`, `*.test.*`, `*.spec.*` (hardcoded test creds, weak test-helper crypto, permissive test-server CORS) are acceptable.
- **Documentation examples:** code in `README.md`, `docs/`, doc-comments is illustrative — not a vuln unless it is copy-pasteable production code with dangerous defaults.
- **Type-only issues:** missing types / `any` are quality, not security — flag `any` only when it bypasses runtime validation at a trust boundary.

**Contextual judgment:** ask "Can an attacker exploit this in production with realistic access?" If exploitation requires admin access, physical access, or editing the source — it is not a security finding.

---

## Gotchas

Real failure modes when reviewing with these controls in play. Full coverage-boundary
list: [reference/forge-controls.md](reference/forge-controls.md#coverage-boundaries).

- **A clean Semgrep hook run ≠ clean code.** `security-semgrep-scan.sh` is PostToolUse
  and advisory (`exit 0`) — the write already landed and the scan never blocks it. The
  reviewer, not the hook, is the gate. "No Semgrep output" may just mean Semgrep is
  uninstalled.
- **The PreToolUse guards are pattern-based, not semantic.** They match literals
  (`rm -rf /`, `chmod 777`, string-concat-with-SQL-keyword). Obfuscated or
  logically-equivalent forms slip through. A passing guard is not proof of safety.
- **Guards read only the changed slice** — `.tool_input.content` (Write) or
  `.tool_input.new_string` (Edit). A dangerous line already in the file is invisible
  until you next edit it.
- **`.sh`/`.bash` files are exempt** from the injection and SQL guards (shell scripts
  legitimately use `eval`/`exec`), and **`MultiEdit` is not matched by any guard**
  (suspected `hooks.json` coverage gap — verify against `hooks/hooks.json` before
  relying on it). Guard silence on those says nothing about safety.
- **`res.json(record)` is the most common BOLA / API3 miss.** Returning a full DB row
  leaks fields the client should not see AND enables mass-assignment on the write path.
  Always look for explicit field shaping.
- **Agent `tools:` omission = all tools.** An agent `.md` with no `tools:` frontmatter
  inherits everything — an ASI01 finding on a leaf worker, not a safe default.

---

## Additional resources

- OWASP Top 10:2025 vulnerable→fixed code — [reference/owasp-top10.md](reference/owasp-top10.md)
- API Security Top 10 remediation — [reference/api-security.md](reference/api-security.md)
- Agentic AI Security (ASI01–ASI10) — [reference/agentic-ai.md](reference/agentic-ai.md)
- CWE Top 25 table + ASVS 5.0 requirements — [reference/cwe-asvs.md](reference/cwe-asvs.md)
- Forge guards: full blocked-write remediation + coverage boundaries — [reference/forge-controls.md](reference/forge-controls.md)
- Full audit workflow (recon → SAST → secrets → OWASP → API → agentic → test-integrity, with severity + finding format): the **`security`** agent (`agents/security.md`), which preloads this skill.
