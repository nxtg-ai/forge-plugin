# Testing

> Generates comprehensive test suites, diagnoses flaky tests, and enforces coverage standards -- with enforcement rules that catch the bugs "all tests pass" misses.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Specialist |
| **Model** | Sonnet |

---

## What It Does

The Testing agent writes tests so you do not have to start from scratch. Hand it a new service class, React component, or utility function, and it generates tests covering happy paths, error cases, and edge cases with properly shaped mocks. It detects your testing framework (Vitest, Jest, pytest) and generates tests that match your existing patterns -- same import style, same assertion library, same file naming convention.

What elevates this agent beyond "generate a test" is its enforcement rules. MOCK_SHAPE_SYNC ensures that every mock object matches the actual production code's usage patterns. If your service accesses `this.api.interceptors.request.use()`, the Testing agent verifies the mock has `interceptors.request.use` as a callable function. This catches the class of bug where tests pass because they test a mock, not the real interface. TYPECHECK_ZERO_TOLERANCE ensures generated tests compile cleanly -- no implicit `any` on callback parameters, no missing properties on mock types. AUTH_E2E_GUARD ensures end-to-end tests for protected routes include authentication setup.

The Testing agent also diagnoses flaky tests. It identifies the three common causes -- timing issues (async race conditions, missing await), order dependence (shared mutable state between tests), and external dependence (network calls, file system, time-of-day) -- and applies targeted fixes. For timing issues, it adds proper async/await and fake timers. For order dependence, it isolates state in beforeEach. For external dependence, it introduces mocks with proper cleanup.

## When to Use It

- **After writing new code**: When you have implemented a service, component, or module and need tests generated from its public API surface.
- **When coverage is below target**: When you need to close coverage gaps and want the Testing agent to identify untested files and generate tests for them, prioritized by criticality.
- **When tests are flaky**: When tests pass sometimes and fail other times, and you need systematic diagnosis and fixes rather than trial-and-error.
- **When setting up test infrastructure**: When a project needs testing configured from scratch -- framework setup, config files, CI integration, test utilities.

Do not use the Testing agent for security scanning (use Security), performance profiling (use Performance), or general quality gates (use Guardian, which spawns Testing as a subagent).

## How It Works

The Testing agent follows a structured generation process:

1. **Read Production Code** -- Analyzes the source file to understand the public API: exported functions, class methods, constructor dependencies, return types, and error cases.

2. **Detect Patterns** -- Identifies the project's testing framework, assertion style, mocking approach, and file naming convention by reading existing test files.

3. **Generate Tests** -- Creates test cases following Arrange-Act-Assert:
   - Happy path for every public method
   - Error handling for each failure mode (invalid input, network error, timeout)
   - Edge cases (empty input, boundary values, null/undefined)
   - Mock objects shaped to match actual production usage (MOCK_SHAPE_SYNC)

4. **Type Verification** -- Runs the type checker against generated tests to ensure they compile cleanly. Fixes type errors before presenting results (TYPECHECK_ZERO_TOLERANCE).

5. **Run and Verify** -- Executes the generated tests to confirm they pass. Reports coverage delta.

For React components, it uses React Testing Library patterns: render, query by role/text/testid, fire events, assert on DOM state. For services, it uses dependency injection mocks. For utilities, it uses direct input/output testing.

The isolation model uses worktrees -- the Testing agent operates in a separate git worktree so its file writes cannot conflict with other agents running in parallel.

## Examples

### Example 1: Generating Tests for a New Service

```
User: "I just wrote the NotificationService, can you generate tests?"

Testing:
  - Reads: NotificationService.ts -- 4 public methods, depends on EmailClient and UserRepository
  - Detects: Vitest + vi.fn() mocking pattern used in project
  - Generates NotificationService.test.ts:
    - test('sends email notification to valid user')
    - test('queues notification when email service is down')
    - test('rejects invalid notification payload')
    - test('handles empty recipient list gracefully')
    - test('deduplicates notifications to same user within window')
    - Mocks: EmailClient and UserRepository shaped to match actual usage
  - Runs: 5/5 passing, coverage on NotificationService now 94%
  - Result: Complete test file matching project conventions, passing on first run
```

### Example 2: Diagnosing Flaky Tests

```
User: "Some tests keep failing intermittently"

Testing:
  - Analyzes: Test results from last 5 runs -- identifies 3 flaky tests
  - Diagnoses:
    - test_websocket_reconnect: Race condition -- missing await on disconnect()
    - test_activity_feed_order: Shared state -- activities array not reset in beforeEach
    - test_timestamp_display: Time-dependent -- uses Date.now() without fake timers
  - Fixes:
    - Adds await to async operations
    - Adds beforeEach(() => { activities = [] })
    - Replaces Date.now() with vi.useFakeTimers()
  - Verifies: Runs each test 10x in succession -- 0 failures
  - Result: Three flaky tests converted to deterministic tests with root cause explanations
```

### Example 3: Coverage Gap Analysis

```
User: "Where are we missing test coverage?"

Testing:
  - Runs: vitest --coverage
  - Reports: 67% overall (target: 85%)
  - Gaps ranked by criticality:
    1. src/services/auth-service.ts (0% -- critical path, no tests)
    2. src/hooks/useWebSocket.ts (0% -- core infrastructure, no tests)
    3. src/services/api-client.ts (34% -- error handling paths untested)
    4. src/utils/validation.ts (52% -- edge cases missing)
  - Recommends: Start with auth-service.ts (highest impact) and useWebSocket.ts (highest risk)
  - Offers: "Want me to generate tests for auth-service.ts first?"
  - Result: Prioritized gap list with impact ranking, not just percentages
```

## Power Use Cases

**Parallel Test Generation**: The Planner spawns the Testing agent alongside Builder. While Builder writes source files to `src/`, Testing writes test files to `src/__tests__/`. No file conflicts, true parallel execution. The feature ships with tests from day one rather than tests being added later as an afterthought.

**Mock Shape Auditing**: After a large refactoring, run the Testing agent to verify all existing mocks still match production code. MOCK_SHAPE_SYNC catches cases where a refactored interface breaks mock objects that `tsc` cannot detect (because the mock was typed as `any` or `Partial<T>`).

**Flaky Test Quarantine**: When flaky tests are identified, the Testing agent can isolate them with `.skip` annotations, fix them in a separate pass, and re-enable them once stable. This prevents flaky tests from eroding team confidence in the test suite.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Planner** | Planner spawns Testing in parallel with Builder. Testing writes tests from the same spec so coverage starts at 100% for new features. |
| **Guardian** | Guardian spawns Testing as a subagent during quality gates. Testing provides coverage analysis; Guardian aggregates with security and types. |
| **Refactor** | Before refactoring, verify tests exist (Testing generates them if missing). After refactoring, verify tests still pass. Testing is the safety net for Refactor. |
| **/forge:test** | The `/forge:test` command provides quick test execution. The Testing agent provides deep generation, diagnosis, and coverage analysis. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Test generation for components, services, and utilities. Coverage gap analysis. Flaky test diagnosis. MOCK_SHAPE_SYNC, TYPECHECK_ZERO_TOLERANCE, NEW_FILE_NEW_TEST, and AUTH_E2E_GUARD enforcement rules. Worktree isolation for parallel execution. |
| **L2 Pro Builder** | Test results correlated with orchestrator tasks. Coverage tracked as part of task completion criteria via `forge_complete_task`. |
| **L3 Ship Lord** | Test results and coverage trends displayed in the forge-ui dashboard. Pass/fail status visible alongside task progress. |

## Tips & Gotchas

- **Do**: Let the Testing agent read your existing test files before generating new ones. It matches your patterns, so generated tests feel native to the codebase.
- **Don't**: Accept tests that use `typeof` or truthiness assertions when specific values are knowable. Assert the exact expected value, not just that something exists.
- **Do**: Run flaky test diagnosis as soon as intermittent failures appear. Flaky tests compound -- one ignored flaky test becomes five within a month.
- **Don't**: Skip the type checker on generated tests. A test that compiles with implicit `any` types is hiding errors, not testing your code.

---

*See also: [Guardian](guardian.md) | [Refactor](refactor.md) | [/forge:test](../commands/test.md)*
