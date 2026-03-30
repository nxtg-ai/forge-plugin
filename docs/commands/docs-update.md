# /forge:docs-update

> Identify stale documentation by comparing source and doc timestamps, then update docs to match current code or add missing JSDoc comments.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Documentation |
| **Syntax** | `/forge:docs-update [--file <path>] [--dry-run] [--jsdoc] [--all]` |

---

## What It Does

`/forge:docs-update` is the documentation fixer. It compares recently changed source files (from the last 20 commits or 7 days) against documentation files to find staleness, then reads both the outdated doc and the current source code to identify discrepancies -- new functions, changed interfaces, removed features. For each stale doc, it shows what will change, updates the content to match the current source, and preserves the existing doc structure and formatting.

The `--jsdoc` mode focuses on source code documentation. It finds exported functions, classes, and interfaces that are missing JSDoc comments, reads the implementation to understand what they do, and generates appropriate JSDoc annotations directly in the source files. This is the fastest way to boost your documentation coverage percentage.

Without this command, keeping docs current is a manual process: you notice something is wrong, find the doc, read the source, figure out what changed, and update. Most of the time, you do not notice until someone reads the wrong information. `/forge:docs-update` proactively finds staleness and fixes it.

## Syntax & Options

```
/forge:docs-update [--file <path>] [--dry-run] [--jsdoc] [--all]
```

| Option | Description |
|--------|------------|
| `--file <path>` | Update a specific documentation file instead of scanning all |
| `--dry-run` | Show what would be updated without making any changes |
| `--jsdoc` | Focus on adding and updating JSDoc comments in source files |
| `--all` | Update all documentation files regardless of staleness |

## When to Use It

- **After a feature lands**: Source code changed but docs did not. Run docs-update to sync them.
- **Before a release**: Ensure all documentation reflects the current state of the code.
- **JSDoc blitz**: Use `--jsdoc` to add documentation to all undocumented exports in one pass.

For checking documentation health without making changes, use `/forge:docs-status`. For a comprehensive quality audit with link validation, use `/forge:docs-audit`.

## Examples

### Example 1: Auto-detect and Fix Stale Docs

```
/forge:docs-update
```

```
DOCUMENTATION UPDATES
======================

Updated:
  [x] docs/API.md: Added new /notifications endpoint documentation
  [x] docs/ARCHITECTURE.md: Updated service layer diagram

Needs human review:
  [ ] docs/DEPLOYMENT.md: Deployment process may have changed (manual check needed)

Skipped:
  [-] docs/TESTING.md: Already current

Summary:
  Files updated: 2
  JSDoc added: 0
  Manual review needed: 1
```

### Example 2: JSDoc Mode

```
/forge:docs-update --jsdoc
```

Scans all source files for exported symbols missing JSDoc, generates documentation based on the implementation, and adds it:

```
DOCUMENTATION UPDATES
======================

Updated:
  [x] src/services/auth.ts: Added JSDoc to 3 exports
  [x] src/utils/validators.ts: Added JSDoc to 5 exports

Summary:
  Files updated: 2
  JSDoc added: 8
  Manual review needed: 0
```

### Example 3: Dry Run

```
/forge:docs-update --dry-run
```

Shows exactly what would change without modifying any files. Useful for reviewing before applying.

## Power Use Cases

Chain `/forge:docs-status` (to see the current state) then `/forge:docs-update --jsdoc` (to fix coverage gaps) then `/forge:docs-status` again (to verify improvement). Track the coverage percentage increase.

Use `--file docs/API.md` to update a single doc after a specific API change, rather than scanning the entire project.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:docs-status** | Status identifies the problems; update fixes them |
| **/forge:docs-audit** | Audit provides the deep quality analysis; update provides the fixes |
| **/forge:gap-analysis** | Gap analysis documentation dimension overlaps; use update to fix the gaps it finds |
| **docs agent** | For complex documentation that needs full rewriting, assign the docs agent |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full stale documentation detection, auto-update, and JSDoc generation |
| **L2 Pro Builder** | Documentation updates recorded in orchestrator knowledge base |
| **L3 Ship Lord** | Documentation freshness trends visible in the forge-ui dashboard |

## Tips & Gotchas

- The command compares git modification timestamps to detect staleness. Files that have not been committed will not show up in the staleness check.
- JSDoc mode generates comments based on reading the actual implementation. Review the generated JSDoc for accuracy -- especially for complex functions where intent may differ from implementation.
- Files that cannot be automatically updated (ambiguous changes, architectural rewrites) are flagged for manual review rather than skipped silently.
- If no `docs/` directory exists, the command offers to create one with a basic structure.

---

*See also: [docs-status](../commands/docs-status.md) | [docs-audit](../commands/docs-audit.md) | [gap-analysis](../commands/gap-analysis.md)*
