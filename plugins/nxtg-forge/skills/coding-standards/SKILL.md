---
name: Coding Standards
description: >
  Cross-language coding conventions — naming, type safety, error handling, async,
  imports, SQL formatting, git commit format, complexity/size limits, security, and
  a pre-PR review checklist for Python, TypeScript/JavaScript, Rust, and Go. Use when
  writing or reviewing code, setting a project's style baseline, answering "what's the
  convention for X", enforcing types/docstrings, formatting a SQL query or commit
  message, or running the pre-PR checklist. Language deep dives and tool configs live
  in reference/.
when_to_use: >
  Explicit invocation only (auto-invoke disabled). Reach for it on "check my code
  against our standards", "how should I name this", "add type hints / types", "is this
  idiomatic Python/TS/Rust/Go", "what commit format do we use", "format this SQL",
  "review before PR", "what's the max complexity / file size", "how do we handle errors
  / secrets / path traversal", "set up the formatter/linter/type-checker".
allowed-tools: Read, Grep, Glob
disable-model-invocation: true
---

# Coding Standards

A language-agnostic baseline for consistent, readable, secure code. This skill ships
inside a plugin you install in *your own* project — Python, TypeScript/JavaScript,
Rust, Go, or anything else. Apply the principles universally; use the language section
that matches the file at hand. The numeric thresholds here are **recommended defaults**
— tune them to your project and enforce them with your own linter/CI, not from memory.

## Core Principles (Universal)

1. **Readability counts** — code is read far more often than written.
2. **Explicit over implicit** — clear intent beats clever tricks.
3. **Simple over complex** — favor the straightforward solution.
4. **Consistency matters** — follow the existing patterns in the codebase you're in.
5. **Single responsibility** — one module/class/function does one thing well.

---

## Naming Conventions (by language)

| Element | Python | TypeScript/JS | Rust | Go |
|---------|--------|---------------|------|-----|
| Files/modules | `snake_case.py` | `kebab-case.ts` / `camelCase.ts` | `snake_case.rs` | `snake_case.go` |
| Types/Classes | `PascalCase` | `PascalCase` | `PascalCase` | `PascalCase` |
| Functions | `snake_case` | `camelCase` | `snake_case` | `camelCase` (unexported) / `PascalCase` (exported) |
| Variables | `snake_case` | `camelCase` | `snake_case` | `camelCase` |
| Constants | `SCREAMING_SNAKE_CASE` | `SCREAMING_SNAKE_CASE` | `SCREAMING_SNAKE_CASE` | `PascalCase` / `camelCase` |
| Private/internal | `_leading_underscore` | `#private` field / `_prefix` | module-private (no `pub`) | lowercase first letter |

Universal rules:
- **No intent-obscuring abbreviations**: `tp` → `template_path`, `genProj` → `generate_project`, `usrRepo` → `user_repository`.
- **Boolean names read as predicates**: `is_valid`, `has_access`, `can_retry`.
- **In Go, exported vs unexported is the capitalization of the first letter** — this is the language's access control, not a convention you can opt out of.
- **Don't fight the ecosystem**: `camelCase` in Python or `snake_case` in TS/JS reads as a mistake to every reviewer.

---

## Type Safety

Prefer statically-typed code and full signatures on anything public.

**Python** — type hints on all public functions; modern builtin generics (3.9+):

```python
# GOOD — full hints, modern syntax
def process_items(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

# AVOID — no hints, or legacy typing.List/Dict on a 3.9+ target
def process_items(items):
    ...
```
Use `X | None` over `Optional[X]`, `X | Y` over `Union`, `Protocol` for structural
typing, and run a type checker in strict mode.

**TypeScript over JavaScript** — always. Types are the point:

```typescript
// GOOD
interface User { id: number; email: string; createdAt: Date; }
async function createUser(email: string, password: string): Promise<User> { /* ... */ }

// AVOID — untyped JS, `any` everywhere
async function createUser(email, password) { /* no safety */ }
```
Enable `strict: true` in `tsconfig.json`; avoid `any` (reach for `unknown` + narrowing).

**Rust / Go** — the compiler enforces types; the discipline is *modeling* well: make
illegal states unrepresentable (Rust enums / Go typed constants), return errors as
values (`Result<T, E>` / `(T, error)`), and avoid `unwrap()`/ignored errors outside
tests and `main`.

---

## Error Handling

Catch/return **specific** errors, preserve context, and clean up resources.

```python
# Python — specific exceptions, context preserved, logged
def find_user(user_id: int) -> User:
    try:
        user = repo.find_by_id(user_id)
        if user is None:
            raise UserNotFoundError(f"User {user_id} not found")
        return user
    except DatabaseConnectionError as e:
        logger.error("DB error finding user %s: %s", user_id, e)
        raise ServiceUnavailableError() from e   # chain, don't swallow
```
- Never bare `except:` / `except Exception` that returns `None` and hides the failure.
- Always `raise NewError(...) from original` to keep the traceback chain.
- Use context managers (`with`) / `try/finally` / RAII for cleanup.

```typescript
// TypeScript — narrow the caught value, rethrow with context
try {
  return await repo.findById(id);
} catch (err) {
  logger.error(`find user ${id} failed`, err);
  throw new ServiceError("lookup failed", { cause: err });  // cause preserves chain
}
```

```rust
// Rust — propagate with `?`, wrap with context (anyhow/thiserror)
fn find_user(id: u64) -> Result<User, AppError> {
    let user = repo.find_by_id(id)?;            // early-return on Err
    user.ok_or(AppError::NotFound(id))
}
```

```go
// Go — wrap with %w so errors.Is / errors.As still work up the stack
user, err := repo.FindByID(id)
if err != nil {
    return nil, fmt.Errorf("find user %d: %w", id, err)
}
```

Retry only *transient* failures, with exponential backoff (`2 ** attempt`). Degrade
gracefully — return a typed empty/`None`/`nil` result rather than silently swallowing.

---

## Concurrency & Async

Run independent I/O concurrently; don't serialize awaits that have no data dependency.

```python
# GOOD — concurrent
user, posts, comments = await asyncio.gather(
    user_repo.find_by_id(uid), post_repo.by_user(uid), comment_repo.by_user(uid)
)
# AVOID — three sequential round-trips
user = await user_repo.find_by_id(uid)
posts = await post_repo.by_user(uid)
comments = await comment_repo.by_user(uid)
```
TS: `Promise.all([...])`. Go: goroutines + `errgroup`/`WaitGroup`. Rust: `tokio::join!`
/ `futures::try_join!`. See the `asyncio.gather` cancellation caveat in **## Gotchas**.

---

## Imports & Module Organization

Group imports **stdlib → third-party → local**, one blank line between groups; explicit
named imports only (wildcard imports are banned). Use lazy/type-only imports to break
cycles (Python `if TYPE_CHECKING:` + `from __future__ import annotations`; TS
`import type { ... }`). Wrap genuinely optional dependencies in `try/except ImportError`
(or dynamic import) with a local fallback.

---

## SQL

```sql
-- GOOD — formatted, every non-aggregate column in GROUP BY
SELECT u.id, u.email, COUNT(p.id) AS post_count
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
WHERE u.is_active = true
GROUP BY u.id, u.email
ORDER BY post_count DESC
LIMIT 100;

-- Index foreign keys and hot filter columns; use UNIQUE for natural keys
CREATE UNIQUE INDEX idx_users_email ON users (email);
CREATE INDEX idx_posts_user_id ON posts (user_id);
```
Never build queries with string concatenation of user input — use parameterized
queries / an ORM. See the `GROUP BY` and UNIQUE-index traps in **## Gotchas**.

---

## Git Commit Messages

```
<type>(<scope>): <subject>

<body — what & why, wrapped ~72 cols>

<footer — Closes #123, BREAKING CHANGE: ...>
```
Types: `feat` (minor bump), `fix` (patch), `docs`, `style`, `refactor`, `test`,
`chore`, `perf`, `build`, `ci`. Subject is imperative and ≤ ~50 chars.

```
# GOOD
feat(auth): add JWT refresh token endpoint

- implement refresh use-case + POST /auth/refresh
- add integration tests

Closes #123

# BAD
update stuff
```

---

## Complexity & Size Limits (recommended defaults)

| Metric | Suggested max | Aim for |
|--------|---------------|---------|
| Cyclomatic complexity / function | 10 | ≤ 5 |
| Function length (lines) | 50 | ≤ 20 |
| Nesting depth | 3 | ≤ 2 |
| File length (lines) | 500 | — |
| Line length | 100 (Py) · 80–100 (JS/TS) · rustfmt/gofmt defaults | — |

Reduce nesting with **guard clauses / early returns** instead of deep `if/else`
pyramids. These are smells to refactor, not hard gates — enforce the ones you care
about via your own linter (Ruff `C90`, ESLint `complexity`, clippy, `gocyclo`).

---

## Documentation & Comments

- Public modules/classes/functions get a doc comment (Google-style docstrings in
  Python; JSDoc/TSDoc; `///` doc comments in Rust; `//` above exported names in Go).
- Comments explain **WHY**, never restate WHAT the code obviously does.
- Delete commented-out code — that's what version control is for.
- `# TODO(username): ...` / `// TODO(username): ...` so ownership is traceable.

```python
# GOOD — explains a non-obvious decision
# Exponential backoff avoids hammering the API during an outage
await retry_with_backoff(api_call)

# BAD — states the obvious
counter += 1  # increment counter
```

---

## Security (universal)

- **Validate & sanitize all external input** before use.
- **Never hardcode secrets** — read from environment / a secrets manager; keep them out
  of source and logs.
- **Path traversal**: `resolve()` the candidate *and* the allowed root, then verify
  containment (see worked example + symlink gotcha below).
- **Subprocess**: pass an argument list, never `shell=True` / string interpolation into
  a shell.
- **SQL**: parameterized queries only.
- **Passwords**: hash with bcrypt/argon2 — never store plaintext.
- **Atomic writes**: write to a temp file *in the destination directory*, then rename.

---

## Worked Example — safe path handling

Request: "validate a user-supplied output path stays inside the project root."

```python
# WRONG — a symlink under root escapes; also no resolve()
def write_output(root: Path, user_path: Path, data: str) -> None:
    if user_path.is_relative_to(root):        # passes for a symlink!
        user_path.write_text(data)

# RIGHT — resolve both, verify containment, atomic write in the same dir
def write_output(root: Path, user_path: Path, data: str) -> None:
    root = root.resolve()
    target = (root / user_path).resolve()
    if not target.is_relative_to(root):
        raise ValueError(f"{target} escapes {root}")
    tmp = target.with_suffix(target.suffix + ".tmp")   # same dir = same filesystem
    tmp.write_text(data)
    tmp.replace(target)                                # atomic on the same FS
```
Applies the path-traversal rule + the symlink-resolve and same-filesystem gotchas below.

---

## Pre-PR Code Review Checklist

- [ ] All tests pass; new/changed behavior has tests (coverage doesn't drop).
- [ ] Public functions/methods/exports have types (hints / TS types / signatures).
- [ ] Public APIs documented (docstring / JSDoc / doc comment).
- [ ] No function over the complexity/length limit; nesting via guard clauses.
- [ ] Imports grouped stdlib → third-party → local; no wildcard imports.
- [ ] No hardcoded secrets or credentials.
- [ ] Errors handled with specific types + context preservation (`from e` / `%w` / `cause`).
- [ ] No stray `print` / `console.log` / `println!` / `fmt.Println` debug output — use the logger.
- [ ] Queries are parameterized and efficient (no N+1).
- [ ] Formatter + linter + type-checker pass (see language reference for commands).
- [ ] Commit messages follow the `type(scope): subject` convention.

---

## Gotchas

Real, non-obvious traps behind the rules above:

- **`list[str]` / `dict[str, int]` builtins need Python 3.9+ at runtime.** On 3.8 they
  raise `TypeError: 'type' object is not subscriptable` unless the module has
  `from __future__ import annotations` (lazy string annotations) or you use
  `typing.List`. Confirm the interpreter before deleting legacy `typing` imports.
- **`asyncio.gather` fails fast but does NOT cancel siblings by default.** With
  `return_exceptions=False`, the first exception propagates immediately while the other
  coroutines keep running and may raise later into an unawaited-task warning. If partial
  results matter, pass `return_exceptions=True` and inspect each result.
- **A leading `_` (or TS `private`) is convention, not enforcement.** Python
  name-mangles only with double underscore (`__x`); TS `private` is compile-time only
  (erased at runtime, reachable via bracket access or plain JS). Never treat it as a
  security boundary. (Real privacy: Python `__x`, JS `#field`, Rust module privacy, Go
  lowercase.)
- **`is_relative_to` does NOT stop symlink traversal.** It passes for a path that looks
  nested but is a symlink pointing outside the root. `.resolve()` both sides first, then
  compare. (`is_relative_to` also requires Python 3.9+.)
- **Atomic write breaks across filesystems.** `write .tmp then replace()` is atomic only
  on the *same* filesystem. A temp file under `/tmp` replaced onto a project mount raises
  `OSError: Invalid cross-device link`. Create the temp file in the destination dir.
- **`SELECT` list vs `GROUP BY` must agree.** Under `ONLY_FULL_GROUP_BY` (MySQL default
  since 5.7) and in PostgreSQL, every non-aggregated selected column must appear in
  `GROUP BY` — otherwise Postgres errors and lax MySQL silently returns arbitrary rows.
- **A plain index on a natural key ≠ a UNIQUE constraint.** `CREATE INDEX` on
  `users(email)` speeds lookups but does not prevent duplicate accounts; use
  `CREATE UNIQUE INDEX` to enforce the invariant.
- **"No `console.log`/`print`" means no *debug* output, not no logging.** Replace stray
  debug lines with the project logger — don't delete the line and lose the signal.
- **Type-only imports vanish at runtime.** Python `if TYPE_CHECKING:` imports and TS
  `import type` are erased; referencing them outside an annotation raises `NameError` /
  a bundler error. Keep them to annotations (with quoted/`__future__` annotations in Py).
- **Coverage thresholds hide uncovered critical modules.** An aggregate `≥80%` can pass
  while a critical-path file sits at 0%. Check per-file coverage — a single pass/fail
  number is not "critical paths are tested."
- **Don't run two formatters over the same files.** Ruff's formatter overlaps Black;
  Prettier + ESLint `--fix` can fight. Pick one formatter per language and let the
  linter lint.
- **Go: a `nil` error can still carry a non-nil concrete type in an interface.** Returning
  a typed pointer that's `nil` as an `error` makes `err != nil` true. Return the `error`
  interface directly, not a concrete-typed nil.

---

## Additional resources

Language deep dives — tool configs, full examples, and per-pattern detail:

| File | Content |
|------|---------|
| [`reference/python.md`](./reference/python.md) | Formatter/linter/type-checker configs (Black·Ruff·MyPy), type-hint patterns, error/exception hierarchies, pytest layout + fixtures + mocking, Google docstrings, security patterns, pre-commit + Makefile. |
| [`reference/typescript.md`](./reference/typescript.md) | `tsconfig` strict setup, ESLint/Prettier, interfaces vs types, modern JS idioms, async patterns, error `cause` chaining. |
| [`reference/rust-go.md`](./reference/rust-go.md) | Rust (rustfmt/clippy, `Result`/`?`, thiserror·anyhow) and Go (gofmt/golangci-lint, error wrapping `%w`, table-driven tests) conventions. |
