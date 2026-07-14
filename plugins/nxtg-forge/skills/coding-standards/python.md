# Python Coding Standards — Detailed Reference

Companion to `SKILL.md`. Contains code examples, tool configs, and pattern deep dives.

---

## Code Formatting

### Black Configuration

```toml
# pyproject.toml
[tool.black]
line-length = 100
target-version = ['py311']
include = '\.pyi?$'
```

### Formatting Patterns

**Vertical Alignment**

```python
# Good
result = some_function(
    argument_one="value",
    argument_two="another_value",
    argument_three="final_value",
)

# Avoid
result = some_function(argument_one="value",
                       argument_two="another_value")
```

**Line Breaks — before binary operators**

```python
# Good
total = (
    first_value
    + second_value
    + third_value
)

# Avoid
total = (first_value +
         second_value +
         third_value)
```

**Comprehensions**

```python
# Good - simple, single line
squares = [x**2 for x in range(10)]

# Good - complex, multiline
filtered_data = [
    transform(item)
    for item in collection
    if item.is_valid() and item.priority > 5
]

# Avoid - complex single line
result = [transform(x) for x in items if x.valid() and x.priority > 5 and x.status == "active"]
```

---

## Type Hints

### Full Example

```python
from typing import Any, Protocol
from pathlib import Path
from collections.abc import Callable, Iterable, Mapping

# Complete type hints
def generate_files(
    template_path: Path,
    config: dict[str, Any],
    output_dir: Path,
    *,
    dry_run: bool = False,
) -> list[Path]:
    """Generate files from template."""
    ...

# Dataclass with types
@dataclass(frozen=True)
class Template:
    """Template definition."""
    name: str
    version: str
    files: list[TemplateFile]
    variables: dict[str, VariableDefinition]
    metadata: dict[str, Any]

# Protocol for structural typing
class TemplateRepository(Protocol):
    """Repository protocol for templates."""

    def find_by_name(self, name: str) -> Template | None:
        """Find template by name."""
        ...

    def save(self, template: Template) -> None:
        """Save template."""
        ...

# Avoid - Missing return type
def process_data(items: list[dict]):
    ...

# Avoid - Using 'Any' unnecessarily
def transform(data: Any) -> Any:
    ...
```

### Modern Type Hints (Python 3.11+)

| Old (avoid) | New (use) |
|-------------|-----------|
| `List[str]` | `list[str]` |
| `Dict[str, int]` | `dict[str, int]` |
| `Tuple[int, ...]` | `tuple[int, ...]` |
| `Union[X, Y]` | `X \| Y` |
| `Optional[X]` | `X \| None` |

### MyPy Configuration

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

## Naming Conventions — Examples

**Modules and Packages**

```python
# Good
forge/domain/template.py
forge/infrastructure/file_system_repository.py

# Avoid
forge/domain/Template.py
forge/infrastructure/FileSystemRepo.py
```

**Classes**

```python
# Good
class TemplateRepository:
    """Repository for template entities."""
    ...

class FileSystemTemplateRepository(TemplateRepository):
    """File system implementation."""
    ...

# Avoid
class template_repository:  # Not PascalCase
class TemplateRepo:         # Unclear abbreviation
```

**Functions and Methods**

```python
# Good
def generate_project_from_template(template: Template, config: ProjectConfig) -> Project:
    """Generate project from template."""
    ...

def is_valid_template(template: Template) -> bool:
    """Check if template is valid."""
    ...

# Avoid
def genProj(t, c):      # Unclear abbreviations
def GenerateProject():  # Not snake_case
```

**Variables vs Constants**

```python
# Constants — SCREAMING_SNAKE_CASE
DEFAULT_TEMPLATE_DIR = Path(".claude/templates")
MAX_FILE_SIZE_MB = 10
API_VERSION = "1.0.0"

# Variables — snake_case
template_path = Path("/templates")
user_input = get_user_input()

# Private vs public
class TemplateProcessor:
    def __init__(self, config: ProcessorConfig) -> None:
        self.config = config           # Public attribute
        self._cache: dict[str, Template] = {}  # Private attribute

    def process(self, template: Template) -> ProcessedTemplate:
        """Public method."""
        return self._apply_transformations(template)

    def _apply_transformations(self, template: Template) -> ProcessedTemplate:
        """Private — internal implementation detail."""
        ...
```

---

## Error Handling

### Custom Exception Hierarchy

```python
# forge/domain/exceptions.py
class ForgeError(Exception):
    """Base exception for all Forge errors."""
    pass

class TemplateNotFoundError(ForgeError):
    """Template could not be found."""

    def __init__(self, template_name: str) -> None:
        self.template_name = template_name
        super().__init__(f"Template not found: {template_name}")

class TemplateValidationError(ForgeError):
    """Template failed validation."""

    def __init__(self, template_name: str, errors: list[str]) -> None:
        self.template_name = template_name
        self.errors = errors
        super().__init__(
            f"Template '{template_name}' validation failed:\n"
            + "\n".join(f"  - {e}" for e in errors)
        )

class ConfigurationError(ForgeError):
    """Invalid configuration."""
    pass
```

### Error Handling Patterns

**Specific exceptions + context preservation**

```python
# Good
def load_template(name: str) -> Template:
    try:
        path = self.template_dir / f"{name}.yaml"
        return Template.from_file(path)
    except FileNotFoundError as e:
        raise TemplateNotFoundError(name) from e
    except yaml.YAMLError as e:
        raise TemplateValidationError(name, [str(e)]) from e

# Avoid
def load_template(name: str) -> Template:
    try:
        ...
    except Exception as e:           # Too broad
        raise Exception(f"Failed: {e}")  # Context lost
```

**Resource cleanup**

```python
# Good — context manager
with open(file_path) as f:
    content = f.read()

# Good — explicit try/finally
lock = acquire_lock()
try:
    perform_operation()
finally:
    lock.release()

# Avoid — no cleanup
f = open(file_path)
content = f.read()  # File not closed on exception
```

**Graceful degradation + retry**

```python
# Return None when appropriate
def get_cached_template(name: str) -> Template | None:
    try:
        return self._cache[name]
    except KeyError:
        return None

# Exponential backoff retry
def save_with_retry(data: str, max_retries: int = 3) -> None:
    for attempt in range(max_retries):
        try:
            self._write_file(data)
            return
        except IOError:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)
```

---

## Testing Requirements

### Test Organization

```
tests/
├── unit/              # 70% of tests
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── integration/       # 20% of tests
│   └── workflows/
└── e2e/              # 10% of tests
    └── scenarios/
```

### Test Naming and Structure

```python
# Pattern: test_<method>_<scenario>_<expected>
def test_generate_files_with_valid_template_creates_files():
    ...

def test_load_template_with_missing_file_raises_error():
    ...

# AAA structure
def test_orchestrate_task_delegates_to_correct_agent():
    # Arrange
    orchestrator = Orchestrator(agent_pool)
    task = Task(
        description="Implement FastAPI endpoint",
        requirements=["api-design", "python"],
    )

    # Act
    result = orchestrator.orchestrate(task)

    # Assert
    assert result.assigned_agent == "backend-master"
    assert result.status == "delegated"
```

### Fixtures

```python
# conftest.py — shared fixtures
@pytest.fixture
def temp_project_dir(tmp_path: Path) -> Path:
    """Create temporary project directory with .claude structure."""
    claude_dir = tmp_path / ".claude"
    claude_dir.mkdir()
    (claude_dir / "templates").mkdir()
    (claude_dir / "skills").mkdir()
    return tmp_path

@pytest.fixture
def sample_template() -> Template:
    """Create sample template for testing."""
    return Template(
        name="fastapi-basic",
        version="1.0.0",
        description="Basic FastAPI template",
        files=[...],
        variables={...},
    )
```

### Mocking Strategy

```python
# Good — mock external dependencies
def test_generate_project_calls_file_system(mocker):
    mock_write = mocker.patch("pathlib.Path.write_text")
    generator = FileGenerator(project_dir)
    generator.generate(template, config)
    assert mock_write.call_count == 5

# Avoid — mocking internal logic
def test_process_template_internal(mocker):
    mocker.patch.object(processor, "_internal_method")  # Don't do this
```

### Pytest Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["*_test.py", "test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "-v",
    "--cov=forge",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--cov-fail-under=80",
]
```

---

## Documentation Standards

### Module Docstring

```python
"""File generation module.

This module provides functionality for generating project files from
templates using Jinja2 templating engine.

Example:
    generator = FileGenerator(project_root)
    files = generator.generate_from_spec(spec)
"""
```

### Class Docstring

```python
class FileGenerator:
    """Generate project files from templates.

    The FileGenerator processes Jinja2 templates and generates complete
    project structures based on specifications and configurations.

    Attributes:
        project_root: Root directory for file generation
        templates_dir: Directory containing Jinja2 templates
        generated_files: List of successfully generated files

    Example:
        >>> generator = FileGenerator(Path("/project"))
        >>> template = Template.load("fastapi-basic")
        >>> files = generator.generate(template, config)
        >>> print(f"Generated {len(files)} files")
    """
```

### Function/Method Docstring

```python
def generate_from_spec(
    self,
    spec: str,
    output_dir: Path | None = None,
    *,
    dry_run: bool = False,
) -> list[Path]:
    """Generate project files from specification.

    Parses the project specification, extracts configuration, and
    generates all required project files using templates.

    Args:
        spec: Project specification in markdown format
        output_dir: Target directory for generated files. Defaults to project_root
        dry_run: If True, validate but don't write files

    Returns:
        List of paths to generated files

    Raises:
        TemplateNotFoundError: If required template is missing
        TemplateValidationError: If template validation fails
        ConfigurationError: If spec contains invalid configuration

    Example:
        >>> spec = "# MyApp\\n**Type:** web-app\\n**Framework:** FastAPI"
        >>> files = generator.generate_from_spec(spec)
        >>> assert Path("README.md") in files
    """
```

### Comment Guidelines

```python
# Good — explain WHY
# Use binary search because dataset can exceed 10M items
result = binary_search(sorted_data, target)

# Workaround for Jinja2 bug #1234 — remove when fixed in v3.2
template.globals["workaround"] = True

# Avoid — states the obvious
# Increment counter
counter += 1

# TODO format
# TODO(username): Add caching layer to reduce file I/O
# FIXME(username): Race condition when multiple agents write simultaneously
```

---

## Code Complexity

### Cyclomatic Complexity — Refactoring Example

```python
# Before — complexity 12 (refactor needed)
def process_payment(payment_type, amount, user, ...):
    if payment_type == "credit_card":
        if amount > 1000:
            if user.verified:
                ...  # Many nested conditions
    elif payment_type == "paypal":
        ...

# After — complexity 3 each (Strategy pattern)
class PaymentProcessor(Protocol):
    def process(self, amount: float, user: User) -> PaymentResult:
        ...

class CreditCardProcessor(PaymentProcessor):
    def process(self, amount: float, user: User) -> PaymentResult:
        if not user.verified and amount > 1000:
            raise UnverifiedUserError()
        return self._process_credit_card(amount)
```

### Guard Clauses (reduce nesting depth)

```python
# Good — guard clauses (nesting: 1)
def validate_template(template: Template) -> ValidationResult:
    if not template.files:
        return ValidationResult.error("No files defined")
    if not template.variables:
        return ValidationResult.error("No variables defined")
    if not template.name:
        return ValidationResult.error("Name required")
    return ValidationResult.success()

# Avoid — deep nesting (nesting: 3)
def validate_template(template: Template) -> ValidationResult:
    if template.files:
        if template.variables:
            if template.name:
                return ValidationResult.success()
            else:
                return ValidationResult.error("Name required")
        else:
            return ValidationResult.error("No variables")
    else:
        return ValidationResult.error("No files")
```

### Ruff Configuration

```toml
# pyproject.toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "C90", # mccabe complexity
    "N",   # pep8-naming
    "UP",  # pyupgrade
    "B",   # flake8-bugbear
]

[tool.ruff.lint.mccabe]
max-complexity = 10
```

---

## Import Organization

```python
# Standard library
import json
import sys
from pathlib import Path
from typing import Any

# Third-party
import click
import yaml
from jinja2 import Environment, FileSystemLoader

# Local
from forge.domain.template import Template
from forge.application.use_cases import GenerateProjectUseCase
from forge.infrastructure.file_system_repository import FileSystemTemplateRepository
```

### Import Patterns

```python
# Good — explicit named imports
from forge.domain.template import Template, TemplateFile, VariableDefinition
from forge.domain.exceptions import TemplateNotFoundError

# Good — alias for clarity (long names only)
from forge.infrastructure.repository import FileSystemTemplateRepository as FSTemplateRepo

# Avoid — wildcard
from forge.domain import *

# Avoid — verbose module-path access
import forge.domain.template
template = forge.domain.template.Template()  # Too verbose

# TYPE_CHECKING guard (avoid circular imports)
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from forge.domain.template import Template

# Optional dependency pattern
try:
    import redis
except ImportError:
    redis = None

def get_cache():
    if redis is None:
        return InMemoryCache()
    return RedisCache()
```

---

## Security Patterns

### Input Validation + Path Traversal Prevention

```python
def load_template(name: str) -> Template:
    # Validate template name
    if not name.replace("-", "").replace("_", "").isalnum():
        raise ValueError(f"Invalid template name: {name}")

    template_path = self.templates_dir / f"{name}.yaml"

    # Prevent path traversal
    if not template_path.resolve().is_relative_to(self.templates_dir.resolve()):
        raise SecurityError(f"Template path outside templates directory: {name}")

    return Template.from_file(template_path)
```

### Secrets Management

```python
# Good — env var with validation
API_KEY = os.environ.get("FORGE_API_KEY")
if not API_KEY:
    raise ConfigurationError("FORGE_API_KEY environment variable required")

# Good — secrets service
from forge.infrastructure.secrets import get_secret
database_password = get_secret("database_password")

# NEVER
API_KEY = "sk-1234567890abcdef"  # Hardcoded secret
```

### Atomic File Writes

```python
def write_generated_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(f"{path.suffix}.tmp")
    try:
        temp_path.write_text(content, encoding="utf-8")
        temp_path.replace(path)  # Atomic on POSIX
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise
```

### Safe Subprocess Execution

```python
import subprocess
import shlex

def run_safe_command(command: str, cwd: Path) -> str:
    if not cwd.is_dir():
        raise ValueError(f"Invalid working directory: {cwd}")

    result = subprocess.run(
        shlex.split(command),  # List form — never shell=True
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=30,
        check=True,
    )
    return result.stdout

# NEVER
def run_command(command: str) -> str:
    return subprocess.check_output(command, shell=True)  # Shell injection
```

---

## Tools and Automation

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        args: [--line-length=100]

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: [--fix]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
```

### Development Commands

```bash
# Format
black --line-length 100 forge/ tests/

# Lint
ruff check forge/ tests/

# Type check
mypy forge/

# Test with coverage
pytest -v --cov=forge --cov-report=term-missing --cov-fail-under=80

# Full quality gate
make quality
```

### Makefile

```makefile
.PHONY: format lint type-check test quality

format:
	black --line-length 100 forge/ tests/

lint:
	ruff check forge/ tests/

type-check:
	mypy forge/

test:
	pytest -v --cov=forge --cov-report=term-missing --cov-fail-under=80

quality: format lint type-check test
	@echo "All quality checks passed"
```

---

## References

- [PEP 8 — Style Guide for Python Code](https://peps.python.org/pep-0008/)
- [Black Code Style](https://black.readthedocs.io/)
- [Ruff Linter](https://docs.astral.sh/ruff/)
- [MyPy Type Checking](https://mypy.readthedocs.io/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [Clean Architecture in Python](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)
