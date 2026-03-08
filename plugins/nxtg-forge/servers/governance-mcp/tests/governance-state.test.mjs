import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join } from 'path';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { getGovernanceState } from '../tools.mjs';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';

beforeAll(setupFixture);
afterAll(teardownFixture);

describe('getGovernanceState', () => {
  it('returns initialized:false when no governance.json exists', () => {
    // Use a bare temp dir with no .claude directory
    const emptyDir = mkdtempSync(join(tmpdir(), 'forge-gov-empty-'));
    execSync('git init', { cwd: emptyDir, stdio: 'pipe' });

    const result = getGovernanceState(emptyDir);

    expect(result.initialized).toBe(false);
    expect(result.message).toMatch(/governance\.json/i);

    // Cleanup
    import('fs').then(({ rmSync }) => rmSync(emptyDir, { recursive: true, force: true }));
  });

  it('returns full state object when governance.json exists', () => {
    const root = getFixturePath();
    const result = getGovernanceState(root);

    expect(result.initialized).toBe(true);
    expect(result.version).toBe('3.0.0');
    expect(result.project.name).toBe('Forge Test Project');
  });

  it('returned fields match what is in the fixture governance.json', () => {
    const root = getFixturePath();
    const result = getGovernanceState(root);

    expect(result.initialized).toBe(true);
    expect(result.project.name).toBe('Forge Test Project');
    expect(result.project.vision).toContain('fixture');
    // workstreams array in fixture has 2 entries
    expect(result.workstreams).toBe(2);
    expect(result.qualityGates).toEqual({ minTestCoverage: 80, maxFileSize: 300 });
    expect(result.metrics).toEqual({ sessionsCount: 5, featuresShipped: 2 });
  });
});
