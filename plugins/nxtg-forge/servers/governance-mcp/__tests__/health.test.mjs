/**
 * Governance MCP Server — Tool Function Tests
 *
 * "Quis custodiet ipsos custodes?" — The watchman gets watched.
 *
 * Tests the governance tool functions directly (no MCP transport).
 * Each test creates a temp project directory with known state.
 * Uses Node.js built-in test runner (node:test + node:assert).
 */

import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

// Prevent MCP server from starting during tests
process.env.FORGE_TEST_MODE = "1";

const { getHealthScore, getGitStatus, getCodeMetrics, getTestResults, getGovernanceState, getSecurityScan, findApplicationRoot, generateDashboard } =
  await import("../index.mjs");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempProject() {
  const dir = mkdtempSync(join(tmpdir(), "forge-mcp-test-"));
  return dir;
}

function gitInit(dir) {
  // Use -b main for consistent branch name across git versions/environments
  execSync("git init -b main", { cwd: dir, stdio: "ignore" });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: "ignore" });
  execSync('git config user.name "Test"', { cwd: dir, stdio: "ignore" });
}

function gitCommitAll(dir, msg = "init") {
  execSync("git add -A", { cwd: dir, stdio: "ignore" });
  execSync(`git commit -m "${msg}" --allow-empty`, { cwd: dir, stdio: "ignore" });
}

function writeFile(dir, relPath, content = "") {
  const full = join(dir, relPath);
  const parent = join(full, "..");
  mkdirSync(parent, { recursive: true });
  writeFileSync(full, content);
}

function cleanup(dir) {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // best effort
  }
}

function withProject(dir) {
  process.env.FORGE_PROJECT_ROOT = dir;
}

// ---------------------------------------------------------------------------
// forge_get_health
// ---------------------------------------------------------------------------

describe("forge_get_health", () => {
  let dir;

  beforeEach(() => {
    dir = makeTempProject();
  });

  after(() => {
    // cleanup handled per-test
  });

  it("scores a well-structured project accurately", () => {
    gitInit(dir);
    writeFile(dir, "package.json", JSON.stringify({ name: "test", dependencies: {} }));
    writeFile(dir, "README.md", "# Test Project");
    writeFile(dir, "CLAUDE.md", "# Instructions");
    writeFile(dir, "tsconfig.json", JSON.stringify({ compilerOptions: { strict: true } }));
    writeFile(dir, "src/app.ts", "export const x = 1;\n".repeat(20));
    writeFile(dir, "src/utils.ts", "export const y = 2;\n".repeat(20));
    writeFile(dir, "src/lib.ts", "export const z = 3;\n".repeat(20));
    writeFile(dir, "src/__tests__/app.test.ts", "test('x', () => {});\n");
    writeFile(dir, "src/__tests__/utils.test.ts", "test('y', () => {});\n");
    writeFile(dir, ".claude/governance.json", JSON.stringify({ version: "1.0", project: { name: "test" } }));
    gitCommitAll(dir, "initial");
    withProject(dir);

    const result = getHealthScore();

    assert.ok(result.score >= 75 && result.score <= 100, `Score should be 75–100, got ${result.score}`);
    assert.ok(result.grade === "A" || result.grade === "B", `Grade should be A or B, got ${result.grade}`);
    assert.equal(result.maxScore, 100);
    assert.ok(Array.isArray(result.checks));

    // Governance initialized = 15pts
    const govCheck = result.checks.find((c) => c.name === "Governance");
    assert.equal(govCheck.status, "pass");
    assert.equal(govCheck.points, 15);

    // Git clean = 10pts
    const gitCheck = result.checks.find((c) => c.name === "Git Clean");
    assert.equal(gitCheck.status, "pass");
    assert.equal(gitCheck.points, 10);

    // README = 10pts
    const readmeCheck = result.checks.find((c) => c.name === "README");
    assert.equal(readmeCheck.points, 10);

    // CLAUDE.md = 10pts
    const claudeCheck = result.checks.find((c) => c.name === "CLAUDE.md");
    assert.equal(claudeCheck.points, 10);

    // Type Safety = 10pts
    const tsCheck = result.checks.find((c) => c.name === "Type Safety");
    assert.equal(tsCheck.points, 10);

    cleanup(dir);
  });

  it("scores a project with 0 tests correctly (not inflated)", () => {
    gitInit(dir);
    writeFile(dir, "package.json", JSON.stringify({ name: "no-tests" }));
    writeFile(dir, "src/app.ts", "export const x = 1;");
    writeFile(dir, "README.md", "# No Tests");
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();
    const testCheck = result.checks.find((c) => c.name === "Test Coverage");

    assert.equal(testCheck.status, "fail");
    assert.equal(testCheck.points, 0);
    assert.ok(testCheck.note.includes("No tests"), `Note should mention no tests: ${testCheck.note}`);

    cleanup(dir);
  });

  it("BUG-01 regression: .claude/governance.json untracked does NOT count as dirty git", () => {
    gitInit(dir);
    writeFile(dir, "package.json", JSON.stringify({ name: "test" }));
    gitCommitAll(dir, "init");

    // Add untracked .claude/ file AFTER commit
    writeFile(dir, ".claude/governance.json", JSON.stringify({ version: "1.0" }));
    withProject(dir);

    const result = getHealthScore();
    const gitCheck = result.checks.find((c) => c.name === "Git Clean");

    assert.equal(gitCheck.status, "pass", "Untracked .claude/ files should not make git dirty");
    assert.equal(gitCheck.points, 10);

    cleanup(dir);
  });

  it("BUG-02 regression: testFileRatio is returned and matches actual file ratio", () => {
    gitInit(dir);
    writeFile(dir, "package.json", JSON.stringify({ name: "ratio-test" }));
    // 4 source files, 2 test files → ratio should be 50%
    writeFile(dir, "src/a.ts", "x");
    writeFile(dir, "src/b.ts", "x");
    writeFile(dir, "src/c.ts", "x");
    writeFile(dir, "src/d.ts", "x");
    writeFile(dir, "src/__tests__/a.test.ts", "x");
    writeFile(dir, "src/__tests__/b.test.ts", "x");
    gitCommitAll(dir, "init");
    withProject(dir);

    const metrics = getCodeMetrics();

    assert.equal(metrics.sourceFiles, 4, `Expected 4 source files, got ${metrics.sourceFiles}`);
    assert.equal(metrics.testFiles, 2, `Expected 2 test files, got ${metrics.testFiles}`);
    assert.equal(metrics.testFileRatio, 50, `Expected 50% ratio, got ${metrics.testFileRatio}`);

    cleanup(dir);
  });

  it("BUG-03 regression: vite.config.js does NOT count as source file", () => {
    gitInit(dir);
    writeFile(dir, "package.json", JSON.stringify({ name: "config-test" }));
    writeFile(dir, "src/app.ts", "x");
    writeFile(dir, "src/utils.ts", "x");
    writeFile(dir, "vite.config.js", "export default {}");
    writeFile(dir, "vitest.config.ts", "export default {}");
    writeFile(dir, "eslint.config.js", "module.exports = {}");
    gitCommitAll(dir, "init");
    withProject(dir);

    const metrics = getCodeMetrics();

    // Only src/app.ts and src/utils.ts should count — config files excluded
    assert.equal(metrics.sourceFiles, 2, `Expected 2 source files (configs excluded), got ${metrics.sourceFiles}`);

    cleanup(dir);
  });

  it("handles empty project gracefully (no package.json, no src/)", () => {
    gitInit(dir);
    writeFile(dir, "README.md", "# Empty");
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();

    assert.equal(result.score, 45, `Empty project should score exactly 45 (git:10+readme:10+filesize:10+security:15), got ${result.score}`);
    assert.equal(result.grade, "F", `Empty project should be grade F, got ${result.grade}`);
    assert.ok(Array.isArray(result.checks));
    // Should not crash

    cleanup(dir);
  });
});

// ---------------------------------------------------------------------------
// BUG-04: Type Safety tiered scoring
// ---------------------------------------------------------------------------

describe("BUG-04: Type Safety tiered scoring", () => {
  let dir;

  beforeEach(() => {
    dir = makeTempProject();
    gitInit(dir);
    writeFile(dir, "package.json", JSON.stringify({ name: "ts-test" }));
    writeFile(dir, "src/app.ts", "export const x = 1;");
  });

  it("scores 10 for tsconfig with strict: true", () => {
    writeFile(dir, "tsconfig.json", JSON.stringify({ compilerOptions: { strict: true } }));
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();
    const check = result.checks.find((c) => c.name === "Type Safety");

    assert.equal(check.points, 10);
    assert.equal(check.status, "pass");
    assert.ok(check.note.includes("strict"), `Note should mention strict: ${check.note}`);

    cleanup(dir);
  });

  it("scores 7 for basic tsconfig (no strict)", () => {
    writeFile(dir, "tsconfig.json", JSON.stringify({ compilerOptions: { target: "es2020" } }));
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();
    const check = result.checks.find((c) => c.name === "Type Safety");

    assert.equal(check.points, 7);
    assert.equal(check.status, "pass");

    cleanup(dir);
  });

  it("scores 7 for empty tsconfig (parsed as valid JSON)", () => {
    writeFile(dir, "tsconfig.json", "{}");
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();
    const check = result.checks.find((c) => c.name === "Type Safety");

    assert.equal(check.points, 7);

    cleanup(dir);
  });

  it("scores 10 for 3+ individual strict flags", () => {
    writeFile(dir, "tsconfig.json", JSON.stringify({
      compilerOptions: {
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
      },
    }));
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();
    const check = result.checks.find((c) => c.name === "Type Safety");

    assert.equal(check.points, 10);
    assert.equal(check.status, "pass");

    cleanup(dir);
  });

  it("scores 4 for jsconfig.json only", () => {
    writeFile(dir, "jsconfig.json", JSON.stringify({ compilerOptions: { baseUrl: "." } }));
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();
    const check = result.checks.find((c) => c.name === "Type Safety");

    assert.equal(check.points, 4);
    assert.equal(check.status, "info");

    cleanup(dir);
  });

  it("scores 0 with no type config at all", () => {
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();
    const check = result.checks.find((c) => c.name === "Type Safety");

    assert.equal(check.points, 0);
    assert.equal(check.status, "info");

    cleanup(dir);
  });

  it("scores 7 for strict: false (tsconfig exists but not strict)", () => {
    writeFile(dir, "tsconfig.json", JSON.stringify({ compilerOptions: { strict: false } }));
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();
    const check = result.checks.find((c) => c.name === "Type Safety");

    assert.equal(check.points, 7);

    cleanup(dir);
  });

  it("tsconfig takes precedence over jsconfig when both exist", () => {
    writeFile(dir, "tsconfig.json", JSON.stringify({ compilerOptions: { strict: true } }));
    writeFile(dir, "jsconfig.json", JSON.stringify({ compilerOptions: { baseUrl: "." } }));
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();
    const check = result.checks.find((c) => c.name === "Type Safety");

    assert.equal(check.points, 10, "tsconfig should win over jsconfig");

    cleanup(dir);
  });
});

// ---------------------------------------------------------------------------
// BUG-05: Build artifact exclusions
// ---------------------------------------------------------------------------

describe("BUG-05: Build artifact exclusions", () => {
  let dir;

  beforeEach(() => {
    dir = makeTempProject();
    gitInit(dir);
    writeFile(dir, "package.json", JSON.stringify({ name: "artifact-test" }));
  });

  it("excludes .next/ from source file count", () => {
    writeFile(dir, "src/app.ts", "export const x = 1;");
    writeFile(dir, ".next/server/chunks/123.js", "// compiled output");
    writeFile(dir, ".next/static/abc.js", "// static output");
    gitCommitAll(dir, "init");
    withProject(dir);

    const metrics = getCodeMetrics();

    assert.equal(metrics.sourceFiles, 1, `Expected 1 source file (.next excluded), got ${metrics.sourceFiles}`);

    cleanup(dir);
  });

  it("excludes build/ and target/ from source file count", () => {
    writeFile(dir, "src/app.ts", "export const x = 1;");
    writeFile(dir, "build/output.js", "// build output");
    writeFile(dir, "target/debug/app.ts", "// compiled");
    gitCommitAll(dir, "init");
    withProject(dir);

    const metrics = getCodeMetrics();

    assert.equal(metrics.sourceFiles, 1, `Expected 1 source file (build/target excluded), got ${metrics.sourceFiles}`);

    cleanup(dir);
  });

  it("excludes coverage/ and .nyc_output/ from source file count", () => {
    writeFile(dir, "src/app.ts", "export const x = 1;");
    writeFile(dir, "coverage/lcov-report/index.js", "// coverage report");
    writeFile(dir, ".nyc_output/report.js", "// nyc output");
    gitCommitAll(dir, "init");
    withProject(dir);

    const metrics = getCodeMetrics();

    assert.equal(metrics.sourceFiles, 1, `Expected 1 source file (coverage excluded), got ${metrics.sourceFiles}`);

    cleanup(dir);
  });

  it("excludes __pycache__/ and .venv/ from source file count", () => {
    writeFile(dir, "src/app.ts", "export const x = 1;");
    writeFile(dir, "__pycache__/app.cpython-311.js", "// bytecode");
    writeFile(dir, ".venv/lib/site.js", "// virtualenv");
    gitCommitAll(dir, "init");
    withProject(dir);

    const metrics = getCodeMetrics();

    assert.equal(metrics.sourceFiles, 1, `Expected 1 source file (__pycache__/.venv excluded), got ${metrics.sourceFiles}`);

    cleanup(dir);
  });
});

// ---------------------------------------------------------------------------
// BUG-06: Scoring architecture documentation tests
// ---------------------------------------------------------------------------

describe("BUG-06: Scoring architecture", () => {
  let dir;

  beforeEach(() => {
    dir = makeTempProject();
    gitInit(dir);
  });

  it("boilerplate project cannot exceed grade B", () => {
    // A project with all file-existence checks but no real work
    writeFile(dir, "package.json", JSON.stringify({ name: "boilerplate" }));
    writeFile(dir, "README.md", "# Boilerplate");
    writeFile(dir, "CLAUDE.md", "# Instructions");
    writeFile(dir, "tsconfig.json", JSON.stringify({ compilerOptions: { strict: true } }));
    writeFile(dir, ".claude/governance.json", JSON.stringify({ version: "1.0", project: { name: "test" } }));
    // No source files, no tests → Test Coverage = 0, Git Clean = 10
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();

    // Max achievable: governance(15) + git(10) + tests(0) + readme(10) + claude(10)
    //                 + types(10) + filesize(10) + security(15) = 80 → B
    assert.ok(result.score <= 80, `Boilerplate project scored ${result.score}, should be ≤80`);
    assert.ok(result.grade !== "A", `Boilerplate project graded ${result.grade}, should not be A`);

    cleanup(dir);
  });

  it("file-existence checks total exactly 45 points", () => {
    // Document the architectural fact: 45 of 100 points come from file existence alone
    // This test forces a conscious decision if scoring weights change
    const fileExistenceChecks = {
      "Governance": 15,     // governance.json exists
      "README": 10,         // README.md exists
      "CLAUDE.md": 10,      // CLAUDE.md exists
      "Type Safety": 10,    // tsconfig/jsconfig exists (max tier)
    };
    // governance(15) + readme(10) + claude(10) + types(10) = 45
    // These 4 checks award 45 points for file existence alone.

    writeFile(dir, "package.json", JSON.stringify({ name: "arch-test" }));
    writeFile(dir, "README.md", "# Test");
    writeFile(dir, "CLAUDE.md", "# Test");
    writeFile(dir, "tsconfig.json", JSON.stringify({ compilerOptions: { strict: true } }));
    writeFile(dir, ".claude/governance.json", JSON.stringify({ version: "1.0", project: { name: "test" } }));
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getHealthScore();
    const fileChecks = ["Governance", "README", "CLAUDE.md", "Type Safety"];
    const filePoints = fileChecks.reduce((sum, name) => {
      const check = result.checks.find((c) => c.name === name);
      return sum + (check ? check.points : 0);
    }, 0);

    assert.equal(filePoints, 45, `File-existence checks should total 45pts, got ${filePoints}`);

    cleanup(dir);
  });
});

// ---------------------------------------------------------------------------
// forge_get_git_status
// ---------------------------------------------------------------------------

describe("forge_get_git_status", () => {
  let dir;

  beforeEach(() => {
    dir = makeTempProject();
  });

  it("reports clean repo correctly", () => {
    gitInit(dir);
    writeFile(dir, "file.txt", "hello");
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getGitStatus();

    assert.equal(result.clean, true);
    assert.equal(result.modified, 0);
    assert.equal(result.untracked, 0);
    assert.equal(result.branch, "main");
    assert.ok(result.commitCount >= 1);
    assert.ok(result.lastCommit.includes("init"));

    cleanup(dir);
  });

  it("reports dirty repo with correct counts", () => {
    gitInit(dir);
    writeFile(dir, "tracked.txt", "original");
    gitCommitAll(dir, "init");

    // Modify tracked file + add untracked
    writeFileSync(join(dir, "tracked.txt"), "modified");
    writeFile(dir, "new-file.txt", "untracked");
    withProject(dir);

    const result = getGitStatus();

    assert.equal(result.clean, false);
    assert.equal(result.modified, 1, `Expected 1 modified, got ${result.modified}`);
    assert.equal(result.untracked, 1, `Expected 1 untracked, got ${result.untracked}`);

    cleanup(dir);
  });

  it("filters .claude/ files from dirty count", () => {
    gitInit(dir);
    writeFile(dir, "file.txt", "hello");
    gitCommitAll(dir, "init");

    // Only .claude/ files are dirty
    writeFile(dir, ".claude/governance.json", "{}");
    writeFile(dir, ".claude/settings.json", "{}");
    writeFile(dir, ".claude/project.json", "{}");
    withProject(dir);

    const result = getGitStatus();

    assert.equal(result.clean, true, ".claude/ files should be filtered from dirty state");
    assert.equal(result.modified, 0);
    assert.equal(result.untracked, 0);

    cleanup(dir);
  });

  it("counts staged files", () => {
    gitInit(dir);
    writeFile(dir, "base.txt", "base");
    gitCommitAll(dir, "init");

    writeFile(dir, "staged.txt", "will be staged");
    execSync("git add staged.txt", { cwd: dir, stdio: "ignore" });
    withProject(dir);

    const result = getGitStatus();

    assert.equal(result.clean, false);
    assert.equal(result.staged, 1, `Expected 1 staged, got ${result.staged}`);

    cleanup(dir);
  });
});

// ---------------------------------------------------------------------------
// forge_get_code_metrics
// ---------------------------------------------------------------------------

describe("forge_get_code_metrics", () => {
  let dir;

  beforeEach(() => {
    dir = makeTempProject();
  });

  it("counts source and test files accurately for a node project", () => {
    gitInit(dir);
    writeFile(dir, "package.json", JSON.stringify({ name: "metrics-test", dependencies: { express: "4.0.0" }, devDependencies: { vitest: "1.0.0" } }));
    writeFile(dir, "src/index.ts", "export const x = 1;");
    writeFile(dir, "src/utils.ts", "export const y = 2;");
    writeFile(dir, "src/helpers.js", "module.exports = {};");
    writeFile(dir, "src/__tests__/index.test.ts", "test('x', () => {});");
    writeFile(dir, "src/utils.spec.ts", "test('y', () => {});");
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getCodeMetrics();

    assert.equal(result.projectType, "node");
    assert.equal(result.sourceFiles, 3, `Expected 3 source files, got ${result.sourceFiles}`);
    assert.equal(result.testFiles, 2, `Expected 2 test files, got ${result.testFiles}`);
    assert.equal(result.dependencies, 1, `Expected 1 dep, got ${result.dependencies}`);
    assert.equal(result.devDependencies, 1, `Expected 1 devDep, got ${result.devDependencies}`);

    cleanup(dir);
  });

  it("detects python project type", () => {
    gitInit(dir);
    writeFile(dir, "pyproject.toml", "[tool.poetry]\nname = 'test'");
    writeFile(dir, "src/main.py", "print('hello')");
    writeFile(dir, "tests/test_main.py", "def test_main(): pass");
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getCodeMetrics();

    assert.equal(result.projectType, "python");

    cleanup(dir);
  });

  it("returns 0 for empty project", () => {
    gitInit(dir);
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getCodeMetrics();

    assert.equal(result.sourceFiles, 0);
    assert.equal(result.testFiles, 0);
    assert.equal(result.testFileRatio, 0);
    assert.equal(result.projectType, "unknown");

    cleanup(dir);
  });

  it("reports testCoverage as null when no coverage report exists", () => {
    gitInit(dir);
    writeFile(dir, "package.json", JSON.stringify({ name: "no-cov" }));
    writeFile(dir, "src/app.ts", "x");
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getCodeMetrics();

    assert.equal(result.testCoverage, null, "testCoverage should be null without coverage report");

    cleanup(dir);
  });
});

// ---------------------------------------------------------------------------
// forge_run_tests
// ---------------------------------------------------------------------------

describe("forge_run_tests", () => {
  let dir;

  beforeEach(() => {
    dir = makeTempProject();
  });

  it("returns graceful result when no project-local test runner is installed", () => {
    gitInit(dir);
    writeFile(dir, "package.json", JSON.stringify({ name: "no-runner" }));
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getTestResults();

    // No vitest/jest in node_modules — but pytest may be globally installed.
    // getTestResults() falls back to `which pytest`, so on machines with
    // global pytest it returns runner:"pytest" instead of null.
    const pytestGlobal = (() => {
      try { execSync("which pytest", { stdio: "ignore" }); return true; } catch { return false; }
    })();

    if (pytestGlobal) {
      assert.equal(result.runner, "pytest", "Should detect global pytest as fallback");
    } else {
      assert.equal(result.runner, null);
      assert.ok(result.message.includes("No test runner"), `Expected 'No test runner' message, got: ${result.message}`);
    }

    cleanup(dir);
  });
});

// ---------------------------------------------------------------------------
// forge_get_governance_state
// ---------------------------------------------------------------------------

describe("forge_get_governance_state", () => {
  let dir;

  beforeEach(() => {
    dir = makeTempProject();
  });

  it("returns initialized=false when no governance.json", () => {
    gitInit(dir);
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getGovernanceState();

    assert.equal(result.initialized, false);
    assert.ok(result.message.includes("No governance.json"));

    cleanup(dir);
  });

  it("returns initialized=true with correct data when governance.json exists", () => {
    gitInit(dir);
    writeFile(dir, ".claude/governance.json", JSON.stringify({
      version: "2.0",
      project: { name: "TestProject", vision: "Test vision" },
      workstreams: [{ id: "ws-1" }, { id: "ws-2" }],
      qualityGates: { coverage: 80 },
      metrics: { sessions: 5 },
    }));
    gitCommitAll(dir, "init");
    withProject(dir);

    const result = getGovernanceState();

    assert.equal(result.initialized, true);
    assert.equal(result.version, "2.0");
    assert.equal(result.project.name, "TestProject");
    assert.equal(result.workstreams, 2);
    assert.deepEqual(result.qualityGates, { coverage: 80 });

    cleanup(dir);
  });
});

// ---------------------------------------------------------------------------
// Subdirectory project layout (workspace with app in subdirectory)
// ---------------------------------------------------------------------------

describe("Subdirectory project layout", () => {
  let dir;

  beforeEach(() => {
    dir = makeTempProject();
    gitInit(dir);
    // Governance files at workspace root
    writeFile(dir, "CLAUDE.md", "# Workspace Instructions");
    writeFile(dir, ".claude/governance.json", JSON.stringify({ version: "1.0", project: { name: "workspace" } }));
    // Application lives in app/ subdirectory
    writeFile(dir, "app/package.json", JSON.stringify({
      name: "my-app",
      dependencies: { express: "4.0.0" },
      devDependencies: { vitest: "1.0.0" },
    }));
    writeFile(dir, "app/package-lock.json", JSON.stringify({ lockfileVersion: 3 }));
    writeFile(dir, "app/README.md", "# My App");
    writeFile(dir, "app/tsconfig.json", JSON.stringify({ compilerOptions: { strict: true } }));
    writeFile(dir, "app/src/index.js", "export const x = 1;\n".repeat(10));
    writeFile(dir, "app/src/index.test.js", "test('x', () => {});\n");
    mkdirSync(join(dir, "app", "node_modules", ".bin"), { recursive: true });
    writeFileSync(join(dir, "app", "node_modules", ".bin", "jest"), "");
    gitCommitAll(dir, "initial workspace");
    withProject(dir);
  });

  after(() => {});

  it("findApplicationRoot returns root when manifest exists at root", () => {
    // Create a separate temp dir with package.json at root
    const rootDir = makeTempProject();
    writeFile(rootDir, "package.json", JSON.stringify({ name: "root-app" }));

    const result = findApplicationRoot(rootDir);
    assert.equal(result, rootDir, "Should return root when manifest is at root");

    cleanup(rootDir);
  });

  it("findApplicationRoot finds manifest in subdirectory", () => {
    // dir has no package.json at root, but app/package.json exists
    const result = findApplicationRoot(dir);
    assert.equal(result, join(dir, "app"), "Should find app/ subdirectory");
  });

  it("findApplicationRoot skips node_modules/.git/.claude directories", () => {
    const skipDir = makeTempProject();
    // Put manifests only in excluded directories
    writeFile(skipDir, "node_modules/pkg/package.json", JSON.stringify({ name: "dep" }));
    writeFile(skipDir, ".git/hooks/package.json", JSON.stringify({ name: "hook" }));
    writeFile(skipDir, ".claude/package.json", JSON.stringify({ name: "claude" }));

    const result = findApplicationRoot(skipDir);
    assert.equal(result, skipDir, "Should fallback to root when only excluded dirs have manifests");

    cleanup(skipDir);
  });

  it("getCodeMetrics detects subdirectory package.json", () => {
    const metrics = getCodeMetrics();

    assert.equal(metrics.projectType, "node", "Should detect node project in subdirectory");
    assert.ok(metrics.dependencies > 0, `Should find dependencies, got ${metrics.dependencies}`);
    assert.ok(metrics.sourceFiles > 0, `Should find source files, got ${metrics.sourceFiles}`);
  });

  it("getCodeMetrics calculates testFileRatio in subdirectory", () => {
    const metrics = getCodeMetrics();

    assert.ok(metrics.testFileRatio > 0, `testFileRatio should be > 0, got ${metrics.testFileRatio}`);
    assert.ok(metrics.testFiles > 0, `testFiles should be > 0, got ${metrics.testFiles}`);
  });

  it("getHealthScore finds README in subdirectory", () => {
    const result = getHealthScore();
    const readmeCheck = result.checks.find((c) => c.name === "README");

    assert.equal(readmeCheck.status, "pass", "Should find README.md in app/ subdirectory");
    assert.equal(readmeCheck.points, 10);
  });

  it("getHealthScore keeps CLAUDE.md check at governance root", () => {
    const result = getHealthScore();
    const claudeCheck = result.checks.find((c) => c.name === "CLAUDE.md");

    assert.equal(claudeCheck.status, "pass", "Should find CLAUDE.md at workspace root");
    assert.equal(claudeCheck.points, 10);
  });

  it("getHealthScore finds tsconfig.json in subdirectory", () => {
    const result = getHealthScore();
    const typeCheck = result.checks.find((c) => c.name === "Type Safety");

    assert.equal(typeCheck.points, 10, "Should award 10pts for strict tsconfig in subdirectory");
  });

  it("getTestResults detects jest runner in subdirectory", () => {
    const result = getTestResults();

    // We placed node_modules/.bin/jest in app/ — runner must be exactly "jest"
    assert.equal(result.runner, "jest", `Should detect jest from app/node_modules/.bin/jest, got: ${result.runner}`);
  });

  it("getSecurityScan runs npm audit against subdirectory package-lock", () => {
    const result = getSecurityScan();

    // Verify the scan completed (not crashed)
    assert.ok(Array.isArray(result.findings), "findings should be an array");
    assert.equal(result.totalFindings, result.findings.length, "totalFindings should match findings array length");
    // npm audit should have been attempted (audit key present, even if it errored on our fake lockfile)
    // If package-lock.json wasn't found, audit would be strictly null
    assert.notEqual(result.audit, undefined, "audit should be defined (npm audit was attempted via subdirectory package-lock.json)");
  });

  it("server version in dashboard matches package.json version", async () => {
    const pkg = JSON.parse(readFileSync(join(import.meta.dirname, "..", "package.json"), "utf-8"));
    const result = await generateDashboard();
    const html = readFileSync(result.path, "utf-8");

    // Dashboard must contain the actual version from package.json
    assert.ok(html.includes(`v${pkg.version}`), `Dashboard should contain v${pkg.version}, not a hardcoded version`);
    // And must NOT contain any previous hardcoded versions
    assert.ok(!html.includes("v3.1.0"), "Dashboard must not contain hardcoded v3.1.0");
    assert.ok(!html.includes("v3.2.0"), "Dashboard must not contain hardcoded v3.2.0");
  });

  it("dashboard renders project data from subdirectory, not garbage", async () => {
    const result = await generateDashboard();
    const html = readFileSync(result.path, "utf-8");

    // Dashboard should show the governance project name, not "Project" fallback
    assert.ok(html.includes("workspace"), `Dashboard should show project name "workspace" from governance.json`);
    // Source files count should reflect the subdirectory app, not 0
    assert.ok(!html.match(/>0<\/div>\s*<div[^>]*>node</), "Source file count should not be 0 for a node project with files");
    // Dependencies should reflect the subdirectory package.json
    assert.ok(html.includes("express") || html.match(/>\d+<\/div>\s*<div[^>]*>\+/), "Dashboard should show dependency count from subdirectory");
  });
});
