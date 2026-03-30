# Learning

> The adaptive memory that makes NXTG-Forge smarter every session -- capturing your preferences, patterns, and corrections so the system stops guessing and starts knowing.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Governance & Analysis |
| **Model** | Haiku |

---

## What It Does

The Learning agent is NXTG-Forge's institutional memory. It observes how you work -- which agents you invoke, what corrections you make, what coding patterns you prefer -- and encodes those observations into persistent preferences that improve every future session.

Without this agent, every session starts from zero. You would repeat the same corrections ("I use Vitest, not Jest"), re-explain the same preferences ("conventional commits, always"), and watch the system make the same wrong guesses. The Learning agent eliminates that repetition by capturing signals from your behavior and making them available to all other agents.

It draws from three signal sources: session history (which agents run, in what order, how often), user corrections (when you override a recommendation or modify generated code significantly), and outcome tracking (did the generated code pass tests, was the commit accepted). The strongest signal is always an explicit correction -- when you say "I prefer X over Y," that preference is treated as authoritative.

## When to Use It

- **Repeated corrections**: When you find yourself telling the system the same thing across multiple sessions -- "I use pnpm, not npm" or "I always want TypeScript strict mode."
- **Recommendation quality is poor**: When agent suggestions consistently miss the mark and you want the system to learn from your actual workflow patterns.
- **Preference capture**: When you want to explicitly set preferences for testing frameworks, commit styles, file organization, or code formatting that should persist.
- **Pattern audit**: When you want to understand what the system has learned about your workflow and verify it matches your actual preferences.

Do not use this agent for one-off corrections that do not represent a persistent preference. If you want to override a recommendation once without changing the default behavior, just override it directly.

## How It Works

1. **Signal Collection**: Monitors agent invocations, user corrections, code modifications, and test outcomes across sessions.
2. **Pattern Extraction**: Identifies recurring patterns -- common task sequences (plan, build, test, commit), time-of-day preferences, frequent corrections.
3. **Preference Storage**: Persists captured preferences to the project's `.claude/` directory as structured JSON, organized by domain (testing, code style, workflow).
4. **Recommendation Engine**: When other agents need to make decisions, the Learning agent provides context from stored preferences -- what the user did in similar situations, what succeeded, what was explicitly requested.
5. **Silent Operation**: Learns without prompting. You do not need to tell it to start -- it observes and adapts. It only speaks up when asked to explain its reasoning.

## Examples

### Example 1: Capturing a Testing Framework Preference

```
User: "Remember that I prefer Vitest over Jest"

Learning agent:
  - Records preference: testing.framework = "vitest"
  - Checks for related preferences (test style, coverage target)
  - Stores to .claude/preferences.json
  - Result: All future test generation uses Vitest. The testing
    agent stops suggesting Jest.
```

### Example 2: Learning from Repeated Corrections

```
User: (Over several sessions, keeps switching generated
      imports from relative paths to path aliases)

Learning agent:
  - Detects pattern: user modifies import paths 8 times
  - Infers preference: code_style.import_style = "path_aliases"
  - Records with confidence: high (8 corrections)
  - Result: Builder agent now generates @/ imports by default.
```

### Example 3: Workflow Sequence Optimization

```
User: "What have you learned about my workflow?"

Learning agent:
  - Analyzes session history
  - Reports: "You typically run /forge:status before starting
    work, then /forge:feature, then build, then test. You
    always run tests before committing. You prefer conventional
    commits with scope."
  - Result: Surfaces patterns the user may not have noticed,
    confirms or corrects them.
```

## Power Use Cases

**Team Onboarding**: Run the Learning agent on a senior developer's workflow for a week, then export the captured preferences. New team members start with the team's established patterns instead of the system's defaults.

**Project-Specific Profiles**: Different projects have different conventions. The Learning agent stores preferences per-project in `.claude/`, so switching between a Python data pipeline and a React dashboard automatically loads the right testing framework, code style, and commit conventions.

**Regression Detection**: If the system starts making recommendations that conflict with stored preferences, the Learning agent flags the drift -- "You usually prefer X but the current suggestion is Y. Should I update your preference?"

## Combines With

| Feature | Synergy |
|---------|---------|
| **Builder agent** | Preferences inform code generation -- import style, naming conventions, test framework |
| **Testing agent** | Framework preference, coverage targets, and test style are all learned parameters |
| **Guardian agent** | Quality gate thresholds adapt to your project's specific standards |
| **/forge:init** | Initial preferences can be seeded during project initialization |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Preference capture, session history analysis, recommendation improvement |
| **L2 Pro Builder** | + `forge_capture_knowledge` stores preferences as orchestrator knowledge, shared across agent team |
| **L3 Ship Lord** | + Dashboard visualization of learned patterns and preference evolution over time |

## Tips & Gotchas

- **Do**: Give explicit corrections when the system gets it wrong -- they are the strongest learning signal.
- **Do**: Periodically ask "What have you learned about my preferences?" to audit and correct captured patterns.
- **Don't**: Expect the agent to learn from a single instance -- it needs repeated signals to distinguish preferences from one-off exceptions.
- **Don't**: Forget that preferences are per-project. A preference set in one project does not automatically apply to another.

---

*See also: [builder](builder.md), [oracle](oracle.md)*
