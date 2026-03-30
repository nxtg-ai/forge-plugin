# Claude Code Framework

> The comprehensive reference for Claude Code's architecture, MCP integration, skills system, Plan Mode, and Unix composability -- the platform that NXTG-Forge is built on and extends.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Framework |

---

## What It Provides

This skill is the definitive reference for Claude Code's capabilities. It covers MCP server configuration (HTTP, SSE, stdio transports with scope hierarchy), the CLAUDE.md project intelligence system, the skills discovery and progressive disclosure mechanism, Plan Mode for architecture-before-implementation workflows, and Unix-style composability with pipes and scripting. It is the knowledge base that NXTG-Forge was built on -- understanding Claude Code's architecture is essential for extending it effectively.

Without this skill, agents building on Claude Code would not understand MCP scope precedence (Local > Project > User), would not know how skills use progressive disclosure (100 tokens of YAML metadata first, full content loaded on demand), and would not leverage Plan Mode for complex features. The skill prevents agents from fighting the platform by teaching them how it works.

The knowledge is sourced from official Anthropic documentation, verified third-party resources, and practical engineering experience. It covers the full MCP lifecycle (server types, scope hierarchy, dynamic tool loading, output limits, enterprise management), the skills system internals (discovery, activation, contextual loading), and advanced workflows (checkpoints, subagents, hooks, background tasks).

## When It Activates

- When building plugins, commands, agents, or skills for Claude Code
- When configuring MCP servers or debugging MCP connectivity
- When designing multi-agent workflows or subagent architectures
- When optimizing context usage or managing token budgets

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### MCP Integration Architecture

Three transport types: HTTP (remote cloud services), SSE (real-time data streams), stdio (local process tools). Three scope levels: Local (project-specific, highest priority), Project (team-shared, version-controlled `.mcp.json`), User (global `~/.claude.json`). Dynamic tool loading activates when MCP tools exceed 10% of context window, loading tools on-demand instead of preloading all. Output limits default to 25,000 tokens (configurable via `MAX_MCP_OUTPUT_TOKENS`). Enterprise management via managed-mcp.json with allowlist/denylist policies. This architecture knowledge lets agents configure MCP correctly and debug connection issues.

### Skills System Internals

Skills use pure LLM reasoning for activation -- no embeddings, classifiers, or pattern matching. At session start, Claude scans available skills and loads approximately 100 tokens of YAML metadata (name + description) per skill. When a task matches a skill's description, the full content is loaded dynamically. Skills are discovered from `~/.claude/skills/` (user-level), `.claude/skills/` (project-level), and plugin-provided locations. This progressive disclosure pattern keeps token usage minimal until a skill is actually needed.

### Plan Mode for Complex Work

Before implementing, Claude generates a detailed plan (project structure, data models, component hierarchy, implementation phases, design decisions with rationale) and waits for approval. The user can refine the plan through conversation before any code is written. This prevents wasted implementation effort from misaligned understanding and gives the user architect-level consultation before builder-level execution.

### Subagent Orchestration

Specialized Claude instances with distinct contexts and personas, launched for parallel workflows. One subagent codes the backend API while another builds the frontend. Skills can be shared across subagents. The agent definition format uses markdown with YAML frontmatter (name, description, model, color) and a system prompt body. Claude automatically invokes subagents when tasks match their descriptions.

### Unix Composability

Claude Code is pipeable and scriptable: `tail -f app.log | claude -p "alert on anomalies"`, `cat data.csv | claude -p "analyze trends"`. Print mode (`-p`) enables single-query scripting. Session continuation (`-c`) enables multi-step workflows. Output format options (json, text, stream-json) enable integration with other tools.

## How to Leverage It

When building NXTG-Forge components, reference this skill's knowledge of Claude Code internals. When configuring MCP servers, use the exact scope and transport patterns. When creating new skills, follow the progressive disclosure pattern (concise YAML description, detailed content body).

### Example: MCP Configuration

```
User: "Add a PostgreSQL MCP server for the analytics database"

What happens: The skill activates and the agent knows to use stdio transport with
npx, configure the DSN, set the appropriate scope (project for team-shared, local
for personal credentials), and test the connection with a simple query.
```

## Power Applications

The dynamic tool loading mechanism is critical for NXTG-Forge, which registers two MCP servers (governance-mcp with 8 tools, orchestrator-mcp with 10 tools). Without dynamic loading, 18 tool definitions would consume significant context. With it, only relevant tools are loaded per query.

Understanding the skills system internals enables writing better skill descriptions. A well-written description (100 tokens of precise context) activates correctly; a vague description activates too broadly or not at all.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **claude-code-best-practices** | Practical usage patterns built on this architectural foundation |
| **core-nxtg-forge** | NXTG-Forge platform that extends Claude Code using these capabilities |
| **codex-framework** | Comparison framework for cross-platform compatibility |

## Tips

- This skill is reference material about Claude Code's architecture. For practical best practices, see claude-code-best-practices.
- MCP scope precedence (Local > Project > User) means local config always wins. Debug MCP issues by checking all three levels.

---

*See also: [claude-code-best-practices](claude-code-best-practices.md) | [core-nxtg-forge](core-nxtg-forge.md)*
