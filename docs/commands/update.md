# /forge:update

> Update the Forge plugin to the latest version with a built-in workaround for Claude Code's stale marketplace cache (bug #29071).

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Setup & Maintenance |
| **Syntax** | `/forge:update [--check] [--plugin] [--config]` |

---

## What It Does

`/forge:update` handles the full plugin update lifecycle, including a workaround for a known Claude Code issue (#29071) where `plugin update` fetches new content but never merges it into the local marketplace clone. The command first detects your current installation (plugin name, scope, marketplace version), then manually pulls the latest from the marketplace git clone, and finally runs the standard update command. If the standard update fails, it escalates through progressively more aggressive methods: scope-specific updates, full reinstall, and finally a nuclear clean install.

After the plugin update, the command also checks your project configuration: verifying `governance.json` is valid, checking if the schema needs migration, and confirming hooks are configured. This ensures that both the plugin and your project config are current.

The critical detail: after any update, commands, agents, and skills only reload on session restart. The command tells you this clearly and suggests restarting Claude Code to pick up changes.

## Syntax & Options

```
/forge:update [--check] [--plugin] [--config]
```

| Option | Description |
|--------|------------|
| `--check` | Only check what version is available without making changes |
| `--plugin` | Only update the plugin itself, skip project config check |
| `--config` | Only check and update project governance config and hooks |

## When to Use It

- **After a new Forge release**: Update to get the latest commands, agents, and skills.
- **When commands seem outdated**: If a command is missing features documented online, you may be on a stale version.
- **Troubleshooting plugin issues**: The escalation chain (standard update -> reinstall -> clean install) resolves most plugin problems.

For initial installation, use `claude plugin marketplace add nxtg-ai/forge-plugin && claude plugin install nxtg-forge`. For project-level initialization, use `/forge:init`.

## Examples

### Example 1: Standard Update

```
/forge:update
```

```
## Forge Update

**Installed:** nxtg-forge (local)
**Marketplace version:** v3.5.0

Syncing marketplace... SYNCED: v3.5.1
Updating plugin... Updated.

## Update Complete

| Component | Status |
|-----------|--------|
| Marketplace | synced to v3.5.1 |
| Plugin | updated |
| Governance | valid |
| Hooks | active |

**Next:** Restart Claude Code to load the new version, then /forge:status
```

### Example 2: Check Only

```
/forge:update --check
```

Reports the available version without making any changes. Useful for checking whether an update is available before committing to it.

### Example 3: Recovery from Failed Update

If the standard update fails, the command automatically escalates:

```
Method A (standard update): failed - "not found"
Method B (scope-specific): failed
Method C (reinstall): success

Updated. Restart your Claude Code session to load the new version.
```

## Power Use Cases

Run `/forge:update --check` periodically to see if new versions are available without disrupting your session. When ready to update, run `/forge:update` and then restart Claude Code.

If you are testing a pre-release version with `--plugin-dir`, use `/forge:update --config` to only check project config without touching the plugin installation.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:init** | Init sets up the project; update keeps the plugin current |
| **/forge:status** | Run status after updating and restarting to verify everything works |
| **governance MCP** | MCP server code updates require a session restart to take effect |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full plugin update with marketplace sync, escalation chain, and config check |
| **L2 Pro Builder** | Update also checks forge-orchestrator binary version compatibility |
| **L3 Ship Lord** | Update notifications shown in the forge-ui dashboard |

## Tips & Gotchas

- You MUST restart Claude Code after updating. Updated commands, agents, skills, and MCP server code only load on session start.
- The marketplace sync workaround (git pull on the local clone) is necessary because Claude Code's `plugin update` has a known bug where it fetches but does not merge.
- If all four update methods fail, the command provides manual terminal commands you can run outside Claude Code.
- The `--config` flag is useful when you manually updated the plugin and just need to verify project compatibility.

---

*See also: [init](../commands/init.md) | [status](../commands/status.md)*
