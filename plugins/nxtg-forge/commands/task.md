---
description: "Begin, inspect, relax or end an enforced Forge task: a test-file write guard plus a Stop gate on the project's own test command"
disable-model-invocation: true
argument-hint: "begin [--mode implement|tests] [--test-cmd \"<command>\"] | status | tests | implement | abort"
allowed-tools: Bash(node:*)
---

# NXTG-Forge Enforced Task

The user ran this command, and the step below has already run. Its output is the result:

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/forge-task.mjs" cli $ARGUMENTS`

Report that output to the user in one or two lines. Do not run `forge-task.mjs` yourself: while a task is active only the user begins, relaxes or ends it, and the guard refuses the attempt.

## What an enforced task does

While a task is active in this project:

- **Write guard (PreToolUse).** Edits to a test file that existed when the task began, and to test-runner config (`conftest.py`, `pytest.ini`, `jest.config.*`, and similar), are refused, with the file and the reason. New test files are allowed. In `tests` mode nothing is refused.
- **Stop gate (Stop).** Stopping is blocked until the test command recorded at `begin` passes, with the baseline tests and the test command unchanged. Alternatively, it ends when `.claude/forge-conflict-report.json` shows that a test contradicts the spec, and every cited line checks out against the files. After the configured number of blocked stops (default 5), the task ends as **unearned**, which means not done.
- **What it does not check:** that the tests cover the new behaviour. It checks only that the project's own tests pass without being weakened.

## Subcommands

| Subcommand | Effect |
|---|---|
| `begin [--mode implement\|tests] [--test-cmd "<cmd>"] [--max-blocks N] [--timeout S]` | Records the test files, the test command and the base commit. It refuses to begin when no test command can be found. |
| `status` | Shows the task's mode, test command, blocked-stop count and verdict. |
| `tests` | Lets the agent change tests. Use it when the task is to write or fix tests. |
| `implement` | Back to implementation. The tests as they are now become the new baseline. |
| `abort` | Ends the task without a check. The verdict is `aborted`. |

## Starting a task automatically

To begin a task automatically on the next prompt whenever none is active, set `FORGE_ENFORCE=implement` in the environment before you start Claude Code, or put this in `.claude/forge-enforce.json`:

```json
{ "autoBegin": "implement", "testCommand": "npm test", "testGlobs": ["tests/**"], "maxStopBlocks": 5 }
```

Every field is optional. `testGlobs` replaces the default test-file globs. `testCommand` overrides detection, which checks in this order: npm, cargo, go, pytest, unittest, make.
