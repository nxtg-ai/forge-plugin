---
description: "Display complete project state (zero-context-friendly)"
disable-model-invocation: true
argument-hint: "[--json] [--verbose]"
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

Forge is set up in this project when either init has run: `/nxtg-forge:init` writes `.claude/governance.json`, and `forge init` writes `.forge/governance.json`. Read `.claude/governance.json` if it exists, otherwise `.forge/governance.json`. If neither exists, governance is not initialized. Extract:
- Constitution directive
- Constitution status
- Workstream count and statuses
- Sentinel log entries (last 5)

A `.forge/governance.json` from `forge init` holds no project vision, goals or sentinel log. Then say "Initialized by `forge init`; no vision or goals recorded here (`/nxtg-forge:init` adds them)." Never report this project as not initialized, and never invent a directive or vision.

### 4c. Health Score (always available — L1 + L2)

Call the plugin's Node MCP tool `forge_get_governance_health` to get the 0-100 health score, letter grade, and the `checks[]` breakdown. This tool ships with the plugin and is available whether or not the `forge` binary is installed — it does **not** require the orchestrator. Its `checks[]` array (each with a `name` and `points`) drives the **Health** section below, so this call MUST run regardless of orchestrator availability.

If `forge_get_governance_health` is not available (the tool is not found, which is the case when the governance MCP server has no Node.js 20+), or it returns an error, there is **no health score**. Never estimate, infer, or compute one from other data. The Health section then says so (see §5).

### 4b. Orchestrator State (if forge-orchestrator is available)

Call orchestrator MCP tools in parallel to get live orchestration data:
- `forge_get_state` — Full orchestration state (project info, tools, active locks)
- `forge_get_tasks` — All tasks with status and assignments
- `forge_get_health` — Orchestrator's 5-dimension health + **drift** analysis (L2 only, requires the `forge` binary). Feeds the Drift row in the Orchestrator section below.
- `forge_check_drift` — Vision alignment check

The result is one of three states. Do NOT show raw error messages to the user; use the line for the state:

1. **Not installed:** the orchestrator tools are not found. Show
   `○ **Not connected** — add multi-agent orchestration: \`curl -fsSL https://forge.nxtg.ai/install.sh | sh\`, then start a new Claude Code session`
2. **Connected, not initialized here:** the tools exist, but `forge_get_state` (or another orchestrator tool) says this project is not initialized (for example "Forge is not initialized"). The orchestrator IS connected; never call it "Not connected". Show
   `◐ **Connected; not initialized here** — run \`forge init\` in this project`
3. **Connected:** the tools exist and return state. Show the metrics table (§9).

### 5. Agent Inventory

Agents, commands and hooks are loaded from the Forge plugin. Count them in the installed plugin with this command, and use its numbers everywhere this report shows a count. Never use a number written in this file or remembered from elsewhere:

```bash
R="${CLAUDE_PLUGIN_ROOT}"; n() { wc -l | tr -d ' '; }
echo "agents=$(ls "$R"/agents/*.md 2>/dev/null | n) commands=$(ls "$R"/commands/*.md 2>/dev/null | n) skills=$(ls "$R"/skills/*/SKILL.md 2>/dev/null | n) hooks=$(grep -o 'scripts/[A-Za-z0-9_.-]*\.sh' "$R/hooks/hooks.json" 2>/dev/null | sort -u | n) registrations=$(grep -o '"command"[[:space:]]*:' "$R/hooks/hooks.json" 2>/dev/null | n)"
```

No need to check `.claude/agents/`; the plugin provides its agents automatically.

Report: **Agents: {agents} available (from Forge plugin)**

### 6. Command Inventory

Commands are loaded from the Forge plugin; use `commands=` from §5. No need to check `.claude/commands/`.

Report: **Commands: {commands} available (from Forge plugin)**

### 7. Build Status

Only run build checks relevant to the detected project type:
- **If `tsconfig.json` exists**: run `npx tsc --noEmit 2>&1 | tail -5`
- **If `Cargo.toml` exists**: run `cargo check 2>&1 | tail -5`
- **If `pyproject.toml` or `setup.py` exists**: run `python -m py_compile` on a sample file
- **Otherwise**: skip the build check and report "No build system detected" in the Build section

IMPORTANT: Do NOT run `npx tsc` if there is no `tsconfig.json`. It will produce ugly errors on non-TypeScript projects.

### 8. Hook Status

Hooks are loaded from the Forge plugin; use `hooks=` (the distinct hook scripts wired in the plugin's `hooks/hooks.json`) and `registrations=` (their event and tool-matcher entries; one script can be registered several times) from §5. The plugin description's hooks count is `registrations=`. They run automatically and do NOT require `.claude/settings.json`.

The hooks are:
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
- **PostToolUse (Write)**: `enforce-file-placement.sh` — enforce file organization
- **PostToolUse (Edit/Write)**: `governance-check.sh` — advisory code quality check

Report: **Hooks: {hooks} scripts in {registrations} registrations (from Forge plugin)**

## Display Format — MANDATORY

You MUST output using **real markdown** — `#` headers, `##` sub-headers, `---` rules, and pipe-delimited tables. The Claude TUI renders markdown with **color and styling**: H1 headers are large and bold, H2 headers are colored, bold text is highlighted, code spans are styled, and tables render as bordered grids. Plain text gets NONE of this. If you skip the markdown syntax, the output will be a colorless wall of text.

Do NOT wrap output in a code block. Do NOT use `===` underlines. Do NOT use indented plain text. Every header MUST start with `#` or `##`. Every data section MUST use a pipe-delimited markdown table.

**IMPORTANT:** Output the markdown directly. The `#` and `##` characters trigger the TUI's color rendering engine.

Here is the EXACT structure to output (substitute real values for placeholders):

**1. Title:** Output `# ⚡ Forge Status` (H1 with the lightning emoji — this renders large and bold in TUI)

**2. Project line:** Output `**{name}** v{version} on \`{branch}\` @ \`{short_hash}\``

**2b. Stage line:** Output this line verbatim (Forge's release stage, from the repo's `STAGE` file; CI checks they match):

**Stage: Public preview.** Forge is public: anyone may install and use it. Its maturity is below alpha (pre-alpha): no SLA, and interfaces may change without notice.

**3. Horizontal rule:** Output `---`

**4. Git section:** Output `## Git` then this table:

`| Metric | Value |` with rows for Branch, Staged, Modified, Untracked. Then output `**Recent commits:**` followed by a `| Hash | Message |` table with the last 5 commits.

**5. Health section (IMPORTANT — use progress bars):** Output `## Health`. If §4c produced no health result, output only `**Not scored.** Health scoring needs the governance MCP server, which needs Node.js 20 or newer. Install it (https://nodejs.org), then start a new Claude Code session.` and no table, no bars, no grade, and no estimated or partial scores. Otherwise output a table with these columns:

`| Dimension | Bar | Score |`

For each health dimension, generate a progress bar using Unicode block characters. Calculate filled blocks as `round(score / max * 20)`. Use `█` for filled and `░` for empty, always 20 characters wide total.

The health checks from the `forge_get_governance_health` result (§4c, always available) map to these dimensions with their ACTUAL point maximums:

- **Tests** (max 20): "Test Coverage" check
- **Types** (max 10): "Type Safety" check
- **Security** (max 15): "Security" check
- **Docs** (max 20): "README" (10) + "CLAUDE.md" (10)
- **Project** (max 35): "Governance" (15) + "Git Clean" (10) + "File Size" (10)
- **Overall** (max 100): total score with letter grade

Use each check's `points` and its actual maximum from above. Do NOT hardcode all dimensions to /20. Example:

`| Tests | ████████████████░░░░ | 16/20 |`
`| Types | ██████████████████░░ | 8/10 |`
`| Security | ██████████████████░░ | 15/15 |`
`| Docs | ████████████████████ | 20/20 |`
`| Project | ████████████████░░░░ | 30/35 |`
`| **Overall** | **████████████████░░░░** | **B (89/100)** |`

Map total score to letter grade: A (90-100), B (80-89), C (70-79), D (60-69), F (0-59).

Read the individual checks from the MCP health result and group them into these dimensions by check name.

**6. Tests section:** Output `## Tests` then `| Metric | Value |` table with Test files, Passing, Coverage rows.

**7. Build section:** Output `## Build` then `| Check | Status |` table.

**8. Governance section:** Output `## Governance` then `| Metric | Value |` table with Status, Vision (first 60 chars), Workstreams, Sentinel entries rows.

**9. Orchestrator section:** Output `## Orchestrator`, then the line for the §4b state. **Connected:** a `| Metric | Value |` table with Tasks, Locks, Knowledge, Drift. **Connected, not initialized here:** `◐ **Connected; not initialized here** — run \`forge init\` in this project`. **Not installed:** `○ **Not connected** — add multi-agent orchestration: \`curl -fsSL https://forge.nxtg.ai/install.sh | sh\`, then start a new Claude Code session`

**10. Tooling section:** Output `## Tooling` then `| Category | Count | Source |` table for Agents, Commands and Hooks, with the `agents=` and `commands=` counts from §5, Hooks as "{hooks} scripts ({registrations} registrations)", and the source "Forge plugin".

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
- If "Add tests" → run `/nxtg-forge:feature "Add comprehensive tests for the project"`
- If "Run gap analysis" → run `/nxtg-forge:gap-analysis`
- If "Plan a feature" → run `/nxtg-forge:feature`
- If "Initialize governance" → run `/nxtg-forge:init`
- If user types something custom → treat it as a new task and proceed

CRITICAL REMINDERS:
- Every `##` header triggers color rendering in the TUI — do NOT skip the `##`
- Progress bars (`████░░░░`) inside table cells make health scores visual and scannable
- The `⚡` in the H1 title adds visual identity
- Tables auto-size to content — never pad with spaces
- The AskUserQuestion at the end turns status from a dead-end into a launchpad

## Parse Arguments

If `$ARGUMENTS` contains:
- `--json`: Output all gathered data as a JSON object instead of formatted text (skip the interactive menu). Include `"stage": "Public preview"` at the top level. Include `"orchestrator": "connected" | "not_initialized" | "not_installed"`, and `"health": null` when §4c produced no health result.
- `--git`: Show only git section with more detail (full log, diff stats)
- `--tests`: Show only test section with full test output
- `--governance`: Show only governance section with full sentinel log

## Error Handling

If any data source is unavailable, show "N/A" for that section rather than failing.
Always show whatever data IS available.
