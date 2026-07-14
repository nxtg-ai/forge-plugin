---
name: Coding Standards
description: Enforces coding standards including naming conventions, file organization, and code style guidelines. For per-language detail see the Language Reference Files section.
disable-model-invocation: true
---

# NXTG-Forge Coding Standards

## Core Principles (Universal)

1. **Readability counts** — code is read far more than written
2. **Explicit over implicit** — clear intent over clever tricks
3. **Simple over complex** — favor straightforward solutions
4. **Consistency matters** — follow existing patterns in the codebase

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Python modules | `snake_case` | `file_generator.py` |
| Packages | `snake_case` | `forge/domain/` |
| Classes | `PascalCase` | `FileGenerator` |
| Functions/Methods | `snake_case` | `generate_files()` |
| Variables | `snake_case` | `template_path` |
| Constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_TIMEOUT` |
| Private members | `_leading_underscore` | `_internal_method()` |
| Type Variables | `PascalCase` + `T` prefix | `TEntity` |

Rules:
- No abbreviations that obscure intent (`tp` → `template_path`, `genProj` → `generate_project`)
- No camelCase in Python (reserved for JS/TS)
- Boolean functions: `is_`, `has_`, `can_` prefix (`is_valid_template`)
- No `TemplateRepo` abbreviations — spell it out

---

## Quality Gates (Enforced by CI)

| Metric | Maximum | Target | Tool |
|--------|---------|--------|------|
| Cyclomatic complexity | 10 | ≤5 | Ruff/McCabe |
| Function length (lines) | 25 | ≤15 | Manual |
| Nesting depth | 3 | ≤2 | Manual |
| Test coverage | ≥80% | 86% | pytest-cov |
| Line length (Python) | 100 chars | — | Black |

---

## Standards Summary

### Code Formatting
- **Black** enforces all Python formatting: `black --line-length 100 forge/ tests/`
- Line length: 100 chars (`pyproject.toml` `[tool.black]` section)
- Indentation: 4 spaces, no tabs
- Trailing commas on all multi-line constructs
- Break **before** binary operators (not after)
- Comprehensions: single line for simple, multiline for complex (`if` + transform)

### Type Hints
- **Mandatory** for: all public functions, methods, class attributes, parameters, return values
- **Optional** for: private methods (encouraged), local variables (unless clarifying), simple lambdas
- Modern Python 3.11+ syntax only:
  - `list[str]` not `List[str]`
  - `dict[str, int]` not `Dict[str, int]`
  - `X | Y` not `Union[X, Y]`
  - `X | None` not `Optional[X]`
- MyPy strict mode: `strict = true` in `pyproject.toml`
- Use `Protocol` for structural typing over concrete base classes

### Error Handling
- Define domain exceptions in `forge/domain/exceptions.py` inheriting from `ForgeError`
- Always catch specific exceptions — never bare `except Exception`
- Always preserve context: `raise SpecificError(...) from original_exception`
- Use context managers (`with`) for all resource cleanup
- Retry transient failures with exponential backoff (`2 ** attempt`)
- Graceful degradation: return `None` (typed) rather than swallowing exceptions silently

### Testing (pytest)
- Coverage: ≥80% minimum, 86% target, 100% on critical paths
- Test layout: `unit/` (70%), `integration/` (20%), `e2e/` (10%)
- Naming pattern: `test_<method>_<scenario>_<expected_outcome>`
- Structure: **AAA** — Arrange / Act / Assert (one block each, comments required)
- Mock **external** dependencies only — never mock internal logic or private methods
- Shared fixtures in `conftest.py`; fixture scope as narrow as possible

### Documentation (Google-style Docstrings)
- **Required** for all public modules, classes, and functions
- Sections: `Args`, `Returns`, `Raises`, `Example` (in that order)
- Comments explain **WHY**, not what the code does
- TODO format: `# TODO(username): brief description`
- Section dividers inside large classes: `# === Public API ===`

### Import Organization
Order within each file: **(1) stdlib → (2) third-party → (3) local**. One blank line between groups.

- Explicit named imports only — wildcard (`from x import *`) is banned
- Use `TYPE_CHECKING` guard for imports needed only to resolve type annotations
- Optional dependencies: wrap in `try/except ImportError`, default to local fallback

### Security
- Validate and sanitize **all** user-supplied input before use
- Prevent path traversal: resolve paths and verify `is_relative_to(allowed_root)`
- Never hardcode secrets — use env vars or `forge.infrastructure.secrets.get_secret()`
- Subprocess: always `shlex.split(cmd)` + `shell=False` — never `shell=True`
- File writes: write to `.tmp` then `Path.replace()` for atomicity

---

## Code Review Checklist

- [ ] Code follows PEP 8 and NXTG-Forge extensions (Black + Ruff pass)
- [ ] All public functions/methods/class attributes have type hints
- [ ] All public APIs have Google-style docstrings (Args / Returns / Raises)
- [ ] Tests added or updated — coverage ≥ 80%
- [ ] No function exceeds complexity 10 or 25 lines
- [ ] Nesting depth ≤ 3 (prefer guard clauses / early returns)
- [ ] Imports organized: stdlib → third-party → local, one blank line between groups
- [ ] No hardcoded secrets or credentials anywhere
- [ ] Error handling uses specific exception types with `from e` context preservation
- [ ] `black --line-length 100 forge/ tests/` passes
- [ ] `ruff check forge/ tests/` passes
- [ ] `mypy forge/` passes (strict)
- [ ] All tests pass: `pytest -v --cov=forge --cov-fail-under=80`

---

## Language Reference Files

Detailed code examples, tool configurations, and per-pattern deep dives:

| File | Content |
|------|---------|
| [`python.md`](./python.md) | Black config, type hint patterns, error handling examples, pytest fixtures + mocking, Google docstring templates, import patterns, security patterns, Ruff/MyPy `pyproject.toml` config, pre-commit hooks, Makefile |

---

**Version**: 1.0.0 | **Last Updated**: 2026-01-06 | **Maintainer**: NXTG-Forge Team
