---
description: "Update Forge to latest — syncs past Claude Code bug #29071"
disable-model-invocation: true
---

# Forge Update

You are the **Update Agent** — pull the latest Forge plugin and refresh project config. Includes a built-in workaround for [Claude Code #29071](https://github.com/anthropics/claude-code/issues/29071) (stale marketplace cache).

## Parse Arguments

Arguments received: `$ARGUMENTS`

Options:
- No arguments: Check for updates, update plugin, refresh project config
- `--check`: Only check what would be updated (no changes)
- `--plugin`: Only update the plugin itself
- `--config`: Only update governance config and hooks

## Step 1: Detect Current Install

The plugin may be registered under different names (`forge`, `forge@forge`, etc.) and scopes (`local`, `user`). Run:
```bash
echo "=== installed_plugins.json ===" && cat ~/.claude/plugins/installed_plugins.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); [print(f'{k}: {[s.get(\"scope\",\"?\") for s in v]}') for k,v in d.get('plugins',{}).items() if 'forge' in k.lower()]" 2>/dev/null || echo "no installed_plugins.json"
echo "=== marketplace dir ===" && ls -d ~/.claude/plugins/marketplaces/*forge* 2>/dev/null || echo "no marketplace clone"
echo "=== plugin.json version ===" && cat ~/.claude/plugins/marketplaces/*forge*/.claude-plugin/plugin.json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('version','?'))" 2>/dev/null || echo "unknown"
```

Display:
```
## Forge Update

**Installed:** {plugin identifier} ({scope})
**Marketplace version:** {version from marketplace clone}
```

## Step 2: Sync Marketplace (#29071 bypass)

Claude Code's `plugin update` fetches but never merges the marketplace clone. We pull it ourselves first.

```bash
MARKETPLACE_DIR=$(find ~/.claude/plugins/marketplaces/ -maxdepth 1 -name "*forge*" -type d 2>/dev/null | head -1)
if [ -n "$MARKETPLACE_DIR" ]; then
  cd "$MARKETPLACE_DIR" && git pull --ff-only origin main 2>&1 || git pull --ff-only origin master 2>&1
  NEW_VERSION=$(python3 -c "import json; print(json.load(open('.claude-plugin/plugin.json')).get('version','?'))" 2>/dev/null)
  echo "SYNCED: $MARKETPLACE_DIR → v$NEW_VERSION"
else
  echo "NO_MARKETPLACE_CLONE"
fi
```

If `NO_MARKETPLACE_CLONE`, go directly to the fresh install path in Step 3.

## Step 3: Update Plugin

### If `--check` was passed, stop here. Report the available version from Step 2 and exit.

Try these update methods in order until one works:

**Method A** — Standard update:
```bash
claude plugin update forge 2>&1
```

**Method B** — If Method A fails with "not found", try with scope flags:
```bash
claude plugin update forge --scope local 2>&1 || claude plugin update forge --scope user 2>&1
```

**Method C** — If Methods A and B both fail, do a full reinstall:
```bash
claude plugin uninstall forge --scope local 2>&1
claude plugin uninstall forge --scope user 2>&1
claude plugin uninstall forge 2>&1
claude plugin install forge 2>&1
```

**Method D** — If everything above fails (nuclear option):
```bash
claude plugin marketplace add nxtg-ai/forge-plugin 2>&1
claude plugin install forge 2>&1
```

After any successful method, tell the user:
```
**Updated.** Restart your Claude Code session to load the new version.
```

**IMPORTANT:** After an update, the user MUST restart their Claude Code session. Updated commands, agents, and skills only load on session start. Tell the user this clearly.

## Step 4: Project Config Check

After plugin update (or if `--config` flag):

1. Check if `.claude/governance.json` exists and is valid JSON
2. Check if hooks are configured in `.claude/settings.json`
3. If governance.json schema is outdated, offer to migrate

Display any config issues found.

## Step 5: Summary

```
## Update Complete

| Component | Status |
|-----------|--------|
| Marketplace | {synced to vX.Y.Z / fresh install / failed} |
| Plugin | {updated / reinstalled / failed} |
| Governance | {valid / needs init / migrated} |
| Hooks | {active / not configured} |

**Next:** Restart Claude Code to load the new version, then `/forge:status`
```

## Error Handling

If all update methods fail, show:
```
**Update failed.** Run these commands from your terminal (outside Claude Code):

  cd ~/.claude/plugins/marketplaces/nxtg-ai-forge-plugin/ && git pull
  claude plugin uninstall forge
  claude plugin install forge

If that doesn't work, full clean install:
  rm -rf ~/.claude/plugins/marketplaces/*forge*
  claude plugin marketplace add nxtg-ai/forge-plugin
  claude plugin install forge
```
