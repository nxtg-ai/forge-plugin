---
name: Core NXTG-Forge
description: Provides NXTG-Forge platform knowledge including agent system, governance, and plugin architecture.
---

# NXTG-Forge System Overview

## What is NXTG-Forge?

NXTG-Forge is a **Self-Deploying AI Development Infrastructure** that enables Claude Code to build production-ready applications from scratch with zero-context recovery capabilities.

**Core Philosophy:**

- **Zero-Context Recovery**: Resume work seamlessly after interruptions
- **State-Driven Development**: All project state tracked in `.claude/state.json`
- **Agent Orchestration**: Specialized AI agents for different development tasks
- **MCP Integration**: Automatic detection and configuration of needed services
- **Template-Driven**: Generate consistent, high-quality code from templates

## Architecture

### Directory Structure

```
project/
├── .claude/
│   ├── state.json              # CRITICAL: Current project state
│   ├── settings.json           # Claude Code + MCP configuration
│   ├── commands/               # Custom slash commands
│   ├── skills/                 # Agent expertise definitions
│   ├── templates/              # File generation templates
│   └── checkpoints/            # State snapshots
│
├── src/                        # Application source code
├── tests/                      # Test suites
├── docs/                       # Documentation
└── forge/                      # NXTG-Forge tools (if installed locally)
```

### Key Concepts

#### 1. State Management

**state.json** is the single source of truth for project status:

```json
{
  "project": {
    "name": "my-app",
    "type": "web-app",
    "forge_version": "1.0.0"
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
    "available": ["lead-architect", "qa-sentinel", ...]
  },
  "quality": {
    "tests": {"unit": {"coverage": 85}},
    "linting": {"passing": true}
  }
}
```

**Update state.json** after every significant change!

#### 2. Agent System

NXTG-Forge uses specialized agents:

- **Lead Architect**: System design, architecture decisions
- **Backend Master**: API implementation, database, business logic
- **CLI Artisan**: Command-line interface design and implementation
- **Platform Builder**: Infrastructure, deployment, CI/CD
- **Integration Specialist**: External APIs, MCP servers, webhooks
- **QA Sentinel**: Testing, quality assurance, code review

**Agent Coordination:**

1. Lead Architect designs the feature
2. Specialized agents implement their parts
3. QA Sentinel validates everything
4. State updated to reflect progress

#### 3. Checkpoints

Create checkpoints at milestones:

```bash
forge checkpoint "User authentication complete"
```

Checkpoints enable:

- Time-travel debugging
- Safe experimentation
- Easy rollback
- Zero-context recovery

#### 4. MCP Auto-Detection

NXTG-Forge automatically detects needed MCP servers:

```bash
forge mcp detect
# Scans project for:
# - GitHub integration (from .git/config)
# - Database connections (from dependencies)
# - Payment providers (Stripe, etc.)
# - Communication tools (Slack, etc.)
```

## Workflows

### Starting a New Project

```bash
# Option 1: Interactive
forge init --interactive

# Option 2: Command-line
forge init my-app --framework fastapi --template standard

# Option 3: From spec
forge spec generate --interactive
forge generate --spec docs/PROJECT-SPEC.md
```

### Adding a New Feature

1. **Plan** (as Lead Architect):

   ```
   - Design domain models
   - Define use cases
   - Specify API endpoints
   - Update architecture docs
   ```

2. **Implement** (as Backend Master):

   ```
   - Create domain entities
   - Implement use cases
   - Build API endpoints
   - Write unit tests
   ```

3. **Test** (as QA Sentinel):

   ```
   - Verify test coverage >= 85%
   - Run integration tests
   - Perform code review
   - Update quality metrics
   ```

4. **Update State**:

   ```bash
   forge feature update "user-auth" --status completed --coverage 92
   ```

5. **Checkpoint**:

   ```bash
   forge checkpoint "User authentication feature complete"
   ```

### Recovering from Interruption

If Claude Code session is interrupted:

```bash
# Check recovery info
forge recovery

# Shows:
# - Last active session
# - In-progress features
# - Last checkpoint
# - Recovery commands
```

Then resume with context from state.json.

## Best Practices

### 1. Update State Frequently

```python
# ✅ GOOD - Update after each feature milestone
await state_manager.update_feature(
    feature_id="user-auth",
    status="completed",
    progress=100,
    coverage=92
)

# ❌ BAD - Only update at end of day
# State becomes stale, recovery is harder
```

### 2. Create Meaningful Checkpoints

```bash
# ✅ GOOD - Descriptive checkpoint
forge checkpoint "User auth: JWT implementation + tests complete (92% coverage)"

# ❌ BAD - Vague checkpoint
forge checkpoint "stuff"
```

### 3. Follow Agent Handoff Protocol

```markdown
# ✅ GOOD - Clear handoff
## Handoff: Lead Architect → Backend Master

**Domain Models:** See src/domain/entities/user.py
**Use Cases:** RegisterUser, LoginUser, RefreshToken
**API Endpoints:** POST /auth/register, POST /auth/login
**Database:** users table schema attached

# ❌ BAD - Unclear handoff
"Implement user stuff"
```

### 4. Maintain Test Coverage

```bash
# Check coverage
forge health --detail

# Minimum: 85% overall
# Critical paths: 100%
```

### 5. Use Templates Consistently

```bash
# Generate from templates
forge generate --spec docs/PROJECT-SPEC.md

# Creates consistent structure across all files
```

## Commands Reference

### Project Management

```bash
forge init [name]           # Initialize new project
forge status               # Show project status
forge health               # Calculate health score
```

### State Management

```bash
forge checkpoint "desc"    # Create state checkpoint
forge restore [id]         # Restore from checkpoint
forge recovery             # Show recovery info
```

### Specification

```bash
forge spec generate        # Generate project spec
forge spec validate FILE   # Validate spec file
```

### MCP Integration

```bash
forge mcp detect           # Auto-detect MCP servers
forge mcp list             # List configured servers
```

### Quality Analysis

```bash
forge gap-analysis         # Analyze improvement gaps
forge quality test         # Run test suite
forge quality lint         # Run linters
```

## Integration with Claude Code

### Slash Commands

Available in Claude Code:

```
/init               - Initialize project
/status             - Show status
/checkpoint "desc"  - Create checkpoint
/feature "name"     - Add feature
/gap-analysis       - Analyze gaps
```

### State-Driven Prompts

Always include state context:

```
Current state shows:
- Phase: implementation
- Active feature: user-authentication (75% complete)
- Test coverage: 82% (below 85% target)
- 2 in-progress features
- Last checkpoint: 2 hours ago

What should I work on next?
```

### Agent Invocation

Invoke specific agents:

```
@lead-architect: Design the payment processing architecture

@backend-master: Implement the RegisterUser use case

@qa-sentinel: Review test coverage for auth module
```

## Troubleshooting

### State Desync

If state.json becomes inconsistent:

```bash
# Verify state
forge status --json | jq .

# Create recovery checkpoint
forge checkpoint "Pre-recovery state"

# Manually fix state.json or restore
forge restore [checkpoint-id]
```

### Missing MCP Servers

If MCP servers aren't detected:

```bash
# Force detection
forge mcp detect --verbose

# Manual configuration
# Edit .claude/settings.json
```

### Test Coverage Below Target

```bash
# Identify untested code
forge quality coverage --missing

# Generate test templates
forge generate tests --for src/domain/
```

## Next Steps

1. **Read agent skills**: Understand each agent's role
2. **Review architecture.md**: Learn clean architecture patterns
3. **Check coding-standards.md**: Follow project conventions
4. **Study testing.md**: Write comprehensive tests

---

**Remember**: NXTG-Forge is your infrastructure. Use it to maintain project state, coordinate agents, and enable zero-context recovery. Always update state.json!
