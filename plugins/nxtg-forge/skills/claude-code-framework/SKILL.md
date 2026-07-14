---
name: Claude Code Framework
description: >
  Reference for how Claude Code itself works — CLI/headless modes, MCP integration,
  CLAUDE.md memory, skills, subagents, hooks, plan mode, settings precedence, and
  multi-platform surfaces. Use when authoring or debugging plugin components
  (commands/agents/skills/hooks), wiring MCP servers, deciding frontmatter fields,
  or answering "how does Claude Code X work" questions.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
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
- MCP Tool Search auto-manages context at the `auto:N` percent threshold you set (`auto:5` = 5%); keep this consistent with the `ENABLE_TOOL_SEARCH` value in §2
- Audit third-party MCP servers before deployment
- Enterprise: use `managed-mcp.json` for exclusive policy control
- CLAUDE.md hard ceiling: **40k characters** (beyond this, Claude Code warns about performance)

---

## GOTCHAS

Real, non-obvious traps when building for Claude Code — verified against this plugin's own source (`plugins/nxtg-forge/agents/*.md`, `servers/governance-mcp/`).

- **`disable-model-invocation: true` removes the description from context entirely.** It is not just "manual-only" — the skill's description is stripped from Claude's auto-load context, so the model cannot discover or auto-invoke it. This skill uses it; it is reachable only by explicit invocation. Do NOT set it on a skill you want Claude to route to automatically.
- **Agent `name` must be lowercase-hyphens, ≤64 chars — no uppercase, no underscores.** A display-cased name (e.g. `NXTG-CEO-LOOP`) silently fails discovery; the fix was renaming to `nxtg-ceo-loop`. The `name` is the wiring key, not a label.
- **`color` accepts ONLY: `purple | cyan | green | orange | blue | red`.** Any other value is ignored. All 22 agents in this plugin use exactly these six.
- **Leaf-worker agents must OMIT `Task` from `tools`; orchestrators must INCLUDE it.** `Task` is what lets an agent spawn subagents. Give it to a leaf (testing/security/docs) and you invite unintended recursion; withhold it from an orchestrator (planner/builder/guardian/detective/orchestrator) and delegation silently no-ops.
- **Invalid frontmatter fields are silently dropped, not errored.** Claude Code ignores `shortname`, `avatar`, `whenToUse` (camelCase), `exampleQueries`, `when_to_use` on agents — a typo'd field name looks accepted but does nothing. Verify field names against the valid set; never assume a field "took."
- **`model` in an agent/skill file overrides the session model** — an agent pinned to `sonnet` will NOT inherit an Opus session. Omit `model` to inherit; set it only when you deliberately want a fixed tier.
- **An MCP server entry file that runs `server.connect()` at import time breaks test harnesses.** `governance-mcp/index.mjs` guards it (`if (!process.env.FORGE_TEST_MODE) server.connect(...)`) and dropped its `#!/usr/bin/env node` shebang because the shebang blocked vitest's ESM transform. If you import an MCP entry module in tests, gate the transport connect behind an env flag.
- **MCP scope precedence is Local > Project > User** — a `local` server in `~/.claude.json` shadows a `project` server of the same name in `.mcp.json`. A "why is the team server not loading" bug is usually a same-named local override.
- **`allowed-tools` pre-approves; it does NOT restrict.** Listing tools only suppresses permission prompts for them — it never limits what the skill can reach. Use `permissions.deny` / `disallowedTools` in settings to actually restrict.
- **CLAUDE.md hard ceiling is ~40k characters.** Past it Claude Code warns about performance and effective recall degrades. Move deep detail into `.claude/rules/*.md` (path-scoped) or linked docs; keep CLAUDE.md as an orienting index.

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
