// Companion plugin nxtg-forge-orchestrator (DIRECTIVE-NXTG-20261014-12 Part P, EMMA-SOUL design C).
// C1 as registered says "orchestrator-mcp absent without error", so nxtg-forge no longer registers it.
// The companion registers it with today's launcher, stand-in fallback and project-root binding, and
// the session hook still tells Claude the orchestrator is optional and the one command that adds it.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, chmodSync, statSync, symlinkSync } from 'node:fs';
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

  it('its launcher, find-forge and stand-in are byte copies of nxtg-forge\'s, and every launcher file is executable', () => {
    // Plugins are cached separately and cannot share files, so the companion vendors them; this keeps them equal.
    // nxtg-forge's own orchestrator-mcp/start.sh is what /nxtg-forge:status probes (-13 item 1): equal launchers
    // bind the same project root.
    for (const f of ['servers/orchestrator-mcp/start.sh', 'servers/lib/find-forge.sh', 'servers/lib/unavailable-mcp.sh']) {
      expect(sha(join(COMPANION, f)), f).toBe(sha(join(PLUGIN, f)));
    }
    for (const f of ['servers/orchestrator-mcp/start.sh', 'servers/lib/find-forge.sh', 'servers/lib/unavailable-mcp.sh']) {
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

// C6 / DoD (b): Claude Code sets ${CLAUDE_PROJECT_DIR} to the directory the session started in, which can be a
// subdirectory of the project `forge init` set up (measured live, CC 2.1.299: FORGE_PROJECT_ROOT=<proj>/sub).
// forge mcp reads FORGE_PROJECT_ROOT and does not walk up (forge 1.5.2 and 1.6.3: "Forge is not initialized"),
// so the launcher binds the nearest ancestor holding .forge/state.json, never $HOME or above.
describe('companion launcher binds the Forge project root, not the session subdirectory', () => {
  let root, home, fake, log;
  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'forge-bind-'));
    home = join(root, 'home');
    log = join(root, 'forge.log');
    fake = join(root, 'forge');
    writeFileSync(fake, `#!/usr/bin/env bash\nif [ "$1" = --version ]; then echo 'forge 1.7.0'; exit 0; fi\necho "root=$FORGE_PROJECT_ROOT cwd=$(pwd)" > ${JSON.stringify(log)}\n`);
    chmodSync(fake, 0o755);
    mkdirSync(join(home, '.forge'), { recursive: true }); // forge-ui's global ~/.forge: projects.json, no state.json
    writeFileSync(join(home, '.forge', 'projects.json'), '{}');
    mkdirSync(join(home, 'proj', '.forge'), { recursive: true });
    writeFileSync(join(home, 'proj', '.forge', 'state.json'), '{}');
    mkdirSync(join(home, 'proj', 'src', 'deep'), { recursive: true });
    mkdirSync(join(home, 'loose', 'sub'), { recursive: true });
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  // GNU timeout runs the launcher in its own process group and kills the whole group on expiry. spawnSync's own
  // timeout signals only the bash it started, and a walk looping inside `$(bind_project_root)` is a child subshell:
  // it outlived the SIGTERM and spun for 6 h (2026-10-14, red-before run of the relative-path case).
  const bind = (start, envRoot = start, homeVar = home, deleteCwd = false, extraEnv = {}) => {
    rmSync(log, { force: true });
    const launcher = join(COMPANION, 'servers/orchestrator-mcp/start.sh');
    const r = spawnSync('bash', ['-c', `cd "$1" && { [ "$3" = 0 ] || rmdir "$1"; } && exec timeout -s KILL 4 bash "$2"`, 'bind', start, launcher, deleteCwd ? '1' : '0'], {
      input: '', encoding: 'utf8', timeout: 8000,
      env: { HOME: homeVar, PATH: '/usr/bin:/bin', FORGE_BIN: fake, ...(envRoot === null ? {} : { FORGE_PROJECT_ROOT: envRoot }), ...extraEnv },
    });
    expect(r.status).toBe(0);
    return readFileSync(log, 'utf8').trim();
  };

  it('a session started two levels down binds the project root', () => {
    const p = join(home, 'proj');
    expect(bind(join(p, 'src', 'deep'))).toBe(`root=${p} cwd=${p}`);
  });
  it('a session started at the root binds the root', () => {
    const p = join(home, 'proj');
    expect(bind(p)).toBe(`root=${p} cwd=${p}`);
  });
  it('no Forge project above: the session directory stands, and ~/.forge (forge-ui\'s global dir) is never taken for one', () => {
    const d = join(home, 'loose', 'sub');
    expect(bind(d)).toBe(`root=${d} cwd=${d}`);
  });
  // Seat 1 L-1 (#89 fix pass): `dirname` of a relative path reaches "." and stays there; the loop never ended.
  it('a relative FORGE_PROJECT_ROOT terminates, resolved against the working directory', () => {
    const p = join(home, 'proj');
    expect(bind(join(p, 'src'), 'deep')).toBe(`root=${p} cwd=${p}`);
    expect(bind(join(home, 'loose'), 'sub')).toBe(`root=${join(home, 'loose', 'sub')} cwd=${join(home, 'loose', 'sub')}`);
  });
  // Seat 1 M-2 / seat 2 L3: the stop-below-$HOME guard compared strings, so "$HOME/" or a symlink to $HOME walked
  // into $HOME and bound a .forge/state.json there.
  it('a trailing-slash or symlinked $HOME still stops the walk below $HOME', () => {
    mkdirSync(join(home, 'loose2', 'sub'), { recursive: true });
    writeFileSync(join(home, '.forge', 'state.json'), '{}'); // a project-looking ~/.forge for this case only
    try {
      const d = join(home, 'loose2', 'sub');
      expect(bind(d, d, `${home}/`)).toBe(`root=${d} cwd=${d}`);
      const link = join(root, 'home-link');
      try { symlinkSync(home, link); } catch {}
      expect(bind(d, d, link)).toBe(`root=${d} cwd=${d}`);
    } finally {
      rmSync(join(home, '.forge', 'state.json'), { force: true });
    }
  });
  it('FORGE_PROJECT_ROOT unset: starts from the working directory', () => {
    const p = join(home, 'proj');
    expect(bind(join(p, 'src'), null)).toBe(`root=${p} cwd=${p}`);
  });
  // #97 seat fix 3: with CDPATH set, `cd deep` prints the directory it found, so the resolved path was two lines.
  it('a set CDPATH does not change the binding of a relative FORGE_PROJECT_ROOT', () => {
    const p = join(home, 'proj');
    expect(bind(join(p, 'src'), 'deep', home, false, { CDPATH: join(p, 'src') })).toBe(`root=${p} cwd=${p}`);
    expect(bind(join(home, 'loose'), 'sub', home, false, { CDPATH: join(home, 'loose') })).toBe(`root=${join(home, 'loose', 'sub')} cwd=${join(home, 'loose', 'sub')}`);
  });
  // forge-pm lead al:05a79cf5796d4c75: a shell started in a deleted directory resolves "." to "." (getcwd fails),
  // and `dirname .` is ".", so a relative FORGE_PROJECT_ROOT walked forever. The given value now stands.
  it('a deleted working directory with a relative FORGE_PROJECT_ROOT ends, and the given value stands', () => {
    for (const rel of ['.', 'deep']) {
      const gone = join(home, 'proj', 'src', `gone-${rel === '.' ? 'dot' : rel}`);
      mkdirSync(gone, { recursive: true });
      expect(bind(gone, rel, home, true)).toMatch(new RegExp(`^root=${rel === '.' ? '\\.' : rel} cwd=`));
    }
  });
});

// Seat 2 M1 (#89 fix pass): any binary named `forge` was exec'd. Atlassian's and Laravel's CLIs are also named forge;
// `forge mcp` then exits 1 and Claude Code shows a FAILED server, cached 15 minutes. Only a binary whose --version
// reads `forge X.Y.Z` (every NXTG forge release) is launched; otherwise the stand-in names the clash.
describe('a foreign forge on PATH is not launched', () => {
  let root, bin, home;
  const INIT_LINE = '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}';
  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'forge-foreign-'));
    bin = join(root, 'bin');
    home = join(root, 'home');
    mkdirSync(bin);
    mkdirSync(home);
    // Atlassian's Forge CLI prints a bare version; `forge mcp` is not a command it knows.
    writeFileSync(join(bin, 'forge'), '#!/usr/bin/env bash\nif [ "$1" = --version ]; then echo 12.3.0; exit 0; fi\necho "Error: unknown command \'$1\'" >&2; exit 1\n');
    chmodSync(join(bin, 'forge'), 0o755);
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it('the launcher answers as the stand-in and names the clash, instead of exec-ing it', () => {
    const r = spawnSync('bash', [join(COMPANION, 'servers/orchestrator-mcp/start.sh')], {
      input: `${INIT_LINE}\n`, encoding: 'utf8', timeout: 10000, env: { HOME: home, PATH: `${bin}:/usr/bin:/bin` },
    });
    expect(r.status).toBe(0);
    const reply = JSON.parse(r.stdout.split('\n')[0]);
    expect(reply.result.serverInfo).toEqual({ name: 'orchestrator-mcp', version: 'unavailable' });
    expect(reply.result.instructions).toContain(`${join(bin, 'forge')} is not the NXTG Forge orchestrator`);
    expect(reply.result.instructions).toContain(INSTALLER);
  });
  // forge-pm, #89 last item: the identity probe runs an unknown binary, so it is time-bounded (2 s); a forge whose
  // --version hangs (a CLI checking for updates over the network, say) counts as not NXTG forge.
  it('a forge whose --version hangs: the launcher still answers as the stand-in, within the bound', () => {
    const slow = join(root, 'slow-bin');
    mkdirSync(slow, { recursive: true });
    writeFileSync(join(slow, 'forge'), '#!/usr/bin/env bash\nsleep 30\necho "forge 1.7.0"\n');
    chmodSync(join(slow, 'forge'), 0o755);
    const t0 = Date.now();
    const r = spawnSync('bash', [join(COMPANION, 'servers/orchestrator-mcp/start.sh')], {
      input: `${INIT_LINE}\n`, encoding: 'utf8', timeout: 15000, env: { HOME: home, PATH: `${slow}:/usr/bin:/bin` },
    });
    const ms = Date.now() - t0;
    expect(r.status).toBe(0);
    expect(ms).toBeLessThan(4500);
    const reply = JSON.parse(r.stdout.split('\n')[0]);
    expect(reply.result.serverInfo).toEqual({ name: 'orchestrator-mcp', version: 'unavailable' });
    expect(reply.result.instructions).toContain(`${join(slow, 'forge')} is not the NXTG Forge orchestrator`);
  }, 20000);
  it('find-forge skips it and still finds NXTG forge in ~/.local/bin', () => {
    const local = join(home, '.local', 'bin');
    mkdirSync(local, { recursive: true });
    writeFileSync(join(local, 'forge'), '#!/usr/bin/env bash\necho "forge 1.7.0"\n');
    chmodSync(join(local, 'forge'), 0o755);
    try {
      for (const lib of [join(COMPANION, 'servers/lib/find-forge.sh'), join(PLUGIN, 'servers/lib/find-forge.sh')]) {
        const r = spawnSync('bash', [lib], { encoding: 'utf8', env: { HOME: home, PATH: `${bin}:/usr/bin:/bin` } });
        expect(r.stdout.trim(), lib).toBe(join(local, 'forge'));
      }
    } finally {
      rmSync(join(local, 'forge'));
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
    writeFileSync(fake, '#!/usr/bin/env bash\necho "forge 1.7.0"\n'); // identifies as NXTG forge
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

  // Seat 2 L1 + EMMA-SOUL "every session": the hint is one line of context for Claude, exempt from FORGE_QUIET_HOOKS.
  it('FORGE_QUIET_HOOKS=1 does not silence the orchestrator hint, in either state', () => {
    const cfg = config(['nxtg-forge@nxtg-forge']);
    expect(hook({ forge: false, env: { CLAUDE_PLUGIN_ROOT: cacheRoot(cfg), FORGE_QUIET_HOOKS: '1' } })).toContain(INSTALLER);
    expect(hook({ forge: true, env: { CLAUDE_PLUGIN_ROOT: cacheRoot(cfg), FORGE_QUIET_HOOKS: '1' } })).toContain(COMPANION_CMD);
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

// DoD (f), forge-pm: a user who has nxtg-forge 3.13.1 cached, never runs plugin update, then installs this companion
// gets two orchestrator-mcp servers (measured: 22 orchestrator tools, the same 11 under two names). The old plugin's
// hook predates the companion, so the companion's own hook says to update it.
describe('companion hook: an installed nxtg-forge that still registers orchestrator-mcp', () => {
  const HOOK = join(COMPANION, 'hooks', 'stale-nxtg-forge.sh');
  let root, k = 0;
  beforeAll(() => { root = mkdtempSync(join(tmpdir(), 'forge-stale-')); });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  // A config dir as Claude Code writes it, with nxtg-forge installed at a cache dir whose .mcp.json is given.
  function config(forgeServers) {
    const cfg = join(root, `cfg${k++}`);
    const forgeDir = join(cfg, 'plugins', 'cache', 'nxtg-forge', 'nxtg-forge', '3.13.1');
    const compDir = join(cfg, 'plugins', 'cache', 'nxtg-forge', 'nxtg-forge-orchestrator', '3.14.0');
    mkdirSync(forgeDir, { recursive: true });
    mkdirSync(compDir, { recursive: true });
    if (forgeServers) writeFileSync(join(forgeDir, '.mcp.json'), JSON.stringify({ mcpServers: Object.fromEntries(forgeServers.map((s) => [s, {}])) }, null, 2));
    const entry = (p) => [{ scope: 'user', installPath: p, version: '3.13.1' }];
    writeFileSync(join(cfg, 'plugins', 'installed_plugins.json'), JSON.stringify({ version: 2, plugins: {
      'nxtg-forge@nxtg-forge': entry(forgeDir), 'nxtg-forge-orchestrator@nxtg-forge': entry(compDir) } }, null, 2));
    return compDir;
  }
  const run = (pluginRoot, sid = `s-${k++}`) => spawnSync('bash', [HOOK], {
    input: JSON.stringify({ session_id: sid }), encoding: 'utf8', timeout: 10000,
    env: { PATH: '/usr/bin:/bin', HOME: root, TMPDIR: root, CLAUDE_PLUGIN_ROOT: pluginRoot },
  });

  it('is registered as a UserPromptSubmit hook of the companion', () => {
    const h = rd(join(COMPANION, 'hooks', 'hooks.json')).hooks.UserPromptSubmit[0].hooks[0];
    expect(h.command).toBe('bash "${CLAUDE_PLUGIN_ROOT}/hooks/stale-nxtg-forge.sh"');
  });
  it('old nxtg-forge (registers orchestrator-mcp): one warning naming the update command, exit 0', () => {
    const r = run(config(['governance-mcp', 'orchestrator-mcp', 'semgrep-mcp']));
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('claude plugin update nxtg-forge@nxtg-forge, then start a new Claude Code session');
  });
  it('current nxtg-forge (no orchestrator-mcp): silent', () => {
    const r = run(config(['governance-mcp', 'semgrep-mcp']));
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
  });
  it('once per session', () => {
    const p = config(['orchestrator-mcp']);
    expect(run(p, 'same').stdout).toContain('out of date');
    expect(run(p, 'same').stdout).toBe('');
  });
  it('no installed_plugins.json, or an unreadable install path: silent and exit 0', () => {
    const r = run(join(root, 'nowhere', 'plugins', 'cache', 'm', 'p', '1'));
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
    expect(run(config(null)).stdout).toBe('');
  });
});
