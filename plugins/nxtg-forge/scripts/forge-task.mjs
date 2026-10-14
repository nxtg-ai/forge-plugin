#!/usr/bin/env node
// NXTG-Forge enforced task (DIRECTIVE-NXTG-20261013-16 A). A deterministic check of "done", which a review
// prompt cannot give. While a task is active:
//   guard  (PreToolUse)  refuses edits to the test files that existed when the task began, and to test-runner
//                        config, unless the user switched the task to "tests" mode.
//   gate   (Stop)        blocks the stop unless the test command recorded at begin passes with the baseline
//                        tests unchanged, or a conflict report that checks out against the files exists.
//   auto   (UserPromptSubmit) begins a task when FORGE_ENFORCE or .claude/forge-enforce.json asks for one.
// Task state lives outside the project (FORGE_TASK_STATE_DIR, default ~/.local/state/nxtg-forge/tasks), so a
// project-level edit cannot change it. The guard refuses edit-tool writes to the state, and Bash commands that
// name the state directory or the mode/abort/begin subcommands IN PLAIN TEXT; a glob, a variable or a script
// is not caught (the user's filesystem has no integrity boundary; see the PR's gap list).
// What the gate does NOT verify: that the tests cover the new behaviour, or the installed runtime (node_modules,
// site-packages, PATH). It checks that the project's own test command passes, unchanged, against unchanged
// tests, that no new file shadows a stdlib or test-runner module, and that a conflict report's spec predates
// the task (read from the base commit).
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, fstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';

export const DEFAULT_TEST_GLOBS = [
  '**/test/**', '**/tests/**', '**/__tests__/**', '**/spec/**', '**/testdata/**',
  'test_*.py', '*_test.py', '*_test.go', '*.test.*', '*.spec.*', '*_spec.rb', '*Test.java', '*Tests.java',
];
// Files that change which tests run or how they are judged. A new one is refused even in implement mode.
export const DEFAULT_CONFIG_GLOBS = [
  'conftest.py', 'pytest.ini', 'tox.ini', 'jest.config.*', 'vitest.config.*', 'vitest.workspace.*',
  'karma.conf.*', '.mocharc*', 'playwright.config.*', 'cypress.config.*',
];
export const REPORT_REL = '.claude/forge-conflict-report.json';
const CONFIG_REL = '.claude/forge-enforce.json';
const WALK_SKIP = new Set(['.git', 'node_modules', '.venv', 'venv', '__pycache__', 'dist', 'build', 'target', '.claude', '.forge']);
const MODES = new Set(['implement', 'tests']);

// ── paths and state ──────────────────────────────────────────────────────────
export function stateDir() {
  const base = process.env.FORGE_TASK_STATE_DIR
    || join(process.env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), 'nxtg-forge', 'tasks');
  return resolve(base);
}
export function projectRoot(cwd) {
  const r = spawnSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  const root = r.status === 0 ? r.stdout.trim() : cwd;
  try { return realpathSync(root); } catch { return resolve(root); }
}
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const statePath = (root) => join(stateDir(), `${sha256(root).slice(0, 16)}.json`);
export function loadState(root) {
  try { return JSON.parse(readFileSync(statePath(root), 'utf8')); } catch { return null; }
}
function saveState(st) {
  mkdirSync(stateDir(), { recursive: true });
  const p = statePath(st.root);
  writeFileSync(`${p}.tmp`, JSON.stringify(st, null, 2));
  renameSync(`${p}.tmp`, p);
}
const isActive = (st) => st && st.status === 'active';

// ── globs ────────────────────────────────────────────────────────────────────
// gitignore-like: a pattern with no "/" matches the basename at any depth; "**" spans directories.
function globToRegex(g) {
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*' && g[i + 1] === '*') {
      if (g[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
export function matchGlob(rel, globs) {
  const base = rel.split('/').pop();
  for (const g of globs) {
    const target = g.includes('/') ? rel : base;
    if (globToRegex(g).test(target)) return g;
  }
  return null;
}

// ── project files ────────────────────────────────────────────────────────────
function listFiles(root) {
  const r = spawnSync('git', ['-C', root, 'ls-files', '-co', '--exclude-standard', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status === 0) return r.stdout.split('\0').filter(Boolean).filter((f) => existsSync(join(root, f)));
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!WALK_SKIP.has(e.name)) walk(join(dir, e.name)); }
      else if (e.isFile()) out.push(relative(root, join(dir, e.name)).split(sep).join('/'));
    }
  };
  walk(root);
  return out;
}
const hashFile = (abs) => sha256(readFileSync(abs));
// Every path under the root, with NO ignore or exclude rules (.gitignore, .git/info/exclude and
// core.excludesFile can all be written by the agent). Skips only .git and node_modules. A symlink is listed
// as itself; a symlink to a directory is listed as <link>/__init__.py when the target is a package.
export function rawWalk(root) {
  const out = [];
  const walk = (dir) => {
    let entries; try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const abs = join(dir, e.name);
      const rel = relative(root, abs).split(sep).join('/');
      if (e.isDirectory()) { if (e.name !== '.git' && e.name !== 'node_modules') walk(abs); }
      else if (e.isSymbolicLink()) {
        let st = null; try { st = statSync(abs); } catch { /* dangling */ }
        if (st?.isDirectory()) { if (existsSync(join(abs, '__init__.py'))) out.push(`${rel}/__init__.py`); }
        else out.push(rel);
      } else if (e.isFile()) out.push(rel);
    }
  };
  walk(root);
  return out;
}
function testManifest(root, globs) {
  const m = {};
  for (const f of listFiles(root)) if (matchGlob(f, globs)) m[f] = hashFile(join(root, f));
  return m;
}

// The places a test command can be changed without touching a test file.
function iniSection(text, header) {
  const lines = text.split(/\r?\n/);
  const i = lines.findIndex((l) => l.trim() === header);
  if (i < 0) return null;
  const end = lines.findIndex((l, j) => j > i && /^\s*\[/.test(l));
  return lines.slice(i, end < 0 ? undefined : end).join('\n');
}
function commandSources(root, testCommand) {
  const s = {};
  const pkg = join(root, 'package.json');
  if (existsSync(pkg)) {
    try {
      const sc = JSON.parse(readFileSync(pkg, 'utf8')).scripts || {};
      s['package.json scripts.pretest/test/posttest'] = sha256(JSON.stringify([sc.pretest ?? null, sc.test ?? null, sc.posttest ?? null]));
    } catch { s['package.json scripts.pretest/test/posttest'] = 'unreadable'; }
  }
  for (const [file, header] of [['pyproject.toml', '[tool.pytest.ini_options]'], ['setup.cfg', '[tool:pytest]']]) {
    const p = join(root, file);
    if (existsSync(p)) s[`${file} ${header}`] = sha256(String(iniSection(readFileSync(p, 'utf8'), header)));
  }
  if (/^\s*make\b/.test(testCommand) && existsSync(join(root, 'Makefile'))) s.Makefile = hashFile(join(root, 'Makefile'));
  // Any file the command names directly, e.g. `bash run_tests.sh`.
  for (const tok of testCommand.split(/\s+/)) {
    const clean = tok.replace(/^['"]|['"]$/g, '');
    if (!clean || clean.startsWith('-')) continue;
    const p = resolve(root, clean);
    const f = p.startsWith(root + sep) ? readRegular(p) : null;
    if (f) s[relative(root, p).split(sep).join('/')] = sha256(f.text);
  }
  return s;
}

function readConfig(root) {
  try { return JSON.parse(readFileSync(join(root, CONFIG_REL), 'utf8')); } catch { return {}; }
}
export function detectTestCommand(root) {
  const has = (f) => existsSync(join(root, f));
  if (has('package.json')) {
    try {
      const t = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts?.test;
      if (t && !/no test specified/.test(t)) return 'npm test';
    } catch { /* fall through */ }
  }
  if (has('Cargo.toml')) return 'cargo test';
  if (has('go.mod')) return 'go test ./...';
  const py = has('pytest.ini') || has('conftest.py')
    || (has('pyproject.toml') && readFileSync(join(root, 'pyproject.toml'), 'utf8').includes('[tool.pytest'))
    || (has('setup.cfg') && readFileSync(join(root, 'setup.cfg'), 'utf8').includes('[tool:pytest]'));
  if (py) return 'python3 -m pytest -q';
  if (listFiles(root).some((f) => /(^|\/)test_[^/]*\.py$|_test\.py$/.test(f))) return 'python3 -m unittest';
  if (has('Makefile') && /^test:/m.test(readFileSync(join(root, 'Makefile'), 'utf8'))) return 'make test';
  return null;
}

// ── begin / mode / abort ─────────────────────────────────────────────────────
export function begin(cwd, opts = {}) {
  const root = projectRoot(cwd);
  const prev = loadState(root);
  if (isActive(prev)) return { ok: false, code: 12, msg: `A Forge task is already active in ${root} (mode ${prev.mode}, since ${prev.startedAt}). Only the user ends it: /nxtg-forge:task abort.` };
  const cfg = readConfig(root);
  const mode = opts.mode || 'implement';
  if (!MODES.has(mode)) return { ok: false, code: 2, msg: `Unknown mode "${mode}". Use implement or tests.` };
  const testCommand = opts.testCommand || cfg.testCommand || detectTestCommand(root);
  if (!testCommand) return { ok: false, code: 13, msg: `No test command found in ${root}. Pass --test-cmd "<command>" or set "testCommand" in ${CONFIG_REL}. A Forge task does not begin without a check it can run.` };
  const globs = Array.isArray(cfg.testGlobs) && cfg.testGlobs.length ? cfg.testGlobs : DEFAULT_TEST_GLOBS;
  const configGlobs = Array.isArray(cfg.testConfigGlobs) ? cfg.testConfigGlobs : DEFAULT_CONFIG_GLOBS;
  const allGlobs = [...globs, ...configGlobs];
  const head = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  const st = {
    version: 1,
    root,
    mode,
    status: 'active',
    startedAt: new Date().toISOString(),
    baseCommit: head.status === 0 ? head.stdout.trim() : null,
    testCommand,
    testTimeoutSec: Number(opts.timeout || cfg.testTimeoutSec || 300),
    maxBlocks: Number(opts.maxBlocks ?? cfg.maxStopBlocks ?? 5),
    blocks: 0,
    globs: allGlobs,
    configGlobs,
    manifest: testManifest(root, allGlobs),
    rawFiles: rawWalk(root),
    commandSources: commandSources(root, testCommand),
    verdict: null,
    history: [],
  };
  // An automatic re-begin after an "unearned" task on the same commit keeps that task's baseline, so tests
  // weakened during the unearned task do not become the next task's truth.
  if (opts.carryUnearned && prev?.verdict === 'unearned' && prev.baseCommit && prev.baseCommit === st.baseCommit) {
    Object.assign(st, { manifest: prev.manifest, rawFiles: prev.rawFiles ?? st.rawFiles, commandSources: prev.commandSources, globs: prev.globs, configGlobs: prev.configGlobs, testCommand: prev.testCommand });
    st.history.push({ at: st.startedAt, event: `baseline carried from the unearned task of ${prev.startedAt}` });
  }
  saveState(st);
  return { ok: true, code: 0, state: st, msg: `Forge task begun in ${root}: mode ${mode}, test command \`${testCommand}\`, ${Object.keys(st.manifest).length} test files recorded.` };
}

function setMode(cwd, mode) {
  const root = projectRoot(cwd);
  const st = loadState(root);
  if (!isActive(st)) return { ok: false, code: 14, msg: 'No active Forge task.' };
  if (!MODES.has(mode)) return { ok: false, code: 2, msg: `Unknown mode "${mode}".` };
  st.mode = mode;
  // Back to implement: the tests written in tests mode become the new baseline.
  if (mode === 'implement') { st.manifest = testManifest(root, st.globs); st.commandSources = commandSources(root, st.testCommand); }
  st.history.push({ at: new Date().toISOString(), event: `mode ${mode}` });
  saveState(st);
  return { ok: true, code: 0, msg: `Forge task mode is now ${mode}.` };
}

function abort(cwd) {
  const root = projectRoot(cwd);
  const st = loadState(root);
  if (!isActive(st)) return { ok: false, code: 14, msg: 'No active Forge task.' };
  st.status = 'ended'; st.verdict = 'aborted'; st.endedAt = new Date().toISOString();
  saveState(st);
  return { ok: true, code: 0, msg: 'Forge task aborted by the user; no check was made.' };
}

// ── guard (PreToolUse) ───────────────────────────────────────────────────────
// Returns null to allow, or a refusal message.
export function guard(input) {
  const cwd = input.cwd || process.cwd();
  const root = projectRoot(cwd);
  const st = loadState(root);
  if (!isActive(st)) return null;
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};
  const sd = stateDir();

  if (tool === 'Bash') {
    const cmd = String(ti.command || '');
    if (cmd.includes(sd) || /nxtg-forge\/tasks/.test(cmd)) return `FORGE TASK GUARD: refused a Bash command that touches the Forge task state (${sd}). Only the user changes an active task (/nxtg-forge:task).`;
    if (/forge-task\.mjs/.test(cmd) && !/forge-task\.mjs["']?\s+(cli\s+)?status\b/.test(cmd)) return 'FORGE TASK GUARD: refused: only the user begins, relaxes or ends a Forge task (/nxtg-forge:task). `forge-task.mjs status` is allowed.';
    return null;
  }

  const fp = ti.file_path || ti.notebook_path;
  if (!fp) return null;
  const abs = resolve(cwd, fp);
  if (abs === sd || abs.startsWith(sd + sep)) return `FORGE TASK GUARD: refused ${tool} on ${abs}: that is Forge task state. Only the user changes an active task (/nxtg-forge:task).`;
  if (!(abs.startsWith(root + sep))) return null;
  if (st.mode === 'tests') return null;
  const rel = relative(root, abs).split(sep).join('/');
  const g = matchGlob(rel, st.globs);
  if (!g) return null;
  const existed = Object.prototype.hasOwnProperty.call(st.manifest, rel);
  const isConfig = matchGlob(rel, st.configGlobs);
  if (!existed && !isConfig) return null; // a new test file adds checks; it cannot weaken an existing one
  const why = existed
    ? `it is a test file (matches "${g}") that existed when this implementation task began`
    : `it is test-runner config (matches "${isConfig}"), which decides which tests run`;
  return [
    `FORGE TASK GUARD: refused ${tool} on ${rel}: ${why}.`,
    'During an implementation task the existing tests are the check on your work. Make the code satisfy them.',
    `If a test contradicts the spec, do not edit it: write a conflict report to ${REPORT_REL} (the Stop gate tells you the format) and stop.`,
    'If the task really is to change tests, the user switches modes with /nxtg-forge:task tests.',
  ].join('\n');
}

// ── conflict report ──────────────────────────────────────────────────────────
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
function userTexts(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return [];
  const out = [];
  for (const line of readFileSync(transcriptPath, 'utf8').split('\n')) {
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (e.type !== 'user' || e.isMeta) continue;
    const c = e.message?.content;
    const texts = typeof c === 'string' ? [c] : Array.isArray(c) ? c.filter((x) => x?.type === 'text').map((x) => x.text) : [];
    for (const t of texts) if (!/FORGE TASK (GATE|GUARD)/.test(t)) out.push(norm(t));
  }
  return out;
}
// Opens once and stats/reads through the same descriptor, so what is checked is what is read.
function readRegular(abs) {
  let fd;
  try {
    fd = openSync(abs, 'r');
    const st = fstatSync(fd);
    return st.isFile() ? { mtimeMs: st.mtimeMs, text: readFileSync(fd, 'utf8') } : null;
  } catch { return null; } finally { if (fd !== undefined) closeSync(fd); }
}
function lineAt(root, rel, n) {
  const abs = resolve(root, String(rel || ''));
  const f = abs.startsWith(root + sep) ? readRegular(abs) : null;
  if (!f) return { err: `file ${rel} does not exist in the project` };
  const lines = f.text.split(/\r?\n/);
  if (!Number.isInteger(n) || n < 1 || n > lines.length) return { err: `${rel} has no line ${n} (it has ${lines.length})` };
  return { text: lines[n - 1], rel: relative(root, abs).split(sep).join('/') };
}
// The spec side is read from the task's base commit, never from the working tree: a spec the agent wrote
// during the task (untracked, or edited) cannot back a conflict report.
function specLineAtBase(st, rel, n) {
  const abs = resolve(st.root, String(rel || ''));
  if (!abs.startsWith(st.root + sep)) return { err: `file ${rel} is outside the project` };
  const r = relative(st.root, abs).split(sep).join('/');
  if (!st.baseCommit) return { err: `this project had no git commit when the task began, so a spec file cannot be checked; cite the spec from the task instead ("spec":{"source":"task","text":"..."})` };
  const g = spawnSync('git', ['-C', st.root, 'show', `${st.baseCommit}:${r}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (g.status !== 0) return { err: `${r} did not exist at the task's base commit ${st.baseCommit.slice(0, 12)}; a spec must predate the task` };
  const lines = g.stdout.split(/\r?\n/);
  if (!Number.isInteger(n) || n < 1 || n > lines.length) return { err: `${r} has no line ${n} at the base commit (it has ${lines.length})` };
  return { text: lines[n - 1], rel: r };
}
// Returns { valid, errors, count }.
export function validateReport(st, transcriptPath) {
  const root = st.root;
  const p = join(root, REPORT_REL);
  const f = readRegular(p);
  if (!f) return { valid: false, errors: ['no conflict report'], count: 0 };
  if (f.mtimeMs < Date.parse(st.startedAt)) return { valid: false, errors: [`${REPORT_REL} predates this task`], count: 0 };
  let r; try { r = JSON.parse(f.text); } catch (e) { return { valid: false, errors: [`${REPORT_REL} is not valid JSON: ${e.message}`], count: 0 }; }
  const list = Array.isArray(r?.conflicts) ? r.conflicts : [];
  if (!list.length) return { valid: false, errors: ['"conflicts" must be a non-empty array'], count: 0 };
  const errors = [];
  let users = null;
  list.forEach((c, i) => {
    const at = `conflicts[${i}]`;
    const t = c?.test || {};
    const tl = lineAt(root, t.file, t.line);
    if (tl.err) errors.push(`${at}.test: ${tl.err}`);
    else {
      if (!matchGlob(tl.rel, st.globs)) errors.push(`${at}.test: ${tl.rel} is not a test file`);
      else if (st.manifest[tl.rel] !== hashFile(join(root, tl.rel))) errors.push(`${at}.test: ${tl.rel} was changed during the task (restore it first)`);
      if (norm(t.text).length < 3 || !norm(tl.text).includes(norm(t.text))) errors.push(`${at}.test.text is not on ${tl.rel}:${t.line}`);
    }
    const s = c?.spec || {};
    if (s.source === 'task') {
      users ??= userTexts(st.transcriptPath || transcriptPath);
      if (norm(s.text).length < 12) errors.push(`${at}.spec.text must quote at least 12 characters of the task`);
      else if (!users.some((u) => u.includes(norm(s.text)))) errors.push(`${at}.spec.text is not in any user message of this session`);
    } else {
      const sl = specLineAtBase(st, s.file, s.line);
      if (sl.err) errors.push(`${at}.spec: ${sl.err}`);
      else {
        if (matchGlob(sl.rel, st.globs)) errors.push(`${at}.spec: ${sl.rel} is a test file; cite the spec, not a test`);
        if (norm(s.text).length < 3 || !norm(sl.text).includes(norm(s.text))) errors.push(`${at}.spec.text is not on ${sl.rel}:${s.line} (as of the base commit)`);
      }
    }
    if (norm(c?.why).length < 20) errors.push(`${at}.why must explain the conflict (20+ characters)`);
  });
  return { valid: errors.length === 0, errors, count: list.length };
}

// ── gate (Stop) ──────────────────────────────────────────────────────────────
// Module names a new file must not take: the Python standard library (which includes unittest) and common
// test runners. A new `unittest/__init__.py` at the root would otherwise make `python3 -m unittest` run it.
const RUNNER_MODULES = ['pytest', '_pytest', 'pluggy', 'nose', 'nose2', 'sitecustomize', 'usercustomize'];
const STDLIB_FALLBACK = ['unittest', 'doctest', 'test', 'site', 'os', 'sys', 'io', 'json', 're', 'importlib', 'runpy', 'pkgutil', 'inspect', 'traceback', 'functools', 'typing', 'collections', 'contextlib', 'argparse', 'logging', 'pathlib', 'subprocess', 'math', 'random', 'time', 'datetime'];
let shadowNames = null;
function moduleNames() {
  if (shadowNames) return shadowNames;
  const r = spawnSync('python3', ['-I', '-c', "import sys;print('\\n'.join(sorted(sys.stdlib_module_names)))"], { encoding: 'utf8' });
  const std = r.status === 0 ? r.stdout.split('\n').filter(Boolean) : STDLIB_FALLBACK;
  shadowNames = new Set([...std, ...RUNNER_MODULES]);
  return shadowNames;
}
// A file new since begin that would import as a top-level module named like the stdlib or a test runner:
// `<dir>/<name>.{py,pyc,so,pyd}` or `<dir>/<name>/__init__.*` where <dir> is not itself a package.
// Enumerated by rawWalk, never through git's exclude rules. A task begun without a snapshot fails closed.
const IMPORTABLE = /\.(py|pyc|so|pyd)$/;
export function shadowingFiles(st) {
  if (!Array.isArray(st.rawFiles)) return ['this task began without a file snapshot (an older Forge version), so module shadowing cannot be checked: the user must run /nxtg-forge:task abort, then begin'];
  const before = new Set(st.rawFiles);
  const names = moduleNames();
  const out = [];
  for (const f of rawWalk(st.root)) {
    if (before.has(f) || !IMPORTABLE.test(f)) continue;
    const parts = f.split('/');
    const stem = parts.at(-1).split('.')[0];
    const pkgInit = stem === '__init__';
    const name = pkgInit ? parts.at(-2) : stem;
    const parent = parts.slice(0, pkgInit ? -2 : -1).join('/');
    if (!name || !names.has(name)) continue;
    if (parent && existsSync(join(st.root, parent, '__init__.py'))) continue; // inside a package: no shadowing
    out.push(`${f}: new file shadows the "${name}" module the tests or the runner import`);
  }
  return out;
}
export function violations(st) {
  const shadows = shadowingFiles(st);
  if (st.mode === 'tests') return shadows;
  const v = [...shadows];
  const now = testManifest(st.root, st.globs);
  for (const [rel, h] of Object.entries(st.manifest)) {
    if (!(rel in now)) v.push(`${rel}: deleted`);
    else if (now[rel] !== h) v.push(`${rel}: modified`);
  }
  for (const rel of Object.keys(now)) if (!(rel in st.manifest) && matchGlob(rel, st.configGlobs)) v.push(`${rel}: new test-runner config`);
  const cs = commandSources(st.root, st.testCommand);
  for (const [k, h] of Object.entries(st.commandSources)) if (cs[k] !== h) v.push(`${k}: changed (it decides what the test command runs)`);
  for (const k of Object.keys(cs)) if (!(k in st.commandSources)) v.push(`${k}: added (it decides what the test command runs)`);
  return v;
}
export function runTests(st) {
  const r = spawnSync('bash', ['-c', st.testCommand], {
    cwd: st.root, encoding: 'utf8', timeout: st.testTimeoutSec * 1000, maxBuffer: 1 << 26,
    env: { ...process.env, CI: process.env.CI ?? '1' },
  });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  if (r.error?.code === 'ETIMEDOUT') return { pass: false, why: `timed out after ${st.testTimeoutSec}s`, out };
  if (r.error) return { pass: false, why: `could not run: ${r.error.message}`, out };
  return { pass: r.status === 0, why: `exit ${r.status}${r.signal ? ` (${r.signal})` : ''}`, out };
}
const tail = (s, n = 40) => s.split('\n').slice(-n).join('\n');
const REPORT_FORMAT = `{"conflicts":[{"spec":{"file":"<spec file>","line":<n>,"text":"<exact text on that line>"},
  "test":{"file":"<test file>","line":<n>,"text":"<exact text on that line>"},
  "why":"<why no correct implementation satisfies both>"}]}
(When the spec is the task you were given, use "spec":{"source":"task","text":"<12+ characters quoted from it>"}.)`;

// Returns { decision: 'allow'|'block', reason, verdict }.
export function gate(input) {
  const root = projectRoot(input.cwd || process.cwd());
  const st = loadState(root);
  if (!isActive(st)) return { decision: 'allow' };
  if (input.transcript_path) st.transcriptPath = input.transcript_path;
  const finish = (verdict, reason) => {
    st.status = 'ended'; st.verdict = verdict; st.endedAt = new Date().toISOString();
    st.history.push({ at: st.endedAt, event: `ended ${verdict}` });
    saveState(st);
    return { decision: 'allow', verdict, reason };
  };
  const v = violations(st);
  const t = v.length ? null : runTests(st);
  if (t?.pass) return finish('passed', `Forge task gate: \`${st.testCommand}\` passed with the baseline tests unchanged. Task ended: passed.`);
  const rep = v.length ? null : validateReport(st, input.transcript_path);
  if (rep?.valid) return finish('conflict', `Forge task gate: tests do not pass, and a conflict report with ${rep.count} conflict(s) checks out against the files. Task ended: conflict reported. A person must decide.`);

  st.blocks += 1;
  if (st.blocks > st.maxBlocks) {
    return finish('unearned', `Forge task gate: NOT DONE. After ${st.maxBlocks} blocked stops the tests still do not pass${v.length ? ' and test files were changed' : ''}, and there is no valid conflict report. Task ended: unearned. Do not treat this work as done.`);
  }
  st.history.push({ at: new Date().toISOString(), event: `blocked ${st.blocks}/${st.maxBlocks}` });
  saveState(st);
  const parts = [`FORGE TASK GATE (block ${st.blocks} of ${st.maxBlocks}): this task is not done.`];
  if (v.length) {
    parts.push('Test files, the test command, or the modules it runs changed since the task began. Restore or remove them; the gate does not run the tests until you do:');
    parts.push(...v.map((x) => `  - ${x}`));
    if (st.baseCommit) parts.push(`  Restore tracked files with: git checkout ${st.baseCommit} -- <file>`);
  } else {
    parts.push(`\`${st.testCommand}\` failed (${t.why}). Last lines:`, tail(t.out));
    if (rep && rep.errors[0] !== 'no conflict report') parts.push(`Your conflict report was not accepted:\n${rep.errors.map((e) => `  - ${e}`).join('\n')}`);
  }
  parts.push(`Either make the code pass the unchanged tests, or, if a test contradicts the spec, write ${REPORT_REL}:\n${REPORT_FORMAT}`);
  return { decision: 'block', reason: parts.join('\n') };
}

// ── CLI and hook entry points ────────────────────────────────────────────────
function readStdin() { try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; } }
function parseFlags(args) {
  const o = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--mode') o.mode = args[++i];
    else if (a === '--test-cmd') o.testCommand = args[++i];
    else if (a === '--timeout') o.timeout = args[++i];
    else if (a === '--max-blocks') o.maxBlocks = Number(args[++i]);
    else if (a === '--project') o.project = args[++i];
  }
  return o;
}
function statusText(cwd) {
  const st = loadState(projectRoot(cwd));
  if (!st) return 'No Forge task has run in this project.';
  return [
    `Forge task: ${st.status}${st.verdict ? ` (${st.verdict})` : ''}, mode ${st.mode}, since ${st.startedAt}`,
    `test command: ${st.testCommand}  timeout ${st.testTimeoutSec}s  blocks ${st.blocks}/${st.maxBlocks}`,
    `baseline test files: ${Object.keys(st.manifest).length}${st.baseCommit ? `  base commit ${st.baseCommit.slice(0, 12)}` : ''}`,
  ].join('\n');
}

function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === 'guard') {
    const msg = guard(readStdin());
    if (msg) { process.stderr.write(`${msg}\n`); return 2; }
    return 0;
  }
  if (cmd === 'gate') {
    const r = gate(readStdin());
    if (r.decision === 'block') process.stdout.write(JSON.stringify({ decision: 'block', reason: r.reason }));
    else if (r.reason) process.stdout.write(JSON.stringify({ systemMessage: r.reason }));
    return 0;
  }
  if (cmd === 'auto') {
    const input = readStdin();
    const cwd = input.cwd || process.cwd();
    const root = projectRoot(cwd);
    const want = process.env.FORGE_ENFORCE || readConfig(root).autoBegin;
    if (!want || want === '0' || want === 'off' || isActive(loadState(root))) return 0;
    const r = begin(cwd, { mode: MODES.has(want) ? want : 'implement', carryUnearned: true });
    process.stdout.write(`${r.ok ? r.msg : `[Forge] Enforcement was requested but no task began: ${r.msg}`}\n`);
    return 0;
  }
  // User-facing CLI: `cli <sub>` (from /nxtg-forge:task) or the sub directly.
  const args = cmd === 'cli' ? rest : argv;
  const [sub, ...more] = args;
  const flags = parseFlags(more);
  const cwd = flags.project ? resolve(flags.project) : process.cwd();
  let r;
  if (!sub || sub === 'status') { process.stdout.write(`${statusText(cwd)}\n`); return 0; }
  if (sub === 'begin') r = begin(cwd, flags);
  else if (sub === 'tests' || sub === 'implement') r = setMode(cwd, sub);
  else if (sub === 'mode') r = setMode(cwd, more[0]);
  else if (sub === 'abort') r = abort(cwd);
  else r = { ok: false, code: 2, msg: `Unknown subcommand "${sub}". Use begin, status, tests, implement or abort.` };
  (r.ok ? process.stdout : process.stderr).write(`${r.msg}\n`);
  return r.code;
}

const self = (() => { try { return realpathSync(process.argv[1] || ''); } catch { return ''; } })();
if (self && self === realpathSync(new URL(import.meta.url).pathname)) process.exitCode = main(process.argv.slice(2));
