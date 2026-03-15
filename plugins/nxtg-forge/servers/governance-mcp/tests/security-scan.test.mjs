import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { getSecurityScan } from '../tools.mjs';
import { setupFixture, teardownFixture, getFixturePath } from './setup.mjs';

beforeAll(setupFixture);
afterAll(teardownFixture);

describe('getSecurityScan', () => {
  it('clean project returns zero findings', () => {
    const root = getFixturePath();
    const result = getSecurityScan(root);

    expect(result.totalFindings).toBe(0);
    expect(result.findings).toHaveLength(0);
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('a committed .env file is detected as a critical finding', () => {
    const root = getFixturePath();

    // Create and commit a .env file — this is what the scanner checks via git ls-files
    writeFileSync(join(root, '.env'), 'SECRET_KEY=supersecret123\n');
    execSync('git add .env', { cwd: root, stdio: 'pipe' });
    execSync('git commit -m "oops: add .env"', { cwd: root, stdio: 'pipe' });

    const result = getSecurityScan(root);

    const envFinding = result.findings.find(
      (f) => f.label === '.env file committed to git'
    );
    expect(envFinding).toEqual(expect.objectContaining({
      label: '.env file committed to git',
      severity: 'critical',
      category: 'secrets',
    }));
    expect(result.totalFindings).toBeGreaterThanOrEqual(1);

    // Cleanup: remove from git history by reverting the commit
    execSync('git rm --cached .env', { cwd: root, stdio: 'pipe' });
    execSync('git commit -m "fix: remove .env from git"', { cwd: root, stdio: 'pipe' });
    try { unlinkSync(join(root, '.env')); } catch {}
  });

  it('a TypeScript file containing eval() is flagged as injection risk', () => {
    const root = getFixturePath();

    // Write a TS file that uses eval()
    const evalFile = join(root, 'src', 'dangerous.ts');
    writeFileSync(
      evalFile,
      '// deliberately dangerous\nfunction run(code: string) { return eval(code); }\n'
    );

    const result = getSecurityScan(root);

    const evalFinding = result.findings.find(
      (f) => f.label === 'eval() usage' && f.category === 'injection'
    );
    expect(evalFinding).toEqual(expect.objectContaining({
      label: 'eval() usage',
      category: 'injection',
      severity: 'high',
      count: expect.any(Number),
    }));
    expect(evalFinding.count).toBeGreaterThanOrEqual(1);

    // Cleanup
    try { unlinkSync(evalFile); } catch {}
  });
});
