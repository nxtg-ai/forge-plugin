---
name: Claude Code Framework
description: Deep knowledge of Claude Code architecture, capabilities, and extension patterns.
---

# USED TO BUILD NXTG-FORGE - THIS IS OUR PROGRAMMING LANGUAGE

# CLAUDE CODE TUI SUPERPOWERS - COMPREHENSIVE CAPABILITY REFERENCE

**Document Version:** January 28, 2026  
**Purpose:** Complete reference for AI agents to understand Claude Code Terminal UI capabilities  
**Source:** Official Anthropic Documentation + Verified Third-Party Resources

***

## CORE CAPABILITIES

### 1. Agentic Code Development [github](https://github.com/joeyism/claude-code-config)
Claude Code operates as an autonomous coding agent in your terminal, capable of:

- **Feature Implementation**: Transforms plain English descriptions into working code with planning, implementation, and verification [github](https://github.com/joeyism/claude-code-config)
- **Bug Fixing**: Analyzes codebases, identifies issues, and implements fixes from error messages or descriptions [github](https://github.com/joeyism/claude-code-config)
- **Codebase Navigation**: Maintains awareness of entire project structure and answers questions about any codebase [github](https://github.com/joeyism/claude-code-config)
- **Task Automation**: Handles lint fixes, merge conflicts, release notes, and other tedious development tasks [github](https://github.com/joeyism/claude-code-config)

**Example Usage:**
```bash
# Start Claude Code in any project
cd your-project
claude

# Implement features naturally
> "Build a REST API endpoint for user authentication with JWT tokens"

# Debug issues
> "Fix the memory leak in the video processing pipeline"

# Automate CI tasks
claude -p "If there are new text strings, translate them into French and raise a PR"
```

***

## 2. MODEL CONTEXT PROTOCOL (MCP) INTEGRATION [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)

### What is MCP?
MCP is an open standard that connects Claude Code to external tools, databases, and APIs. This transforms Claude from a code generator into a complete development orchestrator. [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)

### MCP Server Types [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)

**HTTP Servers (Remote):**
```bash
# Connect to cloud services
claude mcp add --transport http notion https://mcp.notion.com/mcp

# With authentication
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

**SSE Servers (Server-Sent Events):**
```bash
# Real-time data streams
claude mcp add --transport sse asana https://mcp.asana.com/sse

# With API key
claude mcp add --transport sse private-api https://api.company.com/sse \
  --header "X-API-Key: your-key-here"
```

**Stdio Servers (Local Process):**
```bash
# Run local tools
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server

# Database connections
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://user:pass@host:5432/db"
```

### MCP Scope Hierarchy [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)

**Local Scope** (default): `~/.claude.json` - Personal configs for current project only
```bash
claude mcp add --scope local --transport http stripe https://mcp.stripe.com
```

**Project Scope**: `.mcp.json` in project root - Team-shared, version controlled
```bash
claude mcp add --scope project --transport http paypal https://mcp.paypal.com/mcp
```

**User Scope**: `~/.claude.json` - Available across all projects
```bash
claude mcp add --scope user --transport http hubspot https://mcp.hubspot.com/anthropic
```

**Precedence:** Local > Project > User [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)

### MCP Server Management [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)
```bash
# List all configured servers
claude mcp list

# Get server details
claude mcp get github

# Remove server
claude mcp remove github

# Check server status (within Claude Code)
> /mcp

# Import from Claude Desktop
claude mcp add-from-claude-desktop

# Add from JSON config
claude mcp add-json weather-api '{"type":"http","url":"https://api.weather.com/mcp"}'
```

### Popular MCP Integrations [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)

**GitHub:** PR reviews, issue management, repository operations
```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
# Usage: "Review PR #456 and suggest improvements"
```

**Sentry:** Error monitoring and debugging
```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
# Usage: "What are the most common errors in the last 24 hours?"
```

**PostgreSQL:** Database queries
```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:pass@host:5432/analytics"
# Usage: "What's our total revenue this month?"
```

**Jira, Slack, Figma, Google Drive:**  Connect via MCP marketplace or custom servers [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)

### MCP Resources (@ mentions) [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)
```bash
# Reference external resources in prompts
> Can you analyze @github:issue://123 and suggest a fix?
> Please review the API documentation at @docs:file://api/authentication
> Compare @postgres:schema://users with @docs:file://database/user-model
```

### MCP Prompts as Commands [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)
MCP servers can expose prompts that become executable commands:
```bash
# Discover available prompts
> /

# Execute without arguments
> /mcp__github__list_prs

# Execute with arguments
> /mcp__github__pr_review 456
> /mcp__jira__create_issue "Bug in login flow" high
```

### MCP Tool Search (Dynamic Loading) [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)
Automatically activates when MCP tools exceed 10% of context window: [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)
- Tools load on-demand instead of preloading all
- Prevents context window exhaustion with many MCP servers
- Configurable threshold:

```bash
# Custom 5% threshold
ENABLE_TOOL_SEARCH=auto:5 claude

# Always enabled
ENABLE_TOOL_SEARCH=true claude

# Disabled (load all tools upfront)
ENABLE_TOOL_SEARCH=false claude
```

### MCP Output Limits [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)
- **Warning threshold:** 10,000 tokens
- **Default max:** 25,000 tokens
- **Configurable:**
```bash
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

### MCP Enterprise Management [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)

**Option 1: Exclusive Control**  
Deploy `managed-mcp.json` to system directories:
- macOS: `/Library/Application Support/ClaudeCode/managed-mcp.json`
- Linux/WSL: `/etc/claude-code/managed-mcp.json`
- Windows: `C:\Program Files\ClaudeCode\managed-mcp.json`

Users cannot add, modify, or use servers outside this file. [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)

**Option 2: Allowlist/Denylist Policy**  
Configure `allowedMcpServers` and `deniedMcpServers` to allow user customization within constraints: [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)

```json
{
  "allowedMcpServers": [
    { "serverName": "github" },
    { "serverCommand": ["npx", "-y", "@modelcontextprotocol/server-filesystem"] },
    { "serverUrl": "https://mcp.company.com/*" }
  ],
  "deniedMcpServers": [
    { "serverName": "dangerous-server" },
    { "serverUrl": "https://*.untrusted.com/*" }
  ]
}
```

***

## 3. CLAUDE.MD - PROJECT INTELLIGENCE [codewithmukesh](https://codewithmukesh.com/blog/claude-code-for-beginners/)

### Purpose
`CLAUDE.md` is automatically pulled into context at conversation start. It's your project's memory system. [anthropic](https://www.anthropic.com/engineering/claude-code-best-practices)

### Structure [codewithmukesh](https://codewithmukesh.com/blog/claude-code-for-beginners/)
```markdown
# Project: Your App Name

## The What (Tech Stack)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library

## The Why (Architecture Decisions)
- **App Router**: We use server components by default for better performance
- **Prisma**: Type-safe ORM chosen for dev experience and migrations
- **Monorepo**: Using Turborepo for shared packages

## The How (Development Practices)
- **Branch naming**: `feature/`, `bugfix/`, `hotfix/` prefixes
- **Commits**: Conventional commits (feat:, fix:, docs:)
- **Testing**: All features require unit tests before PR
- **Code style**: Prettier (committed config), ESLint strict mode
```

### What to Include [anthropic](https://www.anthropic.com/engineering/claude-code-best-practices)
- Common bash commands for the project
- Core files and utility function locations
- Code style guidelines and patterns
- Testing instructions and coverage requirements
- Repository etiquette (branch naming, merge vs rebase)
- Developer environment setup (Python/Node versions, compiler requirements)
- Unexpected behaviors or project-specific warnings
- Database migration procedures
- Deployment processes

### Auto-generation [codewithmukesh](https://codewithmukesh.com/blog/claude-code-for-beginners/)
```bash
> "Create a comprehensive CLAUDE.md for this project by analyzing the structure and conventions"
```

Claude will scan your project, identify patterns, and generate the file automatically. [codewithmukesh](https://codewithmukesh.com/blog/claude-code-for-beginners/)

### Version Control
Commit `CLAUDE.md` to version control so the entire team benefits. Update it as coding standards evolve. [codewithmukesh](https://codewithmukesh.com/blog/claude-code-for-beginners/)

***

## 4. SKILLS SYSTEM [betazeta](https://betazeta.dev/blog/claude-code-superpowers/)

### Overview
Skills are context-aware capabilities that activate automatically based on what Claude is doing. The system uses **pure LLM reasoning** - no embeddings, classifiers, or pattern matching. [leehanchung.github](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)

### How Skills Work [bdtechtalks.substack](https://bdtechtalks.substack.com/p/what-to-know-about-claude-skills)
1. **Discovery**: At session start, Claude scans available skills
2. **Progressive Disclosure**: Loads ~100 tokens of YAML metadata per skill (name + description)
3. **Contextual Activation**: Claude decides which skills to invoke based on task context
4. **Dynamic Loading**: Full skill content loaded only when needed

### Core Skill Categories [betazeta](https://betazeta.dev/blog/claude-code-superpowers/)

**Development Skills:**
- Test-Driven Development (TDD)
- Debugging methodology
- Code refactoring patterns
- Git workflow automation

**Collaboration Skills:**
- Structured brainstorming (`/brainstorm` command)
- Project planning
- Code review guidance
- Parallel agent coordination

**Architecture Skills:**
- High-level design consultation
- Technology selection frameworks
- Implementation strategy
- Trade-off analysis

### Creating Custom Skills [betazeta](https://betazeta.dev/blog/claude-code-superpowers/)

**Skill Structure:** Each skill is a `SKILL.md` file in `~/.claude/skills/` [betazeta](https://betazeta.dev/blog/claude-code-superpowers/)

```markdown
# Skill Name

## Description
Brief overview of what this skill does

## When to Use
Specific scenarios that trigger this skill

## Process
Step-by-step methodology

## Examples
Concrete demonstrations

## Anti-patterns
What NOT to do
```

**Example: Performance Optimization Skill** [betazeta](https://betazeta.dev/blog/claude-code-superpowers/)
```bash
# Create skill directory
mkdir -p ~/.claude/skills/performance-optimization

# Create SKILL.md with structure
> "Help me create a performance optimization skill that focuses on
React component rendering and bundle size optimization"
```

Claude can help you create, test, and version control custom skills. [betazeta](https://betazeta.dev/blog/claude-code-superpowers/)

### Skill Discovery
Skills are automatically discovered from:
- `~/.claude/skills/` (user-level)
- `.claude/skills/` (project-level)
- Plugin-provided skills

***

## 5. PLAN MODE [codewithmukesh](https://codewithmukesh.com/blog/claude-code-for-beginners/)

### What is Plan Mode?
Before implementing, Claude generates a detailed plan and waits for approval. This prevents wasted work from misaligned implementations. [codewithmukesh](https://codewithmukesh.com/blog/claude-code-for-beginners/)

### Plan Contents [codewithmukesh](https://codewithmukesh.com/blog/claude-code-for-beginners/)
1. Project structure breakdown
2. Data model definitions
3. Component/module hierarchy
4. Implementation phases
5. Key design decisions with rationale

### Workflow [codewithmukesh](https://codewithmukesh.com/blog/claude-code-for-beginners/)
```bash
> "Build a task management API with user authentication"

# Claude responds with comprehensive plan:
# - Database schema
# - API endpoint structure
# - Authentication flow
# - Testing strategy

# Review and refine
> "Use TypeScript instead of JavaScript"

# Claude regenerates plan

# Approve
> "Looks good, proceed"

# Claude implements the approved plan
```

### Benefits [codewithmukesh](https://codewithmukesh.com/blog/claude-code-for-beginners/)
- **Alignment**: Discuss approach before execution
- **Senior-level pairing**: Like working with an experienced architect
- **Efficiency**: Catch issues in planning phase, not during debugging

***

## 6. UNIX PHILOSOPHY & COMPOSABILITY [github](https://github.com/joeyism/claude-code-config)

### Scriptable and Pipeable
Claude Code embraces Unix principles - it's composable with standard tools. [github](https://github.com/joeyism/claude-code-config)

**Examples:**
```bash
# Monitor logs and alert on anomalies
tail -f app.log | claude -p "Slack me if you see any anomalies in this log stream"

# Process and analyze data
cat performance-metrics.csv | claude -p "Identify the slowest endpoints and suggest optimizations"

# Git workflow automation
git diff main | claude -p "Review these changes and generate a detailed commit message"

# CI/CD integration
claude -p "Check test coverage and fail if below 80%"

# Batch processing
find . -name "*.py" | xargs -I {} claude -p "Add type hints to {}"
```

### Command-Line Flags [github](https://github.com/joeyism/claude-code-config)
```bash
# Single prompt mode
claude -p "prompt text"

# Resume previous session
claude --resume <session-id>

# Serve as MCP server
claude mcp serve
```

***

## 7. MULTI-PLATFORM AVAILABILITY [github](https://github.com/joeyism/claude-code-config)

### Terminal (CLI)
Primary interface - works in any terminal [github](https://github.com/joeyism/claude-code-config)
```bash
claude  # Start in current directory
```

### Web Interface
Access at `claude.ai/code` or Claude iOS app: [github](https://github.com/joeyism/claude-code-config)
- No local setup required
- Parallel task execution
- Built-in diff view
- Work on repos not available locally

### Desktop App [github](https://github.com/joeyism/claude-code-config)
Standalone application with:
- Visual diff review
- Parallel sessions via git worktrees
- Cloud session launching

### IDE Integrations [github](https://github.com/joeyism/claude-code-config)

**VS Code Extension:**
- Inline diffs
- @-mentions for context
- Plan review UI

**JetBrains Plugin:**
- IntelliJ IDEA, PyCharm, WebStorm support
- IDE diff viewing
- Context sharing

### CI/CD Integrations [github](https://github.com/joeyism/claude-code-config)

**GitHub Actions:**
```yaml
# .github/workflows/code-review.yml
on: pull_request
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropic/claude-code-action@v1
        with:
          prompt: "Review this PR for security issues and code quality"
```

**GitLab CI/CD:**
Event-driven automation for merge requests and issues [github](https://github.com/joeyism/claude-code-config)

**Slack:**
```
@claude review PR #123 for security issues
```
Claude creates PR with findings [github](https://github.com/joeyism/claude-code-config)

### Chrome Extension [github](https://github.com/joeyism/claude-code-config)
Connect Claude Code to browser for:
- Live debugging of web apps
- Design verification against Figma
- Visual regression testing

***

## 8. SETTINGS & CONFIGURATION [jitendrazaa](https://www.jitendrazaa.com/blog/ai/claude-code-complete-guide-2026-from-basics-to-advanced-mcp-2/)

### Settings Hierarchy (Highest to Lowest Precedence) [jitendrazaa](https://www.jitendrazaa.com/blog/ai/claude-code-complete-guide-2026-from-basics-to-advanced-mcp-2/)
1. Organizational policies (managed settings)
2. `.claude/settings.json` - Team conventions (project root)
3. `.claude/settings.local.json` - Machine-specific (project root)
4. `~/.claude.json` - User-level global settings

### Key Settings

**Permissions:**
```json
{
  "permissions": {
    "deny": ["MCPSearch"],
    "disallowedTools": ["FileEdit"]
  }
}
```

**Environment Variables:**
```json
{
  "env": {
    "MAX_MCP_OUTPUT_TOKENS": "50000",
    "ENABLE_TOOL_SEARCH": "auto:5"
  }
}
```

***

## 9. SUBAGENTS & PARALLEL EXECUTION [jitendrazaa](https://www.jitendrazaa.com/blog/ai/claude-code-complete-guide-2026-from-basics-to-advanced-mcp-2/)

Claude Code supports spawning subagents for parallel work: [jitendrazaa](https://www.jitendrazaa.com/blog/ai/claude-code-complete-guide-2026-from-basics-to-advanced-mcp-2/)
```bash
# Within Claude Code session
> "Spawn a subagent to write unit tests while you implement the API endpoints"

# Desktop app: Multiple sessions via git worktrees
# Web interface: Built-in parallel task execution
```

***

## 10. TERMINAL UI ENHANCEMENTS [youtube](https://www.youtube.com/watch?v=lYH3NhSgN2k)

### Claude Canvas (Experimental) [youtube](https://www.youtube.com/watch?v=lYH3NhSgN2k)
Third-party TUI toolkit providing rich interactive interfaces directly in terminal:
- Email clients
- Calendar views
- Flight booking interfaces
- Interactive forms with keyboard/mouse navigation
- Two-way communication with Claude

**Note:** Still proof-of-concept as of January 2026 [youtube](https://www.youtube.com/watch?v=lYH3NhSgN2k)

### Terminal UI Designer Skill [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)
Available via MCP Market - creates production-grade terminal UIs with:
- Custom Unicode borders
- Cohesive color palettes
- Complex spatial layouts
- Terminal animations
- Advanced visual hierarchy

***

## 11. AGENT SDK [github](https://github.com/joeyism/claude-code-config)

Build custom AI agents using Claude Agent SDK. Reference implementation available for development containers. [github](https://github.com/joeyism/claude-code-config)

**Use Cases:**
- Custom coding workflows
- Domain-specific assistants
- Automated code review systems
- Project scaffolding tools

***

## 12. ENTERPRISE FEATURES [github](https://github.com/joeyism/claude-code-config)

### Hosting Options [github](https://github.com/joeyism/claude-code-config)
- **Claude API**: Default hosted option
- **AWS Bedrock**: Deploy on Amazon infrastructure
- **GCP Vertex AI**: Deploy on Google Cloud

### Security & Compliance [github](https://github.com/joeyism/claude-code-config)
- Enterprise-grade security built-in
- Privacy controls
- Data residency options
- Audit logging

### Team Management [github](https://github.com/joeyism/claude-code-config)
- Centralized MCP server management
- Policy-based access controls
- Standardized project configurations
- Team-wide skill sharing

***

## 13. AUTHENTICATION & SETUP [github](https://github.com/joeyism/claude-code-config)

### Requirements [github](https://github.com/joeyism/claude-code-config)
- Claude subscription (Pro, Max, Teams, or Enterprise) OR
- Claude Console account

### Installation [github](https://github.com/joeyism/claude-code-config)
```bash
# macOS, Linux, WSL
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# Windows CMD
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

Auto-updates in background [github](https://github.com/joeyism/claude-code-config)

### First Use [github](https://github.com/joeyism/claude-code-config)
```bash
cd your-project
claude
# Prompted to log in on first run
```

***

## 14. SESSION MANAGEMENT [stanislas](https://stanislas.blog/2026/01/tui-index-search-coding-agent-sessions/)

### Resume Sessions [stanislas](https://stanislas.blog/2026/01/tui-index-search-coding-agent-sessions/)
```bash
# Resume previous session
claude --resume <session-id>

# Sessions stored in:
# ~/.claude/sessions/<project>/<session-id>.jsonl
```

### Session Search
Third-party tools exist for searching across coding sessions with fuzzy full-text search. [stanislas](https://stanislas.blog/2026/01/tui-index-search-coding-agent-sessions/)

***

## PRACTICAL USE CASE EXAMPLES

### Full-Stack Feature Development
```bash
> "Build a real-time chat feature with WebSocket connections,
message persistence in PostgreSQL, typing indicators, and
read receipts. Use our existing auth system in src/auth."
```
Claude will:
1. Generate implementation plan
2. Create database migrations
3. Implement backend WebSocket handlers
4. Build frontend components
5. Add tests
6. Create git commits with descriptive messages

### Database-Driven Development
```bash
# Connect PostgreSQL
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://user:pass@localhost:5432/myapp"

# Use natural language queries
> "Find users who signed up in the last 30 days but haven't
created any projects yet, and show their email domains"

> "Analyze the users table schema and suggest indexes for
our most common query patterns"
```

### Issue-to-PR Workflow
```bash
# Connect GitHub and Jira
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
claude mcp add --transport http jira https://mcp.jira.com

# Automated workflow
> "Implement the feature described in JIRA ticket ENG-4521,
write tests, and create a PR on GitHub with the ticket ID
in the description"
```

### Production Debugging
```bash
# Connect Sentry
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# Debug live issues
> "Check Sentry for errors in the last 2 hours related to
payment processing. Show stack traces and suggest fixes."

> "Compare error rates before and after deployment #1234"
```

### Code Migration
```bash
> "Migrate all class components in src/components to functional
components with hooks, maintain existing behavior, update tests,
and create separate commits for each file"
```

### Security Audit
```bash
> "Audit this codebase for common security vulnerabilities:
SQL injection, XSS, CSRF, insecure dependencies, exposed secrets.
Generate a report with severity levels and remediation steps."
```

***

## LIMITATIONS & BEST PRACTICES

### Context Window Management [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)
- MCP tools can consume significant context
- Tool Search automatically manages this at 10% threshold
- Use `.claudeignore` to exclude large irrelevant files

### Rate Limits
- Respect API rate limits for connected services
- Configure appropriate timeouts for MCP servers

### Security [eesel](https://www.eesel.ai/blog/mcp-integration-claude-code)
- Never commit API keys to `.mcp.json` - use environment variables
- Use managed configurations for enterprise deployments
- Review MCP server permissions before enabling
- Audit third-party MCP servers before deployment

### Performance
- Local stdio servers are faster than remote HTTP/SSE
- Use project-scoped MCP servers for team consistency
- Leverage skills for repeated patterns to save tokens

***

## RESOURCES & DOCUMENTATION

**Official Documentation:**
- Main Docs: https://code.claude.com/docs/en/overview [github](https://github.com/joeyism/claude-code-config)
- MCP Guide: https://code.claude.com/docs/en/mcp [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)
- Best Practices: https://www.anthropic.com/engineering/claude-code-best-practices [anthropic](https://www.anthropic.com/engineering/claude-code-best-practices)

**MCP Resources:**
- MCP Server Registry: https://github.com/modelcontextprotocol
- MCP Market: https://mcpmarket.com [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)
- Build MCP Servers: Use MCP SDK [mcpmarket](https://mcpmarket.com/tools/skills/terminal-ui-designer)

**Community Resources:**
- Superpowers Plugin: https://betazeta.dev/blog/claude-code-superpowers/ [betazeta](https://betazeta.dev/blog/claude-code-superpowers/)
- Skills Deep Dive: https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/ [leehanchung.github](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)
- Complete Guide 2026: https://www.jitendrazaa.com/blog/ai/claude-code-complete-guide-2026-from-basics-to-advanced-mcp-2/ [jitendrazaa](https://www.jitendrazaa.com/blog/ai/claude-code-complete-guide-2026-from-basics-to-advanced-mcp-2/)

***

## VERSION INFORMATION

**Document Created:** January 28, 2026  
**Claude Code Version:** Current stable release (auto-updates)  
**Last Verified:** January 28, 2026

All information sourced from official Anthropic documentation and verified community resources. No hallucinated capabilities included.

***

## QUICK REFERENCE CARD

```bash
# Essential Commands
claude                          # Start in current dir
claude -p "prompt"             # Single prompt mode
claude --resume <id>           # Resume session
claude mcp list                # Show MCP servers
claude mcp add <config>        # Add MCP server
claude mcp serve               # Run as MCP server

# In-session Commands
/mcp                           # Check MCP status
/brainstorm                    # Start planning session
/<tab>                         # Show all commands
@<file>                        # Reference file
@<mcp-resource>                # Reference MCP resource

# Configuration Files
CLAUDE.md                      # Project context (auto-loaded)
.mcp.json                      # Project MCP servers
.claude/settings.json          # Team settings
.claude/settings.local.json    # Local overrides
~/.claude.json                 # User config
```

***

***

Below is a single, comprehensive “drop-in” artifact for Claude Code **TUI/CLI**: project memory (`CLAUDE.md`), modular rules (`.claude/rules/*.md`), and a full skill pack (`.claude/skills/*/SKILL.md`).  
Claude Code treats `./CLAUDE.md` or `./.claude/CLAUDE.md` as project memory, auto-loads `.claude/rules/*.md`, and supports project skills at `.claude/skills/<skill>/SKILL.md` invoked with `/skill-name`. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)

## File tree (copy exactly)
Project memory can live at `./.claude/CLAUDE.md` and topic rules belong in `./.claude/rules/*.md` (loaded automatically as project memory).   
Project skills live in `.claude/skills/<skill-name>/SKILL.md` and are runnable via `/skill-name`. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)

```txt
your-repo/
  .claude/
    CLAUDE.md
    rules/
      00-operating-system.md
      10-ui-ux-dx.md
      20-3d-spatial.md
      30-frontend-paths.md
    skills/
      ux-brief/
        SKILL.md
      3d-ui-prototyper/
        SKILL.md
      spatial-ux-critic/
        SKILL.md
      dx-component-architect/
        SKILL.md
      motion-microinteractions/
        SKILL.md
      a11y-gate/
        SKILL.md
      ui-pr-review/
        SKILL.md
  CLAUDE.local.md   # optional, private (auto-added to .gitignore)
```

## `.claude/CLAUDE.md` (project memory)
`CLAUDE.md` can import other files using `@path/to/import`, and relative imports resolve relative to the importing file.   
`CLAUDE.local.md` is automatically loaded and automatically added to `.gitignore`, making it ideal for private per-project preferences. 

```md
# CLAUDE.md — Future Interface Architect (UI/UX/DX + 3D)

## Role
You are the Future Interface Architect: UI/UX designer + UX engineer + DX architect.
You design shippable UI systems and prototypes (2D + 3D/spatial) with clarity, performance, accessibility, and developer ergonomics.

## Prime directive
- Prefer small, testable increments that can land today.
- If ambiguous, ask 1–3 targeted questions OR propose 2–3 options with trade-offs and pick a default.

## Output contract (always)
When doing UI/UX/3D work, respond in this order:
1) Intent & user job-to-be-done (1–2 lines)
2) IA / navigation map (bullets)
3) Interaction spec (states + transitions + gestures)
4) Component/scene architecture (what lives where)
5) Perf + a11y constraints (budgets + fallbacks)
6) Implementation plan (steps)
7) Code (only after plan is clear)

## Non-negotiable quality gates
- A11y: keyboard path exists; focus is visible; reduced-motion supported; contrast considered.
- Performance: define a target (e.g., 60fps desktop); avoid re-render storms; avoid unbounded GPU work.
- DX: composable components; typed props; tokens centralized; examples exist.

## Modular rules (always-on)
@.claude/rules/00-operating-system.md
@.claude/rules/10-ui-ux-dx.md
@.claude/rules/20-3d-spatial.md
@.claude/rules/30-frontend-paths.md

## Skills (manual, slash commands)
Use these when appropriate (I may ask you to run them explicitly):
/ux-brief
/3d-ui-prototyper
/spatial-ux-critic
/dx-component-architect
/motion-microinteractions
/a11y-gate
/ui-pr-review
```

## `.claude/rules/*` (guardrails)
Rules in `.claude/rules/*.md` are automatically loaded as project memory, and rules can be scoped with YAML frontmatter `paths` globs.   
Glob patterns like `**/*.ts` and brace expansion are supported in `paths`. 

### `.claude/rules/00-operating-system.md`
```md
# Operating system (how we work)

- Ship value in thin vertical slices; no big-bang refactors unless asked.
- If you change an API/contract, update types and at least one usage example.
- Prefer editing existing patterns over introducing new frameworks.

Definition of done:
- Usable end-to-end demo (even minimal)
- Clear next steps + backlog for polish
- Explicit trade-offs and risks
```

### `.claude/rules/10-ui-ux-dx.md`
```md
# UI/UX/DX rules

- Clarity > cleverness. Every pixel must earn rent.
- Always define: target user, primary job-to-be-done, and success metric.
- Design for keyboard-first; pointer enhances, not replaces.
- Provide empty/loading/error states and a recovery path (undo/reset).
- Tokens over hardcoded values (spacing, radii, colors, motion).
- DX is a feature: stable props, good names, good defaults, good docs.
```

### `.claude/rules/20-3d-spatial.md`
```md
# 3D / spatial rules

- 3D is not decoration: each 3D element must encode meaning or affordance.
- Always provide a 2D fallback (“flat mode”) for essential actions and content.
- Use layered architecture: HUD (2D) + Scene (3D) + Inspector (2D) + Debug toggles.
- Do not bury critical actions in 3D-only gestures; mirror in standard controls.
- Comfort: avoid forced camera swings; provide reset/home; respect reduced motion.
- Performance defaults: instancing for many objects; memoize materials/geometries;
  avoid per-frame React state updates (use refs for render-loop state).
```

### `.claude/rules/30-frontend-paths.md` (path-scoped)
```md
---
paths:
- "src/**/*.{ts,tsx,css}"
- "app/**/*.{ts,tsx,css}"
- "packages/*/src/**/*.{ts,tsx,css}"
---

# Frontend enforcement (scoped)

- Components must expose a minimal, typed public API.
- Add story/demo usage for any new component.
- Motion: include reduced-motion behavior by default.
- A11y: ensure focus states exist; keyboard path for core actions.

---
paths:
- "src/scene/**"
- "src/three/**"
- "src/shaders/**"
---

# 3D subsystem enforcement (scoped)

- No unbounded GPU work; cap counts, use instancing where possible.
- Keep render-loop state out of React state; use refs.
- Provide a flat-mode path for critical tasks.
```

## `.claude/skills/*` (slash-command skill pack)
Claude Code skills are directories containing `SKILL.md` with YAML frontmatter (`name`, `description`, etc.), and you can invoke them directly with `/skill-name`. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)
For workflow-style skills you only want to trigger manually, set `disable-model-invocation: true`. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)

### `.claude/skills/ux-brief/SKILL.md`
```md
---
name: ux-brief
description: Turn a vague request into a shippable UI/UX spec (JTBD, IA, states, acceptance criteria).
argument-hint: "[feature/request]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Create a product-grade UX brief for: $ARGUMENTS

Output:
1) JTBD + target user + constraints (2–5 bullets)
2) Information architecture (pages/panels + navigation)
3) Key flows (happy path + 2 failure paths)
4) Interaction states (idle/loading/empty/error/success)
5) Acceptance criteria (10–20 testable bullets)
6) Open questions (max 5, highest leverage)
```

### `.claude/skills/3d-ui-prototyper/SKILL.md`
```md
---
name: 3d-ui-prototyper
description: Design and implement a shippable 3D/spatial UI prototype with a 2D fallback, perf budgets, and clean scene/component architecture.
argument-hint: "[what-to-build]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Build a minimal vertical slice for: $ARGUMENTS

Workflow:
1) Clarify primary interaction (select/inspect/manipulate/navigate).
2) Choose representation (nodes/edges, cards in space, layers, volumetric panels).
3) Camera model + constraints (orbit/fly/rail; bounds; reset).
4) Inputs: mouse/trackpad + keyboard first; gestures optional.
5) Architecture: HUD (2D), Scene (3D), Inspector (2D), Debug (dev-only).
6) Slice requirements: hover + select, focus/isolate, reset view, flat-mode toggle.
7) Perf guardrails: instancing, memoized materials, no per-frame React state updates.

Deliver:
- Scene graph (bullets)
- Interaction states + transitions
- Implementation plan
- Code skeleton plan (components + hooks)
- Perf + fallback notes
```

### `.claude/skills/spatial-ux-critic/SKILL.md`
```md
---
name: spatial-ux-critic
description: Ruthless critique of a spatial/3D interface: clarity, navigation, comfort, error recovery, learnability, and accessibility.
argument-hint: "[link/description/files]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Critique: $ARGUMENTS

Score 0–2 each:
- Orientation, affordance, navigation, focus, recovery, comfort, accessibility

Output:
- 5–10 findings: severity (low/med/high), why it matters, concrete fix
- Top 3 changes for maximum usability per dev-hour
```

### `.claude/skills/dx-component-architect/SKILL.md`
```md
---
name: dx-component-architect
description: Design component APIs and architecture for maximum developer experience (DX): typed, composable, documented, scalable.
argument-hint: "[component/system]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Architect: $ARGUMENTS

Deliver:
- Component list + responsibilities
- Public props/events (TypeScript types)
- Composition pattern (slots/children/overrides)
- Example usage (minimal + advanced)
- Refactor/migration plan if needed
```

### `.claude/skills/motion-microinteractions/SKILL.md`
```md
---
name: motion-microinteractions
description: Design motion that increases comprehension: timing, easing, choreography, reduced-motion defaults.
argument-hint: "[surface/flow]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Design motion for: $ARGUMENTS

Deliver:
- Motion tokens (durations + easings)
- Transition map (enter/exit/hover/select/drag/nav)
- Reduced-motion behavior (what becomes instant, what stays)
- Implementation notes (avoid layout thrash; prefer transform/opacity)
```

### `.claude/skills/a11y-gate/SKILL.md`
```md
---
name: a11y-gate
description: Enforce accessibility gates for 2D + 3D UI: keyboard, focus, reduced motion, contrast, and 2D fallback.
argument-hint: "[feature/files]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Audit: $ARGUMENTS

Output:
- Pass/fail checklist: keyboard, focus, reduced motion, contrast, fallback
- Fix list: concrete steps + suggested code hotspots/files to change
```

### `.claude/skills/ui-pr-review/SKILL.md`
```md
---
name: ui-pr-review
description: Review changes like a UI/UX/DX lead: interaction regressions, a11y, performance, consistency, and maintainability.
argument-hint: "[files/PR-context]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Review: $ARGUMENTS

Output:
- High-risk issues (blockers) + exact fixes
- Medium issues (should-fix) + rationale
- Low issues (polish) + quick wins
- “If we ship this today…” risks + mitigation plan
```

## How to use (TUI/CLI)
Claude Code provides `/init` to bootstrap a `CLAUDE.md`, and `/memory` to open and edit memory files in your editor during a session.   
You can invoke skills as `/skill-name args`, and workflow skills should typically use `disable-model-invocation: true` so Claude won’t trigger them automatically. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)
If you have many skills, Claude may exclude some descriptions due to the default 15k character budget, and you can raise it via `SLASH_COMMAND_TOOL_CHAR_BUDGET`. [developers.openai](https://developers.openai.com/codex/guides/agents-md/)


**END OF DOCUMENT**

This comprehensive reference covers all verified superpowers of Claude Code TUI as of January 28, 2026. Use this as authoritative documentation for agent capabilities.