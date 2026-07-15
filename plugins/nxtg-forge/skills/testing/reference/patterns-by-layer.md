# Test Patterns by Pyramid Layer

Principles are language-agnostic; each pattern is shown in a stack Forge users
actually build in. Translate the syntax to your project's runner — the *shape*
transfers, the *fixtures* do not.

---

## Unit tests (~70%)

Verify one unit in isolation. Fast (< 100 ms), deterministic, one behavior per test.

### AAA (Arrange–Act–Assert)

TypeScript / JavaScript (vitest):

```javascript
import { describe, it, expect } from 'vitest';
import { computeDiscount } from '../discount.js';

describe('computeDiscount', () => {
  it('applies the bulk rule at 10+ units', () => {
    const cart = { units: 12, unitPrice: 10 };          // Arrange
    const result = computeDiscount(cart);               // Act
    expect(result.total).toBe(108);                     // Assert — value, not toBeDefined()
    expect(result.appliedRule).toBe('bulk-10pct');
  });
});
```

Python (pytest):

```python
def test_compute_discount_applies_bulk_rule():
    cart = Cart(units=12, unit_price=10)          # Arrange
    result = compute_discount(cart)                # Act
    assert result.total == 108                     # Assert value
    assert result.applied_rule == "bulk-10pct"
```

Rust:

```rust
#[test]
fn compute_discount_applies_bulk_rule() {
    let cart = Cart { units: 12, unit_price: 10 };        // Arrange
    let result = compute_discount(&cart);                 // Act
    assert_eq!(result.total, 108);                        // Assert value
    assert_eq!(result.applied_rule.as_deref(), Some("bulk-10pct"));
}
```

Go:

```go
func TestComputeDiscount_BulkRule(t *testing.T) {
    cart := Cart{Units: 12, UnitPrice: 10}          // Arrange
    got := ComputeDiscount(cart)                     // Act
    if got.Total != 108 {                            // Assert value
        t.Errorf("Total = %d, want 108", got.Total)
    }
}
```

### Naming: `<unit>_<scenario>_<expected>`

- Good: `claim_task_on_already_claimed_returns_err`, `compute_discount_applies_bulk_rule`
- Avoid: `test_checkpoint`, `test_works`, `it('works')`

### Test / don't test

**DO:** public API behavior, edge/boundary conditions, error paths, state transitions,
business logic, validation, complex calculations.
**DON'T:** private helpers directly (test through the public API), framework internals,
third-party libraries, trivial getters/setters, auto-generated code, static config.

### Parametrize / table-driven — one law, many rows

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

pytest:

```python
@pytest.mark.parametrize("password,should_raise,msg", [
    ("short",          True,  "at least 8 characters"),
    ("12345678",       True,  "must contain letters"),
    ("SecurePass123!", False, None),
])
def test_password_validation(password, should_raise, msg, use_case):
    if should_raise:
        with pytest.raises(WeakPasswordError, match=msg):
            use_case.execute("a@example.com", password)
    else:
        assert use_case.execute("a@example.com", password) is not None
```

Rust:

```rust
#[test]
fn snake_case_conversions() {
    for (input, expected) in [("HelloWorld", "hello_world"), ("testCamelCase", "test_camel_case")] {
        assert_eq!(snake_case(input), expected, "input: {input}");
    }
}
```

---

## Integration tests (~20%)

Verify real components working together — **no mocks between the units under test.**
Real file system, real git, real DB, real state files. Build a real, disposable
fixture (a temp project, a throwaway schema) and run the real code against it.

Real-DB integration (Python + async SQLAlchemy), asserting the round-trip contract:

```python
@pytest.fixture
async def test_db():
    engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/testdb")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)   # teardown — isolate every run
    await engine.dispose()

@pytest.mark.asyncio
async def test_user_crud(test_db):
    async with test_db() as session:
        repo = SqlUserRepository(session)
        user = await repo.create(User(email="a@example.com"))
        assert user.id is not None                                   # Create
        assert (await repo.find_by_email("a@example.com")).id == user.id  # Read
        user.email = "b@example.com"
        assert (await repo.save(user)).email == "b@example.com"      # Update
        await repo.delete(user.id)
        assert await repo.find_by_id(user.id) is None                # Delete
```

API contract (assert on the wire, and that secrets do NOT leak):

```python
@pytest.mark.asyncio
async def test_register_endpoint(client, test_db):
    resp = await client.post("/auth/register",
        json={"email": "new@example.com", "password": "SecurePass123!"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "new@example.com"
    assert "password" not in data          # secret must NOT be in the response
    assert "hashed_password" not in data
```

The same idea in a compiled stack: stand up a temp working dir on disk, run the real
tool/handler against it, and assert on the produced files/values — not on a mock.

---

## E2E tests (~10%)

Drive the whole binary/CLI or the full UI flow end-to-end.

CLI e2e (Rust) — invoke the real built binary, assert on files + exit codes:

```rust
#[test]
fn init_then_status_produces_state_file() {
    let dir = tempfile::tempdir().unwrap();
    let out = std::process::Command::new(env!("CARGO_BIN_EXE_mytool"))
        .args(["init"]).current_dir(&dir).output().unwrap();
    assert!(out.status.success());
    assert!(dir.path().join(".mytool/state.json").exists());
}
```

Browser e2e (Playwright) — drive the real app, assert on the rendered outcome:

```python
@pytest.mark.e2e
async def test_registration_flow():
    async with async_playwright() as p:
        page = await (await (await p.chromium.launch(headless=True)).new_context()).new_page()
        await page.goto("http://localhost:3000")
        await page.click('a:has-text("Register")')
        await page.fill('input[name="email"]', "e2e@example.com")
        await page.fill('input[name="password"]', "SecurePass123!")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard")
        await expect(page.locator('[data-testid="user-menu"]')).to_be_visible()
```

**E2E fraud trap:** a test marked `@e2e` (or GPU/hardware-gated) that CI filters out and
never runs still counts as "passing." Verify the CI job actually executes the mark
(crucible-audit Pattern 4 — dead test infrastructure).
