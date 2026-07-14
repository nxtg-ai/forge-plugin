---
name: Claude Code Framework
description: Deep knowledge of Claude Code architecture, capabilities, and extension patterns.
disable-model-invocation: true
---

# CLAUDE CODE FRAMEWORK — QUICK REFERENCE & DECISION GUIDE

**Version:** January 28, 2026 | Source: Official Anthropic Documentation + verified community resources

This is the index and quick reference. For full details see the Deep Reference section at the bottom.

---

## 1. CORE CAPABILITIES

Claude Code is an autonomous coding agent in your terminal:
- **Feature Implementation**: Plain English → working code (plan → implement → verify)
- **Bug Fixing**: Analyze codebase, identify issues, implement fixes
- **Codebase Navigation**: Maintain awareness of entire project structure
- **Task Automation**: Lint fixes, merge conflicts, release notes

```bash
cd your-project && claude      # Start interactive session
claude -p "prompt text"        # Single prompt mode (scriptable/pipeable)
claude --resume <session-id>   # Resume previous session
claude mcp serve               # Run Claude Code as an MCP server
```

---

## 2. MCP INTEGRATION (Quick Reference)

MCP is an open standard connecting Claude Code to external tools, databases, and APIs.

### Add Servers
```bash
claude mcp add --transport http <name> <url>           # HTTP remote
claude mcp add --transport sse <name> <url>            # Server-Sent Events
claude mcp add --transport stdio <name> -- <cmd>       # Local process
claude mcp add-from-claude-desktop                     # Import from Desktop
claude mcp add-json <name> '{"type":"http","url":"..."}' # From JSON
```

### Scope
| Scope | File | When |
|-------|------|------|
| `local` (default) | `~/.claude.json` | Current project only |
| `project` | `.mcp.json` | Team-shared, version controlled |
| `user` | `~/.claude.json` | All projects |

**Precedence:** Local > Project > User

### Manage
```bash
claude mcp list              # List all servers
claude mcp get <name>        # Get server details
claude mcp remove <name>     # Remove server
/mcp                         # Check status (in-session)
```

### In-Session Usage
```bash
@github:issue://123                 # Reference MCP resource
/mcp__github__list_prs              # Execute MCP prompt (no args)
/mcp__jira__create_issue "Bug" high # Execute with args
```

### Tuning
```bash
ENABLE_TOOL_SEARCH=auto:5 claude    # Dynamic tool loading (fires at 5% of context)
ENABLE_TOOL_SEARCH=true claude      # Always enabled
ENABLE_TOOL_SEARCH=false claude     # Load all tools upfront
export MAX_MCP_OUTPUT_TOKENS=50000  # Warning: 10k, default max: 25k tokens
```

> Full MCP details (transports, enterprise management, popular integrations): see reference.md

---

## 3. CLAUDE.MD — PROJECT MEMORY

Auto-loaded at session start. Commit to version control so the entire team benefits.

### What to Include
- Common bash commands for the project
- Core files and utility function locations
- Code style guidelines and patterns
- Testing instructions and coverage requirements
- Repository etiquette (branch naming, merge vs rebase)
- Developer environment setup (Python/Node versions, compiler requirements)
- Unexpected behaviors or project-specific warnings
- Database migration procedures
- Deployment processes

### Key Features
- Import other files: `@path/to/import` (relative to importing file)
- `CLAUDE.local.md` — auto-gitignored, private per-machine overrides
- Rules in `.claude/rules/*.md` — auto-loaded as project memory, support `paths` globs for scoping

```bash
> "Create a comprehensive CLAUDE.md for this project by analyzing the structure and conventions"
/memory                   # Open and edit memory files in your editor (in-session)
/init                     # Bootstrap a CLAUDE.md
```

---

## 4. SKILLS SYSTEM

Skills are context-aware capabilities that activate based on task context. Pure LLM reasoning — no embeddings or classifiers.

### How Skills Work
1. **Discovery**: Session start — scans available skills (~100 tokens of YAML metadata each)
2. **Contextual Activation**: Claude decides which to invoke based on task
3. **Dynamic Loading**: Full skill content loaded only when needed

### Skill Locations
- `~/.claude/skills/` — user-level
- `.claude/skills/` — project-level
- Plugin-provided skills (e.g., `plugins/nxtg-forge/skills/`)

### Key Frontmatter Fields
```yaml
name: skill-name
description: When this skill is relevant...     # Auto-trigger matching
disable-model-invocation: true                  # Manual-only (saves tokens in auto-load)
user-invocable: false                           # Hide from / menu but keep in context
argument-hint: "[args]"                         # Autocomplete hint shown in / menu
allowed-tools: Read, Grep                       # Permission bypass for listed tools
context: fork                                   # Run in isolated subagent context
model: sonnet                                   # Per-skill model override
```

> Full skill pattern templates (ux-brief, 3d-prototyper, a11y-gate, etc.): see patterns.md

---

## 5. PLAN MODE

Use plan mode for complex features before any implementation.

```bash
> "Build a task management API with user authentication"
# Claude generates: DB schema, endpoint structure, auth flow, testing strategy

> "Use TypeScript instead of JavaScript"   # Refine the plan
> "Looks good, proceed"                    # Approve → Claude implements
```

**Benefits:**
- Catch issues in planning phase, not during debugging
- Like working with a senior architect for alignment
- Discuss approach before execution

---

## 6. UNIX PHILOSOPHY — COMPOSABILITY

Claude Code embraces Unix principles — composable with standard tools:

```bash
tail -f app.log | claude -p "Slack me if you see any anomalies"
git diff main | claude -p "Review changes and generate a commit message"
cat metrics.csv | claude -p "Identify the slowest endpoints"
claude -p "Check test coverage and fail if below 80%"
find . -name "*.py" | xargs -I {} claude -p "Add type hints to {}"
```

---

## 7. SETTINGS & CONFIGURATION

### Hierarchy (highest → lowest precedence)
1. Organizational policies (managed settings — system-level `managed-mcp.json`)
2. `.claude/settings.json` — team conventions (project root, version controlled)
3. `.claude/settings.local.json` — machine-specific (project root, gitignored)
4. `~/.claude.json` — user-level global settings

### Key Settings Patterns
```json
{
  "permissions": {
    "deny": ["MCPSearch"],
    "disallowedTools": ["FileEdit"]
  },
  "env": {
    "MAX_MCP_OUTPUT_TOKENS": "50000",
    "ENABLE_TOOL_SEARCH": "auto:5"
  }
}
```

---

## 8. SUBAGENTS & PARALLEL EXECUTION

```bash
> "Spawn a subagent to write unit tests while you implement the API endpoints"
```

- **Desktop app**: Multiple sessions via git worktrees
- **Web interface**: Built-in parallel task execution
- **Agent definition**: `tools: Task` in frontmatter enables spawning subagents

**Key rule for forge-plugin agents:**
- Leaf workers (testing, security, docs, etc.): NO `Task` in tools list
- Orchestrators (planner, builder, guardian, detective): HAVE `Task`

---

## 9. MULTI-PLATFORM

| Platform | Notes |
|----------|-------|
| Terminal (CLI) | `claude` in any terminal — primary interface |
| Web (`claude.ai/code`) | No local setup, parallel tasks, built-in diff view |
| Desktop App | Visual diff, parallel sessions via git worktrees |
| VS Code Extension | Inline diffs, @-mentions, plan review UI |
| JetBrains Plugin | IntelliJ/PyCharm/WebStorm support |
| GitHub Actions | `anthropic/claude-code-action@v1` |
| Chrome Extension | Live browser debugging, Figma verification |

---

## QUICK REFERENCE CARD

```bash
# CLI
claude                          # Start in current dir
claude -p "prompt"              # Single prompt mode
claude --resume <id>            # Resume session
claude mcp list                 # Show MCP servers
claude mcp add <config>         # Add MCP server
claude mcp serve                # Run as MCP server

# In-Session
/mcp                            # Check MCP status
/brainstorm                     # Start planning session
/<tab>                          # Show all commands
@<file>                         # Reference file in prompt
@<mcp-resource>                 # Reference MCP resource

# Config Files
CLAUDE.md                       # Project context (auto-loaded)
.mcp.json                       # Project MCP servers (version controlled)
.claude/settings.json           # Team settings
.claude/settings.local.json     # Local overrides (gitignored)
~/.claude.json                  # User config

# Session Storage
~/.claude/sessions/<proj>/<id>.jsonl
```

---

## LIMITATIONS & BEST PRACTICES

- Use `.claudeignore` to exclude large irrelevant files from context
- Never commit API keys to `.mcp.json` — use environment variables
- Local stdio servers are faster than remote HTTP/SSE
- MCP Tool Search auto-manages context at 10% threshold (configurable)
- Audit third-party MCP servers before deployment
- Enterprise: use `managed-mcp.json` for exclusive policy control
- CLAUDE.md hard ceiling: **40k characters** (beyond this, Claude Code warns about performance)

---

## RESOURCES

| Resource | URL |
|----------|-----|
| Main Docs | https://code.claude.com/docs/en/overview |
| MCP Guide | https://code.claude.com/docs/en/mcp |
| Best Practices | https://www.anthropic.com/engineering/claude-code-best-practices |
| MCP Registry | https://github.com/modelcontextprotocol |
| MCP Market | https://mcpmarket.com |

---

## DEEP REFERENCE

For detailed API reference (MCP transports, enterprise config, popular integrations, settings schema, session management, authentication, platform integration, practical examples):
> Read /home/axw/projects/NXTG-Forge/forge-plugin/plugins/nxtg-forge/skills/claude-code-framework/reference.md

For implementation patterns (CLAUDE.md/rules/skills file templates, agent definitions, hook examples, skill pack templates):
> Read /home/axw/projects/NXTG-Forge/forge-plugin/plugins/nxtg-forge/skills/claude-code-framework/patterns.md
