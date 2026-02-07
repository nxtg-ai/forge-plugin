---
name: Domain Knowledge
description: Provides project-specific domain knowledge and business logic context.
---

# NXTG-Forge Domain Knowledge

## Purpose and Vision

NXTG-Forge is a **self-deploying AI development infrastructure** that transforms how developers build software with Claude Code. It's not just a code generator—it's an intelligent scaffolding system that understands project context, orchestrates specialized AI agents, and maintains state throughout the development lifecycle.

### Core Vision

**"From Specification to Production in Minutes, Not Days"**

NXTG-Forge bridges the gap between idea and implementation by:

1. Generating production-ready project structures from natural language specifications
2. Orchestrating specialized AI agents for different development tasks
3. Maintaining project state and enabling recovery from interruptions
4. Providing intelligent gap analysis and improvement recommendations
5. Integrating seamlessly with Claude Code's workflow

### Problem Statement

Traditional scaffolding tools fall short:

- **Static templates**: One-size-fits-all, no adaptation to project needs
- **No context awareness**: Can't learn from your project or adapt over time
- **Manual orchestration**: Developers must coordinate different tools manually
- **No state management**: Can't resume interrupted work or track progress
- **Limited intelligence**: No understanding of project health or quality gaps

NXTG-Forge solves these problems by bringing AI-native intelligence to project scaffolding.

---

## Core Concepts

### 1. Project Specification

A **natural language description** of what you want to build. Example:

```markdown
# E-Commerce Platform - Project Specification

**Type:** Web Application
**Language:** Python
**Framework:** FastAPI

## Core Features
- User authentication and authorization
- Product catalog with search
- Shopping cart and checkout
- Payment processing (Stripe)
- Order management

## Technical Requirements
- PostgreSQL database
- Redis for caching
- RESTful API design
- JWT authentication
```

NXTG-Forge parses this specification and generates appropriate project structures.

### 2. Agent Orchestration

Instead of a single monolithic AI, NXTG-Forge uses **specialized agents**:

- **Lead Architect**: System design, architectural decisions, patterns
- **Backend Master**: API design, database schema, business logic
- **CLI Artisan**: Command-line interfaces, user experience
- **Platform Builder**: Infrastructure, deployment, CI/CD
- **Integration Specialist**: External APIs, webhooks, MCP servers
- **QA Sentinel**: Testing, quality assurance, code review

Each agent has domain expertise and works on tasks matching their capabilities.

### 3. State Management

NXTG-Forge maintains **project state** in `.claude/state.json`:

```json
{
  "version": "1.0.0",
  "project": {
    "name": "my-app",
    "type": "web-app",
    "forge_version": "0.3.0"
  },
  "development": {
    "current_phase": "implementation",
    "features": {
      "completed": [...],
      "in_progress": [...],
      "planned": [...]
    }
  },
  "agents": {
    "active": ["backend-master"],
    "available": [...]
  }
}
```

This enables:

- **Session recovery**: Resume work after interruptions
- **Progress tracking**: Know exactly what's done and what's pending
- **Checkpoint/restore**: Save and restore project states
- **Health monitoring**: Track project quality metrics

### 4. Clean Architecture

All generated code follows **Clean Architecture principles**:

```
Domain Layer (Core Business Logic)
    ↓
Application Layer (Use Cases)
    ↓
Infrastructure Layer (External Interfaces)
    ↓
Interface Layer (UI/CLI/API)
```

**Dependency Rule**: Dependencies point inward. Inner layers never depend on outer layers.

### 5. Gap Analysis

NXTG-Forge continuously analyzes your project for improvement opportunities:

- **Testing gaps**: Missing tests, low coverage
- **Architecture gaps**: Violations of Clean Architecture
- **Security gaps**: Vulnerabilities, hardcoded secrets
- **Documentation gaps**: Missing docstrings, outdated docs
- **Code quality gaps**: Linting issues, complexity

### 6. MCP Server Integration

**Model Context Protocol (MCP)** servers extend capabilities:

- **Database MCP**: PostgreSQL, MySQL, MongoDB integration
- **File System MCP**: Advanced file operations
- **Web Search MCP**: Research and discovery
- **GitHub MCP**: Repository operations

NXTG-Forge detects which MCP servers your project needs and configures them automatically.

---

## Key Workflows

### Workflow 1: New Project Generation

```bash
# 1. Generate specification (interactive or from template)
forge spec generate --interactive

# 2. Generate project structure
forge generate --spec docs/PROJECT-SPEC.md

# 3. Initialize state
forge status

# 4. Begin development with Claude Code
claude --project .
```

**What happens**:

1. Interactive questionnaire gathers requirements
2. Specification written to `docs/PROJECT-SPEC.md`
3. FileGenerator creates project structure (directories, boilerplate)
4. StateManager initializes `.claude/state.json`
5. Ready for Claude Code to begin implementation

### Workflow 2: Feature Development

```bash
# 1. Check current status
forge status

# 2. Plan feature with architect agent
# (Claude Code uses agent orchestrator)

# 3. Implement with appropriate agents
# Backend Master → API endpoints
# QA Sentinel → Tests
# Platform Builder → Deployment

# 4. Create checkpoint
forge checkpoint "User authentication complete"

# 5. Check quality
forge gap-analysis
forge health
```

**Agent Handoff Example**:

```
Lead Architect designs the authentication system
    ↓
Backend Master implements the API and database schema
    ↓
QA Sentinel writes tests
    ↓
Platform Builder configures deployment
```

### Workflow 3: Recovery from Interruption

```bash
# 1. Check recovery info
forge recovery

# Output:
# ⚠️  Recovery Information
#
# Interrupted Session:
#   ID: abc123
#   Agent: backend-master
#   Task: Implement user authentication
#   Started: 2026-01-06T10:30:00Z
#
# Last Checkpoint:
#   ID: 20260106_093000
#   Description: Database schema complete
#   Time: 2026-01-06T09:30:00Z

# 2. Resume or restore
forge restore 20260106_093000  # Restore to last checkpoint
# OR
claude --resume abc123  # Resume interrupted session
```

### Workflow 4: Quality Improvement

```bash
# 1. Analyze gaps
forge gap-analysis

# 2. Review recommendations
cat docs/GAP-ANALYSIS.md

# 3. Check health score
forge health --detail

# 4. Address high-priority gaps
# Use Claude Code to implement improvements

# 5. Verify improvements
forge health
```

---

## Architecture Overview

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                       Claude Code CLI                        │
│  (User interacts via natural language and commands)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   NXTG-Forge CLI (forge)                    │
│  status | checkpoint | spec | generate | gap-analysis       │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ↓                 ↓                 ↓
    ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
    │ StateManager  │ │ Orchestrator │ │ GapAnalyzer  │
    │               │ │              │ │              │
    │ .claude/      │ │ Agent Pool   │ │ Improvement  │
    │ state.json    │ │ Dispatcher   │ │ Recommenda-  │
    │               │ │              │ │ tions        │
    └───────────────┘ └──────────────┘ └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ↓
            ┌─────────────────────────────────────┐
            │          Domain Layer               │
            │  Templates | Projects | Features   │
            └─────────────────────────────────────┘
```

### Data Flow

1. **User Input** → Specification (natural language)
2. **SpecGenerator** → Structured PROJECT-SPEC.md
3. **FileGenerator** → Project files and directories
4. **StateManager** → Initialize/update state.json
5. **Orchestrator** → Assign tasks to agents
6. **Agents** → Execute specialized work
7. **GapAnalyzer** → Identify improvements
8. **Hooks** → Validate and track changes

### Directory Structure

```
project-root/
├── .claude/                    # Claude Code infrastructure
│   ├── config.json            # Configuration (Phase 1)
│   ├── state.json             # Project state
│   ├── skills/                # Skills documentation
│   │   ├── architecture.md
│   │   ├── coding-standards.md
│   │   ├── domain-knowledge.md
│   │   ├── testing-strategy.md
│   │   ├── workflows/
│   │   └── agents/
│   ├── hooks/                 # Lifecycle hooks
│   │   ├── lib.sh
│   │   ├── pre-task.sh
│   │   ├── post-task.sh
│   │   ├── on-error.sh
│   │   └── on-file-change.sh
│   ├── prompts/               # Reusable prompts
│   ├── commands/              # Custom slash commands
│   ├── templates/             # Project templates
│   ├── checkpoints/           # State checkpoints
│   └── backups/               # State backups
├── forge/                     # NXTG-Forge source
│   ├── domain/                # Domain layer
│   ├── application/           # Application layer
│   ├── infrastructure/        # Infrastructure layer
│   ├── agents/                # Agent system
│   └── cli.py                 # CLI interface
├── tests/                     # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                      # Documentation
│   ├── PROJECT-SPEC.md
│   ├── GAP-ANALYSIS.md
│   └── ARCHITECTURE.md
├── pyproject.toml             # Python project config
└── README.md                  # Project overview
```

---

## Value Proposition

### For Developers

**Speed**: Generate production-ready projects in minutes

- No more copying boilerplate from old projects
- No more manual setup of testing, linting, CI/CD
- Instant best-practice structure

**Quality**: Built-in best practices

- Clean Architecture from day one
- 86% test coverage target
- Type-safe, linted, formatted code
- Security considerations baked in

**Intelligence**: AI-powered assistance

- Specialized agents for different tasks
- Automatic gap detection
- Intelligent recommendations
- Context-aware code generation

**Resilience**: Never lose progress

- State management and checkpoints
- Session recovery
- Automatic backups
- Complete audit trail

### For Teams

**Consistency**: Every project follows same standards

- Unified architecture patterns
- Consistent code style
- Standardized testing approach
- Common tooling

**Onboarding**: New team members productive immediately

- Self-documenting project structure
- Clear architecture documentation
- Established workflows
- Comprehensive skills documentation

**Visibility**: Know project health at a glance

- Health score metrics
- Gap analysis reports
- Progress tracking
- Quality dashboards

---

## Terminology

### Agent

A specialized AI assistant with domain expertise (e.g., Backend Master, QA Sentinel)

### Checkpoint

A saved snapshot of project state that can be restored later

### Clean Architecture

Software design approach with four layers and inward-pointing dependencies

### Domain Layer

Core business logic, independent of frameworks and external concerns

### Gap Analysis

Automated identification of improvement opportunities in a project

### Health Score

Numerical metric (0-100) representing overall project quality

### Hook

Shell script that executes at specific lifecycle events (pre-task, post-task, etc.)

### MCP Server

Model Context Protocol server that extends Claude's capabilities

### Orchestrator

Component that assigns tasks to appropriate agents based on capabilities

### Project Specification

Natural language description of what to build (PROJECT-SPEC.md)

### Skill

Markdown document providing context and knowledge to Claude

### State

JSON representation of current project status (.claude/state.json)

### Template

Jinja2 template file for generating project boilerplate

### Use Case

Application layer component orchestrating domain logic for specific task

---

## Common Use Cases

### Use Case 1: Rapid Prototyping

**Scenario**: You have an idea and want to validate it quickly

**Solution**:

1. Describe idea in specification
2. Generate project with `forge generate`
3. Claude Code implements core features
4. Deploy prototype in hours, not days

### Use Case 2: Legacy Modernization

**Scenario**: Migrating old codebase to modern architecture

**Solution**:

1. Generate new project with Clean Architecture
2. Use gap analysis to identify migration priorities
3. Incrementally move code to new structure
4. Agents help refactor and write tests

### Use Case 3: Team Standardization

**Scenario**: Multiple teams building services inconsistently

**Solution**:

1. Define organization standards in config.json and skills
2. All teams use NXTG-Forge for new projects
3. Consistent architecture, testing, tooling
4. Easy code reviews and knowledge sharing

### Use Case 4: Learning Best Practices

**Scenario**: Junior developers learning software architecture

**Solution**:

1. Generate project and study the structure
2. Read skills documentation (architecture, coding standards)
3. See best practices in action
4. Learn from agent-generated code

---

## Integration with Claude Code

### How NXTG-Forge Enhances Claude Code

**Before NXTG-Forge**:

- Claude starts with blank slate every time
- No memory of project structure or decisions
- Manual coordination of different tasks
- No quality tracking

**With NXTG-Forge**:

- Claude loads project context from skills
- State.json provides memory across sessions
- Agents automatically handle specialized tasks
- Gap analysis guides improvements
- Hooks ensure quality at every step

### Workflow Integration

```bash
# Initialize with NXTG-Forge
forge spec generate --interactive
forge generate --spec docs/PROJECT-SPEC.md

# Develop with Claude Code
claude --project .

# Claude Code automatically:
# - Loads skills from .claude/skills/
# - Reads config from .claude/config.json
# - Updates state in .claude/state.json
# - Triggers hooks on file changes
# - Uses orchestrator for agent selection

# Check progress
forge status
forge health
forge gap-analysis
```

### Skills Provide Context

When Claude Code runs in a NXTG-Forge project:

1. **Architecture skill** → Understands Clean Architecture layers
2. **Coding standards skill** → Follows project conventions
3. **Domain knowledge skill** → Knows what project does
4. **Testing strategy skill** → Writes appropriate tests
5. **Agent skills** → Specialized knowledge for each agent

---

## Success Metrics

### Project Quality

- ✅ 86%+ test coverage
- ✅ 0 linting errors
- ✅ 0 type errors
- ✅ 90+ health score

### Developer Productivity

- ✅ New project setup: < 5 minutes
- ✅ Feature implementation: Hours, not days
- ✅ Code review time: 50% reduction
- ✅ Bug count: 40% reduction

### Team Consistency

- ✅ 100% projects follow Clean Architecture
- ✅ 100% projects have tests
- ✅ 100% projects have documentation
- ✅ 0% deviation from standards

---

## Future Roadmap

### Phase 2 (Current): Skills & Documentation

- ✅ Domain knowledge
- Testing strategy
- Workflow documentation
- Agent-specific skills

### Phase 3: Workflow Automation

- Reusable prompt templates
- TDD workflow automation
- Automated refactoring
- Code review automation

### Phase 4: Advanced Features

- Multi-agent parallel execution
- Learning from past projects
- Template marketplace
- Cloud integration

### Phase 5+: Vision

- Real-time collaboration between agents
- Automatic dependency updates
- Security vulnerability patching
- Performance optimization suggestions
- Cost optimization for cloud deployments

---

---

## Lessons Learned (Living Knowledge Base)

This section captures institutional knowledge from real debugging sessions. These patterns are also implemented as hooks and skills.

### 2026-01-31: Multi-Device Development Access

**Issue**: API calls fail from mobile/tablet/other PCs with CORS errors
**Root Cause**: `.env` with `VITE_API_URL=http://localhost:5051/api` overrides dynamic URL detection
**Solution**: Comment out hardcoded localhost URLs, use relative URLs + Vite proxy
**Artifacts Created**:
- `.claude/skills/dev-environment-patterns.md` - Full pattern documentation
- `.claude/hooks/env-validator.md` - Proactive validation hook
- `docs/GETTING-STARTED.md` - User troubleshooting section

This demonstrates the intelligence loop: **Problem → Debug → Document → Automate Prevention**

---

**Last Updated**: 2026-01-31
**Version**: 1.1.0
**Status**: Living Document
