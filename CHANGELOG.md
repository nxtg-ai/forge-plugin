# Changelog

All notable changes to the NXTG-Forge plugin are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.4.3] — 2026-03-12

### Fixed

- **Test scoring accuracy** — Health score now uses real line coverage (Istanbul/c8/nyc) for the Tests dimension when a coverage report exists. Previously, real coverage was displayed in the note but ignored for scoring — the score always used the file ratio proxy. Projects with 80% real coverage now score 16/20 instead of whatever the file ratio happened to be.
- **File ratio proxy too punishing** — When no coverage report exists, the file ratio proxy now awards a 5-point floor for "has tests at all" plus up to 15 scaled by ratio. A project with 1 test file and 3 source files now scores 10/20 (was 7/20). The note tells users to run `--coverage` for accurate scoring.

### Tests

- **26/26 vitest** (was 25 — 1 new test for scoring accuracy)
- **43/43 node:test** (unchanged)

---

## [3.4.2] — 2026-03-12

### Fixed

- **Status dimension grouping** — `/forge:status` now correctly displays 5 health dimensions with actual maximums (Tests 20, Types 10, Security 15, Docs 20, Project 35) instead of 4 dimensions with hardcoded /20 maximums. Previously showed misleading "Quality: 50/40" after the v3.4.1 health rebalance.
- **Cross-platform browser launch** — Dashboard now uses the `open` npm package (sindresorhus, 18.7M dependents) for reliable cross-platform browser opening. Fixes ENOENT errors on WSL2 systems where `powershell.exe` is not in the Linux PATH. Works on macOS, Linux, Windows, and WSL2.

### Changed

- `/forge:init` next steps now lead with `/forge:dashboard` instead of `/forge:status`, giving users the visual experience first.

---

## [3.4.1] — 2026-03-10

### Fixed

- **Security score false green** — `getHealthScore()` now calls `getSecurityScan()` and integrates npm audit results into the health score. Previously, a project with known npm vulnerabilities would show Security 20/20. The new 15-point Security dimension deducts: -10 for critical/high npm audit vulns, -5 for moderate vulns, -5 for hardcoded secrets or eval() usage, -5 for .env files committed to git.
- **npm audit silent drop** — `npm audit --json` exits non-zero when vulnerabilities exist, which caused `run()` to swallow the output entirely. Fixed with `|| true` to preserve output regardless of exit code.
- **Dashboard wrong git data for subdirectory projects** — `getGitStatus()` now checks if root has a `.git` directory; if not, falls back to `findApplicationRoot()`. Fixes projects where the git repo lives in a subdirectory (e.g., `parent/app/` with `.git` inside `app/`).
- **Orchestrator errors shown to L1 users** — `/forge:status` now displays a friendly L2 upgrade prompt instead of raw "Forge is not initialized" errors when the orchestrator MCP is not set up.

### Changed

- Health score rebalanced to accommodate the new Security dimension: Governance 20→15 pts, Git Clean 15→10 pts, Security 5→15 pts. Max score remains 100.

### Added

- 5 new vitest tests covering security scoring, npm audit integration, subdirectory git detection, and grade boundary validation.
- UAT Guide Section 13: Pre-Release Testing Protocol — documents the `--plugin-dir` workflow for testing plugin changes on other machines before release.
- 15 documentation pages persisted to `docs/` directory (2,539 lines covering Quick Start through Troubleshooting).

### Tests

- **25/25 vitest** (was 20 — 5 new)
- **43/43 node:test** (unchanged)

---

## [3.4.0] — 2026-03-08

### Added

- CEO-LOOP ORBIT upgrade — stop hook, progress file, adaptive depth, decision journal for autonomous governance loops.
- CRUCIBLE Detective agent + audit skill — forensic test quality auditing (Gates 1-8).
- Governance-mcp test suite extracted to `tools.mjs` — 20 vitest tests, proper separation of concerns.
- CI workflow — structure validation + MCP server tests on push.

### Fixed

- CRUCIBLE P0: 4 silent catches in governance-mcp replaced with explicit error handling.
- FORGE_TEST_MODE guard added to prevent dashboard auto-opening during tests.
- 8 hollow assertions replaced with specific value checks.
- CI RED fix — missing exports in index.mjs after tools.mjs extraction.

---

## [3.3.2] — 2026-03-05

### Fixed

- Agent routing: eliminated 4 dead `nxtg-master-architect` references; orchestrating agents given full 22-agent roster visibility.
- Claude Code SOTA plugin alignment: 35 files fixed — agent color violations, command frontmatter (`disable-model-invocation`, `argument-hint`), invalid fields removed.

---

## [3.2.0] — 2026-03-02

### Fixed

- BUG-01: `.claude/governance.json` writes no longer penalize git cleanliness score.
- BUG-02: `testCoverage` renamed to `testFileRatio`; real coverage from Istanbul/c8 now reported when available.
- BUG-03: `*.config.*` files excluded from source file count.
- BUG-05: Build artifact directories (`dist-ui`, `node_modules`, `.next`, `build`, `out`, `target`, `coverage`) excluded from all find commands.

### Added

- `findApplicationRoot()` — workspace/monorepo support. Walks one level deep for manifests when root has none.
- Dual-root pattern: `root` for governance files, `appRoot` for application files.
- 17 regression tests for all bug fixes.

---

## [3.1.9] — 2026-02-28

### Fixed

- `sourceFiles: 0` for all Node.js projects — `find` doesn't support shell brace expansion; `findNameExpr()` helper expands to proper `-name` args.

---

## [3.1.4] — 2026-02-25

### Fixed

- `FORGE_PROJECT_ROOT` env var preserves original cwd — dashboard no longer shows wrong health data when `start.sh` changes directory.
- Dashboard opens correctly on WSL2 — changed from `explorer.exe` to `cmd.exe /c start ""`.
- `/forge:upgrade` command added — runs `git pull --ff-only` before `claude plugin update` to bypass [Claude Code #29071](https://github.com/anthropics/claude-code/issues/29071).

---

[3.4.3]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.2...v3.4.3
[3.4.2]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.1...v3.4.2
[3.4.1]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.0...v3.4.1
[3.4.0]: https://github.com/nxtg-ai/forge-plugin/compare/v3.3.2...v3.4.0
[3.3.2]: https://github.com/nxtg-ai/forge-plugin/compare/v3.2.0...v3.3.2
[3.2.0]: https://github.com/nxtg-ai/forge-plugin/compare/v3.1.9...v3.2.0
[3.1.9]: https://github.com/nxtg-ai/forge-plugin/compare/v3.1.4...v3.1.9
[3.1.4]: https://github.com/nxtg-ai/forge-plugin/releases/tag/v3.1.4
