import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { getGitStatus } from '../tools.mjs';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';

beforeAll(setupFixture);
afterAll(teardownFixture);

describe('getGitStatus', () => {
  it('returns correct branch name and recent commits', () => {
    const root = getFixturePath();
    const result = getGitStatus(root);

    // git init creates 'master' or 'main' depending on git config
    expect(typeof result.branch).toBe('string');
    expect(result.branch.length).toBeGreaterThan(0);

    // Fixture has at least 1 commit
    expect(result.commitCount).toBeGreaterThanOrEqual(1);
    expect(result.lastCommit).toMatch(/^[a-f0-9]{7,}/);
  });

  it('clean working tree is reported as clean:true', () => {
    const root = getFixturePath();
    const result = getGitStatus(root);

    // After setupFixture commits everything, tree should be clean
    expect(result.clean).toBe(true);
    expect(result.modified).toBe(0);
    expect(result.untracked).toBe(0);
  });

  it('untracked file is detected as dirty state', () => {
    const root = getFixturePath();

    // Create an untracked file
    writeFileSync(join(root, 'untracked-temp.txt'), 'dirty state test');

    const result = getGitStatus(root);

    expect(result.clean).toBe(false);
    expect(result.untracked).toBeGreaterThanOrEqual(1);

    // Cleanup by removing the file to restore clean state for other tests
    import('fs').then(({ unlinkSync }) => {
      try { unlinkSync(join(root, 'untracked-temp.txt')); } catch {}
    });
  });
});
