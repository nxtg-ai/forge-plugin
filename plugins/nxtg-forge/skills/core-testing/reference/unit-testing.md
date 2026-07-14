# Unit Testing Patterns

Illustrative examples use Python/pytest. The **patterns** (AAA, descriptive names,
fixtures, parametrization, behavior-over-implementation) transfer to any stack —
translate the syntax to vitest/node:test (Node) or `cargo test` (Rust) for this
plugin's suites. See `core-testing/SKILL.md` § Gotchas for the language-mismatch trap.

## Test Structure (Arrange-Act-Assert)

```python
async def test_register_user_success():
    # Arrange — set up test data and mocks
    user_repo = Mock()
    user_repo.find_by_email = AsyncMock(return_value=None)
    user_repo.create = AsyncMock(return_value=User(id=1, email="test@example.com"))
    use_case = RegisterUserUseCase(user_repo, Mock())

    # Act — execute the code under test
    user = await use_case.execute("test@example.com", "password123")

    # Assert — verify BEHAVIOR (returned value), not internal calls
    assert user.id == 1
    assert user.email == "test@example.com"
```

## Test Naming — behavior in the name

```python
# GOOD — reads as a spec: subject_condition_expectedOutcome
def test_register_user_with_duplicate_email_raises_error(): ...
def test_register_user_with_weak_password_raises_error(): ...

# BAD — proves nothing about intent; a hollow test hides behind a vague name
def test_user(): ...
def test_error(): ...
def test_1(): ...
```

## Fixtures (shared, composable setup)

```python
import pytest

@pytest.fixture
def user_repo():
    repo = Mock()
    repo.find_by_email = AsyncMock(return_value=None)
    repo.create = AsyncMock()
    return repo

@pytest.fixture
def use_case(user_repo):
    return RegisterUserUseCase(user_repo, Mock())

def test_with_fixtures(use_case):
    user = await use_case.execute("test@example.com", "SecurePass123!")
    assert user.email == "test@example.com"
```

## Parametrized Tests (one law, many rows)

```python
@pytest.mark.parametrize("password,should_raise,error_msg", [
    ("short",          True,  "at least 8 characters"),
    ("",               True,  "at least 8 characters"),
    ("12345678",       True,  "must contain letters"),
    ("SecurePass123!", False, None),
])
async def test_password_validation(password, should_raise, error_msg, use_case):
    if should_raise:
        with pytest.raises(WeakPasswordError, match=error_msg):
            await use_case.execute("test@example.com", password)
    else:
        assert await use_case.execute("test@example.com", password) is not None
```

## Mocking — mock the collaborators, never the subject

```python
from unittest.mock import Mock, AsyncMock, patch

# Mock an EXTERNAL dependency (Stripe), assert on the RESULT
async def test_external_api():
    with patch('stripe.PaymentIntent.create_async') as mock_create:
        mock_create.return_value = Mock(id="pi_123", status="succeeded")
        result = await payment_gateway.create_payment_intent(100, "usd", "cus_123")
        assert result == "pi_123"   # behavior, not mock_create call-count
```

Mocking the class under test, or asserting only `mock.assert_called_once()` with no
value check, is fraud Pattern 3 (mock proliferation) — see `crucible-audit/SKILL.md`.

## What to Test / What to Skip

| DO test | DON'T test |
|---|---|
| Business logic | Third-party libraries |
| Edge cases & error handling | Simple getters/setters |
| Validation logic | Auto-generated code |
| Complex calculations | Static configuration |
| State changes | Framework code |
