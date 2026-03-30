# /forge:restore

> Restore project state from a previously saved checkpoint with preview, diff comparison, and safety warnings.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | State Management |
| **Syntax** | `/forge:restore [checkpoint-name] [--preview]` |

---

## What It Does

`/forge:restore` is the dedicated restoration command -- a focused shortcut for `/forge:checkpoint restore`. When you provide a checkpoint ID, it reads the saved state, displays a side-by-side comparison of the checkpoint state versus your current state (branch, commit, uncommitted changes), and offers to restore the governance configuration. When no ID is provided, it lists all available checkpoints and lets you choose interactively.

The command prioritizes safety. It shows you exactly what will change before doing anything, warns if you have uncommitted changes that could be affected, and suggests creating a new checkpoint of your current state before restoring. Git state is displayed for reference but not automatically restored -- you get the exact git commands to run if you want to return to the checkpoint's code state, keeping destructive operations under your explicit control.

Without this command, restoring means remembering which checkpoint file to read, manually parsing the JSON, comparing it to your current state, and copying governance values by hand. `/forge:restore` handles all of that with safety checks at every step.

## Syntax & Options

```
/forge:restore [checkpoint-name] [--preview]
```

| Option | Description |
|--------|------------|
| `checkpoint-name` | The ID of the checkpoint to restore. If omitted, shows an interactive list of all checkpoints. |
| `--preview` | Show what would be restored without making any changes. |

## When to Use It

- **After a failed experiment**: Your refactoring broke something and you want to get back to a known-good state.
- **After deployment issues**: Roll back to the pre-deploy checkpoint created by `/forge:deploy`.
- **Session recovery**: Restore the checkpoint from the end of your last session to regain context.

This command is a shortcut for `/forge:checkpoint restore`. For the full checkpoint management suite (save, list, clear), use `/forge:checkpoint`.

## Examples

### Example 1: Restore a Specific Checkpoint

```
/forge:restore before-auth-refactor
```

```
RESTORE PREVIEW
================
Checkpoint: before-auth-refactor
Saved: 2026-03-29T10:30:00Z
Branch at save: feature/auth
Commit at save: a1b2c3d

Current state:
  Branch: feature/auth
  Commit: e7f8g9h
  Uncommitted changes: 2

This will restore:
  - Governance state from checkpoint
  - Git info displayed for reference (not auto-restored)

Tip: Save current state first with /forge:checkpoint save before-restore
```

### Example 2: Interactive Selection

```
/forge:restore
```

Lists all checkpoints and asks you to choose:

```
Available checkpoints:
  1. before-auth-refactor (2026-03-29T10:30:00Z)
  2. cp-20260329-090000 (2026-03-29T09:00:00Z)

Which checkpoint to restore?
```

### Example 3: Preview Only

```
/forge:restore before-auth-refactor --preview
```

Shows the full diff between checkpoint state and current state without making any changes.

## Power Use Cases

Use `--preview` to compare your current state against multiple checkpoints before deciding which one to restore. This is useful when you have several experimental branches and want to see which checkpoint represents the best starting point.

Chain `/forge:checkpoint save safety-net` then `/forge:restore {target}` to create a rollback point for the rollback itself -- belt and suspenders when working with critical code.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:checkpoint** | Full checkpoint management (save, list, clear); restore is a focused shortcut |
| **/forge:deploy** | Restore from automatic pre-deploy checkpoints when deployments cause issues |
| **/forge:status** | Check project health after restoring to verify the restored state is healthy |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full restore with preview, diff comparison, interactive selection, and safety warnings |
| **L2 Pro Builder** | Checkpoint list also available via `forge_list_checkpoints` MCP tool |
| **L3 Ship Lord** | Restoration events logged in the forge-ui dashboard timeline |

## Tips & Gotchas

- Governance state (`governance.json`) is directly restorable. Git state is shown for reference only -- you control whether to run the git commands.
- Always check for uncommitted changes before restoring. The command warns you, but it is your responsibility to stash or commit first.
- The suggestion to save current state before restoring is practical -- create `before-restore` checkpoints so you can undo the undo.
- If the checkpoint file is corrupt or missing, the command shows available checkpoints so you can pick a different one.

---

*See also: [checkpoint](../commands/checkpoint.md) | [deploy](../commands/deploy.md) | [status](../commands/status.md)*
