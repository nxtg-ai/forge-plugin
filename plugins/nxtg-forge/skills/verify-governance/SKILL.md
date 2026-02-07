---
name: verify-governance
description: Verify governance concerns with evidence gathering and automated analysis
user_invocable: true
triggers:
  - /verify-governance
  - /verify-gov
  - governance concern
  - test mismatch
---

# Verify Governance Skill

Analyzes governance concerns flagged by hooks and provides evidence-based verdicts.

## When to Use

- After a PostToolUse hook blocks with a concern
- When you see "governance concern" or "test assertion inconsistency" messages
- To verify that a test change aligns with implementation
- To check if a code change is within project scope

## Automatic Behavior

When invoked, this skill:

1. **Detects Recent Concerns**: Checks for governance blocks in the current session
2. **Gathers Evidence**: Reads relevant implementation files
3. **Analyzes**: Compares test expectations with actual behavior
4. **Reports**: Provides structured verdict with evidence

## Usage

```
/verify-governance                  # Analyze most recent concern
/verify-governance <file>           # Analyze specific file's governance
/verify-governance --all            # Analyze all pending concerns
```

## Instructions for Claude

When this skill is invoked:

### Step 1: Identify the Concern

Look for recent governance messages in the conversation, such as:
- "PostToolUse:Edit hook stopped continuation"
- "Test assertion inconsistency detected"
- "Governance concern"
- "Scope violation"

Extract the key details:
- What file/line is involved
- What the expected vs actual behavior is
- What the hook is recommending

### Step 2: Gather Evidence

For test-implementation mismatches:
```bash
# Read the implementation to find actual behavior
grep -n "functionName" src/path/to/implementation.ts

# Check the return type
grep -A5 "functionName.*:" src/path/to/implementation.ts
```

For scope concerns:
```bash
# Check current directive
cat .claude/governance.json | jq '.constitution.directive'

# Check what workstreams exist
cat .claude/governance.json | jq '.workstreams[].id'
```

### Step 3: Produce Verdict

Output a clear verification report:

```markdown
## Governance Verification Report

**Concern**: [Summary of what was flagged]
**Source**: [Hook or manual check]

### Evidence

| File | Line | Finding |
|------|------|---------|
| src/path/file.ts | 42 | Returns `null` not `undefined` |

### Verdict: ✅ JUSTIFIED

**Reasoning**: The implementation at line 42 explicitly returns `null`.
The test change correctly aligns with this behavior.

**Action**: Proceed with the change.
```

Or if reverting is needed:

```markdown
### Verdict: ❌ REVERT RECOMMENDED

**Reasoning**: The test originally expected `undefined` which matches
the TypeScript convention. The implementation should be fixed.

**Action**: Revert the test change and update implementation to return `undefined`.
```

### Step 4: Log to Sentinel (Optional)

If the project has governance logging enabled:
```bash
# Add verification result to sentinel log
curl -X POST http://localhost:5051/api/governance/sentinel \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INFO",
    "severity": "low",
    "source": "governance-verifier",
    "message": "Verification complete: Change justified",
    "context": {"verdict": "JUSTIFIED", "file": "..."}
  }'
```

## Example Output

```
## Governance Verification Report

**Concern**: Test expects `toBeUndefined()` but change to `toBeNull()`
**Source**: PostToolUse:Edit hook

### Evidence

| File | Line | Finding |
|------|------|---------|
| TaskQueue.ts | 98-100 | `getTask(taskId: string): AgentTask \| null` |
| TaskQueue.ts | 100 | `return queuedTask?.task \|\| null;` |

### Verdict: ✅ JUSTIFIED

**Reasoning**: The `getTask` method has return type `AgentTask | null`
and explicitly returns `null` when task not found (line 100).
The test change correctly reflects the implementation behavior.

**Action**: Proceed with test update. No implementation changes needed.
```

## Integration

This skill works with:
- **forge-oracle**: Shares governance analysis patterns
- **forge-guardian**: Coordinates on quality concerns
- **PostToolUse hooks**: Responds to hook blocks

## Tips

- Always cite specific line numbers in evidence
- Check git history if behavior might have changed recently
- For scope concerns, always reference the governance.json directive
- If uncertain, recommend manual review rather than auto-proceeding
