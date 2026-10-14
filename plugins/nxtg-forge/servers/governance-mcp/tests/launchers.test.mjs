// Launcher contract for the plugin's three MCP servers on a clean machine (alpha run 1, F-A to F-D).
// A launcher whose runtime is missing must complete the MCP handshake through the stand-in,
// never exit: Claude Code caches a failed start for 15 minutes.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    writeFileSync(fake, '#!/usr/bin/env bash\necho "fake-forge args=$*"\n');
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
    writeFileSync(custom, '#!/usr/bin/env bash\necho custom\n');
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
    expect(r.lines[1].result.instructions).toContain('exit code 1');
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
});

describe('governance-mcp launcher', () => {
  it('without node: stand-in that names Node.js 20 (F-A)', () => {
    const r = run(GOV);
    expectStandIn(r, 'governance-mcp', 'Node.js 20 or newer');
  });

  it('with node older than 20: stand-in that names the version found', () => {
    const old = join(root, 'oldnode');
    mkdirSync(old);
    writeFileSync(join(old, 'node'), '#!/usr/bin/env bash\necho 18.19.1\n');
    chmodSync(join(old, 'node'), 0o755);
    const r = run(GOV, [], undefined, { PATH: `${old}:${bin}` });
    expectStandIn(r, 'governance-mcp', 'this machine has 18.19.1');
  });
});
