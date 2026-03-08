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

    // Sprint-1 checkpoint should have correct name, description, and ISO date
    const sprint1 = result.checkpoints.find((c) => c.name === 'sprint-1');
    expect(sprint1).not.toBeUndefined();
    expect(sprint1.name).toBe('sprint-1');
    expect(sprint1.description).toBe('End of Sprint 1 checkpoint');
    expect(sprint1.created).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
