# Changelog

All notable changes to the NXTG-Forge plugin are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.8.0] — 2026-07-14

### Fixed

- **Agent colors (CRITICAL)** — `design-vanguard` (pink→purple), `dx-engineer` (teal→cyan), `revenue-architect` (gold→orange), `scout` (amber→orange). All four were silently rejected by Claude Code; agents appeared with no color.
- **Command safety flags (CRITICAL)** — `ceo-loop` and `ceo-loop-cancel` had `disable-model-invocation: false`, allowing Claude to autonomously start or kill a 30–60 min ORBIT governance loop. Both set to `true`.
- **MCP tool collision (CRITICAL)** — `forge_get_health` existed in both governance-mcp and orchestrator-mcp simultaneously. Renamed to `forge_get_governance_health` in governance-mcp and all 9 callers (commands/agents/tests). Eliminates undefined tool resolution behavior on Claude Code v2.1.207+.
- **`.mcp.json` missing `mcpServers` wrapper (CRITICAL)** — All 3 MCP servers were not loading on Claude Code v2.1.207+. Added required top-level wrapper, env injection (`FORGE_PROJECT_ROOT`), timeouts (governance: 15s, orchestrator: 10s, semgrep: 120s), and visible `exit 1` on binary-missing instead of silent `exit 0`.
- **`verify-governance` skill invalid frontmatter (CRITICAL)** — `user_invocable` (underscore, silently ignored) replaced with `user-invocable` (dash); non-existent `triggers:` field removed.
- **Agent model upgrades (HIGH)** — `analytics`, `compliance`, `governance-verifier`, `learning` upgraded from `haiku` to `sonnet`. `planner` upgraded from `sonnet` to `opus`. haiku was causing silent false-negatives in compliance/governance and shallow synthesis in the memory-backed learning agent.
- **Skill `disable-model-invocation` flags (HIGH)** — Added to `codex-framework`, `gemini-framework`, `ceo-loop` (skill), `domain-knowledge`, `skill-development`. Prevents accidental auto-trigger of reference-only and state-machine skills.
- **Hook `NotebookEdit` coverage gap (HIGH)** — `security-secret-shield`, `security-injection-guard`, `security-sql-guard` now cover `NotebookEdit` in PreToolUse (symmetry with Write/Edit). `governance-check` and `security-semgrep-scan` now cover `NotebookEdit` in PostToolUse.
- **governance-mcp `start.sh` silent failure (HIGH)** — Was `exit 0` (silent EOF) when `node_modules` missing or `index.mjs` not found; now `exit 1` with a clear stderr message.

### Added

- **`isolation: worktree`** on `refactor`, `database`, `ui` agents — multi-file operations no longer dirty the main checkout.
- **`Task` tool** added to `integration` and `devops` agents — enables parallel subagent spawning for multi-service work.
- **`Edit` + `TodoWrite`** added to `oracle` agent — oracle now writes decision records directly.
- **Skill `allowed-tools`** added to `parallel-execution` (Task, Bash, Read), `owasp-security` (Bash, Read, Grep), `git-workflow` (Bash), `runtime-validation` (Bash, Read).
- **`user-invocable: false`** added to `core-testing`, `core-nxtg-forge`, `optimization` — hides internal skills from the `/` menu.
- **`argument-hint`** added to `ceo-loop` command frontmatter.
- **`plugin.json` SOTA fields** — `$schema`, `displayName: "NXTG Forge"`, `defaultEnabled: true`, `author.email`.
- **Skill split: `claude-code-framework`** — 1097 lines → 287-line SKILL.md index + `reference.md` + `patterns.md`. Reduces per-session token burn by ~60k tokens.
- **Skill split: `coding-standards`** — 1089 lines → 139-line SKILL.md + `python.md`. Per-language detail now loaded on demand.
- **Skill split: `architecture`** — 922 lines → 287-line SKILL.md + `patterns.md` + `adr-templates.md`.
- **`docs-coverage.map`** — Created initial coverage map so `docs-drift-check.sh` can detect CHANGELOG/CLAUDE.md drift on future releases.

---

## [3.7.0] — 2026-05-06

### Governance

- **74 governance cycle commits** — Continuous FPL reflection check-ins and CoS directive tracking in `.asif/NEXUS.md` (2026-05-03 → 2026-05-06). No functional code changes in this cycle.
- **Manifest version sync** — Root `.claude-plugin/plugin.json` bumped from 3.6.0 to 3.7.0 (was trailing the nested manifest at 3.6.1); all three version manifests now in sync at v3.7.0.

### Notes

- Plugin functionality unchanged from v3.6.1.
- Install command: `claude plugin marketplace add nxtg-ai/forge-plugin && claude plugin install nxtg-forge` (canonical, no stale references).
- `claude plugin install forge` strings verified absent — DIRECTIVE-NXTG-20260326-01 Item 3 ✅ DONE.

---

## [3.5.1] — 2026-03-24

### Fixed

- **WSL2 tmux dashboard (BUG 1 — auto-open)** — `open()` fails silently in tmux sessions where `DISPLAY`/`WSL_INTEROP` env vars are not forwarded. Now tries two fallbacks: `powershell.exe Start` (no DISPLAY needed), then `wslview` (wslu package). If all fail, returns `hint:` with a pasteable Windows browser URL.
- **WSL2 tmux dashboard (BUG 2 — wrong path)** — Returned `file:///tmp/...` is not openable in Windows browsers. Now detects WSL2 via `WSL_DISTRO_NAME` or `/proc/sys/fs/binfmt_misc/WSLInterop` and constructs the correct Windows-accessible URL: `file://///wsl.localhost/<distro>/tmp/forge-dashboard-xxx.html`. Both `path` (Linux) and `browserUrl` (Windows-ready) are now returned.

---

## [3.5.0] — 2026-03-18

### Added

- **CLA enforcement** — `contributor-assistant/github-action@v2` workflow in `.github/workflows/cla.yml`. All PR contributors must sign before merge. Bots and Dependabot auto-allowlisted.
- **CLA.md** — Contributor License Agreement document (Apache ICLA terms) hosted in repo root. Signatures stored in `.github/cla-signatures.json`.
- **CONTRIBUTING.md** — Updated with CLA signing instructions and requirement notice.

### Notes

- License unchanged: MIT.
- `CLA_PERSONAL_ACCESS_TOKEN` repository secret must be set for the CLA bot to commit signatures back to the repo.

---

## [3.4.9] — 2026-03-16

### Documentation

- **JSDoc coverage**: Added JSDoc blocks to all 11 exported functions in `tools.mjs` — `run`, `readJson`, `serverVersion`, `findApplicationRoot`, `getGovernanceState`, `getGitStatus`, `getCodeMetrics`, `getHealthScore`, `getTestResults`, `listCheckpoints`, `getSecurityScan`, `generateDashboard`. Coverage: 0% → 100%.
- **CONTRIBUTING.md**: Added contributor guide covering clone/setup, both test suites (`npx vitest run` and `node --test`), file format templates for commands/agents/skills, MCP server dev workflow, and PR/commit conventions.
- **C-13 agent count**: Fixed `docs/C-13-agents-skills.md` heading from "22 Specialized Agents" → "23 Specialized Agents".
- **Workspace CLAUDE.md**: Corrected forge-orchestrator MCP tool count from 9 → 10 in two places.
- **marketplace.json**: Synced version to 3.4.9 (was stale at 3.2.0).

---

## [3.4.8] — 2026-03-14

### Fixed

- **CRUCIBLE remediation** — Resolved three test quality failures from the March 2026 audit:
  - `index.mjs` coverage: removed shebang (blocked vitest ESM transform), exported `TOOLS` constant and `dispatchToolCall()` function. Added `tests/index.test.mjs` with 17 new tests covering tool definitions, re-exports, and dispatch layer.
  - Hollow assertions: replaced 14 `toBeDefined()`/`typeof` checks with `expect.objectContaining()` and specific value assertions across `dashboard.test.mjs`, `git-status.test.mjs`, `health-score.test.mjs`, and `security-scan.test.mjs`. Hollow rate: 0%.
  - Silent catch blocks: `findApplicationRoot()` and `generateDashboard()` browser-open catches now log via `console.warn` instead of silently swallowing errors.
- **vitest config**: Added `env: { FORGE_TEST_MODE: '1' }` to `vitest.config.mjs` so `index.mjs` can be imported in tests without blocking on `server.connect()`.

### Test counts

- Vitest (primary): 44/44 pass (was 27/27)
- Node:test (full): 43/43 pass
- Combined: 87 tests, 0 failures

---

## [3.4.7] — 2026-03-12

### Changed

- **Agent file naming** — Renamed all 23 agent files from legacy prefixed names (`[AFRG]-database.md`, `[NXTG-CEO]-LOOP.md`, `forge-oracle.md`) to clean names (`database.md`, `ceo-loop.md`, `oracle.md`). Claude Code `/plugin` TUI now shows clean agent names.
- **Component counts corrected everywhere** — Audited and fixed counts across 15+ files: 23 commands (was 21), 23 agents (was 22), 32 skills (was 29), 7 hooks (was 6). Updated in CLAUDE.md, UAT-Guide, 4 docs pages, 3 commands, 2 skills.
- **CEO-LOOP internal references** — Updated `[AFRG]-` prefixes to `forge:` inside ceo-loop agent and skill.

---

## [3.4.6] — 2026-03-12

### Fixed

- **Dashboard "null% coverage"** — HTML dashboard displayed `null% coverage` when no Istanbul/c8 coverage report exists. Now shows test case count (from density tier) or file ratio as fallback. Color coding also fixed (`null >= 50` always evaluated false).
- **Sisyphean score cycle verified** — The `.claude/governance.json` git filter (BUG-01, v3.2.0) already handles both untracked AND modified files. The 80→75 bouncing seen on CLX9 was due to stale MCP server (MCP doesn't hot-reload — requires Claude Code restart after `/forge:update`).

### Tests

- **27/27 vitest** (unchanged)
- **43/43 node:test** (unchanged)

---

## [3.4.5] — 2026-03-12

### Fixed

- **P0: node_modules inflation in test counting** — The grep for test case counting scanned `node_modules`, `dist`, `.stryker-tmp`, and all build artifact directories. On forge-ui this inflated from 4,187 real matches to 14,130 phantom matches (237% over-count). Now uses `find` with the same `BUILD_ARTIFACT_EXCLUDES` as source file counting, ensuring grep and find exclude identical directories.
- **Missing test patterns** — Expanded grep patterns to cover real-world conventions: `it.each()`/`test.skip()`/`test.only()` variants, `__tests__/` directory convention (Jest), `*.cy.*` (Cypress), `#[tokio::test]`/`#[rstest]`/`#[actix_web::test]` (async Rust).
- **Double-counting in two-pass grep** — v3.4.4's Node.js grep used two passes (filename match + directory match) that double-counted files matching both. Replaced with single `find | xargs grep` pipeline.

### Validated against real projects

| Project | Tests found | Source files | Density | Score | Feels right? |
|---------|------------|-------------|---------|-------|-------------|
| forge-ui (React) | 4,187 | 851 | 4.9/file | 15/20 | Yes — large app, solid coverage |
| forge-orchestrator (Rust) | 362 | 43 | 8.4/file | 20/20 | Yes — well-tested CLI |
| game.clicker (React) | 37 | 3 | 12.3/file | 20/20 | Yes — small app, many tests |

### Tests

- **27/27 vitest** (unchanged)
- **43/43 node:test** (unchanged)

---

## [3.4.4] — 2026-03-12

### Fixed

- **Test scoring measures real test quality** — Replaced the file ratio proxy (which counted test FILES, not tests) with a 3-tier scoring system:
  1. **Real line coverage** from Istanbul/c8/nyc when a coverage report exists (gold standard)
  2. **Test density** — counts actual `it()`/`test()`/`def test_`/`#[test]` declarations via grep (~50ms), scores by tests-per-source-file: <1 sparse (5pts), 1-3 basic (10pts), 3-5 solid (15pts), 5+ thorough (20pts)
  3. **File ratio** as last resort when test case patterns can't be detected
- Adding tests now moves the score. A project with 37 tests across 3 source files (12.3/file) scores **20/20** instead of the old 7/20. Previously, adding 16 tests to the same file changed the score by exactly zero.

### Tests

- **27/27 vitest** (was 26 — 1 new test for density tier scoring)
- **43/43 node:test** (unchanged)

---

## [3.4.3] — 2026-03-12

### Fixed

- **Test scoring accuracy (patch, superseded by v3.4.4)** — Added 5-point floor for file ratio proxy and real coverage preference. This was an incremental patch; v3.4.4 replaces it with proper test density scoring.

### Tests

- **26/26 vitest**
- **43/43 node:test**

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

[3.5.1]: https://github.com/nxtg-ai/forge-plugin/compare/v3.5.0...v3.5.1
[3.5.0]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.9...v3.5.0
[3.4.9]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.8...v3.4.9
[3.4.8]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.7...v3.4.8
[3.4.6]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.5...v3.4.6
[3.4.5]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.4...v3.4.5
[3.4.4]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.3...v3.4.4
[3.4.3]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.2...v3.4.3
[3.4.2]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.1...v3.4.2
[3.4.1]: https://github.com/nxtg-ai/forge-plugin/compare/v3.4.0...v3.4.1
[3.4.0]: https://github.com/nxtg-ai/forge-plugin/compare/v3.3.2...v3.4.0
[3.3.2]: https://github.com/nxtg-ai/forge-plugin/compare/v3.2.0...v3.3.2
[3.2.0]: https://github.com/nxtg-ai/forge-plugin/compare/v3.1.9...v3.2.0
[3.1.9]: https://github.com/nxtg-ai/forge-plugin/compare/v3.1.4...v3.1.9
[3.1.4]: https://github.com/nxtg-ai/forge-plugin/releases/tag/v3.1.4
