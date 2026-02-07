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

1. Read `.claude/forge/config.yml` for current version
2. Count current agents: `ls .claude/agents/*.md | wc -l`
3. Count current commands: `ls .claude/commands/*.md | wc -l`
4. Check governance: Read `.claude/governance.json`

Display:
```
CURRENT NXTG-FORGE STATE
===========================
Config: {exists/missing}
Agents: {count} defined
Commands: {count} defined
Governance: {active/missing}
Hooks: {count} configured
```

## Step 2: Check for Gaps

Compare current state against expected state:
- Are all standard agents present?
- Are all standard commands present?
- Is governance.json valid?
- Are hooks configured in settings.json?

```
UPGRADE ANALYSIS
=================
  Agents: {current}/{expected} ({missing} missing)
  Commands: {current}/{expected} ({missing} missing)
  Config: {valid/needs update}
  Hooks: {configured/missing}

  Items to update: {count}
```

## Step 3: Apply Updates

### If `--check`, stop here and show what would change.

For each missing or outdated item:
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
1. Verify all files exist
2. Validate JSON files parse correctly
3. Run quick health check

```
UPGRADE COMPLETE
==================
  Before: {old_count} agents, {old_cmd_count} commands
  After: {new_count} agents, {new_cmd_count} commands

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
