# Builder

> The master implementer. Transforms approved plans into production-ready code with tests, type safety, and documentation — so you ship features, not TODOs.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Core Workflow |
| **Model** | Sonnet |
| **Isolation** | Worktree (writes code in an isolated branch) |

---

## What It Does

The Builder agent is your senior engineer on demand. Give it an approved plan or a clear implementation request, and it writes the actual production code — not scaffolds, not stubs, not "TODO: implement this." Real code with real error handling, real tests, and real documentation.

What makes Builder intelligent is that it reads your codebase first. It studies your patterns, your naming conventions, your test style, your error handling approach. Then it writes code that looks like *your team* wrote it. The result should pass code review without anyone asking "did an AI write this?"

Builder enforces engineering standards automatically: SOLID principles, Result types for error handling, dependency injection for testability, and strict type safety. It won't let you ship code with `any` types, swallowed exceptions, or untested public interfaces.

## When to Use It

- **After a plan is approved.** You ran `/forge:feature`, the planner designed the architecture, you said "looks good" — now Builder implements it.
- **For focused implementation requests.** "Implement a rate limiter middleware" or "Add WebSocket reconnection with exponential backoff."
- **For refactoring.** "The UserService is 500 lines — break it into focused modules following SOLID."
- **When code review found quality issues.** "The repository layer needs proper error handling and type annotations."

Builder is NOT for exploration or planning. If you don't know what to build yet, use the **Planner** first. If you want advice without changes, use the **Detective** in Soundboard mode.

## How It Works

1. **Reads the plan.** If a plan exists at `.claude/plans/*.md`, Builder reads it and follows the task breakdown. If invoked directly, it scopes the work from your prompt.

2. **Studies your codebase.** Before writing a single line, Builder uses Glob, Grep, and Read to understand your project's patterns — import style, test framework, error handling approach, naming conventions.

3. **Implements in order.** Types and interfaces first, then core logic, then edge cases. Each file is written using the Write or Edit tool — real file modifications, not simulated output.

4. **Spawns test generation.** After implementation, Builder automatically spawns the **Testing** agent in parallel to generate comprehensive test suites. Builder writes source files; Testing writes test files. No conflicts, no blocking.

5. **Runs quality checks.** Before declaring done, Builder runs the project's type checker (`tsc --noEmit`, `cargo check`, `mypy`) and linter. Zero tolerance for type errors.

6. **Reports what it built.** Lists every file created/modified, line counts, test coverage, and asks if you want refinements.

### Worktree Isolation

Builder runs in a git worktree — an isolated copy of your repo. This means:
- Your working directory stays clean while Builder works
- If Builder's changes don't look right, they're trivially discardable
- No risk of Builder breaking your in-progress work

## Examples

### Example 1: Implementing from a Plan

```
User: "The authentication plan looks good, let's implement it."

Builder reads .claude/plans/auth-spec.md, then:
  - Creates src/auth/auth-service.ts (login, register, refresh)
  - Creates src/auth/token-manager.ts (JWT signing, validation)
  - Creates src/auth/middleware.ts (route protection)
  - Creates src/types/auth.ts (interfaces, Result types)
  - Spawns Testing agent → tests/auth/*.test.ts
  - Runs tsc --noEmit → 0 errors
  - Reports: "4 files created, 847 lines, all types clean"
```

### Example 2: Direct Implementation Request

```
User: "Implement a rate limiter middleware using sliding window algorithm"

Builder:
  - Reads existing middleware patterns in your project
  - Creates src/middleware/rate-limiter.ts
  - Uses your project's error response format
  - Adds configurable window size, max requests, key extraction
  - Spawns Testing agent for unit + integration tests
  - Reports implementation with usage example
```

### Example 3: Refactoring

```
User: "The OrderService is 600 lines. Break it up."

Builder:
  - Reads OrderService, maps all methods and dependencies
  - Extracts: OrderValidation, OrderPricing, OrderFulfillment
  - Keeps OrderService as a thin facade
  - Updates all import paths across the codebase
  - Spawns Testing to verify no behavioral changes
  - Reports: "1 file → 4 files, all tests still passing"
```

## Power Use Cases

### Parallel Implementation with Domain Specialists

Builder doesn't work alone. After completing implementation, it routes domain-specific reviews to the right specialist:

| What Builder Just Built | Specialist It Spawns |
|------------------------|---------------------|
| React component | **UI** agent (accessibility + responsive review) |
| Database schema | **Database** agent (index + migration review) |
| REST endpoint | **API** agent (contract + OpenAPI validation) |
| Third-party integration | **Integration** agent (auth flow + error handling) |
| CI/CD pipeline | **DevOps** agent (pipeline validation) |

### Plan Mode Protocol

For implementations touching 3+ files, Builder enters Plan Mode automatically:
1. Scans the codebase (read-only)
2. Presents a file list with scope boundaries
3. Waits for your "proceed" before writing anything
4. Executes within the declared scope — nothing outside it

### Mandatory Quality Rules

Builder enforces 6 non-negotiable quality rules:

1. **MOCK_SHAPE_SYNC** — When production code changes a mocked dependency's shape, the test mock updates in the same commit.
2. **NEW_FILE_NEW_TEST** — Every new logic file gets a corresponding test file. No exceptions.
3. **AUTH_E2E_GUARD** — Route guard changes trigger E2E test fixture updates.
4. **TYPECHECK_ZERO_TOLERANCE** — `tsc --noEmit` must exit 0 before work is declared complete.
5. **CLEAN_IMPORTS_ON_TOUCH** — Editing an import block means cleaning dead imports.
6. **PERSISTENT_CONNECTION_AUTH** — WebSocket/SSE auth includes lifecycle management, not just send-once-on-open.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Planner** agent | Planner designs the architecture; Builder implements it. The natural 1-2 punch. |
| **Guardian** agent | After Builder finishes, Guardian runs quality gates (tests, security, lint) before commit. |
| **Testing** agent | Builder auto-spawns Testing for parallel test generation. Different file scopes, no conflicts. |
| `/forge:feature` command | The feature command orchestrates Planner → Builder → Guardian automatically. |
| `/forge:spec` command | Generates the technical spec that Builder reads as its implementation blueprint. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full Builder capabilities — code generation, refactoring, test spawning, quality rules. Everything works with just the plugin. |
| **L2 Pro Builder** | Builder reads tasks from forge-orchestrator (`forge_get_tasks`), claims work (`forge_claim_task`), checks past learnings (`forge_get_knowledge`), and records what it learned (`forge_capture_knowledge`). Multi-agent task coordination. |
| **L3 Ship Lord** | Builder's progress visible in the forge-ui dashboard. Real-time task board, agent activity feed, governance health impact visible as Builder works. |

## Tips & Gotchas

- **Don't skip planning for big features.** If you jump straight to Builder without a plan, you'll get working code that might not fit your architecture. Use Planner first for anything touching 3+ files.
- **Builder uses worktree isolation.** Your working tree stays clean. If you don't like what Builder produced, the changes are in a separate branch.
- **Builder reads your patterns.** If your codebase uses a specific error handling style, Builder follows it. If you want a different style, say so explicitly.
- **Tests are parallel, not sequential.** Builder spawns the Testing agent as soon as implementation is done — they run simultaneously because they write to different file paths.
- **Type errors are blockers.** Builder will not declare work complete if `tsc --noEmit` fails. This is intentional — shipping type errors creates cascading problems.

---

*See also: [Planner](planner.md) | [Guardian](guardian.md) | [Testing](testing.md) | [/forge:feature](../commands/feature.md)*
