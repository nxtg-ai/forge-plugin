# Forge Security Controls — Blocked-Write Remediation + Coverage Boundaries

The Forge plugin ships a three-phase security system (PREVENT → DETECT → ASSESS) that
runs in the user's own project. This file is the full lookup for the **PREVENT** phase:
every pattern the four guards block, the correct fix, and the exact limits of each
guard. The SKILL.md carries the headline summary; this file is the detail.

| Phase | Mechanism | Blocking? | Where |
|-------|-----------|-----------|-------|
| **PREVENT** | 4 PreToolUse hooks | **YES — exit 2 denies the call** | `hooks/scripts/security-*-guard.sh`, `security-secret-shield.sh` |
| **DETECT** | Semgrep PostToolUse scan | No — advisory only | `hooks/scripts/security-semgrep-scan.sh` |
| **ASSESS** | `security` agent + `owasp-security` skill | No — deep LLM review | `agents/security.md` |

When a write or command exits 2, the hook prints `SECURITY BLOCK: <reason>` to stderr.
**The fix is always the safe alternative below — never a bypass.** These guards have no
environment-variable escape hatch.

## 1. Command Guard (Bash) — `security-command-guard.sh`

| Blocked | Why | Do instead |
|---------|-----|-----------|
| `rm -rf /`, `rm -rf /*`, `rm -rf ~` | root/home wipe | give a full path with a suffix: `rm -rf /tmp/build` |
| `chmod 777 x` | world-writable | `chmod 644` (files) / `755` (dirs, scripts) |
| `curl … \| sh`, `wget … \| bash` | remote RCE | download → review → then run |
| fork bomb `:(){ :\|:& };:` | DoS | — |
| `dd if=… of=/dev/sdX`, `mkfs.*` | disk destruction | — |
| `git push --force … main/master` | rewrites shared history | `--force-with-lease`, or push a branch |
| `git reset --hard origin/…` | discards local work | `git stash` first, or `--soft` |

## 2. Secret Shield (Read/Write/Edit/NotebookEdit) — `security-secret-shield.sh`

Blocks by **basename** — it fires on Read too, not just writes:
`.env` / `.env.local|production|staging|development`, `*.pem *.key *.p12 *.pfx
*.jks *.keystore`, `id_rsa`/`id_ed25519`/…, `*credentials*`, `*secret*key*`,
`kubeconfig`, and anything under `*/.ssh/ */.gnupg/ */.aws/credentials`.

- **Allowlisted** (pass through): `*.example *.sample *.template`, `.env.test`, and any
  path under `*/test/ */tests/ */fixtures/ */testdata/`, plus `*.md/.txt/.rst`.
- **To work with env config:** read `.env.example`, never `.env`.

## 3. Injection Guard (Write/Edit/NotebookEdit) — `security-injection-guard.sh`

Blocks writing:
- JS/TS `eval(` and `new Function(`
- Python `os.system(` and `subprocess.*(… shell=True)`
- Node `child_process.exec(`
- PHP `system/exec/passthru/shell_exec/popen`

Each maps to CWE-78/94/95. Safe alternatives: `execFile()`/`spawn()`,
`subprocess.run([...], shell=False)`, parameterized/argv-list commands.

## 4. SQL Guard (Write/Edit/NotebookEdit) — `security-sql-guard.sh`

Blocks user-interpolated SQL (CWE-89): JS template literals `` `SELECT … ${x}` ``,
`"SELECT …" + x`, Python f-strings `f"SELECT … {x}"` and `%`-format. Use parameterized
queries:

- JS/TS: `db.query('SELECT * FROM users WHERE id = $1', [userId])`
- Python: `cursor.execute('SELECT … WHERE id = %s', (user_id,))`
- Rust: `sqlx::query!("SELECT … WHERE id = $1", user_id)`
- Go: `db.Query("SELECT … WHERE id = $1", userID)`

## DETECT — Semgrep (advisory)

After every source-file Write/Edit, `security-semgrep-scan.sh` runs
`semgrep scan --config auto` on that one file and prints up to 5 findings as
`[Semgrep] N finding(s) …`. It **never blocks**. If Semgrep is not installed it prints
an install hint once and no-ops — so silence is not a clean bill. Full scan when
hardening:

```bash
semgrep scan --config auto --config "p/owasp-top-ten" --config "p/secrets" .
npm audit --production   # or: pip-audit / cargo audit
```

A supplementary MCP tool (`forge_security_scan`) greps for hardcoded secrets
(`password/api_key/secret = "..."`), `eval()` usage, and `.env` committed to git, and
folds the result into the governance health score. It is advisory, not a gate.

## Coverage boundaries

A passing guard is **never** proof code is safe. These are real limits — they mean the
deep `owasp-security` review still matters, not that gaps are exits. Where a claim is
about hook wiring, verify it against `hooks/hooks.json` in the installed plugin before
relying on it — behavior can change between plugin versions.

1. **`.sh`/`.bash` files are fully exempted** by the injection and SQL guards (shell
   scripts legitimately use `eval`/`exec`). Guard silence on a shell script says
   nothing about its safety.
2. **`MultiEdit` is not matched by any security hook** — the guards cover `Write`,
   `Edit`, `NotebookEdit`, `Bash`, `Read`. A dangerous pattern introduced via
   `MultiEdit` is not caught. (**Suspected** `hooks.json` coverage gap — verify against
   the installed `hooks/hooks.json`; outside this skill's scope to fix.)
3. **Command Guard only blocks bare-root deletion.** `rm -rf /home/foo` and
   `rm -rf ./build` pass — the regex anchors on `/` or `/*` at end of the argument.
   `chmod 775` also passes; only `777` is blocked.
4. **Force-push guard is a literal match on `main`/`master`.** A repo whose default
   branch has another name is not protected by that rule.
5. **Injection/SQL guards read only the changed slice** — `.tool_input.content`
   (Write) or `.tool_input.new_string` (Edit). An unchanged dangerous line already in
   the file is invisible until you next edit it.
6. **Guards skip test/fixture/config/doc paths** (`__tests__`, `*.test.*`,
   `*/fixtures/*`, `*.json/.yaml/.md`) — expected for the guard, but the deep review
   should still cover test helpers that ship to production.
7. **Semgrep is advisory and optional.** No finding ≠ clean; it may simply be
   uninstalled or the ruleset didn't match.
