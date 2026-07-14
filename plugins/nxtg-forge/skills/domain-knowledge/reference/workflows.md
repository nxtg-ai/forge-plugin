# NXTG-Forge Workflows (detail)

Real `forge` CLI verbs (from `forge-orchestrator/src/cli/mod.rs`):
`init · plan · status · run · start · sync · mcp · dashboard · verify · uat ·
ship · config · uninstall`.

> Historical docs referenced `forge spec generate`, `forge generate`,
> `forge recovery`, `forge health`, `forge gap-analysis`, `forge checkpoint`.
> Those were an earlier Python prototype and are NOT in the shipped binary. Use
> the verbs above.

## Workflow 1: New project

```bash
forge init my-app          # scaffold + create .forge/state.json
# author SPEC.md (or PRD.md / REQUIREMENTS.md / README.md)
forge plan --generate      # generate a task plan from the spec
forge status               # task board
```

## Workflow 2: Feature development

```bash
forge status               # what's claimed / in-progress / done
forge run                  # execute planned tasks autonomously
forge dashboard            # TUI: live task board + PTY agent sessions
```

Conceptual agent hand-off:

```
Lead Architect (design) → Backend Master (API + schema)
    → QA Sentinel (tests) → Platform Builder (deploy)
```

Task lifecycle + file locking live in `src/core/task.rs`; every transition is
appended to `.forge/events.jsonl`.

## Workflow 3: Verify & UAT

```bash
forge verify               # governance / quality gate checks
forge uat --finding "..."  # record a UAT finding against the run
```

## Workflow 4: Ship

```bash
forge ship --dry-run       # preview: suggested SemVer bump + changelog entry
forge ship                 # append to CHANGELOG.md, apply version bump
```

`forge ship` appends a changelog entry to the project's `CHANGELOG.md` if
present and suggests a version bump from the event history
(`src/cli/ship.rs`, `ship::suggest_version_bump`).

## Workflow 5: Health & drift (via MCP, not a CLI verb)

Health and gap signals come from MCP tools, not a `gap-analysis` subcommand:

- `forge_get_health` / `forge_check_drift` (orchestrator-mcp, Rust)
- `forge_get_governance_health` / `forge_security_scan` (governance-mcp, Node)

Call these from Claude Code (the plugin wires both servers via `.mcp.json`).
