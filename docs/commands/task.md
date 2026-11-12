# /nxtg-forge:task

> Begin, inspect, relax, or end an enforced task: a test-file write guard plus a Stop gate on the project's own test command.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Quality & Testing |
| **Syntax** | `/nxtg-forge:task begin [options]` or `/nxtg-forge:task status\|tests\|implement\|abort` |

---

## What It Does

`/nxtg-forge:task` records the project's test files, test command, and base commit, then enforces a task through hooks. While the task is active in implementation mode, a **PreToolUse write guard** refuses edits to test files that existed when the task began and to test-runner config such as `conftest.py`, `pytest.ini`, and `jest.config.*`. Each refusal names the file and the reason. New test files are allowed.

A **Stop gate** blocks stopping until the recorded test command passes with the baseline tests and test command unchanged. The gate also catches changes made through Bash by comparing against the recorded baseline. It checks that the project's own tests pass without being weakened, **not that they cover the new behaviour**.

There are two other ways for the gate to end a task:

- **Conflict report:** If a test contradicts the spec, the agent writes `.claude/forge-conflict-report.json`, citing the spec line, the test line, and why they conflict. The gate checks every cited line against the files before accepting the report. Then a person decides; accepting the report is not a judgement that the implementation is correct.
- **Blocked-stop limit:** After the configured number of blocked stops (default **5**), the task ends as **unearned**. That means not done, not a passing result.

The user can also explicitly end the task without a check using `abort`.

## Syntax & Options

```
/nxtg-forge:task begin [--mode implement|tests] [--test-cmd "<command>"] [--max-blocks N] [--timeout S]
/nxtg-forge:task status
/nxtg-forge:task tests
/nxtg-forge:task implement
/nxtg-forge:task abort
```

| Subcommand | Effect |
|------------|--------|
| `begin` | Records the test files, test command, and base commit. Refuses to begin if no test command can be found. |
| `status` | Shows the mode, test command, blocked-stop count, and verdict. |
| `tests` | Lets the agent change tests. Use when the task is to write or fix tests; the write guard refuses nothing in this mode. |
| `implement` | Returns to implementation mode. The tests as they are now become the new baseline. |
| `abort` | Ends the task without a check, with the verdict `aborted`. |

| `begin` option | Purpose |
|----------------|---------|
| `--mode implement\|tests` | Select implementation or test-writing mode. |
| `--test-cmd "<command>"` | Specify the project's test command instead of relying on detection. |
| `--max-blocks N` | Configure the blocked-stop limit (default 5). |
| `--timeout S` | Set the test-command timeout in seconds. |

The command runs the task engine as part of the slash-command invocation. While a task is active, only the user begins, relaxes, or ends it; the agent should report the command's output rather than invoke the engine itself.

## When to Use It

- **Implementing against existing tests:** Keep the existing tests and runner config protected while allowing new test files.
- **Writing or repairing tests:** Use `tests` mode, then explicitly return to `implement` to establish the updated tests as the baseline.
- **Checking an active task:** Use `status` to see the recorded command, blocked stops, and verdict before deciding how to proceed.

## Examples

### Example 1: Enforce an Implementation Task

```
/nxtg-forge:task begin --mode implement --test-cmd "npm test" --max-blocks 5
/nxtg-forge:task status
```

Work on the implementation. Existing test files and runner config are guarded, new tests are allowed, and the Stop gate runs the recorded command before allowing completion. If it cannot pass, a validated conflict report or the blocked-stop limit can end the task without claiming it is done.

### Example 2: Update Tests, Then Establish a New Baseline

```
/nxtg-forge:task tests
```

Use this during an active task when the work requires changing tests. After the test changes, the user runs:

```
/nxtg-forge:task implement
```

The current tests become the new implementation baseline. To end the task without a check instead, run `/nxtg-forge:task abort`.

## Power Use Cases

### Automatically Begin Tasks

Set `FORGE_ENFORCE=implement` in the environment before starting Claude Code, or create `.claude/forge-enforce.json`:

```json
{
  "autoBegin": "implement",
  "testCommand": "npm test",
  "testGlobs": ["tests/**"],
  "maxStopBlocks": 5
}
```

A task begins on the next prompt whenever none is active. Every field is optional. `testGlobs` **replaces** the default test-file globs; `testCommand` overrides detection, which checks in this order: npm, cargo, go, pytest, unittest, make.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Project test command** | Use `--test-cmd` or `testCommand` to select the command the Stop gate runs. |
| **tests → implement** | Separates intentional test edits from implementation work and records the revised tests as a new baseline. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | The plugin's enforced-task command, write guard, and Stop gate; no orchestrator or forge-ui required. |

## Tips & Gotchas

- **Not a filesystem integrity boundary:** Task state is stored outside the project. The guard refuses edit-tool writes to it and Bash commands that name its directory or the engine's begin, mode, or abort subcommands in plain text. A glob, variable, or script that reaches the state is not caught. Your own filesystem has no integrity boundary against code you let the agent run.
- **Installed runtime changes are not caught:** The gate runs the test command in the working tree. Changes to `node_modules`, site-packages, or PATH are not caught. A new file that shadows a Python standard-library or test-runner module is caught.
- **Passing tests are not coverage evidence:** The gate does not check that tests cover new behaviour. It checks that they pass without being weakened.
- **Test changes are an explicit mode choice:** `tests` relaxes the write guard; `implement` makes the current tests the new baseline.
- **Do not treat every ending as success:** `unearned` means not done, `aborted` ends without a check, and an accepted conflict report still needs a person's decision.

---

*See also: [test](test.md) | [Enforced Tasks](../../README.md#enforced-tasks) | [command definition](../../plugins/nxtg-forge/commands/task.md)*
