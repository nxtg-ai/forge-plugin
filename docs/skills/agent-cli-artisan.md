# CLI Artisan Agent

> Encodes the craft of building intuitive, powerful command-line interfaces -- argument parsing, interactive wizards, rich output formatting, and developer experience best practices.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Agent Roles |

---

## What It Provides

The CLI Artisan skill teaches agents to build command-line tools that developers love using. It covers CLI framework selection across languages (Click/Typer for Python, Commander/oclif for Node.js, Cobra for Go, clap for Rust), interactive prompt design, progress indicators, colored output with libraries like Rich and Chalk, and the critical UX principle that great CLIs are helpful even when things go wrong.

Without this skill, agents build CLIs with vague error messages ("Error: Invalid input"), no progress feedback during long operations, missing help text, and no confirmation before destructive actions. With it, agents produce CLIs with contextual error messages that suggest fixes, progress bars for long operations, comprehensive `--help` output with examples, and confirmation prompts before anything irreversible.

The skill also teaches the structural decision between flat command hierarchies (for simple tools with fewer than 10 commands) and nested command groups (for complex tools requiring logical organization), and when to use interactive wizards vs. flag-based interfaces.

## When It Activates

- When building or improving command-line interfaces in any language
- When designing argument parsing, validation, or interactive prompts
- When creating status displays, progress bars, or rich terminal output
- When an agent needs to decide between interactive and flag-based command design

## The Knowledge Inside

### Command Structure Design

Two structural patterns cover most CLI needs. **Flat structure** works for simple tools with 10 or fewer commands -- `forge init`, `forge build`, `forge test`. **Nested structure** works for complex tools where commands group logically -- `forge project init`, `forge mcp configure`, `forge quality test`. Agents learn to choose based on command count and natural grouping, not complexity bias.

### Interactive vs. Flag-Based Interfaces

The skill defines when each approach is appropriate. Interactive wizards suit new user onboarding, complex multi-input configurations, and guided experiences. Flag-based commands suit automation, scripting, power users, CI/CD integration, and single-purpose operations. The best CLIs support both: interactive mode when run without flags, flag-based when flags are provided.

### Error Message Quality

Error messages must be helpful and actionable. The skill teaches a three-part error format: what went wrong (specific), why (context), and what to do (actionable suggestion with example). Agents learn to contrast good errors ("Error: Project name cannot contain spaces. Use hyphens or underscores instead. Example: my-project") with bad ones ("Error: Invalid input").

### Rich Output Formatting

The skill covers progress bars (Rich Progress in Python), colored output (Rich Console, Chalk), table formatting (Rich Table), panel displays, and JSON output mode for programmatic consumption. Agents learn that every long-running operation needs a progress indicator, and every command should support `--json` output for scripting.

## How to Leverage It

Describe the CLI command you need and the agent will design the full interface -- arguments, options, validation, help text, progress feedback, and error handling.

### Example: Project Initialization Command
```
User: "Build a CLI init command for new projects"
What happens: The agent creates a command with project_name argument,
--template and --framework options, --dry-run flag, input validation,
a Rich progress spinner for each initialization step, color-coded success
output, and a "Next steps" section showing what to do after init.
```

## Power Applications

- Combine interactive wizards with flag-based commands to serve both beginners and power users
- Use Rich tables and panels to create status displays that convey complex information at a glance
- Add shell completion scripts to dramatically improve the CLI discovery experience

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **agent-lead-architect** | Provides CLI command specifications and workflow requirements |
| **agent-backend-master** | Implements the business logic that CLI commands invoke |
| **agent-qa-sentinel** | Tests CLI commands with expected outputs and edge cases |

## Tips

- Always use exit codes consistently: 0 for success, 1 for errors -- scripts depend on this
- Detect terminal color support before using colors; `NO_COLOR` environment variable should disable them
- Confirmation prompts before destructive actions are not optional -- they prevent data loss

---

*See also: [agent-lead-architect](agent-lead-architect.md), [agent-qa-sentinel](agent-qa-sentinel.md)*
