# Verify Governance

> Teaches agents to investigate governance concerns with evidence gathering, structured analysis, and clear verdicts -- turning hook warnings into actionable decisions.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Knowledge & Learning |

---

## What It Provides

Verify Governance encodes the investigation protocol for resolving governance concerns flagged by NXTG-Forge's hook system. When a PostToolUse hook detects a test assertion inconsistency, a scope violation, or a suspicious code change, it blocks continuation and raises a concern. This skill teaches agents how to gather evidence, analyze the concern, and produce a structured verdict with a clear recommendation.

Without this skill, agents either blindly accept hook warnings (reverting valid changes) or blindly dismiss them (ignoring real problems). With it, agents follow a four-step forensic protocol: identify the concern, gather evidence from implementation files, produce a verdict with cited line numbers, and optionally log the result to the governance sentinel.

The skill is invocable directly via `/verify-governance` and can analyze specific files, the most recent concern, or all pending concerns in batch.

## When It Activates

- When a PostToolUse hook blocks with a governance concern
- When you see "test assertion inconsistency detected" or "scope violation" messages
- When verifying that a test change aligns with the actual implementation behavior
- When checking whether a code change is within the current project scope

## The Knowledge Inside

### The Four-Step Protocol

Every governance investigation follows the same structure. **Step 1 -- Identify**: extract the concern details from the hook message (file, line, expected vs. actual behavior, hook recommendation). **Step 2 -- Gather Evidence**: read the implementation files to find the actual behavior, checking return types, function signatures, and recent git history. **Step 3 -- Produce Verdict**: output a structured report with evidence table, verdict (JUSTIFIED or REVERT RECOMMENDED), reasoning citing specific line numbers, and recommended action. **Step 4 -- Log**: optionally post the verification result to the governance sentinel API.

### Evidence Gathering Patterns

The skill teaches two evidence gathering approaches. For test-implementation mismatches: search the implementation for the function in question, check its return type and actual return statements, and compare against the test expectation. For scope concerns: read `governance.json` to find the current directive and active workstreams, then determine whether the change falls within scope.

### Verdict Structure

Every verdict includes: the concern summary, source (which hook or check), an evidence table with file paths, line numbers, and findings, a clear JUSTIFIED or REVERT RECOMMENDED verdict, explicit reasoning that cites the evidence, and a specific action recommendation. The skill provides templates for both outcomes, ensuring agents never produce vague or unsupported conclusions.

### Integration Points

This skill coordinates with three other components: the oracle agent (shares governance analysis patterns), the guardian agent (coordinates on quality concerns), and PostToolUse hooks (responds to their block signals). Understanding these integration points helps agents know when verify-governance is the right tool vs. when to defer to another component.

## How to Leverage It

Invoke `/verify-governance` after any hook block, or ask the agent to verify a specific governance concern. Provide the file path for targeted analysis.

### Example: Test Assertion Mismatch
```
User: "/verify-governance tests/unit/test-task-queue.ts"
What happens: The agent reads the test file, finds the assertion under
question (toBeUndefined vs toBeNull), checks the TaskQueue implementation
to see that getTask returns `AgentTask | null` and explicitly returns null,
then produces a JUSTIFIED verdict with line number citations.
```

## Power Applications

- Use in CI pipelines to automatically resolve governance hook blocks without human intervention
- Chain with crucible-audit to verify that test changes do not introduce hollow assertions
- Build a governance verification log over time to identify recurring concern patterns

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **crucible-audit** | Crucible audits test quality; verify-governance investigates specific concerns |
| **agent-qa-sentinel** | QA Sentinel writes tests; verify-governance validates test changes |
| **domain-knowledge** | Provides project scope context for scope violation analysis |

## Tips

- Always cite specific line numbers in evidence -- vague references undermine the verdict's credibility
- Check git history when behavior might have changed recently; the current code may not reflect what the test was originally written against
- When uncertain, recommend manual review rather than auto-proceeding -- false confidence is worse than asking

---

*See also: [crucible-audit](crucible-audit.md), [domain-knowledge](domain-knowledge.md)*
