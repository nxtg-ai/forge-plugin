// Seeded-defect negative controls for the L1 harness check functions (DIRECTIVE-NXTG-20260718-10
// DoD: "fails deterministically on each seeded defect"). These assert the SAME functions the live
// journey (l1-journey.mjs) invokes — the tested logic is the shipped logic, no reimplementation.

import { describe, it, expect } from "vitest";
import { NODE_TOOLS, checkToolSet, checkNoOrchestratorRef, checkShapedResponse } from "./lib/checks.mjs";

describe("L1 harness checks — seeded-defect controls", () => {
  it("checkToolSet: passes the exact 8, fails a missing tool", () => {
    expect(checkToolSet(NODE_TOOLS).ok).toBe(true);
    const r = checkToolSet(NODE_TOOLS.slice(0, 7));
    expect(r.ok).toBe(false);
    expect(r.missing).toContain("forge_open_dashboard");
  });

  it("checkToolSet: flags the L2 forge_get_health leaking into the L1 tool list", () => {
    const r = checkToolSet([...NODE_TOOLS, "forge_get_health"]);
    expect(r.ok).toBe(false);
    expect(r.extra).toContain("forge_get_health");
  });

  it("checkNoOrchestratorRef: clean passes; word + tool-name + L2 forge_get_health all trip it", () => {
    expect(checkNoOrchestratorRef([{ tool: "h", text: '{"score":80}' }]).ok).toBe(true);
    expect(checkNoOrchestratorRef([{ tool: "a", text: "see the orchestrator for drift" }]).offenders).toContain("a");
    expect(checkNoOrchestratorRef([{ tool: "b", text: "call forge_check_drift next" }]).ok).toBe(false);
    expect(checkNoOrchestratorRef([{ tool: "c", text: "forge_get_health" }]).ok).toBe(false); // L2 tool = orch ref
    expect(checkNoOrchestratorRef([{ tool: "d", text: "forge_get_governance_health" }]).ok).toBe(true); // Node tool = fine
  });

  it("checkShapedResponse: good passes; error / non-JSON / missing-key all fail", () => {
    const good = { content: [{ type: "text", text: JSON.stringify({ score: 80, grade: "B", checks: [] }) }] };
    expect(checkShapedResponse("forge_get_governance_health", good).ok).toBe(true);
    expect(checkShapedResponse("forge_get_governance_health", { isError: true, content: [] }).ok).toBe(false);
    expect(checkShapedResponse("forge_get_governance_health", { content: [{ type: "text", text: "not json" }] }).ok).toBe(false);
    expect(checkShapedResponse("forge_get_governance_health", { content: [{ type: "text", text: '{"unrelated":1}' }] }).ok).toBe(false);
    expect(checkShapedResponse("forge_run_tests", { structuredContent: { runner: null } }).ok).toBe(true); // structuredContent path
  });
});
