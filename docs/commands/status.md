# /forge:status

> Display complete project health in a single styled dashboard -- git state, health scores with progress bars, tests, governance, orchestrator, and tooling inventory.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Governance |
| **Syntax** | `/forge:status [--json] [--git] [--tests] [--governance] [--verbose]` |

---

## What It Does

`/forge:status` is the zero-context-friendly command you run at the start of every session. It gathers data from eight sources in parallel -- project metadata, git history, test results, governance state, orchestrator task board, build output, agent/command/hook inventory, and health scores -- then renders a richly formatted markdown dashboard with progress bars, tables, and color-coded headers.

The health section is the centerpiece: five dimensions (Tests, Types, Security, Docs, Project) are scored against their actual point maximums and displayed as 20-character Unicode progress bars. An overall letter grade (A through F) gives you an instant read on project health. Every section uses pipe-delimited markdown tables that render with borders, bold text, and color in Claude Code's TUI.

Without this command, you would need to run `git status`, `git log`, your test runner, your type checker, `npm audit`, and manually inspect governance files -- then mentally combine the results. `/forge:status` does all of that in one invocation and ends with an interactive menu that turns the dashboard from a dead-end into a launchpad for your next action.

## Syntax & Options

```
/forge:status [--json] [--git] [--tests] [--governance] [--verbose]
```

| Option | Description |
|--------|------------|
| `--json` | Output all gathered data as a JSON object instead of formatted text; skips the interactive menu |
| `--git` | Show only the git section with expanded log and diff stats |
| `--tests` | Show only the test section with full test runner output |
| `--governance` | Show only the governance section with the complete sentinel log |
| `--verbose` | Show all sections with additional detail |

## When to Use It

- **Session start**: Run it first to regain context after a break, context compaction, or machine switch.
- **After a feature lands**: Verify that health scores improved (or at least did not regress) after implementation.
- **Before deployment**: Quick pre-flight sanity check on all dimensions before running `/forge:deploy`.

When you need deeper analysis, use `/forge:status-enhanced` for 7-day commit heatmaps, dependency audits, and code metrics. When you need a targeted deep dive, use `/forge:gap-analysis`.

## Examples

### Example 1: Standard Dashboard

```
/forge:status
```

Produces a styled dashboard with sections for Git, Health (with progress bars), Tests, Build, Governance, Orchestrator, and Tooling. The Health section looks like:

```
| Dimension   | Bar                  | Score    |
|-------------|----------------------|----------|
| Tests       | ████████████████░░░░ | 16/20    |
| Types       | ████████████████████ | 10/10    |
| Security    | ████████████░░░░░░░░ | 10/15    |
| Docs        | ██████████░░░░░░░░░░ | 10/20    |
| Project     | ████████████████████ | 35/35    |
| **Overall** | **████████████░░░░░░░** | **B (81/100)** |
```

After the dashboard, an interactive menu offers four contextual options like "Add tests to boost health" or "Run gap analysis."

### Example 2: JSON Output for Scripting

```
/forge:status --json
```

Returns a structured JSON object with all gathered data, suitable for piping to other tools or storing as a snapshot.

## Power Use Cases

Pipe `/forge:status --json` into a checkpoint to create a time-series of health scores across sessions. Compare JSON snapshots to track whether health is trending up or down over a sprint.

Run `/forge:status --git` when you only need to see recent commits and uncommitted changes -- it skips tests and builds for instant results.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:gap-analysis** | Status shows the score; gap-analysis explains why and how to fix it |
| **/forge:checkpoint** | Save the current state shown by status before risky changes |
| **/forge:test** | The interactive menu links directly to test runs when coverage is low |
| **/forge:command-center** | Status is run automatically inside the command center's Health Check option |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full dashboard with git, tests, build, governance, and plugin tooling inventory |
| **L2 Pro Builder** | Orchestrator section shows task board, file locks, knowledge entries, and drift status via MCP |
| **L3 Ship Lord** | Health scores are also visualized in the forge-ui dashboard at localhost:5050 |

## Tips & Gotchas

- The health score dimensions have different maximums (Tests: 20, Types: 10, Security: 15, Docs: 20, Project: 35). Do not assume they are all out of 20.
- If the orchestrator is not connected, the Orchestrator section shows a friendly upgrade prompt instead of an error.
- Build checks are stack-aware: TypeScript projects get `tsc --noEmit`, Rust projects get `cargo check`, and projects without a build system skip the section entirely.
- The interactive menu at the end adapts to your health data -- low test scores surface a "Add tests" option, uncommitted changes surface a "Commit" option.

---

*See also: [status-enhanced](../commands/status-enhanced.md) | [gap-analysis](../commands/gap-analysis.md) | [dashboard](../commands/dashboard.md)*
