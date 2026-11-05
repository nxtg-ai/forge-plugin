// The stale workflow must never mark or close an outside author's issue or PR (emma-soul al:66c6c92e0cfbf5a2,
// DIRECTIVE-NXTG-20261105-02). .github/scripts/label-community.sh labels them `community` before actions/stale
// runs, and stale.yml exempts that label. Fixture items stand in for the GitHub issues API.
import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const SCRIPT = join(REPO, '.github/scripts/label-community.sh');
const WORKFLOW = readFileSync(join(REPO, '.github/workflows/stale.yml'), 'utf8');

const item = (number, author_association, extra = {}) =>
  ({ number, author_association, user: { login: `u${number}`, type: 'User' }, labels: [], ...extra });
const FIXTURE = [
  item(1, 'NONE'),                                   // outside author's issue
  item(2, 'CONTRIBUTOR', { pull_request: {} }),      // outside author's PR
  item(3, 'FIRST_TIME_CONTRIBUTOR'),
  item(4, 'OWNER'),
  item(5, 'MEMBER'),
  item(6, 'COLLABORATOR', { pull_request: {} }),
  item(7, 'NONE', { user: { login: 'dependabot[bot]', type: 'Bot' }, pull_request: {} }),
  item(8, 'NONE', { labels: [{ name: 'community' }] }), // already labelled
];

let tmp;
afterEach(() => { if (tmp) rmSync(tmp, { recursive: true, force: true }); tmp = undefined; });

function select(script = SCRIPT) {
  tmp ??= mkdtempSync(join(tmpdir(), 'stale-community-'));
  const f = join(tmp, 'items.json');
  writeFileSync(f, JSON.stringify(FIXTURE));
  const r = spawnSync('bash', [script, '--select', f], { encoding: 'utf8' });
  expect(r.status, r.stderr).toBe(0);
  return r.stdout.split('\n').filter(Boolean).map(Number);
}

// The value of one `key: '...'` line inside the actions/stale step, as a list.
const listOf = (key) => (WORKFLOW.match(new RegExp(`^\\s*${key}:\\s*'([^']*)'`, 'm'))?.[1] ?? '').split(',').map((s) => s.trim());

describe('stale workflow exempts outside authors', () => {
  it('labels exactly the outside authors\' open issues and PRs (not members, not bots, not already labelled)', () => {
    expect(select()).toEqual([1, 2, 3]);
  });

  it('stale.yml exempts the `community` label for issues and for PRs', () => {
    expect(listOf('exempt-issue-labels')).toContain('community');
    expect(listOf('exempt-pr-labels')).toContain('community');
  });

  it('the labelling step runs before actions/stale, in the same job', () => {
    const label = WORKFLOW.indexOf('label-community.sh');
    const stale = WORKFLOW.indexOf('uses: actions/stale@');
    expect(label).toBeGreaterThan(-1);
    expect(stale).toBeGreaterThan(label);
  });

  it('red control: a script that forgets the inside list labels the owner too, and the first test would fail', () => {
    tmp = mkdtempSync(join(tmpdir(), 'stale-community-'));
    const mutant = join(tmp, 'mutant.sh');
    writeFileSync(mutant, readFileSync(SCRIPT, 'utf8').replace('["OWNER", "MEMBER", "COLLABORATOR"]', '["MEMBER", "COLLABORATOR"]'));
    const picked = select(mutant);
    expect(picked).toContain(4);
    expect(picked).not.toEqual([1, 2, 3]);
  });
});
