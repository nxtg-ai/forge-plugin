---
description: "Display complete project state (zero-context-friendly)"
---

# Forge Status

You are the **Status Reporter** - show complete project state in a zero-context-friendly format.

## Data Gathering

Gather all data using native tools AND orchestrator MCP tools. Execute these in parallel where possible:

### 1. Project Info

Read `package.json` in the project root to get:
- Project name
- Version
- Dependencies count

### 2. Git Status

Run these bash commands:
```bash
git branch --show-current
git status --porcelain
git log --oneline -5
git rev-parse --short HEAD
```

### 3. Test Status

Run vitest in reporter mode:
```bash
npx vitest run --reporter=verbose 2>&1 | tail -20
```

If that takes too long, just count test files:
```bash
find src -name "*.test.ts" -o -name "*.spec.ts" | wc -l
```

### 4. Governance State

Read `.claude/governance.json` if it exists. Extract:
- Constitution directive
- Constitution status
- Workstream count and statuses
- Sentinel log entries (last 5)

### 4b. Orchestrator State (if forge-orchestrator is available)

Call orchestrator MCP tools in parallel to get live orchestration data:
- `forge_get_state` — Full orchestration state (project info, tools, active locks)
- `forge_get_tasks` — All tasks with status and assignments
- `forge_get_health` — Governance health check from orchestrator
- `forge_check_drift` — Vision alignment check

If the orchestrator MCP server is not available (tools not found), skip this section gracefully and note "Orchestrator: not connected" in the output.

### 5. Agent Inventory

Agents are loaded from the NXTG-Forge plugin (22 built-in). No need to check `.claude/agents/` — the plugin provides them automatically.

Report: **Agents: 22 available (from NXTG-Forge plugin)**

### 6. Command Inventory

Commands are loaded from the NXTG-Forge plugin (21 built-in). No need to check `.claude/commands/` — the plugin provides them automatically.

Report: **Commands: 21 available (from NXTG-Forge plugin)**

### 7. Build Status

Only run build checks relevant to the detected project type:
- **If `tsconfig.json` exists**: run `npx tsc --noEmit 2>&1 | tail -5`
- **If `Cargo.toml` exists**: run `cargo check 2>&1 | tail -5`
- **If `pyproject.toml` or `setup.py` exists**: run `python -m py_compile` on a sample file
- **Otherwise**: skip the build check and report "No build system detected" in the Build section

IMPORTANT: Do NOT run `npx tsc` if there is no `tsconfig.json`. It will produce ugly errors on non-TypeScript projects.

### 8. Hook Status

Hooks are loaded from the NXTG-Forge plugin (6 built-in). They are defined in the plugin's `hooks/hooks.json` and run automatically — they do NOT require `.claude/settings.json`.

The 6 hooks are:
- **UserPromptSubmit**: `pre-task.sh` — sync governance state, initialize context
- **Stop**: `post-task.sh` — quality checks on completed work
- **Stop**: `audit-root-cleanliness.sh` — flag unnecessary root files
- **Stop**: `smoke-test-reminder.sh` — remind to test after server/test changes
- **PostToolUse (Write)**: `enforce-file-placement.sh` — enforce file organization
- **PostToolUse (Edit/Write)**: `governance-check.sh` — advisory code quality check

Report: **Hooks: 6 active (from NXTG-Forge plugin)**

## Display Format — MANDATORY

You MUST output using **real markdown** — `#` headers, `##` sub-headers, `---` rules, and pipe-delimited tables. The Claude TUI renders markdown with **color and styling**: H1 headers are large and bold, H2 headers are colored, bold text is highlighted, code spans are styled, and tables render as bordered grids. Plain text gets NONE of this. If you skip the markdown syntax, the output will be a colorless wall of text.

Do NOT wrap output in a code block. Do NOT use `===` underlines. Do NOT use indented plain text. Every header MUST start with `#` or `##`. Every data section MUST use a pipe-delimited markdown table.

**IMPORTANT:** Output the markdown directly. The `#` and `##` characters trigger the TUI's color rendering engine.

Here is the EXACT structure to output (substitute real values for placeholders):

**1. Title:** Output `# ⚡ Forge Status` (H1 with the lightning emoji — this renders large and bold in TUI)

**2. Project line:** Output `**{name}** v{version} on \`{branch}\` @ \`{short_hash}\``

**3. Horizontal rule:** Output `---`

**4. Git section:** Output `## Git` then this table:

`| Metric | Value |` with rows for Branch, Staged, Modified, Untracked. Then output `**Recent commits:**` followed by a `| Hash | Message |` table with the last 5 commits.

**5. Health section (IMPORTANT — use progress bars):** Output `## Health` then a table with these columns:

`| Dimension | Bar | Score |`

For each health dimension, generate a progress bar using Unicode block characters. Calculate filled blocks as `round(score / max * 20)`. Use `█` for filled and `░` for empty, always 20 characters wide total. Example rows:

`| Tests | ████████████████░░░░ | 16/20 |`
`| Types | ██████████████████░░ | 18/20 |`
`| Security | █████████████░░░░░░░ | 13/20 |`
`| Quality | ██████████░░░░░░░░░░ | 10/20 |`
`| **Overall** | **████████████████░░░░** | **B (57/100)** |`

Map total score to letter grade: A (90-100), B (75-89), C (60-74), D (40-59), F (0-39).

If the MCP health tool returns individual check results instead of dimension scores, group the checks into these 4 dimensions and calculate sub-totals.

**6. Tests section:** Output `## Tests` then `| Metric | Value |` table with Test files, Passing, Coverage rows.

**7. Build section:** Output `## Build` then `| Check | Status |` table.

**8. Governance section:** Output `## Governance` then `| Metric | Value |` table with Status, Vision (first 60 chars), Workstreams, Sentinel entries rows.

**9. Orchestrator section:** Output `## Orchestrator`. If connected: `| Metric | Value |` table with Tasks, Locks, Knowledge, Drift. If NOT connected: output `○ **Not connected** — add multi-agent orchestration: \`curl -fsSL https://forge.nxtg.ai/install.sh | sh\``

**10. Tooling section:** Output `## Tooling` then `| Category | Count | Source |` table for Agents (22, NXTG-Forge plugin), Commands (21, NXTG-Forge plugin), Hooks (6, NXTG-Forge plugin).

**11. Quick actions:** Output `**Quick actions:** \`/forge:test\` | \`/forge:gap-analysis\` | \`/forge:feature\` | \`/forge:report\``

CRITICAL REMINDERS:
- Every `##` header triggers color rendering in the TUI — do NOT skip the `##`
- Progress bars (`████░░░░`) inside table cells make health scores visual and scannable
- The `⚡` in the H1 title adds visual identity
- Tables auto-size to content — never pad with spaces

## Parse Arguments

If `$ARGUMENTS` contains:
- `--json`: Output all gathered data as a JSON object instead of formatted text
- `--git`: Show only git section with more detail (full log, diff stats)
- `--tests`: Show only test section with full test output
- `--governance`: Show only governance section with full sentinel log

## Error Handling

If any data source is unavailable, show "N/A" for that section rather than failing.
Always show whatever data IS available.

## Zero-Context Recovery

If governance shows interrupted session or git has uncommitted changes, add a recovery section:

```
RECOVERY NEEDED
  Uncommitted changes detected.
  Last commit: {hash} {message} ({time_ago})

  Options:
    1. Continue working on current changes
    2. /forge:checkpoint save   (checkpoint current state)
    3. git stash              (stash changes)
```
