# Integration & End-to-End Testing

Integration tests exercise real component seams (DB, HTTP, external services) with
**minimal** mocking. E2E tests drive the real product through a browser. Both are
where "unit tests pass but nothing works" fraud gets caught — a suite that is 100%
unit tests with mocked seams proves the units, never the system (crucible-audit
Pattern 5).

## Database Integration (real DB, real repository)

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
        await conn.run_sync(Base.metadata.drop_all)   # teardown — isolate every run
    await engine.dispose()

@pytest.mark.asyncio
async def test_user_crud(test_db):
    async with test_db() as session:
        repo = SQLAlchemyUserRepository(session)
        user = await repo.create(User(email="test@example.com", hashed_password="hash"))
        assert user.id is not None                      # Create
        assert (await repo.find_by_email("test@example.com")).id == user.id  # Read
        user.email = "updated@example.com"
        assert (await repo.save(user)).email == "updated@example.com"        # Update
        await repo.delete(user.id)
        assert await repo.find_by_id(user.id) is None   # Delete
```

## API Integration (real router, assert on the wire contract)

```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_register_endpoint(client, test_db):
    resp = await client.post("/auth/register",
        json={"email": "newuser@example.com", "password": "SecurePass123!"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "newuser@example.com"
    assert "password" not in data          # secret must NOT leak
    assert "hashed_password" not in data

@pytest.mark.asyncio
async def test_register_duplicate_email(client, test_db):
    body = {"email": "dup@example.com", "password": "Pass123!"}
    await client.post("/auth/register", json=body)
    resp = await client.post("/auth/register", json=body)   # second time
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"].lower()
```

## E2E (Playwright — drive the real app, assert on rendered outcome)

```python
import pytest
from playwright.async_api import async_playwright, expect

@pytest.mark.asyncio
@pytest.mark.e2e
async def test_user_registration_flow():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await (await browser.new_context()).new_page()
        await page.goto("http://localhost:3000")
        await page.click('a:has-text("Register")')
        await page.fill('input[name="email"]', "e2etest@example.com")
        await page.fill('input[name="password"]', "SecurePass123!")
        await page.fill('input[name="confirmPassword"]', "SecurePass123!")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard")
        await expect(page.locator('[data-testid="user-menu"]')).to_be_visible()
        await expect(page.locator('text=e2etest@example.com')).to_be_visible()
        await browser.close()
```

**E2E fraud trap**: a test marked `@pytest.mark.e2e` (or a GPU/hardware-gated test)
that is filtered out of CI and never runs still counts as "passing." Verify the CI
job actually executes the mark — crucible-audit Pattern 4 (dead test infrastructure).
