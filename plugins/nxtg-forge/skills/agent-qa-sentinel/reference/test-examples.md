# QA Sentinel — Worked Test Examples

Canonical, copy-adaptable test patterns for unit, integration, E2E, and full-suite work.
Referenced from `../SKILL.md`. All examples follow the AAA pattern (Arrange, Act, Assert)
and name tests as behavior statements, not `test_user1`.

## 1. Unit test suite (pytest, async, mocked collaborators)

Unit tests isolate one unit and mock its collaborators. Cover happy path, the
already-exists branch, parametrized weak-input cases, and a "degrade gracefully"
case where a non-critical dependency fails but the operation still succeeds.

```python
import pytest
from datetime import datetime
from unittest.mock import Mock, AsyncMock

class TestUserRegistration:
    @pytest.fixture
    def user_repo(self):
        repo = Mock()
        repo.find_by_email = AsyncMock(return_value=None)
        repo.create = AsyncMock()
        return repo

    @pytest.fixture
    def email_service(self):
        service = Mock()
        service.send_welcome_email = AsyncMock()
        return service

    @pytest.fixture
    def use_case(self, user_repo, email_service):
        return RegisterUserUseCase(user_repo, email_service)

    @pytest.mark.asyncio
    async def test_register_user_success(self, use_case, user_repo, email_service):
        # Arrange
        email = "newuser@example.com"
        user_repo.create.return_value = User(
            id=1, email=email, hashed_password="hashed", created_at=datetime.utcnow()
        )
        # Act
        user = await use_case.execute(email, "SecurePass123!")
        # Assert — verify the returned value AND the collaborator contract
        assert user.id == 1
        assert user.email == email
        user_repo.find_by_email.assert_called_once_with(email)
        user_repo.create.assert_called_once()
        email_service.send_welcome_email.assert_called_once_with(email)

    @pytest.mark.asyncio
    async def test_register_user_already_exists(self, use_case, user_repo):
        email = "existing@example.com"
        user_repo.find_by_email.return_value = User(id=1, email=email, hashed_password="hash")
        with pytest.raises(UserAlreadyExistsError, match=f"User with email {email}"):
            await use_case.execute(email, "password123")

    @pytest.mark.asyncio
    @pytest.mark.parametrize("password,error_msg", [
        ("short", "at least 8 characters"),
        ("", "at least 8 characters"),
        ("12345678", "must contain letters"),
    ])
    async def test_register_user_weak_password(self, use_case, user_repo, password, error_msg):
        user_repo.find_by_email.return_value = None
        with pytest.raises(WeakPasswordError, match=error_msg):
            await use_case.execute("user@example.com", password)

    @pytest.mark.asyncio
    async def test_register_user_email_failure_does_not_block(self, use_case, user_repo, email_service):
        # A non-critical side effect (welcome email) must not fail the registration.
        email_service.send_welcome_email.side_effect = EmailServiceError()
        user_repo.find_by_email.return_value = None
        user_repo.create.return_value = User(id=1, email="user@example.com", hashed_password="hash")
        user = await use_case.execute("user@example.com", "password123")
        assert user.id == 1
        user_repo.create.assert_called_once()
```

## 2. Integration test (real DB, no mocks)

Integration tests exercise real collaborators (a real test database). No mocks —
if you mock the thing you are integrating with, it is a unit test in disguise.

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

@pytest.fixture
async def test_db():
    engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/testdb")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    yield async_session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)   # always clean up
    await engine.dispose()

@pytest.mark.asyncio
async def test_create_and_retrieve_user(test_db):
    async with test_db() as session:
        repo = SQLAlchemyUserRepository(session)
        user = await repo.create(User(id=None, email="test@example.com", hashed_password="hashed"))
        assert user.id is not None
        retrieved = await repo.find_by_email("test@example.com")
        assert retrieved is not None
        assert retrieved.id == user.id
```

## 3. E2E test (Playwright, real browser)

E2E tests drive a real browser against a running app. Prefer `data-testid`
selectors over brittle text/CSS locators. Assert on user-observable state.

```python
import pytest
from playwright.async_api import async_playwright, expect

@pytest.mark.asyncio
async def test_user_registration_flow():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:3000/register")
        await page.fill('input[name="email"]', "testuser@example.com")
        await page.fill('input[name="password"]', "SecurePass123!")
        await page.fill('input[name="confirmPassword"]', "SecurePass123!")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard")
        await expect(page.locator('[data-testid="user-menu"]')).to_be_visible()
        await browser.close()
```

## 4. Comprehensive suite for a critical path (payments)

A 100%-coverage critical path combines happy path, error propagation, and
parametrized boundary validation. The performance assertion has a real numeric
threshold — a test with no threshold cannot fail.

```python
import pytest
from decimal import Decimal
from unittest.mock import Mock, AsyncMock

class TestPaymentProcessor:
    @pytest.fixture
    def payment_gateway(self):
        gateway = Mock()
        gateway.create_payment_intent = AsyncMock()
        gateway.confirm_payment = AsyncMock()
        return gateway

    @pytest.fixture
    def processor(self, payment_gateway):
        return PaymentProcessor(payment_gateway, Mock())

    @pytest.mark.asyncio
    async def test_process_payment_success(self, processor, payment_gateway):
        payment_gateway.create_payment_intent.return_value = "pi_123"
        payment_gateway.confirm_payment.return_value = True
        result = await processor.process(amount=Decimal("100.00"), currency="usd", customer_id="cus_123")
        assert result.status == PaymentStatus.COMPLETED
        assert result.intent_id == "pi_123"
        payment_gateway.confirm_payment.assert_called_once_with("pi_123")

    @pytest.mark.asyncio
    async def test_process_payment_gateway_error(self, processor, payment_gateway):
        payment_gateway.create_payment_intent.side_effect = PaymentGatewayError("API Error")
        with pytest.raises(PaymentProcessingError):
            await processor.process(Decimal("100.00"), "usd", "cus_123")

    @pytest.mark.asyncio
    @pytest.mark.parametrize("amount,should_raise", [
        (Decimal("0.00"), True),        # zero
        (Decimal("-10.00"), True),      # negative
        (Decimal("0.01"), False),       # minimum
        (Decimal("999999.99"), False),  # large
    ])
    async def test_process_payment_amount_validation(self, processor, amount, should_raise):
        if should_raise:
            with pytest.raises(InvalidAmountError):
                await processor.process(amount, "usd", "cus_123")
        else:
            await processor.process(amount, "usd", "cus_123")

    @pytest.mark.asyncio
    async def test_process_payment_performance(self, processor):
        import time
        start = time.time()
        await processor.process(Decimal("100.00"), "usd", "cus_123")
        duration = time.time() - start
        assert duration < 2.0, f"took {duration}s, expected < 2s"
```

## 5. Best-practice contrasts (GOOD vs BAD)

**AAA order** — arrange the mock's return BEFORE the act, not after:

```python
# GOOD
async def test_create_user():
    repo = Mock()
    repo.create = AsyncMock(return_value=User(id=1, email="test@example.com"))  # arrange
    user = await create_user("test@example.com", "password", repo)             # act
    assert user.id == 1                                                        # assert

# BAD — return value set after the call; the mock was empty during act
async def test_create_user():
    repo = Mock()
    user = await create_user("test@example.com", "password", repo)
    repo.create = AsyncMock(return_value=User(id=1, email="test@example.com"))
    assert user.id == 1
```

**One behavior per test** — split multi-assert tests so a failure names the cause:

```python
# GOOD
def test_user_creation_sets_email():
    assert User(email="test@example.com").email == "test@example.com"

def test_user_creation_sets_created_at():
    assert User(email="test@example.com").created_at is not None

# BAD — if this fails you don't know which property broke
def test_user_creation():
    user = User(email="test@example.com")
    assert user.email == "test@example.com"
    assert user.created_at is not None
    assert user.is_active is True
```
