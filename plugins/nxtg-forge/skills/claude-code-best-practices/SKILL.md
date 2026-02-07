---
name: Claude Code Best Practices
description: Best practices for using Claude Code features including commands, agents, hooks, and memory.
---

Based on my research, Claude Code has evolved into a powerhouse agentic coding tool with several game-changing features. Here's your comprehensive guide to leveraging its latest capabilities.

## The Current State: Claude Code 2.x

Claude Code entered its "ChatGPT moment" in late 2025, fueled by **Claude Sonnet 4.5** (77.2% on SWE-bench Verified, 0% code editing error rate) and **Claude Opus 4.5** (80.9% SWE-bench scores with 65% fewer tokens). The tool is now available across terminals, VS Code, JetBrains IDEs, GitHub Actions, and even headless CI/CD pipelines. [uncoveralpha](https://www.uncoveralpha.com/p/anthropics-claude-code-is-having)

***

## 1. Context Engineering: The New Critical Skill

Anthropic's research identifies **context engineering** as the unifying theme of 2025—more important than prompt engineering. Here's how to master it: [dev](https://dev.to/oikon/reflections-of-claude-code-from-changelog-833)

### Dynamic Tool Loading (MCP 2.0)
Instead of preloading every tool definition, Claude Code now monitors context usage and **automatically detects when tools are needed**. This transforms the "context economy" from scarcity to access. [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

**Practical implementation:**
- Use the `ToolSearchTool` in your MCP clients for dynamic loading
- Tools are fetched only when relevant, preserving precious context tokens
- Mix with **Programmatic Tool Calling** to orchestrate 20+ tool calls in a single code block, eliminating multiple inference passes [anthropic](https://www.anthropic.com/engineering/advanced-tool-use)

### CLAUDE.md: Your Secret Weapon
Your `CLAUDE.md` files become part of Claude's prompts. Best practices from Anthropic's own teams: [rosmur.github](https://rosmur.github.io/claudecode-best-practices/)
- Keep it **100-200 lines max**
- Document specifically what Claude gets *wrong* (not what it does right)
- Iterate like you would iterate on prompts—refine relentlessly

***

## 2. Autonomous Execution Architecture

The two most powerful features for delegation are **Checkpoints** and **Subagents**: [anthropic](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously)

### Checkpoints (Safety Net)
- Automatically saves code state before each change
- **Double-tap Esc** or use `/rewind` to instantly restore
- Restore code, conversation, or both
- Applies to Claude's edits (not your bash commands—use version control)

### Subagents (Parallel Work)
Launch specialized agents for parallel workflows:
- One agent codes the backend API while another builds the frontend
- Use the `async` flag for non-blocking execution
- Share **Skills** across multiple agents via attachment [youtube](https://www.youtube.com/watch?v=s0JCE3WCL3s)

### Hooks & Background Tasks
- **Hooks** auto-trigger actions (run tests after code changes, lint before commits)
- **Background tasks** keep dev servers running without blocking Claude

***

## 3. Advanced Workflows for Complex Tasks

### Checklist-Driven Development
For large migrations or multi-step tasks, use a Markdown file or GitHub issue as a **living scratchpad**: [anthropic](https://www.anthropic.com/engineering/claude-code-best-practices)
```
Create a checklist.md
Reference it throughout the session
Mark items as Claude completes them
Update the checklist when requirements change
```

### Multi-Claude Verification Pattern
Split contexts for writing vs. reviewing:
- One Claude instance writes the code
- A fresh Claude context (or subagent) validates the changes
- Forces model to "think twice"—catches errors single-context agents miss

### Headless CI/CD Automation
Use Claude Code in GitHub Actions for:
- Automated code review on PRs
- Issue triage
- Translation pipelines
- Lint fixing

Example: `tail -f app.log | claude -p "Slack me if you see anomalies"`  [anthropic](https://www.anthropic.com/engineering/claude-code-best-practices)

***

## 4. The Claude Agent SDK (Formerly Claude Code SDK)

Build custom agents with the same core tools that power Claude Code: [anthropic](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously)
- Native Python SDK access to tools, context management, permissions
- Subagent orchestration
- Custom hooks for your specific workflows

***

## 5. Tool Use Best Practices (Anthropic's Internal Research)

Three patterns to solve specific bottlenecks: [anthropic](https://www.anthropic.com/engineering/advanced-tool-use)

| Problem | Solution | Implementation |
|---------|----------|----------------|
| Context bloat from tool definitions | **Tool Search Tool** | Dynamic loading—only fetch relevant tools |
| Intermediate results polluting context | **Programmatic Tool Calling** | Claude writes Python code to orchestrate multiple tools |
| Parameter errors, malformed calls | **Tool Use Examples** | Provide 3 examples of correct tool usage with format conventions, nested structures, and optional parameter patterns |

**Tool Use Examples** improved accuracy from 72% to 90% on complex parameter handling at Anthropic. [anthropic](https://www.anthropic.com/engineering/advanced-tool-use)

***

## 6. Key Updates to Know (January 2026)

- **Claude Code 2.1.14** shipped with 16 CLI, 5 flag, and 4 prompt changes [reddit](https://www.reddit.com/r/AI_Agents/comments/1qfm9a7/january_2026_latest_version_of_anthropics_system/)
- **Cowork agents** now available for non-technical tasks [reddit](https://www.reddit.com/r/AgentsOfAI/comments/1qh7xz5/its_been_a_big_week_for_agentic_ai_here_are_10/)
- **VS Code extension** in beta with inline diffs and real-time sidebar panel [anthropic](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously)
- **Searchable prompt history** (`Ctrl+r`) for reusing/editing previous prompts [anthropic](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously)
- **Claude for Excel** beta with pivot tables, chart generation, file uploads [releasebot](https://releasebot.io/updates/anthropic/claude)

***

## 7. The Golden Rules (Do These First) [rosmur.github](https://rosmur.github.io/claudecode-best-practices/)

| Do | Don't |
|-----|-------|
| Create a concise CLAUDE.md (document failures) | Add extensive content without iteration |
| Use Planning Mode (or custom planning workflow) before any coding | Jump straight into code without a roadmap |
| Clear context aggressively (at 60k tokens or 30% threshold) | Let context bloat accumulate |
| Write tests first (TDD approach) | Build without failing tests as guardrails |
| Be specific (detailed instructions) | Give vague descriptions |
| Review all code manually | Trust the AI blindly |
| Use simple control loops | Over-engineer multi-agent systems |

***

---

# Comprehensive Guide to Claude Code's Latest Features

Claude Code is Anthropic's terminal-native agentic coding tool that brings autonomous AI assistance directly into your development workflow. As of January 2026, several major updates have transformed it into the most advanced AI coding assistant available. [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

## Latest Updates (January 2026)

### Dynamic Tool Loading via MCP
The Model Context Protocol now supports dynamic tool discovery, allowing Claude to load tools on-demand rather than loading everything upfront. This solves the critical "context exhaustion" problem where tool-rich agents would hit context limits before starting work. This transforms the system from a "scarcity-based model into one of access". [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

### Cowork Feature (Research Preview)
Claude Cowork brings agentic capabilities to knowledge work with local folder access on macOS. Available to Pro/Max users, Cowork can read, edit, and create files in designated folders, enabling autonomous local file operations. [releasebot](https://releasebot.io/updates/anthropic/claude)

### Team Plan Access
Claude Code access is now included with every Team plan standard seat, making it more accessible for development teams. [releasebot](https://releasebot.io/updates/anthropic/claude)

## Installation & Setup

### Quick Install
```bash
# macOS, Linux, WSL
curl -fsSL https://claude.ai/install.sh | bash

# Windows PowerShell
irm https://claude.ai/install.ps1 | iex
```

Native installations auto-update in the background. [youtube](https://www.youtube.com/watch?v=0hdFJA-ho3c)

### Authentication
Two options available: [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

1. **API Key** (best for consistent heavy usage):
```bash
export ANTHROPIC_API_KEY="YOUR_KEY"
```
Add to `~/.bashrc` or `~/.zshrc` for persistence. [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

2. **Browser Auth**: Available for Pro/Max plan users during first launch. [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

## Core Usage Patterns

### Basic Commands
- **Interactive mode**: `claude` - Starts conversational REPL [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)
- **Initial prompt**: `claude "explain this project"` - Begins with specific query [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)
- **Print mode**: `claude -p "review this code"` - Query once and exit (ideal for scripting) [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)
- **Continue session**: `claude -c` - Resume most recent conversation [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)
- **Pipe integration**: `cat logs.txt | claude -p "explain these errors"`  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

### Model Selection
Three models available as of February 2026: [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

| Model | Use Case | Best For |
|-------|----------|----------|
| **Sonnet 4.5** | Default for Pro/Max5 | Most straightforward prompts, balanced performance  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |
| **Haiku 4.5** | Token-efficient tasks | Faster results, easier tasks, cost optimization  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |
| **Opus 4.5** | Complex multi-step work | SOTA performance, architectural planning, default for Max20  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |

Change models with `/model` slash command or `--model` flag. [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

## Configuration System

### Hierarchical Settings
Claude Code uses three-tier JSON configuration: [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

1. **User settings**: `~/.claude/settings.json` (global)
2. **Project settings**: `.claude/settings.json` (team-shared)
3. **Local settings**: `.claude/settings.local.json` (personal, gitignored)

**Example settings.json**:
```json
{
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 4096,
  "permissions": {
    "allowedTools": ["Read", "Write", "Bash(git *)"],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Write(./production.config.*)"
    ]
  },
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write(*.py)",
      "hooks": [{
        "type": "command",
        "command": "python -m black $file"
      }]
    }]
  }
}
```

### CLAUDE.md Memory Files
Automatically loaded context files that save tokens and time. Create hierarchically: [youtube](https://www.youtube.com/watch?v=0hdFJA-ho3c)

- **Global**: `~/.claude/CLAUDE.md`
- **Project root**: `./CLAUDE.md`
- **Subdirectories**: Component-specific instructions

**Example CLAUDE.md for your nxtg.ai project**:
```markdown
# NextGen AI (nxtg.ai) Project Context

## Architecture
- Frontend: React/Vite with TypeScript
- Backend: FastAPI (Python)
- Database: PostgreSQL with Redis caching
- AI: Multi-LLM orchestration (OpenAI, Anthropic, Google Gemini)
- Deployment: Docker containers, self-hosted + VPS

## Coding Standards
- Python: Black formatting, type hints required
- TypeScript: Strict mode, ESLint configuration
- Tests: pytest for backend, Jest for frontend
- Commit format: Conventional Commits

## Common Commands
- Start dev: `docker-compose up`
- Run tests: `pytest tests/` or `npm test`
- Format: `black .` or `npm run format`

## AI Agent Patterns
- Use agentic workflow patterns
- Implement MCP for tool integration
- Context window optimization priority
```

## Advanced Features

### Custom Slash Commands
Create reusable prompt shortcuts in Markdown: [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

**Project commands** (`.claude/commands/optimize.md`):
```markdown
Analyze this code for performance issues and suggest optimizations with specific focus on:
- Database query efficiency
- Memory usage patterns
- API response times
```

**Parameterized commands** (`.claude/commands/fix-issue.md`):
```markdown
Fix issue #$ARGUMENTS following our coding standards. Review related tests and update documentation.
```

Use: `/optimize` or `/fix-issue 123` in session. [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

### Hooks for Automation
Auto-run commands after specific events: [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write(*.py)",
        "hooks": [{
          "type": "command",
          "command": "python -m black \"$file\""
        }]
      }
    ],
    "SessionStart": [{
      "type": "command",
      "command": "git fetch origin"
    }]
  }
}
```

**Hook events**: `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `SessionStart`. [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

### Model Context Protocol (MCP)
Extend Claude Code with external integrations: [youtube](https://www.youtube.com/watch?v=0hdFJA-ho3c)

```bash
claude mcp add my-server -e API_KEY=123 -- /path/to/server arg1 arg2
```

**Use cases**:
- Google Drive for design docs [youtube](https://www.youtube.com/watch?v=0hdFJA-ho3c)
- Jira ticket management [youtube](https://www.youtube.com/watch?v=0hdFJA-ho3c)
- Custom dev tooling
- External databases [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

### Skills System
Markdown-based guides that Claude invokes via natural language: [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

Create `.claude/skills/add-feature/SKILL.md`:
```markdown
---
name: add-feature
description: Add new feature following nxtg.ai patterns
---

# Add Feature Skill

When implementing new features:
1. Check existing patterns in `src/features/`
2. Create feature directory with components, hooks, types
3. Add route in `src/routes/`
4. Write tests in `tests/features/`
5. Update API documentation
6. Add to CHANGELOG.md
```

### Subagents
Specialized Claude instances with distinct contexts and personas: [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

Create via `/agents` command or `.claude/agents/reviewer.md`:
```markdown
---
name: security-reviewer
description: Security-focused code review
model: opus-4.5
color: red
---

You are a security expert reviewing code for the NextGen AI platform. Focus on:
- Authentication/authorization vulnerabilities
- Data validation and sanitization
- API security best practices
- Secret management
- Dependency vulnerabilities
```

Claude automatically invokes subagents when tasks match their descriptions. [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

### Extended Thinking
Enabled by default; allows deeper reasoning before code generation: [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

- **Toggle during session**: `Option+T` (macOS) or `Alt+T` (Windows/Linux)
- **View thinking**: `Ctrl+O` for verbose mode
- **Limit token budget**: `export MAX_THINKING_TOKENS=10000`

Note: You're charged for thinking tokens. [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

## File & Directory References

Use `@` syntax to reference files in prompts: [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

```
> Review security in authentication. @./src/auth/
> Compare implementations. @./src/old.js @./src/new.js
> Test coverage analysis. @./tests/**/*.test.ts
```

## Essential CLI Flags

| Flag | Purpose | Example |
|------|---------|---------|
| `--add-dir` | Additional working directories | `claude --add-dir ../apps ../lib`  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |
| `--allowedTools` | Pre-approve specific tools | `claude --allowedTools "Write" "Bash(git *)"`  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |
| `--disallowedTools` | Block dangerous operations | `claude --disallowedTools "Bash(rm *)"`  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |
| `--max-turns` | Limit conversation length | `claude -p --max-turns 3 "query"`  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |
| `--output-format` | JSON/text/stream-json | `claude -p --output-format json`  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |
| `--verbose` | Debug logging | `claude --verbose`  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |

## Workflows for Your Stack

### Feature Development
```bash
> Implement voice cloning endpoint in FastAPI following nxtg.ai patterns:
- Add route in src/api/voice.py
- Use existing audio processing utilities
- Implement rate limiting
- Add comprehensive tests
- Update API documentation
@./src/api/ @./src/utils/audio.py
```

### Multi-Agent Orchestration
```bash
> Design agent orchestration system for nxtg.ai that:
- Supports multiple LLM providers (OpenAI, Anthropic, Google)
- Implements intelligent routing based on task type
- Handles context window optimization
- Provides fallback mechanisms
@./src/agents/
```

### Code Review & Optimization
```bash
> Review this LLM integration code for:
- Error handling and retries
- Cost optimization (token usage)
- Response caching strategies
- Rate limit handling
@./src/integrations/llm/
```

### CI/CD Integration
```bash
# In GitHub Actions
claude -p "Review new code for security issues, suggest fixes if found"
claude -p "If tests fail, analyze logs and propose fixes"
```

## Security Best Practices

### Permission Configuration
```json
{
  "permissions": {
    "allowedTools": [
      "Read",
      "Write(src/**)",
      "Bash(git *)",
      "Bash(npm *)",
      "Bash(pytest *)"
    ],
    "deny": [
      "Read(.env*)",
      "Read(*.key)",
      "Write(production.config.*)",
      "Bash(rm *)",
      "Bash(sudo *)",
      "Bash(curl *://*/admin*)"
    ]
  }
}
```

**Always**: [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)
- Review changes before accepting
- Use `.claude/settings.local.json` for sensitive settings
- Keep API keys in `.env` files (deny Claude access)
- Verify bash commands before execution

## Plan Selection for Your Workload

| Plan | Monthly Cost | Use Case | Opus Access |
|------|--------------|----------|-------------|
| **Pro** | $20 | Medium coding workload, supplement to manual coding | Limited  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |
| **Max5** | $100 | Intense workload, 5x Pro tokens | Yes  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |
| **Max20** | $200 | Near-autonomous heavy development, 20x Pro tokens | Yes (default)  [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features) |

Sessions last 5 hours. For autonomous multi-agent systems like nxtg.ai, Max20 or API usage recommended. [venturebeat](https://venturebeat.com/orchestration/claude-code-just-got-updated-with-one-of-the-most-requested-user-features)

## Git Worktree Pattern

For parallel development on multiple features: [youtube](https://www.youtube.com/watch?v=0hdFJA-ho3c)

```bash
# Create worktrees
git worktree add ../nxtg-feature-a feature-a
git worktree add ../nxtg-feature-b feature-b

# Launch Claude in each (separate terminals)
cd ../nxtg-feature-a && claude
cd ../nxtg-feature-b && claude

# Clean up when done
git worktree remove ../nxtg-feature-a
```

## Platform Integrations

Claude Code works across multiple environments: [youtube](https://www.youtube.com/watch?v=0hdFJA-ho3c)

- **Terminal CLI**: Core experience
- **Web**: claude.ai/code (no local setup, parallel tasks, diff view)
- **VS Code**: Native extension with inline diffs
- **Desktop app**: Standalone with git worktree support
- **JetBrains**: Plugin for IntelliJ, PyCharm, WebStorm
- **GitHub Actions**: `@claude` mentions for automation
- **Slack**: Route tasks via Slack mentions

## Pro Tips from Heavy Users

1. **Minimize context** - Only provide relevant files [reddit](https://www.reddit.com/r/ClaudeAI/comments/1qcan9z/my_top_10_claude_code_tips_from_11_months_of/)
2. **Step-by-step approach** - Break complex tasks into stages [reddit](https://www.reddit.com/r/ClaudeAI/comments/1qcan9z/my_top_10_claude_code_tips_from_11_months_of/)
3. **Discussion before code** - Plan architecture before implementation [reddit](https://www.reddit.com/r/ClaudeAI/comments/1qcan9z/my_top_10_claude_code_tips_from_11_months_of/)
4. **Git proficiency** - Use branches effectively for Claude experiments [reddit](https://www.reddit.com/r/ClaudeAI/comments/1qcan9z/my_top_10_claude_code_tips_from_11_months_of/)
5. **CLAUDE.md maintenance** - Keep project context files updated [youtube](https://www.youtube.com/watch?v=0hdFJA-ho3c)
6. **Bash tool documentation** - Document custom scripts in CLAUDE.md [youtube](https://www.youtube.com/watch?v=0hdFJA-ho3c)

---

