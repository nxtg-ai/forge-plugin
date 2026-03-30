# Testing

> Broad testing philosophy covering TDD methodology, BDD practices, property-based testing, and cross-language tool selection so agents choose the right testing approach for any situation.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Knowledge |

---

## What It Provides

This skill provides high-level testing philosophy and methodology that transcends specific frameworks. Where core-testing teaches the mechanics of writing tests and testing-strategy teaches project-specific planning, this skill teaches agents how to think about testing: when to apply Test-Driven Development (write failing test first), when to use Behavior-Driven Development (Given-When-Then format), when property-based testing reveals edge cases that example-based tests miss, and how to select the right testing tools for JavaScript, Python, or performance workloads.

Without this skill, agents default to writing tests after implementation (missing TDD's design benefits), focus only on happy paths (missing edge cases that property-based testing catches), and use the same testing approach regardless of context (unit testing strategies applied to E2E scenarios). The skill teaches agents to select the testing methodology that matches the situation.

The knowledge is concise and practical: the TDD red-green-refactor cycle, BDD's focus on user behavior as living documentation, property-based testing's ability to generate random inputs and find invariant violations, tool recommendations by language and test type, and the five characteristics of good tests (fast, reliable, isolated, descriptive, maintainable).

## When It Activates

- When an agent is deciding how to approach testing for a new feature
- When the testing methodology matters (TDD for design, BDD for requirements)
- When selecting testing tools for a specific language or framework
- When evaluating whether tests are truly testing the right things

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### Test-Driven Development

Write a failing test. Write the minimum code to make it pass. Refactor for clarity. Repeat. This cycle is not just a testing technique -- it is a design technique. Writing the test first forces you to think about the interface before the implementation. The test becomes the first consumer of the API, revealing awkward designs before they become entrenched. The skill teaches agents to apply TDD when building new features from scratch, especially domain logic and use cases where the interface matters more than the implementation.

### Behavior-Driven Development

Given-When-Then format focuses tests on user behavior rather than code structure. "Given a registered user, when they enter the wrong password three times, then their account is locked." This produces tests that double as living documentation -- stakeholders can read them and verify that the system behaves as expected. The skill teaches agents to use BDD for features where the behavior specification matters (user workflows, business rules, acceptance criteria).

### Property-Based Testing

Instead of writing specific examples (input: 5, output: 25), define properties that must hold for all inputs (output is always non-negative, output of square is always >= input for inputs >= 1). Property-based testing generates hundreds of random inputs and checks that invariants hold, finding edge cases that humans miss. The skill teaches agents when property-based testing adds value (mathematical operations, serialization/deserialization roundtrips, parser correctness) and when it does not (UI interactions, integration tests).

### Cross-Language Tool Selection

JavaScript/TypeScript: Jest for unit/integration, Cypress for E2E, Testing Library for React, Supertest for APIs. Python: pytest for unit/integration, Selenium or Playwright for E2E, unittest.mock for mocking, hypothesis for property-based. Performance: k6 for load testing, built-in profiling tools for memory leak detection. The skill guides agents to the right tool for each testing need.

## How to Leverage It

Mention the testing approach you want in your prompt. "Use TDD to implement this feature" activates the TDD cycle. "Write BDD-style tests for this user workflow" activates Given-When-Then format. Without explicit direction, the skill helps agents choose the approach that fits the context.

### Example: TDD Workflow

```
User: "Use TDD to implement a discount calculator"

What happens: The skill activates and the agent writes a failing test first
(test_gold_customer_gets_20_percent_discount), then writes the minimum implementation
to pass it, then refactors. It repeats this cycle for each discount tier, building
up the implementation through tests.
```

## Power Applications

Property-based testing is the most underused technique in agent-generated code. When agents test a serialization function with three hand-picked examples, they miss the Unicode string that breaks the parser. Property-based testing with hypothesis generates thousands of inputs and finds these edge cases automatically. The skill teaches agents to apply this technique to functions with broad input spaces.

The test characteristics checklist (fast, reliable, isolated, descriptive, maintainable) serves as a quality filter. An agent can evaluate existing tests against these criteria and identify which tests are flaky (not reliable), coupled (not isolated), or slow (not fast).

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **core-testing** | Specific test patterns (AAA, fixtures, mocking) used within these methodologies |
| **testing-strategy** | Project-specific test planning that uses these methodologies |
| **coding-standards** | Test naming and organization conventions |

## Tips

- TDD is most valuable for new code with clear requirements. Retrofitting TDD onto existing code yields less benefit.
- Property-based tests complement example-based tests -- they do not replace them.

---

*See also: [core-testing](core-testing.md) | [testing-strategy](testing-strategy.md)*
