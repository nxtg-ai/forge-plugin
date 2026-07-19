# Contract — `governance-mcp` project binding (the Node -16 pin)

**Origin:** DIRECTIVE-NXTG-20260719-19 applied the orchestrator's **-16 class-propagation rule** (server-global project-binding) to the Node governance-mcp. This doc pins the *current, correct* binding contract; it is enforced by `tests/integration/binding-journey.mjs` (the two-consumer instrument).

## The contract

1. **Explicit `FORGE_PROJECT_ROOT` at spawn WINS.** `start.sh:10` — `export FORGE_PROJECT_ROOT="${FORGE_PROJECT_ROOT:-$(pwd)}"` — honors an explicitly-set root; `pwd` is only the fallback, captured **before** `cd "$(dirname "$0")"` (`start.sh:12`) moves into the server dir. `.mcp.json` sets it from `${CLAUDE_PROJECT_DIR}`.
2. **Every tool resolves the root the same way.** All 8 tool functions default `root = process.env.FORGE_PROJECT_ROOT || process.cwd()` (`tools.mjs:108,136,179,307,467,526,554,635`); `dispatchToolCall` (`index.mjs:132-141`) invokes them with no argument, so they use that env-backed default.
3. **One server process = one project for its life.** The process env is fixed at spawn, so the bound project does not change while the server runs. This matches the -16 posture: **explicit binding is authoritative and is not silently overridden.**
4. **No `set_project` / per-call project surface in Node.** Unlike the Rust orchestrator (which exposes `forge_set_project` and, post-16, *refuses* it under an explicit binding), the Node server has **no rebind tool**. There is nothing to refuse — the orchestrator's "refuse set_project under explicit binding" has no Node analogue.
5. **Rebinding to another project requires a NEW server process.** This is the MCP **stdio lifecycle** (one client ↔ one server ↔ one project), **not** the March "stale-binding" bug. It is an honestly-documented limitation, and the intended deployment shape (each project spawns its own governance-mcp with its own `FORGE_PROJECT_ROOT`).

## Two-consumer instrument (what `binding-journey.mjs` proves live)

| Spawn | `FORGE_PROJECT_ROOT` | `cwd` | Served project |
|---|---|---|---|
| consumer A | `projA` dir | `projA` | **projA** |
| consumer B | `projB` dir | `projB` | **projB** (isolated from A) |
| explicit-wins | `projA` dir | `projC` | **projA** (explicit env beats cwd) |
| startup-default | *(unset)* | `projB` | **projB** (pwd fallback; single-project default preserved) |
| rebind surface | — | — | **none** — `tools/list` has no `set_project` |

## Relationship to orchestrator -16

The orchestrator killed the server-global binding class on the Rust side by making explicit binding win and refusing `set_project` under it. The Node sibling arrives at the **same guarantee** (explicit binding authoritative, no silent override) through a **different mechanism** — it has no rebind surface to begin with, so single-project-per-process is the contract, pinned here rather than "fixed."
