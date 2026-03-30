# Core Testing

> Establishes the testing pyramid, AAA pattern, coverage targets, and test isolation principles that agents follow when generating or evaluating test suites.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Core |

---

## What It Provides

This skill encodes the testing philosophy and practical patterns that produce reliable, maintainable test suites. It teaches agents the testing pyramid (70% unit, 20% integration, 10% E2E), the Arrange-Act-Assert pattern, naming conventions that communicate intent, fixture design, parametrized testing, proper mocking boundaries, and coverage targets by module type. It covers unit testing, integration testing with real databases, API testing with HTTP clients, and end-to-end testing with Playwright.

Without this skill, agents produce tests that are shallow (truthiness checks instead of specific value assertions), coupled (test B depends on test A running first), slow (real database connections in unit tests), and poorly named (`test_user` instead of `test_register_user_with_duplicate_email_raises_error`). The skill eliminates these anti-patterns by teaching agents what good tests look like at every level of the pyramid.

The knowledge is concrete and example-driven: full code samples for async test fixtures, parametrized password validation tests, database integration tests with proper setup/teardown, and API tests that verify both success and error responses including the absence of sensitive data in responses.

## When It Activates

- When an agent is writing tests for new or existing code
- When evaluating test coverage or test quality
- When setting up test infrastructure (fixtures, conftest, CI configuration)
- When debugging flaky or slow tests

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### The Testing Pyramid in Practice

70% unit tests (fast, isolated, under 100ms each), 20% integration tests (real components, under 1 second each), 10% E2E tests (full workflows, under 30 seconds each). The full suite should complete in under 5 minutes. The skill enforces this distribution not as dogma but as a quality lever -- too many E2E tests make the suite slow and brittle, too few integration tests miss component interaction bugs. Coverage target is 85% overall, with 100% required for authentication, payment processing, and security-sensitive operations.

### Test Naming as Documentation

The pattern `test_<method>_<scenario>_<expected>` turns test names into specifications. `test_register_user_with_valid_email_creates_user` tells you exactly what is being tested, under what conditions, and what should happen. Vague names like `test_user` or `test_error` are explicitly flagged. This matters because when a test fails in CI, the name is often the first thing a developer reads -- it should explain the failure without opening the test file.

### Mocking Boundaries

Mock external dependencies (databases, APIs, file systems), never internal methods. The skill teaches this through counterexample: mocking `processor._internal_method` ties tests to implementation details, causing them to break on refactoring even when behavior is preserved. Instead, mock the repository or service that the processor depends on. This keeps tests focused on behavior, making them resilient to internal code changes.

### Fixture Composition and Parametrization

Reusable fixtures (`valid_user_data`, `user_repo`, `use_case`) compose to reduce test boilerplate. Parametrized tests cover multiple scenarios with a single test function -- the password validation example tests five different passwords (short, empty, digits-only, two valid) in a single parametrized test. This produces thorough coverage with minimal code.

### Integration Test Isolation

Database tests use per-test sessions with automatic table creation and cleanup. The skill teaches the yield-based fixture pattern: create tables before the test, yield the session, drop tables after. This ensures each test starts with a clean database, preventing cross-test contamination that causes flaky failures.

## How to Leverage It

Ask agents to "write comprehensive tests" rather than just "add tests." The skill activates more strongly when the prompt signals thoroughness. For existing code without tests, ask the agent to "analyze coverage gaps and write tests for uncovered paths."

### Example: Test Generation

```
User: "Add tests for the user registration endpoint"

What happens: The skill activates and guides the agent to write unit tests for the
use case (mocked repository), integration tests for the API endpoint (real HTTP calls),
and edge case tests (duplicate email, weak password, missing fields). Each test follows
AAA pattern with descriptive names.
```

## Power Applications

The skill prevents the most dangerous testing anti-pattern: tests that pass but prove nothing. An agent taught by this skill will never write `assert user` (truthiness check) when it should write `assert user.email == "test@example.com"` (specific value assertion). It will never write `assert response.status_code` when it should write `assert response.status_code == 201`. These specific assertions catch real bugs; truthiness checks hide them.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **core-coding-standards** | Code style rules that apply equally to test code |
| **testing-strategy** | Extends these patterns with project-specific testing strategy |
| **testing** | Broader testing knowledge including TDD, BDD, and property-based testing |

## Tips

- Tests should test behavior (what the code does), never implementation (how it does it).
- If a test requires more than three lines of setup, extract a fixture.

---

*See also: [testing-strategy](testing-strategy.md) | [testing](testing.md)*
