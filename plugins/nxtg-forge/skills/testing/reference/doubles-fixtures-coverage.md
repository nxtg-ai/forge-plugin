# Test Doubles, Fixtures, Coverage, Async & Performance

## Test doubles — prefer real fixtures

House rule: **a real fixture beats a mock.** A test that stands up a real temp
project / in-memory store and runs the real code catches integration bugs a mock
never will. Reach for doubles only at true external boundaries.

| Double | Use when |
|--------|----------|
| **Fake** (working, simpler impl) | **Default.** Real temp dir / in-memory store the code under test drives normally. |
| **Stub** (canned responses) | Isolate a slow / nondeterministic external call. |
| **Spy** (records calls) | Assert an interaction happened (e.g. a notifier was called). |
| **Mock** (pre-programmed expectations) | Only at a hard external boundary (network, paid API, clock). |
| **Dummy** (passed, never used) | Fill a required parameter. |

Spy example (vitest) — assert the interaction *and* its argument, not just the count:

```javascript
import { vi, it, expect } from 'vitest';

it('notifies once on create, with the user name', () => {
  const notify = vi.fn();
  const service = new UserService({ notify });
  service.createUser('alice');
  expect(notify).toHaveBeenCalledTimes(1);
  expect(notify).toHaveBeenCalledWith(expect.stringContaining('alice'));
});
```

**Avoid mocking internals.** Mocking a private method (`vi.spyOn(obj, '_helper')`,
`patch('module._private')`) tests implementation, not behavior — it passes while the
feature is broken. Mock the collaborator, assert on the result:

```python
# Mock an EXTERNAL dependency (Stripe), assert on the RESULT — not the call count
async def test_create_payment_intent():
    with patch('stripe.PaymentIntent.create_async') as mock_create:
        mock_create.return_value = Mock(id="pi_123", status="succeeded")
        result = await gateway.create_payment_intent(100, "usd", "cus_123")
        assert result == "pi_123"          # behavior, not mock_create.assert_called
```

## Fixtures and builders

Centralize setup so tests read as intent, not plumbing. Expose
`setup_fixture` / `teardown_fixture` / `get_fixture_path` (or a pytest `conftest.py`
fixture, a Rust `fn make_task(...) -> Task` helper) — one place to change the shape
when the type evolves.

Builder pattern for complex test objects (JS):

```javascript
class TaskBuilder {
  constructor() { this.t = { description: 'test', priority: 'medium', type: 'feature' }; }
  withPriority(p) { this.t.priority = p; return this; }
  withType(ty)    { this.t.type = ty;   return this; }
  build() { return { id: crypto.randomUUID(), ...this.t }; }
}
const urgent = new TaskBuilder().withPriority('high').build();
```

Rust equivalent — a plain constructor helper with sensible defaults:

```rust
fn make_task(priority: &str) -> Task {
    Task { id: Uuid::new_v4(), description: "test".into(), priority: priority.into(), ..Default::default() }
}
```

## Coverage

Coverage is a **floor and a smell detector, not a goal.** 100% coverage with hollow
assertions catches nothing. Read the number alongside assertion quality — never alone.

Targets by module type (guideline):

| Module type | Target |
|-------------|--------|
| Core / domain logic | ≥ 90% |
| Application services / API handlers | ≥ 85% |
| Infrastructure / adapters | ≥ 80% |
| CLI commands | ≥ 80% |
| **Overall** | **≥ 85%** |

Security / auth / payment / financial code should approach 100% **and be genuinely
asserted.** Legitimately-low code — rare error branches, defensive asserts, platform-
compat, pure formatting/UI — is justified, not chased.

Measuring:

```bash
# TypeScript / JavaScript (vitest / jest)
npx vitest run --coverage
npx jest --coverage
# Python
pytest --cov=src --cov-report=term-missing
# Rust
cargo llvm-cov            # if cargo-llvm-cov installed
# Go
go test -cover ./...
```

**Always read the omit/ignore list before trusting a badge** — excluded modules are
exactly the untested code the number is hiding.

## Async / concurrency

Never sleep-to-synchronize. `await` the actual signal, or poll with a bounded timeout.

vitest — `async` test functions are first-class:

```javascript
it('resolves the task result', async () => {
  const result = await dispatcher.execute(task);
  expect(result.success).toBe(true);
});
```

Rust — `#[tokio::test]` for async; assert the concurrency invariant directly:

```rust
#[tokio::test]
async fn concurrent_claims_do_not_double_assign() {
    let board = shared_board();
    let (a, b) = tokio::join!(board.claim(&id, "x"), board.claim(&id, "y"));
    assert!(a.is_ok() ^ b.is_ok());   // exactly one wins (lock)
}
```

Go — use `-race` to surface data races the assertions alone won't:

```bash
go test -race ./...
```

## Performance / load (spot checks)

Keep these few and stable; isolate them from the main unit run. Prefer relative /
bounded thresholds — absolute wall-clock asserts flake under CI load.

```javascript
it('scores a project in under 500ms', () => {
  const start = performance.now();
  computeDiscount(loadFixtureCart('large'));
  expect(performance.now() - start).toBeLessThan(500);
});
```

Rough per-test budgets: unit < 100 ms, integration < 1 s, e2e < 30 s, full suite
< 5 min. A "unit" test slower than its budget is usually misclassified — it touches a
real DB, port, or network and belongs in `integration/`.
