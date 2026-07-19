// Shared, PURE check functions for the L1 integration harness (DIRECTIVE-NXTG-20260718-10).
// These are invoked for real by tests/integration/l1-journey.mjs AND fed synthetic bad input by the
// negative-control tests (version-surface.test.mjs / l1-checks.test.mjs). The tested logic IS the
// shipped logic — no parallel reimplementation (that divergence is a classic gate finding).

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
