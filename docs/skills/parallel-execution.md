# Parallel Execution

> The canonical reference for Claude Code's two highest-leverage capabilities: Plan Mode (explore, plan, wait for approval, then execute) and Agent Teams (parallel subagent spawning with non-overlapping file scopes).

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Workflow |

---

## What It Provides

Parallel Execution teaches agents how to use Plan Mode and Agent Teams -- the two capabilities that transform Claude Code from a serial assistant into a coordinated multi-agent system. Plan Mode enforces the discipline of exploring before writing, presenting a plan, and waiting for explicit approval. Agent Teams enable parallel execution by spawning subagents with declared file boundaries that prevent conflicts.

Without this skill, agents jump straight into implementation on complex tasks (touching 3+ files without a plan), work serially on tasks that could be parallelized, and spawn agents without declaring file boundaries (causing merge conflicts). With it, agents follow a decision tree: 3+ files means Plan Mode first, multiple independent dimensions means Fan-Out Analysis, and feature implementation uses Plan-Then-Parallel-Build.

The skill includes the complete agent routing guide (all 23 agents with their specialties, models, and delegation criteria) and the rules for which agents need the Task tool (orchestrators) vs. which should not have it (leaf workers).

## When It Activates

- When designing or implementing features that span multiple files
- When running multi-dimensional analysis (health, gap, architecture review)
- When orchestrating parallel build and test pipelines
- When deciding whether to use Plan Mode, Agent Teams, or direct execution

## The Knowledge Inside

### Plan Mode Protocol

A strict five-step workflow. **Explore**: read-only operations only (Read, Glob, Grep, Bash). No writes until approved. **Draft**: structured plan document with scope, files to create, files to modify, files NOT touched (boundary declaration), approach, and risks. **Present**: show the plan, ask for approval. **Wait**: do not proceed until the user explicitly approves. **Execute**: write code, modify files, spawn agents. Anti-patterns: writing files during Explore, executing immediately after presenting a plan, skipping the plan for "quick" tasks that touch 3+ files.

### Three Agent Team Patterns

**Fan-Out Analysis**: spawn N read-only agents simultaneously, each analyzing one dimension (coverage, security, architecture). Aggregate their reports when all complete. Best for health checks, gap analysis, and multi-dimensional audits.

**Plan-Then-Parallel-Build**: after plan approval, spawn builder and tester simultaneously with non-overlapping file scopes (builder writes `src/*.ts`, tester writes `src/__tests__/*.test.ts`). Then spawn guardian for quality gate on completed work. Best for feature implementation.

**Build-Then-Validate**: sequential build, then parallel validation. Builder implements the feature, then guardian runs tests, type checks, and security scans in parallel. Best for smaller features where build and test have dependencies.

### Design Rules for Parallel Work

Five rules prevent parallel execution failures. **Declare file boundaries**: every agent prompt must specify which files it can write. **No shared mutable state**: parallel agents can read the same files but must write to different files. **Foreground vs. background**: use `run_in_background: true` only for genuinely independent work. **Aggregate, don't chain**: wait for all parallel agents before synthesizing, rather than piping each result into the next. **Explicit prompts**: each subagent prompt must be self-contained because subagents do not see conversation history.

### The Decision Tree

A clear routing algorithm: Is the task touching 3+ files? Use Plan Mode. Does it have multiple independent dimensions? Use Agent Teams (Fan-Out). Is it a --fix command? Always use Plan Mode. Is it a health/gap/analysis command? Use Fan-Out Analysis. Is it feature implementation? Plan Mode first, then Agent Teams for parallel build and test. Single-file fix? Execute directly.

### Agent Routing Guide

The skill catalogs all 23 agents with model, specialty, and delegation criteria. Critically, it defines which agents need the Task tool (planner, builder, guardian, detective, orchestrator -- they coordinate other agents) and which must NOT have it (testing, refactor, api, database, ui, devops, security, docs, performance, integration -- they are leaf workers that should not sub-delegate).

## How to Leverage It

For any complex task, the agent will consult the decision tree and choose the appropriate execution strategy automatically.

### Example: Implementing a New Feature
```
User: "Add user authentication to the project"
What happens: The agent enters Plan Mode, explores the codebase (read-only),
drafts a plan listing all files to create and modify, presents it for approval.
After approval, spawns builder (writes src/ files) and tester (writes test
files) in parallel with declared file boundaries. When both complete, spawns
guardian for quality gate verification.
```

## Power Applications

- Use Fan-Out Analysis for comprehensive codebase audits that would take 30+ minutes serially
- Apply Plan-Then-Parallel-Build to cut feature implementation time by running build and test simultaneously
- Use the agent routing guide to prevent delegation mistakes (wrong agent for the task, leaf worker trying to orchestrate)

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **agent-development** | Defines agent frontmatter including the tools list that controls Task access |
| **agent-lead-architect** | Uses Plan Mode for architecture review; spawns Agent Teams for implementation |
| **ceo-loop** | Heavy-depth CEO decisions use Agent Teams for multi-agent analysis |

## Tips

- Never skip Plan Mode for tasks touching 3+ files -- the cost of undoing unplanned changes exceeds the cost of planning
- File boundary declarations in agent prompts are not suggestions, they are contracts -- violations cause merge conflicts
- Leaf workers should never have the Task tool; uncontrolled sub-delegation chains waste context and produce inconsistent results

---

*See also: [agent-development](agent-development.md), [ceo-loop](ceo-loop.md)*
