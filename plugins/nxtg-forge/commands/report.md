---
description: "Display comprehensive session activity report"
---

# NXTG-Forge Session Report

You are the **Session Reporter** - generate a comprehensive activity report from real git history and project state.

## Parse Arguments

Arguments received: `$ARGUMENTS`

Options:
- No arguments: Full report for current session/branch
- `--brief` or `-b`: Brief summary only
- `--since <timespec>`: Activity since time (e.g., `--since "8 hours ago"`, `--since yesterday`)
- `--json`: Output as JSON
- `--branch <name>`: Report on specific branch (default: current)

## Data Gathering

Gather all data using native tools. Execute these in parallel where possible:

### 1. Git Activity

```bash
# Current branch
git branch --show-current

# Commits (default: last 24 hours or since branch diverged from main)
git log --oneline --since="24 hours ago" 2>/dev/null || git log --oneline -20

# Detailed commit info
git log --format="%h %s (%cr) <%an>" --since="24 hours ago" 2>/dev/null || git log --format="%h %s (%cr) <%an>" -20

# Files changed
git diff --stat main...HEAD 2>/dev/null || git diff --stat HEAD~5..HEAD

# Insertions/deletions
git diff --shortstat main...HEAD 2>/dev/null || git diff --shortstat HEAD~5..HEAD
```

### 2. PR Status (if applicable)

```bash
# Check for open PRs from current branch
gh pr list --head "$(git branch --show-current)" --json number,title,state,url,checks 2>/dev/null
```

### 3. Test Status

```bash
# Quick test count
find src -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | wc -l
```

### 4. Governance Changes

Read `.claude/governance.json` and check the sentinel log for recent entries.

### 5. Checkpoint History

```bash
ls -la .claude/checkpoints/*.json 2>/dev/null
```

## Display Format

### Brief Summary (`--brief`)

```
NXTG-Forge Session Summary
============================
Branch: {branch}
Commits: {count} | Files changed: {count} | +{insertions}/-{deletions}
Tests: {test_file_count} test files
PR: {pr_status or "None"}
Last commit: {hash} {message} ({time_ago})
```

### Full Report (default)

```
NXTG-Forge Session Report
============================
Generated: {timestamp}

SESSION OVERVIEW
  Branch: {branch}
  Duration: {time_since_first_commit} (approx)
  Commits: {commit_count}
  Files changed: {files_changed}
  Lines: +{insertions} / -{deletions}

GIT ACTIVITY
  {hash} {message} ({time_ago})
  {hash} {message} ({time_ago})
  {hash} {message} ({time_ago})
  ...

  Files most changed:
    {file}: +{ins}/-{del}
    {file}: +{ins}/-{del}
    {file}: +{ins}/-{del}

{if PR exists}
PULL REQUEST
  #{number}: {title}
  URL: {url}
  Status: {state}
  Checks: {check_status}
{/if}

TESTS
  Test files: {count}
  {If test results available, show pass/fail summary}

GOVERNANCE
  Status: {constitution_status}
  Sentinel entries: {recent_count} recent
  {List last 3 sentinel entries if available}

{if checkpoints exist}
CHECKPOINTS
  {checkpoint_id} - {timestamp}
  ...
{/if}

RECOMMENDATIONS
  Based on the session activity:
  1. {recommendation based on what was done}
  2. {recommendation based on gaps found}
  3. {recommendation for next steps}

---
Next steps:
  /frg-status       Check current state
  /frg-test         Run test suite
  /frg-checkpoint   Save checkpoint
  /frg-gap-analysis Identify remaining gaps
```

### JSON Output (`--json`)

If `--json` is specified, output all gathered data as a structured JSON object:

```json
{
  "branch": "...",
  "commits": [...],
  "filesChanged": [...],
  "stats": { "insertions": 0, "deletions": 0 },
  "pullRequest": { ... },
  "tests": { "fileCount": 0 },
  "governance": { ... },
  "checkpoints": [...],
  "generatedAt": "..."
}
```

## Error Handling

If git is not available or not a git repo:
```
Not a git repository. Session report requires git history.
```

If no commits found in timeframe:
```
No commits found in the specified timeframe.
Try: /frg-report --since "7 days ago"
```
