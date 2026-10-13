// Every component count a user sees matches what ships (DIRECTIVE-NXTG-20261013-04; alpha run 2 F-J).
// At v3.11.0, /nxtg-forge:status hard-coded "23 built-in" agents while the plugin shipped 33, and
// plugin.json said "23 hooks" (hooks.json registrations) while status said 7.
// Definitions: agents = agents/*.md; commands = commands/*.md; skills = skills/*/SKILL.md;
// hooks = distinct hook scripts wired in hooks/hooks.json.
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(PLUGIN, p), 'utf8').replace(/\r\n/g, '\n');
const mdIn = (d) => readdirSync(join(PLUGIN, d)).filter((f) => f.endsWith('.md')).length;

const HOOK_SCRIPTS = [...new Set(read('hooks/hooks.json').match(/scripts\/[A-Za-z0-9_.-]+\.sh/g))].map((s) => s.slice(8)).sort();
const TREE = {
  agents: mdIn('agents'),
  commands: mdIn('commands'),
  skills: readdirSync(join(PLUGIN, 'skills')).filter((d) => existsSync(join(PLUGIN, 'skills', d, 'SKILL.md'))).length,
  hooks: HOOK_SCRIPTS.length,
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
  it('README agents and commands rows equal the tree', () => {
    const readme = readFileSync(join(PLUGIN, '..', '..', 'README.md'), 'utf8');
    const row = (label) => Number(readme.match(new RegExp(`\\| ${label} \\| (\\d+) \\|`))?.[1]);
    expect({ agents: row('Specialized agents'), commands: row('Slash commands') }).toEqual({ agents: TREE.agents, commands: TREE.commands });
  });

  it.each(['commands/status.md', 'commands/status-enhanced.md'])('%s: its count command prints the tree counts', (f) => {
    expect(runCount(f)).toEqual(TREE);
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
    expect({ agents: n('agents'), commands: n('commands'), skills: n('skills'), hooks: n('hooks') }).toEqual(TREE);
  });
});
