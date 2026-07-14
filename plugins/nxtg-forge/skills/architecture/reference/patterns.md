# Architecture Patterns — Illustrative Code Examples

Reference implementations for the patterns in [`../SKILL.md`](../SKILL.md).

> **These are illustrative examples, not NXTG-Forge source.** They demonstrate the
> patterns in Python (one concrete language) using a made-up template-generator
> domain. The `# domain/...` path comments describe an *example* project layout you
> would create in your own codebase — they are not files in this repo. Apply the
> shape, not the literal paths.

---

## Layer Examples

### Domain — Entities

Core business objects with intrinsic identity:

```python
# example layout: domain/entities/template.py
@dataclass(frozen=True)
class Template:
    """Immutable template entity."""
    name: str
    version: str
    description: str
    files: list[TemplateFile]
    variables: dict[str, VariableDefinition]
```

### Domain — Value Objects

Objects defined by their attributes, not identity:

```python
# example layout: domain/value_objects/project_config.py
@dataclass(frozen=True)
class ProjectConfig:
    """Immutable project configuration."""
    name: str
    language_version: str
    use_docker: bool
    database: Optional[str] = None
```

### Domain — Services

Business logic that doesn't belong to a single entity (pure, no I/O):

```python
# example layout: domain/services/template_validator.py
class TemplateValidator:
    def validate(self, template: Template) -> ValidationResult:
        errors = []
        if not template.name:
            errors.append("Template name is required")
        if not template.version:
            errors.append("Template version is required")
        return ValidationResult(is_valid=len(errors) == 0, errors=errors)
```

### Application — Use Cases

High-level workflows that orchestrate domain objects:

```python
# example layout: application/use_cases/generate_project.py
class GenerateProjectUseCase:
    def __init__(self, template_repo: TemplateRepository,
                 file_generator: FileGenerator, validator: TemplateValidator):
        self.template_repo = template_repo
        self.file_generator = file_generator
        self.validator = validator

    def execute(self, template_name: str, config: ProjectConfig,
                output_dir: Path) -> GenerationResult:
        template = self.template_repo.find_by_name(template_name)   # 1. load
        validation = self.validator.validate(template)              # 2. validate
        if not validation.is_valid:
            return GenerationResult.failure(validation.errors)
        files = self.file_generator.generate(template, config, output_dir)  # 3. render
        return GenerationResult.success(files)                      # 4. result
```

### Application — DTOs

Data passed between layers:

```python
# example layout: application/dtos/generation_result.py
@dataclass(frozen=True)
class GenerationResult:
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

### Infrastructure — Repository Implementation

Implements a domain interface; this is where I/O lives:

```python
# example layout: infrastructure/repositories/file_template_repository.py
class FileTemplateRepository(TemplateRepository):  # interface declared in domain
    def __init__(self, templates_dir: Path):
        self.templates_dir = templates_dir

    def find_by_name(self, name: str) -> Template:
        template_path = self.templates_dir / name / "template.yaml"
        if not template_path.exists():
            raise TemplateNotFoundError(f"Template {name} not found")
        data = yaml.safe_load(template_path.read_text())
        return self._to_template(data)   # return a DOMAIN type, never a raw row
```

### Infrastructure — File Generation

```python
# example layout: infrastructure/file_system/file_generator.py
class FileGenerator:
    def __init__(self, jinja_env: Environment):
        self.jinja_env = jinja_env

    def generate(self, template: Template, config: ProjectConfig,
                 output_dir: Path) -> list[Path]:
        generated = []
        for template_file in template.files:
            content = self._render(template_file, config)
            output_path = output_dir / template_file.path
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(content)
            generated.append(output_path)
        return generated
```

### Interface — CLI (thin, delegates immediately)

```python
# example layout: interface/cli/commands.py
import click

@click.command()
@click.option('--template', required=True)
@click.option('--name', required=True)
@click.option('--output', type=click.Path())
def generate(template: str, name: str, output: str):
    use_case = container.resolve(GenerateProjectUseCase)   # wiring via DI
    config = ProjectConfig(name=name, language_version="3.11", use_docker=False)
    result = use_case.execute(template, config, Path(output))
    if result.success:
        click.echo(f"Generated {len(result.files)} files")
    else:
        for error in result.errors:
            click.echo(f"error: {error}", err=True)
```

---

## Design Pattern Code Examples

### Repository

```python
# Domain declares the interface
class TemplateRepository(ABC):
    @abstractmethod
    def find_by_name(self, name: str) -> Template: ...

# Infrastructure implements it
class FileTemplateRepository(TemplateRepository):
    def find_by_name(self, name: str) -> Template: ...   # file system access
```

**Trade-offs**: swap storage backends (file, DB, network) without touching domain
code. Adds one indirection layer — skip it for a single hardcoded store.

### Strategy

```python
class TemplateSelectionStrategy(ABC):
    @abstractmethod
    def select(self, criteria: dict) -> Template: ...

class InteractiveSelectionStrategy(TemplateSelectionStrategy): ...   # prompt user
class ConfigBasedSelectionStrategy(TemplateSelectionStrategy): ...   # read config
```

**Trade-offs**: algorithms swappable at runtime. Overkill for 2 variants (use a
conditional); correct for 3+.

### Observer

```python
class HookNotifier:
    def __init__(self):
        self.observers = []
    def attach(self, observer): self.observers.append(observer)
    def notify(self, event):
        for observer in self.observers:
            observer.handle(event)
```

**Trade-offs**: decouples event sources from handlers. Execution order is not
guaranteed → observers must be idempotent.

### Command

```python
class Command(ABC):
    @abstractmethod
    def execute(self) -> CommandResult: ...

class GenerateProjectCommand(Command):
    def __init__(self, template: str, config: ProjectConfig):
        self.template = template
        self.config = config
    def execute(self) -> CommandResult: ...   # runnable, queueable, loggable
```

**Trade-offs**: enables undo/redo, queuing, logging. Adds a wrapper object per
operation.

---

## Dependency Injection Container

```python
# example layout: infrastructure/di_container.py
class Container:
    def __init__(self):
        self._services = {}
    def register_singleton(self, interface: type, implementation: type):
        self._services[interface] = implementation()
    def register_transient(self, interface: type, implementation: type):
        self._services[interface] = lambda: implementation()
    def resolve(self, interface: type):
        svc = self._services[interface]
        return svc() if callable(svc) else svc

# wiring
container = Container()
container.register_singleton(TemplateRepository, FileTemplateRepository)
container.register_transient(GenerateProjectUseCase, GenerateProjectUseCase)
use_case = container.resolve(GenerateProjectUseCase)
```

**Trade-offs**: centralizes wiring; lets tests inject fakes. A hand-rolled container
adds maintenance cost — prefer an established framework (`dependency-injector`,
`injector`) once wiring is non-trivial. For a small project, plain constructor
wiring beats any container.

---

## State Management Examples

### Immutable state object

```python
@dataclass(frozen=True)
class ProjectState:
    project_id: str
    name: str
    template: str
    variables: dict[str, Any]
    status: ProjectStatus
    created_at: datetime

    def with_status(self, new_status: ProjectStatus) -> 'ProjectState':
        return replace(self, status=new_status)   # new object, never in-place
```

> **Deep-immutability caveat**: the `variables: dict` field above is still mutable
> (`state.variables["x"] = 1` succeeds despite `frozen=True`). For true immutability
> use `MappingProxyType` / tuples for collection fields.

### JSON persistence (implemented in infrastructure, behind a domain interface)

```python
# example layout: infrastructure/state/json_state_manager.py
class JsonStateManager(StateManager):   # StateManager interface declared in domain
    def __init__(self, state_file: Path):
        self.state_file = state_file
    def save(self, state: ProjectState) -> None:
        self.state_file.write_text(json.dumps(self._to_dict(state), indent=2))
    def load(self) -> ProjectState:
        if not self.state_file.exists():
            return ProjectState.initial()
        return self._from_dict(json.loads(self.state_file.read_text()))
```

Example transition sequence: `INITIALIZING → READY → GENERATING → COMPLETED | ERROR`,
with `ERROR → READY` after a fix. Persist snapshots + checkpoint metadata (id,
timestamp, description) so history can be reconstructed.
