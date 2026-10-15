/**
 * NXTG-Forge Governance MCP Server
 *
 * MCP server wiring only. All tool implementations live in tools.mjs.
 * Provides project governance tools for Claude Code via MCP protocol.
 *
 * No runtime dependencies (DIRECTIVE-NXTG-20261014-01): the stdio JSON-RPC loop below replaces the MCP
 * SDK, so the first launch after a plugin install needs no `npm install`. Claude Code (2.1.299) lists a
 * plugin MCP server as `pending`, with none of its tools, when it has not answered initialize within about
 * 1.5-2 s of launch; a first-run install of the SDK's 106 packages missed that on a cold npm cache. The
 * SDK stays a devDependency: tests/mcp-conformance.test.mjs drives this loop with the SDK's own client.
 */
import { createInterface } from "node:readline";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getGovernanceState,
  getGitStatus,
  getCodeMetrics,
  getHealthScore,
  getTestResults,
  listCheckpoints,
  getSecurityScan,
  generateDashboard,
  findApplicationRoot,
  serverVersion,
} from "./tools.mjs";

// Re-export all tool functions so tests can destructure from index.mjs
export {
  getGovernanceState,
  getGitStatus,
  getCodeMetrics,
  getHealthScore,
  getTestResults,
  listCheckpoints,
  getSecurityScan,
  generateDashboard,
  findApplicationRoot,
  serverVersion,
} from "./tools.mjs";

// ---------------------------------------------------------------------------
// Tool definitions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * MCP tool definitions for the forge-governance server.
 * Each entry describes one callable tool: its name, description, and JSON
 * Schema for its input parameters. Exported so test suites can assert on
 * the tool list without starting the server.
 *
 * @type {Array<{name: string, description: string, inputSchema: object}>}
 */
export const TOOLS = [
  {
    name: "forge_get_governance_health",
    description:
      "Get the project health score (0-100) with letter grade and detailed check results. Evaluates governance, git cleanliness, test coverage, documentation, type safety, file sizes, and security.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_get_governance_state",
    description:
      "Read the project's governance.json — project name, vision, goals, workstreams, quality gates, and session metrics.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_get_git_status",
    description:
      "Get git repository status: branch, commit count, last commit, modified/untracked/staged file counts, and top contributors.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_get_code_metrics",
    description:
      "Get code metrics: source file count, test file count, test coverage percentage, total lines, largest files, and dependency counts.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_run_tests",
    description:
      "Detect the test runner (vitest/jest/pytest) and run the test suite. Returns pass/fail counts and raw output. May take up to 60 seconds.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_list_checkpoints",
    description:
      "List all saved governance checkpoints with names and creation dates.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_security_scan",
    description:
      "Scan for security issues: hardcoded secrets, eval() usage, .env files in git, and npm audit vulnerabilities.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_open_dashboard",
    description:
      "Generate a beautiful HTML governance dashboard and open it in the browser. Shows health score, metrics, git status, security findings, and checkpoints. Returns the file path.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

// ---------------------------------------------------------------------------
// Tool dispatch (exported for testing — called by the request handler)
// ---------------------------------------------------------------------------

/**
 * Dispatch a tool call by name and return its result.
 * Exported so test suites can invoke tools directly without going through
 * the MCP request handler.
 *
 * @param {string} name - The tool name (must match a key in TOOLS).
 * @returns {Promise<object>} The tool's result object.
 * @throws {Error} If the tool name is not recognised.
 */
export async function dispatchToolCall(name) {
  switch (name) {
    case "forge_get_governance_health":        return getHealthScore();
    case "forge_get_governance_state": return getGovernanceState();
    case "forge_get_git_status":    return getGitStatus();
    case "forge_get_code_metrics":  return getCodeMetrics();
    case "forge_run_tests":         return getTestResults();
    case "forge_list_checkpoints":  return listCheckpoints();
    case "forge_security_scan":     return getSecurityScan();
    case "forge_open_dashboard":    return await generateDashboard();
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// MCP over stdio: newline-delimited JSON-RPC 2.0, the subset a tools-only server needs
// ---------------------------------------------------------------------------

/** Protocol versions this server speaks: the MCP SDK's SUPPORTED_PROTOCOL_VERSIONS (tools-only, identical across
 * them). tests/mcp-conformance.test.mjs fails when the SDK devDependency adds one, so this list is updated with it. */
export const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05", "2024-10-07"];
const SERVER_INFO = { name: "forge-governance", version: serverVersion };

/** The oldest Node.js major this server supports. */
export const NODE_MIN = 20;

/**
 * Why this server cannot run on the given Node.js version, or null when it can. The version check lives here,
 * inside the server's own node process (DIRECTIVE-NXTG-20261014-09, L1): start.sh used to start a separate
 * `node -p process.versions.node` first, a second Node startup on every launch that cost the most on a busy
 * machine, inside the ~1.5-2 s window Claude Code gives a plugin MCP server. Measured: this file and tools.mjs
 * load on Node 18.20.8, so the check runs there and answers with the stand-in instead of crashing.
 */
export function nodeVersionReason(version = process.versions.node) {
  // A leading "v" (process.version's form) is accepted too (#91 seat L-4).
  const major = Number.parseInt(String(version).replace(/^v/, "").split(".")[0], 10);
  if (Number.isInteger(major) && major >= NODE_MIN) return null;
  return `Health scoring needs Node.js ${NODE_MIN} or newer; this machine has ${version}. Upgrade from https://nodejs.org. ` +
    "Without it there is no health score or grade, and the forge_* governance tools are missing. After installing, start a new Claude Code session.";
}

/** A plain JSON object: not null, not an array. */
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** The result of one tools/call, in MCP's content shape. */
export async function callTool(name) {
  try {
    const result = await dispatchToolCall(name);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    const isUnknown = error.message.startsWith("Unknown tool:");
    return {
      content: [{ type: "text", text: isUnknown ? error.message : `Error in ${name}: ${error.message}\n${error.stack}` }],
      isError: true,
    };
  }
}

/**
 * Handle one JSON-RPC message. Returns the reply object, or null when nothing is sent back
 * (a notification, or a response from the client). Exported for tests.
 */
export async function handleMessage(msg) {
  if (msg === null || typeof msg !== "object" || Array.isArray(msg)) {
    return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } };
  }
  // Not JSON-RPC 2.0 (no `jsonrpc`, or another version): rejected, never dispatched (DIRECTIVE-NXTG-20261014-09, L2).
  if (msg.jsonrpc !== "2.0") {
    const id = typeof msg.id === "string" || typeof msg.id === "number" ? msg.id : null;
    return { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request" } };
  }
  // An id that is not a string, number or null is invalid (JSON-RPC 2.0 section 4); answering it keeps a client that
  // sent one from waiting forever for a reply (#91 seat L-5).
  if (typeof msg.method === "string" && "id" in msg && msg.id !== null && typeof msg.id !== "string" && typeof msg.id !== "number") {
    return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } };
  }
  const isRequest = typeof msg.method === "string" && (typeof msg.id === "string" || typeof msg.id === "number");
  if (!isRequest) {
    if (typeof msg.method === "string" || "result" in msg || "error" in msg) return null; // notification or response
    return { jsonrpc: "2.0", id: msg.id ?? null, error: { code: -32600, message: "Invalid Request" } };
  }
  const ok = (result) => ({ jsonrpc: "2.0", id: msg.id, result });
  const fail = (code, message) => ({ jsonrpc: "2.0", id: msg.id, error: { code, message } });
  switch (msg.method) {
    case "initialize": {
      const asked = msg.params?.protocolVersion;
      const protocolVersion = PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0];
      return ok({ protocolVersion, capabilities: { tools: {} }, serverInfo: SERVER_INFO });
    }
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call": {
      // Validate the whole request before any tool runs (DIRECTIVE-NXTG-20261014-09, M1): v3.13.1 checked only
      // the name, so `arguments: "invalid"` ran the project's tests. `arguments` must be an object or absent.
      const params = msg.params;
      if (!isObject(params)) return fail(-32602, "Invalid params: tools/call params must be an object");
      if (typeof params.name !== "string") return fail(-32602, "Invalid params: tools/call needs a tool name");
      if (params.arguments !== undefined && !isObject(params.arguments)) {
        return fail(-32602, "Invalid params: tools/call arguments must be an object");
      }
      return ok(await callTool(params.name));
    }
    default:
      return fail(-32601, "Method not found");
  }
}

/**
 * Serve MCP on a readable/writable pair. Only protocol frames go to `output`; logs go to stderr.
 * Malformed JSON gets -32700 and the loop keeps reading. Resolves when the input ends.
 */
export function serve(input = process.stdin, output = process.stdout) {
  const send = (reply) => { if (reply) output.write(JSON.stringify(reply) + "\n"); };
  const lines = createInterface({ input, crlfDelay: Infinity });
  const pending = [];
  lines.on("line", (line) => {
    if (!line.trim()) return;
    let msg;
    try { msg = JSON.parse(line); } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      return;
    }
    pending.push(handleMessage(msg).then(send, (err) => {
      console.error("[governance-mcp] request failed:", err?.message ?? err);
      if (msg && (typeof msg.id === "string" || typeof msg.id === "number")) {
        send({ jsonrpc: "2.0", id: msg.id, error: { code: -32603, message: "Internal error" } });
      }
    }));
  });
  return new Promise((done) => lines.on("close", () => Promise.allSettled(pending).then(done)));
}

// Start (FORGE_TEST_MODE guard enables vitest to import without blocking on stdio)
if (!process.env.FORGE_TEST_MODE) {
  const tooOld = nodeVersionReason();
  if (tooOld) {
    // Node too old: hand stdin/stdout to the shared stand-in, which completes the MCP handshake with no tools
    // and the reason, instead of exiting (Claude Code caches a failed start for 15 minutes).
    const standIn = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "unavailable-mcp.sh");
    const r = spawnSync("bash", [standIn, "governance-mcp", tooOld], { stdio: "inherit" });
    if (r.error) console.error(`[governance-mcp] not started: ${tooOld} (stand-in failed: ${r.error.message})`);
    process.exit(r.status ?? 0);
  } else {
    // Exit only after every reply has been flushed: a write callback runs after the writes queued before it,
    // so a large reply is not cut off when the client closes stdin right after its last request.
    serve().then(() => process.stdout.write("", () => process.exit(0)));
  }
}
