# /forge:report

> Generate a comprehensive session activity report from real git history, PR status, test results, governance changes, and checkpoint history.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | State Management |
| **Syntax** | `/forge:report [--brief] [--since <timespec>] [--json] [--branch <name>]` |

---

## What It Does

`/forge:report` builds an activity report from real project data. It pulls commits from git history, calculates lines changed, identifies the most-modified files, checks for open pull requests on the current branch, counts test files, reads governance sentinel log entries, and lists saved checkpoints. The result is a structured report that answers "what happened during this session?" with concrete data rather than memory.

The report works by default on the last 24 hours of activity, or since the current branch diverged from main. You can customize the window with `--since` to generate weekly, sprint, or custom-range reports. The brief mode gives you a one-liner summary; JSON mode gives you machine-readable output for integration with other tools.

Without this command, summarizing a session means scanning git log, counting changes manually, checking PR status separately, and trying to remember what governance decisions were made. `/forge:report` gathers all of this in parallel and presents it in a single document with recommendations for what to do next.

## Syntax & Options

```
/forge:report [--brief] [--since <timespec>] [--json] [--branch <name>]
```

| Option | Description |
|--------|------------|
| `--brief` or `-b` | One-line summary: branch, commit count, files changed, lines, PR status, last commit |
| `--since <timespec>` | Activity since a specific time (e.g., `"8 hours ago"`, `yesterday`, `"7 days ago"`) |
| `--json` | Output all gathered data as a structured JSON object |
| `--branch <name>` | Report on a specific branch instead of the current one |

## When to Use It

- **End of day summary**: Run it before closing your session to capture what was accomplished.
- **Standup preparation**: Use `--brief` to get a quick summary for your daily standup.
- **Sprint retrospective**: Use `--since "14 days ago"` to generate a two-week activity report.

For real-time project state, use `/forge:status`. For deep quality analysis, use `/forge:gap-analysis`.

## Examples

### Example 1: Full Session Report

```
/forge:report
```

```
NXTG-Forge Session Report
============================
Generated: 2026-03-29T17:00:00Z

SESSION OVERVIEW
  Branch: feature/notifications
  Duration: ~6 hours (approx)
  Commits: 8
  Files changed: 12
  Lines: +342 / -89

GIT ACTIVITY
  a1b2c3d Add WebSocket notification handler (2 hours ago)
  d4e5f6g Add notification test suite (3 hours ago)
  h7i8j9k Create notification service (4 hours ago)
  ...

  Files most changed:
    src/services/notification.ts: +156/-0
    src/services/__tests__/notification.test.ts: +98/-0
    src/app.ts: +12/-3

PULL REQUEST
  #42: Add real-time notifications
  URL: https://github.com/org/repo/pull/42
  Status: open
  Checks: passing

RECOMMENDATIONS
  1. Tests are passing -- consider merging the PR
  2. 3 new files lack JSDoc -- run /forge:docs-update --jsdoc
  3. Save a checkpoint before merging: /forge:checkpoint save pre-merge
```

### Example 2: Brief Summary

```
/forge:report --brief
```

```
NXTG-Forge Session Summary
============================
Branch: feature/notifications
Commits: 8 | Files changed: 12 | +342/-89
Tests: 15 test files
PR: #42 (open, checks passing)
Last commit: a1b2c3d Add WebSocket notification handler (2 hours ago)
```

### Example 3: Weekly Report

```
/forge:report --since "7 days ago"
```

Generates a report covering the full week's activity.

## Power Use Cases

Generate JSON reports at the end of each session (`--json`) and store them as checkpoints. Over time, these create a machine-readable history of project progress that can feed into dashboards or team reports.

Use `--branch main` to see what landed on main recently, even when you are working on a feature branch.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:status** | Status shows current state; report shows how you got here |
| **/forge:checkpoint** | Checkpoint history appears in the report |
| **/forge:gap-analysis** | Recommendations in the report may suggest running gap analysis |
| **/forge:test** | Test file counts appear in the report; run test for full results |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full session reports with git activity, PR status, tests, governance, and recommendations |
| **L2 Pro Builder** | Orchestrator task completion history included in the report |
| **L3 Ship Lord** | Session reports viewable in the forge-ui dashboard activity timeline |

## Tips & Gotchas

- The default time window is 24 hours. If you see "No commits found," try `--since "7 days ago"`.
- PR detection uses `gh pr list` which requires the GitHub CLI to be authenticated.
- The "Duration" field is approximate -- it is calculated from the time between the first and last commit in the window.
- Recommendations are contextual: they change based on what the report finds (e.g., if tests are failing, it suggests fixing them; if a PR is open, it suggests merging).

---

*See also: [status](../commands/status.md) | [checkpoint](../commands/checkpoint.md) | [gap-analysis](../commands/gap-analysis.md)*
