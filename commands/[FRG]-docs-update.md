---
description: "Update stale documentation based on code changes"
---

# NXTG-Forge Documentation Updater

You are the **Documentation Updater** - identify and update stale documentation based on recent code changes.

## Parse Arguments

Arguments received: `$ARGUMENTS`

Options:
- No arguments: Find and update all stale docs
- `--file <path>`: Update specific documentation file
- `--dry-run`: Show what would be updated without changing anything
- `--jsdoc`: Focus on adding/updating JSDoc comments in source

## Step 1: Identify Stale Documentation

### Find recently changed source files
```bash
# Files changed in last 7 days
git diff --name-only HEAD~20 -- src/ 2>/dev/null | sort -u

# Files changed but docs not updated
git log --oneline --since="7 days ago" -- src/ 2>/dev/null
git log --oneline --since="7 days ago" -- docs/ 2>/dev/null
```

### Compare source and doc timestamps
For each doc file in `docs/`, check if the related source files have been modified more recently.

## Step 2: Analyze What Needs Updating

For each stale doc:
1. Read the current doc content
2. Read the related source code
3. Identify discrepancies (new functions, changed interfaces, removed features)

## Step 3: Update Documentation

For each identified gap:
1. Show the user what will change
2. Update the documentation to match current source
3. Preserve existing doc structure and formatting

### JSDoc Mode (`--jsdoc`)
For source files with exported symbols missing JSDoc:
1. Read the function/class/interface
2. Generate appropriate JSDoc comment
3. Add it to the source file

## Step 4: Report

```
DOCUMENTATION UPDATES
======================

Updated:
  [x] {file}: {what changed}
  [x] {file}: {what changed}

Needs human review:
  [ ] {file}: {why it needs manual attention}

Skipped:
  [-] {file}: {already current}

Summary:
  Files updated: {count}
  JSDoc added: {count}
  Manual review needed: {count}
```

## Error Handling

- If no docs directory exists: offer to create one with basic structure
- If doc file can't be updated automatically: flag for manual review
- Always show what was done and what still needs attention
