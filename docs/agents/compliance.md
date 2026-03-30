# Compliance

> Audits your project against legal, regulatory, and policy requirements -- dependency licenses, GDPR data handling, WCAG accessibility, and coding standards enforcement.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Governance & Analysis |
| **Model** | Haiku |

---

## What It Does

The Compliance agent protects your project from legal and regulatory risk. It audits dependency licenses for compatibility (is that GPL-3.0 package going to force your MIT project open-source?), checks data handling against GDPR requirements (do you have a data inventory? can users request deletion?), verifies WCAG 2.1 AA accessibility compliance (do all images have alt text? does keyboard navigation work?), and enforces coding standards (TypeScript strict mode, no `any` types, test coverage thresholds).

What makes this agent important is that compliance failures are not bugs -- they are liabilities. A GPL-3.0 dependency in an MIT-licensed project creates a legal obligation you might not discover until an audit. Personal data stored without a retention policy or deletion capability violates GDPR regardless of whether anyone has complained yet. Missing WCAG compliance excludes users with disabilities and exposes the project to ADA lawsuits in some jurisdictions. These are not theoretical risks; they are the specific risks the Compliance agent checks for.

Unlike the Security agent (which finds technical vulnerabilities) or the Guardian (which enforces code quality), the Compliance agent operates at the policy layer. It asks: "Is this project legally safe to distribute? Does it handle personal data lawfully? Is it accessible to all users? Does it follow its own stated standards?" These are questions that developers rarely ask during implementation but that become critical at release time.

## When to Use It

- **Before a release**: When you need to verify that all dependencies have compatible licenses, no GDPR violations exist, and accessibility standards are met.
- **After adding new dependencies**: When new packages have been added and you need to verify their licenses are compatible with your project's license.
- **When handling user data**: When you are implementing features that collect, store, or process personal information and need to verify GDPR compliance.
- **During accessibility reviews**: When your project needs WCAG 2.1 AA verification and you want a systematic check of contrast ratios, keyboard navigation, ARIA labels, and semantic HTML.

Do not use the Compliance agent for technical security vulnerabilities (use Security), code quality enforcement (use Guardian), or architecture review (use Detective). Compliance focuses on legal, regulatory, and policy requirements.

## How It Works

The Compliance agent audits across four domains:

1. **License Audit** -- Runs `npx license-checker --summary` to enumerate all dependency licenses. Checks each against the project's license for compatibility. Compatible with MIT: MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, Unlicense. Incompatible: GPL-2.0, GPL-3.0, AGPL-3.0 (copyleft/viral), SSPL (server-side restriction). Flags any incompatible or unknown license as a blocking finding.

2. **GDPR Compliance** -- Checks for: data inventory documentation (what PII, where stored, why collected), consent mechanisms, data deletion capability (right to erasure), data export capability (right to portability), privacy policy accessibility, data retention limits, and absence of unnecessary PII collection.

3. **Accessibility Compliance (WCAG 2.1 AA)** -- Verifies: all images have alt text, color contrast ratios meet 4.5:1 minimum for normal text, keyboard navigation works for all interactive elements, form inputs have associated labels, error messages are descriptive, page structure uses semantic HTML, and focus indicators are visible.

4. **Policy Enforcement** -- Checks project-specific standards: TypeScript strict mode enabled, no untyped `any` without documented justification, all public APIs documented, test coverage meets 85% minimum, no secrets in source code, dependencies updated within 30 days of security patches.

Each finding is classified with a clear action: fix before release, track for next sprint, or document as accepted risk.

## Examples

### Example 1: License Compatibility Audit

```
User: "Are all our dependencies license-compatible?"

Compliance:
  - Runs: npx license-checker --summary
  - Analyzes: 847 packages across dependency tree
  - Results:
    MIT: 612, ISC: 89, BSD-3-Clause: 71, Apache-2.0: 48, BSD-2-Clause: 19
    0BSD: 5, Unlicense: 2
    Unknown: 1 (custom-package@2.1.0 -- license field missing)
  - Flags:
    [WARNING] custom-package@2.1.0 has no license field -- review manually
    All other packages are compatible with MIT
  - Recommends: Check custom-package source for license, or replace with licensed alternative
  - Result: 846/847 packages confirmed compatible, 1 needs manual review
```

### Example 2: GDPR Compliance Check

```
User: "Does our data handling comply with GDPR?"

Compliance:
  - Checks data handling patterns:
    [PASS] No PII stored in localStorage
    [PASS] Session data uses httpOnly cookies
    [FAIL] No data inventory document (what PII is collected and why)
    [FAIL] No deletion endpoint (right to erasure)
    [FAIL] No export endpoint (right to portability)
    [WARN] Analytics tracks session duration without consent mechanism
  - Recommends:
    1. Create data inventory document listing all PII fields
    2. Implement DELETE /api/users/:id endpoint for data erasure
    3. Implement GET /api/users/:id/export endpoint for data portability
    4. Add consent dialog for analytics tracking
  - Result: 3 mandatory GDPR gaps identified with specific implementation tasks
```

### Example 3: Accessibility Audit

```
User: "Check our WCAG compliance"

Compliance:
  - Scans: All React components for accessibility patterns
  - Findings:
    [FAIL] 4 images missing alt text (MetricsCard, AgentAvatar, StatusIcon, Logo)
    [FAIL] 2 interactive elements using div+onClick instead of button
    [WARN] Color contrast on zinc-400 text on zinc-900: 4.2:1 (needs 4.5:1)
    [PASS] Form inputs have labels
    [PASS] Semantic HTML used for navigation
    [FAIL] Modal lacks focus trap -- Tab key escapes to background
  - Recommends:
    1. Add alt text to 4 image components
    2. Replace div+onClick with button elements
    3. Increase contrast on muted text (zinc-400 -> zinc-300)
    4. Add focus trap to Modal component
  - Result: 4 actionable WCAG findings with specific component locations
```

## Power Use Cases

**Pre-Release Compliance Gate**: Before every release, run the Compliance agent alongside Security and Guardian. Security catches technical vulnerabilities. Guardian catches code quality issues. Compliance catches legal, regulatory, and accessibility risks. Together they form a comprehensive release gate.

**Planner Phase Integration**: For compliance-sensitive features (user data handling, payment processing, health data), the Planner includes the Compliance agent in the quality gate phase before Guardian. This catches regulatory issues during development, not at release time.

**License Monitoring**: Run the Compliance agent after every `npm install` that adds a new dependency. Catching a GPL dependency immediately after addition is trivial to fix. Catching it after building a feature on top of it requires replacing the dependency and rewriting code.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Security** | Security handles technical vulnerabilities; Compliance handles legal and regulatory risk. Together they cover the full risk surface. |
| **UI** | Compliance identifies WCAG violations; UI implements the accessibility fixes (ARIA labels, keyboard nav, contrast). |
| **Planner** | Planner includes Compliance in the quality gate for features handling personal data, payments, or regulated domains. |
| **Guardian** | Guardian enforces code standards; Compliance enforces policy standards. Both contribute to the "ready to ship" assessment. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | License compatibility auditing. GDPR compliance checklist. WCAG 2.1 AA verification. Coding standards enforcement. Finding classification with remediation actions. |
| **L2 Pro Builder** | Compliance findings recorded via `forge_capture_knowledge`. Historical compliance state recalled via `forge_get_knowledge` to track improvement over time. |
| **L3 Ship Lord** | Compliance status (license count, GDPR gaps, WCAG violations) visible in the forge-ui dashboard governance panel. |

## Tips & Gotchas

- **Do**: Run the license audit after every dependency addition, not just before releases. Catching license conflicts early prevents costly dependency replacements later.
- **Don't**: Ignore "Unknown" license warnings. A package without a license field may be proprietary, copyleft, or simply undeclared. Investigate before depending on it.
- **Do**: Create a data inventory document even if GDPR does not technically apply to your users. It is good practice and prevents scrambling if regulations change.
- **Don't**: Treat WCAG compliance as cosmetic. Accessibility is a legal requirement in many jurisdictions and an ethical imperative everywhere.
- **Do**: Automate compliance checks in CI (license-checker in GitHub Actions) so violations are caught on every push, not just when someone remembers to run the audit.

---

*See also: [Security](security.md) | [UI](ui.md) | [Guardian](guardian.md)*
