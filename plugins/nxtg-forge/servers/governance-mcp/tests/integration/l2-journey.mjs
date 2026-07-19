#!/usr/bin/env node
// L2 integration harness (DIRECTIVE-NXTG-20260718-11, G-09 phase 2 of 3) — the "Pro Builder" journey.
//
// Boots BOTH MCP servers LIVE against ONE clean temp fixture with the REAL pinned forge binary:
//   * governance-mcp (Node, stdio) via start.sh                     — the 8 L1 tools
//   * orchestrator-mcp (Rust `forge mcp`, stdio) via the .mcp.json command VERBATIM — the 11 L2 tools
// and exercises: dual handshake + full tool surfaces, the cross-server contract (both health tools
// shaped + fixture identity bound on both sides = G-04 proven live), and the task lifecycle
// (get→claim→complete) with a durable-state VALUE proof (state.json task_summary transition +
// tasks/<id>.json status + events.jsonl appends), plus Lego-Snap negative controls.
//
// Standalone entrypoint: `node tests/integration/l2-journey.mjs` (exit 0/1); also the third leg of
// `npm test`. No new runtime deps, no tool-impl changes, only the temp fixture is ever mutated.
//
// Grounded on a live v1.5.2 probe (not docs) — every assertion below was confirmed against the real
// binary before it was written:
//   * `forge init` seeds ZERO tasks; rule-based `forge plan --generate` from a seeded SPEC.md
//     deterministically creates T-001/T-002 (free, no API/network) — that is the lifecycle seed.
//   * state.json has NO `tasks[]` array; per-task counts live in state.json `task_summary`
//     ({pending,completed,...}) which transitions on complete — that is the directive-literal
//     "state.json transitions" surface. Per-task status lives in tasks/<id>.json.
//   * forge_get_health (Rust) → {drift,findings}, carries NO project name; identity is proven via
//     each server's own state tool. forge init/config/plan against the fixture leave global
//     ~/.forge/projects.json byte-identical (constraint: never mutate outside the fixture).
//
// Requires `forge` v1.5.2 on PATH BY DESIGN (L2 = both-servers-live). Absence/mismatch is a
// deterministic NAMED failure (FORGE_ABSENT / WRONG_BINARY_VERSION), never a silent skip.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  NODE_TOOLS, ORCH_TOOLS, FORGE_PIN,
  checkToolSet, checkShapedResponse, checkBinaryVersion, checkIdentityMatch, checkLifecycle,
} from "../lib/checks.mjs";

const SERVER_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", ".."); // -> governance-mcp/
const PLUGIN_ROOT = join(SERVER_DIR, "..", ".."); // -> plugins/nxtg-forge/
const PKG = JSON.parse(readFileSync(join(SERVER_DIR, "package.json"), "utf8"));
const MCP_JSON = join(SERVER_DIR, "..", "..", ".mcp.json"); // plugins/nxtg-forge/.mcp.json

// Expand the Claude Code placeholders exactly as the host does when it loads .mcp.json, so both
// servers boot from their VERBATIM .mcp.json command specs (drift-proof) yet resolve correctly here.
// ${CLAUDE_PLUGIN_ROOT} -> the plugin dir; ${CLAUDE_PROJECT_DIR} -> the temp fixture under test.
function expandPlaceholders(s, fixture) {
  return s.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, PLUGIN_ROOT).replace(/\$\{CLAUDE_PROJECT_DIR\}/g, fixture);
}

const OPENERS = ["xdg-open", "wslview", "open", "x-www-browser", "www-browser", "sensible-browser"];
const NOOP = "#!/bin/sh\nexit 0\n";

let passed = 0;
const failures = [];
function check(label, ok, detail = "") {
  if (ok) { passed++; console.log(`  ✓ ${label}`); }
  else { failures.push(`${label}${detail ? ` — ${detail}` : ""}`); console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`); }
}

function makeShadowBin() {
  const dir = mkdtempSync(join(tmpdir(), "forge-l2-bin-"));
  for (const name of OPENERS) {
    const p = join(dir, name);
    writeFileSync(p, NOOP);
    chmodSync(p, 0o755);
  }
  return dir;
}

// Parse the pinned version out of `forge --version` ("forge 1.5.2" -> "1.5.2"). null if binary absent.
function forgeVersion() {
  try {
    const out = execFileSync("forge", ["--version"], { encoding: "utf8", timeout: 10000 }).trim();
    const m = out.match(/(\d+\.\d+\.\d+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Fixture: clean temp project, forge-init'd + a rule-based plan seeded so the lifecycle leg has a task.
function makeFixture() {
  const dir = mkdtempSync(join(tmpdir(), "forge-l2-fixture-"));
  // Minimal source + SPEC so `forge plan --generate` (rule-based) yields T-001/T-002 deterministically.
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "l2-fixture", version: "0.0.1" }, null, 2));
  mkdirSync(join(dir, "src"));
  writeFileSync(join(dir, "src", "index.ts"), "export const hello = () => 'hi';\n");
  // SPEC vision/requirements are deliberately free of the word "orchestrator" so leg C's ref-check
  // cannot false-positive on governance state that echoes the vision text.
  writeFileSync(join(dir, "SPEC.md"),
    "# SPEC\n\n## Vision\nA clean fixture for the plugin L2 integration harness.\n\n" +
    "## Requirements\n- Build a hello function\n- Add a test for it\n");
  // The Pro Builder fixture carries BOTH governance surfaces bound to the SAME identity: the plugin's
  // Node governance state (.claude/governance.json, read by forge_get_governance_state) AND the
  // orchestrator's .forge/ (created by `forge init`, read by forge_get_state). Identical project.name
  // on both is what leg B proves live. Vision is free of "orchestrator" (leg C ref-check hygiene).
  mkdirSync(join(dir, ".claude"));
  writeFileSync(join(dir, ".claude", "governance.json"), JSON.stringify({
    version: "3.0.0",
    project: { name: "l2-fixture", vision: "A clean fixture for the L2 harness." },
    workstreams: [], qualityGates: {},
  }, null, 2));
  // forge init + rule-based plan, scoped to the fixture (--project); FORGE_PROJECT_ROOT belt-and-braces.
  const fenv = { ...process.env, FORGE_PROJECT_ROOT: dir };
  execFileSync("forge", ["init", "-n", "l2-fixture", "--project", dir], { cwd: dir, env: fenv, stdio: "ignore", timeout: 30000 });
  execFileSync("forge", ["config", "brain", "rule-based", "--project", dir], { cwd: dir, env: fenv, stdio: "ignore", timeout: 30000 });
  execFileSync("forge", ["plan", "--generate", "--project", dir], { cwd: dir, env: fenv, stdio: "ignore", timeout: 60000 });
  return dir;
}

function readState(fixture) {
  return JSON.parse(readFileSync(join(fixture, ".forge", "state.json"), "utf8"));
}

// Boot an MCP server via its .mcp.json command spec (placeholders expanded) bound to the fixture.
function bindTransport(spec, fixture, extraPath = "") {
  const env = { FORGE_PROJECT_ROOT: fixture };
  if (extraPath) env.PATH = extraPath;
  const args = (spec.args || []).map((a) => expandPlaceholders(a, fixture));
  return new StdioClientTransport({ command: spec.command, args, env, cwd: fixture, stderr: "ignore" });
}

const textOf = (result) => (result.content || []).filter((c) => c?.type === "text").map((c) => c.text).join("\n");

async function main() {
  console.log("== L2 integration harness (Pro Builder journey) ==");

  // ── Precondition: the pinned binary. Fail-closed with a NAMED finding, never skip. ──
  const ver = forgeVersion();
  const bin = checkBinaryVersion(ver, FORGE_PIN);
  check(`forge binary on PATH == v${FORGE_PIN}`, bin.ok, bin.reason);
  if (!bin.ok) {
    console.log(`\n== L2 harness: ${passed} passed, ${failures.length + 1} failed (precondition) ==`);
    console.log(`  FAIL: ${bin.reason}`);
    process.exitCode = 1;
    return;
  }

  const mcp = JSON.parse(readFileSync(MCP_JSON, "utf8"));
  const govSpec = mcp.mcpServers["governance-mcp"];       // {command:"bash", args:[".../start.sh"]}
  const orchSpec = mcp.mcpServers["orchestrator-mcp"];    // {command:"bash", args:["-c", "...forge mcp..."]}

  const shadowBin = makeShadowBin();
  const childPath = `${shadowBin}:${process.env.PATH}`; // shadow browser-openers; keep forge resolvable
  let fixture, govClient, govTransport, orchClient, orchTransport;

  try {
    fixture = makeFixture();
    const responses = []; // { tool, text } from L1 tools, for the orchestrator-ref control

    // ── Leg A: dual handshake + full tool surfaces ──
    console.log("\n[Leg A] boot BOTH servers against one fixture; assert versions + tool surfaces");
    govTransport = bindTransport(govSpec, fixture, childPath); // start.sh: FORGE_PROJECT_ROOT + cwd
    govClient = new Client({ name: "l2-gov", version: "1.0.0" }, { capabilities: {} });
    await govClient.connect(govTransport);
    orchTransport = bindTransport(orchSpec, fixture, childPath); // .mcp.json orchestrator command VERBATIM
    orchClient = new Client({ name: "l2-orch", version: "1.0.0" }, { capabilities: {} });
    await orchClient.connect(orchTransport);

    const gsv = govClient.getServerVersion();
    check(`governance handshake version == package.json (${PKG.version})`, gsv?.version === PKG.version, `got ${gsv?.version}`);
    const osv = orchClient.getServerVersion();
    check(`orchestrator handshake version == ${FORGE_PIN}`, osv?.version === FORGE_PIN, `got ${osv?.version}`);

    const govTools = (await govClient.listTools()).tools.map((t) => t.name);
    const gset = checkToolSet(govTools, NODE_TOOLS);
    check(`governance tools/list == the 8 Node tools (live count ${govTools.length})`, gset.ok, `missing=[${gset.missing}] extra=[${gset.extra}]`);

    const orchTools = (await orchClient.listTools()).tools.map((t) => t.name);
    const oset = checkToolSet(orchTools, ORCH_TOOLS);
    // Delta from the pinned surface is reported as a finding, not silently tolerated (escalation clause).
    check(`orchestrator tools/list == the 11 v${FORGE_PIN} tools (live count ${orchTools.length})`, oset.ok,
      oset.ok ? "" : `DELTA_FROM_PINNED_SURFACE missing=[${oset.missing}] extra=[${oset.extra}] (record for FPL; do not patch orchestrator from here)`);

    // ── Leg B: cross-server contract — G-04 no-collision proven live ──
    console.log("\n[Leg B] cross-server contract: both health tools shaped + one fixture identity, both sides");
    const govHealth = await govClient.callTool({ name: "forge_get_governance_health", arguments: {} });
    const gh = checkShapedResponse("forge_get_governance_health", govHealth); // score/grade/checks
    check("Node forge_get_governance_health → shaped non-error", gh.ok, gh.reason);
    responses.push({ tool: "forge_get_governance_health", text: textOf(govHealth) });

    const orchHealth = await orchClient.callTool({ name: "forge_get_health", arguments: {} });
    const oh = checkShapedResponse("forge_get_health", orchHealth, ["drift", "findings"]);
    check("Rust forge_get_health → shaped non-error (distinct shape: drift/findings)", oh.ok, oh.reason);

    // Identity binding via each server's own state surface (health tools carry no project name).
    const govState = await govClient.callTool({ name: "forge_get_governance_state", arguments: {} });
    const gs = checkShapedResponse("forge_get_governance_state", govState);
    check("Node forge_get_governance_state → shaped non-error", gs.ok, gs.reason);
    const orchState = await orchClient.callTool({ name: "forge_get_state", arguments: {} });
    let rustName = null;
    try { rustName = JSON.parse(textOf(orchState))?.project_name; } catch { /* leave null */ }
    const nodeName = gs.parsed?.project?.name;
    const idm = checkIdentityMatch(nodeName, rustName, "l2-fixture");
    check("same fixture identity bound on BOTH servers (node.project.name == rust.project_name == l2-fixture)", idm.ok, idm.reason);

    // ── Leg C: task lifecycle — durable-state VALUE proof ──
    console.log("\n[Leg C] task lifecycle get→claim→complete; assert state.json + tasks/*.json + events.jsonl");
    const summaryBefore = readState(fixture).task_summary;
    const tasksList = await orchClient.callTool({ name: "forge_get_tasks", arguments: {} });
    let firstTaskId = null;
    try { firstTaskId = JSON.parse(textOf(tasksList))?.tasks?.[0]?.id; } catch { /* leave null */ }
    check("forge_get_tasks returns a seeded task (T-001)", firstTaskId === "T-001", `got ${firstTaskId}`);

    const claim = await orchClient.callTool({ name: "forge_claim_task", arguments: { task_id: "T-001", agent: "claude" } });
    check("forge_claim_task(T-001, claude) → non-error", !claim.isError, textOf(claim).slice(0, 120));
    const complete = await orchClient.callTool({ name: "forge_complete_task", arguments: { task_id: "T-001", result_summary: "done by L2 harness" } });
    check("forge_complete_task(T-001) → non-error", !complete.isError, textOf(complete).slice(0, 120));

    const summaryAfter = readState(fixture).task_summary;
    const taskStatus = JSON.parse(readFileSync(join(fixture, ".forge", "tasks", "T-001.json"), "utf8")).status;
    const eventTypes = readFileSync(join(fixture, ".forge", "events.jsonl"), "utf8")
      .split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l).event_type; } catch { return null; } }).filter(Boolean);
    const life = checkLifecycle({ summaryBefore, summaryAfter, taskStatus, eventTypes });
    check("lifecycle mutated durable state (state.json task_summary + tasks/T-001.json + events.jsonl)", life.ok, life.problems.join("; "));

    // ── Leg D: Lego-Snap negative controls (deterministic PAIR, verbatim .mcp.json command) ──
    console.log("\n[Leg D] Lego-Snap: orchestrator degrades w/o binary, resolves w/ stub");
    const noBin = runOrchSpec(orchSpec, `${shadowBin}:/usr/bin:/bin`); // no `forge` anywhere
    check("no forge on PATH → orchestrator command exits 1 (silent degrade)", noBin === 1, `exit ${noBin}`);
    const stubDir = mkdtempSync(join(tmpdir(), "forge-l2-stub-"));
    const stubForge = join(stubDir, "forge");
    writeFileSync(stubForge, "#!/bin/sh\nexit 0\n");
    chmodSync(stubForge, 0o755);
    const stub = runOrchSpec(orchSpec, `${stubDir}:/usr/bin:/bin`);
    check("stub forge on PATH → orchestrator command resolves it (exit 0)", stub === 0, `exit ${stub}`);
    rmSync(stubDir, { recursive: true, force: true });
  } finally {
    // Teardown: close BOTH clients (SIGTERM/SIGKILL each child) + transports, remove temp dirs.
    for (const c of [govClient, orchClient]) { try { if (c) await c.close(); } catch { /* gone */ } }
    for (const t of [govTransport, orchTransport]) { try { if (t) await t.close(); } catch { /* idempotent */ } }
    rmSync(shadowBin, { recursive: true, force: true });
    if (fixture) rmSync(fixture, { recursive: true, force: true });
  }

  console.log(`\n== L2 harness: ${passed} passed, ${failures.length} failed ==`);
  if (failures.length) {
    for (const f of failures) console.log(`  FAIL: ${f}`);
    process.exitCode = 1;
  }
}

// Run the .mcp.json orchestrator command spec VERBATIM with a given PATH; return exit code.
function runOrchSpec(spec, pathEnv) {
  try {
    execFileSync(spec.command, spec.args, { env: { PATH: pathEnv }, stdio: "ignore", timeout: 10000 });
    return 0;
  } catch (e) {
    return typeof e.status === "number" ? e.status : 1;
  }
}

main().catch((e) => {
  console.error("L2 harness crashed:", e?.stack || e);
  process.exitCode = 1;
});
