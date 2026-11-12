// Companion plugin nxtg-forge-orchestrator (DIRECTIVE-NXTG-20261014-12 Part P, EMMA-SOUL design C).
// C1 as registered says "orchestrator-mcp absent without error", so nxtg-forge no longer registers it.
// The companion registers it with today's launcher, stand-in fallback and project-root binding, and
// the session hook still tells Claude the orchestrator is optional and the one command that adds it.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync, chmodSync, statSync, symlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
// The physical temp dir: on macOS tmpdir() is /var/folders/..., a path through the /var -> /private/var link,
// while the scripts under test report physical paths (pwd -P, git, realpath). Comparing like with like.
const TMP = realpathSync(tmpdir());

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
    expect(c.description).toMatch(/\(alpha\)/);
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
    const home = mkdtempSync(join(TMP, 'forge-companion-'));
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
  let seq = 0;
  beforeAll(() => {
    root = mkdtempSync(join(TMP, 'forge-bind-'));
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

  // Stock macOS has no GNU timeout (exit 127 there, #124). Without it, perl does the same job: it makes its own
  // process group, runs the launcher in it, and on expiry SIGKILLs the whole group.
  const KILL_GROUP_AFTER_4S = spawnSync('bash', ['-c', 'command -v timeout'], { env: { PATH: '/usr/bin:/bin' } }).status === 0
    ? 'timeout -s KILL 4'
    : `perl -e 'setpgrp(0, 0); my $p = fork; if (!$p) { exec @ARGV; exit 127 } $SIG{ALRM} = sub { kill "KILL", -$$ }; alarm 4; waitpid($p, 0); exit($? >> 8)'`;
  // GNU timeout runs the launcher in its own process group and kills the whole group on expiry. spawnSync's own
  // timeout signals only the bash it started, and a walk looping inside `$(bind_project_root)` is a child subshell:
  // it outlived the SIGTERM and spun for 6 h (2026-10-14, red-before run of the relative-path case).
  const bind = (start, envRoot = start, homeVar = home, deleteCwd = false, extraEnv = {}) => {
    rmSync(log, { force: true });
    const launcher = join(COMPANION, 'servers/orchestrator-mcp/start.sh');
    const r = spawnSync('bash', ['-c', `cd "$1" && { [ "$3" = 0 ] || rmdir "$1"; } && exec ${KILL_GROUP_AFTER_4S} bash "$2"`, 'bind', start, launcher, deleteCwd ? '1' : '0'], {
      input: '', encoding: 'utf8', timeout: 8000,
      env: { ...(homeVar === null ? {} : { HOME: homeVar }), PATH: '/usr/bin:/bin', FORGE_BIN: fake, ...(envRoot === null ? {} : { FORGE_PROJECT_ROOT: envRoot }), ...extraEnv },
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
  // GHSA-27cj-q3j4-mfjx: the walk stopped only at $HOME or /, so a session outside $HOME bound the first ancestor with
  // .forge/state.json, whoever could write it. Another local user can write a world-writable directory (0777, as
  // /tmp is) or a 0666 state file, and owns their own files; a fake `id -u` makes every test file look like theirs.
  const INIT = '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}';
  const launch = (start, extraEnv = {}) => {
    rmSync(log, { force: true });
    const launcher = join(COMPANION, 'servers/orchestrator-mcp/start.sh');
    const r = spawnSync('bash', ['-c', `cd "$1" && exec ${KILL_GROUP_AFTER_4S} bash "$2"`, 'launch', start, launcher], {
      input: `${INIT}\n`, encoding: 'utf8', timeout: 8000,
      env: { HOME: home, PATH: '/usr/bin:/bin', FORGE_BIN: fake, FORGE_PROJECT_ROOT: start, ...extraEnv },
    });
    expect(r.status).toBe(0);
    let bound = null;
    try { bound = readFileSync(log, 'utf8').trim(); } catch { /* the stand-in answered */ }
    const reply = r.stdout ? JSON.parse(r.stdout.split('\n')[0]) : null;
    return { bound, standIn: reply?.result?.serverInfo?.version === 'unavailable' ? reply.result.instructions : null };
  };
  const project = (dir, mode = 0o644) => {
    mkdirSync(join(dir, '.forge'), { recursive: true });
    writeFileSync(join(dir, '.forge', 'state.json'), '{}');
    chmodSync(join(dir, '.forge', 'state.json'), mode);
  };
  it('outside $HOME, a project planted in a directory others can write is never bound', () => {
    const shared = join(root, 'shared');
    mkdirSync(join(shared, 'me', 'proj', 'sub'), { recursive: true });
    project(shared);
    chmodSync(shared, 0o777);
    const d = join(shared, 'me', 'proj', 'sub');
    expect(launch(d).bound).toBe(`root=${d} cwd=${d}`);
  });
  it('outside $HOME, a state.json others can write is never bound, even in a directory this user owns', () => {
    const mine = join(root, 'mine');
    mkdirSync(join(mine, 'proj', 'sub'), { recursive: true });
    project(mine, 0o666);
    const d = join(mine, 'proj', 'sub');
    expect(launch(d).bound).toBe(`root=${d} cwd=${d}`);
    chmodSync(join(mine, '.forge', 'state.json'), 0o644); // control: the same project, writable only by this user
    expect(launch(d).bound).toBe(`root=${mine} cwd=${mine}`);
  });
  it('a session in a directory others can write that holds Forge state gets the stand-in, not forge mcp', () => {
    const open = join(root, 'open');
    mkdirSync(open, { recursive: true });
    project(open);
    chmodSync(open, 0o777);
    const r = launch(open);
    expect(r.bound).toBe(null);
    expect(r.standIn).toContain('The Forge orchestrator was not started');
    expect(r.standIn).toContain(`${open} can be written by another user`);
  });
  it('Forge state owned by another user is never bound', () => {
    const bin = mkdtempSync(join(root, 'id-bin-'));
    writeFileSync(join(bin, 'id'), '#!/bin/bash\nif [ "$1" = -u ]; then echo 4242; exit 0; fi\nexec /usr/bin/id "$@"\n');
    chmodSync(join(bin, 'id'), 0o755);
    const r = launch(join(home, 'proj', 'src', 'deep'), { PATH: `${bin}:/usr/bin:/bin` });
    expect(r.bound).toBe(null);
    expect(r.standIn).toContain('can be written by another user');
  });
  // Seat finding on #136: a group-writable path this user owns was trusted, so on a host where users share a group
  // (umask 002) a group peer could plant or swap the state. Group write is trusted only for the user's private
  // group (primary, named after the user, no other member: Ubuntu and Fedora). `id` and `getent` are stand-ins.
  const groups = (members, { group = 'me', getentFails = false } = {}) => {
    const bin = mkdtempSync(join(root, 'grp-bin-'));
    writeFileSync(join(bin, 'id'), `#!/bin/bash\ncase "$*" in\n  -un) echo me ;;\n  -gn) echo ${group} ;;\n  *) exec /usr/bin/id "$@" ;;\nesac\n`);
    writeFileSync(join(bin, 'getent'), getentFails
      ? '#!/bin/bash\nexit 2\n'
      : `#!/bin/bash\n[ "$1" = group ] || exit 2\necho "${group}:x:$2:${members}"\n`);
    chmodSync(join(bin, 'id'), 0o755);
    chmodSync(join(bin, 'getent'), 0o755);
    return { PATH: `${bin}:/usr/bin:/bin` };
  };
  const groupProject = (name) => {
    const top = join(root, name);
    mkdirSync(join(top, 'proj', 'sub'), { recursive: true });
    project(top, 0o664);
    chmodSync(join(top, '.forge'), 0o775);
    // Only .forge and state.json are group-writable; the directories are 0755 whatever the umask (002 on some hosts).
    for (const dir of [top, join(top, 'proj'), join(top, 'proj', 'sub')]) chmodSync(dir, 0o755);
    return { top, d: join(top, 'proj', 'sub') };
  };
  it('group-writable state in the user\'s private group is trusted (umask 002 distros keep working)', () => {
    const { top, d } = groupProject('upg');
    expect(launch(d, groups('')).bound).toBe(`root=${top} cwd=${top}`);
    expect(launch(d, groups('me')).bound).toBe(`root=${top} cwd=${top}`);
  });
  it.each([
    ['the group has another member', ['me,peer']],
    ['the group is not named after the user', ['', { group: 'staff' }]],
    ['getent cannot list the group', ['', { getentFails: true }]],
  ])('group-writable state is not trusted when %s', (_why, args) => {
    const { d } = groupProject(`grp-${seq++}`);
    expect(launch(d, groups(...args)).bound).toBe(`root=${d} cwd=${d}`);
  });
  it('a session in a group-writable directory of a shared group that holds Forge state gets the stand-in', () => {
    const { top } = groupProject(`grp-${seq++}`);
    const r = launch(top, groups('me,peer'));
    expect(r.bound).toBe(null);
    expect(r.standIn).toContain(`${join(top, '.forge')} can be written by another user`);
  });
  it('a symlinked .forge is not trusted', () => {
    const real = join(root, 'real-state');
    project(real);
    const p = join(root, 'linked');
    mkdirSync(p, { recursive: true });
    symlinkSync(join(real, '.forge'), join(p, '.forge'));
    const r = launch(p);
    expect(r.bound).toBe(null);
    expect(r.standIn).toContain(`${join(p, '.forge')} can be written by another user`);
  });
  it('FORGE_PROJECT_ROOT unset: starts from the working directory', () => {
    const p = join(home, 'proj');
    expect(bind(join(p, 'src'), null)).toBe(`root=${p} cwd=${p}`);
  });
  // #102: HOME can be missing in a launcher's environment. Never use / as a guessed home boundary.
  const passwdLookup = (body) => {
    const bin = mkdtempSync(join(root, 'passwd-bin-'));
    // Group lookups (the launcher's private-group check under umask 002) go to the real getent.
    writeFileSync(join(bin, 'getent'), `#!/bin/bash\n[ "$1" = group ] && exec getent-real "$@"\n${body}\n`);
    try { symlinkSync(spawnSync('bash', ['-c', 'command -v getent'], { encoding: 'utf8' }).stdout.trim() || '/bin/false', join(bin, 'getent-real')); } catch {}
    chmodSync(join(bin, 'getent'), 0o755);
    return { PATH: `${bin}:/usr/bin:/bin` };
  };
  it.each([null, ''])('HOME=%s: uses the account home and still finds a project below it', (homeVar) => {
    const env = passwdLookup(`[[ "$1" == passwd && "$2" == "$(id -u)" ]] || exit 1\nprintf '%s\\n' 'test:x:1000:1000::${home}/:/bin/bash'`);
    writeFileSync(join(home, '.forge', 'state.json'), '{}');
    try {
      const d = join(home, 'loose', 'sub');
      expect(bind(d, d, homeVar, false, env)).toBe(`root=${d} cwd=${d}`);
      const p = join(home, 'proj');
      expect(bind(join(p, 'src', 'deep'), null, homeVar, false, env)).toBe(`root=${p} cwd=${p}`);
    } finally {
      rmSync(join(home, '.forge', 'state.json'), { force: true });
    }
  });
  it.each(['exit 1', 'exit 127', 'exit 0', "printf '%s\\n' 'test:x:1000:1000:::/bin/bash'", "printf '%s\\n' 'test:x:1000:1000::relative:/bin/bash'"])(
    'an unavailable account home (%s) leaves the session directory unchanged', (lookup) => {
      const d = join(home, 'proj', 'src', 'deep');
      expect(bind(d, d, null, false, passwdLookup(lookup))).toBe(`root=${d} cwd=${d}`);
    },
  );
  it('a missing home directory does not remove the walk boundary', () => {
    const d = join(home, 'proj', 'src', 'deep');
    expect(bind(d, d, join(root, 'missing-home'))).toBe(`root=${d} cwd=${d}`);
    const env = passwdLookup(`printf '%s\\n' 'test:x:1000:1000::${root}/missing-home:/bin/bash'`);
    expect(bind(d, d, null, false, env)).toBe(`root=${d} cwd=${d}`);
  });
  // #131: the caller cds into the bound root, so returning a relative path would bind it twice.
  it.each([null, ''])('HOME=%s: a relative root stays absolute when account lookup is unavailable', (homeVar) => {
    const start = join(home, 'proj', 'src');
    const d = join(start, 'deep');
    for (const lookup of ['exit 1', 'exit 127', 'exit 0']) {
      expect(bind(start, 'deep', homeVar, false, passwdLookup(lookup))).toBe(`root=${d} cwd=${d}`);
    }
  });
  it('a relative root stays absolute when the home directory cannot be resolved', () => {
    const start = join(home, 'proj', 'src');
    const d = join(start, 'deep');
    expect(bind(start, 'deep', join(root, 'missing-home'))).toBe(`root=${d} cwd=${d}`);
    const env = passwdLookup(`printf '%s\\n' 'test:x:1000:1000::${root}/missing-home:/bin/bash'`);
    expect(bind(start, 'deep', null, false, env)).toBe(`root=${d} cwd=${d}`);
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
    root = mkdtempSync(join(TMP, 'forge-foreign-'));
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
  // Each tick of the probe runs `sleep`, and starting a process costs tens of ms on macOS: 40 ticks took 4.9 s on a
  // CI runner (#124). A `sleep` that takes 0.15 s per tick stands in for that; the wall clock still ends the wait.
  it('a forge whose --version hangs, on a system where each sleep is slow: still within the bound', () => {
    const slow = join(root, 'slow-sleep-bin');
    mkdirSync(slow, { recursive: true });
    writeFileSync(join(slow, 'forge'), '#!/usr/bin/env bash\nsleep 30\necho "forge 1.7.0"\n');
    writeFileSync(join(slow, 'sleep'), '#!/bin/bash\nif [ "$1" = 0.05 ]; then exec /bin/sleep 0.15; fi\nexec /bin/sleep "$@"\n');
    chmodSync(join(slow, 'forge'), 0o755);
    chmodSync(join(slow, 'sleep'), 0o755);
    const t0 = Date.now();
    const r = spawnSync('bash', [join(COMPANION, 'servers/orchestrator-mcp/start.sh')], {
      input: `${INIT_LINE}\n`, encoding: 'utf8', timeout: 15000, env: { HOME: home, PATH: `${slow}:/usr/bin:/bin` },
    });
    const ms = Date.now() - t0;
    expect(r.status).toBe(0);
    expect(ms).toBeLessThan(4500);
    expect(JSON.parse(r.stdout.split('\n')[0]).result.serverInfo).toEqual({ name: 'orchestrator-mcp', version: 'unavailable' });
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
    root = mkdtempSync(join(TMP, 'forge-hint-'));
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
  beforeAll(() => { root = mkdtempSync(join(TMP, 'forge-stale-')); });
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
