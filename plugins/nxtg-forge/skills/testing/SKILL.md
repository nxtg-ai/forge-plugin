---
name: Testing
description: >
  How to WRITE real, maintainable tests — assertions that fail when the code is broken,
  stack-specific patterns for the three NXTG-Forge repos (vitest / node:test for
  governance-mcp, cargo test for forge-orchestrator, vitest for forge-ui), and the ASIF
  ship gates (test-count-never-decrease, no self-mocking). Use when asked to "add tests",
  "write a test", "improve coverage", "fix flaky tests", "how do I test X", when turning a
  hollow assertion into a real one, or when a change must not drop test quality. Backs the
  crucible-detective agent — the construction counterpart to its fraud hunt.
when_to_use: >
  add tests, write tests, improve coverage, fix a flaky test, mock vs real dependency,
  test a governance-mcp tool / a Rust module / a React component, turn a hollow assertion
  into a real one, run the NXTG-Forge test suites, pre-commit test gate, test-count-never-
  decrease enforcement.
allowed-tools: Read, Grep, Glob, Bash
---

# Testing — Writing Tests That Catch Real Bugs

A test that stays green while the code is broken is **worse than no test** — it
manufactures false confidence. This skill is the *construction* companion in the
crucible-detective trio:

- **core-testing** — principles (pyramid, AAA, behavior-over-implementation).
- **crucible-audit** — detection (the 8 fraud patterns + language matrix).
- **testing** (this) — construction: how to write a test that *does* fail on a real bug, in the actual NXTG-Forge stacks.

## The one rule that makes a test real

Every test must **fail when you break the thing it names**. Before you commit a
test, prove it: change the production code to be wrong, re-run, confirm RED, revert.
An assertion that survives a deliberately broken implementation is theater.

```js
// THEATER — passes even if computeHealth() returns garbage
expect(result).toBeDefined();
expect(result.score).toBeTruthy();

// REAL — pins the actual contract; breaks if the score math changes
expect(result.score).toBe(87);
expect(result.grade).toBe('B');
expect(result.dimensions).toHaveLength(5);
```

The hollow tells to avoid, by stack (crucible-audit hunts these — don't write them):

| Stack | Never assert only | Assert instead |
|-------|-------------------|----------------|
| vitest / jest | `toBeDefined`, `toBeTruthy`, `not.toBeNull` | exact value, shape (`objectContaining`), length |
| node:test | `assert.ok(x)`, `assert(x !== null)` | `assert.strictEqual`, `assert.deepStrictEqual` |
| Rust | `assert!(x.is_some())`, `assert!(x.is_ok())` | `assert_eq!(x.unwrap(), expected)` |

## Worked example — testing a governance-mcp tool

`servers/governance-mcp/` exports each tool as a plain function (`tools.mjs`) plus
`dispatchToolCall()`. Test the function directly, assert the real value:

```js
// tests/health-score.test.mjs (vitest)
import { getHealth } from '../tools.mjs';

it('grades a clean project B and returns all 5 dimensions', async () => {
  const h = await getHealth(fixtureRoot);
  expect(h.score).toBeGreaterThanOrEqual(0);
  expect(h.grade).toMatch(/^[A-F]$/);
  expect(Object.keys(h.dimensions)).toHaveLength(5); // pins the contract
});
```

Run it: `cd servers/governance-mcp && npx vitest run` (primary CI, 44/44).

## NXTG-Forge stack cheat-sheet

| Repo | Runner(s) | Command |
|------|-----------|---------|
| forge-plugin `governance-mcp` | vitest (`tests/`) **and** node:test (`__tests__/`) | `npx vitest run` · `FORGE_TEST_MODE=1 node --test __tests__/health.test.mjs` |
| forge-orchestrator | cargo test (244 tests) | `cargo test` · `cargo test --test-threads=1` if locking conflicts |
| forge-ui | vitest | `npm test` · `npm run test:coverage` |

## Mocking discipline

Mock the *boundary*, never the *thing under test*. Mock the network, the clock, the
filesystem when it's not what you're verifying — but if a test mocks the very function
whose behavior it claims to prove, it proves nothing (crucible Pattern 3: mock
proliferation). Prefer a real fixture directory / in-memory DB over a `vi.fn()` that
returns the answer you're asserting.

```js
// WRONG — the mock IS the assertion; getHealth is never exercised
vi.mock('../tools.mjs', () => ({ getHealth: () => ({ score: 87 }) }));
expect((await getHealth()).score).toBe(87); // tautology

// RIGHT — run the real function against a controlled input
const h = await getHealth('/tmp/fixture-project');
```

## ASIF ship gates (enforced by crucible-detective + code-insurance-check)

1. **Test count never decreases.** A PR that removes tests without a stated,
   reviewed reason fails the gate. Deleting a failing test to go green = fraud.
2. **No self-mocking** of the unit under test (above).
3. **CRUCIBLE Gate 9 — live proof for high-blast providers.** A cross-machine
   consumer (e.g. the CLX9 binary smoke) beats a mocked unit test. Mocked-green is
   not shippable-green for anything another machine consumes.
4. **New behavior ⇒ new test.** Every feature/fix commit that changes runtime
   behavior lands with a test that would have caught the old bug.

## Gotchas

- **`FORGE_TEST_MODE=1` is mandatory when importing `index.mjs`.** `index.mjs:167`
  calls `await server.connect(transport)` at module load unless
  `process.env.FORGE_TEST_MODE` is set — importing it in a test without the flag
  **hangs on stdio**. vitest.config.mjs sets it via `env`; any `node --test` call
  that touches `index.mjs` must prefix `FORGE_TEST_MODE=1` manually.
- **governance-mcp has two runners; they don't overlap.** `vitest.config.mjs`
  `include: ['tests/**/*.test.mjs']` and explicitly EXCLUDES `__tests__/`, which
  runs under node:test. Adding a test to the wrong dir means CI never runs it —
  green board, zero coverage of your new code.
- **cargo file-locking tests are order-sensitive.** `task.rs` uses real file locks;
  parallel test threads collide intermittently → flaky RED. Reproduce/fix flakes
  with `cargo test --test-threads=1`, but keep the parallel run as CI truth.
- **Coverage is a map of what RAN, not what was verified.** 85% coverage with
  `toBeDefined()` assertions proves nothing. Never quote a coverage % without the
  assertion-quality read beside it (crucible Pattern 1 + 2).
- **Detection greps are Python-shaped.** If you copy crucible's `assert.*is not None`
  greps to check your JS/Rust tests, they return 0 → false CLEAN. Translate to the
  stack's hollow tells (table above) first. All three NXTG-Forge repos are non-Python.
- **`git add -A` in a release is banned here** (MEMORY): stage specific test files;
  a stray `.claude/` or build artifact in a test commit breaks the release protocol.

## Additional resources

- Fraud detection methodology + 8 patterns → [crucible-audit skill](../crucible-audit/SKILL.md)
- Principles (pyramid, AAA, coverage targets) → [core-testing skill](../core-testing/SKILL.md)
- Full NXTG-Forge strategy → [testing-strategy skill](../testing-strategy/SKILL.md)
