---
name: Core Architecture
description: >
  Language-agnostic Clean Architecture, Domain-Driven Design, REST API,
  repository/unit-of-work, caching, event-driven, and error-handling reference
  patterns (with runnable Python examples). Use when designing or reviewing a
  new feature's layer structure, deciding where a piece of logic belongs
  (domain vs application vs infrastructure vs interface), enforcing the
  dependency rule, splitting entities from value objects, defining aggregates,
  shaping REST resources and status codes, choosing a caching strategy, or
  refactoring a layering / dependency-direction violation.
when_to_use: >
  Trigger on requests like "design the architecture for X", "which layer does
  this belong in", "review my clean architecture", "is this domain or
  infrastructure", "how do I structure this feature", "repository pattern",
  "unit of work", "aggregate root", "domain vs value object", "REST endpoint
  design", "what status code", "cache-aside vs write-through", "domain events",
  "fix the dependency direction", "my domain imports the database".
allowed-tools: Read, Grep, Glob
---

# Architecture Patterns & Best Practices

Language-agnostic design patterns. Examples are Python (async FastAPI +
SQLAlchemy) but the principles apply to any stack. For NXTG-Forge's own
concrete system layering, see the separate `Architecture` skill.

## When to use this skill

Reach for this when placing new logic, drawing layer boundaries, or refactoring
a dependency-direction violation. The core question it answers: **where does
this code belong, and what is it allowed to depend on?**

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

## Gotchas

Non-obvious failure modes that pass review but break later:

1. **Anemic domain model.** Entities become dumb data bags and every rule lives
   in a use case / "service". This is the most common way DDD collapses back
   into procedural code. Test: if `User` has no behavior methods and
   `UserService` mutates its fields directly, the model is anemic — move
   invariant-enforcing logic (like `change_password` above) onto the entity.

2. **Async lazy-loading raises, it doesn't silently N+1.** With async
   SQLAlchemy, accessing an unloaded relationship (`user.posts`) outside a
   greenlet context throws `MissingGreenlet` / `DetachedInstanceError`, not a
   convenient extra query. You MUST `selectinload`/`joinedload` up front. The
   N+1 examples above are the *sync* trap; async turns the same mistake into a
   runtime crash.

3. **The repository leaks ORM models.** Returning a `UserModel` (SQLAlchemy
   row) instead of the domain `User` silently drags infrastructure into the
   domain — the dependency rule is now violated through the return type, not an
   import. Always map at the boundary (`_to_domain`), and type the interface's
   return as the domain entity.

4. **Domain events are collected but never dispatched.** The `_events` list
   pattern only works if something drains and publishes it after the
   transaction commits. A common bug: events appended in the domain, the
   aggregate saved, and `_events` never read — so `SendWelcomeEmailHandler`
   never fires. Decide the dispatch point (usually the unit-of-work / use case
   after `commit`) and clear the list once published.

5. **Cache-aside has no invalidation path.** The `get_user` cache-aside example
   populates on read but nothing evicts on write. Pair it with an explicit
   delete/overwrite in every mutation path, or reads serve stale data until
   TTL. Write-through narrows but doesn't close the stale window between the DB
   commit and the cache write.

6. **FastAPI already returns 422 for validation.** Request-body/Pydantic
   validation failures come back as `422 Unprocessable Entity` automatically.
   Raising a custom `HTTPException(400)` for the *same* class of error makes the
   API inconsistent — reserve 400 for malformed requests and 422 for
   semantically invalid ones, and don't fight the framework default.

7. **Aggregates referencing each other by object, not ID.** Holding a direct
   `Order.customer: Customer` object reference across aggregate boundaries
   creates load fan-out, transactional coupling, and circular imports. Reference
   other aggregate roots by identity (`customer_id: int`) and load them
   separately.

8. **`frozen=True` gives structural equality — but only for its fields.** A
   value object's equality/hash is derived from its declared fields; a mutable
   field (a `list`, a nested non-frozen object) inside a frozen dataclass breaks
   hashing and lets the "immutable" value mutate underneath a dict/set key. Keep
   value-object fields primitive or themselves immutable.

## Additional resources

- NXTG-Forge's concrete system architecture (CLI ↔ hooks ↔ layers, agent
  orchestration): the sibling `Architecture` skill.
- Cross-language naming, typing, and error-handling conventions: the
  `Core Coding Standards` skill.

---

**Remember**: Architecture is about managing dependencies. Keep domain pure, use interfaces, and follow the dependency rule!
