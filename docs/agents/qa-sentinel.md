# QA Sentinel

> The quality strategist who designs test systems where meaningful failures are structurally impossible to miss -- not by counting tests, but by ensuring every assertion would fail if the code produced wrong output.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Engineering Leadership |
| **Model** | Sonnet |

---

## What It Does

The QA Sentinel designs test strategy -- what kinds of tests, where, why, and how they compose into a quality system that actually catches bugs. It does not write tests (that is the Testing agent). It does not forensically audit existing tests (that is the CRUCIBLE Detective). It is the architect of quality -- the mind that decides whether you need property-based testing for your serialization layer, mutation testing for your billing logic, or contract tests for your MCP tool interfaces.

It was forged from two hard lessons in the NXTG-AI portfolio. dx3 had 3,277 passing tests but shipped a bug that silently lost all graph metadata -- because tests asserted `isinstance(result.data, list)` and empty lists pass that assertion. Podcast-Pipeline had 1,601 "passing" tests and claimed 77% coverage, but real coverage was approximately 15%. The QA Sentinel exists to design test systems where these failures are structurally impossible.

It enforces the CRUCIBLE Protocol -- all 8 gates -- as non-negotiable quality standards: xfail governance, non-empty result assertions, mock drift detection, test count delta gates, silent exception audits, mutation testing thresholds, spec-test traceability, and coverage integrity audits. It also designs strategies for advanced testing techniques: mutation testing (mutmut, Stryker, cargo-mutants), property-based testing (Hypothesis, fast-check, proptest), visual regression testing (Playwright screenshots, Percy), load testing (k6, Artillery, Locust), and contract testing (Pact, OpenAPI validation).

## When to Use It

- **New feature test strategy**: Before implementation begins, design the test approach -- which layers, which techniques, which coverage targets.
- **CRUCIBLE gate enforcement**: When you need to verify compliance with all 8 CRUCIBLE gates before a release.
- **Systemic test suite problems**: When flaky tests are eroding trust, hollow assertions are passing despite bugs, or coverage numbers do not match reality.
- **Mutation testing rollout**: When you want to validate that your tests actually catch bugs, not just execute code paths.
- **Test layer design**: When you need to decide the right mix of unit, integration, e2e, property-based, and contract tests for a component.

Do not use this agent to write test code (use the Testing agent) or to forensically audit existing test suites (use the CRUCIBLE Detective).

## How It Works

1. **Risk Profiling**: Assesses what the code does, who uses it, what happens if it is wrong, and how often it changes. Maps to criticality tiers: Critical (all oracle types + Human Oracle), Standard (2-3 oracle types), Internal (2 minimum).
2. **Layer Selection**: Determines which testing trophy layers each component needs -- static analysis, unit, integration, e2e -- based on the component's nature and risk profile.
3. **Property Identification**: For data transformations and algorithms, identifies universal invariants: round-trip properties, idempotency, monotonicity, bounds, and preservation properties.
4. **Advanced Technique Recommendation**: Based on the risk profile, recommends mutation testing targets, contract test interfaces, visual regression coverage, and load test scenarios.
5. **Strategy Document Production**: Outputs a structured test strategy with risk profile, trophy distribution, advanced testing plan, test data strategy, CRUCIBLE gate compliance checklist, and effort estimates.

## Examples

### Example 1: Test Strategy for Real-Time Collaboration

```
User: "We're building a real-time collaboration engine. What's
       the test strategy?"

QA Sentinel:
  - Risk profile: Critical (data integrity, multi-user state)
  - Testing trophy:
    Static: TypeScript strict, ESLint rules for async patterns
    Unit: CRDT merge algorithms, conflict resolution logic
    Integration: WebSocket message roundtrip with real server
    E2E: Two-user edit session with conflict scenario
  - Property-based: CRDT commutativity (merge(A,B) == merge(B,A)),
    convergence (all replicas eventually match)
  - Contract tests: WebSocket message schema (Pact)
  - Load test: 100 concurrent editors, p99 < 200ms
  - Mutation targets: merge algorithm, conflict resolver
  - CRUCIBLE gates: All 8 mandatory (Critical tier)
  - Result: Complete strategy doc with layers, techniques,
    tools, thresholds, and phased rollout plan.
```

### Example 2: Mutation Testing Rollout Plan

```
User: "We have 800 tests but I'm not sure they catch real bugs"

QA Sentinel:
  - Analyzes codebase for highest-value mutation targets:
    1. Billing calculation logic (financial impact)
    2. Authentication token validation (security impact)
    3. Data transformation pipeline (data integrity)
  - Recommends Stryker for TypeScript codebase
  - Rollout plan:
    Phase 1: Run on billing module manually, expect ~35% score
    Phase 2: Fix surviving mutants by strengthening assertions
    Phase 3: Expand to auth and data modules
    Phase 4: Add to CI as non-blocking report
    Phase 5: Make blocking for critical paths (threshold: 60%)
  - Result: 5-phase rollout with specific modules, thresholds,
    and timeline.
```

### Example 3: Flaky Test Systemic Diagnosis

```
User: "40 flaky tests, team is starting to ignore failures"

QA Sentinel:
  - Categorizes the 40 flaky tests by root cause:
    18: Shared mutable state (tests pass alone, fail in suite)
    12: Timing dependencies (sleep-based, fail on slow CI)
    7:  External dependency (network calls in unit tests)
    3:  Non-determinism (unseeded random, system clock)
  - Systemic fixes:
    1. Isolate per-test: fresh DB/temp dir per test (fixes 18)
    2. Replace sleep() with explicit waits/retries (fixes 12)
    3. Mock external services, real dependencies (fixes 7)
    4. Seed RNGs, freeze time (fixes 3)
  - Prevention architecture:
    - Run tests in random order in CI (expose order dependence)
    - Quarantine flaky tests with 2-week fix-or-delete SLA
    - Design all new tests for parallel safety from the start
  - Result: Root cause categorization, prioritized fixes, and
    prevention guardrails.
```

## Power Use Cases

**CRUCIBLE Gate Compliance Audit**: Run the full 8-gate checklist against any project with specific bash commands for each gate. Gate 1: check recent xfail removals in git log. Gate 2: grep for hollow assertions. Gate 3: find commits that change both implementation and mocks. Gate 4: track test count deltas. Gate 5: find silent except blocks. Gate 6: check for mutation testing in dev dependencies. Gate 7: search for spec traceability markers. Gate 8: audit coverage config for unjustified omits. Report PASS/FAIL per gate with file:line evidence.

**Testing Trophy Calibration**: For an existing project, the QA Sentinel can analyze the current test distribution and compare it against the ideal testing trophy. If 90% of tests are unit tests and 2% are integration tests, the suite is bottom-heavy -- most confidence lives in the integration layer, which is underinvested. The sentinel recommends redistributing effort.

**Mock-vs-Real Decision Matrix**: Produces a definitive guide for the team: your own database (use real), your own services (use real), your own file system (use temp directories), third-party APIs (mock or use sandboxes), system clock (freeze), RNG (seed), GPU (real if available, skip if not). This eliminates the recurring debate about when mocking is appropriate.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Testing agent** | QA Sentinel designs the strategy; Testing agent writes the tests |
| **CRUCIBLE Detective** | QA Sentinel enforces gates proactively; Detective audits retroactively |
| **Guardian agent** | Guardian enforces quality gates at commit time; QA Sentinel designs what those gates should check |
| **/forge:test** | Run the test suite, then use QA Sentinel to evaluate whether the results are meaningful |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Test strategy design, CRUCIBLE gate enforcement, hollow assertion detection, flaky test diagnosis, mutation testing planning |
| **L2 Pro Builder** | + `forge_capture_knowledge` records test strategy decisions; `forge_get_knowledge` recalls past quality patterns |
| **L3 Ship Lord** | + Dashboard panel showing CRUCIBLE gate compliance, mutation scores, test distribution chart, and flaky test quarantine status |

## Tips & Gotchas

- **Do**: Design the test strategy before writing a single test. Strategy first, code second.
- **Do**: Use mutation testing on critical paths. Coverage numbers lie; mutation scores reveal the truth.
- **Don't**: Count tests as a quality metric. 300 meaningful tests beat 3,000 hollow ones.
- **Don't**: Mock things you own. If you built the database, test against the real database.

---

*See also: [crucible-detective](crucible-detective.md), [governance-verifier](governance-verifier.md)*
