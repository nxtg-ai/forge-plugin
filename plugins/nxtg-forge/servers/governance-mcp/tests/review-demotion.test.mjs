// The two review commands are optional conveniences with no accuracy claim (DIRECTIVE-NXTG-20261013-16 B,
// emma-soul ruling 3, ledger B12). On forge-done-fixture and forge-done-fixture-2 a plain review prompt found
// the same defects at about a third to a quarter of the cost, so the commands may not claim to find more.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(PLUGIN, p), 'utf8').replace(/\r\n/g, '\n');
const frontmatter = (md) => md.split('\n---\n')[0];
const body = (md) => md.slice(frontmatter(md).length);
const NOTICE = '**Optional convenience. No accuracy claim.**';
// Words that claim a result rather than describe what the prompt looks at.
const CLAIM = /\bdetects?\b|\bcatch(es)?\b|comprehensive|guarantee|\bensures?\b|\bproves?\b|\bfinds? (all|every)\b/i;

const REVIEW = ['commands/gap-analysis.md', 'skills/crucible-audit/SKILL.md'];

describe('review commands carry no accuracy claim', () => {
  it.each(REVIEW)('%s: the description says optional, no accuracy claim, and claims nothing', (f) => {
    const fm = frontmatter(read(f));
    expect(fm).toMatch(/Optional convenience, no accuracy claim/);
    expect(fm).not.toMatch(CLAIM);
  });

  it.each(REVIEW)('%s: the body opens with the notice and the fixture evidence', (f) => {
    const b = body(read(f));
    expect(b).toContain(NOTICE);
    expect(b).toContain('https://github.com/nxtg-ai/forge-done-fixture-2');
    expect(b).toContain('A clean report is not evidence that nothing is wrong.');
  });

  it('the crucible-detective agent, which runs the same checklist, claims nothing either', () => {
    const md = read('agents/crucible-detective.md');
    expect(frontmatter(md)).toMatch(/no accuracy claim/);
    expect(frontmatter(md)).not.toMatch(CLAIM);
    expect(md).not.toMatch(/A team that passes a CRUCIBLE Detective audit has tests where/);
  });

  it('README states the choice beside both commands, and the key-command line claims nothing', () => {
    const readme = readFileSync(join(PLUGIN, '..', '..', 'README.md'), 'utf8').replace(/\r\n/g, '\n');
    const section = readme.split('### Review commands are optional conveniences')[1]?.split('\n## ')[0];
    expect(section).toBeDefined();
    expect(section).toContain('`/nxtg-forge:gap-analysis`');
    expect(section).toContain('`/nxtg-forge:crucible-audit`');
    expect(section).toContain('**no accuracy claim**');
    const keyLine = readme.split('\n').find((l) => l.startsWith('/nxtg-forge:gap-analysis'));
    expect(keyLine).toMatch(/no accuracy claim/);
    expect(keyLine).not.toMatch(/\bFind\b/);
  });

  it('plugin.json describes CRUCIBLE as an optional review prompt, not auditing', () => {
    const desc = JSON.parse(read('.claude-plugin/plugin.json')).description;
    expect(desc).toContain('an optional CRUCIBLE test-review prompt');
    expect(desc).not.toMatch(/CRUCIBLE test auditing/);
  });
});
