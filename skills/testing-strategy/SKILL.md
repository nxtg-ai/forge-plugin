---
name: Testing Strategy
description: Guides comprehensive testing strategy including unit, integration, and end-to-end test patterns.
---

# NXTG-Forge Testing Strategy

## Overview

NXTG-Forge follows a comprehensive testing strategy designed to ensure reliability, maintainability, and confidence in the codebase. This document defines our testing philosophy, test pyramid structure, and best practices.

## Testing Philosophy

### Core Principles

1. **Tests Are First-Class Citizens**: Tests are as important as production code
2. **Test Behavior, Not Implementation**: Focus on what code does, not how
3. **Fast Feedback Loops**: Tests should run quickly and fail fast
4. **Confidence Through Coverage**: 86% target, 80% minimum
5. **Clear and Maintainable**: Tests should be easy to read and update

### Quality Targets

- **Coverage Target**: 86%
- **Coverage Minimum**: 80% (enforced by CI)
- **Test Execution Time**: < 3 minutes for full suite
- **Failure Rate**: < 1% flakiness
- **Maintenance Burden**: < 10% of development time

---

## Test Pyramid

NXTG-Forge follows the testing pyramid pattern:

```
        /\
       /  \
      / E2E\       10% - End-to-End Tests
     /______\
    /        \
   /Integration\ 20% - Integration Tests
  /____________\
 /              \
/   Unit Tests   \  70% - Unit Tests
/__________________\
```

### Distribution Guidelines

- **70% Unit Tests**: Fast, isolated, test individual components
- **20% Integration Tests**: Test component interactions
- **10% E2E Tests**: Test complete workflows

---

## Unit Testing

### Purpose

Unit tests verify individual components in isolation. They should be:

- **Fast**: < 100ms per test
- **Isolated**: No external dependencies
- **Deterministic**: Same result every time
- **Focused**: One aspect per test

### Structure (AAA Pattern)

```python
def test_generate_project_creates_directory_structure():
    """Test project generation creates correct directories."""
    # Arrange - Set up test data and dependencies
    generator = FileGenerator(temp_dir)
    config = ProjectConfig(
        name="test-project",
        language="python",
        framework="fastapi"
    )

    # Act - Execute the behavior being tested
    result = generator.generate(config)

    # Assert - Verify expected outcomes
    assert result.success is True
    assert (temp_dir / "src" / "domain").exists()
    assert (temp_dir / "tests" / "unit").exists()
    assert len(result.created_files) == 15
```

### Naming Convention

```python
# Pattern: test_<method>_<scenario>_<expected>

# Good examples
def test_create_checkpoint_with_valid_description_succeeds():
    """Test checkpoint creation with valid description."""

def test_load_config_with_missing_file_raises_error():
    """Test config loading with missing file raises ConfigError."""

def test_assign_agent_with_architecture_keywords_returns_lead_architect():
    """Test agent assignment for architecture-related tasks."""

# Avoid
def test_checkpoint():  # Too vague
def test_config_1():    # Unclear purpose
def test_works():       # Not descriptive
```

### What to Test

**DO Test**:

- Public API behavior
- Edge cases and boundary conditions
- Error handling and exceptions
- State transitions
- Business logic

**DON'T Test**:

- Private methods directly (test through public API)
- Framework internals
- Third-party libraries
- Trivial getters/setters

### Mocking Strategy

```python
# Good - Mock external dependencies
def test_generate_project_writes_files(mocker):
    """Test project generation writes files."""
    mock_write = mocker.patch("pathlib.Path.write_text")

    generator = FileGenerator(temp_dir)
    generator.generate(config)

    assert mock_write.call_count == 10
    mock_write.assert_any_call("# README\n...")

# Good - Use test doubles for complex dependencies
class MockRepository:
    """Test double for template repository."""
    def __init__(self):
        self.templates = {}

    def find_by_name(self, name: str) -> Template:
        return self.templates.get(name)

# Avoid - Mocking internal methods
def test_process_template(mocker):
    """Don't mock internal methods."""
    mocker.patch.object(processor, "_internal_method")  # Bad!
    # Test behavior instead
```

### Fixtures

```python
# conftest.py - Shared fixtures

@pytest.fixture
def temp_project_dir(tmp_path: Path) -> Path:
    """Create temporary project directory."""
    claude_dir = tmp_path / ".claude"
    claude_dir.mkdir()
    (claude_dir / "templates").mkdir()
    (claude_dir / "skills").mkdir()
    return tmp_path

@pytest.fixture
def sample_template() -> Template:
    """Create sample template for testing."""
    return Template(
        name="fastapi-basic",
        version="1.0.0",
        files=[
            TemplateFile(path="main.py", content="..."),
            TemplateFile(path="tests/test_main.py", content="...")
        ],
        variables={"project_name": "MyProject"}
    )

@pytest.fixture
def orchestrator(temp_project_dir) -> AgentOrchestrator:
    """Create orchestrator instance."""
    return AgentOrchestrator(temp_project_dir)
```

### Parametrization

```python
# Test multiple scenarios with same test
@pytest.mark.parametrize("input,expected", [
    ("HelloWorld", "hello_world"),
    ("testCamelCase", "test_camel_case"),
    ("already_snake", "already_snake"),
    ("MixedCase_example", "mixed_case_example"),
])
def test_snake_case_conversion(input, expected):
    """Test snake_case conversion for various inputs."""
    assert snake_case(input) == expected

# Test error conditions
@pytest.mark.parametrize("invalid_input", [
    None,
    "",
    123,
    ["not", "a", "string"],
])
def test_snake_case_with_invalid_input_raises_error(invalid_input):
    """Test snake_case raises TypeError for invalid input."""
    with pytest.raises(TypeError):
        snake_case(invalid_input)
```

---

## Integration Testing

### Purpose

Integration tests verify that components work correctly together. They test:

- Module interactions
- Database operations
- File system operations
- Configuration loading

### Structure

```python
def test_full_project_generation_workflow(temp_project_dir):
    """Test complete project generation workflow."""
    # Arrange - Create real components (not mocks)
    state_manager = StateManager(temp_project_dir)
    file_generator = FileGenerator(temp_project_dir)
    orchestrator = AgentOrchestrator(temp_project_dir)

    spec = """
    # TestProject
    **Type:** web-app
    **Language:** Python
    **Framework:** FastAPI
    """

    # Act - Execute workflow
    config = file_generator._parse_spec(spec)
    files = file_generator.generate_from_spec(spec)
    state_manager.update_state({"project": {"name": "TestProject"}})
    task = orchestrator.create_task("Implement user auth")

    # Assert - Verify end-to-end behavior
    assert len(files) > 0
    assert (temp_project_dir / "README.md").exists()
    assert state_manager.state["project"]["name"] == "TestProject"
    assert task.assigned_agent is not None
```

### Database Testing

```python
@pytest.fixture
def test_database():
    """Create test database."""
    db = create_test_database()
    yield db
    db.cleanup()

def test_repository_saves_and_retrieves_template(test_database):
    """Test template repository persistence."""
    repo = TemplateRepository(test_database)
    template = Template(name="test", version="1.0.0")

    # Save
    repo.save(template)

    # Retrieve
    retrieved = repo.find_by_name("test")
    assert retrieved.name == "test"
    assert retrieved.version == "1.0.0"
```

### File System Testing

```python
def test_checkpoint_creates_backup_files(temp_project_dir):
    """Test checkpoint creates backup files on disk."""
    state_manager = StateManager(temp_project_dir)

    # Create checkpoint
    checkpoint_id = state_manager.checkpoint("Test checkpoint")

    # Verify files created
    checkpoint_dir = temp_project_dir / ".claude" / "checkpoints"
    checkpoint_file = checkpoint_dir / f"checkpoint_{checkpoint_id}.json"

    assert checkpoint_file.exists()
    assert checkpoint_file.stat().st_size > 0

    # Verify content
    content = json.loads(checkpoint_file.read_text())
    assert content["version"] == "1.0.0"
```

---

## End-to-End Testing

### Purpose

E2E tests verify complete user workflows from start to finish. They:

- Test CLI commands
- Verify file generation
- Check state persistence
- Validate error handling

### Structure

```python
def test_new_project_workflow(tmp_path):
    """Test complete new project workflow."""
    # Simulate user creating new project
    os.chdir(tmp_path)

    # 1. Generate spec
    result = subprocess.run(
        ["forge", "spec", "generate", "--from-answers", "answers.json"],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert (tmp_path / "docs" / "PROJECT-SPEC.md").exists()

    # 2. Generate project
    result = subprocess.run(
        ["forge", "generate", "--spec", "docs/PROJECT-SPEC.md"],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert (tmp_path / "README.md").exists()
    assert (tmp_path / ".claude" / "state.json").exists()

    # 3. Check status
    result = subprocess.run(
        ["forge", "status", "--json"],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    status = json.loads(result.stdout)
    assert status["project"]["name"] is not None

    # 4. Create checkpoint
    result = subprocess.run(
        ["forge", "checkpoint", "Initial setup"],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "Checkpoint created" in result.stdout
```

### CLI Testing

```python
def test_cli_error_handling(temp_project_dir):
    """Test CLI handles errors gracefully."""
    os.chdir(temp_project_dir)

    # Test missing config
    result = subprocess.run(
        ["forge", "config", "show"],
        capture_output=True,
        text=True
    )
    assert result.returncode == 1
    assert "not found" in result.stdout.lower()

    # Test invalid command
    result = subprocess.run(
        ["forge", "invalid-command"],
        capture_output=True,
        text=True
    )
    assert result.returncode != 0
```

---

## Test Organization

### Directory Structure

```
tests/
├── conftest.py                  # Shared fixtures
├── unit/                        # Unit tests (70%)
│   ├── domain/
│   │   ├── test_template.py
│   │   └── test_project.py
│   ├── application/
│   │   └── test_use_cases.py
│   ├── infrastructure/
│   │   ├── test_repository.py
│   │   └── test_state_manager.py
│   ├── agents/
│   │   ├── test_orchestrator.py
│   │   └── test_dispatcher.py
│   ├── test_cli.py
│   └── test_file_generator.py
├── integration/                 # Integration tests (20%)
│   ├── test_project_generation.py
│   ├── test_checkpoint_workflow.py
│   └── test_agent_coordination.py
└── e2e/                         # End-to-end tests (10%)
    ├── test_new_project.py
    ├── test_feature_workflow.py
    └── test_recovery.py
```

### Test File Naming

- **Unit tests**: `test_<module>.py` (e.g., `test_orchestrator.py`)
- **Integration tests**: `test_<workflow>.py` (e.g., `test_project_generation.py`)
- **E2E tests**: `test_<scenario>.py` (e.g., `test_new_project.py`)

---

## Test Doubles

### Types of Test Doubles

1. **Dummy**: Passed but never used
2. **Stub**: Returns canned responses
3. **Spy**: Records calls for verification
4. **Mock**: Programmed with expectations
5. **Fake**: Working implementation (simpler than real)

### When to Use Each

```python
# Dummy - Parameter required but not used
def test_logger_initialization():
    logger = Logger(config=DummyConfig())  # Never accessed

# Stub - Simple canned responses
class StubRepository:
    def find_by_name(self, name: str) -> Template:
        return Template(name="stub", version="1.0.0")

# Spy - Verify interactions
class SpyNotifier:
    def __init__(self):
        self.calls = []

    def notify(self, message: str):
        self.calls.append(message)

def test_notifier_called():
    spy = SpyNotifier()
    service = UserService(notifier=spy)
    service.create_user("alice")
    assert len(spy.calls) == 1
    assert "alice" in spy.calls[0]

# Mock - Complex expectations
def test_repository_interaction(mocker):
    mock_repo = mocker.Mock()
    mock_repo.save.return_value = True
    mock_repo.find_by_name.return_value = None

    service = TemplateService(mock_repo)
    service.create_template("new-template")

    mock_repo.save.assert_called_once()

# Fake - Simplified implementation
class FakeDatabase:
    """In-memory database for testing."""
    def __init__(self):
        self.data = {}

    def save(self, key: str, value: Any):
        self.data[key] = value

    def load(self, key: str) -> Any:
        return self.data.get(key)
```

---

## Coverage Guidelines

### What Coverage Measures

Coverage tracks:

- **Line coverage**: Which lines executed
- **Branch coverage**: Which branches taken
- **Function coverage**: Which functions called

### Coverage Targets by Module

| Module Type | Target Coverage |
|-------------|-----------------|
| Domain Logic | 95%+ |
| Application Services | 90%+ |
| Infrastructure | 85%+ |
| CLI Commands | 80%+ |
| Utilities | 90%+ |

### Acceptable Low Coverage

Some code intentionally has lower coverage:

- **Error handling for rare conditions**: Hard to test
- **Defensive assertions**: Edge cases
- **Compatibility code**: Multiple Python versions
- **UI/formatting code**: Visual validation needed

### Measuring Coverage

```bash
# Run tests with coverage
pytest --cov=forge --cov-report=term-missing

# Generate HTML report
pytest --cov=forge --cov-report=html
open htmlcov/index.html

# Fail if coverage below threshold
pytest --cov=forge --cov-fail-under=80
```

---

## Async Testing

### Testing Async Code

```python
# Mark test as async
@pytest.mark.asyncio
async def test_async_handler_execution():
    """Test async handler execution."""
    async def async_handler(task: Task) -> TaskResult:
        await asyncio.sleep(0.01)  # Simulate async work
        return TaskResult(success=True)

    dispatcher = Dispatcher()
    task = Task(id="test", handler=async_handler)

    # Execute async code
    result = await dispatcher.execute(task)

    assert result.success is True

# Test concurrent execution
@pytest.mark.asyncio
async def test_concurrent_task_execution():
    """Test multiple tasks execute concurrently."""
    dispatcher = Dispatcher()

    tasks = [
        Task(id=f"task-{i}", handler=async_handler)
        for i in range(5)
    ]

    # Execute concurrently
    results = await asyncio.gather(*[
        dispatcher.execute(task) for task in tasks
    ])

    assert len(results) == 5
    assert all(r.success for r in results)
```

---

## Performance Testing

### Test Execution Time

```python
def test_fast_execution():
    """Test method executes quickly."""
    start = time.time()

    result = fast_operation()

    duration = time.time() - start
    assert duration < 0.1  # Must complete in < 100ms

# Use pytest-benchmark for detailed metrics
def test_performance(benchmark):
    """Benchmark critical operation."""
    result = benchmark(critical_operation, arg1, arg2)
    assert result.success
```

### Load Testing

```python
def test_handles_multiple_concurrent_requests():
    """Test system handles concurrent load."""
    orchestrator = AgentOrchestrator()

    # Create many tasks
    tasks = [
        orchestrator.create_task(f"Task {i}")
        for i in range(100)
    ]

    # Should handle without errors
    assert len(orchestrator.active_tasks) == 100
    assert orchestrator.get_queue_size() < 150  # Reasonable queue
```

---

## Test Data Management

### Test Data Builders

```python
class TemplateBuilder:
    """Builder for creating test templates."""

    def __init__(self):
        self._name = "default-template"
        self._version = "1.0.0"
        self._files = []

    def with_name(self, name: str) -> "TemplateBuilder":
        self._name = name
        return self

    def with_version(self, version: str) -> "TemplateBuilder":
        self._version = version
        return self

    def with_file(self, path: str, content: str) -> "TemplateBuilder":
        self._files.append(TemplateFile(path=path, content=content))
        return self

    def build(self) -> Template:
        return Template(
            name=self._name,
            version=self._version,
            files=self._files
        )

# Usage
def test_template_processing():
    template = (
        TemplateBuilder()
        .with_name("api-template")
        .with_version("2.0.0")
        .with_file("main.py", "print('hello')")
        .build()
    )

    result = processor.process(template)
    assert result.success
```

### Fixture Factories

```python
@pytest.fixture
def make_task():
    """Factory for creating tasks."""
    def _make_task(description: str = "Test task", **kwargs):
        return Task(
            id=kwargs.get("id", str(uuid.uuid4())),
            description=description,
            type=kwargs.get("type", "feature"),
            priority=kwargs.get("priority", "medium")
        )
    return _make_task

# Usage
def test_task_processing(make_task):
    task1 = make_task("Implement auth")
    task2 = make_task("Add tests", priority="high")

    assert task1.priority == "medium"
    assert task2.priority == "high"
```

---

## Continuous Integration

### CI Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -e ".[dev]"

      - name: Run linters
        run: |
          black --check forge/ tests/
          ruff check forge/ tests/
          mypy forge/

      - name: Run tests
        run: |
          pytest -v \
            --cov=forge \
            --cov-report=term-missing \
            --cov-report=xml \
            --cov-fail-under=80

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          file: ./coverage.xml
```

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        args: [--line-length=100]

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: [--fix]

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]

  - repo: local
    hooks:
      - id: pytest
        name: pytest
        entry: pytest
        language: system
        pass_filenames: false
        args: [--cov=forge, --cov-fail-under=80]
```

---

## Best Practices Summary

### DO

✅ **Write tests first** (TDD when appropriate)
✅ **Test one thing per test**
✅ **Use descriptive test names**
✅ **Follow AAA pattern** (Arrange, Act, Assert)
✅ **Keep tests independent**
✅ **Use fixtures for setup**
✅ **Mock external dependencies**
✅ **Aim for fast execution**
✅ **Maintain tests like production code**
✅ **Review test coverage regularly**

### DON'T

❌ **Test implementation details**
❌ **Mock internal methods**
❌ **Use Thread.sleep() for timing**
❌ **Write flaky tests**
❌ **Skip tests temporarily**
❌ **Test framework code**
❌ **Ignore test failures**
❌ **Write tests without assertions**
❌ **Couple tests together**
❌ **Leave commented-out tests**

---

## Quick Reference

### Running Tests

```bash
# All tests
pytest

# Specific file
pytest tests/unit/test_orchestrator.py

# Specific test
pytest tests/unit/test_orchestrator.py::test_assign_agent

# With coverage
pytest --cov=forge --cov-report=term-missing

# Verbose output
pytest -v

# Stop on first failure
pytest -x

# Run only failed tests
pytest --lf

# Run modified tests
pytest --testmon
```

### pytest Markers

```python
@pytest.mark.slow          # Long-running test
@pytest.mark.integration   # Integration test
@pytest.mark.e2e          # End-to-end test
@pytest.mark.asyncio      # Async test
@pytest.mark.skip         # Skip test
@pytest.mark.skipif       # Conditional skip
@pytest.mark.xfail        # Expected to fail
@pytest.mark.parametrize  # Multiple scenarios
```

---

**Last Updated**: 2026-01-06
**Version**: 1.0.0
**Target Coverage**: 86%
**Current Coverage**: 86.06%
