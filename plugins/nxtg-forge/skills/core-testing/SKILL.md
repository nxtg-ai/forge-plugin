---
name: Core Testing
description: Defines core testing principles and test infrastructure patterns.
---

# Testing Standards & Best Practices

## Testing Pyramid

```
     /\
    /E2E\      10% - End-to-end tests (slow, brittle)
   /------\
  /  INT   \   20% - Integration tests (medium speed)
 /----------\
/   UNIT     \ 70% - Unit tests (fast, isolated)
--------------
```

**Coverage Target**: >= 85% overall

## Unit Testing

### Test Structure (AAA Pattern)

```python
# Arrange - Act - Assert

async def test_register_user_success():
    # Arrange - Set up test data and mocks
    user_repo = Mock()
    user_repo.find_by_email = AsyncMock(return_value=None)
    user_repo.create = AsyncMock(return_value=User(id=1, email="test@example.com"))
    use_case = RegisterUserUseCase(user_repo, Mock())
    
    # Act - Execute the code under test
    user = await use_case.execute("test@example.com", "password123")
    
    # Assert - Verify the results
    assert user.id == 1
    assert user.email == "test@example.com"
    user_repo.find_by_email.assert_called_once_with("test@example.com")
```

### Test Naming

```python
# ✅ GOOD - Descriptive test names
def test_register_user_with_valid_email_creates_user():
    ...

def test_register_user_with_duplicate_email_raises_error():
    ...

def test_register_user_with_weak_password_raises_error():
    ...

# ❌ BAD - Vague test names
def test_user():
    ...

def test_error():
    ...

def test_1():
    ...
```

### Fixtures

```python
import pytest

# Reusable test data
@pytest.fixture
def valid_user_data():
    return {
        "email": "test@example.com",
        "password": "SecurePass123!"
    }

@pytest.fixture
def user_repo():
    """Mock repository"""
    repo = Mock()
    repo.find_by_email = AsyncMock(return_value=None)
    repo.create = AsyncMock()
    return repo

@pytest.fixture
def use_case(user_repo):
    """Use case with mocked dependencies"""
    return RegisterUserUseCase(user_repo, Mock())

# Use fixtures in tests
def test_with_fixtures(use_case, valid_user_data):
    user = await use_case.execute(**valid_user_data)
    assert user.email == valid_user_data["email"]
```

### Parametrized Tests

```python
@pytest.mark.parametrize("password,should_raise,error_msg", [
    ("short", True, "at least 8 characters"),
    ("", True, "at least 8 characters"),
    ("12345678", True, "must contain letters"),
    ("SecurePass123!", False, None),
    ("AnotherGood1!", False, None),
])
async def test_password_validation(password, should_raise, error_msg, use_case):
    """Test various password scenarios"""
    if should_raise:
        with pytest.raises(WeakPasswordError, match=error_msg):
            await use_case.execute("test@example.com", password)
    else:
        user = await use_case.execute("test@example.com", password)
        assert user is not None
```

### Mocking

```python
from unittest.mock import Mock, AsyncMock, patch

# Mock async function
async def test_with_async_mock():
    user_repo = Mock()
    user_repo.find_by_email = AsyncMock(return_value=None)
    
    result = await user_repo.find_by_email("test@example.com")
    
    user_repo.find_by_email.assert_called_once_with("test@example.com")

# Mock external API
async def test_external_api():
    with patch('stripe.PaymentIntent.create_async') as mock_create:
        mock_create.return_value = Mock(id="pi_123", status="succeeded")
        
        result = await payment_gateway.create_payment_intent(100, "usd", "cus_123")
        
        assert result == "pi_123"
        mock_create.assert_called_once()
```

### What to Test

**DO Test:**

- ✅ Business logic
- ✅ Edge cases
- ✅ Error handling
- ✅ Validation logic
- ✅ Complex calculations
- ✅ State changes

**DON'T Test:**

- ❌ Third-party libraries
- ❌ Simple getters/setters
- ❌ Auto-generated code
- ❌ Configuration
- ❌ Framework code

## Integration Testing

### Database Tests

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

@pytest.fixture
async def test_db():
    """Create test database"""
    engine = create_async_engine(
        "postgresql+asyncpg://user:pass@localhost/testdb",
        echo=False
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session factory
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    yield async_session
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest.mark.asyncio
async def test_user_crud(test_db):
    """Test user CRUD operations against real database"""
    async with test_db() as session:
        repo = SQLAlchemyUserRepository(session)
        
        # Create
        user = await repo.create(User(email="test@example.com", hashed_password="hash"))
        assert user.id is not None
        
        # Read
        found = await repo.find_by_email("test@example.com")
        assert found.id == user.id
        
        # Update
        user.email = "updated@example.com"
        updated = await repo.save(user)
        assert updated.email == "updated@example.com"
        
        # Delete
        await repo.delete(user.id)
        deleted = await repo.find_by_id(user.id)
        assert deleted is None
```

### API Tests

```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.fixture
async def client():
    """HTTP client for API testing"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_register_endpoint(client, test_db):
    """Test user registration endpoint"""
    response = await client.post("/auth/register", json={
        "email": "newuser@example.com",
        "password": "SecurePass123!"
    })
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "password" not in data  # Password should not be returned
    assert "hashed_password" not in data

@pytest.mark.asyncio
async def test_register_duplicate_email(client, test_db):
    """Test registration with duplicate email"""
    # Create first user
    await client.post("/auth/register", json={
        "email": "duplicate@example.com",
        "password": "Pass123!"
    })
    
    # Try to create duplicate
    response = await client.post("/auth/register", json={
        "email": "duplicate@example.com",
        "password": "Pass123!"
    })
    
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()
```

## End-to-End Testing

### Playwright Tests

```python
import pytest
from playwright.async_api import async_playwright, expect

@pytest.mark.asyncio
@pytest.mark.e2e
async def test_user_registration_flow():
    """Test complete user registration flow"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Navigate to app
        await page.goto("http://localhost:3000")
        
        # Click register link
        await page.click('a:has-text("Register")')
        await page.wait_for_url("**/register")
        
        # Fill form
        await page.fill('input[name="email"]', "e2etest@example.com")
        await page.fill('input[name="password"]', "SecurePass123!")
        await page.fill('input[name="confirmPassword"]', "SecurePass123!")
        
        # Submit
        await page.click('button[type="submit"]')
        
        # Wait for success
        await page.wait_for_url("**/dashboard")
        
        # Verify logged in
        user_menu = page.locator('[data-testid="user-menu"]')
        await expect(user_menu).to_be_visible()
        
        # Verify email displayed
        email_display = page.locator('text=e2etest@example.com')
        await expect(email_display).to_be_visible()
        
        await browser.close()
```

## Test Organization

### Directory Structure

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures
├── unit/
│   ├── domain/
│   │   ├── test_user.py
│   │   └── test_payment.py
│   ├── application/
│   │   ├── test_register_user.py
│   │   └── test_process_payment.py
│   └── infrastructure/
│       └── test_user_repository.py
├── integration/
│   ├── test_api.py
│   ├── test_database.py
│   └── test_external_services.py
└── e2e/
    ├── test_user_flows.py
    └── test_payment_flows.py
```

### conftest.py

```python
# tests/conftest.py

import pytest
import asyncio
from typing import AsyncGenerator

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def temp_dir(tmp_path):
    """Temporary directory for tests"""
    return tmp_path

@pytest.fixture
def sample_user():
    """Sample user for tests"""
    return User(
        id=1,
        email="test@example.com",
        hashed_password="hashed",
        is_active=True
    )
```

## Coverage Requirements

### Measuring Coverage

```bash
# Run tests with coverage
pytest --cov=src --cov-report=html --cov-report=term-missing

# View coverage report
open htmlcov/index.html
```

### Coverage Targets

```python
# Minimum coverage by module type
Domain Entities:      >= 90%  # Core business logic
Use Cases:            >= 90%  # Application logic
Repositories:         >= 85%  # Data access
API Endpoints:        >= 80%  # Integration points
Utilities:            >= 75%  # Helper functions

Overall:              >= 85%
```

### Critical Paths

**Must have 100% coverage:**

- Authentication/authorization
- Payment processing
- Data validation
- Security-sensitive operations
- Financial calculations

## Test Performance

### Speed Guidelines

```
Unit tests:        < 100ms each
Integration tests: < 1 second each
E2E tests:         < 30 seconds each
Full test suite:   < 5 minutes
```

### Optimization

```python
# ✅ GOOD - Fast unit test with mocks
async def test_fast():
    repo = Mock()  # Instant
    repo.find = AsyncMock(return_value=None)
    result = await use_case.execute()
    # Runs in milliseconds

# ❌ SLOW - Real database connection
async def test_slow():
    repo = RealRepository(real_db_connection)
    result = await use_case.execute()
    # Takes seconds
```

## Best Practices

### 1. One Assert Per Test (When Possible)

```python
# ✅ GOOD - Single responsibility
def test_user_email_is_set():
    user = User(email="test@example.com")
    assert user.email == "test@example.com"

def test_user_is_active_by_default():
    user = User(email="test@example.com")
    assert user.is_active is True

# ⚠️ ACCEPTABLE - Related assertions
def test_user_creation():
    user = User(email="test@example.com")
    assert user.email == "test@example.com"
    assert user.is_active is True
    assert user.created_at is not None
```

### 2. Test Behavior, Not Implementation

```python
# ✅ GOOD - Test behavior
def test_user_registration_creates_user():
    user = await register_user("test@example.com", "pass")
    assert user.email == "test@example.com"
    # Don't care HOW it's created

# ❌ BAD - Test implementation details
def test_user_registration_calls_bcrypt():
    user = await register_user("test@example.com", "pass")
    bcrypt.hash.assert_called_once()
    # Too tied to implementation
```

### 3. Use Descriptive Assertions

```python
# ✅ GOOD - Clear error messages
assert user.is_active, f"Expected user {user.id} to be active"
assert len(users) == 3, f"Expected 3 users, got {len(users)}"

# ❌ BAD - No context
assert user.is_active
assert len(users) == 3
```

### 4. Clean Up After Tests

```python
# ✅ GOOD - Cleanup in fixture
@pytest.fixture
async def temp_file():
    file_path = "/tmp/test.txt"
    yield file_path
    # Cleanup
    if os.path.exists(file_path):
        os.remove(file_path)

# ✅ GOOD - Cleanup in test
async def test_with_cleanup():
    file = create_temp_file()
    try:
        # Test code
        pass
    finally:
        cleanup(file)
```

### 5. Isolate Tests

```python
# ✅ GOOD - Each test is independent
def test_create_user():
    user = create_user("test1@example.com")
    assert user.email == "test1@example.com"

def test_delete_user():
    user = create_user("test2@example.com")  # Fresh user
    delete_user(user.id)
    # Independent of previous test

# ❌ BAD - Tests depend on each other
user = None

def test_create_user():
    global user
    user = create_user("test@example.com")

def test_delete_user():
    global user
    delete_user(user.id)  # Depends on previous test!
```

---

**Remember**: Good tests are fast, isolated, repeatable, and test behavior not implementation. Aim for >= 85% coverage with focus on critical paths!
