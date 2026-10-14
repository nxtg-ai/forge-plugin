#!/usr/bin/env node
// L1 integration harness (DIRECTIVE-NXTG-20260718-10, G-09 phase 1 of 3).
//
// Boots the REAL governance-mcp server over stdio (via start.sh) against a clean temp fixture and
// exercises the full L1 journey end-to-end: JSON-RPC handshake + version, all 8 tools, and the
// Lego-Snap invariant. Standalone entrypoint — `node tests/integration/l1-journey.mjs` (exit 0/1);
// also invoked as the second half of `npm test`. No new runtime deps, no tool-impl changes.
//
// Gotchas handled (see DIRECTIVE-NXTG-20260718-10 Response / advisor review):
//  * StdioClientTransport merges getDefaultEnvironment() but NOT FORGE_PROJECT_ROOT — pass it
//    explicitly + set cwd, else start.sh's `${FORGE_PROJECT_ROOT:-$(pwd)}` silently targets the
//    server dir and the harness "passes" while testing nothing.
//  * FORGE_TEST_MODE must be ABSENT in the child so index.mjs runs server.connect().
//  * child PATH = shadowBin:/usr/bin:/bin:/usr/local/bin — no-op browser openers (forge_open_dashboard
//    calls open() when not in FORGE_TEST_MODE) + conda excluded so `which pytest` fails → forge_run_tests
//    deterministically reports "no runner".
//  * finally{}: close client (kills child), rm tempdirs.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  NODE_TOOLS, checkVersionsAgree, checkToolSet, checkNoOrchestratorRef, checkShapedResponse,
} from "../lib/checks.mjs";

const SERVER_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", ".."); // -> governance-mcp/
const START_SH = join(SERVER_DIR, "start.sh");
const PKG = JSON.parse(readFileSync(join(SERVER_DIR, "package.json"), "utf8"));
// orchestrator-mcp is registered by the companion plugin since DIRECTIVE-NXTG-20261014-12.
const COMPANION_ROOT = join(SERVER_DIR, "..", "..", "..", "nxtg-forge-orchestrator");
const COMPANION_MCP_JSON = join(COMPANION_ROOT, ".mcp.json");

const OPENERS = ["xdg-open", "wslview", "open", "x-www-browser", "www-browser", "sensible-browser"];
const NOOP = "#!/bin/sh\nexit 0\n";

let passed = 0;
const failures = [];
function check(label, ok, detail = "") {
  if (ok) { passed++; console.log(`  ✓ ${label}`); }
  else { failures.push(`${label}${detail ? ` — ${detail}` : ""}`); console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`); }
}

function makeShadowBin() {
  const dir = mkdtempSync(join(tmpdir(), "forge-l1-bin-"));
  for (const name of OPENERS) {
    const p = join(dir, name);
    writeFileSync(p, NOOP);
    chmodSync(p, 0o755);
  }
  return dir;
}

function makeFixture() {
  const dir = mkdtempSync(join(tmpdir(), "forge-l1-fixture-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "l1-fixture", version: "0.0.1" }, null, 2));
  mkdirSync(join(dir, "src"));
  writeFileSync(join(dir, "src", "index.ts"), "export const hello = () => 'hi';\n");
  writeFileSync(join(dir, "README.md"), "# L1 Fixture\n\nMinimal project for the plugin L1 integration harness.\n");
  mkdirSync(join(dir, ".claude"));
  // NOTE: vision text is deliberately free of the word "orchestrator" so leg B's ref-check
  // cannot false-positive on governance state.
  writeFileSync(join(dir, ".claude", "governance.json"), JSON.stringify({
    version: "3.0.0",
    project: { name: "l1-fixture", vision: "A clean fixture for the L1 harness." },
    workstreams: [], qualityGates: {},
  }, null, 2));
  return dir;
}

// Run the .mcp.json orchestrator-mcp command VERBATIM (drift-proof; ${CLAUDE_PLUGIN_ROOT} expanded the
// way Claude Code expands it) with a given PATH and HOME, feeding one MCP initialize line on stdin.
// Returns { code, stdout }.
const PLUGIN_ROOT = join(SERVER_DIR, "..", "..");
const INIT_LINE = JSON.stringify({ jsonrpc: "2.0", id: 0, method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "l1", version: "1" } } }) + "\n";
function runOrchestratorCommand(pathEnv, homeEnv) {
  const mcp = JSON.parse(readFileSync(COMPANION_MCP_JSON, "utf8"));
  const spec = mcp.mcpServers["orchestrator-mcp"];
  const args = spec.args.map((a) => a.replaceAll("${CLAUDE_PLUGIN_ROOT}", COMPANION_ROOT));
  try {
    const stdout = execFileSync(spec.command, args, {
      env: { PATH: pathEnv, HOME: homeEnv }, input: INIT_LINE, encoding: "utf8", timeout: 10000,
      stdio: ["pipe", "pipe", "ignore"],
    });
    return { code: 0, stdout };
  } catch (e) {
    return { code: typeof e.status === "number" ? e.status : 1, stdout: String(e.stdout ?? "") };
  }
}

async function main() {
  console.log("== L1 integration harness ==");
  const shadowBin = makeShadowBin();
  const fixture = makeFixture();
  const childPath = `${shadowBin}:/usr/bin:/bin:/usr/local/bin`;
  let client, transport;
  const responses = []; // { tool, text } for the orchestrator-ref check

  try {
    // ── Leg A: real stdio handshake + all 8 tools against the fixture ──
    console.log("\n[Leg A] boot governance-mcp via start.sh, handshake, 8 tools");
    transport = new StdioClientTransport({
      command: "bash",
      args: [START_SH],
      // Explicit env: merged with getDefaultEnvironment() by the SDK. FORGE_PROJECT_ROOT is NOT in
      // the default allowlist, so it MUST be set here; FORGE_TEST_MODE is intentionally omitted.
      env: { PATH: childPath, FORGE_PROJECT_ROOT: fixture },
      cwd: fixture,
      stderr: "ignore",
    });
    client = new Client({ name: "l1-harness", version: "1.0.0" }, { capabilities: {} });
    await client.connect(transport);

    const sv = client.getServerVersion();
    check(`handshake serverVersion == package.json (${PKG.version})`, sv?.version === PKG.version, `got ${sv?.version}`);

    const toolList = (await client.listTools()).tools.map((t) => t.name);
    const set = checkToolSet(toolList, NODE_TOOLS);
    check("tools/list == the 8 Node tools", set.ok, `missing=[${set.missing}] extra=[${set.extra}]`);
    // Live cross-check of the whole -05 saga: the Node server exposes the governance tool, not the Rust one.
    check("tools/list contains forge_get_governance_health, NOT forge_get_health",
      toolList.includes("forge_get_governance_health") && !toolList.includes("forge_get_health"));

    const parsedByTool = {};
    for (const tool of NODE_TOOLS) {
      const result = await client.callTool({ name: tool, arguments: {} });
      const shaped = checkShapedResponse(tool, result);
      check(`${tool} → shaped non-error response`, shaped.ok, shaped.reason);
      if (shaped.parsed) parsedByTool[tool] = shaped.parsed;
      const text = (result.content || []).filter((c) => c?.type === "text").map((c) => c.text).join("\n");
      responses.push({ tool, text });
    }

    // Fixture-binding proof (deterministic VALUE, not just shape): the server actually read OUR
    // fixture, not the server dir. Guards the FORGE_PROJECT_ROOT-not-reached failure mode where every
    // tool still returns shaped data against the wrong project and the harness would falsely pass.
    const boundName = parsedByTool.forge_get_governance_state?.project?.name;
    check("server is bound to the fixture (governance_state.project.name == l1-fixture)",
      boundName === "l1-fixture", `got ${boundName}`);

    // ── Leg B: Lego-Snap invariant (deterministic PAIR) ──
    console.log("\n[Leg B] Lego-Snap: orchestrator stands in w/o binary, resolves w/ stub on or off PATH; no L1 orch refs");
    const noRef = checkNoOrchestratorRef(responses);
    check("zero L1 tool responses reference the orchestrator", noRef.ok, `offenders=[${noRef.offenders}]`);

    // No forge anywhere: the launcher must still complete the handshake (stand-in, no tools),
    // because Claude Code caches a failed start for 15 min and L2 would stay dark after install.sh.
    const emptyHome = mkdtempSync(join(tmpdir(), "forge-l1-home-"));
    const noBin = runOrchestratorCommand(`${shadowBin}:/usr/bin:/bin`, emptyHome);
    let standIn = null;
    try { standIn = JSON.parse(noBin.stdout.split("\n")[0]).result; } catch { /* checked below */ }
    check("no forge anywhere → orchestrator handshake completes via the stand-in (no failed start)",
      noBin.code === 0 && standIn?.serverInfo?.version === "unavailable"
        && /forge\.nxtg\.ai\/install\.sh/.test(standIn?.instructions ?? ""),
      `exit ${noBin.code} stdout=${noBin.stdout.slice(0, 120)}`);

    const stubDir = mkdtempSync(join(tmpdir(), "forge-l1-stub-"));
    const stubForge = join(stubDir, "forge");
    writeFileSync(stubForge, "#!/bin/sh\necho \"stub-forge $*\"\n"); // `exec forge mcp` runs it
    chmodSync(stubForge, 0o755);
    const onPath = runOrchestratorCommand(`${stubDir}:/usr/bin:/bin`, emptyHome);
    check("stub forge on PATH → orchestrator command execs `forge mcp`",
      onPath.code === 0 && onPath.stdout.trim() === "stub-forge mcp", `exit ${onPath.code} stdout=${onPath.stdout.trim()}`);

    // F-C: install.sh puts forge in ~/.local/bin, which may not be on the PATH Claude Code was started with.
    mkdirSync(join(emptyHome, ".local", "bin"), { recursive: true });
    writeFileSync(join(emptyHome, ".local", "bin", "forge"), "#!/bin/sh\necho \"stub-forge $*\"\n");
    chmodSync(join(emptyHome, ".local", "bin", "forge"), 0o755);
    const offPath = runOrchestratorCommand(`${shadowBin}:/usr/bin:/bin`, emptyHome);
    check("forge only in ~/.local/bin (not on PATH) → orchestrator command still execs `forge mcp`",
      offPath.code === 0 && offPath.stdout.trim() === "stub-forge mcp", `exit ${offPath.code} stdout=${offPath.stdout.trim()}`);
    rmSync(stubDir, { recursive: true, force: true });
    rmSync(emptyHome, { recursive: true, force: true });
  } finally {
    // ── Teardown: close client (SIGTERM/SIGKILL the child), remove temp dirs ──
    try { if (client) await client.close(); } catch { /* already gone */ }
    try { if (transport) await transport.close(); } catch { /* idempotent */ }
    rmSync(shadowBin, { recursive: true, force: true });
    rmSync(fixture, { recursive: true, force: true });
  }

  console.log(`\n== L1 harness: ${passed} passed, ${failures.length} failed ==`);
  if (failures.length) {
    for (const f of failures) console.log(`  FAIL: ${f}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("L1 harness crashed:", e?.stack || e);
  process.exitCode = 1;
});
