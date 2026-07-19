#!/usr/bin/env node
// L3 integration harness (DIRECTIVE-NXTG-20260718-13, G-09 phase 3 of 3) — the "Ship Lord" journey.
//
// Snaps ALL THREE products together against ONE clean temp fixture: the plugin governance/orchestrator
// MCP (Rust `forge mcp`) AND forge-ui's API+WS server, with the real pinned forge binary. Exercises the
// cross-product contract dx-journeys requires (UI health == orchestrator forge_get_health) and a live
// WebSocket round-trip. forge-ui is a TEST-FIXTURE DEP: booted from its repo, never modified.
//
// Standalone entrypoint: `node tests/integration/l3-journey.mjs` (exit 0/1); also the L3 leg of
// `npm test`. No new runtime deps (HTTP via global fetch, WS via global WebSocket — Node ≥21), no
// tool-impl changes, only the temp fixture is ever mutated.
//
// Grounded on live forge-ui probes + the forge-ui convergence spec (al:4caf3e520f6fb9d3) + identity
// fix e8c011f — every assertion below was confirmed against the real servers before it was written:
//  * forge-ui's BUILT server is broken (ERR_MODULE_NOT_FOUND) → boot the SOURCE via the tsx loader.
//  * projectRoot = process.cwd() → bind by launching with cwd=fixture (data.project.path == fixture).
//  * `node --import <tsxLoader> api-server.ts` is a SINGLE process → clean teardown; a CONCURRENT
//    forge-ui session may be live on this box, so teardown is scoped to OUR child pid ONLY — never
//    pkill-by-name (that would kill another session's server).
//  * Rust forge_get_health.health_score is a FLOAT; forge-ui serves a ROUNDED int → assert Math.round.
//  * forge-ui WS allows a MISSING Origin (api-server.ts:146 only blocks a present-unauthorized origin)
//    → global WebSocket + a valid ?token= works dep-free.
//
// Regate-11 lessons carried forward: execute the .mcp.json ENV contract verbatim (bindOrchestrator),
// outer-scope fixture registration (cleanup even on setup throw), task-scoped event assertions.
//
// Requires: forge v1.5.2 on PATH + a forge-ui checkout (FORGE_UI_DIR or the sibling repo). Both absent
// = deterministic NAMED failures (FORGE_ABSENT / WRONG_BINARY_VERSION / UI_ABSENT), never silent skip.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import {
  FORGE_PIN, checkBinaryVersion, checkShapedResponse, checkHealthContract, checkUiIdentity, checkWsRoundtrip,
} from "../lib/checks.mjs";

const SERVER_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", ".."); // -> governance-mcp/
const MCP_JSON = join(SERVER_DIR, "..", "..", ".mcp.json");                    // plugins/nxtg-forge/.mcp.json
// forge-ui repo: env override, else the sibling checkout (…/NXTG-Forge/forge-ui). CI must provide one.
const FORGE_UI_DIR = process.env.FORGE_UI_DIR || join(SERVER_DIR, "..", "..", "..", "..", "..", "forge-ui");

let passed = 0;
const failures = [];
const findings = []; // named product findings (recorded, not harness bugs) surfaced in the summary
function check(label, ok, detail = "") {
  if (ok) { passed++; console.log(`  ✓ ${label}`); }
  else { failures.push(`${label}${detail ? ` — ${detail}` : ""}`); console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`); }
}
function recordFinding(name, detail) { findings.push(`${name}: ${detail}`); }

const expandPlaceholders = (s, fixture) =>
  s.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, join(SERVER_DIR, "..", "..")).replace(/\$\{CLAUDE_PROJECT_DIR\}/g, fixture);

function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => resolve(p)); });
  });
}

function forgeVersion() {
  try {
    const out = execFileSync("forge", ["--version"], { encoding: "utf8", timeout: 10000 }).trim();
    const m = out.match(/(\d+\.\d+\.\d+)/);
    return m ? m[1] : null;
  } catch { return null; }
}

// Alloc temp fixture dir, run populate, return path on success; on ANY throw remove the dir + rethrow
// (regate-11 C2: no leak on setup failure). CANONICAL forge fixture — identity lives in
// .forge/state.json:project_name; forge-ui e8c011f sources data.project.name from there.
function makeFixtureWith(populate) {
  const dir = mkdtempSync(join(tmpdir(), "forge-l3-fixture-"));
  try { populate(dir); return dir; }
  catch (e) { rmSync(dir, { recursive: true, force: true }); throw e; }
}
function populateFixture(dir) {
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "l3-fixture", version: "0.0.1" }, null, 2));
  mkdirSync(join(dir, "src"));
  writeFileSync(join(dir, "src", "index.ts"), "export const hello = () => 'hi';\n");
  writeFileSync(join(dir, "SPEC.md"),
    "# SPEC\n\n## Vision\nA clean fixture for the plugin L3 integration harness.\n\n" +
    "## Requirements\n- Build a hello function\n- Add a test for it\n");
  mkdirSync(join(dir, ".claude"));
  writeFileSync(join(dir, ".claude", "governance.json"), JSON.stringify({
    version: "3.0.0",
    project: { name: "l3-fixture", vision: "A clean fixture for the L3 harness." },
    workstreams: [], qualityGates: {},
  }, null, 2));
  const fenv = { ...process.env, FORGE_PROJECT_ROOT: dir };
  execFileSync("forge", ["init", "-n", "l3-fixture", "--project", dir], { cwd: dir, env: fenv, stdio: "ignore", timeout: 30000 });
  execFileSync("forge", ["config", "brain", "rule-based", "--project", dir], { cwd: dir, env: fenv, stdio: "ignore", timeout: 30000 });
  execFileSync("forge", ["plan", "--generate", "--project", dir], { cwd: dir, env: fenv, stdio: "ignore", timeout: 60000 });
}

const canonicalProjectName = (fixture) => JSON.parse(readFileSync(join(fixture, ".forge", "state.json"), "utf8")).project_name;

// Boot the orchestrator MCP EXECUTING the .mcp.json env contract verbatim (regate-11 C1), bound to fixture.
function bindOrchestrator(fixture) {
  const spec = JSON.parse(readFileSync(MCP_JSON, "utf8")).mcpServers["orchestrator-mcp"];
  const env = {};
  for (const [k, v] of Object.entries(spec.env || {})) env[k] = expandPlaceholders(v, fixture);
  env.PATH = process.env.PATH;
  const args = (spec.args || []).map((a) => expandPlaceholders(a, fixture));
  const cwd = env.FORGE_PROJECT_ROOT || fixture;
  return new StdioClientTransport({ command: spec.command, args, env, cwd, stderr: "ignore" });
}

const textOf = (result) => (result.content || []).filter((c) => c?.type === "text").map((c) => c.text).join("\n");

// Spawn forge-ui's API+WS server (SOURCE via tsx loader) bound to the fixture on an ephemeral port.
// Returns { child, base } where base is the http origin. Single detached process → group-killable.
// HOME is redirected to a throwaway dir so forge-ui's global runspace bookkeeping (`~/.forge/projects.json`
// lastSync — os.homedir()-based) lands there, NOT the operator's real ~/.forge. Its inherited forge
// subprocess (orchestrator-health) inherits this HOME too, so ALL of forge-ui's global writes are isolated.
function bootForgeUi(fixture, port, home) {
  const tsxLoader = join(FORGE_UI_DIR, "node_modules", "tsx", "dist", "loader.mjs");
  const entry = join(FORGE_UI_DIR, "src", "server", "api-server.ts");
  const child = spawn("node", ["--import", tsxLoader, entry], {
    cwd: fixture,
    env: { ...process.env, HOME: home, PORT: String(port), ALLOWED_ORIGINS: "http://localhost:5050", FORGE_BIN: process.env.FORGE_BIN || "forge" },
    stdio: "ignore",
    detached: true,
  });
  return { child, base: `http://127.0.0.1:${port}` };
}

async function waitForHttp(base, child, ms = 30000) {
  for (let i = 0; i < ms / 200; i++) {
    if (child.exitCode !== null) return false; // child died during startup
    try { const r = await fetch(`${base}/api/health`); if (r.ok) return true; } catch { /* not up yet */ }
    await new Promise((res) => setTimeout(res, 200));
  }
  return false;
}

// Reap the forge-ui child SCOPED TO ITS OWN PID (detached → its own process group). Never pkill-by-name.
async function reap(child) {
  if (!child || child.exitCode !== null) return;
  try { process.kill(-child.pid, "SIGTERM"); } catch { try { child.kill("SIGTERM"); } catch { /* gone */ } }
  for (let i = 0; i < 20; i++) { if (child.exitCode !== null) return; await new Promise((r) => setTimeout(r, 100)); }
  try { process.kill(-child.pid, "SIGKILL"); } catch { try { child.kill("SIGKILL"); } catch { /* gone */ } }
}

// A live WS round-trip: connect (token+missing-origin), collect message types, verify the connect
// state.update binds to the fixture, and complete a ping→pong. Returns { events[], fixtureBound }.
function wsRoundtrip(base, token, canonical) {
  return new Promise((resolve) => {
    const events = [];
    let fixtureBound = false;
    const url = `${base.replace("http", "ws")}/ws?token=${token}`;
    let ws;
    const finish = () => { try { ws.close(); } catch { /* */ } resolve({ events, fixtureBound }); };
    const timer = setTimeout(finish, 6000);
    try { ws = new WebSocket(url); } catch { clearTimeout(timer); return resolve({ events, fixtureBound }); }
    ws.onopen = () => ws.send(JSON.stringify({ type: "ping" }));
    ws.onerror = () => { clearTimeout(timer); finish(); };
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      events.push(m.type);
      if (m.type === "state.update") {
        const blob = JSON.stringify(m.payload || {});
        if (blob.includes(canonical)) fixtureBound = true; // fixture identity present in the state payload
      }
      if (m.type === "pong") { clearTimeout(timer); finish(); }
    };
  });
}

async function uiStatus(base) {
  const r = await fetch(`${base}/api/forge/status`);
  const j = await r.json();
  return j.data;
}

async function main() {
  console.log("== L3 integration harness (Ship Lord journey) ==");

  // ── Preconditions: pinned binary + forge-ui checkout. Fail-closed, named, no skip. ──
  const bin = checkBinaryVersion(forgeVersion(), FORGE_PIN);
  check(`forge binary on PATH == v${FORGE_PIN}`, bin.ok, bin.reason);
  const uiPresent = existsSync(join(FORGE_UI_DIR, "src", "server", "api-server.ts")) &&
    existsSync(join(FORGE_UI_DIR, "node_modules", "tsx", "dist", "loader.mjs"));
  check(`forge-ui checkout present (${FORGE_UI_DIR})`, uiPresent, uiPresent ? "" : "UI_ABSENT: set FORGE_UI_DIR or provide the sibling checkout with deps installed");
  if (!bin.ok || !uiPresent) { summarize(); return; }

  let fixture, uiHome, uiChild, orchClient, orchTransport;
  try {
    fixture = makeFixtureWith(populateFixture);       // outer-scope registration (regate-11 C2)
    uiHome = mkdtempSync(join(tmpdir(), "forge-l3-home-")); // isolates forge-ui's ~/.forge global writes
    const canonical = canonicalProjectName(fixture);  // .forge/state.json project_name == "l3-fixture"
    const port = await freePort();

    // ── Leg A: Ship Lord snap — all three products live against one fixture ──
    console.log("\n[Leg A] boot orchestrator MCP + forge-ui API/WS against one fixture");
    orchTransport = bindOrchestrator(fixture);
    orchClient = new Client({ name: "l3-orch", version: "1.0.0" }, { capabilities: {} });
    await orchClient.connect(orchTransport);
    const orchSv = orchClient.getServerVersion();
    check(`orchestrator handshake version == ${FORGE_PIN}`, orchSv?.version === FORGE_PIN, `got ${orchSv?.version}`);

    const ui = bootForgeUi(fixture, port, uiHome);
    uiChild = ui.child;
    const up = await waitForHttp(ui.base, uiChild);
    check(`forge-ui API up on ephemeral :${port} (/api/health)`, up, up ? "" : "server did not become healthy");
    if (!up) throw new Error("forge-ui failed to boot");
    const healthResp = await fetch(`${ui.base}/api/health`).then((r) => r.json()).catch(() => ({}));
    check("forge-ui /api/health status == healthy", healthResp.status === "healthy", `got ${healthResp.status}`);

    const rustHealth = await orchClient.callTool({ name: "forge_get_health", arguments: {} });
    const rh = checkShapedResponse("forge_get_health", rustHealth, ["drift", "findings", "health_score", "summary"]);
    check("orchestrator forge_get_health → shaped non-error", rh.ok, rh.reason);
    const rustScore = rh.parsed?.health_score;

    // ── Leg B: cross-product contract — UI health == round(orchestrator health), identity binds ──
    console.log("\n[Leg B] contract: data.health.score == Math.round(rust health_score); identity binds");
    const status1 = await uiStatus(ui.base);
    const contract = checkHealthContract(status1.health?.score, status1.health?.source, rustScore);
    check(`UI health == Math.round(orchestrator health_score ${rustScore})`, contract.ok, contract.reason);
    if (!contract.ok) recordFinding("UI_HEALTH_CONTRACT_DRIFT", contract.reason);

    const ident = checkUiIdentity(status1.project?.name, status1.project?.path, canonical, fixture);
    check(`forge-ui binds canonical identity (data.project.name == ${canonical}, path == fixture)`, ident.ok, ident.reason);
    if (!ident.ok) recordFinding("UI_IDENTITY_DRIFT", ident.reason);

    // -16 watch: cross-product shared-store contamination shows as inconsistent health across polls.
    const status2 = await uiStatus(ui.base);
    const consistent = status1.health?.score === status2.health?.score && status1.project?.path === status2.project?.path;
    check("health/identity consistent across polls (no ~/.forge cross-store contamination)", consistent,
      consistent ? "" : `poll1=${status1.health?.score}@${status1.project?.path} poll2=${status2.health?.score}@${status2.project?.path}`);
    if (!consistent) recordFinding("CROSS_STORE_CONTAMINATION", `DIRECTIVE-16 class: poll1 score=${status1.health?.score} poll2 score=${status2.health?.score} (record, do not chase)`);

    // ── Leg C: liveness — WS round-trip + MCP→UI reflection (task-scoped) ──
    console.log("\n[Leg C] liveness: WS state.update+ping/pong; complete T-001 via MCP → UI reflects live");
    const tokenResp = await fetch(`${ui.base}/api/auth/ws-token`, { method: "POST", headers: { Origin: "http://localhost:5050" } }).then((r) => r.json());
    const token = tokenResp?.data?.token;
    check("POST /api/auth/ws-token → token issued", typeof token === "string" && token.length > 0);
    const rt = await wsRoundtrip(ui.base, token, canonical);
    const wsc = checkWsRoundtrip({ events: rt.events, fixtureBound: rt.fixtureBound });
    check(`WS round-trip: state.update (fixture-bound) + ping/pong [events: ${rt.events.join(",")}]`, wsc.ok, wsc.reason);

    // MCP→UI reflection, SCOPED TO T-001 (regate-11 C3 discipline): complete T-001, then the UI's
    // orchestrator-sourced health must still AGREE with a fresh forge_get_health (live read, not stale).
    await orchClient.callTool({ name: "forge_claim_task", arguments: { task_id: "T-001", agent: "claude" } });
    await orchClient.callTool({ name: "forge_complete_task", arguments: { task_id: "T-001", result_summary: "done by L3 harness" } });
    const t001Status = JSON.parse(readFileSync(join(fixture, ".forge", "tasks", "T-001.json"), "utf8")).status;
    check("T-001 completed via MCP (tasks/T-001.json status == completed)", t001Status === "completed", `got ${t001Status}`);
    const freshRust = JSON.parse(textOf(await orchClient.callTool({ name: "forge_get_health", arguments: {} })))?.health_score;
    const statusAfter = await uiStatus(ui.base);
    const reflect = checkHealthContract(statusAfter.health?.score, statusAfter.health?.source, freshRust);
    check("post-mutation: UI health still == Math.round(fresh orchestrator health) [live read, not stale]", reflect.ok, reflect.reason);
    if (!reflect.ok) recordFinding("UI_HEALTH_CONTRACT_DRIFT", `post-mutation: ${reflect.reason}`);
  } finally {
    try { if (orchClient) await orchClient.close(); } catch { /* */ }
    try { if (orchTransport) await orchTransport.close(); } catch { /* */ }
    await reap(uiChild);
    if (fixture) rmSync(fixture, { recursive: true, force: true });
    if (uiHome) rmSync(uiHome, { recursive: true, force: true });
  }
  summarize();
}

function summarize() {
  if (findings.length) {
    console.log("\n-- recorded product findings (routed to FPL; not harness bugs) --");
    for (const f of findings) console.log(`  FINDING ${f}`);
  }
  console.log(`\n== L3 harness: ${passed} passed, ${failures.length} failed ==`);
  if (failures.length) {
    for (const f of failures) console.log(`  FAIL: ${f}`);
    process.exitCode = 1;
  }
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  main().catch((e) => { console.error("L3 harness crashed:", e?.stack || e); process.exitCode = 1; });
}

export { makeFixtureWith };
