// .github/scripts/check-stage.sh, the release-stage check, run on a copy of this repo's stage surfaces.
// .64 (EMMA-SOUL cc950597, dx3-pm 1.18.7.5.88): STAGE moved to alpha, README line 9 is the derived label plus
// the ruled alpha text, and the old pre-alpha and public-preview sentences must be gone. dx3-pm's checker
// matches the bare word "alpha", which "below alpha (pre-alpha)" would satisfy (1.18.7.5.53), so these
// mutants put each old text back and require check-stage to go red.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const FILES = [
  'STAGE', 'README.md', 'CHANGELOG.md', '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json',
  'plugins/nxtg-forge/.claude-plugin/plugin.json', 'plugins/nxtg-forge-orchestrator/.claude-plugin/plugin.json',
  'plugins/nxtg-forge/commands/status.md', 'plugins/nxtg-forge/scripts/status-report.mjs', '.github/scripts/check-stage.sh',
];
const OLD_LINE = '**Stage: Public preview.** Forge is public: anyone may install and use it. Its maturity is below alpha (pre-alpha): no SLA, and interfaces may change without notice.';
const OPTION_A = 'Forge is a public preview: anyone may install and use it. No SLA, and interfaces may change without notice.';
const FINAL_A = 'The Forge plugin and orchestrator are in alpha. On 2026-10-15 (UTC) a separate NXTG.AI team (product-oracle) ran the pre-registered core-job test on a clean install of the plugin (v3.14.0) and the orchestrator (forge 1.7.0). The test passed; each repeated check passed 3 of 3 (run 7). The evidence is attached to the forge-plugin v3.14.0 release. No SLA; interfaces may change without notice.';

let tmp;
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'check-stage-'));
  for (const f of FILES) { mkdirSync(dirname(join(tmp, f)), { recursive: true }); copyFileSync(join(REPO, f), join(tmp, f)); }
  spawnSync('git', ['init', '-q'], { cwd: tmp });
});
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

const run = () => spawnSync('bash', [join(tmp, '.github/scripts/check-stage.sh')], { cwd: tmp, encoding: 'utf8', timeout: 30000 });
const edit = (f, fn) => writeFileSync(join(tmp, f), fn(readFileSync(join(tmp, f), 'utf8')));
const line9 = () => readFileSync(join(tmp, 'README.md'), 'utf8').split('\n')[8];

describe('check-stage: alpha label, with a red control for every old stage text', () => {
  it('the repo as committed: README line 9 is the derived label plus the ruled text, and the check is green', () => {
    expect(line9()).toBe(`**Stage: Alpha.** ${FINAL_A}`);
    const r = run();
    expect(r.stdout).toMatch(/label 'Alpha'/);
    expect(r.stdout).toMatch(/stage-check: 0 red over \d+ checked/);
    expect(r.status).toBe(0);
  });
  it('mutant: the old pre-alpha line 9 is red', () => {
    edit('README.md', (s) => s.replace(`**Stage: Alpha.** ${FINAL_A}`, OLD_LINE));
    const r = run();
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/RED  README stage line/);
    expect(r.stdout).toMatch(/RED  README has no pre-alpha or public-preview text/);
  });
  it('mutant: the old pre-alpha sentence left below the new line is red', () => {
    edit('README.md', (s) => s.replace(FINAL_A, `${FINAL_A}\n\nIts maturity is below alpha (pre-alpha): no SLA, and interfaces may change without notice.`));
    const r = run();
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/RED  README has no pre-alpha or public-preview text/);
  });
  it('mutant: the option (A) public-preview sentence left in is red', () => {
    edit('README.md', (s) => s.replace(FINAL_A, `${FINAL_A} ${OPTION_A}`));
    expect(run().status).toBe(1);
  });
  it('mutant: STAGE back at pre-alpha is red against the alpha surfaces', () => {
    edit('STAGE', (s) => s.replace('maturity: alpha', 'maturity: pre-alpha'));
    const r = run();
    expect(r.stdout).toMatch(/label 'Public preview'/);
    expect(r.status).toBe(1);
  });
  it('mutant: a status --json stage, or a companion description, still on public preview is red', () => {
    edit('plugins/nxtg-forge/scripts/status-report.mjs', (s) => s.replace("stage: 'Alpha',", "stage: 'Public preview',"));
    expect(run().stdout).toMatch(/RED  status --json stage value/);
    copyFileSync(join(REPO, 'plugins/nxtg-forge/scripts/status-report.mjs'), join(tmp, 'plugins/nxtg-forge/scripts/status-report.mjs'));
    edit('plugins/nxtg-forge-orchestrator/.claude-plugin/plugin.json', (s) => s.replace('(alpha)"', '(public preview)"'));
    const r = run();
    expect(r.stdout).toMatch(/RED  companion plugin.json description/);
    expect(r.status).toBe(1);
  });
});
