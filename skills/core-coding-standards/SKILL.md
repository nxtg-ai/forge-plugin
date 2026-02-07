---
name: Core Coding Standards
description: Enforces foundational coding standards and TypeScript best practices.
---

# Coding Standards & Conventions

## Python Standards

### Naming Conventions

```python
# Modules and packages
my_module.py
my_package/

# Classes
class UserAccount:
class PaymentProcessor:

# Functions and variables
def calculate_total():
user_email = "test@example.com"

# Constants
MAX_RETRY_ATTEMPTS = 3
DATABASE_URL = "postgresql://..."

# Private (internal use)
_internal_helper()
_private_var = 42
```

### Type Hints

**Always use type hints** for function signatures:

```python
# ✅ GOOD - Full type hints
async def create_user(
    email: str,
    password: str,
    repo: UserRepository
) -> User:
    user = User(email=email, hashed_password=hash_password(password))
    return await repo.save(user)

# ❌ BAD - No type hints
async def create_user(email, password, repo):
    user = User(email=email, hashed_password=hash_password(password))
    return await repo.save(user)
```

**Use modern Python types** (3.9+):

```python
# ✅ GOOD - Modern syntax
def process_items(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

# ❌ BAD - Old syntax
from typing import List, Dict
def process_items(items: List[str]) -> Dict[str, int]:
    return {item: len(item) for item in items}
```

### Docstrings

Use docstrings for classes and public functions:

```python
def register_user(email: str, password: str) -> User:
    """
    Register a new user in the system.
    
    Args:
        email: User's email address (must be valid format)
        password: User's password (minimum 8 characters)
    
    Returns:
        Created User object with assigned ID
    
    Raises:
        UserExistsError: If email is already registered
        WeakPasswordError: If password doesn't meet requirements
    
    Example:
        >>> user = await register_user("test@example.com", "SecurePass123")
        >>> print(user.email)
        test@example.com
    """
    ...
```

### Import Organization

```python
# 1. Standard library imports
import json
import logging
from datetime import datetime
from typing import Protocol

# 2. Third-party imports
from fastapi import APIRouter, Depends
from sqlalchemy import select
from pydantic import BaseModel

# 3. Local application imports
from domain.entities import User
from application.use_cases import RegisterUserUseCase
from infrastructure.persistence import UserRepository
```

### Error Handling

```python
# ✅ GOOD - Specific exceptions, proper logging
async def find_user(user_id: int) -> User:
    try:
        user = await repo.find_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"User {user_id} not found")
        return user
    except DatabaseConnectionError as e:
        logger.error(f"Database error finding user {user_id}: {e}")
        raise ServiceUnavailableError() from e
    except Exception as e:
        logger.exception(f"Unexpected error finding user {user_id}")
        raise

# ❌ BAD - Bare except, no logging
async def find_user(user_id: int):
    try:
        return await repo.find_by_id(user_id)
    except:
        return None
```

### Async/Await

```python
# ✅ GOOD - Use async for I/O operations
async def get_user_data(user_id: int) -> UserData:
    user, posts, comments = await asyncio.gather(
        user_repo.find_by_id(user_id),
        post_repo.find_by_user(user_id),
        comment_repo.find_by_user(user_id)
    )
    return UserData(user=user, posts=posts, comments=comments)

# ❌ BAD - Sequential awaits (slow)
async def get_user_data(user_id: int) -> UserData:
    user = await user_repo.find_by_id(user_id)
    posts = await post_repo.find_by_user(user_id)
    comments = await comment_repo.find_by_user(user_id)
    return UserData(user=user, posts=posts, comments=comments)
```

### Code Organization

```python
# ✅ GOOD - Single Responsibility Principle
class UserRepository:
    """Only responsible for user persistence"""
    async def find_by_id(self, user_id: int) -> User: ...
    async def save(self, user: User) -> User: ...

class EmailService:
    """Only responsible for sending emails"""
    async def send_welcome(self, email: str): ...

# ❌ BAD - Multiple responsibilities
class UserManager:
    """Too many responsibilities!"""
    async def save_user(self, user: User): ...  # Persistence
    async def send_email(self, email: str): ...  # Email
    async def log_action(self, action: str): ...  # Logging
```

## JavaScript/TypeScript Standards

### TypeScript Over JavaScript

Always use TypeScript for type safety:

```typescript
// ✅ GOOD - TypeScript with interfaces
interface User {
  id: number;
  email: string;
  createdAt: Date;
}

async function createUser(email: string, password: string): Promise<User> {
  // Implementation
}

// ❌ BAD - Plain JavaScript, no types
async function createUser(email, password) {
  // No type safety!
}
```

### Naming Conventions

```typescript
// Interfaces and types
interface UserAccount {}
type UserId = string;

// Classes
class PaymentProcessor {}

// Functions and variables (camelCase)
function calculateTotal() {}
const userEmail = "test@example.com";

// Constants (UPPER_SNAKE_CASE)
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = "https://api.example.com";

// Private (prefix with _)
class Example {
  private _internalState: string;
}
```

### Modern JavaScript

```typescript
// ✅ GOOD - Modern syntax
const users = await Promise.all(ids.map(id => fetchUser(id)));
const active = users.filter(u => u.isActive);
const {email, name} = user;

// ❌ BAD - Old syntax
var users = [];
for (var i = 0; i < ids.length; i++) {
  users.push(await fetchUser(ids[i]));
}
```

## SQL Standards

### Query Formatting

```sql
-- ✅ GOOD - Formatted, readable
SELECT 
    u.id,
    u.email,
    u.created_at,
    COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
WHERE u.is_active = true
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC
LIMIT 100;

-- ❌ BAD - One line, hard to read
SELECT u.id,u.email,COUNT(p.id) FROM users u LEFT JOIN posts p ON p.user_id=u.id WHERE u.is_active=true GROUP BY u.id;
```

### Indexing

```sql
-- Create indexes for foreign keys and frequently queried columns
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_users_email ON users(email); -- UNIQUE index better
```

## Git Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

```
feat: New feature
fix: Bug fix
docs: Documentation only
style: Code formatting (no logic change)
refactor: Code restructuring (no behavior change)
test: Adding or updating tests
chore: Build process, dependencies
perf: Performance improvement
```

### Examples

```
# ✅ GOOD
feat(auth): add JWT refresh token endpoint

- Implement RefreshTokenUseCase
- Add POST /auth/refresh endpoint
- Add integration tests
- Update API documentation

Closes #123

# ❌ BAD
update stuff
```

## Code Review Checklist

Before submitting PR:

- [ ] All tests pass
- [ ] Test coverage >= 85%
- [ ] No linting errors
- [ ] Type hints/types present
- [ ] Documentation updated
- [ ] No console.log/print statements (use proper logging)
- [ ] No hardcoded secrets
- [ ] Error handling implemented
- [ ] Efficient queries (no N+1)
- [ ] Commit messages follow convention

## File Size Limits

- **Functions**: Max 50 lines (aim for 20)
- **Classes**: Max 300 lines
- **Files**: Max 500 lines
- If larger, refactor into smaller modules

## Comments

```python
# ✅ GOOD - Explain WHY, not WHAT
# Use exponential backoff to avoid overwhelming the API during outages
await retry_with_backoff(api_call)

# ✅ GOOD - Document complex algorithms
# Boyer-Moore string search algorithm for O(n/m) average case
def search(text: str, pattern: str) -> int:
    ...

# ❌ BAD - State the obvious
# Increment counter by 1
counter += 1

# ❌ BAD - Commented-out code
# user = await repo.find(id)
# if user:
#     return user
```

## Security Standards

```python
# ✅ GOOD - Secrets in environment
database_url = os.getenv("DATABASE_URL")
api_key = os.getenv("STRIPE_API_KEY")

# ❌ BAD - Hardcoded secrets
database_url = "postgresql://user:password123@db:5432/prod"

# ✅ GOOD - Password hashing
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"])
hashed = pwd_context.hash(password)

# ❌ BAD - Plain text passwords
password = "123456"  # Never store plain text!

# ✅ GOOD - Input validation
email = EmailStr()  # Pydantic validation

# ❌ BAD - No validation
email = request.get("email")  # Could be anything!
```

## Performance Standards

```python
# ✅ GOOD - Pagination for large datasets
@router.get("/users")
async def list_users(skip: int = 0, limit: int = 100):
    return await repo.list(skip=skip, limit=limit)

# ❌ BAD - Load everything
@router.get("/users")
async def list_users():
    return await repo.all()  # Could be millions!

# ✅ GOOD - Connection pooling
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10
)

# ❌ BAD - New connection every time
async def query():
    conn = await asyncpg.connect(DATABASE_URL)
    # Creates new connection each time!
```

---

**Remember**: Consistent code is maintainable code. Follow these standards for professional, production-ready applications.
