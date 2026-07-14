---
description: "Analyze project gaps across testing, docs, security, and architecture"
disable-model-invocation: true
argument-hint: "[--scope testing|docs|security|architecture] [--severity critical|high] [--fix]"
---

# NXTG-Forge Gap Analysis

You are the **Gap Analyst** - perform a comprehensive analysis of the project to identify missing tests, documentation gaps, security issues, architecture problems, and technical debt.

## Parse Arguments

Arguments received: `$ARGUMENTS`

Options:
- No arguments: Run complete analysis across all dimensions
- `--scope <area>`: Limit to specific area: `testing`, `docs`, `security`, `architecture`, `performance`
- `--severity <level>`: Filter results: `critical`, `high`, `medium`, `low`
- `--fix`: Generate actionable fix plan after analysis
- `--json`: Output as JSON

## Pre-Analysis: Orchestrator Data

Before running local analysis, pull orchestrator data if available:
- Call `forge_get_governance_health` — get orchestrator's governance health check (documentation quality, architecture metrics, task health, knowledge coverage, drift detection)
- Call `forge_check_drift` — compare current work against project vision (SPEC.md)
- Call `forge_get_knowledge` — check existing knowledge base for previously identified patterns

Merge orchestrator findings with local analysis below. If orchestrator is not available, proceed with local analysis only.

## Analysis Execution

Use Claude's native tools to perform real analysis. Launch parallel agents where possible for speed.

### Plan Mode Pre-Flight

Before running analysis, declare scope to the user:

```
GAP ANALYSIS SCOPE
  Dimensions: Testing, Documentation, Security, Architecture, Performance
  Method: Parallel agent execution (5 simultaneous Task agents)
  Output: Prioritized gap list with remediation plan

Proceed? (or specify --scope <area> for targeted run)
```

Skip this pre-flight if `--scope` argument was provided — targeted runs can
proceed immediately.

### Agent Team Execution

When the Task tool is available, spawn all 5 dimension agents simultaneously
for ~5x faster analysis vs sequential:

```
Task(
  subagent_type: "testing",
  prompt: "Analyze test coverage: count source files vs test files in src/,
           list untested source files, calculate coverage %. Read-only."
)

Task(
  subagent_type: "docs",
  prompt: "Analyze documentation: check README.md, CHANGELOG.md, JSDoc on exports,
           API docs. List gaps. Read-only."
)

Task(
  subagent_type: "security",
  prompt: "Analyze security: check hardcoded secrets, eval/exec usage, .env in git,
           run npm audit. Report by severity. Read-only."
)

Task(
  subagent_type: "detective",
  prompt: "Analyze architecture quality: large files (>300 lines), circular deps, 'as any' casts,
           missing error handling, TODO/FIXME/HACK comments. Report findings. Read-only."
)

Task(
  subagent_type: "performance",
  prompt: "Analyze performance: bundle size, node_modules size, dep count, console.log
           in production code, outdated deps (npm outdated). Read-only."
)
```

Aggregate all 5 reports into the Summary Report below. If Task tool is not available,
run each dimension sequentially as documented below.

### Dimension 1: Test Coverage

**Gather data:**
```bash
# Count source files
find src -name "*.ts" -not -name "*.test.ts" -not -name "*.spec.ts" -not -path "*/__tests__/*" -not -path "*/node_modules/*" | sort

# Count test files
find src -name "*.test.ts" -o -name "*.spec.ts" | sort

# Map source files to test files
# For each source file, check if a corresponding test exists
```

**Analysis:** Use Glob and Grep to:
1. List all source files in `src/`
2. For each source file, check if `__tests__/{name}.test.ts` exists
3. Identify source files WITHOUT test coverage
4. Calculate coverage percentage: (files with tests / total source files) * 100

**Report format:**
```
TEST COVERAGE GAPS
  Source files: {total}
  Files with tests: {tested}
  Files without tests: {untested}
  File coverage: {percentage}%

  Untested files (prioritized by size/importance):
    src/services/vision-service.ts (NO TEST)
    src/services/command-service.ts (NO TEST)
    src/adapters/interface.ts (NO TEST)
    ...

  Recommendations:
    1. Add tests for {most critical untested file}
    2. Target {percentage}% file coverage this sprint
```

### Dimension 2: Documentation

**Gather data:**
- Check for README.md in project root
- Check for docs/ directory content
- Check for JSDoc/TSDoc in exported functions
- Check for CHANGELOG.md
- Check for API documentation

**Analysis:** Use Grep to:
1. Count exported functions/classes without JSDoc: `export (function|class|const|interface)` without preceding `/**`
2. Check if key files have documentation headers
3. Identify missing docs

**Report format:**
```
DOCUMENTATION GAPS
  README.md: {EXISTS/MISSING}
  CHANGELOG.md: {EXISTS/MISSING}
  API docs: {EXISTS/MISSING}
  Architecture docs: {EXISTS/MISSING}

  Undocumented exports:
    {file}:{line} - export {name} (no JSDoc)
    ...

  Recommendations:
    1. {most impactful doc to add}
```

### Dimension 3: Security

**Gather data:**
```bash
# Check for hardcoded secrets
grep -rn "password\s*=" src/ --include="*.ts" 2>/dev/null
grep -rn "api_key\s*=" src/ --include="*.ts" 2>/dev/null
grep -rn "secret\s*=" src/ --include="*.ts" 2>/dev/null

# Check for dangerous patterns
grep -rn "eval(" src/ --include="*.ts" 2>/dev/null
grep -rn "innerHTML" src/ --include="*.ts" --include="*.tsx" 2>/dev/null

# Check dependency vulnerabilities
npm audit --json 2>/dev/null

# Check for .env files committed
git ls-files | grep -i "\.env"
```

**Report format:**
```
SECURITY GAPS
  Dependency vulnerabilities: {count} ({critical}/{high}/{medium}/{low})
  Hardcoded secrets: {count found}
  Dangerous patterns: {count found}
  .env files in git: {count}

  Details:
    {severity} - {description} at {file}:{line}
    ...

  Recommendations:
    1. {most critical fix}
```

### Dimension 4: Architecture

**Gather data:**
- Use Glob to map the directory structure
- Use Grep to find circular imports
- Check for proper separation of concerns
- Identify oversized files (>300 lines)
- Check for proper error handling patterns

**Analysis:**
```bash
# Find large files
find src -name "*.ts" -not -path "*/node_modules/*" -exec wc -l {} + | sort -rn | head -20

# Find files with too many imports (coupling indicator)
grep -c "^import" src/**/*.ts 2>/dev/null | sort -t: -k2 -rn | head -10

# Check for 'as any' casts
grep -rn "as any" src/ --include="*.ts" | wc -l

# Check for console.log in production code
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v __tests__ | wc -l
```

**Report format:**
```
ARCHITECTURE GAPS
  Large files (>300 lines): {count}
    {file}: {lines} lines
    ...

  Type safety issues:
    'as any' casts: {count}

  Code quality:
    console.log in production: {count}
    TODO/FIXME/HACK comments: {count}

  Coupling indicators:
    Files with >10 imports: {count}
    ...

  Recommendations:
    1. Refactor {largest file} into smaller modules
    2. Replace {count} 'as any' casts with proper types
```

### Dimension 5: Performance

**Gather data:**
```bash
# Check bundle size if dist exists
du -sh dist/ 2>/dev/null

# Check node_modules size
du -sh node_modules/ 2>/dev/null

# Count dependencies
jq '.dependencies | length' package.json 2>/dev/null
jq '.devDependencies | length' package.json 2>/dev/null
```

## Summary Report

After all dimensions, show aggregate:

```
GAP ANALYSIS SUMMARY
=====================
Generated: {timestamp}

  CRITICAL: {count}
  HIGH:     {count}
  MEDIUM:   {count}
  LOW:      {count}

  Total gaps: {total}
  Estimated effort: {hours}h

Top 5 Priority Items:
  1. [{severity}] {description} ({effort}h)
  2. [{severity}] {description} ({effort}h)
  3. [{severity}] {description} ({effort}h)
  4. [{severity}] {description} ({effort}h)
  5. [{severity}] {description} ({effort}h)
```

## Fix Plan (`--fix`)

If `--fix` is specified, after the analysis generate a phased remediation plan:

```
GAP REMEDIATION PLAN
=====================

Phase 1: Critical Fixes (This Sprint)
  - [ ] {task} ({effort}h) - {assignee suggestion}
  - [ ] {task} ({effort}h) - {assignee suggestion}

Phase 2: High Priority (Next Sprint)
  - [ ] {task} ({effort}h)
  - [ ] {task} ({effort}h)

Phase 3: Medium Priority (Backlog)
  - [ ] {task} ({effort}h)
  ...

Total estimated effort: {hours}h
```

## Error Handling

If any dimension fails, skip it and note in output:
```
[SKIPPED] {dimension}: {reason}
```

Always show whatever analysis IS possible.

## Integration

After analysis:
1. Call `forge_capture_knowledge` to record the gap analysis findings (category: "research", title: "Gap Analysis {date}")
2. Offer next steps:
```
Next steps:
  /forge:test         Run test suite
  /forge:status       View current state
  /forge:checkpoint   Save state before fixes
  /forge:feature      Plan feature to address gaps
```
