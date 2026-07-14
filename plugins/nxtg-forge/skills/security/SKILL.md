---
name: Security
description: >
  Explains why a Forge security guard blocked a tool call (the "SECURITY BLOCK" /
  exit 2 message) and how to fix the code correctly, plus a grounded secure-coding
  quick reference. Use when a Bash/Write/Edit was blocked (rm -rf, chmod 777,
  curl|sh, force-push, eval(), os.system(), subprocess shell=True, child_process.exec,
  string-concat SQL, reading .env / *.pem / *.key / credentials), when you see a
  Semgrep advisory finding, or when you need the map of Forge's PREVENT→DETECT→ASSESS
  security controls. For the deep vulnerability catalog (OWASP Top 10, API, ASI, CWE,
  ASVS) invoke the owasp-security skill instead.
when_to_use: >
  Trigger phrases: "SECURITY BLOCK", "my command/write got blocked", "exit 2",
  "hook denied", "how do I run rm -rf / chmod / force push", "eval blocked",
  "cannot read .env", "secret shield", "injection guard", "SQL guard", "Semgrep
  finding", "is this safe to write", "what does Forge scan for".
allowed-tools: Read, Grep, Bash
---

# Forge Security Controls — Blocked-Write Remediation + Secure Coding

Forge ships a real, three-phase security system. This skill tells you what each
control does, why it blocked you, and the correct fix — then gives a grounded
secure-coding quick reference. For the exhaustive vulnerability catalog (OWASP
Top 10:2025, API Security Top 10, Agentic AI ASI01–ASI10, CWE Top 25, ASVS 5.0)
invoke the **`owasp-security`** skill — this skill does not duplicate it.

## The three phases

| Phase | Mechanism | Blocking? | Where |
|-------|-----------|-----------|-------|
| **PREVENT** | 4 PreToolUse hooks | **YES — exit 2 denies the call** | `hooks/scripts/security-*-guard.sh`, `security-secret-shield.sh` |
| **DETECT** | Semgrep PostToolUse scan | No — advisory only | `hooks/scripts/security-semgrep-scan.sh` |
| **ASSESS** | `security` agent + `owasp-security` skill | No — deep LLM review | `agents/security.md` |

A supplementary `forge_security_scan` MCP tool (governance-mcp) greps for hardcoded
secrets (`password/api_key/secret = "..."`), `eval()` usage, and `.env` committed to
git, and folds the result into the health score (15 pts).

## PREVENT — what blocks you and the correct fix

When a write or command exits 2, the hook prints `SECURITY BLOCK: <reason>` to
stderr. **The fix is always the safe alternative below — never a bypass.** These
guards have no environment-variable escape hatch.

### 1. Command Guard (Bash) — `security-command-guard.sh`
Blocks, with the corrected form:

| Blocked | Why | Do instead |
|---------|-----|-----------|
| `rm -rf /`, `rm -rf /*`, `rm -rf ~` | root/home wipe | give a full path with a suffix: `rm -rf /tmp/build` |
| `chmod 777 x` | world-writable | `chmod 644` (files) / `755` (dirs, scripts) |
| `curl … \| sh`, `wget … \| bash` | remote RCE | download → review → then run |
| fork bomb `:(){ :\|:& };:` | DoS | — |
| `dd if=… of=/dev/sdX`, `mkfs.*` | disk destruction | — |
| `git push --force … main/master` | rewrites shared history | `--force-with-lease`, or push a branch |
| `git reset --hard origin/…` | discards local work | `git stash` first, or `--soft` |

### 2. Secret Shield (Read/Write/Edit/NotebookEdit) — `security-secret-shield.sh`
Blocks by **basename** — it fires on Read too, not just writes:
`.env` / `.env.local|production|staging|development`, `*.pem *.key *.p12 *.pfx
*.jks *.keystore`, `id_rsa`/`id_ed25519`/…, `*credentials*`, `*secret*key*`,
`kubeconfig`, and anything under `*/.ssh/ */.gnupg/ */.aws/credentials`.
- **Allowlisted** (pass through): `*.example *.sample *.template`, `.env.test`,
  and any path under `*/test/ */tests/ */fixtures/ */testdata/`, plus `*.md/.txt/.rst`.
- **To work with env config:** read `.env.example`, never `.env`.

### 3. Injection Guard (Write/Edit/NotebookEdit) — `security-injection-guard.sh`
Blocks writing: JS/TS `eval(` and `new Function(`; Python `os.system(` and
`subprocess.*(… shell=True)`; Node `child_process.exec(`; PHP `system/exec/
passthru/shell_exec/popen`. Each maps to CWE-78/94/95. Safe alternatives:
`execFile()`/`spawn()`, `subprocess.run([...], shell=False)`, parameterized commands.

### 4. SQL Guard (Write/Edit/NotebookEdit) — `security-sql-guard.sh`
Blocks user-interpolated SQL (CWE-89): JS template literals `` `SELECT … ${x}` ``,
`"SELECT …" + x`, Python f-strings `f"SELECT … {x}"` and `%`-format. Use
parameterized queries:
- JS/TS: `db.query('SELECT * FROM users WHERE id = ?', [userId])`
- Python: `cursor.execute('SELECT … WHERE id = %s', (user_id,))`
- Rust: `sqlx::query!("SELECT … WHERE id = $1", user_id)`

## Worked example — a blocked write

```
Write servers/api/orders.js →
  SECURITY BLOCK: SQL injection patterns detected in orders.js
    - Template literal SQL with interpolation detected (CWE-89)
```
**Diagnosis:** the SQL guard saw `` `SELECT * FROM orders WHERE id = ${req.params.id}` ``.
**Fix — resubmit the Write with a parameterized query:**
```js
const order = await db.query(
  'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
  [req.params.id, req.user.id]   // + ownership filter (BOLA/A01)
);
```
The write now passes the guard, and adding the ownership predicate closes the
access-control gap the guard cannot see.

## DETECT — Semgrep (advisory)

After every source-file Write/Edit, `security-semgrep-scan.sh` runs
`semgrep scan --config auto` on that one file and prints up to 5 findings as
`[Semgrep] N finding(s) …`. It **never blocks**. If Semgrep is not installed it
prints an install hint once and no-ops — so silence is not a clean bill. Run a
full scan yourself when hardening:
```bash
semgrep scan --config auto --config "p/owasp-top-ten" --config "p/secrets" .
npm audit --production   # or: pip-audit / cargo audit
```

## Secure-coding quick reference

- **Input:** validate server-side against a strict schema (Zod/Pydantic); allowlist
  over denylist; validate uploads by magic bytes, not extension.
- **AuthN:** hash passwords with argon2id/bcrypt (cost ≥ 12) — never MD5/SHA; MFA
  for admin; rate-limit + lockout on `/login`.
- **AuthZ:** deny by default; filter every data read by owner/role in middleware,
  not the handler body; never trust client-side checks.
- **Crypto:** secrets from env/KMS, never literals; `crypto.randomBytes` /
  `secrets`, never `Math.random`; TLS on (`verify=True`, `rejectUnauthorized:true`).
- **Secrets:** `.env` in `.gitignore`; ship `.env.example`; never log tokens.
- **APIs:** shape responses (allowlist fields, never `res.json(user)`); allowlist
  update fields (no `spread req.body`); allowlist SSRF hosts + block RFC-1918.

## Gotchas — coverage boundaries (defense-in-depth, not a complete control)

A passing guard is **never proof code is safe**. These are real, verified limits —
they mean the deep `owasp-security` review still matters, not that gaps are exits.

1. **`.sh`/`.bash` files are fully exempted** by the injection and SQL guards
   (shell scripts legitimately use `eval`/`exec`). Guard silence on a shell script
   says nothing about its safety.
2. **`MultiEdit` is not matched by any security hook.** The guards cover
   `Write`, `Edit`, `NotebookEdit`, `Bash`, `Read` — not `MultiEdit`. A dangerous
   pattern introduced via MultiEdit is not caught. (Suspected hooks.json coverage
   gap — outside this skill's scope to fix.)
3. **Command Guard only blocks bare-root deletion.** `rm -rf /home/foo` and
   `rm -rf ./build` pass — the regex anchors on `/` or `/*` at end of the argument.
   `chmod 775` also passes; only `777` is blocked.
4. **Force-push guard is literal-match on `main`/`master`.** A repo whose default
   branch has another name is not protected by that rule.
5. **Injection/SQL guards read only the changed slice** — `.tool_input.content`
   (Write) or `.tool_input.new_string` (Edit). An unchanged dangerous line already
   in the file is invisible until you next edit it.
6. **Guards skip test/fixture/config/doc paths** (`__tests__`, `*.test.*`,
   `*/fixtures/*`, `*.json/.yaml/.md`) — expected for the guard, but the deep review
   should still cover test helpers that ship to prod.
7. **Semgrep is advisory and optional.** No finding ≠ clean; it may simply be
   uninstalled or the ruleset didn't match.

## Additional resources

- **Deep vulnerability catalog** (OWASP 2025 / API / ASI / CWE-25 / ASVS + fix
  code + detection signals): invoke the **`owasp-security`** skill.
- **Full audit workflow** (recon → SAST → secrets → OWASP → API → agentic → CRUCIBLE
  test-integrity, with severity + finding format): the **`security`** agent
  (`agents/security.md`), which preloads `owasp-security`.
