# Glossary

> Every term you'll encounter in NXTG-Forge documentation, explained three ways: what it's like, what it is, and how Forge uses it.

---

## Agent

**Like:** A specialist you hire for a specific job — one does plumbing, another does electrical.
**Definition:** An autonomous AI subprocess with a defined role, model, and tool access. Agents run inside Claude Code and handle specific domains (security, testing, API design, etc.).
**In Forge:** 33 markdown files define agent personalities. Each has a system prompt, a model assignment (Sonnet/Opus/Haiku), and a list of allowed tools. Claude Code picks the right agent based on your prompt, or you invoke them through commands like `/forge:feature`. See [Agents Reference](agents/README.md).

## Checkpoint

**Like:** A save point in a video game — snapshot your state before a boss fight.
**Definition:** A serialized copy of your governance configuration at a point in time.
**In Forge:** `/forge:checkpoint` saves your `.claude/governance.json` state. `/forge:restore` rolls back to it. Use before risky changes. See [/forge:checkpoint](commands/checkpoint.md).

## Command (Slash Command)

**Like:** A recipe card — step-by-step instructions for a specific task.
**Definition:** A user-invocable action triggered by typing `/forge:{name}` in Claude Code. Commands are markdown files with YAML frontmatter that Claude reads and executes.
**In Forge:** 23 commands cover setup, feature development, testing, deployment, documentation, and governance. See [Commands Reference](commands/README.md).

## Drift Detection

**Like:** A GPS telling you "you've gone off-route."
**Definition:** Comparing current work against the original specification to identify deviations — features that weren't planned, approaches that diverge from the architecture.
**In Forge:** The orchestrator (L2) compares `.forge/state.json` against your `SPEC.md` via the `forge_check_drift` MCP tool. The [Oracle](agents/oracle.md) agent monitors drift in real-time.

## Forge-Orchestrator

**Like:** An air traffic controller directing planes (AI tools) to avoid collisions.
**Definition:** A Rust binary that provides task management, file locking, knowledge capture, and drift detection via MCP. The L2 product.
**In Forge:** Installed via `curl -fsSL https://forge.nxtg.ai/install.sh | sh`. Exposes 10 MCP tools. Plugin auto-detects it in your PATH. See [L1→L2→L3](LEVELS.md).

## Forge-Plugin

**Like:** A toolkit you add to your workshop — all the specialized tools in one box.
**Definition:** A Claude Code plugin containing 33 agents, 23 commands, 33 skills, 13 hooks, and 8 MCP tools. Pure markdown, no build step. The L1 product.
**In Forge:** Installed via `claude plugin install nxtg-forge`. Everything loads automatically on Claude Code start.

## Forge-UI

**Like:** A mission control dashboard — visual displays showing everything at once.
**Definition:** A React web application providing visual governance, real-time agent feeds, and the Infinity Terminal. The L3 product.
**In Forge:** Runs at `localhost:5050`. Launched via `/forge:dashboard` or `cd forge-ui && npm run dev`.

## Governance

**Like:** A building inspector who checks that construction follows code.
**Definition:** Automated quality enforcement — health scoring, gap analysis, security scanning, and compliance checking applied to your codebase continuously.
**In Forge:** Governance state lives in `.claude/governance.json`. Hooks check quality on every prompt submission and task completion. MCP tools report health scores (0-100, A-F grade). See [/forge:status](commands/status.md).

## Health Score

**Like:** A credit score for your codebase — one number summarizing overall quality.
**Definition:** A 0-100 score across 5 dimensions: testing, documentation, security, architecture, and governance. Displayed as a letter grade (A-F).
**In Forge:** Computed by the governance-mcp server via `forge_get_governance_health` (the orchestrator's `forge_get_health` adds the drift dimension at L2). Visible in `/forge:status` output and the L3 dashboard.

## Hook

**Like:** A doorbell that rings when someone arrives — automated actions triggered by events.
**Definition:** A shell script that executes when Claude Code performs specific actions (submitting a prompt, writing a file, completing a task).
**In Forge:** 13 hooks. 4 are **blocking security guards** (PreToolUse — they STOP dangerous operations like `rm -rf /`, accessing `.env` files, writing `eval()`, or SQL injection). 9 are **advisory** (they observe and report but don't block). See your plugin's `hooks/` directory.

## Infinity Terminal

**Like:** A phone call that doesn't drop even when you lose signal — it's still there when you reconnect.
**Definition:** A browser-based terminal (L3) where PTY sessions persist across browser close, network drops, and server restarts.
**In Forge:** Part of forge-ui. Sessions survive because the server maintains PTY processes independently of the browser connection.

## Knowledge

**Like:** A team wiki that remembers what was tried, what worked, and why.
**Definition:** Captured decisions, patterns, and lessons from agent sessions, stored persistently via the orchestrator (L2).
**In Forge:** Agents use `forge_capture_knowledge` to save what they learn and `forge_get_knowledge` to recall it. Knowledge persists across sessions. See [Learning](agents/learning.md).

## L1 / L2 / L3 (Levels)

**Like:** Gears on a bicycle — start in first, shift up when you need more.
**Definition:** Three tiers of capability. L1 = forge-plugin (Vibe Coder). L2 = + forge-orchestrator (Pro Builder). L3 = + forge-ui (Ship Lord). Each works independently.
**In Forge:** See [L1→L2→L3 Journey](LEVELS.md) for the full breakdown.

## MCP (Model Context Protocol)

**Like:** A USB cable that lets different devices talk — one standard plug, many devices.
**Definition:** A stdio-based JSON-RPC 2.0 protocol that connects AI tools to servers providing additional capabilities (tools, resources, prompts).
**In Forge:** Three MCP servers: governance-mcp (Node.js, 8 tools), orchestrator-mcp (Rust, 10 tools), semgrep-mcp (Python, SAST scanning). Claude Code connects to all three simultaneously when available.

## ORBIT

**Like:** A satellite orbiting Earth — continuous observation from above.
**Definition:** The governance loop model: **O**bserve → **R**eason → **B**uild → **I**nspect → **T**urn. Each iteration goes deeper.
**In Forge:** Used by the [CEO Loop](agents/ceo-loop.md) agent for autonomous strategic governance. Activated via `/forge:ceo-loop`.

## Skill

**Like:** A textbook on a shelf — the agent pulls it down when the topic comes up.
**Definition:** A contextual knowledge document that auto-loads when agents work on relevant tasks. Skills are NOT agents — they teach agents patterns, conventions, and best practices.
**In Forge:** 33 skills covering architecture, testing, security, coding standards, framework knowledge, and more. **100% automatic — you configure nothing.** See [Skills Reference](skills/README.md).

## Worktree

**Like:** A photocopy of your project — make changes on the copy, throw it away if you don't like it.
**Definition:** A git worktree — an isolated copy of your repository where an agent can work without affecting your main working directory.
**In Forge:** The Builder agent uses worktree isolation. Changes are on a separate branch. If you don't like the result, the branch is trivially discardable.
