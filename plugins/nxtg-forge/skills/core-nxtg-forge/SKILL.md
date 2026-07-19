---
name: Core NXTG-Forge
description: >
  Ground truth for the NXTG-Forge platform — the real forge CLI subcommands, the /forge:*
  slash commands, the .forge/state.json + events.jsonl model, both MCP servers (Rust
  orchestrator + Node governance), the agent roster, and the security hooks. Use when working
  inside or on NXTG-Forge (the forge-plugin, forge-orchestrator, or forge-ui repos), when a
  user asks "what does forge <x> do", how state/checkpoints/drift work, which MCP tool to call,
  which agent to invoke, or when a task references `forge init/plan/run/status`, `/forge:...`,
  `.forge/`, governance health, or the two forge MCP servers.
when_to_use: >
  Triggers: "forge init / plan / run / status / start / verify / ship", "/forge:...",
  ".forge/state.json", "forge_get_state / forge_check_drift / forge_get_health",
  "governance-mcp vs orchestrator-mcp", "which forge agent", "how do checkpoints work",
  "forge governance score", "NXTG-Forge architecture".
user-invocable: false
allowed-tools: Read, Grep, Glob, Bash(forge *), Bash(git *)
---

# NXTG-Forge — Platform Ground Truth

NXTG-Forge is a governance-native AI development system with three independent repos wired only
through MCP (no shared code). This skill is the authoritative map; verify against source before
asserting behavior, because earlier docs invented CLI that never shipped (see Gotchas).

| Repo | What it is | Integration |
|------|-----------|-------------|
| `forge-orchestrator` | Rust binary `forge` (CLI + stdio MCP server, ~4 MB) | orchestrator-mcp (Rust) |
| `forge-plugin` | Pure-markdown Claude Code plugin — commands, agents, skills, hooks + a Node MCP server | governance-mcp (Node) |
| `forge-ui` | Vite 7 + React 19 dashboard on :5050 | spawned by `/forge:dashboard` |

## The `forge` CLI (forge-orchestrator binary)

These are the ONLY real subcommands (source: `forge-orchestrator/src/main.rs`, `src/cli/`):

```bash
forge init [name]      # Initialize .forge/, detect AI tools on PATH, write state.json
forge plan             # Generate task plan from SPEC.md
forge status [--events]# Task board / project state (zero-context-friendly recovery view)
forge run              # Execute planned tasks autonomously
forge start            # Interactive/guided run
forge verify           # Run verification gate
forge uat [finding]    # Record/inspect UAT findings
forge sync             # Sync state with disk (task files ↔ state.json)
forge mcp              # Start the stdio MCP server (JSON-RPC 2.0). No subcommands.
forge dashboard        # Launch the TUI (ratatui) dashboard
forge ship [--auto] [--dry-run]  # Ship gate
forge config <key> [value]       # Read/write config
forge uninstall [--force]
```

There is **no** `forge checkpoint`, `forge restore`, `forge recovery`, `forge feature`,
`forge health`, `forge gap-analysis`, `forge quality`, `forge generate`, or `forge spec`
binary subcommand. Those verbs exist only as `/forge:*` slash commands (below).

## `/forge:*` Slash Commands (forge-plugin, 23 total)

Loaded by Claude Code from `commands/*.md`. Invoke as `/forge:<name>`. Each is a markdown
prompt with `disable-model-invocation: true` (won't auto-fire; user must type it).

| Group | Commands |
|-------|----------|
| Governance | `/forge:init` `/forge:status` `/forge:status-enhanced` `/forge:gap-analysis` `/forge:compliance` `/forge:command-center` |
| Feature dev | `/forge:feature` `/forge:spec` `/forge:agent-assign` `/forge:integrate` |
| Quality | `/forge:test` `/forge:deploy` `/forge:optimize` `/forge:update` |
| State | `/forge:checkpoint` `/forge:restore` `/forge:report` |
| Docs | `/forge:docs-status` `/forge:docs-update` `/forge:docs-audit` |
| Loop | `/forge:ceo-loop` `/forge:ceo-loop-cancel` |
| Dashboard | `/forge:dashboard` |

`/forge:checkpoint` args: `[save|restore|list] [name]`. `/forge:status` args: `[--json] [--verbose]`.

## State Model — `.forge/state.json`

State lives in **`.forge/`** (NOT `.claude/`). Written/read by `StateManager`
(`forge-orchestrator/src/core/state.rs`). Real `ForgeState` fields:

```jsonc
{
  "version": "…",                 // schema version
  "project_name": "my-app",
  "created_at": "…", "updated_at": "…",  // updated_at bumps on every write
  "tools": [ { "name": "claude", "agent_type": "…", "version": "…",
              "path": "/usr/…", "available": true } ],  // AI CLIs found on PATH
  "brain": { "provider": "rule-based", "model": null },  // or "openai" + model
  "task_summary": { … },          // cached counts by status
  "active_locks": { "<taskId>": { … } },  // per-task file locks (concurrent-edit guard)
  "agent_auth": {}, "agent_permissions": {},  // "subscription"|"api" / "safe"|"yolo"
  "git": {}, "scheduler": {},
  "dashboard_mode": "piped",      // or "pty" (Stargate)
  "current_phase": "build"        // "build"|"verify"|"complete", optional
}
```

`state.json` is a **fast-read cache**; the append-only **`.forge/events.jsonl`** is the audit
trail of truth (`src/core/event.rs`). `forge sync` reconciles the cache from task files on disk.

## MCP Servers — Two of them, both prefix tools `forge_*`

Claude Code connects to both simultaneously (`.mcp.json`). They overlap conceptually but run
independently. **Do not assume a `forge_*` tool comes from one server.** The health tools are the
classic trap: the two servers each expose a health tool with a **different name** —
`forge_get_health` (orchestrator, Rust, L2) and `forge_get_governance_health` (governance-mcp,
Node, always available). There is no `forge_get_health` on the Node server.

**orchestrator-mcp** (Rust, from `forge` binary — degrades gracefully if `forge` not installed):
`forge_init`, `forge_set_project`, `forge_get_state`, `forge_get_plan`, `forge_get_tasks`,
`forge_claim_task`, `forge_complete_task`, `forge_capture_knowledge`, `forge_get_knowledge`,
`forge_check_drift`, `forge_get_health`, `forge_get_events`.

**governance-mcp** (Node, ships with the plugin — always available, `servers/governance-mcp/index.mjs` v3.8.0):
`forge_get_governance_health`, `forge_get_governance_state`, `forge_get_git_status`,
`forge_get_code_metrics`, `forge_run_tests`, `forge_list_checkpoints`, `forge_security_scan`,
`forge_open_dashboard`.

Checkpoints and drift are the recovery backbone: `forge_check_drift` (orchestrator) detects
divergence from plan; `forge_list_checkpoints` (governance) enumerates saved snapshots.

## Agents (forge-plugin, 33 in `agents/*.md`)

Two distinct sets — do not conflate them:

- **Plugin agents** (`agents/*.md`, invoked via the Task tool / auto-delegation): `planner`,
  `builder`, `guardian`, `security`, `testing`, `performance`, `orchestrator` (opus), `detective`,
  `refactor`, `devops`, `api`, `database`, `ui`, `docs`, `analytics`, `compliance`, `integration`,
  `learning`, `release-sentinel` (opus), `governance-verifier`, `oracle`, `ceo-loop` (opus),
  `crucible-detective`, plus strategy/growth roles (`product-strategist`, `revenue-architect`,
  `growth-engine`, `scout`, `master-architect`, `design-vanguard`, `wordsmith`,
  `incident-commander`, `dx-engineer`, `qa-sentinel`). Most are `sonnet`; orchestrators are `opus`.
- **Agent-role knowledge skills** (`skills/agent-*`): `agent-lead-architect`, `agent-backend-master`,
  `agent-cli-artisan`, `agent-platform-builder`, `agent-integration-specialist`, `agent-qa-sentinel`,
  `agent-development`. These are the "Lead Architect / Backend Master / …" personas — expertise
  loaded into context, NOT spawnable agents.

## Hooks (13 scripts, `hooks/scripts/`, wired in `hooks.json`)

- **PreToolUse security guards are BLOCKING** (exit 2 = deny): `security-command-guard`,
  `security-secret-shield`, `security-injection-guard`, `security-sql-guard`.
- Everything else is **advisory / non-blocking**: `pre-task` (UserPromptSubmit),
  `post-task`/`audit-root-cleanliness`/`smoke-test-reminder` (Stop),
  `enforce-file-placement`/`governance-check`/`security-semgrep-scan` (PostToolUse).
- `FORGE_QUIET_HOOKS=1` silences `[Info]`/`[Success]`; `FORGE_HOOK_VERBOSE=1` adds diagnostics.

## Governance Health

Two health tools, different servers: the orchestrator's `forge_get_health` returns a 0–100 score
across five governance dimensions incl. drift (see `forge-orchestrator/src/core/governance.rs`);
the plugin's `forge_get_governance_health` (Node, always available) returns its own 0–100 score +
A–F grade from git status, tests, code metrics, docs, and security (see
`servers/governance-mcp/tools.mjs` `getHealthScore`). Read the score, don't guess it — both are
deterministic.

## Worked example — resuming after an interruption ("zero-context recovery")

```text
Goal: pick up work after a cold start, no transcript.
1. forge status --events           # (or /forge:status) → phase, task board, recent events
2. read .forge/state.json          # current_phase, task_summary, active_locks
3. forge_check_drift  (MCP)         # has reality diverged from the plan?
4. forge_list_checkpoints (MCP)     # newest snapshot to restore from if drifted
5. resume the in-progress task; update state via forge run / forge sync
```

The single source of truth is `.forge/state.json` + `.forge/events.jsonl` — read them first,
never reconstruct project state from memory.

## Gotchas

- **State path is `.forge/state.json`, not `.claude/state.json`.** Older docs (and the previous
  version of this skill) said `.claude/` — wrong. `.claude/` holds Claude Code config; `.forge/`
  holds orchestration state.
- **`forge checkpoint`/`restore`/`recovery`/`feature`/`health`/`gap-analysis`/`quality`/`generate`
  are NOT binary subcommands.** They only exist as `/forge:*` slash commands (or MCP tools). Typing
  `forge checkpoint` at a shell fails. Use `/forge:checkpoint` or `forge_list_checkpoints`.
- **Two MCP servers, both use the `forge_*` prefix, and both expose a health tool**
  (`forge_get_health` on Rust, `forge_get_governance_health` on Node). Name-matching a tool to a
  server is unreliable — orchestrator tools need the `forge` binary; governance tools always work.
- **orchestrator-mcp degrades silently if `forge` isn't on PATH.** If `forge_get_tasks` returns
  nothing, confirm the binary is installed before assuming an empty task board.
- **Plugin agents (`planner`, `builder`, …) ≠ agent-role skills (`agent-lead-architect`, …).**
  The "6 role" model in prose maps to the `skills/agent-*` personas, not to spawnable agents.
- **Security PreToolUse hooks are the only blocking hooks.** All Stop/PostToolUse/UserPromptSubmit
  hooks are advisory by design — never make them exit 2 (documented invariant; breaking it wedges
  every prompt).
- **Brain provider matters.** `"rule-based"` is a free deterministic heuristic; `"openai"` needs an
  API key and a `model`. `forge plan`/`run` quality depends on which is configured in `brain`.
- **`updated_at` bumping is not evidence of correct state.** It only means a write happened; verify
  `task_summary`/`current_phase` reflect reality via `forge sync` before trusting the cache.

## Additional resources

- Repo-level maps: `forge-plugin/CLAUDE.md`, workspace `NXTG-Forge/CLAUDE.md`.
- CLI source: `forge-orchestrator/src/main.rs`, `src/cli/`, `src/core/{state,event,task,governance}.rs`.
- MCP source: `forge-orchestrator/src/mcp/tools.rs` (Rust), `forge-plugin/.../servers/governance-mcp/index.mjs` (Node).
- Agent role expertise: the `agent-lead-architect`, `agent-backend-master`, `agent-cli-artisan`,
  `agent-platform-builder`, `agent-integration-specialist`, `agent-qa-sentinel` skills.
