# Governance Verifier

> The rapid-response judge that settles governance disputes in under 10 seconds -- gathering evidence, analyzing code, and delivering verdicts when hooks flag concerns.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Governance & Analysis |
| **Model** | Haiku |

---

## What It Does

The Governance Verifier is the automated judge in NXTG-Forge's governance system. When a lifecycle hook flags a concern -- a test change without corresponding implementation, a file edit outside the current workstream's scope, a potential breaking change -- this agent gathers evidence, analyzes the situation, and delivers a structured verdict: JUSTIFIED or REVERT RECOMMENDED.

Without this agent, governance hooks would either block development with false positives (frustrating the developer) or be ignored entirely (defeating the purpose of governance). The Governance Verifier sits between the hook and the developer, providing evidence-based adjudication that keeps development flowing while maintaining guardrails.

It is intentionally fast (target: under 10 seconds) and intentionally limited in scope. It does not make changes automatically, does not override user decisions, and does not block indefinitely. It provides evidence and a recommendation, then gets out of the way. The developer makes the final call.

## When to Use It

- **Hook-triggered concerns**: When a PostToolUse hook blocks with a governance concern about test-implementation mismatch, scope creep, or security implications.
- **Test-implementation mismatch verification**: When test expectations change and you need to verify that the test change aligns with actual implementation behavior.
- **Scope validation**: When edits touch files outside the current directive's boundaries and you need a quick ruling on whether the scope expansion is justified.
- **Manual governance check**: When you want to verify recent changes against governance rules without waiting for a hook to trigger.

Do not use this agent for comprehensive governance audits -- the Oracle handles ongoing strategic alignment. Do not use it for test quality auditing -- that is the CRUCIBLE Detective's domain.

## How It Works

1. **Parse the Concern**: Extracts the file(s) involved, the concern type (test-mismatch, scope-creep, security, breaking-change), and the specific claim the hook is making.
2. **Gather Evidence**: Reads the relevant implementation code, test file, type definitions, and git history. For scope concerns, reads `.claude/governance.json` for directive boundaries.
3. **Analyze and Verdict**: Compares the evidence against the concern. Produces a structured verdict with the evidence chain.
4. **Report**: Logs the verification result to the sentinel log for audit trail and presents the verdict to the developer.

## Examples

### Example 1: Test-Implementation Mismatch Verified

```
User: "Verify this governance concern about test changes"

Governance Verifier:
  - Concern: Test expects null, but previous test expected undefined
  - Evidence: Implementation at src/services/UserService.ts:100
    returns `queuedTask?.task || null`
  - Return type: AgentTask | null
  - Git history: No recent changes to return type
  - Verdict: JUSTIFIED
  - Reasoning: Implementation explicitly returns null. Test change
    aligns with implementation. Proceed.
```

### Example 2: Scope Creep Flagged and Confirmed

```
Hook: "Database file modified during UI refactoring task"

Governance Verifier:
  - Directive: "Refactor UI components for accessibility"
  - Changed file: src/database/schema.sql
  - Workstream boundary: src/components/**, src/pages/**
  - Evidence: schema.sql adds a column for aria-label storage
  - Verdict: JUSTIFIED (borderline)
  - Reasoning: Schema change supports the accessibility refactor
    but expands scope. Recommend creating a separate migration
    workstream to keep boundaries clean.
```

### Example 3: Unjustified Change Caught

```
Hook: "Security-sensitive file modified without security review"

Governance Verifier:
  - Changed file: src/auth/token-validator.ts
  - Change: Token expiry check modified from < to <=
  - Current directive: "Add dark mode to dashboard"
  - Verdict: REVERT RECOMMENDED
  - Reasoning: Auth token validation change has no connection to
    dark mode work. This change affects security-critical code and
    should be a separate, reviewed workstream.
```

## Power Use Cases

**Continuous Governance in Autonomous Mode**: When running agents autonomously (YOLO mode), the Governance Verifier acts as the safety net. Hooks fire automatically, the verifier adjudicates instantly, and development proceeds without human intervention -- but with governance oversight that catches scope creep and unintended changes.

**Audit Trail for Compliance**: Every verdict is logged to the sentinel log with full evidence. This creates an immutable audit trail showing that governance concerns were evaluated with evidence, not rubber-stamped or ignored. Useful for teams that need to demonstrate process compliance.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Oracle** | Oracle provides strategic alignment; Governance Verifier provides tactical, per-change verification |
| **PostToolUse hooks** | Hooks flag concerns; Verifier adjudicates them with evidence |
| **Guardian agent** | Guardian enforces quality gates; Verifier handles governance disputes |
| **/forge:compliance** | Full compliance check that aggregates Governance Verifier history |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Hook-triggered verification, scope validation, test-mismatch analysis, structured verdicts |
| **L2 Pro Builder** | + `forge_check_drift` for directive-aware scope validation; `forge_get_state` for workstream boundary checks |
| **L3 Ship Lord** | + Dashboard panel showing governance verification history, verdict distribution, and concern trends |

## Tips & Gotchas

- **Do**: Let the verifier run on hook triggers -- it is designed to be fast and non-blocking.
- **Do**: Review REVERT RECOMMENDED verdicts carefully -- they indicate a change that may be out of scope or risky.
- **Don't**: Treat JUSTIFIED verdicts as rubber stamps -- they mean the evidence supports the change, not that the change is optimal.
- **Don't**: Expect the verifier to catch architectural issues -- it handles tactical, per-change governance. The Oracle handles strategic alignment.

---

*See also: [oracle](oracle.md), [crucible-detective](crucible-detective.md)*
