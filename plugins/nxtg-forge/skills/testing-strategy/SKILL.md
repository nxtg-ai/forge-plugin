---
name: Testing Strategy
description: >-
  Testing strategy and patterns for the NXTG-Forge stack — the test pyramid,
  unit/integration/e2e structure, real-fixture-over-mock discipline, coverage
  floors, and the project's version-sync and test-count-never-decrease gates
  across its three repos (governance-mcp/vitest, forge-orchestrator/cargo,
  forge-ui/vitest). Use when writing or reviewing tests, deciding what layer a
  test belongs in, setting up fixtures or test doubles, chasing flaky/hollow
  tests, choosing coverage targets, or wiring the CI test gate for any of the
  three repos.
when_to_use: >-
  Triggers: "write tests for this", "how should I test X", "unit vs integration",
  "is this test flaky/hollow", "what coverage should this have", "add a fixture",
  "mock or real object here", "set up the CI test gate", "why is the suite red",
  "should this be a mock". Applies to vitest (.mjs / React) and cargo test (Rust).
allowed-tools: Read, Grep, Glob, Bash(npm test), Bash(npx vitest *), Bash(cargo test *), Bash(cargo build *)
---

# NXTG-Forge Testing Strategy

## Scope — three repos, three runners

NXTG-Forge is **not** a Python project. Testing spans three independent repos, each
with its own runner. Match the repo before you write or cite a test.

| Repo | Language | Runner | Test location |
|------|----------|--------|---------------|
| `forge-plugin` / governance-mcp | Node.js (ESM) | **vitest** (`npm test`) + node:test | `tests/*.test.mjs`, `__tests__/*.test.mjs` |
| `forge-orchestrator` | Rust | **`cargo test`** | inline `#[cfg(test)]` in `src/**/*.rs` |
| `forge-ui` | React + TS | **vitest** | `src/test/{integration,security,performance,quality}/` |

Run commands and CI gate shape: [reference/ci-and-commands.md](reference/ci-and-commands.md).

## Philosophy

1. **Test behavior, not implementation** — assert what the code produces, not how.
2. **Real fixtures over mocks** — governance-mcp stands up a real temp git project
   (`tests/setup.mjs`) and runs real tools against it. Mock only true external boundaries.
3. **Value assertions, not hollow ones** — `expect(x).toBe(...)` / range checks, never
   a bare `toBeDefined()` that passes on a broken feature (CRUCIBLE norm).
4. **Fast, isolated, deterministic** — no shared state, no sleep-to-sync, no ordering deps.
5. **Test count never decreases** — a diff that removes tests without a documented
   reason fails review. New behavior ships with new tests.

## Test pyramid

```
   /\    ~10% E2E          drive the real forge binary / full UI flow
  /--\   ~20% Integration  real components together (real fs, git, state)
 /----\  ~70% Unit         one unit, isolated, < 100ms
```

Layer-by-layer patterns (vitest + Rust examples): [reference/patterns-by-layer.md](reference/patterns-by-layer.md).

## Worked example — the real governance-mcp shape

Integration-first: a real temp project is built once, real tools run against it,
and assertions check *values*, not existence.

```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getHealthScore } from '../tools.mjs';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';

beforeAll(setupFixture);      // real git repo + .claude/governance.json on disk
afterAll(teardownFixture);

describe('getHealthScore', () => {
  it('returns a 0-100 score with a letter grade', () => {
    const result = getHealthScore(getFixturePath());     // Act on real code
    expect(result.score).toBeGreaterThanOrEqual(0);      // value assertions,
    expect(result.score).toBeLessThanOrEqual(100);       // not toBeDefined()
    expect(['A','B','C','D','F']).toContain(result.grade);
  });
});
```

Why it is good: no mocks between the tool and the file system; the fixture is a
real project; every assertion would fail loudly if the scorer broke.

## Gotchas

Real, project-specific traps — verify against source before assuming otherwise.

- **`FORGE_TEST_MODE=1` is mandatory when importing `index.mjs`.** Without it,
  `index.mjs` calls `server.connect()` on stdio and the test run hangs. `vitest.config.mjs`
  sets it via `env`; the node:test suite must set it on the command line
  (`FORGE_TEST_MODE=1 node --test __tests__/health.test.mjs`).
- **vitest only collects `tests/**/*.test.mjs`.** `__tests__/` uses the node:test
  runner and is deliberately **excluded** by `include:` in `vitest.config.mjs`. A test
  dropped in `__tests__/` will silently not run under `npm test` — the two suites are
  parallel, not merged.
- **Rust file-locking tests collide in parallel.** `task.rs` uses real file locks;
  when tests conflict, run `cargo test -- --test-threads=1` (documented in CLAUDE.md).
  A flaky Rust test is often a threads>1 collision, not a logic bug.
- **Hollow assertions pass on broken code.** The v3.4.8 CRUCIBLE audit removed 14
  hollow assertions (`toBeDefined()`, `typeof x === 'string'`). Assert the *value*
  (`expect.objectContaining({...})`, ranges, exact strings), not mere existence.
- **Coverage ≠ correctness.** `testCoverage` is `null` unless a real
  `coverage-summary.json` exists; `testFileRatio` (test/source file count) is only a
  proxy. A green coverage number over hollow tests catches nothing.
- **No such CLI as `forge generate` / `forge spec generate`.** Real subcommands live
  in `forge-orchestrator/src/cli/`: `init, plan, run, start, dashboard, status, sync,
  mcp, config, verify, uat, ship, uninstall`. E2E tests must invoke real ones.
- **Tests green is not release-green.** A version bump requires the same version in
  all three of `plugin.json`, `marketplace.json`, and governance-mcp `package.json`.

## Additional resources

- Unit / integration / e2e patterns per stack — [reference/patterns-by-layer.md](reference/patterns-by-layer.md)
- Test doubles, fixtures, builders, coverage, async/perf — [reference/doubles-fixtures-coverage.md](reference/doubles-fixtures-coverage.md)
- Run commands, CI gate, test organization, DO/DON'T checklist — [reference/ci-and-commands.md](reference/ci-and-commands.md)
- Deeper test-quality auditing — the `crucible-audit` skill (8 gates: hollow tests, silent failures, mutation, coverage config).

---
**Version:** 2.0.0 · applies to forge-plugin, forge-orchestrator, forge-ui
