// Companion plugin nxtg-forge-orchestrator (DIRECTIVE-NXTG-20261014-12 Part P, EMMA-SOUL design C).
// C1 as registered says "orchestrator-mcp absent without error", so nxtg-forge no longer registers it.
// The companion registers it with today's launcher, stand-in fallback and project-root binding, and
// the session hook still tells Claude the orchestrator is optional and the one command that adds it.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, chmodSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..'); // plugins/nxtg-forge
const COMPANION = resolve(PLUGIN, '..', 'nxtg-forge-orchestrator');
const PRE_TASK = join(PLUGIN, 'hooks', 'scripts', 'pre-task.sh');
const rd = (p) => JSON.parse(readFileSync(p, 'utf8'));
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const INSTALLER = 'curl -fsSL https://forge.nxtg.ai/install.sh | sh';
const COMPANION_CMD = 'claude plugin install nxtg-forge-orchestrator@nxtg-forge';

// The orchestrator-mcp entry nxtg-forge registered up to v3.13.1; the companion carries it unchanged.
const ORCH_ENTRY = {
  type: 'stdio',
  command: 'bash',
  args: ['${CLAUDE_PLUGIN_ROOT}/servers/orchestrator-mcp/start.sh'],
  env: { FORGE_PROJECT_ROOT: '${CLAUDE_PROJECT_DIR}' },
  timeout: 10000,
};

describe('nxtg-forge registers no orchestrator-mcp (C1 as registered)', () => {
  it('.mcp.json has governance-mcp and semgrep-mcp only', () => {
    expect(Object.keys(rd(join(PLUGIN, '.mcp.json')).mcpServers).sort()).toEqual(['governance-mcp', 'semgrep-mcp']);
  });
});

describe('companion plugin nxtg-forge-orchestrator', () => {
  it('manifest: its own name, the same version and author as nxtg-forge', () => {
    const c = rd(join(COMPANION, '.claude-plugin', 'plugin.json'));
    const p = rd(join(PLUGIN, '.claude-plugin', 'plugin.json'));
    expect(c.name).toBe('nxtg-forge-orchestrator');
    expect(c.version).toBe(p.version);
    expect(c.author).toEqual(p.author);
    expect(c.description).toMatch(/public preview/);
  });

  it('.mcp.json registers exactly the orchestrator-mcp entry nxtg-forge used to, bound to the project root', () => {
    expect(rd(join(COMPANION, '.mcp.json'))).toEqual({ mcpServers: { 'orchestrator-mcp': ORCH_ENTRY } });
  });

  it('its launcher, find-forge and stand-in are byte copies of nxtg-forge\'s, and executable', () => {
    // Plugins are cached separately and cannot share files, so the companion vendors them; this keeps them equal.
    for (const f of ['servers/orchestrator-mcp/start.sh', 'servers/lib/find-forge.sh', 'servers/lib/unavailable-mcp.sh']) {
      expect(sha(join(COMPANION, f)), f).toBe(sha(join(PLUGIN, f)));
      expect(statSync(join(COMPANION, f)).mode & 0o111, f).not.toBe(0);
    }
  });

  it('without forge, the launcher completes the handshake as the stand-in that names the installer', () => {
    const home = mkdtempSync(join(tmpdir(), 'forge-companion-'));
    try {
      const init = '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}';
      const r = spawnSync('bash', [join(COMPANION, 'servers/orchestrator-mcp/start.sh')], {
        input: `${init}\n`, encoding: 'utf8', timeout: 10000, env: { HOME: home, PATH: '/usr/bin:/bin' },
      });
      expect(r.status).toBe(0);
      const reply = JSON.parse(r.stdout.split('\n')[0]);
      expect(reply.result.serverInfo).toEqual({ name: 'orchestrator-mcp', version: 'unavailable' });
      expect(reply.result.instructions).toContain(INSTALLER);
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------------------------------
// The session hint (pre-task.sh 5b, once per session): forge absent -> the installer; forge present but
// the companion not installed -> the one plugin command; both present -> no orchestrator line.
describe('session hint for the optional orchestrator', () => {
  let root, proj, bin, pathNoForge;
  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'forge-hint-'));
    proj = join(root, 'proj');
    mkdirSync(proj);
    bin = join(root, 'bin');
    mkdirSync(bin);
    const fake = join(bin, 'forge');
    writeFileSync(fake, '#!/usr/bin/env bash\necho fake\n');
    chmodSync(fake, 0o755);
    // The real PATH minus any directory holding a forge binary, so "forge absent" is true on a dev box too.
    pathNoForge = process.env.PATH.split(delimiter).filter((d) => {
      try { return !statSync(join(d, 'forge')).isFile(); } catch { return true; }
    }).join(delimiter);
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  // A Claude config dir laid out as Claude Code 2.1.299 writes it (probed live): <cfg>/plugins/installed_plugins.json,
  // and this plugin's root at <cfg>/plugins/cache/<marketplace>/<plugin>/<version>.
  let n = 0;
  function config(installed) {
    const cfg = join(root, `cfg${n++}`);
    mkdirSync(join(cfg, 'plugins'), { recursive: true });
    const plugins = Object.fromEntries(installed.map((k) => [k, [{ scope: 'user', installPath: join(cfg, 'plugins', 'cache', ...k.split('@').reverse(), '3.13.1'), version: '3.13.1' }]]));
    writeFileSync(join(cfg, 'plugins', 'installed_plugins.json'), JSON.stringify({ version: 2, plugins }, null, 2));
    return cfg;
  }
  const cacheRoot = (cfg) => join(cfg, 'plugins', 'cache', 'nxtg-forge', 'nxtg-forge', '3.13.1');

  function hook({ forge, env }) {
    const home = mkdtempSync(join(root, 'home-'));
    const r = spawnSync('bash', [PRE_TASK], {
      cwd: proj,
      input: JSON.stringify({ session_id: `hint-${n++}` }),
      encoding: 'utf8',
      timeout: 20000,
      env: { PATH: forge ? `${bin}${delimiter}${pathNoForge}` : pathNoForge, HOME: home, TMPDIR: root, ...env },
    });
    expect(r.status).toBe(0);
    return r.stdout;
  }

  it('forge absent: the installer line, which says the orchestrator is optional', () => {
    const cfg = config(['nxtg-forge@nxtg-forge']);
    const out = hook({ forge: false, env: { CLAUDE_PLUGIN_ROOT: cacheRoot(cfg) } });
    expect(out).toMatch(/Optional orchestrator \(L2\) not installed: curl -fsSL https:\/\/forge\.nxtg\.ai\/install\.sh \| sh/);
    expect(out).not.toContain(COMPANION_CMD);
  });

  it('forge present, companion not installed: the one plugin command', () => {
    const cfg = config(['nxtg-forge@nxtg-forge']);
    const out = hook({ forge: true, env: { CLAUDE_PLUGIN_ROOT: cacheRoot(cfg) } });
    expect(out).toMatch(/Optional orchestrator \(L2\)/);
    expect(out).toContain(`${COMPANION_CMD}, then start a new Claude Code session`);
    expect(out).not.toContain(INSTALLER);
  });

  it('forge present and the companion installed: no orchestrator line', () => {
    const cfg = config(['nxtg-forge@nxtg-forge', 'nxtg-forge-orchestrator@nxtg-forge']);
    const out = hook({ forge: true, env: { CLAUDE_PLUGIN_ROOT: cacheRoot(cfg) } });
    expect(out).not.toMatch(/orchestrator/i);
  });

  it('a --plugin-dir checkout (no cache dir) reads $CLAUDE_CONFIG_DIR instead', () => {
    const missing = config(['nxtg-forge@nxtg-forge']);
    expect(hook({ forge: true, env: { CLAUDE_PLUGIN_ROOT: PLUGIN, CLAUDE_CONFIG_DIR: missing } })).toContain(COMPANION_CMD);
    const present = config(['nxtg-forge-orchestrator@nxtg-forge']);
    expect(hook({ forge: true, env: { CLAUDE_PLUGIN_ROOT: PLUGIN, CLAUDE_CONFIG_DIR: present } })).not.toMatch(/orchestrator/i);
  });

  it('the hint is said once per session, like the other 5b lines', () => {
    const cfg = config(['nxtg-forge@nxtg-forge']);
    const home = mkdtempSync(join(root, 'home-'));
    const env = { PATH: `${bin}${delimiter}${pathNoForge}`, HOME: home, TMPDIR: root, CLAUDE_PLUGIN_ROOT: cacheRoot(cfg) };
    const once = (sid) => spawnSync('bash', [PRE_TASK], { cwd: proj, input: JSON.stringify({ session_id: sid }), encoding: 'utf8', env }).stdout;
    expect(once('same-session')).toContain(COMPANION_CMD);
    expect(once('same-session')).not.toContain(COMPANION_CMD);
  });
});
