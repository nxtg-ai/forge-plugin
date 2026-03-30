# Testing Strategy

> The comprehensive testing playbook for NXTG-Forge projects -- pyramid distribution, coverage targets by module, test double taxonomy, async testing patterns, CI configuration, and performance benchmarks that agents follow when planning test suites.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Knowledge |

---

## What It Provides

This skill goes beyond individual test patterns (covered by core-testing) to encode a complete testing strategy: coverage targets by module type (domain 95%, application 90%, infrastructure 85%, CLI 80%), test double selection (when to use dummies vs stubs vs spies vs mocks vs fakes), async test patterns, performance test benchmarks, test data management with builders and factories, and full CI/CD configuration including GitHub Actions workflows and pre-commit hooks.

Without this skill, agents write tests but lack strategic judgment about where to invest testing effort. They might write exhaustive E2E tests for utility functions (slow, fragile) while skipping unit tests for domain logic (fast, valuable). They might mock everything (fast but meaningless) or mock nothing (thorough but slow). The skill teaches agents to make these trade-offs correctly based on the code's role in the architecture.

The knowledge is both strategic (where to test what, how much coverage each module needs) and tactical (exact pytest configuration, CI workflow YAML, coverage reporting commands, test marker definitions). It bridges the gap between "write good tests" and "here is exactly how to set up, run, and enforce testing in this project."

## When It Activates

- When planning a testing approach for a new feature or module
- When configuring test infrastructure (CI, coverage, pre-commit hooks)
- When evaluating whether test coverage is sufficient
- When deciding how to test async code, database operations, or CLI commands

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### Coverage Targets by Module Type

Not all code deserves equal testing investment. Domain logic (95%+) and application services (90%+) encode business rules that must never break silently. Infrastructure code (85%+) handles I/O that is harder to test exhaustively. CLI commands (80%+) involve user interaction that is best validated through integration tests. The skill teaches agents to allocate testing effort proportionally to risk, not uniformly across all code.

### Test Double Taxonomy

Five types, each for a specific purpose: Dummies (passed but never used -- satisfy parameter requirements), Stubs (return canned responses -- isolate the system under test), Spies (record calls for verification -- confirm interactions), Mocks (programmed with expectations -- verify complex protocols), Fakes (simplified working implementations -- in-memory databases for integration tests). The skill shows when each is appropriate. Using a Mock when a Stub suffices couples tests to implementation. Using a Fake when a Stub would do adds unnecessary complexity.

### Test Data Management

Test Data Builders provide a fluent API for constructing test objects: `TemplateBuilder().with_name("api").with_version("2.0").with_file("main.py", content).build()`. Fixture Factories provide parameterized constructors: `make_task("Implement auth")` or `make_task("Add tests", priority="high")`. Both patterns reduce test boilerplate and make test data construction readable. The skill teaches agents to prefer builders for complex objects and factories for simple ones.

### Async Testing Patterns

Testing concurrent code requires specific patterns: `@pytest.mark.asyncio` for individual async tests, `asyncio.gather()` for testing parallel execution, and careful assertion of result ordering. The skill includes examples of testing both single async operations and concurrent task execution with multiple workers.

### CI Pipeline Configuration

A complete GitHub Actions workflow: checkout, Python setup, dependency installation, linter execution (black --check, ruff check, mypy), test execution with coverage (pytest --cov --cov-fail-under=80), and coverage upload to Codecov. Plus pre-commit hooks that run the same checks locally before each commit. This ensures agents can set up the full quality pipeline, not just write tests.

## How to Leverage It

When starting a new module, ask the agent to "design a testing strategy" before writing tests. The skill guides agents to identify the module's role (domain, application, infrastructure, interface), select appropriate coverage targets, choose the right test doubles, and plan the test directory structure.

### Example: Feature Testing Plan

```
User: "Plan the testing strategy for the new payment processing module"

What happens: The skill activates and the agent produces a testing plan: domain logic
(PaymentCalculator) gets 95% unit test coverage with stubs for external services,
the PaymentUseCase gets 90% coverage with mock payment gateways, the Stripe
infrastructure adapter gets 85% integration test coverage with a fake HTTP client,
and the API endpoint gets E2E tests that verify the full request/response cycle.
```

## Power Applications

The test performance benchmarks prevent test suite degradation over time. Unit tests under 100ms, integration tests under 1 second, E2E tests under 30 seconds, full suite under 5 minutes. When a test exceeds these thresholds, agents are taught to investigate and optimize rather than accept the slowdown. Over months of development, this discipline keeps the test suite fast enough that developers actually run it.

The pytest marker system (`@pytest.mark.slow`, `@pytest.mark.integration`, `@pytest.mark.e2e`) enables selective test execution during development while running the full suite in CI. Agents set this up automatically.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **core-testing** | Foundational test patterns (AAA, naming, fixtures) that this skill builds upon |
| **testing** | Broader testing philosophy (TDD, BDD, property-based) that complements this strategy |
| **coding-standards** | Test organization rules and pytest configuration defined here |

## Tips

- Coverage targets are minimums, not goals. Aim higher for critical business logic.
- The test double taxonomy prevents the common mistake of mocking everything -- use the simplest double that achieves isolation.

---

*See also: [core-testing](core-testing.md) | [testing](testing.md)*
