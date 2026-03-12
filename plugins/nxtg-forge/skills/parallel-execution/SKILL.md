---
name: Parallel Execution
description: >
  Canonical reference for Claude Code's two highest-leverage superpowers: Plan Mode
  (explore-then-plan-then-wait-for-approval) and Agent Teams (parallel subagent
  spawning via the Task tool). Load this skill when designing complex features,
  running multi-dimensional analysis, or orchestrating parallel build/test pipelines.
---

# Parallel Execution: Plan Mode + Agent Teams

## 1. PLAN MODE

### Workflow

```
Explore → Plan → Present → Wait for Approval → Execute
```

**Step-by-step:**

1. **Explore only** — use Read, Glob, Grep, Bash (read-only). No writes until approved.
2. **Draft a plan** — structured document capturing scope, files affected, approach.
3. **Present to user** — show the plan in chat, ask for approval.
4. **Wait** — do not proceed until the user says "proceed", "yes", "looks good", or similar.
5. **Execute** — now write code, modify files, spawn agents.

### Plan Document Format

```
## Plan: {Feature or Task Name}

**Scope:** {what will change}
**Files to create:** list
**Files to modify:** list
**Files NOT touched:** (boundary declaration)
**Approach:** brief description
**Risks / trade-offs:** if any

Proceed? (yes / modify / cancel)
```

### Anti-Patterns (Never Do These)

- Writing files during the Explore phase
- Presenting a plan and immediately executing without waiting
- Skipping the plan for "quick" tasks touching 3+ files
- Modifying files outside the declared scope

### When to Invoke Plan Mode

| Situation | Use Plan Mode? |
|-----------|---------------|
| Touching 3+ files | Yes |
| New feature with `--fix` flag | Yes |
| Architectural changes | Yes |
| Single-file bug fix | No |
| Adding a comment | No |
| Answering a question | No |

---

## 2. AGENT TEAMS

### Task Tool Invocation Pattern

```
Use the Task tool to spawn a subagent:
  subagent_type: "builder"   (or any agent name)
  prompt: "Your task description. Be specific about file boundaries."
  run_in_background: false         (true only for genuinely independent work)
```

### 3 Core Patterns

#### Pattern A: Fan-Out Analysis

Spawn N read-only agents simultaneously, each analyzing one dimension. Aggregate
their reports when all complete.

```
Task(detective, "Analyze test coverage in src/. Report gaps only. No writes.")
Task(detective, "Analyze security patterns in src/. Report issues. No writes.")
Task(detective, "Analyze architecture in src/. Report debt. No writes.")
  ↓ all 3 run simultaneously ↓
Aggregate results into single report.
```

#### Pattern B: Plan-Then-Parallel-Build

After plan approval, spawn builder + tester simultaneously with non-overlapping
file scopes.

```
Approval received
  ├─ Task(builder, "Implement per spec. Write src/*.ts only. No test files.")
  └─ Task(testing, "Generate tests per spec. Write src/__tests__/*.test.ts only. No source changes.")
       ↓ both complete ↓
  Task(guardian, "Run quality gate on completed work.")
```

#### Pattern C: Build-Then-Validate

Sequential build, then parallel validation.

```
Task(builder, "Implement the feature.")
  ↓ completes ↓
Task(guardian, "Run tests, type check, and security scan.")
```

### Design Rules

1. **Declare file boundaries in the prompt** — builder writes `src/*.ts`, tester writes
   `src/__tests__/*.test.ts`. No overlap.
2. **Parallel = no shared mutable state** — agents can read the same files, but each
   writes to different files.
3. **Foreground vs background** — use `run_in_background: true` only when you have
   genuinely independent follow-up work to do while waiting.
4. **Aggregate, don't chain unnecessarily** — wait for all parallel agents to complete
   before synthesizing, rather than chaining each result into the next.
5. **Explicit prompts** — each agent prompt must be self-contained. The subagent does
   not see your conversation history.

---

## 3. COMBINED PATTERN

The full power is combining both superpowers:

```
1. Plan Mode: Explore codebase (reads only)
2. Plan Mode: Draft plan document, present to user
3. Plan Mode: Wait for approval
4. Agent Teams: Spawn parallel agents to execute approved plan
5. Agent Teams: Aggregate results
6. Agent Teams: Run guardian quality gate
```

---

## 4. DECISION TREE

```
Is this task touching 3+ files?
  YES → Use Plan Mode first
  NO  → Check if it has multiple independent dimensions
          YES → Use Agent Teams (Fan-Out Analysis)
          NO  → Execute directly

Is this a --fix command?
  YES → ALWAYS use Plan Mode pre-flight (show what will change before writing)

Is this a health/gap/analysis command?
  YES → Use Agent Teams (Fan-Out Analysis pattern)

Is this feature implementation?
  YES → Plan Mode first, then Agent Teams for parallel build + test
```

---

## 5. COMPLETE AGENT ROUTING GUIDE

### Full Roster (23 agents)

| Agent | Model | Specialty | Delegate when... |
|-------|-------|-----------|-----------------|
| planner | sonnet | Architecture, feature design, task breakdown | New feature needs a plan |
| builder | sonnet | Code implementation from approved plan | Ready to write code |
| testing | sonnet | Test generation, coverage analysis, flaky tests | New code needs tests |
| guardian | sonnet | Quality gates, pre-commit, code review | Implementation complete |
| security | sonnet | OWASP, secrets detection, vuln scanning | Security audit needed |
| detective | sonnet | Project health, gap analysis, architecture review | Codebase analysis needed |
| refactor | sonnet | Code restructuring, complexity reduction, DRY | Tech debt to address |
| performance | sonnet | Profiling, bundle analysis, memory leaks | Perf audit or optimization |
| ui | sonnet | React components, a11y, responsive layouts | Frontend UI work |
| docs | sonnet | JSDoc, README, changelogs, API docs | Documentation work |
| database | sonnet | Schema design, migrations, query optimization | Database/schema work |
| api | sonnet | REST/GraphQL design, validation, OpenAPI | API design or integration |
| devops | sonnet | CI/CD, Docker, infra, monitoring | Infrastructure work |
| integration | sonnet | 3rd-party services, webhooks, OAuth | External service connection |
| analytics | haiku | Metrics, KPI tracking, dashboards | Analytics instrumentation |
| compliance | haiku | License audit, GDPR, WCAG | Compliance check |
| learning | haiku | Pattern capture, preference persistence | Session learning |
| governance-verifier | haiku | Governance concern resolution | Scope/quality concern flagged |
| release-sentinel | opus | Docs sync, changelog, version mgmt | Pre-release doc audit |
| orchestrator | opus | Top-level multi-phase orchestration | Full session coordination |
| oracle | sonnet | Proactive governance, drift detection | Autonomous mode scope validation |
| nxtg-ceo-loop | opus | Strategic decisions, product direction | CRITICAL architectural pivot |

### Anti-Patterns (Never Do These)

- Reference any agent not in the table above (e.g., `nxtg-master-architect`, `general-purpose`)
- Use `oracle` or `nxtg-ceo-loop` for routine implementation tasks
- Spawn a leaf worker as an orchestrator (agents without `Task` in tools list cannot sub-delegate)
- Spawn the same agent type recursively (e.g., detective spawning detective)

### Tool List Requirements

Agents that orchestrate other agents MUST have `Task` in their tools list:

| Agent | Needs Task? | Reason |
|-------|-------------|--------|
| planner | Yes | Spawns builder + testing after plan approval |
| builder | Yes | Spawns testing after implementation |
| guardian | Yes | Spawns parallel validators (test + security) |
| detective | Yes | Spawns 4 parallel dimension analyzers |
| orchestrator | Yes | Top-level coordination |
| testing | No | Leaf worker — writes tests only |
| refactor | No | Leaf worker — refactors only |
| api | No | Leaf worker — API design only |
| database | No | Leaf worker — DB work only |
| ui | No | Leaf worker — UI work only |
| devops | No | Leaf worker — DevOps only |
| security | No | Leaf worker — security scanning only |
| docs | No | Leaf worker — documentation only |
| performance | No | Leaf worker — performance analysis only |
| integration | No | Leaf worker — service integration only |
| analytics | No | Leaf worker — analytics only |
| compliance | No | Leaf worker — compliance only |
| learning | No | Leaf worker — knowledge capture only |
| release-sentinel | No | Leaf worker — release/docs only |
| governance-verifier | No | Leaf worker — governance only |
