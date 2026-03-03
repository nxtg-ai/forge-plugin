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
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";

// Prevent MCP server from starting during tests
process.env.FORGE_TEST_MODE = "1";

const { getHealthScore, getGitStatus, getCodeMetrics, getTestResults, getGovernanceState } =
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
    writeFile(dir, "tsconfig.json", "{}");
    writeFile(dir, "src/app.ts", "export const x = 1;\n".repeat(20));
    writeFile(dir, "src/utils.ts", "export const y = 2;\n".repeat(20));
    writeFile(dir, "src/lib.ts", "export const z = 3;\n".repeat(20));
    writeFile(dir, "src/__tests__/app.test.ts", "test('x', () => {});\n");
    writeFile(dir, "src/__tests__/utils.test.ts", "test('y', () => {});\n");
    writeFile(dir, ".claude/governance.json", JSON.stringify({ version: "1.0", project: { name: "test" } }));
    gitCommitAll(dir, "initial");
    withProject(dir);

    const result = getHealthScore();

    assert.equal(typeof result.score, "number");
    assert.ok(result.score > 0, `Score should be > 0, got ${result.score}`);
    assert.ok(result.grade !== "F", `Grade should not be F, got ${result.grade}`);
    assert.equal(result.maxScore, 100);
    assert.ok(Array.isArray(result.checks));

    // Governance initialized = 20pts
    const govCheck = result.checks.find((c) => c.name === "Governance");
    assert.equal(govCheck.status, "pass");
    assert.equal(govCheck.points, 20);

    // Git clean = 15pts
    const gitCheck = result.checks.find((c) => c.name === "Git Clean");
    assert.equal(gitCheck.status, "pass");
    assert.equal(gitCheck.points, 15);

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
    assert.equal(gitCheck.points, 15);

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

    assert.equal(typeof metrics.testFileRatio, "number");
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

    assert.equal(typeof result.score, "number");
    assert.ok(result.score >= 0);
    assert.ok(result.grade);
    assert.ok(Array.isArray(result.checks));
    // Should not crash

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
