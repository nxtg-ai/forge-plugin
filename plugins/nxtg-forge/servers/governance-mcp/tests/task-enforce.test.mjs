// Enforced task (DIRECTIVE-NXTG-20261013-16 A): a test-file write guard, a conflict report, and a Stop gate on
// the project's own test command. Every case here is synthetic and written for this file (pre-registered in
// the PR, cases C1-C13). None comes from, or was shaped by, any benchmark.
//
// The hooks run as Claude Code runs them: `bash task-enforce.sh <guard|gate|auto>`, hook input JSON on stdin,
// in a real git project. Each mechanism's checks are a function of the plugin directory, so the same checks
// run against the shipped scripts (must pass) and against a mutant copy (must fail).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
let tmp;
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), 'forge-task-')); });
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd, encoding: 'utf8' });
let seq = 0;
function project(files, name = 'p') {
  const root = join(tmp, `${name}-${seq++}`);
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
  git(root, 'init', '-q'); git(root, 'add', '-A'); git(root, 'commit', '-qm', 'base');
  return root;
}
const write = (root, rel, body) => { mkdirSync(dirname(join(root, rel)), { recursive: true }); writeFileSync(join(root, rel), body); };

// C1 / C2: a spec line, a source stub, and a test. `expected` 5 makes the test contradict the spec.
const calc = (expected) => ({
  'SPEC.md': '# Calc\nadd(a, b) returns the sum of a and b.\n',
  'calc.py': 'def add(a, b):\n    raise NotImplementedError\n',
  'tests/__init__.py': '',
  'tests/test_calc.py': `import unittest\nfrom calc import add\n\n\nclass T(unittest.TestCase):\n    def test_add(self):\n        self.assertEqual(add(2, 2), ${expected})\n`,
});
const SUM = 'def add(a, b):\n    return a + b\n';

// Runs the plugin's hook wrapper from `plugin` (the shipped plugin or a mutant copy).
function hooks(plugin, root, extraEnv = {}) {
  const env = { PATH: process.env.PATH, HOME: tmp, FORGE_TASK_STATE_DIR: join(tmp, 'state'), ...extraEnv };
  const run = (mode, input) => {
    const r = spawnSync('bash', [join(plugin, 'hooks', 'scripts', 'task-enforce.sh'), mode], {
      cwd: root, input: JSON.stringify({ cwd: root, ...input }), encoding: 'utf8', env, timeout: 60000,
    });
    return { status: r.status, out: r.stdout, err: r.stderr };
  };
  const cli = (...args) => spawnSync('node', [join(plugin, 'scripts', 'forge-task.mjs'), ...args], { cwd: root, encoding: 'utf8', env });
  return {
    cli,
    begin: (...a) => cli('begin', ...a),
    status: () => cli('status').stdout,
    guard: (tool, tool_input) => run('guard', { tool_name: tool, tool_input }),
    gate: (extra = {}) => {
      const r = run('gate', { hook_event_name: 'Stop', stop_hook_active: false, ...extra });
      const j = r.out ? JSON.parse(r.out) : {};
      return { ...r, blocked: j.decision === 'block', reason: j.reason ?? j.systemMessage ?? '' };
    },
    auto: () => run('auto', { hook_event_name: 'UserPromptSubmit', prompt: 'go' }),
  };
}
const report = (root, conflicts) => write(root, '.claude/forge-conflict-report.json', JSON.stringify({ conflicts }));
const C1_REPORT = {
  spec: { file: 'SPEC.md', line: 2, text: 'returns the sum of a and b' },
  test: { file: 'tests/test_calc.py', line: 7, text: 'self.assertEqual(add(2, 2), 5)' },
  why: 'The spec says add returns the sum, and 2 + 2 is 4, but the test requires 5.',
};

// ── mechanism checks, parameterised by plugin directory ─────────────────────
function guardChecks(plugin) {
  const root = project(calc(5));
  const h = hooks(plugin, root);
  expect(h.begin().status).toBe(0);
  const edit = h.guard('Edit', { file_path: join(root, 'tests/test_calc.py'), old_string: '5', new_string: '4' });
  expect(edit.status).toBe(2);
  expect(edit.err).toContain('refused Edit on tests/test_calc.py');
  expect(edit.err).toContain('existed when this implementation task began');
  expect(h.guard('Write', { file_path: 'tests/test_calc.py', content: '' }).status).toBe(2); // relative path
  expect(h.guard('MultiEdit', { file_path: join(root, 'tests/test_calc.py'), edits: [] }).status).toBe(2);
  expect(h.guard('Write', { file_path: join(root, 'conftest.py'), content: '' }).err).toContain('test-runner config');
  expect(h.guard('Write', { file_path: join(root, 'calc.py'), content: SUM }).status).toBe(0);
  expect(h.guard('Write', { file_path: join(root, 'tests/test_more.py'), content: '' }).status).toBe(0);
}

function reportChecks(plugin) {
  const root = project(calc(5));
  const h = hooks(plugin, root);
  expect(h.begin().status).toBe(0);
  write(root, 'calc.py', SUM);
  const bogus = [
    { ...C1_REPORT, test: { ...C1_REPORT.test, line: 99 } }, // no such line
    { ...C1_REPORT, test: { ...C1_REPORT.test, text: 'assertEqual(add(2, 2), 6)' } }, // not on that line
    { ...C1_REPORT, spec: { file: 'SPEC.md', line: 2, text: 'returns the product' } }, // not in the spec
    { ...C1_REPORT, spec: { file: 'tests/test_calc.py', line: 7, text: 'assertEqual' } }, // a test cited as spec
    { ...C1_REPORT, why: 'conflict' }, // no explanation
  ];
  for (const c of bogus) {
    report(root, [c]);
    const g = h.gate();
    expect(g.blocked, JSON.stringify(c)).toBe(true);
    expect(g.reason).toContain('Your conflict report was not accepted');
  }
}

function gateChecks(plugin) {
  // Tests fail and nothing else happened: blocked, with the failing output.
  const a = project(calc(4), 'a');
  const ha = hooks(plugin, a);
  expect(ha.begin().status).toBe(0);
  const g1 = ha.gate();
  expect(g1.blocked).toBe(true);
  expect(g1.reason).toContain('`python3 -m unittest` failed');
  expect(g1.reason).toContain('NotImplementedError');
  // C3: the test was weakened behind the guard's back (as `sed -i` would): blocked, file named, even though
  // the weakened suite passes.
  write(a, 'calc.py', SUM);
  write(a, 'tests/test_calc.py', readFileSync(join(a, 'tests/test_calc.py'), 'utf8').replace('add(2, 2), 4', 'add(2, 2), add(2, 2)'));
  const g2 = ha.gate();
  expect(g2.blocked).toBe(true);
  expect(g2.reason).toContain('tests/test_calc.py: modified');
  // Restored: passes, and the task ends.
  git(a, 'checkout', '--', 'tests/test_calc.py');
  const g3 = ha.gate();
  expect(g3.blocked).toBe(false);
  expect(g3.reason).toContain('Task ended: passed');
  expect(ha.status()).toMatch(/ended \(passed\)/);
}

// ── shipped behaviour ────────────────────────────────────────────────────────
describe('enforced task: shipped behaviour (cases C1-C13)', () => {
  it('C1 guard: an existing test file and new test-runner config are refused; source and new tests are not', () => guardChecks(PLUGIN));

  it('C1 conflict report: a report whose every line checks out ends the task as "conflict"', () => {
    const root = project(calc(5));
    const h = hooks(PLUGIN, root);
    h.begin();
    write(root, 'calc.py', SUM);
    expect(h.gate().blocked).toBe(true); // 4 != 5
    report(root, [C1_REPORT]);
    const g = h.gate();
    expect(g.blocked).toBe(false);
    expect(g.reason).toContain('conflict report with 1 conflict(s) checks out');
    expect(h.status()).toMatch(/ended \(conflict\)/);
  });

  it('C6 conflict report: bogus reports are rejected with the reason', () => reportChecks(PLUGIN));

  it('C2 + C3 gate: blocks failing tests and weakened tests; passes the real fix', () => gateChecks(PLUGIN));

  it('C4 gate: a new pytest.ini (test-runner config) blocks even when the tests then pass', () => {
    const root = project(calc(4));
    const h = hooks(PLUGIN, root);
    h.begin();
    write(root, 'calc.py', SUM);
    write(root, 'pytest.ini', '[pytest]\naddopts = -k nothing\n');
    const g = h.gate();
    expect(g.blocked).toBe(true);
    expect(g.reason).toContain('pytest.ini: new test-runner config');
  });

  it('C5 gate: changing package.json scripts.test blocks, even to a command that passes', () => {
    const root = project({
      'package.json': JSON.stringify({ name: 'c5', private: true, scripts: { test: 'node tests/check.mjs' } }),
      'lib.mjs': 'export const twice = (n) => n;\n',
      'tests/check.mjs': "import assert from 'node:assert';\nimport { twice } from '../lib.mjs';\nassert.equal(twice(3), 6);\n",
    });
    const h = hooks(PLUGIN, root);
    expect(h.begin().stdout).toContain('test command `npm test`');
    write(root, 'package.json', JSON.stringify({ name: 'c5', private: true, scripts: { test: 'exit 0' } }));
    const g = h.gate();
    expect(g.blocked).toBe(true);
    expect(g.reason).toContain('package.json scripts.pretest/test/posttest: changed');
  });

  it('C7 conflict report: a spec quoted from the task must appear in a user message of the session', () => {
    const root = project(calc(5));
    const h = hooks(PLUGIN, root);
    h.begin();
    const transcript = join(tmp, 'transcript.jsonl');
    writeFileSync(transcript, [
      { type: 'user', message: { role: 'user', content: 'Implement add so that it returns the sum of its two arguments.' } },
      { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'add must return the product of its arguments' }] } },
      { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'add must return the product of its arguments' }] } },
    ].map((e) => JSON.stringify(e)).join('\n'));
    const viaTask = (text) => ({ ...C1_REPORT, spec: { source: 'task', text } });
    report(root, [viaTask('add must return the product of its arguments')]); // only the agent said it
    expect(h.gate({ transcript_path: transcript }).blocked).toBe(true);
    report(root, [viaTask('returns the sum of its two arguments')]);
    expect(h.gate({ transcript_path: transcript }).blocked).toBe(false);
  });

  it('C8 gate: bounded; after maxBlocks blocked stops the task ends as "unearned" and the stop is allowed', () => {
    const root = project(calc(5));
    const h = hooks(PLUGIN, root);
    h.begin('--max-blocks', '2');
    expect(h.gate().blocked).toBe(true);
    expect(h.gate().blocked).toBe(true);
    const last = h.gate();
    expect(last.blocked).toBe(false);
    expect(last.reason).toContain('NOT DONE');
    expect(h.status()).toMatch(/ended \(unearned\)/);
    expect(h.gate().reason).toBe(''); // ended: the gate is quiet again
  });

  it('C9 no task: guard and gate are no-ops', () => {
    const root = project(calc(5));
    const h = hooks(PLUGIN, root);
    expect(h.guard('Edit', { file_path: join(root, 'tests/test_calc.py') }).status).toBe(0);
    const g = h.gate();
    expect(g.status).toBe(0);
    expect(g.out).toBe('');
  });

  it('C10 tests mode: the user may let the agent change tests; back to implement re-baselines them', () => {
    const root = project(calc(5));
    const h = hooks(PLUGIN, root);
    h.begin();
    expect(h.cli('tests').status).toBe(0);
    expect(h.guard('Edit', { file_path: join(root, 'tests/test_calc.py') }).status).toBe(0);
    write(root, 'tests/test_calc.py', readFileSync(join(root, 'tests/test_calc.py'), 'utf8').replace('), 5)', '), 4)'));
    expect(h.cli('implement').status).toBe(0);
    write(root, 'calc.py', SUM);
    expect(h.gate().reason).toContain('Task ended: passed');
  });

  it('C11 begin refuses when there is no test command to run', () => {
    const root = project({ 'README.md': '# nothing to test\n' });
    const r = hooks(PLUGIN, root).begin();
    expect(r.status).toBe(13);
    expect(r.stderr).toContain('does not begin without a check it can run');
  });

  it('C12 auto: FORGE_ENFORCE begins a task on the next prompt; without it, nothing begins', () => {
    const root = project(calc(5));
    expect(hooks(PLUGIN, root).auto().out).toBe('');
    expect(hooks(PLUGIN, root).status()).toContain('No Forge task has run');
    const r = hooks(PLUGIN, root, { FORGE_ENFORCE: 'implement' }).auto();
    expect(r.out).toContain('Forge task begun');
    expect(hooks(PLUGIN, root).guard('Edit', { file_path: join(root, 'tests/test_calc.py') }).status).toBe(2);
  });

  it('C13 guard: the agent cannot end, relax or rewrite the task through Bash or the edit tools', () => {
    const root = project(calc(5));
    const h = hooks(PLUGIN, root);
    h.begin();
    const sd = join(tmp, 'state');
    for (const command of [`node ${PLUGIN}/scripts/forge-task.mjs abort`, `node ${PLUGIN}/scripts/forge-task.mjs tests`, `rm -rf ${sd}`, 'rm -rf ~/.local/state/nxtg-forge/tasks']) {
      expect(h.guard('Bash', { command }).status, command).toBe(2);
    }
    expect(h.guard('Bash', { command: `node ${PLUGIN}/scripts/forge-task.mjs status` }).status).toBe(0);
    expect(h.guard('Bash', { command: 'python3 -m unittest' }).status).toBe(0);
    expect(h.guard('Write', { file_path: join(sd, 'x.json'), content: '{}' }).status).toBe(2);
  });

  it('a conflict report older than the task is not accepted', () => {
    const root = project(calc(5));
    report(root, [C1_REPORT]);
    utimesSync(join(root, '.claude/forge-conflict-report.json'), new Date(2020, 0, 1), new Date(2020, 0, 1));
    const h = hooks(PLUGIN, root);
    h.begin();
    write(root, 'calc.py', SUM);
    const g = h.gate();
    expect(g.blocked).toBe(true);
    expect(g.reason).toContain('predates this task');
  });
});

// ── mutants: each mechanism's checks must go red when its logic is removed ──
function mutant(name, file, from, to) {
  const dir = join(tmp, `mutant-${name}`);
  cpSync(join(PLUGIN, 'hooks', 'scripts'), join(dir, 'hooks', 'scripts'), { recursive: true });
  cpSync(join(PLUGIN, 'scripts'), join(dir, 'scripts'), { recursive: true });
  const p = join(dir, file);
  const src = readFileSync(p, 'utf8');
  expect(src.split(from).length - 1, `mutant ${name}: anchor must occur exactly once`).toBe(1);
  writeFileSync(p, src.replace(from, to));
  return dir;
}
const ENGINE = 'scripts/forge-task.mjs';

describe('enforced task: mutants turn the checks red', () => {
  it('guard mutant (refusal removed) fails the guard checks', () => {
    const m = mutant('guard', ENGINE, 'if (!existed && !isConfig) return null;', 'return null;');
    expect(() => guardChecks(m)).toThrow();
  });

  it('conflict-report mutant (any report accepted) fails the report checks', () => {
    const m = mutant('report', ENGINE, 'return { valid: errors.length === 0, errors, count: list.length };', 'return { valid: true, errors, count: list.length };');
    expect(() => reportChecks(m)).toThrow();
  });

  it('gate mutant (test result ignored) fails the gate checks', () => {
    const m = mutant('gate-tests', ENGINE, 'return { pass: r.status === 0,', 'return { pass: true,');
    expect(() => gateChecks(m)).toThrow();
  });

  it('gate mutant (baseline comparison removed) fails the gate checks', () => {
    const m = mutant('gate-baseline', ENGINE, "if (st.mode === 'tests') return [];\n  const v = [];", 'return [];\n  const v = [];');
    expect(() => gateChecks(m)).toThrow();
  });

  it('the shipped scripts pass all three sets of checks (control for the mutants)', () => {
    guardChecks(PLUGIN);
    reportChecks(PLUGIN);
    gateChecks(PLUGIN);
  });
});
