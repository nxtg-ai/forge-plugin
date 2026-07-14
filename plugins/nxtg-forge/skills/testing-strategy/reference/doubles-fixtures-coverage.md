# Test Doubles, Fixtures, and Coverage

## Test doubles — prefer real fixtures (CRUCIBLE norm)

House rule: **a real fixture beats a mock.** governance-mcp mocks nothing between
the tool and the file system — it stands up a real temp project (`tests/setup.mjs`)
and runs the real code. Reach for doubles only at true external boundaries.

| Double | Use when |
|--------|----------|
| **Fake** (working, simpler impl) | **Default here.** Real temp git repo / in-memory store the code under test drives normally. |
| **Stub** (canned responses) | Isolate a slow/nondeterministic external call. |
| **Spy** (records calls) | Assert an interaction happened (e.g. a notifier was called). |
| **Mock** (pre-programmed expectations) | Only at a hard external boundary (network, paid API). |
| **Dummy** (passed, never used) | Fill a required parameter. |

vitest spy example:

```javascript
import { vi, it, expect } from 'vitest';

it('notifies once on create', () => {
  const notify = vi.fn();
  const service = new UserService({ notify });
  service.createUser('alice');
  expect(notify).toHaveBeenCalledTimes(1);
  expect(notify).toHaveBeenCalledWith(expect.stringContaining('alice'));
});
```

**Avoid mocking internals.** Mocking a private method (`vi.spyOn(obj, '_helper')`)
tests implementation, not behavior — it passes while the feature is broken.

## Fixtures and builders

Centralize setup so tests read as intent, not plumbing. governance-mcp exposes
`setupFixture` / `teardownFixture` / `getFixturePath` from `tests/setup.mjs`.

Builder pattern for complex test objects:

```javascript
class TaskBuilder {
  constructor() { this.t = { description: 'test', priority: 'medium', type: 'feature' }; }
  withPriority(p) { this.t.priority = p; return this; }
  withType(ty) { this.t.type = ty; return this; }
  build() { return { id: crypto.randomUUID(), ...this.t }; }
}

const urgent = new TaskBuilder().withPriority('high').build();
```

Factory fixture (vitest closure) or Rust `fn make_task(...) -> Task { ... }` helper
achieve the same: one place to change the shape when the type evolves.

## Coverage

Coverage is a **floor and a smell detector, not a goal.** 100 % coverage with hollow
assertions catches nothing (see CRUCIBLE).

Targets by module type:

| Module type | Target |
|-------------|--------|
| Core / domain logic (state, task, governance) | 95 %+ |
| Application services / MCP tools | 90 %+ |
| Infrastructure / adapters | 85 %+ |
| CLI commands | 80 %+ |

Legitimately-low-coverage code: rare-condition error handling, defensive asserts,
platform-compat branches, pure formatting/UI. Justify, don't chase.

Measuring:

```bash
# Node (governance-mcp / forge-ui)
npm run test:coverage            # vitest + coverage provider

# Rust (forge-orchestrator)
cargo llvm-cov                   # if cargo-llvm-cov installed
```

## Async / concurrency

vitest — `async` test functions are first-class; `await` the behavior:

```javascript
it('resolves the task result', async () => {
  const result = await dispatcher.execute(task);
  expect(result.success).toBe(true);
});
```

Rust — use `#[tokio::test]` for async (orchestrator runs on tokio):

```rust
#[tokio::test]
async fn concurrent_claims_do_not_double_assign() {
    let board = shared_board();
    let (a, b) = tokio::join!(board.claim(&id, "x"), board.claim(&id, "y"));
    assert!(a.is_ok() ^ b.is_ok()); // exactly one wins (file lock)
}
```

Never sleep-to-synchronize. Await the actual signal; poll with a bounded timeout.

## Performance / load (spot checks)

Keep these few and stable — they belong in `src/test/performance/` (forge-ui) or
a dedicated Rust bench, not the main unit run.

```javascript
it('scores a project in under 500ms', () => {
  const start = performance.now();
  getHealthScore(getFixturePath());
  expect(performance.now() - start).toBeLessThan(500);
});
```

Prefer relative/bounded thresholds; absolute wall-clock asserts flake under CI load.
