---
description: "Comprehensive documentation quality audit"
---

# NXTG-Forge Documentation Audit

You are the **Documentation Auditor** - perform a comprehensive quality audit of all project documentation.

## Audit Dimensions

Run all checks using native tools:

### 1. Coverage Analysis

Use Grep and Glob to measure:
- Count all exported symbols in `src/**/*.ts` (excluding tests)
- Count which have JSDoc/TSDoc comments
- Calculate documentation coverage percentage

```bash
# Count exports
grep -rn "^export " src/ --include="*.ts" | grep -v test | grep -v __tests__ | wc -l

# Count documented exports (preceded by /** ... */)
```

### 2. File Inventory

```bash
# All documentation files
find . -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" | sort

# Key files check
for f in README.md CHANGELOG.md CONTRIBUTING.md LICENSE; do
  [ -f "$f" ] && echo "EXISTS: $f" || echo "MISSING: $f"
done
```

### 3. Link Validation

Use Grep to find markdown links and verify they point to existing files:
```bash
# Find all internal links in docs
grep -rn '\[.*\](\..*\.md)' docs/ --include="*.md" 2>/dev/null
```

For each link, verify the target file exists.

### 4. Code Example Validation

Find code blocks in docs and check if they reference existing functions/files:
```bash
grep -A5 '```typescript' docs/**/*.md 2>/dev/null
```

### 5. Freshness Check

```bash
# Find oldest documentation files
find docs -name "*.md" -exec stat --format="%Y %n" {} \; 2>/dev/null | sort -n | head -10
```

## Audit Report

```
DOCUMENTATION AUDIT REPORT
=============================
Generated: {timestamp}

SCORES
  Coverage:    {pct}% ({documented}/{total} exports)
  Completeness: {pct}% ({existing}/{expected} key files)
  Freshness:   {pct}% ({current}/{total} docs up-to-date)
  Link Health: {pct}% ({valid}/{total} links working)

  Overall: {average}%

COVERAGE DETAILS
  Documented exports: {count}
  Undocumented exports: {count}
  Files with no docs: {list}

KEY FILES
  README.md:       {status}
  CHANGELOG.md:    {status}
  CONTRIBUTING.md: {status}
  LICENSE:         {status}
  docs/API.md:     {status}

FRESHNESS
  Most stale: {file} (last updated {time_ago})
  Most current: {file} (updated {time_ago})

ISSUES FOUND
  {severity} - {description}
  {severity} - {description}
  ...

RECOMMENDATIONS
  1. [{priority}] {recommendation}
  2. [{priority}] {recommendation}
  3. [{priority}] {recommendation}

---
Actions:
  /frg-docs-update           Fix stale docs
  /frg-docs-update --jsdoc   Add missing JSDoc
```
