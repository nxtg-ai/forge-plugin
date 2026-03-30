# DX Engineer

> The developer experience obsessive who measures time-to-hello-world in seconds, rewrites error messages until they teach, and designs APIs that explain themselves through autocomplete.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Engineering Leadership |
| **Model** | Sonnet |

---

## What It Does

The DX Engineer owns every surface a developer touches -- from the first `npm install` to the hundredth API call. Its north star: a developer should feel competent, not confused. If they need to read the source code to understand your API, the DX Engineer has failed. If they hit an error and do not know what to do next, the DX Engineer has failed. If they cannot get from install to a working result in under five minutes, the DX Engineer has failed.

It brings the standards of Stripe (every API call works on the first try), Vercel (zero config, conversational CLI), and Clerk (type `<SignIn />` and authentication works) to your project. These companies share aggressive defaults, instant feedback, errors that teach, APIs designed for autocomplete, and docs with working examples on every page. The DX Engineer applies these standards systematically.

The agent operates through a comprehensive 10-point audit checklist covering installation experience, time-to-hello-world, CLI UX, error messages, SDK/API design, configuration UX, documentation architecture, example code quality, terminal output formatting, and plugin/extension APIs. Each area has concrete, measurable criteria -- not subjective opinions but specific pass/fail checks.

## When to Use It

- **CLI UX audit**: When error messages are confusing, help text is unscannable, or terminal output lacks visual hierarchy.
- **SDK API design**: When designing a public API surface that needs to be type-safe, autocomplete-friendly, and hard to misuse.
- **Onboarding optimization**: When new users take too long to get their first result and you need to identify and remove friction points.
- **Time-to-hello-world measurement**: When you want a precise measurement of how long it takes a new user to go from zero to working output, following only your README.
- **Configuration UX design**: When your tool requires too much configuration before doing anything useful and you need progressive disclosure.

Do not use this agent for backend architecture decisions -- that is the Master Architect. Do not use it for visual design -- that is the Design Vanguard.

## How It Works

1. **Audit Execution**: Runs through the 10-point DX checklist against the target project, producing specific PASS/FAIL results for each criterion.
2. **TTHW Measurement**: Simulates a clean-machine first run -- start a timer, follow only the README, stop when meaningful output appears. Records total time, commands typed, files created, decisions made, errors encountered.
3. **Error Message Rewriting**: Applies the formula: `[WHAT] happened because [WHY]. [HOW TO FIX].` Rewrites raw system errors into three-tier messages with context, cause, and recovery steps.
4. **API Design Review**: Evaluates method naming (reads like English), type precision (unions over booleans), autocomplete discoverability, error handling patterns (Result types over exceptions), and documentation completeness (every method has JSDoc with examples).
5. **Configuration Audit**: Verifies three-tier progressive disclosure -- Tier 0 (works with zero config for 80% of use cases), Tier 1 (one-liner config for the common case), Tier 2 (full control for power users).

## Examples

### Example 1: CLI Error Message Audit and Rewrite

```
User: "Our CLI error messages are confusing and don't help users"

DX Engineer:
  - Audits 34 error paths in the CLI
  - Finds: 28 expose raw system errors (ECONNREFUSED, ENOENT)
  - Rewrites each with the what/why/how formula
  - Before: "Error: ECONNREFUSED 127.0.0.1:5051"
  - After:  "Cannot connect to Forge server at localhost:5051.
             The server is not running or is on a different port.
             To fix: forge server start
             Docs: https://docs.nxtg.ai/forge/troubleshooting
             Error code: FORGE-E001"
  - Result: 34 error messages rewritten with searchable error
    codes, fix suggestions, and doc links.
```

### Example 2: Time-to-Hello-World Measurement

```
User: "New users take 20 minutes to get their first result"

DX Engineer:
  - Simulates clean install on a fresh project
  - Records: 14m 32s, 8 commands, 3 files edited, 6 decisions,
    2 errors encountered
  - Bottlenecks identified:
    1. Config file required before first run (3 min wasted)
    2. API key prompt with no clear instructions (2 min wasted)
    3. Error on first run due to missing dependency (4 min wasted)
  - Prescribes: sensible defaults (eliminate config), inline API
    key instructions in error, auto-install missing dependency
  - Projected TTHW after fixes: ~4 minutes
  - Result: Concrete fix list that cuts onboarding time by 72%.
```

### Example 3: SDK API Design Review

```
User: "Design the public API surface for our TypeScript SDK"

DX Engineer:
  - Designs fluent, discoverable API:
    forge.agents.create({ name: "my-agent", model: "sonnet" })
  - Rejects: createAgent("my-agent", "sonnet", true, null)
  - Uses options bags over positional args
  - Implements discriminated Result types for error handling
  - Every method has JSDoc with @example
  - TypeScript strict mode, no `any` types
  - Result: Type-safe SDK where autocomplete reveals the API
    and wrong usage is a compile error, not a runtime surprise.
```

## Power Use Cases

**Complete DX Audit**: Run the full 10-point checklist against your project before a launch. The audit produces a scorecard with specific pass/fail results, benchmarked against the Stripe/Vercel/Clerk standard. Each failing check comes with a concrete fix and effort estimate.

**Configuration Progressive Disclosure Redesign**: The DX Engineer can redesign a configuration system to work in three tiers -- zero config (just works), one-liner config (customize the common case), and power user config (full control). This pattern ensures 80% of users never touch a config file while giving power users every knob they need.

**Documentation Architecture Review**: Using the Diataxis framework, the DX Engineer classifies every documentation page as Tutorial (learning), How-to (task), Reference (lookup), or Explanation (understanding). It identifies mismatches -- reference docs without examples, tutorials that explain too much theory, how-to guides buried in concept explanations -- and prescribes the restructuring.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Design Vanguard** | DX Engineer designs the interaction model; Design Vanguard designs the visual surface |
| **Wordsmith** | DX Engineer identifies what text needs improvement; Wordsmith writes it |
| **Master Architect** | Architect designs the system; DX Engineer ensures it is pleasant to use |
| **/forge:docs-audit** | Documentation audit feeds into the DX Engineer's review of docs architecture |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full 10-point DX audit, TTHW measurement, error message rewriting, API design review, configuration audit |
| **L2 Pro Builder** | + `forge_capture_knowledge` records DX audit findings and TTHW benchmarks over time |
| **L3 Ship Lord** | + Dashboard panel showing TTHW trends, DX scorecard history, and error message quality metrics |

## Tips & Gotchas

- **Do**: Run a TTHW measurement from a truly clean environment. Your development machine lies because everything is cached.
- **Do**: Test error messages by deliberately triggering them. The error path is the most important UX surface in a developer tool.
- **Don't**: Optimize for time-to-install and call it done. The metric is time-to-first-value -- when the developer sees the tool do something useful.
- **Don't**: Dismiss "small" DX issues. A confusing flag name or a missing default compounds across every user, every day.

---

*See also: [design-vanguard](design-vanguard.md), [wordsmith](wordsmith.md)*
