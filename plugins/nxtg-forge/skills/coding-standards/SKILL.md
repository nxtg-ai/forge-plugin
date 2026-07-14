---
name: Coding Standards
description: >
  NXTG-Forge Python coding standards — naming conventions, quality gates
  (complexity/length/coverage), Black/Ruff/MyPy config, type hints, error
  handling, pytest layout, Google docstrings, import order, and security
  patterns. Use when writing or reviewing Python code, answering "what's our
  convention for X", enforcing type hints or docstrings, running the pre-PR
  review checklist, or configuring black/ruff/mypy/pytest for a Forge Python
  module. For deep per-pattern examples and tool configs see python.md.
when_to_use: >
  Explicit invocation only (auto-invoke disabled). Reach for it on "check my
  Python against our standards", "add type hints / docstrings", "is this
  idiomatic", "review before PR", "what's the max complexity / line length",
  "how do we handle errors / path traversal", "set up black/ruff/mypy".
allowed-tools: Read, Grep, Glob
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

## Gotchas

Real, non-obvious failure modes when enforcing these standards:

- **`is_relative_to` does NOT stop symlink traversal.** The security rule
  (`is_relative_to(allowed_root)`) passes for a path that *looks* nested but is
  a symlink pointing outside the root. You MUST `.resolve()` both the candidate
  and the root first, then compare — otherwise an attacker-planted symlink
  escapes the sandbox. `is_relative_to` also requires Python 3.9+.
- **Atomic write breaks across filesystems.** `write .tmp then Path.replace()`
  is atomic only on the *same* filesystem. Writing the temp file under `/tmp`
  and replacing to a project mount raises `OSError: Invalid cross-device link`.
  Create the `.tmp` in the destination directory, not a global temp dir.
- **`raise ... from e` vs `from None`.** The standard mandates context
  preservation. Bare `raise SpecificError(...)` inside an `except` block still
  implicitly chains, but re-raising after catching-and-transforming without
  `from e` (or explicitly `from None`) muddies tracebacks. Always be explicit.
- **`Protocol` + `isinstance` needs `@runtime_checkable`.** Using a `Protocol`
  for structural typing is fine for MyPy, but `isinstance(obj, MyProtocol)`
  raises `TypeError` unless the Protocol is decorated `@runtime_checkable` —
  and even then it only checks method *names*, not signatures.
- **`--cov-fail-under=80` hides uncovered critical modules.** Total line
  coverage ≥80% can pass while a critical-path module sits at 0%. The "100% on
  critical paths" rule is NOT enforced by the aggregate gate — check per-file
  coverage, don't trust the single pass/fail number.
- **Don't run Black AND the Ruff formatter both.** Ruff ships a formatter that
  overlaps Black. Pick one formatter (Black here) and use Ruff only as the
  linter (`ruff check`), or they fight over the same constructs in CI.
- **`TYPE_CHECKING` imports fail at runtime if annotations are evaluated.**
  Imports behind `if TYPE_CHECKING:` don't exist at runtime. Referencing them
  in a non-annotation context (or without `from __future__ import annotations`
  / quoted string annotations) raises `NameError`.

---

## Worked Example — safe path handling

Request: "validate a user-supplied output path stays inside the project."

```python
# WRONG — symlink under project_root escapes; also no resolve()
def write_output(project_root: Path, user_path: Path) -> None:
    if user_path.is_relative_to(project_root):   # passes for a symlink!
        user_path.write_text(data)

# RIGHT — resolve both, then compare, then atomic write in-place
def write_output(project_root: Path, user_path: Path, data: str) -> None:
    root = project_root.resolve()
    target = (root / user_path).resolve()
    if not target.is_relative_to(root):
        raise PathTraversalError(f"{target} escapes {root}")
    tmp = target.with_suffix(target.suffix + ".tmp")  # same dir = same FS
    tmp.write_text(data)
    tmp.replace(target)                                # atomic on same FS
```

Applies: security path-traversal rule + the resolve/symlink and same-filesystem
gotchas above, plus the `PathTraversalError` domain exception pattern.

---

## Language Reference Files

Detailed code examples, tool configurations, and per-pattern deep dives:

| File | Content |
|------|---------|
| [`python.md`](./python.md) | Black config, type hint patterns, error handling examples, pytest fixtures + mocking, Google docstring templates, import patterns, security patterns, Ruff/MyPy `pyproject.toml` config, pre-commit hooks, Makefile |

---

**Version**: 1.0.0 | **Last Updated**: 2026-01-06 | **Maintainer**: NXTG-Forge Team
