# /forge:compliance

> Scan your dependency tree for license compatibility, generate a Software Bill of Materials (SBOM), and produce a compliance score with conflict resolution guidance.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Quality & Testing |
| **Syntax** | `/forge:compliance [--sbom] [--json] [--conflicts-only] [--fix]` |

---

## What It Does

`/forge:compliance` audits every dependency in your project against your project's license (typically MIT). It scans the full dependency tree via `npm ls`, reads each package's license field, and classifies every dependency as Compatible (MIT, ISC, BSD, Apache-2.0), Conditional (LGPL, MPL), Incompatible (GPL, AGPL, SSPL), or Unknown (missing or custom license). The result is a compliance score from 0-100 with deductions based on severity: incompatible production dependencies cost 10 points each, incompatible dev dependencies cost 5, conditional licenses cost 2, and unknown licenses cost 3.

Beyond license scanning, the command inventories your full tech stack (runtime version, frameworks, language, dependency counts) and can generate a CycloneDX 1.5 SBOM with purl identifiers for every component. The SBOM is saved to `.claude/reports/` and is suitable for compliance reporting and supply chain security requirements.

Without this command, license compliance requires manually checking each dependency's license, understanding compatibility rules, and maintaining a spreadsheet. `/forge:compliance` automates the entire audit and provides actionable resolution guidance for every conflict.

## Syntax & Options

```
/forge:compliance [--sbom] [--json] [--conflicts-only] [--fix]
```

| Option | Description |
|--------|------------|
| `--sbom` | Generate a CycloneDX 1.5 SBOM JSON file and save to `.claude/reports/sbom-{date}.json` |
| `--json` | Output all data as raw JSON instead of the formatted report |
| `--conflicts-only` | Show only license conflicts, skipping the full report |
| `--fix` | Suggest MIT-licensed alternative packages for each incompatible dependency |

## When to Use It

- **Before releasing open-source software**: Verify that all dependencies are license-compatible before publishing.
- **Enterprise compliance requirements**: Generate an SBOM for security and compliance teams with `--sbom`.
- **After adding new dependencies**: Quick check that the new package does not introduce a license conflict.

For security vulnerability scanning specifically, use `/forge:gap-analysis --scope security`. For dependency health (outdated packages, unused deps), use `/forge:optimize --scope deps`.

## Examples

### Example 1: Full Compliance Report

```
/forge:compliance
```

```
NXTG-Forge Compliance Report
============================
Generated: 2026-03-29T14:00:00Z

PROJECT
  Name: my-api v2.1.0
  License: MIT
  Node: v22.4.0

TECH STACK
  Runtime: Express, TypeScript, Vitest
  Dependencies: 18 production, 12 development

LICENSE SCAN
  Compliance Score: 94/100 [PASS]

  Compatible:    27 deps
  Conditional:   2 deps
  Incompatible:  0 deps
  Unknown:       1 dep
```

### Example 2: SBOM Generation

```
/forge:compliance --sbom
```

Generates a CycloneDX 1.5 JSON file:

```
SBOM
  Format: CycloneDX 1.5 JSON
  Components: 30
  Saved to: .claude/reports/sbom-2026-03-29.json
```

### Example 3: Fix Suggestions

```
/forge:compliance --fix
```

For each incompatible or unknown dependency, suggests MIT-licensed alternatives, whether the dependency can move to devDependencies, or whether a different version has a compatible license.

## Power Use Cases

Run `/forge:compliance --sbom` as part of your release pipeline to generate a fresh SBOM with every release. This satisfies supply chain security requirements (NIST, EU CRA) and gives your security team a machine-readable inventory.

Use `--conflicts-only` for a quick pass/fail check in CI: if any conflicts exist, the output is non-empty; if clean, it is empty.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:gap-analysis** | Gap analysis covers security vulnerabilities; compliance covers license compatibility |
| **/forge:deploy** | Run compliance before deploy to ensure license-clean releases |
| **/forge:optimize** | Optimize checks dependency health (outdated/unused); compliance checks license legality |
| **compliance agent** | For deeper regulatory compliance beyond license scanning |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full license scan, compliance score, SBOM generation, and fix suggestions |
| **L2 Pro Builder** | Compliance findings recorded in orchestrator knowledge base for audit trails |
| **L3 Ship Lord** | Compliance status and SBOM history visible in the forge-ui dashboard |

## Tips & Gotchas

- The command reads license fields from both `npm ls` output and individual `node_modules/{pkg}/package.json` files for accuracy.
- If `node_modules` does not exist, the command prompts you to run `npm install` first.
- Conditional licenses (LGPL, MPL) are acceptable in most cases but get noted in the report. They do not block compliance.
- The SBOM is saved to `.claude/reports/`. Create this directory structure once and it persists across sessions.
- Dev dependencies have lower penalty weights because they do not ship in production builds.

---

*See also: [gap-analysis](../commands/gap-analysis.md) | [deploy](../commands/deploy.md) | [optimize](../commands/optimize.md)*
