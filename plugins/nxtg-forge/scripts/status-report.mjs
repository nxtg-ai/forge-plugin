#!/usr/bin/env node
// The /nxtg-forge:status report, computed by code (DIRECTIVE-NXTG-20261013-21, alpha run 5 F-O; founder
// directive via EMMA-SOUL 02:29Z: "enterprise grade").
// In run 5 the model gathered every input for the report and then printed only a next-actions menu.
// So the model no longer assembles the report: this script, run by the command's `!` step, computes all
// of it and prints one block between `<!-- forge-required: status v1 -->` and `<!-- /forge-required -->`.
// The command prints the block as given, and the Stop gate (scripts/required-output.mjs) refuses to end
// the turn until every line of it is in the reply. A `json=` line after the block carries the same data
// for `--json`.
//
//   node status-report.mjs [--project <dir>]
//
// The block: an executive summary (verdict, health score and grade, the three things that matter now),
// changes since the last run (a snapshot kept under XDG state, never in the project), Git, Health, Tests,
// Governance, Orchestrator (scripts/orchestrator-status.mjs; its lines are kept byte for byte, with a
// plain-text form after them), Tooling, next actions with their commands, and a provenance footer.
// Everything the script writes is ASCII except the orchestrator lines; every table row fits 80 columns.
// Any failure maps to a fixed line; nothing here prints a stack trace.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { classify, probe } from './orchestrator-status.mjs';

const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const BEGIN = '<!-- forge-required: status v1 -->';
export const END = '<!-- /forge-required -->';
export const NOT_SCORED = '**Not scored.** Health scoring needs the governance MCP server, which needs Node.js 20 or newer. Install it (https://nodejs.org), then start a new Claude Code session.';
export const FIRST_RUN = 'No previous run recorded for this project; this run is the baseline.';
export const WIDTH = 80;
const NODE_MIN = 20;

// Health dimensions as the report shows them: each is a sum of named checks with a fixed maximum.
export const DIMENSIONS = [
  ['Tests', 20, ['Test Coverage']],
  ['Types', 10, ['Type Safety']],
  ['Security', 15, ['Security']],
  ['Docs', 20, ['README', 'CLAUDE.md']],
  ['Project', 35, ['Governance', 'Git Clean', 'File Size']],
];
const CHECK_MAX = { Governance: 15, 'Git Clean': 10, 'Test Coverage': 20, README: 10, 'CLAUDE.md': 10, 'Type Safety': 10, 'File Size': 10, Security: 15 };

// The orchestrator's lines are byte-identical to v3.12.1 (C6 judges them exactly); this is their ASCII form.
export const PLAIN_ORCHESTRATOR = {
  connected: 'CONNECTED',
  not_initialized: 'CONNECTED, NOT INITIALIZED HERE - run `forge init` in this project',
  not_installed: 'NOT CONNECTED - install with `curl -fsSL https://forge.nxtg.ai/install.sh | sh`',
  error: 'ERROR - the orchestrator did not give its state; run `forge mcp` to see why',
  unavailable: 'UNAVAILABLE - the status step could not ask the orchestrator',
};

export const bar = (points, max) => {
  const filled = Math.max(0, Math.min(20, Math.round((points / max) * 20)));
  return `[${'#'.repeat(filled)}${'.'.repeat(20 - filled)}]`;
};
const ascii = (s) => String(s ?? '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7e]/g, '?');
const cell = (s) => ascii(String(s ?? '').replace(/\r?\n/g, ' ')).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').trim();
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 3)}...`);
const clipLeft = (s, n) => (s.length <= n ? s : `...${s.slice(s.length - n + 3)}`);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const signed = (n) => (n > 0 ? `+${n}` : String(n));

// A markdown table whose columns are padded to one width, so it reads aligned as plain text too.
export function table(headers, rows) {
  const w = headers.map((h, i) => Math.max(3, h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (cells) => `| ${cells.map((c, i) => String(c).padEnd(w[i])).join(' | ')} |`;
  return [line(headers), `|${w.map((x) => '-'.repeat(x + 2)).join('|')}|`, ...rows.map(line)];
}

// The stage line lives in commands/status.md, where CI checks it against the repo's STAGE file.
export function stageLine(statusMd = join(PLUGIN, 'commands', 'status.md')) {
  try {
    return readFileSync(statusMd, 'utf8').split(/\r?\n/).find((l) => l.startsWith('**Stage: ')) ?? null;
  } catch { return null; }
}

const SEVERITY_ORDER = { HIGH: 0, MED: 1, LOW: 2 };
// Pure: the findings that matter, most severe first, each with what to do and the command that does it.
export function findings(d) {
  const out = [];
  const add = (severity, issue, action, command, lost = 0) => out.push({ severity, issue, action, command, lost });
  if (!d.health) add('HIGH', 'Health is not scored (needs Node.js 20+)', 'Install Node.js 20 or newer', 'https://nodejs.org');
  for (const c of d.health?.checks ?? []) {
    const max = CHECK_MAX[c.name]; const pts = Number(c.points) || 0;
    if (!max || pts >= max) continue;
    const lost = max - pts;
    const sev = lost >= 15 ? 'HIGH' : lost >= 5 ? 'MED' : 'LOW';
    const note = c.note ? ` (${c.note})` : '';
    const map = {
      Governance: ['Forge governance is not initialized', 'Initialize governance', '/nxtg-forge:init'],
      'Git Clean': [`Uncommitted changes${note}`, 'Review and commit your changes', 'git status'],
      'Test Coverage': [`Test score ${pts}/${max}${note}`, 'Add tests where coverage is thin', '/nxtg-forge:gap-analysis'],
      README: ['No README.md', 'Write a README', '/nxtg-forge:docs-update'],
      'CLAUDE.md': ['No CLAUDE.md for AI-assisted work', 'Add a CLAUDE.md', '/init'],
      'Type Safety': [`No strict type checking${note}`, 'Configure a type checker', '/nxtg-forge:gap-analysis'],
      'File Size': [`Large files${note}`, 'Split the largest files', '/nxtg-forge:gap-analysis'],
      Security: [`Security score ${pts}/${max}${note}`, 'Fix the security findings', '/nxtg-forge:gap-analysis'],
    }[c.name];
    if (map) add(sev, map[0], map[1], map[2], lost);
  }
  const o = d.orchestrator?.state;
  if (o === 'not_installed') add('MED', 'Multi-agent orchestrator not installed', 'Install the orchestrator', 'curl -fsSL https://forge.nxtg.ai/install.sh | sh');
  if (o === 'not_initialized') add('MED', 'Orchestrator not initialized in this project', 'Initialize the orchestrator here', 'forge init');
  if (o === 'error') add('HIGH', 'Orchestrator did not report its state', 'See why the orchestrator fails', 'forge mcp');
  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.lost - a.lost);
}

// Pure: one overall verdict from the grade, the orchestrator and the findings.
export function verdict(d, f = findings(d)) {
  if (!d.health) return 'NOT SCORED';
  if (d.health.grade === 'F' || d.orchestrator?.state === 'error') return 'AT RISK';
  if (['A', 'B'].includes(d.health.grade) && !f.some((x) => x.severity === 'HIGH')) return 'HEALTHY';
  return 'NEEDS ATTENTION';
}

// Pure: the snapshot this run leaves for the next one.
export function snapshotOf(d) {
  const pts = Object.fromEntries((d.health?.checks ?? []).map((c) => [c.name, Number(c.points) || 0]));
  return {
    version: 1,
    at: d.generatedAt,
    commit: d.git?.hash ?? null,
    health: d.health ? { score: d.health.score, grade: d.health.grade, dims: Object.fromEntries(DIMENSIONS.map(([l, , n]) => [l, n.reduce((s, x) => s + (pts[x] ?? 0), 0)])) } : null,
    tests: { files: d.tests.testFiles, cases: d.tests.testCases },
    git: d.git?.isRepo ? { changed: d.git.staged + d.git.modified + d.git.untracked } : null,
    orchestrator: d.orchestrator.state,
  };
}

function changes(d) {
  const p = d.previous;
  const out = ['## Changes since last run'];
  if (!p) out.push(FIRST_RUN);
  else {
    const now = snapshotOf(d);
    out.push(`Compared with the run at ${clip(cell(p.at), 30)} (commit \`${clip(cell(p.commit ?? 'none'), 12)}\`).`);
    const num = (label, a, b) => [label, a ?? 'n/a', b ?? 'n/a', a == null || b == null ? 'n/a' : a === b ? 'same' : `${b > a ? 'up' : 'down'} ${signed(b - a)}`];
    const moved = DIMENSIONS.map(([l]) => l).filter((l) => p.health?.dims?.[l] != null && now.health?.dims?.[l] != null && p.health.dims[l] !== now.health.dims[l]);
    const short = (o) => clip(cell({ not_initialized: 'not init', not_installed: 'not installed' }[o] ?? o ?? 'n/a'), 14);
    const rows = [
      num('Health score', p.health?.score, now.health?.score),
      ['Health grade', p.health?.grade ?? 'n/a', now.health?.grade ?? 'n/a', p.health?.grade === now.health?.grade ? 'same' : 'changed'],
      // Only the dimensions that moved, each with its own values; none moved, no rows.
      ...moved.map((l) => num(`Health: ${l}`, p.health.dims[l], now.health.dims[l])),
      num('Test files', p.tests?.files, now.tests.files),
      num('Test cases', p.tests?.cases, now.tests.cases),
      num('Changed files', p.git?.changed, now.git?.changed),
      ['Orchestrator', short(p.orchestrator), short(now.orchestrator), p.orchestrator === now.orchestrator ? 'same' : 'changed'],
      ['Commit', clip(cell(p.commit ?? 'none'), 12), clip(cell(now.commit ?? 'none'), 12), p.commit === now.commit ? 'same' : 'changed'],
    ];
    out.push(...table(['Metric', 'Before', 'Now', 'Trend'], rows));
  }
  out.push(d.snapshot?.saved ? `Snapshot: \`${d.snapshot.display}\` (outside the project).` : `Snapshot not saved: ${clip(cell(d.snapshot?.error ?? 'no state directory'), 40)}.`);
  return out;
}

// Pure: gathered data in, the report block out. Every line between BEGIN and END is required output.
export function render(d) {
  const f = findings(d);
  const v = verdict(d, f);
  const name = clip(cell(d.project?.name || 'project'), 30);
  const ver = d.project?.version ? ` v${clip(cell(d.project.version), 12)}` : '';
  const g = d.git ?? {};
  const out = [BEGIN, '# Forge Status'];
  out.push(g.isRepo && g.hash
    ? `**${name}**${ver} on \`${clip(cell(g.branch || 'detached'), 24)}\` @ \`${g.hash}\``
    : `**${name}**${ver} (${g.isRepo ? 'no commits yet' : 'not a git repository'})`);
  if (d.stage) out.push(d.stage);
  out.push('---');

  // 1. Executive summary.
  const score = d.health ? `${d.health.grade} (${d.health.score}/100)` : 'not scored';
  const trend = d.previous?.health && d.health ? (d.health.score === d.previous.health.score ? ', same as last run' : `, ${d.health.score > d.previous.health.score ? 'up' : 'down'} ${Math.abs(d.health.score - d.previous.health.score)} since last run`) : '';
  out.push('## Summary', `**Verdict: ${v}** - health **${score}**${trend}`);
  if (f.length) {
    out.push(`What matters now (top ${Math.min(3, f.length)} of ${plural(f.length, 'finding')}):`);
    out.push(...table(['#', 'Severity', 'Finding'], f.slice(0, 3).map((x, i) => [i + 1, `[${x.severity}]`, clip(cell(x.issue), 60)])));
  } else out.push('What matters now: nothing; every health check is at its maximum.');

  // 2. What changed since the last run.
  out.push(...changes(d));

  // 3. Sections.
  if (!g.isRepo) out.push('## Git', 'Not a git repository.');
  else {
    const changed = g.staged + g.modified + g.untracked;
    out.push(`## Git: ${plural(changed, 'changed file')}`);
    out.push(...table(['Metric', 'Value'], [['Branch', `\`${clip(cell(g.branch || 'detached'), 40)}\``], ['Staged', g.staged], ['Modified', g.modified], ['Untracked', g.untracked]]));
    if (g.commits.length) {
      out.push(`**Recent commits (${g.commits.length}):**`);
      out.push(...table(['Hash', 'Message'], g.commits.map((c) => [`\`${c.hash}\``, clip(cell(c.message), 58)])));
    } else out.push('No commits yet.');
  }

  if (!d.health) out.push('## Health', NOT_SCORED);
  else {
    const pts = Object.fromEntries(d.health.checks.map((c) => [c.name, Number(c.points) || 0]));
    const dims = DIMENSIONS.map(([label, max, names]) => [label, max, names.reduce((s, n) => s + (pts[n] ?? 0), 0)]);
    const below = dims.filter(([, max, p]) => p < max).length;
    out.push(`## Health: ${d.health.grade} (${d.health.score}/100), ${below} of ${dims.length} dimensions below max`);
    const status = (p, max) => (p >= max ? '[OK]' : p >= max / 2 ? '[WARN]' : '[FAIL]');
    out.push(...table(['Dimension', 'Score', 'Bar', 'Status'], [
      ...dims.map(([label, max, p]) => [label, `${p}/${max}`, bar(p, max), status(p, max)]),
      ['**Overall**', `**${d.health.grade} (${d.health.score}/100)**`, bar(d.health.score, 100), `[${v === 'HEALTHY' ? 'OK' : v === 'AT RISK' ? 'FAIL' : 'WARN'}]`],
    ]));
  }

  out.push(`## Tests: ${plural(d.tests.testFiles, 'file')}, ${plural(d.tests.testCases, 'case')}`);
  out.push(...table(['Metric', 'Value'], [
    ['Test files', clip(cell(d.tests.testFiles), 12)],
    ['Test cases', clip(cell(d.tests.testCases), 12)],
    ['Runner', clip(cell(d.tests.runner || 'none detected'), 60)],
    ['Coverage', d.tests.coverage ? clip(cell(d.tests.coverage), 60) : 'not scored'],
  ]));

  out.push('## Governance');
  if (!d.governance?.initialized) out.push('Not initialized. Run `/nxtg-forge:init` (or `forge init`) to set up Forge here.');
  else if (d.governance.source === 'orchestrator' && !d.governance.vision) {
    out.push('Initialized by `forge init`; no vision or goals recorded here (`/nxtg-forge:init` adds them).');
  } else {
    out.push(...table(['Metric', 'Value'], [
      ['Status', clip(cell(d.governance.status || 'initialized'), 60)],
      ['Vision', clip(cell(d.governance.vision || 'none recorded'), 60)],
      ['Workstreams', d.governance.workstreams ?? 0],
    ]));
  }

  out.push('## Orchestrator', d.orchestrator.line, `Plain text: ${PLAIN_ORCHESTRATOR[d.orchestrator.state] ?? PLAIN_ORCHESTRATOR.error}`);

  const t = d.tooling;
  out.push(`## Tooling: ${t.agents} agents, ${t.commands} commands, ${t.hooks} hook scripts`);
  out.push(...table(['Category', 'Count', 'Source'], [['Agents', t.agents, 'Forge plugin'], ['Commands', t.commands, 'Forge plugin'], ['Hooks', `${t.hooks} scripts (${t.registrations} registrations)`, 'Forge plugin']]));

  // 4. Next actions, each with its command.
  const seen = new Set();
  const actions = f.filter((x) => (seen.has(x.command) ? false : seen.add(x.command))).slice(0, 3);
  if (!seen.has('/nxtg-forge:gap-analysis')) actions.push({ action: 'Run the five-dimension gap analysis', command: '/nxtg-forge:gap-analysis' });
  out.push(`## Next actions (${actions.length})`);
  actions.forEach((a, i) => out.push(`${i + 1}. ${a.action}: \`${a.command}\``));

  // 5. Provenance.
  out.push('## Provenance');
  out.push(...table(['Item', 'Value'], [
    ['Plugin', `nxtg-forge ${clip(cell(d.versions?.plugin ?? 'unknown'), 40)}`],
    ['Orchestrator', d.versions?.orchestrator ? `forge ${clip(cell(d.versions.orchestrator), 40)}` : 'not installed'],
    ['Generated', `${clip(cell(d.generatedAt), 30)} (${(Number(d.elapsedMs) / 1000).toFixed(1)} s)`],
    ['Project', `\`${clipLeft(cell(d.root ?? ''), 54)}\``],
    ['Commit', g.isRepo && g.hash ? `\`${g.hash}\` on \`${clip(cell(g.branch || 'detached'), 40)}\`` : 'none'],
  ]));
  out.push(END);
  return spaced(out).join('\n');
}

// Blank lines around tables and before headings, so a markdown renderer never folds the next line into a
// table. The gate skips blank lines, so they are not required output.
function spaced(lines) {
  const out = [];
  lines.forEach((l, i) => {
    const prev = out[out.length - 1];
    if (prev !== undefined && prev !== '' && (/^#{1,6} /.test(l) || l === '---' || (l.startsWith('|') && !prev.startsWith('|')) || (!l.startsWith('|') && prev.startsWith('|')))) {
      if (!(l === END)) out.push('');
    }
    out.push(l);
  });
  return out;
}

// Pure: the same data for --json.
export function toJson(d) {
  const f = findings(d);
  return {
    stage: 'Alpha',
    project: d.project, verdict: verdict(d, f),
    health: d.health ? { score: d.health.score, grade: d.health.grade, checks: d.health.checks } : null,
    findings: f.map(({ severity, issue, action, command }) => ({ severity, issue, action, command })),
    changes: d.previous ? { previous: d.previous, now: snapshotOf(d) } : null,
    git: d.git, tests: d.tests, governance: d.governance,
    orchestrator: d.orchestrator.state, orchestratorLine: d.orchestrator.line,
    tooling: d.tooling,
    provenance: { plugin: d.versions?.plugin ?? null, orchestrator: d.versions?.orchestrator ?? null, generatedAt: d.generatedAt, elapsedMs: d.elapsedMs, project: d.root, commit: d.git?.hash ?? null },
    snapshot: d.snapshot?.saved ? d.snapshot.path : null,
  };
}

const git = (root, args) => {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000 }).replace(/\n$/, ''); }
  catch { return null; }
};

export function gitData(root) {
  if (git(root, ['rev-parse', '--is-inside-work-tree']) !== 'true') return { isRepo: false };
  const porcelain = (git(root, ['status', '--porcelain']) ?? '').split('\n').filter(Boolean);
  const log = git(root, ['log', '-5', '--format=%h%x09%s']);
  return {
    isRepo: true,
    branch: git(root, ['branch', '--show-current']) || null,
    hash: git(root, ['rev-parse', '--short', 'HEAD']),
    staged: porcelain.filter((l) => l[0] !== ' ' && l[0] !== '?').length,
    modified: porcelain.filter((l) => l[1] !== ' ' && l[0] !== '?').length,
    untracked: porcelain.filter((l) => l.startsWith('??')).length,
    commits: (log ?? '').split('\n').filter(Boolean).map((l) => ({ hash: l.split('\t')[0], message: l.slice(l.indexOf('\t') + 1) })),
  };
}

export function projectInfo(root) {
  const read = (f) => { try { return readFileSync(join(root, f), 'utf8'); } catch { return null; } };
  try { const p = JSON.parse(read('package.json')); if (p?.name) return { name: p.name, version: p.version ?? null }; } catch { /* not node */ }
  for (const f of ['pyproject.toml', 'Cargo.toml']) {
    const t = read(f);
    if (!t) continue;
    const sect = t.split(/^\[/m).find((s) => /^(project|package|tool\.poetry)\]/.test(s)) ?? '';
    const name = sect.match(/^name\s*=\s*["']([^"']+)["']/m)?.[1];
    if (name) return { name, version: sect.match(/^version\s*=\s*["']([^"']+)["']/m)?.[1] ?? null };
  }
  return { name: basename(root), version: null };
}

export function runner(root, projectType) {
  const has = (f) => existsSync(join(root, f));
  if (projectType === 'node') {
    let pkg = {};
    try { pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')); } catch { /* none */ }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const r of ['vitest', 'jest', 'mocha']) if (deps[r]) return r;
    return pkg.scripts?.test ? 'npm test' : null;
  }
  if (projectType === 'python') {
    const cfg = ['pyproject.toml', 'setup.cfg', 'tox.ini'].map((f) => { try { return readFileSync(join(root, f), 'utf8'); } catch { return ''; } }).join('\n');
    return has('pytest.ini') || /pytest/.test(cfg) ? 'pytest' : 'unittest';
  }
  return { rust: 'cargo test', go: 'go test' }[projectType] ?? null;
}

export function tooling(root = PLUGIN) {
  const count = (dir, f) => { try { return readdirSync(join(root, dir), { withFileTypes: true }).filter(f).length; } catch { return 0; } };
  let hooksJson = '';
  try { hooksJson = readFileSync(join(root, 'hooks', 'hooks.json'), 'utf8'); } catch { /* none */ }
  return {
    agents: count('agents', (e) => e.isFile() && e.name.endsWith('.md')),
    commands: count('commands', (e) => e.isFile() && e.name.endsWith('.md')),
    hooks: new Set(hooksJson.match(/scripts\/[A-Za-z0-9_.-]+\.sh/g) ?? []).size,
    registrations: (hooksJson.match(/"command"\s*:/g) ?? []).length,
  };
}

// Where this project's snapshot lives: XDG state, keyed by the project path, never inside the project.
export function snapshotPath(root, env = process.env) {
  const base = env.FORGE_STATUS_STATE_DIR || join(env.XDG_STATE_HOME || join(env.HOME || homedir(), '.local', 'state'), 'nxtg-forge', 'status');
  return join(base, `${createHash('sha256').update(resolve(root)).digest('hex').slice(0, 16)}.json`);
}
const tilde = (p, home = process.env.HOME || homedir()) => (home && p.startsWith(`${home}/`) ? `~${p.slice(home.length)}` : p);

export function readSnapshot(path) {
  try { const s = JSON.parse(readFileSync(path, 'utf8')); return s?.version === 1 ? s : null; } catch { return null; }
}
export function writeSnapshot(path, snap) {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(`${path}.tmp`, `${JSON.stringify(snap)}\n`);
    renameSync(`${path}.tmp`, path);
    return { saved: true, path, display: tilde(path) };
  } catch (e) { return { saved: false, path, error: e?.code || 'write failed' }; }
}

// Loads the governance server's scoring functions; null when Node is too old or they cannot load.
export async function loadTools(nodeVersion = process.versions.node) {
  if (Number(nodeVersion.split('.')[0]) < NODE_MIN) return null;
  try { return await import(pathToFileURL(join(PLUGIN, 'servers', 'governance-mcp', 'tools.mjs')).href); }
  catch { return null; }
}

export async function gather(root, { tools, orchestrator, now = () => new Date() } = {}) {
  const started = Date.now();
  const t = tools === undefined ? await loadTools() : tools;
  let health = null; let metrics = null; let gov = null;
  if (t) {
    try { health = t.getHealthScore(root); } catch { health = null; }
    try { metrics = t.getCodeMetrics(root); } catch { metrics = null; }
    try { gov = t.getGovernanceState(root); } catch { gov = null; }
  }
  const cov = health?.checks?.find((c) => c.name === 'Test Coverage');
  let vision = null; let status = null;
  if (gov?.initialized) {
    try {
      const g = JSON.parse(readFileSync(gov.path, 'utf8'));
      vision = g.constitution?.directive ?? g.project?.vision ?? g.vision ?? null;
      status = g.constitution?.status ?? null;
    } catch { /* unreadable */ }
  }
  let orch = orchestrator; let server = null;
  if (!orch) {
    const p = await probe({ root, launcher: process.env.FORGE_ORCHESTRATOR_LAUNCHER || join(PLUGIN, 'servers', 'orchestrator-mcp', 'start.sh') });
    orch = classify(p);
    server = p.server;
  }
  let plugin = null;
  try { plugin = JSON.parse(readFileSync(join(PLUGIN, '.claude-plugin', 'plugin.json'), 'utf8')).version ?? null; } catch { /* none */ }
  const d = {
    root: resolve(root),
    project: projectInfo(root),
    stage: stageLine(),
    git: gitData(root),
    health: health && Number.isFinite(health.score) ? health : null,
    tests: {
      testFiles: metrics?.testFiles ?? 0,
      testCases: metrics?.testCaseCount ?? 0,
      runner: runner(root, metrics?.projectType),
      coverage: cov ? `${cov.points}/20${cov.note ? ` (${cov.note})` : ''}` : null,
    },
    governance: gov ? { initialized: gov.initialized, source: gov.source, vision, status, workstreams: gov.workstreams } : { initialized: false },
    orchestrator: orch,
    tooling: tooling(),
    versions: { plugin, orchestrator: server && /^\d+\.\d+/.test(server.version) ? server.version : null },
    generatedAt: now().toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC'),
  };
  const path = snapshotPath(root);
  d.previous = readSnapshot(path);
  d.elapsedMs = Date.now() - started;
  d.snapshot = writeSnapshot(path, snapshotOf(d));
  return d;
}

// What the `!` step prints: the block first, then two machine lines after its end marker, outside what the model
// reproduces. (DIRECTIVE-NXTG-20261014-04: with `orchestrator=` above the block, a model began its reply with it.)
export const stepOutput = (d) => `${render(d)}\norchestrator=${d.orchestrator.state}\njson=${JSON.stringify(toJson(d))}\n`;
export const FAILURE_OUTPUT = `${BEGIN}\n◌ **Forge status unavailable** — the status step failed\n${END}\norchestrator=unavailable\n`;

async function main(argv) {
  const i = argv.indexOf('--project');
  const root = resolve(i >= 0 ? argv[i + 1] : (process.env.CLAUDE_PROJECT_DIR || process.cwd()));
  // The scoring functions log diagnostics; none of that belongs in the report.
  console.warn = () => {}; console.error = () => {};
  const d = await gather(root);
  process.stdout.write(stepOutput(d));
  return 0;
}

const self = (() => { try { return realpathSync(process.argv[1] || ''); } catch { return ''; } })();
if (self && self === realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((c) => { process.exitCode = c; }, () => {
    process.stdout.write(FAILURE_OUTPUT);
  });
}
