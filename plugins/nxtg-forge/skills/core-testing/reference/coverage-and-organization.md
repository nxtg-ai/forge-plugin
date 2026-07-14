# Coverage, Organization & Performance

## Directory Layout (mirror source, separate by speed)

```
tests/
├── conftest.py              # shared fixtures (pytest); Node: setup files
├── unit/                    # fast, isolated, mocked seams — 70%
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── integration/             # real DB/HTTP/services — 20%
└── e2e/                     # browser-driven full flows — 10%
```

Node/vitest equivalent in this plugin: `servers/governance-mcp/tests/**/*.test.mjs`
(vitest runner) vs `servers/governance-mcp/__tests__/*.test.mjs` (`node:test` runner).
The two runners are kept in **separate directories** — vitest's `include`
(`tests/**`) deliberately excludes `__tests__/` so the runners never collide.

## Shared Fixtures (conftest.py)

```python
import pytest, asyncio

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def sample_user():
    return User(id=1, email="test@example.com", hashed_password="hashed", is_active=True)
```

## Measuring Coverage

```bash
# Python
pytest --cov=src --cov-report=html --cov-report=term-missing
# Node (vitest, this plugin)
npx vitest run --coverage
```

Coverage is a **map of what ran**, not proof it was verified. A line executed by a
test with a hollow assertion counts as "covered" while proving nothing. Read the
number alongside assertion quality — never alone (crucible-audit Pattern 1 & 2).

## Coverage Targets (guideline, not a finish line)

| Module type | Target |
|---|---|
| Domain entities / use cases | ≥ 90% |
| Repositories | ≥ 85% |
| API endpoints | ≥ 80% |
| Utilities | ≥ 75% |
| **Overall** | **≥ 85%** |

**Must approach 100%** (and be genuinely asserted): authentication/authorization,
payment processing, data validation, security-sensitive ops, financial calculations.

## Performance Budgets

| Test type | Budget |
|---|---|
| Unit | < 100 ms each |
| Integration | < 1 s each |
| E2E | < 30 s each |
| Full suite | < 5 min |

A unit test that touches a real DB or network is misclassified — move it to
`integration/` or mock the seam. Slow "unit" suites erode the fast-feedback loop.
