// scripts/feature-task.sh: the create step of /nxtg-forge:feature's orchestrator loop (alpha run 2,
// F-H; path (b), shape B1). A stub `forge` records how it is called; the real binary is driven end to
// end in tests/integration/l2-journey.mjs, leg F.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCRIPT = join(PLUGIN, 'scripts', 'feature-task.sh');
const FEATURE_MD = join(PLUGIN, 'commands', 'feature.md');

let root, home, stubDir, log;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'forge-feat-'));
  home = mkdtempSync(join(tmpdir(), 'forge-feat-home-'));
  stubDir = mkdtempSync(join(tmpdir(), 'forge-feat-bin-'));
  log = join(stubDir, 'calls.log');
  // Records argv, and whether stdin was left open (the script must close it).
  writeFileSync(join(stubDir, 'forge'),
    `#!/bin/bash\nprintf '%s\\n' "$*" >> "${log}"\n` +
    `if read -r -t 1 line; then echo "stdin-open:$line" >> "${log}"; fi\n` +
    `[ -n "$STUB_FAIL" ] && { echo "boom from forge"; exit 7; }\necho "Generated 1 tasks"\n`,
    { mode: 0o755 });
});
afterEach(() => {
  for (const d of [root, home, stubDir]) rmSync(d, { recursive: true, force: true });
});

function run(args, { withStub = true, env = {}, input = 'y\n' } = {}) {
  const PATH = withStub ? `${stubDir}:/usr/bin:/bin` : '/usr/bin:/bin';
  const r = spawnSync('bash', [SCRIPT, ...args], {
    cwd: root, input, encoding: 'utf8', timeout: 15000, env: { PATH, HOME: home, ...env },
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, kv: Object.fromEntries(
    r.stdout.split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])) };
}
const calls = () => (existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : []);
const initForge = () => mkdirSync(join(root, '.forge'));

describe('feature-task.sh', () => {
  it('runs plan --generate with --spec on a one-heading spec, stdin closed', () => {
    initForge();
    const r = run(['Add a usage example', 'Show naturalsize in the docstring.']);
    expect(r.status).toBe(0);
    expect(r.kv).toMatchObject({ status: 'created', title: 'Add a usage example', spec: '.forge/feature-requests/F-001.md' });
    expect(calls()).toEqual([`plan --generate --spec .forge/feature-requests/F-001.md --project ${root}`]);
    expect(readFileSync(join(root, r.kv.spec), 'utf8')).toBe('## Add a usage example\n\nShow naturalsize in the docstring.\n');
  });

  it('the spec always holds exactly one heading', () => {
    initForge();
    const r = run(['## Add\nexport', 'line one\n## Sneaky heading\nline three']);
    expect(r.status).toBe(0);
    const spec = readFileSync(join(root, r.kv.spec), 'utf8');
    expect(spec.split('\n').filter((l) => /^#+ /.test(l))).toEqual(['## Add export']);
  });

  it('numbers specs F-001, F-002, … and never reuses one', () => {
    initForge();
    expect(run(['First', 'a']).kv.spec).toBe('.forge/feature-requests/F-001.md');
    writeFileSync(join(root, '.forge', 'feature-requests', 'F-007.md'), '## Old\n\nx\n');
    expect(run(['Second', 'b']).kv.spec).toBe('.forge/feature-requests/F-008.md');
    expect(readdirSync(join(root, '.forge', 'feature-requests')).sort()).toEqual(['F-001.md', 'F-007.md', 'F-008.md']);
  });

  it('no .forge/ (forge init not run): exit 11, forge not called, nothing written', () => {
    const r = run(['Feature', 'd']);
    expect(r.status).toBe(11);
    expect(r.kv.status).toBe('no-forge-dir');
    expect(calls()).toEqual([]);
    expect(existsSync(join(root, '.forge'))).toBe(false);
  });

  it('no forge installed: exit 10', () => {
    initForge();
    const r = run(['Feature', 'd'], { withStub: false });
    expect(r.status).toBe(10);
    expect(r.kv.status).toBe('no-forge');
  });

  it('forge failing is an error with its output on stderr', () => {
    initForge();
    const r = run(['Feature', 'd'], { env: { STUB_FAIL: '1' } });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('boom from forge');
    expect(r.kv.status).toBeUndefined();
  });

  it('an empty title is a usage error', () => {
    initForge();
    expect(run(['  ## ', 'd']).status).toBe(2);
    expect(calls()).toEqual([]);
  });
});

describe('no path runs a bare `plan --generate`', () => {
  const bare = (text) => text.split('\n')
    .filter((l) => /plan\s+(--generate|-g)\b/.test(l) && !/^\s*#/.test(l))
    .filter((l) => !/--spec\b/.test(l));
  it('feature-task.sh', () => {
    expect(bare(readFileSync(SCRIPT, 'utf8'))).toEqual([]);
  });
  it('commands/feature.md', () => {
    const md = readFileSync(FEATURE_MD, 'utf8');
    expect(bare(md).filter((l) => !/Never run/.test(l) && !/rewrites `\.forge\/plan\.md`/.test(l))).toEqual([]);
    expect(md).toContain('${CLAUDE_PLUGIN_ROOT}/scripts/feature-task.sh');
  });
});
