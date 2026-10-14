// The /nxtg-forge:status orchestrator line is decided by code (DIRECTIVE-NXTG-20261013-20, alpha run 4 F-N).
// In run 4 the model received "Forge is not initialized…" from a connected orchestrator and printed the
// "Not connected" line. These tests feed recorded tool results (the exact run-4 text, and replies recorded
// from the published forge 1.6.3) to scripts/orchestrator-status.mjs, with no model in the loop.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { classify, toolResult, LINES } from '../../../scripts/orchestrator-status.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = resolve(HERE, '..', '..', '..');
const SCRIPT = join(PLUGIN, 'scripts', 'orchestrator-status.mjs');
const FX = JSON.parse(readFileSync(join(HERE, 'fixtures', 'orchestrator-status.json'), 'utf8'));
const read = (p) => readFileSync(join(PLUGIN, p), 'utf8').replace(/\r\n/g, '\n');

// The exact lines a user sees. They live in the script only; status.md prints what the script prints.
const EXPECT = {
  not_installed: '○ **Not connected** — add multi-agent orchestration: `curl -fsSL https://forge.nxtg.ai/install.sh | sh`, then start a new Claude Code session',
  not_initialized: '◐ **Connected; not initialized here** — run `forge init` in this project',
  connected: '● **Connected**',
};

let tmp;
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), 'orch-status-')); });
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

// Each state from recorded tool results, through a given classify(). Throws on any wrong line.
function stateChecks(classifyFn, toolResultFn) {
  const run4 = classifyFn({ tools: FX.run4.orchestrator_tools, getState: FX.run4.forge_get_state });
  expect(run4).toEqual({ state: 'not_initialized', line: EXPECT.not_initialized });
  const rec = classifyFn({ tools: FX.run4.orchestrator_tools, getState: toolResultFn(FX.forge_1_6_3.not_initialized_reply) });
  expect(rec).toEqual({ state: 'not_initialized', line: EXPECT.not_initialized });
  const conn = classifyFn({ tools: FX.run4.orchestrator_tools, getState: toolResultFn(FX.forge_1_6_3.connected_reply) });
  expect(conn).toEqual({ state: 'connected', line: EXPECT.connected });
  expect(classifyFn({ tools: [], getState: null })).toEqual({ state: 'not_installed', line: EXPECT.not_installed });
}

// A fake orchestrator server: answers initialize, tools/list (the run-4 names) and forge_get_state with a
// recorded reply. Written as a launcher script so the probe starts it exactly as it starts start.sh.
function fakeLauncher(name, stateReply, tools = FX.run4.orchestrator_tools) {
  const server = join(tmp, `${name}.mjs`);
  writeFileSync(server, `
import { createInterface } from 'node:readline';
const tools = ${JSON.stringify(tools)}.map((n) => ({ name: n, inputSchema: { type: 'object' } }));
const reply = ${JSON.stringify(stateReply)};
createInterface({ input: process.stdin }).on('line', (l) => {
  const m = JSON.parse(l);
  if (m.id === undefined) return;
  const out = (result) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, result }) + '\\n');
  if (m.method === 'initialize') out({ protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'fake', version: '0' } });
  else if (m.method === 'tools/list') out({ tools });
  else if (m.method === 'tools/call') process.stdout.write(JSON.stringify({ ...reply, id: m.id }) + '\\n');
});`);
  const launcher = join(tmp, `${name}.sh`);
  writeFileSync(launcher, `exec node ${JSON.stringify(server)}\n`);
  return launcher;
}
function runScript(launcher) {
  const r = spawnSync('node', [SCRIPT, '--project', tmp], { encoding: 'utf8', env: { ...process.env, FORGE_ORCHESTRATOR_LAUNCHER: launcher }, timeout: 20000 });
  expect(r.status).toBe(0);
  return Object.fromEntries(r.stdout.trim().split('\n').map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
}

describe('orchestrator line: computed by code from tool results', () => {
  it('recorded results map to the exact line for every state (run 4 included)', () => stateChecks(classify, toolResult));

  it('the run-4 tool result is the one the fixture records', () => {
    expect(FX.run4.orchestrator_tools).toHaveLength(11);
    expect(FX.run4.orchestrator_tools).toContain('forge_get_state');
    expect(FX.run4.forge_get_state).toEqual({ isError: true, text: 'Forge is not initialized. Run `forge init` in this project first.' });
  });

  it('any other forge_get_state failure is an error line, never "Not connected"', () => {
    const e = classify({ tools: ['forge_get_state'], getState: { isError: true, text: 'state.json: permission denied\nmore' } });
    expect(e).toEqual({ state: 'error', line: `${LINES.error}state.json: permission denied` });
    expect(classify({ tools: ['forge_get_state'], getState: null }).state).toBe('error');
    expect(toolResult({ error: { code: -32603, message: 'Forge is not initialized.' } })).toEqual({ isError: true, text: 'Forge is not initialized.' });
  });

  it('end to end, no model: the script probes a server and prints the line', () => {
    expect(runScript(fakeLauncher('notinit', FX.forge_1_6_3.not_initialized_reply))).toEqual({ orchestrator: 'not_initialized', line: EXPECT.not_initialized });
    expect(runScript(fakeLauncher('conn', FX.forge_1_6_3.connected_reply))).toEqual({ orchestrator: 'connected', line: EXPECT.connected });
  });

  it("end to end: the plugin's real stand-in (forge not installed) and a missing launcher print the not-installed line", () => {
    const standin = join(tmp, 'standin.sh');
    writeFileSync(standin, `exec bash ${JSON.stringify(join(PLUGIN, 'servers', 'lib', 'unavailable-mcp.sh'))} orchestrator-mcp "not installed"\n`);
    expect(runScript(standin)).toEqual({ orchestrator: 'not_installed', line: EXPECT.not_installed });
    expect(runScript(join(tmp, 'missing.sh'))).toEqual({ orchestrator: 'not_installed', line: EXPECT.not_installed });
  });

  it.each(['commands/status.md', 'commands/status-enhanced.md'])('%s runs the script and prints its line; it holds no state mapping of its own', (f) => {
    const md = read(f);
    expect(md).toContain('!`node "${CLAUDE_PLUGIN_ROOT}/scripts/orchestrator-status.mjs"`');
    expect(md).toMatch(/^allowed-tools: Bash\(node:\*\)$/m);
    expect(md).toMatch(/do not decide the (orchestrator's )?state yourself/);
    for (const line of Object.values(EXPECT)) expect(md).not.toContain(line);
    expect(md).not.toMatch(/never call it "Not connected"|note "Orchestrator: not connected"/);
  });

  it('status --json takes "orchestrator" from the computed value', () => {
    expect(read('commands/status.md')).toContain('Include `"orchestrator"` set to the computed `orchestrator=` value');
  });

  it('mutant: mapping "not initialized" to not_installed turns the state checks red', async () => {
    const src = readFileSync(SCRIPT, 'utf8');
    const from = "if (NOT_INITIALIZED.test(text)) return { state: 'not_initialized', line: LINES.not_initialized };";
    expect(src.split(from).length - 1).toBe(1);
    const m = join(tmp, 'mutant.mjs');
    writeFileSync(m, src.replace(from, "if (NOT_INITIALIZED.test(text)) return { state: 'not_installed', line: LINES.not_installed };"));
    const mod = await import(pathToFileURL(m).href);
    expect(() => stateChecks(mod.classify, mod.toolResult)).toThrow(/not_initialized|not initialized here/);
  });
});
