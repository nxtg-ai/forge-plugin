// Contract test — health-tool attribution (DIRECTIVE-NXTG-20260718-05, Codex Wave-1 gate).
// Hardened across three Codex re-gate rounds:
//   r1: user-facing docs named the removed Node tool `forge_get_health` (fixed) + runtime assert.
//   r2: block-level classifier let a Node/L1 sentence hide behind a nearby "orchestrator" word
//       -> resolve at LINE level, reject ambiguous blocks (fail-closed).
//   r3: nearest-signal conflated OWNERSHIP with AVAILABILITY — "At L1, use the orchestrator tool
//       forge_get_health" passed because the orchestrator (ownership) token was nearest, masking an
//       impossible L1-availability claim.
//
// GROUND TRUTH (runtime-verified below): `forge_get_health` is OWNED by the orchestrator (Rust) and
// AVAILABLE only at L2 (needs the `forge` binary). `forge_get_governance_health` is the Node tool
// (L1+L2). The two are DISTINCT names — no runtime collision.
//
// Attribution is modelled on TWO INDEPENDENT AXES, each resolved per-occurrence by binding signals
// to the nearest tool token:
//   * OWNERSHIP:    orchestrator (correct) vs Node (VIOLATION for forge_get_health)
//   * AVAILABILITY: L2 (correct)          vs L1 (VIOLATION for forge_get_health)
// A forge_get_health occurrence FAILS if EITHER a Node-ownership OR an L1-availability signal binds
// to it — a correct ownership token never rescues an availability violation, and vice-versa.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { TOOLS } from "../index.mjs";

const REPO_ROOT = join(import.meta.dirname, "../../../../../"); // -> forge-plugin/
const NODE_HEALTH = "forge_get_governance_health";
const ORCH_HEALTH = "forge_get_health";

// Tool-name context used ONLY for the neutral-line block fallback (a table/list of one server's
// tools implies that server). Not used for per-occurrence axis binding.
const NODE_EXCLUSIVE = [
  "forge_get_governance_health", "forge_get_governance_state", "forge_get_code_metrics",
  "forge_security_scan", "forge_open_dashboard", "forge_list_checkpoints", "forge_run_tests",
  "forge_get_git_status",
];
const ORCH_EXCLUSIVE = [
  "forge_get_tasks", "forge_claim_task", "forge_complete_task", "forge_get_state", "forge_get_plan",
  "forge_capture_knowledge", "forge_get_knowledge", "forge_check_drift", "forge_set_project",
  "forge_get_events",
];

// Axis signals (keywords). axis: "own"|"avail"; value: "orch"|"node"|"l2"|"l1".
const SIGNAL_DEFS = [
  { re: /orchestrator|\bRust\b/gi, axis: "own", value: "orch" },
  { re: /governance-mcp|governance server|governance mcp|MCP governance server|\bNode\b/gi, axis: "own", value: "node" },
  { re: /\bL2\b|\bL3\b|(?:requires|needs)\s+(?:the\s+)?forge\s+binary|the\s+forge\s+binary|forge\s+mcp/gi, axis: "avail", value: "l2" },
  { re: /\bL1\b|always[- ]available|out of the box|(?:requires no|without|no)\s+(?:forge\s+)?binary/gi, axis: "avail", value: "l1" },
];

const BARE_HEALTH = /forge_get_health(?![_a-zA-Z])/g; // not _score, not the substring of _governance_

const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".asif"]);
const EXCLUDE_FILES = new Set(["CHANGELOG.md"]); // documents this rename in prose

function walkMarkdown(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkMarkdown(full, acc);
    else if (entry.endsWith(".md") && !EXCLUDE_FILES.has(entry)) acc.push(full);
  }
  return acc;
}

// All positions of a fixed substring in text.
function indexAll(text, needle) {
  const out = [];
  let i = text.indexOf(needle);
  while (i !== -1) { out.push(i); i = text.indexOf(needle, i + 1); }
  return out;
}

// Collect axis signals on a line. OWNERSHIP signals include server keywords AND server-exclusive
// tool NAMES (a tool name attributes its own server). AVAILABILITY signals are level keywords only.
function collectSignals(line) {
  const sig = [];
  for (const def of SIGNAL_DEFS) {
    for (const m of line.matchAll(def.re)) sig.push({ pos: m.index, axis: def.axis, value: def.value });
  }
  for (const t of ORCH_EXCLUSIVE) for (const p of indexAll(line, t)) sig.push({ pos: p, axis: "own", value: "orch" });
  for (const t of NODE_EXCLUSIVE) for (const p of indexAll(line, t)) sig.push({ pos: p, axis: "own", value: "node" });
  return sig;
}

// The value of the signal (of a given axis) NEAREST to the forge_get_health token [ts,te].
// Returns the nearest signal's value, or null if none. Equidistant opposite values -> "ambiguous".
function nearestAxis(signals, axis, ts, te) {
  let bestDist = Infinity, bestVal = null, tie = false;
  for (const s of signals) {
    if (s.axis !== axis) continue;
    const d = s.pos >= ts && s.pos <= te ? 0 : Math.min(Math.abs(s.pos - ts), Math.abs(s.pos - te));
    if (d < bestDist) { bestDist = d; bestVal = s.value; tie = false; }
    else if (d === bestDist && s.value !== bestVal) tie = true;
  }
  return tie ? "ambiguous" : bestVal;
}

// Classify one bare forge_get_health occurrence on the two independent axes.
//   "orchestrator" (OK) | "node" (FAIL: Node ownership or L1 availability) | "ambiguous" (FAIL) | "neutral" (OK)
function classifyOccurrence(line, col, lines, idx) {
  const ts = col, te = col + "forge_get_health".length;
  const signals = collectSignals(line);
  const own = nearestAxis(signals, "own", ts, te);      // "orch" | "node" | "ambiguous" | null
  const avail = nearestAxis(signals, "avail", ts, te);  // "l2"  | "l1"   | "ambiguous" | null

  // A violation on EITHER axis fails, independent of the other (round-3): forge_get_health is
  // orchestrator-owned and L2-only, so Node-ownership OR L1-availability is impossible.
  if (own === "node" || avail === "l1") return "node";
  if (own === "ambiguous" || avail === "ambiguous") return "ambiguous";
  if (own === "orch" || avail === "l2") return "orchestrator";

  // No axis signal on the line -> fall back to the +/-5-line block; reject an ambiguous block.
  const block = lines.slice(Math.max(0, idx - 5), idx + 6).join("\n");
  const blockNode =
    /governance-mcp|governance server|governance mcp|MCP governance server|\bNode\b|\bL1\b|always[- ]available/i.test(block) ||
    NODE_EXCLUSIVE.some((t) => block.includes(t));
  const blockOrch =
    /orchestrator|\bRust\b|\bL2\b|\bL3\b|forge binary|forge mcp/i.test(block) ||
    ORCH_EXCLUSIVE.some((t) => block.includes(t));
  if (blockNode && blockOrch) return "ambiguous";
  if (blockNode) return "node";
  if (blockOrch) return "orchestrator";
  return "neutral";
}

function classifyDocument(content) {
  const rawLines = content.split("\n");
  // Normalize markdown code-span backticks to spaces (length-preserving, so char positions stay
  // aligned) so that `forge` binary / `forge_get_health` are seen as plain words by the scanners.
  const scanLines = rawLines.map((l) => l.replace(/`/g, " "));
  const results = [];
  scanLines.forEach((line, idx) => {
    for (const m of line.matchAll(BARE_HEALTH)) {
      results.push({ lineNo: idx + 1, verdict: classifyOccurrence(line, m.index, scanLines, idx), line: rawLines[idx] });
    }
  });
  return results;
}

const FAIL_VERDICTS = new Set(["node", "ambiguous"]);

describe("health-tool attribution contract", () => {
  it("governance-mcp exposes forge_get_governance_health and NOT forge_get_health (runtime)", () => {
    const names = TOOLS.map((t) => t.name);
    expect(names).toContain(NODE_HEALTH);
    expect(names).not.toContain(ORCH_HEALTH);
  });

  it("no user-facing doc misattributes forge_get_health (Node ownership OR L1 availability)", () => {
    const files = walkMarkdown(REPO_ROOT);
    expect(files.length).toBeGreaterThan(10);
    const bad = [];
    for (const file of files) {
      for (const r of classifyDocument(readFileSync(file, "utf8"))) {
        if (FAIL_VERDICTS.has(r.verdict)) bad.push(`${file.replace(REPO_ROOT, "")}:${r.lineNo} [${r.verdict}]: ${r.line.trim()}`);
      }
    }
    expect(bad, `Misattributed forge_get_health:\n${bad.join("\n")}`).toEqual([]);
  });

  // Negative fixture — Codex re-gate ROUND 2 §1 (block-ambiguity false negative). Pinned VERBATIM.
  it("flags the Codex round-2 mutation (orchestrator-keyword-override)", () => {
    const M = [
      "# L1 Governance Health",
      "The Node governance-mcp is always available at L1.",
      "Unlike the optional orchestrator, it requires no Forge binary.",
      "Call `forge_get_health` for the Node governance score.",
    ].join("\n");
    const v = classifyDocument(M);
    expect(v.length).toBe(1);
    expect(v[0].verdict).toBe("node");
  });

  // Negative fixture — Codex re-gate ROUND 3 §1 (ownership-vs-availability conflation). Pinned VERBATIM.
  // Ownership (orchestrator) is correct, but the L1-availability claim is impossible; must FAIL.
  it("flags the Codex round-3 input (L1 availability despite correct ownership)", () => {
    const M = [
      "# L1 Governance Health",
      "At L1, use the orchestrator tool `forge_get_health`.",
    ].join("\n");
    const v = classifyDocument(M);
    expect(v.length).toBe(1);
    expect(FAIL_VERDICTS.has(v[0].verdict)).toBe(true);
    expect(v[0].verdict).toBe("node"); // L1-availability violation on the availability axis
  });

  // Positive control — correct orchestrator/L2 references must NOT flag, including a mixed line where
  // the L1 token legitimately binds to the *other* tool (the L1 fallback), not to forge_get_health.
  it("does NOT flag correct references (no false positives)", () => {
    const GOOD = [
      "The orchestrator (Rust) exposes `forge_get_health` at L2; the plugin's `forge_get_governance_health` is the L1 tool.",
      "| `forge_get_health` | Orchestrator | 5-dimension health + drift (L2) |",
      "- `forge_get_health` / `forge_check_drift` (orchestrator-mcp, Rust)",
      "Orchestrator health (from `forge_get_health` — Rust/L2; the Node `forge_get_governance_health` is the L1 fallback)",
    ].join("\n");
    for (const r of classifyDocument(GOOD)) expect(r.verdict).not.toBe("node");
  });

  // Adversarial neighbor matrix — pinned. Codex attacks the nearest adjacent invariant each round;
  // these probe BOTH axes (ownership ⟂ availability), the masking case (correct owner + bad
  // availability), phrasing variants of each violation, and the legitimate "signal binds to the
  // OTHER tool" case. A future round-N attack should extend this table, not rediscover a gap.
  const MATRIX = [
    // ── availability-axis violations (L1 is impossible for forge_get_health) ──
    ["forge_get_health is always available.", true, "avail: always-available synonym"],
    ["Use `forge_get_health` out of the box.", true, "avail: out-of-the-box synonym"],
    ["`forge_get_health` requires no forge binary.", true, "avail: no-binary synonym"],
    ["At L1, use the orchestrator tool `forge_get_health`.", true, "MASK: correct owner + L1 (round-3)"],
    ["The orchestrator's `forge_get_health` works with no binary at L1.", true, "MASK: owner ok, two L1 cues"],
    // ── ownership-axis violations (Node is impossible for forge_get_health) ──
    ["The governance-mcp `forge_get_health` score.", true, "own: governance-mcp"],
    ["Call `forge_get_health` for the Node governance score.", true, "own: Node (round-2)"],
    ["governance-mcp exposes `forge_get_health` at L1.", true, "both axes violated"],
    // ── correct references (must NOT flag) ──
    ["The orchestrator's `forge_get_health` (Rust).", false, "ok: orch owner"],
    ["`forge_get_health` at L2 needs the forge binary.", false, "ok: L2 availability"],
    ["Orchestrator tools: `forge_get_tasks`, `forge_get_health`, `forge_check_drift`.", false, "ok: orchestrator tool list"],
    ["`forge_get_health` (orchestrator, L2); `forge_get_governance_health` is the L1 tool.", false, "ok: L1 binds to the other tool"],
  ];
  it("adversarial neighbor matrix — each axis, masking, and phrasing variants", () => {
    for (const [text, shouldFail, label] of MATRIX) {
      const v = classifyDocument(text);
      expect(v.length, `${label}: expected exactly one occurrence`).toBe(1);
      expect(FAIL_VERDICTS.has(v[0].verdict), `${label}: got "${v[0].verdict}" for: ${text}`).toBe(shouldFail);
    }
  });
});
