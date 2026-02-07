---
description: "Scan tech stack, check license compatibility, and generate SBOM"
---

# NXTG-Forge Compliance Check

You are the **Compliance Auditor** - scan the project's dependency tree for license compatibility and generate a Software Bill of Materials.

## Parse Arguments

Arguments received: `$ARGUMENTS`

Options:
- No arguments: Full compliance report
- `--sbom`: Generate CycloneDX SBOM and save to .claude/reports/
- `--json`: Output raw JSON instead of formatted report
- `--conflicts-only`: Show only license conflicts
- `--fix`: Suggest replacements for problematic dependencies

## Step 1: Tech Stack Inventory

Read `package.json` in the project root to get:
- Project name, version, license
- Count dependencies vs devDependencies
- Identify key frameworks (react, express, vite, etc.)

Run:
```bash
node --version
npm --version
```

## Step 2: Dependency License Scan

Run:
```bash
npm ls --json --all --long 2>/dev/null
```

For each dependency, check license compatibility with project license (MIT):

COMPATIBLE (no action needed):
  MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD,
  Unlicense, CC0-1.0, BlueOak-1.0.0, Python-2.0

CONDITIONAL (acceptable, note in report):
  LGPL-2.1, LGPL-3.0, MPL-2.0

INCOMPATIBLE (flag as conflict):
  GPL-2.0-only, GPL-3.0-only, AGPL-3.0, SSPL-1.0, EUPL-1.2

UNKNOWN (needs investigation):
  Missing license, custom license, NOASSERTION

For each dependency in the npm ls output, also read:
```bash
cat node_modules/{dep-name}/package.json | grep -i license
```
to get the license field (npm ls doesn't always include it).

## Step 3: Compliance Score

Calculate score (0-100):
- Start at 100
- -0 per compatible dep
- -2 per conditional dep
- -10 per incompatible production dep
- -5 per incompatible dev dep
- -3 per unknown license

## Step 4: Display Report

Format:
```
NXTG-Forge Compliance Report
============================
Generated: {timestamp}

PROJECT
  Name: {name} v{version}
  License: {license}
  Node: {node_version}

TECH STACK
  Runtime: {frameworks list}
  Languages: TypeScript, JavaScript
  Dependencies: {prod_count} production, {dev_count} development

LICENSE SCAN
  Compliance Score: {score}/100 [{PASS|WARN|FAIL}]

  Compatible:    {count} deps
  Conditional:   {count} deps
  Incompatible:  {count} deps
  Unknown:       {count} deps

{If conflicts exist:}
LICENSE CONFLICTS
  [{severity}] {dep_name}@{version} - {license}
    Risk: {explanation}
    Action: {recommendation}

{If --sbom:}
SBOM
  Format: CycloneDX 1.5 JSON
  Components: {count}
  Saved to: .claude/reports/sbom-{date}.json

---
Quick Actions:
  /frg-compliance --sbom       Generate SBOM file
  /frg-compliance --fix        Suggest replacements
  /frg-deploy --validate-only  Pre-deploy validation
  /frg-gap-analysis --scope security  Security gap analysis
```

### If `--conflicts-only`, show only the LICENSE CONFLICTS section.

### If `--json`, output all gathered data as a JSON object instead of formatted text.

## Step 5: SBOM Generation (if --sbom)

Generate CycloneDX 1.5 JSON with:
- bomFormat: "CycloneDX"
- specVersion: "1.5"
- All dependencies as components with purl identifiers (pkg:npm/{name}@{version})
- Save to .claude/reports/sbom-{YYYY-MM-DD}.json

## Step 6: Fix Suggestions (if --fix)

For each incompatible or unknown dependency, suggest:
1. Known MIT-licensed alternatives (if common ones exist)
2. Whether it can be moved to devDependencies (dev deps don't ship)
3. Whether a different version has a compatible license

## Error Handling

If npm ls fails, fall back to reading package.json dependencies and scanning node_modules directly.
If node_modules doesn't exist, prompt user to run npm install first.
Always show whatever data IS available.
