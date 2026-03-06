import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getCodeMetrics } from '../tools.mjs';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';

beforeAll(setupFixture);
afterAll(teardownFixture);

describe('getCodeMetrics', () => {
  it('detects node project type and counts source files', () => {
    const root = getFixturePath();
    const result = getCodeMetrics(root);

    // Fixture has package.json so should be "node"
    expect(result.projectType).toBe('node');

    // Fixture has src/app.ts and src/utils.ts (2 source files)
    // tests/app.test.ts is a test file and should not count as source
    expect(result.sourceFiles).toBeGreaterThanOrEqual(2);

    // Should find at least the one test file
    expect(result.testFiles).toBeGreaterThanOrEqual(1);
  });

  it('dependency counts match what is declared in package.json', () => {
    const root = getFixturePath();
    const result = getCodeMetrics(root);

    // Fixture package.json: dependencies = { express, zod } → 2
    expect(result.dependencies).toBe(2);

    // devDependencies = { vitest, typescript } → 2
    expect(result.devDependencies).toBe(2);
  });
});
