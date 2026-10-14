// Launcher contract for the plugin's three MCP servers on a clean machine (alpha run 1, F-A to F-D).
// A launcher whose runtime is missing must complete the MCP handshake through the stand-in,
// never exit: Claude Code caches a failed start for 15 minutes.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, chmodSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nodeVersionReason } from '../index.mjs';

const SERVERS = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STANDIN = join(SERVERS, 'lib', 'unavailable-mcp.sh');
const FIND_FORGE = join(SERVERS, 'lib', 'find-forge.sh');
const ORCH = join(SERVERS, 'orchestrator-mcp', 'start.sh');
const SEMGREP = join(SERVERS, 'semgrep-mcp', 'start.sh');
const GOV = join(SERVERS, 'governance-mcp', 'start.sh');

const which = (cmd) => spawnSync('bash', ['-c', `command -v ${cmd}`], { encoding: 'utf8' }).stdout.trim();

const INIT = '{"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}},"jsonrpc":"2.0","id":0}';
const INITIALIZED = '{"method":"notifications/initialized","jsonrpc":"2.0"}';
const LIST = '{"method":"tools/list","jsonrpc":"2.0","id":"a1"}';
const CALL = '{"method":"tools/call","params":{"name":"forge_get_tasks"},"jsonrpc":"2.0","id":7}';

let root, home, bin;

// A PATH with bash and the few tools the launchers use, and nothing else: no node, npm, forge, uvx.
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'forge-launchers-'));
  home = join(root, 'home');
  bin = join(root, 'bin');
  mkdirSync(home);
  mkdirSync(bin);
  for (const tool of ['bash', 'dirname', 'cat', 'id', 'rm']) symlinkSync(which(tool), join(bin, tool));
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

function run(script, args = [], input = [INIT, INITIALIZED, LIST, CALL].join('\n') + '\n', env = {}) {
  const r = spawnSync(which('bash'), [script, ...args], {
    input,
    encoding: 'utf8',
    timeout: 10000,
    env: { HOME: home, PATH: bin, ...env },
  });
  const lines = r.stdout.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return { ...r, lines };
}

function expectStandIn(r, name, needle) {
  expect(r.status).toBe(0); // exits only at stdin EOF, never during startup
  expect(r.lines).toHaveLength(3); // the notification gets no reply
  const [init, list, call] = r.lines;
  expect(init.id).toBe(0);
  expect(init.result.protocolVersion).toBe('2025-06-18');
  expect(init.result.serverInfo).toEqual({ name, version: 'unavailable' });
  expect(init.result.instructions).toContain(needle);
  expect(list).toEqual({ jsonrpc: '2.0', id: 'a1', result: { tools: [] } });
  expect(call.id).toBe(7);
  expect(call.error.code).toBe(-32601);
  expect(r.stderr).toContain(`[${name}] not started:`);
}

describe('unavailable-mcp.sh stand-in', () => {
  it('answers the handshake with no tools and the reason, and escapes it as JSON', () => {
    const r = run(STANDIN, ['demo-mcp', 'needs "X" \\ here']);
    expectStandIn(r, 'demo-mcp', 'needs "X" \\ here');
  });

  it('answers ping, and ignores blank lines', () => {
    const r = run(STANDIN, ['demo-mcp', 'r'], '\n{"jsonrpc":"2.0","id":3,"method":"ping"}\n');
    expect(r.lines).toEqual([{ jsonrpc: '2.0', id: 3, result: {} }]);
  });
});

describe('orchestrator-mcp launcher', () => {
  it('without forge: stand-in that names the installer, not a failed start', () => {
    const r = run(ORCH);
    expectStandIn(r, 'orchestrator-mcp', 'curl -fsSL https://forge.nxtg.ai/install.sh | sh');
  });

  it('finds forge in ~/.local/bin when it is not on the PATH (F-C)', () => {
    const local = join(home, '.local', 'bin');
    mkdirSync(local, { recursive: true });
    const fake = join(local, 'forge');
    // It identifies as NXTG forge (find-forge launches nothing else since -12's fix pass).
    writeFileSync(fake, '#!/usr/bin/env bash\n[ "$1" = --version ] && { echo "forge 1.7.0"; exit 0; }\necho "fake-forge args=$*"\n');
    chmodSync(fake, 0o755);
    try {
      const found = spawnSync(which('bash'), [FIND_FORGE], { encoding: 'utf8', env: { HOME: home, PATH: bin } });
      expect(found.status).toBe(0);
      expect(found.stdout.trim()).toBe(fake);
      const r = spawnSync(which('bash'), [ORCH], { encoding: 'utf8', input: '', env: { HOME: home, PATH: bin } });
      expect(r.stdout.trim()).toBe('fake-forge args=mcp');
    } finally {
      rmSync(fake);
    }
  });

  it('FORGE_BIN wins over everything else', () => {
    const custom = join(root, 'custom-forge');
    writeFileSync(custom, '#!/usr/bin/env bash\n[ "$1" = --version ] && { echo "forge 1.7.0"; exit 0; }\necho custom\n');
    chmodSync(custom, 0o755);
    const found = spawnSync(which('bash'), [FIND_FORGE], { encoding: 'utf8', env: { HOME: home, PATH: bin, FORGE_BIN: custom } });
    expect(found.stdout.trim()).toBe(custom);
  });

  it('find-forge exits 1 and prints nothing when forge is absent', () => {
    const found = spawnSync(which('bash'), [FIND_FORGE], { encoding: 'utf8', env: { HOME: home, PATH: bin } });
    expect(found.status).toBe(1);
    expect(found.stdout).toBe('');
  });
});

describe('semgrep-mcp launcher', () => {
  it('without semgrep-mcp or uvx: stand-in that names uv', () => {
    const r = run(SEMGREP);
    expectStandIn(r, 'semgrep-mcp', 'https://docs.astral.sh/uv/');
  });
});

describe('governance-mcp launcher', () => {
  it('without node: stand-in that names Node.js 20 (F-A)', () => {
    const r = run(GOV);
    expectStandIn(r, 'governance-mcp', 'Node.js 20 or newer');
  });

  // DIRECTIVE-NXTG-20261014-09 (L1): start.sh no longer starts a separate `node -p process.versions.node` probe;
  // index.mjs checks the version itself. These wrappers run the real node and log every start, and the
  // old-node one makes the real server see 18.19.1 (process.versions.node is configurable, so a preload
  // can set it), so the check that runs is the one in index.mjs.
  const nodeWrapper = (name, version) => {
    const dir = join(root, name);
    mkdirSync(dir);
    const log = join(dir, 'starts.log');
    const spoof = version ? ` --import 'data:text/javascript,Object.defineProperty(process.versions,"node",{value:"${version}"})'` : '';
    writeFileSync(join(dir, 'node'), `#!/usr/bin/env bash\necho "$*" >> ${JSON.stringify(log)}\nexec ${JSON.stringify(process.execPath)}${spoof} "$@"\n`);
    chmodSync(join(dir, 'node'), 0o755);
    return { dir, starts: () => readFileSync(log, 'utf8').split('\n').filter(Boolean) };
  };

  it('with node older than 20: stand-in that names the version found, decided inside the one node process', () => {
    const old = nodeWrapper('oldnode', '18.19.1');
    const r = run(GOV, [], undefined, { PATH: `${old.dir}:${bin}` });
    expectStandIn(r, 'governance-mcp', 'this machine has 18.19.1');
    expect(r.lines[0].result.instructions).toContain('Node.js 20 or newer');
    expect(old.starts()).toEqual(['index.mjs']);
  });

  it('with node 20 or newer: node starts once (no separate version probe) and serves all 8 tools', () => {
    const cur = nodeWrapper('curnode');
    const r = run(GOV, [], [INIT, INITIALIZED, LIST].join('\n') + '\n', { PATH: `${cur.dir}:${bin}` });
    expect(r.status).toBe(0);
    expect(r.lines[0].result.serverInfo.name).toBe('forge-governance');
    expect(r.lines[1].result.tools).toHaveLength(8);
    expect(cur.starts()).toEqual(['index.mjs']);
  });

  it('start.sh has no node version probe of its own', () => {
    const sh = readFileSync(GOV, 'utf8').split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
    expect(sh).not.toMatch(/versions\.node/);
    expect(sh).not.toMatch(/node\s+-(p|e)\b/);
    expect(sh).toMatch(/command -v node/);
  });

  it('nodeVersionReason: Node 20.0 and newer pass; older (or unparsable) versions get the stand-in reason naming them', () => {
    for (const v of ['20.0.0', '20.10.0', '22.21.1', '24.1.0']) expect(nodeVersionReason(v), v).toBeNull();
    expect(nodeVersionReason('18.19.1')).toContain('Node.js 20 or newer; this machine has 18.19.1');
    expect(nodeVersionReason('16.20.2')).toContain('this machine has 16.20.2');
    expect(nodeVersionReason('garbage')).toContain('this machine has garbage');
  });
});
