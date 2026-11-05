import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync, statSync, mkdtempSync as mkdtemp, rmSync as rm } from 'fs';
import { tmpdir as osTmpdir } from 'os';
import { join as pjoin } from 'path';
import { generateDashboard } from '../tools.mjs';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';

beforeAll(setupFixture);
afterAll(teardownFixture);

// Dashboards from this file go to their own TMPDIR, removed afterwards, so a test run leaves nothing in /tmp.
let savedTmp, dashTmp;
beforeAll(() => { savedTmp = process.env.TMPDIR; dashTmp = mkdtemp(pjoin(osTmpdir(), 'forge-dash-test-')); process.env.TMPDIR = dashTmp; });
afterAll(() => { if (savedTmp === undefined) delete process.env.TMPDIR; else process.env.TMPDIR = savedTmp; rm(dashTmp, { recursive: true, force: true }); });

describe('generateDashboard', () => {
  it('returns an object with path, browserUrl, and metadata', async () => {
    const root = getFixturePath();
    const result = await generateDashboard(root);

    expect(result.path).toMatch(/\.html$/);
    expect(existsSync(result.path)).toBe(true);

    // browserUrl must be a file:// URL (Linux or WSL2 format)
    expect(result.browserUrl).toMatch(/^file:\/\//);

    // Fixture project name is known
    expect(result.projectName).toBe('Forge Test Project');
    // Health score is a number in 0-100
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(100);
    // Grade is a valid letter
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.healthGrade);
  });

  it('the generated HTML contains the project name from governance.json', async () => {
    const root = getFixturePath();
    const result = await generateDashboard(root);

    const html = readFileSync(result.path, 'utf-8');

    // The fixture project name is 'Forge Test Project'
    expect(html).toContain('Forge Test Project');

    // Should be a valid HTML document
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>');
  });
});

// CodeQL js/insecure-temporary-file (alert #29, DIRECTIVE-NXTG-20261105-03): the dashboard used to be written to
// /tmp/forge-dashboard-<ms>.html with a plain writeFileSync, which follows a symlink another local user planted at
// that predictable name. It must land in a fresh private directory and never write through an existing path.
describe('generateDashboard temp file', () => {
  it('does not write through a symlink planted at the old predictable path', async () => {
    const { mkdtempSync, symlinkSync, writeFileSync: write, rmSync } = await import('fs');
    const { tmpdir } = await import('os');
    const { join } = await import('path');
    const { vi } = await import('vitest');
    const t = 1762300800123;
    const victimDir = mkdtempSync(join(tmpdir(), 'forge-victim-'));
    const victim = join(victimDir, 'victim.txt');
    write(victim, 'VICTIM');
    const planted = join(tmpdir(), `forge-dashboard-${t}.html`);
    rmSync(planted, { force: true });
    symlinkSync(victim, planted);
    const spy = vi.spyOn(Date, 'now').mockReturnValue(t);
    try {
      const result = await generateDashboard(getFixturePath());
      expect(readFileSync(victim, 'utf-8')).toBe('VICTIM');
      expect(result.path).not.toBe(planted);
    } finally {
      spy.mockRestore();
      rmSync(planted, { force: true });
      rmSync(victimDir, { recursive: true, force: true });
    }
  });

  it('writes into one private directory per process (0700), a new 0600 file each time', async () => {
    const { statSync, readdirSync } = await import('fs');
    const { dirname } = await import('path');
    const a = await generateDashboard(getFixturePath());
    const b = await generateDashboard(getFixturePath());
    expect(dirname(a.path)).toBe(dirname(b.path));
    expect(a.path).not.toBe(b.path);
    expect(statSync(dirname(a.path)).mode & 0o777).toBe(0o700);
    expect(statSync(a.path).mode & 0o777).toBe(0o600);
    expect(statSync(b.path).mode & 0o777).toBe(0o600);
    // A session leaves one directory in the temp dir, however many dashboards it opens (opus seat Low).
    expect(readdirSync(process.env.TMPDIR).filter((n) => n.startsWith('forge-dashboard-'))).toHaveLength(1);
  });

  // forge-pm on #114: directory names in /tmp are listable. If a tmp cleaner removes ours, another local user can
  // mkdir the same name; reusing it by name would let them read every dashboard we write there.
  it('does not reuse a directory at the same path that is now 0755 (someone else could read it)', async () => {
    const { rmSync, mkdirSync, chmodSync } = await import('fs');
    const { dirname } = await import('path');
    const a = await generateDashboard(getFixturePath());
    const d = dirname(a.path);
    rmSync(d, { recursive: true, force: true });
    mkdirSync(d); chmodSync(d, 0o755);
    const b = await generateDashboard(getFixturePath());
    expect(dirname(b.path)).not.toBe(d);
    expect(statSync(dirname(b.path)).mode & 0o777).toBe(0o700);
  });

  it('does not reuse a directory at the same path owned by another user', async () => {
    const { vi } = await import('vitest');
    const { dirname } = await import('path');
    const a = await generateDashboard(getFixturePath());
    const spy = vi.spyOn(process, 'getuid').mockReturnValue(process.getuid() + 1);
    try {
      const b = await generateDashboard(getFixturePath());
      expect(dirname(b.path)).not.toBe(dirname(a.path));
    } finally { spy.mockRestore(); }
  });

  it('makes a new private directory when the old one is gone', async () => {
    const { rmSync, existsSync } = await import('fs');
    const { dirname } = await import('path');
    const a = await generateDashboard(getFixturePath());
    rmSync(dirname(a.path), { recursive: true, force: true });
    const b = await generateDashboard(getFixturePath());
    expect(existsSync(b.path)).toBe(true);
  });
});
