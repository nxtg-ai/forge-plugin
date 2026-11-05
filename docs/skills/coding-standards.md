# Coding Standards

> A language-agnostic baseline for consistent, readable, secure code in Python, TypeScript/JavaScript, Rust and Go, with a pre-PR review checklist and per-language reference files.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Knowledge |

---

## What It Provides

Conventions for code in *your* project, whatever its language: naming, type safety, error handling, async, imports, SQL, commit messages, complexity and size limits, documentation and security. The numeric thresholds are recommended defaults. The skill tells you to tune them to your project and enforce them with your own linter and CI.

## When It Activates

- When writing or reviewing code against a style baseline
- When asking "what's the convention for X", adding types, or formatting SQL or a commit message
- When running the pre-PR checklist
- When setting up a formatter, linter or type checker

This skill does not load automatically (`disable-model-invocation: true`). Invoke it as `/nxtg-forge:coding-standards`.

## The Knowledge Inside

### Conventions by Topic

Naming conventions per language, type safety, error handling with specific types and preserved context, concurrency and async, import organization, SQL formatting, and the `type(scope): subject` commit format, each with good and bad examples.

### Complexity and Size Limits (recommended defaults)

| Metric | Suggested max | Aim for |
|--------|---------------|---------|
| Cyclomatic complexity per function | 10 | 5 or less |
| Function length (lines) | 50 | 20 or less |
| Nesting depth | 3 | 2 or less |
| File length (lines) | 500 | — |

The skill calls these smells to refactor, not hard gates, and suggests guard clauses instead of deep nesting.

### Security and Safe Path Handling

Universal security rules plus a worked example of safe path handling: resolve both paths, verify containment, and write atomically in the destination directory.

### Pre-PR Checklist and Gotchas

An 11-item checklist (tests, types, docs, limits, imports, secrets, errors, debug output, queries, tooling, commit format) and a list of non-obvious traps, such as `is_relative_to` not stopping symlink traversal and atomic writes failing across filesystems.

## Reference Files

| File | Content |
|------|---------|
| `reference/python.md` | Black, Ruff and MyPy configs, type hints, exception hierarchies, pytest, docstrings, pre-commit and Makefile |
| `reference/typescript.md` | Strict `tsconfig`, ESLint/Prettier, interfaces vs types, async patterns, error `cause` chaining |
| `reference/rust-go.md` | rustfmt/clippy and `Result` handling; gofmt/golangci-lint, `%w` error wrapping, table-driven tests |

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **architecture** | Structural patterns these conventions apply within |
| **owasp-security** | Security review and remediation in depth |

---

*See also: [architecture](architecture.md)*
