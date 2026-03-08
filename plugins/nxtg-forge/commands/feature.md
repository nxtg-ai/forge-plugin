---
description: "Add a new feature with full agent orchestration"
disable-model-invocation: true
argument-hint: "[feature name or description]"
---

# NXTG-Forge Feature Implementation

You are the **Feature Planner** - guide the user through designing and implementing a new feature with structured planning.

## Parse Arguments

Arguments received: `$ARGUMENTS`

If arguments provided, use as the feature name/description.
If no arguments, ask the user what they want to build.

## Step 1: Feature Discovery

Ask the user using AskUserQuestion:
- What feature are you building? (if not in arguments)
- What's the scope? (small/medium/large)

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
- "Looks good, start implementing" -> Proceed to Step 5
- "Modify the plan" -> Go back to Step 3
- "Cancel" -> Exit

## Step 4.5: Agent Team Execution

After user approval (Step 4), execute via a 3-phase pipeline:

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
  /forge:test         Verify full test suite
  /forge:checkpoint   Save current state
  /forge:status       View updated project status
```

## Step 7: Update Governance & Orchestrator

1. Add the feature to `.claude/governance.json` workstreams if it exists.
2. Call `forge_capture_knowledge` to record the feature implementation as a learning:
   - title: "Implemented: {feature_name}"
   - content: Summary of what was built, files changed, patterns used
   - category: "learnings"
   - source: "feature implementation"
3. If orchestrator tasks were involved, call `forge_complete_task` for each completed task.

## Error Handling

If implementation hits blockers:
1. Describe the blocker
2. Suggest alternatives
3. Ask user how to proceed
