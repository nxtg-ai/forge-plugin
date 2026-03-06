# NXTG-Forge Governance MCP Server — Bug Report #03

**Date:** 2026-03-03
**Reporter:** Claude Code (automated investigation)
**Severity:** CRITICAL (systemic — 14 bugs, 4 HIGH)
**Component:** `@nxtg-forge/governance-mcp` v3.2.0
**Source:** `~/.claude/plugins/cache/forge/forge/3.2.1/servers/governance-mcp/index.mjs` (1,057 lines)

---

## 1. Executive Summary

The NXTG-Forge governance MCP server has **14 bugs** across 5 functions that cause the dashboard to display fundamentally incorrect metrics and deflate the health score by ~22 points. The **single root cause** is that every file-existence check assumes project definition files (`package.json`, `tsconfig.json`, `README.md`, `node_modules/`) reside directly at `FORGE_PROJECT_ROOT`. This assumption breaks for monorepo and subdirectory layouts like `forge-demo/game.clicker/`.

**Impact at a glance:**

| Metric | Reported | Actual |
|--------|----------|--------|
| Source Files | 0 | 2 |
| Dependencies | 0 (+0 dev) | 8 (+4 dev) |
| Test File Ratio | 0% | 200% |
| Project Type | `"unknown"` | `"node"` |
| Total Lines | `"unknown"` | ~460 |
| Health Score | 60/100 (D) | ~82–87/100 (B/A) |
| Test Runner | `null` ("No test runner detected") | Jest via react-scripts |
| npm Audit | Skipped | Should run |

**Investigation scope:** 5 agents deployed (3 Explore, 1 forge-detective, 1 general-purpose test runner). Two dashboard HTML snapshots compared. Full cascade analysis performed.

---

## 2. Environment & Reproduction

### Environment

| Item | Value |
|------|-------|
| Platform | WSL2 Linux 6.6.87.2-microsoft-standard-WSL2 |
| Claude Code | v2.1.63 |
| Plugin path | `~/.claude/plugins/cache/forge/forge/3.2.1/servers/governance-mcp/` |
| MCP declared version | `3.2.0` (line 978 of `index.mjs`) |
| Installed path version | `3.2.1` |
| Dashboard label version | `v3.1.0` (hardcoded in HTML template) |
| Test file | `__tests__/health.test.mjs` (740 lines, 31 tests, all passing) |

### Project Layout That Exposes the Bugs

```
/home/axw/projects/POC/forge-demo/        ← FORGE_PROJECT_ROOT (set by start.sh)
├── CLAUDE.md                              ← exists at root (health check passes)
├── .claude/
│   └── governance.json
└── game.clicker/                          ← ACTUAL APPLICATION ROOT
    ├── package.json                       ← NOT at project root
    ├── package-lock.json                  ← NOT at project root
    ├── node_modules/
    │   └── .bin/jest                      ← NOT at project root
    ├── README.md                          ← NOT at project root
    └── src/
        ├── clicker-game.js (436 lines)
        ├── index.js
        ├── index.css
        ├── clicker-game.test.js
        ├── clicker-game-challenges.test.js
        ├── clicker-game-edge-cases.test.js
        └── clicker-game-progression.test.js
```

### Reproduction Steps

1. Create a workspace directory (e.g. `forge-demo/`) with `CLAUDE.md` and `.claude/governance.json` at root.
2. Place the actual application (with `package.json`, `src/`, etc.) in a subdirectory (e.g. `game.clicker/`).
3. Run `/forge:dashboard` or `/forge:status`.
4. Observe: Source Files = 0, Dependencies = 0, Health Score deflated by ~22 points, `"null"` values rendered in dashboard.

---

## 3. Bug Catalog (14 Bugs)

### BUG-01 — `hasPackageJson` only checks project root

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Line** | 118 |
| **Function** | `getCodeMetrics()` |
| **Severity** | HIGH |
| **Cascade** | Triggers BUG-02, BUG-03, BUG-05, BUG-09, BUG-12 |

**Code:**
```javascript
const hasPackageJson = existsSync(join(root, "package.json"));
```

**Problem:** `root` resolves to `/home/axw/projects/POC/forge-demo` — no `package.json` exists there. The actual file is at `game.clicker/package.json`. All four manifest checks (`hasPackageJson`, `hasCargoToml`, `hasPyproject`, `hasGoMod`) return `false`, causing the entire type-detection chain to fall through.

---

### BUG-02 — Default `sourceExt = "*.ts"` excludes all JS/JSX files

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Lines** | 124, 152–155 |
| **Function** | `getCodeMetrics()` |
| **Severity** | HIGH |
| **Cascade from** | BUG-01 |

**Code:**
```javascript
let sourceExt = "*.ts";  // line 124 — never reassigned due to BUG-01

// lines 152-155
const sourceFiles = run(
  `find . ${findNameExpr(sourceExt)} ${BUILD_ARTIFACT_EXCLUDES} ...`,
  { cwd: root, shell: "/bin/bash" }
);
```

**Problem:** `find . -name "*.ts"` finds zero files. The project uses `.js` and `.jsx`.

| Metric | Reported | Actual |
|--------|----------|--------|
| `sourceFiles` | `0` | `2` |

---

### BUG-03 — Dependencies count is 0 because package.json read is skipped

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Lines** | 176–184 |
| **Function** | `getCodeMetrics()` |
| **Severity** | HIGH |
| **Cascade from** | BUG-01 |

**Code:**
```javascript
let deps = 0;
let devDeps = 0;
if (hasPackageJson) {             // ← FALSE due to BUG-01; entire block skipped
  const pkg = readJson(join(root, "package.json"));
  if (pkg) {
    deps = Object.keys(pkg.dependencies || {}).length;
    devDeps = Object.keys(pkg.devDependencies || {}).length;
  }
}
```

| Metric | Reported | Actual |
|--------|----------|--------|
| `deps` | `0` | `8` |
| `devDeps` | `0` | `4` |

---

### BUG-04 — README check only looks at project root

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Line** | 259 |
| **Function** | `getHealthScore()` |
| **Severity** | MEDIUM |
| **Health impact** | −10 points |

**Code:**
```javascript
if (existsSync(join(root, "README.md"))) {
  score += 10;
  checks.push({ name: "README", status: "pass", points: 10 });
} else {
  checks.push({ name: "README", status: "fail", points: 0 });  // ← TRIGGERED
}
```

**Problem:** `README.md` exists at `game.clicker/README.md` (3,790 bytes, CRA-generated) but is not found at project root.

---

### BUG-05 — `projectType` returns `"unknown"`

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Line** | 123 |
| **Function** | `getCodeMetrics()` |
| **Severity** | MEDIUM |
| **Cascade from** | BUG-01 |

**Code:**
```javascript
let projectType = "unknown";  // never reassigned when no manifest is found at root
```

**Dashboard impact:** Source Files card subtitle shows `"unknown"` instead of `"node"`.

---

### BUG-06 — `findNameExpr()` has latent bug for double-brace patterns

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Lines** | 144–149 |
| **Function** | `findNameExpr()` helper |
| **Severity** | LOW (latent — not triggered by current code paths) |

**Code:**
```javascript
function findNameExpr(pattern) {
  if (!pattern.includes("{")) return `-name "${pattern}"`;
  const base = pattern.replace(/^\*\./, "");
  const exts = base.replace(/[{}]/g, "").split(",");
  return "\\( " + exts.map(e => `-name "*.${e}"`).join(" -o ") + " \\)";
}
```

**Problem:** For double-brace patterns like `"*.{test,spec}.{ts,js}"`, the regex `replace(/^\*\./, "")` strips only the first `*.`, leaving `{test,spec}.{ts,js}`. The split produces garbled tokens: `["test","spec}.","{ts","js"]`.

---

### BUG-07 — Test runner detection checks root `node_modules` only

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Lines** | 330–333 |
| **Function** | `getTestResults()` |
| **Severity** | MEDIUM |

**Code:**
```javascript
const hasVitest = existsSync(join(root, "node_modules", ".bin", "vitest"));
const hasJest   = existsSync(join(root, "node_modules", ".bin", "jest"));
```

**Problem:** Resolves to `/home/axw/projects/POC/forge-demo/node_modules/.bin/jest` which does not exist. The actual binary is at `game.clicker/node_modules/.bin/jest`.

**Result:** `{ runner: null, message: "No test runner detected" }`

---

### BUG-08 — npm audit skipped due to missing root `package-lock.json`

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Lines** | 459–472 |
| **Function** | `getSecurityScan()` |
| **Severity** | MEDIUM |

**Code:**
```javascript
if (existsSync(join(root, "package-lock.json"))) {
  const auditRaw = run("npm audit --json 2>/dev/null", { cwd: root, timeout: 30000 });
  ...
}
```

**Problem:** `package-lock.json` is at `game.clicker/package-lock.json`. The audit block is skipped entirely and the dashboard omits the npm audit section (line 647: `${security.audit ? ... : ""}`).

---

### BUG-09 — `testFileRatio = 0` due to division guard masking BUG-02

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Lines** | 206–210 |
| **Function** | `getCodeMetrics()` |
| **Severity** | HIGH |
| **Cascade from** | BUG-02 |

**Code:**
```javascript
testFileRatio: parseInt(testFiles) && parseInt(sourceFiles)
  ? Math.round((parseInt(testFiles) / parseInt(sourceFiles)) * 100)
  : 0,  // ← Returns 0 because sourceFiles=0 (BUG-02)
```

| Metric | Reported | Actual |
|--------|----------|--------|
| `testFileRatio` | `0%` | `200%` (4 test files / 2 source files) |

**Dashboard impact:** Test Files card shows `"0% file ratio"` in amber warning color with ⚠ icon.

---

### BUG-10 — `getHealthScore()` CLAUDE.md check only looks at root (latent)

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Line** | 267 |
| **Function** | `getHealthScore()` |
| **Severity** | LOW (latent — happens to work here because CLAUDE.md IS at root) |

**Code:**
```javascript
if (existsSync(join(root, "CLAUDE.md"))) {
```

**Note:** Does not trigger in this project because `CLAUDE.md` exists at `FORGE_PROJECT_ROOT`. Would fail silently for projects where `CLAUDE.md` is in a subdirectory.

---

### BUG-11 — Type Safety check does not look in subdirectories

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Lines** | 277–292 |
| **Function** | `getHealthScore()` |
| **Severity** | MEDIUM |
| **Health impact** | −7 points |

**Code:**
```javascript
const tsConfig = readJson(join(root, "tsconfig.json"));
if (tsConfig) { ... }
if (existsSync(join(root, "jsconfig.json"))) { ... }
```

**Problem:** CRA may generate `tsconfig.json` or `jsconfig.json` at `game.clicker/`. The check returns 0 points. Dashboard shows `"no type config"`.

---

### BUG-12 — `totalLines` returns `"unknown"` string on pipeline failure

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Lines** | 164–167, 213 |
| **Function** | `getCodeMetrics()` |
| **Severity** | LOW (field not rendered in dashboard HTML; JSON data integrity only) |

**Code:**
```javascript
const totalLines = run(
  `find . ${findNameExpr(sourceExt)} ... | head -500 | xargs wc -l 2>/dev/null | tail -1`,
  { cwd: root, shell: "/bin/bash" }
);
// ...
totalLines: totalLines ? totalLines.trim() : "unknown",
```

| Metric | Reported | Actual |
|--------|----------|--------|
| `totalLines` | `"unknown"` | ~460 |

---

### BUG-13 — Version mismatch: MCP server declares `3.2.0`, installed at `3.2.1` path

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Line** | 978 |
| **Function** | Server initialization |
| **Severity** | LOW (metadata discrepancy) |

**Code:**
```javascript
const server = new Server(
  { name: "forge-governance", version: "3.2.0" },
  // ...
```

Three conflicting version strings: directory path = `3.2.1`, MCP declaration = `3.2.0`, dashboard label = `3.1.0`.

---

### BUG-14 — Dashboard version label hardcoded to `v3.1.0`

| Field | Value |
|-------|-------|
| **File** | `index.mjs` |
| **Line** | 559 (inside `generateDashboard()` HTML template) |
| **Function** | `generateDashboard()` |
| **Severity** | LOW (cosmetic) |

**Rendered HTML (line 33):**
```html
<span class="text-xs text-slate-500 font-mono">v3.1.0</span>
```

---

## 4. Cascade Failure Chain

```
FORGE_PROJECT_ROOT = /home/axw/projects/POC/forge-demo
        │
        ▼
getCodeMetrics() called
        │
        ▼
line 118: existsSync("forge-demo/package.json") → FALSE          ── BUG-01
        │
        ▼
lines 123-141: all type checks fail
        projectType = "unknown"                                    ── BUG-05
        sourceExt   = "*.ts"                                       ── BUG-02
        │
        ├──▶ line 152: find . -name "*.ts" → 0 files
        │    sourceFiles = 0                                       ── BUG-02
        │
        ├──▶ line 158: find . \( -name "*.test.*" -o ... \) → 4
        │    testFiles = 4                                         ── CORRECT
        │
        ├──▶ line 164: find . -name "*.ts" | xargs wc -l → empty
        │    totalLines = "unknown"                                ── BUG-12
        │
        ├──▶ line 176: if (hasPackageJson) → SKIPPED
        │    deps = 0, devDeps = 0                                 ── BUG-03
        │
        └──▶ line 206: testFileRatio = 4/0 → guard → 0            ── BUG-09
        │
        ▼
getHealthScore() consumes corrupted metrics
        │
        ├──▶ Test Coverage: testFileRatio=0 → 0 pts               ── BUG-09
        ├──▶ README: not at root → 0 pts                           ── BUG-04
        └──▶ Type Safety: no tsconfig at root → 0 pts              ── BUG-11
        │
        ▼
Health Score: 60/100 (Grade D)      Correct estimate: ~82-87/100 (Grade B/A)
                                    Deflated by ~22 points
```

---

## 5. Dashboard Rendering Issues

The dashboard is generated by `generateDashboard()` and written to a temp file. Below are the specific HTML output lines with issues:

| HTML Line | Issue | Expected | Actual |
|-----------|-------|----------|--------|
| 33 | Version label | `v3.2.1` (or dynamic) | `v3.1.0` (BUG-14, hardcoded) |
| 38 | Status field | Meaningful status string | `null` rendered literally |
| 72 | Source Files metric | `2` | `0` (BUG-02) |
| 77 | Test Files metric | `4` | `4` (correct) |
| 82 | Commits count | N/A indicator for non-git | `null` rendered literally |
| 83 | Null display | Empty or "N/A" | `null` string rendered |
| 87 | Dependencies | `8` | `0` (BUG-03) |
| 116–118 | Test Coverage | `200% file ratio` / green | `0% file ratio` / amber ⚠ (BUG-09) |
| 139 | Type Safety | Config present | `"no type config"` (BUG-11) |

**Template variable bindings** (inside `index.mjs`, lines 594–616):
```javascript
// line 598
<div class="text-2xl font-bold text-slate-100">${metrics.sourceFiles}</div>
// line 599
<div class="text-xs text-slate-500 mt-1">${metrics.projectType}</div>
// line 604
${metrics.testCoverage !== null
  ? metrics.testCoverage + "% line coverage"
  : metrics.testFileRatio + "% file ratio"}
// line 608
<div class="text-2xl font-bold text-slate-100">${git.commitCount}</div>
// line 613
<div class="text-2xl font-bold text-slate-100">${metrics.dependencies}</div>
```

**`null` rendering issue:** When `git.commitCount` or `git.branch` is `null`, the template literal `${git.commitCount}` renders the string `"null"` in the HTML. There is no null-coalescing or fallback (e.g. `${git.commitCount ?? "N/A"}`).

---

## 6. Test Coverage Gaps

The test file `__tests__/health.test.mjs` has 31 tests, all passing. The following scenarios are **not tested:**

| # | Missing Test Scenario | Impact |
|---|----------------------|--------|
| 1 | **Subdirectory project layout** — `package.json` in a subdirectory | Would have caught BUGs 01–03, 05, 09, 12 |
| 2 | **`getCodeMetrics()` with subdirectory `package.json`** — `projectType`, `deps`, `devDeps` detection | Direct coverage for BUGs 01, 03, 05 |
| 3 | **README in subdirectory** — `getHealthScore()` README check | Direct coverage for BUG-04 |
| 4 | **`tsconfig.json` in subdirectory** — Type Safety check | Direct coverage for BUG-11 |
| 5 | **Test runner in subdirectory `node_modules`** — vitest/jest detection | Direct coverage for BUG-07 |
| 6 | **`package-lock.json` in subdirectory** — npm audit execution | Direct coverage for BUG-08 |
| 7 | **`generateDashboard()` output** — HTML content, null handling | Would have caught BUG-14 and null rendering |
| 8 | **`getGitStatus()` with no git repo** — `git rev-parse` returns null | Would catch misleading `clean: true` with `branch: null` |
| 9 | **Mixed JS/TS/JSX/TSX extensions** — explicit `.jsx`/`.tsx`/`.mjs` verification | Edge case coverage for BUG-02 |
| 10 | **Hardcoded secrets detection** — grep patterns for `password=`, `api_key=` | `getSecurityScan()` grep pattern validation |
| 11 | **`listCheckpoints()` with files present** — only empty case is covered | Functional coverage gap |
| 12 | **Version string consistency** — directory, MCP, dashboard versions match | Would have caught BUGs 13–14 |

---

## 7. Suggested Fix Architecture

### Core Strategy: Application Root Discovery

Introduce a `findApplicationRoot()` function that walks subdirectories to locate the actual application root, separating it from the governance root.

```javascript
// NEW: Add to index.mjs
function findApplicationRoot(projectRoot) {
  // 1. Check project root first (preserves existing behavior)
  if (existsSync(join(projectRoot, "package.json"))) return projectRoot;
  if (existsSync(join(projectRoot, "Cargo.toml")))   return projectRoot;
  if (existsSync(join(projectRoot, "pyproject.toml"))) return projectRoot;
  if (existsSync(join(projectRoot, "go.mod")))        return projectRoot;

  // 2. Glob-walk: find any manifest one level deep (skip node_modules, .git)
  const entries = readdirSync(projectRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".claude") continue;
    const candidate = join(projectRoot, entry.name);
    if (
      existsSync(join(candidate, "package.json")) ||
      existsSync(join(candidate, "Cargo.toml")) ||
      existsSync(join(candidate, "pyproject.toml")) ||
      existsSync(join(candidate, "go.mod"))
    ) {
      return candidate;
    }
  }

  return projectRoot; // fallback
}
```

### Dual-Root Pattern

```javascript
const governanceRoot = FORGE_PROJECT_ROOT;  // for CLAUDE.md, .claude/governance.json
const appRoot = findApplicationRoot(governanceRoot);  // for package.json, src/, node_modules/
```

### Functions to Update

| Function | Use `governanceRoot` for | Use `appRoot` for |
|----------|------------------------|-------------------|
| `getCodeMetrics()` | — | `package.json`, `find` source/test files, `wc -l` |
| `getHealthScore()` | `CLAUDE.md`, `governance.json` | `README.md`, `tsconfig.json`, test coverage |
| `getTestResults()` | — | `node_modules/.bin/jest`, `node_modules/.bin/vitest` |
| `getSecurityScan()` | — | `package-lock.json`, `npm audit` |
| `getGitStatus()` | — | (git commands work from either root) |
| `generateDashboard()` | Version string (read from `package.json`) | — |

### Additional Fixes

1. **BUG-06:** Rewrite `findNameExpr()` to handle double-brace patterns or restrict input to single-brace only.
2. **BUG-13/14:** Read version from `package.json` dynamically instead of hardcoding:
   ```javascript
   const pkgVersion = readJson(join(__dirname, "package.json"))?.version ?? "unknown";
   ```
3. **Null rendering:** Add null-coalescing in the dashboard template:
   ```javascript
   ${git.commitCount ?? "N/A"}
   ${git.branch ?? "—"}
   ```

---

## 8. Proposed Regression Test Cases

```javascript
// __tests__/subdirectory-layout.test.mjs

describe("Subdirectory project layout", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "forge-subdir-"));
    // Create governance files at root
    mkdirSync(join(tmpDir, ".claude"), { recursive: true });
    writeFileSync(join(tmpDir, ".claude", "governance.json"), JSON.stringify({
      vision: "Test project", goals: ["goal1"]
    }));
    writeFileSync(join(tmpDir, "CLAUDE.md"), "# Test");

    // Create application in subdirectory
    mkdirSync(join(tmpDir, "app", "src"), { recursive: true });
    mkdirSync(join(tmpDir, "app", "node_modules", ".bin"), { recursive: true });
    writeFileSync(join(tmpDir, "app", "package.json"), JSON.stringify({
      name: "test-app",
      dependencies: { react: "^18.0.0", express: "^4.18.0" },
      devDependencies: { jest: "^29.0.0" }
    }));
    writeFileSync(join(tmpDir, "app", "package-lock.json"), "{}");
    writeFileSync(join(tmpDir, "app", "README.md"), "# App README");
    writeFileSync(join(tmpDir, "app", "src", "index.js"), "console.log('hello');");
    writeFileSync(join(tmpDir, "app", "src", "index.test.js"), "test('works', () => {});");
    writeFileSync(join(tmpDir, "app", "node_modules", ".bin", "jest"), "");
  });

  test("BUG-01/03: getCodeMetrics detects package.json in subdirectory", () => {
    const metrics = getCodeMetrics(tmpDir);
    expect(metrics.dependencies).toBe(2);
    expect(metrics.devDependencies).toBe(1);
  });

  test("BUG-02: getCodeMetrics uses correct source extension for JS projects", () => {
    const metrics = getCodeMetrics(tmpDir);
    expect(metrics.sourceFiles).toBeGreaterThan(0);
  });

  test("BUG-05: getCodeMetrics identifies correct project type", () => {
    const metrics = getCodeMetrics(tmpDir);
    expect(metrics.projectType).toBe("node");
  });

  test("BUG-09: testFileRatio is calculated correctly", () => {
    const metrics = getCodeMetrics(tmpDir);
    expect(metrics.testFileRatio).toBeGreaterThan(0);
  });

  test("BUG-04: getHealthScore finds README in subdirectory", () => {
    const result = getHealthScore(tmpDir);
    const readmeCheck = result.checks.find(c => c.name === "README");
    expect(readmeCheck.status).toBe("pass");
    expect(readmeCheck.points).toBe(10);
  });

  test("BUG-07: getTestResults detects test runner in subdirectory", () => {
    const result = getTestResults(tmpDir);
    expect(result.runner).not.toBeNull();
  });

  test("BUG-08: getSecurityScan finds package-lock.json in subdirectory", () => {
    const result = getSecurityScan(tmpDir);
    // audit should at least attempt to run (may fail on mock lockfile, but should not be null)
    expect(result.audit).not.toBeUndefined();
  });

  test("BUG-11: getHealthScore finds tsconfig.json in subdirectory", () => {
    writeFileSync(join(tmpDir, "app", "tsconfig.json"), JSON.stringify({
      compilerOptions: { strict: true }
    }));
    const result = getHealthScore(tmpDir);
    const typeCheck = result.checks.find(c => c.name === "Type Safety");
    expect(typeCheck.status).toBe("pass");
    expect(typeCheck.points).toBe(7);
  });

  test("BUG-12: totalLines is a number, not 'unknown'", () => {
    const metrics = getCodeMetrics(tmpDir);
    expect(metrics.totalLines).not.toBe("unknown");
  });
});

describe("Dashboard rendering", () => {
  test("BUG-14: version label matches package.json version", () => {
    const html = generateDashboard(mockData);
    expect(html).not.toContain("v3.1.0");
    expect(html).toContain(expectedVersion);
  });

  test("null values are not rendered literally", () => {
    const html = generateDashboard({ git: { commitCount: null, branch: null } });
    expect(html).not.toMatch(/>null</);
  });
});

describe("Version consistency", () => {
  test("BUG-13: MCP server version matches package.json", () => {
    const pkg = readJson(join(__dirname, "..", "package.json"));
    // Server version should match package.json version
    expect(serverVersion).toBe(pkg.version);
  });
});
```

---

## 9. Bug Summary Table

| Bug | Line(s) | Function | Severity | Root Cause |
|-----|---------|----------|----------|------------|
| BUG-01 | 118 | `getCodeMetrics` | **HIGH** | `existsSync` only checks root for `package.json` |
| BUG-02 | 124, 152–155 | `getCodeMetrics` | **HIGH** | Default `sourceExt="*.ts"` when package.json not at root |
| BUG-03 | 176–184 | `getCodeMetrics` | **HIGH** | Dependency read gated on `hasPackageJson` (false) |
| BUG-04 | 259 | `getHealthScore` | MEDIUM | `README.md` checked only at root |
| BUG-05 | 123 | `getCodeMetrics` | MEDIUM | `projectType` defaults to `"unknown"` (cascade of BUG-01) |
| BUG-06 | 144–149 | `findNameExpr` | LOW | Latent double-brace pattern parsing bug |
| BUG-07 | 330–333 | `getTestResults` | MEDIUM | Test runner detection checks root `node_modules` only |
| BUG-08 | 459–472 | `getSecurityScan` | MEDIUM | npm audit skipped: `package-lock.json` not at root |
| BUG-09 | 206–210 | `getCodeMetrics` | **HIGH** | `testFileRatio=0` from division guard masking BUG-02 |
| BUG-10 | 267 | `getHealthScore` | LOW | `CLAUDE.md` check only at root (latent) |
| BUG-11 | 277–292 | `getHealthScore` | MEDIUM | `tsconfig.json`/`jsconfig.json` not found in subdirectory |
| BUG-12 | 164–167, 213 | `getCodeMetrics` | LOW | `totalLines = "unknown"` on empty pipeline |
| BUG-13 | 978 | Server init | LOW | Version `3.2.0` declared, installed at `3.2.1` path |
| BUG-14 | 559 | `generateDashboard` | LOW | Dashboard label hardcoded to `v3.1.0` |

**Severity distribution:** 4 HIGH, 4 MEDIUM, 4 LOW, 2 LOW (latent)

---

*Report generated by automated investigation on 2026-03-03. 5 agents deployed, ~15 minutes wall-clock time.*
