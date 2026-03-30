# Release Sentinel

> Your documentation never drifts from your code again -- the agent that audits, maps, and auto-updates docs whenever your codebase changes.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Governance & Analysis |
| **Model** | Opus |

---

## What It Does

The Release Sentinel is a documentation management specialist that maintains synchronization between your code and your docs. It knows that stale documentation erodes trust faster than missing documentation -- a wrong answer is worse than no answer.

It works by maintaining a mapping between code patterns and documentation files. When your API endpoints change, it identifies which docs pages are affected. When you add a new CLI command, it flags the reference page that needs updating. When you ship a release, it compiles conventional commits into a human-readable changelog. The result is documentation that stays current without requiring a dedicated docs sprint every quarter.

The agent classifies documentation updates into three tiers: auto-updated (changelogs, API reference, type definitions), semi-auto (README sections, user guides, FAQ entries that need human review), and manual (architecture docs, concept explanations, diagrams). This tiered approach means the mechanical work is handled automatically while human judgment is preserved for content that requires it.

## When to Use It

- **Post-merge documentation sync**: After merging a PR that adds or modifies API endpoints, components, CLI commands, or configuration schemas.
- **Pre-release documentation audit**: Before cutting a release, to ensure all documentation reflects the current state of the codebase.
- **Documentation health check**: When you want a coverage score -- how much of your codebase has corresponding, up-to-date documentation.
- **Changelog generation**: When you need to compile conventional commits into a formatted, user-readable changelog for a new release.
- **Refactor aftermath**: After a significant refactoring that changed component interfaces, to identify which docs pages are now stale.

Do not use this agent for writing new documentation from scratch -- use the docs agent for that. The Release Sentinel audits and updates, it does not author.

## How It Works

1. **State Reading**: Reads documentation state from `.claude/project.json`, including last audit timestamp, coverage scores, and file tracking.
2. **Change Detection**: Scans code changes since the last audit using git history. Cross-references changes against documentation mapping patterns.
3. **Impact Classification**: For each affected mapping, determines the update category -- auto-update, semi-auto, or manual -- and acts accordingly.
4. **Auto-Updates**: Generates updated documentation for auto-update categories (changelogs from commits, API reference from decorators, type docs from hints).
5. **Flagging**: Adds semi-auto and manual items to a pending updates queue with suggested changes and priority levels.
6. **Reporting**: Outputs a coverage score, health summary, and prioritized list of documentation work needed.

## Examples

### Example 1: Post-Merge API Documentation Update

```
User: "I just added a new PATCH /users/{id}/avatar endpoint"

Release Sentinel:
  - Scans git diff for route changes
  - Identifies docs/api-reference.md as affected
  - Category: auto_update (API reference)
  - Generates endpoint documentation from route decorators
  - Updates API reference with new endpoint
  - Result: API docs reflect the new endpoint immediately.
```

### Example 2: Pre-Release Documentation Audit

```
User: "We're about to release v2.2.0, can you check our docs?"

Release Sentinel:
  - Reads .claude/project.json for last audit state
  - Scans all changes since last audit (143 files changed)
  - Finds: 3 auto-update items, 5 semi-auto items, 2 manual items
  - Auto-updates: CHANGELOG.md, CLI help reference, type definitions
  - Flags: README feature list (needs review), migration guide (new)
  - Coverage score: 84% (up from 79%)
  - Result: 3 docs auto-updated, 7 items in pending queue with
    suggested changes.
```

### Example 3: Component Refactor Documentation Sync

```
User: "I've finished refactoring the UI components"

Release Sentinel:
  - Detects 12 component files with interface changes
  - Maps to: component docs (4 pages), storybook stories (3),
    API reference (2 sections)
  - Auto-generates: Updated prop tables from TypeScript interfaces
  - Flags for review: Example code in tutorials (may need updating)
  - Identifies: 2 orphaned docs (for removed components)
  - Result: Component docs updated, orphaned pages flagged for
    deletion, tutorial examples queued for review.
```

## Power Use Cases

**Continuous Documentation CI**: Configure the Release Sentinel to run on every PR. It adds a comment listing which documentation files are affected by the code changes, preventing docs drift from entering the main branch.

**Documentation Coverage as a Quality Gate**: Use the coverage score as a governance metric. Set a threshold (e.g., 80%) and fail the release gate if documentation coverage drops below it. The Release Sentinel tracks this automatically.

**Multi-Project Documentation Sync**: In the NXTG-Forge ecosystem, changes to forge-orchestrator's MCP tools affect forge-plugin's documentation. The Release Sentinel can map cross-repo documentation dependencies and flag when upstream changes require downstream doc updates.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Wordsmith agent** | Release Sentinel identifies what needs updating; Wordsmith writes the actual content |
| **Guardian agent** | Documentation coverage becomes a quality gate in the governance pipeline |
| **/forge:deploy** | Pre-deployment docs audit ensures documentation ships alongside code |
| **/forge:docs-status** | Quick access to documentation health without running a full audit |
| **/forge:docs-audit** | Triggers a comprehensive Release Sentinel audit on demand |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full documentation auditing, changelog generation, coverage scoring, stale doc detection |
| **L2 Pro Builder** | + `forge_get_plan` for release-aware documentation updates; `forge_capture_knowledge` records audit findings |
| **L3 Ship Lord** | + Dashboard panel showing documentation health trends, coverage history, and pending update queue |

## Tips & Gotchas

- **Do**: Run a documentation audit before every release -- stale docs are the number one source of support tickets.
- **Do**: Configure documentation mappings in your project's governance config so the sentinel knows which code patterns map to which doc files.
- **Don't**: Treat auto-updated docs as final -- they are good first drafts but may need human polish for clarity.
- **Don't**: Ignore orphaned documentation warnings -- docs for removed features actively mislead users.

---

*See also: [wordsmith](wordsmith.md), [governance-verifier](governance-verifier.md)*
