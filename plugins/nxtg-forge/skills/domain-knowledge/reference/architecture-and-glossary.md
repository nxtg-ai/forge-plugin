# NXTG-Forge Architecture, Value & Glossary (detail)

## Component map

```
Claude Code CLI  →  forge (Rust CLI/MCP)  →  { StateManager · Orchestrator · Drift/Health }
                                                   ↓
                                          .forge/state.json + .forge/events.jsonl
```

Data flow: spec (SPEC.md) → `forge plan` (task plan) → `forge run` (agents
execute) → events appended → `forge verify`/health surfaces gaps → `forge ship`.

## Workspace layout (real, per top-level CLAUDE.md)

`~/projects/NXTG-Forge/` is a **workspace of 3 independent repos** (not a
monorepo):

```
forge-ui/            React 19 + Vite dashboard (:5050)
forge-orchestrator/  Rust CLI + MCP server (binary: forge)
forge-plugin/        Claude Code plugin (this repo: commands/agents/skills/hooks)
```

Integration is MCP-only; no shared code between repos.

## Per-project runtime layout (a forge-managed project)

```
project-root/
├── .forge/            state.json · events.jsonl (orchestrator SoT)
├── .claude/           governance.json · skills/ · hooks/ (Claude Code)
├── SPEC.md            project specification (plan input)
├── CHANGELOG.md       ship target
└── src/ · tests/ · docs/
```

## Value proposition (vision)

**Developers** — production-ready structure fast; Clean Architecture from day
one; specialized agents; state/checkpoint resilience.
**Teams** — consistent architecture/tooling; fast onboarding; health-score
visibility.

Aspirational quality targets (not enforced defaults): high test coverage, zero
lint/type errors, 90+ health score.

## Common use cases

1. **Rapid prototyping** — spec → `forge plan`/`run` → validate in hours.
2. **Legacy modernization** — new Clean-Architecture shell + drift-guided
   incremental migration.
3. **Team standardization** — shared skills/config so every service matches.
4. **Learning** — read generated structure + `skills/` docs as worked examples.

## Roadmap (vision — not a delivery commitment)

Skills & docs (current) → workflow automation (prompt templates, TDD) →
advanced (multi-agent parallel execution, learning from past projects,
template marketplace) → collaboration, auto dependency/security patching.

## Glossary

- **Agent** — specialized AI role (see `agent-*` skills).
- **Checkpoint** — saved snapshot of project state.
- **Clean Architecture** — four layers, inward-pointing dependencies.
- **Domain Layer** — core business logic, framework-independent.
- **Drift / Gap Analysis** — automated gap detection via MCP health tools.
- **Health Score** — 0–100 project-quality metric (A–F grade).
- **Hook** — bash script at a Claude Code lifecycle event.
- **MCP Server** — Model Context Protocol server extending Claude.
- **Orchestrator** — assigns tasks to agents by capability (`forge run`).
- **Project Specification** — natural-language build description (SPEC.md).
- **Skill** — markdown context auto-loaded (or invoked) by Claude Code.
- **State** — `.forge/state.json` orchestration snapshot.
- **Use Case** — application-layer component orchestrating domain logic.

## Lessons learned (living)

**2026-01-31 — Multi-device dev access.** Symptom: API calls fail from
mobile/tablet with CORS errors. Cause: `.env` `VITE_API_URL=http://localhost:...`
overrides dynamic URL detection. Fix: drop hardcoded localhost, use relative
URLs + Vite proxy. Captured in `dev-environment-patterns` skill + env-validator
hook. Pattern: **Problem → Debug → Document → Automate prevention.**
