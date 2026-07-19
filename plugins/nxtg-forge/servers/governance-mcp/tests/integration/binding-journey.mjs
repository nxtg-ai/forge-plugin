#!/usr/bin/env node
// Binding-contract harness (DIRECTIVE-NXTG-20260719-19) — the -16 class-propagation rule applied to the
// Node governance-mcp. Pins the server-global project-binding contract with the SAME two-consumer
// instrument the orchestrator's -16 used on the Rust side.
//
// Proven contract (probe posted to NEXUS before this test):
//  * start.sh:10 `export FORGE_PROJECT_ROOT="${FORGE_PROJECT_ROOT:-$(pwd)}"` — an explicit FORGE_PROJECT_ROOT
//    at spawn WINS; pwd is only the fallback (captured before start.sh cd's to the server dir).
//  * All 8 tools resolve `root = process.env.FORGE_PROJECT_ROOT || process.cwd()` per call; the process
//    env is fixed at spawn → ONE server process = ONE project for its life.
//  * There is NO set_project / per-call project surface in Node (unlike the Rust orchestrator) → nothing
//    to refuse; rebinding to another project requires a NEW server process (the MCP stdio lifecycle).
//    This is an honestly-documented limitation, not a bug — see docs/governance-mcp-binding-contract.md.
//
// Standalone: `node tests/integration/binding-journey.mjs` (exit 0/1); also a leg of `npm test`.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", ".."); // -> governance-mcp/
const START_SH = join(SERVER_DIR, "start.sh");

let passed = 0;
const failures = [];
function check(label, ok, detail = "") {
  if (ok) { passed++; console.log(`  ✓ ${label}`); }
  else { failures.push(`${label}${detail ? ` — ${detail}` : ""}`); console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`); }
}

function makeProject(name) {
  const dir = mkdtempSync(join(tmpdir(), `forge-bind-${name}-`));
  mkdirSync(join(dir, ".claude"));
  writeFileSync(join(dir, ".claude", "governance.json"), JSON.stringify({ version: "3.0.0", project: { name } }, null, 2));
  return dir;
}

// Boot the server bound to `env`/`cwd`, read the bound project name, tear the client down. Returns
// { name, tools } — the project identity governance-mcp serves + its advertised tool list.
async function boundProject(env, cwd) {
  const transport = new StdioClientTransport({ command: "bash", args: [START_SH], env, cwd, stderr: "ignore" });
  const client = new Client({ name: "bind", version: "1.0.0" }, { capabilities: {} });
  try {
    await client.connect(transport);
    const tools = (await client.listTools()).tools.map((t) => t.name);
    const res = await client.callTool({ name: "forge_get_governance_state", arguments: {} });
    const text = (res.content || []).filter((c) => c?.type === "text").map((c) => c.text).join("");
    let name = null; try { name = JSON.parse(text)?.project?.name; } catch { /* */ }
    return { name, tools };
  } finally {
    try { await client.close(); } catch { /* */ }
    try { await transport.close(); } catch { /* */ }
  }
}

async function main() {
  console.log("== binding-contract harness (Node -16 two-consumer instrument) ==");
  const A = makeProject("projA");
  const B = makeProject("projB");
  const C = makeProject("projC");
  const PATH = process.env.PATH;
  try {
    // Two consumers, two projects — each server is isolated to its own explicit binding.
    const a = await boundProject({ PATH, FORGE_PROJECT_ROOT: A }, A);
    check("consumer A (FORGE_PROJECT_ROOT=A) serves projA", a.name === "projA", `got ${a.name}`);
    const b = await boundProject({ PATH, FORGE_PROJECT_ROOT: B }, B);
    check("consumer B (FORGE_PROJECT_ROOT=B) serves projB (isolated from A)", b.name === "projB", `got ${b.name}`);

    // Explicit binding WINS over cwd (the -16 core): env points at A while the process cwd is C → A.
    const explicitWins = await boundProject({ PATH, FORGE_PROJECT_ROOT: A }, C);
    check("explicit FORGE_PROJECT_ROOT=A wins over cwd=C (serves projA, not projC)", explicitWins.name === "projA", `got ${explicitWins.name}`);

    // Startup-default path: NO explicit env, cwd=B → start.sh's pwd-fallback binds B (single-project default).
    const fallback = await boundProject({ PATH }, B);
    check("no explicit env, cwd=B → pwd-fallback binds projB (single-project default preserved)", fallback.name === "projB", `got ${fallback.name}`);

    // No rebind surface: the Node server exposes no set_project (unlike the Rust orchestrator).
    check("no set_project / rebind tool in the Node surface (rebind requires a new process)",
      !a.tools.includes("forge_set_project") && !a.tools.some((t) => /set.?project/i.test(t)),
      `tools=[${a.tools}]`);
  } finally {
    for (const d of [A, B, C]) rmSync(d, { recursive: true, force: true });
  }

  console.log(`\n== binding harness: ${passed} passed, ${failures.length} failed ==`);
  if (failures.length) { for (const f of failures) console.log(`  FAIL: ${f}`); process.exitCode = 1; }
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  main().catch((e) => { console.error("binding harness crashed:", e?.stack || e); process.exitCode = 1; });
}
