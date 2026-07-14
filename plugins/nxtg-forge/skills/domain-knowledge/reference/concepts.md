# NXTG-Forge Core Concepts (detail)

Overview and Gotchas live in [../SKILL.md](../SKILL.md). This file expands the
six foundational concepts. Where a concept touches the shipped `forge` binary,
the facts below match the Rust orchestrator (`forge-orchestrator/src/`).

## 1. Project Specification

A natural-language description of what to build. The orchestrator's
`forge plan --generate` reads the first it finds of `SPEC.md`, `spec.md`,
`PRD.md`, `REQUIREMENTS.md` (or falls back to `README.md`) and turns it into a
task plan (`forge-orchestrator/src/cli/plan.rs`).

Example `SPEC.md`:

```markdown
# E-Commerce Platform

**Type:** Web Application · **Language:** Python · **Framework:** FastAPI

## Core Features
- User authentication and authorization
- Product catalog with search
- Shopping cart and checkout (Stripe)

## Technical Requirements
- PostgreSQL, Redis cache, RESTful API, JWT auth
```

## 2. Agent Orchestration

Instead of one monolithic model, work is split across specialized agents. Each
maps to a sibling skill under `skills/`:

| Concept role       | Sibling skill                 |
|--------------------|-------------------------------|
| Lead Architect     | `agent-lead-architect`        |
| Backend Master     | `agent-backend-master`        |
| CLI Artisan        | `agent-cli-artisan`           |
| Platform Builder   | `agent-platform-builder`      |
| Integration Spec.  | `agent-integration-specialist`|
| QA Sentinel        | `agent-qa-sentinel`           |

## 3. State Management

The orchestrator persists state to **`.forge/state.json`** (not
`.claude/state.json`) via `StateManager` (`src/core/state.rs`), with an
append-only audit log at **`.forge/events.jsonl`** (`src/core/event.rs`).

Illustrative shape:

```json
{
  "project": { "name": "my-app", "type": "web-app" },
  "tasks": { "completed": [], "in_progress": [], "planned": [] }
}
```

Enables session recovery, progress tracking, and health/drift monitoring.

## 4. Clean Architecture

Generated code targets four layers with inward-pointing dependencies:

```
Domain (core business logic)
   ↓  Application (use cases)
   ↓  Infrastructure (external interfaces)
   ↓  Interface (UI/CLI/API)
```

Dependency Rule: inner layers never import outer layers.

## 5. Drift / Gap Analysis

The orchestrator exposes `forge_check_drift` and `forge_get_health` (MCP tools)
plus the plugin-side `forge_get_governance_health`. These surface testing,
architecture, security, documentation, and code-quality gaps as a health score.
There is **no** `forge gap-analysis` subcommand — analysis is delivered through
MCP tools and `forge verify` / `forge status`.

## 6. MCP Server Integration

The plugin registers two MCP servers (governance-mcp Node.js, orchestrator-mcp
Rust) plus optional semgrep-mcp. Project-specific MCP servers (database, GitHub,
web search) are configured per project as needed.
