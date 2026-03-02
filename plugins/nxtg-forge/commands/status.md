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

Agents are loaded from the Forge plugin (22 built-in). No need to check `.claude/agents/` — the plugin provides them automatically.

Report: **Agents: 22 available (from Forge plugin)**

### 6. Command Inventory

Commands are loaded from the Forge plugin (21 built-in). No need to check `.claude/commands/` — the plugin provides them automatically.

Report: **Commands: 21 available (from Forge plugin)**

### 7. Build Status

Only run build checks relevant to the detected project type:
- **If `tsconfig.json` exists**: run `npx tsc --noEmit 2>&1 | tail -5`
- **If `Cargo.toml` exists**: run `cargo check 2>&1 | tail -5`
- **If `pyproject.toml` or `setup.py` exists**: run `python -m py_compile` on a sample file
- **Otherwise**: skip the build check and report "No build system detected" in the Build section

IMPORTANT: Do NOT run `npx tsc` if there is no `tsconfig.json`. It will produce ugly errors on non-TypeScript projects.

### 8. Hook Status

Hooks are loaded from the Forge plugin (6 built-in). They are defined in the plugin's `hooks/hooks.json` and run automatically — they do NOT require `.claude/settings.json`.

The 6 hooks are:
- **UserPromptSubmit**: `pre-task.sh` — sync governance state, initialize context
- **Stop**: `post-task.sh` — quality checks on completed work
- **Stop**: `audit-root-cleanliness.sh` — flag unnecessary root files
- **Stop**: `smoke-test-reminder.sh` — remind to test after server/test changes
- **PostToolUse (Write)**: `enforce-file-placement.sh` — enforce file organization
- **PostToolUse (Edit/Write)**: `governance-check.sh` — advisory code quality check

Report: **Hooks: 6 active (from Forge plugin)**

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

**10. Tooling section:** Output `## Tooling` then `| Category | Count | Source |` table for Agents (22, Forge plugin), Commands (21, Forge plugin), Hooks (6, Forge plugin).

**11. Recovery section (conditional):** If git has uncommitted changes (modified or untracked files from Step 2), output `## Recovery Needed` with a table of uncommitted files and their status.

**12. Interactive menu:** After ALL output is complete, use `AskUserQuestion` to present the user with next actions. Choose the best 3 options based on the health data gathered:

- If health score is low on tests → include "Add tests to boost health"
- If there are uncommitted changes → include "Commit changes"
- If governance is not initialized → include "Initialize governance"
- Always include "Run gap analysis" as a safe default
- Always include "Plan a feature" as a creative option

Present exactly 4 options via AskUserQuestion (the tool automatically adds an "Other" free-text option):

Example options (adapt based on actual health data):
- **Commit changes** (description: "Stage and commit your current work")
- **Add tests** (description: "Generate tests to boost your health score from {grade} to {next_grade}")
- **Run gap analysis** (description: "Deep dive into testing, docs, security, and architecture gaps")
- **Plan a feature** (description: "Design and build a new feature with agent orchestration")

**13. Handle the selection:**
- If "Commit changes" → run the `/commit` skill
- If "Add tests" → run `/forge:feature "Add comprehensive tests for the project"`
- If "Run gap analysis" → run `/forge:gap-analysis`
- If "Plan a feature" → run `/forge:feature`
- If "Initialize governance" → run `/forge:init`
- If user types something custom → treat it as a new task and proceed

CRITICAL REMINDERS:
- Every `##` header triggers color rendering in the TUI — do NOT skip the `##`
- Progress bars (`████░░░░`) inside table cells make health scores visual and scannable
- The `⚡` in the H1 title adds visual identity
- Tables auto-size to content — never pad with spaces
- The AskUserQuestion at the end turns status from a dead-end into a launchpad

## Parse Arguments

If `$ARGUMENTS` contains:
- `--json`: Output all gathered data as a JSON object instead of formatted text (skip the interactive menu)
- `--git`: Show only git section with more detail (full log, diff stats)
- `--tests`: Show only test section with full test output
- `--governance`: Show only governance section with full sentinel log

## Error Handling

If any data source is unavailable, show "N/A" for that section rather than failing.
Always show whatever data IS available.
