# /forge:docs-status

> Show documentation health at a glance -- key files, source code JSDoc coverage, freshness, and actionable recommendations.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Documentation |
| **Syntax** | `/forge:docs-status` |

---

## What It Does

`/forge:docs-status` answers the question "how is our documentation?" in under a minute. It checks for essential files (README.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE), counts files in the docs directory, measures JSDoc coverage on exported symbols in source code, and compares documentation freshness against source code modification times.

The freshness check is particularly valuable: if source files have been modified more recently than documentation files, it warns you that docs may be stale. This catches the common scenario where features evolve but documentation falls behind, creating a mismatch between what the docs say and what the code does.

Without this command, assessing documentation health means manually checking whether key files exist, grep-searching for JSDoc comments, and comparing file timestamps. `/forge:docs-status` automates all of that and ends with prioritized recommendations and links to the deeper docs commands.

## Syntax & Options

```
/forge:docs-status
```

This command takes no arguments. It always runs the full documentation health check.

## When to Use It

- **Before a release**: Verify that documentation is current before shipping.
- **New contributor onboarding**: Check whether the project has the documentation a new contributor would need (README, CONTRIBUTING, etc.).
- **Weekly documentation review**: Quick pulse check on documentation health.

For detailed quality auditing with link validation and code example checking, use `/forge:docs-audit`. For automatically fixing stale documentation, use `/forge:docs-update`.

## Examples

### Example 1: Standard Documentation Status

```
/forge:docs-status
```

```
DOCUMENTATION STATUS
======================

Key Files:
  README.md:       EXISTS
  CHANGELOG.md:    EXISTS
  CONTRIBUTING.md:  MISSING
  LICENSE:         EXISTS

Documentation Directory:
  docs/ files: 5
    docs/API.md
    docs/ARCHITECTURE.md
    docs/DEPLOYMENT.md
    docs/DEVELOPMENT.md
    docs/TESTING.md

Source Documentation:
  Exported symbols: 87
  With JSDoc: 52
  Without JSDoc: 35
  Coverage: 59.8%

Freshness:
  Docs last updated: 3 days ago
  Source last updated: 2 hours ago
  WARNING: Source is newer than docs -- documentation may be stale

Recommendations:
  1. Add CONTRIBUTING.md for new contributors
  2. Add JSDoc to 35 undocumented exports (run /forge:docs-update --jsdoc)

---
Actions:
  /forge:docs-audit    Detailed documentation audit
  /forge:docs-update   Update stale documentation
```

## Power Use Cases

Run `/forge:docs-status` as a pre-commit sanity check. If the freshness warning fires (source newer than docs), investigate before committing to prevent documentation drift.

Track JSDoc coverage percentage over time. Run docs-status at sprint boundaries and compare the coverage number to measure documentation improvement.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:docs-audit** | Status is the quick check; audit is the deep dive with link validation |
| **/forge:docs-update** | Status identifies staleness; update fixes it |
| **/forge:gap-analysis** | Gap analysis includes a documentation dimension that overlaps with docs-status |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full documentation health check with key files, JSDoc coverage, and freshness |
| **L2 Pro Builder** | Documentation metrics contribute to orchestrator health scores |
| **L3 Ship Lord** | Documentation health visible in the forge-ui dashboard documentation panel |

## Tips & Gotchas

- The JSDoc coverage check looks for `/**` comments preceding `export` statements. Inline `//` comments do not count.
- Freshness comparison uses git log timestamps. If docs were recently committed (even without content changes), the freshness warning may not fire.
- If the `docs/` directory does not exist, the command notes it and suggests creating one with basic structure.
- This command reads only -- it never modifies files. Use `/forge:docs-update` for actual changes.

---

*See also: [docs-audit](../commands/docs-audit.md) | [docs-update](../commands/docs-update.md) | [gap-analysis](../commands/gap-analysis.md)*
