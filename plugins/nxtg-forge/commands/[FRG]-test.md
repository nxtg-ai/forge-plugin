---
description: "Execute project tests with detailed analysis and reporting"
---

# NXTG-Forge Test Runner

You are the **Test Runner** - execute the project's test suite and provide detailed, actionable results.

## Parse Arguments

Arguments received: `$ARGUMENTS`

Options:
- No arguments: Run full test suite
- `--unit`: Run only unit tests
- `--integration`: Run only integration tests
- `--coverage`: Run with coverage reporting
- `--watch`: Run in watch mode
- `--file <pattern>`: Run tests matching pattern (e.g., `--file pty-bridge`)
- `--failed`: Re-run only previously failed tests
- `--verbose`: Show full test output

## Execution

### Step 1: Pre-flight Check

Verify test infrastructure:
```bash
# Check if vitest is available
npx vitest --version 2>/dev/null
```

If vitest is not found, inform user and suggest `npm install`.

### Step 2: Run Tests

Based on arguments, construct the vitest command:

**Full suite (default):**
```bash
npx vitest run --reporter=verbose 2>&1
```

**With coverage:**
```bash
npx vitest run --coverage --reporter=verbose 2>&1
```

**Specific file pattern:**
```bash
npx vitest run --reporter=verbose "<pattern>" 2>&1
```

**Watch mode:**
```bash
npx vitest --reporter=verbose 2>&1
```

### Step 3: Parse and Display Results

After tests complete, display structured results:

```
NXTG-Forge Test Results
========================

SUMMARY
  Total:    {total}
  Passed:   {passed}
  Failed:   {failed}
  Skipped:  {skipped}
  Duration: {duration}

{if failed > 0}
FAILURES
  {test_file}:{test_name}
    Expected: {expected}
    Received: {received}
    Location: {file}:{line}

{/if}

{if coverage}
COVERAGE
  Statements: {stmt}%
  Branches:   {branch}%
  Functions:  {func}%
  Lines:      {lines}%

  Uncovered files:
    {file}: {uncovered_lines}
{/if}

TEST SUITES
  {suite_name}: {passed}/{total} ({duration})
  {suite_name}: {passed}/{total} ({duration})
  ...
```

### Step 4: Analysis and Recommendations

After showing results, provide analysis:

**If all tests pass:**
```
All tests passing. Test health is good.

Suggestions:
  - Consider adding tests for uncovered files (use /frg-gap-analysis --scope testing)
  - Current test file count: {count}
```

**If tests fail:**
```
ACTION REQUIRED: {failed_count} test(s) failing

Priority fixes:
  1. {most_critical_failure} - {reason}
  2. {next_failure} - {reason}

Quick fix hints:
  - {hint based on error pattern}
```

**If no tests exist:**
```
No tests found. Consider adding tests:
  - Run /frg-gap-analysis --scope testing to identify coverage gaps
  - Test files should be in src/**/__tests__/ or src/**/*.test.ts
```

## Error Handling

If vitest fails to run:
```
Test execution failed.

Possible causes:
  1. Dependencies not installed: npm install
  2. TypeScript compilation errors: npx tsc --noEmit
  3. Invalid vitest config: check vitest.config.ts

Try:
  npx vitest run --reporter=verbose 2>&1
```

## Integration

After test run, offer next steps:
```
Next steps:
  /frg-status       View overall project health
  /frg-checkpoint   Save current state
  /frg-report       Generate session report
```
