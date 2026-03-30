# /forge:init

> Initialize NXTG-Forge governance in any project with a 60-second setup wizard that detects your stack and captures your vision.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Setup & Maintenance |
| **Syntax** | `/forge:init` |

---

## What It Does

`/forge:init` is the starting point for every NXTG-Forge project. It runs a guided setup wizard that detects your project type (Node.js, Rust, Python, Go, Java), checks for existing configuration, captures your product vision and goals, then creates the governance files that power every other Forge command.

The wizard creates two files: `.claude/governance.json` (the project state tracker that records workstreams, quality gates, metrics, and sentinel audit entries) and optionally appends a Forge section to your `CLAUDE.md` with project context. This is all that is needed -- commands, agents, skills, and hooks are loaded automatically from the plugin.

Without `/forge:init`, you would need to manually create governance configuration, remember to track quality gates, and lose the contextual intelligence that makes commands like `/forge:status` and `/forge:gap-analysis` understand your project. The wizard replaces all of that with four questions and a confirmation.

## Syntax & Options

```
/forge:init
```

This command takes no arguments. It runs interactively, asking questions via prompts.

## When to Use It

- **Starting a new project**: Run it immediately after `git init` and installing dependencies to establish governance from day one.
- **Onboarding an existing codebase**: Point Forge at a mature project and let it detect the stack, then layer governance on top without disrupting existing workflows.
- **After a fresh plugin install**: The first command to run after `claude plugin install nxtg-forge`.

Do not run `/forge:init` if `.claude/governance.json` already exists and is healthy. Use `/forge:status` instead to verify your current setup. If you need to reset, the wizard will detect existing config and offer a fresh-start option.

## Examples

### Example 1: New TypeScript Project

```
/forge:init
```

The wizard detects `package.json` and `tsconfig.json`, identifies the project as TypeScript/Node.js, then asks:

```
Welcome to NXTG-Forge!

What are you building? (1-2 sentences)
```

You answer: "A REST API for managing team retrospectives with real-time voting." The wizard asks about goals, confirms the plan, then creates governance:

```
NXTG-Forge is ready!

Project: TypeScript (Node.js)
Vision: A REST API for managing team retrospectives...

What was created:
  - .claude/governance.json (project tracking)
  - CLAUDE.md updated with project context
```

### Example 2: Existing Rust Project

```
/forge:init
```

The wizard detects `Cargo.toml`, finds an existing `CLAUDE.md`, and asks whether to append or leave it alone. After setup:

```
Your Next Steps:

1. Open your dashboard:   /forge:dashboard
2. Check project status:  /forge:status
3. Plan a feature:        /forge:feature "feature name"
```

## Power Use Cases

Run `/forge:init` followed immediately by `/forge:gap-analysis` to get a full assessment of an unfamiliar codebase within minutes. The init captures vision, and the gap analysis maps every testing, documentation, security, and architecture weakness against that vision.

For monorepos, run `/forge:init` in each sub-project directory separately. Each gets its own governance state file tuned to its stack.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:status** | Immediately verify the init worked and see your health baseline |
| **/forge:gap-analysis** | Run right after init to discover what the project needs most |
| **/forge:command-center** | The command center checks for governance.json -- init satisfies that gate |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full setup wizard with stack detection, vision capture, and governance file creation |
| **L2 Pro Builder** | Init also registers the project with forge-orchestrator via `forge_set_project` for task management |
| **L3 Ship Lord** | Init completion unlocks the visual governance dashboard at localhost:5050 |

## Tips & Gotchas

- The wizard creates `.claude/governance.json`, not a `.claude/forge/` directory. The old monorepo pattern is retired.
- Agents, commands, skills, and hooks are loaded from the plugin automatically. Init does not copy them into your project.
- If you skip the vision question, downstream commands like `/forge:status` will show a blank directive. Take 10 seconds to describe what you are building.

---

*See also: [status](../commands/status.md) | [gap-analysis](../commands/gap-analysis.md) | [command-center](../commands/command-center.md)*
