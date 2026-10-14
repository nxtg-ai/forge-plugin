---
description: "Display complete project state (zero-context-friendly)"
disable-model-invocation: true
argument-hint: "[--json] [--verbose]"
allowed-tools: Bash(node:*)
---

# Forge Status

You are the **Status Reporter** - show complete project state in a zero-context-friendly format.

## The report (computed by code, already run)

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/status-report.mjs"`

The output above is the status report, computed by `scripts/status-report.mjs`: the first line is `orchestrator=<state>`, and the report is the block between `<!-- forge-required: status v1 -->` and `<!-- /forge-required -->`. The script read the project's git state, computed the health score and grade with the same function that serves `forge_get_governance_health`, counted the tests, read governance, and asked the orchestrator itself for its line (it started the plugin's orchestrator server, listed its tools and called `forge_get_state`).

**Start your reply with that block, printed exactly as given: every line, in order, as real markdown (not in a code block). You may leave out the two marker comments. Do not reword, reorder, round, summarize or skip any line, and do not decide the orchestrator's state yourself from any tool result.** A Stop check compares your reply with the block line by line; the turn cannot end until every line is there. The `orchestrator=` value is the `--json` `"orchestrator"` value.

**If the output above is empty or has no `<!-- forge-required: status v1 -->` block (the step did not run), print exactly `◌ **Forge status unavailable** — the status step did not run` instead, and use `"orchestrator": "unavailable"` in `--json`. Never decide the state from tool results instead. Never estimate a health score.**

## After the report (optional sections)

Add these only after the block, never in place of any part of it:

1. **Orchestrator metrics** (only when `orchestrator=connected`): call `forge_get_state`, `forge_get_tasks`, `forge_get_health` and `forge_check_drift` in parallel and output `## Orchestrator metrics` with a `| Metric | Value |` table of Tasks, Locks, Knowledge and Drift. For any other value, do not call them: the computed line stands, whatever a tool says. Do not show raw error messages.
2. **Build:** only for the detected project type. If `tsconfig.json` exists, run `npx tsc --noEmit 2>&1 | tail -5`; if `Cargo.toml` exists, `cargo check 2>&1 | tail -5`; otherwise skip it. Never run `npx tsc` without a `tsconfig.json`. Output `## Build` with a `| Check | Status |` table.
3. **Recovery:** if the Git table shows staged, modified or untracked files, output `## Recovery Needed` with a table of those files (`git status --porcelain`) and their status.
4. **Next actions:** if `AskUserQuestion` is available, offer up to 4 next actions (for example: commit changes, add tests, run `/nxtg-forge:gap-analysis`, plan a feature with `/nxtg-forge:feature`, initialize with `/nxtg-forge:init`), and run the one the user picks. If it is not available (a non-interactive run such as `claude -p`), skip this step. The menu never replaces the report.

## Stage line

The report's stage line is this line, read from this file by the script (CI checks it against the repo's `STAGE` file):

**Stage: Public preview.** Forge is public: anyone may install and use it. Its maturity is below alpha (pre-alpha): no SLA, and interfaces may change without notice.

## What the report counts

### 8. Hook Status

The Tooling row counts the distinct hook scripts wired in the plugin's `hooks/hooks.json` and their registrations (one script can be registered for several events or tools). The plugin description's hooks count is the registrations. They run automatically and do NOT require `.claude/settings.json`. The hooks are:
- **PreToolUse (Bash)**: `security-command-guard.sh` — blocks dangerous commands
- **PreToolUse (Read/Write/Edit/NotebookEdit)**: `security-secret-shield.sh` — blocks access to secrets and credentials
- **PreToolUse (Write/Edit/NotebookEdit)**: `security-injection-guard.sh` — blocks eval/exec code injection
- **PreToolUse (Write/Edit/NotebookEdit)**: `security-sql-guard.sh` — blocks SQL string concatenation
- **PostToolUse (Write/Edit/NotebookEdit)**: `security-semgrep-scan.sh` — Semgrep scan after each write
- **UserPromptSubmit**: `pre-task.sh` — sync governance state, initialize context
- **Stop**: `ceo-loop-stop.sh` — CEO-LOOP ORBIT continuation between iterations
- **Stop**: `post-task.sh` — quality checks on completed work
- **Stop**: `audit-root-cleanliness.sh` — flag unnecessary root files
- **Stop**: `smoke-test-reminder.sh` — remind to test after server/test changes
- **Stop**: `required-output.sh` — refuses to end a `/nxtg-forge:status`, `/nxtg-forge:gap-analysis` or `/nxtg-forge:feature` turn until its required output is there
- **PostToolUse (Write)**: `enforce-file-placement.sh` — enforce file organization
- **PostToolUse (Edit/Write)**: `governance-check.sh` — advisory code quality check
- **PreToolUse / Stop / UserPromptSubmit**: `task-enforce.sh` — enforced task (`/nxtg-forge:task`): refuses edits to existing tests, blocks stopping until the test command passes; a no-op when no task is active

Report: the Tooling table in the block.

## Parse Arguments

If `$ARGUMENTS` contains:
- `--json`: Output the report's data as a JSON object instead of the block (skip the interactive menu). Take every value from the block; do not gather it again. Include `"stage": "Public preview"` at the top level. Include `"orchestrator"` set to the computed `orchestrator=` value (`connected`, `not_initialized`, `not_installed` or `error`, or `unavailable` when the step did not run), and `"health": null` when the Health section says "Not scored".
- `--git`: Show only git section with more detail (full log, diff stats)
- `--tests`: Show only test section with full test output
- `--governance`: Show only governance section with full sentinel log

## Error Handling

The script maps every failure to a fixed line in the block (for example the "Not scored" Health line), so the block is always complete. Print it as it is.
