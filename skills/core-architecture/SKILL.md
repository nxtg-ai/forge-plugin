---
name: Core Architecture
description: Defines core architectural principles and system design foundations.
---

# Architecture Patterns & Best Practices

## Clean Architecture

NXTG-Forge projects follow Clean Architecture principles with clear layer separation.

### Layer Structure

```
src/
├── domain/              # Core business logic (innermost)
│   ├── entities/        # Business objects
│   ├── value_objects/   # Immutable values
│   ├── repositories/    # Interfaces only
│   └── services/        # Domain services
│
├── application/         # Use cases (depends on domain only)
│   ├── use_cases/       # Application logic
│   └── dtos/            # Data transfer objects
│
├── infrastructure/      # External concerns (implements interfaces)
│   ├── persistence/     # Database implementations
│   ├── external_services/ # API clients
│   └── config/          # Configuration
│
└── interface/           # Entry points (HTTP, CLI, etc.)
    ├── api/             # REST API routes
    ├── cli/             # CLI commands
    └── schemas/         # Request/response models
```

### Dependency Rule

**Dependencies point inward**: Domain → Application → Infrastructure → Interface

```python
# ✅ GOOD - Interface depends on application
from application.use_cases import RegisterUserUseCase

@router.post("/register")
async def register(request: RegisterRequest, use_case: RegisterUserUseCase = Depends()):
    return await use_case.execute(request.email, request.password)

# ❌ BAD - Domain depends on infrastructure
class User:
    def save(self):
        db.session.add(self)  # Domain should NOT know about database!
```

### Example: User Management Feature

```python
# 1. DOMAIN LAYER - Pure business logic
from dataclasses import dataclass
from typing import Protocol

@dataclass
class User:
    """Domain entity"""
    id: int
    email: str
    hashed_password: str
    
    def change_password(self, old_password: str, new_password: str):
        """Domain logic for password change"""
        if not verify_password(old_password, self.hashed_password):
            raise InvalidPasswordError()
        self.hashed_password = hash_password(new_password)

class UserRepository(Protocol):
    """Repository interface in domain"""
    async def find_by_email(self, email: str) -> User | None: ...
    async def save(self, user: User) -> User: ...

# 2. APPLICATION LAYER - Use cases
class RegisterUserUseCase:
    def __init__(self, user_repo: UserRepository, email_service: EmailService):
        self.user_repo = user_repo
        self.email_service = email_service
    
    async def execute(self, email: str, password: str) -> User:
        # Application logic orchestrates domain objects
        existing = await self.user_repo.find_by_email(email)
        if existing:
            raise UserExistsError()
        
        user = User(id=None, email=email, hashed_password=hash_password(password))
        user = await self.user_repo.save(user)
        await self.email_service.send_welcome(email)
        return user

# 3. INFRASTRUCTURE LAYER - Concrete implementations
from sqlalchemy.ext.asyncio import AsyncSession

class SQLAlchemyUserRepository:
    """Implements domain interface"""
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def find_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(UserModel).where(UserModel.email == email)
        )
        db_user = result.scalar_one_or_none()
        return self._to_domain(db_user) if db_user else None
    
    async def save(self, user: User) -> User:
        db_user = UserModel(email=user.email, hashed_password=user.hashed_password)
        self.session.add(db_user)
        await self.session.commit()
        return self._to_domain(db_user)

# 4. INTERFACE LAYER - HTTP API
from fastapi import APIRouter, Depends

@router.post("/users/register")
async def register(
    request: RegisterRequest,
    use_case: RegisterUserUseCase = Depends(get_register_use_case)
):
    user = await use_case.execute(request.email, request.password)
    return UserResponse.from_domain(user)
```

## Domain-Driven Design

### Entities vs Value Objects

**Entities**: Have identity, mutable

```python
class User:
    """Entity - has unique ID"""
    def __init__(self, id: int, email: str):
        self.id = id  # Identity
        self.email = email  # Can change
```

**Value Objects**: No identity, immutable

```python
@dataclass(frozen=True)
class Email:
    """Value object - no ID, immutable"""
    address: str
    
    def __post_init__(self):
        if "@" not in self.address:
            raise InvalidEmailError()
```

### Aggregates

Group related entities under a root:

```python
class Order:  # Aggregate root
    def __init__(self, id: int):
        self.id = id
        self._items: list[OrderItem] = []  # Child entities
    
    def add_item(self, product: Product, quantity: int):
        # Business rule enforced by aggregate
        if quantity <= 0:
            raise InvalidQuantityError()
        self._items.append(OrderItem(product, quantity))
    
    def calculate_total(self) -> Decimal:
        return sum(item.subtotal() for item in self._items)

# ✅ GOOD - Modify through aggregate root
order.add_item(product, quantity=2)

# ❌ BAD - Direct modification bypasses business rules
order._items.append(OrderItem(product, -1))  # Negative quantity!
```

## API Design Patterns

### RESTful Resources

```python
# ✅ GOOD - Resource-oriented
GET    /users           # List users
GET    /users/123       # Get user
POST   /users           # Create user
PUT    /users/123       # Update user
DELETE /users/123       # Delete user

# ❌ BAD - RPC-style
POST /createUser
POST /getUser
POST /updateUser
```

### Status Codes

```python
200 OK              # Successful GET/PUT
201 Created         # Successful POST
204 No Content      # Successful DELETE
400 Bad Request     # Validation error
401 Unauthorized    # No/invalid auth
403 Forbidden       # Valid auth, no permission
404 Not Found       # Resource doesn't exist
422 Unprocessable   # Semantic error
500 Server Error    # Unhandled exception
```

### Pagination

```python
@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 100,
    repo: UserRepository = Depends()
):
    users = await repo.list(skip=skip, limit=limit)
    total = await repo.count()
    
    return {
        "items": [UserResponse.from_domain(u) for u in users],
        "total": total,
        "skip": skip,
        "limit": limit
    }
```

## Database Patterns

### Repository Pattern

```python
class UserRepository(Protocol):
    """Interface in domain layer"""
    async def find_by_id(self, user_id: int) -> User | None: ...
    async def find_by_email(self, email: str) -> User | None: ...
    async def save(self, user: User) -> User: ...
    async def delete(self, user_id: int) -> None: ...
    async def list(self, skip: int = 0, limit: int = 100) -> list[User]: ...
```

### Unit of Work

```python
class UnitOfWork:
    """Manage transaction boundary"""
    def __init__(self, session: AsyncSession):
        self.session = session
        self.users = SQLAlchemyUserRepository(session)
        self.orders = SQLAlchemyOrderRepository(session)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.session.rollback()
        else:
            await self.session.commit()

# Usage
async with UnitOfWork(session) as uow:
    user = await uow.users.find_by_id(123)
    order = await uow.orders.create(user.id)
    # Both operations committed together
```

### Query Optimization

```python
# ✅ GOOD - Eager loading, no N+1
users = await session.execute(
    select(UserModel)
    .options(selectinload(UserModel.posts))
    .options(selectinload(UserModel.comments))
)

# ❌ BAD - N+1 query problem
users = await session.execute(select(UserModel))
for user in users:
    posts = await session.execute(
        select(PostModel).where(PostModel.user_id == user.id)
    )  # N additional queries!
```

## Caching Strategies

### Cache-Aside

```python
async def get_user(user_id: int, cache: Redis, db: UserRepository) -> User:
    # Try cache first
    cached = await cache.get(f"user:{user_id}")
    if cached:
        return User.from_json(cached)
    
    # Cache miss - get from database
    user = await db.find_by_id(user_id)
    if user:
        await cache.setex(f"user:{user_id}", 3600, user.to_json())
    
    return user
```

### Write-Through

```python
async def update_user(user: User, cache: Redis, db: UserRepository) -> User:
    # Update database
    user = await db.save(user)
    
    # Update cache
    await cache.setex(f"user:{user.id}", 3600, user.to_json())
    
    return user
```

## Event-Driven Architecture

### Domain Events

```python
@dataclass
class UserRegisteredEvent:
    """Domain event"""
    user_id: int
    email: str
    occurred_at: datetime

class User:
    def __init__(self, email: str):
        self.email = email
        self._events: list = []
    
    def register(self):
        self._events.append(UserRegisteredEvent(
            user_id=self.id,
            email=self.email,
            occurred_at=datetime.utcnow()
        ))
```

### Event Handlers

```python
class SendWelcomeEmailHandler:
    """Handle UserRegisteredEvent"""
    def __init__(self, email_service: EmailService):
        self.email_service = email_service
    
    async def handle(self, event: UserRegisteredEvent):
        await self.email_service.send_welcome(event.email)
```

## Error Handling

### Exception Hierarchy

```python
class DomainError(Exception):
    """Base for all domain errors"""
    pass

class ValidationError(DomainError):
    """Invalid input"""
    pass

class NotFoundError(DomainError):
    """Resource not found"""
    pass

class ConflictError(DomainError):
    """Resource conflict"""
    pass
```

### Error Handling in Layers

```python
# Domain layer - raise domain exceptions
def change_password(old: str, new: str):
    if not verify(old):
        raise InvalidPasswordError()

# Application layer - handle domain exceptions
async def execute(self, old: str, new: str):
    try:
        user.change_password(old, new)
        await self.repo.save(user)
    except InvalidPasswordError as e:
        logger.warning(f"Invalid password attempt for user {user.id}")
        raise

# Interface layer - convert to HTTP errors
@router.post("/password/change")
async def change_password(request: ChangePasswordRequest):
    try:
        await use_case.execute(request.old, request.new)
    except InvalidPasswordError:
        raise HTTPException(status_code=400, detail="Invalid password")
```

---

**Remember**: Architecture is about managing dependencies. Keep domain pure, use interfaces, and follow the dependency rule!
