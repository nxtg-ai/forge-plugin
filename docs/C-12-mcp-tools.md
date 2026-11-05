# MCP Tools Reference

Forge exposes tools via two MCP servers: 8 governance tools (Node.js) from the `nxtg-forge` plugin, and 12 orchestration tools (Rust) from the companion plugin `nxtg-forge-orchestrator`, which needs the `forge` binary. You do not call these tools directly -- agents and commands invoke them.

---

## Overview

| Tool | Server | Purpose |
|------|--------|---------|
| `forge_get_governance_health` | Governance | Project health score (0-100) with letter grade |
| `forge_get_governance_state` | Governance | Read governance.json (vision, goals, quality gates) |
| `forge_get_git_status` | Governance | Branch, commits, modified/untracked file counts |
| `forge_get_code_metrics` | Governance | Source files, test files, coverage, largest files |
| `forge_run_tests` | Governance | Detect runner and execute test suite |
| `forge_list_checkpoints` | Governance | List saved governance snapshots |
| `forge_security_scan` | Governance | Scan for secrets, eval(), .env in git, npm audit |
| `forge_open_dashboard` | Governance | Generate HTML dashboard and open in browser |
| `forge_get_tasks` | Orchestrator | List tasks with status, assignments, dependencies |
| `forge_claim_task` | Orchestrator | Claim a task for an agent, lock files |
| `forge_complete_task` | Orchestrator | Mark task done, unlock files, log event |
| `forge_get_state` | Orchestrator | Full orchestration state (project info, locks, summary) |
| `forge_get_plan` | Orchestrator | Read the master plan (plan.md) |
| `forge_capture_knowledge` | Orchestrator | Capture a learning, decision, or pattern |
| `forge_get_knowledge` | Orchestrator | Query or search the knowledge base |
| `forge_check_drift` | Orchestrator | Compare completed work against SPEC.md vision |
| `forge_get_health` | Orchestrator | Governance health check (5 dimensions + drift) |
| `forge_get_events` | Orchestrator | Query the event log (recent events, optional filters) |
| `forge_create_task` | Orchestrator | Create one pending task from a title and description |
| `forge_set_project` | Orchestrator | Switch which .forge/ directory is active (refused when the project is bound) |

The two servers each expose a health tool with a **different name**: the Governance (plugin) server's `forge_get_governance_health` (0-100 code-quality score) and the Orchestrator (Rust) server's `forge_get_health` (5-dimension governance check + drift). They are distinct tools, not a name collision. See the note at the bottom of this page and [Health Scoring](C-14-health-scoring.md) for details.

---

## Governance MCP (Plugin)

Runtime: Node.js (index.mjs). Transport: stdio. Always available when the plugin is installed.

This server reads directly from the project filesystem. It does not require a `.forge/` directory and works on any codebase.

### forge_get_governance_health

Get the project health score (0-100) with a letter grade and detailed check results. Evaluates governance files, git cleanliness, test coverage, documentation, type safety, file sizes, and security. (This is the plugin's Node tool — distinct from the Orchestrator's `forge_get_health` below.)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** Health score (0-100), letter grade (A-F), individual check results with pass/fail status and point values.

### forge_get_governance_state

Read the project's `governance.json` file. Contains project name, vision, goals, workstreams, quality gates, and session metrics.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** The full governance.json object, or an error if the file does not exist.

### forge_get_git_status

Get git repository status: current branch, total commit count, last commit message, counts of modified/untracked/staged files, and top contributors.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** Branch name, commit count, last commit info, file change counts, contributor list.

### forge_get_code_metrics

Get code metrics: source file count, test file count, test coverage percentage, total lines of code, largest files by line count, and dependency counts from package manifests.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** File counts, line totals, test ratio, largest files, dependency counts.

### forge_run_tests

Detect the test runner (vitest, jest, or pytest) and execute the test suite. May take up to 60 seconds for large suites.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** Pass/fail counts, raw test output, runner detected.

### forge_list_checkpoints

List all saved governance checkpoints with their names and creation dates. Checkpoints are snapshots of governance state created by `/nxtg-forge:checkpoint`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** Array of checkpoint entries with name and timestamp.

### forge_security_scan

Scan for security issues: hardcoded secrets (API keys, tokens), `eval()` usage, `.env` files tracked in git, and npm audit vulnerabilities.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** Findings grouped by category (secrets, eval, env-files, npm-audit) with file locations.

### forge_open_dashboard

Generate a standalone HTML governance dashboard and open it in the default browser. The dashboard visualizes health score, code metrics, git status, security findings, and checkpoints.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** File path to the generated HTML dashboard.

---

## Orchestrator MCP (Rust)

Runtime: Rust binary (`forge mcp`). Transport: stdio. Registered by the companion plugin `nxtg-forge-orchestrator` (`claude plugin install nxtg-forge-orchestrator@nxtg-forge`); available when that plugin and the `forge` binary are both installed.

This server reads from the `.forge/` directory. The project must be initialized with `forge init` before these tools work.

### forge_get_tasks

List all tasks with their current status, assignments, and dependencies. Optionally filter by status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `pending`, `assigned`, `in_progress`, `completed`, `failed`, `blocked` |

**Returns:** Task count and array of task objects (id, title, description, status, assigned_to, depends_on, locked_files, acceptance_criteria).

### forge_claim_task

Claim a task for an agent. Sets the task status to assigned, locks associated files for exclusive access, and logs the event. Checks dependencies and file conflicts before claiming.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID (e.g., `T-001`) |
| `agent` | string | Yes | Agent claiming the task: `claude`, `codex`, or `gemini` |

**Returns:** Confirmation with task ID, agent name, and list of locked files. Returns an error if the task is not pending, has unmet dependencies, or has file conflicts with another task.

### forge_complete_task

Mark a task as completed. Unlocks files, logs the completion event, refreshes task summary, and reports any tasks that are newly unblocked.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID (e.g., `T-001`) |
| `result_summary` | string | No | Brief summary of what was accomplished (defaults to "Task completed") |

**Returns:** Completion confirmation. If other tasks were waiting on this one, lists the newly available tasks.

### forge_get_state

Get the full orchestration state: project metadata, configured AI tools, task summary counts, active file locks, and scheduler configuration.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** The complete `.forge/state.json` object.

### forge_get_plan

Read the master plan (plan.md). Shows the task board with all tasks, their dependencies, and assignments.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** The full plan.md content, or a message suggesting `forge plan --generate` if no plan exists.

### forge_capture_knowledge

Capture a piece of knowledge. Auto-classifies into research, decision, learning, or pattern using the configured brain (rule-based heuristics or OpenAI). Logs the capture event.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Short title for this knowledge entry |
| `content` | string | Yes | The knowledge content to capture |
| `category` | string | No | Override auto-classification: `research`, `decisions`, `learnings`, `patterns` |
| `source` | string | No | Where this knowledge came from (e.g., "code review", "debugging session") |
| `task_id` | string | No | Related task ID (e.g., `T-001`) |
| `tags` | string[] | No | Tags for easier search |

**Returns:** Captured entry ID, category, and title.

### forge_get_knowledge

Query the knowledge base. List entries by category, search by keyword, or optionally generate SKILL.md files from captured knowledge.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category: `research`, `decisions`, `learnings`, `patterns` |
| `query` | string | No | Search keyword (searches titles, content, and tags) |
| `generate_skills` | boolean | No | If true, also generate SKILL.md files from knowledge entries |

**Returns:** Entry count and array of knowledge entries (id, category, title, content, tags, source, task_id, created_at).

### forge_check_drift

Check if completed work is drifting from the project vision. Compares completed tasks against SPEC.md using the configured brain.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** Vision alignment score, explanation, completed/total task counts, and summary. Returns a note if no SPEC.md or plan.md exists.

### forge_get_health (Orchestrator)

Run a comprehensive governance health check across 5 dimensions: documentation quality, architecture adherence, task health, knowledge coverage, and drift detection. Logs the check as a governance event.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | No input parameters |

**Returns:** Health score (0-100), summary, detailed findings (category, severity, message, suggestion), and drift report.

### forge_set_project

Switch the active project directory. All subsequent orchestrator tool calls will use the `.forge/` directory at the new path. The target directory must already be initialized with `forge init`.

The server refuses this tool when the project is bound explicitly with `--project` or `FORGE_PROJECT_ROOT`. The companion plugin always sets `FORGE_PROJECT_ROOT`, so under Claude Code the call returns an error and the project stays the one the session started in.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Absolute path to the project root (must contain a `.forge/` directory) |

**Returns:** Confirmation of the project switch, or an error if no `.forge/` directory exists at the path or the project is bound.

### forge_get_events

Query the event log.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `count` | integer | No | Number of events to return (default: 50) |
| `task_id` | string | No | Filter by task ID (e.g., `T-001`) |
| `event_type` | string | No | Filter by event type (e.g., `task_completed`, `knowledge_captured`) |

### forge_create_task

Create one pending task. Returns its `task_id` for `forge_claim_task` and `forge_complete_task`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Short one-line title (max 200 characters) |
| `description` | string | Yes | What the task must achieve |

---

## How They Connect

The `nxtg-forge` plugin's `.mcp.json` registers `governance-mcp` and `semgrep-mcp`. The orchestrator server is registered by the companion plugin `nxtg-forge-orchestrator`, in its own `.mcp.json`:

```json
{
  "orchestrator-mcp": {
    "type": "stdio",
    "command": "bash",
    "args": ["${CLAUDE_PLUGIN_ROOT}/servers/orchestrator-mcp/start.sh"],
    "env": { "FORGE_PROJECT_ROOT": "${CLAUDE_PROJECT_DIR}" }
  }
}
```

The governance-mcp server is available whenever the plugin is installed and Node.js 20+ is present. The companion's `start.sh` finds the `forge` binary and runs `forge mcp`; if it is not found, a stand-in server starts that explains how to install it, and the orchestrator tools are unavailable.

L1 users get the 8 governance tools out of the box. For L2, install the `forge` binary (`curl -fsSL https://forge.nxtg.ai/install.sh | sh`) and the companion plugin (`claude plugin install nxtg-forge-orchestrator@nxtg-forge`), then start a new session: the 12 orchestrator tools appear.

---

## When Tools Are Called

Users do not invoke MCP tools directly. Agents, hooks, and commands call them automatically based on context:

**Governance tools are called when:**
- `/nxtg-forge:status` displays project health (its script uses the same function as `forge_get_governance_health`)
- `/nxtg-forge:dashboard` opens the visual dashboard (calls `forge_open_dashboard`)

**Orchestrator tools are called when:**
- The `orchestrator` agent assigns work to sub-agents (calls `forge_get_tasks`, `forge_claim_task`)
- An agent finishes a task (calls `forge_complete_task` with a result summary)
- `/nxtg-forge:status-enhanced` shows the full task board (calls `forge_get_tasks`, `forge_get_state`)
- `/nxtg-forge:gap-analysis` checks for vision drift (calls `forge_check_drift`)

---

## Two Health Tools

Each server has its own health tool — **different names, different focus** (`forge_get_governance_health` on the plugin, `forge_get_health` on the orchestrator). They are not a name collision:

| Aspect | Governance (Plugin) — `forge_get_governance_health` | Orchestrator (Rust) — `forge_get_health` |
|--------|-------------------|-------------------|
| **Focus** | Code quality | Project governance |
| **Checks** | Git cleanliness, test coverage, file sizes, security, type safety, documentation files | Documentation quality, architecture adherence, task health, knowledge coverage, drift detection |
| **Reads from** | Filesystem directly (git, package.json, source files) | `.forge/` directory (state.json, tasks/, knowledge/, SPEC.md) |
| **Requires** | Any codebase | `forge init` (initialized project) |
| **Score** | 0-100 with letter grade (A-F) | 0-100 with dimensional breakdown |

`/nxtg-forge:status` computes its score with the same function that serves `forge_get_governance_health`; when the orchestrator is connected it also calls `forge_get_health` and `forge_check_drift` for an optional metrics table. From the CLI, `forge doctor` reports the orchestrator's health verdict; `forge status` shows no health score. See [Health Scoring](C-14-health-scoring.md) for the full scoring methodology.
