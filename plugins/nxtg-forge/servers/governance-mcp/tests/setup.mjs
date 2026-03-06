/**
 * Shared test fixture for governance-mcp tests.
 *
 * Creates a real mini-project in a temp directory with:
 * - git repo (init + commits)
 * - package.json with real deps/devDeps
 * - .claude/governance.json
 * - .claude/checkpoints/sprint-1.json
 * - Source files and a test file
 * - README.md, CLAUDE.md, tsconfig.json
 *
 * Usage:
 *   import { getFixturePath, setupFixture, teardownFixture } from './setup.mjs';
 *   beforeAll(setupFixture);
 *   afterAll(teardownFixture);
 */

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

let fixturePath = null;

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' });
}

export function getFixturePath() {
  if (!fixturePath) {
    throw new Error('Fixture not initialized. Call setupFixture() first (e.g. in beforeAll).');
  }
  return fixturePath;
}

export async function setupFixture() {
  fixturePath = mkdtempSync(join(tmpdir(), 'forge-governance-test-'));

  // Git init
  run('git init', fixturePath);
  run('git config user.email "test@forge.test"', fixturePath);
  run('git config user.name "Forge Test"', fixturePath);

  // package.json — 2 prod deps + 2 dev deps so dependency counts are testable
  writeFileSync(
    join(fixturePath, 'package.json'),
    JSON.stringify({
      name: 'forge-test-project',
      version: '1.0.0',
      type: 'module',
      dependencies: {
        express: '^4.18.0',
        zod: '^3.22.0',
      },
      devDependencies: {
        vitest: '^3.0.0',
        typescript: '^5.0.0',
      },
    }, null, 2)
  );

  // tsconfig.json
  writeFileSync(
    join(fixturePath, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        strict: true,
        outDir: 'dist',
      },
      include: ['src/**/*'],
    }, null, 2)
  );

  // README.md
  writeFileSync(
    join(fixturePath, 'README.md'),
    '# Forge Test Project\n\nA minimal project used as a test fixture for governance-mcp tests.\n'
  );

  // CLAUDE.md
  writeFileSync(
    join(fixturePath, 'CLAUDE.md'),
    '# CLAUDE.md\n\nAI assistant instructions for this project.\n'
  );

  // .claude/governance.json
  mkdirSync(join(fixturePath, '.claude'), { recursive: true });
  writeFileSync(
    join(fixturePath, '.claude', 'governance.json'),
    JSON.stringify({
      version: '3.0.0',
      project: {
        name: 'Forge Test Project',
        vision: 'A clean fixture for testing governance-mcp tools',
        goals: ['reliability', 'coverage'],
      },
      workstreams: [
        { id: 'ws-1', name: 'Core', status: 'active' },
        { id: 'ws-2', name: 'Tests', status: 'active' },
      ],
      qualityGates: {
        minTestCoverage: 80,
        maxFileSize: 300,
      },
      metrics: {
        sessionsCount: 5,
        featuresShipped: 2,
      },
    }, null, 2)
  );

  // .claude/checkpoints/sprint-1.json
  mkdirSync(join(fixturePath, '.claude', 'checkpoints'), { recursive: true });
  writeFileSync(
    join(fixturePath, '.claude', 'checkpoints', 'sprint-1.json'),
    JSON.stringify({
      name: 'sprint-1',
      description: 'End of Sprint 1 checkpoint',
      createdAt: new Date().toISOString(),
      health: { score: 85, grade: 'B' },
    }, null, 2)
  );

  // src/app.ts — a simple source file
  mkdirSync(join(fixturePath, 'src'), { recursive: true });
  writeFileSync(
    join(fixturePath, 'src', 'app.ts'),
    `import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/version', (_req, res) => {
  res.json({ version: '1.0.0' });
});

export function startServer(port: number = 3000) {
  return app.listen(port, () => {
    console.log(\`Server running on port \${port}\`);
  });
}

export default app;
`
  );

  // src/utils.ts — a utility file
  writeFileSync(
    join(fixturePath, 'src', 'utils.ts'),
    `/**
 * Utility functions for the forge test project.
 */

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
`
  );

  // tests/app.test.ts — a test file
  mkdirSync(join(fixturePath, 'tests'), { recursive: true });
  writeFileSync(
    join(fixturePath, 'tests', 'app.test.ts'),
    `import { describe, it, expect } from 'vitest';
import { formatDate, clamp, slugify, capitalize } from '../src/utils.js';

describe('utils', () => {
  it('formatDate returns YYYY-MM-DD', () => {
    const d = new Date('2026-03-06T12:00:00Z');
    expect(formatDate(d)).toBe('2026-03-06');
  });

  it('clamp constrains values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('slugify converts text', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
  });

  it('capitalize upcases first char', () => {
    expect(capitalize('forge')).toBe('Forge');
    expect(capitalize('')).toBe('');
  });
});
`
  );

  // Initial commit — all tracked files in clean state
  run('git add .', fixturePath);
  run('git commit -m "Initial commit"', fixturePath);
}

export async function teardownFixture() {
  if (fixturePath) {
    rmSync(fixturePath, { recursive: true, force: true });
    fixturePath = null;
  }
}
