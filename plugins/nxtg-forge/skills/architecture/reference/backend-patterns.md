# Backend Architecture Patterns — DDD, REST, Persistence, Caching, Events, Errors

Reference implementations for the "Backend building blocks" sections in
[`../SKILL.md`](../SKILL.md). Covers Domain-Driven Design tactical patterns, REST
resource design, persistence (unit-of-work, N+1), caching, domain events, and
layered error handling.

> **Illustrative, not repo source.** Code below is shown in Python (async web
> stack) as *one* concrete language so the shape is unambiguous. Every pattern is
> language-agnostic — equivalents in TS/JS, Rust, and Go are noted inline. The
> `# path` comments describe an *example* project layout you would create in your
> own codebase; they are not files in this repo.

---

## Domain-Driven Design — tactical patterns

### Entities vs Value Objects

An **entity** has identity that persists across attribute changes (a `User` is the
same user after they change email). A **value object** has no identity — it *is* its
attributes, and it should be immutable (an `Email`, a `Money`, a `DateRange`).

```python
# Entity — identity + behavior that enforces invariants
class User:
    def __init__(self, id: int, email: "Email"):
        self.id = id            # identity — never changes
        self.email = email      # attributes — may change

    def change_email(self, new: "Email"):   # behavior lives ON the entity
        self.email = new

# Value object — no id, immutable, self-validating
@dataclass(frozen=True)
class Email:
    address: str
    def __post_init__(self):
        if "@" not in self.address:
            raise InvalidEmailError(self.address)
```

Cross-language: value objects are `record` (Java/C#), `readonly struct` (Rust —
derive `Clone`/`PartialEq`), a struct-with-no-mutation (Go), or a frozen
class/`Object.freeze` (TS/JS). Rule everywhere: **compare value objects by value,
entities by identity.**

### Aggregates

Group related entities under a single **aggregate root**. All external mutation goes
*through* the root so invariants can't be bypassed.

```python
class Order:                       # aggregate root
    def __init__(self, id: int):
        self.id = id
        self._items: list[OrderItem] = []   # private — no direct outside access

    def add_item(self, product: "Product", quantity: int):
        if quantity <= 0:                    # invariant enforced HERE
            raise InvalidQuantityError()
        self._items.append(OrderItem(product, quantity))

    def total(self) -> Decimal:
        return sum(i.subtotal() for i in self._items)

# ✅ mutate through the root — invariant runs
order.add_item(product, quantity=2)
# ❌ reaching past the root bypasses the rule
order._items.append(OrderItem(product, -1))   # negative qty slips through
```

**Reference other aggregates by identity, not object.** Hold `customer_id: int`,
not `customer: Customer` — a direct object reference across aggregate boundaries
creates load fan-out, transactional coupling, and circular imports.

---

## REST API design

### Resource-oriented URLs, verbs via HTTP method

```
GET    /users        list          POST   /users        create
GET    /users/123    read          PUT    /users/123    replace/update
DELETE /users/123    delete        PATCH  /users/123    partial update
```

Avoid RPC-style paths (`POST /createUser`, `POST /getUser`) — the HTTP method IS
the verb. Nest only for genuine ownership: `GET /users/123/orders`.

### Status codes

| Code | Meaning | Use for |
|---|---|---|
| 200 | OK | Successful GET / PUT / PATCH |
| 201 | Created | Successful POST that creates a resource |
| 204 | No Content | Successful DELETE (empty body) |
| 400 | Bad Request | Malformed request (unparseable body, bad type) |
| 401 | Unauthorized | Missing / invalid credentials |
| 403 | Forbidden | Authenticated but not permitted |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate / version conflict |
| 422 | Unprocessable | Well-formed but semantically invalid |
| 500 | Server Error | Unhandled exception |

Split 400 vs 422 consistently: **400 = can't parse it, 422 = parsed but invalid.**
Many frameworks (FastAPI, NestJS validators) already return 422 for body-validation
failures — don't re-raise a custom 400 for the same class of error.

### Pagination — return items + total + window

```python
@router.get("/users")
async def list_users(skip: int = 0, limit: int = 100, repo: UserRepository = Depends()):
    items = await repo.list(skip=skip, limit=limit)
    total = await repo.count()
    return {"items": [UserResponse.from_domain(u) for u in items],
            "total": total, "skip": skip, "limit": limit}
```

For large/append-heavy sets prefer cursor (keyset) pagination over offset — offset
`skip=100000` scans and discards rows; a cursor (`?after=<last_id>`) does not.

---

## Persistence patterns

### Repository (interface in domain, implementation in infrastructure)

```python
class UserRepository(Protocol):        # domain — WHAT is needed
    async def find_by_id(self, user_id: int) -> "User | None": ...
    async def find_by_email(self, email: str) -> "User | None": ...
    async def save(self, user: "User") -> "User": ...
    async def delete(self, user_id: int) -> None: ...
    async def list(self, skip: int = 0, limit: int = 100) -> list["User"]: ...
```

The interface speaks in **domain types** (`User`), never storage types
(`UserRow`/ORM model). Map at the boundary (a `_to_domain` method).

### Unit of Work — one transaction boundary across repositories

```python
class UnitOfWork:
    def __init__(self, session):
        self.session = session
        self.users = SqlUserRepository(session)
        self.orders = SqlOrderRepository(session)

    async def __aenter__(self): return self
    async def __aexit__(self, exc_type, *_):
        if exc_type:  await self.session.rollback()
        else:         await self.session.commit()

async with UnitOfWork(session) as uow:
    user = await uow.users.find_by_id(123)
    await uow.orders.create(user.id)      # both commit together, or both roll back
```

Cross-language: a DB transaction (`BEGIN/COMMIT`), Go's `sql.Tx`, Rust's `sqlx`
transaction, or a Node `knex.transaction` — the pattern is "a set of writes that
succeed or fail atomically, wired to one commit/rollback point."

### N+1 queries — eager-load relationships

```python
# ✅ one query with the relations loaded up front
users = await session.execute(
    select(UserModel).options(selectinload(UserModel.posts)))

# ❌ N+1 — a query per user inside the loop
users = await session.execute(select(UserModel))
for user in users:
    posts = await session.execute(select(PostModel).where(PostModel.user_id == user.id))
```

Note the async trap: with async ORMs, touching an unloaded relation outside its
session/greenlet context **raises** (`MissingGreenlet`/`DetachedInstanceError`),
it does not silently issue an extra query. You must eager-load. Same defect class
in any stack: watch loop bodies that issue a query per row.

---

## Caching strategies

### Cache-aside (lazy) — read populates, writes must evict

```python
async def get_user(user_id, cache, db) -> "User":
    hit = await cache.get(f"user:{user_id}")
    if hit:
        return User.from_json(hit)
    user = await db.find_by_id(user_id)
    if user:
        await cache.setex(f"user:{user_id}", 3600, user.to_json())
    return user
```

Cache-aside has **no invalidation on its own** — every mutation path must delete or
overwrite the key, or reads serve stale data until the TTL expires.

### Write-through — write updates DB and cache together

```python
async def update_user(user, cache, db) -> "User":
    user = await db.save(user)
    await cache.setex(f"user:{user.id}", 3600, user.to_json())
    return user
```

Write-through narrows the stale window but doesn't close it — there is still a gap
between the DB commit and the cache write where a concurrent reader can miss.
Pick TTLs and invalidation deliberately; "cache with no eviction plan" is a bug.

---

## Event-driven architecture

### Domain events — record, then dispatch

```python
@dataclass(frozen=True)
class UserRegistered:
    user_id: int
    email: str
    occurred_at: datetime

class User:
    def __init__(self, email):
        self.email = email
        self._events: list = []
    def register(self):
        self._events.append(UserRegistered(self.id, self.email, datetime.utcnow()))
```

```python
class SendWelcomeEmailHandler:
    def __init__(self, email_service): self.email_service = email_service
    async def handle(self, event: UserRegistered):
        await self.email_service.send_welcome(event.email)
```

The collect-then-dispatch pattern only works if **something drains `_events`** after
the transaction commits (usually the unit-of-work or use case). Decide the dispatch
point, publish, and clear the list — an unread `_events` list is the classic
"event fired but nothing happened" bug.

---

## Layered error handling

Define a domain exception hierarchy; translate to transport errors only at the edge.

```python
class DomainError(Exception): ...
class ValidationError(DomainError): ...
class NotFoundError(DomainError): ...
class ConflictError(DomainError): ...
```

```python
# Domain — raise domain errors, no HTTP/transport awareness
def change_password(old, new):
    if not verify(old):
        raise InvalidPasswordError()

# Application — may log/enrich, re-raises domain errors
async def execute(self, old, new):
    try:
        user.change_password(old, new)
        await self.repo.save(user)
    except InvalidPasswordError:
        logger.warning("invalid password attempt user=%s", user.id)
        raise

# Interface — the ONLY layer that maps to the transport
@router.post("/password/change")
async def change_password(req: ChangePasswordRequest):
    try:
        await use_case.execute(req.old, req.new)
    except InvalidPasswordError:
        raise HTTPException(status_code=400, detail="Invalid password")
    except NotFoundError:
        raise HTTPException(status_code=404)
```

Cross-language: Rust models this with a typed error enum + `?` propagation and a
single mapping at the handler; Go with wrapped `error` values inspected via
`errors.Is`/`errors.As` at the edge; TS with a small error-class hierarchy caught in
a central middleware. The invariant everywhere: **domain code never imports the
transport; only the outermost layer knows what an HTTP status (or gRPC code, or CLI
exit code) is.**
