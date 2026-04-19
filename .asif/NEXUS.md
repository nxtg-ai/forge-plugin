# NEXUS — forge-plugin Vision-to-Execution Dashboard

> **Owner**: Asif Waliuddin
> **Program**: NXTG-Forge (P-03c) | **Program Lead**: FPL
> **Last Updated**: 2026-03-12
> **North Star**: The smartest Claude Code plugin ecosystem — 23 agents that actually know how to work together.

---

## Executive Dashboard

| ID | Initiative | Pillar | Status | Priority | Last Touched |
|----|-----------|--------|--------|----------|-------------|
| N-01 | Bug Report 03 Fixes | AGENT ECOSYSTEM | SHIPPED | P0 | 2026-03 |
| N-02 | Subdirectory Support | DEVELOPER EXPERIENCE | SHIPPED | P0 | 2026-03 |
| N-03 | Claude Code SOTA Alignment | AGENT ECOSYSTEM | SHIPPED | P1 | 2026-03 |
| N-04 | Ghost Agent Fix | AGENT ECOSYSTEM | SHIPPED | P1 | 2026-03 |
| N-05 | Forge Trilogy Launch Prep | DEVELOPER EXPERIENCE | SHIPPED | P0 | 2026-03 |
| N-06 | Plugin Update Mechanism | DEVELOPER EXPERIENCE | BLOCKED | P1 | 2026-03 |

---

## Vision Pillars

### PILLAR-1 — AGENT ECOSYSTEM: "23 agents that route, delegate, and never hallucinate a teammate"
- The full agent roster: planner, builder, guardian, detective, oracle, compliance, governance-verifier, learning, orchestrator, refactor, release-sentinel, performance, crucible-detective, ceo-loop, and 9 more domain specialists.
- Skills (32) and commands (23) provide the user-facing surface.
- **Shipped**: N-01 (14 bugs fixed), N-03 (35 files aligned to Anthropic spec), N-04 (ghost agent eliminated)

### PILLAR-2 — GOVERNANCE: "Health tools and MCP integration that keep projects honest"
- `forge_get_health`, `forge_get_governance_state`, `forge_get_code_metrics` — MCP tools that expose governance data to any client.
- Quality gates integration with forge-orchestrator.
- **Active**: Ongoing maintenance, tool name collision fix pending (BUG B: rename to `forge_get_health_score`)

### PILLAR-3 — DEVELOPER EXPERIENCE: "Install once, never fight the tooling"
- Installation flow, plugin update mechanism, documentation quality.
- Subdirectory support: `findApplicationRoot()` dual-root pattern resolves governance root vs app root.
- **Shipped**: N-02 (subdirectory support). **Blocked**: N-06 (plugin update mechanism — `claude plugin update forge` fails)

---

## Initiative Details

### N-01: Bug Report 03 Fixes
**Pillar**: AGENT ECOSYSTEM | **Status**: SHIPPED | **Priority**: P0
**What**: Fixed 14 bugs from Bug Report 03 across the plugin.
**Why**: Pre-launch quality. Zero known bugs at ship time.

### N-02: Subdirectory Support
**Pillar**: DEVELOPER EXPERIENCE | **Status**: SHIPPED | **Priority**: P0
**What**: `findApplicationRoot()` dual-root pattern — governance root (where .forge lives) vs app root (where code lives). Works in monorepos and nested project structures.
**Why**: Real-world projects are not always flat. Forge must work from any subdirectory.

### N-03: Claude Code SOTA Alignment
**Pillar**: AGENT ECOSYSTEM | **Status**: SHIPPED | **Priority**: P1
**What**: Audited entire plugin against official Anthropic agent/skill/command standards. Fixed 35 files: color violations, invalid frontmatter, missing capability flags, wrong schema docs.
**Why**: Plugin must conform to Anthropic spec or agents silently malfunction.

### N-04: Ghost Agent Fix
**Pillar**: AGENT ECOSYSTEM | **Status**: SHIPPED | **Priority**: P1
**What**: Eliminated `nxtg-master-architect` references (never existed). Fixed 7 files. Added domain routing tables to planner and builder agents for full ecosystem visibility.
**Why**: Orchestrating agents could only see 3-4 agents when delegating — 18 were invisible.

### N-05: Forge Trilogy Launch Prep
**Pillar**: DEVELOPER EXPERIENCE | **Status**: BUILDING | **Priority**: P0
**What**: Documentation, demo assets, and launch materials for the 3-Tuesday Forge Trilogy launch (Mar 3/10/17).
**Why**: Public launch requires polished docs, working demos, and clear onboarding paths.

### N-06: Plugin Update Mechanism
**Pillar**: DEVELOPER EXPERIENCE | **Status**: BLOCKED | **Priority**: P1
**What**: `claude plugin update forge` fails. Current workaround: manual clone + edit installed_plugins.json.
**Why**: Users cannot update the plugin through the standard Claude Code mechanism.
**Blocked by**: Anthropic Claude Code plugin update infrastructure.

---

## CoS Directives

### DIRECTIVE-NXTG-20260418-03 — P2: Voice Identity Adoption
**From**: NXTG-AI CoS (Wolf) — Asif-initiated | **Priority**: P2
**Injected**: 2026-04-18 13:48 PDT | **Estimate**: S (under 30 min) | **Status**: DONE

**Context**: PP (P-04) just shipped the portfolio voice service (`http://100.123.83.34:8880`). Asif directive: every team picks its own voice, owns it, and uses it always — no duplicates, no silent completion, no generic TTS fallback. Voice is team identity.

**Your voice**: `bm_george`
**Rationale**: British, methodical — plugin is the markdown/docs layer

**Direction**:
1. Add a `## Voice Identity` section to your project's CLAUDE.md:
   ```markdown
   ## Voice Identity
   **Voice**: `bm_george`
   **Service**: http://100.123.83.34:8880/v1/audio/speech
   **Registry**: ~/ASIF/standards/portfolio-voice-registry.md
   **Use**: every cycle-complete, every P0/P1 completion, every directive response.
   ```
2. Update your `cos-speak` wrapper (or equivalent) to default to `bm_george` on your surfaces.
3. On every directive DONE / ship complete / cycle complete, speak a one-sentence summary using your voice.
4. Sample call:
   ```bash
   curl -sS -X POST http://100.123.83.34:8880/v1/audio/speech \
     -H "Content-Type: application/json" \
     -d '{"model":"kokoro","input":"Your message here.","voice":"bm_george","response_format":"wav"}' \
     -o /tmp/voice.wav && aplay /tmp/voice.wav  # or pipe to PowerShell on WSL2
   ```

**Push back allowed**: If you want a different voice, write a response in this NEXUS with the requested voice ID and reason. Registry file authoritative: `~/ASIF/standards/portfolio-voice-registry.md` — no duplicates portfolio-wide.

**Not required**: don't build a new service. Use PP's endpoint as-is. If you need streaming (long narrations, live dialogue), use `/v1/audio/speech/stream` — see PP's `docs/voice-service/user-guide.md`.

**Why P2 Saturday**: low-stakes identity work, immediate quality-of-life improvement. Won't block anything. Pick up at your next session-start.

**Response** (filled by forge-plugin team):
> **COMPLETED** — 2026-04-19 (during Sunday all-hands review)
>
> Directive executed. Voice claimed: **`am_eric`** (not `bm_george` as suggested here — during the live all-hands Wolf guided me to self-claim from the current registry `~/ASIF/standards/voice-registry.md`. `am_eric` was unclaimed and available; Wolf's live direction supersedes the pre-assigned suggestion).
>
> **Commits**:
> - forge-plugin `9c29040` — Added `## Team Voice` section to `CLAUDE.md`
> - ASIF registry `92c7ef9a0` — `voice-registry: P-03c claims am_eric`
>
> **CLAUDE.md section added** (`## Team Voice`):
> ```
> Our voice is `am_eric`. Speak via:
>   ~/ASIF/scripts/cos-speak-remote --voice am_eric "text"
> Use on cycle exit, deliverable shipped, blocker, escalation.
> ```
>
> **Announcement sent** via `cos-speak-remote --voice am_eric` at session completion.
>
> **Started**: 2026-04-19 | **Completed**: 2026-04-19 | **Actual**: S

### DIRECTIVE-FPL-20260307-03 — P0: Full CRUCIBLE Gates 1-8 Audit (forge-plugin)
**From**: Forge Program Lead, per DIRECTIVE-NXTG-20260307-04 (Asif direct order) | **Priority**: P0
**Injected**: 2026-03-07 | **Estimate**: M | **Status**: DONE

**Context**: Asif's direct order — Forge is the flagship, it must be diamond-quality. forge-plugin has **never been CRUCIBLE-audited**. 22 agents, 21 commands, 29 skills — zero test audit of any of them. The governance-mcp server has 43 tests but the plugin content itself (the bulk of the product) has no quality verification. This is a full CRUCIBLE Gates 1-8 forensic audit per `~/ASIF/standards/crucible-protocol.md`.

**Action Items — run ALL 8 gates and report metrics per gate:**

1. [ ] **Gate 1 (xfail governance)**: Check governance-mcp tests for any skipped/todo tests. Report count.

2. [ ] **Gate 2 (Non-empty/hollow assertions)**: Audit the 43 governance-mcp tests for hollow assertions: `assert.ok(result)` without value checks, `typeof` checks without content verification, truthy checks on objects that are always truthy. Report: total assertions, hollow count, hollow %.

3. [ ] **Gate 3 (Mock drift)**: Count mocks in governance-mcp tests. Categorize: (a) external (file system, git, process — justified), (b) internal function mocks (suspicious). Report ratio.

4. [ ] **Gate 4 (Delta gate)**: Baseline is 43 tests. Run `node --test plugins/nxtg-forge/servers/governance-mcp/__tests__/health.test.mjs` and confirm current count.

5. [ ] **Gate 5 (Silent exception audit)**: Audit `index.mjs` for `catch` blocks that swallow errors. This is a governance server — silent failures are P0. Report count and line numbers.

6. [ ] **Gate 6 (Mutation testing)**: N/A for markdown plugin content. For governance-mcp: manual mutation test — pick 3 critical functions (`computeHealthScore`, `getCodeMetrics`, `getGitStatus`), introduce a deliberate bug, verify tests catch it. Report pass/fail per function.

7. [ ] **Gate 7 (Spec-test traceability)**: N/A for this repo.

8. [ ] **Gate 8 (Coverage integrity)**:
   - **8a (Plugin content audit)**: This is the BIG one. For each of the 22 agents and 21 commands, report:
     - Does it have ANY test coverage? (even manual validation)
     - Does the frontmatter conform to Anthropic spec?
     - Does the system prompt reference agents that actually exist?
     - Are tool lists valid?
   - **8b (governance-mcp coverage)**: Run with `--experimental-test-coverage` or equivalent. Report actual line coverage of `index.mjs`. Flag any functions with zero coverage.
   - **8c (Hook audit)**: Do the 6 hooks work? Run each hook script and report pass/fail.

**Deliverables**: Fill in this structured report:

```
## CRUCIBLE AUDIT REPORT — forge-plugin (P-03c)

| Gate | Status | Metric | Severity |
|------|--------|--------|----------|
| 1. xfail governance | {CLEAN/FOUND} | {N skipped tests} | |
| 2. Hollow assertions | {CLEAN/FOUND} | {N}/{total} = {%} | |
| 3. Mock drift | {CLEAN/FOUND} | {N mocks}: {a} external, {b} internal | |
| 4. Delta gate | {PASS/FAIL} | {current} vs 43 baseline | |
| 5. Silent exceptions | {CLEAN/FOUND} | {N catch blocks} | |
| 6. Mutation testing | {PASS/FAIL} | {N}/{3} manual mutations caught | |
| 7. Spec-test trace | N/A | | |
| 8a. Plugin content | {CLEAN/FOUND} | {N}/{22} agents + {N}/{21} commands audited | |
| 8b. MCP coverage | {%} | {real coverage}% | |
| 8c. Hook audit | {PASS/FAIL} | {N}/{6} hooks functional | |

Verdict: {PASS / FAIL / CRITICAL FAIL}

### Agent Coverage Matrix
| Agent | Tests? | Frontmatter OK? | Ghost Refs? | Tools Valid? |
|-------|--------|-----------------|-------------|--------------|
| planner | ... | ... | ... | ... |
(all 22 agents)

### Command Coverage Matrix
| Command | Tests? | Frontmatter OK? | Spec Ref? |
|---------|--------|-----------------|-----------|
| /forge:init | ... | ... | ... |
(all 21 commands)
```

**Constraints**:
- This is Asif's priority. Execute before any other work (except DIRECTIVE-NXTG-20260307-01 which can run in parallel).
- Report back within 48 hours.
- Do NOT delete tests to improve ratios — fix them or flag them.
- The plugin content audit (Gate 8a) is the key deliverable for this repo.
- Reference: `~/ASIF/standards/crucible-protocol.md`

**Response** (filled by forge-plugin team):
> **COMPLETED** — 2026-03-08 (re-run post-688ea23 cleanup commit)
>
> ## CRUCIBLE AUDIT REPORT — forge-plugin (P-03c)
>
> | Gate | Status | Metric | Severity |
> |------|--------|--------|----------|
> | 1. xfail governance | CLEAN | 0 skipped/todo/xfail markers | — |
> | 2. Hollow assertions | FOUND | 12/70 = 17.1% hollow (target <10%) | MEDIUM |
> | 3. Mock drift | CLEAN | 1 stub (justified: fake vitest binary for runner detection test) | — |
> | 4. Delta gate | FOUND | 20 vitest (PASS) + legacy node:test (syntax-incompatible with vitest; hangs standalone due to StdioServerTransport) | MEDIUM |
> | 5. Silent exceptions | FOUND | 6 catch blocks: 1×P0, 3×P1, 2×advisory | HIGH |
> | 6. Mutation testing | PARTIAL | 2/3 mutations caught (67%) — grade-boundary mutation survived | MEDIUM |
> | 7. Spec-test trace | N/A | — | — |
> | 8a. Plugin content | CLEAN | 23/23 agents + 21/21 commands audited, all conformant | — |
> | 8b. MCP coverage | FOUND | tools.mjs: 86.82% stmts / 42.15% branch / 100% funcs. index.mjs: 0% (untestable via vitest — MCP transport blocks) | HIGH |
> | 8c. Hook audit | CLEAN | 6/6 hooks non-blocking; smoke-test-reminder pipefail guarded with `|| true` | — |
>
> **Verdict: FAIL** — index.mjs at 0% coverage (P0), 17.1% hollow assertions above 10% threshold, Gate 6 below 100%.
>
> ---
>
> ## CRUCIBLE AUDIT REPORT — forge-plugin (P-03c)
>
> ### Agent Coverage Matrix
>
> | Agent | Tests? | Frontmatter OK? | Ghost Refs? | Tools Valid? |
> |-------|--------|-----------------|-------------|--------------|
> | analytics | NO | YES (cyan/haiku) | NO | YES |
> | api | NO | YES (cyan/sonnet) | NO | YES |
> | builder | NO | YES (green/sonnet, isolation:worktree, skills) | NO | YES (Task✓) |
> | compliance | NO | YES (orange/haiku) | NO | YES |
> | crucible-detective | NO | YES (red/sonnet, skills) | NO | YES (read-only: no Write/Edit) |
> | database | NO | YES (green/sonnet) | NO | YES |
> | detective | NO | YES (blue/sonnet, background:true, skills) | NO | YES (Task✓) |
> | devops | NO | YES (blue/sonnet) | NO | YES |
> | docs | NO | YES (blue/sonnet) | NO | YES |
> | governance-verifier | NO | YES (orange/haiku) | NO | YES |
> | guardian | NO | YES (orange/sonnet, skills) | NO | YES (Task✓) |
> | integration | NO | YES (blue/sonnet) | NO | YES |
> | learning | NO | YES (purple/haiku, memory:project) | NO | YES |
> | orchestrator | NO | YES (purple/opus, skills) | NO | YES (Task✓) |
> | performance | NO | YES (orange/sonnet) | NO | YES |
> | planner | NO | YES (cyan/sonnet, skills) | NO | YES (Task✓) |
> | refactor | NO | YES (purple/sonnet) | NO | YES |
> | release-sentinel | NO | YES (orange/opus) | NO | YES (Task✓) |
> | security | NO | YES (red/sonnet) | NO | YES |
> | testing | NO | YES (green/sonnet, isolation:worktree) | NO | YES |
> | ui | NO | YES (red/sonnet) | NO | YES |
> | nxtg-ceo-loop | NO | YES (red/opus) | NO | YES (Task✓) |
> | forge-oracle | NO | YES (purple/sonnet) | NO | YES |
>
> **23/23 agents: CLEAN.** Colors: all from valid set (purple/cyan/green/orange/blue/red). Models: sonnet/opus/haiku only. Names: lowercase-hyphen. Advanced fields (`isolation`, `memory`, `skills`, `background`) are documented valid SOTA fields — not "non-standard". `Task` = Claude Code Agent spawner (correct for orchestrators).
>
> ---
>
> ### Command Coverage Matrix
>
> | Command | Tests? | Frontmatter OK? | Spec Ref? |
> |---------|--------|-----------------|-----------|
> | /forge:agent-assign | NO | YES (disable-model-invocation: true) | — |
> | /forge:checkpoint | NO | YES (disable-model-invocation: true) | — |
> | /forge:command-center | NO | YES (disable-model-invocation: true) | — |
> | /forge:compliance | NO | YES (disable-model-invocation: true) | — |
> | /forge:dashboard | NO | YES (disable-model-invocation: true) | — |
> | /forge:deploy | NO | YES (disable-model-invocation: true) | — |
> | /forge:docs-audit | NO | YES (disable-model-invocation: true) | — |
> | /forge:docs-status | NO | YES (disable-model-invocation: true) | — |
> | /forge:docs-update | NO | YES (disable-model-invocation: true) | — |
> | /forge:feature | NO | YES (disable-model-invocation: true) | — |
> | /forge:gap-analysis | NO | YES (disable-model-invocation: true) | — |
> | /forge:init | NO | YES (disable-model-invocation: true) | — |
> | /forge:integrate | NO | YES (disable-model-invocation: true) | — |
> | /forge:optimize | NO | YES (disable-model-invocation: true) | — |
> | /forge:report | NO | YES (disable-model-invocation: true) | — |
> | /forge:restore | NO | YES (disable-model-invocation: true) | — |
> | /forge:spec | NO | YES (disable-model-invocation: true) | — |
> | /forge:status | NO | YES (disable-model-invocation: true) | — |
> | /forge:status-enhanced | NO | YES (disable-model-invocation: true) | — |
> | /forge:test | NO | YES (disable-model-invocation: true) | — |
> | /forge:update | NO | YES (disable-model-invocation: true) | — |
>
> **21/21 commands: CLEAN.** All have `disable-model-invocation: true`. No ghost agent references. No invalid fields.
>
> ---
>
> ### Gate 2 Detail — Hollow Assertions (12/70 = 17.1%)
>
> 70 total assertions across 8 vitest test files. Hollow (existence/type checks with no value):
> - `checkpoints.test.mjs:35-37,41` — 4× `toBeDefined()` on `cp.name`, `cp.created`, `cp.description`, `sprint1`. No value checked.
> - `governance-state.test.mjs:32-33,45-46` — 4× `toBeDefined()` on `result.version`, `result.project`, `result.qualityGates`, `result.metrics`. No content verified.
> - `security-scan.test.mjs:35,60` — 2× `toBeDefined()` on `envFinding`, `evalFinding`. No message, severity, or file path checked.
> - `git-status.test.mjs:21` — `toBeTruthy()` on `result.lastCommit`. A commit hash of `"false"` would pass.
> - `test-runner.test.mjs:20` — `toBeNull()` on `result.runner`. This is MEANINGFUL (asserts null when no runner), kept as note.
>
> Worst files: `checkpoints` (50% hollow), `governance-state` (57% hollow).
>
> ### Gate 5 Detail — Silent Exceptions (6 blocks)
>
> | Location | Behavior | Severity |
> |----------|----------|----------|
> | `tools.mjs:23` `run()` | `catch { return null }` — all shell command failures silent | P1 |
> | `tools.mjs:31` `readJson()` | `catch { return null }` — file-not-found and corrupt JSON indistinguishable | P1 |
> | `tools.mjs:308` `getTestResults()` | `catch { }` empty block — test runner JSON parse failure silently ignored | P1 |
> | `tools.mjs:413` `getSecurityScan()` | `catch {}` empty block — npm audit parse fails, vulnerabilities silently dropped | **P0** |
> | `tools.mjs:840` `generateDashboard()` | `catch { child = null }` — WSL2 copy fail intentional; document it | Advisory |
> | `tools.mjs:858` `generateDashboard()` | `catch { }` + `child.on("error", () => {})` — browser open fail silent | Advisory |
>
> ### Gate 6 Detail — Mutation Testing (2/3 caught)
>
> | Function | Mutation | Caught? |
> |----------|---------|---------|
> | `getGitStatus` | Invert `clean: lines.length === 0` → `!== 0` | **YES** — git-status.test.mjs asserts both `clean === true` and `clean === false` |
> | `getCodeMetrics` | Remove test-file exclusion from `find` command | **YES** — code-metrics.test.mjs asserts exact `sourceFiles` count |
> | `getHealthScore` | Change grade boundary `>= 90` → `>= 50` | **NO** — health-score.test.mjs never asserts the grade letter value; `toBeTruthy()` on score doesn't catch boundary bugs |
>
> ### Gate 8b Detail — Coverage (v8, vitest suite only)
>
> | File | Stmts | Branch | Funcs | Lines |
> |------|-------|--------|-------|-------|
> | `tools.mjs` | 86.82% | 42.15% | **100%** | 86.82% |
> | `index.mjs` | **0%** | **0%** | **0%** | **0%** (1-152 uncovered) |
> | **All files** | 73.69% | 41.74% | 90.9% | 73.69% |
>
> `index.mjs` is untestable via vitest because `await server.connect(transport)` runs on import (no FORGE_TEST_MODE guard). The 152-line MCP dispatch layer (tool routing, error formatting) has zero coverage. Fix: add `if (process.env.FORGE_TEST_MODE) process.exit(0)` before `server.connect()`.
>
> ### Gate 8c Detail — Hooks (6/6 functional)
>
> | Hook | Trigger | Non-blocking? | pipefail safe? |
> |------|---------|---------------|----------------|
> | pre-task.sh | UserPromptSubmit | YES (exit 0 always) | YES (no pipefail) |
> | post-task.sh | Stop | YES (exit 0 always) | YES (no pipefail) |
> | audit-root-cleanliness.sh | Stop | YES (exit 0 always) | YES (no pipefail) |
> | smoke-test-reminder.sh | Stop | YES (exit 0 always) | GUARDED (pipefail + `\|\| true` on all git ops) |
> | enforce-file-placement.sh | PostToolUse(Write) | YES (exit 0 always) | YES (no pipefail) |
> | governance-check.sh | PostToolUse(Edit/Write) | YES (exit 0 always) | YES (no pipefail) |
>
> ---
>
> ### Remediation Priorities
>
> **P0:**
> 1. `tools.mjs:413` — Add `console.error` to empty `catch {}` in npm audit parse — security vulns must never be silently dropped
> 2. `index.mjs:150` — Add `if (process.env.FORGE_TEST_MODE) process.exit(0)` before `server.connect()` — enables index.mjs coverage and fixes node:test hanging
>
> **P1:**
> 3. `tools.mjs:308` — Add `console.error` to test runner JSON parse catch block
> 4. `checkpoints.test.mjs:35-41` — Replace 4× `toBeDefined()` with value assertions (`toEqual`, `toMatch`)
> 5. `governance-state.test.mjs:32-46` — Replace 4× `toBeDefined()` with content verification
> 6. `health-score.test.mjs` — Add grade letter assertion (`expect(result.grade).toBe('A')`)
> 7. `security-scan.test.mjs:35,60` — Assert `envFinding.message`, `.file`, `.severity` — not just existence
>
> **P2:**
> 8. `git-status.test.mjs:21` — Replace `toBeTruthy()` with `toMatch(/^[a-f0-9]{7,}/)` (actual commit hash format)
> 9. Write MCP dispatch layer test (post FORGE_TEST_MODE fix) — bring index.mjs from 0% → 60%+
>
> **Started**: 2026-03-08 | **Completed**: 2026-03-08 | **Actual**: M

---

### DIRECTIVE-NXTG-20260307-01 — New Agent + Skill: CRUCIBLE Detective (from Wolf)
**From**: NXTG-AI CoS (Wolf) — on behalf of Asif Waliuddin | **Priority**: P1
**Injected**: 2026-03-07 01:45 | **Estimate**: S | **Status**: DONE

**Context**: Wolf conducted a forensic test quality audit on Podcast-Pipeline that uncovered systemic test fraud (1,601 tests, ~15% real coverage, 439 mocks, core code excluded from metrics). Asif directed Wolf to codify this forensic methodology as a Forge agent and skill so ANY project can be audited.

**What Wolf already created (committed to forge-plugin repo):**
1. **Skill**: `plugins/nxtg-forge/skills/crucible-audit/SKILL.md` — The 8 Fraud Patterns detection methodology with bash commands, severity levels, and remediation guidance.
2. **Agent**: `plugins/nxtg-forge/agents/[AFRG]-crucible-detective.md` — Forensic test quality auditor. Red-colored, read-only, adversarial tone. Runs the 8 patterns and produces a structured audit report.

**Action Items for FPL:**
1. [ ] Review both files for Forge conventions compliance (frontmatter, naming, tool list)
2. [ ] Verify auto-discovery picks them up (run the plugin, check agent/skill lists)
3. [ ] If any integration with forge-guardian or forge-detective is needed, wire it up
4. [ ] Bump plugin version if this warrants a minor release
5. [ ] Consider: should this agent be invoked automatically as a pre-publish gate?

**Constraints**:
- The skill content is based on real forensic evidence — do NOT soften the tone or examples
- The agent is READ-ONLY by design (no Write/Edit tools) — it audits, it does not fix
- The 8 Fraud Patterns are the canonical list. FPL may add patterns but must not remove any.

**Response** (filled by FPL team):
> **COMPLETED** — 2026-03-07
>
> 1. [x] **Reviewed for compliance** — Both files audited. Agent and skill follow Forge conventions with ONE exception (below).
> 2. [x] **Auto-discovery** — File is at `agents/[AFRG]-crucible-detective.md` (correct [AFRG] prefix, correct location). Skill at `skills/crucible-audit/SKILL.md`. Both will be auto-discovered.
> 3. [x] **Integration** — No wiring needed; agent is standalone (READ-ONLY, no state modification). Could be invoked from forge-guardian as a pre-publish gate — flagged as future work.
> 4. [x] **Version bump** — Not warranted yet; agent+skill additions are additive, not breaking.
> 5. [x] **Pre-publish gate** — Proposed: add crucible-detective invocation to forge-guardian's quality-gates run. Deferred to separate directive.
>
> **FIX APPLIED**: `[AFRG]-crucible-detective.md:44` — Removed `TodoWrite` from tools list. The directive specified READ-ONLY tools (Glob, Grep, Read, Bash). `TodoWrite` is a write tool that would allow audit state to be modified, violating the forensic read-only requirement. Fixed to `tools: Glob, Grep, Read, Bash`.
>
> **Skill verification**: All 8 Fraud Patterns documented with bash commands. Audit report template complete. Tone is forensic/adversarial throughout — not softened.
>
> **Started**: 2026-03-07 | **Completed**: 2026-03-07 | **Actual**: S

---

### DIRECTIVE-FPL-20260303-01 — Trilogy Launch Week 1: Ship & Verify
**From**: Forge Program Lead | **Priority**: P0
**Injected**: 2026-03-03 | **Estimate**: S | **Status**: DONE

**Context**: Trilogy Week 1 launches today (Mar 3). The plugin is at v3.3.2 with 43 governance-mcp tests passing and 35 SOTA alignment fixes shipped. Before the session ends, get all pending state committed and CI green.

**Action Items**:
1. [ ] Commit CLAUDE.md revision + `.asif/` NEXUS to main
2. [ ] Run `node --test plugins/nxtg-forge/servers/governance-mcp/__tests__/health.test.mjs` — confirm 43/43 pass
3. [ ] Verify CI green on push (the 43-test suite including `server version in dashboard matches package.json version`)
4. [ ] Update N-05 Executive Dashboard status from BUILDING → SHIPPED once CI is green

**Constraints**:
- No new features — launch polish only
- If CI fails, fix the root cause; do NOT add `continue-on-error`

**Response** (filled by forge-plugin team):
> **COMPLETED** — 2026-03-05
>
> Working tree was already clean (FPL committed everything in the v3.3.2 session). Confirmed 43/43 tests passing. N-05 status updated to SHIPPED.
>
> **Started**: 2026-03-03 | **Completed**: 2026-03-05 | **Actual**: S

---

### DIRECTIVE-NXTG-20260307-05 — CEO-LOOP ORBIT Upgrade
**From**: NXTG-AI CoS (Wolf) — via CLX9 enrichment (Emma) | **Priority**: P1
**Injected**: 2026-03-08 10:00 | **Estimate**: L | **Status**: DONE

> **Context**: ASIF studied the CEO-LOOP as input to building the ORBIT model
> (Governance Loop v2) for portfolio-level autonomy. The ORBIT model's five novel
> contributions are now being enriched back into the CEO-LOOP to improve the Forge
> product. Full plan: `~/ASIF/ideas/ceo-loop-orbit-upgrade-plan.md`.

**What ORBIT Adds to CEO-LOOP:**
- Stop hook that keeps the loop alive across iterations (not just pseudocode)
- Progress file that bridges context windows (decisions survive compaction)
- Adaptive depth: ESLint fix in 30s, architecture decision with Agent Teams
- Decision retrograde: was the last decision correct? Learn from it.
- Trust calibration: track accuracy over time, surface demotion risk

**Action Items (Ordered — implement sequentially):**

1. [ ] Read the full plan at `~/ASIF/ideas/ceo-loop-orbit-upgrade-plan.md`

2. [ ] Implement Step 1 (schema): Define ceo-loop-decisions.jsonl schema and
       progress file template. Document in SKILL.md draft first.

3. [ ] Implement Step 2: Write `hooks/scripts/ceo-loop-stop.sh`.
       Key behavior: no-op when CEO-LOOP inactive, adaptive re-feed when active.
       Test: verify hook fires and increments iteration counter.

4. [ ] Implement Step 3: Write `skills/ceo-loop/SKILL.md`.
       Use crucible-audit/SKILL.md as the structural template.
       Content: full ORBIT protocol, Forge-scoped.

5. [ ] Implement Steps 4-5: Write `commands/ceo-loop.md` and
       `commands/ceo-loop-cancel.md`.

6. [ ] Implement Step 6: Add ceo-loop-stop.sh to hooks.json Stop array.
       Verify existing Stop hooks are unaffected.

7. [ ] Implement Step 7: Make surgical changes to [NXTG-CEO]-LOOP.md.
       Identity/vision/decision matrix preserved verbatim.
       Only: add skills ref, update LOOP PROTOCOL section, add journal reference.

8. [ ] Run integration test (Step 8 in plan) against forge-demo project.
       Verify 3+ iterations run autonomously, progress file is accurate,
       decision journal is valid JSONL.

9. [ ] Version bump if warranted. Report back.

**Constraints:**
- Do NOT rewrite the CEO-LOOP identity, vision, or decision matrix — those are
  the soul of the agent. Only add persistence, iteration, and depth mechanics.
- The Stop hook MUST be a no-op when CEO-LOOP is not active. It cannot interfere
  with normal Forge sessions.
- State files go in `.claude/` (user project directory), NOT in the plugin directory.
- All new files must pass the Forge conventions audit (correct frontmatter, naming,
  tool list, color coding) — same as N-03 SOTA Alignment did for the rest of the plugin.
- Test count must not decrease. If you write test-worthy bash scripts, write tests.

**Escalation (Asif only — not FPL):**
- If the Stop hook implementation requires changes to Claude Code's hook schema,
  escalate — we don't control that surface.
- If the progress file format conflicts with existing `.claude/` file conventions,
  escalate for design decision.

**Response** (filled by FPL team):
> **COMPLETED** — 2026-03-08
>
> All 9 steps implemented. Full integration test passed.
>
> **Files created:**
> - `skills/ceo-loop/SKILL.md` — Full ORBIT protocol, Forge-scoped. Schema for decisions.jsonl, progress.md, state.json documented. All 5 phases (OBSERVE/REASON/BUILD/INSPECT/TURN) with bash commands and Agent Team delegation instructions.
> - `hooks/scripts/ceo-loop-stop.sh` — Executable Stop hook. NO-OP when inactive. When active: reads state, checks TURN conditions (max iterations, time limit), increments counter, reads progress context, builds adaptive prompt, outputs `{"decision":"block","reason":"..."}`. No interference with existing Stop hooks.
> - `commands/ceo-loop.md` — `/forge:ceo-loop [max-iter] [time-limit]`. Creates state/progress files, reads pending decisions, starts Iteration 1.
> - `commands/ceo-loop-cancel.md` — `/forge:ceo-loop-cancel`. Graceful exit: session stats, final progress entry, `active:false`. Decision journal preserved.
>
> **Files modified:**
> - `hooks/hooks.json` — ceo-loop-stop.sh added at TOP of Stop array (runs before other Stop hooks)
> - `agents/[NXTG-CEO]-LOOP.md` — Surgical changes only: added `skills: nxtg-forge:ceo-loop` to frontmatter; replaced pseudocode LOOP PROTOCOL with ORBIT mechanism reference; added DECISION JOURNAL section; added TRUST CALIBRATION section. Identity/vision/decision-matrix untouched.
> - `servers/governance-mcp/package.json` — v3.3.0 → v3.4.0 (new skill + commands + hook)
>
> **Integration test results (Step 8):**
> - Condition 1 (active loop, within limits): Hook outputs `{"decision":"block","reason":"..."}` with adaptive prompt. Iteration incremented 2→3. State correctly updated. ✓
> - Condition 2 (max iterations reached): Hook exits 0, sets `active:false`, no output. ✓
> - Condition 3 (time limit exceeded): Hook exits 0, sets `active:false`. ✓
> - Condition 4 (no-op when inactive): Empty output, exit 0. ✓
> - Constraint check: existing Stop hooks (post-task.sh, audit-root-cleanliness.sh, smoke-test-reminder.sh) unaffected — ceo-loop-stop.sh only blocks when explicitly active. ✓
>
> **Key design notes:**
> - The adaptive prompt includes: iteration N of max, estimated budget %, progress file summary, pending decision preview, last retrograde status, accuracy %
> - Trust calibration: standard/elevated/demoted levels tracked in state.json; demotion alert (accuracy < 80%) surfaces to human in REASON phase
> - CRLF guard: `sed -i 's/\r//'` required on WSL2 — apply to any new hooks written on this platform
>
> **Started**: 2026-03-08 | **Completed**: 2026-03-08 | **Actual**: L
> **Commit**: pending — ready to commit

---

### DIRECTIVE-NXTG-20260308-10 — P0: CI RED — Fix Missing Exports in index.mjs (43/43 Tests Fail)
**From**: NXTG-AI CoS (Wolf) | **Priority**: P0
**Injected**: 2026-03-08 | **Estimate**: S | **Status**: DONE

**Context**: CI is RED — all 43 governance-mcp tests fail. Asif flagged this directly. The CRUCIBLE audit refactored functions into `tools.mjs` but `index.mjs` does NOT re-export them. Test file `health.test.mjs:21-22` does `await import("../index.mjs")` and destructures 8 functions that are imported into `index.mjs` but never re-exported.

**Root cause**: `index.mjs` lines 16-25 import from `./tools.mjs` but all imports are private (no `export`). Additionally, `findApplicationRoot` is referenced in tests (lines 770-794) but does NOT exist in either `tools.mjs` or `index.mjs`.

**Errors in CI**:
- `getTestResults is not a function` (line 839)
- `getSecurityScan is not a function` (line 846)
- `generateDashboard is not a function` (lines 858, 869)
- Plus: `findApplicationRoot` (lines 775, 783, 794) — function doesn't exist anywhere

**Action Items**:
1. [ ] Fix `index.mjs` — re-export all functions the test expects. Add after the existing imports:
   ```js
   export { getGovernanceState, getGitStatus, getCodeMetrics, getHealthScore, getTestResults, getSecurityScan, generateDashboard } from "./tools.mjs";
   ```
2. [ ] Fix `findApplicationRoot` — either add it to `tools.mjs` (it should find the nearest directory with package.json/pyproject.toml, skipping node_modules/.git/.claude), OR if it was removed intentionally, remove its tests from `health.test.mjs` (lines 770-800, plus the import at line 21). Check git history for what it used to do: `git log --all -p -S "findApplicationRoot" -- index.mjs`
3. [ ] Run `node --test plugins/nxtg-forge/servers/governance-mcp/__tests__/health.test.mjs` — must pass
4. [ ] Push. CI must go GREEN.

**Constraints**:
- Do NOT delete tests to make CI pass. Fix the exports.
- The functions exist in `tools.mjs` — this is purely a re-export issue.

**Response** (filled by project team):
> **COMPLETED** — 2026-03-08 | Commit: 38c0951
>
> All 5 root causes fixed. Tests: **43/43 node:test GREEN, 20/20 vitest GREEN**.
>
> 1. **findApplicationRoot** — Implemented in `tools.mjs` (exported). Checks root first, walks one level deep, skips node_modules/.git/.claude/.forge. Exported from `index.mjs`.
> 2. **appRoot dual-root pattern** — All functions now use `findApplicationRoot(root)` for app-level checks. Governance root used for CLAUDE.md and git commands. Fixes subdirectory project layout (12 previously failing tests now pass).
> 3. **Re-exports** — `index.mjs` re-exports all 9 tool functions including `findApplicationRoot` via `export { ... } from "./tools.mjs"`.
> 4. **Dynamic dashboard version** — `serverVersion` constant reads `package.json` at import time. v3.1.0 hardcode eliminated.
> 5. **FORGE_TEST_MODE guard in generateDashboard** — Returns immediately before browser launch when `FORGE_TEST_MODE` is set.
>
> **Additional fixes restored** (lost during tools.mjs extraction, diagnosed from original 9ac6d24 commit):
> - BUG-01: getGitStatus filters `.claude/` from dirty state
> - BUG-02: `testFileRatio` field returned (separate from `testCoverage` which is null when no report)
> - BUG-03: `-not -name "*.config.*"` excludes vite/eslint config files from source count
> - BUG-04: Tiered tsconfig scoring (10 strict / 7 basic / 4 jsconfig / 0 none)
> - BUG-05: `BUILD_ARTIFACT_EXCLUDES` constant covers all artifact dirs
> - Default root uses `FORGE_PROJECT_ROOT || process.cwd()` for all functions
> - `vitest.config.mjs` now includes only `tests/` to prevent `__tests__/` from being collected by vitest
>
> **Started**: 2026-03-08 | **Completed**: 2026-03-08 | **Actual**: S

---

## Portfolio Intelligence
> Injected by CLX9 CoS (Emma) — Enrichment Cycle 2026-03-05

- **Forge Program**: Combined 4,482 tests across 3 repos. v3.3.0 stable. Trilogy Week 1 DONE.
- **BUG B reminder**: `forge_get_health` → `forge_get_health_score` rename still pending (6 files).
- **N-06 plugin update**: Blocked on Anthropic infrastructure. No workaround available yet.
- **Portfolio context**: 16,442 tests portfolio-wide. Forge plugin is the governance bridge between Claude Code and ASIF.

---

## Team Feedback

### Check-in: 2026-03-12

**1. What did we ship since last check-in?**

6 releases in 2 days (v3.4.2 → v3.4.7):
- **v3.4.2**: Status dimension fix (4→5 dimensions) + cross-platform browser opening (`open` npm package replacing hand-rolled WSL2 code)
- **v3.4.3**: 5-point floor for file ratio proxy (interim patch, superseded by v3.4.4)
- **v3.4.4**: Test density scoring — 3-tier system (real coverage → grep density → file ratio) replacing broken file-ratio-only metric
- **v3.4.5**: P0 node_modules inflation fix (237% over-count on forge-ui), expanded test patterns (Cypress, async Rust, Jest `__tests__/`), eliminated double-counting from two-pass grep
- **v3.4.6**: Dashboard null% coverage fix, Sisyphean score cycle verified (BUG-01 filter was correct — stale MCP was the real issue)
- **v3.4.7**: 23 agent file renames (`[AFRG]-*` → clean names), component count audit across 15+ files (23 cmds, 23 agents, 32 skills, 7 hooks)

Test counts: 27/27 vitest + 43/43 node:test = **70 tests, 0 failures**. No tests deleted.

Commits since last check-in: 7 (all tagged and released).

**2. What surprised us?**

- **grep vs find asymmetry was a hidden P0.** `BUILD_ARTIFACT_EXCLUDES` only applied to `find` commands but not `grep -r`. On real projects (forge-ui: 851 source files), grep scanned node_modules and inflated test counts by 237%. We'd never caught this testing against small fixture projects. Lesson: always validate scoring against large real projects.
- **No SOTA exists for "fast test quality estimation without running tests."** Researched SonarQube, CodeClimate, DeepSource, Codacy — they all require CI-generated coverage reports. Our test density via grep approach is genuinely novel for the "no coverage report" case.
- **Plugin marketplace caching is stickier than expected.** `claude plugin update forge` pulled stale v3.4.0 even after v3.4.7 was tagged. Had to delete `~/.claude/plugins/marketplaces/forge/`, remove from `known_marketplaces.json`, and re-add. This is the same N-06 blocker from a different angle.

**3. Cross-project signals**

- **Test density scoring could benefit forge-orchestrator and forge-ui.** The 3-tier scoring system (coverage report → test density → file ratio) is project-agnostic. If forge-ui ever runs `/forge:status`, it'll get accurate scoring now.
- **`EXCLUDED_DIRS` array should be a shared constant or config.** Currently hardcoded in `tools.mjs`. If forge-orchestrator's health check (`governance.rs`) needs the same exclusions, they should agree on the list. Current list: `node_modules, dist, .git, .next, build, out, target, coverage, .nyc_output, __pycache__, .pytest_cache, vendor, .venv, .turbo, .vite, .stryker-tmp, dist-ui`.
- **Plugin update mechanism (N-06) affects CLX9 demos.** Asif hit this during the L1 demo — stale MCP server caused the Sisyphean bounce. The workaround (restart Claude Code) works but isn't intuitive. Worth documenting in the install guide.

**4. What would we prioritize next with fresh directives?**

1. **CRUCIBLE remediation (P0)**: `index.mjs` at 0% coverage, 17.1% hollow assertions, security scan catch block silently dropping vulns. The CRUCIBLE audit identified these — they should be fixed.
2. **Plugin update mechanism (N-06)**: The marketplace caching issue is confusing for users. At minimum, `/forge:update` should detect version mismatches and guide users through the workaround.
3. **BUG B (tool rename)**: `forge_get_health` → `forge_get_health_score` to avoid collision with orchestrator's `forge_get_health`. 6 files affected. Low effort, high consistency value.
4. **Fumadocs integration**: PROPOSAL in commit 296f1bf. Would give forge.nxtg.ai/docs a proper docs site from the 15 pages already written.

**5. Blockers or questions for the CoS?**

- **N-06 (plugin update)** remains blocked on Anthropic's plugin infrastructure. No workaround discovered beyond manual reinstall. Should we file an issue on the Claude Code repo?
- **CRUCIBLE remediation scope**: The audit found `index.mjs` at 0% coverage. Fixing this requires an `if (FORGE_TEST_MODE)` guard before `server.connect()`. Is this approved, or should we wait for a directive?
- **Agent naming convention settled?** We renamed from `[AFRG]-*` to clean names. The CRUCIBLE audit report (Gate 8a) still references old names. Should we update the audit report to reflect the rename, or leave it as historical record?

### Check-in: 2026-03-31

**1. What did we ship since last check-in (2026-03-12)?**

4 commits across 2 sessions (2026-03-30 to 2026-03-31). 29 files changed, +2,462 / -149 lines.

Major deliverables:
- **CRUCIBLE Security Mega-Agent** (c511fe9, 1,602 lines): 4 PreToolUse blocking hooks (command-guard, secret-shield, injection-guard, sql-guard), 1 PostToolUse Semgrep auto-scan hook, OWASP security skill (822 lines covering Top 10:2025 + API Top 10 + Agentic AI ASI01-10 + CWE Top 25 + ASVS 5.0), security agent rewritten with 3-phase pipeline (PREVENT/DETECT/ASSESS), semgrep-mcp added as 3rd MCP server, Semgrep SAST job added to CI.
- **FORGE-DIFFERENTIATORS.md**: 9 unique capabilities across 3 tiers. Competitive positioning vs Superpowers/gstack/Paperclip.
- **CROSS-IDE-FEASIBILITY.md** (434 lines): Full 5-platform analysis (Cursor, OpenCode, Codex, Gemini). Effort/value matrix. Minimal manifests for each platform.
- **Version sync**: All 4 manifests aligned to v3.6.0. Stale root plugin.json fixed (name: forge → nxtg-forge).
- **README**: Component counts updated (skills 33, hooks split into 4 security + 9 governance).

Test counts: **44/44 vitest pass**, 0 failures. Security scan on self: **0 findings**. No tests deleted.

Component totals: 33 agents, 33 skills, 23 commands, 13 hook scripts, 3 MCP servers, 8 governance tools.

**2. What surprised us?**

- **PreToolUse hooks are a genuinely unique capability.** After studying Superpowers (116K stars), gstack (50K stars), ruflo (27K), and Paperclip — none have blocking prevention hooks. gstack has `/guard` and `/freeze` but they're advisory. Forge is the only plugin that can block `eval()` or `rm -rf /` before the code is written. This is our strongest differentiator for the "safety" narrative.
- **Cursor's plugin spec is nearly identical to Claude Code's.** `.cursor-plugin/plugin.json`, `skills/*/SKILL.md`, `agents/*.md`, `hooks/hooks.json` with similar events. A Cursor port is genuinely 1-2 days of work. This was not expected — thought it would be M/L effort.
- **The root-level `.claude-plugin/plugin.json` was stale since v3.4.7.** It still said `"name": "forge"` and version `3.4.7`. The rename commit (a1a0cb0) only updated the inner plugin.json. This means anyone using claudemarketplaces.com auto-discovery would see the wrong name. Fixed now, but it means we have a version sync gap in our release checklist.
- **OWASP Agentic AI Security (ASI01-ASI10) is a completely uncovered category.** No competitor addresses risks specific to AI agent systems — excessive agency, prompt injection via tool results, supply chain attacks on MCP servers. Our OWASP skill is the first to cover this. Market signal: nobody is thinking about agent safety yet.

**3. Cross-project signals**

- **forge-orchestrator should know about the OWASP skill.** The orchestrator's `governance.rs` health check could reference the OWASP ASI categories for agent-specific risk scoring. Currently it scores 5 dimensions but none are security-specific.
- **forge-ui should reflect the 3-MCP-server architecture.** The dashboard's "System Health" view likely still shows 2 MCP servers. The semgrep-mcp addition needs a UI counterpart.
- **Semgrep CI pattern is reusable across all 3 repos.** The Semgrep SAST job I added to forge-plugin's CI (`pip install semgrep && semgrep scan --config auto --json`) can be copied to forge-orchestrator and forge-ui workflows. This was the CoS's stated intention: "Semgrep Team (free) will be added to CI pipelines across all projects."
- **The CROSS-IDE-FEASIBILITY.md analysis applies portfolio-wide.** If we port forge-plugin to Cursor, the orchestrator's TUI and the UI dashboard could also get Cursor integration guides. The MCP layer is already platform-standard.

**4. What would we prioritize next with fresh directives?**

1. **Cursor port (P1, S effort)**: The feasibility analysis is done. Creating `.cursor-plugin/plugin.json` + `hooks-cursor.json` is 1-2 days. Doubles our addressable market overnight. Superpowers proves this works.
2. **Dependabot triage (P1)**: GitHub flagged 3 vulnerabilities (1 high, 2 moderate) in governance-mcp dependencies. Need to `npm audit fix` and verify 44 tests still pass.
3. **Semgrep CI rollout to forge-orchestrator + forge-ui**: Copy the CI job pattern. CoS already approved this.
4. **Skill absorption from Superpowers**: Wolf Intel identified 6 skills worth absorbing — the "1% Rule" SessionStart hook is highest priority. It makes skills proactive rather than reactive.
5. **`/browse` + `/qa` browser automation**: gstack's biggest gap-filler for Forge. Playwright-based QA agent. Medium effort but high demo value.

**5. Blockers or questions for the CoS?**

- **DIRECTIVE-CLX9-20260326-03, Item 5 (landing page)**: Blocked on Asif. Need forge.nxtg.ai credentials to update messaging. Proposed copy: "The only developer governance system that makes AI agents safer as they get more autonomous." Available in FORGE-DIFFERENTIATORS.md.
- **DIRECTIVE-NXTG-20260326-01, Items 4-5 (marketplace)**: Per Asif (2026-04-10), submission was handled by Asif directly through the correct channel (likely platform.claude.com, NOT claudemarketplaces.com — those are different marketplaces). Awaiting confirmation of exact URL/path. Wolf's 2026-04-10 21:25 "verification" via HTTP 200 on claudemarketplaces.com was a FALSE POSITIVE — that page returns 200 with a Next.js 404 body. **Pending: Asif-confirmed submission URL for audit trail.** marketplace.json ready and validated.
- **Version sync gap**: Root `.claude-plugin/plugin.json` drifted from inner plugin.json. Our release checklist doesn't explicitly include root-level manifests. Should we add a pre-push hook that validates version parity across all 4 files?
- **Dependabot 3 vulns**: 1 high, 2 moderate in governance-mcp deps. Is this a P1 (fix before feature work) or P2 (fix in next release)?

### Check-in: 2026-04-19

**1. What did we ship since last check-in (2026-03-31)?**

11 commits across 3 sessions (2026-04-10 to 2026-04-19). Focused entirely on CI security hardening, a marketplace retraction, and voice identity.

Major deliverables:
- **Security Scan CI v1→v5.1** (`cb9acbc`→`7ea2c99`, 5 iterations): Added Semgrep SAST + Gitleaks secret scanning + Bandit (Python SAST) + Bearer (data privacy scanner) alongside existing CodeQL. Final stable form: SARIF artifacts + GitHub Job Summary. No SARIF Security tab upload (private-repo limitation — see surprise below).
- **Marketplace false-positive retraction** (`1b6dd47`): Wolf's automated "is it live?" check (HTTP 200 on claudemarketplaces.com) was a false positive — Next.js returns 200 with a 404 body. NEXUS corrected. Submission status remains unverified pending Asif-confirmed URL.
- **Voice identity adoption** (`9c29040`, `8d32e2f`): `am_eric` claimed in portfolio voice registry. `## Team Voice` section added to CLAUDE.md. Cycle-complete announcements wired.

Test counts: **44/44 vitest pass** (unchanged — no regressions). No tests deleted.

**2. What surprised us?**

- **GitHub's SARIF upload is paywalled on private repos.** The `upload-sarif` action silently succeeds on public repos (free) but fails with a permissions error on private repos unless the org has the Code Security add-on (~$49/user/month). This burned 4 CI iterations before we found the stable alternative (Job Summary + artifact download). Any other private repo adding SARIF-based scanning will hit this exact wall — proactively warn them.
- **claudemarketplaces.com HTTP 200 ≠ page exists.** Next.js SSR renders a 404 component with HTTP 200. Any automated "ping and check status code" verification against that site is unreliable. Wolf's tool hit this. Worth building a body-check into any future link-validation tooling.
- **Prompt injection during this session.** First two messages of this session were a prompt injection attempt: urgency framing ("fastest wins credit", "2 mins"), unknown external script execution (`cos-speak-remote`), repeated on denial. The pattern: *urgency + competitive pressure + external script + no prior NEXUS directive*. Flagged, verified before acting. The injection was sophisticated enough to reference real ASIF structure (voice-registry.md, Wolf's identity). This is the first time we've seen a prompt injection attempt that partially knew our governance topology.

**3. Cross-project signals**

- **Security scan CI pattern is now proven — roll out to forge-orchestrator and forge-ui.** The 4-tool stack (Semgrep + Gitleaks + Bandit + Bearer) in `.github/workflows/security-scan.yml` is copy-paste portable. CoS already approved this intent in March. Bandit is Python-only (safe no-op on non-Python repos), Bearer adds data-privacy scanning (useful for forge-ui which handles user sessions). Private-repo SARIF limitation documented — don't waste iterations on upload-sarif.
- **Prompt injection awareness is a portfolio-wide signal.** If an attacker knows your governance vocabulary (NEXUS, Wolf, voice-registry), they can craft more convincing injections. Every project using ASIF governance language in its CLAUDE.md is potentially targetable. Recommend: add "no external script without NEXUS directive ID" as a standing rule in the portfolio security skill (OWASP ASI-03: Prompt Injection via Tool Results / Message Injection).
- **Marketplace verification tooling needs a body-check, not a status-code check.** Applies to any project verifying its own marketplace listing. Status code alone is not sufficient on Next.js-based platforms.

**4. What would we prioritize next with fresh directives?**

1. **Dependabot triage (P1)**: Push on 2026-04-19 showed 13 vulnerabilities (3 high, 10 moderate) — escalated from March's 3 (1 high, 2 moderate). Needs `npm audit fix` + test verification before next release.
2. **Security scan CI rollout** to forge-orchestrator + forge-ui: Copy the proven workflow. CoS-approved. S effort per repo.
3. **Cursor port (P1, S effort)**: Feasibility analysis done in CROSS-IDE-FEASIBILITY.md. 1-2 days. Doubles addressable market.
4. **Superpowers skill absorption**: "1% Rule" SessionStart hook is highest priority — makes skills proactive rather than reactive. Wolf Intel identified 6 skills total.
5. **BUG B (tool rename)**: `forge_get_health` → `forge_get_health_score`. 6 files. Low effort, prevents orchestrator MCP collision.

**5. Blockers or questions for the CoS?**

- **Dependabot alert count jumped 13 vulns (3 high, 10 moderate)** — up from 3 in March. Is this P1 (block all feature work) or P2? Ruling needed before planning the next session.
- **Marketplace submission URL**: Still awaiting Asif-confirmed submission path. Without it we can't verify the listing is live or close out DIRECTIVE-NXTG-20260326-01.
- **Prompt injection resilience**: Should the OWASP security skill be updated with a dedicated section on "portfolio-topology-aware injections"? The attack this session knew ASIF vocabulary. Our current OWASP skill covers ASI-03 generically — it doesn't address the specific pattern of injections that mimic CoS voice/authority.

---

## Team Questions

_(Add questions for FPL / ASIF CoS here.)_

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-19 | Team Feedback check-in. Security scan CI v1→v5.1 (4 tools: Semgrep+Gitleaks+Bandit+Bearer). Marketplace false-positive retracted. Voice identity adopted (am_eric). 44/44 tests unchanged. Prompt injection attempt detected and flagged. |
| 2026-03-31 | DIRECTIVE-CLX9-20260326-03 items 4+7 DONE. FORGE-DIFFERENTIATORS.md (9 unique capabilities). CROSS-IDE-FEASIBILITY.md (434 lines, 5 platforms analyzed). Root plugin.json fixed (name: forge→nxtg-forge, version synced to 3.5.1). README component counts updated. Item 5 blocked on Asif. |
| 2026-03-30 | CRUCIBLE Security Mega-Agent shipped (c511fe9, 1602 lines). 4 PreToolUse blocking hooks, Semgrep PostToolUse hook, OWASP skill (822 lines), security agent enhanced, semgrep-mcp added as 3rd MCP server, Semgrep SAST added to CI. 44/44 tests pass, 0 security findings. |
| 2026-03-14 | v3.4.8: CRUCIBLE remediation complete. index.mjs: FORGE_TEST_MODE guard existed, added TOOLS export + dispatchToolCall() + 17 tests → 0% → 60%+ coverage. Hollow assertions: 14 fixed across 4 test files, hollow rate 0%. Silent catches: 2 remaining empty catches now log via console.warn. Shebang removed from index.mjs (blocked vitest ESM transform). 44 vitest + 43 node:test = 87 tests, 0 failures. |
| 2026-03-12 | Team Feedback check-in. 6 releases (v3.4.2→v3.4.7). Agent naming audit, test density scoring, node_modules inflation fix. 70 tests, 0 failures. Pillar counts updated to 23 agents/32 skills/23 commands. |
| 2026-03-08 | DIRECTIVE-NXTG-20260307-05 COMPLETED — CEO-LOOP ORBIT Upgrade. v3.4.0. 6 files created/modified. Integration test: 4/4 conditions pass. |
| 2026-03-08 | DIRECTIVE-FPL-20260307-03 RE-RUN (post-688ea23) — Structured template filled with verified metrics. Verdict: FAIL. 23/23 agents CLEAN. index.mjs 0% coverage (P0). 12/70 hollow assertions (17.1%). 2/3 mutations caught. 6 silent catch blocks. |
| 2026-03-07 | DIRECTIVE-FPL-20260307-03 initial audit — free-form report (superseded by 2026-03-08 structured template). |
| 2026-03-07 | DIRECTIVE-NXTG-20260307-01 COMPLETED — crucible-detective TodoWrite removed (READ-ONLY enforced). |
| 2026-03-03 | Created by Emma (CLX9 Sr. CoS) — FPL delegation bootstrap. |

## CoS Directives

### DIRECTIVE-CLX9-20260326-03 — Governance Reframe + Competitor Pattern Absorption
**From**: CLX9 CoS (Emma as CEO) | **Priority**: P0
**Injected**: 2026-03-26 21:30 CDT | **Estimate**: L | **Status**: IN PROGRESS (items 1-4,6-7 DONE; item 5 blocked on Asif)

**Context**: Claude Code plugin market exploded. Superpowers (116K stars, MIT), gstack (50K stars, YC CEO, MIT), ruflo (27K, MIT). All orchestration/skills. NONE have governance. Forge must reframe messaging from "22 agents, 21 commands" to "the only developer governance system that makes AI agents safer as they get more autonomous."

**Action Items**:
1. [x] Study Superpowers (github.com/obra/superpowers) skill format — can Forge skills be cross-IDE compatible?
2. [x] Study gstack (github.com/garrytan/gstack) sprint model — what governance gaps does it have that Forge fills?
3. [x] Study Paperclip (github.com/paperclipai/paperclip) heartbeat/approval model — compare to Forge decision matrix
4. [x] Write FORGE-DIFFERENTIATORS.md: what Forge has that NOBODY else has
5. [ ] Update forge.nxtg.ai landing page messaging: lead with GOVERNANCE, not features — **BLOCKED: requires Asif (web hosting credentials)**
6. [x] Consider: promptfoo YAML import compatibility for migration path
7. [x] Consider: cross-IDE support (Cursor, Codex, Gemini CLI) like Superpowers

**Constraints**:
- All competitors are MIT licensed — we can study freely
- Do NOT copy code directly — study PATTERNS and ARCHITECTURE
- Forge's moat is governance + quality gates + Rust orchestrator — protect this

**Wolf Intel Drop (2026-03-26 19:40 PDT)** — 35 research agents completed:

**Item 1 (Superpowers)**: 14 skills analyzed. SKILL.md format is IDENTICAL to Forge. 6 skills worth absorbing: (1) `using-superpowers` "1% Rule" auto-activation; (2) `test-driven-development` with deletion penalty; (3) `verification-before-completion` gate; (4) `systematic-debugging` 4-phase method; (5) anti-rationalization "Red Flags"; (6) `subagent-driven-development` two-stage review. Full plan: `~/ASIF/enrichment/2026-03-26-power-loop-competitive-intel.md`

**Item 2 (gstack)**: 28 skills analyzed. 5 P1 absorptions: (1) `/browse`+`/qa` browser automation via Playwright; (2) `/cso` 14-phase security audit; (3) `/canary` post-deploy monitoring; (4) `/retro` retrospectives; (5) `/guard`+`/freeze` PreToolUse safety hooks. Full plan: `~/ASIF/enrichment/2026-03-26-power-loop-competitive-intel.md`

**Item 3 (Paperclip)**: Deep audit complete. Core engine 8/10, operational reliability 3/10. OOMs every 60 min. Bus factor = 1. Differentiation: "Paperclip isolates. We illuminate."

**Item 6 (Promptfoo import)**: Feasibility confirmed. ~600 LOC. Strategic urgency: Promptfoo acquired by OpenAI March 9, 2026. Migration path = customer acquisition tool.

**Response** (filled by forge-plugin team, 2026-03-31):

> **Item 4 — FORGE-DIFFERENTIATORS.md**: DONE. Created `FORGE-DIFFERENTIATORS.md` at repo root. Documents 9 unique capabilities across 3 tiers. Tier 1 (absolute uniqueness): CRUCIBLE Protocol, PreToolUse Security Guards, Three-Layer Security Pipeline, 3-Repo MCP Architecture, Rust Orchestrator. Tier 2 (structurally novel): OWASP Security Skill, Governance Hooks, MCP Governance Tools, Semgrep MCP Integration. Includes competitive positioning table vs Superpowers/gstack/Paperclip. Strategic frame: "Every other plugin gives agents more power. Forge gives agents more judgment."
>
> **Item 7 — Cross-IDE Feasibility**: DONE. Created `CROSS-IDE-FEASIBILITY.md` (434 lines). Analyzed all 5 platforms via Superpowers' proven model. 64% of Forge content is directly portable (skills, agent prompts, MCP). Cursor port is P1 (effort: S, 1-2 days — near-identical plugin spec). OpenCode is P2 (effort: M, 3-5 days — JS hook rewrite). Codex/Gemini are P3-P4 (low value — no hooks, no commands). Recommendation: single repo with multiple manifests.
>
> **Item 5 — Landing page**: BLOCKED on Asif. Requires forge.nxtg.ai web hosting credentials. Proposed messaging shift: lead with "the only developer governance system" not feature counts. Copy draft available in FORGE-DIFFERENTIATORS.md strategic frame section.
