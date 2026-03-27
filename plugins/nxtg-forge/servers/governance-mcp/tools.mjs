/**
 * NXTG-Forge Governance MCP — Tool Implementations
 *
 * All tool handler functions extracted from index.mjs so they can be
 * imported in tests without triggering the MCP server stdio connection.
 *
 * Each function accepts an optional `root` parameter that defaults to
 * process.cwd(), allowing tests to point at a fixture directory.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import open from "open";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Run a shell command and return trimmed stdout, or null on failure.
 * @param {string} cmd - Shell command to execute
 * @param {object} [opts] - execSync options override (cwd, timeout, shell, etc.)
 * @returns {string|null} Trimmed stdout, or null if the command exits non-zero or throws
 */
export function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 15000, ...opts }).trim();
  } catch (err) {
    console.error('[governance-mcp] run() failed:', cmd, err.message || err);
    return null;
  }
}

/**
 * Parse a JSON file from disk and return the parsed object, or null on failure.
 * @param {string} filePath - Absolute path to the JSON file
 * @returns {object|null} Parsed JSON object, or null if the file is missing or malformed
 */
export function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.error('[governance-mcp] readJson() failed:', filePath, err.message || err);
    return null;
  }
}

/**
 * MCP server version string, read dynamically from package.json at module load time.
 * Falls back to "unknown" if package.json is missing or unreadable.
 * @type {string}
 */
export const serverVersion = readJson(join(import.meta.dirname, "package.json"))?.version ?? "unknown";

// BUG-05: Build artifact directories to exclude from all find AND grep commands.
const EXCLUDED_DIRS = [
  "node_modules", "dist", ".git",
  ".next", "build", "out", "target",
  "coverage", ".nyc_output", "__pycache__", ".pytest_cache",
  "vendor", ".venv", ".turbo", ".vite", ".stryker-tmp", "dist-ui",
];
const BUILD_ARTIFACT_EXCLUDES = EXCLUDED_DIRS.map((d) => `-not -path "*/${d}/*"`).join(" ");
const GREP_EXCLUDE_DIRS = EXCLUDED_DIRS.map((d) => `--exclude-dir=${d}`).join(" ");

/**
 * Find the directory that contains the project manifest (package.json, Cargo.toml, etc.).
 * Checks startDir first (preserves existing behavior), then walks one level deep.
 * Skips node_modules, .git, .claude, .forge.
 */
export function findApplicationRoot(startDir) {
  const manifests = ["package.json", "Cargo.toml", "pyproject.toml", "go.mod"];
  const excluded = ["node_modules", ".git", ".claude", ".forge"];

  // 1. Check startDir itself first
  for (const m of manifests) {
    if (existsSync(join(startDir, m))) return startDir;
  }

  // 2. Walk one level deep — find first subdirectory with a manifest
  try {
    const entries = readdirSync(startDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (excluded.includes(entry.name)) continue;
      const candidate = join(startDir, entry.name);
      for (const m of manifests) {
        if (existsSync(join(candidate, m))) return candidate;
      }
    }
  } catch (err) {
    console.warn('[governance-mcp] findApplicationRoot() could not read directory, using startDir fallback:', err.message);
  }

  return startDir; // fallback — no manifest found
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

/**
 * Read the Forge governance state from `.claude/governance.json`.
 * @param {string} [root] - Project root directory (defaults to FORGE_PROJECT_ROOT or cwd)
 * @returns {{ initialized: boolean, version?: string, project?: object, workstreams?: number, qualityGates?: object, metrics?: object, message?: string, path?: string }}
 */
export function getGovernanceState(root = process.env.FORGE_PROJECT_ROOT || process.cwd()) {
  const govPath = join(root, ".claude", "governance.json");
  const gov = readJson(govPath);

  if (!gov) {
    return {
      initialized: false,
      message: "No governance.json found. Run /forge:init to set up Forge.",
      path: govPath,
    };
  }

  return {
    initialized: true,
    version: gov.version,
    project: gov.project,
    workstreams: gov.workstreams?.length ?? 0,
    qualityGates: gov.qualityGates,
    metrics: gov.metrics,
  };
}

/**
 * Return git working-tree status for the project.
 * `.claude/` paths are excluded from dirty-state counts (BUG-01).
 * @param {string} [root] - Project root directory (defaults to FORGE_PROJECT_ROOT or cwd)
 * @returns {{ branch: string|null, commitCount: number, lastCommit: string|null, clean: boolean, modified: number, untracked: number, staged: number, contributors: string[] }}
 */
export function getGitStatus(root = process.env.FORGE_PROJECT_ROOT || process.cwd()) {
  // Bug B: If root doesn't have .git, check subdirectory via findApplicationRoot
  let gitRoot = root;
  if (!existsSync(join(root, ".git"))) {
    const appRoot = findApplicationRoot(root);
    if (existsSync(join(appRoot, ".git"))) {
      gitRoot = appRoot;
    }
  }

  const branch = run("git rev-parse --abbrev-ref HEAD", { cwd: gitRoot });
  const commitCount = run("git rev-list --count HEAD", { cwd: gitRoot });
  const lastCommit = run('git log -1 --format="%h %s (%cr)"', { cwd: gitRoot });
  const status = run("git status --porcelain", { cwd: gitRoot });
  const contributors = run("git shortlog -sn --no-merges HEAD | head -5", { cwd: gitRoot });

  const lines = status ? status.split("\n").filter(Boolean) : [];
  // BUG-01: Exclude .claude/ paths — governance writes should not penalize git cleanliness
  const relevantLines = lines.filter((l) => !l.slice(3).trim().startsWith(".claude/"));
  const modified = relevantLines.filter((l) => l.startsWith(" M") || l.startsWith("M ")).length;
  const untracked = relevantLines.filter((l) => l.startsWith("??")).length;
  const staged = relevantLines.filter((l) => /^[AMDR]/.test(l)).length;

  return {
    branch,
    commitCount: parseInt(commitCount) || 0,
    lastCommit,
    modified,
    untracked,
    staged,
    clean: relevantLines.length === 0,
    contributors: contributors
      ? contributors.split("\n").map((l) => l.trim())
      : [],
  };
}

/**
 * Collect code metrics for the project: file counts, test ratios, line counts, and dependencies.
 * Uses `findApplicationRoot` to locate the manifest; build artifact directories are excluded.
 * @param {string} [root] - Project root directory (defaults to FORGE_PROJECT_ROOT or cwd)
 * @returns {{ projectType: string, sourceFiles: number, testFiles: number, testCaseCount: number, testFileRatio: number, testCoverage: number|null, totalLines: string, largeFiles: string[], dependencies: number, devDependencies: number }}
 */
export function getCodeMetrics(root = process.env.FORGE_PROJECT_ROOT || process.cwd()) {
  const appRoot = findApplicationRoot(root);

  // Detect project type from appRoot (supports subdirectory manifests)
  const hasPackageJson = existsSync(join(appRoot, "package.json"));
  const hasCargoToml = existsSync(join(appRoot, "Cargo.toml"));
  const hasPyproject = existsSync(join(appRoot, "pyproject.toml"));
  const hasGoMod = existsSync(join(appRoot, "go.mod"));

  let projectType = "unknown";
  let sourceExt = "*.ts";
  if (hasPackageJson) {
    projectType = "node";
    sourceExt = "*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}";
  } else if (hasCargoToml) {
    projectType = "rust";
    sourceExt = "*.rs";
  } else if (hasPyproject) {
    projectType = "python";
    sourceExt = "*.py";
  } else if (hasGoMod) {
    projectType = "go";
    sourceExt = "*.go";
  }

  // Expand brace patterns into find -o syntax (find doesn't support shell brace expansion)
  function findNameExpr(pattern) {
    if (!pattern.includes("{")) return `-name "${pattern}"`;
    const base = pattern.replace(/^\*\./, "");
    const exts = base.replace(/[{}]/g, "").split(",");
    return "\\( " + exts.map((e) => `-name "*.${e}"`).join(" -o ") + " \\)";
  }

  // Count source files (BUG-03: exclude *.config.*, BUG-05: exclude build artifacts)
  const sourceFiles = run(
    `find . ${findNameExpr(sourceExt)} ${BUILD_ARTIFACT_EXCLUDES} -not -name "*.test.*" -not -name "*.spec.*" -not -path "*/__tests__/*" -not -name "*.config.*" 2>/dev/null | wc -l`,
    { cwd: appRoot, shell: "/bin/bash" }
  );

  // Count test files
  const testFiles = run(
    `find . \\( -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" -o -path "*/__tests__/*" \\) ${BUILD_ARTIFACT_EXCLUDES} 2>/dev/null | wc -l`,
    { cwd: appRoot, shell: "/bin/bash" }
  );

  // Count total lines
  const totalLines = run(
    `find . ${findNameExpr(sourceExt)} ${BUILD_ARTIFACT_EXCLUDES} 2>/dev/null | head -500 | xargs wc -l 2>/dev/null | tail -1`,
    { cwd: appRoot, shell: "/bin/bash" }
  );

  // Large files (>300 lines)
  const largeFiles = run(
    `find . \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.rs" -o -name "*.go" \\) ${BUILD_ARTIFACT_EXCLUDES} 2>/dev/null | xargs wc -l 2>/dev/null | sort -rn | head -6 | grep -v total`,
    { cwd: appRoot, shell: "/bin/bash" }
  );

  // Dependencies
  let deps = 0;
  let devDeps = 0;
  if (hasPackageJson) {
    const pkg = readJson(join(appRoot, "package.json"));
    if (pkg) {
      deps = Object.keys(pkg.dependencies || {}).length;
      devDeps = Object.keys(pkg.devDependencies || {}).length;
    }
  }

  // Real line coverage from Istanbul/c8/nyc report (null = no report found)
  const testCoverage = (() => {
    const coveragePaths = [
      join(appRoot, "coverage", "coverage-summary.json"),
      join(appRoot, ".nyc_output", "coverage-summary.json"),
    ];
    for (const p of coveragePaths) {
      if (existsSync(p)) {
        const cov = readJson(p);
        if (cov?.total?.lines?.pct !== undefined) {
          return Math.round(cov.total.lines.pct);
        }
      }
    }
    return null;
  })();

  const srcCount = parseInt(sourceFiles) || 0;
  const tstCount = parseInt(testFiles) || 0;

  // Count individual test cases by grepping for test declarations (~50ms)
  // Uses find to locate test files (avoids node_modules/dist inflation) then greps for patterns.
  // Covers: JS/TS (it/test + .each/.skip/.only), Python (def test_), Rust (#[test] + async), Go (func Test)
  const testCaseCount = (() => {
    const excl = BUILD_ARTIFACT_EXCLUDES;
    const patterns = {
      // find all test files (*.test.*, *.spec.*, *.cy.*, plus files inside __tests__/ dirs)
      // then grep for it(, test(, it.each(, test.skip(, etc.
      node: `find . \\( -name "*.test.*" -o -name "*.spec.*" -o -name "*.cy.*" -o -path "*/__tests__/*" \\) ${excl} 2>/dev/null | xargs grep -E "^\\s*(it|test)(\\.(each|skip|only|todo|concurrent))?\\s*\\(" 2>/dev/null | wc -l`,
      // #[test], #[tokio::test], #[actix_web::test], #[rstest], #[test_case]
      rust: `find . -name "*.rs" ${excl} 2>/dev/null | xargs grep -E "#\\[(tokio::)?test\\]|#\\[rstest\\]|#\\[test_case\\]|#\\[actix_web::test\\]" 2>/dev/null | wc -l`,
      python: `find . -name "*.py" ${excl} 2>/dev/null | xargs grep -E "^\\s*def test_" 2>/dev/null | wc -l`,
      go: `find . -name "*_test.go" ${excl} 2>/dev/null | xargs grep -E "^func Test" 2>/dev/null | wc -l`,
    };
    const cmd = patterns[projectType];
    if (!cmd) return 0;
    return parseInt(run(cmd, { cwd: appRoot, shell: "/bin/bash" })) || 0;
  })();

  return {
    projectType,
    sourceFiles: srcCount,
    testFiles: tstCount,
    testCaseCount,
    // testFileRatio: test files / source files (proxy metric, not real line coverage)
    testFileRatio: tstCount && srcCount ? Math.round((tstCount / srcCount) * 100) : 0,
    // testCoverage: actual line coverage % from Istanbul/c8 report, null if unavailable
    testCoverage,
    totalLines: totalLines ? totalLines.trim() : "unknown",
    largeFiles: largeFiles ? largeFiles.split("\n").map((l) => l.trim()).filter(Boolean) : [],
    dependencies: deps,
    devDependencies: devDeps,
  };
}

/**
 * Compute the overall project health score across governance, git, testing, docs, and security dimensions.
 * @param {string} [root] - Project root directory (defaults to FORGE_PROJECT_ROOT or cwd)
 * @returns {{ score: number, grade: string, maxScore: number, checks: Array<{ name: string, status: string, points: number, note?: string }> }}
 */
export function getHealthScore(root = process.env.FORGE_PROJECT_ROOT || process.cwd()) {
  const appRoot = findApplicationRoot(root);
  const gov = getGovernanceState(root);
  const git = getGitStatus(root);
  const metrics = getCodeMetrics(root);

  let score = 0;
  const checks = [];

  // Governance initialized (15 pts) — always at governance root
  if (gov.initialized) {
    score += 15;
    checks.push({ name: "Governance", status: "pass", points: 15 });
  } else {
    checks.push({ name: "Governance", status: "fail", points: 0, note: "Not initialized" });
  }

  // Git clean (10 pts)
  if (git.clean) {
    score += 10;
    checks.push({ name: "Git Clean", status: "pass", points: 10 });
  } else {
    score += 5;
    checks.push({ name: "Git Clean", status: "warn", points: 5, note: `${git.modified} modified, ${git.untracked} untracked` });
  }

  // Has tests (20 pts) — tiered: real coverage → test density → file ratio
  if (metrics.testFiles > 0) {
    let testScore;
    let coverageNote;
    if (metrics.testCoverage !== null) {
      // Tier 1: Real line coverage from Istanbul/c8/nyc
      testScore = Math.min(20, Math.round((metrics.testCoverage / 100) * 20));
      coverageNote = `${metrics.testCoverage}% line coverage`;
    } else if (metrics.testCaseCount > 0 && metrics.sourceFiles > 0) {
      // Tier 2: Test density — test cases per source file
      // Benchmarks: <1 = sparse, 1-3 = basic, 3-5 = solid, 5+ = thorough
      const density = metrics.testCaseCount / metrics.sourceFiles;
      if (density >= 5) testScore = 20;
      else if (density >= 3) testScore = 15;
      else if (density >= 1) testScore = 10;
      else testScore = 5;
      coverageNote = `${metrics.testCaseCount} tests across ${metrics.sourceFiles} files (${density.toFixed(1)}/file)`;
    } else {
      // Tier 3: File ratio fallback
      testScore = Math.min(20, Math.round((metrics.testFileRatio / 100) * 20));
      coverageNote = `${metrics.testFileRatio}% file ratio`;
    }
    score += testScore;
    checks.push({ name: "Test Coverage", status: testScore >= 15 ? "pass" : "warn", points: testScore, note: coverageNote });
  } else {
    checks.push({ name: "Test Coverage", status: "fail", points: 0, note: "No tests found" });
  }

  // Has README (10 pts) — check appRoot (may be in subdirectory)
  if (existsSync(join(appRoot, "README.md"))) {
    score += 10;
    checks.push({ name: "README", status: "pass", points: 10 });
  } else {
    checks.push({ name: "README", status: "fail", points: 0 });
  }

  // Has CLAUDE.md (10 pts) — always at governance root
  if (existsSync(join(root, "CLAUDE.md"))) {
    score += 10;
    checks.push({ name: "CLAUDE.md", status: "pass", points: 10 });
  } else {
    checks.push({ name: "CLAUDE.md", status: "warn", points: 0, note: "Recommended for AI-assisted development" });
  }

  // TypeScript / type checking (0-10 pts, tiered) — BUG-04: nuanced scoring
  const tsTypeSafety = (() => {
    const tsConfig = readJson(join(appRoot, "tsconfig.json"));
    if (tsConfig) {
      const co = tsConfig.compilerOptions || {};
      const strictFlags = ["noImplicitAny", "strictNullChecks", "strictFunctionTypes",
        "strictBindCallApply", "strictPropertyInitialization", "noImplicitThis", "alwaysStrict"];
      const activeStrictFlags = strictFlags.filter((f) => co[f] === true).length;
      if (co.strict === true || activeStrictFlags >= 3) {
        return { points: 10, status: "pass", note: "strict TypeScript" };
      }
      return { points: 7, status: "pass", note: "TypeScript (not strict)" };
    }
    if (existsSync(join(appRoot, "jsconfig.json"))) {
      return { points: 4, status: "info", note: "jsconfig only" };
    }
    return { points: 0, status: "info", note: "no type config" };
  })();
  score += tsTypeSafety.points;
  checks.push({ name: "Type Safety", status: tsTypeSafety.status, points: tsTypeSafety.points, note: tsTypeSafety.note });

  // No large files (10 pts)
  const largeCount = metrics.largeFiles.filter((f) => {
    const match = f.match(/^\s*(\d+)/);
    return match && parseInt(match[1]) > 500;
  }).length;
  if (largeCount === 0) {
    score += 10;
    checks.push({ name: "File Size", status: "pass", points: 10 });
  } else {
    score += 5;
    checks.push({ name: "File Size", status: "warn", points: 5, note: `${largeCount} files over 500 lines` });
  }

  // Security (15 pts) — npm audit, secrets in git, hardcoded secrets, eval usage
  const security = getSecurityScan(root);
  let securityPoints = 15;
  const securityNotes = [];

  // .env in git: -5
  if (security.findings.some((f) => f.label === ".env file committed to git")) {
    securityPoints -= 5;
    securityNotes.push("secrets in git");
  }

  // npm audit vulnerabilities: -10 for critical/high, -5 for moderate
  if (security.audit?.total > 0) {
    const v = security.audit.vulnerabilities;
    if ((v.critical || 0) > 0 || (v.high || 0) > 0) {
      securityPoints -= 10;
      securityNotes.push(`${(v.critical || 0) + (v.high || 0)} critical/high vulns`);
    } else if ((v.moderate || 0) > 0) {
      securityPoints -= 5;
      securityNotes.push(`${v.moderate} moderate vulns`);
    }
  }

  // Hardcoded secrets or eval: -5
  const hasSecretFindings = security.findings.some(
    (f) => f.category === "secrets" && f.label !== ".env file committed to git"
  );
  const hasEval = security.findings.some((f) => f.category === "injection");
  if (hasSecretFindings || hasEval) {
    securityPoints -= 5;
    securityNotes.push(hasSecretFindings ? "hardcoded secrets" : "eval() usage");
  }

  securityPoints = Math.max(0, securityPoints);
  score += securityPoints;
  checks.push({
    name: "Security",
    status: securityPoints >= 12 ? "pass" : securityPoints >= 5 ? "warn" : "fail",
    points: securityPoints,
    note: securityNotes.length ? securityNotes.join(", ") : "clean",
  });

  const grade =
    score >= 90 ? "A" :
    score >= 80 ? "B" :
    score >= 70 ? "C" :
    score >= 60 ? "D" : "F";

  return { score, grade, maxScore: 100, checks };
}

/**
 * Auto-detect the test runner (vitest, jest, or pytest) and execute the test suite.
 * @param {string} [root] - Project root directory (defaults to FORGE_PROJECT_ROOT or cwd)
 * @returns {{ runner: string|null, raw: string|null, parsed: { numPassed: number, numFailed: number, numTotal: number, success: boolean }|null, message?: string }}
 */
export function getTestResults(root = process.env.FORGE_PROJECT_ROOT || process.cwd()) {
  const appRoot = findApplicationRoot(root);
  const hasVitest = existsSync(join(appRoot, "node_modules", ".bin", "vitest"));
  const hasJest = existsSync(join(appRoot, "node_modules", ".bin", "jest"));
  const hasPytest = existsSync(join(appRoot, ".venv", "bin", "pytest")) ||
    run("which pytest", { cwd: appRoot });

  let runner = null;
  let result = null;

  if (hasVitest) {
    runner = "vitest";
    result = run("npx vitest run --reporter=json 2>/dev/null | tail -1", {
      cwd: appRoot,
      timeout: 60000,
    });
  } else if (hasJest) {
    runner = "jest";
    result = run("npx jest --json 2>/dev/null | tail -1", {
      cwd: appRoot,
      timeout: 60000,
    });
  } else if (hasPytest) {
    runner = "pytest";
    result = run("pytest --tb=short -q 2>&1 | tail -5", { cwd: appRoot, timeout: 60000 });
  }

  if (!runner) {
    return { runner: null, message: "No test runner detected" };
  }

  let parsed = null;
  if (result && (runner === "vitest" || runner === "jest")) {
    try {
      parsed = JSON.parse(result);
    } catch (err) {
      console.error('[governance-mcp] getTestResults() JSON parse failed:', err.message || err);
    }
  }

  return {
    runner,
    raw: result?.substring(0, 2000),
    parsed: parsed
      ? {
          numPassed: parsed.numPassedTests ?? parsed.numPassed,
          numFailed: parsed.numFailedTests ?? parsed.numFailed,
          numTotal: parsed.numTotalTests ?? parsed.numTotal,
          success: parsed.success,
        }
      : null,
  };
}

/**
 * List all saved governance checkpoints from `.claude/checkpoints/`, sorted newest-first.
 * @param {string} [root] - Project root directory (defaults to FORGE_PROJECT_ROOT or cwd)
 * @returns {{ checkpoints: Array<{ name: string, created: string, description: string }>, count?: number, message?: string }}
 */
export function listCheckpoints(root = process.env.FORGE_PROJECT_ROOT || process.cwd()) {
  const checkpointDir = join(root, ".claude", "checkpoints");
  if (!existsSync(checkpointDir)) {
    return { checkpoints: [], message: "No checkpoints found. Use /forge:checkpoint to create one." };
  }

  const files = readdirSync(checkpointDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const data = readJson(join(checkpointDir, f));
      const stat = statSync(join(checkpointDir, f));
      return {
        name: f.replace(".json", ""),
        created: stat.mtime.toISOString(),
        description: data?.description || data?.name || f,
      };
    })
    .sort((a, b) => new Date(b.created) - new Date(a.created));

  return { checkpoints: files, count: files.length };
}

/**
 * Scan the project for common security issues: hardcoded secrets, eval() usage,
 * `.env` files committed to git, and npm audit vulnerabilities.
 * @param {string} [root] - Project root directory (defaults to FORGE_PROJECT_ROOT or cwd)
 * @returns {{ findings: Array<{ severity: string, category: string, label: string, count?: number, sample?: string, files?: string[] }>, audit: { vulnerabilities: object, total: number }|null, totalFindings: number }}
 */
export function getSecurityScan(root = process.env.FORGE_PROJECT_ROOT || process.cwd()) {
  const appRoot = findApplicationRoot(root);
  const findings = [];

  // Check for hardcoded secrets
  const secretPatterns = [
    { pattern: "password\\s*=\\s*['\"][^'\"]+['\"]", label: "Hardcoded password" },
    { pattern: "api_key\\s*=\\s*['\"][^'\"]+['\"]", label: "Hardcoded API key" },
    { pattern: "secret\\s*=\\s*['\"][^'\"]+['\"]", label: "Hardcoded secret" },
  ];

  for (const { pattern, label } of secretPatterns) {
    const matches = run(
      `grep -rnI "${pattern}" --include="*.ts" --include="*.js" --include="*.py" . 2>/dev/null | grep -v node_modules | grep -v dist | head -5`,
      { cwd: appRoot }
    );
    if (matches) {
      findings.push({
        severity: "high",
        category: "secrets",
        label,
        count: matches.split("\n").length,
        sample: matches.split("\n")[0]?.substring(0, 120),
      });
    }
  }

  // Check for eval
  const evalMatches = run(
    `grep -rn "eval(" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | grep -v dist | wc -l`,
    { cwd: appRoot }
  );
  if (parseInt(evalMatches) > 0) {
    findings.push({
      severity: "high",
      category: "injection",
      label: "eval() usage",
      count: parseInt(evalMatches),
    });
  }

  // Check for .env in git (use governance root for git commands)
  const envInGit = run("git ls-files | grep -i '\\.env$'", { cwd: root });
  if (envInGit) {
    findings.push({
      severity: "critical",
      category: "secrets",
      label: ".env file committed to git",
      files: envInGit.split("\n"),
    });
  }

  // npm audit (if available) — use appRoot where package-lock.json lives
  let audit = null;
  if (existsSync(join(appRoot, "package-lock.json"))) {
    // npm audit exits non-zero when vulns exist — || true prevents run() from dropping output
    const auditRaw = run("npm audit --json 2>/dev/null || true", { cwd: appRoot, timeout: 30000 });
    if (auditRaw) {
      try {
        const auditData = JSON.parse(auditRaw);
        audit = {
          vulnerabilities: auditData.metadata?.vulnerabilities || {},
          total: auditData.metadata?.vulnerabilities
            ? Object.values(auditData.metadata.vulnerabilities).reduce((a, b) => a + b, 0)
            : 0,
        };
      } catch (err) {
        console.error('[governance-mcp] getSecurityScan() npm audit parse failed — vulnerabilities may be silently dropped:', err.message || err);
      }
    }
  }

  return { findings, audit, totalFindings: findings.length };
}

/**
 * Generate an HTML governance dashboard, write it to a temp file, and open it in the default browser.
 * In FORGE_TEST_MODE the browser launch is skipped and the file path is returned immediately.
 * @param {string} [root] - Project root directory (defaults to FORGE_PROJECT_ROOT or cwd)
 * @returns {Promise<{ path: string, projectName: string, healthScore: number, healthGrade: string }>}
 */
export async function generateDashboard(root = process.env.FORGE_PROJECT_ROOT || process.cwd()) {
  const gov = getGovernanceState(root);
  const git = getGitStatus(root);
  const metrics = getCodeMetrics(root);
  const health = getHealthScore(root);
  const checkpoints = listCheckpoints(root);
  const security = getSecurityScan(root);

  const projectName = gov.project?.name || git.branch || "Project";
  const projectVision = gov.project?.vision || "No vision set";

  const checksHtml = health.checks
    .map((c) => {
      const icon =
        c.status === "pass" ? '<span class="text-emerald-400">&#10003;</span>' :
        c.status === "fail" ? '<span class="text-red-400">&#10007;</span>' :
        c.status === "warn" ? '<span class="text-amber-400">&#9888;</span>' :
        '<span class="text-slate-400">&#8226;</span>';
      return `<div class="flex items-center justify-between py-2 border-b border-slate-700/50">
        <div class="flex items-center gap-2">${icon} <span class="text-slate-200">${c.name}</span></div>
        <div class="flex items-center gap-3">
          ${c.note ? `<span class="text-xs text-slate-400">${c.note}</span>` : ""}
          <span class="text-sm font-mono ${c.points > 0 ? "text-emerald-400" : "text-slate-500"}">${c.points}pts</span>
        </div>
      </div>`;
    })
    .join("\n");

  const securityHtml = security.findings.length > 0
    ? security.findings.map((f) => `<div class="flex items-center justify-between py-1.5">
        <span class="text-slate-200">${f.label}</span>
        <span class="px-2 py-0.5 rounded text-xs font-medium ${
          f.severity === "critical" ? "bg-red-500/20 text-red-400" :
          f.severity === "high" ? "bg-amber-500/20 text-amber-400" :
          "bg-blue-500/20 text-blue-400"
        }">${f.severity}</span>
      </div>`).join("\n")
    : '<p class="text-emerald-400 text-sm">No security issues detected</p>';

  const gradeColor =
    health.grade === "A" ? "text-emerald-400" :
    health.grade === "B" ? "text-blue-400" :
    health.grade === "C" ? "text-amber-400" :
    "text-red-400";

  const scoreBarColor =
    health.score >= 80 ? "bg-emerald-500" :
    health.score >= 60 ? "bg-amber-500" :
    "bg-red-500";

  const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forge | ${projectName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    body { font-family: 'Inter', sans-serif; background: #0a0a0f; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .glow { box-shadow: 0 0 30px rgba(99, 102, 241, 0.15); }
    .card { background: linear-gradient(135deg, rgba(15,15,25,0.9) 0%, rgba(20,20,35,0.9) 100%); border: 1px solid rgba(99, 102, 241, 0.15); }
    @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
    @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    .gradient-text { background: linear-gradient(135deg, #818cf8, #6366f1, #a78bfa, #818cf8); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: gradient 4s ease infinite; }
    .score-ring { position: relative; width: 140px; height: 140px; }
    .score-ring svg { transform: rotate(-90deg); }
    .score-ring .value { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    .grid-bg { background-image: linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px); background-size: 40px 40px; }
  </style>
</head>
<body class="min-h-screen text-slate-100 grid-bg">
  <!-- Header -->
  <header class="border-b border-slate-800/80 backdrop-blur-sm sticky top-0 z-50 bg-[#0a0a0f]/80">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="1.5"/><polygon points="12,6 16,8.5 16,15.5 12,18 8,15.5 8,8.5" fill="white" opacity="0.9"/><path d="M12,3 L12,1 L10.5,2.5 L12,1 L13.5,2.5" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>
        </div>
        <h1 class="text-lg font-semibold">Forge</h1>
        <span class="text-xs text-slate-500 font-mono">v${serverVersion}</span>
      </div>
      <div class="flex items-center gap-4 text-sm text-slate-400">
        <span class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full ${git.clean ? "bg-emerald-400" : "bg-amber-400"} pulse-slow"></span>
          ${git.branch}
        </span>
        <span class="font-mono text-xs">${new Date().toLocaleString()}</span>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-6 py-8 space-y-8">
    <!-- Project Banner -->
    <div class="card rounded-2xl p-8 glow">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-3xl font-bold gradient-text">${projectName}</h2>
          <p class="text-slate-400 mt-2 max-w-xl">${projectVision}</p>
          ${gov.project?.goals ? `<div class="flex gap-2 mt-4">${gov.project.goals.map((g) => `<span class="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">${g}</span>`).join("")}</div>` : ""}
        </div>
        <div class="score-ring">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(99,102,241,0.1)" stroke-width="10"/>
            <circle cx="70" cy="70" r="60" fill="none" stroke="${health.score >= 80 ? "#34d399" : health.score >= 60 ? "#fbbf24" : "#f87171"}" stroke-width="10"
              stroke-dasharray="${(health.score / 100) * 377} 377" stroke-linecap="round"/>
          </svg>
          <div class="value flex-col">
            <span class="text-3xl font-bold ${gradeColor}">${health.grade}</span>
            <span class="text-xs text-slate-500">${health.score}/100</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Metric Cards Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="card rounded-xl p-5">
        <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">Source Files</div>
        <div class="text-2xl font-bold text-slate-100">${metrics.sourceFiles}</div>
        <div class="text-xs text-slate-500 mt-1">${metrics.projectType}</div>
      </div>
      <div class="card rounded-xl p-5">
        <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">Test Files</div>
        <div class="text-2xl font-bold text-slate-100">${metrics.testFiles}</div>
        <div class="text-xs ${(metrics.testCoverage ?? 0) >= 50 ? "text-emerald-400" : "text-amber-400"} mt-1">${metrics.testCoverage !== null ? `${metrics.testCoverage}% coverage` : metrics.testCaseCount > 0 ? `${metrics.testCaseCount} test cases` : `${metrics.testFileRatio}% file ratio`}</div>
      </div>
      <div class="card rounded-xl p-5">
        <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">Commits</div>
        <div class="text-2xl font-bold text-slate-100">${git.commitCount}</div>
        <div class="text-xs text-slate-500 mt-1">${git.branch}</div>
      </div>
      <div class="card rounded-xl p-5">
        <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">Dependencies</div>
        <div class="text-2xl font-bold text-slate-100">${metrics.dependencies}</div>
        <div class="text-xs text-slate-500 mt-1">+${metrics.devDependencies} dev</div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Health Checks -->
      <div class="card rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Health Checks
        </h3>
        <div class="space-y-0">
          ${checksHtml}
        </div>
        <div class="mt-4 flex items-center justify-between">
          <span class="text-sm text-slate-400">Overall Score</span>
          <div class="flex items-center gap-3">
            <div class="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full ${scoreBarColor} rounded-full transition-all" style="width: ${health.score}%"></div>
            </div>
            <span class="font-mono text-sm font-semibold ${gradeColor}">${health.score}%</span>
          </div>
        </div>
      </div>

      <!-- Security -->
      <div class="card rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Security
        </h3>
        ${securityHtml}
        ${security.audit ? `
        <div class="mt-4 pt-4 border-t border-slate-700/50">
          <div class="text-xs text-slate-500 uppercase tracking-wider mb-2">npm audit</div>
          <div class="flex gap-3">
            ${Object.entries(security.audit.vulnerabilities)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => `<span class="px-2 py-0.5 rounded text-xs ${
                k === "critical" ? "bg-red-500/20 text-red-400" :
                k === "high" ? "bg-amber-500/20 text-amber-400" :
                k === "moderate" ? "bg-yellow-500/20 text-yellow-400" :
                "bg-blue-500/20 text-blue-400"
              }">${v} ${k}</span>`).join("") || '<span class="text-emerald-400 text-xs">All clear</span>'}
          </div>
        </div>` : ""}
      </div>
    </div>

    <!-- Git Activity -->
    <div class="card rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/></svg>
        Git Status
      </h3>
      <div class="grid md:grid-cols-3 gap-6">
        <div>
          <div class="text-xs text-slate-500 uppercase tracking-wider mb-2">Last Commit</div>
          <p class="text-sm text-slate-300 font-mono">${git.lastCommit || "N/A"}</p>
        </div>
        <div>
          <div class="text-xs text-slate-500 uppercase tracking-wider mb-2">Working Tree</div>
          <div class="flex gap-3">
            <span class="text-sm"><span class="text-amber-400">${git.modified}</span> modified</span>
            <span class="text-sm"><span class="text-blue-400">${git.untracked}</span> untracked</span>
            <span class="text-sm"><span class="text-emerald-400">${git.staged}</span> staged</span>
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-500 uppercase tracking-wider mb-2">Top Contributors</div>
          <div class="space-y-1">
            ${git.contributors.slice(0, 3).map((c) => `<p class="text-sm text-slate-300">${c}</p>`).join("")}
          </div>
        </div>
      </div>
    </div>

    <!-- Large Files -->
    ${metrics.largeFiles.length > 0 ? `
    <div class="card rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        Largest Files
      </h3>
      <div class="space-y-2">
        ${metrics.largeFiles.map((f) => {
          const match = f.match(/^\s*(\d+)\s+(.+)/);
          if (!match) return "";
          const lines = parseInt(match[1]);
          const path = match[2];
          const pct = Math.min(100, (lines / 1000) * 100);
          return `<div class="flex items-center gap-3">
            <span class="font-mono text-xs text-slate-400 w-16 text-right">${lines}</span>
            <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full ${lines > 500 ? "bg-amber-500" : "bg-indigo-500"} rounded-full" style="width: ${pct}%"></div>
            </div>
            <span class="text-xs text-slate-300 truncate max-w-xs">${path}</span>
          </div>`;
        }).join("")}
      </div>
    </div>` : ""}

    <!-- Checkpoints -->
    ${checkpoints.count > 0 ? `
    <div class="card rounded-xl p-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        Checkpoints (${checkpoints.count})
      </h3>
      <div class="space-y-2">
        ${checkpoints.checkpoints.slice(0, 5).map((cp) => `<div class="flex items-center justify-between py-2 border-b border-slate-700/50">
          <span class="text-sm text-slate-200">${cp.name}</span>
          <span class="text-xs text-slate-500">${new Date(cp.created).toLocaleDateString()}</span>
        </div>`).join("")}
      </div>
    </div>` : ""}

    <!-- Level Up — Forge Progression -->
    <div class="card rounded-2xl p-8">
      <h3 class="text-xl font-bold mb-2 flex items-center gap-2">
        <span class="text-2xl">🔥</span> Level Up Your Build Game
      </h3>
      <p class="text-slate-400 text-sm mb-6">Forge grows with you. Start vibing, graduate to shipping.</p>
      <div class="grid md:grid-cols-3 gap-4">
        <!-- L1: Vibe Coder -->
        <div class="rounded-xl p-5 border-2 ${health.score > 0 ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-700 bg-slate-800/30"}">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold uppercase tracking-wider ${health.score > 0 ? "text-emerald-400" : "text-slate-500"}">Level 1</span>
            ${health.score > 0 ? '<span class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Active</span>' : '<span class="text-xs text-slate-600">Locked</span>'}
          </div>
          <h4 class="text-lg font-bold mb-1">🎮 Vibe Coder</h4>
          <p class="text-slate-400 text-xs mb-3">22 AI agents. Governance on autopilot. Ship faster with guardrails.</p>
          <div class="space-y-1.5 text-xs text-slate-300">
            <div class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> /forge:status — project health at a glance</div>
            <div class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> /forge:feature — plan and build features</div>
            <div class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> /forge:test — run tests with analysis</div>
            <div class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> 22 specialized agents on demand</div>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-700/50">
            <code class="text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded block whitespace-pre-wrap">claude plugin marketplace add nxtg-ai/forge-plugin && claude plugin install nxtg-forge</code>
          </div>
        </div>

        <!-- L2: Pro Builder -->
        <div class="rounded-xl p-5 border-2 border-slate-700 bg-slate-800/30 relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold uppercase tracking-wider text-amber-400">Level 2</span>
            <span class="text-xs text-slate-600">+ Orchestrator</span>
          </div>
          <h4 class="text-lg font-bold mb-1">⚡ Pro Builder</h4>
          <p class="text-slate-400 text-xs mb-3">Multi-agent task orchestration. Knowledge that persists. Drift detection.</p>
          <div class="space-y-1.5 text-xs text-slate-300">
            <div class="flex items-center gap-1.5"><span class="text-amber-400">+</span> Parallel agent task assignment</div>
            <div class="flex items-center gap-1.5"><span class="text-amber-400">+</span> Cross-session knowledge capture</div>
            <div class="flex items-center gap-1.5"><span class="text-amber-400">+</span> Vision drift detection</div>
            <div class="flex items-center gap-1.5"><span class="text-amber-400">+</span> File-level conflict prevention</div>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-700/50">
            <code class="text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded">curl -fsSL https://forge.nxtg.ai/install.sh | sh</code>
          </div>
        </div>

        <!-- L3: Ship Lord -->
        <div class="rounded-xl p-5 border-2 border-slate-700 bg-slate-800/30 relative overflow-hidden">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold uppercase tracking-wider text-purple-400">Level 3</span>
            <span class="text-xs text-slate-600">+ Dashboard</span>
          </div>
          <h4 class="text-lg font-bold mb-1">👑 Ship Lord</h4>
          <p class="text-slate-400 text-xs mb-3">Real-time visual dashboard. Infinity Terminal. Full mission control.</p>
          <div class="space-y-1.5 text-xs text-slate-300">
            <div class="flex items-center gap-1.5"><span class="text-purple-400">+</span> Real-time governance dashboard</div>
            <div class="flex items-center gap-1.5"><span class="text-purple-400">+</span> Infinity Terminal (agent feed)</div>
            <div class="flex items-center gap-1.5"><span class="text-purple-400">+</span> Multi-project portfolio view</div>
            <div class="flex items-center gap-1.5"><span class="text-purple-400">+</span> Team collaboration mode</div>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-700/50">
            <span class="text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded">Coming soon</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resources & Quick Start -->
    <div class="grid md:grid-cols-2 gap-6">
      <div class="card rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Quick Start
        </h3>
        <div class="space-y-3">
          <div class="flex items-start gap-3">
            <span class="text-xs font-bold text-indigo-400 bg-indigo-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <div>
              <p class="text-sm text-slate-200 font-medium">Initialize governance</p>
              <code class="text-xs text-slate-400">/forge:init</code>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-xs font-bold text-indigo-400 bg-indigo-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <div>
              <p class="text-sm text-slate-200 font-medium">Plan your first feature</p>
              <code class="text-xs text-slate-400">/forge:feature "add user auth"</code>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-xs font-bold text-indigo-400 bg-indigo-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <div>
              <p class="text-sm text-slate-200 font-medium">Check health anytime</p>
              <code class="text-xs text-slate-400">/forge:status</code>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-xs font-bold text-indigo-400 bg-indigo-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
            <div>
              <p class="text-sm text-slate-200 font-medium">Find gaps before shipping</p>
              <code class="text-xs text-slate-400">/forge:gap-analysis</code>
            </div>
          </div>
        </div>
      </div>

      <div class="card rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Resources
        </h3>
        <div class="space-y-2.5">
          <a href="https://github.com/nxtg-ai/forge-plugin" target="_blank" class="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors group">
            <div class="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#8b949e"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span class="text-sm text-slate-300 group-hover:text-slate-100">GitHub Repository</span>
            </div>
            <span class="text-xs text-slate-600">nxtg-ai/forge-plugin →</span>
          </a>
          <a href="https://forge.nxtg.ai" target="_blank" class="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors group">
            <div class="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b949e" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span class="text-sm text-slate-300 group-hover:text-slate-100">Documentation</span>
            </div>
            <span class="text-xs text-slate-600">forge.nxtg.ai →</span>
          </a>
          <a href="https://github.com/nxtg-ai/forge-plugin/issues" target="_blank" class="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors group">
            <div class="flex items-center gap-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b949e" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span class="text-sm text-slate-300 group-hover:text-slate-100">Report Issues / Feedback</span>
            </div>
            <span class="text-xs text-slate-600">Issues →</span>
          </a>
          <a href="https://www.producthunt.com/products/forge-7" target="_blank" class="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors group">
            <div class="flex items-center gap-2.5">
              <span class="text-sm">🚀</span>
              <span class="text-sm text-slate-300 group-hover:text-slate-100">Product Hunt</span>
            </div>
            <span class="text-xs text-slate-600">Upvote →</span>
          </a>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-800/50 mt-12">
    <div class="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-slate-600">
      <span>Generated by Forge · <a href="https://github.com/nxtg-ai/forge-plugin" class="text-indigo-500 hover:text-indigo-400 transition-colors">GitHub</a> · <a href="https://forge.nxtg.ai" class="text-indigo-500 hover:text-indigo-400 transition-colors">Docs</a></span>
      <span>From "it compiles" to "it ships." ⚡</span>
    </div>
  </footer>
</body>
</html>`;

  // Write to temp file
  const tmpPath = join(tmpdir(), `forge-dashboard-${Date.now()}.html`);
  writeFileSync(tmpPath, html);

  // Detect WSL2 — tmux sessions strip WSL_DISTRO_NAME, so also check the interop file
  const isWSL = !!process.env.WSL_DISTRO_NAME || existsSync('/proc/sys/fs/binfmt_misc/WSLInterop');
  const distro = process.env.WSL_DISTRO_NAME || 'Ubuntu';

  // Build the URL the user's Windows browser can actually open.
  // Linux path /tmp/foo.html → file://///wsl.localhost/Ubuntu/tmp/foo.html
  const browserUrl = isWSL
    ? `file://///wsl.localhost/${distro}${tmpPath}`
    : `file://${tmpPath}`;

  // Skip browser launch in test mode — return immediately with file path
  if (process.env.FORGE_TEST_MODE) {
    return { path: tmpPath, browserUrl, projectName, healthScore: health.score, healthGrade: health.grade };
  }

  // Attempt auto-open. In WSL2 tmux sessions, the `open` package may fail because
  // DISPLAY and WSL_INTEROP env vars are not forwarded. Try two fallbacks before giving up.
  let opened = false;
  try {
    await open(isWSL ? browserUrl : tmpPath);
    opened = true;
  } catch (err) {
    console.warn('[governance-mcp] generateDashboard() open() failed:', err.message);
  }

  if (!opened && isWSL) {
    // Fallback 1: powershell.exe Start (works in tmux, no DISPLAY needed)
    try {
      execSync(`powershell.exe Start "${browserUrl}"`, { stdio: 'ignore' });
      opened = true;
    } catch (err) {
      console.warn('[governance-mcp] generateDashboard() powershell.exe fallback failed:', err.message);
    }
  }

  if (!opened && isWSL) {
    // Fallback 2: wslview (installed by wslu package)
    try {
      execSync(`wslview "${tmpPath}"`, { stdio: 'ignore' });
      opened = true;
    } catch (err) {
      console.warn('[governance-mcp] generateDashboard() wslview fallback failed:', err.message);
    }
  }

  return {
    path: tmpPath,
    browserUrl,
    projectName,
    healthScore: health.score,
    healthGrade: health.grade,
    ...(isWSL && !opened ? { hint: `Paste this URL into your Windows browser: ${browserUrl}` } : {}),
  };
}
