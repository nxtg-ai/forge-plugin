# Changelog

All notable changes to the NXTG-Forge plugin are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.10.4] — 2026-07-19

The **G-09 integration-harness suite** — machine-tested, CI-adoptable end-to-end coverage for all three Forge products at the three deployment tiers (L1 plugin-standalone · L2 plugin+orchestrator · L3 plugin+orchestrator+forge-ui). **Test infrastructure only — no runtime, tool, agent, command, or skill changes** (counts unchanged). Each leg was built refute-first and independently Codex-gated.

### Added

- **L1 integration harness** (`tests/integration/l1-journey.mjs`, DIRECTIVE-…-10) — boots the real `governance-mcp` over stdio via `start.sh` against a clean temp fixture: handshake `serverVersion == package.json`, `tools/list ==` the 8 Node tools (exposes `forge_get_governance_health`, **not** the orchestrator's `forge_get_health`), every tool shaped + fixture-bound, and the Lego-Snap degrade/resolve invariant. Codex-cleared first-round.
- **L2 integration harness** (`tests/integration/l2-journey.mjs`, DIRECTIVE-…-11) — boots **both** MCP servers (Node governance + Rust `forge mcp`) from their verbatim `.mcp.json` specs against one fixture with the real pinned `forge` binary: dual handshake + full surfaces (8 Node + 11 Rust, live counts), cross-server contract (both health tools shaped + **distinct shapes** = the G-04 no-collision proven live; identity bound on both sides), and the task lifecycle `get→claim→complete` with a durable-state value-proof (`state.json` `task_summary` + `tasks/*.json` + newly-appended `events.jsonl` records). Codex-cleared (regate-12).
- **L3 integration harness** (`tests/integration/l3-journey.mjs`, DIRECTIVE-…-13) — the "Ship Lord" journey: the plugin orchestrator MCP **and** forge-ui's live API+WS server snapped together against one fixture. Proves the dx-journeys cross-product contract (`data.health.score === Math.round(orchestrator forge_get_health.health_score)` with `source === "orchestrator"`; a fallback to forge-ui's own `"estimate"` computation is the named finding `UI_HEALTH_CONTRACT_DRIFT`), canonical identity binding (`data.project.name === .forge/state.json.project_name`), and a live WS round-trip (`state.update` + `ping`/`pong`) plus MCP→UI reflection. forge-ui is a **test-fixture dep** (booted from its repo, never modified); its global `~/.forge` bookkeeping is redirected to a throwaway `HOME` so the operator's real `~/.forge` stays byte-identical, and teardown reaps the forge-ui child by its own pid (never `pkill`-by-name — a concurrent forge-ui session may be live).
- **Shared pure-check library** (`tests/lib/checks.mjs`) invoked by BOTH the live journeys and the seeded-defect controls — the tested logic is the shipped logic (no parallel reimplementation). Seeded-defect controls (`version-surface`, `l1-checks`, `l2-checks`, `l3-checks`) make each leg fail deterministically on a planted defect.
- **One entrypoint**: `npm test` = `vitest run` → live L1 → live L2 → live L3. New `test:l1` / `test:l2` / `test:l3` run a single live leg. `UAT-GUIDE.md` §13 documents all three.

### Fixed

- **L2 harness — 3 refute-first false-greens** (Codex regate-11, cured on `c6cdc26`): (C1) the harness now **executes the `.mcp.json` env contract verbatim** — a misconfigured `FORGE_PROJECT_ROOT` binds the wrong project and FAILS the identity check (was masked by a hardcoded root); (C2) the temp fixture is removed on **any** setup-command failure (no leak); (C3) the lifecycle check requires **newly-appended** `task_assigned`+`task_completed` records **scoped to the task id** (was satisfiable by pre-existing unscoped event types).
- **L3 harness — 2 topology/validation gaps** (Codex regate-13, cured on `e3294b0`): (C1) the "three products simultaneously live" topology now **actually starts governance-mcp** — the prior build ran orchestrator + forge-ui only (execve-traced zero governance-mcp executions); governance-mcp now boots from its `.mcp.json` spec alongside the other two, with its handshake, fixture identity, and health surface proven while all three are concurrently live (re-verified by an execve trace showing `start.sh`, `forge mcp`, and `api-server.ts` all execute). (C2) `checkUiIdentity` compares **normalized/real paths for equality**, not string containment — a prefix-sharing sibling (`…-fixture-abc-stale`) no longer passes for `…-fixture-abc`.
- **L3 harness — never repair product state to pass** (Codex regate-14, cured on `8d40e64`): the earlier build wrote identity back into the fixture's `.claude/governance.json` after forge-ui's migration mangled it, then asserted green — a gate fixing the product. Removed; the governance leg now **fails honestly** on divergence and records the finding, never mutating product-owned state.
- **L3 harness — assert the FULL contract, not just identity** (Codex regate-15, cured on `f843451`): the post-boot check verified only `project.name` while the fixture seeded empty `workstreams`/`qualityGates` + no `metrics`, so deleting those post-boot stayed green. Now seeds non-empty sentinels for every contract field and asserts their exact post-boot values via `forge_get_governance_state` (`checkGovernanceContract`), with a seeded control replaying the deletion attack.

### Cross-product finding surfaced + resolved (L3 three-product topology)

- **`GOVERNANCE_SCHEMA_DIVERGENCE`** — the L3 harness (running governance-mcp + orchestrator + forge-ui against one fixture) surfaced that forge-ui's startup migration rewrote `.claude/governance.json` (`{project:{name},workstreams,qualityGates}` → `{version,constitution}`), **dropping the fields the plugin's governance-mcp reads** (`project.name` identity, `workstreams`, `qualityGates` — `tools.mjs:108-125`). The harness records the finding and **fails honestly — it never repairs product-owned state to pass** (Codex regate-14). The exact contract governance-mcp consumes was published as `docs/governance-mcp-governance-json-contract.md`. **Resolved:** forge-ui round-trips the contract as of forge-ui `c4c55e6` (DIRECTIVE-NXTG-20260719-18, Leg B — it now migrates a foreign `governance.json` instead of reseeding it); the L3 governance identity leg validates the round-trip end-to-end (16/16, zero test-side mutation).

### Gate

- **vitest 66/66** · **live L1 15/15 · L2 15/15 · L3 16/16** · adversarial self-probe on each leg: missing/wrong `forge` binary, missing forge-ui checkout, estimate-source health drift, a wrong `.mcp.json` env, and the governance-contract deletion attack all **fail closed with named findings**; clean runs leave `~/.forge` byte-identical, zero orphaned processes, and zero leftover temp dirs.
- **Codex verdicts — full trilogy cleared:** L1 cleared first-round; L2 cleared regate-12 (all three regate-11 cures instrument-replay-verified); L3 cleared **SHIP** at `f843451` (regate-14 repair-deletion + regate-15 full-contract cures verified, the live deletion attack replayed and fails correctly). G-09 complete.
- **Local/Codex verification** substitutes for CI while GitHub Actions is org-wide billing-locked (per the v3.4.0 precedent): each leg was independently reproduced by Codex from a detached checkout; `gh release create` is an API call unaffected by the Actions lock.

### CI adoption (verbatim requirements for the CI-unlock directive)

`npm test` is CI-adoptable **unmodified** once GitHub Actions billing is unlocked, provided the runner supplies:

- **L2 + L3**: the **pinned `forge` binary v1.5.2** on `PATH` (test-fixture dependency, not a package dependency; absence/mismatch is a deterministic `FORGE_ABSENT`/`WRONG_BINARY_VERSION` failure, not a skip).
- **L3 additionally**: a **forge-ui checkout with dependencies installed**, located at the sibling path or `FORGE_UI_DIR`, plus **`127.0.0.1` (localhost) network access** for the forge-ui HTTP/WebSocket server on an ephemeral port.

---

## [3.10.3] — 2026-07-18

Completes the v3.10.2 health-tool rename in **user-facing docs** (Codex Wave-1 gate finding 2) and adds a contract test so it cannot regress. Docs-and-test only; no runtime/tool changes. Passed independent Codex re-gate (round 4, on `b2c8637`) after three hardening rounds.

### Fixed

- **Node-health misattribution in released guidance** — three user-facing docs still advertised the removed name `forge_get_health` as the Node/L1 governance tool (following them reached the Rust tool at L2, or an unknown tool at L1). Corrected to `forge_get_governance_health`:
  - `docs/C-02-quick-start-l1.md:70` (the L1 "8 governance tools" table)
  - `docs/GLOSSARY.md:59` ("Computed by the governance-mcp server via …")
  - `UAT-GUIDE.md:422` (the governance-mcp tool list)
- **Repo-wide sweep** also fixed `skills/core-nxtg-forge/SKILL.md` — it still claimed "`forge_get_health` exists on both surfaces" (false; contradicted its own later line) and conflated the two tools' score computation. Now states the distinct names + servers and each tool's actual source.

### Added

- **`tests/tool-attribution-contract.test.mjs`** — a contract test that (1) asserts at runtime that governance-mcp exposes `forge_get_governance_health` and **not** `forge_get_health`, and (2) classifies every bare `forge_get_health` reference in the repo's docs by server/level and **fails on any Node/L1 misattribution**.
  - **Hardened after Codex re-gate round 2**: a ±5-line-block classifier resolved as orchestrator whenever *any* orchestrator signal appeared, so an explicit Node/L1 sentence could hide behind a nearby "orchestrator" word. Now resolves at the **line (sentence / table-row)** level and rejects ambiguous blocks. Codex's round-2 mutation pinned as a negative fixture.
  - **Hardened again after Codex re-gate round 3**: nearest-signal resolution conflated **ownership** with **availability** — "At L1, use the orchestrator tool `forge_get_health`" passed because the (correct) orchestrator ownership token was nearest, masking an impossible L1-availability claim. The classifier now models **ownership and availability as two independent axes**, each resolved by the signal nearest the token; a `forge_get_health` occurrence fails if **either** a Node-ownership **or** an L1-availability signal is nearest (a correct owner never rescues a bad availability claim). Backticks are normalized so code-span qualifiers (`` `forge` binary ``) are seen. Codex's round-3 input pinned as a second negative fixture, plus a **12-case adversarial neighbor matrix** (both axes, masking, phrasing variants, and the legitimate "signal binds to the other tool" case) so a future round extends the table rather than rediscovering a gap.

### Gate

- vitest **50/50** pass (44 + 6 contract: runtime + repo-scan + round-2 fixture + round-3 fixture + positive control + adversarial matrix) · zero user-facing docs misattribute `forge_get_health` (Node ownership or L1 availability) · both prior false-negatives closed.

---

## [3.10.2] — 2026-07-18

Plugin hardening — health-tool routing correctness + manifest/handshake drift (DIRECTIVE-NXTG-20260718-01, deep-dive G-01/G-10). No new features; agent/command/skill counts unchanged.

### Fixed

- **Health-tool routing mismatch (G-01)** — five agent/command surfaces named the plugin's Node `forge_get_governance_health` (0-100 code-quality score, no drift) while their prose promised orchestrator *drift* semantics, so the orchestrator's `forge_get_health` (5-dimension + drift) went uncalled and drift detection silently degraded for L2 users. Repointed the drift-semantics references to orchestrator `forge_get_health` with an explicit L1 fallback to the always-available Node `forge_get_governance_health` (honors the Lego Snap): `agents/detective.md`, `agents/orchestrator.md` (×3), `commands/status.md`, `commands/gap-analysis.md`, `commands/status-enhanced.md`.
  - `commands/status.md` additionally split the always-on Node health-score call (new §4c — feeds the Health dimension bars, which parse the Node tool's `checks[]` shape) out from the orchestrator-conditional §4b, fixing a latent bug where the L1 health bars had no data source when the `forge` binary was absent.
  - `commands/dashboard.md` intentionally keeps `forge_get_governance_health`: it renders the governance dashboard's 0-100 score (not drift), so the Node tool is the correct routing there.
- **MCP handshake version hardcoded (G-10)** — `servers/governance-mcp/index.mjs` advertised a static `"3.0.0"` in the MCP `Server` handshake; now derives from the exported `serverVersion` (reads `package.json`), so it tracks releases automatically.
- **`start.sh` project-root override (G-10)** — `export FORGE_PROJECT_ROOT="$(pwd)"` clobbered the value `.mcp.json` passes via `${CLAUDE_PROJECT_DIR}`. Now `${FORGE_PROJECT_ROOT:-$(pwd)}` (honor the injected env, keep pwd as the direct-run fallback).

### Changed

- **Version-manifest drift (G-10)** — root `.claude-plugin/plugin.json` was stale at 3.7.0; all four version surfaces (root manifest, plugin manifest, `marketplace.json`, `governance-mcp/package.json`) now agree at 3.10.2, and the MCP handshake derives from the same source.
- **`docs/C-12-mcp-tools.md`** — corrected a pervasive mislabel: the doc named the plugin's Node health tool `forge_get_health`, perpetuating a false "both servers expose `forge_get_health`" collision. The Node tool is `forge_get_governance_health` (runtime-verified, `index.mjs`); the two health tools have **distinct names** and there is no runtime collision.

### Gate

- 44/44 vitest pass · 0 npm vulnerabilities · all 4 version surfaces + handshake resolve to 3.10.2 · every orchestrator reference is L2-gated (no L1 error path referencing the orchestrator).

---

## [3.10.1] — 2026-07-14

### Security

- **Cleared all 22 Dependabot alerts** (1 critical, 4 high, 15 moderate, 2 low) on `governance-mcp` — 0 vulnerabilities remaining. All were transitive:
  - **Dev toolchain** (via `vitest`) — bumped `vitest` + `@vitest/coverage-v8` 3.2.4 → 4.1.10, patching the vitest UI RCE (critical), the `vite` `server.fs.deny` bypass (high), and `esbuild`/`launch-editor` (dev-server-only, never shipped).
  - **Runtime transitives** (via `@modelcontextprotocol/sdk`) — `npm audit fix` bumped in-range: `hono` 4.12.16 → 4.12.30, `fast-uri` 3.1.0 → 3.1.3, `qs` 6.15.0 → 6.15.3, `ip-address` 10.1.0 → 10.2.0. Note: the MCP server uses **stdio** transport, so the `hono` HTTP-framework advisories (CORS, cookies, JWT, serve-static traversal) were never reachable; patched regardless.
- 44/44 vitest still pass on vitest 4. Shipped `index.mjs`/`tools.mjs` unchanged.

---

## [3.10.0] — 2026-07-14

### Changed

- **Skill consolidation: 33 → 27 skills** — five duplicate/overlapping clusters merged into single best-in-class survivors (union of unique content, de-duplicated, re-grounded honestly language-generic for end-users' projects rather than tied to a fabricated codebase). Survivors chosen to preserve load-bearing names (no agent preload breaks):
  - `testing` ← absorbed `testing-strategy` + `core-testing`
  - `owasp-security` ← absorbed `security`
  - `architecture` ← absorbed `core-architecture`
  - `coding-standards` ← absorbed `core-coding-standards`
  - `claude-code-framework` ← absorbed `claude-code-best-practices`
- **Agent wiring updated** — `crucible-detective` preload list dropped `core-testing` (its content now lives in `testing`); the `security` agent already preloads the `owasp-security` survivor, so no change needed.
- **CLAUDE.md** — skill count and Skills table updated to the 27-skill roster; `plugin.json` description count corrected.

### Removed

- Deleted 6 merged-away skill directories: `testing-strategy`, `core-testing`, `security`, `core-architecture`, `core-coding-standards`, `claude-code-best-practices`. All their unique content is preserved in the survivors above. If you invoked any of these directly, use the survivor instead.

### Gate

- 44/44 vitest pass · valid YAML across all 27 skills · zero broken cross-references · zero dangling preloads to removed skills · all skills under 500 lines.

---

## [3.9.0] — 2026-07-14

### Changed

- **All 33 skills enhanced to Claude Code SOTA best practices** — fanout of 33 agents (one per skill), each grounded against real repo source, applying the official checklist ([code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) + Anthropic engineering guidance):
  - **Routing-rule descriptions** — every `description` rewritten as "what it does + concrete *Use when* triggers with keywords users actually type." Added the valid snake_case `when_to_use` field to 27 skills for extra routing signal.
  - **Progressive disclosure** — the 9 skills over 500 lines (`testing-strategy`, `owasp-security`, `git-workflow`, `domain-knowledge`, `agent-qa-sentinel`, `core-testing`, `agent-platform-builder`, `agent-lead-architect`, `claude-code-best-practices`) split into 28 `reference/*.md` supporting files; SKILL.md bodies are now lean overview + navigation.
  - **Real Gotchas sections** grounded in actual hook scripts, CLI, and MCP source; concrete worked examples replacing abstract rule lists; correct additive `allowed-tools`.
  - **Wiring-safe** — `name`, `disable-model-invocation`, and `user-invocable` preserved verbatim on the 6 load-bearing skills preloaded into agents (`parallel-execution`, `owasp-security`, `crucible-audit`, `testing`, `core-testing`, `ceo-loop`).

### Fixed

- **Fabricated skill content removed (CRITICAL)** — several skills (`architecture`, `core-nxtg-forge`, `runtime-validation`, `git-workflow`, `testing-strategy`, `agent-development`) were template-generated fiction describing a Python "NXTG-Forge" (`forge/domain/`, Click, Jinja2, `di_container`, `.claude/state.json`) with zero correspondence to the real Rust + Node + React repo. Re-grounded against actual source (`.forge/state.json` via `src/core/state.rs`, real lifecycle hooks, real clap CLI); ~4,700 net lines of fabrication removed.
- **`skill-development` frontmatter guidance** — corrected a Gotcha that wrongly listed the valid snake_case `when_to_use` as an ignored field (only camelCase `whenToUse` is ignored).
- **`marketplace.json` version drift** — reconciled from stale `3.6.1` to match the plugin manifest.

### Gate

- 44/44 vitest pass · valid YAML across all 33 skills · zero skill-name changes · zero broken cross-references · all 9 oversized skills now under 500 lines.

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
