# Docs

> Generates and audits documentation -- TSDoc for every export, changelogs from commits, README accuracy checks, and coverage reports that show exactly what is undocumented.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Specialist |
| **Model** | Sonnet |

---

## What It Does

The Docs agent treats documentation as a first-class deliverable, not an afterthought. It generates TSDoc/JSDoc for TypeScript code with proper parameter descriptions, return types, and usage examples. It creates changelogs from conventional commit messages, grouping entries by Added/Fixed/Changed. It audits existing documentation for staleness and gaps -- finding README sections that describe features that no longer exist, API docs that do not match implemented endpoints, and public functions that lack docstrings.

What makes this agent more than "add a comment above each function" is its understanding of documentation quality. It writes TSDoc that explains the why, not the what. A function called `calculateHealthScore` does not need a docstring that says "Calculates the health score." It needs one that explains the weighted formula, the input ranges, and a usage example that shows real values. The Docs agent generates this level of documentation because it reads the implementation, understands the logic, and writes descriptions that a newcomer would find useful.

The agent also performs documentation audits. It scans all public exports and reports a coverage metric: `documented / total public APIs`. It flags documentation older than 30 days for review. It compares README sections against the actual project structure and reports discrepancies. This turns documentation from a "we should do this someday" task into a measurable quality dimension with a concrete number to improve.

## When to Use It

- **After adding new components or services**: When new code has been written and needs comprehensive TSDoc documentation with parameter descriptions and examples.
- **Before a release**: When you need a changelog generated from conventional commits covering everything since the last version tag.
- **When documentation feels stale**: When you suspect the README, API docs, or architecture guides no longer match the actual codebase and need an audit.
- **When onboarding a new team member**: When you need documentation coverage increased across the codebase so newcomers can understand the code through its docs.

Do not use the Docs agent for code implementation (use Builder), architecture design documents (use Planner for design decisions), or testing (use Testing). The Docs agent documents existing code; it does not write new code.

## How It Works

The Docs agent operates in three modes:

**Generation Mode:**
1. Reads the target source file and understands each export: functions, classes, types, constants
2. Analyzes implementation logic to understand purpose, parameters, return values, and edge cases
3. Generates TSDoc with: description, @param annotations with types and descriptions, @returns with type and meaning, @example with realistic usage, and @remarks for important caveats
4. Follows the project's existing documentation style (detected from documented files)

**Changelog Mode:**
1. Reads git log since the last version tag
2. Parses conventional commit messages (feat:, fix:, docs:, refactor:, test:)
3. Groups entries under Added, Fixed, Changed, and Removed sections
4. Links commit SHAs for traceability
5. Formats as a CHANGELOG.md entry with version and date

**Audit Mode:**
1. Scans all public exports across the codebase
2. Checks each export for TSDoc presence and completeness
3. Verifies README accuracy against project structure
4. Flags documentation older than 30 days
5. Reports: `documented/total` ratio with specific file:export gap list

## Examples

### Example 1: Documenting New Dashboard Components

```
User: "Can you document the new dashboard components?"

Docs:
  - Scans: src/components/dashboard/ -- 8 components, 3 documented
  - Generates TSDoc for 5 undocumented components:
    /**
     * LiveActivityFeed displays real-time agent activity in a scrollable feed.
     *
     * Connects to the WebSocket server and renders activity events with
     * virtual scrolling for performance. Supports filtering by severity.
     *
     * @remarks
     * Uses WebSocket auto-reconnect with exponential backoff (max 3 attempts).
     * Activities are capped at 100 items with LRU eviction.
     */
  - Documents: All props interfaces with @param descriptions
  - Adds: @example blocks showing typical usage
  - Result: 8/8 components documented (was 3/8), coverage 100%
```

### Example 2: Generating a Changelog

```
User: "Generate a changelog from recent commits"

Docs:
  - Reads: git log v3.0.0..HEAD -- 23 commits
  - Parses: 8 feat, 5 fix, 4 docs, 3 refactor, 2 test, 1 chore
  - Generates:
    ## [3.1.0] - 2026-03-29

    ### Added
    - Real-time activity feed with virtual scrolling (#42)
    - WebSocket auto-reconnect with exponential backoff (#38)
    - Agent configuration PATCH endpoint (#35)

    ### Fixed
    - Memory leak in terminal panel on disconnect (68b9a5b)
    - Race condition in concurrent task updates (a1c3e7f)

    ### Changed
    - WebSocket reconnect now uses bounded attempts (max 3)
  - Result: Release-ready changelog entry grouped by type with commit references
```

### Example 3: Documentation Audit

```
User: "Audit the documentation coverage"

Docs:
  - Scans: 142 public exports across 38 files
  - Finds: 89 documented (63%), 53 missing documentation
  - Critical gaps:
    - src/services/api-client.ts: 0/6 methods documented
    - src/hooks/useWebSocket.ts: 0/1 hook documented
    - src/services/governance-state-manager.ts: 2/8 methods documented
  - README check: Installation section references old command, Features section missing 3 new features
  - Stale docs: Architecture guide last updated 45 days ago
  - Result: Coverage report with prioritized gap list -- critical services first
```

## Power Use Cases

**Detective Subagent Mode**: The Detective spawns the Docs agent as one of four parallel subagents during health checks. Docs provides the documentation coverage score for the health report while Testing, Security, and Performance handle their dimensions.

**Post-Feature Documentation**: After Builder completes a feature, Planner routes to the Docs agent to add TSDoc on all new exports. This ensures features ship with documentation, not with a "will document later" TODO that never gets done.

**Release Pipeline**: Before every release, run the Docs agent in changelog mode to generate the CHANGELOG.md entry. Then run it in audit mode to verify documentation is current. This makes releases consistently documented without manual effort.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Detective** | Detective spawns Docs as a subagent for documentation coverage scoring during health checks. |
| **Planner** | After feature implementation, Planner routes to Docs for TSDoc generation on new exports. |
| **Guardian** | Guardian checks for missing documentation as part of its quality gate. Docs generates the documentation to close the gaps. |
| **/forge:docs-audit** | The `/forge:docs-audit` command triggers the Docs agent in audit mode for a quick coverage check. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | TSDoc/JSDoc generation with parameter descriptions and examples. Changelog generation from conventional commits. Documentation audit with coverage metrics. README accuracy checking. |
| **L2 Pro Builder** | Documentation coverage tracked in `forge_get_health` scores. Documentation decisions recorded via `forge_capture_knowledge`. |
| **L3 Ship Lord** | Documentation coverage percentage visible in the forge-ui dashboard health panel. Gap list surfaced alongside other quality metrics. |

## Tips & Gotchas

- **Do**: Run the Docs agent after every feature completion, not just before releases. Documentation debt compounds faster than test debt.
- **Don't**: Accept generated docs without review. The Docs agent writes good TSDoc, but domain-specific nuances might need human refinement.
- **Do**: Use the audit mode regularly to maintain a documentation coverage metric. A number (63%) is harder to ignore than a vague feeling ("we should document more").
- **Don't**: Document internal implementation details. TSDoc should explain the public API contract: what a function accepts, what it returns, and why you would use it. Internal implementation comments belong inline.
- **Do**: Include @example blocks in TSDoc. A usage example is worth more than three paragraphs of description.

---

*See also: [Detective](detective.md) | [Guardian](guardian.md) | [/forge:docs-audit](../commands/docs-audit.md)*
