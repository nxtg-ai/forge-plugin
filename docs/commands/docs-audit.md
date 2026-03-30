# /forge:docs-audit

> Comprehensive documentation quality audit covering JSDoc coverage, key file inventory, link validation, code example verification, and freshness scoring.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Documentation |
| **Syntax** | `/forge:docs-audit` |

---

## What It Does

`/forge:docs-audit` is the deep documentation quality assessment. It runs five audit dimensions: coverage analysis (what percentage of exported symbols have JSDoc), file inventory (which key files like README, CHANGELOG, CONTRIBUTING, and LICENSE exist), link validation (do internal markdown links point to real files), code example validation (do code blocks in docs reference existing functions and files), and freshness scoring (how recently were docs updated relative to source).

The output is a multi-score report: Coverage %, Completeness %, Freshness %, and Link Health %, plus an overall average. Each dimension lists specific findings -- undocumented exports, missing key files, broken links, stale pages -- so you know exactly what to fix. The issues are severity-ranked and the recommendations are prioritized by impact.

Without this command, auditing documentation quality means manually checking for broken links, eyeballing JSDoc coverage by scrolling through code, and hoping someone notices when key files are missing. `/forge:docs-audit` automates the entire audit and gives you concrete scores to track over time.

## Syntax & Options

```
/forge:docs-audit
```

This command takes no arguments. It always runs the full five-dimension audit.

## When to Use It

- **Pre-release quality gate**: Ensure documentation meets a minimum quality bar before tagging a release.
- **New maintainer onboarding**: Audit the project's documentation to identify what a new contributor would need.
- **Quarterly documentation review**: Run it periodically to catch documentation decay.

For a quick health check without the full audit, use `/forge:docs-status`. For fixing issues found by the audit, use `/forge:docs-update`.

## Examples

### Example 1: Full Audit Report

```
/forge:docs-audit
```

```
DOCUMENTATION AUDIT REPORT
=============================
Generated: 2026-03-29T15:00:00Z

SCORES
  Coverage:     59% (52/87 exports documented)
  Completeness: 75% (3/4 key files present)
  Freshness:    60% (3/5 docs up-to-date)
  Link Health:  90% (9/10 links working)

  Overall: 71%

COVERAGE DETAILS
  Documented exports: 52
  Undocumented exports: 35
  Files with no docs: src/utils/crypto.ts, src/services/cache.ts

KEY FILES
  README.md:       EXISTS
  CHANGELOG.md:    EXISTS
  CONTRIBUTING.md: MISSING
  LICENSE:         EXISTS

FRESHNESS
  Most stale: docs/API.md (last updated 3 weeks ago)
  Most current: docs/DEVELOPMENT.md (updated today)

ISSUES FOUND
  HIGH - CONTRIBUTING.md is missing
  HIGH - 35 exports lack JSDoc
  MEDIUM - docs/API.md is 3 weeks stale
  LOW - 1 broken internal link in docs/ARCHITECTURE.md

RECOMMENDATIONS
  1. [HIGH] Create CONTRIBUTING.md for open-source readiness
  2. [HIGH] Add JSDoc to 35 undocumented exports (/forge:docs-update --jsdoc)
  3. [MEDIUM] Update docs/API.md to match current source

---
Actions:
  /forge:docs-update           Fix stale docs
  /forge:docs-update --jsdoc   Add missing JSDoc
```

## Power Use Cases

Track the four dimension scores (Coverage, Completeness, Freshness, Link Health) over time. Run the audit at regular intervals and log the scores. A declining trend in any dimension signals documentation decay that should be addressed before it compounds.

Use the link validation dimension as a pre-merge check. Broken internal links in documentation create a poor experience for readers and often indicate restructuring that was not reflected in docs.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:docs-status** | Quick health check; audit is the deep dive |
| **/forge:docs-update** | Audit finds the problems; update fixes them |
| **/forge:gap-analysis** | Gap analysis includes a documentation dimension, but audit goes deeper on docs specifically |
| **docs agent** | For large documentation rewrites, assign the docs agent to handle complex updates |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full five-dimension audit with scores, findings, and recommendations |
| **L2 Pro Builder** | Audit scores contribute to orchestrator health dimensions |
| **L3 Ship Lord** | Documentation audit history and trends visible in the forge-ui dashboard |

## Tips & Gotchas

- The Overall score is an unweighted average of the four dimensions. A single weak dimension (e.g., 20% coverage) drags the overall score down significantly.
- Link validation checks internal markdown links (`[text](./path.md)`). External URLs are not validated.
- Code example validation checks whether TypeScript code blocks reference function or file names that exist in the codebase. It does not execute the examples.
- The freshness check uses `git log` timestamps. Recently committed files (even without content changes) are considered "fresh."

---

*See also: [docs-status](../commands/docs-status.md) | [docs-update](../commands/docs-update.md) | [gap-analysis](../commands/gap-analysis.md)*
