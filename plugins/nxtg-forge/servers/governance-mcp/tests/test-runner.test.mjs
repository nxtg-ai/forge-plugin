import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { getTestResults } from '../tools.mjs';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';

beforeAll(setupFixture);
afterAll(teardownFixture);

describe('getTestResults', () => {
  it('returns runner:null when no test runner binary exists', () => {
    // A bare temp directory with no node_modules
    const emptyDir = mkdtempSync(join(tmpdir(), 'forge-runner-empty-'));
    execSync('git init', { cwd: emptyDir, stdio: 'pipe' });

    const result = getTestResults(emptyDir);

    expect(result.runner).toBeNull();
    expect(result.message).toMatch(/no test runner/i);

    import('fs').then(({ rmSync }) => rmSync(emptyDir, { recursive: true, force: true }));
  });

  it('detects vitest as runner when vitest binary exists in node_modules/.bin', () => {
    // Build a fake project that has a vitest binary symlink
    const fakeDir = mkdtempSync(join(tmpdir(), 'forge-runner-vitest-'));
    execSync('git init', { cwd: fakeDir, stdio: 'pipe' });

    // Create the binary path that getTestResults checks
    const binDir = join(fakeDir, 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });

    // Create a stub vitest binary (doesn't need to run — just needs to exist)
    const stubVitest = join(binDir, 'vitest');
    writeFileSync(stubVitest, '#!/bin/sh\necho \'{"numPassedTests":1,"numFailedTests":0,"numTotalTests":1,"success":true}\'', { mode: 0o755 });

    const result = getTestResults(fakeDir);

    // The runner should be detected as vitest
    expect(result.runner).toBe('vitest');

    import('fs').then(({ rmSync }) => rmSync(fakeDir, { recursive: true, force: true }));
  });
});
