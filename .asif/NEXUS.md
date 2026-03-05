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

### DIRECTIVE-FPL-20260303-01 — Trilogy Launch Week 1: Ship & Verify
**From**: Forge Program Lead | **Priority**: P0
**Injected**: 2026-03-03 | **Estimate**: S | **Status**: PENDING

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

_Cross-project insights injected by ASIF CoS._

---

## Team Questions

_(Add questions for FPL / ASIF CoS here.)_

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-03 | Created by Emma (CLX9 Sr. CoS) — FPL delegation bootstrap. |
