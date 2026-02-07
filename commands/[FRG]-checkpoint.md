---
description: "Save and restore project state checkpoints"
---

# NXTG-Forge Checkpoint Manager

You are the **Checkpoint Manager** - save and restore project state for safe experimentation and rollback.

## Parse Arguments

Arguments received: `$ARGUMENTS`

Parse the first word as the operation:
- `save [name]` - Save current state (default if no operation specified)
- `restore <name>` - Restore from checkpoint
- `list` - Show all checkpoints
- `clear <name>` - Delete a checkpoint
- No arguments: defaults to `save` with auto-generated name

## Operations

### Save Checkpoint

1. Create checkpoint directory:
```bash
mkdir -p .claude/checkpoints
```

2. Generate checkpoint ID from argument or timestamp:
   - If name provided: use it (sanitized)
   - If no name: use format `cp-YYYYMMDD-HHMMSS`

3. Gather state and write checkpoint file:
```bash
CHECKPOINT_ID="<generated_id>"

# Gather git state
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "N/A")
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "N/A")
GIT_STATUS=$(git status --porcelain 2>/dev/null || echo "")
```

4. Read current governance state from `.claude/governance.json` if it exists.

5. Write checkpoint JSON to `.claude/checkpoints/{id}.json`:
```json
{
  "id": "<checkpoint_id>",
  "timestamp": "<ISO timestamp>",
  "description": "<user description or auto>",
  "git": {
    "commit": "<hash>",
    "branch": "<branch>",
    "status": "<porcelain output>",
    "hasUncommitted": true/false
  },
  "governance": { ... },
  "environment": {
    "nodeVersion": "<version>",
    "cwd": "<working directory>"
  }
}
```

6. Display confirmation:
```
Checkpoint saved: {id}
  Branch: {branch}
  Commit: {hash}
  Uncommitted changes: {yes/no}
  Location: .claude/checkpoints/{id}.json

Restore with: /frg-checkpoint restore {id}
```

### Restore Checkpoint

1. Read checkpoint file from `.claude/checkpoints/{name}.json`
2. Display checkpoint contents
3. Show what would change:
```
Checkpoint: {id}
  Saved: {timestamp}
  Branch: {branch}
  Commit: {commit}

Current state:
  Branch: {current_branch}
  Commit: {current_commit}

Changes needed:
  - {description of differences}

Note: Git state is NOT automatically restored.
To restore git state:
  git checkout {branch}
  git reset --hard {commit}  (WARNING: discards changes)
```

4. If governance state was saved, offer to restore it:
```
Restore governance state? This will overwrite .claude/governance.json
```

### List Checkpoints

1. Read all files in `.claude/checkpoints/`:
```bash
ls .claude/checkpoints/*.json 2>/dev/null
```

2. For each file, read and extract summary info.

3. Display:
```
NXTG-Forge Checkpoints
========================
{id}
  Saved: {timestamp}
  Branch: {branch}
  Commit: {short_hash}

{id}
  Saved: {timestamp}
  Branch: {branch}
  Commit: {short_hash}

---
Total: {count} checkpoint(s)

Actions:
  /frg-checkpoint restore <id>
  /frg-checkpoint clear <id>
```

If no checkpoints exist:
```
No checkpoints found.

Save one with: /frg-checkpoint save [name]
```

### Clear Checkpoint

1. Verify the checkpoint exists
2. Delete the file
3. Confirm:
```
Checkpoint deleted: {id}
```

## Error Handling

- If checkpoint not found: list available checkpoints
- If directory doesn't exist: create it automatically
- If write fails: show error and suggest checking permissions

## Best Practices (show on first use)

```
Tip: Create checkpoints before:
  - Major refactoring
  - Experimental changes
  - Deployment
  - End of work session
```
