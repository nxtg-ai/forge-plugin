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
import { getGovernanceState } from "../../tools.mjs";

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
  // Alloc the temp dir FIRST, then populate; on ANY setup failure clean the dir and rethrow so a throwing
  // `forge init/config/plan` cannot leak the fixture (the caller only receives a path on full success).
  return makeFixtureWith(populateFixture);
}

// Write files + run `forge init/config/plan` into an already-allocated fixture dir. Throws propagate to
// makeFixtureWith, which owns the dir's cleanup-on-failure.
function populateFixture(dir) {
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
}

// Alloc a temp fixture dir, run `populate(dir)`, return the path on success. On ANY exception during
// populate, remove the dir and rethrow — so setup failures never leak a fixture. Exported for the
// setup-failure cleanup control (l2-checks.test.mjs).
export function makeFixtureWith(populate) {
  const dir = mkdtempSync(join(tmpdir(), "forge-l2-fixture-"));
  try {
    populate(dir);
    return dir;
  } catch (e) {
    rmSync(dir, { recursive: true, force: true });
    throw e;
  }
}

function readState(fixture) {
  return JSON.parse(readFileSync(join(fixture, ".forge", "state.json"), "utf8"));
}

// Parse .forge/events.jsonl into [{ event_type, task_id }] (order preserved). Used to snapshot before
// the lifecycle and diff the APPENDED records after — pre-existing init/plan events must not count.
function readEvents(fixture) {
  return readFileSync(join(fixture, ".forge", "events.jsonl"), "utf8")
    .split("\n").filter(Boolean)
    .map((l) => { try { const j = JSON.parse(l); return { event_type: j.event_type, task_id: j.task_id }; } catch { return null; } })
    .filter(Boolean);
}

// Boot an MCP server via its .mcp.json command spec, EXECUTING the spec's env contract (placeholders
// expanded the same way as args) rather than injecting our own root. A misconfigured .mcp.json
// FORGE_PROJECT_ROOT therefore binds the wrong project and FAILS the live identity check (the false-green
// Codex proved by editing .mcp.json env). Launch cwd follows the configured root so cwd cannot mask a
// wrong env. extraPath (shadow-bin) is merged for browser-opener shadowing.
function bindTransport(spec, fixture, extraPath = "") {
  const env = {};
  for (const [k, v] of Object.entries(spec.env || {})) env[k] = expandPlaceholders(v, fixture);
  if (extraPath) env.PATH = extraPath;
  const args = (spec.args || []).map((a) => expandPlaceholders(a, fixture));
  const cwd = env.FORGE_PROJECT_ROOT || fixture;
  return new StdioClientTransport({ command: spec.command, args, env, cwd, stderr: "ignore" });
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
  const orchSpec = mcp.mcpServers["orchestrator-mcp"];    // {command:"bash", args:["${CLAUDE_PLUGIN_ROOT}/servers/orchestrator-mcp/start.sh"]}

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
    console.log("\n[Leg C] task lifecycle get→claim→complete; assert state.json + tasks/*.json + APPENDED events");
    const summaryBefore = readState(fixture).task_summary;
    const eventsBefore = readEvents(fixture); // snapshot BEFORE the lifecycle (init/plan events don't count)
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
    // Only the records APPENDED by the claim/complete count — and they must be scoped to T-001.
    const appendedEvents = readEvents(fixture).slice(eventsBefore.length);
    const life = checkLifecycle({ summaryBefore, summaryAfter, taskStatus, appendedEvents, taskId: "T-001" });
    check("lifecycle mutated durable state (state.json task_summary + tasks/T-001.json + NEW T-001-scoped events)", life.ok, life.problems.join("; "));

    // ── Leg D: Lego-Snap negative controls (deterministic PAIR, verbatim .mcp.json command) ──
    console.log("\n[Leg D] Lego-Snap: orchestrator stands in w/o binary, resolves w/ stub");
    // An empty HOME so a real ~/.local/bin/forge on the test machine cannot satisfy the launcher.
    const emptyHome = mkdtempSync(join(tmpdir(), "forge-l2-home-"));
    const noBin = runOrchSpec(orchSpec, `${shadowBin}:/usr/bin:/bin`, emptyHome); // no `forge` anywhere
    let standIn = null;
    try { standIn = JSON.parse(noBin.stdout.split("\n")[0]).result; } catch { /* checked below */ }
    check("no forge anywhere → orchestrator handshake completes via the stand-in (no failed start)",
      noBin.code === 0 && standIn?.serverInfo?.version === "unavailable", `exit ${noBin.code}`);
    const stubDir = mkdtempSync(join(tmpdir(), "forge-l2-stub-"));
    const stubForge = join(stubDir, "forge");
    writeFileSync(stubForge, "#!/bin/sh\necho \"stub-forge $*\"\n");
    chmodSync(stubForge, 0o755);
    const stub = runOrchSpec(orchSpec, `${stubDir}:/usr/bin:/bin`, emptyHome);
    check("stub forge on PATH → orchestrator command execs `forge mcp`",
      stub.code === 0 && stub.stdout.trim() === "stub-forge mcp", `exit ${stub.code} stdout=${stub.stdout.trim()}`);
    rmSync(stubDir, { recursive: true, force: true });
    rmSync(emptyHome, { recursive: true, force: true });

    // ── Leg E: a project set up by `forge init` alone is set up for the plugin too (alpha run 2, F-I) ──
    console.log("\n[Leg E] real `forge init` only (no /nxtg-forge:init): plugin reads .forge/governance.json, no advisory");
    const forgeOnly = mkdtempSync(join(tmpdir(), "forge-l2-forge-only-"));
    try {
      execFileSync("git", ["init", "-q"], { cwd: forgeOnly, stdio: "ignore" });
      execFileSync("forge", ["init", "-n", "l2-forge-only", "--project", forgeOnly],
        { cwd: forgeOnly, env: { ...process.env, FORGE_PROJECT_ROOT: forgeOnly }, stdio: "ignore", timeout: 30000 });
      const st = getGovernanceState(forgeOnly);
      check("after real `forge init`: governance state initialized, source orchestrator, read from .forge/",
        st.initialized === true && st.source === "orchestrator" && st.path === join(forgeOnly, ".forge", "governance.json"),
        JSON.stringify(st).slice(0, 160));
      let hookOut = "";
      try {
        hookOut = execFileSync("bash", [join(PLUGIN_ROOT, "hooks", "scripts", "pre-task.sh")], {
          cwd: forgeOnly, input: JSON.stringify({ session_id: `l2-forge-only-${process.pid}` }), encoding: "utf8",
          env: { PATH: process.env.PATH, HOME: forgeOnly, TMPDIR: forgeOnly }, stdio: ["pipe", "pipe", "pipe"], timeout: 20000,
        });
      } catch (e) { hookOut = `exit ${e.status} ${e.stdout ?? ""}${e.stderr ?? ""}`; }
      check("after real `forge init`: pre-task hook prints no \"No governance.json found\" advisory",
        !hookOut.includes("No governance.json found") && !hookOut.startsWith("exit "), hookOut.slice(0, 160));
    } finally {
      rmSync(forgeOnly, { recursive: true, force: true });
    }

    // ── Leg F: /nxtg-forge:feature's task loop on the real binary (alpha run 2, F-H; path (b), shape B1) ──
    // README headings are there on purpose: a bare `plan --generate` would turn them into tasks.
    console.log("\n[Leg F] feature-task.sh → plan --generate --spec → forge_get_tasks by title → claim → complete");
    const featProj = mkdtempSync(join(tmpdir(), "forge-l2-feature-"));
    let featClient, featTransport;
    try {
      execFileSync("git", ["init", "-q"], { cwd: featProj, stdio: "ignore" });
      writeFileSync(join(featProj, "README.md"), "# Proj\n\n## Installation\nx\n\n## Usage\ny\n");
      execFileSync("forge", ["init", "-n", "l2-feature", "--project", featProj],
        { cwd: featProj, env: { ...process.env, FORGE_PROJECT_ROOT: featProj }, stdio: "ignore", timeout: 30000 });
      const title = "Add a usage example to the hello docstring";
      const kv = Object.fromEntries(execFileSync("bash",
        [join(PLUGIN_ROOT, "scripts", "feature-task.sh"), title, "Show one call and its output."],
        { cwd: featProj, env: { ...process.env, FORGE_PROJECT_ROOT: featProj }, encoding: "utf8", timeout: 60000 })
        .split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
      check("feature-task.sh → status=created, spec F-001", kv.status === "created" && kv.spec === ".forge/feature-requests/F-001.md",
        JSON.stringify(kv));

      featTransport = bindTransport(orchSpec, featProj, childPath);
      featClient = new Client({ name: "l2-feature", version: "1.0.0" }, { capabilities: {} });
      await featClient.connect(featTransport);
      const tasksOf = async () => JSON.parse(textOf(await featClient.callTool({ name: "forge_get_tasks", arguments: {} })))?.tasks ?? [];
      const before = await tasksOf();
      const mine = before.filter((t) => typeof t.title === "string" && t.title.includes(title));
      check("forge_get_tasks: exactly one task, titled with the feature (no README-heading tasks)",
        before.length === 1 && mine.length === 1, before.map((t) => `${t.id}:${t.title}`).join(" | "));
      const id = mine[0]?.id;
      const claimF = await featClient.callTool({ name: "forge_claim_task", arguments: { task_id: id, agent: "claude" } });
      check(`forge_claim_task(${id}, claude) → non-error`, !claimF.isError, textOf(claimF).slice(0, 120));
      const doneF = await featClient.callTool({ name: "forge_complete_task",
        arguments: { task_id: id, result_summary: "Added the docstring example; tests pass" } });
      check(`forge_complete_task(${id}, result_summary) → non-error`, !doneF.isError, textOf(doneF).slice(0, 120));
      const after = (await tasksOf()).find((t) => t.id === id);
      check("forge_get_tasks shows the feature task completed by claude",
        after?.status === "completed" && after?.assigned_to === "claude", JSON.stringify(after).slice(0, 200));
    } finally {
      try { if (featClient) await featClient.close(); } catch { /* gone */ }
      try { if (featTransport) await featTransport.close(); } catch { /* idempotent */ }
      rmSync(featProj, { recursive: true, force: true });
    }
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

// Run the .mcp.json orchestrator command spec VERBATIM (${CLAUDE_PLUGIN_ROOT} expanded) with a given
// PATH and HOME, feeding one MCP initialize line on stdin. Returns { code, stdout }.
const INIT_LINE = JSON.stringify({ jsonrpc: "2.0", id: 0, method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "l2", version: "1" } } }) + "\n";
function runOrchSpec(spec, pathEnv, homeEnv) {
  const args = (spec.args || []).map((a) => a.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, PLUGIN_ROOT));
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

// Run the live journey ONLY when invoked directly (`node l2-journey.mjs`), not when imported for its
// exported helpers (e.g. makeFixtureWith in l2-checks.test.mjs) — importing must not boot the servers.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  main().catch((e) => {
    console.error("L2 harness crashed:", e?.stack || e);
    process.exitCode = 1;
  });
}
