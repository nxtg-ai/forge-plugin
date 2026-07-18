# MCP Tools Reference

Forge exposes tools via two MCP servers that connect automatically when the plugin loads. Together they provide 18 tools: 8 governance tools (Node.js) and 10 orchestration tools (Rust). You do not call these tools directly -- agents, hooks, and commands invoke them behind the scenes.

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
| `forge_set_project` | Orchestrator | Switch which .forge/ directory is active |

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

List all saved governance checkpoints with their names and creation dates. Checkpoints are snapshots of governance state created by `/forge:checkpoint`.

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

Runtime: Rust binary (`forge mcp`). Transport: stdio. Available when the `forge` binary is installed and in PATH.

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

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Absolute path to the project root (must contain a `.forge/` directory) |

**Returns:** Confirmation of the project switch, or an error if no `.forge/` directory exists at the path.

---

## How They Connect

The plugin's `.mcp.json` registers both servers as stdio transports:

```json
{
  "governance-mcp": {
    "type": "stdio",
    "command": "bash",
    "args": ["${CLAUDE_PLUGIN_ROOT}/servers/governance-mcp/start.sh"]
  },
  "orchestrator-mcp": {
    "type": "stdio",
    "command": "bash",
    "args": ["-c", "command -v forge >/dev/null 2>&1 && exec forge mcp || exit 0"]
  }
}
```

When Claude Code loads the plugin, it automatically connects to both servers. The governance-mcp server is always available because it ships with the plugin as a Node.js module. The orchestrator-mcp server is available only when the `forge` binary is installed and in PATH -- if the binary is not found, the connection exits silently and orchestrator tools are simply unavailable.

This is the "Lego Snap" (N-12): L1 users get the 8 governance tools out of the box. When they upgrade to L2 by installing the `forge` binary, the 10 orchestrator tools appear automatically on the next session -- no configuration needed.

---

## When Tools Are Called

Users do not invoke MCP tools directly. Agents, hooks, and commands call them automatically based on context:

**Governance tools are called when:**
- The `guardian` agent runs a pre-commit quality check (calls `forge_get_governance_health`, `forge_security_scan`)
- `/forge:status` displays project health (calls `forge_get_governance_health`, `forge_get_git_status`, `forge_get_code_metrics`)
- `/forge:dashboard` opens the visual dashboard (calls `forge_open_dashboard`)
- The `pre-task.sh` hook syncs state at session start (calls `forge_get_governance_state`)

**Orchestrator tools are called when:**
- The `orchestrator` agent assigns work to sub-agents (calls `forge_get_tasks`, `forge_claim_task`)
- An agent finishes a task (calls `forge_complete_task` with a result summary)
- `/forge:status-enhanced` shows the full task board (calls `forge_get_tasks`, `forge_get_state`)
- The `learning` agent captures a decision or pattern (calls `forge_capture_knowledge`)
- `/forge:gap-analysis` checks for vision drift (calls `forge_check_drift`)

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

When `/forge:status` runs at L1 (no `forge` binary) it calls `forge_get_governance_health`; at L2 it also calls the orchestrator's `forge_get_health` for the drift/governance dimensions. When `forge status` runs from the CLI, it uses the orchestrator version. See [Health Scoring](C-14-health-scoring.md) for the full scoring methodology.
