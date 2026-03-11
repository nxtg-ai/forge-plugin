import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { generateDashboard } from '../tools.mjs';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';

beforeAll(setupFixture);
afterAll(teardownFixture);

describe('generateDashboard', () => {
  it('returns an object with a path property pointing to an HTML file', async () => {
    const root = getFixturePath();
    const result = await generateDashboard(root);

    expect(typeof result.path).toBe('string');
    expect(result.path.endsWith('.html')).toBe(true);
    expect(existsSync(result.path)).toBe(true);

    // Also returns useful metadata
    expect(typeof result.projectName).toBe('string');
    expect(typeof result.healthScore).toBe('number');
    expect(typeof result.healthGrade).toBe('string');
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
