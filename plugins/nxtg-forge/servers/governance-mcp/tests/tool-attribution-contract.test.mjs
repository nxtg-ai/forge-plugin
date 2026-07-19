// Contract test — health-tool attribution (DIRECTIVE-NXTG-20260718-05, Codex Wave-1 gate).
//
// Ground truth (runtime-verified below):
//   - governance-mcp (Node, ships with plugin, L1+L2) exposes `forge_get_governance_health`.
//   - forge-orchestrator (Rust, needs the `forge` binary, L2) exposes `forge_get_health`.
//   These are DISTINCT names — there is no `forge_get_health` on the Node server, and thus no
//   runtime collision. Any user-facing doc that presents `forge_get_health` as a governance-mcp /
//   Node / L1 tool is a MISATTRIBUTION: a follower reaches the Rust tool at L2 or an unknown tool
//   at L1. This test classifies every `forge_get_health` reference in the repo by server/level and
//   fails on misattribution.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { TOOLS } from "../index.mjs";

const REPO_ROOT = join(import.meta.dirname, "../../../../../"); // -> forge-plugin/

// --- Ground-truth tool sets -------------------------------------------------
const NODE_HEALTH = "forge_get_governance_health";
const ORCH_HEALTH = "forge_get_health";

// Tools exposed by ONLY the governance-mcp (Node) server. Co-location of a bare
// `forge_get_health` with any of these (and no orchestrator signal) marks a Node-tool listing.
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

// Tools exposed by ONLY the orchestrator (Rust) server. Co-location marks an orchestrator context.
// (Source of truth: forge-orchestrator/src/mcp/tools.rs.)
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

const ORCH_KEYWORDS = /orchestrator|\bRust\b|\bL2\b|\bL3\b|forge binary|forge mcp/i;
const NODE_KEYWORDS =
  /governance-mcp|governance server|governance mcp|\(Node\b|\bNode\)|\bL1\b|always[- ]available|MCP governance server/i;

// Match a BARE `forge_get_health` — not `forge_get_health_score`, and not part of
// `forge_get_governance_health` (which does not contain the substring `forge_get_health`).
const BARE_HEALTH = /forge_get_health(?![_a-zA-Z])/;

// Files excluded from the doc scan: node_modules, VCS, governance side-cars, and the CHANGELOG
// (which documents this very rename in prose and legitimately co-locates "Node" + "forge_get_health").
const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".asif"]);
const EXCLUDE_FILES = new Set(["CHANGELOG.md"]);

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

// Classify one bare `forge_get_health` occurrence by its ±5-line block.
// Returns "orchestrator" | "node" | "neutral".
function classify(lines, idx) {
  const block = lines.slice(Math.max(0, idx - 5), idx + 6).join("\n");
  const hasOrch = ORCH_EXCLUSIVE.some((t) => block.includes(t)) || ORCH_KEYWORDS.test(block);
  const hasNode = NODE_EXCLUSIVE.some((t) => block.includes(t)) || NODE_KEYWORDS.test(block);
  if (hasNode && !hasOrch) return "node"; // Node/L1 context, no orchestrator signal -> misattribution
  if (hasOrch) return "orchestrator";
  return "neutral";
}

describe("health-tool attribution contract", () => {
  it("governance-mcp exposes forge_get_governance_health and NOT forge_get_health (runtime)", () => {
    const names = TOOLS.map((t) => t.name);
    expect(names).toContain(NODE_HEALTH);
    expect(names).not.toContain(ORCH_HEALTH);
  });

  it("no user-facing doc attributes forge_get_health to governance-mcp / Node / L1", () => {
    const files = walkMarkdown(REPO_ROOT);
    // Sanity: the scan actually found docs (guards against a broken REPO_ROOT).
    expect(files.length).toBeGreaterThan(10);

    const misattributions = [];
    for (const file of files) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, idx) => {
        if (!BARE_HEALTH.test(line)) return;
        if (classify(lines, idx) === "node") {
          misattributions.push(`${file.replace(REPO_ROOT, "")}:${idx + 1}: ${line.trim()}`);
        }
      });
    }

    expect(
      misattributions,
      `Misattributed forge_get_health (should be ${NODE_HEALTH} in Node/L1 context):\n` +
        misattributions.join("\n"),
    ).toEqual([]);
  });
});
