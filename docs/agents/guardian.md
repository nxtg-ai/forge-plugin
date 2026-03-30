# Guardian

> Your pre-ship quality shield -- runs tests, scans for vulnerabilities, checks types, and generates coverage reports before code leaves your machine.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Core Workflow |
| **Model** | Sonnet |

---

## What It Does

The Guardian is the last line of defense between your code and production. It runs a multi-dimensional quality gate that checks tests, type safety, security, code quality, and documentation coverage in a single pass. Unlike a CI pipeline that tells you something broke 10 minutes after you pushed, the Guardian catches problems before you commit.

What makes the Guardian more than a wrapper around `npm test` is its enforcement rules. MOCK_SHAPE_SYNC verifies that test mocks actually match the production code they simulate -- if you add `this.api.interceptors.request.use` in your service, the Guardian checks that your test mock has `interceptors.request` on it. TYPECHECK_ZERO_TOLERANCE means `tsc --noEmit` must exit 0, not "zero errors related to recent changes" -- all type errors are blocking. NEW_FILE_NEW_TEST flags any new logic file that shipped without a corresponding test file. These are the rules that separate a test suite that builds confidence from one that builds false confidence.

The Guardian also generates tests. Hand it a new service class and it produces unit tests covering happy paths, error cases, and edge cases with proper mocking. It generates test stubs that follow your existing patterns (Vitest + React Testing Library, Jest, pytest -- whatever it detects) so the generated tests fit naturally into your codebase.

## When to Use It

- **After implementing a feature**: When you have finished writing code and want to know if it is ready to commit. The Guardian runs the full quality gate and reports pass/fail with actionable fixes.
- **Before a release**: When you want a comprehensive pre-ship audit covering security vulnerabilities, test coverage, type safety, and documentation gaps.
- **When new code needs tests**: When you have created a service, component, or utility without tests and want comprehensive test generation with edge case coverage.
- **During code review**: When you want an automated review that checks function length, SOLID compliance, error handling patterns, and naming conventions.

Do not use the Guardian for root cause analysis of production bugs (use Detective), architecture planning (use Planner), or performance profiling (use Performance).

## How It Works

The Guardian runs quality checks across five dimensions, optionally in parallel for speed:

1. **Test Execution** -- Detects the test framework (Vitest, Jest, pytest, cargo test) and runs the full suite. Reports pass count, fail count, and coverage percentage. Flags any failing test as a blocking error.

2. **Type Checking** -- Runs `tsc --noEmit` (or equivalent). Zero tolerance -- all type errors must resolve to zero, including pre-existing ones. A codebase where the type checker fails has a broken type system.

3. **Security Scanning** -- Checks for hardcoded secrets (API keys, tokens, passwords in source), dangerous patterns (eval, innerHTML with user input, SQL concatenation), and dependency vulnerabilities via `npm audit`.

4. **Code Quality Review** -- Verifies functions stay under 25 lines, classes have single responsibility, naming is descriptive, type hints are present, error handling uses Result types, and dependencies are injected.

5. **Documentation Check** -- Scans for public functions missing docstrings, classes without documentation, and API endpoints without specs.

For large codebases, the Guardian spawns Testing and Security as parallel Task agents while running type checking inline. This reduces validation time roughly 3x compared to sequential execution.

When orchestrator MCP tools are available (L2), it checks which tasks are being validated via `forge_get_tasks`, looks up past security findings via `forge_get_knowledge`, records quality findings via `forge_capture_knowledge`, and marks validated tasks complete via `forge_complete_task`.

## Examples

### Example 1: Post-Implementation Quality Gate

```
User: "I've finished the JWT authentication system"

Guardian:
  - Runs: vitest (24 tests, all passing, 89% coverage)
  - Runs: tsc --noEmit (0 errors)
  - Scans: No hardcoded secrets, no eval usage, npm audit clean
  - Reviews: Functions under 25 lines, DI used, Result types for errors
  - Reports: ALL QUALITY GATES PASSED -- production-ready
  - Result: Confidence to commit with specific coverage and security metrics
```

### Example 2: Catching Mock Shape Drift

```
User: "All tests pass but I'm getting runtime errors in staging"

Guardian:
  - Detects: AuthService.ts added `this.api.interceptors.request.use()` in latest commit
  - Checks: AuthService.test.ts mock has `interceptors.response` but NOT `interceptors.request`
  - Flags: BLOCKING -- "Test mock does not cover new call site interceptors.request.use -- tests will fail at runtime"
  - Suggests: Add `request: { use: vi.fn() }` to mock object
  - Result: Catches the exact class of bug that "all tests pass" misses
```

### Example 3: Generating Tests for a New Service

```
User: "I created NotificationService but haven't written tests yet"

Guardian:
  - Reads: NotificationService.ts -- identifies 4 public methods, 2 dependencies
  - Generates: NotificationService.test.ts with:
    - Happy path tests for all 4 methods
    - Error handling tests (network failure, invalid input, timeout)
    - Edge cases (empty notification list, duplicate recipients)
    - Properly shaped mocks matching actual dependency interfaces
  - Runs: New tests pass, coverage now includes the new file
  - Result: 12 new tests covering the service with zero manual test writing
```

## Power Use Cases

**Parallel Quality Gate**: The Guardian can spawn Testing and Security agents as parallel Task subagents while running type checking inline. This means a codebase that takes 30 seconds to check sequentially finishes in about 10 seconds. The results are aggregated into a single pass/fail report.

**Pre-Commit with Auto-Fix**: When the Guardian finds issues, it offers to fix them. Missing type annotations get added. Import order gets corrected. Simple security issues (like a secret that should be in an environment variable) get remediated. You review the fixes and decide whether to accept.

**Continuous Quality Tracking**: Run the Guardian at the start and end of each development session. The delta between runs tells you whether your session improved or degraded code quality. Coverage went from 67% to 89%? The Guardian celebrates that. Type errors went from 0 to 3? It flags the regression immediately.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Planner** | Planner delegates to Guardian as the final phase after Builder and Testing complete. Guardian validates that the plan's acceptance criteria are met. |
| **Testing** | Guardian spawns Testing as a parallel subagent for deep coverage analysis, while Guardian handles security and types. |
| **Security** | Guardian spawns Security as a parallel subagent for OWASP scanning, while Guardian handles tests and code quality. |
| **Detective** | Detective identifies problems; Guardian prevents them. Run Detective for analysis, Guardian before commits. |
| **/forge:deploy** | The `/forge:deploy` command triggers Guardian quality gates before any deployment proceeds. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full quality gate with five dimensions. Test generation for new code. MOCK_SHAPE_SYNC, TYPECHECK_ZERO_TOLERANCE, and NEW_FILE_NEW_TEST enforcement rules. Parallel subagent execution for speed. |
| **L2 Pro Builder** | Validates tasks from the orchestrator task board via `forge_get_tasks`. Records quality findings and security issues via `forge_capture_knowledge`. Marks validated tasks complete via `forge_complete_task`. Recalls past quality patterns via `forge_get_knowledge`. |
| **L3 Ship Lord** | Quality gate results visible in the forge-ui dashboard. Health score trends displayed over time. Security findings surfaced in the governance panel. |

## Tips & Gotchas

- **Do**: Run the Guardian after every significant implementation, not just before releases. Catching issues early is cheaper than catching them late.
- **Don't**: Ignore TYPECHECK_ZERO_TOLERANCE warnings. Pre-existing type errors compound -- fix them now or they multiply.
- **Do**: Let the Guardian generate test stubs for new code, then refine the generated tests. Its generated tests follow your project's patterns and cover edge cases you might skip.
- **Don't**: Treat Guardian warnings as blockers. The Guardian follows "guidance not gates" -- it warns but never prevents a commit. You decide what to ship.

---

*See also: [Testing](testing.md) | [Security](security.md) | [/forge:test](../commands/test.md)*
