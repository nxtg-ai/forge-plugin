// Either init sets a project up (alpha run 2, F-I). `/nxtg-forge:init` writes .claude/governance.json;
// `forge init` writes .forge/governance.json. Before this fix the plugin read only .claude/, so after
// `forge init` every prompt said "No governance.json found. Run /nxtg-forge:init", and the feature
// command skipped the orchestrator for that reason.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getGovernanceState, getHealthScore, resolveGovernancePath } from '../tools.mjs';

const HOOKS = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'hooks', 'scripts');
const ADVISORY = 'No governance.json found';

// The scaffold `forge init` writes, field for field: forge-orchestrator src/cli/init.rs:229-237.
const FORGE_INIT_SCAFFOLD = {
  version: '1.0.0',
  created_at: '2026-10-13T18:00:00+00:00',
  constitution: { principles: [], constraints: [] },
  workstreams: [],
  audit_trail: [],
};
// The file /nxtg-forge:init writes (commands/init.md, Step 5), trimmed to the fields read here.
const PLUGIN_INIT = {
  version: '3.0.0',
  project: { name: 'Plugin Init Project', vision: 'v' },
  workstreams: [{ id: 'w1' }],
  qualityGates: { testsPass: true },
  metrics: { sessionsCompleted: 0 },
  sentinelLog: [],
};

let root;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'forge-gov-loc-'));
  spawnSync('git', ['init', '-q'], { cwd: root });
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const put = (dir, obj) => {
  mkdirSync(join(root, dir), { recursive: true });
  writeFileSync(join(root, dir, 'governance.json'), JSON.stringify(obj, null, 2));
};

// Runs the UserPromptSubmit hook as Claude Code does: cwd = the project, hook input on stdin.
function preTask() {
  const r = spawnSync('bash', [join(HOOKS, 'pre-task.sh')], {
    cwd: root,
    input: JSON.stringify({ session_id: `gov-loc-${process.pid}-${Date.now()}`, prompt: 'hi' }),
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: root, TMPDIR: root },
    timeout: 20000,
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

describe('governance.json location: either init counts', () => {
  it('a project holding only the forge init scaffold is initialized, read from .forge/', () => {
    put('.forge', FORGE_INIT_SCAFFOLD);
    const s = getGovernanceState(root);
    expect(s.initialized).toBe(true);
    expect(s.source).toBe('orchestrator');
    expect(s.path).toBe(join(root, '.forge', 'governance.json'));
    expect(s.version).toBe('1.0.0');
    expect(s.workstreams).toBe(0);
    expect(s.project).toBeUndefined();
  });

  it('health gives the Governance check its 15 points on the forge init scaffold', () => {
    put('.forge', FORGE_INIT_SCAFFOLD);
    const gov = getHealthScore(root).checks.find((c) => c.name === 'Governance');
    expect(gov).toMatchObject({ status: 'pass', points: 15 });
  });

  it('.claude/ wins when both inits have run', () => {
    put('.forge', FORGE_INIT_SCAFFOLD);
    put('.claude', PLUGIN_INIT);
    const s = getGovernanceState(root);
    expect(s.source).toBe('plugin');
    expect(s.project.name).toBe('Plugin Init Project');
    expect(resolveGovernancePath(root).path).toBe(join(root, '.claude', 'governance.json'));
  });

  it('neither file: not initialized, and the message names both inits', () => {
    const s = getGovernanceState(root);
    expect(s.initialized).toBe(false);
    expect(s.message).toContain('/nxtg-forge:init');
    expect(s.message).toContain('forge init');
    expect(resolveGovernancePath(root)).toBeNull();
  });

  it('pre-task hook: no advisory after forge init alone', () => {
    put('.forge', FORGE_INIT_SCAFFOLD);
    const r = preTask();
    expect(r.status).toBe(0);
    expect(r.out).not.toContain(ADVISORY);
  });

  it('pre-task hook: no advisory after /nxtg-forge:init alone', () => {
    put('.claude', PLUGIN_INIT);
    const r = preTask();
    expect(r.status).toBe(0);
    expect(r.out).not.toContain(ADVISORY);
  });

  it('pre-task hook: the advisory still fires when neither init has run', () => {
    const r = preTask();
    expect(r.status).toBe(0);
    expect(r.out).toContain(ADVISORY);
  });

  it('pre-task hook never writes to the forge init file', () => {
    put('.forge', FORGE_INIT_SCAFFOLD);
    const before = readFileSync(join(root, '.forge', 'governance.json'), 'utf8');
    preTask();
    expect(readFileSync(join(root, '.forge', 'governance.json'), 'utf8')).toBe(before);
    expect(existsSync(join(root, '.claude', 'governance.json'))).toBe(false);
  });
});
