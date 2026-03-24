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
