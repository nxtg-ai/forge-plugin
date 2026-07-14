---
name: Parallel Execution
description: >
  Claude Code's two force-multipliers — Plan Mode (explore → plan → wait-for-approval →
  execute) and Agent Teams (parallel subagents via the Task tool) — plus the canonical
  forge agent roster and delegation-routing rules. Use when decomposing a multi-file
  feature, running multi-dimensional codebase analysis, orchestrating parallel
  build/test/validate pipelines, or deciding which subagent to delegate a task to.
when_to_use: >
  touching 3+ files; "plan this feature"; "analyze the codebase / health check / gap
  analysis"; spawning subagents; "which agent should do X"; parallel build + test;
  running a --fix command; any work with multiple independent dimensions.
allowed-tools: Task, Read, Grep, Glob, Bash
---

# Parallel Execution: Plan Mode + Agent Teams

Two superpowers. **Plan Mode** thinks before it writes. **Agent Teams** fan work out
across parallel subagents. Combine them for complex features. The agent roster and
routing rules in §5 are the source of truth for `Task` delegation — the `subagent_type`
must match a `name:` from that table exactly.

## 1. PLAN MODE

```
Explore (reads only) → Draft plan → Present → Wait for approval → Execute
```

1. **Explore only** — Read, Glob, Grep, read-only Bash. No writes until approved.
2. **Draft a plan** — scope, files affected, approach, boundaries.
3. **Present** — show the plan in chat, ask for approval.
4. **Wait** — do not proceed until the user says "proceed" / "yes" / "looks good".
5. **Execute** — now write, edit, spawn agents.

### Plan document format

```
## Plan: {task name}
**Scope:** what will change
**Files to create / modify / NOT touch:** (the last is a boundary declaration)
**Approach:** brief
**Risks / trade-offs:** if any
Proceed? (yes / modify / cancel)
```

### When to invoke

| Situation | Plan Mode? |
|-----------|-----------|
| Touching 3+ files | Yes |
| A `--fix` command (show what changes before writing) | Yes — always |
| Architectural change | Yes |
| Single-file bug fix / comment / answering a question | No |

### Anti-patterns

- Writing files during Explore.
- Presenting a plan then executing without waiting.
- Skipping the plan for a "quick" task that touches 3+ files.
- Modifying files outside the declared scope.

---

## 2. AGENT TEAMS

### Invocation

```
Task tool:
  subagent_type: "builder"    ← must match a name: in §5 exactly (kebab-case)
  prompt: "Self-contained task. Declare file boundaries. State: no writes / writes X only."
  run_in_background: false     ← true only if you have real work to do while it runs
```

### Pattern A — Fan-Out Analysis (read-only, N dimensions in parallel)

```
Task(detective, "Analyze test coverage in src/. Report gaps only. No writes.")
Task(security,  "Scan src/ for OWASP issues + secrets. Report only. No writes.")
Task(performance,"Profile src/ hotspots. Report only. No writes.")
   ↓ all run concurrently ↓
Aggregate the three reports into one.
```

### Pattern B — Plan-Then-Parallel-Build (non-overlapping write scopes)

```
Approval received
  ├─ Task(builder,  "Implement per spec. Write src/*.ts ONLY. No test files.")
  └─ Task(testing,  "Write tests per spec. Write src/__tests__/*.test.ts ONLY. No source edits.")
       ↓ both complete ↓
  Task(guardian, "Run the quality gate on the completed work.")
```

### Pattern C — Build-Then-Validate (sequential, then parallel validation)

```
Task(builder, "Implement the feature.")
   ↓ completes ↓
  ├─ Task(guardian, "Run tests + type check.")
  └─ Task(security, "Security-scan the diff.")
```

### Design rules

1. **Declare file boundaries in every prompt** — writers must not overlap (see Gotchas).
2. **Parallel = no shared mutable state** — agents may read the same files; each writes
   to a different path.
3. **Self-contained prompts** — the subagent sees none of your conversation history.
4. **Aggregate, don't over-chain** — let independent agents run concurrently, then
   synthesize; only serialize genuine data dependencies.
5. **Wave, don't flood** — the provider throttles beyond ~6 concurrent subagents. Launch
   in waves of ≤6, not fifty at once.

---

## 3. COMBINED PATTERN

```
Plan Mode: explore (reads) → draft plan → present → wait for approval
Agent Teams: fan out parallel agents on the approved plan → aggregate → guardian gate
```

## 4. DECISION TREE

```
3+ files?               → Plan Mode first.
Multiple independent dimensions? → Agent Teams, Fan-Out (Pattern A).
--fix command?          → Plan Mode pre-flight ALWAYS (show changes before writing).
health / gap / analysis?→ Agent Teams, Fan-Out (Pattern A).
feature implementation? → Plan Mode, then Agent Teams (Pattern B).
Otherwise (1 file, no dimensions) → execute directly.
```

---

## 5. AGENT ROUTING GUIDE (source of truth)

The roster is **33 agents**. `subagent_type` must equal a `name:` below verbatim.
Only agents with `Task` in their tools can spawn other agents; the rest are leaf
workers. Four agents (`Read`/`Grep`-only, no `Write`/`Edit`) are **read-only** — never
route code-writing to them.

### Orchestrators (have `Task` — can sub-delegate)

| name | model | Delegate when… | Notes |
|------|-------|----------------|-------|
| planner | opus | A feature needs an architecture + task plan | **read-only** (plans, doesn't write code) |
| builder | sonnet | Ready to write code from an approved plan | can spawn `testing` |
| guardian | sonnet | Implementation done; run quality gates | spawns parallel validators |
| detective | sonnet | Health / gap / architecture analysis | **read-only** |
| orchestrator | opus | Top-level multi-phase session coordination | |
| master-architect | opus | System-level architecture across repos | |
| product-strategist | opus | Product direction / prioritization | |
| revenue-architect | opus | Monetization / pricing / GTM engineering | |
| growth-engine | sonnet | Growth loops, acquisition instrumentation | |
| incident-commander | opus | Live incident triage + coordination | |
| release-sentinel | opus | Pre-release docs/changelog/version audit | |
| devops | sonnet | CI/CD, Docker, infra, monitoring | |
| integration | sonnet | 3rd-party services, webhooks, OAuth | |
| qa-sentinel | sonnet | End-to-end QA orchestration | |
| dx-engineer | sonnet | Developer-experience tooling | |
| design-vanguard | opus | High-craft visual/UX design | |
| nxtg-ceo-loop | opus | CRITICAL strategic pivot only (else it decides autonomously) | |

### Leaf workers (no `Task` — cannot sub-delegate)

| name | model | Delegate when… |
|------|-------|----------------|
| testing | sonnet | New code needs tests / coverage / flaky-test triage |
| security | sonnet | OWASP scan, secrets, vuln audit |
| refactor | sonnet | Complexity reduction, DRY, restructuring |
| performance | sonnet | Profiling, bundle/memory analysis |
| ui | sonnet | React components, a11y, responsive layout |
| api | sonnet | REST/GraphQL design, validation, OpenAPI |
| database | sonnet | Schema, migrations, query tuning |
| docs | sonnet | JSDoc, README, changelog, API docs |
| analytics | sonnet | Metrics, KPI tracking, dashboards |
| compliance | sonnet | License audit, GDPR, WCAG |
| learning | sonnet | Pattern capture, preference persistence |
| governance-verifier | sonnet | Resolve a hook-flagged scope/quality concern |
| oracle | sonnet | Non-blocking drift/scope validation in autonomous mode |
| scout | sonnet | Web research / external-source gathering (read+web, no Task) |
| wordsmith | sonnet | Copy, naming, prose polish |
| crucible-detective | sonnet | Test-suite quality audit — **read-only** |

### Read-only agents (no `Write`/`Edit`)

`planner`, `detective`, `crucible-detective`, `oracle` — route analysis/planning to
them, never file writes.

### Routing anti-patterns

- Referencing a `subagent_type` not in this table (e.g. `general-purpose`,
  `nxtg-master-architect`). The correct name is `master-architect`.
- Using `nxtg-ceo-loop` or `orchestrator` for routine implementation.
- Spawning a leaf worker expecting it to sub-delegate — it has no `Task`.
- Routing code writes to a read-only agent (planner/detective/crucible-detective/oracle).
- Spawning the same agent type recursively (detective spawning detective).

---

## Gotchas

- **`subagent_type` name ≠ filename.** The CEO agent's file is `ceo-loop.md` but its
  `name:` is `nxtg-ceo-loop` — spawn by the `name`, not the filename. Any mismatch fails
  the Task call.
- **planner is opus + read-only.** It plans; it cannot `Write`/`Edit`. To actually write
  the plan's code you must then spawn `builder`. Same for `detective`, `oracle`,
  `crucible-detective`.
- **Model claims drift — verify against the agent file.** `analytics`, `compliance`,
  `learning`, `governance-verifier` are **sonnet**, not haiku. Read the `model:`
  frontmatter before asserting cost/capability.
- **Subagents are context-blind.** A subagent receives only its `prompt` — none of your
  conversation, files you've read, or prior agent output. Restate every fact it needs.
- **Overlapping write scopes silently corrupt work.** Two parallel writers touching the
  same file race; the last writer wins and the other's edits vanish. Partition paths
  explicitly (`src/*.ts` vs `src/__tests__/*.test.ts`) or serialize them.
- **`run_in_background: true` needs a poll.** A background subagent does not block; you
  must check its completion before consuming its output. Use foreground unless you have
  genuine parallel work of your own.
- **Concurrency ceiling ≈ 6.** Beyond ~6 simultaneous subagents the provider throttles
  (429/529). Fan out in waves of ≤6; a sequential queue of independent work is not
  parallelism, but neither is a 30-agent flood.
- **Leaf workers can't orchestrate.** 16 of the 33 agents have no `Task` tool. Don't hand
  one a prompt that says "spawn a tester" — it will just do the work inline or fail.
