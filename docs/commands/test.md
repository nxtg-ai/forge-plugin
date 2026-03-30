# /forge:test

> Execute your project's test suite with structured result parsing, failure analysis, and actionable recommendations.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Quality & Testing |
| **Syntax** | `/forge:test [--unit] [--integration] [--coverage] [--watch] [--file <pattern>] [--failed] [--verbose]` |

---

## What It Does

`/forge:test` runs your test suite and transforms raw test output into a structured, actionable report. It starts with a pre-flight check to verify your test infrastructure is available, then constructs the appropriate test command based on your arguments, executes it, and parses the results into a summary showing total/passed/failed/skipped counts, duration, coverage metrics, and per-suite breakdowns.

The real value is in the analysis layer. When tests fail, the command does not just show the error -- it prioritizes failures by severity, provides quick-fix hints based on common error patterns, and suggests next commands. When all tests pass, it identifies coverage gaps and recommends files that need tests. When no tests exist at all, it guides you toward `/forge:gap-analysis --scope testing` to plan your testing strategy.

Without this command, you run your test runner directly, scroll through raw output to find failures, mentally prioritize which to fix first, and separately check coverage. `/forge:test` packages all of that into a single structured report with clear next actions.

## Syntax & Options

```
/forge:test [--unit] [--integration] [--coverage] [--watch] [--file <pattern>] [--failed] [--verbose]
```

| Option | Description |
|--------|------------|
| `--unit` | Run only unit tests |
| `--integration` | Run only integration tests |
| `--coverage` | Include coverage reporting (statements, branches, functions, lines) |
| `--watch` | Run in watch mode for continuous feedback during development |
| `--file <pattern>` | Run tests matching a file pattern (e.g., `--file pty-bridge`) |
| `--failed` | Re-run only previously failed tests |
| `--verbose` | Show full unabridged test output |

## When to Use It

- **After implementing a feature**: Verify your new code passes all tests and did not break existing functionality.
- **Before committing**: Quick sanity check that the test suite is green.
- **Investigating failures**: Use `--file <pattern>` to isolate a specific test file, or `--failed` to re-run only the broken ones.

For test gap identification and test generation, use `/forge:gap-analysis --scope testing`. For comprehensive pre-deployment validation that includes tests plus type checking and security audits, use `/forge:deploy --validate-only`.

## Examples

### Example 1: Full Test Suite

```
/forge:test
```

```
NXTG-Forge Test Results
========================

SUMMARY
  Total:    47
  Passed:   45
  Failed:   2
  Skipped:  0
  Duration: 3.2s

FAILURES
  src/services/__tests__/auth.test.ts:validateToken
    Expected: { valid: true, userId: "u-123" }
    Received: undefined
    Location: auth.test.ts:42

TEST SUITES
  auth.test.ts: 8/10 (1.1s)
  api.test.ts: 12/12 (0.8s)
  utils.test.ts: 25/25 (1.3s)
```

### Example 2: Coverage Report

```
/forge:test --coverage
```

Adds a coverage section showing statements, branches, functions, and lines percentages, plus a list of uncovered files.

### Example 3: Targeted Run

```
/forge:test --file auth
```

Runs only test files matching "auth", useful for isolating failures.

## Power Use Cases

Use `--watch` during active development for instant feedback on every file save. Combine with `/forge:feature` by running `/forge:test` as the validation step after the feature pipeline completes.

Run `/forge:test --coverage` and pipe the output into a checkpoint with `/forge:checkpoint save pre-refactor` to establish a coverage baseline before refactoring.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:feature** | Feature pipeline runs tests as its validation step; use test for manual re-runs |
| **/forge:gap-analysis** | Gap analysis identifies untested files; test verifies coverage after you add them |
| **/forge:deploy** | Deploy runs tests as part of pre-flight validation |
| **/forge:status** | Status shows test metrics; test gives you the full details |
| **testing agent** | For generating new tests, assign the testing agent via `/forge:agent-assign` |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full test execution with structured results, failure analysis, and recommendations |
| **L2 Pro Builder** | Test results feed into orchestrator health scores via the governance MCP |
| **L3 Ship Lord** | Test trends and coverage history visible in the forge-ui dashboard |

## Tips & Gotchas

- The command auto-detects vitest as the test runner. For projects using jest, pytest, or cargo test, the MCP `forge_run_tests` tool handles framework detection.
- If vitest is not installed, the command tells you and suggests `npm install`. It does not silently fail.
- The `--watch` flag starts an interactive mode -- you stay in the test runner until you exit.
- Pre-flight checks verify the test infrastructure before running. If `npx vitest --version` fails, you get clear guidance on what to install.

---

*See also: [gap-analysis](../commands/gap-analysis.md) | [deploy](../commands/deploy.md) | [feature](../commands/feature.md)*
