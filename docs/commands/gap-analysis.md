# /forge:gap-analysis

> Comprehensive five-dimension project analysis covering testing, documentation, security, architecture, and performance -- with severity-ranked findings and phased remediation plans.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Governance |
| **Syntax** | `/forge:gap-analysis [--scope testing|docs|security|architecture|performance] [--severity critical|high] [--fix] [--json]` |

---

## What It Does

`/forge:gap-analysis` is the deepest diagnostic command in Forge. It spawns five parallel agents (testing, docs, security, detective, performance) that simultaneously analyze your project across every quality dimension. The testing agent maps source files to test files and calculates file-level coverage. The docs agent checks for README, CHANGELOG, JSDoc on exports, and API documentation. The security agent scans for hardcoded secrets, dangerous patterns (eval, innerHTML), dependency vulnerabilities, and committed `.env` files. The detective agent finds large files, coupling indicators, type safety issues, and technical debt markers. The performance agent measures bundle size, dependency counts, and production console usage.

Before running local analysis, the command pulls orchestrator data if available -- governance health, drift detection against your project vision, and existing knowledge base entries. This means gap-analysis findings account for strategic alignment, not just code metrics.

The output is a severity-ranked list of gaps (CRITICAL, HIGH, MEDIUM, LOW) with estimated remediation effort in hours and a top-5 priority list. With `--fix`, it generates a phased remediation plan: Phase 1 for critical fixes this sprint, Phase 2 for high priority next sprint, and Phase 3 for medium priority backlog items.

## Syntax & Options

```
/forge:gap-analysis [--scope testing|docs|security|architecture|performance] [--severity critical|high] [--fix] [--json]
```

| Option | Description |
|--------|------------|
| `--scope <area>` | Limit analysis to a specific dimension: `testing`, `docs`, `security`, `architecture`, or `performance` |
| `--severity <level>` | Filter results to show only gaps at or above the specified severity |
| `--fix` | Generate a phased remediation plan with effort estimates after the analysis |
| `--json` | Output all findings as a JSON object |

## When to Use It

- **Project onboarding**: Run it on day one to understand where a codebase stands across all quality dimensions.
- **Sprint planning**: Use `--fix` to generate a prioritized backlog of technical debt items with effort estimates.
- **Targeted investigation**: Use `--scope security` to focus exclusively on security gaps when preparing for an audit.

For code quality specifics (type safety, dead code, duplication), use `/forge:optimize`. For a quick health overview without the deep dive, use `/forge:status`.

## Examples

### Example 1: Full Analysis

```
/forge:gap-analysis
```

```
GAP ANALYSIS SUMMARY
=====================
Generated: 2026-03-29T14:30:00Z

  CRITICAL: 1
  HIGH:     4
  MEDIUM:   8
  LOW:      3

  Total gaps: 16
  Estimated effort: 24h

Top 5 Priority Items:
  1. [CRITICAL] No tests for payment-service.ts (3h)
  2. [HIGH] 3 hardcoded API keys in config.ts (1h)
  3. [HIGH] README.md missing (2h)
  4. [HIGH] auth-middleware.ts is 480 lines (4h)
  5. [HIGH] 12 npm audit vulnerabilities (2h)
```

### Example 2: Scoped to Security

```
/forge:gap-analysis --scope security
```

Runs only the security dimension, showing dependency vulnerabilities, hardcoded secrets, dangerous patterns, and committed environment files.

### Example 3: With Remediation Plan

```
/forge:gap-analysis --fix
```

After the analysis, appends a phased plan:

```
GAP REMEDIATION PLAN
=====================

Phase 1: Critical Fixes (This Sprint)
  - [ ] Add tests for payment-service.ts (3h)
  - [ ] Remove hardcoded API keys (1h)

Phase 2: High Priority (Next Sprint)
  - [ ] Create README.md (2h)
  - [ ] Refactor auth-middleware.ts (4h)

Phase 3: Medium Priority (Backlog)
  - [ ] Add JSDoc to 23 undocumented exports (4h)
  ...
```

## Power Use Cases

Run `/forge:gap-analysis` with all five agents in parallel for a sub-minute comprehensive audit, then feed the `--fix` output directly into sprint planning. Each item includes an effort estimate to help with capacity planning.

Combine with orchestrator knowledge: gap analysis findings are recorded via `forge_capture_knowledge` (category: "research"), building a history of project assessments over time. Compare findings across sessions to measure improvement.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:status** | Status shows the score; gap-analysis explains every deduction |
| **/forge:optimize** | Optimize goes deeper on code quality; gap-analysis covers all dimensions |
| **/forge:feature** | Use gap findings to plan features that address the most critical gaps |
| **/forge:test** | Testing dimension identifies untested files; run test after adding them |
| **/forge:checkpoint** | Save state before applying gap-analysis fix recommendations |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full five-dimension analysis with severity rankings and recommendations |
| **L2 Pro Builder** | Orchestrator integration: health scores, drift detection, and knowledge base contribute to findings |
| **L3 Ship Lord** | Gap analysis results and trends visible in the forge-ui governance dashboard |

## Tips & Gotchas

- The five-agent parallel execution requires the Task tool. Without it, dimensions run sequentially (still accurate, just slower).
- Effort estimates are rough approximations based on gap type and scope. Use them for relative prioritization, not project scheduling.
- Skipped dimensions (due to errors or missing tools) are clearly marked with `[SKIPPED]` and a reason.
- When `--scope` is specified, the pre-flight confirmation prompt is skipped for faster targeted runs.

---

*See also: [status](../commands/status.md) | [optimize](../commands/optimize.md) | [test](../commands/test.md)*
