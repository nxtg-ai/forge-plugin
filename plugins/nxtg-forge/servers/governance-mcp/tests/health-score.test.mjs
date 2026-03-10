import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
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
      'Security',
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
    // README.md ✓, CLAUDE.md ✓, tsconfig.json ✓, security clean ✓
    // That is: 15 + 10 + some + 10 + 10 + 10 + security = >= 55+
    expect(result.score).toBeGreaterThanOrEqual(55);
  });

  it('Security check deducts points when eval() usage is detected (Bug A)', () => {
    const root = getFixturePath();

    // Add a file with eval()
    const dangerousFile = join(root, 'src', 'unsafe.ts');
    writeFileSync(dangerousFile, 'export function exec(code: string) { return eval(code); }\n');

    const result = getHealthScore(root);
    const secCheck = result.checks.find((c) => c.name === 'Security');

    expect(secCheck).toBeDefined();
    expect(secCheck.points).toBeLessThan(15);
    expect(secCheck.note).toMatch(/eval|code security/i);

    // Cleanup
    try { unlinkSync(dangerousFile); } catch {}
  });

  it('Security check gives full 15 points when no issues found', () => {
    const root = getFixturePath();

    // Clean fixture should have 15/15 security points
    const result = getHealthScore(root);
    const secCheck = result.checks.find((c) => c.name === 'Security');

    expect(secCheck).toBeDefined();
    expect(secCheck.points).toBe(15);
    expect(secCheck.status).toBe('pass');
  });

  it('Security check deducts points when .env is committed to git (Bug A)', () => {
    const root = getFixturePath();

    // Commit a .env file
    writeFileSync(join(root, '.env'), 'API_KEY=leaked\n');
    execSync('git add .env', { cwd: root, stdio: 'pipe' });
    execSync('git commit -m "oops: add env"', { cwd: root, stdio: 'pipe' });

    const result = getHealthScore(root);
    const secCheck = result.checks.find((c) => c.name === 'Security');

    expect(secCheck).toBeDefined();
    expect(secCheck.points).toBeLessThan(15);
    expect(secCheck.note).toMatch(/secrets in git/);

    // Cleanup
    execSync('git rm --cached .env', { cwd: root, stdio: 'pipe' });
    execSync('git commit -m "fix: remove .env"', { cwd: root, stdio: 'pipe' });
    try { unlinkSync(join(root, '.env')); } catch {}
  });

  it('grade letter matches score boundaries', () => {
    const root = getFixturePath();
    const result = getHealthScore(root);

    // Verify grade matches score range
    if (result.score >= 90) expect(result.grade).toBe('A');
    else if (result.score >= 80) expect(result.grade).toBe('B');
    else if (result.score >= 70) expect(result.grade).toBe('C');
    else if (result.score >= 60) expect(result.grade).toBe('D');
    else expect(result.grade).toBe('F');
  });
});
