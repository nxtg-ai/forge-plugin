---
name: Agent Development
description: >
  Author and configure Claude Code subagents — valid YAML frontmatter (name, description,
  model, color, tools, isolation, memory, skills) plus a system-prompt body. Use when creating
  a new agent .md, fixing an agent that won't load or won't auto-delegate, choosing a model/color,
  deciding which tools an agent gets, or reviewing agent frontmatter for invalid/ignored fields.
allowed-tools: Read, Grep, Glob
---

# Agent Development Guide

How to author a Claude Code subagent that loads, auto-delegates, and runs with the right tools.
Ground every new agent against the 33 real agents in this plugin (`agents/*.md`) — copy a close
match and adapt, don't start from a blank file.

## Where agents live

- **Plugin agents** (shipped): `plugins/nxtg-forge/agents/<name>.md`.
- **Project-local agents** (a user's repo): `.claude/agents/<name>.md`.
- **Personal agents** (all your projects): `~/.claude/agents/<name>.md`.

An agent is a single markdown file: YAML frontmatter (config) + body (the system prompt).

## Frontmatter — valid fields only

```yaml
---
name: builder                 # REQUIRED. lowercase + digits + hyphens, ≤64 chars. No uppercase, no underscores.
description: |                 # REQUIRED. When Claude should delegate here. Add <example> blocks.
  Use this agent when ... This includes: ...
  <example>
  Context: ...
  user: "..."
  assistant: "I'll use the Task tool to launch the builder agent to ..."
  <commentary>Why builder is the right pick.</commentary>
  </example>
model: sonnet                  # optional. sonnet | opus | haiku. Omit to inherit the main thread's model.
color: green                   # optional. EXACTLY one of: purple cyan green orange blue red
tools: Glob, Grep, Read, Write, Edit, Bash, TodoWrite  # optional allowlist. Omit Task for leaf workers.
isolation: worktree            # optional. Own git worktree for conflict-free parallel file edits.
memory: project                # optional. project | user | local. Persists MEMORY.md across sessions.
skills: nxtg-forge:parallel-execution  # optional. Preloads FULL skill text at startup (token cost).
disallowedTools: WebFetch      # optional denylist, complements `tools`.
permissionMode: acceptEdits    # optional. default | acceptEdits | plan | dontAsk | bypassPermissions
---
```

**Field notes**
- **name** must match the delegate name Claude uses ("launch the builder agent"). It is also the
  discovery key — invalid casing/underscores make the agent silently not load.
- **description** is the routing engine, not documentation — see below.
- **model**: `sonnet` for most specialists; `opus` for orchestration/high-stakes judgment
  (`orchestrator`, `ceo-loop`); `haiku` only for cheap mechanical work. Omit to inherit.
- **tools**: allowlist. A leaf worker that must never spawn subagents omits `Task`.
- **isolation: worktree**: use for agents that write files in parallel with others (`builder`,
  `testing`) so edits land on separate branches instead of colliding.
- **memory: project**: use for agents that must remember across sessions (`learning`). Writes a
  git-tracked `MEMORY.md`.
- **skills**: preloads the entire skill body into the agent's context at startup — real routing
  cost, so only preload skills the agent uses every run.

## The description IS the routing rule

Claude reads only `description` (not the body) to decide whether to delegate. Write it for the
model, front-load the primary trigger, and enumerate concrete scenarios + keywords a user would
actually type. `<example>` blocks are the strongest matching signal — real agents carry 2+.

Shape from the real `testing` agent:

```yaml
description: |
  Use this agent when test generation, coverage analysis, or test infrastructure work is needed.
  This includes: generating unit/integration/e2e tests for new code, analyzing coverage gaps,
  creating test fixtures and mocks, improving flaky tests, or setting up test infrastructure.
  <example>
  Context: User has implemented a new service without tests.
  user: "I just wrote the NotificationService, can you generate tests?"
  assistant: "I'll use the testing agent to generate comprehensive tests for the NotificationService."
  <commentary>New code needs coverage — the testing agent's specialty.</commentary>
  </example>
```

## Gotchas

Real failure modes when authoring agents in this plugin — each one is a silent break, not an error.

1. **Invalid frontmatter fields are silently ignored — the agent still loads, but misconfigured.**
   Claude Code accepts ONLY the fields listed above. These common-looking fields do NOTHING:
   `shortname`, `avatar`, `whenToUse`, `exampleQueries`, `when_to_use`, `color: teal/pink/yellow`.
   Put "when to use" text INSIDE `description`, not in a separate key. (Origin: the old version of
   this very skill shipped a "minimal example" using `shortname/avatar/whenToUse/exampleQueries` —
   all four are ignored.)
2. **`name` casing breaks discovery.** `NXTG-CEO-LOOP` did not load until renamed to `ceo-loop`.
   Lowercase + hyphens only; no uppercase, no underscores, ≤64 chars.
3. **`color` is a fixed 6-value enum.** `purple cyan green orange blue red` — any other value
   (teal, yellow, pink, hex) is ignored and the agent falls back to default coloring.
4. **Leaf workers must omit `Task` or they can spawn subagents.** Pattern in this plugin: leaf
   workers (`testing`, `learning`, `crucible-detective`) have NO `Task`; orchestrators (`builder`,
   `guardian`, `orchestrator`) DO. Giving a leaf `Task` invites accidental fan-out and runaway cost.
5. **`skills:` preload is not free.** It injects the whole SKILL.md into the agent's context at
   startup every run. `crucible-detective` preloads three skills deliberately; don't preload a
   skill the agent only occasionally needs — reference it in the body instead.
6. **`read-only` agents still need `Bash` denied, not just `Write`/`Edit` omitted.**
   `crucible-detective` is read-only and lists `Glob, Grep, Read, Bash` — Bash is present because
   it runs test/coverage commands, but it never writes. If you want a truly read-only agent, omit
   Write/Edit AND scope or drop Bash; `permissionMode: plan` enforces read-only exploration.
7. **`model` omitted ≠ sonnet.** Omitting `model` inherits the *caller's* model, which may be opus
   or haiku. State `model:` explicitly when the agent's cost/quality tier matters.
8. **`isolation: worktree` needs a clean git repo.** It creates a worktree/branch; on a repo with a
   dirty index or detached HEAD the isolation can fail to set up. Reserve it for agents that
   genuinely edit files in parallel.

## Worked example — a leaf specialist

Goal: an agent that audits dependency licenses, read-only, never spawns subagents.

```markdown
---
name: license-auditor
description: |
  Use this agent to audit dependency licenses for compliance risk — flagging GPL/AGPL/copyleft
  in a permissive-licensed project, missing LICENSE files, or license changes across versions.
  This includes: scanning package.json/Cargo.toml/requirements, mapping each dep to its license,
  and reporting incompatibilities.
  <example>
  Context: User is prepping a proprietary release and worries about copyleft deps.
  user: "Do any of our npm dependencies have GPL licenses?"
  assistant: "I'll use the license-auditor agent to scan dependencies and flag copyleft licenses."
  <commentary>License-compatibility scanning is exactly this agent's job; it's read-only.</commentary>
  </example>
model: sonnet
color: orange
tools: Glob, Grep, Read, Bash
---

# ⚖️ License Auditor

You audit dependency licenses for compatibility risk. You never modify files.

## Responsibilities
- Enumerate dependencies from manifests (package.json, Cargo.toml, requirements.txt).
- Resolve each dependency to its SPDX license.
- Flag copyleft (GPL/AGPL/LGPL) in a permissive-licensed project and any missing LICENSE.

## Protocol
1. Detect the stack and locate manifest files.
2. Read declared licenses (Bash: `npm ls --json`, `cargo license`, `pip-licenses`).
3. Classify each into permissive / weak-copyleft / strong-copyleft.
4. Report incompatibilities with the project's own license, with remediation options.

## Done when
- Every dependency is classified.
- Every incompatibility names the dep, its license, and a remediation.
```

Why it's correct: valid `name`, real `color`, `Task` omitted (leaf), `Bash` kept (it runs
license tooling) but `Write`/`Edit` omitted (read-only), `description` front-loads the trigger
with a concrete `<example>`.

## Body structure that works here

The plugin's agents follow a consistent house style. A workable skeleton:

```markdown
# <emoji> Display Name

You are the **Role** — one-line identity.

## Responsibilities
- What this agent owns (3–5 bullets).

## Protocol
1. Discovery → 2. Plan → 3. Execute → 4. Validate  (concrete steps, not narration)

## Decision framework
Criteria for the judgment calls this agent makes.

## Done when
Explicit completion gates — what "finished" means.
```

Keep the body tight: it is the system prompt and costs tokens every invocation. State what to do,
not why. Match the tone of a sibling agent (read one before writing).

## Coordination patterns

- **Sequential**: `planner → builder → guardian` (plan, build, gate).
- **Parallel**: an orchestrator with `Task` fans out to isolated (`isolation: worktree`) workers,
  then merges — up to the measured concurrency ceiling, not unbounded.
- **Iterative**: `builder ⇄ testing` feedback loop until gates pass.

Only agents with `Task` in `tools` can launch other agents — that is the coordinator/leaf split.

## Validation checklist before shipping an agent

- `name` is lowercase-hyphen, ≤64 chars, and matches how you delegate to it.
- `description` front-loads the primary trigger and has ≥1 `<example>` block.
- `color` is one of the 6 valid values; `model` is stated when tier matters.
- `tools` is minimal; `Task` present only if the agent orchestrates.
- No ignored fields (`shortname/avatar/whenToUse/exampleQueries`).
- Body has explicit "done when" gates.
- Diff against a sibling real agent (`agents/*.md`) for house-style consistency.

## Learn from real agents

Instead of a template, open a close match in `plugins/nxtg-forge/agents/`:
- `builder.md` — worktree-isolated specialist that writes code + tests (`isolation`, `skills` preload).
- `testing.md` — leaf worker, no `Task`.
- `orchestrator.md` — opus coordinator with `Task`.
- `learning.md` — cross-session `memory: project`.
- `crucible-detective.md` — read-only auditor (`Glob, Grep, Read, Bash`), multi-skill preload.

Copy the nearest one, then change `name`, `description`, and the body.

---

**Remember**: the `description` decides whether your agent is ever used, and only valid frontmatter
fields take effect. Ground every new agent against a real sibling in `agents/`.
