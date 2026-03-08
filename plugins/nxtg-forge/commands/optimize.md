---
description: "Analyze and optimize codebase for performance and maintainability"
disable-model-invocation: true
argument-hint: "[--scope performance|bundle|deps|code-quality|types] [--fix]"
---

# NXTG-Forge Optimizer

You are the **Code Optimizer** - analyze the codebase and provide actionable optimization recommendations.

## Parse Arguments

Arguments received: `$ARGUMENTS`

Options:
- No arguments: Full optimization analysis
- `--scope <area>`: Focus on: `performance`, `bundle`, `deps`, `code-quality`, `types`
- `--fix`: Apply safe optimizations automatically
- `--report`: Generate optimization report

## Plan Mode Pre-Flight (for --fix mode)

When `--fix` is specified, ALWAYS run analysis first and present a fix plan before
writing any files. Never apply fixes without prior approval.

**Required pre-flight sequence:**
1. Run analysis (read-only) across all 7 dimensions below
2. Present the fix plan:
   ```
   OPTIMIZATION FIX PLAN
     Files to modify:
       - {file} — {what will change}
       - {file} — {what will change}

     Safe auto-fixes: {list}
     Manual review needed: {list}

   Proceed with fixes? (yes / modify / cancel)
   ```
3. Wait for "proceed" before any Edit or Write operations

## Agent Team Execution (Analysis Phase)

When the Task tool is available, spawn 3 parallel agents for the analysis phase
to reduce analysis time ~3x vs sequential:

```
Task(
  subagent_type: "detective",
  prompt: "Analyze code quality: find files >300 lines, count 'as any' casts,
           find 'as unknown' assertions, find console.log in production code
           (exclude test files), count TODO/FIXME/HACK comments. Read-only."
)

Task(
  subagent_type: "performance",
  prompt: "Analyze dependency health: run npm outdated, check for unused deps
           (npx depcheck if available), report bundle size from dist/ if it exists.
           Read-only."
)

Task(
  subagent_type: "detective",
  prompt: "Analyze dead code: find exported symbols in src/ that are not imported
           anywhere else in the codebase. List each unused export with its file
           and line number. Read-only."
)
```

Merge the 3 agent reports into the Output Format below. If Task tool is not available,
run the 7 dimensions sequentially as documented below.

## Analysis Dimensions

### 1. Large Files (Refactoring Candidates)

```bash
# Find files over 300 lines
find src -name "*.ts" -not -name "*.test.ts" -not -path "*/__tests__/*" -not -path "*/node_modules/*" -exec wc -l {} + | sort -rn | head -20
```

Report files > 300 lines as refactoring candidates with suggested splits.

### 2. Type Safety

```bash
# Count 'as any' casts
grep -rn "as any" src/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v __tests__

# Count type assertions
grep -rn "as unknown" src/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v __tests__
```

### 3. Dead Code

```bash
# Find exports that aren't imported anywhere
# For each exported symbol, check if it's imported elsewhere
```

Use Grep to find `export` declarations, then check if they're imported in other files.

### 4. Dependency Health

```bash
# Check for outdated dependencies
npm outdated 2>/dev/null

# Check for unused dependencies
npx depcheck 2>/dev/null || echo "Install depcheck: npm i -g depcheck"

# Check bundle impact of large deps
npm ls --depth=0 2>/dev/null
```

### 5. Code Duplication

Use Grep to find repeated patterns:
- Similar function signatures across files
- Repeated error handling patterns
- Duplicate type definitions

### 6. Console Statements in Production

```bash
grep -rn "console\.\(log\|warn\|error\|debug\)" src/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v __tests__
```

### 7. TODO/FIXME/HACK Debt

```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx"
```

## Output Format

```
NXTG-Forge Optimization Report
=================================

CODE SIZE
  Total source files: {count}
  Total lines: {count}
  Large files (>300 lines): {count}
    {file}: {lines} lines - consider splitting

TYPE SAFETY
  'as any' casts: {count}
    {file}:{line} - {context}
  Type assertions: {count}

CODE QUALITY
  Console statements: {count}
  TODO/FIXME/HACK: {count}
  Dead exports: {count}

DEPENDENCIES
  Total: {count}
  Outdated: {count}
  Unused: {count}
  Vulnerabilities: {count}

OPTIMIZATION SCORE: {0-100}
  {EXCELLENT / GOOD / NEEDS WORK / CRITICAL}

TOP RECOMMENDATIONS
  1. [{priority}] {recommendation}
  2. [{priority}] {recommendation}
  3. [{priority}] {recommendation}
  4. [{priority}] {recommendation}
  5. [{priority}] {recommendation}
```

## Auto-fix (`--fix`)

If `--fix` is specified, apply safe optimizations:
- Remove unused imports (if TypeScript supports it)
- Replace `console.log` with structured logger calls
- Remove dead code that's clearly unused

Always show what was changed and confirm before applying.

## Integration

```
Next steps:
  /forge:test         Verify optimizations don't break tests
  /forge:status       View updated project state
  /forge:gap-analysis Full gap analysis
```
