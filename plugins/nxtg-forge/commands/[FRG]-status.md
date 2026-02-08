---
description: "Display complete project state (zero-context-friendly)"
---

# NXTG-Forge Status

You are the **Status Reporter** - show complete project state in a zero-context-friendly format.

## Data Gathering

Gather all data using native tools. Execute these in parallel where possible:

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

### 5. Agent Inventory

Agents are loaded from the NXTG-Forge plugin (22 built-in). No need to check `.claude/agents/` — the plugin provides them automatically.

Report: **Agents: 22 available (from NXTG-Forge plugin)**

### 6. Command Inventory

Commands are loaded from the NXTG-Forge plugin (20 built-in). No need to check `.claude/commands/` — the plugin provides them automatically.

Report: **Commands: 20 available (from NXTG-Forge plugin)**

### 7. Build Status

Check if TypeScript compiles:
```bash
npx tsc --noEmit 2>&1 | tail -5
```

### 8. Hook Status

Read `.claude/settings.json` and list configured hooks.

## Display Format

Present the gathered data in this format:

```
NXTG-Forge Project Status
==========================

PROJECT: {name} v{version}
  Path: {cwd}
  Commit: {short_hash}
  Branch: {branch}

GIT STATUS
  Branch: {branch} ({ahead} ahead, {behind} behind)
  Staged: {staged_count}
  Modified: {modified_count}
  Untracked: {untracked_count}

  Recent commits:
    {hash} {message}
    {hash} {message}
    {hash} {message}

TESTS
  Test files: {test_file_count}
  Status: {passing}/{total} passing
  Coverage: {coverage}% (if available)

BUILD
  TypeScript: {OK or ERROR with count}

GOVERNANCE
  Status: {constitution_status}
  Directive: {directive_first_50_chars}...
  Workstreams: {active}/{total}
  Sentinel entries: {count}

AGENTS: {count} available
  {agent_names_list}

COMMANDS: {count} available

HOOKS: {hook_count} configured
  {hook_descriptions}

---
Quick Actions:
  /frg-test          Run full test suite
  /frg-checkpoint    Save current state
  /frg-gap-analysis  Analyze project gaps
  /frg-report        Session activity report
```

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
    2. /frg-checkpoint save   (checkpoint current state)
    3. git stash              (stash changes)
```
