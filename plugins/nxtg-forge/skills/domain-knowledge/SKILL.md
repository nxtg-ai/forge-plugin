---
name: Domain Knowledge
description: >-
  NXTG-Forge product domain knowledge — the mission, core concepts (project
  spec, agent orchestration, state, Clean Architecture, drift/gap analysis, MCP),
  the real `forge` CLI surface, and the 3-repo workspace layout. Use when
  onboarding to what NXTG-Forge IS and why, when a spec/task/agent-orchestration
  question needs product framing, or before describing forge CLI/state behavior
  (avoids repeating retired Python-prototype commands).
when_to_use: >-
  Onboarding to the NXTG-Forge product/vision; explaining the specification →
  plan → run → verify → ship lifecycle; mapping the specialized agent roles;
  clarifying where state lives (.forge/state.json) and which `forge` subcommands
  actually exist; any "what is NXTG-Forge / how does forge work at a concept
  level" question.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# NXTG-Forge Domain Knowledge

## What NXTG-Forge is

A **self-deploying AI development infrastructure** for Claude Code. Not just a
code generator — an intelligent scaffolding + orchestration system that reads a
project's specification, plans tasks, dispatches specialized agents, and tracks
state across the development lifecycle.

**Mission:** "From specification to production in minutes, not days."

It bridges idea → implementation by: (1) turning a natural-language spec into a
task plan, (2) orchestrating specialized agents, (3) persisting state for
recovery, (4) surfacing quality gaps, (5) integrating natively with Claude Code.

**Problem it solves:** static templates don't adapt; ordinary scaffolds have no
context memory, no orchestration, no state, and no quality signal. NXTG-Forge
adds AI-native intelligence to all four.

## The 3-repo workspace (real, not a monorepo)

```
forge-ui/            React 19 + Vite dashboard (:5050)
forge-orchestrator/  Rust CLI + MCP server — binary: `forge`
forge-plugin/        Claude Code plugin (commands/agents/skills/hooks) — this repo
```

Integration is **MCP-only**; there are no cross-repo code imports.

## Core concepts (at a glance)

1. **Project Specification** — natural-language build description. `forge plan
   --generate` reads `SPEC.md` (or `PRD.md`/`REQUIREMENTS.md`/`README.md`).
2. **Agent Orchestration** — work split across specialized roles (Lead
   Architect, Backend Master, CLI Artisan, Platform Builder, Integration
   Specialist, QA Sentinel), each backed by an `agent-*` sibling skill.
3. **State Management** — persisted to **`.forge/state.json`** with an
   append-only audit log at **`.forge/events.jsonl`**.
4. **Clean Architecture** — Domain → Application → Infrastructure → Interface,
   dependencies pointing inward only.
5. **Drift / Gap Analysis** — health + gap signals via MCP tools
   (`forge_get_health`, `forge_check_drift`, `forge_get_governance_health`).
6. **MCP Integration** — plugin registers governance-mcp (Node) +
   orchestrator-mcp (Rust); semgrep-mcp optional.

Full detail: [reference/concepts.md](reference/concepts.md).

## The real `forge` CLI surface

Verbs in the shipped Rust binary (`forge-orchestrator/src/cli/mod.rs`):

```
init · plan · status · run · start · sync · mcp · dashboard · verify · uat · ship · config · uninstall
```

Worked lifecycle:

```bash
forge init my-app        # scaffold + create .forge/state.json
# author SPEC.md
forge plan --generate    # spec → task plan
forge run                # agents execute planned tasks
forge verify             # governance / quality gate
forge ship --dry-run     # preview SemVer bump + CHANGELOG entry
```

Full workflows: [reference/workflows.md](reference/workflows.md).

## Gotchas

- **Retired Python-prototype commands.** Older docs (and prior versions of this
  skill) show `forge spec generate`, `forge generate`, `forge recovery`, `forge
  health`, `forge gap-analysis`, `forge checkpoint`. **None exist in the shipped
  binary.** Use the real verbs above; grep `forge-orchestrator/src/cli/mod.rs`
  before quoting any `forge` subcommand.
- **State path is `.forge/state.json`, NOT `.claude/state.json`.** The
  orchestrator's `StateManager` (`src/core/state.rs`) owns `.forge/`. `.claude/`
  holds Claude Code assets (governance.json, skills, hooks) — a different store.
- **Health/gap is an MCP surface, not a CLI verb.** There is no `forge
  gap-analysis`. Gap and drift signals arrive through MCP tools; the closest CLI
  verbs are `forge verify` and `forge status`.
- **`forge ship` needs a `CHANGELOG.md` to fully land.** If none exists it only
  prints the changelog instead of appending it (`src/cli/ship.rs`). Version-bump
  suggestion is derived from `.forge/events.jsonl`, so an empty event log yields
  a weak suggestion.
- **Concept role ≠ literal agent file name.** "Backend Master" the concept maps
  to the `agent-backend-master` skill / `builder`-family agent — don't quote the
  prose label as an invocable agent id.
- **Overlaps with `core-nxtg-forge`.** That sibling skill covers platform
  internals (agent system, governance, plugin architecture). This skill is the
  product/vision + concept layer. Route implementation-internals questions
  there; keep this one conceptual.

## Additional resources

- [reference/concepts.md](reference/concepts.md) — the six core concepts in
  depth, with the concept→sibling-skill agent map and state shapes.
- [reference/workflows.md](reference/workflows.md) — real-verb workflows
  (init/plan/run/verify/uat/ship) + the retired-command note.
- [reference/architecture-and-glossary.md](reference/architecture-and-glossary.md)
  — component map, workspace + per-project layout, value proposition, use cases,
  roadmap, glossary, and the living lessons-learned log.
