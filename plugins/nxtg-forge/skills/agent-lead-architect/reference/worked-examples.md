# Lead Architect — Worked Examples

## Example 1: Payment processing feature across all four layers

The design intent is that a use case orchestrates domain behavior and talks to
the gateway through an interface it does not own the implementation of. The
domain entity carries the state-transition rules; the infrastructure layer is
swappable.

```python
# 1. DOMAIN LAYER — pure business logic, NO imports from infrastructure
from dataclasses import dataclass
from decimal import Decimal
from enum import Enum
from typing import Optional, Protocol

class PaymentStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

@dataclass
class Payment:
    id: Optional[int]
    amount: Decimal
    currency: str
    status: PaymentStatus

    def mark_as_completed(self) -> None:
        if self.status != PaymentStatus.PENDING:
            raise InvalidPaymentStateError()
        self.status = PaymentStatus.COMPLETED

    def refund(self) -> None:
        if self.status != PaymentStatus.COMPLETED:
            raise CannotRefundError()
        self.status = PaymentStatus.REFUNDED

# Repository + gateway interfaces live in the domain — the impls do NOT
class PaymentRepository(Protocol):
    async def save(self, payment: Payment) -> Payment: ...
    async def find_by_id(self, payment_id: int) -> Optional[Payment]: ...

class PaymentGateway(Protocol):
    async def charge(self, amount: Decimal, currency: str,
                     payment_method_id: str) -> str: ...

# 2. APPLICATION LAYER — use cases, depend on domain only
@dataclass
class ProcessPaymentDTO:
    amount: Decimal
    currency: str
    payment_method_id: str

class ProcessPaymentUseCase:
    def __init__(self, payment_repo: PaymentRepository,
                 payment_gateway: PaymentGateway):
        self.payment_repo = payment_repo
        self.payment_gateway = payment_gateway

    async def execute(self, dto: ProcessPaymentDTO) -> Payment:
        payment = Payment(id=None, amount=dto.amount,
                          currency=dto.currency,
                          status=PaymentStatus.PENDING)
        payment = await self.payment_repo.save(payment)
        try:
            await self.payment_gateway.charge(
                amount=dto.amount, currency=dto.currency,
                payment_method_id=dto.payment_method_id)
            payment.mark_as_completed()
            await self.payment_repo.save(payment)
            return payment
        except PaymentGatewayError as e:
            payment.status = PaymentStatus.FAILED
            await self.payment_repo.save(payment)
            raise PaymentFailedError() from e

# 3. INFRASTRUCTURE LAYER — concrete adapter, implements the domain interface
class StripePaymentGateway:  # satisfies PaymentGateway structurally
    def __init__(self, api_key: str):
        self.client = stripe
        self.client.api_key = api_key

    async def charge(self, amount: Decimal, currency: str,
                     payment_method_id: str) -> str:
        try:
            intent = await self.client.PaymentIntent.create(
                amount=int(amount * 100), currency=currency,
                payment_method=payment_method_id, confirm=True)
            return intent.id
        except stripe.error.CardError as e:
            raise PaymentGatewayError(str(e))

# 4. INTERFACE LAYER — HTTP only; no business logic here
from fastapi import APIRouter, Depends

router = APIRouter()

@router.post("/payments", response_model=PaymentResponse)
async def process_payment(
    request: ProcessPaymentRequest,
    use_case: ProcessPaymentUseCase = Depends(get_process_payment_use_case),
):
    dto = ProcessPaymentDTO(amount=request.amount, currency=request.currency,
                            payment_method_id=request.payment_method_id)
    payment = await use_case.execute(dto)
    return PaymentResponse.from_domain(payment)
```

## Example 2: Architecture Decision Record

```markdown
# ADR-001: Use FastAPI for Backend Framework

**Status:** Accepted

**Context:**
We need a Python backend framework that supports high-performance async
operations, automatic API documentation, and type safety with Pydantic.

**Decision:** Use FastAPI as the backend framework.

**Consequences:**
- Positive: native async/await, automatic OpenAPI docs, Pydantic validation,
  performance comparable to Node.js, strong typing.
- Negative: less mature than Django, smaller ecosystem, must choose separate
  libraries for auth/admin.

**Alternatives Considered:**
- Django — too heavyweight, sync-first.
- Flask — missing modern features, requires many extensions.
- Sanic — less documentation, smaller community.
```

## Best-practice contrasts

### Keep the domain pure

```python
# GOOD — domain entity, no infrastructure
class User:
    def __init__(self, email: Email, password: Password):
        self.email = email
        self.password = password

    def change_password(self, old: str, new: str) -> None:
        if not self.password.verify(old):
            raise InvalidPasswordError()
        self.password = Password.from_plain(new)

# BAD — persistence leaked into the entity
class User:
    def __init__(self, email: str):
        self.email = email

    def save(self):
        db.session.add(self)   # domain now depends on the DB session
        db.session.commit()
```

### Inject dependencies, never construct them

```python
# GOOD
class CreateUserUseCase:
    def __init__(self, user_repo: UserRepository, email_service: EmailService):
        self.user_repo = user_repo
        self.email_service = email_service

# BAD — the use case is now welded to Postgres and SendGrid
class CreateUserUseCase:
    def __init__(self):
        self.user_repo = PostgresUserRepository()
        self.email_service = SendGridEmailService()
```

### Define the interface once; let implementations vary

```python
class EmailService(Protocol):
    async def send(self, to: Email, subject: str, body: str) -> None: ...

class SendGridEmailService:   # structural match
    async def send(self, to, subject, body): ...

class SMTPEmailService:       # swap without touching the use case
    async def send(self, to, subject, body): ...
```
