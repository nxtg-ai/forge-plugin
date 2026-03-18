# Contributing to forge-plugin

Contributions welcome in three areas: plugin content (agents, skills, commands), MCP server fixes, and documentation. No build toolchain required for plugin content — all files are markdown loaded by Claude Code at runtime.

## Project Structure

```
plugins/nxtg-forge/
├── .claude-plugin/plugin.json   # Manifest (name, version)
├── .mcp.json                    # MCP server registration
├── commands/                    # Slash commands (*.md)
├── agents/                      # Agent definitions (*.md)
├── skills/                      # Skills (*/SKILL.md)
├── hooks/scripts/               # Bash lifecycle hooks
└── servers/governance-mcp/      # Node.js MCP server
    ├── index.mjs                # Server entry point + MCP wiring
    ├── tools.mjs                # Tool implementations (9 exported functions)
    └── tests/                   # Vitest test suite
```

## Development Setup

```bash
git clone https://github.com/nxtg-ai/forge-plugin
cd forge-plugin/plugins/nxtg-forge/servers/governance-mcp
npm install
```

That's the only install step. Plugin content (agents, skills, commands) needs no setup.

## Running Tests

Two test suites must both pass before any commit:

```bash
# Primary CI — Vitest (run from governance-mcp/)
cd plugins/nxtg-forge/servers/governance-mcp
npx vitest run
# Expected: 27/27 pass

# Full suite — node:test
FORGE_TEST_MODE=1 node --test __tests__/health.test.mjs
# Expected: 43/43 pass
```

`FORGE_TEST_MODE=1` prevents the MCP server from calling `server.connect()`, which would block the process. Always set this flag when running node:test directly.

## Plugin Content

### Adding a Command

Create `plugins/nxtg-forge/commands/[FRG]-your-command.md`:

```markdown
---
description: "Short description shown in /help"
disable-model-invocation: true
---
# Command Title
Instructions for Claude Code to execute...
```

Commands must have `disable-model-invocation: true` to prevent accidental auto-trigger.

### Adding an Agent

Create `plugins/nxtg-forge/agents/your-agent.md`:

```markdown
---
name: forge-your-agent
description: |
  Use this agent when [scenario].
  <example>
  user: "..."
  assistant: "..."
  </example>
model: sonnet
color: cyan
tools: Glob, Grep, Read, Write, Edit, Bash
---
# Agent system prompt content...
```

Valid colors: `purple`, `cyan`, `green`, `orange`, `blue`, `red`. Valid models: `sonnet`, `opus`, `haiku`. Leaf worker agents (no sub-agent spawning) must not include `Task` in `tools`.

### Adding a Skill

Create `plugins/nxtg-forge/skills/your-skill/SKILL.md`:

```markdown
---
name: Skill Name
description: Use when [scenario]...
---
# Skill content...
```

## MCP Server Development

The governance MCP server lives entirely in `servers/governance-mcp/`. Tool logic is in `tools.mjs`; MCP protocol wiring is in `index.mjs`.

To test a tool change locally:

```bash
# Start the server in test mode to verify it initializes cleanly
FORGE_TEST_MODE=1 node index.mjs

# Run tests after any change to tools.mjs or index.mjs
npx vitest run
FORGE_TEST_MODE=1 node --test __tests__/health.test.mjs
```

Do not add new MCP tools that duplicate tools already exposed by the orchestrator MCP server (`forge_get_tasks`, `forge_claim_task`, `forge_complete_task`, `forge_get_state`, `forge_get_plan`, `forge_capture_knowledge`, `forge_get_knowledge`, `forge_check_drift`, `forge_set_project`). The plugin MCP server owns governance/health tooling only.

## Pull Request Guidelines

### Conventional Commits

```
feat(agents): add forge-data-pipeline agent
fix(governance-mcp): handle empty npm audit output
docs: update CONTRIBUTING.md
chore(release): bump to v3.5.0
```

Scopes: `governance-mcp`, `agents`, `commands`, `skills`, `hooks`.

### Version Bumps

- `feat(*)` → minor bump (3.4.x → 3.5.0)
- `fix(*)` → patch bump (3.4.7 → 3.4.8)

Three files must stay in sync on every release:
- `plugins/nxtg-forge/.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `plugins/nxtg-forge/servers/governance-mcp/package.json`

### Contributor License Agreement (CLA)

All contributors must sign the CLA before a pull request can be merged.

When you open a PR, the CLA bot will post a comment. Reply with:

```
I have read the CLA Document and I hereby sign the CLA
```

This records your agreement in `.github/cla-signatures.json`. You only need to sign once — subsequent PRs will be recognized automatically.

The CLA document is in [`CLA.md`](./CLA.md) (based on Apache ICLA terms). Bots and `dependabot[bot]` are automatically allowlisted.

> **Note:** The `CLA_PERSONAL_ACCESS_TOKEN` repository secret must be set for the bot to commit signatures. Contact a maintainer if the bot fails to record your signature.

### Before Submitting

1. CLA signed (first-time contributors only)
2. Both test suites pass (vitest + node:test)
2. YAML frontmatter is present on any new agent/skill/command
3. No absolute paths in plugin content — use `${CLAUDE_PLUGIN_ROOT}` instead
4. No blocking logic added to hooks (all hooks are advisory/non-blocking)
5. Version bumped and all three version files updated if the change is user-facing

## Code Style

No linter or formatter is enforced. For MCP server JavaScript, follow the existing ES module style in `tools.mjs` (named exports, async/await, no CommonJS). For markdown plugin files, follow the frontmatter conventions in CLAUDE.md.
