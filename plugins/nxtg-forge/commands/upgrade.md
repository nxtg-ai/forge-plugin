---
description: "Upgrade Forge plugin to latest version + update project config"
---

# Forge Upgrade

You are the **Upgrade Manager** — update the Forge plugin and project configuration to the latest version.

## Parse Arguments

Arguments received: `$ARGUMENTS`

Options:
- No arguments: Check for updates, upgrade plugin, refresh project config
- `--check`: Only check what would be updated (no changes)
- `--plugin`: Only update the plugin itself
- `--config`: Only update governance config and hooks

## Step 1: Check Current Version

Run this bash command to get the installed plugin version:
```bash
claude plugin list 2>/dev/null | grep -i forge
```

Display:
```
## Forge Upgrade Check

**Installed:** forge v{version}
```

## Step 2: Sync Marketplace (workaround for Claude Code bug #29071)

Claude Code's `plugin update` has a known bug where it runs `git fetch` but never `git merge`, so the local marketplace clone stays stale. We fix this by pulling manually first.

Run this bash command to find and update the marketplace clone:
```bash
MARKETPLACE_DIR=$(find ~/.claude/plugins/marketplaces/ -maxdepth 1 -name "*forge-plugin*" -type d 2>/dev/null | head -1)
if [ -n "$MARKETPLACE_DIR" ]; then
  cd "$MARKETPLACE_DIR" && git pull --ff-only origin main 2>&1 || git pull --ff-only origin master 2>&1
  echo "SYNCED: $MARKETPLACE_DIR"
else
  echo "NO_MARKETPLACE_CLONE"
fi
```

If `SYNCED`, continue to Step 3. If `NO_MARKETPLACE_CLONE`, skip to the reinstall path in Step 3.

## Step 3: Update Plugin

Now run the update (marketplace clone is fresh from Step 2):
```bash
claude plugin update forge 2>&1
```

If that succeeds, tell the user:
```
**Plugin updated.** Restart your Claude Code session to load the new version.
```

If it fails with "already up to date", show:
```
**Plugin is current.** No update available.
```

If it fails for another reason (or `NO_MARKETPLACE_CLONE` from Step 2), try the full reinstall:
```bash
claude plugin uninstall forge 2>&1
claude plugin marketplace add nxtg-ai/forge-plugin 2>&1
claude plugin install forge 2>&1
```

**IMPORTANT:** After a plugin update, the user MUST restart their Claude Code session. The updated commands, agents, and skills only load on session start. Tell the user this clearly.

### If `--check` was passed, skip the actual update. Just report what version is available after syncing the marketplace.

## Step 4: Project Config Check

After plugin update (or if `--config` flag):

1. Check if `.claude/governance.json` exists and is valid JSON
2. Check if hooks are configured in `.claude/settings.json`
3. If governance.json schema is outdated, offer to migrate

Display any config issues found.

## Step 5: Summary

```
## Upgrade Complete

| Component | Status |
|-----------|--------|
| Marketplace | {synced / fresh install / failed} |
| Plugin | {updated to vX.Y.Z / already current / failed} |
| Governance | {valid / needs init / migrated} |
| Hooks | {active / not configured} |

**Next:** Restart Claude Code to load updated plugin, then run `/forge:status`
```

## Error Handling

If upgrade fails, show the error and suggest:
```
Manual update (from terminal):
  cd ~/.claude/plugins/marketplaces/nxtg-ai-forge-plugin/ && git pull
  claude plugin update forge

Full reinstall (from terminal):
  claude plugin marketplace add nxtg-ai/forge-plugin && claude plugin install forge
```
