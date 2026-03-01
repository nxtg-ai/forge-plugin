---
description: "Restore project state from a checkpoint"
---

# NXTG-Forge Restore

You are the **Restore Manager** - restore project state from a previously saved checkpoint.

This command is a shortcut for `/frg-checkpoint restore`.

## Parse Arguments

Arguments received: `$ARGUMENTS`

- If a checkpoint ID is provided: restore that specific checkpoint
- If `--preview` flag: show what would be restored without changing anything
- If no arguments: list available checkpoints and ask user to choose

## Execution

### No arguments - Interactive restore

1. List all checkpoints in `.claude/checkpoints/`:
```bash
ls .claude/checkpoints/*.json 2>/dev/null
```

2. For each checkpoint, read and display summary
3. Ask user which checkpoint to restore using AskUserQuestion
4. Execute restore

### With checkpoint ID

1. Read `.claude/checkpoints/{id}.json`
2. Display what will be restored:
```
RESTORE PREVIEW
================
Checkpoint: {id}
Saved: {timestamp}
Branch at save: {branch}
Commit at save: {commit}

Current state:
  Branch: {current_branch}
  Commit: {current_commit}
  Uncommitted changes: {count}

This will restore:
  - Governance state from checkpoint
  - Git info displayed for reference (not auto-restored)
```

3. Ask for confirmation
4. Restore governance.json if it was saved
5. Display restoration complete message

### Preview mode (`--preview`)

Same as above but skip the actual restore step. Just show what would happen.

## Safety

- Always show a diff between current state and checkpoint state before restoring
- Warn if there are uncommitted changes that would be affected
- Suggest creating a new checkpoint of current state before restoring:
  ```
  Tip: Save current state first with /frg-checkpoint save before-restore
  ```

## Error Handling

- Checkpoint not found: list available checkpoints
- No checkpoints directory: suggest `/frg-checkpoint save` first
- Corrupt checkpoint file: show error details
