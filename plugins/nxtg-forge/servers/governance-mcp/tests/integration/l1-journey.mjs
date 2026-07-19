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
const MCP_JSON = join(SERVER_DIR, "..", "..", ".mcp.json"); // plugins/nxtg-forge/.mcp.json

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

// Run the .mcp.json orchestrator-mcp command VERBATIM (drift-proof) with a given PATH; return exit code.
function runOrchestratorCommand(pathEnv) {
  const mcp = JSON.parse(readFileSync(MCP_JSON, "utf8"));
  const spec = mcp.mcpServers["orchestrator-mcp"];
  try {
    execFileSync(spec.command, spec.args, { env: { PATH: pathEnv }, stdio: "ignore", timeout: 10000 });
    return 0;
  } catch (e) {
    return typeof e.status === "number" ? e.status : 1;
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
    console.log("\n[Leg B] Lego-Snap: orchestrator degrades w/o binary, resolves w/ stub; no L1 orch refs");
    const noRef = checkNoOrchestratorRef(responses);
    check("zero L1 tool responses reference the orchestrator", noRef.ok, `offenders=[${noRef.offenders}]`);

    const noBinCode = runOrchestratorCommand(`${shadowBin}:/usr/bin:/bin`); // no `forge` anywhere
    check("no forge on PATH → orchestrator command exits 1 (silent degrade)", noBinCode === 1, `exit ${noBinCode}`);

    const stubDir = mkdtempSync(join(tmpdir(), "forge-l1-stub-"));
    const stubForge = join(stubDir, "forge");
    writeFileSync(stubForge, "#!/bin/sh\nexit 0\n"); // resolves; `exec forge mcp` runs it, exits 0
    chmodSync(stubForge, 0o755);
    const stubCode = runOrchestratorCommand(`${stubDir}:/usr/bin:/bin`);
    check("stub forge on PATH → orchestrator command resolves it (exit 0)", stubCode === 0, `exit ${stubCode}`);
    rmSync(stubDir, { recursive: true, force: true });
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
