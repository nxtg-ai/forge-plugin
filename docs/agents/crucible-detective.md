# CRUCIBLE Detective

> The forensic auditor that exposes test fraud -- hollow assertions, coverage gaming, mock proliferation, and the gap between what your test metrics claim and what your tests actually prove.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Governance & Analysis |
| **Model** | Sonnet |

---

## What It Does

The CRUCIBLE Detective performs forensic audits on test suites to find the gap between claimed quality and actual quality. It was born from a real incident: a project with 1,601 "passing" tests and 77% "claimed coverage" that turned out to have approximately 15% actual coverage, 439 mocks, 66+ hollow assertions, and core engines excluded from measurement. The founder tried to use the product and nothing worked. This agent exists so that never happens again.

It hunts eight specific fraud patterns: coverage omit gaming (excluding code to inflate percentages), hollow assertions (assertions that cannot fail when the code is broken), mock proliferation (mocking internal components instead of testing real behavior), dead test infrastructure (tests gated by env vars that are never set), mock-heavy integration tests (tests labeled "integration" that mock everything they should integrate), untested entry points (user-facing code with zero coverage), no output quality verification (tests that check "it ran" but not "it produced correct output"), and README badge fraud (badges showing different numbers than reality).

This agent does not fix code, does not generate tests, and does not soften findings. It is forensic, read-only, and ruthless. Every finding includes file paths and line numbers. False accusations destroy credibility, so it verifies before it accuses.

## When to Use It

- **Test counts seem too good to be true**: When a project reports 1,500 tests or 90% coverage but users still find bugs that tests should have caught.
- **Rapid test count increases**: When hundreds of tests were added in a single sprint -- a red flag for hollow test generation.
- **Pre-release gate**: Before publishing to npm, PyPI, or any package registry, verify that test quality matches test quantity.
- **Portfolio spot audit**: When the CoS or team lead wants an independent verification of a project's test health claims.
- **Post-bug-report investigation**: When a bug is found in production that existing tests should have caught, audit why the tests failed to protect.

Do not use this agent to write or fix tests -- hand off to the testing agent for that. Do not use it for test strategy design -- that is the QA Sentinel's role.

## How It Works

The audit runs in four phases.

**Phase 1 -- Quantitative Scan** (automated, ~2 minutes): Runs detection commands for all eight fraud patterns. Collects raw numbers -- mock counts, assertion types, omit lists, gated test counts, badge claims vs. actuals.

**Phase 2 -- Qualitative Read** (~5-10 minutes): Reads 10-15 representative test files. For each: What is this test actually verifying? Would it fail if the code produced wrong output? Is the mock replacing something we have access to? Is the assertion falsifiable by a realistic bug?

**Phase 3 -- The Fundamental Test**: Estimates the answer to: "If you deleted all mocks, removed all env-var gates, and ran the full test suite against real infrastructure -- how many tests would pass?" The delta between current passing count and this estimate is the fraud margin.

**Phase 4 -- Report**: Produces a structured audit report with verdict (PASS / FAIL / CRITICAL FAIL), all eight patterns with counts and evidence, real numbers vs. claimed numbers, top smoking gun examples with file:line, and a remediation priority list.

## Examples

### Example 1: Post-Incident Test Audit

```
User: "We have 1,500 tests but nothing works when I use it"

CRUCIBLE Detective:
  - Phase 1: 439 mocks, 66 hollow assertions, 12 coverage omits
  - Phase 2: Integration tests mock TTS, ASR, and ffmpeg -- the
    three things this pipeline exists to do
  - Phase 3: Estimated real passing without mocks: ~220 of 1,500
  - Phase 4: CRITICAL FAIL
    - Claimed coverage: 77%. Real coverage: ~15%.
    - Fraud margin: 62 percentage points.
    - Top finding: tests/integration/test_pipeline.py mocks
      every dependency it claims to integrate.
```

### Example 2: Pre-Release Verification

```
User: "We're about to publish to npm"

CRUCIBLE Detective:
  - Scans test suite: 342 tests, 89% claimed coverage
  - Pattern 1: coveragePathIgnorePatterns includes src/core/
  - Pattern 2: 14 instances of "assert result is not None"
  - Pattern 6: No tests touch the CLI entry point
  - Verdict: FAIL
    - Removing src/core/ from ignores drops coverage to 61%
    - CLI (main user entry point) has zero test coverage
    - 14 assertions would pass even if functions returned garbage
```

### Example 3: Sprint Test Quality Spot Check

```
User: "The team added 400 tests in one sprint"

CRUCIBLE Detective:
  - Analyzes the 400 new tests
  - 312 are mock-heavy with hollow assertions
  - 88 are meaningful unit tests with specific value assertions
  - Mock ratio in new tests: 78%
  - Verdict: FAIL
    - 78% of new tests prove nothing about production behavior
    - Recommendation: Delete 312 hollow tests, keep 88 real ones
    - Real test delta this sprint: +88, not +400
```

## Power Use Cases

**Gate 8 Enforcement**: The CRUCIBLE Detective implements Gate 8 (Coverage Integrity Audit) from the CRUCIBLE Protocol. It calculates the real coverage delta -- coverage measured after removing unjustified omits. If removing omits drops coverage by more than 10 percentage points, that is a P0 finding that blocks release.

**Cross-Project Audit Standardization**: Run the same eight-pattern scan across every project in a portfolio to establish a consistent quality baseline. Projects that pass a CRUCIBLE audit have earned trust; projects that fail know exactly what to fix.

**Test Suite Archaeology**: When inheriting a legacy codebase, run a CRUCIBLE audit before trusting any existing test metrics. The audit reveals which tests are real assets and which are technical debt disguised as quality.

## Combines With

| Feature | Synergy |
|---------|---------|
| **QA Sentinel** | Detective finds the fraud; QA Sentinel designs the strategy to fix it |
| **Testing agent** | Detective identifies what is hollow; Testing agent rewrites with meaningful assertions |
| **Guardian agent** | CRUCIBLE audit results feed into governance quality gates |
| **/forge:test** | Run tests first, then audit the results with the Detective |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full 8-pattern forensic audit, fraud margin calculation, evidence-backed verdicts |
| **L2 Pro Builder** | + `forge_capture_knowledge` records audit findings; `forge_check_drift` detects quality regression between audits |
| **L3 Ship Lord** | + Dashboard panel showing audit history, fraud margin trends, and per-pattern violation counts |

## Tips & Gotchas

- **Do**: Run a CRUCIBLE audit before every release. It takes minutes and catches fraud that manual review misses.
- **Do**: Trust the fraud margin number -- it is the single most honest metric about your test suite quality.
- **Don't**: Shoot the messenger. The Detective reports findings without softening. If the numbers are bad, the tests need fixing, not the audit.
- **Don't**: Confuse this agent with the QA Sentinel or Testing agent. The Detective audits. It does not design strategy or write tests.

---

*See also: [qa-sentinel](qa-sentinel.md), [governance-verifier](governance-verifier.md)*
