# Coding Standards

> The definitive NXTG-Forge style guide -- PEP 8 extensions, Black/Ruff/MyPy configuration, complexity limits, security requirements, and a pre-submission checklist that agents enforce on every piece of code they produce.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Knowledge |

---

## What It Provides

This skill extends the core coding standards with NXTG-Forge-specific rules and tooling configuration. It encodes Black line-length settings, Ruff lint rule selection, MyPy strict mode configuration, cyclomatic complexity limits, function length constraints, nesting depth rules, and a complete pre-submission checklist. Where core-coding-standards teaches general principles, this skill provides the exact `pyproject.toml` configurations and the specific thresholds that CI enforces.

Without this skill, agents produce code that passes generic linters but fails NXTG-Forge's stricter quality gates. A function with cyclomatic complexity 12 passes default pylint but fails the project's McCabe limit of 10 (target: 5). A 30-line function passes most style checkers but violates the project's 25-line maximum. Deeply nested conditions pass syntax checks but violate the 3-level nesting limit. This skill catches all of these.

The knowledge is exhaustive: naming conventions for every code element (modules, classes, functions, variables, constants, private members, type variables), conditional import patterns for type checking and optional dependencies, atomic file write patterns, safe subprocess execution, and the complete 13-item code review checklist.

## When It Activates

- When an agent is writing Python code for NXTG-Forge components
- When configuring linting, formatting, or type checking tools
- When reviewing code against project standards
- When setting up pre-commit hooks or CI pipelines

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### Complexity as a Hard Limit

Maximum cyclomatic complexity per function is 10, with a target of 5 or below. Maximum function length is 25 lines, target 15. Maximum nesting depth is 3 levels. The skill teaches agents to use guard clauses (early returns) instead of deep nesting, the Strategy pattern instead of complex conditionals, and function decomposition instead of long methods. A payment processor with 12 branches becomes a `PaymentProcessor` protocol with focused implementations (`CreditCardProcessor`, `PayPalProcessor`), each with complexity under 5.

### Domain-Specific Exception Hierarchy

The skill defines a `ForgeError` base exception with specialized subtypes: `TemplateNotFoundError` (carries template_name), `TemplateValidationError` (carries template_name and error list), `ConfigurationError`. Each exception stores contextual data as attributes and formats a human-readable message. Exception chains are preserved with `raise ... from e`. This hierarchy gives agents a vocabulary for error handling that is precise enough to catch in handlers and informative enough to debug in logs.

### Security-Hardened Patterns

Input validation prevents path traversal (alphanumeric check on template names, `is_relative_to()` verification on resolved paths). Secrets come from environment variables or dedicated secret managers, never hardcoded. File writes use atomic operations (write to temp, then rename). Subprocess calls use list form with `shlex.split()`, never `shell=True`. These patterns are not suggestions -- the skill presents them as requirements with explicit anti-patterns showing what happens without them.

### Tooling Configuration

Exact `pyproject.toml` sections for Black (`line-length = 100`, `target-version = ['py311']`), Ruff (E, W, F, I, C90, N, UP, B rules, McCabe max-complexity 10), MyPy (`strict = true`, `disallow_untyped_defs = true`), and pytest (`--cov-fail-under=80`). Pre-commit hook configuration for all three tools. A Makefile with `format`, `lint`, `type-check`, `test`, and `quality` targets. Agents can generate these configurations exactly as the project expects.

## How to Leverage It

When asking agents to write code, mention that it should pass quality gates. The skill provides the specific gates. When setting up a new NXTG-Forge component, ask the agent to include the full tooling configuration -- it will generate the exact `pyproject.toml` sections.

### Example: Quality-Gated Implementation

```
User: "Implement template validation with full quality compliance"

What happens: The skill activates and the agent produces a function with complexity
under 5, guard clauses instead of nesting, specific exception types, type hints on
every parameter, a Google-style docstring, and a companion test file. The code passes
black, ruff, and mypy without modifications.
```

## Power Applications

The 13-item code review checklist serves as an automated quality gate. Agents can run through it before presenting code: type hints present, docstrings complete, coverage above 80%, complexity under 10, no functions over 25 lines, imports organized, no hardcoded secrets, specific exception types, no N+1 queries, conventional commit messages. This checklist catches issues that manual review often misses.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **core-coding-standards** | General principles that this skill specializes for NXTG-Forge |
| **architecture** | Architectural patterns that this skill's conventions implement |
| **security** | Security patterns referenced here but covered in depth by the security skill |

## Tips

- The difference between this and core-coding-standards: core is language-general, this is project-specific with exact tool configurations.
- Complexity limits are enforced by CI. Code that exceeds them will fail the pipeline even if it works correctly.

---

*See also: [core-coding-standards](core-coding-standards.md) | [security](security.md)*
