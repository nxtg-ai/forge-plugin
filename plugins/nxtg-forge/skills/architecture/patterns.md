# Architecture Patterns — Code Examples

Detailed implementations referenced from `SKILL.md`. Organized by layer and pattern type.

---

## Domain Layer Examples

### Entities

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

### Value Objects

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

### Domain Services

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

---

## Application Layer Examples

### Use Cases

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

### Application Services

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

### DTOs (Data Transfer Objects)

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

---

## Infrastructure Layer Examples

### Repository Implementations

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

### File System Access

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

### State Management

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

---

## Interface Layer Examples

### CLI Commands

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

---

## Agent System Examples

### Agent Types Enum

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

### Agent Orchestrator

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

        if any(keyword in description for keyword in ["architecture", "design", "pattern"]):
            return AgentType.LEAD_ARCHITECT

        if any(keyword in description for keyword in ["api", "backend", "database"]):
            return AgentType.BACKEND_MASTER

        if any(keyword in description for keyword in ["cli", "command", "interface"]):
            return AgentType.CLI_ARTISAN

        # Default to Lead Architect for unknown tasks
        return AgentType.LEAD_ARCHITECT
```

### Task Dispatcher

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

### Agent Configuration (`.claude/config.json`)

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
      }
    ]
  }
}
```

---

## Hook Configuration Examples

### Hook Environment Variables

```bash
# Environment passed to hooks
NXTG_PROJECT_ROOT="/path/to/project"
NXTG_TASK_DESCRIPTION="Implement user authentication"
NXTG_AGENT_TYPE="backend-master"
NXTG_CONFIG_FILE=".claude/config.json"
```

### Hook Configuration (`.claude/config.json`)

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

## State Management Examples

### Immutable State Object

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

### Persistence Schema (`.nxtg-forge/state.json`)

```json
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

## Design Pattern Code Examples

### 1. Repository Pattern

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

**Trade-offs**: Clean abstraction enables swapping storage backends (file, DB, network) without touching domain code. Adds one indirection layer.

### 2. Strategy Pattern

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

**Trade-offs**: Algorithms swappable at runtime. Adds classes; overkill for 2 variants but correct for 3+.

### 3. Observer Pattern

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

**Trade-offs**: Decouples event sources from handlers. Execution order not guaranteed; observers must be idempotent.

### 4. Command Pattern

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

**Trade-offs**: Enables undo/redo, queuing, logging. Adds wrapper objects per operation.

---

## Dependency Injection Container

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

**Trade-offs**: Centralizes wiring; enables testing with mock implementations. Custom container adds maintenance overhead — prefer established DI frameworks (dependency-injector, injector) for production.

---

*Source: extracted from `SKILL.md` v1.0.0 — 2026-01-06*
