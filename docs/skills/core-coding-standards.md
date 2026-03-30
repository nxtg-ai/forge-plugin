# Core Coding Standards

> Encodes naming conventions, type safety requirements, import organization, and code style rules across Python, TypeScript, and SQL so agents produce consistent, professional code in every file they touch.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Core |

---

## What It Provides

This skill is the foundational code quality layer. It teaches agents the specific conventions that make code readable, maintainable, and consistent: naming rules (snake_case for Python functions, PascalCase for classes, SCREAMING_SNAKE for constants), mandatory type hints on all function signatures, import ordering (stdlib, then third-party, then local), and documentation requirements (Google-style docstrings with Args, Returns, Raises, and Example sections).

Without this skill, agents produce code that works but lacks discipline. Variables get abbreviated names, type hints are missing or incomplete, imports are scattered, error handling uses bare `except` blocks, and async operations run sequentially instead of concurrently. The skill prevents these anti-patterns by encoding specific right/wrong examples that agents reference during generation.

The knowledge covers Python deeply (PEP 8 extensions, modern type syntax, async/await patterns, SRP-based class design), TypeScript (interfaces, strict typing, modern ES syntax), SQL formatting (readable multi-line queries, proper indexing), and git commit message conventions (conventional commits with type, scope, subject, body, and footer).

## When It Activates

- When an agent is writing or modifying any source code file
- When generating function signatures, class definitions, or module structures
- When an agent needs to format SQL queries or database operations
- When creating git commit messages or PR descriptions

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### Type Hints as a Non-Negotiable

The skill mandates type hints on every public function parameter and return value. It teaches modern Python 3.9+ syntax (`list[str]` not `List[str]`, `X | None` not `Optional[X]`). This matters because agents without this guidance produce untyped code that passes linters but fails type checkers, making refactoring risky and IDE support weaker. The skill includes concrete examples of both correct and incorrect patterns, giving agents a reference to match against.

### Error Handling Discipline

Bare `except` blocks, swallowed exceptions, and generic error messages are all explicitly flagged as anti-patterns. The skill teaches agents to catch specific exception types, log meaningful context, use `raise ... from e` to preserve exception chains, and distinguish between expected errors (return None or raise domain-specific exceptions) and unexpected errors (log and re-raise). This transforms error handling from an afterthought into a first-class design concern.

### Async Concurrency Patterns

A subtle but high-impact rule: when multiple independent async operations need to run, use `asyncio.gather()` instead of sequential `await` calls. The skill shows the performance difference -- three sequential database queries that take 100ms each become a single 100ms operation when gathered. Agents without this knowledge default to sequential awaits, producing code that is functionally correct but unnecessarily slow.

### Single Responsibility at Every Scale

Functions should do one thing. Classes should have one reason to change. The skill enforces this with a `UserRepository` that only handles persistence and an `EmailService` that only handles email -- never a `UserManager` that does both. File size limits (functions max 50 lines, classes max 300 lines, files max 500 lines) provide concrete guardrails that agents can check against.

## How to Leverage It

The skill works best when you let agents generate code naturally. It activates in the background and shapes output to match these standards. If you notice agents producing untyped functions or bare except blocks, the skill may not have activated -- rephrase your prompt to include context about code quality or standards compliance.

### Example: Code Generation

```
User: "Create a user registration endpoint"

What happens: The skill activates alongside core-architecture. The generated function
has full type hints, a Google-style docstring, specific exception handling, and
properly organized imports. The commit message follows conventional commit format.
```

## Power Applications

The skill prevents a class of bugs that are invisible in code review but costly in production: sequential async calls that create latency, bare except blocks that swallow errors, and missing type hints that allow type confusion to propagate. These are the kinds of issues that pass functional tests but cause incidents under load.

It also standardizes commit messages, which compounds over time. When every commit follows `type(scope): subject` format, automated changelog generation works, `git log` becomes readable, and bisecting regressions is straightforward.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **core-architecture** | Provides the structural context where these coding standards apply |
| **core-testing** | Testing standards that complement code standards (naming, assertions, coverage) |
| **coding-standards** | Extended project-specific standards built on top of these core rules |

## Tips

- This skill covers multiple languages. It activates based on the file type being generated.
- If an agent produces code without type hints, explicitly mention "with full type annotations" in your prompt.

---

*See also: [coding-standards](coding-standards.md) | [core-testing](core-testing.md)*
