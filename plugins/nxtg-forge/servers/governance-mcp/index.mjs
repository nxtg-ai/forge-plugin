#!/usr/bin/env node
/**
 * NXTG-Forge Governance MCP Server
 *
 * Provides project governance tools for Claude Code via MCP protocol.
 * Reads governance.json, git state, test results, and code metrics.
 * Generates interactive HTML dashboards.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync, spawn as spawnProcess } from "child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 15000, ...opts }).trim();
  } catch {
    return null;
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function getProjectRoot() {
  // Claude Code sets cwd to the user's project root
  return process.cwd();
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function getGovernanceState() {
  const root = getProjectRoot();
  const govPath = join(root, ".claude", "governance.json");
  const gov = readJson(govPath);

  if (!gov) {
    return {
      initialized: false,
      message: "No governance.json found. Run /[FRG]-init to set up Forge.",
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

function getGitStatus() {
  const root = getProjectRoot();

  const branch = run("git rev-parse --abbrev-ref HEAD", { cwd: root });
  const commitCount = run("git rev-list --count HEAD", { cwd: root });
  const lastCommit = run('git log -1 --format="%h %s (%cr)"', { cwd: root });
  const status = run("git status --porcelain", { cwd: root });
  const contributors = run("git shortlog -sn --no-merges HEAD | head -5", { cwd: root });

  const lines = status ? status.split("\n") : [];
  const modified = lines.filter((l) => l.startsWith(" M") || l.startsWith("M ")).length;
  const untracked = lines.filter((l) => l.startsWith("??")).length;
  const staged = lines.filter((l) => /^[AMDR]/.test(l)).length;

  return {
    branch,
    commitCount: parseInt(commitCount) || 0,
    lastCommit,
    modified,
    untracked,
    staged,
    clean: lines.length === 0,
    contributors: contributors
      ? contributors.split("\n").map((l) => l.trim())
      : [],
  };
}

function getCodeMetrics() {
  const root = getProjectRoot();

  // Detect project type
  const hasPackageJson = existsSync(join(root, "package.json"));
  const hasCargoToml = existsSync(join(root, "Cargo.toml"));
  const hasPyproject = existsSync(join(root, "pyproject.toml"));
  const hasGoMod = existsSync(join(root, "go.mod"));

  let projectType = "unknown";
  let sourceExt = "*.ts";
  let testPattern = "*.test.*";
  if (hasPackageJson) {
    projectType = "node";
    sourceExt = "*.{ts,tsx,js,jsx}";
    testPattern = "*.{test,spec}.{ts,tsx,js,jsx}";
  } else if (hasCargoToml) {
    projectType = "rust";
    sourceExt = "*.rs";
  } else if (hasPyproject) {
    projectType = "python";
    sourceExt = "*.py";
    testPattern = "test_*.py";
  } else if (hasGoMod) {
    projectType = "go";
    sourceExt = "*.go";
    testPattern = "*_test.go";
  }

  // Count source files
  const sourceFiles = run(
    `find . -name "${sourceExt.replace("{", "\\{").replace("}", "\\}")}" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" -not -name "*.test.*" -not -name "*.spec.*" -not -path "*/__tests__/*" 2>/dev/null | wc -l`,
    { cwd: root, shell: "/bin/bash" }
  );

  // Count test files
  const testFiles = run(
    `find . \\( -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" -o -path "*/__tests__/*" \\) -not -path "*/node_modules/*" -not -path "*/dist/*" 2>/dev/null | wc -l`,
    { cwd: root, shell: "/bin/bash" }
  );

  // Count total lines
  const totalLines = run(
    `find . -name "${sourceExt.replace("{", "\\{").replace("}", "\\}")}" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" 2>/dev/null | head -500 | xargs wc -l 2>/dev/null | tail -1`,
    { cwd: root, shell: "/bin/bash" }
  );

  // Large files (>300 lines)
  const largeFiles = run(
    `find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" -o -name "*.rs" -o -name "*.go" 2>/dev/null | grep -v node_modules | grep -v dist | grep -v .git | xargs wc -l 2>/dev/null | sort -rn | head -6 | grep -v total`,
    { cwd: root, shell: "/bin/bash" }
  );

  // Dependencies
  let deps = 0;
  let devDeps = 0;
  if (hasPackageJson) {
    const pkg = readJson(join(root, "package.json"));
    if (pkg) {
      deps = Object.keys(pkg.dependencies || {}).length;
      devDeps = Object.keys(pkg.devDependencies || {}).length;
    }
  }

  return {
    projectType,
    sourceFiles: parseInt(sourceFiles) || 0,
    testFiles: parseInt(testFiles) || 0,
    testCoverage: parseInt(testFiles) && parseInt(sourceFiles)
      ? Math.round((parseInt(testFiles) / parseInt(sourceFiles)) * 100)
      : 0,
    totalLines: totalLines ? totalLines.trim() : "unknown",
    largeFiles: largeFiles ? largeFiles.split("\n").map((l) => l.trim()).filter(Boolean) : [],
    dependencies: deps,
    devDependencies: devDeps,
  };
}

function getHealthScore() {
  const gov = getGovernanceState();
  const git = getGitStatus();
  const metrics = getCodeMetrics();
  const root = getProjectRoot();

  let score = 0;
  const checks = [];

  // Governance initialized (20 pts)
  if (gov.initialized) {
    score += 20;
    checks.push({ name: "Governance", status: "pass", points: 20 });
  } else {
    checks.push({ name: "Governance", status: "fail", points: 0, note: "Not initialized" });
  }

  // Git clean (15 pts)
  if (git.clean) {
    score += 15;
    checks.push({ name: "Git Clean", status: "pass", points: 15 });
  } else {
    score += 5;
    checks.push({ name: "Git Clean", status: "warn", points: 5, note: `${git.modified} modified, ${git.untracked} untracked` });
  }

  // Has tests (20 pts)
  if (metrics.testFiles > 0) {
    const testScore = Math.min(20, Math.round((metrics.testCoverage / 100) * 20));
    score += testScore;
    checks.push({ name: "Test Coverage", status: testScore >= 15 ? "pass" : "warn", points: testScore, note: `${metrics.testCoverage}% file coverage` });
  } else {
    checks.push({ name: "Test Coverage", status: "fail", points: 0, note: "No tests found" });
  }

  // Has README (10 pts)
  if (existsSync(join(root, "README.md"))) {
    score += 10;
    checks.push({ name: "README", status: "pass", points: 10 });
  } else {
    checks.push({ name: "README", status: "fail", points: 0 });
  }

  // Has CLAUDE.md (10 pts)
  if (existsSync(join(root, "CLAUDE.md"))) {
    score += 10;
    checks.push({ name: "CLAUDE.md", status: "pass", points: 10 });
  } else {
    checks.push({ name: "CLAUDE.md", status: "warn", points: 0, note: "Recommended for AI-assisted development" });
  }

  // TypeScript / type checking (10 pts)
  if (existsSync(join(root, "tsconfig.json"))) {
    score += 10;
    checks.push({ name: "Type Safety", status: "pass", points: 10 });
  } else {
    checks.push({ name: "Type Safety", status: "info", points: 0 });
  }

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

  // Security: no .env committed (5 pts)
  const envInGit = run("git ls-files | grep -i '\\.env$'", { cwd: root });
  if (!envInGit) {
    score += 5;
    checks.push({ name: "No .env in Git", status: "pass", points: 5 });
  } else {
    checks.push({ name: "No .env in Git", status: "fail", points: 0, note: "Secrets may be committed!" });
  }

  const grade =
    score >= 90 ? "A" :
    score >= 80 ? "B" :
    score >= 70 ? "C" :
    score >= 60 ? "D" : "F";

  return { score, grade, maxScore: 100, checks };
}

function getTestResults() {
  const root = getProjectRoot();
  const hasVitest = existsSync(join(root, "node_modules", ".bin", "vitest"));
  const hasJest = existsSync(join(root, "node_modules", ".bin", "jest"));
  const hasPytest = existsSync(join(root, ".venv", "bin", "pytest")) ||
    run("which pytest", { cwd: root });

  let runner = null;
  let result = null;

  if (hasVitest) {
    runner = "vitest";
    result = run("npx vitest run --reporter=json 2>/dev/null | tail -1", {
      cwd: root,
      timeout: 60000,
    });
  } else if (hasJest) {
    runner = "jest";
    result = run("npx jest --json 2>/dev/null | tail -1", {
      cwd: root,
      timeout: 60000,
    });
  } else if (hasPytest) {
    runner = "pytest";
    result = run("pytest --tb=short -q 2>&1 | tail -5", { cwd: root, timeout: 60000 });
  }

  if (!runner) {
    return { runner: null, message: "No test runner detected" };
  }

  let parsed = null;
  if (result && (runner === "vitest" || runner === "jest")) {
    try {
      parsed = JSON.parse(result);
    } catch {
      // JSON parsing failed, return raw output
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

function listCheckpoints() {
  const root = getProjectRoot();
  const checkpointDir = join(root, ".claude", "checkpoints");
  if (!existsSync(checkpointDir)) {
    return { checkpoints: [], message: "No checkpoints found. Use /[FRG]-checkpoint to create one." };
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

function getSecurityScan() {
  const root = getProjectRoot();
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
      { cwd: root }
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
    { cwd: root }
  );
  if (parseInt(evalMatches) > 0) {
    findings.push({
      severity: "high",
      category: "injection",
      label: "eval() usage",
      count: parseInt(evalMatches),
    });
  }

  // Check for .env in git
  const envInGit = run("git ls-files | grep -i '\\.env$'", { cwd: root });
  if (envInGit) {
    findings.push({
      severity: "critical",
      category: "secrets",
      label: ".env file committed to git",
      files: envInGit.split("\n"),
    });
  }

  // npm audit (if available)
  let audit = null;
  if (existsSync(join(root, "package-lock.json"))) {
    const auditRaw = run("npm audit --json 2>/dev/null", { cwd: root, timeout: 30000 });
    if (auditRaw) {
      try {
        const auditData = JSON.parse(auditRaw);
        audit = {
          vulnerabilities: auditData.metadata?.vulnerabilities || {},
          total: auditData.metadata?.vulnerabilities
            ? Object.values(auditData.metadata.vulnerabilities).reduce((a, b) => a + b, 0)
            : 0,
        };
      } catch {}
    }
  }

  return { findings, audit, totalFindings: findings.length };
}

function generateDashboard() {
  const gov = getGovernanceState();
  const git = getGitStatus();
  const metrics = getCodeMetrics();
  const health = getHealthScore();
  const checkpoints = listCheckpoints();
  const security = getSecurityScan();

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
  <title>NXTG-Forge | ${projectName}</title>
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
        <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <h1 class="text-lg font-semibold">NXTG-Forge</h1>
        <span class="text-xs text-slate-500 font-mono">v3.0.0</span>
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
        <div class="text-xs ${metrics.testCoverage >= 50 ? "text-emerald-400" : "text-amber-400"} mt-1">${metrics.testCoverage}% coverage</div>
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
  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-800/50 mt-12">
    <div class="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-slate-600">
      <span>Generated by NXTG-Forge Governance MCP Server</span>
      <span>Built with Claude Code. Governed by Forge.</span>
    </div>
  </footer>
</body>
</html>`;

  // Write to temp file
  const tmpPath = join(tmpdir(), `forge-dashboard-${Date.now()}.html`);
  writeFileSync(tmpPath, html);

  // Try to open in browser (non-blocking)
  try {
    if (existsSync("/mnt/c/Windows")) {
      // WSL2: convert path and open with Windows browser
      const winPath = tmpPath.replace(/^\/tmp/, "/mnt/c/Users/Public").replace(/\//g, "\\");
      // Copy to a Windows-accessible path first
      execSync(`cp "${tmpPath}" /mnt/c/Users/Public/ 2>/dev/null`, { timeout: 3000 });
      const winFile = `C:\\Users\\Public\\${tmpPath.split("/").pop()}`;
      spawnProcess("cmd.exe", ["/c", "start", "", winFile], { detached: true, stdio: "ignore" }).unref();
    } else if (process.platform === "darwin") {
      spawnProcess("open", [tmpPath], { detached: true, stdio: "ignore" }).unref();
    } else {
      spawnProcess("xdg-open", [tmpPath], { detached: true, stdio: "ignore" }).unref();
    }
  } catch {
    // Browser open failed — user can open manually
  }

  return {
    path: tmpPath,
    projectName,
    healthScore: health.score,
    healthGrade: health.grade,
  };
}

// ---------------------------------------------------------------------------
// MCP Server Setup
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "forge_get_health",
    description:
      "Get the project health score (0-100) with letter grade and detailed check results. Evaluates governance, git cleanliness, test coverage, documentation, type safety, file sizes, and security.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_get_governance_state",
    description:
      "Read the project's governance.json — project name, vision, goals, workstreams, quality gates, and session metrics.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_get_git_status",
    description:
      "Get git repository status: branch, commit count, last commit, modified/untracked/staged file counts, and top contributors.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_get_code_metrics",
    description:
      "Get code metrics: source file count, test file count, test coverage percentage, total lines, largest files, and dependency counts.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_run_tests",
    description:
      "Detect the test runner (vitest/jest/pytest) and run the test suite. Returns pass/fail counts and raw output. May take up to 60 seconds.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_list_checkpoints",
    description:
      "List all saved governance checkpoints with names and creation dates.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_security_scan",
    description:
      "Scan for security issues: hardcoded secrets, eval() usage, .env files in git, and npm audit vulnerabilities.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "forge_open_dashboard",
    description:
      "Generate a beautiful HTML governance dashboard and open it in the browser. Shows health score, metrics, git status, security findings, and checkpoints. Returns the file path.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

const server = new Server(
  { name: "forge-governance", version: "3.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  try {
    let result;
    switch (name) {
      case "forge_get_health":
        result = getHealthScore();
        break;
      case "forge_get_governance_state":
        result = getGovernanceState();
        break;
      case "forge_get_git_status":
        result = getGitStatus();
        break;
      case "forge_get_code_metrics":
        result = getCodeMetrics();
        break;
      case "forge_run_tests":
        result = getTestResults();
        break;
      case "forge_list_checkpoints":
        result = listCheckpoints();
        break;
      case "forge_security_scan":
        result = getSecurityScan();
        break;
      case "forge_open_dashboard":
        result = generateDashboard();
        break;
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [
        { type: "text", text: JSON.stringify(result, null, 2) },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error in ${name}: ${error.message}\n${error.stack}`,
        },
      ],
      isError: true,
    };
  }
});

// Start
const transport = new StdioServerTransport();
await server.connect(transport);
