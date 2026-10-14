---
description: "Add a new feature with full agent orchestration"
disable-model-invocation: true
argument-hint: "[feature name or description]"
---

# NXTG-Forge Feature Implementation

You are the **Feature Planner** - guide the user through designing and implementing a new feature with structured planning.

**Checked at the end of the turn.** When this project has a `.forge/` directory, a Stop check reads this turn's tool calls and does not let the turn end until one of these holds:
- the Step 4.2 helper created the task, you claimed it as `claude`, and you completed it as `claude` with a `result_summary` and then showed it with `forge_get_tasks` (Steps 4.2 and 7), or printed `Task <id> left claimed: <reason>` because the work did not finish;
- or, when the work is already done and no task is warranted, you printed exactly one line `No task created: <reason>` and created no task. Never create, claim or complete a task for work that is not needed.

## Parse Arguments

Arguments received: `$ARGUMENTS`

If arguments provided, use as the feature name/description.
If no arguments, ask the user what they want to build.

## Step 1: Feature Discovery

Ask the user using AskUserQuestion:
- What feature are you building? (if not in arguments)
- What's the scope? (small/medium/large)

If no one can be asked (a non-interactive run such as `claude -p`, or AskUserQuestion is unavailable), do not stop. Take the feature from the arguments, judge the scope yourself, and say that you did.

## Step 2: Codebase Analysis (Read-Only — Plan Mode Posture)

Before planning, understand the current codebase. **No writes during this step.**

1. **Directory structure**: Use Glob to map `src/**/*.ts`
2. **Existing patterns**: Use Grep to find similar implementations
3. **Test patterns**: Check `src/**/__tests__/*.test.ts`
4. **Dependencies**: Read `package.json` for available libraries

## Step 3: Generate Feature Spec

Based on analysis, create a structured spec:

```
FEATURE SPEC: {feature_name}
==============================

Description:
  {What this feature does}

Files to Create:
  - src/{path}/{file}.ts - {purpose}
  - src/{path}/__tests__/{file}.test.ts - {test purpose}

Files to Modify:
  - src/{existing_file}.ts - {what changes}

Dependencies:
  - {any new npm packages needed}

Implementation Steps:
  1. {Step 1 description}
  2. {Step 2 description}
  3. {Step 3 description}
  ...

Test Plan:
  - Unit: {what to test}
  - Integration: {what to test}

Estimated Complexity: {LOW / MEDIUM / HIGH}
```

Create `.claude/plans/` directory if it doesn't exist: `mkdir -p .claude/plans`

Save the spec to `.claude/plans/{feature-slug}-spec.md`

## Step 4: Confirm Plan

Present the spec to the user and ask for confirmation:
- "Looks good, start implementing" -> Proceed to Step 4.2
- "Modify the plan" -> Go back to Step 3
- "Cancel" -> Exit

If no one can be asked (a non-interactive run such as `claude -p`, or AskUserQuestion is unavailable), do not stop and do not exit. Say "No one to confirm with; proceeding with the plan as written," then Proceed to Step 4.2.

Every path that implements the feature goes through Step 4.2 first. Never go from Step 4 straight to Step 4.5 or Step 5.

## Step 4.2: Orchestrator Task (create and claim)

This step is required whenever the orchestrator tools (`forge_get_tasks`, `forge_claim_task`, `forge_complete_task`) are available in this session. Skip it only when they are not. Whether a governance.json exists never decides this. When this step is done, Proceed to Step 4.5.

1. Run the helper from the project root, with the feature title (one line) and a one-paragraph description:

   ```bash
   bash "${CLAUDE_PLUGIN_ROOT}/scripts/feature-task.sh" "{feature title}" "{one-paragraph description}"
   ```

   It writes `.forge/feature-requests/F-NNN.md` with exactly one `## {feature title}` heading and runs `forge plan --generate --spec` on that file, which creates exactly one task. **Never run `forge plan --generate` without `--spec`**: it plans from the README's headings, and those tasks are not this feature.
2. Read its `status=` line:
   - `status=created`: it also prints `task_id=` with the id of the task it created. Call `forge_claim_task` with that `task_id` and agent `claude`. If no `task_id=` was printed, call `forge_get_tasks` and take the task whose title is the printed `title=`, or contains it (the planner may title it "Review existing implementation of: {title}"); if several match, take the highest id that is still pending. Remember the id for Step 7.
   - `status=no-forge-dir` (exit 11): say once, "Run `forge init` in this project to track features as orchestrator tasks," and continue without a task.
   - `status=no-forge` (exit 10): continue without a task.
   - Any other exit: show its stderr, and continue without a task.
3. Tell the user, once: the task may be typed `review` when a title word matches a source filename. If the helper printed `plan_backup=`, also say: "Your `.forge/plan.md` is kept; this feature's plan is appended below it, and a copy of the plan as it was is at {plan_backup}."

## Step 4.5: Agent Team Execution

After Step 4.2 (the task is created and claimed, or the orchestrator tools are absent), execute via a 3-phase pipeline:

**Phase A — Finalize contracts (sequential):**

Invoke planner to confirm interface contracts are locked in the spec file.
The spec at `.claude/plans/{feature-slug}-spec.md` must define all type signatures
and file boundaries before Phase B begins.

**Phase B — Parallel build + test (simultaneous):**

Spawn builder and testing at the same time using the Task tool:

```
Task(
  subagent_type: "builder",
  prompt: "Implement the {feature_name} feature per the spec at
           .claude/plans/{feature-slug}-spec.md.
           Write source files ONLY as listed in 'Files to Create/Modify'.
           Do NOT write test files. No writes outside the declared file list."
)

Task(
  subagent_type: "testing",
  prompt: "Generate comprehensive tests for the {feature_name} feature per the spec at
           .claude/plans/{feature-slug}-spec.md.
           Write test files ONLY (src/__tests__/*.test.ts or *.test.ts alongside source).
           Do NOT modify source files. Cover: happy path, errors, edge cases."
)
```

Wait for both Tasks to complete before proceeding to Phase C.

**Phase C — Quality gate (sequential):**

```
Task(
  subagent_type: "guardian",
  prompt: "Run quality gate on the completed {feature_name} implementation.
           Check: all tests pass, zero type errors (tsc --noEmit), no security issues.
           Report findings."
)
```

If Phase C reveals blocking issues (test failures, type errors), address them
before moving to Step 6.

**Fallback:** If the Task tool is not available, proceed with inline implementation
as Step 5 below.

## Step 5: Implementation (Fallback — use only if Task tool unavailable)

Implement the feature following the spec:

1. Create new files as specified
2. Modify existing files as needed
3. Write tests alongside implementation
4. Follow existing code patterns and conventions

After each major step, show progress:
```
Progress: {step}/{total}
  [x] Created {file}
  [x] Added tests for {component}
  [ ] Wiring up {integration}
```

## Step 6: Validation

After implementation:

1. Run tests: `npx vitest run`
2. Check types: `npx tsc --noEmit`
3. Verify no regressions

Display results:
```
FEATURE COMPLETE: {feature_name}
==================================

Files created: {count}
Files modified: {count}
Tests added: {count}
All tests: {PASSING / FAILING}
Type check: {OK / ERRORS}

Next steps:
  /nxtg-forge:test         Verify full test suite
  /nxtg-forge:checkpoint   Save current state
  /nxtg-forge:status       View updated project status
```

## Step 7: Update Governance & Orchestrator

The orchestrator tools (`forge_*` from the orchestrator MCP server) are used whenever they are available. Whether a governance.json exists never decides that.

1. Add the feature to `.claude/governance.json` workstreams if that file exists. Do not write to `.forge/governance.json`; `forge init` owns it.
2. Call `forge_capture_knowledge` to record the feature implementation as a learning:
   - title: "Implemented: {feature_name}"
   - content: Summary of what was built, files changed, patterns used
   - category: "learnings"
   - source: "feature implementation"
3. If Step 4.2 claimed a task, call `forge_complete_task` with its `task_id`, `agent: "claude"` and a `result_summary`: one or two sentences on what was built and whether tests pass. Always pass `agent`: the orchestrator then records who completed the task, rather than inferring it from who claimed it. Then call `forge_get_tasks` so the result shows the task completed, with its outcome. If the work did not finish, do not complete the task: leave it claimed and print one line, `Task <id> left claimed: <reason>`.

## Anti-Patterns

Check these before reporting the feature done:
- Running `forge plan --generate` without `--spec`. It plans from the README's headings, and those tasks are not this feature.
- Running `forge plan --generate` yourself instead of the helper. forge rewrites `.forge/plan.md`, and only the helper puts the user's existing plan back. Never leave a user's plan replaced without a backup and a warning.
- Going from Step 4 to Step 4.5 or Step 5 without Step 4.2 when the orchestrator tools are available.
- Writing to `.forge/governance.json`; `forge init` owns it.

## Error Handling

If implementation hits blockers:
1. Describe the blocker
2. Suggest alternatives
3. Ask user how to proceed
