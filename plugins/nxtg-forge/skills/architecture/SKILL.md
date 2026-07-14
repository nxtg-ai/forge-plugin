---
name: Architecture
description: Provides architectural design patterns, system structure guidance, and component organization best practices.
disable-model-invocation: true
---

# NXTG-Forge System Architecture

**Purpose**: Comprehensive understanding of NXTG-Forge's Clean Architecture implementation, design patterns, and component interactions.

**When to Use**: Any task involving system design, new features, refactoring, or understanding component relationships.

---

## System Overview

NXTG-Forge is a next-generation CLI tool for project scaffolding that implements Clean Architecture principles with specialized AI agent orchestration.

```
┌─────────────────────────────────────────────────────────────┐
│                   NXTG-Forge Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐                    ┌──────────────┐     │
│   │   CLI        │◄──────────────────►│   Hooks      │     │
│   │  Interface   │                    │   System     │     │
│   └──────┬───────┘                    └──────────────┘     │
│          │                                                  │
│   ┌──────▼───────────────────────────────────┐             │
│   │        Application Layer                 │             │
│   │  (Use Cases, Orchestration)              │             │
│   └──────┬───────────────────────────────────┘             │
│          │                                                  │
│   ┌──────▼───────────┐        ┌───────────────┐            │
│   │   Domain Layer   │        │ Agent System  │            │
│   │ (Pure Business)  │◄──────►│ Orchestrator  │            │
│   └──────┬───────────┘        └───────┬───────┘            │
│          │                            │                     │
│   ┌──────▼────────────────────────────▼──────┐             │
│   │         Infrastructure Layer             │             │
│   │  (File System, Templates, State)         │             │
│   └──────────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Clean Architecture Principles

### Core Tenets

1. **Independence of Frameworks**: Business logic doesn't depend on external libraries
2. **Testability**: Business rules can be tested without UI, database, or external services
3. **Independence of UI**: UI can change without changing business rules
4. **Independence of Database**: Business rules not bound to database
5. **Independence of External Agencies**: Business rules don't know about the outside world

### Dependency Rule

**Dependencies point inward**: Outer layers can depend on inner layers, never the reverse.

```
┌───────────────────────────────────┐
│  Interface Layer (CLI)            │ ─┐
├───────────────────────────────────┤  │
│  Infrastructure Layer (File I/O)  │ ─┼─► Dependencies flow inward
├───────────────────────────────────┤  │
│  Application Layer (Use Cases)    │ ─┤
├───────────────────────────────────┤  │
│  Domain Layer (Business Logic)    │ ◄┘
└───────────────────────────────────┘
   ↑ No outward dependencies
```

---

## Layer Structure

### 1. Domain Layer (`forge/domain/`)

**Purpose**: Pure business logic, completely independent of external concerns.

**Components**: Entities (immutable, identity-based), Value Objects (attribute-defined), Domain Services (cross-entity logic)

**Rules**:
- No external dependencies (no imports from outer layers)
- All functions should be pure where possible
- Immutable data structures (`frozen=True`)
- Business rules live here and only here

→ See `patterns.md` §Domain Layer Examples for code

---

### 2. Application Layer (`forge/application/`)

**Purpose**: Orchestrate domain objects to fulfill use cases.

**Components**: Use Cases (high-level workflows), Application Services (multi-use-case coordination), DTOs (inter-layer data)

**Rules**:
- Orchestrates domain layer — no business logic of its own
- Handles transaction boundaries
- Converts between domain and external representations

→ See `patterns.md` §Application Layer Examples for code

---

### 3. Infrastructure Layer (`forge/infrastructure/`)

**Purpose**: Implement interfaces defined by inner layers; handle all I/O.

**Components**: Repository implementations, File system access (Jinja2 rendering), State persistence (JSON)

**Rules**:
- Implements domain interfaces
- All I/O happens here
- No domain logic
- External library usage concentrated here

→ See `patterns.md` §Infrastructure Layer Examples for code

---

### 4. Interface Layer (`forge/interface/`)

**Purpose**: User interaction points (CLI via Click).

**Rules**:
- Thin layer — delegates immediately to application
- Input validation and output formatting only
- No business logic

→ See `patterns.md` §Interface Layer Examples for code

---

## Agent System Architecture

### Agent Types

| Agent | Specialty |
|---|---|
| `LEAD_ARCHITECT` | System design and architectural decisions |
| `BACKEND_MASTER` | API, backend, database |
| `CLI_ARTISAN` | CLI commands and interfaces |
| `PLATFORM_BUILDER` | Platform and infrastructure |
| `INTEGRATION_SPECIALIST` | Third-party integrations |
| `QA_SENTINEL` | Testing and quality |

### Orchestration Model

Tasks assigned via keyword matching in task descriptions. `AgentOrchestrator` selects agent type; `TaskDispatcher` manages queue, async execution, and history tracking.

Agent configuration lives in `.claude/config.json` (`agents.available_agents[]`). Max 3 parallel agents by default; handoff timeout 300s.

→ See `patterns.md` §Agent System Examples for code

---

## Hook System Design

### Hook Lifecycle

```
Task/Operation Start
       ↓
[pre-task.sh]     ← Environment validation
       ↓
[Task Execution]
       ↓
[on-file-change.sh] ← After each file write
       ↓
[on-error.sh]     ← If error occurs
       ↓
[post-task.sh]    ← Quality checks
       ↓
Task Complete
```

### Hook Types

| Hook | Purpose |
|---|---|
| `pre-task.sh` | Validate Python version, venv, deps, DB connection; warn on uncommitted changes |
| `post-task.sh` | Run black, ruff, mypy, tests + coverage, bandit, doc updates |
| `on-error.sh` | Capture error details, log system state, record git changes, create debug report |
| `on-file-change.sh` | Quick format, syntax check, fast type check after file modification |

Hooks receive context via env vars (`NXTG_PROJECT_ROOT`, `NXTG_TASK_DESCRIPTION`, `NXTG_AGENT_TYPE`, `NXTG_CONFIG_FILE`).

→ See `patterns.md` §Hook Configuration Examples

---

## State Management

### State Architecture

```
ProjectState (Immutable frozen dataclass)
  ├── project_id, name, template, variables
  ├── status: ProjectStatus
  └── created_at: datetime

SessionState (In-Memory)
  ├── agent_context: dict
  ├── progress: float
  └── errors: list

StateManager (Persistence Interface)
  ├── save(state)
  ├── load() → state
  └── checkpoint(desc)
```

### State Transitions

```
INITIALIZING → READY
READY → GENERATING
GENERATING → COMPLETED | ERROR
COMPLETED → ARCHIVED
ERROR → READY (after fix)
```

State persisted to `.nxtg-forge/state.json`. Checkpoints tracked with timestamp and description.

→ See `patterns.md` §State Management Examples for code

---

## Design Patterns — Index

| Pattern | Purpose | Key Class |
|---|---|---|
| Repository | Abstract data access; domain interface + infra impl | `TemplateRepository` / `FileTemplateRepository` |
| Strategy | Interchangeable algorithms for same operation | `TemplateSelectionStrategy` (Interactive / Config-based) |
| Observer | Decouple event producers from consumers | `HookNotifier` + `HookObserver` |
| Command | Encapsulate operations as executable objects | `GenerateProjectCommand` |
| DI Container | Decouple construction from use; singleton vs transient | `Container` in `infrastructure/di_container.py` |

→ See `patterns.md` §Design Pattern Code Examples for implementations

---

## Quality Attributes

| Attribute | Approach |
|---|---|
| **Testability** | Pure domain functions (no mocks needed); injectable deps via constructor; mock-friendly interfaces |
| **Maintainability** | Clear layer boundaries; SRP; ADRs for decisions |
| **Extensibility** | Template plugins via config; new agents via config; hook system for custom behavior |
| **Performance** | Lazy template loading; in-memory caching of parsed templates; parallel file generation |

---

## Architecture Decision Records — Summary

| ADR | Decision | Key Trade-offs |
|---|---|---|
| ADR-001 | Clean Architecture adoption | ✅ Testability, clear boundaries ⚠️ Initial complexity, learning curve |
| ADR-002 | Agent-based generation | ✅ Parallelism, specialized expertise ⚠️ Coordination overhead, state sync |
| ADR-003 | Immutable state (frozen dataclasses) | ✅ Predictability, thread-safety ⚠️ More object creation |

→ See `adr-templates.md` for full ADR records and blank template

---

## Detailed References

| File | Content |
|---|---|
| `patterns.md` | Full code examples: all four layers, agent system, hooks, state management, design patterns, DI container |
| `adr-templates.md` | Full ADR-001/002/003 records; blank ADR template for new decisions |

## Related Skills

- [Coding Standards](../coding-standards/SKILL.md) — Implementation patterns and conventions
- [Domain Knowledge](../domain-knowledge/SKILL.md) — NXTG-Forge business concepts
- [Testing Strategy](../testing-strategy/SKILL.md) — How to test this architecture

---

*Last Updated: 2026-01-06 | Version: 1.0.0*
