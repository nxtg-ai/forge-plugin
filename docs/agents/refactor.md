# Refactor

> Restructures code without changing behavior -- extracts functions, eliminates duplication, reduces complexity, and splits oversized files, all with a green test suite as the safety net.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Specialist |
| **Model** | Sonnet |

---

## What It Does

The Refactor agent improves code structure while preserving external behavior. It takes an 800-line file and splits it into focused modules. It finds duplicated WebSocket logic across four components and extracts a reusable hook. It takes a function with cyclomatic complexity of 15 and simplifies it with early returns and extracted helpers. Every change it makes is protected by the test suite -- it runs tests before the refactoring to establish a green baseline, makes one structural change at a time, and runs tests after each step to verify behavior is preserved.

What makes this agent more disciplined than "just rename things" is its safety protocol. It will not refactor untested code. If a module lacks tests, it stops and tells you to generate them first (via the Testing agent). This is non-negotiable because refactoring without tests is not refactoring -- it is rewriting, and rewriting breaks things. The Refactor agent enforces the distinction: refactoring changes structure, never behavior, and tests prove it.

The agent encodes specific complexity thresholds: functions over 25 lines get extracted, cyclomatic complexity over 10 gets simplified, files over 300 lines get split, functions with more than 4 parameters get an options object, nesting deeper than 3 levels gets early returns. These are not arbitrary -- they are the thresholds where code comprehension drops sharply. The Refactor agent knows the catalog of refactoring patterns (Extract Function, Extract Hook, Replace Conditional with Polymorphism, Simplify with Early Returns) and applies the right one for each situation.

## When to Use It

- **When a file has grown too large**: When a service, component, or utility has accumulated responsibilities and needs decomposition into focused modules with clear boundaries.
- **When you see code duplication**: When the same logic appears in multiple places and needs extraction into a shared function, hook, or utility.
- **When complexity is too high**: When a function has deeply nested conditionals, long switch statements, or cyclomatic complexity that makes reasoning about behavior difficult.
- **When naming is misleading**: When function names do not describe what they do, variable names are abbreviated, or class names do not reflect their single responsibility.

Do not use the Refactor agent for adding new functionality (use Builder), fixing bugs (use Detective to diagnose, then Builder to fix), or rewriting code from scratch (the Refactor agent preserves existing behavior, it does not replace it).

## How It Works

The Refactor agent follows a strict six-step safety protocol:

1. **Read the Code** -- Analyzes the target code to understand its current structure, responsibilities, and dependencies. Maps which functions call which, which modules import which.

2. **Check for Tests** -- Verifies that test coverage exists for the code being refactored. If tests are missing, it stops and recommends generating them first. This is a hard requirement.

3. **Run Tests Before** -- Executes the test suite to confirm a green baseline. If tests are already failing, the Refactor agent will not proceed -- you cannot verify behavior preservation against a broken baseline.

4. **Make Changes** -- Applies one refactoring pattern at a time. Extract a function, run tests. Extract another, run tests. Never applies multiple refactorings in a single step. Small steps make it easy to identify which change broke something.

5. **Run Tests After** -- After each change, runs the test suite. If any test fails, the change is reverted and the Refactor agent reports what went wrong.

6. **Verify Imports** -- After all refactorings complete, verifies that no broken import references remain. Checks that all modules that depended on the refactored code now import from the correct new locations.

## Examples

### Example 1: Splitting an Oversized Service

```
User: "activity-service.ts is 800 lines, can you break it up?"

Refactor:
  - Reads: Identifies 5 distinct responsibilities in one file:
    activity CRUD, notification dispatch, metrics recording, WebSocket broadcasting, data formatting
  - Checks: 23 tests exist for activity-service -- baseline is green
  - Extracts:
    Step 1: NotificationService (140 lines) -- tests pass
    Step 2: MetricsService (95 lines) -- tests pass
    Step 3: WebSocketBroadcaster (110 lines) -- tests pass
    Step 4: ActivityFormatter (75 lines) -- tests pass
    Step 5: ActivityService now 180 lines, single responsibility (CRUD only)
  - Verifies: All imports updated, 23 tests still pass, zero behavior change
  - Result: 1 file -> 5 focused modules, each under 200 lines
```

### Example 2: Eliminating Cross-Component Duplication

```
User: "There's duplicated WebSocket logic across several components"

Refactor:
  - Scans: Finds WebSocket connect/disconnect/reconnect logic in 4 components
  - Identifies: 45 lines duplicated with minor variations (different message types)
  - Extracts: useWebSocket(url, options) custom hook with:
    - Connection lifecycle management
    - Reconnection with exponential backoff
    - Message type filtering via options
    - Cleanup on unmount
  - Updates: All 4 components now use the hook (3-5 lines each vs. 45)
  - Tests: All component tests pass, new hook tests added
  - Result: 180 duplicated lines reduced to 50 (shared hook) + 16 (4 usages)
```

### Example 3: Reducing Cyclomatic Complexity

```
User: "This function has cyclomatic complexity of 15"

Refactor:
  - Reads: processEvent() with nested if/switch/if chains
  - Applies early returns: 4 guard clauses replace 3 levels of nesting
  - Extracts: handleUserEvent(), handleSystemEvent(), handleErrorEvent() -- one per event type
  - Replaces switch: Strategy pattern with typed handler map
  - Result: processEvent() complexity drops from 15 to 3, extracted handlers are 4-6 each
```

## Power Use Cases

**Testing + Refactor Pipeline**: Before any refactoring, run the Testing agent to generate tests for untested code. Then run the Refactor agent with confidence that behavior changes will be caught. This two-agent pipeline makes refactoring safe even for legacy codebases.

**Detective-Informed Refactoring**: Run the Detective agent first to identify complexity hotspots, oversized files, and duplication. Use the Detective's findings as input to the Refactor agent. This ensures you refactor the code that matters most, not whatever happens to annoy you today.

**Incremental Modernization**: For codebases with legacy patterns (class components, callbacks, mutation-heavy state), use the Refactor agent incrementally -- convert one module per session, verify tests pass, commit. Over weeks, the codebase modernizes without a risky big-bang rewrite.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Testing** | Testing generates the safety net; Refactor operates within it. Never refactor without tests. |
| **Detective** | Detective identifies what needs refactoring (complexity hotspots, large files, duplication). Refactor executes the improvements. |
| **Planner** | For large refactorings (monolith decomposition), Planner creates the phased plan with rollback strategies. Refactor executes each phase. |
| **Guardian** | After refactoring, Guardian runs the quality gate to verify tests pass, types check, and no regressions were introduced. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full refactoring safety protocol. Extract Function, Extract Hook, Replace Conditional with Polymorphism, Early Returns. Complexity thresholds. Import verification. Step-by-step test validation. |
| **L2 Pro Builder** | Refactoring decisions recorded via `forge_capture_knowledge`. Past patterns recalled via `forge_get_knowledge` to maintain consistency across refactoring sessions. |
| **L3 Ship Lord** | Complexity metrics before/after refactoring visible in forge-ui dashboard. Trend tracking shows code health improvement over time. |

## Tips & Gotchas

- **Do**: Always verify tests exist before refactoring. If tests are missing, generate them first with the Testing agent. The test suite is the only proof that behavior is preserved.
- **Don't**: Apply multiple refactorings in a single step. One extraction, one test run. If something breaks, you know exactly which change caused it.
- **Do**: Use the Detective's complexity analysis to prioritize what to refactor. Focus on high-complexity, frequently-changed files -- they have the highest payoff.
- **Don't**: Confuse refactoring with rewriting. Refactoring changes structure while preserving behavior. If you want to change what the code does, that is a feature change, not a refactor.
- **Do**: Delete dead code fearlessly. Unused functions, unreachable branches, and commented-out blocks are noise that slows comprehension.

---

*See also: [Testing](testing.md) | [Detective](detective.md) | [Planner](planner.md)*
