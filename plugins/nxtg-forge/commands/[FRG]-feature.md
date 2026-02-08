---
description: "Add a new feature with full agent orchestration"
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

## Step 2: Codebase Analysis

Before planning, understand the current codebase:

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

## Step 5: Implementation

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
  /frg-test         Verify full test suite
  /frg-checkpoint   Save current state
  /frg-status       View updated project status
```

## Step 7: Update Governance

Add the feature to `.claude/governance.json` workstreams if it exists.

## Error Handling

If implementation hits blockers:
1. Describe the blocker
2. Suggest alternatives
3. Ask user how to proceed
