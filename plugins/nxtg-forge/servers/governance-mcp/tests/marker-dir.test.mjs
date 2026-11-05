// The once-per-session markers of pre-task.sh (nxtg-forge) and stale-nxtg-forge.sh (companion) live in
// $TMPDIR/nxtg-forge[-orchestrator]-<uid>, a predictable name in a directory every local user can write to
// (forge-pm opus seat, DIRECTIVE-NXTG-20261105-03). Another user who gets there first controls what is inside,
// and `: > marker` follows a symlink planted at a marker name ("deps-unknown" when there is no session id) and
// truncates the file it points to. Without root a test cannot make a directory owned by someone else, so it plants
// the two states such a user could leave: the directory is a symlink to theirs, or a directory others can write to.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const UID = process.getuid();
const HOOKS = [
  { name: 'pre-task.sh', path: join(REPO, 'plugins/nxtg-forge/hooks/scripts/pre-task.sh'), dir: `nxtg-forge-${UID}`, mark: 'deps' },
  { name: 'stale-nxtg-forge.sh', path: join(REPO, 'plugins/nxtg-forge-orchestrator/hooks/stale-nxtg-forge.sh'), dir: `nxtg-forge-orchestrator-${UID}`, mark: 'stale' },
];

let root;
beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'forge-marker-')); });
afterEach(() => rmSync(root, { recursive: true, force: true }));

function run(hook, sid) {
  const home = join(root, 'home'); mkdirSync(home, { recursive: true });
  const proj = join(root, 'proj'); mkdirSync(proj, { recursive: true });
  const r = spawnSync('bash', [hook.path], {
    cwd: proj, input: JSON.stringify(sid ? { session_id: sid } : {}), encoding: 'utf8', timeout: 30000,
    env: { PATH: process.env.PATH, HOME: home, TMPDIR: root, CLAUDE_PLUGIN_ROOT: dirname(dirname(hook.path)), CLAUDE_CONFIG_DIR: join(home, '.claude') },
  });
  expect(r.status, r.stderr).toBe(0);
  return r;
}

function victim() {
  const v = join(root, 'victim.txt');
  writeFileSync(v, 'VICTIM');
  return v;
}
const mode = (p) => statSync(p).mode & 0o777;

describe.each(HOOKS)('$name marker directory', (hook) => {
  it('does not write through a marker directory that is a symlink to someone else\'s directory', () => {
    const v = victim();
    const theirs = join(root, 'theirs'); mkdirSync(theirs);
    symlinkSync(v, join(theirs, `${hook.mark}-unknown`));
    symlinkSync(theirs, join(root, hook.dir));
    run(hook);
    expect(readFileSync(v, 'utf8')).toBe('VICTIM');
  });

  it('does not write through a symlink planted in a marker directory others can write to', () => {
    const v = victim();
    const d = join(root, hook.dir); mkdirSync(d); chmodSync(d, 0o777);
    symlinkSync(v, join(d, `${hook.mark}-unknown`));
    run(hook);
    expect(readFileSync(v, 'utf8')).toBe('VICTIM');
  });

  it('keeps working in a directory an older version created (this user, 0755): marker written, directory made 0700', () => {
    const d = join(root, hook.dir); mkdirSync(d); chmodSync(d, 0o755);
    run(hook, 'sess-1');
    expect(existsSync(join(d, `${hook.mark}-sess-1`))).toBe(true);
    expect(mode(d)).toBe(0o700);
  });

  it('creates the directory 0700 on a fresh machine and writes the session marker as a plain file', () => {
    run(hook, 'sess-2');
    const d = join(root, hook.dir);
    expect(lstatSync(d).isDirectory()).toBe(true);
    expect(mode(d)).toBe(0o700);
    expect(lstatSync(join(d, `${hook.mark}-sess-2`)).isFile()).toBe(true);
  });
});
