// Required output, computed and gated (DIRECTIVE-NXTG-20261013-21; alpha run 5 F-O and F-P; EMMA-SOUL rulings).
// No model in the loop. For /nxtg-forge:status and /nxtg-forge:gap-analysis: recorded inputs go into the
// scripts their `!` steps run, and the exact block comes out. For all three gated commands: recorded-shape
// transcripts go into the Stop gate, which allows a turn only when the required output is there, matching
// what was computed (a heading with other content under it is refused). Each section has three cases
// (matching: allow; missing: block; heading present, wrong content: block) and mutants that must turn red.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as status from '../../../scripts/status-report.mjs';
import * as gap from '../../../scripts/gap-report.mjs';
import * as gate from '../../../scripts/required-output.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = resolve(HERE, '..', '..', '..');
const SCRIPTS = join(PLUGIN, 'scripts');
const read = (p) => readFileSync(join(PLUGIN, p), 'utf8').replace(/\r\n/g, '\n');
const FX = JSON.parse(readFileSync(join(HERE, 'fixtures', 'status-report.json'), 'utf8'));

let tmp;
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), 'req-out-')); });
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

const STAGE = '**Stage: Public preview.** Forge is public: anyone may install and use it. Its maturity is below alpha (pre-alpha): no SLA, and interfaces may change without notice.';
const humanize = () => ({
  ...structuredClone(FX.humanize_785e5dc), stage: STAGE, tooling: { agents: 33, commands: 24, hooks: 14, registrations: 27 },
  root: '/home/dev/humanize', versions: { plugin: '3.13.0', orchestrator: '1.6.3' }, generatedAt: '2026-10-14 01:52:10 UTC', elapsedMs: 1234,
  previous: null, snapshot: { saved: true, display: '~/.local/state/nxtg-forge/status/2c6a1d0e9b7f4a31.json' },
});

// The report for the recorded humanize inputs, exactly (reviewed by hand; health D (60/100) is what alpha
// run 5 printed). Run fields that vary by run (time, path, versions, snapshot) are fixed in humanize().
const HUMANIZE_REPORT = readFileSync(join(HERE, 'fixtures', 'status-report.humanize.md'), 'utf8');

// Writes a mutated copy of a script (and the siblings it imports) into tmp and imports it.
async function mutant(file, from, to) {
  const src = readFileSync(join(SCRIPTS, file), 'utf8');
  expect(src.split(from).length - 1, `mutation anchor in ${file}`).toBe(1);
  const dir = join(tmp, 'scripts');
  mkdirSync(dir, { recursive: true });
  copyFileSync(join(SCRIPTS, 'orchestrator-status.mjs'), join(dir, 'orchestrator-status.mjs'));
  const p = join(dir, `m-${Math.random().toString(36).slice(2)}-${file}`);
  writeFileSync(p, src.replace(from, to));
  return import(pathToFileURL(p).href);
}

// ---------------------------------------------------------------------------------------------------
// Transcripts in the shape Claude Code 2.1.296 writes (checked live: the command row and its expanded
// body share a promptId; a Stop block comes back as a meta row "Stop hook feedback:\n<reason>").
const PID = 'p-1';
function transcript({ command, args = '', body = '', texts = [], tools = [], feedback = 0, before = [] }) {
  const rows = [...before];
  if (command) {
    rows.push({ type: 'user', promptId: PID, message: { role: 'user', content: `<command-message>nxtg-forge:${command}</command-message>\n<command-name>/nxtg-forge:${command}</command-name>${args ? `\n<command-args>${args}</command-args>` : ''}` } });
    rows.push({ type: 'user', isMeta: true, promptId: PID, message: { role: 'user', content: [{ type: 'text', text: body }] } });
  } else rows.push({ type: 'user', promptId: PID, message: { role: 'user', content: 'what is the weather like' } });
  let n = 0;
  for (const t of tools) {
    const id = `toolu_${n++}`;
    rows.push({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id, name: t.name, input: t.input ?? {} }] } });
    rows.push({ type: 'user', promptId: PID, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: t.result ?? '', is_error: t.isError === true }] } });
  }
  for (const x of texts) rows.push({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: x }] } });
  for (let i = 0; i < feedback; i++) rows.push({ type: 'user', isMeta: true, promptId: PID, message: { role: 'user', content: `Stop hook feedback:\n${gate.FEEDBACK_TAG}: gate=${command} block=${i + 1}/3 missing=1` } });
  return rows;
}
const evalWith = (g, t, extra = {}) => g.evaluate({ rows: t, promptId: PID, ...extra });
const unwrap = (block) => block.split('\n').filter((l) => !l.startsWith('<!--')).join('\n');
const statusBody = (block) => `# Forge Status\n\norchestrator=not_initialized\n${block}\n\nStart your reply with that block`;
const gapBody = (block) => `# NXTG-Forge Gap Analysis\n\n${block}\n\nStart your reply with that block`;

// Sections of the status report and of the gap block: [name, the lines that make it, a wrong version].
const STATUS_SECTIONS = [
  ['Summary', /^\*\*Verdict: |^\| [123] +\| \[(HIGH|MED|LOW)\]/, (l) => l.replace('NEEDS ATTENTION', 'HEALTHY').replace('[HIGH]', '[LOW] ')],
  ['Changes', /^No previous run recorded|^Snapshot: /, (l) => l.replace('this run is the baseline', 'nothing changed')],
  ['Git', /^\| (Branch|Staged|Modified|Untracked) +\|/, (l) => l.replace(/^(\| Untracked +\| )0/, '$13')],
  ['Health', /^\| (Tests|Types|Security|Docs|Project|\*\*Overall\*\*) +\| .*\[[#.]{20}\]/, (l) => l.replace('**D (60/100)**', '**C (70/100)**').replace('0/10 ', '5/10 ')],
  ['Tests', /^\| (Test files|Test cases|Runner|Coverage) +\|/, (l) => l.replace(/^(\| Test cases +\| )68/, '$170')],
  ['Orchestrator', /^◐ \*\*Connected; not initialized here\*\*|^Plain text: /, (l) => l.replace(/^◐ .*/, '○ **Not connected** — add multi-agent orchestration').replace(/^Plain text: .*/, 'Plain text: CONNECTED')],
  ['Next actions', /^\d\. .*: `/, (l) => l.replace(/`[^`]+`$/, '`/nxtg-forge:status`')],
  ['Provenance', /^\| (Plugin|Orchestrator|Generated|Project|Commit) +\|/, (l) => l.replace('3.13.0', '3.12.1')],
];

describe('status: the report is computed by code', () => {
  it('recorded humanize inputs give the exact report, health D (60/100) included', () => {
    expect(status.render(humanize())).toBe(HUMANIZE_REPORT);
  });

  it('no health result gives the fixed "Not scored" line and no table, no bars, no grade', () => {
    const out = status.render({ ...humanize(), health: null });
    expect(out).toContain(`## Health\n${status.NOT_SCORED}\n\n## Tests: `);
    expect(out).not.toMatch(/Overall|\(\d+\/100\)/);
  });

  it('Node older than 20 loads no scoring functions; the stage line is read from status.md', async () => {
    expect(await status.loadTools('18.19.0')).toBeNull();
    expect(typeof (await status.loadTools())?.getHealthScore).toBe('function');
    expect(status.stageLine()).toBe(STAGE);
  });

  it('end to end on a git project: the script prints orchestrator= and a complete block, no stack trace', () => {
    execFileSync('git', ['init', '-q', tmp]);
    writeFileSync(join(tmp, 'pyproject.toml'), '[project]\nname = "demo"\nversion = "1.2.3"\n');
    writeFileSync(join(tmp, 'demo.py'), 'def f():\n    return 1\n');
    execFileSync('git', ['-C', tmp, 'add', '.']);
    execFileSync('git', ['-C', tmp, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'first | commit']);
    const stand = join(tmp, 'standin.sh');
    writeFileSync(stand, `exec bash ${JSON.stringify(join(PLUGIN, 'servers', 'lib', 'unavailable-mcp.sh'))} orchestrator-mcp "not installed"\n`);
    const r = spawnSync('node', [join(SCRIPTS, 'status-report.mjs'), '--project', tmp], { encoding: 'utf8', env: { ...process.env, FORGE_ORCHESTRATOR_LAUNCHER: stand, FORGE_ORCHESTRATOR_TIMEOUT_MS: '3000', FORGE_STATUS_STATE_DIR: join(tmp, 'state') }, timeout: 30000 });
    expect(r.status).toBe(0);
    expect(r.stdout.split('\n')[0]).toBe('orchestrator=not_installed');
    expect(r.stdout).toContain('**demo** v1.2.3 on `');
    expect(r.stdout).toMatch(/\| `[0-9a-f]{7,}` \| first \\\| commit +\|/);
    expect(r.stdout).toMatch(/\| \*\*Overall\*\* +\| \*\*[A-F] \(\d+\/100\)\*\* +\| \[[#.]{20}\] \|/);
    expect(r.stdout).toMatch(/\| Runner +\| unittest +\|/);
    expect(r.stdout).toContain(status.FIRST_RUN);
    const lines = r.stdout.trim().split('\n');
    expect(lines[lines.length - 2]).toBe(status.END);
    expect(JSON.parse(lines[lines.length - 1].slice(5)).orchestrator).toBe('not_installed');
    expect(r.stdout + r.stderr).not.toMatch(/^\s+at .+:\d+:\d+\)?$/m);
  });

  it('a directory that is not a git repo still gives a complete block', () => {
    const d = status.gitData(tmp);
    expect(d).toEqual({ isRepo: false });
    expect(status.render({ ...humanize(), git: d })).toContain('## Git\nNot a git repository.\n\n## Health');
  });

  it('mutant: dropping the grade from the Overall row turns the exact-report check red', async () => {
    const m = await mutant('status-report.mjs', '**${d.health.grade} (${d.health.score}/100)**', '**${d.health.score}/100**');
    expect(m.render(humanize())).not.toBe(HUMANIZE_REPORT);
  });

  it('mutant: dropping the Untracked row turns the exact-report check red', async () => {
    const m = await mutant('status-report.mjs', ", ['Untracked', g.untracked]", '');
    expect(m.render(humanize())).not.toBe(HUMANIZE_REPORT);
  });
});

describe('status: the enterprise report (founder directive via EMMA-SOUL 02:29Z)', () => {
  const block = (d) => status.render(d).split('\n');
  it('1. an executive summary leads: one verdict, the health score and grade, the top 3 findings with severity', () => {
    const l = block(humanize());
    expect(l.filter(Boolean).indexOf('## Summary')).toBe(l.filter(Boolean).indexOf('---') + 1);
    expect(l[l.indexOf('---') - 1]).toBe('');
    expect(l).toContain('**Verdict: NEEDS ATTENTION** - health **D (60/100)**');
    expect(l).toContain('What matters now (top 3 of 5 findings):');
    expect(l.filter((x) => /^\| [123] +\| \[(HIGH|MED|LOW)\]/.test(x))).toHaveLength(3);
  });
  it('verdict rules: A/B with no HIGH finding is HEALTHY; F or an orchestrator error is AT RISK; no score is NOT SCORED', () => {
    const d = humanize();
    const full = { ...d, health: { score: 92, grade: 'A', checks: Object.entries({ Governance: 15, 'Git Clean': 10, 'Test Coverage': 20, README: 10, 'CLAUDE.md': 10, 'Type Safety': 10, 'File Size': 10, Security: 7 }).map(([name, points]) => ({ name, points })) }, orchestrator: { state: 'connected', line: '● **Connected**' } };
    expect(status.verdict(full)).toBe('HEALTHY');
    expect(status.verdict({ ...d, health: { ...d.health, grade: 'F', score: 40 } })).toBe('AT RISK');
    expect(status.verdict({ ...d, orchestrator: { state: 'error', line: 'x' } })).toBe('AT RISK');
    expect(status.verdict({ ...d, health: null })).toBe('NOT SCORED');
  });
  it('2. sections carry counts in their headings, severity badges, and padded (aligned) tables', () => {
    const l = block(humanize());
    for (const h of ['## Git: 0 changed files', '## Health: D (60/100), 3 of 5 dimensions below max', '## Tests: 6 files, 68 cases', '## Tooling: 33 agents, 24 commands, 14 hook scripts', '## Next actions (3)'])
      expect(l).toContain(h);
    expect(l.filter((x) => /\| \[(OK|WARN|FAIL)\] +\|$/.test(x)).length).toBe(6);
    const health = l.slice(l.findIndex((x) => x.startsWith('| Dimension')), l.findIndex((x) => x.startsWith('| **Overall**')) + 1);
    expect(health).toHaveLength(8);
    expect(new Set(health.map((x) => x.length)).size).toBe(1);
  });
  it('3. a first run prints the fixed no-previous-run line; a later run shows trends against the XDG snapshot', () => {
    expect(block(humanize())).toContain(status.FIRST_RUN);
    const prev = { ...status.snapshotOf({ ...humanize(), health: { ...humanize().health, score: 55, grade: 'F' } }), at: '2026-10-13 09:00:00 UTC' };
    const l = block({ ...humanize(), previous: prev });
    expect(l).toContain('**Verdict: NEEDS ATTENTION** - health **D (60/100)**, up 5 since last run');
    expect(l).toContain('Compared with the run at 2026-10-13 09:00:00 UTC (commit `785e5dc`).');
    expect(l.find((x) => x.startsWith('| Health score'))).toMatch(/\| 55 +\| 60 +\| up \+5 +\|$/);
    expect(l.find((x) => x.startsWith('| Health grade'))).toMatch(/\| F +\| D +\| changed +\|$/);
  });
  it('3. the snapshot lives under XDG state keyed by the project path, never inside the project', async () => {
    const env = { HOME: '/home/dev', XDG_STATE_HOME: '' };
    expect(status.snapshotPath('/home/dev/humanize', env)).toMatch(/^\/home\/dev\/\.local\/state\/nxtg-forge\/status\/[0-9a-f]{16}\.json$/);
    expect(status.snapshotPath('/p', { XDG_STATE_HOME: '/x/state' })).toMatch(/^\/x\/state\/nxtg-forge\/status\//);
    execFileSync('git', ['init', '-q', join(tmp, 'p')]);
    const before = execFileSync('git', ['-C', join(tmp, 'p'), 'status', '--porcelain', '--ignored'], { encoding: 'utf8' });
    process.env.FORGE_STATUS_STATE_DIR = join(tmp, 'state');
    try {
      const orch = { state: 'not_installed', line: 'x' };
      const d1 = await status.gather(join(tmp, 'p'), { tools: null, orchestrator: orch });
      expect(d1.previous).toBeNull();
      expect(d1.snapshot.saved).toBe(true);
      expect(d1.snapshot.path.startsWith(join(tmp, 'state'))).toBe(true);
      const d2 = await status.gather(join(tmp, 'p'), { tools: null, orchestrator: orch });
      expect(d2.previous?.orchestrator).toBe('not_installed');
    } finally { delete process.env.FORGE_STATUS_STATE_DIR; }
    expect(execFileSync('git', ['-C', join(tmp, 'p'), 'status', '--porcelain', '--ignored'], { encoding: 'utf8' })).toBe(before);
  });
  it('4. next actions each carry a command', () => {
    const l = block(humanize());
    expect(l.filter((x) => /^\d\. .+: `[^`]+`$/.test(x))).toEqual(['1. Initialize governance: `/nxtg-forge:init`', '2. Add a CLAUDE.md: `/init`', '3. Configure a type checker: `/nxtg-forge:gap-analysis`']);
  });
  it('5. a provenance footer names plugin and orchestrator versions, run time, project and commit', () => {
    const l = block(humanize());
    for (const re of [/^\| Plugin +\| nxtg-forge 3\.13\.0 +\|$/, /^\| Orchestrator +\| forge 1\.6\.3 +\|$/, /^\| Generated +\| 2026-10-14 01:52:10 UTC \(1\.2 s\) +\|$/, /^\| Project +\| `\/home\/dev\/humanize` +\|$/, /^\| Commit +\| `785e5dc` on `detached` +\|$/])
      expect(l.some((x) => re.test(x)), String(re)).toBe(true);
  });
  it('6. plain ASCII except the orchestrator lines, and every table row within 80 columns, even with long names', () => {
    const long = { ...humanize(), root: `/home/dev/${'x'.repeat(120)}`, project: { name: 'n'.repeat(90), version: '1.0.0-rc.1+build.123456' },
      git: { ...humanize().git, branch: 'b'.repeat(90), commits: [{ hash: 'abcdef1', message: `m|${'é'.repeat(120)}` }] } };
    for (const d of [humanize(), long]) {
      const l = block(d);
      const lines = l.filter((x) => x !== d.orchestrator.line && !x.startsWith('<!--'));
      expect(lines.filter((x) => /[^\x20-\x7e]/.test(x))).toEqual([]);
      expect(l.filter((x) => x.startsWith('|') && [...x].length > status.WIDTH)).toEqual([]);
    }
  });
  it('(a) the orchestrator lines are byte-identical to v3.12.1, with the ASCII form only after them', async () => {
    const { LINES } = await import('../../../scripts/orchestrator-status.mjs');
    expect(LINES.not_initialized).toBe('◐ **Connected; not initialized here** — run `forge init` in this project');
    const l = block(humanize());
    const i = l.indexOf('## Orchestrator');
    expect(l.slice(i, i + 3)).toEqual(['## Orchestrator', LINES.not_initialized, `Plain text: ${status.PLAIN_ORCHESTRATOR.not_initialized}`]);
  });
  it('7. --json carries the same data: verdict, health, findings, orchestrator, changes and provenance', () => {
    const d = humanize();
    const j = status.toJson(d);
    expect(j).toMatchObject({ stage: 'Public preview', verdict: 'NEEDS ATTENTION', health: { score: 60, grade: 'D' }, orchestrator: 'not_initialized', orchestratorLine: d.orchestrator.line, changes: null,
      provenance: { plugin: '3.13.0', orchestrator: '1.6.3', generatedAt: '2026-10-14 01:52:10 UTC', project: '/home/dev/humanize', commit: '785e5dc' } });
    expect(j.findings.slice(0, 3).map((f) => `[${f.severity}]`)).toEqual(['[HIGH]', '[MED]', '[MED]']);
  });
  it('mutant: dropping the plain-text fallback turns the orchestrator check red', async () => {
    const m = await mutant('status-report.mjs', "out.push('## Orchestrator', d.orchestrator.line, `Plain text: ${PLAIN_ORCHESTRATOR[d.orchestrator.state] ?? PLAIN_ORCHESTRATOR.error}`);", "out.push('## Orchestrator', d.orchestrator.line);");
    expect(m.render(humanize())).not.toBe(HUMANIZE_REPORT);
  });
  it('mutant: a summary without the verdict turns the exact-report check red', async () => {
    const m = await mutant('status-report.mjs', "out.push('## Summary', `**Verdict: ${v}** - health **${score}**${trend}`);", "out.push('## Summary', `Health **${score}**${trend}`);");
    expect(m.render(humanize())).not.toBe(HUMANIZE_REPORT);
  });
});

// ---------------------------------------------------------------------------------------------------
function pyProject(dir, files) {
  for (const [p, c] of Object.entries(files)) { mkdirSync(dirname(join(dir, p)), { recursive: true }); writeFileSync(join(dir, p), c); }
  execFileSync('git', ['init', '-q', dir]);
  execFileSync('git', ['-C', dir, 'add', '.']);
}
const LONG = Array.from({ length: 320 }, (_, i) => `x${i} = ${i}`).join('\n');
const GAP_FIXTURE = {
  'README.md': '# demo\n',
  'pyproject.toml': '[project]\nname = "demo"\ndependencies = ["requests>=2"]\n',
  'src/demo/number.py': `def intcomma(v):\n    """Commas."""\n    return v\n${LONG}\n`,
  'src/demo/time.py': 'def naturaldelta(v):\n    return v  # TODO: units\n',
  'src/demo/cli.py': 'import os\n\ndef run(cmd):\n    """Run."""\n    os.system(cmd)\n    print(cmd)\n',
  'tests/test_number.py': 'def test_x():\n    assert True\n',
};
const GAP_EXPECTED = `<!-- forge-required: gap-analysis v1 -->
## Gap analysis: computed checks
| Dimension | Finding |
|---|---|
| Testing | 2 of 3 source files have no matching test file; largest: \`src/demo/cli.py\` (7 lines) |
| Documentation | no CHANGELOG; 1 public definitions without a docstring, first \`src/demo/time.py:1\` \`naturaldelta\` |
| Security | 1 eval/exec/shell call(s), first \`src/demo/cli.py:5\` |
| Architecture | 1 source file(s) over 300 lines, largest \`src/demo/number.py\` (324); 1 TODO/FIXME/HACK marker(s), first \`src/demo/time.py:2\` |
| Performance | 1 console.log/print call(s) in source, first \`src/demo/cli.py:6\`; 1 runtime dependencies |
**Recommendations:**
1. Add tests for \`src/demo/cli.py\` (7 lines, no matching test file).
2. Document \`naturaldelta\` at \`src/demo/time.py:1\`.
3. Replace the call at \`src/demo/cli.py:5\` with one that does not evaluate or shell out to its input.
4. Split \`src/demo/number.py\` (324 lines) into smaller modules.
5. Remove or gate the console.log/print call at \`src/demo/cli.py:6\`.
<!-- /forge-required -->`;
const CLEAN_EXPECTED = `<!-- forge-required: gap-analysis v1 -->
## Gap analysis: computed checks
| Dimension | Finding |
|---|---|
| Testing | nothing found: all 1 source files have a matching test file |
| Documentation | nothing found: README and CHANGELOG present; every public definition is documented |
| Security | nothing found: no tracked .env file, hardcoded secret pattern or eval/exec/shell call (dependency audit not run) |
| Architecture | nothing found: no source file over 300 lines and no TODO/FIXME/HACK marker |
| Performance | nothing found: no tracked file over 1 MB and no console.log/print in source; 0 runtime dependencies |
**Recommendations:**
1. No gaps found by these checks. Run \`/nxtg-forge:test\` to confirm the suite passes.
<!-- /forge-required -->`;
const cleanProject = (dir) => pyProject(dir, {
  'README.md': '# c\n', 'CHANGELOG.md': '# changes\n', 'pyproject.toml': '[project]\nname = "c"\n',
  'src/c/core.py': 'def add(a, b):\n    """Add."""\n    return a + b\n', 'tests/test_core.py': 'def test_add():\n    assert True\n',
});

describe('gap-analysis: the five dimensions are computed by code', () => {
  it('a project with a gap in every dimension gives the exact block, five rows and five recommendations', () => {
    pyProject(tmp, GAP_FIXTURE);
    expect(gap.render(gap.analyze(gap.scan(tmp)))).toBe(GAP_EXPECTED);
  });

  it('a clean project names every dimension "nothing found" and still gives one recommendation', () => {
    cleanProject(tmp);
    expect(gap.render(gap.analyze(gap.scan(tmp)))).toBe(CLEAN_EXPECTED);
  });

  it('an empty directory (no git, no source) still gives five rows and a recommendation', () => {
    const { rows, recs } = gap.analyze(gap.scan(tmp));
    expect(rows.map((r) => r.dim)).toEqual(gap.DIMENSION_NAMES);
    expect(recs.length).toBeGreaterThanOrEqual(1);
  });

  it('end to end: the script prints the block for --project', () => {
    pyProject(tmp, GAP_FIXTURE);
    const r = spawnSync('node', [join(SCRIPTS, 'gap-report.mjs'), '--project', tmp], { encoding: 'utf8', timeout: 20000 });
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe(GAP_EXPECTED);
  });

  it('mutant: dropping the Performance row turns the five-dimension check red', async () => {
    const m = await mutant('gap-report.mjs', 'const add = (dim, finding, rec) => { rows.push', "const add = (dim, finding, rec) => { if (dim === 'Performance') return; rows.push");
    const proj = join(tmp, 'proj');
    pyProject(proj, GAP_FIXTURE);
    expect(gap.analyze(gap.scan(proj)).rows.map((r) => r.dim)).toEqual(gap.DIMENSION_NAMES);
    expect(m.analyze(m.scan(proj)).rows.map((r) => r.dim)).not.toEqual(gap.DIMENSION_NAMES);
  });

  it('mutant: no fallback recommendation turns the at-least-one check red on a clean project', async () => {
    const m = await mutant('gap-report.mjs', "  if (!recs.length) recs.push(", "  if (false) recs.push(");
    const proj = join(tmp, 'proj');
    cleanProject(proj);
    expect(gap.analyze(gap.scan(proj)).recs).toHaveLength(1);
    expect(m.analyze(m.scan(proj)).recs).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------------------------------
// The checks a gated section must pass. Throws when any case comes out wrong.
function statusSectionChecks(g, [name, rowRe, wrong]) {
  const body = statusBody(HUMANIZE_REPORT);
  const full = unwrap(HUMANIZE_REPORT);
  expect(evalWith(g, transcript({ command: 'status', body, texts: [full] })), `${name}: matching`).toBeNull();
  const missing = full.split('\n').filter((l) => !rowRe.test(l)).join('\n');
  expect(missing).not.toBe(full);
  expect(evalWith(g, transcript({ command: 'status', body, texts: [missing] })), `${name}: missing`).toMatch(/^FORGE REQUIRED OUTPUT: gate=status block=1\/3/);
  const wrongText = full.split('\n').map((l) => (rowRe.test(l) ? wrong(l) : l)).join('\n');
  expect(wrongText).not.toBe(full);
  expect(evalWith(g, transcript({ command: 'status', body, texts: [wrongText] })), `${name}: heading present, wrong content`).toMatch(/gate=status/);
}

describe('Stop gate: /nxtg-forge:status', () => {
  it.each(STATUS_SECTIONS)('%s: matching allows; missing blocks; heading with wrong content blocks', (...s) => statusSectionChecks(gate, s));

  it('run-5 C2 r1 shape (a next-actions list, no report) is blocked, and the reason quotes the whole block', () => {
    const reason = evalWith(gate, transcript({ command: 'status', body: statusBody(HUMANIZE_REPORT), texts: ['## Next actions\n- Commit changes\n- Run gap analysis'] }));
    expect(reason).toMatch(/^FORGE REQUIRED OUTPUT: gate=status block=1\/3 missing=\d+/);
    expect(reason).toContain(HUMANIZE_REPORT);
  });

  it('one mistyped line (a live AFTER-capture case: commit 785e5dc printed as 865e5dc) is blocked, and the reason quotes only that line', () => {
    const typo = unwrap(HUMANIZE_REPORT).replace('| Commit       | `785e5dc` on `detached`', '| Commit       | `865e5dc` on `detached`');
    const reason = evalWith(gate, transcript({ command: 'status', body: statusBody(HUMANIZE_REPORT), texts: [typo] }));
    expect(reason).toMatch(/^FORGE REQUIRED OUTPUT: gate=status block=1\/3 missing=1\n/);
    expect(reason).toContain('| Commit       | `785e5dc` on `detached`');
    expect(reason).not.toContain('## Summary');
    expect(evalWith(gate, transcript({ command: 'status', body: statusBody(HUMANIZE_REPORT), texts: [typo, '| Commit | `785e5dc` on `detached` |'] }))).toBeNull();
  });

  it('the report spread over several messages, with extra spacing in table cells, is allowed', () => {
    const lines = unwrap(HUMANIZE_REPORT).split('\n');
    const spaced = lines.map((l) => l.replace(/\|/g, ' | ')).join('\n');
    const half = Math.floor(lines.length / 2);
    expect(evalWith(gate, transcript({ command: 'status', body: statusBody(HUMANIZE_REPORT), texts: [spaced.split('\n').slice(0, half).join('\n'), spaced.split('\n').slice(half).join('\n')] }))).toBeNull();
  });

  it('the last assistant message from the hook input counts (it may not be in the transcript yet)', () => {
    expect(evalWith(gate, transcript({ command: 'status', body: statusBody(HUMANIZE_REPORT) }), { lastAssistant: unwrap(HUMANIZE_REPORT) })).toBeNull();
  });

  it('when the step did not run, only the fixed unavailable line is required', () => {
    const t = (texts) => transcript({ command: 'status', body: '# Forge Status\n\n', texts });
    expect(evalWith(gate, t(['Here is your status.']))).toMatch(/did not run/);
    expect(evalWith(gate, t(['◌ **Forge status unavailable** — the status step did not run']))).toBeNull();
  });

  it('the gate stops after 3 blocks in a turn; the third is numbered 3/3', () => {
    const body = statusBody(HUMANIZE_REPORT);
    expect(evalWith(gate, transcript({ command: 'status', body, texts: ['nothing'], feedback: 2 }))).toMatch(/block=3\/3/);
    expect(evalWith(gate, transcript({ command: 'status', body, texts: ['nothing'], feedback: 3 }))).toBeNull();
  });

  it('mutant: weakening the match to headings lets a wrong section through, so the section checks turn red', async () => {
    const m = await mutant('required-output.mjs', "return block.split('\\n').filter((l) => !skip(l)).filter((l) => !have.has(norm(l)));",
      "return block.split('\\n').filter((l) => !skip(l) && /^#/.test(l.trim())).filter((l) => !have.has(norm(l)));");
    for (const s of STATUS_SECTIONS) expect(() => statusSectionChecks(m, s)).toThrow();
  });
});

describe('Stop gate: /nxtg-forge:gap-analysis', () => {
  const sections = [...gap.DIMENSION_NAMES.map((d) => [d, new RegExp(`^\\| ${d} \\|`)]), ['Recommendations', /^\d+\. /]];
  const gapChecks = (g, [name, re]) => {
    const body = gapBody(GAP_EXPECTED);
    const full = unwrap(GAP_EXPECTED);
    expect(evalWith(g, transcript({ command: 'gap-analysis', body, texts: [full] })), `${name}: matching`).toBeNull();
    expect(evalWith(g, transcript({ command: 'gap-analysis', body, texts: [full.split('\n').filter((l) => !re.test(l)).join('\n')] })), `${name}: missing`).toMatch(/gate=gap-analysis/);
    const wrong = full.split('\n').map((l) => (re.test(l) ? l.replace(/(\| \w+ \| |^\d+\. ).*/, '$1nothing found') : l)).join('\n');
    expect(evalWith(g, transcript({ command: 'gap-analysis', body, texts: [wrong] })), `${name}: wrong content`).toMatch(/gate=gap-analysis/);
  };
  it.each(sections)('%s: matching allows; missing blocks; heading with wrong content blocks', (...s) => gapChecks(gate, s));

  it('run-5 C3 r3 shape (findings by severity, no dimensions) is blocked', () => {
    const r3 = '## Findings\n**Medium (2)**\n- No CHANGELOG\n- os.system call\n**Low (6)**\n- ...\n## Clean checks\n- no secrets';
    expect(evalWith(gate, transcript({ command: 'gap-analysis', body: gapBody(GAP_EXPECTED), texts: [r3] }))).toMatch(/^FORGE REQUIRED OUTPUT: gate=gap-analysis block=1\/3/);
  });

  it('the block first, then the model review, is allowed', () => {
    expect(evalWith(gate, transcript({ command: 'gap-analysis', body: gapBody(GAP_EXPECTED), texts: [unwrap(GAP_EXPECTED), '## Review (model, no accuracy claim)\n- more'] }))).toBeNull();
  });

  it('mutant: weakening the match to headings turns the dimension checks red', async () => {
    const m = await mutant('required-output.mjs', "return block.split('\\n').filter((l) => !skip(l)).filter((l) => !have.has(norm(l)));",
      "return block.split('\\n').filter((l) => !skip(l) && /^#/.test(l.trim())).filter((l) => !have.has(norm(l)));");
    for (const s of sections) expect(() => gapChecks(m, s)).toThrow();
  });
});

// ---------------------------------------------------------------------------------------------------
const TOOL = (n) => `mcp__plugin_nxtg-forge_orchestrator-mcp__${n}`;
const HELPER = { name: 'Bash', input: { command: 'bash "/c/nxtg-forge/3.13.0/scripts/feature-task.sh" "Add usage example" "Adds one"' }, result: 'status=created\ntitle=Add usage example\nspec=.forge/feature-requests/F-001.md\ntask_id=T-001' };
const CLAIM = { name: TOOL('forge_claim_task'), input: { task_id: 'T-001', agent: 'claude' }, result: '{"status":"claimed"}' };
const COMPLETE = { name: TOOL('forge_complete_task'), input: { task_id: 'T-001', agent: 'claude', result_summary: 'Added an example; tests pass.' }, result: '{"status":"completed"}' };
const GET = { name: TOOL('forge_get_tasks'), input: {}, result: '[{"id":"T-001","status":"completed","completed_by":"claude"}]' };
// The orchestrator's own task records, in forge 1.6.3's .forge/tasks/<id>.json shape (recorded from a live run).
const ROW = {
  pending: { id: 'T-001', status: 'pending', assigned_to: 'codex', completed_by: undefined },
  claimed: { id: 'T-001', status: 'assigned', assigned_to: 'claude', completed_at: null },
  completed: { id: 'T-001', status: 'completed', assigned_to: 'claude', completed_by: 'claude', completed_by_source: 'explicit', result_summary: 'Added an Examples section; the doctests pass.' },
  completedNoSummary: { id: 'T-001', status: 'completed', assigned_to: 'claude', completed_by: 'claude' },
  completedByCodex: { id: 'T-001', status: 'completed', assigned_to: 'codex', completed_by: 'codex', result_summary: 'x' },
};
const state = (row) => (id) => (id === 'T-001' ? row ?? null : null);
const feat = (g, tools, texts = [], row = ROW.completed, extra = {}) => g.evaluate({ rows: transcript({ command: 'feature', args: 'Add usage example', body: '# NXTG-Forge Feature Implementation', tools, texts }), promptId: PID, forgeDir: true, readTask: state(row), ...extra });

describe('Stop gate: /nxtg-forge:feature (C7 amended), proven by the orchestrator task record', () => {
  it('helper, then the record shows claimed and completed by claude with a summary, then get_tasks: allowed', () => {
    expect(feat(gate, [HELPER, CLAIM, COMPLETE, GET])).toBeNull();
  });
  it('run-5 C7 r2 shape (no helper, no task, no line) with .forge present: blocked, and the block puts "no task" first', () => {
    const r = feat(gate, [], ['intcomma already has a usage example, so I have not changed anything.'], null);
    expect(r).toMatch(/^FORGE REQUIRED OUTPUT: gate=feature /);
    expect(r).toMatch(/If no work is needed for this feature, do NOT create a task: print one line[\s\S]*No task created: <reason>[\s\S]*Only if you did or will do work for this feature, create its task/);
    expect(r.indexOf('No task created: <reason>')).toBeLessThan(r.indexOf('feature-task.sh'));
  });
  it('the fixed exit "No task created: <reason>" with no task: allowed (EMMA-SOUL/forge-pm ruling)', () => {
    expect(feat(gate, [], ['`intcomma` already has a usage example.\nNo task created: intcomma already has a usage example'], null)).toBeNull();
  });
  it('"No task created" after the helper DID create a task: blocked until the record shows it claimed', () => {
    expect(feat(gate, [HELPER], ['No task created: nothing to do'], ROW.pending)).toMatch(/does not record it as claimed by claude/);
  });
  it('the model PRINTS that the task is claimed and completed, but the record is still pending: blocked', () => {
    expect(feat(gate, [HELPER, GET], ['Claimed T-001 as claude.\nTask completed: T-001 is done.'], ROW.pending)).toMatch(/does not record it as claimed/);
  });
  it('the model MADE the complete call, but the record is not completed: blocked', () => {
    expect(feat(gate, [HELPER, CLAIM, COMPLETE, GET], [], ROW.claimed)).toMatch(/records T-001 as assigned, not completed by claude/);
  });
  it('a record completed without a result_summary, or by another agent, does not count', () => {
    expect(feat(gate, [HELPER, CLAIM, COMPLETE, GET], [], ROW.completedNoSummary)).toMatch(/not completed by claude with a result summary/);
    expect(feat(gate, [HELPER, CLAIM, COMPLETE, GET], [], ROW.completedByCodex)).toMatch(/does not record it as claimed by claude/);
  });
  it('the left-claimed line counts only while the record shows the task claimed by claude', () => {
    expect(feat(gate, [HELPER, CLAIM], ['Task T-001 left claimed: the tests still fail'], ROW.claimed)).toBeNull();
    expect(feat(gate, [HELPER], ['Task T-001 left claimed: the tests still fail'], ROW.pending)).toMatch(/does not record it as claimed/);
  });
  it('a completed record with no forge_get_tasks after the complete: blocked', () => {
    expect(feat(gate, [HELPER, CLAIM, COMPLETE])).toMatch(/forge_get_tasks/);
    expect(feat(gate, [HELPER, CLAIM, GET, COMPLETE])).toMatch(/forge_get_tasks/);
  });
  it('helper said no-forge-dir or no-forge, or there is no .forge/: not gated further', () => {
    expect(feat(gate, [{ ...HELPER, result: 'status=no-forge-dir' }], [], null)).toBeNull();
    expect(feat(gate, [{ ...HELPER, result: 'status=no-forge' }], [], null)).toBeNull();
    expect(feat(gate, [], [], null, { forgeDir: false })).toBeNull();
  });
  it('the hook reads the record from <cwd>/.forge/tasks/<id>.json', () => {
    mkdirSync(join(tmp, '.forge', 'tasks'), { recursive: true });
    writeFileSync(join(tmp, '.forge', 'tasks', 'T-001.json'), JSON.stringify(ROW.completed));
    expect(gate.taskReader(tmp)('T-001')).toEqual(ROW.completed);
    expect(gate.taskReader(tmp)('T-002')).toBeNull();
    expect(gate.taskReader(tmp)('../../etc/passwd')).toBeNull();
  });
  it('mutant: removing the "No task created" exit forces a do-nothing task, so the exit check turns red', async () => {
    const m = await mutant('required-output.mjs', "    if (said.some((l) => /^No task created: \\S/.test(l))) return null;\n", '');
    expect(feat(m, [], ['No task created: already done'], null)).not.toBeNull();
  });
  it('mutant: the gate trusts the transcript again (a complete call counts as completed), so the not-completed check turns red', async () => {
    const m = await mutant('required-output.mjs', '  if (!completedByClaude(row)) {',
      "  if (!completedByClaude(row) && !turn.tools.some((t) => named(t, 'forge_complete_task') && t.input.task_id === id)) {");
    expect(feat(m, [HELPER, CLAIM, COMPLETE, GET], [], ROW.claimed)).toBeNull();
  });
  it('mutant: a claim check that ignores the agent turns the agent check red', async () => {
    const m = await mutant('required-output.mjs', "row?.assigned_to === 'claude' && ", '');
    expect(feat(m, [HELPER, CLAIM, COMPLETE, GET], [], ROW.completedByCodex)).not.toMatch(/does not record it as claimed by claude/);
  });
});

describe('Stop gate: scope', () => {
  it('an ordinary turn is never gated, even right after a gated command in the same session', () => {
    const earlier = transcript({ command: 'status', body: statusBody(HUMANIZE_REPORT), texts: ['nope'] }).map((r) => ({ ...r, promptId: r.promptId && 'p-0' }));
    expect(evalWith(gate, transcript({ before: earlier, texts: ['It is sunny.'] }))).toBeNull();
  });
  it('/nxtg-forge:status-enhanced is never gated', () => {
    expect(evalWith(gate, transcript({ command: 'status-enhanced', body: statusBody(HUMANIZE_REPORT), texts: ['short'] }))).toBeNull();
  });
  it('status with --json/--git/--tests/--governance and gap-analysis with --scope are not gated; --verbose and --fix are', () => {
    for (const a of ['--json', '--git', '--tests', '--governance'])
      expect(evalWith(gate, transcript({ command: 'status', args: a, body: statusBody(HUMANIZE_REPORT), texts: ['{}'] }))).toBeNull();
    expect(evalWith(gate, transcript({ command: 'status', args: '--verbose', body: statusBody(HUMANIZE_REPORT), texts: ['x'] }))).toMatch(/gate=status/);
    expect(evalWith(gate, transcript({ command: 'gap-analysis', args: '--scope security', body: gapBody(GAP_EXPECTED), texts: ['x'] }))).toBeNull();
    expect(evalWith(gate, transcript({ command: 'gap-analysis', args: '--fix', body: gapBody(GAP_EXPECTED), texts: ['x'] }))).toMatch(/gate=gap-analysis/);
  });
  it('without a promptId, the turn is found from the last user prompt', () => {
    const rows = transcript({ command: 'status', body: statusBody(HUMANIZE_REPORT), texts: ['nope'] });
    expect(gate.evaluate({ rows, promptId: undefined })).toMatch(/gate=status/);
  });
});

describe('Stop gate: hook entry (hooks/scripts/required-output.sh)', () => {
  const run = (rows, extra = {}) => {
    const tp = join(tmp, 't.jsonl');
    writeFileSync(tp, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
    return spawnSync('bash', [join(PLUGIN, 'hooks', 'scripts', 'required-output.sh')], { input: JSON.stringify({ transcript_path: tp, prompt_id: PID, cwd: tmp, hook_event_name: 'Stop', ...extra }), encoding: 'utf8', timeout: 15000 });
  };
  it('blocks a status turn missing its report with a Stop decision, and stays silent once it is there', () => {
    const r = run(transcript({ command: 'status', body: statusBody(HUMANIZE_REPORT), texts: ['menu only'] }));
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out.decision).toBe('block');
    expect(out.reason).toMatch(/^FORGE REQUIRED OUTPUT: gate=status block=1\/3/);
    const ok = run(transcript({ command: 'status', body: statusBody(HUMANIZE_REPORT), texts: [unwrap(HUMANIZE_REPORT)] }));
    expect([ok.status, ok.stdout]).toEqual([0, '']);
  });
  it('a session that never ran a gated command exits 0 with no output, without starting node', () => {
    const r = run(transcript({ texts: ['hi'] }), {});
    expect([r.status, r.stdout]).toEqual([0, '']);
  });
  it('is registered as a Stop hook', () => {
    const stop = JSON.parse(read('hooks/hooks.json')).hooks.Stop.flatMap((g) => g.hooks.map((h) => h.command));
    expect(stop).toContain('bash ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/required-output.sh');
  });
});

describe('commands run the computed steps', () => {
  it.each([['commands/status.md', 'status-report.mjs'], ['commands/gap-analysis.md', 'gap-report.mjs']])('%s runs %s as a `!` step with node pre-approved', (f, script) => {
    const md = read(f);
    expect(md).toContain(`!\`node "\${CLAUDE_PLUGIN_ROOT}/scripts/${script}"\``);
    expect(md).toMatch(/^allowed-tools: Bash\(node:\*\)$/m);
    expect(md).toContain('A Stop check compares your reply with the block line by line');
  });
  it('no `!` step passes $ARGUMENTS (Claude Code then hands the step to the model instead of running it)', () => {
    for (const f of ['status.md', 'gap-analysis.md', 'feature.md', 'status-enhanced.md']) {
      const steps = read(`commands/${f}`).match(/!`[^`]*`/g) ?? [];
      for (const s of steps) expect(s).not.toMatch(/\$ARGUMENTS|\$\d/);
    }
  });
  it('feature.md names both fixed exits and the claim of the printed task_id', () => {
    const md = read('commands/feature.md');
    expect(md).toContain('`No task created: <reason>`');
    expect(md).toContain('`Task <id> left claimed: <reason>`');
    expect(md).toContain('it also prints `task_id=`');
  });
});
