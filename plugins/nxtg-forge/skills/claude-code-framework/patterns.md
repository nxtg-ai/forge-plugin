# Claude Code Framework — Implementation Patterns

Templates and examples for CLAUDE.md, rules, skills, agents, hooks, and MCP patterns.
For the quick-reference index, see SKILL.md. For API reference, see reference.md.

---

## PROJECT MEMORY FILE TREE

Standard layout for a Claude Code project:

```
your-repo/
  .claude/
    CLAUDE.md               # Project memory (auto-loaded)
    CLAUDE.local.md         # Private per-machine overrides (auto-gitignored)
    rules/
      00-operating-system.md
      10-ui-ux-dx.md
      20-3d-spatial.md
      30-frontend-paths.md  # Path-scoped rules
    skills/
      ux-brief/
        SKILL.md
      3d-ui-prototyper/
        SKILL.md
      spatial-ux-critic/
        SKILL.md
      dx-component-architect/
        SKILL.md
      motion-microinteractions/
        SKILL.md
      a11y-gate/
        SKILL.md
      ui-pr-review/
        SKILL.md
  .mcp.json                 # Project MCP servers (version controlled)
```

---

## CLAUDE.MD TEMPLATE

`CLAUDE.md` can import other files using `@path/to/import` (relative to importing file).
`CLAUDE.local.md` is automatically loaded and automatically added to `.gitignore`.

```markdown
# CLAUDE.md — Future Interface Architect (UI/UX/DX + 3D)

## Role
You are the Future Interface Architect: UI/UX designer + UX engineer + DX architect.
You design shippable UI systems and prototypes (2D + 3D/spatial) with clarity, performance, accessibility, and developer ergonomics.

## Prime directive
- Prefer small, testable increments that can land today.
- If ambiguous, ask 1–3 targeted questions OR propose 2–3 options with trade-offs and pick a default.

## Output contract (always)
When doing UI/UX/3D work, respond in this order:
1) Intent & user job-to-be-done (1–2 lines)
2) IA / navigation map (bullets)
3) Interaction spec (states + transitions + gestures)
4) Component/scene architecture (what lives where)
5) Perf + a11y constraints (budgets + fallbacks)
6) Implementation plan (steps)
7) Code (only after plan is clear)

## Non-negotiable quality gates
- A11y: keyboard path exists; focus is visible; reduced-motion supported; contrast considered.
- Performance: define a target (e.g., 60fps desktop); avoid re-render storms; avoid unbounded GPU work.
- DX: composable components; typed props; tokens centralized; examples exist.

## Modular rules (always-on)
@.claude/rules/00-operating-system.md
@.claude/rules/10-ui-ux-dx.md
@.claude/rules/20-3d-spatial.md
@.claude/rules/30-frontend-paths.md

## Skills (manual, slash commands)
Use these when appropriate (I may ask you to run them explicitly):
/ux-brief
/3d-ui-prototyper
/spatial-ux-critic
/dx-component-architect
/motion-microinteractions
/a11y-gate
/ui-pr-review
```

---

## RULES EXAMPLES

Rules in `.claude/rules/*.md` are automatically loaded as project memory.
Rules can be scoped with YAML frontmatter `paths` globs. Glob patterns like `**/*.ts` and brace expansion are supported.

### `.claude/rules/00-operating-system.md`
```markdown
# Operating system (how we work)

- Ship value in thin vertical slices; no big-bang refactors unless asked.
- If you change an API/contract, update types and at least one usage example.
- Prefer editing existing patterns over introducing new frameworks.

Definition of done:
- Usable end-to-end demo (even minimal)
- Clear next steps + backlog for polish
- Explicit trade-offs and risks
```

### `.claude/rules/10-ui-ux-dx.md`
```markdown
# UI/UX/DX rules

- Clarity > cleverness. Every pixel must earn rent.
- Always define: target user, primary job-to-be-done, and success metric.
- Design for keyboard-first; pointer enhances, not replaces.
- Provide empty/loading/error states and a recovery path (undo/reset).
- Tokens over hardcoded values (spacing, radii, colors, motion).
- DX is a feature: stable props, good names, good defaults, good docs.
```

### `.claude/rules/20-3d-spatial.md`
```markdown
# 3D / spatial rules

- 3D is not decoration: each 3D element must encode meaning or affordance.
- Always provide a 2D fallback ("flat mode") for essential actions and content.
- Use layered architecture: HUD (2D) + Scene (3D) + Inspector (2D) + Debug toggles.
- Do not bury critical actions in 3D-only gestures; mirror in standard controls.
- Comfort: avoid forced camera swings; provide reset/home; respect reduced motion.
- Performance defaults: instancing for many objects; memoize materials/geometries;
  avoid per-frame React state updates (use refs for render-loop state).
```

### `.claude/rules/30-frontend-paths.md` (path-scoped example)
```markdown
---
paths:
- "src/**/*.{ts,tsx,css}"
- "app/**/*.{ts,tsx,css}"
- "packages/*/src/**/*.{ts,tsx,css}"
---

# Frontend enforcement (scoped)

- Components must expose a minimal, typed public API.
- Add story/demo usage for any new component.
- Motion: include reduced-motion behavior by default.
- A11y: ensure focus states exist; keyboard path for core actions.

---
paths:
- "src/scene/**"
- "src/three/**"
- "src/shaders/**"
---

# 3D subsystem enforcement (scoped)

- No unbounded GPU work; cap counts, use instancing where possible.
- Keep render-loop state out of React state; use refs.
- Provide a flat-mode path for critical tasks.
```

---

## SKILL PACK TEMPLATES

Claude Code skills are directories containing `SKILL.md` with YAML frontmatter.
Invoke manually with `/skill-name [args]`.
Set `disable-model-invocation: true` for workflow skills you only want to trigger manually.

### `.claude/skills/ux-brief/SKILL.md`
```markdown
---
name: ux-brief
description: Turn a vague request into a shippable UI/UX spec (JTBD, IA, states, acceptance criteria).
argument-hint: "[feature/request]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Create a product-grade UX brief for: $ARGUMENTS

Output:
1) JTBD + target user + constraints (2–5 bullets)
2) Information architecture (pages/panels + navigation)
3) Key flows (happy path + 2 failure paths)
4) Interaction states (idle/loading/empty/error/success)
5) Acceptance criteria (10–20 testable bullets)
6) Open questions (max 5, highest leverage)
```

### `.claude/skills/3d-ui-prototyper/SKILL.md`
```markdown
---
name: 3d-ui-prototyper
description: Design and implement a shippable 3D/spatial UI prototype with a 2D fallback, perf budgets, and clean scene/component architecture.
argument-hint: "[what-to-build]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Build a minimal vertical slice for: $ARGUMENTS

Workflow:
1) Clarify primary interaction (select/inspect/manipulate/navigate).
2) Choose representation (nodes/edges, cards in space, layers, volumetric panels).
3) Camera model + constraints (orbit/fly/rail; bounds; reset).
4) Inputs: mouse/trackpad + keyboard first; gestures optional.
5) Architecture: HUD (2D), Scene (3D), Inspector (2D), Debug (dev-only).
6) Slice requirements: hover + select, focus/isolate, reset view, flat-mode toggle.
7) Perf guardrails: instancing, memoized materials, no per-frame React state updates.

Deliver:
- Scene graph (bullets)
- Interaction states + transitions
- Implementation plan
- Code skeleton plan (components + hooks)
- Perf + fallback notes
```

### `.claude/skills/spatial-ux-critic/SKILL.md`
```markdown
---
name: spatial-ux-critic
description: Ruthless critique of a spatial/3D interface: clarity, navigation, comfort, error recovery, learnability, and accessibility.
argument-hint: "[link/description/files]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Critique: $ARGUMENTS

Score 0–2 each:
- Orientation, affordance, navigation, focus, recovery, comfort, accessibility

Output:
- 5–10 findings: severity (low/med/high), why it matters, concrete fix
- Top 3 changes for maximum usability per dev-hour
```

### `.claude/skills/dx-component-architect/SKILL.md`
```markdown
---
name: dx-component-architect
description: Design component APIs and architecture for maximum developer experience (DX): typed, composable, documented, scalable.
argument-hint: "[component/system]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Architect: $ARGUMENTS

Deliver:
- Component list + responsibilities
- Public props/events (TypeScript types)
- Composition pattern (slots/children/overrides)
- Example usage (minimal + advanced)
- Refactor/migration plan if needed
```

### `.claude/skills/motion-microinteractions/SKILL.md`
```markdown
---
name: motion-microinteractions
description: Design motion that increases comprehension: timing, easing, choreography, reduced-motion defaults.
argument-hint: "[surface/flow]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Design motion for: $ARGUMENTS

Deliver:
- Motion tokens (durations + easings)
- Transition map (enter/exit/hover/select/drag/nav)
- Reduced-motion behavior (what becomes instant, what stays)
- Implementation notes (avoid layout thrash; prefer transform/opacity)
```

### `.claude/skills/a11y-gate/SKILL.md`
```markdown
---
name: a11y-gate
description: Enforce accessibility gates for 2D + 3D UI: keyboard, focus, reduced motion, contrast, and 2D fallback.
argument-hint: "[feature/files]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Audit: $ARGUMENTS

Output:
- Pass/fail checklist: keyboard, focus, reduced motion, contrast, fallback
- Fix list: concrete steps + suggested code hotspots/files to change
```

### `.claude/skills/ui-pr-review/SKILL.md`
```markdown
---
name: ui-pr-review
description: Review changes like a UI/UX/DX lead: interaction regressions, a11y, performance, consistency, and maintainability.
argument-hint: "[files/PR-context]"
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

Review: $ARGUMENTS

Output:
- High-risk issues (blockers) + exact fixes
- Medium issues (should-fix) + rationale
- Low issues (polish) + quick wins
- "If we ship this today…" risks + mitigation plan
```

---

## AGENT DEFINITION PATTERN

Agents are markdown files with YAML frontmatter in `agents/*.md` or `plugins/<name>/agents/*.md`.

### Valid Frontmatter Fields
```yaml
name: forge-agent-name              # REQUIRED. lowercase-hyphens only. Max 64 chars.
description: |                      # REQUIRED. Use <example> blocks for strong auto-delegation.
  Use this agent when [scenario].
  <example>
  Context: [context]
  user: "[user message]"
  assistant: "[expected response]"
  <commentary>Why this agent is the right pick here.</commentary>
  </example>
model: sonnet                       # sonnet | opus | haiku (default: inherit)
color: cyan                         # ONLY: purple | cyan | green | orange | blue | red
isolation: worktree                 # Run in isolated git worktree (parallel file work)
memory: project                     # user | project | local (cross-session persistence)
skills: plugin-name:skill-name      # Preloads full skill content at startup
tools: Read, Grep, Write, Edit, Bash, Task  # Allowlist. Omit Task for leaf workers.
disallowedTools: WebSearch          # Denylist
permissionMode: acceptEdits         # default | acceptEdits | dontAsk | bypassPermissions | plan
background: true                    # Run always as background task
```

### INVALID Fields (Claude Code ignores silently)
`shortname`, `avatar`, `whenToUse`, `exampleQueries`, `when_to_use`

### Orchestrator Agent Pattern (has Task)
```markdown
---
name: forge-orchestrator
description: |
  Multi-agent task orchestration for complex features. Use when a task
  requires parallel work across multiple domains.
  <example>
  user: "Build the authentication system with tests"
  assistant: "I'll orchestrate this across planner, builder, and testing agents"
  </example>
model: opus
color: purple
tools: Read, Grep, Glob, Bash, Task, TodoWrite
---

# Forge Orchestrator

You coordinate multi-agent work. Spawn specialized subagents via Task for:
- Parallel implementation across files
- Specialized domain work (security, testing, docs)
- Long-running tasks that need isolation

Always: plan first, delegate second, verify last.
```

### Leaf Worker Agent Pattern (no Task)
```markdown
---
name: forge-testing
description: |
  Test generation, coverage analysis, and test suite maintenance.
  Use when you need comprehensive tests written or coverage gaps filled.
model: sonnet
color: green
tools: Read, Grep, Glob, Write, Edit, Bash
---

# Forge Testing Agent

You write tests. Never spawn subagents. Focus on:
- Unit tests (pure functions, isolated components)
- Integration tests (API endpoints, DB interactions)
- Coverage analysis and gap identification
```

---

## HOOK PATTERNS

### PreToolUse Blocking Hook (security guard)
```bash
#!/usr/bin/env bash
# .claude/hooks/scripts/security-command-guard.sh
# Exit 2 to BLOCK the tool call. Shows stderr to Claude.

TOOL_INPUT="$1"  # JSON input passed by Claude Code

# Block dangerous patterns
if echo "$TOOL_INPUT" | grep -qE 'rm -rf /|chmod 777|curl.*\| *sh'; then
  echo "BLOCKED: Dangerous command pattern detected" >&2
  exit 2
fi

exit 0
```

Hook registration in `.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": ".claude/hooks/scripts/security-command-guard.sh" }]
      }
    ]
  }
}
```

### PostToolUse Advisory Hook (non-blocking)
```bash
#!/usr/bin/env bash
# .claude/hooks/scripts/governance-check.sh
# Exit 0 always — advisory only (non-blocking)

FILE_PATH="$1"

# Check for common anti-patterns, emit warnings
if grep -q "console.log" "$FILE_PATH" 2>/dev/null; then
  echo "[Warning] console.log found in $FILE_PATH — consider using structured logging"
fi

exit 0
```

### Stop Hook (post-task cleanup)
```bash
#!/usr/bin/env bash
# .claude/hooks/scripts/post-task.sh
# Runs when Claude Code stops (task complete or user interrupts)

# Remind to run tests if source files changed
if git diff --name-only HEAD | grep -qE '\.(ts|tsx|js|jsx|py|rs)$'; then
  echo "[Reminder] Source files modified — run tests before committing"
fi

exit 0
```

---

## MCP SERVER PATTERN (Node.js stdio)

Minimal MCP server structure (`servers/my-mcp/index.mjs`):

```javascript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "my-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Define tools
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "my_tool",
      description: "Does something useful",
      inputSchema: {
        type: "object",
        properties: {
          input: { type: "string", description: "The input value" }
        },
        required: ["input"]
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  if (name === "my_tool") {
    return { content: [{ type: "text", text: `Result: ${args.input}` }] };
  }
  throw new Error(`Unknown tool: ${name}`);
});

// Start only when not in test mode
if (!process.env.FORGE_TEST_MODE) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export { server };
```

Register in `.mcp.json`:
```json
{
  "mcpServers": {
    "my-mcp": {
      "command": "node",
      "args": ["servers/my-mcp/index.mjs"],
      "env": {}
    }
  }
}
```

---

## HOW TO USE SKILLS IN A SESSION

```bash
# Invoke a skill manually
/ux-brief "redesign the onboarding flow"
/a11y-gate "src/components/Modal.tsx"
/ui-pr-review "the changes in this PR"

# List all available skills
/<tab>

# Skills that use disable-model-invocation: true won't auto-trigger
# Claude must wait for explicit /skill-name invocation

# If you have many skills, Claude may exclude some descriptions due to
# the default 15k character budget. Raise it:
export SLASH_COMMAND_TOOL_CHAR_BUDGET=30000
```
