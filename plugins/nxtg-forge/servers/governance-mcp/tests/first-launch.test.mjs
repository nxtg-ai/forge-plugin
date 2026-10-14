// First launch after a fresh plugin install (DIRECTIVE-NXTG-20261014-01). No model, no credential, no network.
//
// Claude Code lists a plugin MCP server as `pending`, without its tools, when the server has not answered
// initialize within its startup window. Measured on Claude Code 2.1.299 (NXTG-AI, 2026-10-14) with a stdio
// server that delays its initialize reply: 1500 ms -> connected, 2000 ms -> pending (2 runs each). In the
// alpha outside re-run on CLX9, v3.13.0's start.sh ran `npm install` on first launch and the first session's
// init row said `governance-mcp: pending`.
//
// This test installs the plugin the way the marketplace does (the tracked files only, so no node_modules),
// with an empty HOME and an empty npm cache, and points npm at a local registry that accepts each request
// and never answers: a slow or cold npm, reproduced without the network. It then starts the launcher exactly
// as .mcp.json does and times initialize plus a tools/list that lists every forge_* governance tool.
// The red control runs v3.13.0's launcher (tests/fixtures/launcher-v3.13.0) under the same conditions.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, copyFileSync, existsSync, rmSync, chmodSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOLS } from '../index.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..', '..', '..');
const FIXTURE = join(HERE, 'fixtures', 'launcher-v3.13.0');
// Under the 1500 ms measured to still connect, with headroom for a slow CI runner.
const WINDOW_MS = 1000;
const GOVERNANCE_TOOLS = TOOLS.map((t) => t.name);

let root, registry, registryUrl;
const held = [];

// A fresh install: every tracked file of plugins/nxtg-forge, copied as the marketplace clone has it.
function freshInstall(dest) {
  const files = spawnSync('git', ['ls-files', '-z', 'plugins/nxtg-forge'], { cwd: REPO, encoding: 'utf8' }).stdout.split('\0').filter(Boolean);
  for (const f of files) {
    const to = join(dest, f.slice('plugins/nxtg-forge/'.length));
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(join(REPO, f), to);
    chmodSync(to, statSync(join(REPO, f)).mode);
  }
  return dest;
}

// Start <plugin>/servers/governance-mcp/start.sh as .mcp.json does and time the handshake.
function firstLaunch(plugin, waitMs) {
  const home = mkdtempSync(join(root, 'home-'));
  const proj = mkdtempSync(join(root, 'proj-'));
  const env = {
    PATH: process.env.PATH,
    HOME: home,
    npm_config_cache: join(home, '.npm'),
    npm_config_registry: registryUrl,
    npm_config_userconfig: join(home, '.npmrc'),
    npm_config_update_notifier: 'false',
    FORGE_PROJECT_ROOT: proj,
  };
  const start = Date.now();
  const child = spawn('bash', [join(plugin, 'servers', 'governance-mcp', 'start.sh')], { cwd: proj, env, stdio: ['pipe', 'pipe', 'pipe'], detached: true });
  const r = { initMs: null, toolsMs: null, tools: [], stdout: '', stderr: '' };
  return new Promise((done) => {
    const finish = () => {
      clearTimeout(timer);
      try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
      r.nodeModules = existsSync(join(plugin, 'servers', 'governance-mcp', 'node_modules'));
      done(r);
    };
    const timer = setTimeout(finish, waitMs);
    child.stderr.on('data', (d) => { r.stderr += d; });
    child.stdout.on('data', (d) => {
      r.stdout += d;
      for (const line of r.stdout.split('\n').slice(0, -1)) {
        let m; try { m = JSON.parse(line); } catch { continue; }
        if (m.id === 0 && m.result && r.initMs === null) {
          r.initMs = Date.now() - start;
          child.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n');
        }
        if (m.id === 1 && r.toolsMs === null) {
          r.toolsMs = Date.now() - start;
          r.tools = (m.result?.tools ?? []).map((t) => t.name);
          finish();
        }
      }
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'first-launch-test', version: '1' } } })}\n`);
  });
}

const connectedInWindow = (r) => r.toolsMs !== null && r.toolsMs <= WINDOW_MS && GOVERNANCE_TOOLS.every((t) => r.tools.includes(t));
const describeRun = (r) => `initialize ${r.initMs ?? 'none'} ms, tools/list ${r.toolsMs ?? 'none'} ms, ${r.tools.length} tools, node_modules=${r.nodeModules}; stderr: ${r.stderr.trim().slice(0, 200)}`;

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), 'forge-first-launch-'));
  // Accepts every request and never answers, like a registry that is slow or unreachable mid-install.
  registry = createServer((req) => { held.push(req); });
  registry.on('connection', (s) => held.push(s));
  await new Promise((ok) => registry.listen(0, '127.0.0.1', ok));
  registryUrl = `http://127.0.0.1:${registry.address().port}/`;
});
afterAll(async () => {
  for (const h of held) h.destroy?.();
  await new Promise((ok) => registry.close(ok));
  rmSync(root, { recursive: true, force: true });
});

describe('governance-mcp first launch after a fresh install (cold npm cache, slow registry)', () => {
  it('answers initialize and lists every forge_* governance tool inside the startup window, with no npm install', async () => {
    const plugin = freshInstall(join(root, 'plugin'));
    expect(existsSync(join(plugin, 'servers', 'governance-mcp', 'node_modules'))).toBe(false);
    const r = await firstLaunch(plugin, 5000);
    expect(connectedInWindow(r), describeRun(r)).toBe(true);
    expect(r.tools).toEqual(GOVERNANCE_TOOLS);
    expect(r.nodeModules, 'the launcher must not install packages').toBe(false);
    expect(r.stderr).not.toMatch(/Installing dependencies/);
  }, 15000);

  it('red control: v3.13.0\'s launcher (first-run npm install) misses the window under the same conditions', async () => {
    const plugin = freshInstall(join(root, 'plugin-v3.13.0'));
    for (const f of ['start.sh', 'package.json']) copyFileSync(join(FIXTURE, f), join(plugin, 'servers', 'governance-mcp', f));
    const r = await firstLaunch(plugin, WINDOW_MS + 1500);
    expect(connectedInWindow(r), describeRun(r)).toBe(false);
    expect(r.tools, describeRun(r)).toEqual([]);
  }, 15000);

  it('the server has no runtime dependencies and start.sh never runs npm', async () => {
    const pkg = JSON.parse((await import('node:fs')).readFileSync(join(HERE, '..', 'package.json'), 'utf8'));
    expect(pkg.dependencies ?? {}).toEqual({});
    const sh = (await import('node:fs')).readFileSync(join(HERE, '..', 'start.sh'), 'utf8');
    expect(sh.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n')).not.toMatch(/\bnpm\b/);
  });
});
