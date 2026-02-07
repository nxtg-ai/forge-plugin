---
name: Architecture
description: Provides architectural design patterns, system structure guidance, and component organization best practices.
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

**Components**:

#### Entities

Core business objects with intrinsic identity:

```python
# forge/domain/entities/template.py
@dataclass(frozen=True)
class Template:
    """Immutable template entity."""
    name: str
    version: str
    description: str
    files: list[TemplateFile]
    variables: dict[str, VariableDefinition]
```

#### Value Objects

Objects defined by their attributes, not identity:

```python
# forge/domain/value_objects/project_config.py
@dataclass(frozen=True)
class ProjectConfig:
    """Immutable project configuration."""
    name: str
    python_version: str
    use_docker: bool
    database: Optional[str] = None
```

#### Domain Services

Business logic that doesn't belong to a single entity:

```python
# forge/domain/services/template_validator.py
class TemplateValidator:
    """Validates template structure and consistency."""

    def validate(self, template: Template) -> ValidationResult:
        """Pure validation logic, no I/O."""
        errors = []

        if not template.name:
            errors.append("Template name is required")

        if not template.version:
            errors.append("Template version is required")

        return ValidationResult(is_valid=len(errors) == 0, errors=errors)
```

**Rules**:

- No external dependencies (no imports from outer layers)
- All functions should be pure where possible
- Immutable data structures (use `frozen=True`)
- Business rules live here and only here

---

### 2. Application Layer (`forge/application/`)

**Purpose**: Orchestrate domain objects to fulfill use cases.

**Components**:

#### Use Cases

High-level business workflows:

```python
# forge/application/use_cases/generate_project.py
class GenerateProjectUseCase:
    """Use case for generating a new project from template."""

    def __init__(
        self,
        template_repo: TemplateRepository,
        file_generator: FileGenerator,
        validator: TemplateValidator
    ):
        self.template_repo = template_repo
        self.file_generator = file_generator
        self.validator = validator

    def execute(
        self,
        template_name: str,
        config: ProjectConfig,
        output_dir: Path
    ) -> GenerationResult:
        """Execute the generation workflow."""
        # 1. Load template
        template = self.template_repo.find_by_name(template_name)

        # 2. Validate template
        validation = self.validator.validate(template)
        if not validation.is_valid:
            return GenerationResult.failure(validation.errors)

        # 3. Generate files
        files = self.file_generator.generate(template, config, output_dir)

        # 4. Return result
        return GenerationResult.success(files)
```

#### Application Services

Coordinate multiple use cases:

```python
# forge/application/services/project_orchestrator.py
class ProjectOrchestrator:
    """Orchestrates complex project operations."""

    def __init__(
        self,
        generate_use_case: GenerateProjectUseCase,
        validate_use_case: ValidateProjectUseCase
    ):
        self.generate = generate_use_case
        self.validate = validate_use_case
```

#### DTOs (Data Transfer Objects)

Data passed between layers:

```python
# forge/application/dtos/generation_result.py
@dataclass(frozen=True)
class GenerationResult:
    """Result of project generation."""
    success: bool
    files: list[Path]
    errors: list[str]

    @classmethod
    def success(cls, files: list[Path]) -> 'GenerationResult':
        return cls(success=True, files=files, errors=[])

    @classmethod
    def failure(cls, errors: list[str]) -> 'GenerationResult':
        return cls(success=False, files=[], errors=errors)
```

**Rules**:

- Orchestrates domain layer
- No business logic (delegates to domain)
- Handles transaction boundaries
- Converts between domain and external representations

---

### 3. Infrastructure Layer (`forge/infrastructure/`)

**Purpose**: Implement interfaces defined by inner layers, handle all I/O.

**Components**:

#### Repository Implementations

```python
# forge/infrastructure/repositories/file_template_repository.py
class FileTemplateRepository(TemplateRepository):  # Interface from domain
    """File system-based template repository."""

    def __init__(self, templates_dir: Path):
        self.templates_dir = templates_dir

    def find_by_name(self, name: str) -> Template:
        """Load template from file system."""
        template_path = self.templates_dir / name / "template.yaml"

        if not template_path.exists():
            raise TemplateNotFoundError(f"Template {name} not found")

        # Load and parse YAML
        data = yaml.safe_load(template_path.read_text())

        # Convert to domain entity
        return self._to_template(data)
```

#### File System Access

```python
# forge/infrastructure/file_system/file_generator.py
class FileGenerator:
    """Generates files from templates (Jinja2)."""

    def __init__(self, jinja_env: Environment):
        self.jinja_env = jinja_env

    def generate(
        self,
        template: Template,
        config: ProjectConfig,
        output_dir: Path
    ) -> list[Path]:
        """Render template files to disk."""
        generated = []

        for template_file in template.files:
            # Render template
            content = self._render(template_file, config)

            # Write to disk
            output_path = output_dir / template_file.path
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(content)

            generated.append(output_path)

        return generated
```

#### State Management

```python
# forge/infrastructure/state/json_state_manager.py
class JsonStateManager(StateManager):  # Interface from domain
    """JSON file-based state persistence."""

    def __init__(self, state_file: Path):
        self.state_file = state_file

    def save(self, state: ProjectState) -> None:
        """Persist state to JSON file."""
        data = self._to_dict(state)
        self.state_file.write_text(json.dumps(data, indent=2))

    def load(self) -> ProjectState:
        """Load state from JSON file."""
        if not self.state_file.exists():
            return ProjectState.initial()

        data = json.loads(self.state_file.read_text())
        return self._from_dict(data)
```

**Rules**:

- Implements domain interfaces
- All I/O happens here
- No domain logic
- External library usage concentrated here

---

### 4. Interface Layer (`forge/interface/`)

**Purpose**: User interaction points (CLI).

**Components**:

#### CLI Commands

```python
# forge/interface/cli/commands.py
import click
from forge.application.use_cases import GenerateProjectUseCase

@click.group()
def cli():
    """NXTG-Forge CLI."""
    pass

@cli.command()
@click.option('--template', required=True, help='Template name')
@click.option('--name', required=True, help='Project name')
@click.option('--output', type=click.Path(), help='Output directory')
def init(template: str, name: str, output: str):
    """Initialize new project from template."""
    # Create dependencies (would use DI container in production)
    use_case = GenerateProjectUseCase(...)

    # Build config from CLI args
    config = ProjectConfig(name=name, ...)

    # Execute use case
    result = use_case.execute(template, config, Path(output))

    # Display result
    if result.success:
        click.echo(f"✓ Generated {len(result.files)} files")
    else:
        for error in result.errors:
            click.echo(f"✗ {error}", err=True)
```

**Rules**:

- Thin layer, delegates to application
- User experience focus
- No business logic
- Input validation and output formatting

---

## Agent System Architecture

### Agent Orchestration

NXTG-Forge uses specialized AI agents for different concerns (architecture, backend, CLI, platform, integration, QA).

#### Agent Types (Enum)

```python
# forge/agents/agent_types.py
from enum import Enum

class AgentType(Enum):
    LEAD_ARCHITECT = "lead-architect"
    BACKEND_MASTER = "backend-master"
    CLI_ARTISAN = "cli-artisan"
    PLATFORM_BUILDER = "platform-builder"
    INTEGRATION_SPECIALIST = "integration-specialist"
    QA_SENTINEL = "qa-sentinel"
```

#### Agent Orchestrator

```python
# forge/agents/orchestrator.py
class AgentOrchestrator:
    """Coordinates agent execution and task assignment."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.agents = self._load_available_agents()
        self.active_tasks = {}

    def assign_agent(self, task: Task) -> AgentType:
        """Assign appropriate agent based on task description."""
        description = task.description.lower()

        # Keyword-based assignment
        if any(keyword in description for keyword in ["architecture", "design", "pattern"]):
            return AgentType.LEAD_ARCHITECT

        if any(keyword in description for keyword in ["api", "backend", "database"]):
            return AgentType.BACKEND_MASTER

        if any(keyword in description for keyword in ["cli", "command", "interface"]):
            return AgentType.CLI_ARTISAN

        # ... more assignment logic

        # Default to Lead Architect for unknown tasks
        return AgentType.LEAD_ARCHITECT
```

#### Task Dispatcher

```python
# forge/agents/dispatcher.py
class TaskDispatcher:
    """Dispatches and executes agent tasks."""

    def __init__(self, orchestrator: AgentOrchestrator):
        self.orchestrator = orchestrator
        self.task_queue = []
        self.task_history = []

    async def dispatch(self, task: Task) -> TaskResult:
        """Dispatch task to appropriate agent."""
        # Assign agent
        agent_type = self.orchestrator.assign_agent(task)
        task.assigned_agent = agent_type

        # Add to queue
        self.task_queue.append(task)

        # Execute (could be async)
        result = await self._execute_task(task)

        # Track history
        self.task_history.append((task, result))

        return result
```

### Agent Configuration (from .claude/config.json)

```json
{
  "agents": {
    "orchestration": {
      "enabled": true,
      "max_parallel": 3,
      "handoff_timeout": 300
    },
    "available_agents": [
      {
        "name": "lead-architect",
        "role": "System design and architectural decisions",
        "capabilities": ["architecture", "design", "planning"],
        "skill_file": ".claude/skills/agents/lead-architect.md"
      },
      // ... more agents
    ]
  }
}
```

---

## Hook System Design

### Hook Lifecycle

```
┌─────────────────────────────────────────────┐
│            Hook Execution Flow              │
├─────────────────────────────────────────────┤
│                                             │
│  Task/Operation Start                       │
│         ↓                                   │
│  [pre-task.sh] ← Environment validation     │
│         ↓                                   │
│  [Task Execution]                           │
│         ↓                                   │
│  [on-file-change.sh] ← After each file      │
│         ↓                                   │
│  [on-error.sh] ← If error occurs            │
│         ↓                                   │
│  [post-task.sh] ← Quality checks            │
│         ↓                                   │
│  Task Complete                              │
│                                             │
└─────────────────────────────────────────────┘
```

### Hook Types

#### 1. pre-task.sh

**Purpose**: Environment validation before any work

**Responsibilities**:

- Check Python version
- Verify virtual environment active
- Check dependencies installed
- Validate database connection
- Warn about uncommitted changes

#### 2. post-task.sh

**Purpose**: Quality assurance after work completion

**Responsibilities**:

- Run code formatter (black)
- Run linter (ruff)
- Run type checker (mypy)
- Run tests with coverage
- Security scanning (bandit)
- Documentation updates

#### 3. on-error.sh

**Purpose**: Error capture and debugging support

**Responsibilities**:

- Capture error details
- Log system state
- Record git changes
- Create debugging report
- Provide troubleshooting tips

#### 4. on-file-change.sh

**Purpose**: Quick validation after file modifications

**Responsibilities**:

- Format file (black)
- Quick syntax check
- Type check (fast mode)

### Hook Context

Hooks receive context via environment variables:

```bash
# Environment passed to hooks
NXTG_PROJECT_ROOT="/path/to/project"
NXTG_TASK_DESCRIPTION="Implement user authentication"
NXTG_AGENT_TYPE="backend-master"
NXTG_CONFIG_FILE=".claude/config.json"
```

### Hook Configuration (from .claude/config.json)

```json
{
  "hooks": {
    "enabled": true,
    "pre_task": ".claude/hooks/pre-task.sh",
    "post_task": ".claude/hooks/post-task.sh",
    "on_error": ".claude/hooks/on-error.sh",
    "on_file_change": ".claude/hooks/on-file-change.sh"
  },
  "safety": {
    "require_tests_for_commit": true,
    "prevent_force_push_main": true,
    "max_file_changes_per_commit": 50
  }
}
```

---

## State Management

### State Architecture

```
┌──────────────────────────────────────┐
│         State Management             │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────┐          │
│  │   Project State        │          │
│  │  (Immutable)           │          │
│  └───────┬────────────────┘          │
│          │                           │
│          ├─► name: str               │
│          ├─► template: str           │
│          ├─► variables: dict         │
│          ├─► status: ProjectStatus   │
│          └─► created_at: datetime    │
│                                      │
│  ┌────────────────────────┐          │
│  │   Session State        │          │
│  │  (In-Memory)           │          │
│  └───────┬────────────────┘          │
│          │                           │
│          ├─► agent_context: dict     │
│          ├─► progress: float         │
│          └─► errors: list            │
│                                      │
│  ┌────────────────────────┐          │
│  │   State Manager        │          │
│  │  (Persistence)         │          │
│  └────────────────────────┘          │
│          │                           │
│          ├─► save(state)             │
│          ├─► load() → state          │
│          └─► checkpoint(desc)        │
│                                      │
└──────────────────────────────────────┘
```

### State Immutability

All state objects are immutable (frozen dataclasses):

```python
@dataclass(frozen=True)
class ProjectState:
    """Immutable project state."""
    project_id: str
    name: str
    template: str
    variables: dict[str, Any]
    status: ProjectStatus
    created_at: datetime

    def with_status(self, new_status: ProjectStatus) -> 'ProjectState':
        """Create new state with updated status."""
        return replace(self, status=new_status)
```

### State Transitions

Valid state transitions:

```
INITIALIZING → READY
READY → GENERATING
GENERATING → COMPLETED | ERROR
COMPLETED → ARCHIVED
ERROR → READY (after fix)
```

### Persistence Strategy

```python
# State persisted to .nxtg-forge/state.json
{
  "project_id": "uuid-1234",
  "name": "my-api",
  "template": "fastapi-clean-arch",
  "variables": {
    "python_version": "3.11",
    "use_docker": true
  },
  "status": "READY",
  "created_at": "2026-01-06T12:00:00Z",
  "checkpoints": [
    {
      "id": "cp-001",
      "timestamp": "2026-01-06T12:30:00Z",
      "description": "After initial generation"
    }
  ]
}
```

---

## Design Patterns

### 1. Repository Pattern

**Purpose**: Abstract data access

```python
# Domain interface
class TemplateRepository(ABC):
    @abstractmethod
    def find_by_name(self, name: str) -> Template:
        pass

# Infrastructure implementation
class FileTemplateRepository(TemplateRepository):
    def find_by_name(self, name: str) -> Template:
        # File system access
        pass
```

### 2. Strategy Pattern

**Purpose**: Interchangeable algorithms

```python
# Template selection strategy
class TemplateSelectionStrategy(ABC):
    @abstractmethod
    def select(self, criteria: dict) -> Template:
        pass

class InteractiveSelectionStrategy(TemplateSelectionStrategy):
    """Prompt user for template selection."""
    pass

class ConfigBasedSelectionStrategy(TemplateSelectionStrategy):
    """Select based on config file."""
    pass
```

### 3. Observer Pattern

**Purpose**: Event notifications

```python
# Hook notifications
class HookNotifier:
    def __init__(self):
        self.observers = []

    def attach(self, observer: HookObserver):
        self.observers.append(observer)

    def notify(self, event: HookEvent):
        for observer in self.observers:
            observer.handle(event)
```

### 4. Command Pattern

**Purpose**: Encapsulate operations

```python
class Command(ABC):
    @abstractmethod
    def execute(self) -> CommandResult:
        pass

class GenerateProjectCommand(Command):
    def __init__(self, template: str, config: ProjectConfig):
        self.template = template
        self.config = config

    def execute(self) -> CommandResult:
        # Execute generation
        pass
```

---

## Dependency Injection

### DI Container (Conceptual)

```python
# forge/infrastructure/di_container.py
class Container:
    """Dependency injection container."""

    def __init__(self):
        self._services = {}

    def register_singleton(self, interface: type, implementation: type):
        """Register singleton service."""
        self._services[interface] = implementation()

    def register_transient(self, interface: type, implementation: type):
        """Register transient service (new instance each time)."""
        self._services[interface] = lambda: implementation()

    def resolve(self, interface: type):
        """Resolve service by interface."""
        return self._services[interface]

# Usage
container = Container()
container.register_singleton(TemplateRepository, FileTemplateRepository)
container.register_transient(GenerateProjectUseCase, GenerateProjectUseCase)

# Resolve
use_case = container.resolve(GenerateProjectUseCase)
```

---

## Quality Attributes

### Testability

- **Pure domain functions**: Easy to test, no mocks needed
- **Injectable dependencies**: Use cases receive dependencies via constructor
- **Mock-friendly interfaces**: Domain defines interfaces, infrastructure implements

### Maintainability

- **Clear layer boundaries**: Easy to understand where code belongs
- **Single Responsibility Principle**: Each class has one reason to change
- **Documented decision records**: Architecture decisions tracked in ADRs

### Extensibility

- **Plugin architecture**: Templates can be added without code changes
- **Agent capability extensions**: New agents can be registered via config
- **Hook system**: Custom behavior via hooks without modifying core

### Performance

- **Lazy loading**: Templates loaded on demand
- **Caching**: Parsed templates cached in memory
- **Parallel generation**: Independent files generated in parallel (configurable)

---

## Architecture Decision Records (ADRs)

### ADR-001: Clean Architecture Adoption

**Decision**: Implement Clean Architecture pattern

**Context**: Need maintainable, testable codebase that can evolve

**Rationale**:

- Clear separation of concerns
- Domain logic independent of frameworks
- Easy to test (pure functions)
- UI/infrastructure can change independently

**Consequences**:

- ✅ High testability
- ✅ Clear boundaries
- ⚠️ Initial complexity
- ⚠️ Learning curve for team

---

### ADR-002: Agent-Based Generation

**Decision**: Use specialized agents for different concerns

**Context**: Need to handle complex, multi-faceted project generation

**Rationale**:

- Separation of expertise (architecture, backend, CLI, QA)
- Parallel execution for independent tasks
- Clear ownership of different aspects

**Consequences**:

- ✅ Parallel execution
- ✅ Specialized knowledge
- ⚠️ Coordination overhead
- ⚠️ State synchronization

---

### ADR-003: Immutable State

**Decision**: Use immutable state objects (frozen dataclasses)

**Context**: Need predictable state management

**Rationale**:

- No unexpected mutations
- Thread-safe by default
- Easier to reason about state transitions

**Consequences**:

- ✅ Predictability
- ✅ Thread-safety
- ⚠️ More object creation (mitigated by Python's efficiency)

---

## Related Skills

- [Coding Standards](./coding-standards.md) - Implementation patterns and conventions
- [Domain Knowledge](./domain-knowledge.md) - NXTG-Forge business concepts
- [Testing Strategy](./testing-strategy.md) - How to test this architecture
- [Workflows](./workflows/git-workflow.md) - Development processes

---

*Last Updated: 2026-01-06*
*Version: 1.0.0*
