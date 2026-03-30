# /forge:checkpoint

> Save, restore, list, and manage project state checkpoints for safe experimentation and rollback.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | State Management |
| **Syntax** | `/forge:checkpoint [save|restore|list|clear] [checkpoint-name]` |

---

## What It Does

`/forge:checkpoint` creates lightweight project state snapshots that capture your git commit, branch, uncommitted changes, governance state, and environment metadata in a single JSON file. Unlike git stash or branches, checkpoints are Forge-aware -- they save governance state alongside git state so you can restore not just your code position but your project tracking context.

Checkpoints are stored in `.claude/checkpoints/` as individual JSON files. Each checkpoint records the git commit hash, branch name, porcelain status of uncommitted changes, the full governance.json contents, and environment details like Node version and working directory. Restoring a checkpoint shows you exactly what changed and provides the git commands to return to that state, but does not automatically run destructive git operations -- you stay in control.

Without checkpoints, rolling back means remembering commit hashes, manually restoring governance state, and hoping you can reconstruct the project context you had. Checkpoints make experimentation safe: save before a risky refactor, try it, and restore if it does not work out.

## Syntax & Options

```
/forge:checkpoint [save|restore|list|clear] [checkpoint-name]
```

| Option | Description |
|--------|------------|
| `save [name]` | Save current state. If no name provided, auto-generates `cp-YYYYMMDD-HHMMSS`. Default operation if no subcommand specified. |
| `restore <name>` | Display checkpoint contents, show diff against current state, and offer to restore governance. |
| `list` | Show all saved checkpoints with timestamps, branches, and commit hashes. |
| `clear <name>` | Delete a specific checkpoint. |

## When to Use It

- **Before a major refactor**: Save state so you can roll back if the refactoring breaks something.
- **Before experimental changes**: Trying a new approach? Checkpoint first.
- **Before deployment**: `/forge:deploy` creates automatic checkpoints, but you can also create named ones.
- **End of work session**: Capture your exact state so the next session starts from a known point.

For restoring specifically (without the save/list/clear operations), `/forge:restore` is a shortcut that goes directly to the restore flow.

## Examples

### Example 1: Save a Named Checkpoint

```
/forge:checkpoint save before-auth-refactor
```

```
Checkpoint saved: before-auth-refactor
  Branch: feature/auth
  Commit: a1b2c3d
  Uncommitted changes: yes (3 files)
  Location: .claude/checkpoints/before-auth-refactor.json

Restore with: /forge:checkpoint restore before-auth-refactor
```

### Example 2: List All Checkpoints

```
/forge:checkpoint list
```

```
NXTG-Forge Checkpoints
========================
before-auth-refactor
  Saved: 2026-03-29T10:30:00Z
  Branch: feature/auth
  Commit: a1b2c3d

cp-20260329-090000
  Saved: 2026-03-29T09:00:00Z
  Branch: main
  Commit: f4e5d6c

---
Total: 2 checkpoint(s)
```

### Example 3: Restore a Checkpoint

```
/forge:checkpoint restore before-auth-refactor
```

Shows the saved state, current state, differences, and offers to restore governance. Provides git commands for code restoration but does not run them automatically.

## Power Use Cases

Create a "session start" checkpoint at the beginning of every work session. Combined with `/forge:report`, you get a complete before-and-after picture of what changed during the session.

Use named checkpoints as decision points: `checkpoint save approach-a`, try it, then `checkpoint save approach-b`, try that. Compare both approaches against the original by restoring each in turn.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:restore** | Shortcut for the restore operation |
| **/forge:deploy** | Deploy creates automatic pre-deploy checkpoints |
| **/forge:feature** | Save a checkpoint before starting a feature |
| **/forge:report** | Session report shows checkpoint history |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full checkpoint management with save, restore, list, and clear operations |
| **L2 Pro Builder** | Checkpoint list also available via the governance MCP `forge_list_checkpoints` tool |
| **L3 Ship Lord** | Checkpoint history visible in the forge-ui dashboard timeline view |

## Tips & Gotchas

- Checkpoints save metadata about git state, not the actual file contents. To restore code, use the git commands shown in the restore output.
- Governance state (`.claude/governance.json`) IS directly restorable from a checkpoint. The command offers to overwrite the current governance file.
- Auto-generated names use the format `cp-YYYYMMDD-HHMMSS`. Named checkpoints are sanitized (spaces become hyphens, special characters removed).
- The `.claude/checkpoints/` directory is created automatically on first save.

---

*See also: [restore](../commands/restore.md) | [deploy](../commands/deploy.md) | [report](../commands/report.md)*
