# Crucible Audit

> Provides the forensic methodology for detecting test fraud -- hollow assertions, coverage gaming, mock proliferation, and every other pattern that creates false green signals in test suites.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Workflow |

---

## What It Provides

The CRUCIBLE Audit skill encodes a forensic test quality protocol born from a real incident: a project with 1,601 tests and 77% claimed coverage that had approximately 15% actual coverage and nothing worked when a human used it. It teaches agents to detect eight specific fraud patterns that inflate test metrics without proving software correctness.

Without this skill, agents trust test count and coverage percentage at face value. A project reporting 500 tests and 90% coverage is assumed healthy. With the CRUCIBLE skill, agents know to check whether coverage configuration excludes hard-to-test code, whether assertions are falsifiable, whether mocks replace the components they claim to test, whether "integration" tests actually integrate anything, and whether entry points that users interact with have any coverage at all.

The skill provides detection commands, severity ratings, and remediation guidance for each pattern, plus a structured audit report template that separates claimed numbers from real numbers.

## When It Activates

- When a project claims high test count or coverage but quality concerns exist
- Before any release gate, pre-publish, or pre-deploy quality check
- When test count increases rapidly (over 100 tests in one sprint is suspicious)
- When a human finds bugs that tests should have caught
- During portfolio enrichment cycles for spot audits

## The Knowledge Inside

### Pattern 1: Coverage Omit Gaming

The most deliberate form of fraud: excluding hard-to-test directories from coverage configuration to inflate the percentage. Detection: inspect `pyproject.toml` for `[tool.coverage.run] omit` entries, or `jest.config` for `coveragePathIgnorePatterns`. Every omitted path is source code that should count toward the denominator. Severity: CRITICAL.

### Pattern 2: Hollow Assertions

Assertions that pass regardless of correctness: `assert result is not None` (passes for any non-None value), `assert len(items) >= 0` (always true), `assert True`, `assert isinstance(x, dict)` (type check without value check). The test for an assertion's validity: can it fail when the code has a realistic bug? If not, it is hollow. Severity: HIGH.

### Pattern 3: Mock Proliferation

Mocking internal components so tests verify mock behavior instead of real behavior. The skill defines a mock ratio metric (mock usage lines divided by test functions). Above 30% is HIGH severity. The rule: mocks are for external APIs you do not control. Internal code uses real implementations. Files named `*integration*` or `*e2e*` containing `@patch` or `MagicMock` are immediate red flags.

### Pattern 4: Dead Test Infrastructure

Tests gated by environment variables, skip markers, or conditions that are never activated in CI. Detection: find all `os.environ.get` references in test files, then check whether those variables are set in Makefile, CI configuration, or pytest.ini. Tests that cannot run in CI are not tests -- they are decoration.

### Pattern 5: Mock-Heavy Integration Tests

The most dangerous pattern: tests labeled "integration" or "e2e" that mock the very components they claim to integrate. This appears to be the highest-value testing while proving nothing about actual integration behavior. Detection: count mock usage in files matching `*integration*`, `*e2e*`, or `*smoke*`. Severity: CRITICAL.

### Patterns 6-8: Untested Entry Points, No Quality Verification, Badge Fraud

**Pattern 6**: User-facing code (API routes, CLI handlers, main entry points) with near-zero coverage. If users cannot reach tested code, tests do not matter. **Pattern 7**: Tests that verify execution but not output correctness -- checking that a function ran without checking what it produced. **Pattern 8**: README badges showing different numbers than reality. Each has specific detection commands and remediation steps.

### The Fundamental Test

The skill encodes one decisive question: if you deleted all mocks, removed all env-var gates, and ran the full test suite against real infrastructure -- how many tests would pass? That number is the real test count. Everything above it is scaffolding.

## How to Leverage It

Ask for a CRUCIBLE audit on any project, and the agent will systematically check all eight patterns, produce a structured report, and provide prioritized remediation steps.

### Example: Auditing a Suspicious Test Suite
```
User: "Run a CRUCIBLE audit on this project"
What happens: The agent checks coverage config for omit gaming, scans test
files for hollow assertions and mock ratios, identifies dead test gates,
inspects integration tests for mock contamination, checks entry point
coverage, evaluates output quality verification, and compares README badges
to actual numbers. Produces a structured report with verdict, real numbers,
smoking gun examples, and remediation priority list.
```

## Power Applications

- Run CRUCIBLE as a CI gate to prevent test fraud from accumulating over time
- Use the mock ratio metric as a dashboard indicator for test suite health
- Apply the fundamental test (delete all mocks, run against real infrastructure) as a quarterly audit

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **agent-qa-sentinel** | QA Sentinel writes quality tests; CRUCIBLE verifies they are genuine |
| **runtime-validation** | Runtime validation catches errors that hollow tests miss |
| **verify-governance** | Governance verification can trigger CRUCIBLE audits for suspicious changes |
| **ceo-loop** | Quality decisions in the CEO loop often reference CRUCIBLE audit results |

## Tips

- A rapid increase in test count (100+ in one sprint) is a leading indicator of hollow test generation -- audit immediately
- The mock ratio is a powerful early warning metric; track it over time and investigate spikes
- Coverage omit gaming is the only pattern that requires deliberate configuration changes -- it is always intentional

---

*See also: [agent-qa-sentinel](agent-qa-sentinel.md), [runtime-validation](runtime-validation.md)*
