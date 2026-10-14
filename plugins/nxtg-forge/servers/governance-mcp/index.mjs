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

/** Protocol versions this server speaks: the MCP SDK 1.29 list (tools-only, identical across them). */
export const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05", "2024-10-07"];
const SERVER_INFO = { name: "forge-governance", version: serverVersion };

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
      const name = msg.params?.name;
      if (typeof name !== "string") return fail(-32602, "Invalid params: tools/call needs a tool name");
      return ok(await callTool(name));
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
  serve().then(() => process.exit(0));
}
