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
    ├── tools.mjs                # Tool implementations
    └── tests/                   # Vitest test suite
```

## Development Setup

```bash
git clone https://github.com/nxtg-ai/forge-plugin
cd forge-plugin/plugins/nxtg-forge/servers/governance-mcp
npm install
```

`npm install` installs the test tooling only (Vitest and the MCP SDK's client, both devDependencies); the server itself has no npm dependencies and needs Node.js 20 or newer. Plugin content (agents, skills, commands) needs no setup.

## Running Tests

Run these from `plugins/nxtg-forge/servers/governance-mcp`:

```bash
# What CI runs: Vitest, then the L1 and binding journeys
npm run test:ci

# Everything: also the L2 journey (needs the pinned `forge` binary on PATH)
# and the L3 journey (needs a forge-ui checkout with node_modules, in FORGE_UI_DIR or a sibling directory)
npm test
```

CI runs `npm run test:ci` only; L2 and L3 run locally. `vitest.config.mjs` sets `FORGE_TEST_MODE=1`, which keeps `index.mjs` from starting its stdio loop when a test imports it. Set it yourself if you import `index.mjs` outside Vitest.

## Plugin Content

### Adding a Command

Create `plugins/nxtg-forge/commands/your-command.md`:

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
# Start the server and send it one initialize request
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}' | node index.mjs

# Run tests after any change to tools.mjs or index.mjs
npm run test:ci
```

Do not add new MCP tools that duplicate tools already exposed by the orchestrator MCP server (`forge_get_tasks`, `forge_create_task`, `forge_claim_task`, `forge_complete_task`, `forge_get_state`, `forge_get_plan`, `forge_capture_knowledge`, `forge_get_knowledge`, `forge_check_drift`, `forge_get_health`, `forge_get_events`, `forge_set_project`). The plugin MCP server owns governance/health tooling only.

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

These version fields must agree on every release (`tests/version-surface.test.mjs` checks them):
- `.claude-plugin/plugin.json`
- `plugins/nxtg-forge/.claude-plugin/plugin.json`
- `plugins/nxtg-forge-orchestrator/.claude-plugin/plugin.json`
- both plugin entries in `.claude-plugin/marketplace.json`
- `plugins/nxtg-forge/servers/governance-mcp/package.json` and its `package-lock.json`

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
2. `npm run test:ci` passes
2. YAML frontmatter is present on any new agent/skill/command
3. No absolute paths in plugin content — use `${CLAUDE_PLUGIN_ROOT}` instead
4. No new blocking hook without review. The security guards, the enforced-task guard and gate, the required-output gate and the CEO-loop Stop hook block by design; every other hook is advisory
5. Version bumped in every version field above if the change is user-facing

## Code Style

No linter or formatter is enforced. For MCP server JavaScript, follow the existing ES module style in `tools.mjs` (named exports, async/await, no CommonJS). For markdown plugin files, follow the frontmatter conventions in CLAUDE.md.
