# Multi-Agent Orchestration

The problem is simple: you have Claude Code, Codex CLI, and Gemini CLI installed. You point all three at the same codebase. Claude refactors a module while Codex writes tests against the old interface. Gemini generates docs for code that no longer exists. Nobody knows what the others are doing. Decisions made in one tool are invisible to the others. Every session starts from zero.

Forge solves this by turning independent AI tools into a coordinated team.

## How Forge Solves It

**Task decomposition.** You write a SPEC.md describing what you want built. `forge plan --generate` reads it and decomposes it into a dependency-aware task graph. Tasks have IDs, acceptance criteria, file assignments, and dependency chains. No two tasks claim the same files without explicit sequencing.

**Intelligent assignment.** The orchestrator assigns tasks to the right tool based on task type. Claude handles implementation. Codex handles review and verification. Gemini handles documentation and research. You can override assignments, but the defaults are sensible.

**File locking.** When an agent claims a task, Forge locks that task's target files. If another agent tries to claim a task that touches locked files, the claim is rejected. No merge conflicts. No silent overwrites. Locks release automatically when tasks complete.

**Knowledge capture.** Decisions, patterns, and learnings are written to `.forge/knowledge/` and persist across sessions and tools. When Claude discovers that your API uses snake_case, that learning is available to Codex and Gemini on their next task. Context is shared, not siloed.

## The Adapter Pattern

Forge does not care which AI tool runs a task. Each tool has an adapter implementing the `ToolAdapter` trait:

```
ToolAdapter
├── render_config()            Write context file for the tool
├── build_command()            CLI command for headless execution
├── build_command_interactive() CLI command for PTY mode
├── initial_input()            Text typed into TUI after startup
└── ready_pattern()            Pattern indicating TUI is ready
```

Three adapters ship today:

| Adapter | Context File | Ready Pattern |
|---------|-------------|---------------|
| Claude  | `CLAUDE.md` | `"to cycle"` |
| Codex   | `AGENTS.md` | `"help you with"` |
| Gemini  | `GEMINI.md` | `"Type your message"` |

Each adapter's `render_config()` method writes a context file into your project root. That file contains the tool's assigned tasks, acceptance criteria, and the files it is allowed to modify. The tool reads its own context file and knows exactly what to do.

The `build_command()` method constructs the right CLI invocation for headless mode. `build_command_interactive()` constructs the command for PTY mode, launching the tool's native TUI inside the dashboard.

The context files are regenerated on every `forge sync` and before each dashboard session. They always reflect the current task state, so an agent picking up a new task sees up-to-date assignments and file boundaries.

Adding a new AI tool means implementing one struct with five methods. The orchestrator, dashboard, and task engine require zero changes. The adapter pattern is the reason Forge can treat Claude, Codex, and Gemini as interchangeable execution units.

## Running Multi-Agent

Three modes, each for a different workflow:

```bash
# Interactive dashboard with native agent TUIs
forge dashboard --pty

# Headless autonomous execution
forge run

# CEO mode: loop until every task is complete
forge start --loop
```

**`forge dashboard`** (without `--pty`) shows piped text output from agents. Useful for logging, but you cannot interact with the agents.

**`forge dashboard --pty`** is Stargate mode. Each agent runs in a real PTY session with full terminal emulation. You see Claude's actual TUI, Codex's actual REPL, Gemini's actual interface. Press `Tab` to switch panes, `i` to attach and type directly into an agent, `Esc` to detach.

**`forge run`** runs tasks headlessly with no TUI. Agents execute as subprocesses. Output is captured. Good for CI/CD pipelines and unattended builds.

**`forge start --loop`** runs all pending tasks, then loops back and picks up any newly created tasks until the entire plan is complete.

**Auth modes.** Claude supports two auth modes: `api` (uses your API key) and `subscription` (uses your Pro/Team subscription). Subscription mode works but Anthropic may restrict third-party orchestration of subscription accounts. The dashboard shows a risk warning. Configure with `forge config claude.auth api` or pass `--i-accept-subscription-risk` to proceed.

## The Three Phases

Every task plan follows three phases:

| Phase | ID Prefix | Purpose |
|-------|-----------|---------|
| Build | T-xxx | Implement the feature |
| Verify | V-xxx | Test and validate the build output |
| Fix | F-xxx | Fix issues found during verification |

The dashboard auto-transitions between phases. When all T-xxx tasks complete, `forge verify` generates V-xxx verification tasks. When verification surfaces issues, F-xxx fix tasks are created. The cycle continues until the plan is clean.

This is not manual. The orchestrator manages phase transitions, task creation, and agent dispatch automatically.

A typical flow: `forge plan --generate` creates T-001 through T-012. The dashboard runs them in dependency order across three agents. Once all T-xxx tasks are done, `forge verify` creates V-001 through V-012. Codex runs verification (it is good at test execution and code review). V-003 fails — a test is missing. The orchestrator creates F-001 to fix it. Claude picks up F-001, writes the test, and completes. The plan is clean.

## Watching It Work

<!-- VISUAL: D-02 -- forge-dashboard-pty.gif -->

In the Stargate dashboard you see:

- **Task board** (left) showing all tasks with status, assignment, and dependencies
- **Agent panes** (right) showing live terminal output from each tool
- **Event log** (bottom) with a real-time audit trail of claims, completions, and errors
- **Health score** in the header, updating as tasks complete

The orchestration cycle works like this:

1. Forge spawns the agent's TUI in a PTY session with full vt100 terminal emulation
2. It polls the PTY output every 200ms, watching for the agent's ready pattern
3. When the pattern appears, Forge waits 300ms (grace period), then types the task prompt
4. Text and Enter are separate PTY writes — combining them corrupts input in some terminal emulators
5. The ready pattern disappears as the agent starts working
6. When the pattern reappears (the agent is idle again), Forge marks the task complete
7. The next eligible task is dispatched to the same agent or a different one

The completion detection requires the pattern to disappear before reappearance counts. This prevents false positives when prompt text is still sitting in the buffer.

Rate limiting is handled automatically. If an agent hits a provider rate limit (detected via patterns like `rate_limit_error`, `429`, or `quota exceeded`), Forge backs off exponentially and retries, up to five attempts before marking the task as failed.

## Next Steps

- [AI Brain Configuration](C-07-brain-config.md) — Rule-based vs. OpenAI, setting API keys
- [CLI Commands Reference](C-10-cli-commands.md) — All orchestrator commands in detail
- [MCP Tools Reference](C-12-mcp-tools.md) — 17 tools across both MCP servers
