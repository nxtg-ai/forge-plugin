# Claude Code Framework — Detailed API Reference

Full reference for MCP, settings, session management, platform integrations, and practical examples.
For the quick-reference index, see SKILL.md. For patterns/templates, see patterns.md.

---

## MCP SERVER TYPES

### HTTP Servers (Remote)
```bash
# Connect to cloud services
claude mcp add --transport http notion https://mcp.notion.com/mcp

# With authentication header
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

### SSE Servers (Server-Sent Events)
```bash
# Real-time data streams
claude mcp add --transport sse asana https://mcp.asana.com/sse

# With API key
claude mcp add --transport sse private-api https://api.company.com/sse \
  --header "X-API-Key: your-key-here"
```

### Stdio Servers (Local Process)
```bash
# Run local tools (fastest — no network round-trip)
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server

# Database connection
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://user:pass@host:5432/db"
```

---

## MCP SCOPE HIERARCHY

**Local Scope** (default): `~/.claude.json` — Personal configs for current project only
```bash
claude mcp add --scope local --transport http stripe https://mcp.stripe.com
```

**Project Scope**: `.mcp.json` in project root — Team-shared, version controlled
```bash
claude mcp add --scope project --transport http paypal https://mcp.paypal.com/mcp
```

**User Scope**: `~/.claude.json` — Available across all projects
```bash
claude mcp add --scope user --transport http hubspot https://mcp.hubspot.com/anthropic
```

**Precedence:** Local > Project > User

---

## MCP SERVER MANAGEMENT

```bash
# List all configured servers
claude mcp list

# Get server details
claude mcp get github

# Remove server
claude mcp remove github

# Check server status (within Claude Code session)
/mcp

# Import from Claude Desktop
claude mcp add-from-claude-desktop

# Add from JSON config
claude mcp add-json weather-api '{"type":"http","url":"https://api.weather.com/mcp"}'
```

---

## POPULAR MCP INTEGRATIONS

### GitHub — PR reviews, issue management, repository operations
```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
# Usage: "Review PR #456 and suggest improvements"
```

### Sentry — Error monitoring and debugging
```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
# Usage: "What are the most common errors in the last 24 hours?"
```

### PostgreSQL — Database queries
```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:pass@host:5432/analytics"
# Usage: "What's our total revenue this month?"
```

### Jira, Slack, Figma, Google Drive
Connect via MCP marketplace or custom servers: https://mcpmarket.com

---

## MCP RESOURCES (@ mentions)

Reference external resources directly in prompts:
```bash
> Can you analyze @github:issue://123 and suggest a fix?
> Please review the API documentation at @docs:file://api/authentication
> Compare @postgres:schema://users with @docs:file://database/user-model
```

---

## MCP PROMPTS AS COMMANDS

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

---

## MCP TOOL SEARCH (Dynamic Loading)

Automatically activates when MCP tools exceed 10% of context window:
- Tools load on-demand instead of preloading all
- Prevents context window exhaustion with many MCP servers

```bash
# Custom 5% threshold
ENABLE_TOOL_SEARCH=auto:5 claude

# Always enabled
ENABLE_TOOL_SEARCH=true claude

# Disabled (load all tools upfront)
ENABLE_TOOL_SEARCH=false claude
```

Also configurable in `.claude/settings.json`:
```json
{
  "env": {
    "ENABLE_TOOL_SEARCH": "auto:5"
  }
}
```

---

## MCP OUTPUT LIMITS

- **Warning threshold:** 10,000 tokens
- **Default max:** 25,000 tokens

Configurable:
```bash
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

Or in settings:
```json
{ "env": { "MAX_MCP_OUTPUT_TOKENS": "50000" } }
```

---

## MCP ENTERPRISE MANAGEMENT

### Option 1: Exclusive Control

Deploy `managed-mcp.json` to system directories:
- macOS: `/Library/Application Support/ClaudeCode/managed-mcp.json`
- Linux/WSL: `/etc/claude-code/managed-mcp.json`
- Windows: `C:\Program Files\ClaudeCode\managed-mcp.json`

Users cannot add, modify, or use servers outside this file.

### Option 2: Allowlist/Denylist Policy

Configure `allowedMcpServers` and `deniedMcpServers` for user customization within constraints:

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

---

## SETTINGS SCHEMA — FULL REFERENCE

### Hierarchy (highest → lowest precedence)
1. Organizational policies (managed settings — system-level)
2. `.claude/settings.json` — Team conventions (project root, version controlled)
3. `.claude/settings.local.json` — Machine-specific (project root, gitignored)
4. `~/.claude.json` — User-level global settings

### Permissions
```json
{
  "permissions": {
    "deny": ["MCPSearch"],
    "disallowedTools": ["FileEdit"],
    "allowedMcpServers": [
      { "serverName": "github" }
    ],
    "deniedMcpServers": [
      { "serverUrl": "https://*.untrusted.com/*" }
    ]
  }
}
```

### Environment Variables
```json
{
  "env": {
    "MAX_MCP_OUTPUT_TOKENS": "50000",
    "ENABLE_TOOL_SEARCH": "auto:5",
    "FORGE_QUIET_HOOKS": "1",
    "FORGE_HOOK_VERBOSE": "1"
  }
}
```

### Hooks Configuration (in `.claude/settings.json`)
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/hook-script.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/post-hook.sh"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/prompt-hook.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/stop-hook.sh"
          }
        ]
      }
    ]
  }
}
```

**Hook exit codes:**
- `0` — Success, proceed
- `2` — Block the tool call (PreToolUse only, shows stderr to Claude)
- Other non-zero — Advisory warning (non-blocking)

**Hook environment variables available:**
- `CLAUDE_TOOL_NAME` — Name of the tool being called
- `CLAUDE_TOOL_INPUT` — JSON input to the tool
- `CLAUDE_SESSION_ID` — Current session ID

---

## SESSION MANAGEMENT

### Resume Sessions
```bash
# Resume previous session
claude --resume <session-id>

# Sessions stored in:
~/.claude/sessions/<project>/<session-id>.jsonl
```

### Session Search
Third-party tools provide fuzzy full-text search across coding sessions.
Reference: https://stanislas.blog/2026/01/tui-index-search-coding-agent-sessions/

---

## AUTHENTICATION & SETUP

### Requirements
- Claude subscription (Pro, Max, Teams, or Enterprise) OR
- Claude Console account

### Installation
```bash
# macOS, Linux, WSL
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex

# Windows CMD
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

Claude Code auto-updates in the background.

### First Use
```bash
cd your-project
claude
# Prompted to log in on first run
```

---

## MULTI-PLATFORM INTEGRATION DETAILS

### Web Interface (`claude.ai/code` or Claude iOS app)
- No local setup required
- Parallel task execution built-in
- Built-in diff view
- Work on repos not available locally

### Desktop App
- Visual diff review
- Parallel sessions via git worktrees
- Cloud session launching

### VS Code Extension
- Inline diffs
- @-mentions for context injection
- Plan review UI

### JetBrains Plugin
- Supports: IntelliJ IDEA, PyCharm, WebStorm
- IDE diff viewing
- Context sharing

### GitHub Actions
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

### GitLab CI/CD
Event-driven automation for merge requests and issues.

### Slack Integration
```
@claude review PR #123 for security issues
```
Claude creates a PR with findings.

### Chrome Extension
Connect Claude Code to browser for:
- Live debugging of web apps
- Design verification against Figma mocks
- Visual regression testing

---

## ENTERPRISE FEATURES

### Hosting Options
- **Claude API**: Default hosted option
- **AWS Bedrock**: Deploy on Amazon infrastructure
- **GCP Vertex AI**: Deploy on Google Cloud

### Security & Compliance
- Enterprise-grade security built-in
- Privacy controls
- Data residency options
- Audit logging

### Team Management
- Centralized MCP server management (managed-mcp.json)
- Policy-based access controls
- Standardized project configurations
- Team-wide skill sharing

---

## AGENT SDK

Build custom AI agents using Claude Agent SDK. Reference implementation available for development containers.

**Use Cases:**
- Custom coding workflows
- Domain-specific assistants
- Automated code review systems
- Project scaffolding tools

---

## TERMINAL UI ENHANCEMENTS

### Claude Canvas (Experimental)
Third-party TUI toolkit providing rich interactive interfaces directly in terminal:
- Email clients, calendar views, flight booking interfaces
- Interactive forms with keyboard/mouse navigation
- Two-way communication with Claude

Note: Still proof-of-concept as of January 2026.

### Terminal UI Designer Skill
Available via MCP Market — creates production-grade terminal UIs with:
- Custom Unicode borders
- Cohesive color palettes
- Complex spatial layouts
- Terminal animations
- Advanced visual hierarchy

---

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

# Natural language queries
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

---

## VERSION INFORMATION

**Document Created:** January 28, 2026
**Claude Code Version:** Current stable release (auto-updates)
**Last Verified:** January 28, 2026

All information sourced from official Anthropic documentation and verified community resources.
