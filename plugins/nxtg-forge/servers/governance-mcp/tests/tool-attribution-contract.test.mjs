// Contract test — health-tool attribution (DIRECTIVE-NXTG-20260718-05, Codex Wave-1 gate,
// hardened after Codex re-gate round 2).
//
// Ground truth (runtime-verified below):
//   - governance-mcp (Node, ships with plugin, L1+L2) exposes `forge_get_governance_health`.
//   - forge-orchestrator (Rust, needs the `forge` binary, L2) exposes `forge_get_health`.
//   These are DISTINCT names — there is no `forge_get_health` on the Node server, hence no runtime
//   collision. Any user-facing doc that presents `forge_get_health` as a governance-mcp / Node / L1
//   tool is a MISATTRIBUTION (a follower reaches the Rust tool at L2 or an unknown tool at L1).
//
// Classifier design (v2, hardened): the previous ±5-line-block classifier had a false negative —
// a block with BOTH Node and orchestrator signals was resolved as orchestrator, so an explicit
// Node/L1 sentence could hide behind a nearby "orchestrator" word (Codex round-2 mutation, pinned
// as a negative fixture below). This version resolves attribution at the LINE (sentence / table-row)
// level of each occurrence, breaks a mixed line by the signal NEAREST the token, and only falls back
// to the block when the line is neutral — rejecting an ambiguous (Node+orch) block rather than
// silently trusting it.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { TOOLS } from "../index.mjs";

const REPO_ROOT = join(import.meta.dirname, "../../../../../"); // -> forge-plugin/

const NODE_HEALTH = "forge_get_governance_health";
const ORCH_HEALTH = "forge_get_health";

// Tools exposed ONLY by the governance-mcp (Node) server.
const NODE_EXCLUSIVE = [
  "forge_get_governance_health",
  "forge_get_governance_state",
  "forge_get_code_metrics",
  "forge_security_scan",
  "forge_open_dashboard",
  "forge_list_checkpoints",
  "forge_run_tests",
  "forge_get_git_status",
];
// Tools exposed ONLY by the orchestrator (Rust) server. (Source: forge-orchestrator/src/mcp/tools.rs.)
const ORCH_EXCLUSIVE = [
  "forge_get_tasks",
  "forge_claim_task",
  "forge_complete_task",
  "forge_get_state",
  "forge_get_plan",
  "forge_capture_knowledge",
  "forge_get_knowledge",
  "forge_check_drift",
  "forge_set_project",
  "forge_get_events",
];
const ORCH_KEYWORDS = /orchestrator|\bRust\b|\bL2\b|\bL3\b|forge binary|forge mcp/gi;
const NODE_KEYWORDS =
  /governance-mcp|governance server|governance mcp|\(Node\b|\bNode\)|\bNode\b|\bL1\b|always[- ]available|MCP governance server/gi;

// Bare `forge_get_health` — not `forge_get_health_score`, and not the substring of
// `forge_get_governance_health` (which does not contain `forge_get_health`).
const BARE_HEALTH = /forge_get_health(?![_a-zA-Z])/g;

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

// All start-indices of any Node-attribution signal in `text`.
function nodeSignalPositions(text) {
  const pos = [];
  for (const tool of NODE_EXCLUSIVE) {
    let i = text.indexOf(tool);
    while (i !== -1) {
      pos.push(i);
      i = text.indexOf(tool, i + 1);
    }
  }
  for (const m of text.matchAll(NODE_KEYWORDS)) pos.push(m.index);
  return pos;
}
function orchSignalPositions(text) {
  const pos = [];
  for (const tool of ORCH_EXCLUSIVE) {
    let i = text.indexOf(tool);
    while (i !== -1) {
      pos.push(i);
      i = text.indexOf(tool, i + 1);
    }
  }
  for (const m of text.matchAll(ORCH_KEYWORDS)) pos.push(m.index);
  return pos;
}
const nearest = (positions, from) =>
  positions.length ? Math.min(...positions.map((p) => Math.abs(p - from))) : Infinity;

// Classify ONE bare-`forge_get_health` occurrence at char `col` on `line`, with `lines`/`idx` for
// block fallback. Returns "orchestrator" | "node" | "ambiguous" | "neutral".
// "node" and "ambiguous" are FAILURES (misattribution or unresolved attribution).
function classifyOccurrence(line, col, lines, idx) {
  // 1. Resolve at the line (sentence / table-row) level first.
  const nodePos = nodeSignalPositions(line);
  const orchPos = orchSignalPositions(line);
  const lineHasNode = nodePos.length > 0;
  const lineHasOrch = orchPos.length > 0;

  if (lineHasNode && !lineHasOrch) return "node"; // explicit Node attribution on the line
  if (lineHasOrch && !lineHasNode) return "orchestrator";
  if (lineHasNode && lineHasOrch) {
    // Mixed line — resolve by the signal NEAREST the token; equidistant => ambiguous (reject).
    const dNode = nearest(nodePos, col);
    const dOrch = nearest(orchPos, col);
    if (dOrch < dNode) return "orchestrator";
    if (dNode < dOrch) return "node";
    return "ambiguous";
  }

  // 2. Line is neutral — fall back to the ±5-line block, but REJECT an ambiguous block.
  const block = lines.slice(Math.max(0, idx - 5), idx + 6).join("\n");
  const blockNode = nodeSignalPositions(block).length > 0;
  const blockOrch = orchSignalPositions(block).length > 0;
  if (blockNode && blockOrch) return "ambiguous"; // <-- the Codex-round-2 hole, now fail-closed
  if (blockNode) return "node";
  if (blockOrch) return "orchestrator";
  return "neutral";
}

// Scan a document's text; return every bare-forge_get_health occurrence with its verdict.
function classifyDocument(content) {
  const lines = content.split("\n");
  const results = [];
  lines.forEach((line, idx) => {
    for (const m of line.matchAll(BARE_HEALTH)) {
      results.push({ lineNo: idx + 1, verdict: classifyOccurrence(line, m.index, lines, idx), line });
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

  it("no user-facing doc attributes forge_get_health to governance-mcp / Node / L1", () => {
    const files = walkMarkdown(REPO_ROOT);
    expect(files.length).toBeGreaterThan(10); // guard a broken REPO_ROOT

    const bad = [];
    for (const file of files) {
      for (const r of classifyDocument(readFileSync(file, "utf8"))) {
        if (FAIL_VERDICTS.has(r.verdict)) {
          bad.push(`${file.replace(REPO_ROOT, "")}:${r.lineNo} [${r.verdict}]: ${r.line.trim()}`);
        }
      }
    }
    expect(
      bad,
      `Misattributed / ambiguous forge_get_health (Node/L1 context must use ${NODE_HEALTH}):\n` +
        bad.join("\n"),
    ).toEqual([]);
  });

  // Negative fixture — Codex re-gate round 2, §1. Pinned VERBATIM. This exact text passed the
  // previous (block-level) classifier 2/2 while assigning the orchestrator-only tool to Node/L1;
  // the "orchestrator" word one line up suppressed detection. The hardened classifier MUST flag it.
  it("flags the Codex round-2 mutation (orchestrator-keyword-override false negative)", () => {
    const CODEX_MUTATION = [
      "# L1 Governance Health",
      "The Node governance-mcp is always available at L1.",
      "Unlike the optional orchestrator, it requires no Forge binary.",
      "Call `forge_get_health` for the Node governance score.",
    ].join("\n");

    const verdicts = classifyDocument(CODEX_MUTATION);
    expect(verdicts.length).toBe(1); // exactly one bare forge_get_health
    expect(FAIL_VERDICTS.has(verdicts[0].verdict)).toBe(true); // must be flagged (node/ambiguous)
    expect(verdicts[0].verdict).toBe("node"); // resolved at the line level: explicit Node attribution
  });

  // Positive control — a correct, explicitly-orchestrator reference must NOT be flagged, even when
  // the disambiguating Node tool name shares the same line.
  it("does NOT flag correct orchestrator references (no false positives)", () => {
    const GOOD = [
      "The orchestrator (Rust) exposes `forge_get_health`; the plugin exposes `forge_get_governance_health`.",
      "| `forge_get_health` | Orchestrator | 5-dimension health + drift (L2) |",
      "- `forge_get_health` / `forge_check_drift` (orchestrator-mcp, Rust)",
    ].join("\n");
    const verdicts = classifyDocument(GOOD);
    expect(verdicts.length).toBe(3);
    for (const v of verdicts) expect(v.verdict).toBe("orchestrator");
  });
});
