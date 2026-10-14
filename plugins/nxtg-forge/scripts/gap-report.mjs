#!/usr/bin/env node
// The /nxtg-forge:gap-analysis dimension table, computed by code (DIRECTIVE-NXTG-20261013-21, alpha run 5 F-P).
// In run 5 one repetition grouped its findings by severity and dropped the dimensions. So the five
// dimensions no longer depend on the model: this script, run by the command's `!` step, runs fixed checks
// for Testing, Documentation, Security, Architecture and Performance, and prints one block between
// `<!-- forge-required: gap-analysis v1 -->` and `<!-- /forge-required -->`: a row per dimension with a
// finding or "nothing found", then at least one recommendation. The Stop gate
// (scripts/required-output.mjs) refuses to end the turn until every line of it is in the reply.
//
//   node gap-report.mjs [--project <dir>]
//
// These are fixed checks, not a review: they find what they look for and nothing else. The model's own
// review may follow the block, under the command's no-accuracy-claim note.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BEGIN = '<!-- forge-required: gap-analysis v1 -->';
export const END = '<!-- /forge-required -->';
export const DIMENSION_NAMES = ['Testing', 'Documentation', 'Security', 'Architecture', 'Performance'];
const SOURCE_EXT = new Set(['.py', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts', '.rs', '.go']);
const EXCLUDED = new Set(['node_modules', 'dist', 'build', 'out', 'target', 'coverage', 'vendor', '.venv', 'venv', '__pycache__', '.git', '.forge', '.claude', '.next', '.turbo', '.tox', 'site-packages']);
const LARGE_LINES = 300;
const LARGE_BYTES = 1024 * 1024;
const MAX_FILES = 20000;

const isTestPath = (p) => /(^|\/)(__tests__|tests?)\//.test(p) || /(^|\/)test_[^/]*\.py$|_test\.(py|go)$|\.(test|spec)\.[cm]?[jt]sx?$/.test(p);
const isConfig = (p) => /\.config\.[cm]?[jt]s$|(^|\/)(setup|conftest|noxfile)\.py$/.test(p);
const stem = (p) => basename(p).replace(/\.[^.]+$/, '').replace(/\.(test|spec)$/, '').replace(/^test_/, '').replace(/_test$/, '');

// Every file the project tracks (git), or a bounded walk when it is not a git repo.
export function listFiles(root) {
  try {
    const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024, timeout: 15000 });
    return out.split('\0').filter((p) => p && !p.split('/').some((s) => EXCLUDED.has(s))).slice(0, MAX_FILES);
  } catch { /* not a git repo */ }
  const files = [];
  const walk = (rel) => {
    if (files.length >= MAX_FILES) return;
    let entries = [];
    try { entries = readdirSync(join(root, rel), { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (EXCLUDED.has(e.name)) continue;
      const p = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(p); else if (e.isFile()) files.push(p);
    }
  };
  walk('');
  return files;
}

// Reads the facts every dimension's check needs. Pure checks below take this, so tests can feed it.
export function scan(root) {
  const files = listFiles(root);
  const text = (p) => { try { return statSync(join(root, p)).size <= LARGE_BYTES ? readFileSync(join(root, p), 'utf8') : null; } catch { return null; } };
  const size = (p) => { try { return statSync(join(root, p)).size; } catch { return 0; } };
  const code = files.filter((p) => SOURCE_EXT.has(extname(p)));
  const source = code.filter((p) => !isTestPath(p) && !isConfig(p)).map((p) => {
    const t = text(p) ?? '';
    return { path: p, lines: t ? t.split('\n').length : 0, text: t };
  });
  const read = (p) => text(p);
  let deps = null;
  try { const pkg = JSON.parse(read('package.json')); deps = Object.keys(pkg.dependencies ?? {}).length; } catch { /* not node */ }
  if (deps === null) {
    const py = read('pyproject.toml');
    if (py != null) {
      const m = py.match(/^dependencies\s*=\s*\[([\s\S]*?)\]/m);
      deps = m ? (m[1].match(/["'][^"']+["']/g) ?? []).length : 0;
    }
  }
  return {
    files,
    source,
    tests: code.filter((p) => isTestPath(p)),
    hasReadme: files.some((p) => /^readme(\.md|\.rst|\.txt)?$/i.test(p)),
    hasChangelog: files.some((p) => /^(changelog|changes|history)(\.md|\.rst|\.txt)?$/i.test(p)),
    envFiles: files.filter((p) => /(^|\/)\.env(\.[^/]*)?$/.test(p) && !/\.(example|sample|template)$/.test(p)),
    largeTracked: files.map((p) => ({ path: p, bytes: size(p) })).filter((f) => f.bytes > LARGE_BYTES),
    deps,
  };
}

const loc = (f, i) => `\`${f.path}:${i + 1}\``;
const firstHits = (source, re, { skipTests = true } = {}) => {
  const hits = [];
  for (const f of source) {
    if (skipTests && isTestPath(f.path)) continue;
    f.text.split('\n').forEach((l, i) => { if (re.test(l)) hits.push({ f, i, line: l }); });
  }
  return hits;
};

// Public definitions without a docstring (Python) or doc comment (JS/TS).
function undocumented(source) {
  const out = [];
  for (const f of source) {
    const lines = f.text.split('\n');
    const ext = extname(f.path);
    lines.forEach((l, i) => {
      if (ext === '.py') {
        const m = l.match(/^(def|class)\s+([A-Za-z]\w*)/);
        if (!m) return;
        let j = i + 1;
        while (j < lines.length && !/[:]\s*(#.*)?$/.test(lines[j - 1]) && j < i + 12) j++;
        while (j < lines.length && lines[j].trim() === '') j++;
        if (!/^\s*[rRbBuU]?("""|''')/.test(lines[j] ?? '')) out.push({ f, i, name: m[2] });
      } else if (/^\.[cm]?[jt]sx?$/.test(ext)) {
        const m = l.match(/^export\s+(default\s+)?(async\s+)?(function|class)\s+([A-Za-z_$][\w$]*)/);
        if (!m) return;
        let j = i - 1;
        while (j >= 0 && lines[j].trim() === '') j--;
        if (!/\*\/\s*$/.test(lines[j] ?? '')) out.push({ f, i, name: m[4] });
      }
    });
  }
  return out;
}

// Pure: scanned facts in, five dimension rows and the recommendations out.
export function analyze(s) {
  const rows = [];
  const recs = [];
  const add = (dim, finding, rec) => { rows.push({ dim, finding }); if (rec) recs.push(rec); };

  // Testing
  if (!s.source.length) add('Testing', 'nothing found: no source files to check');
  else {
    const testStems = new Set(s.tests.map(stem));
    const untested = s.source.filter((f) => !testStems.has(stem(f.path)) && !(extname(f.path) === '.rs' && f.text.includes('#[cfg(test)]')))
      .sort((a, b) => b.lines - a.lines || a.path.localeCompare(b.path));
    if (!untested.length) add('Testing', `nothing found: all ${s.source.length} source files have a matching test file`);
    else add('Testing', `${untested.length} of ${s.source.length} source files have no matching test file; largest: \`${untested[0].path}\` (${untested[0].lines} lines)`,
      `Add tests for \`${untested[0].path}\` (${untested[0].lines} lines, no matching test file).`);
  }

  // Documentation
  const undoc = undocumented(s.source);
  const docGaps = [];
  if (!s.hasReadme) docGaps.push('no README');
  if (!s.hasChangelog) docGaps.push('no CHANGELOG');
  if (undoc.length) docGaps.push(`${undoc.length} public definitions without a docstring, first ${loc(undoc[0].f, undoc[0].i)} \`${undoc[0].name}\``);
  if (!docGaps.length) add('Documentation', 'nothing found: README and CHANGELOG present; every public definition is documented');
  else add('Documentation', docGaps.join('; '),
    !s.hasReadme ? 'Add a README that says what the project does and how to install and run it.'
      : undoc.length ? `Document \`${undoc[0].name}\` at ${loc(undoc[0].f, undoc[0].i)}${undoc.length > 2 ? ` and the ${undoc.length - 1} other public definitions without one` : undoc.length === 2 ? ' and the 1 other public definition without one' : ''}.`
        : 'Add a CHANGELOG that records each release.');

  // Security
  const secrets = firstHits(s.source, /(password|passwd|secret|api[_-]?key|access[_-]?token)\s*[:=]\s*["'][^"'\s]{8,}["']/i);
  const dangerous = firstHits(s.source, /\beval\s*\(|\bos\.system\s*\(|shell\s*=\s*True|child_process[^\n]*\bexec\s*\(|\.innerHTML\s*=|\bexec\s*\(\s*["'a-zA-Z_]/);
  const sec = [];
  if (s.envFiles.length) sec.push(`${s.envFiles.length} .env file(s) tracked: \`${s.envFiles[0]}\``);
  if (secrets.length) sec.push(`${secrets.length} possible hardcoded secret(s), first ${loc(secrets[0].f, secrets[0].i)}`);
  if (dangerous.length) sec.push(`${dangerous.length} eval/exec/shell call(s), first ${loc(dangerous[0].f, dangerous[0].i)}`);
  if (!sec.length) add('Security', 'nothing found: no tracked .env file, hardcoded secret pattern or eval/exec/shell call (dependency audit not run)');
  else add('Security', sec.join('; '),
    s.envFiles.length ? `Remove \`${s.envFiles[0]}\` from git and rotate any secret it held.`
      : secrets.length ? `Move the value at ${loc(secrets[0].f, secrets[0].i)} into the environment or a secret store.`
        : `Replace the call at ${loc(dangerous[0].f, dangerous[0].i)} with one that does not evaluate or shell out to its input.`);

  // Architecture
  const large = s.source.filter((f) => f.lines > LARGE_LINES).sort((a, b) => b.lines - a.lines || a.path.localeCompare(b.path));
  const todos = firstHits(s.source, /\b(TODO|FIXME|HACK|XXX)\b/);
  const arch = [];
  if (large.length) arch.push(`${large.length} source file(s) over ${LARGE_LINES} lines, largest \`${large[0].path}\` (${large[0].lines})`);
  if (todos.length) arch.push(`${todos.length} TODO/FIXME/HACK marker(s), first ${loc(todos[0].f, todos[0].i)}`);
  if (!arch.length) add('Architecture', `nothing found: no source file over ${LARGE_LINES} lines and no TODO/FIXME/HACK marker`);
  else add('Architecture', arch.join('; '),
    large.length ? `Split \`${large[0].path}\` (${large[0].lines} lines) into smaller modules.` : `Resolve or ticket the marker at ${loc(todos[0].f, todos[0].i)}.`);

  // Performance
  const debug = firstHits(s.source, /\bconsole\.log\s*\(|^\s*print\s*\(/);
  const perf = [];
  if (s.largeTracked.length) perf.push(`${s.largeTracked.length} tracked file(s) over 1 MB, first \`${s.largeTracked[0].path}\``);
  if (debug.length) perf.push(`${debug.length} console.log/print call(s) in source, first ${loc(debug[0].f, debug[0].i)}`);
  const depNote = s.deps === null ? 'dependency count unknown' : `${s.deps} runtime dependencies`;
  if (!perf.length) add('Performance', `nothing found: no tracked file over 1 MB and no console.log/print in source; ${depNote}`);
  else add('Performance', `${perf.join('; ')}; ${depNote}`,
    s.largeTracked.length ? `Move \`${s.largeTracked[0].path}\` out of git (Git LFS or a release asset).` : `Remove or gate the console.log/print call at ${loc(debug[0].f, debug[0].i)}.`);

  if (!recs.length) recs.push('No gaps found by these checks. Run `/nxtg-forge:test` to confirm the suite passes.');
  return { rows, recs };
}

const cell = (s) => String(s).replace(/\r?\n/g, ' ').replace(/\\/g, '\\\\').replace(/\|/g, '\\|');

// Pure: rows and recommendations in, the required block out.
export function render({ rows, recs }) {
  return [
    BEGIN,
    '## Gap analysis: computed checks',
    '| Dimension | Finding |',
    '|---|---|',
    ...rows.map((r) => `| ${r.dim} | ${cell(r.finding)} |`),
    '**Recommendations:**',
    ...recs.map((r, i) => `${i + 1}. ${r}`),
    END,
  ].join('\n');
}

async function main(argv) {
  const i = argv.indexOf('--project');
  const root = resolve(i >= 0 ? argv[i + 1] : (process.env.CLAUDE_PROJECT_DIR || process.cwd()));
  process.stdout.write(`${render(analyze(scan(root)))}\n`);
  return 0;
}

const self = (() => { try { return realpathSync(process.argv[1] || ''); } catch { return ''; } })();
if (self && self === realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((c) => { process.exitCode = c; }, () => {
    process.stdout.write(`${BEGIN}\n◌ **Gap checks unavailable** — the check step failed\n${END}\n`);
  });
}
