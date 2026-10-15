// tools/call validates its params before any tool runs (DIRECTIVE-NXTG-20261014-09, M1), and a frame that is
// not JSON-RPC 2.0 is rejected (L2). v3.13.0 got both from the MCP SDK; v3.13.1's hand-rolled loop checked only
// the tool name, so `arguments: "invalid"` ran the project's tests and wrote a dashboard file (codex review of
// eb5499d). Each malformed call here must return -32602 AND leave no trace of a tool having run; a valid call
// is the positive control that the trace is observable.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleMessage } from '../index.mjs';

const SERVER_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MALFORMED = [['a string', 'invalid'], ['an array', []], ['null', null], ['a number', 7]];

let root, proj, dashDir, receipt, savedEnv;

// A project whose test runner leaves a receipt when it runs: a real executable at node_modules/.bin/vitest,
// which forge_run_tests detects and runs through npx. Dashboards are written to os.tmpdir(), which reads
// TMPDIR on every call, so pointing TMPDIR at an empty dir makes forge_open_dashboard's write observable.
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'forge-params-'));
  proj = join(root, 'proj');
  dashDir = join(root, 'dash');
  receipt = join(root, 'tests-ran.txt');
  mkdirSync(join(proj, 'node_modules', '.bin'), { recursive: true });
  mkdirSync(dashDir);
  writeFileSync(join(proj, 'package.json'), JSON.stringify({ name: 'params-fixture', version: '1.0.0' }));
  const runner = join(proj, 'node_modules', '.bin', 'vitest');
  writeFileSync(runner, `#!/usr/bin/env bash\necho ran > ${JSON.stringify(receipt)}\necho '{"numPassedTests":1,"numFailedTests":0,"numTotalTests":1,"success":true}'\n`);
  chmodSync(runner, 0o755);
  savedEnv = { root: process.env.FORGE_PROJECT_ROOT, tmp: process.env.TMPDIR };
  process.env.FORGE_PROJECT_ROOT = proj;
  process.env.TMPDIR = dashDir;
});
afterAll(() => {
  if (savedEnv.root === undefined) delete process.env.FORGE_PROJECT_ROOT; else process.env.FORGE_PROJECT_ROOT = savedEnv.root;
  if (savedEnv.tmp === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = savedEnv.tmp;
  rmSync(root, { recursive: true, force: true });
});
beforeEach(() => {
  rmSync(receipt, { force: true });
  for (const f of readdirSync(dashDir)) rmSync(join(dashDir, f), { recursive: true, force: true });
});

const dashboards = () => readdirSync(dashDir).filter((f) => f.startsWith('forge-dashboard-'));
const call = (id, params) => handleMessage({ jsonrpc: '2.0', id, method: 'tools/call', params });

describe('tools/call rejects malformed arguments before any tool runs (M1)', () => {
  for (const [what, args] of MALFORMED) {
    it(`arguments as ${what}: -32602, and neither forge_run_tests nor forge_open_dashboard ran`, async () => {
      const tests = await call(1, { name: 'forge_run_tests', arguments: args });
      const dash = await call(2, { name: 'forge_open_dashboard', arguments: args });
      for (const [r, id] of [[tests, 1], [dash, 2]]) {
        expect(r.id).toBe(id);
        expect(r.result).toBeUndefined();
        expect(r.error.code).toBe(-32602);
        expect(r.error.message).toMatch(/arguments/);
      }
      expect(existsSync(receipt), 'the test runner ran').toBe(false);
      expect(dashboards(), 'a dashboard file was written').toEqual([]);
    });
  }

  it('positive control: with arguments {} or omitted, both tools run and leave their trace', async () => {
    const tests = await call(3, { name: 'forge_run_tests', arguments: {} });
    expect(tests.result.isError).toBeFalsy();
    expect(existsSync(receipt)).toBe(true);
    const dash = await call(4, { name: 'forge_open_dashboard' });
    expect(dash.result.isError).toBeFalsy();
    expect(dashboards()).toHaveLength(1);
  }, 30000);

  it('params that are not an object (array, string, null) are rejected with -32602', async () => {
    for (const params of [[], 'forge_list_checkpoints', null]) {
      const r = await call(5, params);
      expect(r.error?.code, JSON.stringify(params)).toBe(-32602);
    }
  });
});

describe('a frame that is not JSON-RPC 2.0 gets -32600 and is never dispatched (L2)', () => {
  it('missing jsonrpc, or jsonrpc "1.0": Invalid Request with the request id, and the tool did not run', async () => {
    const noVersion = await handleMessage({ id: 900, method: 'tools/call', params: { name: 'forge_run_tests', arguments: {} } });
    const v1 = await handleMessage({ jsonrpc: '1.0', id: 901, method: 'tools/call', params: { name: 'forge_open_dashboard', arguments: {} } });
    expect(noVersion).toEqual({ jsonrpc: '2.0', id: 900, error: { code: -32600, message: 'Invalid Request' } });
    expect(v1).toEqual({ jsonrpc: '2.0', id: 901, error: { code: -32600, message: 'Invalid Request' } });
    expect(existsSync(receipt)).toBe(false);
    expect(dashboards()).toEqual([]);
  });

  // #91 seat L-5: an object id made the frame look like a notification, so it got no reply and a client waiting
  // on it hung. An id that is not a string, number or null is an Invalid Request (JSON-RPC 2.0 section 4).
  it('an id that is an object, array or boolean gets -32600 with id null, and the tool did not run', async () => {
    const bad = { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } };
    expect(await handleMessage({ jsonrpc: '2.0', id: {}, method: 'ping' })).toEqual(bad);
    expect(await handleMessage({ jsonrpc: '2.0', id: [1], method: 'ping' })).toEqual(bad);
    expect(await handleMessage({ jsonrpc: '2.0', id: true, method: 'tools/call', params: { name: 'forge_run_tests', arguments: {} } })).toEqual(bad);
    expect(existsSync(receipt)).toBe(false);
    // Controls: a string or number id is answered; no id at all is a notification and gets no reply.
    expect(await handleMessage({ jsonrpc: '2.0', id: 'p', method: 'ping' })).toEqual({ jsonrpc: '2.0', id: 'p', result: {} });
    expect(await handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBeNull();
  });

  it('a non-2.0 notification also gets -32600, with id null', async () => {
    expect(await handleMessage({ method: 'notifications/initialized' })).toEqual({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } });
  });

  it('end to end through start.sh: both review frames are rejected and the loop keeps answering', async () => {
    const lines = [
      { id: 900, method: 'tools/call', params: { name: 'forge_list_checkpoints', arguments: {} } },
      { jsonrpc: '1.0', id: 901, method: 'tools/call', params: { name: 'forge_list_checkpoints', arguments: {} } },
      { jsonrpc: '2.0', id: 902, method: 'tools/call', params: { name: 'forge_list_checkpoints', arguments: 'invalid' } },
      { jsonrpc: '2.0', id: 903, method: 'ping' },
    ];
    const replies = await new Promise((done) => {
      const c = spawn('bash', [join(SERVER_DIR, 'start.sh')], { cwd: proj, env: { ...process.env, FORGE_PROJECT_ROOT: proj, FORGE_TEST_MODE: '' }, stdio: ['pipe', 'pipe', 'pipe'] });
      let out = '';
      c.stdout.on('data', (d) => { out += d; });
      c.on('close', () => done(out.split('\n').filter(Boolean).map((l) => JSON.parse(l))));
      c.stdin.end(lines.map((l) => JSON.stringify(l)).join('\n') + '\n');
    });
    const byId = (id) => replies.find((m) => m.id === id);
    expect(byId(900).error.code).toBe(-32600);
    expect(byId(901).error.code).toBe(-32600);
    expect(byId(902).error.code).toBe(-32602);
    expect(byId(903)).toEqual({ jsonrpc: '2.0', id: 903, result: {} });
  }, 15000);
});
