/**
 * NXTG-Forge Governance MCP Server
 *
 * MCP server wiring only. All tool implementations live in tools.mjs.
 * Provides project governance tools for Claude Code via MCP protocol.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

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
// MCP Server
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "forge-governance", version: serverVersion },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  try {
    const result = await dispatchToolCall(name);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const isUnknown = error.message.startsWith("Unknown tool:");
    return {
      content: [
        {
          type: "text",
          text: isUnknown
            ? error.message
            : `Error in ${name}: ${error.message}\n${error.stack}`,
        },
      ],
      isError: true,
    };
  }
});

// Start (FORGE_TEST_MODE guard enables vitest to import without blocking on stdio)
if (!process.env.FORGE_TEST_MODE) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
