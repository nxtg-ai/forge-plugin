# Contract — fields `governance-mcp` consumes from `.claude/governance.json`

**Origin:** Codex regate-14 (L3 harness) surfaced `GOVERNANCE_SCHEMA_DIVERGENCE` — forge-ui's startup migration rewrites `.claude/governance.json` from the plugin's `{project:{name}}` schema to a `{version, constitution}` schema, **dropping every field governance-mcp reads except `version`**. This doc is the contract forge-ui must **round-trip** (preserve through its migration). Cross-product defect tracked as **DIRECTIVE-NXTG-20260719-18** (forge-ui owns the fix; Leg B of the L3 gate). Convergence-spec style: forge-ui reads this and confirms round-trip before the L3 regate can pass.

The L3 harness does **not** repair this — a release gate must never fix product-owned state to pass. The governance identity leg fails honestly (red L3 = true state) until forge-ui round-trips the contract.

## The consumed fields (authoritative — `servers/governance-mcp/tools.mjs`)

`getGovernanceState()` reads `<root>/.claude/governance.json` (`tools.mjs:108-109`) and returns (`tools.mjs:120-126`):

| Field read from `governance.json` | Used as | Source line | Consumed by |
|---|---|---|---|
| top-level file presence | `initialized: true` | `tools.mjs:121` | `getHealthScore()` **Governance check (+15)** — `tools.mjs:317` |
| `version` (string) | `version` | `tools.mjs:122` | state readout |
| **`project`** (object: `.name`, `.vision`, `.goals[]`) | `project` | `tools.mjs:123` | **identity** (`project.name`), dashboard title/vision/goals — `tools.mjs:643-644,736` |
| `workstreams` (array; `.length`) | `workstreams` count | `tools.mjs:124` | state readout |
| `qualityGates` (object) | `qualityGates` | `tools.mjs:125` | state readout |
| `metrics` (object) | `metrics` | `tools.mjs:126` | state readout |

Tool wiring: `index.mjs:62-64` registers `forge_get_governance_state` ("project name, vision, goals, workstreams, quality gates, and session metrics"); `index.mjs:134` dispatches to `getGovernanceState()`.

## The canonical shape governance-mcp expects

```jsonc
{
  "version": "3.0.0",
  "project": { "name": "<project>", "vision": "…", "goals": ["…"] },   // ← REQUIRED; project.name is the identity
  "workstreams": [ /* … */ ],
  "qualityGates": { /* … */ },
  "metrics": { /* … */ }
}
```

## What forge-ui's migration currently produces (the divergence)

```jsonc
{ "version": "3.0.0", "constitution": { "constraints": [], "principles": [] } }
// 'project', 'workstreams', 'qualityGates', 'metrics' all DROPPED → governance-mcp identity = undefined,
// Governance check still +15 (file present) but state/identity/dashboard degrade.
```

## The round-trip forge-ui must honor (Leg B acceptance)

forge-ui may add its `constitution` block, but its migration MUST **preserve** the fields above — at minimum `project` (with `name`), `workstreams`, `qualityGates`, `version` — so a project scored/served by all three products keeps one governance identity. When forge-ui round-trips this contract, the L3 governance identity leg goes green and the `GOVERNANCE_SCHEMA_DIVERGENCE` finding clears.
