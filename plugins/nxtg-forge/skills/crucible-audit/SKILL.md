---
name: CRUCIBLE Audit
description: Forensic test quality auditing based on the CRUCIBLE Protocol. Detects test fraud — hollow assertions, coverage gaming, mock proliferation, dead tests, and metric inflation that creates false green signals.
---

# CRUCIBLE Test Quality Audit

## Overview

The CRUCIBLE Audit skill provides the methodology for forensic analysis of test suites. It detects **test fraud** — the pattern where test count and coverage numbers look healthy but the tests prove nothing about whether the software actually works.

**Origin**: Wolf's forensic audit of Podcast-Pipeline (2026-03-07). 1,601 tests, 77% claimed coverage — actual coverage ~15%, nothing worked when a human used it.

## The 8 Fraud Patterns

### Pattern 1: Coverage Omit Gaming
**What**: Excluding hard-to-test code from `[tool.coverage.run] omit` to inflate coverage %.
**Detection**:
```bash
# Python: check pyproject.toml / setup.cfg / .coveragerc
grep -A 20 '\[tool.coverage.run\]' pyproject.toml | grep -i omit
grep -A 20 '\[run\]' .coveragerc | grep -i omit

# JavaScript: check jest.config / vitest.config
grep -A 10 'coveragePathIgnorePatterns\|collectCoverageFrom' jest.config* vitest.config*
```
**Severity**: CRITICAL — this is deliberate metric manipulation.
**Remediation**: Remove omit entries. All source code counts. Report real numbers.

### Pattern 2: Hollow Assertions
**What**: Assertions that pass regardless of correctness.
**Detection**:
```bash
# Count trivially-passing assertions
grep -rn "assert.*is not None" tests/ | wc -l
grep -rn "assert.*\.exists()" tests/ | wc -l
grep -rn "assert True" tests/ | wc -l
grep -rn "assert len.*>= 0" tests/ | wc -l
grep -rn "assert len.*>= 1" tests/ | wc -l  # May be valid, needs context
grep -rn "assert isinstance" tests/ | wc -l  # Type check without value check
```
**Severity**: HIGH — creates false confidence.
**Remediation**: Each assertion must be FALSIFIABLE by a realistic bug. If the assertion can't fail when the code is broken, it's hollow.

### Pattern 3: Mock Proliferation
**What**: Mocking internal components so tests verify mock behavior, not real behavior.
**Detection**:
```bash
# Count mock usage
grep -rn "@patch\|@mock" tests/ | wc -l
grep -rn "MagicMock\|Mock()" tests/ | wc -l
grep -rn "patch(" tests/ | wc -l

# Mock ratio: mocks / total test functions
MOCKS=$(grep -rn "patch\|Mock\|MagicMock" tests/ | wc -l)
TESTS=$(grep -rn "def test_" tests/ | wc -l)
echo "Mock ratio: $MOCKS mocks / $TESTS tests = $(echo "scale=1; $MOCKS * 100 / $TESTS" | bc)%"
```
**Severity**: HIGH if >30% mock ratio. CRITICAL if integration/e2e tests use mocks.
**Standard**: Mocks are for external APIs you don't control. Internal code uses real implementations.
**Red flag**: Files named `*integration*` or `*e2e*` or `*smoke*` that contain `@patch` or `MagicMock`.

### Pattern 4: Dead Test Infrastructure
**What**: Tests gated by environment variables, markers, or conditions that are never activated.
**Detection**:
```bash
# Find env-gated tests
grep -rn "skipIf\|skipUnless\|PYTEST_\|os.environ.get" tests/ | grep -i "skip\|pytest"
grep -rn "@pytest.mark.skip" tests/

# Check if the gate vars are ever set
for var in $(grep -roh 'os.environ.get("[^"]*")' tests/ | sort -u | sed 's/os.environ.get("//;s/")//' ); do
    grep -rn "$var" Makefile CI/ .github/ pytest.ini pyproject.toml 2>/dev/null || echo "DEAD: $var never set"
done
```
**Severity**: HIGH — dead tests inflate count without providing coverage.
**Remediation**: Either enable the gate in CI, or delete the tests. Tests that can't run aren't tests.

### Pattern 5: Mock-Heavy Integration Tests
**What**: Tests labeled "integration" or "e2e" that mock the components they claim to integrate.
**Detection**:
```bash
# Check integration/e2e test files for mocks
for f in $(find tests/ -name "*integration*" -o -name "*e2e*" -o -name "*smoke*"); do
    MOCKS=$(grep -c "patch\|Mock\|MagicMock" "$f" 2>/dev/null || echo 0)
    TESTS=$(grep -c "def test_" "$f" 2>/dev/null || echo 0)
    echo "$f: $MOCKS mocks in $TESTS tests"
done
```
**Severity**: CRITICAL — the most dangerous fraud because it appears to be the highest-value testing.
**Remediation**: Real integration tests use real components. If you can't run the real component in CI, the test is a unit test — label it honestly.

### Pattern 6: Untested Entry Points
**What**: User-facing code (API, CLI, main) with near-zero coverage.
**Detection**:
```bash
# Python: check coverage of entry point files
python -m pytest --cov=src --cov-report=term-missing 2>&1 | grep -E "(api|cli|main|__main__|app)\." | grep -v "100%"

# JavaScript: check coverage of route/handler files
npx jest --coverage 2>&1 | grep -E "(route|handler|controller|app)\." | grep -v "100"
```
**Severity**: HIGH — if users can't reach tested code, tests don't matter.

### Pattern 7: No Output Quality Verification
**What**: Tests that check "did the function run?" but not "is the output correct?"
**Detection**: Read 5-10 test files and check: does any assertion verify OUTPUT QUALITY?
- Audio: RMS levels, duration, frequency analysis
- Text: content accuracy, formatting correctness
- Data: value ranges, relationships, invariants
- API: response body content (not just status codes)

If assertions only check: file exists, count > 0, no exception raised, status 200 — that's Pattern 7.
**Severity**: HIGH — the fundamental purpose of testing is to verify correctness.

### Pattern 8: README Badge Fraud
**What**: README badges showing different numbers than reality.
**Detection**:
```bash
# Compare badge claims to actual
grep -oP 'tests-\K[0-9]+' README.md
grep -oP 'coverage-\K[0-9]+' README.md
python -m pytest --tb=no -q 2>&1 | tail -1
python -m pytest --cov=src --cov-report=term 2>&1 | grep TOTAL
```
**Severity**: MEDIUM — but erodes trust in all project reporting.

## The Audit Report Template

```
## CRUCIBLE TEST QUALITY AUDIT — {PROJECT_NAME}

### Verdict: {PASS | FAIL | CRITICAL FAIL}

| Pattern | Status | Count | Severity |
|---------|--------|-------|----------|
| 1. Coverage omit gaming | {CLEAN/FOUND} | {N entries} | {severity} |
| 2. Hollow assertions | {CLEAN/FOUND} | {N instances} | {severity} |
| 3. Mock proliferation | {CLEAN/FOUND} | {ratio}% | {severity} |
| 4. Dead test infrastructure | {CLEAN/FOUND} | {N tests} | {severity} |
| 5. Mock-heavy integration | {CLEAN/FOUND} | {N files} | {severity} |
| 6. Untested entry points | {CLEAN/FOUND} | {N LOC} | {severity} |
| 7. No quality verification | {CLEAN/FOUND} | {0 tests} | {severity} |
| 8. README badge fraud | {CLEAN/FOUND} | {delta} | {severity} |

### Real Numbers
- Tests collected: {N}
- Tests actually passing: {N}
- Tests skipped/dead: {N}
- Claimed coverage: {N}%
- Actual coverage (no omits): {N}%
- Mock ratio: {N}%
- Integration tests using mocks: {N}/{total}

### Smoking Gun Examples
{3-5 specific examples with file paths and line numbers}

### Remediation Priority
1. {highest impact fix}
2. {next fix}
3. {next fix}
```

## When to Use This Skill

- After any project claims high test count or coverage
- Before any release gate (pre-publish, pre-deploy)
- When a Human Oracle finds issues that tests should have caught
- During CRUCIBLE Protocol enforcement
- When test count increases rapidly (>100 tests in one sprint = suspicious)
- During portfolio enrichment cycles (spot audits)

## The Fundamental Test

> If you deleted all mocks, removed all env-var gates, and ran the full test suite against real infrastructure — how many tests would pass?

That number is the REAL test count. Everything above it is scaffolding. Scaffolding is fine, but it must never be confused with the real thing.
