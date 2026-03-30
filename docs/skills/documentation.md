# Documentation

> Teaches agents the documentation hierarchy, staleness detection rules, and auto-generation patterns that keep docs synchronized with code -- because undocumented features are invisible features.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Knowledge |

---

## What It Provides

This skill encodes a complete documentation management system: the directory hierarchy (getting-started, guides, api, components, cli, architecture, templates), the four documentation types and their ownership models, staleness detection triggers, and quality checklists. It teaches agents to maintain documentation as a living system that stays synchronized with code, not as a one-time writing exercise that decays.

Without this skill, agents produce documentation at creation time and never update it. API docs describe endpoints that no longer exist. Code examples use deprecated syntax. Internal links point to moved files. The skill prevents this by teaching agents to detect staleness (file hash changed since last doc update, new exports not documented, function signatures changed, version mismatches, broken links, failing code examples) and to treat documentation updates as part of every code change.

The knowledge covers JSDoc annotations that auto-generate API reference documentation, README structures, ADR templates, component documentation, changelog generation from conventional commits, and the specific quality checklist every documentation file must pass.

## When It Activates

- When an agent is creating or modifying user-facing features
- When writing API endpoints, components, or CLI commands that need docs
- When auditing existing documentation for staleness or accuracy
- When generating changelogs or release notes

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### The Four Documentation Types

Reference documentation (API endpoints, component props, CLI commands) is auto-generated from code annotations -- the skill shows the exact JSDoc format that produces clean API docs with authentication requirements, rate limits, parameters, responses, errors, and curl examples. Conceptual documentation (architecture overviews, design decisions) is human-written with AI assistance for formatting. Tutorial documentation (step-by-step guides) is human-outlined with AI expansion. Changelogs are fully automated from conventional commits. Each type has a different owner and update cadence.

### Staleness Detection

The skill defines four staleness signals: code-doc divergence (file hashes differ since last doc update, new exports undocumented, signature changes), time-based decay (no updates in 90+ days for active areas, version mismatches), link rot (broken internal links, external 404s), and example failures (code examples that no longer compile, API examples that return errors). Agents are taught to check for these signals during documentation audits and to flag stale docs proactively.

### Auto-Generation from Code Annotations

The skill shows how structured JSDoc annotations transform into formatted API documentation. A `@endpoint POST /api/users` annotation with `@auth`, `@rateLimit`, `@param`, `@returns`, and `@throws` tags auto-generates a markdown page with tables for request body fields, error codes, authentication requirements, and working curl examples. This pattern ensures API docs are never out of sync with code -- the docs are generated from the same source.

### Documentation Quality Checklist

Every documentation file must have: clear title and purpose, last updated date, version compatibility note, working code examples, links to related docs, no broken links, no outdated screenshots. This checklist is concrete enough for agents to verify programmatically.

## How to Leverage It

When completing a feature, include "update documentation" in your prompt. The skill guides agents to update the relevant docs based on the type of change. For API changes, it updates reference docs. For architecture changes, it flags conceptual docs for review. For new features, it generates tutorial outlines.

### Example: API Documentation

```
User: "Add a webhook endpoint and document it"

What happens: The skill activates and the agent writes the endpoint with structured
JSDoc annotations. It then generates the corresponding API documentation page with
parameter tables, error codes, authentication requirements, and a working curl example.
The changelog is updated.
```

## Power Applications

The staleness detection rules compound over time. An agent that checks for documentation staleness on every code change prevents documentation debt from accumulating. A codebase where docs are always current is dramatically easier to onboard into, debug, and extend.

The auto-generation pattern means documentation accuracy is guaranteed for reference docs. When the code changes, the generated docs change with it. No manual synchronization required.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **coding-standards** | Docstring format (Google-style) defined in coding standards, applied here |
| **git-workflow** | Conventional commits that this skill uses for changelog generation |
| **claude-code-best-practices** | CLAUDE.md as a documentation pattern for project context |

## Tips

- Reference documentation should be generated from code annotations, not written by hand.
- If documentation is stale, fixing it is as important as fixing the code it describes.

---

*See also: [coding-standards](coding-standards.md) | [git-workflow](git-workflow.md)*
