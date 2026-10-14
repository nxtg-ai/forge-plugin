// Launcher contract for the plugin's three MCP servers on a clean machine (alpha run 1, F-A to F-D).
// A launcher whose runtime is missing must complete the MCP handshake through the stand-in,
// never exit: Claude Code caches a failed start for 15 minutes.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, chmodSync, readFileSync, openSync, writeSync, closeSync } from 'node:fs';
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
  // mktemp and sleep: find-forge's bounded --version probe (coreutils, like dirname).
  for (const tool of ['bash', 'dirname', 'cat', 'id', 'rm', 'mktemp', 'sleep']) symlinkSync(which(tool), join(bin, tool));
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

// DIRECTIVE-NXTG-20261014-11 part 4: with uv present, `uvx semgrep-mcp` dies at import
// (pydantic ImportError, rc=1) before it answers, and Claude Code shows "MCP server failed".
// The launcher must notice an upstream that exits before its first stdout line and replay
// what the client already sent to the stand-in, so nothing is lost and nothing fails.
describe('semgrep-mcp launcher with an upstream that exits early', () => {
  const DISCOVER = '{"jsonrpc":"2.0","id":"server-discover-probe-1","method":"server/discover","params":{}}';
  const IMPORT_ERROR =
    "ImportError: cannot import name 'eval_type_backport' from 'pydantic._internal._typing_extra'";
  const SLEEP = which('sleep');

  // A directory holding one fake executable, put first on the PATH.
  function fake(name, body) {
    const dir = mkdtempSync(join(root, 'fake-'));
    writeFileSync(join(dir, name), `#!/usr/bin/env bash\n${body}\n`);
    chmodSync(join(dir, name), 0o755);
    return { PATH: `${dir}:${bin}` };
  }
  const crashingUvx = () =>
    fake('uvx', `echo "Traceback (most recent call last):" >&2\necho "${IMPORT_ERROR}" >&2\nexit 1`);

  // Drive the launcher the way Claude Code does: stdin stays open between frames.
  // steps: { send: [lines] } | { lines: n } (wait until n stdout lines) | { end: true }.
  function drive(env, steps, timeoutMs = 10000) {
    return new Promise((resolvePromise, reject) => {
      const child = spawn(which('bash'), [SEMGREP], { env: { HOME: home, ...env } });
      let out = '';
      let err = '';
      let waiter = null;
      const parsed = () => out.split('\n').filter(Boolean).map((l) => JSON.parse(l));
      const check = () => {
        if (waiter && parsed().length >= waiter.n) {
          const w = waiter;
          waiter = null;
          w.done();
        }
      };
      child.stdout.on('data', (d) => {
        out += d;
        check();
      });
      child.stderr.on('data', (d) => (err += d));
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`timed out; stdout=${out} stderr=${err}`));
      }, timeoutMs);
      child.on('close', (status) => {
        clearTimeout(timer);
        resolvePromise({ status, lines: parsed(), stderr: err, stdout: out });
      });
      (async () => {
        for (const step of steps) {
          if (step.send) child.stdin.write(step.send.join('\n') + '\n');
          if (step.lines) await new Promise((done) => ((waiter = { n: step.lines, done }), check()));
          if (step.end) child.stdin.end();
        }
      })();
    });
  }

  it('upstream crashes at import (frames sent at once, stdin closed): stand-in answers, exit 0', () => {
    const r = run(SEMGREP, [], undefined, crashingUvx());
    expectStandIn(r, 'semgrep-mcp', 'semgrep-mcp exited at startup');
    expect(r.lines[0].result.instructions).toContain('uvx --refresh semgrep-mcp');
    expect(r.stderr).toContain(IMPORT_ERROR); // upstream's own error still reaches the log
  });

  it('upstream crashes at import, stdin open like Claude Code: discover -32601, initialize, empty tools, exit 0 at EOF', async () => {
    const r = await drive(crashingUvx(), [
      { send: [DISCOVER, INIT] },
      { lines: 2 },
      { send: [INITIALIZED, LIST] },
      { lines: 3 },
      { end: true },
    ]);
    expect(r.status).toBe(0);
    const [discover, init, list] = r.lines;
    expect(discover.id).toBe('server-discover-probe-1');
    expect(discover.error.code).toBe(-32601);
    expect(init.id).toBe(0);
    expect(init.result.protocolVersion).toBe('2025-06-18');
    expect(init.result.serverInfo).toEqual({ name: 'semgrep-mcp', version: 'unavailable' });
    expect(init.result.instructions).toMatch(/^semgrep-mcp is not running\. semgrep-mcp exited at startup/);
    expect(list).toEqual({ jsonrpc: '2.0', id: 'a1', result: { tools: [] } });
    expect(r.lines).toHaveLength(3);
  });

  it('upstream sleeps 1 s, then exits 1 before answering: frames sent meanwhile are replayed to the stand-in', async () => {
    const env = fake('uvx', `${SLEEP} 1\necho "${IMPORT_ERROR}" >&2\nexit 1`);
    const r = await drive(env, [{ send: [DISCOVER, INIT] }, { lines: 2 }, { send: [LIST] }, { lines: 3 }, { end: true }]);
    expect(r.status).toBe(0);
    expect(r.lines.map((l) => l.id)).toEqual(['server-discover-probe-1', 0, 'a1']);
    expect(r.lines[1].result.instructions).toContain('semgrep-mcp exited at startup');
    expect(r.stderr).toContain('[semgrep-mcp] upstream exited with code 1');
    expect(r.lines[2].result.tools).toEqual([]);
  });

  it('a semgrep-mcp on the PATH that crashes also falls back, with a pip hint', () => {
    const r = run(SEMGREP, [], undefined, fake('semgrep-mcp', `echo "${IMPORT_ERROR}" >&2\nexit 1`));
    expectStandIn(r, 'semgrep-mcp', 'pip install --upgrade semgrep-mcp');
  });

  it('green path: a working upstream is relayed unchanged and the fallback does not engage', async () => {
    // The fake upstream is a real MCP responder under a distinctive name.
    const env = fake('uvx', `exec bash "${STANDIN}" semgrep-upstream-live "fake upstream"`);
    const steps = [{ send: [DISCOVER, INIT] }, { lines: 2 }, { send: [INITIALIZED, LIST, CALL] }, { lines: 4 }, { end: true }];
    const viaLauncher = await drive(env, steps);
    const direct = spawnSync(which('bash'), [STANDIN, 'semgrep-upstream-live', 'fake upstream'], {
      input: [DISCOVER, INIT, INITIALIZED, LIST, CALL].join('\n') + '\n',
      encoding: 'utf8',
      env: { HOME: home, PATH: bin },
    });
    expect(viaLauncher.status).toBe(0);
    expect(viaLauncher.stdout).toBe(direct.stdout); // byte-for-byte passthrough
    expect(viaLauncher.lines[1].result.serverInfo.name).toBe('semgrep-upstream-live');
    expect(viaLauncher.stdout).not.toContain('exited at startup');
    expect(viaLauncher.stderr).not.toContain('[semgrep-mcp] not started');
  });

  it('upstream answers, then exits mid-session with stdin still open: no fallback, the launcher exits with it', async () => {
    const env = fake(
      'uvx',
      [
        'IFS= read -r l',
        `echo '{"jsonrpc":"2.0","id":"server-discover-probe-1","error":{"code":-32601,"message":"nope"}}'`,
        'IFS= read -r l',
        `echo '{"jsonrpc":"2.0","id":0,"result":{"protocolVersion":"2025-06-18","capabilities":{},"serverInfo":{"name":"short-lived","version":"1"}}}'`,
        'exit 0',
      ].join('\n'),
    );
    // No { end } step: the launcher must exit on its own once the upstream is gone.
    const r = await drive(env, [{ send: [DISCOVER, INIT] }, { lines: 2 }]);
    expect(r.status).toBe(0);
    expect(r.lines).toHaveLength(2);
    expect(r.lines[1].result.serverInfo.name).toBe('short-lived');
    expect(r.stderr).not.toContain('[semgrep-mcp] not started');
  });

  // PR #92 review M-1: SIGTERM to the launcher must end it and every process under it, whether
  // the upstream answered (relay phase) or the stand-in is serving. Claude Code may stop a
  // server this way without closing its stdin first.
  const liveProcs = () => {
    const rows = spawnSync('ps', ['-e', '-o', 'pid=,ppid=,stat='], { encoding: 'utf8' }).stdout;
    return rows
      .split('\n')
      .map((l) => l.trim().split(/\s+/))
      .filter((f) => f.length === 3 && !f[2].startsWith('Z'))
      .map(([pid, ppid]) => ({ pid: Number(pid), ppid: Number(ppid) }));
  };
  const treeOf = (root) => {
    const procs = liveProcs();
    const tree = new Set([root]);
    for (let grew = true; grew; ) {
      grew = false;
      for (const p of procs) if (tree.has(p.ppid) && !tree.has(p.pid)) (tree.add(p.pid), (grew = true));
    }
    return [...tree];
  };
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));

  async function sigtermLeavesNothing(env) {
    // stdin is a FIFO this test holds open (O_RDWR), so it stays open after the launcher dies,
    // as Claude Code's pipe would; node would close a 'pipe' stdin on exit and hide orphans.
    const fifo = join(mkdtempSync(join(root, 'fifo-')), 'stdin');
    expect(spawnSync('mkfifo', [fifo]).status).toBe(0);
    const fd = openSync(fifo, 'r+');
    const child = spawn(which('bash'), [SEMGREP], { env: { HOME: home, ...env }, stdio: [fd, 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    writeSync(fd, [DISCOVER, INIT].join('\n') + '\n');
    for (let i = 0; i < 50 && out.split('\n').filter(Boolean).length < 2; i++) await pause(100);
    expect(out.split('\n').filter(Boolean)).toHaveLength(2); // the phase under test is reached
    await pause(300);
    const tree = treeOf(child.pid);
    expect(tree.length).toBeGreaterThan(1);
    const closed = new Promise((r) => child.on('close', r));
    child.kill('SIGTERM');
    await Promise.race([closed, pause(2000)]);
    await pause(200);
    const alive = new Set(liveProcs().map((p) => p.pid));
    const survivors = tree.filter((pid) => alive.has(pid));
    for (const pid of survivors) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
    closeSync(fd);
    return { tree, survivors, exited: child.exitCode !== null || child.signalCode !== null };
  }

  it('SIGTERM in the relay phase (upstream answered and keeps running) ends the launcher and all its children', async () => {
    const env = fake(
      'uvx',
      [
        'IFS= read -r l',
        `echo '{"jsonrpc":"2.0","id":"server-discover-probe-1","error":{"code":-32601,"message":"nope"}}'`,
        'IFS= read -r l',
        `echo '{"jsonrpc":"2.0","id":0,"result":{"protocolVersion":"2025-06-18","capabilities":{},"serverInfo":{"name":"hang-upstream","version":"1"}}}'`,
        `${SLEEP} 600`,
      ].join('\n'),
    );
    const r = await sigtermLeavesNothing(env);
    expect(r.exited).toBe(true);
    expect(r.survivors).toEqual([]);
  });

  it('SIGTERM in the stand-in phase (upstream crashed) ends the launcher and all its children', async () => {
    const r = await sigtermLeavesNothing(crashingUvx());
    expect(r.exited).toBe(true);
    expect(r.survivors).toEqual([]);
  });
});

// PR #92 review L-1 (made blocking): .mcp.json runs plain `bash`, which on macOS is /bin/bash
// 3.2: no coproc, no {fd} allocation, no fractional `read -t`. The same portable checks run
// with this machine's bash and, when the official `bash:3.2` image is present, under real bash
// 3.2 in docker (pull it with `docker pull bash:3.2`; CI skips it when the image is absent).
describe('semgrep-mcp launcher, portable checks (tests/fixtures/semgrep-guard-check.sh)', () => {
  const CHECK = join(SERVERS, 'governance-mcp', 'tests', 'fixtures', 'semgrep-guard-check.sh');
  const hasBash32 =
    spawnSync('docker', ['image', 'inspect', 'bash:3.2'], { stdio: 'ignore', timeout: 10000 }).status === 0;
  const expectAllPass = (r) => {
    expect(r.stdout).toMatch(/^bash \d/m);
    for (const name of [
      'crash-stdin-open',
      'crash-stdin-closed',
      'slow-crash-replay',
      'green-path-relay',
      'sigterm-green-phase',
      'sigterm-standin-phase',
    ]) {
      expect(r.stdout).toMatch(new RegExp(`^PASS ${name}`, 'm'));
    }
    expect(r.stdout).not.toMatch(/^FAIL/m);
    expect(r.status).toBe(0);
  };

  it("pass under this machine's bash", () => {
    const r = spawnSync(which('bash'), [CHECK, SEMGREP, STANDIN], { encoding: 'utf8', timeout: 60000 });
    expectAllPass(r);
  });

  it.skipIf(!hasBash32)('pass under real bash 3.2 (docker image bash:3.2, stock macOS /bin/bash)', () => {
    const r = spawnSync(
      'docker',
      ['run', '--rm', '-v', `${SERVERS}:${SERVERS}:ro`, 'bash:3.2', 'bash', CHECK, SEMGREP, STANDIN],
      { encoding: 'utf8', timeout: 90000 },
    );
    expect(r.stdout).toMatch(/^bash 3\.2\./m);
    expectAllPass(r);
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
