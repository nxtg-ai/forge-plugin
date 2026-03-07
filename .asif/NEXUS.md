# NEXUS — forge-plugin Vision-to-Execution Dashboard

> **Owner**: Asif Waliuddin
> **Program**: NXTG-Forge (P-03c) | **Program Lead**: FPL
> **Last Updated**: 2026-03-03
> **North Star**: The smartest Claude Code plugin ecosystem — 22 agents that actually know how to work together.

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

### PILLAR-1 — AGENT ECOSYSTEM: "22 agents that route, delegate, and never hallucinate a teammate"
- The full agent roster: planner, builder, guardian, detective, oracle, compliance, governance-verifier, learning, orchestrator, refactor, release-sentinel, performance, and 10 more domain specialists.
- Skills (29) and commands (21) provide the user-facing surface.
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

### DIRECTIVE-NXTG-20260307-01 — New Agent + Skill: CRUCIBLE Detective (from Wolf)
**From**: NXTG-AI CoS (Wolf) — on behalf of Asif Waliuddin | **Priority**: P1
**Injected**: 2026-03-07 01:45 | **Estimate**: S | **Status**: PENDING

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
> {team writes here}
> **Started**: | **Completed**: | **Actual**:

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

## Portfolio Intelligence
> Injected by CLX9 CoS (Emma) — Enrichment Cycle 2026-03-05

- **Forge Program**: Combined 4,482 tests across 3 repos. v3.3.0 stable. Trilogy Week 1 DONE.
- **BUG B reminder**: `forge_get_health` → `forge_get_health_score` rename still pending (6 files).
- **N-06 plugin update**: Blocked on Anthropic infrastructure. No workaround available yet.
- **Portfolio context**: 16,442 tests portfolio-wide. Forge plugin is the governance bridge between Claude Code and ASIF.

---

## Team Questions

_(Add questions for FPL / ASIF CoS here.)_

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-03 | Created by Emma (CLX9 Sr. CoS) — FPL delegation bootstrap. |
