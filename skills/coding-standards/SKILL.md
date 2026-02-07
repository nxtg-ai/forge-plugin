---
name: Coding Standards
description: Enforces coding standards including naming conventions, file organization, and code style guidelines.
---

# NXTG-Forge Coding Standards

## Overview

This document defines the coding standards for the NXTG-Forge project. These standards ensure consistency, maintainability, and quality across the codebase.

## Table of Contents

1. [Python Style Guide](#python-style-guide)
2. [Code Formatting](#code-formatting)
3. [Type Hinting](#type-hinting)
4. [Naming Conventions](#naming-conventions)
5. [Error Handling](#error-handling)
6. [Testing Requirements](#testing-requirements)
7. [Documentation Standards](#documentation-standards)
8. [Code Complexity](#code-complexity)
9. [Import Organization](#import-organization)
10. [Security Considerations](#security-considerations)

---

## Python Style Guide

NXTG-Forge follows **PEP 8** as the baseline Python style guide, with specific extensions and clarifications documented below.

### Core Principles

1. **Readability counts**: Code is read far more often than it is written
2. **Explicit is better than implicit**: Clear intent over clever tricks
3. **Simple is better than complex**: Favor straightforward solutions
4. **Consistency matters**: Follow existing patterns in the codebase

### Key PEP 8 Requirements

- Maximum line length: **100 characters** (enforced by Black)
- Indentation: **4 spaces** (no tabs)
- Blank lines: 2 before top-level definitions, 1 before method definitions
- String quotes: Prefer **double quotes** `"` for consistency
- Trailing commas: Use for multi-line constructs

---

## Code Formatting

### Automated Formatting

All Python code **must** be formatted with Black:

```bash
black --line-length 100 forge/ tests/
```

### Black Configuration

```toml
# pyproject.toml
[tool.black]
line-length = 100
target-version = ['py311']
include = '\.pyi?$'
```

### Manual Formatting Guidelines

When Black doesn't enforce specific patterns:

**1. Vertical Alignment**

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

**2. Line Breaks**

```python
# Good - break before binary operators
total = (
    first_value
    + second_value
    + third_value
)

# Avoid - break after
total = (first_value +
         second_value +
         third_value)
```

**3. Comprehensions**

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

## Type Hinting

### Requirements

Type hints are **mandatory** for:

- All public functions and methods
- All class attributes
- All function parameters
- All return values

Type hints are **optional** for:

- Private methods (but encouraged)
- Local variables (unless improving clarity)
- Simple lambdas

### Type Hint Style

```python
from typing import Any, Protocol
from pathlib import Path
from collections.abc import Callable, Iterable, Mapping

# Good - Complete type hints
def generate_files(
    template_path: Path,
    config: dict[str, Any],
    output_dir: Path,
    *,
    dry_run: bool = False,
) -> list[Path]:
    """Generate files from template."""
    ...

# Good - Dataclass with types
@dataclass(frozen=True)
class Template:
    """Template definition."""
    name: str
    version: str
    files: list[TemplateFile]
    variables: dict[str, VariableDefinition]
    metadata: dict[str, Any]

# Good - Protocol for structural typing
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

Use modern syntax:

- `list[str]` instead of `List[str]`
- `dict[str, int]` instead of `Dict[str, int]`
- `tuple[int, ...]` instead of `Tuple[int, ...]`
- `X | Y` instead of `Union[X, Y]`
- `X | None` instead of `Optional[X]`

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

## Naming Conventions

### General Rules

| Element | Convention | Example |
|---------|-----------|---------|
| Modules | `snake_case` | `file_generator.py` |
| Packages | `snake_case` | `forge/domain/` |
| Classes | `PascalCase` | `FileGenerator` |
| Functions | `snake_case` | `generate_files()` |
| Methods | `snake_case` | `save_template()` |
| Variables | `snake_case` | `template_path` |
| Constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_TIMEOUT` |
| Private | `_leading_underscore` | `_internal_method()` |
| Type Variables | `PascalCase` with `T` prefix | `TEntity` |

### Detailed Guidelines

**1. Modules and Packages**

```python
# Good
forge/domain/template.py
forge/infrastructure/file_system_repository.py

# Avoid
forge/domain/Template.py
forge/infrastructure/FileSystemRepo.py
```

**2. Classes**

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
class TemplateRepo:  # Unclear abbreviation
```

**3. Functions and Methods**

```python
# Good
def generate_project_from_template(template: Template, config: ProjectConfig) -> Project:
    """Generate project from template."""
    ...

def is_valid_template(template: Template) -> bool:
    """Check if template is valid."""
    ...

# Avoid
def genProj(t, c):  # Unclear abbreviations
def GenerateProject():  # Not snake_case
```

**4. Variables**

```python
# Good
template_path = Path("/templates")
user_input = get_user_input()
max_retries = 3

# Avoid
tp = Path("/templates")  # Unclear
templatePath = get_input()  # Not snake_case
MAX_RETRIES = 3  # Should be constant
```

**5. Constants**

```python
# Good
DEFAULT_TEMPLATE_DIR = Path(".claude/templates")
MAX_FILE_SIZE_MB = 10
API_VERSION = "1.0.0"

# Avoid
default_dir = Path(".claude/templates")  # Not constant style
maxFileSize = 10  # Not constant style
```

**6. Private vs Public**

```python
class TemplateProcessor:
    """Process templates."""

    def __init__(self, config: ProcessorConfig) -> None:
        """Initialize processor."""
        self.config = config  # Public attribute
        self._cache: dict[str, Template] = {}  # Private attribute

    def process(self, template: Template) -> ProcessedTemplate:
        """Public method."""
        return self._apply_transformations(template)

    def _apply_transformations(self, template: Template) -> ProcessedTemplate:
        """Private method - internal implementation detail."""
        ...
```

---

## Error Handling

### Custom Exceptions

Define domain-specific exceptions in the domain layer:

```python
# forge/domain/exceptions.py
class ForgeError(Exception):
    """Base exception for all Forge errors."""
    pass

class TemplateNotFoundError(ForgeError):
    """Template could not be found."""

    def __init__(self, template_name: str) -> None:
        """Initialize error."""
        self.template_name = template_name
        super().__init__(f"Template not found: {template_name}")

class TemplateValidationError(ForgeError):
    """Template failed validation."""

    def __init__(self, template_name: str, errors: list[str]) -> None:
        """Initialize error."""
        self.template_name = template_name
        self.errors = errors
        super().__init__(
            f"Template '{template_name}' validation failed:\n" + "\n".join(f"  - {e}" for e in errors)
        )

class ConfigurationError(ForgeError):
    """Invalid configuration."""
    pass
```

### Error Handling Patterns

**1. Specific Exception Types**

```python
# Good - Specific exceptions
def load_template(name: str) -> Template:
    """Load template by name."""
    try:
        path = self.template_dir / f"{name}.yaml"
        return Template.from_file(path)
    except FileNotFoundError as e:
        raise TemplateNotFoundError(name) from e
    except yaml.YAMLError as e:
        raise TemplateValidationError(name, [str(e)]) from e

# Avoid - Generic exceptions
def load_template(name: str) -> Template:
    try:
        ...
    except Exception as e:  # Too broad
        raise Exception(f"Failed: {e}")
```

**2. Context Preservation**

```python
# Good - Preserve context with 'from'
try:
    result = external_api_call()
except ConnectionError as e:
    raise AgentConnectionError("Failed to connect to agent") from e

# Avoid - Losing context
try:
    result = external_api_call()
except ConnectionError:
    raise AgentConnectionError("Failed")  # Original error lost
```

**3. Resource Cleanup**

```python
# Good - Context manager for cleanup
with open(file_path) as f:
    content = f.read()

# Good - Explicit try/finally when needed
lock = acquire_lock()
try:
    perform_operation()
finally:
    lock.release()

# Avoid - No cleanup
f = open(file_path)
content = f.read()
# File not closed if exception occurs
```

**4. Error Recovery**

```python
# Good - Graceful degradation
def get_cached_template(name: str) -> Template | None:
    """Get template from cache, return None if not found."""
    try:
        return self._cache[name]
    except KeyError:
        return None

# Good - Retry logic
def save_with_retry(data: str, max_retries: int = 3) -> None:
    """Save data with retry logic."""
    for attempt in range(max_retries):
        try:
            self._write_file(data)
            return
        except IOError as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff
```

---

## Testing Requirements

### Coverage Requirements

- **Minimum coverage**: 80% (enforced by CI)
- **Target coverage**: 86%
- **Critical paths**: 100% coverage required

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

### Test Naming

```python
# Pattern: test_<method>_<scenario>_<expected>
def test_generate_files_with_valid_template_creates_files():
    """Test file generation with valid template."""
    ...

def test_load_template_with_missing_file_raises_error():
    """Test loading missing template raises TemplateNotFoundError."""
    ...

def test_validate_template_with_invalid_vars_returns_errors():
    """Test validation returns errors for invalid variables."""
    ...
```

### Test Structure (AAA Pattern)

```python
def test_orchestrate_task_delegates_to_correct_agent():
    """Test orchestrator delegates task to correct agent."""
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

### Fixture Guidelines

```python
# conftest.py - Shared fixtures
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
# Good - Mock external dependencies
def test_generate_project_calls_file_system(mocker):
    """Test project generation interacts with file system."""
    mock_write = mocker.patch("pathlib.Path.write_text")

    generator = FileGenerator(project_dir)
    generator.generate(template, config)

    assert mock_write.call_count == 5

# Avoid - Mocking internal logic
def test_process_template_internal_method(mocker):
    """DON'T mock internal methods - test behavior, not implementation."""
    mocker.patch.object(processor, "_internal_method")  # Avoid this
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

### Docstring Style

Use **Google-style docstrings** for all public modules, classes, and functions.

**Module Docstring**

```python
"""File generation module.

This module provides functionality for generating project files from
templates using Jinja2 templating engine.

Example:
    generator = FileGenerator(project_root)
    files = generator.generate_from_spec(spec)
"""
```

**Class Docstring**

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

**Function/Method Docstring**

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

**1. When to Comment**

```python
# Good - Explain WHY, not WHAT
# Use binary search because dataset can exceed 10M items
result = binary_search(sorted_data, target)

# Workaround for Jinja2 bug #1234 - remove when fixed in v3.2
template.globals["workaround"] = True

# Avoid - Obvious comments
# Increment counter
counter += 1

# Create empty list
items = []
```

**2. TODO Comments**

```python
# TODO(username): Brief description of what needs to be done
# TODO(alice): Add caching layer to reduce file I/O
# TODO(bob): Replace with async implementation in v0.4.0
# FIXME(charlie): Race condition when multiple agents write simultaneously
```

**3. Section Comments**

```python
class ComplexProcessor:
    """Process complex data."""

    # ===================================================================
    # Public API
    # ===================================================================

    def process(self, data: Data) -> Result:
        """Process data."""
        ...

    # ===================================================================
    # Internal Implementation
    # ===================================================================

    def _validate(self, data: Data) -> bool:
        """Validate data."""
        ...
```

---

## Code Complexity

### Cyclomatic Complexity

- **Maximum per function**: 10
- **Target**: ≤ 5
- **Enforced by**: Ruff (McCabe complexity checker)

```python
# Good - Low complexity (3)
def calculate_discount(price: float, customer_tier: str) -> float:
    """Calculate discount based on customer tier."""
    if customer_tier == "gold":
        return price * 0.8
    elif customer_tier == "silver":
        return price * 0.9
    else:
        return price

# Refactor - High complexity (reduce with strategy pattern)
# Before (complexity 12)
def process_payment(payment_type, amount, ...):
    if payment_type == "credit_card":
        if amount > 1000:
            if user.verified:
                ...  # Many nested conditions
    elif payment_type == "paypal":
        ...

# After (complexity 3 each)
class PaymentProcessor(Protocol):
    def process(self, amount: float, user: User) -> PaymentResult:
        ...

class CreditCardProcessor(PaymentProcessor):
    def process(self, amount: float, user: User) -> PaymentResult:
        if not user.verified and amount > 1000:
            raise UnverifiedUserError()
        return self._process_credit_card(amount)
```

### Function Length

- **Maximum lines**: 25
- **Target**: ≤ 15
- **If longer**: Decompose into helper functions

```python
# Good - Focused function (12 lines)
def generate_project_structure(config: ProjectConfig, output_dir: Path) -> list[Path]:
    """Generate project directory structure."""
    created_dirs = []

    for dir_spec in config.directories:
        dir_path = output_dir / dir_spec.path
        dir_path.mkdir(parents=True, exist_ok=True)
        created_dirs.append(dir_path)

        if dir_spec.add_init:
            (dir_path / "__init__.py").touch()

    return created_dirs
```

### Nesting Depth

- **Maximum nesting**: 3 levels
- **Prefer**: Early returns, guard clauses

```python
# Good - Guard clauses (nesting: 1)
def validate_template(template: Template) -> ValidationResult:
    """Validate template."""
    if not template.files:
        return ValidationResult.error("No files defined")

    if not template.variables:
        return ValidationResult.error("No variables defined")

    if not template.name:
        return ValidationResult.error("Name required")

    return ValidationResult.success()

# Avoid - Deep nesting (nesting: 3)
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

### Import Order

1. Standard library imports
2. Third-party imports
3. Local application imports

**Blank lines**: One blank line between each group

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

### Import Style

```python
# Good - Explicit imports
from forge.domain.template import Template, TemplateFile, VariableDefinition
from forge.domain.exceptions import TemplateNotFoundError

# Good - Aliasing for clarity
from forge.infrastructure.repository import FileSystemTemplateRepository as FSTemplateRepo

# Avoid - Wildcard imports
from forge.domain import *

# Avoid - Importing entire modules when specific names suffice
import forge.domain.template
template = forge.domain.template.Template()  # Too verbose
```

### Conditional Imports

```python
# Good - Type checking imports
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from forge.domain.template import Template  # Avoid circular imports

# Good - Optional dependencies
try:
    import redis
except ImportError:
    redis = None

def get_cache():
    """Get cache backend."""
    if redis is None:
        return InMemoryCache()
    return RedisCache()
```

---

## Security Considerations

### Input Validation

```python
# Good - Validate and sanitize
def load_template(name: str) -> Template:
    """Load template by name."""
    # Validate template name (prevent path traversal)
    if not name.replace("-", "").replace("_", "").isalnum():
        raise ValueError(f"Invalid template name: {name}")

    template_path = self.templates_dir / f"{name}.yaml"

    # Ensure path is within templates directory
    if not template_path.resolve().is_relative_to(self.templates_dir.resolve()):
        raise SecurityError(f"Template path outside templates directory: {name}")

    return Template.from_file(template_path)
```

### Secrets Management

```python
# Good - Never hardcode secrets
API_KEY = os.environ.get("FORGE_API_KEY")
if not API_KEY:
    raise ConfigurationError("FORGE_API_KEY environment variable required")

# Good - Use dedicated secrets management
from forge.infrastructure.secrets import get_secret

database_password = get_secret("database_password")

# Avoid - Hardcoded secrets
API_KEY = "sk-1234567890abcdef"  # NEVER DO THIS
```

### File Operations

```python
# Good - Safe file operations
def write_generated_file(path: Path, content: str) -> None:
    """Write generated file with safety checks."""
    # Ensure parent directory exists
    path.parent.mkdir(parents=True, exist_ok=True)

    # Use atomic write
    temp_path = path.with_suffix(f"{path.suffix}.tmp")
    try:
        temp_path.write_text(content, encoding="utf-8")
        temp_path.replace(path)
    except Exception:
        temp_path.unlink(missing_ok=True)
        raise

# Avoid - Unsafe operations
def write_file(path: str, content: str) -> None:
    """Unsafe file write."""
    open(path, "w").write(content)  # No error handling, encoding issues
```

### Command Execution

```python
# Good - Safe subprocess execution
import subprocess
import shlex

def run_safe_command(command: str, cwd: Path) -> str:
    """Run command safely."""
    # Validate working directory
    if not cwd.is_dir():
        raise ValueError(f"Invalid working directory: {cwd}")

    # Use list form, not shell=True
    result = subprocess.run(
        shlex.split(command),
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=30,
        check=True,
    )
    return result.stdout

# Avoid - Shell injection vulnerability
def run_command(command: str) -> str:
    return subprocess.check_output(command, shell=True)  # DANGEROUS
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
# Format code
black --line-length 100 forge/ tests/

# Lint code
ruff check forge/ tests/

# Type check
mypy forge/

# Run tests with coverage
pytest -v --cov=forge --cov-report=term-missing --cov-fail-under=80

# Full quality check (runs all tools)
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
 @echo "✓ All quality checks passed"
```

---

## Code Review Checklist

Before submitting code for review, ensure:

- [ ] Code follows PEP 8 and NXTG-Forge extensions
- [ ] All functions have type hints
- [ ] All public APIs have Google-style docstrings
- [ ] Tests added/updated (coverage ≥ 80%)
- [ ] No functions exceed complexity 10
- [ ] No functions exceed 25 lines
- [ ] Imports properly organized (stdlib, third-party, local)
- [ ] No hardcoded secrets or credentials
- [ ] Error handling includes specific exception types
- [ ] Black formatting applied
- [ ] Ruff linting passes
- [ ] MyPy type checking passes
- [ ] All tests pass locally

---

## References

- [PEP 8 -- Style Guide for Python Code](https://peps.python.org/pep-0008/)
- [Black Code Style](https://black.readthedocs.io/)
- [Ruff Linter](https://docs.astral.sh/ruff/)
- [MyPy Type Checking](https://mypy.readthedocs.io/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [Clean Architecture in Python](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)

---

**Last Updated**: 2026-01-06
**Version**: 1.0.0
**Maintainer**: NXTG-Forge Team
