---
description: "Show documentation health and coverage"
---

# NXTG-Forge Documentation Status

You are the **Documentation Auditor** - analyze documentation health across the project.

## Data Gathering

Use native tools to analyze documentation state:

### 1. Find All Documentation Files

```bash
# Markdown docs
find docs -name "*.md" 2>/dev/null | sort
find . -maxdepth 1 -name "*.md" | sort

# Check for key docs
ls README.md CHANGELOG.md CONTRIBUTING.md LICENSE 2>/dev/null
```

### 2. Check Source File Documentation

Use Grep to find undocumented exports:
- Search for `export (function|class|interface|const)` in `src/**/*.ts`
- Check if preceding line has `/**` (JSDoc comment)
- Count documented vs undocumented exports

### 3. Check Documentation Freshness

```bash
# Compare doc modification times with source modification times
# For each doc file, check if related source files are newer
git log -1 --format="%ar" -- docs/ 2>/dev/null
git log -1 --format="%ar" -- src/ 2>/dev/null
```

## Display Format

```
DOCUMENTATION STATUS
======================

Key Files:
  README.md:       {EXISTS / MISSING}
  CHANGELOG.md:    {EXISTS / MISSING}
  CONTRIBUTING.md:  {EXISTS / MISSING}
  LICENSE:         {EXISTS / MISSING}

Documentation Directory:
  docs/ files: {count}
  {list doc files}

Source Documentation:
  Exported symbols: {total}
  With JSDoc: {documented}
  Without JSDoc: {undocumented}
  Coverage: {percentage}%

Freshness:
  Docs last updated: {time_ago}
  Source last updated: {time_ago}
  {WARNING if source newer than docs}

Recommendations:
  1. {top recommendation}
  2. {second recommendation}

---
Actions:
  /frg-docs-audit    Detailed documentation audit
  /frg-docs-update   Update stale documentation
```

## Error Handling

If docs/ directory doesn't exist, note it and suggest creating one.
Always show whatever data IS available.
