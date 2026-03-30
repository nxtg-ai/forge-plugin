# Runtime Validation

> Teaches agents to monitor application behavior during test execution, catching runtime errors that unit tests miss.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Knowledge |

---

## What It Provides

Runtime Validation encodes a testing protocol that bridges the gap between static unit tests and production monitoring. It teaches agents to instrument test runs with log monitoring, contract validation, data integrity checking, and anomaly detection -- so that passing tests actually prove the application works correctly.

The core insight is that a test suite can achieve 100% pass rates while the application emits runtime errors in its logs. Without this skill, agents write tests that assert surface-level outcomes (status codes, return types) while missing deeper issues like Pydantic validation failures, mathematical invariant violations, and schema drift between architectural layers.

This skill encodes the four-component architecture (Log Monitor, Contract Validator, Data Integrity Checker, Anomaly Detector) and teaches agents how to wire each into the test pyramid at the appropriate level -- unit, integration, and end-to-end.

## When It Activates

- When you are writing or reviewing tests for an application with runtime validation concerns
- When an agent encounters Pydantic validation errors, data corruption, or contract mismatches
- When your project has a gap between test coverage numbers and actual production reliability
- When building test infrastructure for applications with mathematical invariants (densities, percentages, ratios)

## The Knowledge Inside

### Log Monitoring During Tests

The skill teaches agents to scan application logs continuously during test execution. Rather than treating tests and logs as separate concerns, agents learn to attach a LogMonitor fixture that watches for error patterns like `validation error for \w+` or `Input should be .* than`. If a test passes but the log contains a validation error, the test should fail -- the runtime validator enforces this.

### Contract Validation at Boundaries

API responses should be validated against their Pydantic models (or equivalent schema definitions) during test runs, not just in production. The skill provides the ContractValidator pattern: after every API call in a test, the response is validated against the expected model. Schema drift between what the API returns and what the model expects is caught immediately, not after deployment.

### Data Integrity Invariants

Every domain has mathematical truths that should never be violated: densities must be between 0 and 1, percentages cannot exceed 100, referential integrity must hold. The DataIntegrityChecker pattern teaches agents to define these invariants declaratively and verify them on every test run. The skill includes a real-world example where a graph density calculation returned 4.5 -- caught by runtime validation but invisible to unit tests that only checked `density > 0`.

### CI/CD Integration

Runtime validation is not optional. The skill teaches agents to wire it into GitHub Actions workflows so that runtime errors cause CI failures, not just test failures. It includes the YAML configuration, artifact upload for failure reports, and metrics tracking (runtime error rate, contract violation rate, detection latency).

## How to Leverage It

Structure your test infrastructure with runtime validation from the start. When asking an agent to build tests, mention runtime validation explicitly to get the full monitoring stack.

### Example: Catching Hidden Failures
```
User: "Write tests for the graph clustering endpoint"
What happens: The agent generates tests that assert status codes AND attach
runtime validators to check that cluster density values stay within [0, 1],
log monitoring catches any Pydantic validation errors, and contract validation
confirms the response matches the GraphOverviewResponse model.
```

## Power Applications

- Retrofit existing test suites: add runtime validation as a pytest fixture without rewriting tests
- Use the DataIntegrityChecker to define domain invariants once and enforce them across all test types
- Track runtime error rate as a release gate metric alongside test coverage

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **crucible-audit** | Crucible detects hollow test assertions; runtime validation prevents them |
| **agent-qa-sentinel** | QA Sentinel uses runtime validation patterns when writing test suites |
| **optimization** | Runtime validation's anomaly detector catches performance regressions |

## Tips

- Runtime validation adds approximately 5% overhead to test execution -- a small price for catching 15-30% more bugs
- Define invariants at the domain level, not per-test -- they should be universal truths about your data
- Never suppress a runtime validation error without fixing the root cause; the error is real even if the test passes

---

*See also: [crucible-audit](crucible-audit.md), [agent-qa-sentinel](agent-qa-sentinel.md)*
