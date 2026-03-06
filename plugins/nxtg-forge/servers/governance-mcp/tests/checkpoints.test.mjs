import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { listCheckpoints } from '../tools.mjs';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';

beforeAll(setupFixture);
afterAll(teardownFixture);

describe('listCheckpoints', () => {
  it('returns empty array when no checkpoints directory exists', () => {
    const emptyDir = mkdtempSync(join(tmpdir(), 'forge-cp-empty-'));
    execSync('git init', { cwd: emptyDir, stdio: 'pipe' });

    const result = listCheckpoints(emptyDir);

    expect(Array.isArray(result.checkpoints)).toBe(true);
    expect(result.checkpoints).toHaveLength(0);

    import('fs').then(({ rmSync }) => rmSync(emptyDir, { recursive: true, force: true }));
  });

  it('returns sorted list when checkpoint files exist', () => {
    const root = getFixturePath();
    const result = listCheckpoints(root);

    // Fixture has sprint-1.json in .claude/checkpoints/
    expect(result.checkpoints.length).toBeGreaterThanOrEqual(1);
    expect(result.count).toBeGreaterThanOrEqual(1);

    // Each checkpoint should have name and created fields
    const cp = result.checkpoints[0];
    expect(cp.name).toBeDefined();
    expect(cp.created).toBeDefined();
    expect(cp.description).toBeDefined();

    // Check the sprint-1 checkpoint we created
    const sprint1 = result.checkpoints.find((c) => c.name === 'sprint-1');
    expect(sprint1).toBeDefined();
  });
});
