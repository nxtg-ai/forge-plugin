# CLI Commands Reference

All commands provided by the `forge` binary (forge-orchestrator). Run `forge --help` for the full list.

**Global flag**: `--project <path>` — Set the project root. Defaults to the current directory.

---

## forge init

Initialize Forge in a project. Creates the `.forge/` directory with state, event log, and knowledge base. Auto-detects installed AI tools via PATH scanning: `claude`, `codex`, and `agy` (Antigravity, driven by the Gemini adapter). Git is optional: init records whether `.git` exists and continues without it.

```bash
forge init
forge init --name "my-project"
```

| Flag | Description |
|------|------------|
| `-n, --name <name>` | Project name (auto-detected from directory if omitted) |

**What it creates:**
```
.forge/
├── .gitignore       # Ignores worktrees/ and results/
├── state.json       # Project metadata, detected tools, agent config
├── governance.json  # Empty governance scaffold (constitution, workstreams, audit trail)
├── plan.md          # Plan template (only when there is no SPEC.md)
├── events.jsonl     # Append-only audit log
├── tasks/           # Task files
├── knowledge/       # decisions/, learnings/, research/, patterns/
└── results/         # Agent run results
```

**Next steps shown after init:**
1. `forge config brain openai` — configure the AI brain
2. `forge plan --generate` — generate tasks from your spec
3. `forge status` — see the task board

---

## forge config

Get or set configuration values.

```bash
forge config                       # Show current config
forge config brain openai          # Set AI brain to OpenAI
forge config brain rule-based      # Set AI brain to free heuristics
forge config brain.model gpt-4.1   # Set specific model
forge config claude.auth api       # Set Claude to API mode
forge config claude.auth subscription  # Set Claude to subscription mode
```

| Argument | Description |
|----------|------------|
| `<key>` | Config key (e.g., `brain`, `brain.model`, `claude.auth`). Omit to show config. |
| `<value>` | Value to set |

**Brain options:**
- `rule-based` — Free heuristic engine. No API key needed. Uses keyword analysis for task planning.
- `openai` — OpenAI API. Models: `gpt-4o`, `gpt-4.1` (default), `gpt-5`, `gpt-5-mini`. Requires `OPENAI_API_KEY` in environment or `.env` file.

---

## forge plan

Show or generate the master plan. Reads your SPEC.md (or README/project context) and decomposes it into dependency-aware tasks.

```bash
forge plan                         # Show current plan
forge plan --generate              # Generate plan from SPEC.md
forge plan --generate --spec path/to/spec.md  # Custom spec file
forge plan --from-findings         # Generate fix tasks from UAT findings
```

| Flag | Description |
|------|------------|
| `-g, --generate` | Generate plan from spec file |
| `-s, --spec <path>` | Path to spec file (defaults to SPEC.md in project root) |
| `--from-findings` | Generate fix tasks from UAT findings in `.forge/findings/` |

**Generated tasks have:**
- Unique IDs (T-001, T-002, ...)
- Dependency chains (`depends_on`)
- File assignments (`locked_files`)
- Task types (design, implement, review, test, document)
- Acceptance criteria

---

## forge status

Show the task board and agent activity. It shows no health score; use `forge doctor` for health.

```bash
forge status                       # Default: 5 recent events
forge status --events 20           # Show 20 recent events
```

| Flag | Description |
|------|------------|
| `-e, --events <n>` | Number of recent events to show (default: 5) |
| `--budget` | Show the context-budget HUD (per-pane ctx% and PREP/COMPACT/STOP) instead |
| `--json` | With `--budget`: machine-readable JSON |
| `--all` | With `--budget`: include panes with no ctx gauge |

**Output includes:**
- Task board with status, assignment, and dependencies
- Agent activity (which tool is working on what)
- File lock state
- Recent event log

---

## forge run

Execute tasks. Can run a single task with a specific agent, or run all tasks autonomously in parallel.

```bash
forge run                                  # Autonomous mode: all tasks, 3 parallel
forge run --parallel 5                     # Autonomous mode: 5 parallel tasks
forge run --dry-run                        # Show what would run without executing
forge run --task T-001 --agent claude      # Single task mode
```

| Flag | Description |
|------|------------|
| `-t, --task <id>` | Task ID (e.g., T-001). Omit for autonomous mode. |
| `-a, --agent <name>` | Agent name (claude, codex, gemini). Required with `--task`; omit both for autonomous mode. |
| `-p, --parallel <n>` | Max parallel tasks in autonomous mode (default: 3) |
| `--dry-run` | Show what would run without executing |

**Modes:**
- **Single task**: Specify both `--task` and `--agent`. Runs one task with one agent.
- **Autonomous**: Omit both. Forge assigns tasks to available agents, respects dependencies, manages file locks, and runs in parallel.

---

## forge dashboard

Live TUI dashboard with task board, agent output panes, and event log.

```bash
forge dashboard                    # Text output mode
forge dashboard --pty              # Stargate PTY mode (interactive agent TUIs)
forge dashboard --watch            # Watch mode (display only, no execution)
forge dashboard --parallel 5       # Run up to 5 agents simultaneously
```

| Flag | Description |
|------|------------|
| `--pty` | Enable Stargate PTY mode — agents render with full terminal interactivity |
| `-w, --watch` | Watch mode: display tasks without auto-executing |
| `-p, --parallel <n>` | Max parallel agent tasks (default: 3) |
| `--i-accept-subscription-risk` | Bypass subscription risk warning |

**Stargate PTY mode** (`--pty`):
Each agent pane shows the agent's actual TUI (Claude's interactive mode, Codex's REPL, Antigravity `agy` for the Gemini adapter). Full terminal emulation via vt100. Navigate with:
- `Tab` / `Shift+Tab` — cycle between panes
- `i` — attach to focused pane (type directly into agent)
- `Esc` — detach from pane
- `f` — expand/collapse pane
- `q` — quit dashboard

**Subscription risk warning**: If Claude is configured for subscription auth (not API), the dashboard shows a warning. Anthropic may block third-party orchestration of subscription accounts. Use `forge config claude.auth api` or pass `--i-accept-subscription-risk` to proceed.

---

## forge start

Start autonomous orchestration. Runs all tasks with auto-claim and auto-complete.

```bash
forge start                                # Run all pending tasks
forge start --agent claude                 # Only run Claude-assigned tasks
forge start --loop                         # CEO Mode: loop until all complete
```

| Flag | Description |
|------|------------|
| `-a, --agent <name>` | Only run tasks for a specific agent |
| `-l, --loop` (alias: `--ceo`) | Loop until all tasks complete (re-runs after each pass) |
| `--i-accept-subscription-risk` | Bypass subscription risk warning |

---

## forge sync

Reconcile state. Updates summaries, renders adapter config files (CLAUDE.md, AGENTS.md, GEMINI.md), and runs governance checks.

```bash
forge sync
```

Run this after manual changes to tasks or state to ensure everything is consistent.

---

## forge verify

Generate verification subtasks for completed build tasks. Creates V-xxx tasks that validate the output of T-xxx build tasks.

```bash
forge verify
```

Part of the full lifecycle pipeline: BUILD (T-xxx) → VERIFY (V-xxx) → UAT (U-xxx) → SHIP.

---

## forge uat

Interactive UAT (User Acceptance Testing). Opens a TUI for capturing findings, or accepts inline input.

```bash
forge uat                          # Open interactive UAT TUI
forge uat "Button color is wrong"  # Quick capture: inline finding
```

| Argument | Description |
|----------|------------|
| `<finding>` | Quick-capture a finding inline without opening the TUI |

Findings are stored in `.forge/findings/` as JSON with severity classification.

---

## forge ship

Post-UAT wrap-up. Checks release debt, generates a changelog, suggests a version bump, archives build artifacts, and cleans state for the next cycle.

```bash
forge ship                         # Interactive — walks through each step
forge ship --auto                  # Non-interactive — auto-approve all steps
forge ship --dry-run               # Show what would happen, don't execute
```

| Flag | Description |
|------|------------|
| `--auto` | Auto-approve all steps (non-interactive) |
| `--dry-run` | Preview without executing |

**What it does (in order):**

0. **Release preflight** — checks that version surfaces agree (the same check as `forge doctor`); a FAIL stops the ship
1. **Changelog** — generates entries from completed tasks in Keep-a-Changelog format and inserts them into `CHANGELOG.md` if it exists
2. **Version bump suggestion** — prints a suggested semver bump; it changes no file
3. **Archive** — moves `.forge/tasks/`, `results/` and `signals/` to `.forge/archive/{date}/` and copies `events.jsonl` there
4. **Clean state** — with `--auto`, resets the task summary, phase and locks in `state.json`; without it, prints how to run it

After `forge ship`, your project is clean and ready for the next `forge plan --generate` cycle.

---

## forge mcp

Start the MCP server via stdio transport. AI tools connect to this to query and update orchestration state.

```bash
forge mcp
```

This is typically not run directly. The companion plugin `nxtg-forge-orchestrator` starts it when Claude Code loads that plugin and `forge` is installed. The `nxtg-forge` plugin does not register it. Install the companion with `claude plugin install nxtg-forge-orchestrator@nxtg-forge`.

**Tools exposed (12)**: `forge_get_tasks`, `forge_claim_task`, `forge_complete_task`, `forge_create_task`, `forge_get_state`, `forge_get_plan`, `forge_get_events`, `forge_capture_knowledge`, `forge_get_knowledge`, `forge_check_drift`, `forge_get_health`, `forge_set_project`.

See [MCP Tools Reference](C-12-mcp-tools.md) for input/output schemas.

---

## forge doctor

Aggregate health verdict: quality gates, release debt and drift, in one fail-closed exit code. Flags: `--strict` (a WARN also exits non-zero), `--json` (schema `forge.doctor.report.v1`).

## forge pod

Declarative tmux pod management (Unix only): `forge pod start|stop|list|validate|show|state|ps|gc|reload|completions|preflight <...>`. Run `forge pod --help` for each verb.

## forge uninstall

Removes the `forge` binary. `--force` also removes `.forge/` in the current project and `~/.forge/`.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Required for `brain openai` mode |
| `FORGE_PROJECT_ROOT` | Override project root detection |
| `NO_COLOR` | Disable colored output |

Environment variables can also be set in `.env` (project root), `~/.forge/.env` (global), or the system environment.
