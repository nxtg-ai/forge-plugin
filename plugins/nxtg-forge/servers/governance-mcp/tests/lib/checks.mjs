// Shared, PURE check functions for the L1 integration harness (DIRECTIVE-NXTG-20260718-10).
// These are invoked for real by tests/integration/l1-journey.mjs AND fed synthetic bad input by the
// negative-control tests (version-surface.test.mjs / l1-checks.test.mjs). The tested logic IS the
// shipped logic — no parallel reimplementation (that divergence is a classic gate finding).

import { realpathSync as _realpathSync } from "node:fs";
import { resolve as _resolve } from "node:path";

// The 8 Node governance-mcp tools (L1). Source of truth: index.mjs TOOLS.
export const NODE_TOOLS = [
  "forge_get_governance_health",
  "forge_get_governance_state",
  "forge_get_git_status",
  "forge_get_code_metrics",
  "forge_run_tests",
  "forge_list_checkpoints",
  "forge_security_scan",
  "forge_open_dashboard",
];

// Any-of expected top-level keys per tool (shape probe, not value assertion).
export const TOOL_KEYS = {
  forge_get_governance_health: ["score", "grade", "checks"],
  forge_get_governance_state: ["initialized", "project", "version"],
  forge_get_git_status: ["branch", "clean", "commits", "modified"],
  forge_get_code_metrics: ["sourceFiles", "testFiles", "totalLines", "files", "dependencies"],
  forge_run_tests: ["runner"],
  forge_list_checkpoints: ["checkpoints", "count", "message"],
  forge_security_scan: ["findings"],
  forge_open_dashboard: ["path", "projectName"],
};

// Orchestrator-surface tokens that must NEVER appear in an L1 (Node-only) tool response — the word
// "orchestrator" and every orchestrator-mcp tool name (incl. the L2 `forge_get_health`).
const ORCH_REF =
  /\borchestrator\b|forge_get_tasks|forge_claim_task|forge_complete_task|forge_get_state|forge_get_plan|forge_check_drift|forge_capture_knowledge|forge_get_knowledge|forge_set_project|forge_get_events|forge_get_health(?![_a-zA-Z])/i;

// ── L2 (Pro Builder journey) surface — DIRECTIVE-NXTG-20260718-11 ──
// The 11 orchestrator-mcp tools shipped by the Rust `forge mcp` server. Source of truth: the LIVE
// v1.5.2 handshake (probed 2026-07-18). The live L2 leg asserts the handshake set == this list AND
// reports any delta as a finding (never "fixes" orchestrator surfaces from the plugin repo — the
// directive's escalation clause). This list is also the expected input for the missing-Rust-tool
// negative control.
export const ORCH_TOOLS = [
  "forge_get_tasks",
  "forge_claim_task",
  "forge_complete_task",
  "forge_get_state",
  "forge_get_plan",
  "forge_capture_knowledge",
  "forge_get_knowledge",
  "forge_check_drift",
  "forge_get_health",
  "forge_get_events",
  "forge_set_project",
];

// The pinned orchestrator binary version the L2 harness requires (fixture dep, not a package dep).
export const FORGE_PIN = "1.5.2";

// `forge --version` string matches the pin? actual = parsed version (e.g. "1.5.2") or null if absent.
// Returns { ok, reason } — named findings FORGE_ABSENT / WRONG_BINARY_VERSION for deterministic fail.
export function checkBinaryVersion(actual, expected = FORGE_PIN) {
  if (actual == null || actual === "") return { ok: false, reason: `FORGE_ABSENT (expected ${expected})` };
  if (actual !== expected) return { ok: false, reason: `WRONG_BINARY_VERSION got ${actual} expected ${expected}` };
  return { ok: true, reason: "ok" };
}

// The same fixture identity is bound on BOTH servers? nodeName = Node forge_get_governance_state
// .project.name; rustName = Rust forge_get_state.project_name. Guards the FORGE_PROJECT_ROOT-not-reached
// false-pass (a server bound to the wrong dir returns shaped data with a DIFFERENT identity).
// Returns { ok, reason }.
export function checkIdentityMatch(nodeName, rustName, expected) {
  const problems = [];
  if (nodeName !== expected) problems.push(`node identity ${nodeName} != ${expected}`);
  if (rustName !== expected) problems.push(`rust identity ${rustName} != ${expected}`);
  if (nodeName !== rustName) problems.push(`cross-server identity mismatch node=${nodeName} rust=${rustName}`);
  return { ok: problems.length === 0, reason: problems.join("; ") || "ok" };
}

// The task lifecycle actually mutated durable state (value-proof, not tool-message shape)? Inputs:
//   summaryBefore/summaryAfter = .forge/state.json task_summary {pending,completed,...} snapshots
//   taskStatus                 = .forge/tasks/<id>.json "status" after complete
//   appendedEvents             = the events.jsonl records APPENDED between the before/after snapshots,
//                                each { event_type, task_id } (NOT the whole file — pre-existing events
//                                from `forge init`/`plan --generate` must not satisfy this check)
//   taskId                     = the task the lifecycle acted on (default "T-001")
// Asserts state.json transitioned (completed↑, pending↓), the task file flipped to completed, and BOTH
// a NEW task_assigned and a NEW task_completed record SCOPED TO taskId were appended. Requiring the
// events to be (a) newly appended and (b) task-scoped closes the false-green where unscoped, pre-existing
// event types would pass a regression that stopped appending lifecycle events. Returns { ok, problems[] }.
export function checkLifecycle({ summaryBefore, summaryAfter, taskStatus, appendedEvents, taskId = "T-001" }) {
  const problems = [];
  if (!summaryBefore || !summaryAfter) {
    problems.push("missing task_summary snapshot");
  } else {
    const bc = summaryBefore.completed ?? 0, ac = summaryAfter.completed ?? 0;
    const bp = summaryBefore.pending ?? 0, ap = summaryAfter.pending ?? 0;
    if (!(ac > bc)) problems.push(`state.json task_summary.completed did not increase (${bc}->${ac})`);
    if (!(ap < bp)) problems.push(`state.json task_summary.pending did not decrease (${bp}->${ap})`);
  }
  if (taskStatus !== "completed") problems.push(`tasks/<id>.json status != completed (got ${taskStatus})`);
  const appended = Array.isArray(appendedEvents) ? appendedEvents : null;
  if (appended == null) {
    problems.push("missing appendedEvents snapshot");
  } else {
    const hasNew = (type) => appended.some((e) => e && e.event_type === type && e.task_id === taskId);
    if (!hasNew("task_assigned")) problems.push(`no newly-appended task_assigned event scoped to ${taskId}`);
    if (!hasNew("task_completed")) problems.push(`no newly-appended task_completed event scoped to ${taskId}`);
  }
  return { ok: problems.length === 0, problems };
}

// ── L3 (Ship Lord journey) — forge-ui ⟂ orchestrator contract surfaces — DIRECTIVE-NXTG-20260718-13 ──
// UI health matches the orchestrator health per the dx-journeys contract (docs line ~170-172)? Rust
// forge_get_health.health_score is a FLOAT; forge-ui serves data.health.score as a ROUNDED INT and
// labels data.health.source. The contract holds iff the UI sourced from the orchestrator AND its
// rounded score equals Math.round(rust). A non-orchestrator source (independent/estimate computation)
// or a score mismatch is the named finding UI_HEALTH_CONTRACT_DRIFT. Returns { ok, reason }.
export function checkHealthContract(uiScore, uiSource, rustScore) {
  if (typeof rustScore !== "number") return { ok: false, reason: `no rust health_score to compare (got ${rustScore})` };
  if (typeof uiScore !== "number") return { ok: false, reason: `UI_HEALTH_CONTRACT_DRIFT: ui health.score not a number (${uiScore})` };
  if (uiSource !== "orchestrator") return { ok: false, reason: `UI_HEALTH_CONTRACT_DRIFT: ui health.source="${uiSource}" (not "orchestrator" → independent/estimate computation)` };
  const expected = Math.round(rustScore);
  if (uiScore !== expected) return { ok: false, reason: `UI_HEALTH_CONTRACT_DRIFT: ui=${uiScore} != Math.round(rust ${rustScore})=${expected}` };
  return { ok: true, reason: "ok" };
}

// Two filesystem paths refer to the same location? Compares real paths (symlink-resolved) when both
// exist, else normalized-absolute paths. EQUALITY, not containment — so a prefix-sharing SIBLING
// (…-abc-stale vs …-abc) does NOT match (regate-13 C2). Pure enough for the seeded controls.
export function samePath(a, b) {
  if (!a || !b) return false;
  const norm = (p) => { try { return _realpathSync(p); } catch { return _resolve(p); } };
  return norm(a) === norm(b);
}

// forge-ui binds the fixture's CANONICAL identity? uiName = data.project.name; uiPath = data.project.path;
// canonicalName = .forge/state.json project_name; fixture = the temp dir the harness owns. A drift here
// is the named finding UI_IDENTITY_DRIFT (forge-ui e8c011f made this bind canonically). The path check is
// EQUALITY of normalized/real paths, not containment — a stale sibling dir must not pass. Returns { ok, reason }.
export function checkUiIdentity(uiName, uiPath, canonicalName, fixture) {
  const problems = [];
  if (uiName !== canonicalName) problems.push(`UI_IDENTITY_DRIFT: data.project.name="${uiName}" != canonical "${canonicalName}"`);
  if (!samePath(uiPath, fixture)) problems.push(`data.project.path="${uiPath}" != fixture "${fixture}" (not the same location)`);
  return { ok: problems.length === 0, reason: problems.join("; ") || "ok" };
}

// forge-ui round-tripped the ENTIRE governance.json contract, not just identity? `parsed` = the Node
// forge_get_governance_state result; `expected` = the seeded sentinels. Asserts EVERY field the contract
// doc (docs/governance-mcp-governance-json-contract.md) names survives forge-ui's {constitution} migration:
// version, project{name,vision,goals}, workstreams (COUNT — tools.mjs returns .length), qualityGates,
// metrics. Deleting/emptying any of them (the Codex regate-15 attack) fails here. Returns { ok, problems[] }.
export function checkGovernanceContract(parsed, expected) {
  const problems = [];
  if (!parsed || typeof parsed !== "object") return { ok: false, problems: ["no governance_state parsed"] };
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (parsed.version !== expected.version) problems.push(`version: ${parsed.version} != ${expected.version}`);
  if (parsed.project?.name !== expected.project.name) problems.push(`project.name: ${parsed.project?.name} != ${expected.project.name}`);
  if (parsed.project?.vision !== expected.project.vision) problems.push(`project.vision: ${parsed.project?.vision} != ${expected.project.vision}`);
  if (!eq(parsed.project?.goals, expected.project.goals)) problems.push(`project.goals: ${JSON.stringify(parsed.project?.goals)} != ${JSON.stringify(expected.project.goals)}`);
  if (parsed.workstreams !== expected.workstreamsCount) problems.push(`workstreams count: ${parsed.workstreams} != ${expected.workstreamsCount}`);
  if (!eq(parsed.qualityGates, expected.qualityGates)) problems.push(`qualityGates: ${JSON.stringify(parsed.qualityGates)} != ${JSON.stringify(expected.qualityGates)}`);
  if (!eq(parsed.metrics, expected.metrics)) problems.push(`metrics: ${JSON.stringify(parsed.metrics)} != ${JSON.stringify(expected.metrics)}`);
  return { ok: problems.length === 0, problems };
}

// A live WS round-trip happened AND its payload bound to the fixture? events = the WS message `type`s
// observed; fixtureBound = whether the state.update payload carried the fixture identity. Requires a
// state.update (server→client on connect) and a pong (client ping → server pong). Returns { ok, reason }.
export function checkWsRoundtrip({ events, fixtureBound }) {
  const problems = [];
  const set = new Set(events || []);
  if (!set.has("state.update")) problems.push("no state.update received on connect");
  if (!set.has("pong")) problems.push("no pong (ping round-trip failed)");
  if (!fixtureBound) problems.push("state.update payload did not bind to the fixture identity");
  return { ok: problems.length === 0, reason: problems.join("; ") || "ok" };
}

// All version surfaces agree? map = { label: versionString }. Returns { ok, version, problems[] }.
export function checkVersionsAgree(map) {
  const entries = Object.entries(map);
  const problems = [];
  const ref = entries.length ? entries[0][1] : null;
  for (const [label, v] of entries) {
    if (v == null) problems.push(`${label} is missing`);
    else if (v !== ref) problems.push(`${label}=${v} != ${ref}`);
  }
  return { ok: problems.length === 0, version: ref, problems };
}

// Advertised tool set matches exactly? Returns { ok, missing[], extra[] }.
export function checkToolSet(actual, expected = NODE_TOOLS) {
  const a = new Set(actual);
  const e = new Set(expected);
  const missing = expected.filter((t) => !a.has(t));
  const extra = actual.filter((t) => !e.has(t));
  return { ok: missing.length === 0 && extra.length === 0, missing, extra };
}

// No L1 response references the orchestrator surface? responses = [{ tool, text }].
// Returns { ok, offenders[] } where offenders name the tools whose text leaked an orch reference.
export function checkNoOrchestratorRef(responses) {
  const offenders = responses.filter((r) => ORCH_REF.test(r.text || "")).map((r) => r.tool);
  return { ok: offenders.length === 0, offenders };
}

// An MCP tools/call result is a shaped, non-error, JSON-object response with >=1 expected key?
// Accepts either structuredContent or a JSON text content block. Returns { ok, reason, parsed }.
export function checkShapedResponse(tool, result, expectedKeys = TOOL_KEYS[tool] || []) {
  if (!result) return { ok: false, reason: "null result" };
  if (result.isError) return { ok: false, reason: "isError=true" };

  let parsed = result.structuredContent ?? null;
  if (parsed == null) {
    const content = result.content;
    if (!Array.isArray(content) || content.length === 0) return { ok: false, reason: "no content" };
    const textItem = content.find((c) => c && c.type === "text" && typeof c.text === "string");
    if (!textItem) return { ok: false, reason: "no text content block" };
    try {
      parsed = JSON.parse(textItem.text);
    } catch {
      return { ok: false, reason: "content text is not JSON" };
    }
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "parsed body is not a JSON object" };
  }
  if (expectedKeys.length && !expectedKeys.some((k) => k in parsed)) {
    return { ok: false, reason: `none of expected keys present: ${expectedKeys.join(", ")}` };
  }
  return { ok: true, reason: "ok", parsed };
}
