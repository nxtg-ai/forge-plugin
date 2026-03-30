# Architecture

> Deep knowledge of NXTG-Forge's specific system architecture -- agent orchestration, hook lifecycle, immutable state management, and design patterns -- so agents understand the system they are building within.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Knowledge |

---

## What It Provides

While core-architecture teaches universal Clean Architecture principles, this skill encodes the NXTG-Forge-specific architecture: how the agent orchestration system works, how hooks execute at each lifecycle phase, how immutable state transitions are managed, and which design patterns (Repository, Strategy, Observer, Command) are applied where. It includes Architecture Decision Records (ADRs) that document the rationale behind key choices -- why Clean Architecture was adopted, why agents are specialized by concern, and why state objects are frozen dataclasses.

Without this skill, agents building NXTG-Forge features would not understand the hook execution flow (pre-task validates environment, post-task runs quality checks, on-error captures diagnostics, on-file-change formats code). They would not know that state objects are immutable and must be replaced via `with_status()` rather than mutated. They would miss the dependency injection patterns that keep the system testable.

The skill is both a reference manual and a design guide. It contains ASCII diagrams of the system architecture, code examples for every component type, hook configurations, and state transition diagrams showing valid state flows (INITIALIZING -> READY -> GENERATING -> COMPLETED | ERROR).

## When It Activates

- When designing new features for the NXTG-Forge platform itself
- When an agent needs to understand how NXTG-Forge components interact
- When modifying hook behavior, state management, or agent orchestration
- When making architectural decisions that need ADR documentation

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### Agent Orchestration System

The skill defines how agents are assigned to tasks through keyword-based routing: architecture/design keywords route to Lead Architect, api/backend/database to Backend Master, cli/command to CLI Artisan. The TaskDispatcher manages queuing, execution, and history tracking. Configuration lives in `.claude/config.json` with settings for max parallel agents, handoff timeouts, and agent capability declarations. This knowledge lets agents participate correctly in multi-agent workflows.

### Hook Lifecycle and Execution

Four hook types execute at specific points: `pre-task.sh` (before work -- checks Python version, virtual environment, dependencies, database connection, uncommitted changes), `post-task.sh` (after work -- runs black, ruff, mypy, pytest, bandit, updates docs), `on-error.sh` (on failure -- captures error details, system state, git changes, generates debugging report), `on-file-change.sh` (after file edits -- formats, syntax checks, quick type check). Hooks receive context through environment variables (`NXTG_PROJECT_ROOT`, `NXTG_TASK_DESCRIPTION`, `NXTG_AGENT_TYPE`). Understanding this lifecycle prevents agents from duplicating hook work or skipping steps that hooks handle.

### Immutable State Architecture

All state objects use `frozen=True` dataclasses. Modifications create new instances via `replace()` or custom `with_*()` methods. This design prevents unexpected mutations and makes state transitions explicit. The valid transition graph (INITIALIZING -> READY -> GENERATING -> COMPLETED|ERROR -> ARCHIVED) is enforced programmatically. Persistence uses JSON serialization to `.nxtg-forge/state.json` with checkpoint support for time-travel recovery.

### Design Pattern Applications

The skill maps patterns to their specific use in NXTG-Forge: Repository for data access abstraction (domain defines interface, infrastructure implements), Strategy for interchangeable algorithms (template selection can be interactive or config-based), Observer for hook notifications (hooks subscribe to lifecycle events), Command for encapsulating operations (each CLI command is a self-contained unit). A DI Container manages service registration and resolution.

## How to Leverage It

When working on NXTG-Forge internals, reference this skill's architectural constraints. If you are adding a new hook type, the skill tells you the expected interface. If you are adding a new agent, it shows the registration pattern. If you are modifying state, it enforces immutability.

### Example: Adding a New Hook

```
User: "Add a pre-commit hook that checks for API key leaks"

What happens: The skill activates and informs the agent about the hook execution model,
environment variables available, the safety configuration in .claude/config.json, and
the non-blocking nature of hooks. The result is a hook that integrates cleanly with
the existing lifecycle.
```

## Power Applications

The ADRs in this skill are particularly valuable for onboarding. When a new contributor asks "why are state objects immutable?" or "why do we use specialized agents instead of a single general agent?", the ADR provides the decision context, rationale, and acknowledged trade-offs. This prevents re-litigating settled decisions.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **core-architecture** | Universal Clean Architecture principles that this skill specializes for NXTG-Forge |
| **coding-standards** | Project-specific coding rules that apply within this architecture |
| **testing-strategy** | How to test components described by this architecture |

## Tips

- This skill is NXTG-Forge-specific. For general Clean Architecture guidance, see core-architecture.
- The hook system is non-blocking by design. Hooks observe and advise; they do not prevent actions.

---

*See also: [core-architecture](core-architecture.md) | [coding-standards](coding-standards.md)*
