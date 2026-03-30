# /forge:optimize

> Analyze your codebase across seven dimensions -- large files, type safety, dead code, dependencies, duplication, console statements, and TODO debt -- then optionally apply safe fixes.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Quality & Testing |
| **Syntax** | `/forge:optimize [--scope performance|bundle|deps|code-quality|types] [--fix] [--report]` |

---

## What It Does

`/forge:optimize` is the codebase health scanner. It examines seven dimensions of code quality: large files that need refactoring (over 300 lines), type safety issues (`as any` and `as unknown` casts), dead code (exported symbols never imported elsewhere), dependency health (outdated, unused, and vulnerable packages), code duplication (repeated patterns across files), console statements in production code, and TODO/FIXME/HACK technical debt markers.

When the Task tool is available, the command spawns three parallel agents -- a detective for code quality, a performance agent for dependencies, and another detective for dead code -- cutting analysis time by roughly 3x compared to sequential scanning. The results are merged into a single optimization report with a 0-100 score and five prioritized recommendations.

The `--fix` flag enables safe automated fixes, but never without approval. It runs the full analysis first, presents a fix plan showing exactly which files will change and how, then waits for explicit confirmation before any Edit or Write operation. Safe auto-fixes include removing unused imports, replacing `console.log` with structured logger calls, and removing clearly dead code.

## Syntax & Options

```
/forge:optimize [--scope performance|bundle|deps|code-quality|types] [--fix] [--report]
```

| Option | Description |
|--------|------------|
| `--scope <area>` | Focus analysis on one area: `performance`, `bundle`, `deps`, `code-quality`, or `types` |
| `--fix` | Run analysis, present fix plan, and apply safe optimizations after approval |
| `--report` | Generate and save the optimization report to a file |

## When to Use It

- **After a sprint of feature work**: Accumulated technical debt shows up in rising `as any` counts, growing TODO lists, and stale dependencies. Run optimize to quantify and prioritize.
- **Before a refactoring session**: Get the data on which files are largest, which exports are unused, and where duplication exists.
- **Dependency maintenance**: Use `--scope deps` to focus on outdated and unused packages.

For a broader project assessment that includes testing gaps, documentation, and security, use `/forge:gap-analysis`. For deployment readiness that includes build and test validation, use `/forge:deploy --validate-only`.

## Examples

### Example 1: Full Optimization Report

```
/forge:optimize
```

```
NXTG-Forge Optimization Report
=================================

CODE SIZE
  Total source files: 34
  Total lines: 4,821
  Large files (>300 lines): 2
    src/services/data-processor.ts: 412 lines - consider splitting
    src/components/Dashboard.tsx: 387 lines - consider splitting

TYPE SAFETY
  'as any' casts: 7
    src/utils/parser.ts:23 - JSON parse result
    src/api/client.ts:89 - Response typing
  Type assertions: 2

CODE QUALITY
  Console statements: 12
  TODO/FIXME/HACK: 8
  Dead exports: 3

DEPENDENCIES
  Total: 42
  Outdated: 6
  Unused: 2
  Vulnerabilities: 0

OPTIMIZATION SCORE: 72/100
  NEEDS WORK

TOP RECOMMENDATIONS
  1. [HIGH] Refactor data-processor.ts (412 lines) into focused modules
  2. [HIGH] Replace 7 'as any' casts with proper type definitions
  3. [MEDIUM] Remove 12 console.log statements from production code
  4. [MEDIUM] Update 6 outdated dependencies
  5. [LOW] Remove 3 unused exports (dead code)
```

### Example 2: Fix Mode

```
/forge:optimize --fix
```

Runs the full analysis, then presents:

```
OPTIMIZATION FIX PLAN
  Files to modify:
    - src/utils/parser.ts -- remove 3 console.log statements
    - src/api/client.ts -- remove 2 console.log statements

  Safe auto-fixes: Remove console.log (5 instances)
  Manual review needed: 'as any' casts (7 instances)

Proceed with fixes? (yes / modify / cancel)
```

## Power Use Cases

Run `/forge:optimize --scope types` before a TypeScript strict-mode migration to catalog every `as any` cast that needs fixing. The report gives you the exact file and line for each one.

Use parallel agent execution for large codebases. When the Task tool is available, the three-agent split (code quality + dependency health + dead code) processes the analysis concurrently.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:gap-analysis** | Gap analysis is breadth; optimize is depth on code quality specifically |
| **/forge:test** | Run tests after applying optimizations to verify nothing broke |
| **/forge:status** | Status shows the health score; optimize shows what is dragging it down |
| **refactor agent** | For complex refactoring beyond simple fixes, assign the refactor agent |
| **performance agent** | For runtime performance profiling beyond static analysis |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full seven-dimension analysis with optimization score and recommendations |
| **L2 Pro Builder** | Optimization findings recorded via `forge_capture_knowledge` for trend tracking |
| **L3 Ship Lord** | Optimization metrics and trends visible in the forge-ui dashboard |

## Tips & Gotchas

- The `--fix` flag always shows a plan and waits for confirmation. It never writes files without your approval.
- "Dead exports" detection checks whether an exported symbol is imported anywhere in the project. It may flag symbols that are used by external consumers -- review before removing.
- Console statement detection excludes test files by default. Production code console usage is what gets flagged.
- The 0-100 optimization score is separate from the health score in `/forge:status`. They measure different things.

---

*See also: [gap-analysis](../commands/gap-analysis.md) | [status](../commands/status.md) | [test](../commands/test.md)*
