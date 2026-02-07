---
description: "Enhanced status with detailed dashboard and metrics"
---

# NXTG-Forge Enhanced Status Dashboard

You are the **Dashboard Reporter** - show a comprehensive, detailed project dashboard with metrics and recommendations.

This is the enhanced version of `/frg-status` with deeper analysis.

## Data Gathering

Gather ALL data using native tools in parallel:

### 1. Complete Git Analysis
```bash
# Branch info
git branch --show-current
git log --oneline -20
git shortlog -sn --since="30 days ago" 2>/dev/null

# Change stats
git diff --stat main...HEAD 2>/dev/null
git diff --shortstat HEAD~10..HEAD 2>/dev/null

# Activity heatmap (commits per day last 7 days)
for i in $(seq 0 6); do
  date_str=$(date -d "$i days ago" +%Y-%m-%d 2>/dev/null || date -v-${i}d +%Y-%m-%d)
  count=$(git log --oneline --after="$date_str 00:00" --before="$date_str 23:59" 2>/dev/null | wc -l)
  echo "$date_str: $count"
done
```

### 2. Full Test Analysis
```bash
npx vitest run --reporter=verbose 2>&1
```

### 3. TypeScript Health
```bash
npx tsc --noEmit 2>&1 | tail -20
```

### 4. Security
```bash
npm audit --json 2>/dev/null | head -50
```

### 5. Code Metrics
```bash
# Total lines of code
find src -name "*.ts" -not -name "*.test.ts" -not -path "*/__tests__/*" | xargs wc -l 2>/dev/null | tail -1

# File count
find src -name "*.ts" -not -name "*.test.ts" -not -path "*/__tests__/*" | wc -l

# Test file count
find src -name "*.test.ts" -o -name "*.spec.ts" | wc -l

# Type safety
grep -rn "as any" src/ --include="*.ts" | grep -v test | grep -v __tests__ | wc -l
```

### 6. Governance & Agents

Read `.claude/governance.json` and count `.claude/agents/*.md`.

### 7. Dependencies
```bash
npm outdated 2>/dev/null | head -20
jq '.dependencies | length' package.json 2>/dev/null
jq '.devDependencies | length' package.json 2>/dev/null
```

## Display Enhanced Dashboard

```
NXTG-FORGE PROJECT DASHBOARD
===============================
Generated: {timestamp}

PROJECT
  Name: {name} v{version}
  Branch: {branch} ({commit_hash})
  Lines of code: {loc} across {file_count} files

HEALTH SCORE: {calculated_score}/100
  Tests:    {test_score}/25  ({pass_count}/{total_count} passing)
  Types:    {type_score}/25  ({error_count} TS errors, {any_count} 'as any')
  Security: {sec_score}/25   ({vuln_count} vulnerabilities)
  Quality:  {qual_score}/25  ({console_count} console.logs, {todo_count} TODOs)

GIT ACTIVITY (last 7 days)
  Commits: {total_commits}
  {commit_heatmap_visualization}

  Recent:
    {hash} {message} ({time})
    {hash} {message} ({time})
    {hash} {message} ({time})

TESTS
  Suites: {suite_count}
  Tests:  {pass}/{total} passing ({duration})
  Coverage: {file_coverage}% file coverage

TYPESCRIPT
  Errors: {error_count}
  Warnings: {warning_count}
  Status: {CLEAN / {error_count} errors}

SECURITY
  Vulnerabilities: {critical} critical, {high} high, {moderate} moderate
  Dependencies: {dep_count} prod, {dev_dep_count} dev
  Outdated: {outdated_count}

GOVERNANCE
  Status: {status}
  Workstreams: {active}/{total}
  Agents: {agent_count} available
  Commands: {command_count} available

RECOMMENDATIONS
  1. {based on lowest score dimension}
  2. {based on second lowest}
  3. {based on third lowest}

---
Quick Actions:
  /frg-test          Run tests
  /frg-gap-analysis  Deep analysis
  /frg-optimize      Optimization scan
  /frg-report        Activity report
```

## Health Score Calculation

Calculate a 0-100 score:
- **Tests (25 pts)**: 25 * (passing / total). 0 if no tests.
- **Types (25 pts)**: 25 if 0 TS errors, -5 per error, -1 per 'as any'. Min 0.
- **Security (25 pts)**: 25 - (critical*10 + high*5 + moderate*2). Min 0.
- **Quality (25 pts)**: 25 - (console.logs + TODOs/5). Min 0.

## Error Handling

If any data source fails, show "N/A" and continue with available data.
Always calculate the health score from available dimensions.
