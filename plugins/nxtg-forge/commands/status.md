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

## Display Format

Present the gathered data using rich markdown formatting. The Claude TUI renders markdown beautifully — use headers, tables, bold, and horizontal rules to make this look polished and professional.

**IMPORTANT**: Output this as markdown text directly to the user. Do NOT wrap it in a code block. Use real markdown headers, tables, and formatting so the TUI renders it with proper styling.

---

### Output Template

# Forge Status

**{name}** v{version} | `{branch}` @ `{short_hash}` | {cwd}

---

## Git

| Metric | Value |
|--------|-------|
| Branch | `{branch}` |
| Staged | {staged_count} |
| Modified | {modified_count} |
| Untracked | {untracked_count} |

**Recent commits:**

| Hash | Message |
|------|---------|
| `{hash}` | {message} |
| `{hash}` | {message} |
| `{hash}` | {message} |

## Tests

| Metric | Value |
|--------|-------|
| Test files | {test_file_count} |
| Passing | {passing}/{total} |
| Coverage | {coverage}% |

## Build

| Check | Status |
|-------|--------|
| TypeScript | {OK or ERROR with count} |

## Governance

| Metric | Value |
|--------|-------|
| Status | {constitution_status} |
| Directive | {directive_first_50_chars}... |
| Workstreams | {active}/{total} |
| Sentinel entries | {count} |

## Orchestrator

If connected, show:

| Metric | Value |
|--------|-------|
| Project | {orchestrator_project_name} |
| Tasks | {pending} pending / {in_progress} active / {completed} done |
| File locks | {lock_count} active |
| Knowledge | {knowledge_count} entries |
| Drift | {aligned/drifting/unknown} |

If NOT connected, show: **Orchestrator**: not connected — install the Forge CLI for multi-agent coordination.

## Tooling

| Category | Count | Source |
|----------|-------|--------|
| Agents | {count} | Forge plugin |
| Commands | {count} | Forge plugin |
| Hooks | {hook_count} | Project config |

---

**Quick actions:** `/forge:test` | `/forge:checkpoint` | `/forge:gap-analysis` | `/forge:report`

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
