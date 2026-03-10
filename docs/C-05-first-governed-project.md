# Your First Governed Project

This walks you through setting up Forge governance on an existing project, from zero to a running task board. By the end, you'll have a spec, a generated plan, completed tasks, and captured knowledge.

## Prerequisites

- **L1 plugin installed** — see [Quick Start](C-02-quick-start-l1.md) if you haven't done this yet
- **L2 orchestrator installed** — see [Upgrade to Pro Builder](C-03-upgrade-to-pro-builder.md) for the `forge` binary
- A project directory with source code and a git repo (any language)

## Step 1: Pick a Project

Navigate to an existing project. Any codebase works — a Node.js app, a Python CLI, a Rust library. If you want to follow along with a throwaway project:

```bash
mkdir my-app && cd my-app
git init
echo '{ "name": "my-app", "version": "1.0.0" }' > package.json
echo '# My App' > README.md
```

## Step 2: Write a SPEC.md

Forge uses a `SPEC.md` as your project's vision document. The planner reads this to generate tasks. Create one in your project root:

```markdown
# My App

A CLI tool that converts CSV files to JSON.

## Features
- Read CSV from file path or stdin
- Auto-detect delimiter (comma, tab, semicolon)
- Output pretty-printed or compact JSON
- Support for header row detection

## Tech Stack
- Node.js 22
- Zero external dependencies
```

Keep it concise. Describe what you're building, not how. The planner handles decomposition.

If you don't have a SPEC.md, Forge falls back to your README.md and other markdown files in the project root. A dedicated spec produces better task plans.

## Step 3: Initialize Forge

```bash
forge init
```

This runs three steps:

1. **Context discovery** — scans for package.json, Cargo.toml, README.md, SPEC.md, and other project files. Detects your project type.
2. **Tool detection** — checks PATH for Claude Code, Codex CLI, and Gemini CLI.
3. **Scaffold** — creates the `.forge/` directory:

```
.forge/
├── state.json          # Project metadata, brain config, tool registry
├── governance.json     # Shared governance state bus
├── events.jsonl        # Append-only audit trail
├── .gitignore          # Excludes worktrees/ and results/
├── tasks/              # Task files (created by forge plan)
├── knowledge/          # decisions/, learnings/, research/, patterns/
└── results/            # Execution results
```

If SPEC.md exists, Forge tells you to run `forge plan`. If not, it writes a plan.md template for you to fill in.

<!-- VISUAL: D-01 -- forge-init-to-status.gif -->

## Step 4: Configure the Brain

```bash
forge config brain rule-based
```

Two options:

| Brain | Cost | What It Does |
|-------|------|-------------|
| `rule-based` | Free | Keyword analysis and heuristics for task decomposition. No API key needed. |
| `openai` | Paid | GPT-4.1 via OpenAI API. Better at understanding complex specs and assigning dependencies. Requires `OPENAI_API_KEY`. |

Start with `rule-based` to try the workflow. Switch to `openai` later if you need smarter planning. See [CLI Commands Reference](C-10-cli-commands.md#forge-config) for model configuration.

## Step 5: Generate the Plan

```bash
forge plan --generate
```

Forge reads your SPEC.md, scans existing source files for what already exists, and decomposes the spec into dependency-aware tasks. You'll see output like:

```
FORGE -- CEO Mode: Plan Generation
========================================

  * Spec loaded (12 lines) from SPEC.md
  * Codebase scanned (3 source files)
  -> Available tools: claude
  -> Using rule-based brain

  * Generated 5 tasks
  * Agents assigned

Generated Plan:
  ID       Title                                Agent      Type         Status
  --------------------------------------------------------------------------
  T-001    Set up project structure             claude     implement    pending
  T-002    Implement CSV parser                 claude     implement    pending
  T-003    Add delimiter auto-detection         claude     implement    pending
  T-004    Build JSON output formatter          claude     implement    pending
  T-005    Add CLI argument handling            claude     implement    pending
```

Tasks get unique IDs in `T-xxx` format, with dependency chains so Forge knows what to run first.

If you want to use a spec file in a non-default location:

```bash
forge plan --generate --spec docs/my-spec.md
```

## Step 6: Read the Task Board

```bash
forge status
```

This shows the full picture — task board, agent status, file locks, and recent events:

```
  Task Board:
    ID       Phase    Status       Agent      Type       Title                            Deps
    ------------------------------------------------------------------------------------------------
    T-001    build    * Ready      claude     implement  Set up project structure          -
    T-002    build    ! Blocked    claude     implement  Implement CSV parser              T-001
    T-003    build    ! Blocked    claude     implement  Add delimiter auto-detection      T-002
    T-004    build    ! Blocked    claude     implement  Build JSON output formatter       T-002
    T-005    build    ! Blocked    claude     implement  Add CLI argument handling         T-001

    5 total | 1 ready | 0 running | 0 done | 0 failed | 4 blocked
    [                              ] 0%
```

Tasks marked "Blocked" are waiting for their dependencies to complete. Only "Ready" tasks can be executed.

## Step 7: Run a Task

Run a single task with a specific agent:

```bash
forge run --task T-001 --agent claude
```

Or let Forge handle everything autonomously:

```bash
forge run
```

Autonomous mode picks up all ready tasks, assigns them to available agents, respects dependency order, manages file locks, and runs up to 3 tasks in parallel. Use `--dry-run` to preview what would happen without executing.

## Step 8: Check Your Progress

Run `forge status` again after completing a task:

```
  Task Board:
    ID       Phase    Status       Agent      Type       Title                            Deps
    ------------------------------------------------------------------------------------------------
    T-001    build    + Done       claude     implement  Set up project structure          -
    T-002    build    * Ready      claude     implement  Implement CSV parser              T-001
    T-003    build    ! Blocked    claude     implement  Add delimiter auto-detection      T-002
    T-004    build    ! Blocked    claude     implement  Build JSON output formatter       T-002
    T-005    build    * Ready      claude     implement  Add CLI argument handling         T-001

    5 total | 2 ready | 0 running | 1 done | 0 failed | 2 blocked
    [######                        ] 20%
```

T-001 is done, which unblocked T-002 and T-005. The progress bar reflects your completion percentage.

## Step 9: Capture Knowledge

As you work, capture decisions and learnings so they persist across sessions. Use the MCP tool from Claude Code:

```
forge_capture_knowledge({
  "entry": "Chose tab as default delimiter because our data sources use TSV",
  "category": "decision"
})
```

Or use the `/forge:feature` command in Claude Code, which automatically captures knowledge as agents work.

Knowledge is stored in `.forge/knowledge/` under four categories:
- **decisions/** — architectural and design choices
- **learnings/** — things discovered during implementation
- **research/** — background investigation and analysis
- **patterns/** — reusable approaches and conventions

This knowledge feeds back into future planning and drift detection.

## What to Do Next

You now have a governed project with a spec, a task plan, completed work, and captured knowledge. From here:

- **[Multi-Agent Orchestration](C-06-multi-agent-orchestration.md)** — run Claude, Codex, and Gemini as a coordinated team with file locking
- **[AI Brain Configuration](C-07-brain-config.md)** — tune the OpenAI brain, switch models, configure API keys
- **[CLI Commands Reference](C-10-cli-commands.md)** — every `forge` command with flags and examples
- **[Health Scoring Guide](C-14-health-scoring.md)** — understand your project's governance score and how to improve it
