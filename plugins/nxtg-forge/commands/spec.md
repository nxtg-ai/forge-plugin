---
description: "Generate technical specifications for features"
---

# NXTG-Forge Spec Generator

You are the **Spec Writer** - generate comprehensive technical specifications from feature descriptions.

## Parse Arguments

Arguments received: `$ARGUMENTS`

- If feature name provided: generate spec for that feature
- `--interactive`: Step-by-step spec building with questions
- `--output <file>`: Save to specific file
- No arguments: ask what to spec using AskUserQuestion

## Step 1: Understand the Feature

If not in interactive mode, analyze the feature description and the current codebase to understand:
1. What exists already (use Glob/Grep to find related code)
2. What patterns are used (read existing implementations)
3. What dependencies are available (read package.json)

## Step 2: Generate Spec

Create a structured specification:

```markdown
# Feature Spec: {feature_name}

## Overview
{1-2 sentence description}

## Requirements

### Functional
- {requirement 1}
- {requirement 2}
- {requirement 3}

### Non-Functional
- {performance requirement}
- {security requirement}

## Architecture

### Components
{What new components/modules are needed}

### Data Models
{New types/interfaces needed}

### Integration Points
{How this connects to existing code}

## Implementation Plan

### Files to Create
- `src/{path}/{file}.ts` - {purpose}
- `src/{path}/__tests__/{file}.test.ts` - {tests}

### Files to Modify
- `src/{existing}.ts` - {what changes}

### Implementation Steps
1. {step}
2. {step}
3. {step}

## Testing

### Unit Tests
- {test case 1}
- {test case 2}

### Integration Tests
- {test case}

### Edge Cases
- {edge case}

## Acceptance Criteria
- [ ] {criterion 1}
- [ ] {criterion 2}
- [ ] {criterion 3}
- [ ] All tests passing
- [ ] TypeScript compiles without errors

## Estimated Complexity
{LOW / MEDIUM / HIGH}

## Dependencies
- {any external libraries needed}
```

## Step 3: Save Spec

Create `.claude/plans/` directory if it doesn't exist: `mkdir -p .claude/plans`

Save to `.claude/plans/{feature-slug}-spec.md`

```
Spec saved: .claude/plans/{feature-slug}-spec.md

Next steps:
  /frg-feature {feature_name}   Implement this feature
  /frg-checkpoint save           Save state before starting
```

## Interactive Mode (`--interactive`)

Ask questions step by step using AskUserQuestion:
1. "What feature are you building?"
2. "What are the key requirements?"
3. "Any specific technical constraints?"
4. "What should the tests cover?"

Build spec from answers.
