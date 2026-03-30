# Detective

> Sherlock Holmes for codebases -- performs deep project analysis, technology detection, gap analysis, and health scoring across five quality dimensions.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Governance & Analysis |
| **Model** | Sonnet |

---

## What It Does

The Detective is a forensic analyst for your codebase. It does not fix things -- it finds things. When invoked, it performs a structured investigation across five dimensions (testing, security, documentation, architecture, git practices) and produces a scored health report with prioritized recommendations. Every finding is backed by evidence: file paths, line numbers, specific metrics.

What separates the Detective from running `npm audit` and `eslint` yourself is synthesis. It does not just list problems -- it weighs them. A codebase with 95% test coverage but three hardcoded API keys gets a different priority ranking than one with zero vulnerabilities but 40% coverage. The Detective calculates a weighted health score (Testing 30%, Security 25%, Architecture 20%, Documentation 15%, Git Practices 10%) and presents a single number (0-100) that captures your project's overall health. More importantly, it ranks the recommended actions by impact, so you know what to fix first.

The Detective also handles technology stack detection. Hand it an unfamiliar codebase and it identifies languages, frameworks, databases, external services, build tools, and development patterns. It checks against best-practice checklists for each detected stack (Python projects should have type hints and pytest; TypeScript projects should have strict mode and ESLint) and reports gaps. This makes it the ideal first agent to run on a new project or when onboarding.

## When to Use It

- **Evaluating a new codebase**: When you inherit a project or join a team and need to understand what you are working with -- tech stack, quality level, architectural patterns, and where the skeletons are buried.
- **Running a health check**: When the Orchestrator delegates Option 4 (Health Check) and you need a comprehensive quality assessment across all dimensions.
- **Before a major refactoring**: When you need hard data about current code quality, complexity hotspots, and test coverage gaps to justify and scope a refactoring effort.
- **Investigating a vague problem**: When something feels wrong -- "the code is slow" or "things keep breaking" -- but you cannot pinpoint why. The Detective's structured analysis finds the patterns.

Do not use the Detective to fix issues (it analyzes and recommends, it does not modify code), to plan features (use Planner), or to run quality gates (use Guardian -- the Detective diagnoses, the Guardian enforces).

## How It Works

The Detective runs a parallel analysis framework for speed:

1. **Project Structure Analysis** -- Scans directory layout, identifies primary languages, detects frameworks, maps the build system and dependency management approach.

2. **Testing and Quality** -- Counts source files vs. test files, measures coverage percentage, identifies untested files, checks lint error counts and type coverage.

3. **Security Scanning** -- Checks for hardcoded secrets (API keys, tokens, passwords in source), dangerous patterns (eval, innerHTML, SQL concatenation), runs dependency audit (`npm audit`), and reports findings by severity.

4. **Documentation Coverage** -- Verifies README existence and completeness, scans for JSDoc on exported functions, checks for CHANGELOG, identifies stale documentation.

5. **Architecture Quality** -- Measures file sizes (flags files over 300 lines), counts `as any` casts, checks for circular dependencies, assesses layer separation, counts TODO/FIXME/HACK comments.

For comprehensive health checks, the Detective spawns four parallel Task agents (Testing, Security, Docs, Performance) and runs architecture analysis inline simultaneously. This produces a full report roughly 4x faster than sequential analysis.

Results are synthesized into the weighted health score and presented in a structured report format with per-dimension grades and a prioritized action list.

## Examples

### Example 1: New Project Assessment

```
User: "What tech stack is this project using?"

Detective:
  - Scans: package.json, tsconfig.json, vite.config.ts, tailwind.config.js
  - Detects: React 19, TypeScript 5.7, Vite 7, Tailwind CSS 4, Express 5
  - Reports: 58 components, 13 custom hooks, Vitest for testing, ESLint + Prettier
  - Checks: Best practices checklist for React/TS -- strict mode enabled, path aliases configured
  - Gaps: No E2E test framework detected, 4 hooks missing JSDoc
  - Result: Complete technology profile with gap list
```

### Example 2: Comprehensive Health Check

```
User: "Can you analyze the health of this project?"

Detective:
  - Spawns: testing, security, docs, performance agents in parallel
  - Inline: Architecture analysis (file sizes, any casts, TODOs)
  - Scores:
    - Testing: 78/100 (67% coverage, 12 untested files)
    - Security: 92/100 (1 medium: outdated express)
    - Documentation: 65/100 (23 public functions without JSDoc)
    - Architecture: 85/100 (2 files over 300 lines, 0 circular deps)
    - Git: 88/100 (91% conventional commits)
  - Overall: 81/100 (Good)
  - Top action: "Add tests for 12 untested service files (Testing +15 points)"
  - Result: Scored report with prioritized improvement roadmap
```

### Example 3: Pre-Refactoring Investigation

```
User: "Should I refactor this monolith?"

Detective:
  - Analyzes: File sizes, cyclomatic complexity, coupling metrics
  - Finds: 3 files over 500 lines, average complexity 14 (target <10), 6 circular imports
  - Evidence: "activity-service.ts (812 lines) has 5 responsibilities and 9 imports"
  - Trade-offs: "Refactoring reduces complexity but costs ~3 sessions of work"
  - Recommends: "Yes, start with activity-service.ts -- highest impact, clear extraction boundaries"
  - Result: Data-driven refactoring justification with specific starting point
```

## Power Use Cases

**Parallel Multi-Agent Analysis**: The Detective spawns four specialist agents simultaneously, each analyzing one dimension. While they run, it performs architecture analysis inline. Five dimensions analyzed in the time of one.

**Trend Analysis Over Sessions**: Run the Detective at the start and end of each development session. Compare health scores to see whether your session improved or degraded the codebase. Combined with `forge_capture_knowledge`, findings persist across sessions so you can track trends over weeks.

**Onboarding Accelerator**: Point the Detective at an unfamiliar codebase before reading any code yourself. Its technology detection and gap analysis gives you a mental model of the project in 30 seconds that would take an hour of manual exploration.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Orchestrator** | Orchestrator delegates health checks (Option 4) and soundboard analysis (Option 3) to the Detective. Findings feed back into the Orchestrator's recommendations. |
| **Planner** | Detective's analysis informs Planner's architecture decisions. "Current complexity is 14, target is <10" gives the Planner concrete refactoring constraints. |
| **Guardian** | Detective diagnoses; Guardian enforces. Run Detective to find problems, Guardian to prevent new ones. |
| **/forge:status** | The `/forge:status` command provides a quick health summary; the Detective provides the deep investigation when the summary reveals issues. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full five-dimension analysis. Parallel agent spawning. Weighted health scoring. Technology stack detection. Best-practice checklists for Python, JavaScript/TypeScript, and Go. Structured report format. |
| **L2 Pro Builder** | Enriches analysis with orchestrator data: `forge_get_health` for governance scores, `forge_get_tasks` for project activity, `forge_get_knowledge` for historical patterns, `forge_check_drift` for vision alignment. Records findings via `forge_capture_knowledge` for cross-session persistence. |
| **L3 Ship Lord** | Health scores, dimension breakdowns, and trend charts rendered in the forge-ui dashboard. Visual representation of the Detective's findings alongside agent activity and task progress. |

## Tips & Gotchas

- **Do**: Run the Detective before starting work on an unfamiliar codebase. The technology detection and gap analysis save hours of exploration.
- **Don't**: Expect the Detective to fix issues. It is an analyst, not a builder. Use its findings to inform Planner or Guardian actions.
- **Do**: Use the Detective's prioritized recommendations to decide what to work on. Impact-ranked suggestions prevent you from optimizing the wrong thing.
- **Don't**: Run the Detective on a single file. It is designed for project-level analysis. For file-level issues, use Refactor or the specific domain specialist.

---

*See also: [Orchestrator](orchestrator.md) | [Guardian](guardian.md) | [/forge:status](../commands/status.md)*
