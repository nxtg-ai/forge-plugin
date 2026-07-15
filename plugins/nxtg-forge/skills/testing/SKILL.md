---
name: Testing
description: >
  How to WRITE real, maintainable tests in any stack — assertions that fail when the
  code is broken, the test pyramid and AAA structure, behavior-over-implementation,
  mocking discipline, fixtures, coverage that means something, and the ship gates
  (test-count-never-decrease, no self-mocking, prove-RED-first). Language-generic with
  concrete examples in TypeScript/JavaScript, Python, Rust, and Go. Use when asked to
  "add tests", "write a test", "improve coverage", "fix a flaky test", "how do I test X",
  when turning a hollow assertion into a real one, deciding what layer a test belongs in,
  or when a change must not drop test quality. The construction counterpart to the
  crucible-detective agent's fraud hunt.
when_to_use: >
  add tests, write tests, improve coverage, fix a flaky test, mock vs real dependency,
  unit vs integration vs e2e, turn a hollow assertion into a real one, set up fixtures or
  test doubles, choose a coverage target, wire a CI test gate, pre-commit test gate,
  test-count-never-decrease enforcement, "is this test real", test a function / module /
  API / component in TS, JS, Python, Rust, or Go.
allowed-tools: Read, Grep, Glob, Bash
---

# Testing — Writing Tests That Catch Real Bugs

A test that stays green while the code is broken is **worse than no test** — it
manufactures false confidence. This skill is the *construction* companion to the
crucible-detective agent:

- **crucible-audit** skill — *detection*: the 8 fraud patterns (hollow assertions,
  mock proliferation, dead tests, coverage-config lies) + the language matrix.
- **testing** (this skill) — *construction*: principles + how to write a test that
  actually fails on a real bug, in whatever stack the project uses.

Guidance is language-generic; examples cover the stacks Forge users build in —
TypeScript/JavaScript, Python, Rust, Go. Match the project before you copy a snippet.

## The one rule that makes a test real

Every test must **fail when you break the thing it names.** Before you trust a new
test, prove it: change the production code to be wrong, re-run, confirm **RED**, then
revert. An assertion that survives a deliberately broken implementation is theater.

```js
// THEATER — passes even if computeDiscount() returns garbage
expect(result).toBeDefined();
expect(result.total).toBeTruthy();

// REAL — pins the actual contract; breaks the instant the math changes
expect(result.total).toBe(87.5);
expect(result.appliedRule).toBe('bulk-10pct');
expect(result.lineItems).toHaveLength(3);
```

### Hollow tells to avoid, by stack

crucible-audit hunts these — don't write them. An assertion that cannot fail on a
*wrong value* is not a test.

| Stack | Never assert only | Assert instead |
|-------|-------------------|----------------|
| vitest / jest (TS/JS) | `toBeDefined`, `toBeTruthy`, `not.toBeNull` | exact value, shape (`objectContaining`), length |
| node:test (JS) | `assert.ok(x)`, `assert(x !== null)` | `assert.strictEqual`, `assert.deepStrictEqual` |
| pytest (Python) | `assert x is not None`, `assert x`, `assert result` | `assert x == expected`, `assert x.status == "active"` |
| Rust | `assert!(x.is_some())`, `assert!(x.is_ok())` | `assert_eq!(x.unwrap(), expected)` |
| Go | `if got == nil { t.Fatal(...) }` alone | `if got != want { t.Errorf("got %v, want %v", got, want) }` |

## The test pyramid

```
   /\    ~10% E2E          drive the real binary / full UI flow (slow, high-value)
  /--\   ~20% Integration  real component seams together (real fs, DB, HTTP, state)
 /----\  ~70% Unit         one unit, isolated, deterministic, < 100ms
```

A suite that is 100% unit tests with mocked seams proves the units, never the system.
"Unit tests pass but nothing works" is caught at the integration and e2e layers
(crucible Pattern 5). A "unit" test that touches a real DB, network, or port is
misclassified — move it to `integration/` or mock the seam.

Layer-by-layer patterns per stack: [reference/patterns-by-layer.md](reference/patterns-by-layer.md).

## Five non-negotiable principles

1. **Assert behavior, not implementation.** Check the returned value / observable
   effect, not that some internal mock was called. `mock.assert_called_once()` as the
   *only* assertion is a fraud smell — it survives any refactor and proves nothing.
2. **Descriptive names as specs.** `register_with_duplicate_email_raises` — not
   `test_user`, `test_1`, `it('works')`. A vague name is where a hollow test hides.
   Shape: `<unit>_<scenario>_<expected>`.
3. **One reason to fail per test.** Group related asserts; split unrelated ones.
4. **Isolated & repeatable.** No shared mutable state, no order dependence, no
   sleep-to-synchronize. Each test creates and tears down its own fixtures.
5. **Right layer for the seam.** Mock external collaborators in unit tests; use the
   *real* seam in integration tests.

## Worked example — behavior vs implementation

Assert the **outcome**, so the test survives any refactor of *how* the outcome is
produced and still fails when the outcome is *wrong*.

```python
# GOOD — asserts the OUTCOME; survives a rewrite of the hashing internals
def test_register_creates_active_user():
    user = register_user("a@example.com", "SecurePass123!")
    assert user.email == "a@example.com"
    assert user.is_active is True

# BAD — asserts HOW; breaks on refactor, proves nothing about correctness
def test_register_calls_bcrypt():
    register_user("a@example.com", "SecurePass123!")
    bcrypt.hash.assert_called_once()   # implementation detail, not behavior
```

The same shape in Rust — act on the real unit, assert the real value:

```rust
#[test]
fn claim_task_moves_status_to_in_progress() {
    let mut board = TaskBoard::new_in_temp();      // Arrange
    let id = board.add_task("implement auth");
    let claimed = board.claim_task(&id, "worker").unwrap();  // Act
    assert_eq!(claimed.status, TaskStatus::InProgress);      // Assert value
    assert_eq!(claimed.assignee.as_deref(), Some("worker"));
}
```

And in Go — table-driven, comparing against an expected value:

```go
func TestSnakeCase(t *testing.T) {
    cases := []struct{ in, want string }{
        {"HelloWorld", "hello_world"},
        {"testCamelCase", "test_camel_case"},
    }
    for _, c := range cases {
        if got := SnakeCase(c.in); got != c.want {
            t.Errorf("SnakeCase(%q) = %q, want %q", c.in, got, c.want)
        }
    }
}
```

## Mocking discipline

Mock the *boundary*, never the *thing under test.* Mock the network, the clock, a
paid API, the filesystem when it's not what you're verifying — but if a test mocks the
very function whose behavior it claims to prove, it proves nothing (crucible Pattern 3:
mock proliferation). **Prefer a real fixture** — a temp directory, an in-memory DB, a
real object — over a stub that returns the exact answer you're asserting.

```js
// WRONG — the mock IS the assertion; the real code never runs (tautology)
vi.mock('../discount.js', () => ({ computeDiscount: () => ({ total: 87.5 }) }));
expect(computeDiscount(cart).total).toBe(87.5);

// RIGHT — run the real function against a controlled input
const result = computeDiscount(loadFixtureCart('bulk-order'));
expect(result.total).toBe(87.5);
```

Test-double taxonomy, builders, and fixture patterns:
[reference/doubles-fixtures-coverage.md](reference/doubles-fixtures-coverage.md).

## Coverage — a floor and a smell detector, not a goal

Coverage is a **map of what RAN, not proof it was verified.** A line executed by a
test with a hollow assertion counts as "covered" while catching nothing. 85% coverage
built on `toBeDefined()` proves nothing. Never quote a coverage % without the
assertion-quality read beside it.

Rough targets (guideline, not a finish line):

| Module type | Target |
|-------------|--------|
| Core / domain logic | ≥ 90% |
| Application services / API handlers | ≥ 85% |
| Infrastructure / adapters / CLI | ≥ 80% |
| **Overall** | **≥ 85%** |

Security-, auth-, payment-, and financial-calculation code should approach 100% **and
be genuinely asserted.** Legitimately-low-coverage code (rare error branches, defensive
asserts, platform-compat, pure formatting) is justified, not chased.

## Ship gates (enforced by crucible-detective + code-insurance-check)

1. **Test count never decreases.** A PR that removes tests without a stated, reviewed
   reason fails the gate. Deleting a failing test to go green is fraud. (Caveat: the
   count is a floor on *quantity*, never *proof* — a hollow test satisfies it while
   asserting nothing.)
2. **No self-mocking** of the unit under test (see Mocking discipline).
3. **New behavior ⇒ new test.** Every feature/fix that changes runtime behavior lands
   with a test that would have caught the old bug.
4. **Prove RED first** for any test guarding a real bug — break the code, watch it
   fail, revert.

## Gotchas

Non-obvious traps, verified against the stack before assuming otherwise.

- **A module that connects/starts a server at import time hangs the test run.** If the
  entry module calls `server.connect()` / `app.listen()` / opens stdio at top level,
  merely *importing* it in a test blocks forever. Guard the side effect behind an env
  flag (`if (!process.env.TEST_MODE) server.connect()`) or an `if __name__ ==
  "__main__"` / `func main()` boundary, and import only the pure functions in tests.
- **Coverage % lies under an omit list.** `coveragePathIgnorePatterns` (jest/vitest),
  `omit` in `.coveragerc`/`pyproject.toml`, `collectCoverageFrom` exclusions, or Go
  build tags can inflate the number by hiding untested code. Read the omit list before
  trusting any coverage badge — the gap between claimed and real coverage is exactly
  what got excluded.
- **Marked-but-unrun tests count as "passing."** An `@e2e` / GPU / hardware-gated test
  that CI filters out and never executes still shows green and inflates the count.
  Verify the CI job actually *runs* the mark, not just collects it (crucible Pattern 4).
- **Parallel tests sharing a resource flake intermittently.** Tests that contend on a
  real file lock, a fixed port, or a shared DB row collide only sometimes under
  parallel runners → non-deterministic RED. Reproduce/diagnose serially (`cargo test --
  --test-threads=1`, `pytest -p no:xdist`, `go test -p 1`), but keep the parallel run
  as CI truth once isolated — a flaky test is usually shared state, not a logic bug.
- **Detection greps are language-shaped.** A grep for `assert .* is not None` finds
  Python hollow tells and returns 0 on a JS/Rust/Go repo → false CLEAN. Translate to
  the stack's tells (hollow-tell table above) before auditing.
- **Never `git add -A` for a test commit.** Stage the specific test files; a stray
  build artifact, `.env`, or editor dir swept in breaks release hygiene and can leak
  secrets.

## Additional resources

- Unit / integration / e2e patterns per stack (AAA, naming, parametrization, real-DB
  integration, Playwright e2e) — [reference/patterns-by-layer.md](reference/patterns-by-layer.md)
- Test doubles, fixtures, builders, coverage measurement, async/concurrency, perf
  budgets — [reference/doubles-fixtures-coverage.md](reference/doubles-fixtures-coverage.md)
- Per-language run commands, CI gate shape, test organization, DO/DON'T checklist —
  [reference/ci-and-commands.md](reference/ci-and-commands.md)
- Fraud-detection methodology + the 8 patterns + mutation testing → the
  **crucible-audit** skill.
