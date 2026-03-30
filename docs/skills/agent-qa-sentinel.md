# QA Sentinel Agent

> Encodes comprehensive quality assurance expertise -- test strategies, coverage analysis, code review checklists, and the testing pyramid discipline that ensures software actually works.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Agent Roles |

---

## What It Provides

The QA Sentinel skill teaches agents the full spectrum of software quality assurance: unit testing with pytest/Jest/Vitest, integration testing with real databases, E2E testing with Playwright/Cypress, load testing with Locust/k6, security testing, and contract testing. It enforces the testing pyramid (70% unit, 20% integration, 10% E2E) and strict quality standards.

Without this skill, agents write tests that check existence rather than correctness, mix test responsibilities into single functions, skip edge cases and error paths, and produce test suites that pass at 100% while proving nothing about the software's actual behavior. With it, agents follow the AAA pattern (Arrange, Act, Assert), write one assertion per test, use descriptive test names, employ fixtures for reusable setup, and target specific coverage thresholds for different code categories.

The skill covers the full quality lifecycle: writing tests, performing code reviews, tracking coverage metrics, and providing quality reports to all other agents in the system.

## When It Activates

- When writing test suites for new or existing features
- When performing code reviews or quality audits
- When setting up test infrastructure, fixtures, or CI test pipelines
- When analyzing test coverage gaps or reviewing quality metrics

## The Knowledge Inside

### The Testing Pyramid

Three test types serve different purposes. **Unit tests** (70% of suite): fast, isolated, test business logic and use cases. Minimum 85% coverage. Focus on happy path, edge cases, and error cases. **Integration tests** (20%): test component interactions with real databases and services, no mocks. Cover 70% of critical paths. **E2E tests** (10%): test complete user workflows through the actual UI. Cover critical user flows only (registration, login, core features).

### The AAA Pattern

Every test follows three clearly separated sections. **Arrange**: set up test data, mocks, and fixtures. **Act**: execute the single operation under test. **Assert**: verify the specific expected outcome. Agents learn that mixing these sections (setting up mocks after the action, or asserting while arranging) produces fragile, unreadable tests.

### Test Quality Criteria (FIRST)

Five properties of good tests: **Fast** (unit tests under 100ms each), **Isolated** (no dependencies on other tests or shared state), **Repeatable** (same results every run, no flakiness), **Self-validating** (pass or fail, no manual inspection needed), **Timely** (written with or before the code, not months later). The skill provides concrete test naming examples: `test_register_user_with_valid_email_creates_user` instead of `test_user1`.

### Coverage Strategy

Coverage targets vary by code category. Critical paths (payment processing, authentication, data validation) demand 100% coverage. Business logic and use cases target 85% minimum. Simple getters/setters and auto-generated code can be skipped. Integration tests target 70% of critical paths. E2E tests cover the user journeys that generate revenue or trust.

### Parametrized Testing

The skill teaches parametrized tests for efficiently covering multiple edge cases. Password validation, amount validation, and input sanitization are prime candidates -- a single parametrized test function can cover zero amounts, negative amounts, minimum valid amounts, and maximum amounts with shared setup and distinct assertions.

## How to Leverage It

Ask the agent to write tests for a specific feature, and it will produce a comprehensive suite following the AAA pattern with fixtures, parametrized edge cases, and coverage verification.

### Example: Payment Processor Tests
```
User: "Write tests for the payment processor"
What happens: The agent creates a test class with fixtures for payment
gateway and repository mocks, tests for successful payment, gateway errors,
and parametrized amount validation (zero, negative, minimum, large amounts),
plus a performance assertion verifying processing completes under 2 seconds.
```

## Power Applications

- Use parametrized tests to cover input validation boundaries systematically rather than ad hoc
- Apply the code review checklist as a CI gate to enforce quality standards automatically
- Combine with crucible-audit to verify that test quality matches test quantity

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **crucible-audit** | Crucible audits test quality; QA Sentinel writes quality tests |
| **runtime-validation** | Runtime validation catches errors that even QA Sentinel's tests might miss |
| **agent-backend-master** | Provides implementations for QA Sentinel to test |
| **verify-governance** | Validates that test changes align with implementation behavior |

## Tips

- One assertion per test function -- if a test has five assertions and the first fails, the other four are invisible
- Mocks are for external APIs you do not control; use real implementations for internal components
- Descriptive test names are documentation -- a reader should understand the expected behavior from the name alone

---

*See also: [crucible-audit](crucible-audit.md), [runtime-validation](runtime-validation.md)*
