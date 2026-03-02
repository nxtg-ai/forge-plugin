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

Check if TypeScript compiles:
```bash
npx tsc --noEmit 2>&1 | tail -5
```

### 8. Hook Status

Read `.claude/settings.json` and list configured hooks.

## Display Format — MANDATORY

You MUST format your output using markdown tables and headers. Do NOT use plain text with indentation. Do NOT use `===` underlines. The Claude TUI renders markdown beautifully — tables render as styled grids, headers render as bold colored text, and horizontal rules render as separators.

Output your response using EXACTLY this structure (replace placeholders with real data):

**Line 1 — Title as H1 header:**
Write a markdown H1: `# Forge Status`

**Line 2 — Project summary as bold + code spans:**
Write: `**{name}** v{version} on \`{branch}\` @ \`{short_hash}\``

**Then a horizontal rule:** `---`

**Section: Git — use a markdown table:**
Write a `## Git` header, then a markdown table with columns `| Metric | Value |` containing Branch, Staged, Modified, Untracked rows. Then write `**Recent commits:**` followed by another table with `| Hash | Message |` columns.

**Section: Tests — use a markdown table:**
Write a `## Tests` header, then a table with Test files, Passing, Coverage rows. If no test runner, show "No test runner detected" in the value.

**Section: Build — use a markdown table:**
Write a `## Build` header, then a table with build check results.

**Section: Governance — use a markdown table:**
Write a `## Governance` header, then a table with Status, Vision (first 60 chars), Workstreams, Sentinel entries rows.

**Section: Orchestrator — one line:**
If connected: write `## Orchestrator` then a table with Tasks, Locks, Knowledge, Drift rows.
If NOT connected: write `**Orchestrator:** not connected`

**Section: Tooling — use a markdown table:**
Write a `## Tooling` header, then a table with `| Category | Count | Source |` columns for Agents, Commands, Hooks.

**Final line — quick actions as bold inline:**
Write: `**Quick actions:** \`/forge:test\` | \`/forge:gap-analysis\` | \`/forge:feature\` | \`/forge:report\``

CRITICAL: Every section MUST use a markdown table (pipe-delimited with header row and separator row). Do NOT fall back to plain-text indented format. Tables are what make this look professional in the Claude TUI.

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
