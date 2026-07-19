// Seeded-defect negative controls for the L3 harness check functions (DIRECTIVE-NXTG-20260718-13
// DoD: "fails deterministically on each seeded defect"). These assert the SAME functions the live
// journey (l3-journey.mjs) invokes — the tested logic IS the shipped logic, no reimplementation.
//
// Seeded defects required by the directive (item 4): ui-absent → fail-closed named finding, identity
// mismatch, stale/estimate health (drift). Plus the WS round-trip control and a fixture-leak control.

import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { checkHealthContract, checkUiIdentity, checkWsRoundtrip } from "./lib/checks.mjs";
import { makeFixtureWith } from "./integration/l3-journey.mjs";

describe("L3 harness checks — seeded-defect controls", () => {
  it("checkHealthContract: orchestrator-sourced round-match passes; estimate/mismatch/float-strict fail", () => {
    // Rust float, UI rounded int, source orchestrator → contract holds.
    expect(checkHealthContract(90, "orchestrator", 90.0).ok).toBe(true);
    expect(checkHealthContract(87, "orchestrator", 87.4).ok).toBe(true); // Math.round(87.4)=87
    // forge-ui fell back to its own "estimate" computation → drift regardless of the number.
    const est = checkHealthContract(87, "estimate", 87.4);
    expect(est.ok).toBe(false);
    expect(est.reason).toContain("UI_HEALTH_CONTRACT_DRIFT");
    expect(est.reason).toContain("estimate");
    // Score mismatch even with orchestrator source (a real contract break).
    const mis = checkHealthContract(88, "orchestrator", 90.0);
    expect(mis.ok).toBe(false);
    expect(mis.reason).toContain("!= Math.round");
    // No rust score to compare → fail (never a false green).
    expect(checkHealthContract(90, "orchestrator", undefined).ok).toBe(false);
  });

  it("checkUiIdentity: canonical bind passes; unknown name, wrong-dir, and prefix-sibling each fail", () => {
    const fx = "/tmp/forge-l3-fixture-abc";
    expect(checkUiIdentity("l3-fixture", `${fx}`, "l3-fixture", fx).ok).toBe(true);
    // Trailing-slash / non-normalized form of the SAME dir still passes (normalized equality).
    expect(checkUiIdentity("l3-fixture", `${fx}/`, "l3-fixture", fx).ok).toBe(true);
    // forge-ui's pre-e8c011f bug: data.project.name === "unknown".
    const unknown = checkUiIdentity("unknown", fx, "l3-fixture", fx);
    expect(unknown.ok).toBe(false);
    expect(unknown.reason).toContain("UI_IDENTITY_DRIFT");
    // Server bound to a completely WRONG dir.
    const wrongDir = checkUiIdentity("l3-fixture", "/home/somewhere/else", "l3-fixture", fx);
    expect(wrongDir.ok).toBe(false);
    expect(wrongDir.reason).toContain("not the same location");
    // regate-13 C2: a PREFIX-SHARING SIBLING (…-abc-stale) must NOT pass — containment would have.
    const sibling = checkUiIdentity("l3-fixture", `${fx}-stale`, "l3-fixture", fx);
    expect(sibling.ok).toBe(false);
    expect(sibling.reason).toContain("not the same location");
  });

  it("checkWsRoundtrip: full round-trip passes; missing state.update / pong / binding each fail", () => {
    expect(checkWsRoundtrip({ events: ["state.update", "pong"], fixtureBound: true }).ok).toBe(true);
    expect(checkWsRoundtrip({ events: ["pong"], fixtureBound: true }).reason).toContain("no state.update");
    expect(checkWsRoundtrip({ events: ["state.update"], fixtureBound: true }).reason).toContain("no pong");
    // state.update arrived but its payload did NOT carry the fixture identity → not a real binding.
    const unbound = checkWsRoundtrip({ events: ["state.update", "pong"], fixtureBound: false });
    expect(unbound.ok).toBe(false);
    expect(unbound.reason).toContain("did not bind");
  });

  it("makeFixtureWith: cleans its temp dir when setup (populate) throws — no leak", () => {
    let captured = null;
    expect(() => makeFixtureWith((dir) => { captured = dir; throw new Error("setup boom"); })).toThrow("setup boom");
    expect(captured).toBeTruthy();
    expect(existsSync(captured)).toBe(false);
  });
});
