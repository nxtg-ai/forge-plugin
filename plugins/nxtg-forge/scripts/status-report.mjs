#!/usr/bin/env node
// The /nxtg-forge:status report, computed by code (DIRECTIVE-NXTG-20261013-21, alpha run 5 F-O).
// In run 5 the model gathered every input for the report and then printed only a next-actions menu.
// So the model no longer assembles the report: this script, run by the command's `!` step, computes
// every section an alpha criterion reads (C1 amended, C2, C6) and prints it as one block between
// `<!-- forge-required: status v1 -->` and `<!-- /forge-required -->`. The command prints the block as
// given, and the Stop gate (scripts/required-output.mjs) refuses to end the turn until every line of it
// is in the reply.
//
//   node status-report.mjs [--project <dir>]
//
// Sections: title, project line, stage line, Git, Health (score and grade from the same getHealthScore()
// that serves forge_get_governance_health), Tests, Governance, Orchestrator (scripts/orchestrator-status.mjs)
// and Tooling. Any failure maps to a fixed line; nothing here prints a stack trace.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { classify, probe } from './orchestrator-status.mjs';

const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const BEGIN = '<!-- forge-required: status v1 -->';
export const END = '<!-- /forge-required -->';
export const NOT_SCORED = '**Not scored.** Health scoring needs the governance MCP server, which needs Node.js 20 or newer. Install it (https://nodejs.org), then start a new Claude Code session.';
const NODE_MIN = 20;

// Health dimensions as the report shows them: each is a sum of named checks with a fixed maximum.
export const DIMENSIONS = [
  ['Tests', 20, ['Test Coverage']],
  ['Types', 10, ['Type Safety']],
  ['Security', 15, ['Security']],
  ['Docs', 20, ['README', 'CLAUDE.md']],
  ['Project', 35, ['Governance', 'Git Clean', 'File Size']],
];

export const bar = (points, max) => {
  const filled = Math.max(0, Math.min(20, Math.round((points / max) * 20)));
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
};
const cell = (s) => String(s ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();

// The stage line lives in commands/status.md, where CI checks it against the repo's STAGE file.
export function stageLine(statusMd = join(PLUGIN, 'commands', 'status.md')) {
  try {
    return readFileSync(statusMd, 'utf8').split(/\r?\n/).find((l) => l.startsWith('**Stage: ')) ?? null;
  } catch { return null; }
}

// Pure: gathered data in, the report block out. Every line between BEGIN and END is required output.
export function render(d) {
  const out = [BEGIN, '# ⚡ Forge Status'];
  const name = cell(d.project?.name || 'project');
  const ver = d.project?.version ? ` v${cell(d.project.version)}` : '';
  out.push(d.git?.isRepo && d.git.hash
    ? `**${name}**${ver} on \`${cell(d.git.branch || 'detached')}\` @ \`${d.git.hash}\``
    : `**${name}**${ver} (${d.git?.isRepo ? 'no commits yet' : 'not a git repository'})`);
  if (d.stage) out.push(d.stage);
  out.push('---', '## Git');
  if (!d.git?.isRepo) out.push('Not a git repository.');
  else {
    out.push('| Metric | Value |', '|---|---|',
      `| Branch | \`${cell(d.git.branch || 'detached')}\` |`,
      `| Staged | ${d.git.staged} |`, `| Modified | ${d.git.modified} |`, `| Untracked | ${d.git.untracked} |`);
    if (d.git.commits.length) {
      out.push('**Recent commits:**', '| Hash | Message |', '|---|---|');
      for (const c of d.git.commits) out.push(`| \`${c.hash}\` | ${cell(c.message)} |`);
    } else out.push('No commits yet.');
  }
  out.push('## Health');
  if (!d.health) out.push(NOT_SCORED);
  else {
    out.push('| Dimension | Bar | Score |', '|---|---|---|');
    const pts = Object.fromEntries(d.health.checks.map((c) => [c.name, Number(c.points) || 0]));
    for (const [label, max, names] of DIMENSIONS) {
      const p = names.reduce((s, n) => s + (pts[n] ?? 0), 0);
      out.push(`| ${label} | ${bar(p, max)} | ${p}/${max} |`);
    }
    out.push(`| **Overall** | **${bar(d.health.score, 100)}** | **${d.health.grade} (${d.health.score}/100)** |`);
  }
  out.push('## Tests', '| Metric | Value |', '|---|---|',
    `| Test files | ${d.tests.testFiles} |`,
    `| Test cases | ${d.tests.testCases} |`,
    `| Runner | ${cell(d.tests.runner || 'none detected')} |`,
    `| Coverage | ${d.tests.coverage ? cell(d.tests.coverage) : 'not scored'} |`);
  out.push('## Governance');
  if (!d.governance?.initialized) out.push('Not initialized. Run `/nxtg-forge:init` (or `forge init`) to set up Forge here.');
  else if (d.governance.source === 'orchestrator' && !d.governance.vision) {
    out.push('Initialized by `forge init`; no vision or goals recorded here (`/nxtg-forge:init` adds them).');
  } else {
    out.push('| Metric | Value |', '|---|---|',
      `| Status | ${cell(d.governance.status || 'initialized')} |`,
      `| Vision | ${cell((d.governance.vision || 'none recorded').slice(0, 60))} |`,
      `| Workstreams | ${d.governance.workstreams ?? 0} |`);
  }
  out.push('## Orchestrator', d.orchestrator.line);
  out.push('## Tooling', '| Category | Count | Source |', '|---|---|---|',
    `| Agents | ${d.tooling.agents} | Forge plugin |`,
    `| Commands | ${d.tooling.commands} | Forge plugin |`,
    `| Hooks | ${d.tooling.hooks} scripts (${d.tooling.registrations} registrations) | Forge plugin |`);
  out.push(END);
  return out.join('\n');
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

// Loads the governance server's scoring functions; null when Node is too old or they cannot load.
export async function loadTools(nodeVersion = process.versions.node) {
  if (Number(nodeVersion.split('.')[0]) < NODE_MIN) return null;
  try { return await import(pathToFileURL(join(PLUGIN, 'servers', 'governance-mcp', 'tools.mjs')).href); }
  catch { return null; }
}

export async function gather(root, { tools, orchestrator } = {}) {
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
  return {
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
    orchestrator: orchestrator ?? classify(await probe({ root, launcher: process.env.FORGE_ORCHESTRATOR_LAUNCHER || join(PLUGIN, 'servers', 'orchestrator-mcp', 'start.sh') })),
    tooling: tooling(),
  };
}

async function main(argv) {
  const i = argv.indexOf('--project');
  const root = resolve(i >= 0 ? argv[i + 1] : (process.env.CLAUDE_PROJECT_DIR || process.cwd()));
  // The scoring functions log diagnostics; none of that belongs in the report.
  console.warn = () => {}; console.error = () => {};
  const d = await gather(root);
  process.stdout.write(`orchestrator=${d.orchestrator.state}\n${render(d)}\n`);
  return 0;
}

const self = (() => { try { return realpathSync(process.argv[1] || ''); } catch { return ''; } })();
if (self && self === realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((c) => { process.exitCode = c; }, () => {
    process.stdout.write(`orchestrator=unavailable\n${BEGIN}\n◌ **Forge status unavailable** — the status step failed\n${END}\n`);
  });
}
