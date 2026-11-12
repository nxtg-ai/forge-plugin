# OWASP Security

> Detection signals, remediation references, and a review checklist for security-sensitive code, plus guidance for understanding Forge's security guards and correcting blocked operations.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Knowledge |

---

## What It Provides

The [shipped skill](../../plugins/nxtg-forge/skills/owasp-security/SKILL.md) is a detection-first reference. Its inline tables help an agent identify code worth investigating; linked reference files provide remediation patterns. It covers application and API security, Claude Code plugins, MCP servers, and autonomous agents, with examples for JavaScript/TypeScript, Python, Rust, and Go.

It also explains Forge's security controls: which operations the guards refuse, how to replace an unsafe pattern with a safe one, and what the guards do not inspect. The skill is contextual knowledge, not a scanner or a guarantee that code is secure.

## When It Activates

- When reviewing authentication, authorization, sessions, input validation, cryptography, or API endpoints
- When checking deserialization, SSRF, file uploads, or hardcoded credentials
- When auditing plugin or MCP tool permissions, prompt injection, excessive agency, or supply-chain risks
- When investigating a Forge `SECURITY BLOCK`, exit-2 refusal, or Semgrep finding

Claude Code can load this skill when the task matches its description. The `security` agent also preloads it.

## The Knowledge Inside

### Detection and Remediation References

The inline tables are a triage layer, not findings on their own. Start with the detection signal, inspect the relevant code, then open the matching reference for a fix.

| Shipped reference | What it contains |
|-------------------|------------------|
| [OWASP Top 10](../../plugins/nxtg-forge/skills/owasp-security/reference/owasp-top10.md) | Application-security detection and remediation examples, including access control, cryptography, injection, authentication, logging, and SSRF |
| [API Security](../../plugins/nxtg-forge/skills/owasp-security/reference/api-security.md) | Ownership checks, response and update-field allowlists, resource limits, endpoint inventory, and validation of external API data |
| [Agentic AI Security](../../plugins/nxtg-forge/skills/owasp-security/reference/agentic-ai.md) | Tool least privilege, worktree isolation, untrusted tool results, input validation, monitoring, exfiltration, escalation, supply chains, and loop limits |
| [CWE and ASVS](../../plugins/nxtg-forge/skills/owasp-security/reference/cwe-asvs.md) | Weakness IDs and detection patterns for classifying findings, plus design-review requirements for authentication, sessions, access control, validation, cryptography, and APIs |
| [Forge Security Controls](../../plugins/nxtg-forge/skills/owasp-security/reference/forge-controls.md) | Blocked-operation remediation and the coverage boundaries of the guards and advisory scans |

### Forge Security Controls

The skill distinguishes three phases:

- **Prevent:** four PreToolUse guards can refuse tool calls with exit 2. The Command Guard checks dangerous Bash patterns; the Secret Shield protects sensitive file paths, including reads; the Injection Guard checks unsafe execution patterns; the SQL Guard checks interpolated queries.
- **Detect:** the PostToolUse Semgrep scan is advisory. It scans the changed source file when Semgrep is installed. If Semgrep is missing, the hook prints an installation hint once and does nothing; silence is not evidence of a clean scan.
- **Assess:** the `security` agent uses this skill for a deeper review. Pattern checks do not replace checking authorization, trust boundaries, or the context in which code runs.

The remediation guidance is to use a safe alternative, never bypass a guard. Examples include argument-list process APIs instead of shell interpolation, parameterized SQL instead of string concatenation, and `.env.example` instead of a real secrets file.

### Secure Coding and Review Checklist

The quick reference covers server-side schema validation, ownership and role checks, password hashing, cryptographic randomness, TLS verification, secret handling, and API response shaping. Language-specific notes cover JavaScript prototype pollution and HTML escaping, Python deserialization and subprocess use, Rust external-input handling, and Go error handling and templates.

Before reporting, the skill's checklist asks the reviewer to examine authentication and sessions, authorization, input validation, cryptography, APIs, logging, dependencies, and agent/plugin permissions where applicable.

### False Positive Filters

The skill asks whether an attacker could exploit a pattern in production with realistic access. It distinguishes production error leaks from development stack traces, public rate-limit gaps from protected internal endpoints, and runtime validation failures from type-only quality issues. Test fixtures and illustrative documentation also need context rather than automatic vulnerability labels.

## How to Leverage It

Describe the security-sensitive operation you want reviewed, such as "review this endpoint's ownership check" or "explain why Forge blocked this SQL write." The workflow is:

1. Inspect the code against the skill's detection signals.
2. Open the relevant remediation reference for each signal that needs investigation.
3. Apply the review checklist and false-positive filters before reporting a finding.
4. For a blocked operation, identify the guard and correct the unsafe pattern rather than trying another route around it.

### Example: A Blocked SQL Write

The skill's worked example starts with an interpolated order query refused by the SQL Guard. The replacement uses query parameters **and** filters by the authenticated user's ID. Parameterization addresses injection; the ownership predicate addresses the access-control problem that the pattern guard cannot see.

## Power Applications

For an MCP review, use the agentic reference to inspect tool permissions, parameter schemas, timeouts, and structured errors. For an API review, combine injection checks with object ownership, field allowlists, and external-response validation. These are review prompts and remediation patterns, not proof that every weakness has been detected.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| [Runtime Validation](runtime-validation.md) | Validation and error handling at system boundaries |
| [Testing](testing.md) | Testing approaches to check corrected behavior |

## Tips

- A passing guard is not proof that code is safe. The controls reference documents exemptions, changed-slice inspection, literal branch-name matching, and optional Semgrep coverage.
- Verify hook-wiring claims against the installed plugin's `hooks/hooks.json`. The reference explicitly flags `MultiEdit` coverage as a suspected gap to verify, not a bypass to use.
- Review test helpers that ship to production even when a guard excludes their paths.
- Use the full `security` agent workflow when you need an audit, rather than treating this reference page as a completed security assessment.

---

*See also: [Security agent](../agents/security.md) | [Runtime Validation](runtime-validation.md) | [Testing](testing.md)*
