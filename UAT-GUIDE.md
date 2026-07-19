# NXTG-Forge Plugin — UAT Guide

> **Version:** 3.0.0
> **Last Updated:** 2026-02-08
> **Purpose:** Step-by-step guide for testing the NXTG-Forge Claude Code plugin. Describes exactly what to expect at each stage of the user journey.

---

## Table of Contents

1. [Pre-Installation State](#1-pre-installation-state)
2. [Installation](#2-installation)
3. [Post-Installation Verification](#3-post-installation-verification)
4. [Project Initialization](#4-project-initialization-frg-init)
5. [Daily Usage — Commands](#5-daily-usage--commands)
6. [Daily Usage — Agents](#6-daily-usage--agents)
7. [Daily Usage — Skills](#7-daily-usage--skills)
8. [Hooks Behavior](#8-hooks-behavior)
9. [MCP Dashboard (Optional)](#9-mcp-dashboard-optional)
10. [What Lives Where](#10-what-lives-where)
11. [Troubleshooting](#11-troubleshooting)
12. [UAT Checklist](#12-uat-checklist)

---

## 1. Pre-Installation State

Before installing the plugin, verify your starting state.

**Expected state of a clean project:**
```
my-project/
├── src/              # Your source code
├── package.json      # (or equivalent)
├── .claude/          # May or may not exist
│   └── (empty or has settings.json)
└── CLAUDE.md         # May or may not exist
```

**What should NOT exist yet:**
- No `.claude/governance.json`
- No `.claude/agents/` (unless you have your own)
- No `SKILLS.md` or `AGENTS.md` in project root
- No `.claude/forge/` directory

**Verify:**
```bash
ls -la .claude/ 2>/dev/null || echo "No .claude/ directory yet"
ls SKILLS.md AGENTS.md 2>/dev/null || echo "No SKILLS.md or AGENTS.md (correct)"
```

---

## 2. Installation

### Step 2a: Install the Plugin

```bash
# Add the Forge marketplace
claude plugin marketplace add nxtg-ai/forge-plugin

# Install the plugin
claude plugin install nxtg-forge
```

**Expected output:**
- Plugin downloads to `~/.claude/plugins/` (global, not project-level)
- Plugin is registered and enabled

**What changes on disk:**
```
~/.claude/
├── plugins/
│   └── marketplaces/
│       └── nxtg-forge/              # OR claude-code-plugins/
│           └── plugins/
│               └── nxtg-forge/
│                   ├── .claude-plugin/
│                   │   └── plugin.json
│                   ├── commands/     # 23 slash commands
│                   ├── agents/       # 23 agent definitions
│                   ├── skills/       # 32 skill modules
│                   ├── hooks/        # 7 governance hooks
│                   ├── .mcp.json     # MCP server config
│                   └── servers/      # MCP dashboard server
└── settings.json                     # Plugin listed in enabledPlugins
```

**What does NOT change:**
- Your project directory is untouched
- No files are copied into your project
- No `~/.claude/agents/` files are created
- No `SKILLS.md` or `AGENTS.md` are generated

### Step 2b: Verify Plugin is Enabled

```bash
# Check settings
cat ~/.claude/settings.json | grep -A2 "enabledPlugins"
```

**Expected:** You should see `"nxtg-forge"` listed as enabled.

### Step 2c: Restart Claude Code

After installing a plugin, **start a new Claude Code session** for components to load.

```bash
claude  # Start fresh session
```

---

## 3. Post-Installation Verification

In a new Claude Code session, verify components loaded.

### 3a: Commands Available

Type `/forge:` and you should see autocomplete suggestions for all 23 commands:

| Command | What It Does |
|---------|-------------|
| `/forge:init` | Setup wizard |
| `/forge:status` | Project health check |
| `/forge:status-enhanced` | Detailed dashboard |
| `/forge:test` | Run tests |
| `/forge:feature` | Plan features |
| `/forge:spec` | Generate specs |
| `/forge:gap-analysis` | Find gaps |
| `/forge:deploy` | Pre-flight checks |
| `/forge:optimize` | Performance analysis |
| `/forge:checkpoint` | Save state |
| `/forge:restore` | Restore state |
| `/forge:report` | Activity report |
| `/forge:agent-assign` | Assign to agents |
| `/forge:integrate` | Service integration |
| `/forge:update` | Config gap detection |
| `/forge:compliance` | License scanning |
| `/forge:docs-status` | Doc health |
| `/forge:docs-update` | Fix stale docs |
| `/forge:docs-audit` | Full doc audit |
| `/forge:command-center` | Central hub |
| `/forge:dashboard` | Visual dashboard |

**If commands don't appear:** Plugin may not be enabled. Check `~/.claude/settings.json`.

### 3b: Agents Available

Ask Claude: "What agents are available from the forge plugin?"

You should see references to 23 agents including:
- `planner`, `builder`, `guardian`, `security`
- `testing`, `performance`, `detective`, `refactor`
- `orchestrator`, `devops`, `api`, `database`
- `ui`, `docs`, `analytics`, `compliance`
- `integration`, `learning`, `release-sentinel`
- `oracle`, `governance-verifier`, `NXTG-CEO-LOOP`

**Note:** Agents live in the plugin cache directory. They are NOT copied to `~/.claude/agents/` or your project. This is correct behavior.

### 3c: Skills Active

Skills activate automatically based on context. There's no direct way to "list" them, but you can verify by asking Claude about Forge concepts — it should draw on skill knowledge.

### 3d: Hooks Running

When you submit a prompt, you should see hook output in the response:
```
[Info] Pre-task hook triggered
[Success] Config validation passed
[Info] You have uncommitted changes. Consider committing before major tasks.
```

**If you see NO hook output:** Hooks may not have loaded. Check `~/.claude/settings.json` for hook configuration.

---

## 4. Project Initialization (`/forge:init`)

### Step 4a: Run Init

```
/forge:init
```

### Step 4b: Answer Questions

The wizard asks 2-3 questions:
1. **"What are you building?"** — Free text (1-2 sentences)
2. **"What are your top goals?"** — Multi-select (Ship MVP, High test coverage, etc.)
3. **"Proceed?"** — Confirmation

### Step 4c: Verify Created Files

**After init, your project should have:**
```
my-project/
├── .claude/
│   └── governance.json    # NEW — project governance state
├── CLAUDE.md              # NEW or UPDATED — has Forge section
└── (your existing files)
```

**Verify governance.json:**
```bash
cat .claude/governance.json | head -20
```

**Expected structure:**
```json
{
  "version": "3.0.0",
  "project": {
    "name": "your-project-name",
    "type": "detected-type",
    "vision": "what you told the wizard",
    "goals": ["goal1", "goal2"],
    "initialized": "2026-02-08T...",
    "forgeVersion": "3.0.0"
  },
  "workstreams": [],
  "qualityGates": { ... },
  "metrics": { ... }
}
```

**Verify CLAUDE.md has Forge section:**
```bash
grep "NXTG-Forge" CLAUDE.md
```

### What `/forge:init` Does NOT Create

These items are FROM THE PLUGIN and should NOT be in your project:
- `.claude/agents/` — Agents come from the plugin
- `.claude/commands/` — Commands come from the plugin
- `.claude/skills/` — Skills come from the plugin
- `.claude/forge/` — Legacy directory, not used
- `SKILLS.md` — NOT a Forge file
- `AGENTS.md` — NOT a Forge file

**If you see any of these in your project root or `.claude/`, they are NOT from the Forge plugin.** They may be from:
- Cloning the v3 monorepo (which has project-level copies)
- Claude Code itself generating summary files
- Another plugin or manual creation

---

## 5. Daily Usage — Commands

### 5a: Status Check

```
/forge:status
```

**Expected output:** A dashboard showing:
- Git status (branch, uncommitted files, recent commits)
- Test results (pass/fail count)
- TypeScript status (errors)
- Governance state (workstreams, metrics)

### 5b: Feature Development

```
/forge:feature "Add user authentication"
```

**Expected behavior:**
1. Claude analyzes your codebase
2. Creates a feature plan
3. Asks for approval
4. Implements with agent orchestration (planner → builder → tester → guardian)
5. Updates governance.json with the new workstream

### 5c: Gap Analysis

```
/forge:gap-analysis
```

**Expected output:** Analysis across 5 dimensions:
- Test coverage gaps
- Documentation gaps
- Security issues
- Architecture issues
- Performance concerns

### 5d: Checkpoint/Restore

```
/forge:checkpoint "Before refactoring auth"
```

**Creates:** `.claude/checkpoints/{timestamp}.json`

```
/forge:restore
```

**Shows:** List of saved checkpoints to restore from.

---

## 6. Daily Usage — Agents

Agents are invoked automatically by commands or manually via the Task tool.

### How Agents Work

When Claude needs a specialist, it uses the Task tool to spawn an agent:
```
Task tool → selects agent (e.g., security) → Claude loads the agent's .md file → executes with specialized instructions
```

**You don't need to do anything special.** Commands like `/forge:feature` automatically invoke the right agents.

### Manual Agent Assignment

```
/forge:agent-assign "optimize database queries"
```

Claude will:
1. Show the available agent roster
2. Recommend the best agent (e.g., database)
3. Invoke the agent to work on the task

### Where Agents Live (Important!)

| Location | What's There | Why |
|----------|-------------|-----|
| `~/.claude/plugins/.../nxtg-forge/agents/` | 23 agent .md files | Plugin auto-discovery |
| `project/.claude/agents/` | Should be EMPTY for plugin users | Agents come from plugin |
| `~/.claude/agents/` | EMPTY unless you put your own agents here | Global user agents (not from plugin) |

**Key point:** If you don't see agents in your project directory, that's CORRECT. They're loaded from the plugin cache.

---

## 7. Daily Usage — Skills

Skills are **invisible helpers** — they provide knowledge to Claude automatically.

### How Skills Work

When you ask Claude to do something related to security, testing, architecture, etc., it automatically loads the relevant skill from the plugin:

| Context | Skill Loaded |
|---------|-------------|
| Writing tests | `testing-strategy`, `core-testing` |
| Security review | `security` |
| API design | `agent-backend-master` |
| Performance work | `optimization` |
| Git operations | `git-workflow` |

**You don't invoke skills directly.** They activate based on context.

### Verify Skills Are Working

Ask Claude: "What testing strategy should I use for this project?"

If the `testing-strategy` skill is loaded, Claude will reference Forge-specific testing patterns (vitest preference, coverage targets, etc.) rather than generic advice.

---

## 8. Hooks Behavior

Hooks run automatically and are **advisory only** (non-blocking).

### When Hooks Fire

| Event | Hook | What You See |
|-------|------|-------------|
| You submit a prompt | `pre-task.sh` | `[Info] Pre-task hook triggered` + config validation |
| Claude finishes a task | `post-task.sh` | Quality check suggestions |
| Claude writes a file | `enforce-file-placement.sh` | Warning if file is in wrong location |
| Claude edits code | `governance-check.sh` | Advisory code quality feedback |
| Session ends | `audit-root-cleanliness.sh` | Flags unnecessary files in project root |

### Expected Hook Output

After submitting a prompt, you should see something like:
```
[Info] Pre-task hook triggered
[Success] Config validation passed
[Info] You have uncommitted changes. Consider committing before major tasks.
```

**If hooks show warnings about missing directories or tools:** These are advisory. The plugin still works — hooks just provide extra guidance.

### Hooks Are NOT Blocking

If a hook reports an issue, Claude still proceeds with your request. Hooks observe and advise; they never prevent actions.

---

## 9. MCP Dashboard (Optional)

The MCP dashboard provides 8 governance tools and a visual HTML dashboard.

### Requirements

- Node.js 18+ (for MCP server only)
- All other plugin features work without Node.js

### First Use

```
/forge:dashboard
```

**What happens:**
1. MCP server starts (auto-installs `@modelcontextprotocol/sdk` on first run)
2. Generates an HTML dashboard with project metrics
3. Opens the dashboard in your browser

### MCP Tools Available

Once the MCP server is running, these tools are available:
- `forge_get_governance_health` — Health score (0-100, A-F grade)
- `forge_get_governance_state` — Read governance.json
- `forge_get_git_status` — Git branch, commits, working tree
- `forge_get_code_metrics` — File counts, dependencies
- `forge_run_tests` — Auto-detect and run tests
- `forge_list_checkpoints` — List saved checkpoints
- `forge_security_scan` — Security scanning
- `forge_open_dashboard` — Generate HTML dashboard

---

## 10. What Lives Where

This is the most important section for understanding the plugin architecture.

### Global (All Projects)

These come from the plugin and are available in every project:

```
~/.claude/plugins/marketplaces/nxtg-forge/plugins/nxtg-forge/
├── commands/     → 23 slash commands (loaded globally)
├── agents/       → 23 agent definitions (loaded globally)
├── skills/       → 32 knowledge modules (loaded globally)
├── hooks/        → 7 governance hooks (run globally)
└── servers/      → MCP server (available globally)
```

**You don't touch these files.** Plugin updates replace them.

### Per-Project (Created by /forge:init)

These are the ONLY files Forge creates in your project:

```
your-project/
├── .claude/
│   ├── governance.json    # Created by /forge:init
│   └── checkpoints/       # Created by /forge:checkpoint (optional)
└── CLAUDE.md              # Updated by /forge:init
```

**That's it.** If you see other Forge-related files in your project, they shouldn't be there.

### Files That Should NOT Be in Your Project

| File/Directory | Why It Shouldn't Be There |
|---------------|--------------------------|
| `.claude/agents/` | Agents come from the plugin |
| `.claude/commands/` | Commands come from the plugin |
| `.claude/skills/` | Skills come from the plugin |
| `.claude/forge/` | Legacy v2 directory |
| `SKILLS.md` | Not a Forge file |
| `AGENTS.md` | Not a Forge file |
| `.claude/forge/memory/` | Memory is native to Claude Code |

**If you see any of these:** They are NOT from the Forge plugin and can be safely deleted (after checking they're not from another source you need).

---

## 11. Troubleshooting

### "Commands don't show up when I type /forge:"

1. Check plugin is enabled: `cat ~/.claude/settings.json | grep nxtg-forge`
2. Start a new Claude Code session (plugins load on session start)
3. Check plugin directory exists: `ls ~/.claude/plugins/marketplaces/*/plugins/nxtg-forge/`

### "Agents aren't being used"

1. Agents are invoked by commands, not directly by users
2. Try: `/forge:feature "small task"` — this should invoke planner + builder agents
3. Check agents exist: `ls ~/.claude/plugins/marketplaces/*/plugins/nxtg-forge/agents/`

### "Hooks aren't firing"

1. Check hooks.json: `cat ~/.claude/plugins/marketplaces/*/plugins/nxtg-forge/hooks/hooks.json`
2. Ensure bash scripts are executable: `ls -la ~/.claude/plugins/marketplaces/*/plugins/nxtg-forge/hooks/scripts/`
3. Check settings.json for hook configuration

### "I see SKILLS.md or AGENTS.md in my project root"

These are NOT from the Forge plugin. Possible sources:
- Cloned the v3 monorepo (which has project-level copies of everything)
- Claude Code generated summary files
- Another plugin created them
- Manual creation

**Safe to delete** if you're using the plugin (not the monorepo).

### "MCP dashboard doesn't open"

1. Requires Node.js 18+: `node --version`
2. First run installs dependencies (may take 10-30 seconds)
3. On WSL2: Dashboard copies to Windows filesystem and opens via cmd.exe

### "governance.json is huge / bloated"

The sentinel log can accumulate many entries over time. Run:
```
/forge:status
```
This reads but doesn't inflate the file. To clean sentinel logs, you can manually trim the `sentinelLog` array in `.claude/governance.json`.

---

## 12. UAT Checklist

Use this checklist to verify each aspect of the plugin. Mark pass/fail and add notes.

### Phase 1: Installation

| # | Test | Expected | Pass/Fail | Notes |
|---|------|----------|-----------|-------|
| 1.1 | Install plugin | `claude plugin marketplace add nxtg-ai/forge-plugin && claude plugin install nxtg-forge` completes without error | | |
| 1.2 | Plugin in settings | `nxtg-forge` appears in `~/.claude/settings.json` enabledPlugins | | |
| 1.3 | Plugin files exist | `~/.claude/plugins/marketplaces/*/plugins/nxtg-forge/` has commands/, agents/, skills/, hooks/ | | |
| 1.4 | No project pollution | Your project directory has NO new files from installation | | |

### Phase 2: Commands

| # | Test | Expected | Pass/Fail | Notes |
|---|------|----------|-----------|-------|
| 2.1 | `/forge:` autocomplete | Shows list of Forge commands | | |
| 2.2 | `/forge:init` | Wizard asks questions, creates governance.json | | |
| 2.3 | `/forge:status` | Shows project health dashboard | | |
| 2.4 | `/forge:test` | Runs test suite (or reports no tests) | | |
| 2.5 | `/forge:gap-analysis` | Analyzes 5 dimensions, shows report | | |
| 2.6 | `/forge:checkpoint` | Creates `.claude/checkpoints/` file | | |
| 2.7 | `/forge:feature "test"` | Plans a feature, invokes agents | | |
| 2.8 | `/forge:command-center` | Shows 4-option menu | | |

### Phase 3: Agents

| # | Test | Expected | Pass/Fail | Notes |
|---|------|----------|-----------|-------|
| 3.1 | Agents discovered | Ask "what forge agents are available" — lists agents | | |
| 3.2 | Agent invocation | `/forge:agent-assign "task"` shows roster and invokes | | |
| 3.3 | No project-level agents | `ls .claude/agents/` is empty or doesn't exist | | |

### Phase 4: Hooks

| # | Test | Expected | Pass/Fail | Notes |
|---|------|----------|-----------|-------|
| 4.1 | Pre-task hook fires | See `[Info] Pre-task hook triggered` on prompt submit | | |
| 4.2 | Post-task hook fires | See quality suggestions after task completion | | |
| 4.3 | Hooks are non-blocking | Task proceeds even if hook reports warnings | | |

### Phase 5: Skills

| # | Test | Expected | Pass/Fail | Notes |
|---|------|----------|-----------|-------|
| 5.1 | Context-aware help | Ask about testing strategy — gets Forge-specific advice | | |
| 5.2 | Architecture guidance | Ask about architecture — references Forge patterns | | |

### Phase 6: MCP Dashboard (Optional)

| # | Test | Expected | Pass/Fail | Notes |
|---|------|----------|-----------|-------|
| 6.1 | `/forge:dashboard` | Generates and opens HTML dashboard | | |
| 6.2 | Health score shown | Dashboard shows A-F grade with score | | |
| 6.3 | Git status shown | Dashboard shows branch and commit info | | |

### Phase 7: Multi-Project

| # | Test | Expected | Pass/Fail | Notes |
|---|------|----------|-----------|-------|
| 7.1 | Open project A | `/forge:init` + `/forge:status` works | | |
| 7.2 | Open project B | `/forge:init` + `/forge:status` works | | |
| 7.3 | Projects are isolated | governance.json is different per project | | |
| 7.4 | Commands are shared | Same 23 commands available in both projects | | |

### Phase 8: Edge Cases

| # | Test | Expected | Pass/Fail | Notes |
|---|------|----------|-----------|-------|
| 8.1 | No git repo | `/forge:status` works but shows "not a git repo" | | |
| 8.2 | No package.json | `/forge:init` detects project type as "unknown" | | |
| 8.3 | Empty project | `/forge:init` + `/forge:status` still work | | |
| 8.4 | Run init twice | Second run asks to keep or reset existing config | | |

---

## Feedback Template

After running through the UAT, please capture your feedback:

```
## UAT Feedback — [Your Name] — [Date]

### Environment
- OS: [e.g., macOS 14, Ubuntu 24, Windows 11 + WSL2]
- Claude Code version: [e.g., 1.x.x]
- Node.js version: [e.g., 20.x] (for MCP dashboard)
- Shell: [e.g., zsh, bash]

### Overall Result
- [ ] All tests passed
- [ ] Some tests failed (see details below)
- [ ] Significant issues found

### Failed Tests
| Test # | Issue | Severity | Notes |
|--------|-------|----------|-------|
| | | | |

### Unexpected Behavior
(Describe anything that surprised you or didn't match expectations)

### Missing Features
(Things you expected the plugin to do that it doesn't)

### UX Feedback
(How did the experience feel? What was confusing?)

### Suggested Improvements
(Ideas for making the plugin better)
```

---

## 13. Pre-Release Testing Protocol

Before cutting a release, test plugin changes on a separate machine (CLX9) without publishing to GitHub or the marketplace.

### Automated L1 Integration Harness (CI-adoptable)

The L1 (plugin-standalone) path is machine-tested by `servers/governance-mcp/tests/integration/l1-journey.mjs` — one command, deterministic, no network. It is the L1 leg of the L1/L2/L3 integration coverage (G-09).

```bash
cd plugins/nxtg-forge/servers/governance-mcp
npm ci          # or npm install
npm test        # vitest (unit + attribution + version-surface + seeded-defect controls) THEN the live L1 journey
# or just the live journey:
npm run test:l1
```

What the harness proves, from a clean temp fixture:
- **Handshake** — boots the real `governance-mcp` over stdio via `start.sh`; the advertised MCP version equals `package.json`.
- **All 8 Node tools** — `tools/list` is exactly the 8 governance tools (and contains `forge_get_governance_health`, **not** the orchestrator's `forge_get_health`); every `tools/call` returns a shaped, non-error response.
- **Lego-Snap invariant** — with no `forge` binary on `PATH` the orchestrator-mcp command exits 1 (silent degrade); with a stub `forge` it resolves (exit 0); and **zero** L1 tool responses reference the orchestrator surface.
- **Deterministic failure** — the check functions (`tests/lib/checks.mjs`) are covered by seeded-defect negative controls (`version-surface.test.mjs`, `l1-checks.test.mjs`): a mismatched version surface, a missing/extra tool, an orchestrator reference at L1, or a malformed tool response each make the suite fail.

CI can adopt `npm test` verbatim once Actions billing is unlocked. The L3 leg is a future phase (3 of 3).

### Automated L2 Integration Harness — Pro Builder journey (CI-adoptable)

The L2 path (plugin **and** orchestrator loaded together, the Lego Snap exercised LIVE) is machine-tested by `servers/governance-mcp/tests/integration/l2-journey.mjs` — the phase-2 leg of G-09. It **requires the pinned `forge` binary** on `PATH` (v1.5.2) by design; absence or a version mismatch is a deterministic named failure (`FORGE_ABSENT` / `WRONG_BINARY_VERSION`), never a silent skip.

```bash
cd plugins/nxtg-forge/servers/governance-mcp
npm ci                 # or npm install
forge --version        # must report 1.5.2 (test fixture dependency, not a package dep)
npm test               # vitest THEN the live L1 journey THEN the live L2 journey
# or just the live L2 journey:
npm run test:l2
```

What the L2 harness proves, from a clean temp fixture (`forge init` + rule-based `forge plan --generate`, no network):
- **Dual handshake + surfaces** — boots BOTH servers from their verbatim `.mcp.json` command specs (Claude Code placeholders expanded); governance advertises exactly the 8 Node tools at the `package.json` version, orchestrator advertises exactly the 11 v1.5.2 tools (live counts; any delta from the pinned surface is reported as a finding, never patched from this repo).
- **Cross-server contract (G-04 proven live)** — `forge_get_governance_health` (Node, `{score,grade,checks}`) and `forge_get_health` (Rust, `{drift,findings}`) both return shaped non-error responses with **distinct shapes** (no runtime collision), and the fixture identity is bound identically on both sides (`forge_get_governance_state.project.name` == `forge_get_state.project_name` == `l2-fixture`).
- **Task lifecycle (durable-state value-proof)** — `forge_get_tasks`→`forge_claim_task`→`forge_complete_task` transitions `.forge/state.json` `task_summary` (completed↑, pending↓), flips `.forge/tasks/T-001.json` to `completed`, and appends `task_assigned`+`task_completed` to `.forge/events.jsonl` — read from the files, not just the tool text.
- **Deterministic failure** — the check functions (`tests/lib/checks.mjs`, shared with the live journey) are covered by seeded-defect controls (`l2-checks.test.mjs`): wrong binary version, a missing/extra Rust tool, a cross-server identity mismatch, and an un-applied lifecycle each make the suite fail.

CI can adopt `npm test` verbatim once Actions billing is unlocked **and the runner installs the pinned `forge` binary** (the L2 leg needs it present).

### Automated L3 Integration Harness — Ship Lord journey (CI-adoptable)

The L3 path (all three products snapped together — plugin governance/orchestrator MCP **and** forge-ui's live API+WS server) is machine-tested by `servers/governance-mcp/tests/integration/l3-journey.mjs` — the phase-3 leg of G-09. It **requires the pinned `forge` binary AND a forge-ui checkout** (with deps installed). forge-ui is a TEST-FIXTURE DEP: booted from its repo, never modified.

```bash
cd plugins/nxtg-forge/servers/governance-mcp
npm ci && forge --version         # forge 1.5.2
# forge-ui at the sibling ../../../../forge-ui, or set FORGE_UI_DIR:
npm test                          # vitest → live L1 → live L2 → live L3
# or just the live L3 journey:
npm run test:l3
```

What the L3 harness proves, from a clean temp fixture (`forge init` + rule-based `plan --generate`, ephemeral port, no network beyond localhost):
- **Ship Lord snap** — boots the orchestrator `forge mcp` (executing the `.mcp.json` env contract verbatim) AND forge-ui's API+WS server (source via the tsx loader — the built `dist` server is broken; `cwd=fixture` binds `data.project.path`) on an **ephemeral** port (never 5050/5051).
- **Cross-product contract (dx-journeys)** — `data.health.score === Math.round(orchestrator forge_get_health.health_score)` (float→rounded-int) with `data.health.source === "orchestrator"`; a fallback to forge-ui's own `"estimate"` computation is the named finding `UI_HEALTH_CONTRACT_DRIFT`. Identity binds canonically: `data.project.name === .forge/state.json.project_name`.
- **Liveness** — `POST /api/auth/ws-token` → WS `/ws` connect → a fixture-bound `state.update` + a `ping`→`pong` round-trip; then a task completed via MCP and the UI's orchestrator-sourced health re-verified against a fresh `forge_get_health` (live read across the mutation).
- **Deterministic failure** — shared check functions (`tests/lib/checks.mjs`) are covered by seeded-defect controls (`l3-checks.test.mjs`): ui-absent (`UI_ABSENT`), estimate/mismatched health, an `unknown` or wrong-dir identity, and an incomplete WS round-trip each make the suite fail.
- **Isolation** — forge-ui's global runspace bookkeeping (`~/.forge/projects.json`) is redirected to a throwaway `HOME`, so a clean run leaves the operator's real `~/.forge` byte-identical; teardown reaps the forge-ui child by its own pid (never pkill-by-name — a concurrent forge-ui session may be live) and removes every temp dir.

CI must provide: the pinned `forge` binary, a forge-ui checkout with deps installed (`FORGE_UI_DIR`), and network access to `127.0.0.1`. This completes G-09 (L1/L2/L3, 3 of 3).



### Method: `--plugin-dir` (Recommended)

Claude Code supports loading a plugin from any local directory using `--plugin-dir`. This bypasses the marketplace entirely — no git push, no release, no remove/re-add.

### Step 1: Package the plugin on the dev machine (NXTG-AI)

```bash
# Create a tarball excluding node_modules and .git
cd ~/projects/NXTG-Forge/forge-plugin
tar czf /tmp/forge-plugin-test.tar.gz \
  --exclude='node_modules' --exclude='.git' \
  -C plugins/nxtg-forge .

# Host it via HTTP (same pattern as binary hosting)
cd /tmp && python3 -m http.server 9999
```

The tarball is now available at `http://<dev-machine-ip>:9999/forge-plugin-test.tar.gz`.

### Step 2: Download and extract on the test machine (CLX9)

```bash
# Download and extract
mkdir -p ~/forge-plugin-test && cd ~/forge-plugin-test
curl -fsSL http://<dev-machine-ip>:9999/forge-plugin-test.tar.gz | tar xz

# Install MCP server dependencies (governance-mcp needs node_modules)
cd ~/forge-plugin-test/servers/governance-mcp && npm install --silent
```

### Step 3: Launch Claude Code with the test plugin

```bash
# Navigate to the test project and load the plugin from the local directory
cd ~/projects/POC/forge-demo/L1 && claude --plugin-dir ~/forge-plugin-test
```

This loads the patched plugin directly. The marketplace-installed version is ignored for this session.

### Step 4: Run the UAT flow

Execute the standard test sequence:
```
/forge:init → /forge:status → /forge:dashboard
```

Verify fixes against the acceptance criteria in the relevant directive.

### Step 5: Confirm or reject

- **If tests pass**: Proceed with the release (push, tag, version bump, GitHub release).
- **If tests fail**: Fix on dev machine, re-package (`tar czf`), re-download on CLX9, re-test. No git noise.

### After Release: Updating on Other Machines

Once the release is pushed to GitHub, use `/forge:update` on the target machine:

```
/forge:update
```

This command works around [Claude Code #29071](https://github.com/anthropics/claude-code/issues/29071) (stale marketplace cache) by running `git pull --ff-only` on the marketplace clone before triggering `claude plugin update`. It also validates governance config and hooks after updating.

After `/forge:update` completes, **restart Claude Code** to load the new MCP server code.

**Do NOT use `claude plugin update forge` directly** — it fetches without merging, leaving you on the old version.

### Notes

- `--plugin-dir` loads the plugin for that session only. It does not modify the installed plugin.
- Multiple `--plugin-dir` flags can be passed to load several test plugins simultaneously.
- MCP servers still need `node_modules` installed locally — the tarball excludes them to keep the download small.
- The HTTP server can remain running across sessions (check with `lsof -i :9999`).
- After a formal release, always use `/forge:update` (not raw `git pull`) on target machines.

---

## Architecture Reference

```
Plugin Install Location (GLOBAL):
~/.claude/plugins/marketplaces/{marketplace}/plugins/nxtg-forge/
  ├── .claude-plugin/plugin.json   ← Manifest (auto-discovered)
  ├── commands/*.md                ← 23 slash commands (auto-discovered)
  ├── agents/*.md                  ← 23 agent specs (auto-discovered)
  ├── skills/*/SKILL.md            ← 32 knowledge modules (auto-discovered)
  ├── hooks/hooks.json             ← 7 advisory hooks (auto-registered)
  ├── .mcp.json                    ← MCP server config (auto-registered)
  └── servers/governance-mcp/      ← MCP dashboard server (starts on demand)

Project Level (PER-PROJECT, created by /forge:init):
  your-project/
  ├── .claude/governance.json      ← Project state (ONLY governance file)
  ├── .claude/checkpoints/         ← Optional snapshots
  └── CLAUDE.md                    ← Updated with Forge section
```
