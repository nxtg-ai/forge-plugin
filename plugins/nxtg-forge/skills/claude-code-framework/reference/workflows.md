# CLI, headless/CI, permissions & multi-session workflows

Operating Claude Code as a tool: invocation modes, flags, CI automation, worktree
parallelism, the permissions model, and verification patterns. Ground against
<https://code.claude.com/docs>.

---

## Invocation modes

| Command | Effect |
|---|---|
| `claude` | Interactive REPL. |
| `claude "explain this project"` | Start with an initial prompt. |
| `claude -p "review this code"` | Print mode: query once, exit — for scripting/CI. |
| `claude -c` | Continue most recent conversation. |
| `cat logs.txt \| claude -p "explain these errors"` | Pipe stdin as context. |

## Essential flags

| Flag | Purpose | Example |
|---|---|---|
| `--add-dir` | Extra working directories | `claude --add-dir ../apps ../lib` |
| `--allowedTools` | Pre-approve tools | `claude --allowedTools "Write" "Bash(git *)"` |
| `--disallowedTools` | Block operations | `claude --disallowedTools "Bash(rm *)"` |
| `--max-turns` | Cap agent turns (CI safety) | `claude -p --max-turns 3 "query"` |
| `--output-format` | `text\|json\|stream-json` | `claude -p --output-format json` |
| `--model` | Override model for the run | `claude --model opus` |
| `--verbose` | Debug logging | `claude --verbose` |

---

## Headless / CI automation

Run non-interactively in pipelines. Always bound with `--max-turns` and a tight tool
allowlist so an autonomous run can't wander.

```bash
# GitHub Actions step
claude -p --max-turns 5 --output-format json \
  --allowedTools "Read" "Grep" \
  "Review the diff for security issues; output findings as JSON."
```

Uses: PR review, issue triage, lint-fix, log-anomaly alerts
(`tail -f app.log | claude -p "Slack me if you see anomalies"`).

---

## Permissions model

Configured in `settings.json` (`permissions.allow` / `permissions.deny`) or via CLI flags.

- **`deny` overrides `allow`.** Denies are the hard boundary — keep secrets and dangerous
  commands there.
- **Patterns are literal glob matches.** `Read(.env*)` matches `.env` in cwd but NOT
  `config/.env`; use `Read(**/.env*)` to cover nested paths. Verify with a dry Read before
  trusting a rule.
- **Scope Bash narrowly:** `Bash(git *)`, `Bash(npm *)` rather than blanket `Bash`.
- Keep API keys/secrets in `.env` and `deny` Claude access to them.

```json
{
  "permissions": {
    "allow": ["Read", "Write(src/**)", "Bash(git *)", "Bash(npm *)", "Bash(pytest *)"],
    "deny":  ["Read(**/.env*)", "Read(**/*.key)", "Write(**/production.config.*)",
              "Bash(rm *)", "Bash(sudo *)"]
  }
}
```

---

## Hooks — events at a glance

Hooks run by the harness (not the model), so they are the only way to *guarantee* an
automated behavior. Keep them fast and deterministic; set a `timeout`.

| Event | Fires | Typical use |
|---|---|---|
| `PreToolUse` | before a tool runs | **blocking guard** — exit `2` denies the call |
| `PostToolUse` | after a tool runs | lint/format/scan the written file |
| `UserPromptSubmit` | on each user prompt | inject context, sync state |
| `Stop` | when Claude finishes | post-task checks, reminders (advisory) |
| `SessionStart` | session begins | fetch, warm caches |

Exit `2` in `PreToolUse` = deny (stderr goes to the model); advisory hooks must exit `0`. In
a plugin, reference scripts via `${CLAUDE_PLUGIN_ROOT}/hooks/scripts/...`, never an absolute
path. Full hook wiring JSON + exit-code table + available env vars: [../reference.md](../reference.md).

---

## Git worktree parallelism

Run independent Claude sessions on separate branches without file conflicts:

```bash
git worktree add ../proj-feature-a feature-a
git worktree add ../proj-feature-b feature-b
cd ../proj-feature-a && claude   # terminal 1
cd ../proj-feature-b && claude   # terminal 2
git worktree remove ../proj-feature-a   # cleanup
```

Agents can also declare `isolation: worktree` to get this automatically for parallel file work.

---

## Checklist-driven development

For large migrations / multi-step tasks, use a Markdown file (or issue) as a living
scratchpad the session references throughout:

1. Create `checklist.md` with the ordered steps.
2. Reference it each turn; mark items done as Claude completes them.
3. Update it when requirements change — it survives `/clear` and re-orients a fresh context.

---

## Multi-Claude verification

Split writing from reviewing so a context doesn't rationalize its own output:

1. Context A (or a subagent) writes the code.
2. Context B — a fresh session or a review subagent — validates against the spec/tests.
3. Reconcile. This "think twice" pattern catches errors a single-context agent misses.

---

## Checkpoints & rewind

- Claude auto-saves state before each of *its* edits. `/rewind` (or double-tap Esc) restores
  code, conversation, or both.
- **Does NOT undo your bash side effects** — migrations, `rm`, network calls, pushes. For
  anything with external effects, rely on git and real backups, not checkpoints.
