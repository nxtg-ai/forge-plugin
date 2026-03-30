# /forge:status-enhanced

> Deep project dashboard with code metrics, commit heatmaps, dependency audits, and weighted health scoring across four dimensions.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Governance |
| **Syntax** | `/forge:status-enhanced` |

---

## What It Does

`/forge:status-enhanced` is the heavyweight sibling of `/forge:status`. While the standard status command gives you a quick overview, the enhanced version runs a full seven-source analysis: complete git history with a 7-day commit activity heatmap, full test suite execution with verbose output, TypeScript compilation check, security audit via `npm audit`, source code metrics (lines of code, file counts, `as any` casts), dependency health (outdated packages, prod vs dev counts), and orchestrator data (task board, knowledge base, drift detection).

The health score uses a 100-point weighted system across four equally weighted dimensions: Tests (25 points based on pass rate), Types (25 points minus deductions per error and `as any` cast), Security (25 points minus deductions per vulnerability by severity), and Quality (25 points minus deductions for console statements and TODOs). This gives you a single number that tracks project trajectory over time.

Without this command, building the same picture would require running your test suite, type checker, and security auditor separately, counting code metrics manually, and checking `npm outdated` -- then doing the mental math to weight the results. The enhanced dashboard does all of this and ends with prioritized recommendations based on your lowest-scoring dimension.

## Syntax & Options

```
/forge:status-enhanced
```

This command takes no arguments. It always runs the full analysis.

## When to Use It

- **Weekly health review**: Run it once a week to track trends in code quality, test coverage, and dependency health.
- **Sprint retrospective**: Generate a comprehensive snapshot of where the project stands at sprint boundaries.
- **Before a major refactor**: Establish a baseline so you can measure the impact of architectural changes.

For quick daily checks, use `/forge:status` instead. For targeted deep dives into a specific dimension, use `/forge:gap-analysis --scope testing` or `/forge:optimize --scope deps`.

## Examples

### Example 1: Full Enhanced Dashboard

```
/forge:status-enhanced
```

Produces output covering Project info, Health Score (with dimension breakdown), Git Activity (with 7-day heatmap), Tests (full suite results), TypeScript status, Security vulnerabilities, Governance state, and Orchestrator connection. Ends with three prioritized recommendations.

### Example 2: Identifying Quality Trends

```
/forge:status-enhanced
```

The Git Activity section shows a 7-day commit heatmap:

```
GIT ACTIVITY (last 7 days)
  Commits: 23
  2026-03-29: 5 ███████████
  2026-03-28: 8 █████████████████
  2026-03-27: 3 ██████
  2026-03-26: 0
  2026-03-25: 2 ████
  2026-03-24: 4 ████████
  2026-03-23: 1 ██
```

## Power Use Cases

Run `/forge:status-enhanced` before and after a dependency upgrade cycle to compare outdated package counts, vulnerability counts, and quality scores. The before/after comparison gives clear evidence of whether the upgrade improved or regressed project health.

Combine with `/forge:report` to capture the enhanced dashboard as part of a session activity report for team visibility.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:status** | Use standard status for quick checks, enhanced for deep reviews |
| **/forge:optimize** | Enhanced status identifies the problems; optimize provides fix plans |
| **/forge:gap-analysis** | Similar depth but gap-analysis is fix-oriented; enhanced status is metric-oriented |
| **/forge:report** | Capture the enhanced snapshot in a session report |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full enhanced dashboard with code metrics, heatmap, dependency audit, and health scoring |
| **L2 Pro Builder** | Orchestrator section adds task board, knowledge base size, health dimensions, and drift status |
| **L3 Ship Lord** | Metrics feed into the forge-ui dashboard for historical trend visualization |

## Tips & Gotchas

- This command runs the full test suite and type checker, so expect it to take 15-60 seconds depending on project size.
- The health score formula is deterministic: Tests = 25 * (passing/total), Types = 25 - 5*errors - 1*anyCasts, Security = 25 - 10*critical - 5*high - 2*moderate, Quality = 25 - consoleLogs - TODOs/5. All minimums are 0.
- If a data source fails (e.g., no test runner configured), that dimension shows "N/A" and the score is calculated from available dimensions.
- The commit heatmap uses `git log` date filtering, which may behave differently across timezones.

---

*See also: [status](../commands/status.md) | [gap-analysis](../commands/gap-analysis.md) | [optimize](../commands/optimize.md)*
