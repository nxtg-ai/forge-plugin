# CLAUDE.md — Forge Plugin

Claude Code plugin for AI-powered development governance. The plugin is primarily markdown, shell hooks, and a lightweight Node.js MCP server.

## Quick Reference

```bash
cd plugins/nxtg-forge/servers/governance-mcp
npm install
node index.mjs
```

Install with Claude Code using the repository's documented plugin marketplace flow.

## Plugin Structure

```text
plugins/nxtg-forge/
├── .claude-plugin/            # plugin manifest
├── .mcp.json                  # MCP registration
├── commands/                  # slash commands
├── agents/                    # specialized agent definitions
├── skills/                    # contextual skills
├── hooks/                     # governance and security hooks
└── servers/governance-mcp/    # Node.js MCP server
```

## Development Rules

- Preserve valid YAML frontmatter in commands, agents, and skills.
- Keep plugin paths relative to `${CLAUDE_PLUGIN_ROOT}`. Do not introduce developer-machine absolute paths.
- Keep security guards blocking only where the hook contract explicitly requires denial; ordinary governance checks should remain advisory.
- Do not add duplicate MCP tools that collide with forge-orchestrator.
- Run the repository test suite before declaring a change complete.
- Do not commit credentials, local environment files, generated audit output, personal workspaces, or organization-internal operating context.

## Public / Private Boundary

This is a public product repository. Only product behavior, public examples, tests, and public-facing development guidance belong here.

The following classes of data must remain outside the Git tree:

- private portfolio or program state
- internal directives, handoffs, operating journals, or agent workspaces
- organization-internal runtime paths, hostnames, network addresses, or machine topology
- private cross-project memory or retrieval configuration
- generated audits containing data from private repositories
- credentials, tokens, environment files, or secrets

Use synthetic fixtures and generic examples whenever tests need cross-project or multi-agent scenarios.

## MCP Integration

Forge Plugin can integrate with forge-orchestrator through MCP stdio and can launch the Forge UI as documented by the public product interfaces. Keep repository coupling limited to supported public interfaces rather than private filesystem assumptions.

## Security Expectations

- Secret files such as `.env`, private keys, and credentials must never be committed.
- Security hooks should fail safely and report actionable errors.
- Examples and fixtures must contain placeholders only.
- Generated internal audit records must stay local unless explicitly scrubbed for public release.

## Release Discipline

For public releases, keep version metadata, changelog entries, tags, and release artifacts consistent. Do not publish or tag from an unverified working tree.
