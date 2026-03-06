import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getHealthScore } from '../tools.mjs';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';

beforeAll(setupFixture);
afterAll(teardownFixture);

describe('getHealthScore', () => {
  it('returns a score in 0-100 range with a letter grade', () => {
    const root = getFixturePath();
    const result = getHealthScore(root);

    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);

    expect(typeof result.grade).toBe('string');
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);

    expect(result.maxScore).toBe(100);
  });

  it('all expected check names are present in the checks array', () => {
    const root = getFixturePath();
    const result = getHealthScore(root);

    const expectedChecks = [
      'Governance',
      'Git Clean',
      'Test Coverage',
      'README',
      'CLAUDE.md',
      'Type Safety',
      'File Size',
      'No .env in Git',
    ];

    const checkNames = result.checks.map((c) => c.name);
    for (const name of expectedChecks) {
      expect(checkNames).toContain(name);
    }
  });

  it('the healthy fixture scores >= 70 (grade C or better)', () => {
    const root = getFixturePath();
    const result = getHealthScore(root);

    // Fixture has: governance.json ✓, clean git ✓, test files ✓,
    // README.md ✓, CLAUDE.md ✓, tsconfig.json ✓
    // That is: 20 + 15 + some + 10 + 10 + 10 = >= 65+
    expect(result.score).toBeGreaterThanOrEqual(70);
  });
});
