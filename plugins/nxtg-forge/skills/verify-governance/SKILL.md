---
name: verify-governance
description: >
  Adjudicate a flagged governance concern with evidence, then issue a JUSTIFIED or
  REVERT verdict. Use when a Forge governance hook logs "GOVERNANCE: N violation(s)" or
  "Code governance", when a test-vs-implementation mismatch is suspected, when a change
  might be out of directive scope, or when the user asks to verify/justify a code or test
  change. Reads the real implementation before ruling — it never guesses.
when_to_use: >
  Trigger phrases: "verify governance", "verify this concern", "is this test change
  justified", "did I break scope", "governance violation", "as any flagged", "test
  expects X but code returns Y", "justify or revert". Also fires after governance-check.sh
  emits an advisory warning during Edit/Write.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash(grep:*), Bash(jq:*), Bash(git:*), Bash(cat:*), Bash(curl:*)
---

# Verify Governance Skill

Adjudicates a governance concern by reading the **actual** source, comparing it to what was
flagged, and returning an evidence-backed verdict: **JUSTIFIED** (proceed) or **REVERT**.

This is the manual/adjudication front end for the same concern class the `governance-verifier`
agent handles automatically. Use this skill for a quick in-session ruling; delegate to the
agent when the concern needs its own isolated context.

## When to Use

- A Forge advisory hook printed a warning during an Edit/Write (`GOVERNANCE: N violation(s)`).
- You changed a test assertion and need to prove it matches the implementation.
- You suspect a change drifted outside the current directive scope.
- The user asks "is this justified?" / "should I revert this?".

## What the hooks actually emit (ground truth)

`hooks/scripts/governance-check.sh` is a **PostToolUse (Edit/Write) advisory** hook — it
**always exits 0 and never blocks**. It only runs on source paths (`*/src/*`, `.ts/.tsx/.js/.jsx/.py/.rs/.go`),
**skips test files** (`*.test.*`, `*.spec.*`, `*__tests__*`), and flags four categories:

| Tag | Rule | Message fragment |
|-----|------|------------------|
| `[ANY]` | `as any` cast in production code | `N 'as any' cast(s) at line(s): ...` |
| `[API]` | `unwrapErr()` call | `use .error property` |
| `[LOG]` | uncommented `console.log` | `use structured logger` |
| `[URL]` | hardcoded `localhost:PORT` | `use env config` |

It also appends a `WARN` entry (`category: code-quality`, `severity: medium`) to
`.claude/governance.json` `sentinelLog` via `append_sentinel_log`. That is the entire blast
radius — there is no blocking, no test-mismatch detector, and no scope detector in this hook.
Test-mismatch and scope concerns are *your* judgment call or the agent's, grounded in the steps below.

## Procedure

### Step 1 — Identify the concern

Read back the exact hook line or user claim. Pin down:
- **File + line(s)** named in the flag.
- **Concern class**: `code-quality` (the four tags above), `test-mismatch`, or `scope-creep`.
- **The specific assertion** (e.g. "test expects `undefined`, code returns `null`").

### Step 2 — Gather evidence from real source

Test-vs-implementation mismatch — read the function's real return path:
```bash
grep -n "functionName" src/path/to/impl.ts          # find the definition
grep -n -A6 "functionName" src/path/to/impl.ts       # inspect the return type + body
```

Code-quality flag — confirm the flagged construct is real (not in a comment/string):
```bash
grep -n 'as any' src/path/to/file.ts                 # verify line(s) the hook reported
```

Scope concern — the directive is the authority, **not** the workstreams array:
```bash
jq -r '.constitution.directive' .claude/governance.json      # the binding scope statement
jq -r '.workstreams[]?.id // "none"' .claude/governance.json # may be empty ([]) — that is NOT a violation
```

If behavior may have changed recently, check history before ruling:
```bash
git log --oneline -5 -- src/path/to/impl.ts
git show HEAD:src/path/to/impl.ts | grep -n "functionName"
```

### Step 3 — Issue the verdict

Cite specific line numbers. One verdict, one reason, one action.

```markdown
## Governance Verification Report

**Concern**: <what was flagged>
**Source**: <hook name / manual>

### Evidence
| File | Line | Finding |
|------|------|---------|
| src/foo.ts | 42 | `getTask(id): Task \| null` returns `null` |

### Verdict: ✅ JUSTIFIED
**Reasoning**: line 42 explicitly returns `null`; the test change matches.
**Action**: Proceed. No implementation change needed.
```

Or:
```markdown
### Verdict: ❌ REVERT RECOMMENDED
**Reasoning**: the test expected `undefined` per TS convention; the impl regressed to `null`.
**Action**: Revert the test; fix the implementation to return `undefined`.
```

If evidence is inconclusive, **recommend manual review — do not auto-proceed.**

### Step 4 — Log the verdict (only if the dashboard API is up)

Optional. The forge-ui Express API on port 5051 exposes `POST /api/governance/sentinel`; it
requires `type`, `source`, `message` (400 otherwise) and is only reachable while
`forge-ui` (`npm run dev` / the dashboard) is running:
```bash
curl -s -X POST http://localhost:5051/api/governance/sentinel \
  -H "Content-Type: application/json" \
  -d '{"type":"INFO","severity":"low","source":"verify-governance",
       "message":"Verification complete: change JUSTIFIED",
       "context":{"verdict":"JUSTIFIED","file":"src/foo.ts"}}'
```
If the server is down, skip it — the advisory hooks already write the file directly; do not
block the verdict on a failed curl.

## Worked Example — code-quality flag

Hook output during an Edit:
```
GOVERNANCE: 2 violation(s) in api-client.ts
  [ANY] 2 'as any' cast(s) at line(s): 88,141
```
Evidence gathered:
```bash
grep -n 'as any' src/services/api-client.ts
# 88:    const data = res.body as any;
# 141:   return payload as any;
```
Both are real, uncommented casts in production code. Verdict:
```markdown
### Verdict: ❌ REVERT RECOMMENDED
**Reasoning**: lines 88 and 141 use `as any`, defeating type safety in a public service.
**Action**: Type `res.body` via the response DTO; give `payload` its declared return type.
```

## Worked Example — test-vs-implementation mismatch

Claim: "test now uses `toBeNull()` but was `toBeUndefined()` — is that right?"
```bash
grep -n -A2 "getTask" src/core/TaskQueue.ts
# 98: getTask(taskId: string): AgentTask | null {
# 100:   return queuedTask?.task || null;
```
```markdown
### Verdict: ✅ JUSTIFIED
**Reasoning**: `getTask` returns type `AgentTask | null` and returns `null` (line 100).
The `toBeNull()` assertion matches the contract.
**Action**: Proceed with the test update. No implementation change.
```

## Gotchas

- **No slash command backs this.** There is no `/verify-gov` and no `commands/verify-governance.md`
  file. Invocation is the skill name only (`user-invocable: true`). Don't tell the user to run a
  command that doesn't exist; for a background/isolated ruling, hand off to the `governance-verifier` agent.
- **The governance-check hook never blocks.** It exits 0 unconditionally. Old phrasing like "hook
  stopped continuation" / "PostToolUse blocked" does not apply to it — that hook is purely advisory.
  The only **blocking** hooks (exit 2) are the four `security-*-guard.sh` PreToolUse guards, which
  are a different concern class this skill does not adjudicate.
- **That hook skips test files.** It never fires on `*.test.*` / `*.spec.*` / `__tests__`, so a
  "test assertion inconsistency" is never emitted by `governance-check.sh`. Treat test-mismatch as a
  human/agent judgment grounded in the implementation — not as a hook output.
- **Empty `workstreams` is normal, not a violation.** `.claude/governance.json` `workstreams` is
  often `[]`. `jq '.workstreams[].id'` returning nothing means "no workstreams defined," not
  "out of scope." Scope authority is `.constitution.directive`.
- **The sentinel curl needs a live server.** `POST /api/governance/sentinel` is served by forge-ui
  on port 5051, up only when the dashboard is running. It 400s without `type`+`source`+`message`.
  If it's down, the hooks' own `append_sentinel_log` has already written to `.claude/governance.json` —
  never fail a verdict because the HTTP log didn't land.
- **`.claude/governance.json` is the read authority, forge-orchestrator's `.forge/state.json` is a
  different store.** This skill reads governance state under `.claude/`; do not conflate it with the
  Rust orchestrator's `.forge/` state.

## Related

- **`governance-verifier` agent** — the isolated-context automation for this same concern class.
- **`hooks/scripts/governance-check.sh`** — the advisory source of `code-quality` flags.
- **`crucible-audit` skill** — for auditing whether the *test suite itself* catches real bugs
  (a superset concern), when the question is test quality rather than one flagged change.
