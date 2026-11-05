# What the Forge Plugin Ships

This page lists what the Forge plugin and its orchestrator companion do in the release users install today: plugin v3.14.2 and forge v1.8.0. It compares Forge with no other tool. Each line can be checked against the files at the `v3.14.2` tag.

## Hooks that block

- **4 PreToolUse security guards.** They refuse matching tool calls before they run:
  - Command guard: `rm -rf /`, `chmod 777`, `curl | sh`, fork bombs, force push to main.
  - Secret shield: `.env`, `*.pem`, `*.key`, credential files, `~/.ssh/`.
  - Injection guard: `eval()`, `os.system()`, `subprocess(shell=True)`, `child_process.exec()`.
  - SQL guard: string concatenation with SQL keywords.

  They match patterns, so a call that does the same thing another way is not refused.
- **Enforced tasks (opt-in).** While a task is active:
  - An edit to an existing test file is refused.
  - "Done" is blocked until the project's own test command passes with the tests unchanged.
  - The README's [Enforced Tasks](README.md#enforced-tasks) section lists what this does not cover.
- **Required-output gate.** A Stop check keeps `/nxtg-forge:status` and `/nxtg-forge:gap-analysis` from ending until their reply holds every line the command computed.
- **CEO-loop Stop hook.** While `/nxtg-forge:ceo-loop` is running, it keeps the session going into the next iteration. It does nothing otherwise.

## Advisory hooks

- Pre-task and post-task checks.
- File-placement and root-cleanliness notes.
- A smoke-test reminder.
- A Semgrep scan after each Write or Edit, when Semgrep is installed.

These hooks report and never block. In all there are 27 hook registrations across PreToolUse, PostToolUse, Stop and UserPromptSubmit.

## MCP tools

- **governance-mcp (Node.js 20+, no npm dependencies):** 8 tools.
  - A health score from 0 to 100 with a letter grade, built from 8 checks: Governance, Git Clean, Test Coverage, Type Safety, README, CLAUDE.md, File Size and Security.
  - Git status, code metrics, a test run (Vitest, Jest or pytest, whichever the project has), checkpoints, a security scan, and a static HTML dashboard.
- **orchestrator-mcp (the `nxtg-forge-orchestrator` companion plugin, runs `forge mcp`):** 12 tools.
  - Task board: create, claim and complete.
  - Plan and state reads, knowledge capture and lookup, an event log and a health check.
  - A drift check, which needs a configured model.
- **semgrep-mcp:** Semgrep's own tools, when `uvx` or `semgrep-mcp` is installed.

## Review prompts with no accuracy claim

`/nxtg-forge:gap-analysis` and the `crucible-audit` skill are structured review prompts. They make no accuracy claim. On [forge-done-fixture](https://github.com/nxtg-ai/forge-done-fixture) and [forge-done-fixture-2](https://github.com/nxtg-ai/forge-done-fixture-2), a plain review prompt found the same defects at roughly a third to a quarter of their cost (fixtures 1 and 2, 24 runs).

## Content

33 agents, 24 slash commands and 27 skills, all markdown that Claude Code loads at runtime with no build step.

## Three repos

| Repo | What it is |
|------|------------|
| forge-plugin | This plugin |
| forge-orchestrator | A Rust CLI and MCP server |
| forge-ui | A browser dashboard |

They connect only through MCP and share no code.
