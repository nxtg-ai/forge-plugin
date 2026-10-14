// Every component count a user sees matches what ships (DIRECTIVE-NXTG-20261013-04; alpha run 2 F-J).
// At v3.11.0, /nxtg-forge:status hard-coded "23 built-in" agents while the plugin shipped 33, and
// plugin.json said "23 hooks" while status said 7.
// Definitions: agents = agents/*.md; commands = commands/*.md; skills = skills/*/SKILL.md;
// hooks = distinct hook scripts wired in hooks/hooks.json; registrations = its command entries.
// plugin.json's hooks count is registrations, as .github/scripts/check-description-counts.py
// defines it (#52); status shows both.
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NODE_TOOLS } from './lib/checks.mjs';

const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(PLUGIN, p), 'utf8').replace(/\r\n/g, '\n');
const mdIn = (d) => readdirSync(join(PLUGIN, d)).filter((f) => f.endsWith('.md')).length;

const HOOK_SCRIPTS = [...new Set(read('hooks/hooks.json').match(/scripts\/[A-Za-z0-9_.-]+\.sh/g))].map((s) => s.slice(8)).sort();
const TREE = {
  agents: mdIn('agents'),
  commands: mdIn('commands'),
  skills: readdirSync(join(PLUGIN, 'skills')).filter((d) => existsSync(join(PLUGIN, 'skills', d, 'SKILL.md'))).length,
  hooks: HOOK_SCRIPTS.length,
  registrations: Object.values(JSON.parse(read('hooks/hooks.json')).hooks)
    .flatMap((groups) => groups.flatMap((g) => g.hooks ?? [])).length,
};

// The count command a status file tells the model to run, with ${CLAUDE_PLUGIN_ROOT} expanded as
// Claude Code does in a command body.
function countCommand(file) {
  const blocks = [...read(file).matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1]).filter((b) => b.includes('agents='));
  expect(blocks, `${file} has exactly one count command`).toHaveLength(1);
  return blocks[0];
}
function runCount(file) {
  const r = spawnSync('bash', ['-c', countCommand(file).replaceAll('${CLAUDE_PLUGIN_ROOT}', PLUGIN)], { encoding: 'utf8' });
  expect(r.status).toBe(0);
  return Object.fromEntries(r.stdout.trim().split(/\s+/).map((kv) => kv.split('=')).map(([k, v]) => [k, Number(v)]));
}

describe('component counts match the tree', () => {
  it('every README "What You Get" row equals the tree', () => {
    const readme = readFileSync(join(PLUGIN, '..', '..', 'README.md'), 'utf8');
    const row = (label) => Number(readme.match(new RegExp(`\\| ${label} \\| (\\d+) \\|`))?.[1]);
    // Security hooks = the blocking PreToolUse security-* guards; the task enforcement hook is its own row;
    // governance hooks = every other wired script.
    const pre = new Set(JSON.parse(read('hooks/hooks.json')).hooks.PreToolUse
      .flatMap((g) => g.hooks.map((h) => h.command.match(/scripts\/([A-Za-z0-9_.-]+\.sh)/)[1]))
      .filter((s) => s.startsWith('security-')));
    const enforce = HOOK_SCRIPTS.filter((s) => s === 'task-enforce.sh').length;
    const required = HOOK_SCRIPTS.filter((s) => s === 'required-output.sh').length;
    expect({
      commands: row('Slash commands'),
      agents: row('Specialized agents'),
      skills: row('Knowledge skills'),
      securityHooks: row('Security hooks'),
      enforcementHooks: row('Task enforcement hook'),
      requiredOutputGate: row('Required-output gate'),
      governanceHooks: row('Governance hooks'),
      mcpTools: row('MCP governance tools'),
    }).toEqual({
      commands: TREE.commands,
      agents: TREE.agents,
      skills: TREE.skills,
      securityHooks: pre.size,
      enforcementHooks: enforce,
      requiredOutputGate: required,
      governanceHooks: TREE.hooks - pre.size - enforce - required,
      mcpTools: NODE_TOOLS.length,
    });
  });

  it('commands/status-enhanced.md: its count command prints the tree counts', () => {
    expect(runCount('commands/status-enhanced.md')).toEqual(TREE);
  });

  it('commands/status.md: the computed report counts the tree (scripts/status-report.mjs)', async () => {
    const { tooling } = await import('../../../scripts/status-report.mjs');
    const { skills, ...rest } = TREE;
    expect(skills).toBeGreaterThan(0);
    expect(tooling()).toEqual(rest);
  });

  it.each(['commands/status.md', 'commands/status-enhanced.md'])('%s hard-codes no component count', (f) => {
    const md = read(f);
    expect(md).not.toMatch(/\(\d+ built-in\)|\b\d+ (?:agents|commands|hooks)[, ]|(?:Agents|Commands|Hooks): \d+|\(\d+, Forge plugin\)|The \d+ hooks/);
  });

  it('status lists exactly the hook scripts wired in hooks.json', () => {
    const listed = [...new Set(read('commands/status.md').split('### 8. Hook Status')[1].split('Report:')[0]
      .match(/`[a-z0-9-]+\.sh`/g).map((s) => s.slice(1, -1)))].sort();
    expect(listed).toEqual(HOOK_SCRIPTS);
  });

  it('plugin.json states the tree counts', () => {
    const desc = JSON.parse(read('.claude-plugin/plugin.json')).description;
    const n = (word) => Number(desc.match(new RegExp(`(\\d+) ${word}`))?.[1]);
    expect({ agents: n('agents'), commands: n('commands'), skills: n('skills'), hooks: n('hooks') })
      .toEqual({ agents: TREE.agents, commands: TREE.commands, skills: TREE.skills, hooks: TREE.registrations });
  });
});
