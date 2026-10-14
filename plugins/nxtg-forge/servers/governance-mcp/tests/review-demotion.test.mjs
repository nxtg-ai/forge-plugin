// The two review commands are optional conveniences with no accuracy claim (DIRECTIVE-NXTG-20261013-16 B,
// emma-soul ruling 3, ledger B12). On forge-done-fixture and forge-done-fixture-2 a plain review prompt found
// the same defects at about a third to a quarter of the cost, so the commands may not claim to find more.
import { describe, it, expect } from 'vitest';
import { appendFileSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(PLUGIN, p), 'utf8').replace(/\r\n/g, '\n');
const frontmatter = (md) => md.split('\n---\n')[0];
const body = (md) => md.slice(frontmatter(md).length);
const NOTICE = '**Optional convenience. No accuracy claim.**';
// Words that claim a result rather than describe what the prompt looks at.
export const CLAIM = /\bdetects?\b|\bcatch(es)?\b|comprehensive|guarantee|\bensures?\b|\bproves?\b|\bfinds? (all|every)\b|\bexposes?\b|never happens again|most honest|every other pattern|\bnobody else\b/i;
const REPO = join(PLUGIN, '..', '..');
const SUBJECT = /gap-analysis|gap analysis|crucible/i;
// Pages that are entirely about the review commands: every line is checked, not only lines that name them.
const DEDICATED = new Set(['docs/commands/gap-analysis.md', 'docs/skills/crucible-audit.md', 'docs/agents/crucible-detective.md']);
function mdFiles(dir, rel = '') {
  return readdirSync(join(REPO, dir, rel), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? mdFiles(dir, join(rel, e.name)) : e.name.endsWith('.md') ? [join(dir, rel, e.name)] : []);
}
// Every line in docs/** and README.md that names a review command (or sits on a dedicated page) and claims
// a result. Returns "file:line: text" strings; empty means clean. `root` lets a mutant copy be scanned.
export function claimLines(root = REPO) {
  const files = [...mdFiles('docs'), 'README.md', 'FORGE-DIFFERENTIATORS.md'];
  const hits = [];
  for (const f of files) {
    const lines = readFileSync(join(root, f), 'utf8').replace(/\r\n/g, '\n').split('\n');
    lines.forEach((l, i) => {
      if ((DEDICATED.has(f) || SUBJECT.test(l)) && CLAIM.test(l)) hits.push(`${f}:${i + 1}: ${l.trim().slice(0, 140)}`);
    });
  }
  return hits;
}

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

  it('no line in docs/**, README or FORGE-DIFFERENTIATORS claims a result for the review commands', () => {
    expect(claimLines()).toEqual([]);
  });

  it('the fixture cost comparison is always cited with its n (fixtures 1 and 2, 24 runs)', () => {
    const files = [...mdFiles('docs'), 'README.md', 'FORGE-DIFFERENTIATORS.md'].map((f) => join(REPO, f))
      .concat(REVIEW.map((f) => join(PLUGIN, f)), join(PLUGIN, 'agents/crucible-detective.md'));
    for (const f of files) {
      for (const l of readFileSync(f, 'utf8').split('\n').filter((x) => /third to a quarter/.test(x))) {
        expect(l, f).toContain('24 runs');
        expect(l, f).toMatch(/forge-done-fixture/);
      }
    }
  });

  it('mutant: re-adding a flagged docs line turns the docs guard red', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'review-claims-'));
    try {
      for (const f of [...mdFiles('docs'), 'README.md', 'FORGE-DIFFERENTIATORS.md']) {
        mkdirSync(dirname(join(tmp, f)), { recursive: true });
        copyFileSync(join(REPO, f), join(tmp, f));
      }
      expect(claimLines(tmp)).toEqual([]); // control: the copy is clean
      appendFileSync(join(tmp, 'docs/commands/README.md'), '\n/nxtg-forge:gap-analysis        # Catch what you missed\n');
      expect(claimLines(tmp)).toHaveLength(1);
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  });

  it('plugin.json describes CRUCIBLE as an optional review prompt, not auditing', () => {
    const desc = JSON.parse(read('.claude-plugin/plugin.json')).description;
    expect(desc).toContain('an optional CRUCIBLE test-review prompt');
    expect(desc).not.toMatch(/CRUCIBLE test auditing/);
  });
});
