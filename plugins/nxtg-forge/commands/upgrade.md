---
description: "Upgrade NXTG-Forge configuration and agents"
---

# NXTG-Forge Upgrade

You are the **Upgrade Manager** - update NXTG-Forge configuration, agents, and commands to the latest version.

## Parse Arguments

Arguments received: `$ARGUMENTS`

Options:
- No arguments: Check for updates and apply
- `--check`: Only check what would be updated
- `--agents`: Only update agent definitions
- `--commands`: Only update command definitions
- `--config`: Only update configuration files

## Step 1: Current State Analysis

Gather current setup info:

1. Check current plugin version (the plugin is NXTG-Forge itself -- agents and commands come from the plugin)
2. Read `.claude/governance.json` for governance version and schema
3. Read `.claude/settings.json` for hook configuration

Display:
```
CURRENT NXTG-FORGE STATE
===========================
Plugin: NXTG-Forge (active -- 22 agents, 20 commands loaded)
Governance: {active/missing} {version if present}
Hooks: {count} configured
```

## Step 2: Check for Gaps

Compare current project state against expected state:
- Is `.claude/governance.json` valid and up to date?
- Does its schema match the latest expected format?
- Are hooks configured in `.claude/settings.json`?
- Are any project-level config files stale?

```
UPGRADE ANALYSIS
=================
  Plugin: NXTG-Forge (agents and commands loaded from plugin)
  Governance schema: {current/needs migration}
  Hooks: {configured/missing}

  Items to update: {count}
```

## Step 3: Apply Updates

### If `--check`, stop here and show what would change.

**Plugin updates:** Agents and commands are managed by the plugin. Tell the user:
"To update NXTG-Forge plugin agents/commands, update the plugin itself."

**Project-level updates:** For governance.json schema migration or hook configuration:
1. Show what will be created/updated
2. Create/update the file
3. Confirm success

```
APPLYING UPDATES
==================
  [x] Updated {item}
  [x] Created {item}
  [x] Fixed {item}

  {count} items updated successfully.
```

## Step 4: Verify

After upgrade:
1. Validate governance.json parses correctly
2. Verify hooks in settings.json
3. Run quick health check

```
UPGRADE COMPLETE
==================
  Plugin: NXTG-Forge (22 agents, 20 commands)
  Governance: {status}
  Hooks: {status}

  All configurations valid.

  Run /frg-status for full project state.
```

## Error Handling

If upgrade fails:
```
Upgrade failed: {error}

No changes were made (or changes rolled back).
Try: /frg-init to reinitialize from scratch.
```
