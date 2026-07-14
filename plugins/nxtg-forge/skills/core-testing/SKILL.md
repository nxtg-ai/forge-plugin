---
name: Core Testing
description: >
  Core testing principles and test-infrastructure patterns — the testing pyramid,
  Arrange-Act-Assert, behavior-over-implementation, fixtures, coverage targets, and
  what separates a real test from theater. Use when writing, reviewing, or forensically
  auditing a test suite; when deciding what/how to test; when coverage or test counts
  look suspiciously high; or when a change must not drop test quality. Backs the
  crucible-detective agent's fraud hunt (hollow assertions, mock proliferation, dead
  tests). Patterns are language-agnostic; examples are Python/pytest — translate to
  vitest/node:test or cargo test.
when_to_use: >
  writing tests, reviewing a PR's tests, "add tests", "improve coverage", "is this
  test real", auditing test quality, test-fraud / hollow-test detection, pre-release
  test gate, deciding unit vs integration vs e2e, test naming, fixtures, mocking strategy.
user-invocable: false
allowed-tools: Read, Grep, Glob
---

# Core Testing Standards

Good tests are **fast, isolated, repeatable, and assert behavior — not
implementation**. A test that runs green while proving nothing is worse than no
test: it manufactures false confidence. Quality is not the count; it is what each
assertion actually pins down.

## The Testing Pyramid

```
     /\
    /E2E\      10% — full user flows (slow, brittle, high-value)
   /------\
  /  INT   \   20% — real component seams (DB, HTTP, services)
 /----------\
/   UNIT     \ 70% — fast, isolated, mocked collaborators
--------------
```

**Overall coverage target: ≥ 85%** — but coverage is a map of what *ran*, not proof
it was *verified*. Read it alongside assertion quality, never alone.

## Five Non-Negotiable Principles

1. **Assert behavior, not implementation.** Check the returned value / observable
   effect, not that some internal mock was called. `mock.assert_called_once()` as the
   *only* assertion is a fraud smell.
2. **Descriptive names as specs.** `test_register_with_duplicate_email_raises` — not
   `test_user`, `test_1`. A vague name is where a hollow test hides.
3. **One reason to fail per test.** Group related asserts; split unrelated ones.
4. **Isolated & repeatable.** No shared mutable state, no order dependence, always
   tear down. Each test creates its own fixtures.
5. **Right layer for the seam.** Mock external collaborators in unit tests; use the
   *real* seam in integration tests. A unit test hitting a real DB is misclassified.

## Worked Example — behavior vs implementation

```python
# GOOD — asserts the OUTCOME; survives any refactor of how it's built
async def test_registration_creates_active_user():
    user = await register_user("a@example.com", "SecurePass123!")
    assert user.email == "a@example.com"
    assert user.is_active is True

# BAD — asserts HOW, breaks on refactor, proves nothing about correctness
async def test_registration_calls_bcrypt():
    await register_user("a@example.com", "SecurePass123!")
    bcrypt.hash.assert_called_once()      # implementation detail, not behavior
```

## This Plugin's Suites (real commands)

```bash
# Node governance-mcp (primary CI) — vitest, tests/**/*.test.mjs
cd servers/governance-mcp && npx vitest run
# Node governance-mcp — node:test runner, __tests__/*.test.mjs (separate dir)
FORGE_TEST_MODE=1 node --test __tests__/health.test.mjs
# Rust orchestrator (sibling repo)
cd ../../forge-orchestrator && cargo test
```

## Gotchas

- **Coverage % lies under an omit list.** `coveragePathIgnorePatterns` (jest/vitest),
  `omit` in `.coveragerc`/`pyproject.toml`, or excluding modules from
  `collectCoverageFrom` inflates the number by hiding untested code. Podcast-Pipeline
  (2026-03-07): 77% claimed, ~15% real — the delta was omitted ML engines. Always
  read the omit list before trusting a coverage badge.
- **Test count is a vanity metric; the count-never-decrease rule does not guarantee
  quality.** This repo forbids deleting tests (counts never decrease), but a hollow
  test satisfies the count while asserting nothing. 1,601 "passing" tests proved
  nothing when a human used the product. Count is a floor on *quantity*, never *proof*.
- **Hollow assertions pass forever.** `toBeDefined()`, `typeof x === 'string'`,
  `assert result is not None` verify existence, not correctness. governance-mcp shed
  14 of these in v3.4.8 → `expect.objectContaining({...})` and real value checks.
  Any assertion that cannot fail on a wrong value is theater.
- **Language mismatch — examples are Python, this plugin is not.** The reference
  patterns use pytest, but governance-mcp is tested with **vitest** + **node:test**
  and forge-orchestrator with **cargo test**. The *patterns* transfer; the *syntax
  and fixtures* do not. Don't recommend `@pytest.mark` or `conftest.py` for a Node repo.
- **Importing `index.mjs` in a test blocks on stdio unless `FORGE_TEST_MODE=1`.** The
  MCP server calls `server.connect()` at module top-level; the guard
  `if (!process.env.FORGE_TEST_MODE)` (index.mjs:167) skips it. vitest.config.mjs sets
  the env for you; a raw `node --test` import must export it, or the test hangs.
- **Marked-but-unrun tests count as passing.** An `@e2e`/GPU/hardware-gated test
  filtered out of CI proves nothing yet inflates the green count. Verify the CI job
  actually *executes* the mark, not just collects it.

## Additional resources

- Unit-test patterns (AAA, naming, fixtures, parametrization, mocking, what-to-test):
  [reference/unit-testing.md](reference/unit-testing.md)
- Integration & E2E (real DB, API contract, Playwright, the mock-heavy-integration
  trap): [reference/integration-and-e2e.md](reference/integration-and-e2e.md)
- Coverage, directory organization, performance budgets:
  [reference/coverage-and-organization.md](reference/coverage-and-organization.md)
- The 8 test-fraud patterns + detection commands: `crucible-audit` skill
