// DIRECTIVE-NXTG-20261117-02: forge_get_governance_health and forge_get_code_metrics report "not measured",
// with the reason, for any check they cannot run (no git, no files, a missing tool), never a pass or a zero.
// A check that was not measured never counts and never moves the score, in the tools or in /nxtg-forge:status.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getHealthScore, getCodeMetrics, NOT_MEASURED } from '../tools.mjs';
import * as status from '../../../scripts/status-report.mjs';

const TOOLS = join(dirname(fileURLToPath(import.meta.url)), '..', 'tools.mjs');
const which = (cmd) => spawnSync('bash', ['-c', `command -v ${cmd}`], { encoding: 'utf8' }).stdout.trim();
const NULL_METRICS = ['sourceFiles', 'testFiles', 'testCaseCount', 'testFileRatio', 'totalLines', 'largeFiles'];

let tmp;
beforeAll(() => { tmp = realpathSync(mkdtempSync(join(tmpdir(), 'forge-not-measured-'))); });
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

// A small node project in a git repository with one commit: every check can run when the tools are there.
function project(name) {
  const root = join(tmp, name);
  mkdirSync(join(root, 'src'), { recursive: true });
  mkdirSync(join(root, 'tests'), { recursive: true });
  writeFileSync(join(root, 'package.json'), '{"name":"p","version":"1.0.0"}');
  writeFileSync(join(root, 'README.md'), '# p\n');
  writeFileSync(join(root, 'src', 'a.js'), 'export const a = 1;\n');
  writeFileSync(join(root, 'tests', 'a.test.js'), "it('a', () => {});\nit('b', () => {});\n");
  const git = (...a) => execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: root });
  git('init', '-q'); git('add', '-A'); git('commit', '-qm', 'base');
  return root;
}

// Runs both tools in a child node whose PATH holds only `tools` (symlinks to this machine's binaries).
function runWith(root, tools) {
  const bin = mkdtempSync(join(tmp, 'bin-'));
  for (const t of tools) { const p = which(t); if (p) symlinkSync(p, join(bin, t)); }
  const script = `const t = await import(${JSON.stringify(pathToFileURL(TOOLS).href)});
    console.log(JSON.stringify({ health: t.getHealthScore(${JSON.stringify(root)}), metrics: t.getCodeMetrics(${JSON.stringify(root)}) }));`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    encoding: 'utf8', env: { PATH: bin, HOME: tmp, FORGE_TEST_MODE: '1' }, timeout: 60000,
  });
  expect(r.status, r.stderr).toBe(0);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
const check = (h, name) => h.checks.find((c) => c.name === name);

describe('not measured: an EMPTY project directory (no files, no .git)', () => {
  it('both tools report "not measured" for every check: no pass, no zero, no score', () => {
    const empty = join(tmp, 'empty');
    mkdirSync(empty);
    const h = getHealthScore(empty);
    expect(h.checks).toHaveLength(8);
    for (const c of h.checks) {
      expect(c.status, c.name).toBe(NOT_MEASURED);
      expect(c.points, c.name).toBe(null);
      expect(c.note, c.name).toBe('the project directory is empty');
    }
    expect(h.score).toBe(null);
    expect(h.grade).toBe(null);
    expect(h.measuredChecks).toBe(0);
    expect(h.notMeasuredChecks).toBe(8);
    expect(h.pointsPossible).toBe(0);

    const m = getCodeMetrics(empty);
    for (const f of NULL_METRICS) {
      expect(m[f], f).toBe(null);
      expect(m.notMeasured[f], f).toBe('the project directory is empty');
    }
  });

  it('/nxtg-forge:status shows no finding and no lost points for those checks, and says why it is not scored', async () => {
    const empty = join(tmp, 'empty-status');
    mkdirSync(empty);
    const tools = await import(pathToFileURL(TOOLS).href);
    process.env.FORGE_STATUS_STATE_DIR = join(tmp, 'status-state');
    try {
      const d = await status.gather(empty, { tools, orchestrator: { state: 'connected', line: 'x' } });
      expect(d.health).toBe(null);
      expect(d.healthNotMeasured).toBe('the project directory is empty');
      expect(d.tests.testFiles).toBe(null);
      const f = status.findings(d);
      expect(f).toEqual([]); // not one finding, and so no lost points, from an unmeasured check
      const out = status.render(d);
      expect(out).toContain('**Not scored.** No health check could run: the project directory is empty.');
      expect(out).not.toContain('Node.js 20');
      expect(out).toContain('## Tests: files not measured, cases not measured');
      expect(out).not.toMatch(/\| Test files +\| 0 /);
    } finally { delete process.env.FORGE_STATUS_STATE_DIR; }
  });

  it('a partly measured result leaves the unmeasured checks out of findings and dimension maxima', () => {
    const checks = [
      { name: 'Governance', status: 'pass', points: 15 }, { name: 'Git Clean', status: NOT_MEASURED, points: null, note: 'git not available' },
      { name: 'Test Coverage', status: 'pass', points: 20 }, { name: 'README', status: 'pass', points: 10 },
      { name: 'CLAUDE.md', status: 'pass', points: 10 }, { name: 'Type Safety', status: 'pass', points: 10 },
      { name: 'File Size', status: NOT_MEASURED, points: null, note: 'find not available' }, { name: 'Security', status: NOT_MEASURED, points: null, note: 'grep not available' },
    ];
    const d = { health: { score: 100, grade: 'A', checks }, orchestrator: { state: 'connected', line: 'x' }, tests: { testFiles: 1, testCases: 2 }, git: {}, generatedAt: 't' };
    expect(status.findings(d)).toEqual([]);
    const dims = status.snapshotOf(d).health.dims;
    expect(dims).toEqual({ Tests: 20, Types: 10, Security: null, Docs: 20, Project: 15 });
  });
});

describe('not measured: missing tools', () => {
  const ALL = ['bash', 'sh', 'git', 'find', 'wc', 'xargs', 'head', 'tail', 'sort', 'grep', 'npm'];

  it('with every tool present, every check is measured and the score is the plain sum (unchanged)', () => {
    const { health } = runWith(project('full'), ALL);
    expect(health.notMeasuredChecks).toBe(0);
    expect(health.pointsPossible).toBe(100);
    expect(health.score).toBe(health.pointsEarned);
    expect(check(health, 'Git Clean').status).toBe('pass');
  });

  it('git missing: Git Clean is not measured (it was "pass"), and the score leaves it out', () => {
    const { health, metrics } = runWith(project('no-git'), ALL.filter((t) => t !== 'git'));
    expect(check(health, 'Git Clean')).toMatchObject({ status: NOT_MEASURED, points: null, note: 'git not available' });
    expect(check(health, 'Security')).toMatchObject({ status: NOT_MEASURED, points: null });
    expect(check(health, 'Security').note).toContain('.env in git: git not available');
    expect(health.pointsPossible).toBe(75);
    expect(health.score).toBe(Math.round((health.pointsEarned / 75) * 100));
    expect(metrics.sourceFiles).toBe(1); // find and wc are there, so the counts are real
  });

  it('not a git repository: Git Clean is not measured, not a pass', () => {
    const root = join(tmp, 'no-repo');
    mkdirSync(root);
    writeFileSync(join(root, 'README.md'), '# r\n');
    const { health } = runWith(root, ALL);
    expect(check(health, 'Git Clean')).toMatchObject({ status: NOT_MEASURED, note: 'not a git repository' });
  });

  it('find, wc and grep missing: the counts are null with the reason (they were 0), and their checks are not measured', () => {
    const { health, metrics } = runWith(project('no-find'), ['bash', 'sh', 'git', 'xargs', 'head', 'tail', 'sort', 'npm']);
    for (const f of NULL_METRICS) expect(metrics[f], f).toBe(null);
    expect(metrics.notMeasured.sourceFiles).toBe('find, wc not available');
    expect(check(health, 'Test Coverage')).toMatchObject({ status: NOT_MEASURED, points: null });
    expect(check(health, 'File Size')).toMatchObject({ status: NOT_MEASURED, points: null });
    expect(check(health, 'Security').status).toBe(NOT_MEASURED);
    expect(check(health, 'Git Clean').status).toBe('pass'); // git is there
  });

  it('the /os tool set (node, bash, ls, cat, echo, mkdir): no "Git Clean: pass" and no "0 source files"', () => {
    const { health, metrics } = runWith(project('os'), ['bash', 'ls', 'cat', 'echo', 'mkdir']);
    expect(check(health, 'Git Clean').status).toBe(NOT_MEASURED);
    expect(metrics.sourceFiles).toBe(null);
    expect(metrics.testFiles).toBe(null);
    for (const c of health.checks.filter((x) => x.status === NOT_MEASURED)) expect(c.points).toBe(null);
  });
});
