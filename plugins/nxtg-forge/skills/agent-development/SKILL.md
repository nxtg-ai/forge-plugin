---
name: Agent Development
description: Guides creation and configuration of Claude Code agents with proper frontmatter and system prompts.
---

# Agent Development Guide

## Creating NXTG-Forge Agents

Agents are autonomous specialists that execute tasks within the NXTG-Forge orchestration system. This guide covers everything you need to create production-ready agents.

## Required Frontmatter

Every agent MUST have proper YAML frontmatter. Claude Code's canonical schema:

```yaml
---
name: agent-name          # REQUIRED: lowercase letters, numbers, hyphens only (max 64 chars)
description: |            # REQUIRED: When Claude should delegate here. Include <example> blocks.
  Use this agent when...

  <example>
  Context: User asks to do X.
  user: "Do X please"
  assistant: "I'll use agent-name to handle X."
  <commentary>
  Why this agent is the right choice.
  </commentary>
  </example>
model: sonnet             # Optional: sonnet | opus | haiku (default: inherit)
color: cyan               # Optional: purple | cyan | green | orange | blue | red
isolation: worktree       # Optional: worktree (for parallel file work without conflicts)
memory: project           # Optional: user | project | local (persistent cross-session memory)
skills: plugin-name:skill # Optional: preload specific skill (full content at startup)
tools: Read, Grep, Glob, Write, Edit, Bash, TodoWrite, Task  # Optional: tool allowlist
---
```

### Frontmatter Fields Explained

- **name** (REQUIRED): Lowercase letters, numbers, and hyphens only — e.g., `forge-builder`. NO uppercase.
- **description** (REQUIRED): When Claude should auto-delegate to this agent. Use `<example>` blocks for strong matching.
- **model** (optional): `sonnet` (default for most), `opus` (high-stakes decisions), `haiku` (fast/cheap tasks)
- **color** (optional): Valid values: `purple`, `cyan`, `green`, `orange`, `blue`, `red`
- **tools** (optional): Comma-separated allowlist. Omit `Task` for leaf workers (prevents sub-delegation).
- **isolation** (optional): `worktree` — gives the agent its own git branch for conflict-free parallel work
- **memory** (optional): `project` — persists `MEMORY.md` across sessions (checked into git); `user` — all projects
- **skills** (optional): Comma-separated skill names to preload (full content injected at startup)
- **disallowedTools** (optional): Tools to explicitly deny (denylist, complements `tools` allowlist)
- **permissionMode** (optional): `acceptEdits` for auto-accept file edits, `plan` for read-only exploration

## Agent Structure Template

```markdown
---
name: your-agent-name
description: |
  Use this agent when [specific scenario]. This includes: [use case 1], [use case 2].

  <example>
  Context: User wants to do X.
  user: "Do X"
  assistant: "I'll use your-agent-name to handle X."
  <commentary>
  X is exactly what your-agent-name specializes in.
  </commentary>
  </example>
model: sonnet
color: cyan
tools: Glob, Grep, Read, Write, Edit, Bash, TodoWrite
---

# 🎯 Agent Display Name

You are the **Agent Role** - brief tagline about your identity.

## 🎭 Your Identity

You are:
- **Role 1**: Description of this aspect
- **Role 2**: Description of this aspect
- **Role 3**: Description of this aspect

## 💫 Core Responsibilities

### 1. Primary Responsibility
- **Sub-task**: Details
- **Sub-task**: Details
- **Sub-task**: Details

### 2. Secondary Responsibility
- **Sub-task**: Details
- **Sub-task**: Details

### 3. Tertiary Responsibility
- **Sub-task**: Details
- **Sub-task**: Details

## 🚀 Execution Protocol

### Phase 1: Discovery (timing)
```
1. What you do first
2. Second step
3. Third step
```

### Phase 2: Planning (timing)
```
1. Planning step 1
2. Planning step 2
3. Planning step 3
```

### Phase 3: Execution (timing)
```
1. Execution step 1
2. Execution step 2
3. Execution step 3
```

### Phase 4: Validation (timing)
```
1. Validation step 1
2. Validation step 2
3. Validation step 3
```

## 🎯 Decision Framework

When making decisions, consider:

1. **Criterion 1**: What to evaluate
2. **Criterion 2**: What to evaluate
3. **Criterion 3**: What to evaluate
4. **Criterion 4**: What to evaluate

## 📊 Quality Gates

Before completing any task, verify:

- ✅ **Quality 1**: What to check
- ✅ **Quality 2**: What to check
- ✅ **Quality 3**: What to check
- ✅ **Quality 4**: What to check

## 🔥 Your Mantra

> "Inspiring quote that captures the agent's philosophy and approach to work"

Remember: One sentence summary of what makes this agent valuable.
```

## Best Practices

### 1. Clear Identity
- Define exactly what the agent does and doesn't do
- Use consistent personality and tone
- Make the agent's expertise domain obvious

### 2. Actionable Protocols
- Provide step-by-step execution phases
- Include timing estimates where relevant
- Make protocols concrete and specific

### 3. Decision Frameworks
- Give clear criteria for making choices
- Provide trade-off analysis guidance
- Include examples of decision-making

### 4. Quality Standards
- Define what "done" looks like
- List specific quality gates
- Include validation steps

### 5. Communication Style
- Use consistent emoji branding
- Maintain professional but engaging tone
- Be clear and concise

## Common Agent Types

### Specialist Agents
- Focus on one domain (e.g., QA, DevOps, Security)
- Deep expertise in specific area
- Called for targeted tasks

### Coordinator Agents
- Orchestrate other agents
- Manage workflows and dependencies
- Handle complex multi-step processes

### Analysis Agents
- Examine code, architecture, or systems
- Provide recommendations
- Generate reports

## Agent Coordination

Agents can work:

### Sequentially
```
Agent A → Agent B → Agent C
```

### In Parallel
```
     ┌→ Agent A
Main ├→ Agent B
     └→ Agent C
```

### Iteratively
```
Agent A ←→ Agent B (feedback loop)
```

## Testing Your Agent

1. **Frontmatter Validation**: Ensure all required fields are present
2. **Scenario Testing**: Test with example queries from frontmatter
3. **Integration Testing**: Verify agent works with orchestrator
4. **Edge Cases**: Test boundary conditions and error handling

## Common Mistakes

❌ **Missing Required Frontmatter**: Agent won't load without all required fields
❌ **Vague Descriptions**: Be specific about what agent does
❌ **No Clear Protocols**: Agents need step-by-step execution guidance
❌ **Overlapping Responsibilities**: Each agent should have distinct role
❌ **No Quality Gates**: Always define what success looks like

## Example: Minimal Valid Agent

```markdown
---
name: code-reviewer
shortname: 👁️
avatar: 👁️
description: Reviews code for quality, bugs, and best practices
whenToUse:
  - Before committing code changes
  - During pull request review
  - When refactoring existing code
exampleQueries:
  - "Review this function for bugs"
  - "Check if this code follows best practices"
---

# 👁️ Code Reviewer

You are the **Code Quality Guardian** - ensuring every line meets high standards.

## Core Responsibilities

### Code Analysis
- Review code for bugs and logic errors
- Check adherence to coding standards
- Identify security vulnerabilities
- Suggest improvements

## Execution Protocol

1. Read the code thoroughly
2. Identify issues by category (bugs, style, security, performance)
3. Provide specific feedback with line numbers
4. Suggest concrete improvements
5. Rate overall code quality

## Quality Gates

- ✅ All identified issues documented
- ✅ Feedback is specific and actionable
- ✅ Suggestions include code examples
- ✅ Overall assessment provided
```

## Advanced Topics

### Agent Specialization
- Create agents for specific tech stacks
- Domain-specific expertise (e.g., ML, blockchain)
- Role-specific agents (e.g., tech lead, architect)

### Agent Communication
- Passing context between agents
- Sharing state and findings
- Coordinating complex workflows

### Performance Optimization
- Minimize agent overhead
- Parallel execution when possible
- Efficient context sharing

## Using Agent Templates

NXTG-Forge provides three agent templates in `/templates/`:

### 1. Specialist Agent Template
**File**: `templates/agent-specialist.template.md`
**Use for**: Domain-specific experts (QA, Security, Frontend, Backend, etc.)

```bash
# Copy template
cp templates/agent-specialist.template.md .claude/agents/your-agent.md

# Replace all {{PLACEHOLDERS}} with actual values
# Required replacements:
# - {{AGENT_NAME}}: e.g., "security-auditor"
# - {{EMOJI}}: e.g., "🔒"
# - {{DISPLAY_NAME}}: e.g., "Security Auditor"
# - {{ONE_LINE_DESCRIPTION}}: Clear description
# - {{SCENARIO_1/2/3}}: When to use scenarios
# - {{EXAMPLE_QUERY_1/2}}: Example user queries
# ... and all other placeholders
```

### 2. Coordinator Agent Template
**File**: `templates/agent-coordinator.template.md`
**Use for**: Orchestrators that manage other agents and complex workflows

```bash
# Copy template
cp templates/agent-coordinator.template.md .claude/agents/orchestrator.md

# Orchestrators have pre-filled orchestration patterns
# Just customize for your specific orchestration needs
```

### 3. Analyzer Agent Template
**File**: `templates/agent-analyzer.template.md`
**Use for**: Agents that analyze code, systems, or data and generate reports

```bash
# Copy template
cp templates/agent-analyzer.template.md .claude/agents/analyzer.md

# Replace {{ANALYSIS_DOMAIN}} with what you're analyzing
# e.g., "code quality", "security", "performance"
```

## Quick Start: Creating Your First Agent

1. **Choose a template** based on agent type
2. **Copy the template** to `.claude/agents/your-agent.md`
3. **Replace ALL {{PLACEHOLDERS}}** with actual values
4. **Test the agent** by invoking it with example queries
5. **Iterate** based on results

## Resources

- See existing agents in `.claude/agents/` for examples
- Orchestrator agent shows coordinator pattern
- Developer agent shows specialist pattern
- QA agent shows analysis pattern
- Templates in `templates/agent-*.template.md`

---

**Remember**: A well-designed agent is clear about its purpose, provides actionable protocols, and delivers consistent quality. Always use templates to ensure proper frontmatter!
