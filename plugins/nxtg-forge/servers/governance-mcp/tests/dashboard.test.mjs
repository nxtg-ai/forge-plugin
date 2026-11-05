import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { generateDashboard } from '../tools.mjs';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';

beforeAll(setupFixture);
afterAll(teardownFixture);

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

  it('writes into a fresh directory only the user can read (0700 dir, 0600 file)', async () => {
    const { statSync } = await import('fs');
    const { dirname } = await import('path');
    const a = await generateDashboard(getFixturePath());
    const b = await generateDashboard(getFixturePath());
    expect(dirname(a.path)).not.toBe(dirname(b.path));
    expect(statSync(dirname(a.path)).mode & 0o777).toBe(0o700);
    expect(statSync(a.path).mode & 0o777).toBe(0o600);
  });
});
