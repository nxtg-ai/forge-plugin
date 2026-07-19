// Seeded-defect negative controls for the L2 harness check functions (DIRECTIVE-NXTG-20260718-11
// DoD: "fails deterministically on each seeded defect"). These assert the SAME functions the live
// journey (l2-journey.mjs) invokes — the tested logic IS the shipped logic, no reimplementation.
//
// Seeded defects required by the directive (item 4): wrong-binary-version, missing Rust tool,
// cross-server identity mismatch. Plus a lifecycle-not-applied control (item 3's value-proof).

import { describe, it, expect } from "vitest";
import {
  ORCH_TOOLS, FORGE_PIN, checkToolSet, checkBinaryVersion, checkIdentityMatch, checkLifecycle,
} from "./lib/checks.mjs";

describe("L2 harness checks — seeded-defect controls", () => {
  it("checkBinaryVersion: pinned passes; wrong version + absent both fail with named findings", () => {
    expect(checkBinaryVersion(FORGE_PIN).ok).toBe(true);
    const wrong = checkBinaryVersion("1.5.1");
    expect(wrong.ok).toBe(false);
    expect(wrong.reason).toContain("WRONG_BINARY_VERSION");
    const absent = checkBinaryVersion(null);
    expect(absent.ok).toBe(false);
    expect(absent.reason).toContain("FORGE_ABSENT");
  });

  it("checkToolSet: exact 11 Rust tools pass; a missing Rust tool fails and is named", () => {
    expect(checkToolSet(ORCH_TOOLS, ORCH_TOOLS).ok).toBe(true);
    const r = checkToolSet(ORCH_TOOLS.filter((t) => t !== "forge_get_health"), ORCH_TOOLS);
    expect(r.ok).toBe(false);
    expect(r.missing).toContain("forge_get_health");
    // and an unexpected extra Rust tool is also caught (surface drift, either direction)
    const e = checkToolSet([...ORCH_TOOLS, "forge_new_unshipped_tool"], ORCH_TOOLS);
    expect(e.ok).toBe(false);
    expect(e.extra).toContain("forge_new_unshipped_tool");
  });

  it("checkIdentityMatch: both-bound passes; each mismatch axis fails distinctly", () => {
    expect(checkIdentityMatch("l2-fixture", "l2-fixture", "l2-fixture").ok).toBe(true);
    // node bound to the wrong dir (server-dir false-pass) — node != expected
    expect(checkIdentityMatch("governance-mcp", "l2-fixture", "l2-fixture").ok).toBe(false);
    // rust bound to the wrong dir — rust != expected
    expect(checkIdentityMatch("l2-fixture", "some-other-proj", "l2-fixture").ok).toBe(false);
    // servers bound to DIFFERENT projects (cross-server mismatch) even if neither equals expected
    const cross = checkIdentityMatch("proj-a", "proj-b", "proj-a");
    expect(cross.ok).toBe(false);
    expect(cross.reason).toContain("cross-server identity mismatch");
  });

  it("checkLifecycle: full transition passes; each un-applied step fails deterministically", () => {
    const before = { pending: 2, completed: 0 };
    const after = { pending: 1, completed: 1 };
    const events = ["plan_created", "task_assigned", "task_completed"];
    expect(checkLifecycle({ summaryBefore: before, summaryAfter: after, taskStatus: "completed", eventTypes: events }).ok).toBe(true);

    // state.json did not transition (completed stayed flat) — the "passes while testing nothing" trap
    const flat = checkLifecycle({ summaryBefore: before, summaryAfter: before, taskStatus: "completed", eventTypes: events });
    expect(flat.ok).toBe(false);
    expect(flat.problems.join(" ")).toContain("completed did not increase");

    // task file never flipped to completed
    const notDone = checkLifecycle({ summaryBefore: before, summaryAfter: after, taskStatus: "pending", eventTypes: events });
    expect(notDone.ok).toBe(false);
    expect(notDone.problems.join(" ")).toContain("status != completed");

    // events.jsonl missing the task_completed append
    const noEvent = checkLifecycle({ summaryBefore: before, summaryAfter: after, taskStatus: "completed", eventTypes: ["task_assigned"] });
    expect(noEvent.ok).toBe(false);
    expect(noEvent.problems.join(" ")).toContain("missing task_completed");
  });
});
