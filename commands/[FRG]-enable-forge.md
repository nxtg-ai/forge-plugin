---
description: "Activate forge command center with orchestrator"
---

# NXTG-Forge Command Center

You are activating the **NXTG-Forge Command Center** - the canonical 4-option menu that provides intelligent project orchestration.

## Pre-flight Check

Before showing the menu, quickly verify forge is set up:
1. Check `.claude/governance.json` exists (Read tool)
2. Check `.claude/commands/` has FRG commands (Glob tool)
3. Check `.claude/agents/` directory exists (Glob tool)

If not initialized, suggest: "Run `/frg-init` first to set up NXTG-Forge."

## Display Command Center

Present this menu to the user:

```
NXTG-FORGE COMMAND CENTER
===========================

What shall we accomplish today?

  1. Continue / Resume
     Pick up where we left off - restore context, show pending work

  2. Review & Plan Features
     Design and plan new work, create feature specs

  3. Soundboard
     Discuss strategy, get recommendations, explore options

  4. Health Check
     Review code quality, test coverage, security, and project metrics

Enter choice (1-4) or describe what you need:
```

Use `AskUserQuestion` to get the user's choice with these 4 options.

## Handle Each Option

### Option 1: Continue / Resume

Gather and display context:
1. Read `.claude/governance.json` for current directive and workstreams
2. Run `git log --oneline -10` for recent activity
3. Run `git status --porcelain` for uncommitted work
4. Check `.claude/checkpoints/` for saved states
5. Read any TODO items from governance sentinel log

Present:
```
CONTEXT RESTORED
=================
Branch: {branch}
Last commit: {hash} {message} ({time})
Uncommitted: {count} files

Current directive: {directive}
Active workstreams: {count}

Pending work:
  - {task from governance}
  - {uncommitted changes description}

What would you like to work on?
```

### Option 2: Review & Plan Features

1. Ask user what feature they want to plan (using AskUserQuestion)
2. Analyze current codebase structure for context
3. Generate a feature spec with:
   - Requirements
   - Files to create/modify
   - Test plan
   - Estimated complexity
4. Save spec to `.claude/plans/{feature-name}.md`
5. Ask if user wants to start implementation

### Option 3: Soundboard

Enter open discussion mode:
1. Gather project context (git status, governance, recent activity)
2. Present current state summary
3. Ask what the user wants to discuss
4. Provide strategic recommendations based on:
   - Current codebase state
   - Test coverage gaps
   - Architecture patterns
   - Technical debt indicators

### Option 4: Health Check

Run comprehensive health analysis:
1. Execute `/frg-gap-analysis` logic
2. Run `npx vitest run` for test status
3. Check `npx tsc --noEmit` for type safety
4. Run `npm audit` for security
5. Analyze code quality metrics

Present dashboard:
```
PROJECT HEALTH DASHBOARD
=========================
Tests:     {pass}/{total} ({pct}%)
Types:     {OK or errors}
Security:  {vulns} vulnerabilities
Coverage:  {file_pct}% file coverage
Quality:   {as_any_count} type casts, {console_count} console.logs

Overall: {HEALTHY / NEEDS ATTENTION / CRITICAL}

Recommendations:
  1. {top recommendation}
  2. {second recommendation}
  3. {third recommendation}
```

## Natural Language Handling

If the user types free text instead of 1-4, map to the closest option:
- "Let's keep going" / "continue" / "resume" -> Option 1
- "plan" / "feature" / "design" / "build" -> Option 2
- "discuss" / "think" / "advice" / "strategy" -> Option 3
- "health" / "quality" / "metrics" / "how are we doing" -> Option 4

## After Completion

After handling any option, offer to return to the command center:
```
Return to command center? (/frg-enable-forge)
```
