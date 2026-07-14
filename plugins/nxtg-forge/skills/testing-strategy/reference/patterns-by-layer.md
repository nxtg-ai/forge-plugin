# Test Patterns by Pyramid Layer

Patterns for the three real NXTG-Forge stacks. Principles are language-agnostic;
examples are written in the language each layer is actually tested in here.

- **forge-plugin / governance-mcp** — Node.js, **vitest** (`tests/*.test.mjs`)
- **forge-orchestrator** — Rust, **`cargo test`** (`#[test]` / `#[tokio::test]`)
- **forge-ui** — React + TypeScript, **vitest** (`src/test/**`)

---

## Unit tests (~70%)

Verify one unit in isolation. Fast (< 100 ms), deterministic, one behavior per test.

### AAA (Arrange–Act–Assert)

vitest (Node, real governance-mcp shape):

```javascript
import { describe, it, expect } from 'vitest';
import { getHealthScore } from '../tools.mjs';

describe('getHealthScore', () => {
  it('returns a score in 0-100 range with a letter grade', () => {
    // Arrange
    const root = getFixturePath();
    // Act
    const result = getHealthScore(root);
    // Assert — value assertions, not toBeDefined()
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
  });
});
```

Rust (orchestrator shape):

```rust
#[test]
fn claim_task_moves_status_to_in_progress() {
    // Arrange
    let mut board = TaskBoard::new_in_temp();
    let id = board.add_task("implement auth");
    // Act
    let claimed = board.claim_task(&id, "builder").unwrap();
    // Assert
    assert_eq!(claimed.status, TaskStatus::InProgress);
    assert_eq!(claimed.assignee.as_deref(), Some("builder"));
}
```

### Naming: `<unit>_<scenario>_<expected>`

- Good: `claim_task_on_already_claimed_returns_err`, `getHealthScore returns 0-100 with grade`
- Avoid: `test_checkpoint`, `test_works`, `it('works')`

### Test / don't test

**DO:** public API behavior, edge/boundary conditions, error paths, state transitions, business logic.
**DON'T:** private helpers directly (test through public API), framework internals, third-party libs, trivial getters.

### Parametrize / table-driven

vitest:

```javascript
it.each([
  ['HelloWorld', 'hello_world'],
  ['testCamelCase', 'test_camel_case'],
  ['already_snake', 'already_snake'],
])('snakeCase(%s) -> %s', (input, expected) => {
  expect(snakeCase(input)).toBe(expected);
});
```

Rust table-driven:

```rust
#[test]
fn snake_case_conversions() {
    for (input, expected) in [
        ("HelloWorld", "hello_world"),
        ("testCamelCase", "test_camel_case"),
    ] {
        assert_eq!(snake_case(input), expected, "input: {input}");
    }
}
```

---

## Integration tests (~20%)

Verify real components working together — no mocks between the units under test.
Real file system, real git, real state files.

The governance-mcp suite is integration-first: `tests/setup.mjs` builds a **real
mini-project in a temp dir** (git init + commits, `package.json`, `.claude/governance.json`,
checkpoints, source + test files) and each suite runs real tools against it.

```javascript
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';
import { getGitStatus } from '../tools.mjs';

beforeAll(setupFixture);   // real git repo on disk
afterAll(teardownFixture);

describe('getGitStatus', () => {
  it('reports a branch and clean state for the fixture repo', () => {
    const result = getGitStatus(getFixturePath());
    expect(result.branch).toBeTruthy();
    expect(typeof result.isClean).toBe('boolean');
  });
});
```

forge-ui splits integration under `src/test/integration/` (run via `npm run test:integration`).

---

## E2E tests (~10%)

Drive the whole binary/CLI or the full UI flow end-to-end.

Rust CLI e2e — invoke the real `forge` binary and assert on files + exit codes:

```rust
#[test]
fn init_then_status_produces_state_file() {
    let dir = tempfile::tempdir().unwrap();
    // forge init
    let out = std::process::Command::new(env!("CARGO_BIN_EXE_forge"))
        .args(["init"]).current_dir(&dir).output().unwrap();
    assert!(out.status.success());
    assert!(dir.path().join(".forge/state.json").exists());
    // forge status --json
    let out = std::process::Command::new(env!("CARGO_BIN_EXE_forge"))
        .args(["status", "--json"]).current_dir(&dir).output().unwrap();
    assert!(out.status.success());
}
```

> Use only real `forge` subcommands: `init, plan, run, start, dashboard, status,
> sync, mcp, config, verify, uat, ship, uninstall` (`forge-orchestrator/src/cli/`).
> There is no `forge generate` or `forge spec generate`.

forge-ui e2e / flow tests live under `src/test/` and run through vitest with a DOM
environment; `npm run test:integration|security|performance|quality` scope subsets.
