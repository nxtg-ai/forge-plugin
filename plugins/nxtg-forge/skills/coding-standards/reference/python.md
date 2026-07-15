# Python — Detailed Reference

Companion to `../SKILL.md`. Tool configs and pattern deep dives. Examples use neutral,
illustrative names (`app/`, `User`, `Order`) — substitute your own package/module names.
All thresholds are recommended defaults; tune them in your own config.

---

## Formatting

### Black

```toml
# pyproject.toml
[tool.black]
line-length = 100
target-version = ['py311']
```

Patterns Black (and readable code) favor:

```python
# Trailing comma → one arg per line, stable diffs
result = some_function(
    argument_one="value",
    argument_two="another_value",
)

# Break BEFORE binary operators
total = (
    first_value
    + second_value
    + third_value
)

# Comprehensions: single line when simple, multiline when it has a filter + transform
squares = [x**2 for x in range(10)]
filtered = [
    transform(item)
    for item in collection
    if item.is_valid() and item.priority > 5
]
```

Do **not** also run Ruff's formatter over the same files — pick one (see SKILL gotchas).

---

## Type Hints

```python
from typing import Any, Protocol
from pathlib import Path
from collections.abc import Callable, Iterable, Mapping
from dataclasses import dataclass

def generate(
    source: Path,
    config: dict[str, Any],
    output_dir: Path,
    *,
    dry_run: bool = False,
) -> list[Path]:
    ...

@dataclass(frozen=True)
class Order:
    id: str
    total: float
    items: list[str]

# Protocol = structural typing; prefer over concrete base classes for seams
class Repository(Protocol):
    def find_by_id(self, id: str) -> Order | None: ...
    def save(self, order: Order) -> None: ...
```

Modern syntax (Python 3.9+ builtins, 3.10+ unions):

| Old (avoid) | New (use) |
|-------------|-----------|
| `List[str]` | `list[str]` |
| `Dict[str, int]` | `dict[str, int]` |
| `Tuple[int, ...]` | `tuple[int, ...]` |
| `Union[X, Y]` | `X \| Y` |
| `Optional[X]` | `X \| None` |

### MyPy

```toml
# pyproject.toml
[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

---

## Error Handling

### A domain exception hierarchy (illustrative)

Define your *own* base error and specific subclasses so callers can catch precisely:

```python
class AppError(Exception):
    """Base for this application's errors."""

class NotFoundError(AppError):
    def __init__(self, what: str, key: str) -> None:
        self.what, self.key = what, key
        super().__init__(f"{what} not found: {key}")

class ValidationError(AppError):
    def __init__(self, errors: list[str]) -> None:
        self.errors = errors
        super().__init__("validation failed:\n" + "\n".join(f"  - {e}" for e in errors))
```

### Specific catch + context preservation

```python
def load_config(path: Path) -> Config:
    try:
        return Config.from_file(path)
    except FileNotFoundError as e:
        raise NotFoundError("config", str(path)) from e
    except yaml.YAMLError as e:
        raise ValidationError([str(e)]) from e
    # NOT: except Exception as e: raise Exception(f"Failed: {e}")  # context lost
```

### Resource cleanup, graceful degradation, retry

```python
with open(file_path) as f:          # context manager closes on exception
    content = f.read()

def get_cached(key: str) -> Value | None:
    try:
        return self._cache[key]
    except KeyError:
        return None                 # typed absence, not a swallowed error

def save_with_retry(data: str, max_retries: int = 3) -> None:
    for attempt in range(max_retries):
        try:
            self._write(data)
            return
        except OSError:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # exponential backoff
```

---

## Testing (pytest)

### Layout

```
tests/
├── unit/          # ~70%
├── integration/   # ~20%
└── e2e/           # ~10%
```

### Naming + AAA structure

```python
# Pattern: test_<unit>_<scenario>_<expected>
def test_load_config_with_missing_file_raises_not_found():
    # Arrange
    loader = ConfigLoader(base_dir=tmp_path)

    # Act / Assert
    with pytest.raises(NotFoundError):
        loader.load("does-not-exist")
```

### Fixtures + mocking strategy

```python
# conftest.py — shared fixtures, scope as narrow as possible
@pytest.fixture
def sample_order() -> Order:
    return Order(id="A1", total=9.99, items=["x"])

# Mock EXTERNAL dependencies (I/O, network) — never internal/private logic
def test_export_writes_file(mocker):
    write = mocker.patch("pathlib.Path.write_text")
    Exporter(dest).export(sample_order)
    assert write.call_count == 1
```

### Pytest config

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = [
    "-v",
    "--cov=app",                 # your package name
    "--cov-report=term-missing",
    "--cov-fail-under=80",       # your threshold; also check PER-FILE coverage
]
```

---

## Docstrings (Google style)

```python
def generate(spec: str, output_dir: Path | None = None, *, dry_run: bool = False) -> list[Path]:
    """Generate files from a specification.

    Args:
        spec: Specification text.
        output_dir: Target directory. Defaults to the current project root.
        dry_run: If True, validate but write nothing.

    Returns:
        Paths of the generated files.

    Raises:
        NotFoundError: If a required input is missing.
        ValidationError: If the spec is invalid.

    Example:
        >>> generate("# App", dry_run=True)
        []
    """
```

Comments explain WHY; `# TODO(username): ...` / `# FIXME(username): ...` for tracked work.

---

## Complexity

```python
# Guard clauses (nesting 1) — prefer this
def validate(order: Order) -> Result:
    if not order.items:
        return Result.error("no items")
    if order.total <= 0:
        return Result.error("total must be positive")
    return Result.ok()

# vs deep nesting (nesting 3) — avoid
def validate(order: Order) -> Result:
    if order.items:
        if order.total > 0:
            return Result.ok()
        else:
            return Result.error("total must be positive")
    else:
        return Result.error("no items")
```

Extract strategies/polymorphism when a function branches heavily on a type/flag.

### Ruff

```toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "W", "F", "I", "C90", "N", "UP", "B"]  # incl. isort + mccabe + naming

[tool.ruff.lint.mccabe]
max-complexity = 10
```

---

## Imports

```python
# stdlib
import json
from pathlib import Path
from typing import Any

# third-party
import click
import yaml

# local
from app.domain import Order
from app.services import OrderService
```

```python
# Explicit named imports; alias only long names
from app.infrastructure.repository import SqlOrderRepository as OrderRepo

# TYPE_CHECKING guard to break import cycles (annotations only)
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.domain import Order

# Optional dependency with fallback
try:
    import redis
except ImportError:
    redis = None
```

Wildcard imports (`from app.domain import *`) are banned.

---

## Security Patterns

```python
# Input validation + path-traversal prevention (resolve BOTH sides — see SKILL gotcha)
def load_named(name: str, base: Path) -> Path:
    if not name.replace("-", "").replace("_", "").isalnum():
        raise ValueError(f"invalid name: {name}")
    target = (base / f"{name}.yaml").resolve()
    if not target.is_relative_to(base.resolve()):
        raise ValueError(f"path escapes base dir: {name}")
    return target

# Secrets from the environment, validated at startup
API_KEY = os.environ.get("APP_API_KEY")
if not API_KEY:
    raise RuntimeError("APP_API_KEY environment variable required")

# Atomic write (temp file in the destination dir, then replace)
def write_atomic(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(f"{path.suffix}.tmp")
    try:
        tmp.write_text(content, encoding="utf-8")
        tmp.replace(path)
    except Exception:
        tmp.unlink(missing_ok=True)
        raise

# Subprocess: argument list, never shell=True
import shlex, subprocess
def run(command: str, cwd: Path) -> str:
    return subprocess.run(
        shlex.split(command), cwd=cwd, capture_output=True, text=True,
        timeout=30, check=True,
    ).stdout
# NEVER: subprocess.check_output(command, shell=True)  # shell injection
```

Hash passwords with a real KDF:

```python
from passlib.context import CryptContext
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd.hash(password)
```

---

## Automation

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.10.0
    hooks: [{ id: black, args: [--line-length=100] }]
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.7.0
    hooks: [{ id: ruff, args: [--fix] }]
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.13.0
    hooks: [{ id: mypy }]
```

```makefile
# Makefile — replace `app` with your package
format:  ; black --line-length 100 app/ tests/
lint:    ; ruff check app/ tests/
types:   ; mypy app/
test:    ; pytest -v --cov=app --cov-report=term-missing --cov-fail-under=80
quality: format lint types test
```

---

## References

- [PEP 8 — Style Guide for Python Code](https://peps.python.org/pep-0008/)
- [Black](https://black.readthedocs.io/) · [Ruff](https://docs.astral.sh/ruff/) · [MyPy](https://mypy.readthedocs.io/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
